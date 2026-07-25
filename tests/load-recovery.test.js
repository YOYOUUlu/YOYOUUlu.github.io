const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { libraryShows } = require("../shows.js");

const root = path.resolve(__dirname, "..");
const expectedAssets = new Map([["index.html", ["shows.js", "library.js"]]]);

libraryShows.forEach((show) => {
  if (!fs.existsSync(path.join(root, show.href))) return;

  const assets = show.id === "dazhuangwang"
    ? ["songs.js", "../shared/audio-playback.js"]
    : show.id === "hamilton"
      ? ["lyrics-data.js", "../shared/audio-playback.js", "script.js"]
      : ["songs.js", "../shared/audio-playback.js", "script.js"];
  expectedAssets.set(show.href, assets);
});

test("the library and all available show pages retry failed critical assets once", () => {
  expectedAssets.forEach((assets, relativePath) => {
    const html = fs.readFileSync(path.join(root, relativePath), "utf8");

    assert.match(html, /window\.handleCriticalAssetError = \(\) =>/);
    assert.match(html, /now - lastRetry < 30000/);
    assert.match(html, /retryUrl\.searchParams\.set\("_retry"/);
    assert.match(html, /网络连接不稳定，页面资源未完整加载/);
    assert.match(html, /retry\.textContent = "重新加载"/);

    const recoveryScript = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
      .map((match) => match[1])
      .find((script) => script.includes("window.handleCriticalAssetError"));
    assert.ok(recoveryScript, `${relativePath}: recovery script`);
    assert.doesNotThrow(() => new vm.Script(recoveryScript), `${relativePath}: recovery syntax`);

    assets.forEach((asset) => {
      assert.ok(
        html.includes(`<script src="${asset}" onerror="handleCriticalAssetError()"></script>`),
        `${relativePath}: ${asset}`,
      );
    });
  });
});

test("the library and all available show pages defer Google Analytics until critical assets finish loading", () => {
  expectedAssets.forEach((assets, relativePath) => {
    const html = fs.readFileSync(path.join(root, relativePath), "utf8");

    assert.doesNotMatch(html, /<script async src="https:\/\/www\.googletagmanager\.com/);
    assert.match(html, /window\.addEventListener\('load', \(\) => \{/);
    assert.match(html, /analyticsScript\.async = true/);
    assert.match(html, /analyticsScript\.src = 'https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-E49LJ5T1V6'/);
  });
});
