let highlighter;
const { shiki } = require("../shiki.min.js");
import { readFileSync } from "fs";

exports.highlighter = {
  async loadHighlighter(theme) {
    if (!theme) theme = shiki.BUNDLED_THEMES[0];
    const myLanguage = JSON.parse(
      readFileSync(`${__dirname}/../languages/cpp.tmLanguage.json`)
    );

    highlighter = await shiki.getHighlighter({
      theme,
      langs: [
        ...shiki.BUNDLED_LANGUAGES,
        {
          grammar: myLanguage,
          id: myLanguage.name,
          path: `${__dirname}/../languages/cpp.tmLanguage.json`,
          scopeName: myLanguage.scopeName,
        },
      ],
    });
    return highlighter;
  },

  getHighlighter() {
    highlighter;
    return highlighter;
  },
};
