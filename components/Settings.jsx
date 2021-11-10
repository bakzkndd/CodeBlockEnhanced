const { React } = require("@vizality/webpack");
const {
  Category,
  SwitchItem,
  SelectInput,
  TextInput,
} = require("@vizality/components/settings");
import HighlightedCodeBlock from "./HighlightedCodeBlock";
const { shiki } = require("../shiki.min.js");

const fs = require("fs");

const highlighter = require("./Highlighter");
const { getHighlighter, loadHighlighter } = highlighter.highlighter;
const themes = [];

const ThemeList = shiki.BUNDLED_THEMES;

for (let index = 0; index < ThemeList.length; index++) {
  themes.push({ value: index, label: ThemeList[index] });
}

const examples = [];

const ExampleList = fs.readdirSync(`${__dirname}/../examples`);

for (let index = 0; index < ExampleList.length; index++) {
  examples.push({
    value: index,
    label: ExampleList[index].replace(/\.[^/.]+$/, ""),
  });
}

module.exports = class SuperCodeBlocksSettings extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const { getSetting, updateSetting, toggleSetting } = this.props;
    let highlighter = getHighlighter();
    let language = examples[getSetting("example", 0)].label;
    let example = fs.readFileSync(`${__dirname}/../examples/${language}.txt`, {
      encoding: "utf8",
      flag: "r",
    });
    return (
      <>
        <SelectInput
          value={getSetting("theme", 0)}
          options={themes}
          onChange={async (res) => {
            updateSetting("theme", res.value);
            await loadHighlighter(shiki.BUNDLED_THEMES[res.value]);
            highlighter = getHighlighter();
            this.forceUpdate();
          }}
        >
          CodeBlock Theme
        </SelectInput>
        <Category
          name={"Toggles"}
          description={"Here you can change what shows up in the codeblock."}
          opened={getSetting("example-category-item", false)}
          onChange={() => toggleSetting("example-category-item")}
        >
          <SwitchItem
            value={getSetting("copyButton", true)}
            onChange={() => {
              toggleSetting("copyButton");
              this.forceUpdate();
            }}
          >
            Copy Button
          </SwitchItem>
          <SwitchItem
            value={getSetting("copyToQuickCodeButton", true)}
            onChange={() => {
              toggleSetting("copyToQuickCodeButton");
              this.forceUpdate();
            }}
          >
            Copy to Quick Code Button
          </SwitchItem>
          <SwitchItem
            value={getSetting("showHeader", true)}
            onChange={() => {
              toggleSetting("showHeader");
              this.forceUpdate();
            }}
          >
            Show Header (With the language name)
          </SwitchItem>
          <SwitchItem
            value={getSetting("showLineNumbers", true)}
            onChange={() => {
              toggleSetting("showLineNumbers");
              this.forceUpdate();
            }}
          >
            Show line numbers
          </SwitchItem>
        </Category>
        <Category
          name={"Example"}
          description={"Here you can see what the codeblock looks like."}
          opened={getSetting("example-category-item", false)}
          onChange={() => toggleSetting("example-category-item")}
        >
          <SelectInput
            value={getSetting("example", 0)}
            options={examples}
            onChange={async (res) => {
              updateSetting("example", res.value);
              this.forceUpdate();
            }}
          >
            Example Language
          </SelectInput>

          <h5 class="colorStandard-2KCXvj size14-e6ZScH h5-18_1nd title-3sZWYQ defaultMarginh5-2mL-bP">
            Example
          </h5>
          <HighlightedCodeBlock
            language={language.toLowerCase()}
            content={example}
            contentIsRaw={false}
            hasWrapper={false}
            theme={shiki.BUNDLED_THEMES[getSetting("theme", 0)]}
            highlighter={highlighter}
            showCopyButton={getSetting("copyButton", true)}
            showCopyButtonQuickCode={getSetting("copyToQuickCodeButton", true)}
            showHeader={getSetting("showHeader", true)}
            showLineNumbers={getSetting("showLineNumbers", true)}
          />
        </Category>
      </>
    );
  }
};
