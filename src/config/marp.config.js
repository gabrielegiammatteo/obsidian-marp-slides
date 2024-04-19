let settings = require("../data.json");

module.exports = ({ marp }) => {
  marp.use(require("./markdown-it/@kazumatu981/markdown-it-kroki/index"))
  .use(require("./markdown-it/markdown-it-mark/dist/markdown-it-mark.min"));
  settings.AllowedMarkdownItContainers.forEach(name => marp.use(require("./markdown-it/markdown-it-container/dist/markdown-it-container.min"), name));
  return marp;
}
