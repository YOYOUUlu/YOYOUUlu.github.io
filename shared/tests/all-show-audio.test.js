const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const { libraryShows } = require(path.join(root, "shows.js"));

function getShowDirectory(show) {
  return show.id === "hamilton" ? "Hamilton" : show.id;
}

function readShowFiles(show) {
  const directory = path.join(root, getShowDirectory(show));
  const index = fs.readFileSync(path.join(directory, "index.html"), "utf8");
  const script = show.id === "dazhuangwang"
    ? index
    : fs.readFileSync(path.join(directory, "script.js"), "utf8");
  const style = show.id === "dazhuangwang"
    ? index
    : fs.readFileSync(path.join(directory, "style.css"), "utf8");
  return { index, script, style };
}

function readSongData(show) {
  const directory = path.join(root, getShowDirectory(show));
  return fs.readFileSync(path.join(directory, "songs.js"), "utf8");
}

function listAudioFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return listAudioFiles(target);
    return entry.isFile() ? [target] : [];
  });
}

function readDisplayedLyricText(show) {
  const directory = path.join(root, getShowDirectory(show));
  const sandbox = { window: {} };
  if (show.id === "hamilton") {
    vm.runInNewContext(fs.readFileSync(path.join(directory, "lyrics-data.js"), "utf8"), sandbox);
    return sandbox.window.hamiltonLyricsRows.flatMap((line) => [
      line.song_title,
      line.song_title_zh,
      line.english,
      line.chinese_translation,
    ]).join("\n");
  }
  if (show.id === "dazhuangwang") {
    vm.runInNewContext(fs.readFileSync(path.join(directory, "songs.js"), "utf8"), sandbox);
    return sandbox.window.dazhuangwangSongs.flatMap((song) => [
      song.title,
      song.titleSimplified,
      song.titleTraditional,
      ...song.lines.flatMap((line) => [line.text, line.simplified]),
    ]).join("\n");
  }
  vm.runInNewContext(fs.readFileSync(path.join(directory, "songs.js"), "utf8"), sandbox);
  return sandbox.window.songs.flatMap((song) => [
    song.title,
    song.titleZh,
    song.zhTitle,
    ...song.lines.flatMap((line) => [line.original, line.fr, line.en, line.zh]),
  ]).filter(Boolean).join("\n");
}

test("all twenty show pages load the shared audio guard and expose a playlist button", () => {
  assert.equal(libraryShows.length, 20);
  libraryShows.forEach((show) => {
    const { index, script, style } = readShowFiles(show);
    assert.match(index, /\.\.\/shared\/audio-playback\.js/, `${show.id}: shared audio controller`);
    assert.match(index, /id="songPlayButton"/, `${show.id}: song playlist button`);
    assert.match(index, /playlist-lines-mark/, `${show.id}: non-speaker playlist icon`);
    assert.match(index, /playlist-stop-mark" x="8"/, `${show.id}: centered stop icon`);
    assert.match(script, /MusicalAudio\.createController/, `${show.id}: controller initialization`);
    assert.match(script, /MusicalAudio\.getCachedAudio/, `${show.id}: cached repeated playback`);
    assert.match(script, /MusicalAudio\.preloadLocalAudio/, `${show.id}: shared preload cache`);
    assert.doesNotMatch(script, /new Audio\(/, `${show.id}: no per-click media reconstruction`);
    assert.match(script, /audioController\.runUserAction/, `${show.id}: guarded manual playback`);
    assert.match(script, /audioController\.toggleSequence/, `${show.id}: sequential playback`);
    assert.match(script, /audioController\.stopAll/, `${show.id}: song-change cleanup`);
    assert.match(script, /addEventListener\("ended"/, `${show.id}: event-driven advancement`);
    assert.match(script, /function preloadLineAudio/, `${show.id}: next-line preload`);
    assert.match(script, /function followSequenceCard/, `${show.id}: automatic page following`);
    assert.match(script, /scrollIntoView/, `${show.id}: current line scroll behavior`);
    assert.match(style, /\.song-play-button/, `${show.id}: playlist button styling`);
    assert.match(style, /\.is-sequence-active/, `${show.id}: current-line styling`);
    assert.match(style, /\.is-audio-loading/, `${show.id}: loading feedback`);
  });
});

test("all show deployment trees contain only compact MP3 audio", () => {
  let total = 0;
  libraryShows.forEach((show) => {
    const directory = path.join(root, getShowDirectory(show), "audio");
    const files = listAudioFiles(directory);
    assert.ok(files.length > 0, `${show.id}: deployment audio exists`);
    files.forEach((file) => assert.equal(path.extname(file).toLowerCase(), ".mp3", `${show.id}: ${file}`));
    total += files.length;
  });
  assert.equal(total, 53751);
});

test("future audio builds write external WAV masters and deploy MP3 automatically", () => {
  const builder = fs.readFileSync(path.join(root, "shared/build-natural-audio.js"), "utf8");
  const pruner = fs.readFileSync(path.join(root, "shared/prune-generated-audio.js"), "utf8");
  const validator = fs.readFileSync(path.join(root, "shared/validate-audio-library.js"), "utf8");

  assert.match(builder, /audio-masters/);
  assert.match(builder, /vibe-coding-current/);
  assert.match(builder, /libmp3lame/);
  assert.match(builder, /\.mp3/);
  assert.match(pruner, /\.mp3/);
  assert.match(validator, /\.mp3/);
});

test("the three independent pages keep their own audio and fallback implementations", () => {
  const hamilton = readShowFiles(libraryShows.find((show) => show.id === "hamilton")).script;
  const rouge = readShowFiles(libraryShows.find((show) => show.id === "rouge-et-noir")).script;
  const dazhuangwang = readShowFiles(libraryShows.find((show) => show.id === "dazhuangwang")).script;

  assert.match(hamilton, /function playLineToEnd/);
  assert.match(hamilton, /speakEnglish\(line\.en, true\)/);
  assert.match(rouge, /function playLineToEnd/);
  assert.match(rouge, /speakFrench\(line\.fr, true\)/);
  assert.match(dazhuangwang, /function playDazhuangwangLineToEnd/);
  assert.match(dazhuangwang, /function speakCantoneseToEnd/);
});

test("dazhuangwang excludes lines without local audio from whole-song playback", () => {
  const show = libraryShows.find((item) => item.id === "dazhuangwang");
  const directory = path.join(root, getShowDirectory(show));
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(directory, "songs.js"), "utf8"), sandbox);
  const line = sandbox.window.dazhuangwangSongs
    .flatMap((song) => song.lines)
    .find((item) => item.id === "dzw-19-001");
  const { script } = readShowFiles(show);

  assert.equal(line.text, "Hmm…Hmm…Hmm…Hmm…Hmm…Hmm…Hmm…Hmm…Hmm…");
  assert.equal(line.noJyutping, true);
  assert.equal(line.noAudio, true);
  assert.equal(line.jyutping, "");
  assert.equal(line.audio, "");
  assert.match(script, /items: song\.lines\.filter\(\(line\) => line\.audio && !line\.noAudio\)/);
  const song12 = sandbox.window.dazhuangwangSongs.find((song) => song.order === 12);
  const sanskritLines = song12.lines.filter((item) => item.noJyutping);
  assert.equal(sanskritLines.length, 13);
  assert.equal(sanskritLines.every((item) => item.audio === ""), true);
  assert.equal(song12.lines.filter((item) => item.audio && !item.noAudio).length, 29);
  assert.equal(fs.existsSync(path.join(directory, "audio/19-倾听/dzw-19-001.wav")), false);
});

test("dazhuangwang uses the complete Jyutping initial for 啱", () => {
  const show = libraryShows.find((item) => item.id === "dazhuangwang");
  const directory = path.join(root, getShowDirectory(show));
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(directory, "songs.js"), "utf8"), sandbox);
  const firstSong = sandbox.window.dazhuangwangSongs.find((song) => song.order === 1);
  const target = firstSong.lines.find((line) => line.id === "dzw-01-032");

  assert.equal(target.text, "啱");
  assert.equal(target.jyutping, "ngaam1");
  assert.equal(firstSong.lines.some((line) => line.text === "啱" && line.jyutping === "aam1"), false);
});

test("dazhuangwang keeps 噃 and its bo3 reading synchronized", () => {
  const show = libraryShows.find((item) => item.id === "dazhuangwang");
  const directory = path.join(root, getShowDirectory(show));
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(directory, "songs.js"), "utf8"), sandbox);
  const target = sandbox.window.dazhuangwangSongs
    .flatMap((song) => song.lines)
    .find((line) => line.id === "dzw-18-115");

  assert.equal(target.text, "並唔係噃 一試就能服眾 佢係老竇");
  assert.equal(target.simplified, "并唔系噃 一试就能服众 佢系老窦");
  assert.equal(target.jyutping, "bing6 m4 hai6 bo3 jat1 si3 zau6 nang4 fuk6 zung3 keoi5 hai6 lou5 dau6");
  assert.doesNotMatch(target.text + target.simplified, /皤/);
});

test("dazhuangwang deploys compact MP3 sentence audio without stale WAV references", () => {
  const show = libraryShows.find((item) => item.id === "dazhuangwang");
  const directory = path.join(root, getShowDirectory(show));
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(directory, "songs.js"), "utf8"), sandbox);
  const audioLines = sandbox.window.dazhuangwangSongs
    .flatMap((song) => song.lines)
    .filter((line) => line.audio);

  assert.equal(audioLines.length, 1351);
  audioLines.forEach((line) => {
    assert.match(line.audio, /\.mp3$/i, `${line.id}: compact web audio path`);
    assert.equal(fs.existsSync(path.join(directory, line.audio)), true, `${line.id}: audio file exists`);
  });
  assert.equal(
    fs.readdirSync(path.join(directory, "audio"), { recursive: true })
      .some((name) => typeof name === "string" && name.toLowerCase().endsWith(".wav")),
    false,
  );
});

test("all song changes reset the new page to the top", () => {
  libraryShows.forEach((show) => {
    const { script } = readShowFiles(show);
    assert.match(script, /function resetSongScrollPosition/, `${show.id}: scroll reset helper`);
    assert.match(script, /window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/, `${show.id}: immediate top reset`);
    assert.match(script, /renderCurrentSongWithTransition\(\);\s*resetSongScrollPosition\(\);/, `${show.id}: reset after selecting a song`);
  });
});

test("all playlist buttons stay directly in the inline song-title flow", () => {
  libraryShows.forEach((show) => {
    const { style } = readShowFiles(show);
    assert.match(style, /\.song-title-row\s*\{[\s\S]*?display:\s*block;/, `${show.id}: title row uses normal text flow`);
    assert.match(style, /\.song-title-row h[12]\s*\{[\s\S]*?display:\s*inline;/, `${show.id}: title is inline`);
    assert.match(style, /\.song-play-button\s*\{[\s\S]*?margin-inline-start:\s*0\.32em;/, `${show.id}: button follows the final title character`);
  });
});

test("song display titles do not expose live-performance suffix labels", () => {
  const versionLabel = /(?:"title(?:Zh)?"|"zhTitle"|title(?:Zh)?|zhTitle)\s*:\s*["'`][^"'`\n]*(?:[（(\[［]\s*(?:live|现场)|[-–—]\s*live)/iu;
  libraryShows.forEach((show) => {
    assert.doesNotMatch(readSongData(show), versionLabel, `${show.id}: live/现场 title label`);
  });
});

test("all displayed lyric data avoids OCR acute apostrophes and glued Latin punctuation", () => {
  libraryShows.forEach((show) => {
    const source = readDisplayedLyricText(show);
    assert.ok(source, `${show.id}: displayed lyric data`);
    assert.doesNotMatch(source, /´/u, `${show.id}: OCR acute apostrophe`);
    assert.doesNotMatch(
      source,
      /\p{Script=Latin},\p{Script=Latin}|\p{Script=Latin}[!?;:]\p{Script=Latin}|\p{Ll}\.\p{Script=Latin}|\p{Script=Latin}\.\p{Ll}|\p{Script=Latin}[!?]\(|\)\p{Script=Latin}/u,
      `${show.id}: missing space after Latin punctuation`,
    );
  });
});
