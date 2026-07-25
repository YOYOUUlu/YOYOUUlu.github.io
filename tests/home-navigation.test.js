const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const pages = ["Hamilton", "rouge-et-noir"];

pages.forEach((page) => {
  test(`${page} links back to the musical library`, () => {
    const html = fs.readFileSync(`${page}/index.html`, "utf8");

    assert.match(
      html,
      /<a class="home-button" href="\.\.\/index\.html" aria-label="返回音乐剧展示架" title="返回音乐剧展示架">/,
    );
    assert.equal(
      new URL("../index.html", `https://example.com/vibe-coding/${page}/index.html`).pathname,
      "/vibe-coding/index.html",
    );
    assert.equal(
      new URL("../index.html", `file:///tmp/vibe-coding/${page}/index.html`).pathname,
      "/tmp/vibe-coding/index.html",
    );
  });
});
