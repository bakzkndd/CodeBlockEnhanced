import React from "react";

import { getReactInstance } from "@vizality/util/react";
import { patch, unpatch } from "@vizality/patcher";
import HighlightedCodeBlock from "./components/HighlightedCodeBlock";
import { getModule } from "@vizality/webpack";
import { Plugin } from "@vizality/entities";

const { shiki } = require("./shiki.min.js");
const fs = require("fs");
const path = require("path");

const highlighter = require("./components/Highlighter");
const { getHighlighter, loadHighlighter } = highlighter.highlighter;

const CDN_PATH = "https://unpkg.com/shiki@0.9.4/";

const themes = [];

const ThemeList = shiki.BUNDLED_THEMES;

const themeDir = fs.readdirSync(`${__dirname}/themes`);

for (let index = 0; index < themeDir.length; index++) {
  if (path.parse(themeDir[index]).ext == ".json")
    ThemeList.push(path.parse(themeDir[index]).name);
}

ThemeList.sort(function (a, b) {
  if (a.toLowerCase() < b.toLowerCase()) {
    return -1;
  }
  if (a.toLowerCase() > b.toLowerCase()) {
    return 1;
  }
  return 0;
});

for (let index = 0; index < ThemeList.length; index++) {
  themes.push({ value: index, label: ThemeList[index] });
}

export default class SuperCodeBlocks extends Plugin {
  async start() {
    if (themeDir.includes(`${ThemeList[this.settings.get("theme", 0)]}.json`)) {
      let themeJSON = JSON.parse(
        fs.readFileSync(
          `${__dirname}/themes/${
            ThemeList[this.settings.get("theme", 0)]
          }.json`,
          "utf8"
        )
      );

      let localTheme = themeJSON.source;

      let customTheme;

      try {
        const tempCDN = localTheme.split("/").slice(0, -2).join("/") + "/";
        shiki.setCDN(tempCDN);
        const tempThemeFile = localTheme.split("/").slice(-2).join("/");
        customTheme = await shiki.loadTheme(tempThemeFile);

        shiki.setCDN(CDN_PATH);

        await loadHighlighter(customTheme);
      } catch (error) {
        shiki.setCDN(CDN_PATH);
      }
    } else
      await loadHighlighter(
        shiki.BUNDLED_THEMES[this.settings.get("theme", 0)]
      );
    this.patchCodeBlocks();
    this.injectStyles("./style.scss");
  }

  stop() {
    unpatch("better-code-blocks-inline");
    unpatch("better-code-blocks-embed");
    this._forceUpdate();
  }

  patchCodeBlocks() {
    const parser = getModule("parse", "parseTopic");
    patch(
      "better-code-blocks-inline",
      parser.defaultRules.codeBlock,
      "react",
      (args, res) => {
        this.injectCodeBlock(args, res);
        return res;
      }
    );
    this._forceUpdate();
  }

  injectCodeBlock(args, codeblock) {
    const { render } = codeblock?.props;
    codeblock.props.render = (codeblock) => {
      let lang, content, contentIsRaw, res;
      if (!args) {
        res = render(codeblock);
        lang = res?.props?.children?.props?.className
          ?.split(" ")
          ?.find(
            (className) => !className.includes("-") && className !== "hljs"
          );
        if (res?.props?.children?.props?.children) {
          content = res.props.children.props.children;
        } else {
          content =
            res?.props?.children?.props?.dangerouslySetInnerHTML?.__html;
          contentIsRaw = true;
        }
      } else {
        [{ lang, content }] = args;
      }

      res = (
        <HighlightedCodeBlock
          language={lang}
          content={content}
          contentIsRaw={contentIsRaw}
          hasWrapper={false}
          theme={shiki.BUNDLED_THEMES[this.settings.get("theme", 0)]}
          highlighter={getHighlighter()}
          showCopyButton={this.settings.get("copyButton", true)}
          showCopyButtonQuickCode={this.settings.get(
            "copyToQuickCodeButton",
            true
          )}
          showHeader={this.settings.get("showHeader", true)}
          showLineNumbers={this.settings.get("showLineNumbers", true)}
        />
      );

      return res;
    };
  }

  _forceUpdate() {
    /*
     * @todo Make this better.
     * @note Some messages don't have onMouseMove, so check for that first.
     */
    document
      .querySelectorAll(`[id^='chat-messages-']`)
      .forEach(
        (e) =>
          Boolean(getReactInstance(e)?.memoizedProps?.onMouseMove) &&
          getReactInstance(e).memoizedProps.onMouseMove()
      );
  }
}
