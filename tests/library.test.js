const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const libraryScript = fs.readFileSync(path.join(root, "library.js"), "utf8");
const { libraryLanguages, libraryShows } = require("../shows.js");

test("library uses the requested title and introduction", () => {
  assert.match(indexHtml, /<title>阿浮的音乐剧歌词集<\/title>/);
  assert.match(indexHtml, /<h1>阿浮的音乐剧歌词集<\/h1>/);
  assert.match(
    indexHtml,
    /感谢剧场让我们的轨迹短暂交叠，行走在志同道合的路上，愿我们一直望着<span class="no-break">同一个月亮。<\/span>/,
  );
});

test("library groups all twenty shows by language", () => {
  assert.deepEqual(libraryLanguages, [
    { id: "yue", label: "粤语音乐剧" },
    { id: "en", label: "英语音乐剧" },
    { id: "de", label: "德语音乐剧" },
    { id: "fr", label: "法语音乐剧" },
  ]);
  assert.equal(libraryShows.length, 20);
  assert.match(indexHtml, /id="languageGroups"/);
  assert.match(
    indexHtml,
    /<script src="shows\.js" onerror="handleCriticalAssetError\(\)"><\/script>\s*<script src="library\.js" onerror="handleCriticalAssetError\(\)"><\/script>/,
  );
});

test("show names and Cantonese feature labels stay accurate", () => {
  assert.equal(libraryShows.some((show) => show.title === "摇滚莫里哀"), false);
  assert.equal(libraryShows.find((show) => show.id === "moliere-le-spectacle-musical").title, "莫里哀");
  assert.deepEqual(libraryShows.find((show) => show.id === "dazhuangwang").meta, [
    "粤语",
    "粤拼",
    "注释",
  ]);
});

test("library cards keep one fixed shelf size and wrap as space narrows", () => {
  assert.match(indexHtml, /grid-template-columns: repeat\(auto-fill, 180px\)/);
  assert.match(indexHtml, /width: 180px;\s+height: 300px;/);
  assert.doesNotMatch(indexHtml, /repeat\(auto-fit/);
});

test("show cards omit generated description paragraphs", () => {
  assert.ok(libraryShows.every((show) => !("description" in show)));
  assert.doesNotMatch(libraryScript, /createElement\("p"\)/);
});

test("every shelf card uses a local title-bearing show logo", () => {
  for (const show of libraryShows) {
    assert.ok(show.image, `Missing show logo config: ${show.id}`);
    assert.ok(fs.existsSync(path.join(root, show.image)), `Missing show logo file: ${show.image}`);
  }
  assert.match(libraryScript, /if \(show\.image\)/);
});

test("every show card links directly to its page instead of a folder", () => {
  const links = libraryShows.map((show) => show.href);

  assert.equal(links.length, 20);
  assert.ok(links.every((href) => href.endsWith("/index.html")));
  for (const href of links) {
    assert.ok(fs.existsSync(path.join(root, href)), `Missing show page: ${href}`);
  }
});

test("online library renders only explicitly deployed shows without network probes", () => {
  assert.deepEqual(
    libraryShows.filter((show) => show.deployed).map((show) => show.id),
    ["dazhuangwang", "hamilton", "rouge-et-noir"],
  );
  assert.match(libraryScript, /window\.location\.protocol === "file:"/);
  assert.match(libraryScript, /window\.libraryShows\.filter\(\(show\) => show\.deployed\)/);
  assert.doesNotMatch(libraryScript, /\bfetch\s*\(/);
  assert.doesNotMatch(libraryScript, /method: "HEAD"/);
});

test("homepage logos decode asynchronously and show links prefetch on intent", () => {
  assert.match(libraryScript, /image\.loading = "lazy"/);
  assert.match(libraryScript, /image\.decoding = "async"/);
  assert.match(libraryScript, /link\.rel = "prefetch"/);
  assert.match(libraryScript, /card\.addEventListener\("pointerenter"/);
  assert.match(libraryScript, /card\.addEventListener\("focus"/);
});

test("all raster logos stay within the homepage delivery budget", () => {
  libraryShows.filter((show) => show.image.endsWith(".png")).forEach((show) => {
    const file = path.join(root, show.image);
    const size = fs.statSync(file).size;
    const png = fs.readFileSync(file);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    assert.ok(size < 250_000, `${show.id}: ${(size / 1024).toFixed(1)} KiB`);
    assert.ok(Math.max(width, height) <= 520, `${show.id}: ${width}×${height}`);
  });
});

test("deployed cards prefetch their first-screen data without probing undeployed shows", () => {
  const deployed = libraryShows.filter((show) => show.deployed);
  assert.ok(deployed.every((show) => show.prefetch?.length === 1));
  assert.match(libraryScript, /\[show\.href, \.\.\.\(show\.prefetch \|\| \[\]\)\]/);
  assert.doesNotMatch(libraryScript, /window\.libraryShows\.flatMap\([^)]*prefetch/);
});

test("library and all twenty show pages keep the shared Google Analytics tag", () => {
  const pages = [
    ["library", indexHtml],
    ...libraryShows.map((show) => [
      show.id,
      fs.readFileSync(path.join(root, show.href), "utf8"),
    ]),
  ];
  pages.forEach(([name, html]) => {
    assert.match(
      html,
      /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-E49LJ5T1V6/,
      `${name}: gtag loader`,
    );
    assert.match(html, /gtag\('config', 'G-E49LJ5T1V6'\)/, `${name}: gtag config`);
  });
});
