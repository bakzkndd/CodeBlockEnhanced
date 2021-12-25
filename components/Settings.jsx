const { React } = require("@vizality/webpack");
const {
  Category,
  SwitchItem,
  SelectInput,
  TextInput,
} = require("@vizality/components/settings");
const { Button } = require("@vizality/components");
import HighlightedCodeBlock from "./HighlightedCodeBlock";
const { shiki } = require("../shiki.min.js");
const JSON5 = require("../json5.min.js");

const { get } = require("https");
const fs = require("fs");

const highlighter = require("./Highlighter");
const { getHighlighter, loadHighlighter } = highlighter.highlighter;
const CDN_PATH = "https://unpkg.com/shiki@0.9.4/";
let themes = [];

let ThemeList = shiki.BUNDLED_THEMES;

let themeDir = fs.readFileSync(`${__dirname}/../themes/themes.json`, "utf8");
themeDir = JSON.parse(themeDir);

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
  let label = ThemeList[index];

  let words = label.split("-");
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }
  label = words.join(" ");
  themes.push({ value: index, label: label });
}

const examples = [];

const ExampleList = fs.readdirSync(`${__dirname}/../examples`);

for (let index = 0; index < ExampleList.length; index++) {
  examples.push({
    value: index,
    label: ExampleList[index].replace(/\.[^/.]+$/, ""),
  });
}

function doGet(url) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        resolve({ res: res, body: responseBody });
      });
    });
  });
}

module.exports = class SuperCodeBlocksSettings extends React.PureComponent {
  state = {
    error: "Custom Theme URL",
  };

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
        <Category
          name={"Theme"}
          description={"Here you can change what the codeblock looks like."}
          opened={getSetting("example-category-item", false)}
          onChange={() => toggleSetting("example-category-item")}
        >
          <SelectInput
            value={getSetting("theme", 0)}
            options={themes}
            onChange={async (res) => {
              updateSetting("theme", res.value);

              let label = res.label;
              let words = label.split(" ");
              for (let i = 0; i < words.length; i++) {
                words[i] = words[i][0].toLowerCase() + words[i].substr(1);
              }

              label = words.join("-");

              if (themeDir.themes.some((e) => e.name == `${label}`)) {
                let themeJSON = themeDir.themes.find((e) => e.name == label);

                let localTheme = themeJSON.source;

                let customTheme;

                try {
                  const tempCDN =
                    localTheme.split("/").slice(0, -2).join("/") + "/";
                  shiki.setCDN(tempCDN);
                  const tempThemeFile = localTheme
                    .split("/")
                    .slice(-2)
                    .join("/");
                  customTheme = await shiki.loadTheme(tempThemeFile);

                  shiki.setCDN(CDN_PATH);

                  await loadHighlighter(customTheme);
                } catch (error) {
                  shiki.setCDN(CDN_PATH);
                }
              } else await loadHighlighter(shiki.BUNDLED_THEMES[res.value]);
              highlighter = getHighlighter();
              this.forceUpdate();
              updateSetting("custom-theme-loaded", false);
            }}
          >
            CodeBlock Theme
          </SelectInput>
          <div>
            <TextInput
              note="Here you can enter your own theme URL"
              defaultValue={getSetting("custom-theme-url", "")}
              required={false}
              onChange={(val) => updateSetting("custom-theme-url", val)}
              placeholder={"https://website.com/theme.json"}
            >
              {this.state.error}
            </TextInput>
            <Button
              color={Button.Colors.BRAND}
              look={Button.Looks.FILLED}
              size={Button.Sizes.MEDIUM}
              onClick={async () => {
                let customTheme = getSetting("custom-theme-url", "");
                if (!customTheme)
                  return this.setState({ error: "Missing URL" });
                if (!customTheme.startsWith("https://"))
                  return this.setState({
                    error:
                      "Website must be secured. Make sure the URL starts with https://",
                  });
                if (!customTheme.endsWith(".json"))
                  return this.setState({
                    error: "URL must go directly to a raw .json file",
                  });
                this.setState({ error: "Adding Theme..." });

                let theme = await doGet(customTheme);
                
                if (theme.res.statusCode != "200")
                  return this.setState({ error: "Invalid URL" });

                let json = JSON5.parse(theme.body);
                if (!json.name)
                  return this.setState({ error: "JSON has no theme name" });
                if (!json.colors)
                  return this.setState({ error: "Not a valid theme" });

                let localTheme = customTheme;

                let customThemeLoad;

                try {
                  const tempCDN =
                    localTheme.split("/").slice(0, -2).join("/") + "/";
                  shiki.setCDN(tempCDN);
                  const tempThemeFile = localTheme
                    .split("/")
                    .slice(-2)
                    .join("/");
                  customThemeLoad = await shiki.loadTheme(tempThemeFile);

                  shiki.setCDN(CDN_PATH);

                  await loadHighlighter(customThemeLoad);
                } catch (error) {
                  shiki.setCDN(CDN_PATH);
                  return this.setState({
                    error: "there was an error loading the theme",
                  });
                }
                highlighter = getHighlighter();
                return updateSetting("custom-theme-loaded", true);
              }}
            >
              Load Theme
            </Button>
          </div>
        </Category>
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
          <SwitchItem
            value={getSetting("showLanguageIcons", true)}
            onChange={() => {
              toggleSetting("showLanguageIcons");
              this.forceUpdate();
            }}
          >
            Show language icons
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
