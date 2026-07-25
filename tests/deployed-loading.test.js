const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function size(relativePath) {
  return fs.statSync(path.join(root, relativePath)).size;
}

test("dazhuangwang starts its external lyric download from the document head", () => {
  const index = read("dazhuangwang/index.html");
  assert.match(index, /<link rel="preload" href="songs\.js" as="script" \/>/);
  assert.match(index, /<script src="songs\.js" onerror="handleCriticalAssetError\(\)"><\/script>/);
  assert.doesNotMatch(index, /const dazhuangwangSongs = \[/);
  assert.ok(size("dazhuangwang/index.html") < 600_000);
  assert.ok(size("dazhuangwang/songs.js") < 600_000);
});

test("Hamilton renders lyrics before loading analysis and word dictionaries", () => {
  const index = read("Hamilton/index.html");
  const script = read("Hamilton/script.js");
  assert.match(index, /<link rel="preload" href="lyrics-data\.js" as="script" \/>/);
  assert.match(index, /<link rel="preload" href="word-data\.js" as="script" fetchpriority="low" \/>/);
  assert.match(index, /<script src="lyrics-data\.js" onerror="handleCriticalAssetError\(\)"><\/script>/);
  assert.doesNotMatch(index, /<script src="(?:songs|word-data)\.js"><\/script>/);
  assert.match(script, /renderCurrentSong\(\);\s*wordDictionaryReady = loadWordDictionary/);
  assert.match(script, /showLoadingPopover\(part, button\);\s*await wordDictionaryReady/);
  assert.doesNotMatch(script, /await\s+(?:analysisDataReady|loadAnalysisData)/);
  assert.ok(size("Hamilton/lyrics-data.js") < 1_300_000);
});

test("Rouge et Noir renders lyrics before loading corrected line phonetics", () => {
  const index = read("rouge-et-noir/index.html");
  const script = read("rouge-et-noir/script.js");
  assert.match(index, /<link rel="preload" href="songs\.js" as="script" \/>/);
  assert.doesNotMatch(index, /<script src="line-phonetics\.js"><\/script>/);
  assert.match(script, /renderCurrentSong\(\);\s*loadDeferredPhonetics\(\)/);
  assert.ok(size("rouge-et-noir/songs.js") < 650_000);
});
