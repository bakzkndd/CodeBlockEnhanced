let highlighter;
const { shiki } = require("../shiki.min.js");
import { readFileSync, readdirSync } from "fs";

exports.highlighter = {
  async loadHighlighter(theme) {
    if (!theme) theme = shiki.BUNDLED_THEMES[0];
    const myLanguages = [];
    const languageDir = await readdirSync(`${__dirname}/../languages`);
    for (let i = 0; i < languageDir.length; i++) {
      let language = JSON.parse(
        readFileSync(`${__dirname}/../languages/${languageDir[i]}`)
      );
      myLanguages.push({
        grammar: language,
        id: language.name,
        path: `${__dirname}/../languages/${languageDir[i]}`,
        scopeName: language.scopeName,
      });
    }

    let languages = [...shiki.BUNDLED_LANGUAGES, ...myLanguages];

    highlighter = await shiki.getHighlighter({
      theme,
      langs: languages,
    });
    return highlighter;
  },

  getHighlighter() {
    highlighter;
    return highlighter;
  },
};
