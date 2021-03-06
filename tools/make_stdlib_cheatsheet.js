const fs = require("fs-extra");
const path = require("path");

const DocRegex = /注曰「「(.+?)。同Javascript之(.+?)也。」」/g;
const GithubRoot = "https://github.com/wenyan-lang/wenyan/tree/master";

const Info = {
  易經: {
    name: "Random"
  },
  曆法: {
    name: "Calendar",
    description: "> 💬 This library uses your system timezone setting"
  },
  算經: {
    name: "Math"
  },
  籌經: {
    name: "Collection Operations"
  },
  位經: {
    name: "Bit Manipulation"
  },
  畫譜: {
    name: "Canvas"
  }
};

const HEAD = `<!-- GENERATED FILE, DO NOT MODIFY-->

# Standard Library Cheatsheet
`;

const BODY = `
## Usage

\`\`\`wenyan
吾嘗觀「「算經」」之書。方悟「正弦」「餘弦」「圓周率」之義。
\`\`\`
`;

const TAIL = `

## Help update this cheatsheet

This cheatsheet is generated direct from stdlibs. There are still a lot of functions are not listed above. If you would like to hep update this cheatsheet, here is the steps.

Add comments in the stdlib files (one line above the function/value), the format should look like this:

\`\`\`wenyan
注曰「「餘弦。同Javascript之Math.cos也。」」
\`\`\`

After you fill the comments, commit and open a pull request. Thank you!
`;

function escapeMarkdown(text) {
  return text.replace(/\|/g, "\\|").replace(/`/g, "\\`");
}

function getLineIndexes(text) {
  let previous = 0;
  var lines = [];
  text.split("\n").forEach(line => {
    lines.push(previous);
    previous += line.length + 1;
  });
  return lines;
}

function getLineNumberOfIndex(lines, index) {
  const length = lines.length;
  for (let i = 0; i < length; i++) {
    if (lines[i] >= index) return i;
  }
  return length;
}

function readFile(filepath, relativePath) {
  const text = fs.readFileSync(filepath, "utf-8");
  const lines = getLineIndexes(text);
  const results = [];
  const { name } = path.parse(filepath);
  let match;

  while ((match = DocRegex.exec(text))) {
    const [, wenyan, js] = match;
    results.push({
      wenyan,
      js,
      index: match.index,
      line: getLineNumberOfIndex(lines, match.index)
    });
  }

  const GithubPath = `${GithubRoot}/lib/${relativePath}`;

  let markdown = "";

  let displayName = name;

  if (Info[name] && Info[name].name) {
    displayName += ` - ${Info[name].name}`;
  }

  markdown += `## [${displayName}](${GithubPath})\n\n`;

  if (Info[name] && Info[name].description) {
    markdown += `${Info[name].description}\n\n`;
  }

  markdown += `| Wenyan | Javascript Equivalent |\n|---|---|\n`;

  for (const { wenyan, js, line } of results) {
    markdown += `| [\`${escapeMarkdown(wenyan)}\`](${GithubPath}#L${line +
      1}) | \`${escapeMarkdown(js)}\` |\n`;
  }

  return markdown + "\n";
}

function update(srcDir, outputFile) {
  let markdown = HEAD + "\n";
  markdown += `Last updated: ${new Date().toGMTString()}\n\n`;

  markdown += BODY + "\n";

  const files = [
    ...fs.readdirSync(srcDir),
    ...fs.readdirSync(path.join(srcDir, "js")).map(i => "js/" + i)
  ];

  for (const file of files) {
    if (file.endsWith(".wy")) {
      markdown += readFile(path.join(srcDir, file), file);
    }
  }

  markdown += "\n" + TAIL;

  fs.writeFileSync(outputFile, markdown, "utf-8");

  console.log("Standard Library Cheatsheet updated.");
}

module.exports = {
  update
};

if (require.main === module) {
  update(
    path.resolve(__dirname, "../lib"),
    path.resolve(__dirname, "../documentation/Standard-Lib.md")
  );
}
