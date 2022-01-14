import React, { memo, useState, useRef, useEffect } from "react";
import { clipboard } from "electron";

import { joinClassNames } from "@vizality/util/dom";
import { getModule } from "@vizality/webpack";
import { Messages } from "@vizality/i18n";

import { Button } from "@vizality/components";
import fs from "fs";

const icons = fs.readdirSync(`${__dirname}/../icons`);

/*
 * @todo Convert showHeader, showLineNumbers, showCopyButton, and theme into settings options and then
 * set the default values here to be the settings values.
 */

/**
 * Component for displaying code blocks, with or without syntax highlighting.
 * @component
 * @example
 * ```jsx
 * <CodeBlock language='CSS' theme='Dracula' showLineNumbers={false} content={
 *  `React.createElement(Icon, {\n` +
 *  `  name: '${iconName}'\n` +
 *  `});`}
 * />
 * ```
 */
// eslint-disable-next-line prefer-arrow-callback
export default memo((props) => {
  let {
    language,
    header,
    content,
    languageIcon,
    showHeader = true,
    showLineNumbers = true,
    showCopyButton = true,
    showCopyButtonQuickCode = true,
    showLanguageIcon = true,
    contentIsRaw = false,
    hasWrapper = true,
    className,
    highlighter,
  } = props;

  const [copyText, setCopyText] = useState(Messages.COPY);
  const [copyTextQuickCode, setCopyTextQuickCode] =
    useState("Copy to quick code");
  const { markup } = getModule("markup");
  const { marginBottom20 } = getModule("marginBottom20");
  const { scrollbarGhostHairline } = getModule("scrollbarGhostHairline");
  const { highlight } = getModule("highlight", "hasLanguage");
  const { getLanguage } = getModule("initHighlighting", "highlight");

  language = language.toLowerCase();
  // Set language to its full name, or `null` if a name is not found
  if (!getLanguage(language)) language = undefined;

  const innerHTML = language
    ? highlighter?.codeToHtml(content, language)
    : content;
  const theme = highlighter?.getTheme();
  const plainColor = theme?.fg || "var(--text-normal)";
  const accentBgColor = theme?.colors?.["statusBar.background"] || "#007BC8";
  const accentFgColor = theme?.colors?.["button.background"] || "#FFF";
  const backgroundColor =
    theme?.colors?.["editor.background"] || "var(--background-secondary)";

  // Set header to `language` if showHeader is true and no header is provided and the language is recognized
  header =
    header || (getLanguage(language) ? getLanguage(language).name : undefined);

  if (header) {
    if (icons.includes(header.split(",")[0].toLowerCase())) {
      languageIcon = fs.readFileSync(
        `${__dirname}/../icons/${header.split(",")[0].toLowerCase()}/${header
          .split(",")[0]
          .toLowerCase()}-original.svg`,
        "utf8"
      );
    } else {
      console.log("didn't find " + header);
      languageIcon = fs.readFileSync(
        `${__dirname}/../icons/vscode/vscode-original.svg`,
        "utf8"
      );
    }
  }

  const svg = useRef(null);
  useEffect(() => {
    if (svg.current) {
      svg.current.innerHTML = languageIcon;
    }
  }, []);

  /*
   * This is a bandaid "fix" for the copy button--- we just get rid of it...
   * When using raw HTML as the content, the copy button also copies that raw HTML
   * i.e.:
   * (<span class="hljs-selector-tag">await</span> <span class="hljs-selector-tag">getModule</span>(<span class="hljs-selector-attr">[ <span class="hljs-string">&  #x27;updateLocalSettings&#x27;</span> ]</span>))<span class="hljs-selector-class">.updateLocalSettings</span>({<span class="hljs-attribute">customStatus</span>:
   *   {
   *     text: <span class="hljs-string">&#x27;im a gorilla&#x27;</span>
   *   }
   * });
   */
  if (contentIsRaw) showCopyButton = false;

  const handleCodeCopy = () => {
    // Prevent clicking when it's still showing copied
    if (copyText === Messages.COPIED) return;

    setCopyText(Messages.COPIED);

    setTimeout(() => {
      setCopyText(Messages.COPY);
    }, 1000);

    clipboard.writeText(content);
  };

  if (contentIsRaw) showCopyButtonQuickCode = false;
  if (language != "css") showCopyButtonQuickCode = false;

  const handleCodeCopyQuickCode = () => {
    // Prevent clicking when it's still showing copied
    if (setCopyTextQuickCode === Messages.COPIED) return;

    setCopyTextQuickCode(Messages.COPIED);

    setTimeout(() => {
      setCopyTextQuickCode("Copy to quick code");
    }, 1000);

    fs.readFile(
      `${__dirname}/../../../../src/core/builtins/quick-code/stores/css/custom.scss`,
      "utf8",
      function (err, data) {
        if (err) return;
        data += `
        ${content}`;
        fs.writeFileSync(
          `${__dirname}/../../../../src/core/builtins/quick-code/stores/css/custom.scss`,
          data
        );
      }
    );
  };

  /*
   * This needs to be a function like this and using React.createElement instead of JSX
   * Don't ask me why though.
   */
  /** @private **/
  function renderCode(language, content) {
    return (
      <>
        {language && !contentIsRaw && highlight(language, content, true) ? (
          <div
            className="vz-code-block-inner"
            dangerouslySetInnerHTML={{ __html: innerHTML }}
          />
        ) : (
          <div className="vz-code-block-inner">{content}</div>
        )}
      </>
    );
  }

  const renderCodeBlock = () => {
    return (
      <>
        <pre className="vz-code-block-pre">
          <code
            className={joinClassNames(
              "hljs",
              scrollbarGhostHairline,
              "vz-code-block-code",
              {
                [language]: language,
                "vz-has-header": showHeader && header,
                "vz-has-line-numbers": showLineNumbers,
                "vz-has-copy-button": showCopyButton,
                [`vz-code-block--theme-${theme}`]: theme,
              }
            )}
            style={{
              "--HighlightedCodeBlock-Background": backgroundColor,
              "--background-accent": accentBgColor,
              "--foreground-accent": accentFgColor,
            }}
          >
            {renderCode(language, content)}
            {header && showHeader && (
              <div
                className="vz-code-block-header"
                style={{ background: accentBgColor, color: plainColor }}
              >
                {showLanguageIcon && (
                  <div className="vz-code-block-icon" ref={svg}></div>
                )}
                {header}
              </div>
            )}
            {showLineNumbers && (
              <div
                className="vz-code-block-line-numbers"
                style={{ background: backgroundColor }}
              />
            )}
            {showCopyButton && (
              <Button
                className={joinClassNames("vz-code-block-copy-button", {
                  "vz-is-copied": copyText === Messages.COPIED,
                })}
                color={copyText === Messages.COPY ? null : Button.Colors.GREEN}
                look={Button.Looks.FILLED}
                size={Button.Sizes.SMALL}
                onClick={handleCodeCopy}
                style={{
                  color: plainColor,
                  background: accentFgColor,
                  bottom: showCopyButtonQuickCode ? "40px" : "5px",
                }}
              >
                {copyText}
              </Button>
            )}
            {showCopyButtonQuickCode && (
              <Button
                className={joinClassNames(
                  "vz-code-block-copy-button-quickcode",
                  {
                    "vz-is-copied": copyTextQuickCode === Messages.COPIED,
                  }
                )}
                color={
                  copyTextQuickCode === "Copy to quick code"
                    ? null
                    : Button.Colors.GREEN
                }
                look={Button.Looks.FILLED}
                size={Button.Sizes.SMALL}
                onClick={handleCodeCopyQuickCode}
                style={{ color: plainColor, background: accentFgColor }}
              >
                {copyTextQuickCode}
              </Button>
            )}
          </code>
        </pre>
      </>
    );
  };

  return (
    <>
      {hasWrapper ? (
        <div
          className={joinClassNames(
            "vz-code-block-wrapper",
            className,
            markup,
            marginBottom20
          )}
        >
          {renderCodeBlock()}
        </div>
      ) : (
        renderCodeBlock()
      )}
    </>
  );
});
