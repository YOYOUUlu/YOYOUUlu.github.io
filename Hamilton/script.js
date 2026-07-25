const SETTINGS_KEY = "hamilton-display-settings";
const CURRENT_SONG_KEY = "hamilton-current-song-id";
const SIDEBAR_KEY = "hamilton-sidebar-collapsed";
const CSV_PATH = "hamilton_lyrics_en_based.csv";

let songs = [];
let wordLookup = new Map();
let analysisSongs = [];
let analysisByLine = new Map();
let generatedWordEntries = {};
let wordDictionaryReady = Promise.resolve();
const audioState = { current: null, finish: null, speechFinish: null, preload: null };
const state = {
  settings: { showZh: true, showIpa: true, ...sanitizeSettings(loadJson(SETTINGS_KEY, {})) },
  currentSongId: "",
  sidebarCollapsed: loadJson(SIDEBAR_KEY, false),
};

const refs = {
  shell: document.querySelector(".app-shell"),
  content: document.querySelector(".content"),
  sidebarToggle: document.querySelector("#sidebarToggle"),
  songList: document.querySelector("#songList"),
  songSelect: document.querySelector("#songSelect"),
  songTitle: document.querySelector("#songTitle"),
  songPlayButton: document.querySelector("#songPlayButton"),
  lyrics: document.querySelector("#lyrics"),
  toggleButtons: [...document.querySelectorAll("[data-toggle]")],
  wordPopover: document.querySelector("#wordPopover"),
  backToTop: document.querySelector("#backToTop"),
};

const audioController = window.MusicalAudio.createController({
  stopCurrent: stopCurrentPlayback,
  onItemClear: clearSequenceHighlight,
});

const COMMON_WORD_GLOSSARY = {
  a: { ipa: "/ə/", en: "indefinite article", meaning: "不定冠词；一个", speak: "a" },
  an: { ipa: "/ən/", en: "indefinite article", meaning: "不定冠词；一个", speak: "an" },
  and: { ipa: "/ænd/", en: "and", meaning: "和；并且", speak: "and" },
  are: { ipa: "/ɑɹ/", en: "be verb", meaning: "是；处于", speak: "are" },
  as: { ipa: "/æz/", en: "conjunction / preposition", meaning: "作为；像……一样；当……时；因为", speak: "as" },
  at: { ipa: "/æt/", en: "preposition", meaning: "在；向；以某一点", speak: "at" },
  be: { ipa: "/bi/", en: "be", meaning: "成为；是", speak: "be" },
  been: { ipa: "/bɪn/", en: "past participle of be", meaning: "be 的过去分词；曾经是", speak: "been" },
  being: { ipa: "/ˈbiɪŋ/", en: "noun / present participle of be", meaning: "存在；生物；be 的现在分词", speak: "being" },
  but: { ipa: "/bʌt/", en: "conjunction / preposition", meaning: "但是；除了；仅仅", speak: "but" },
  by: { ipa: "/baɪ/", en: "by / through", meaning: "被；通过；凭借", speak: "by" },
  did: { ipa: "/dɪd/", en: "past tense of do", meaning: "do 的过去式；做；确实", speak: "did" },
  do: { ipa: "/du/", en: "do; auxiliary verb for questions, negatives, and emphasis", meaning: "做；进行；用于疑问句、否定句或强调", speak: "do" },
  does: { ipa: "/dʌz/", en: "third-person singular of do; auxiliary verb", meaning: "do 的第三人称单数；做；用于疑问句、否定句或强调", speak: "does" },
  doing: { ipa: "/ˈduɪŋ/", en: "present participle of do", meaning: "正在做；进行", speak: "doing" },
  done: { ipa: "/dʌn/", en: "past participle of do", meaning: "完成；做完；do 的过去分词", speak: "done" },
  down: { ipa: "/daʊn/", en: "adverb / preposition", meaning: "向下；往下；下降", speak: "down" },
  dropped: { ipa: "/drɑpt/", en: "past tense / past participle of drop", meaning: "落下；丢下；使掉下（drop 的过去式/过去分词）", speak: "dropped" },
  for: { ipa: "/fɔɹ/", en: "for", meaning: "为了；给；对于", speak: "for" },
  founding: { ipa: "/ˈfaʊndɪŋ/", en: "founding; establishing", meaning: "创立的；建立的；建国的", speak: "founding" },
  from: { ipa: "/fɹʌm/", en: "from", meaning: "从；来自", speak: "from" },
  got: { ipa: "/ɡɑt/", en: "past tense / past participle of get", meaning: "get 的过去式/过去分词；得到；变得；必须", speak: "got" },
  he: { ipa: "/hi/", en: "he", meaning: "他", speak: "he" },
  her: { ipa: "/hɜɹ/", en: "her", meaning: "她；她的", speak: "her" },
  him: { ipa: "/hɪm/", en: "him", meaning: "他", speak: "him" },
  his: { ipa: "/hɪz/", en: "his", meaning: "他的", speak: "his" },
  i: { ipa: "/aɪ/", en: "I", meaning: "我", speak: "I" },
  if: { ipa: "/ɪf/", en: "conjunction", meaning: "如果；是否", speak: "if" },
  in: { ipa: "/ɪn/", en: "in", meaning: "在……里；进入", speak: "in" },
  is: { ipa: "/ɪz/", en: "be verb", meaning: "是", speak: "is" },
  it: { ipa: "/ɪt/", en: "it", meaning: "它；这件事", speak: "it" },
  its: { ipa: "/ɪts/", en: "possessive determiner", meaning: "它的", speak: "its" },
  kid: { ipa: "/kɪd/", en: "child; young person", meaning: "孩子；年轻人", speak: "kid" },
  me: { ipa: "/mi/", en: "me", meaning: "我", speak: "me" },
  my: { ipa: "/maɪ/", en: "my", meaning: "我的", speak: "my" },
  no: { ipa: "/noʊ/", en: "determiner / adverb", meaning: "不；没有；否定回答", speak: "no" },
  not: { ipa: "/nɑt/", en: "adverb", meaning: "不；没有", speak: "not" },
  of: { ipa: "/əv/", en: "of", meaning: "……的；属于", speak: "of" },
  off: { ipa: "/ɔf/", en: "adverb / preposition", meaning: "离开；关闭；脱离", speak: "off" },
  on: { ipa: "/ɑn/", en: "on", meaning: "在……上；关于", speak: "on" },
  or: { ipa: "/ɔɹ/", en: "or", meaning: "或者", speak: "or" },
  our: { ipa: "/aʊɹ/", en: "possessive determiner", meaning: "我们的", speak: "our" },
  out: { ipa: "/aʊt/", en: "adverb / preposition", meaning: "出去；在外；出局", speak: "out" },
  providence: { ipa: "/ˈprɑvɪdəns/", en: "divine care; fate; foresight", meaning: "天意；神意；深谋远虑", speak: "providence" },
  she: { ipa: "/ʃi/", en: "pronoun", meaning: "她", speak: "she" },
  "self-starter": { ipa: "/ˌsɛlf ˈstɑrtɚ/", en: "proactive person; self-motivated person", meaning: "主动做事的人；有自驱力的人", speak: "self-starter" },
  slave: { ipa: "/sleɪv/", en: "enslaved person", meaning: "奴隶；被迫苦干的人", speak: "slave" },
  slaves: { ipa: "/sleɪvz/", en: "plural of slave; enslaved people", meaning: "奴隶（复数）；被迫苦干的人", speak: "slaves" },
  so: { ipa: "/soʊ/", en: "adverb / conjunction", meaning: "所以；如此；非常", speak: "so" },
  that: { ipa: "/ðæt/", en: "that", meaning: "那个；那件事；引导从句", speak: "that" },
  the: { ipa: "/ðə/", en: "definite article", meaning: "定冠词；这个/那个", speak: "the" },
  their: { ipa: "/ðɛɹ/", en: "possessive determiner", meaning: "他们的；她们的；它们的", speak: "their" },
  them: { ipa: "/ðɛm/", en: "pronoun", meaning: "他们；她们；它们（宾格）", speak: "them" },
  then: { ipa: "/ðɛn/", en: "adverb", meaning: "然后；当时", speak: "then" },
  there: { ipa: "/ðɛɹ/", en: "adverb / pronoun", meaning: "那里；有", speak: "there" },
  they: { ipa: "/ðeɪ/", en: "pronoun", meaning: "他们；她们；它们", speak: "they" },
  this: { ipa: "/ðɪs/", en: "pronoun / determiner", meaning: "这；这个", speak: "this" },
  to: { ipa: "/tə/", en: "to", meaning: "去；向；为了", speak: "to" },
  up: { ipa: "/ʌp/", en: "adverb / preposition", meaning: "向上；起来；增加", speak: "up" },
  us: { ipa: "/ʌs/", en: "pronoun", meaning: "我们（宾格）", speak: "us" },
  was: { ipa: "/wʌz/", en: "was", meaning: "曾是；当时是", speak: "was" },
  we: { ipa: "/wi/", en: "pronoun", meaning: "我们", speak: "we" },
  were: { ipa: "/wɜɹ/", en: "were", meaning: "曾是；当时是", speak: "were" },
  what: { ipa: "/wʌt/", en: "pronoun / determiner", meaning: "什么；多么", speak: "what" },
  when: { ipa: "/wɛn/", en: "adverb / conjunction", meaning: "什么时候；当……时", speak: "when" },
  where: { ipa: "/wɛɹ/", en: "adverb / conjunction", meaning: "哪里；在……的地方", speak: "where" },
  which: { ipa: "/wɪtʃ/", en: "pronoun / determiner", meaning: "哪一个；哪个", speak: "which" },
  who: { ipa: "/hu/", en: "pronoun", meaning: "谁", speak: "who" },
  why: { ipa: "/waɪ/", en: "adverb / noun", meaning: "为什么；原因", speak: "why" },
  will: { ipa: "/wɪl/", en: "will", meaning: "将会；愿意", speak: "will" },
  with: { ipa: "/wɪð/", en: "with", meaning: "和；带着；用", speak: "with" },
  without: { ipa: "/wɪˈðaʊt/", en: "preposition / adverb", meaning: "没有；不带；在……之外", speak: "without" },
  you: { ipa: "/ju/", en: "you", meaning: "你；你们", speak: "you" },
  your: { ipa: "/jʊɹ/", en: "your", meaning: "你的；你们的", speak: "your" },
};

init();

async function init() {
  initQuillCursor();
  bindControls();
  bindHashChange();
  bindBackToTop();
  bindPopoverDismiss();
  refs.songPlayButton?.addEventListener("click", toggleCurrentSongPlayback);
  primeSpeechVoices();
  refs.lyrics.innerHTML = '<p class="empty">正在读取歌词...</p>';
  try {
    songs = await loadSongs();
    state.currentSongId = resolveInitialSongId();
    renderCurrentSong();
    wordDictionaryReady = loadWordDictionary().catch((error) => {
      console.error("Deferred Hamilton word dictionary failed to load", error);
    });
    loadAnalysisData().catch((error) => {
      console.error("Deferred Hamilton analysis data failed to load", error);
    });
  } catch (error) {
    console.error(error);
    refs.songTitle.textContent = "Hamilton 中英歌词";
    refs.lyrics.innerHTML = '<p class="empty">没有读到歌词数据。</p>';
  }
}

function loadScript(src, fetchPriority = "auto") {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.fetchPriority = fetchPriority;
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.append(script);
  });
}

async function loadWordDictionary() {
  await loadScript("word-data.js", "high");
  generatedWordEntries = window.hamiltonWordEntries || {};
  songs = buildSongsFromRows(window.hamiltonLyricsRows || []);
}

async function loadAnalysisData() {
  await loadScript("songs.js", "low");
  analysisSongs = [...(window.hamiltonSongs || [])];
  analysisByLine = buildAnalysisLookup(analysisSongs);
  songs = buildSongsFromRows(window.hamiltonLyricsRows || []);
}

async function loadSongs() {
  if (Array.isArray(window.hamiltonLyricsRows) && window.hamiltonLyricsRows.length) {
    return buildSongsFromRows(window.hamiltonLyricsRows);
  }
  return loadSongsFromCsv();
}

async function loadSongsFromCsv() {
  const response = await fetch(CSV_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load ${CSV_PATH}: ${response.status}`);
  }
  const rows = parseCsv(await response.text());
  return buildSongsFromRows(rows);
}

function buildSongsFromRows(rows) {
  const grouped = new Map();
  const nextWordLookup = new Map();
  rows.forEach((row) => {
    const order = Number(row.song_order);
    const title = row.song_title?.trim();
    const english = row.english?.trim();
    const zh = row.chinese_translation?.trim();
    if (!Number.isFinite(order) || !title || !english) return;

    const key = `${order}|${title}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: slugify(`${String(order).padStart(2, "0")}-${title}`),
        order,
        title,
        musical: "Hamilton",
        lines: [],
      });
    }

    const song = grouped.get(key);
    const lineIndex = Number(row.line_index) || song.lines.length + 1;
    const analysis = analysisByLine.get(`${order}|${normalizeEnglishKey(english)}`) || { words: [] };
    const ipa = row.ipa?.trim() || "";
    addLineWordEntries(nextWordLookup, english, ipa, analysis.words || []);
    song.lines.push({
      id: `ham-${String(order).padStart(2, "0")}-${String(lineIndex).padStart(3, "0")}`,
      en: english,
      ipa,
      zh,
      note: row.note?.trim() || "",
      analysis,
    });
  });

  const builtSongs = [...grouped.values()]
    .map((song) => ({ ...song, lines: song.lines.sort((a, b) => a.id.localeCompare(b.id)) }))
    .sort((a, b) => a.order - b.order);
  builtSongs.forEach((song) => addTitleWordEntries(nextWordLookup, song.title));
  wordLookup = nextWordLookup;
  return builtSongs;
}

function buildAnalysisLookup(sourceSongs) {
  const lookup = new Map();
  sourceSongs.forEach((song) => {
    (song.lines || []).forEach((line) => {
      if (line.en) {
        lookup.set(`${song.order}|${normalizeEnglishKey(line.en)}`, line.analysis || { words: [] });
      }
    });
  });
  return lookup;
}

function addLineWordEntries(lookup, english, lineIpa, words) {
  const tokens = tokenizeEnglish(english);
  const ipaParts = splitIpa(lineIpa);
  const notesByTerm = new Map();

  words.forEach((word) => {
    const key = normalizeToken(word.term);
    if (!key) return;
    notesByTerm.set(key, word);
  });

  tokens.forEach((token, index) => {
    const key = normalizeToken(token);
    if (!key || lookup.has(key)) return;
    const generated = generatedWordEntries[key];
    const glossary = COMMON_WORD_GLOSSARY[key] || notesByTerm.get(key);
    const alignedIpa = ipaParts.length === tokens.length ? `/${ipaParts[index]}/` : "";
    lookup.set(key, {
      term: token,
      ipa: glossary?.ipa || generated?.ipa || alignedIpa || lineIpa || "见本句音标",
      meaning: glossary?.meaning || glossary?.zh || generated?.meaning || `歌词用词：${token}`,
      en: glossary?.en || generated?.en || "",
      note: glossary?.note || "",
      speak: glossary?.speak || generated?.speak || token,
    });
  });
}

function addTitleWordEntries(lookup, title) {
  tokenizeEnglish(title).forEach((token) => {
    const key = normalizeToken(token);
    if (!key || lookup.has(key)) return;
    const generated = generatedWordEntries[key];
    const glossary = COMMON_WORD_GLOSSARY[key];
    lookup.set(key, {
      term: token,
      ipa: glossary?.ipa || generated?.ipa || "标题词",
      meaning: glossary?.meaning || generated?.meaning || `歌名词：${token}`,
      en: glossary?.en || generated?.en || "",
      note: glossary || generated ? "" : "标题词没有可靠单词级 IPA 数据；可使用发音按钮听读。",
      speak: glossary?.speak || generated?.speak || token,
    });
  });
}

function tokenizeEnglish(text) {
  return text.match(/[\p{L}]+(?:['’][\p{L}]+)?(?:-[\p{L}]+)*|\d+/gu) || [];
}

function splitIpa(ipa) {
  return trimIpaSlashes(ipa)
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function trimIpaSlashes(value) {
  return String(value).replace(/^\/|\/$/g, "").trim();
}

function normalizeToken(token) {
  return String(token)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
}

function getWordEntry(displayWord) {
  const key = normalizeToken(displayWord);
  const entry = wordLookup.get(key) || COMMON_WORD_GLOSSARY[key] || generatedWordEntries[key];
  if (entry) {
    return {
      term: displayWord,
      ipa: entry.ipa || "见本句音标",
      meaning: entry.meaning || entry.zh || `歌词用词：${displayWord}`,
      en: entry.en || "",
      note: entry.note || "",
      speak: entry.speak || displayWord,
    };
  }
  return {
    term: displayWord,
    ipa: "见发音",
    meaning: `歌词用词：${displayWord}`,
    en: "",
    note: "可用发音按钮听浏览器朗读。",
    speak: displayWord,
  };
}

function sanitizeSettings(saved) {
  return {
    showZh: saved.showZh !== false,
    showIpa: saved.showIpa !== false,
  };
}

function loadJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function getSongIdFromHash() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return params.get("song");
}

function resolveInitialSongId() {
  const hashSongId = getSongIdFromHash();
  const savedSongId = localStorage.getItem(CURRENT_SONG_KEY);
  return [hashSongId, savedSongId].find(isKnownSongId) || songs[0]?.id || "";
}

function isKnownSongId(songId) {
  return songs.some((song) => song.id === songId);
}

function getCurrentSong() {
  return songs.find((song) => song.id === state.currentSongId) || songs[0] || null;
}

function bindControls() {
  refs.toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.toggle;
      state.settings[key] = !state.settings[key];
      saveSettings();
      renderCurrentSong();
    });
  });

  refs.sidebarToggle.addEventListener("click", () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(state.sidebarCollapsed));
    updateSidebar();
  });

  refs.songSelect.addEventListener("change", (event) => selectSong(event.target.value));
}

function bindHashChange() {
  window.addEventListener("hashchange", () => {
    const songId = getSongIdFromHash();
    if (isKnownSongId(songId) && songId !== state.currentSongId) {
      audioController.stopAll();
      state.currentSongId = songId;
      localStorage.setItem(CURRENT_SONG_KEY, songId);
      hidePopover();
      renderCurrentSong();
      resetSongScrollPosition();
    }
  });
}

function bindBackToTop() {
  const update = () => {
    refs.backToTop.hidden = window.scrollY < 420;
  };
  refs.backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function bindPopoverDismiss() {
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".lyric-word") && !event.target.closest(".song-title-word") && !event.target.closest(".word-popover")) {
      hidePopover();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hidePopover();
  });
  window.addEventListener("scroll", hidePopover, { passive: true });
}

function selectSong(songId) {
  if (!isKnownSongId(songId)) return;
  if (songId === state.currentSongId) return;
  audioController.stopAll();
  state.currentSongId = songId;
  localStorage.setItem(CURRENT_SONG_KEY, songId);
  if (state.sidebarCollapsed) {
    state.sidebarCollapsed = false;
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(false));
  }
  const hash = `#song=${encodeURIComponent(songId)}`;
  if (window.location.hash !== hash) {
    window.history.pushState(null, "", hash);
  }
  hidePopover();
  renderCurrentSongWithTransition();
  resetSongScrollPosition();
}

function resetSongScrollPosition() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function renderCurrentSongWithTransition() {
  if (!refs.content) {
    renderCurrentSong();
    return;
  }
  refs.content.classList.remove("is-song-settling");
  refs.content.classList.add("is-song-changing");
  window.setTimeout(() => {
    renderCurrentSong();
    refs.content.classList.remove("is-song-changing");
    refs.content.classList.add("is-song-settling");
    window.setTimeout(() => refs.content.classList.remove("is-song-settling"), 360);
  }, 170);
}

function updateControls() {
  refs.toggleButtons.forEach((button) => {
    const active = Boolean(state.settings[button.dataset.toggle]);
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function updateSidebar() {
  refs.shell.classList.toggle("is-collapsed", state.sidebarCollapsed);
  refs.sidebarToggle.textContent = state.sidebarCollapsed ? "›" : "‹";
  refs.sidebarToggle.setAttribute("aria-expanded", String(!state.sidebarCollapsed));
  refs.sidebarToggle.setAttribute("aria-label", state.sidebarCollapsed ? "展开歌曲列表" : "收起歌曲列表");
}

function renderSongNav() {
  const current = getCurrentSong();
  refs.songList.innerHTML = "";
  refs.songSelect.innerHTML = "";

  songs.forEach((song) => {
    const option = document.createElement("option");
    option.value = song.id;
    option.textContent = `${song.order}. ${song.title}`;
    option.selected = song.id === current?.id;
    refs.songSelect.append(option);
  });

  songs.forEach((song) => {
    const button = document.createElement("button");
    button.className = "song-item";
    button.type = "button";
    button.classList.toggle("is-active", song.id === current?.id);
    button.addEventListener("click", () => selectSong(song.id));

    const order = document.createElement("span");
    order.className = "song-order";
    order.textContent = String(song.order).padStart(2, "0");

    const title = document.createElement("span");
    title.className = "song-name";
    title.textContent = song.title;

    button.append(order, title);
    refs.songList.append(button);
  });
}

function renderCurrentSong() {
  const song = getCurrentSong();
  updateControls();
  updateSidebar();
  renderSongNav();

  if (!song) {
    refs.songTitle.textContent = "Hamilton";
    refs.songPlayButton.disabled = true;
    refs.lyrics.innerHTML = '<p class="empty">没有可显示的歌曲。</p>';
    return;
  }

  document.title = `${song.title}｜Hamilton 中英歌词`;
  renderSongTitle(song);
  refs.songPlayButton.disabled = !song.lines.length;

  refs.lyrics.innerHTML = "";
  song.lines.forEach((line) => refs.lyrics.append(renderLine(song, line)));
}

function renderLine(song, line) {
  const card = document.createElement("article");
  card.className = "lyric-card";
  card.dataset.lineId = line.id;

  const main = document.createElement("div");
  main.className = "line-main";

  const en = document.createElement("p");
  en.className = "en-line";
  en.append(renderEnglishTokens(line.en, "lyric-word", { showPhonetics: true, line }));

  const zh = document.createElement("p");
  zh.className = "zh-line";
  zh.hidden = !state.settings.showZh;
  zh.textContent = line.zh;

  main.append(en);
  main.append(zh);

  const actions = document.createElement("div");
  actions.className = "line-actions";
  const speak = document.createElement("button");
  speak.className = "speak-button";
  speak.type = "button";
  speak.title = "朗读这一句";
  speak.setAttribute("aria-label", `朗读：${line.en}`);
  speak.append(createSpeakerIcon());
  const lineAudioPath = getLineAudioPath(song, line);
  const primeLineAudio = () => window.MusicalAudio.preloadLocalAudio(lineAudioPath);
  speak.addEventListener("pointerenter", primeLineAudio, { once: true });
  speak.addEventListener("focus", primeLineAudio, { once: true });
  speak.addEventListener("click", () => audioController.runUserAction(
    speak,
    () => playEnglishAudio(lineAudioPath, line.en),
  ));
  actions.append(speak);

  card.append(main, actions);
  return card;
}

function renderSongTitle(song) {
  refs.songTitle.textContent = "";
  refs.songTitle.append(renderEnglishTokens(song.title, "song-title-word"));
}

function renderEnglishTokens(text, wordClassName = "lyric-word", options = {}) {
  const fragment = document.createDocumentFragment();
  const parts = text.match(/[\p{L}]+(?:['’][\p{L}]+)?(?:-[\p{L}]+)*|\d+|[^\p{L}\d]+/gu) || [text];
  const words = tokenizeEnglish(text);
  const ipaParts = splitIpa(options.line?.ipa || "");
  let wordIndex = 0;

  parts.forEach((part) => {
    if (/^[\p{L}\d]/u.test(part)) {
      const token = document.createElement("span");
      token.className = "lyric-token";

      const button = document.createElement("button");
      button.className = wordClassName;
      button.type = "button";
      button.textContent = part;
      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        showLoadingPopover(part, button);
        await wordDictionaryReady;
        if (!button.isConnected) return;
        showPopover(getWordEntry(part), button);
      });

      token.append(button);
      if (options.showPhonetics) {
        const phonetic = document.createElement("span");
        phonetic.className = "word-phonetic";
        phonetic.hidden = !state.settings.showIpa;
        phonetic.textContent = getAlignedTokenIpa(part, wordIndex, words.length, ipaParts);
        token.append(phonetic);
      }
      fragment.append(token);
      wordIndex += 1;
    } else {
      fragment.append(document.createTextNode(part));
    }
  });

  return fragment;
}

function getAlignedTokenIpa(token, wordIndex, wordCount, ipaParts) {
  if (ipaParts.length === wordCount && ipaParts[wordIndex]) return formatLineIpaPart(ipaParts[wordIndex], wordIndex, wordCount);
  return formatLineIpaPart(getWordEntry(token).ipa || "", wordIndex, wordCount);
}

function formatLineIpaPart(value, wordIndex, wordCount) {
  const bare = trimIpaSlashes(value);
  if (!bare || /见|标题词/u.test(bare)) return "";
  const prefix = wordIndex === 0 ? "/" : "";
  const suffix = wordIndex === wordCount - 1 ? "/" : "";
  return `${prefix}${bare}${suffix}`;
}

function showLoadingPopover(term, anchor) {
  refs.wordPopover.replaceChildren();
  const word = document.createElement("strong");
  word.className = "popover-word";
  word.textContent = term;
  const loading = document.createElement("p");
  loading.className = "popover-meaning";
  loading.textContent = "正在加载词义…";
  refs.wordPopover.append(word, loading);
  positionWordPopover(anchor);
}

function showPopover(word, anchor) {
  refs.wordPopover.innerHTML = "";

  const head = document.createElement("div");
  head.className = "popover-head";

  const title = document.createElement("strong");
  title.className = "popover-word";
  title.textContent = word.term;

  const ipa = document.createElement("span");
  ipa.className = "popover-ipa";
  ipa.textContent = word.ipa;

  const speak = document.createElement("button");
  speak.className = "popover-speak";
  speak.type = "button";
  speak.title = "播放发音";
  speak.setAttribute("aria-label", `播放发音：${word.term}`);
  speak.append(createSpeakerIcon());
  const wordAudioPath = getWordAudioPath(word.speak || word.term);
  window.MusicalAudio.preloadLocalAudio(wordAudioPath);
  speak.addEventListener("click", (event) => {
    event.stopPropagation();
    const text = word.speak || word.term;
    audioController.runUserAction(speak, () => playEnglishAudio(wordAudioPath, text));
  });

  const meaning = document.createElement("p");
  meaning.className = "popover-meaning";
  meaning.textContent = word.meaning;

  head.append(title, ipa, speak);
  refs.wordPopover.append(head, meaning);
  if (word.note) {
    const note = document.createElement("p");
    note.className = "popover-note";
    note.textContent = word.note;
    refs.wordPopover.append(note);
  }

  positionWordPopover(anchor);
}

function positionWordPopover(anchor) {
  refs.wordPopover.hidden = false;
  const rect = anchor.getBoundingClientRect();
  const popoverRect = refs.wordPopover.getBoundingClientRect();
  const left = Math.min(window.innerWidth - popoverRect.width - 12, Math.max(12, rect.left));
  const top = rect.bottom + popoverRect.height + 12 > window.innerHeight ? rect.top - popoverRect.height - 10 : rect.bottom + 10;
  refs.wordPopover.style.left = `${left}px`;
  refs.wordPopover.style.top = `${Math.max(12, top)}px`;
}

function hidePopover() {
  refs.wordPopover.hidden = true;
}

async function playEnglishAudio(src, fallbackText) {
  if (src) {
    try {
      await playLocalAudio(src, false);
      return;
    } catch {
      // Keep browser TTS as a fallback when a local file is missing or blocked.
    }
  }
  await speakEnglish(fallbackText, false);
}

function stopCurrentPlayback() {
  if (audioState.finish) {
    const finish = audioState.finish;
    audioState.finish = null;
    finish();
  }
  if (audioState.current) {
    audioState.current.pause();
    audioState.current.currentTime = 0;
    audioState.current = null;
  }
  if (audioState.speechFinish) {
    const finish = audioState.speechFinish;
    audioState.speechFinish = null;
    finish();
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  audioState.preload = null;
}

function playLocalAudio(src, waitForEnd) {
  if (!src) return Promise.reject(new Error("Missing audio source"));
  stopCurrentPlayback();
  const audio = window.MusicalAudio.getCachedAudio(src);
  if (!audio) return Promise.reject(new Error("Audio playback unavailable"));
  audioState.current = audio;
  if (!waitForEnd) return audio.play();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      if (audioState.current === audio) audioState.current = null;
      if (audioState.finish === stopAndResolve) audioState.finish = null;
      if (error) reject(error);
      else resolve();
    };
    const handleEnded = () => finish();
    const handleError = () => finish(new Error("Audio playback failed"));
    const stopAndResolve = () => finish();
    audioState.finish = stopAndResolve;
    audio.addEventListener("ended", handleEnded, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    Promise.resolve(audio.play()).catch(finish);
  });
}

function getLineAudioPath(song, line) {
  return `audio/lines/${encodeURIComponent(song.id)}/${encodeURIComponent(line.id)}.mp3`;
}

function getWordAudioPath(text) {
  const key = normalizeToken(text);
  return key ? `audio/words/${encodeURIComponent(key)}.mp3` : "";
}

function speakEnglish(text, waitForEnd) {
  if (!("speechSynthesis" in window)) return Promise.reject(new Error("Speech synthesis unavailable"));
  stopCurrentPlayback();
  const utterance = new SpeechSynthesisUtterance(text.replace(/^[A-Z][A-Z .,'&/-]{1,40}:\s*/, ""));
  const voice = getPreferredEnglishVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  utterance.pitch = 1.06;
  if (!waitForEnd) {
    window.speechSynthesis.speak(utterance);
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      if (audioState.speechFinish === stopAndResolve) audioState.speechFinish = null;
      if (error) reject(error);
      else resolve();
    };
    const stopAndResolve = () => finish();
    audioState.speechFinish = stopAndResolve;
    utterance.onend = () => finish();
    utterance.onerror = () => finish(new Error("Speech synthesis failed"));
    window.speechSynthesis.speak(utterance);
  });
}

async function playLineToEnd(song, line) {
  try {
    await playLocalAudio(getLineAudioPath(song, line), true);
  } catch {
    await speakEnglish(line.en, true);
  }
}

function toggleCurrentSongPlayback() {
  const song = getCurrentSong();
  if (!song?.lines.length) return;
  audioController.toggleSequence({
    button: refs.songPlayButton,
    items: song.lines,
    playItem: (line) => playLineToEnd(song, line),
    onItemStart: (line, index, nextLine) => {
      setSequenceHighlight(line.id);
      if (nextLine) preloadLineAudio(song, nextLine);
    },
  });
}

function preloadLineAudio(song, line) {
  const audio = window.MusicalAudio.preloadLocalAudio(getLineAudioPath(song, line));
  audioState.preload = audio;
}

function setSequenceHighlight(lineId) {
  clearSequenceHighlight();
  const card = Array.from(refs.lyrics.querySelectorAll(".lyric-card")).find((item) => item.dataset.lineId === lineId);
  card?.classList.add("is-sequence-active");
  followSequenceCard(card);
}

function followSequenceCard(card) {
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const topBoundary = Math.min(180, window.innerHeight * 0.24);
  const bottomBoundary = window.innerHeight - Math.min(150, window.innerHeight * 0.2);
  if (rect.top >= topBoundary && rect.bottom <= bottomBoundary) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  card.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "center",
    inline: "nearest",
  });
}

function clearSequenceHighlight() {
  refs.lyrics?.querySelectorAll(".lyric-card.is-sequence-active").forEach((card) => {
    card.classList.remove("is-sequence-active");
  });
}

function primeSpeechVoices() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => window.speechSynthesis.getVoices(), { once: true });
}

function getPreferredEnglishVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) => /^en[-_]/i.test(voice.lang));
  const preferredNames = [
    "Samantha",
    "Google US English",
    "Microsoft Jenny",
    "Microsoft Aria",
    "Karen",
    "Moira",
    "Tessa",
    "Daniel",
  ];
  return (
    preferredNames.map((name) => englishVoices.find((voice) => voice.name.includes(name))).find(Boolean) ||
    englishVoices.find((voice) => /en[-_]US/i.test(voice.lang)) ||
    englishVoices[0] ||
    null
  );
}

function createSpeakerIcon() {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const speaker = document.createElementNS("http://www.w3.org/2000/svg", "path");
  speaker.setAttribute("d", "M4 9v6h4l5 4V5L8 9H4z");
  const wave = document.createElementNS("http://www.w3.org/2000/svg", "path");
  wave.setAttribute("d", "M16 8.5a5 5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12");
  icon.append(speaker, wave);
  return icon;
}

function initQuillCursor() {
  const canvas = document.querySelector("#effectCanvas");
  if (!canvas || !window.matchMedia("(pointer: fine)").matches) return;

  const ctx = canvas.getContext("2d");
  let particles = [];
  let mouse = { x: -100, y: -100, targetX: -100, targetY: -100 };
  let isMouseDown = false;
  let quillScale = 1;

  const resizeCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.ceil(window.innerWidth * dpr);
    canvas.height = Math.ceil(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  class GoldSpark {
    constructor(x, y, vx, vy, isClick = false) {
      this.x = x;
      this.y = y;
      this.size = isClick ? Math.random() * 2.2 + 1.2 : Math.random() * 1.6 + 0.6;
      this.vx = vx + (Math.random() - 0.5) * 2.5;
      this.vy = vy + (Math.random() - 0.5) * 2.5;
      this.alpha = 1;
      this.decay = isClick ? Math.random() * 0.02 + 0.015 : Math.random() * 0.03 + 0.02;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.95;
      this.vy *= 0.95;
      this.vy += 0.07;
      this.alpha -= this.decay;
    }

    draw() {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2.5);
      grad.addColorStop(0, `rgba(255, 248, 220, ${this.alpha})`);
      grad.addColorStop(0.2, `rgba(240, 196, 76, ${this.alpha * 0.8})`);
      grad.addColorStop(0.6, `rgba(212, 175, 55, ${this.alpha * 0.4})`);
      grad.addColorStop(1, "rgba(212, 175, 55, 0)");
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawActualQuill(localCtx, x, y) {
    localCtx.save();
    localCtx.translate(x, y);
    localCtx.rotate(Math.PI * 0.75);

    const targetScale = isMouseDown ? 0.82 : 1;
    quillScale += (targetScale - quillScale) * 0.35;
    localCtx.scale(quillScale, quillScale);

    localCtx.beginPath();
    localCtx.moveTo(0, 0);
    localCtx.lineTo(-4, -6);
    localCtx.lineTo(-6, -14);
    localCtx.lineTo(-5, -30);
    localCtx.lineTo(5, -30);
    localCtx.lineTo(6, -14);
    localCtx.lineTo(4, -6);
    localCtx.closePath();
    localCtx.fillStyle = "#2d2216";
    localCtx.fill();
    localCtx.strokeStyle = "#d4af37";
    localCtx.lineWidth = 1.3;
    localCtx.stroke();

    const fluidColor = isMouseDown ? "#fff1cc" : "#0f0b06";
    const splitLineColor = isMouseDown ? "#fff1cc" : "#d4af37";
    localCtx.beginPath();
    localCtx.moveTo(0, 0);
    localCtx.lineTo(0, -15);
    localCtx.strokeStyle = splitLineColor;
    localCtx.lineWidth = isMouseDown ? 1.4 : 0.8;
    localCtx.stroke();

    localCtx.beginPath();
    localCtx.arc(0, -15, 1.4, 0, Math.PI * 2);
    localCtx.fillStyle = fluidColor;
    localCtx.fill();
    localCtx.strokeStyle = "#d4af37";
    localCtx.lineWidth = 0.8;
    localCtx.stroke();
    localCtx.restore();
  }

  const addSpark = (spark) => {
    particles.push(spark);
    if (particles.length > 260) particles.splice(0, particles.length - 260);
  };

  window.addEventListener(
    "mousemove",
    (event) => {
      const vx = event.clientX - mouse.targetX;
      const vy = event.clientY - mouse.targetY;
      mouse.targetX = event.clientX;
      mouse.targetY = event.clientY;
      if (Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5) {
        for (let index = 0; index < 3; index += 1) {
          addSpark(new GoldSpark(mouse.x, mouse.y, vx * -0.15, vy * -0.15));
        }
      }
    },
    { passive: true }
  );

  window.addEventListener("mousedown", () => {
    isMouseDown = true;
  });

  window.addEventListener("mouseup", () => {
    isMouseDown = false;
    for (let index = 0; index < 20; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      addSpark(new GoldSpark(mouse.x, mouse.y, Math.cos(angle) * speed, Math.sin(angle) * speed - 1.5, true));
    }
  });

  window.addEventListener("blur", () => {
    isMouseDown = false;
  });
  window.addEventListener("resize", resizeCanvas);

  const animate = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter((particle) => {
      particle.update();
      particle.draw();
      return particle.alpha > 0;
    });
    mouse.x += (mouse.targetX - mouse.x) * 0.65;
    mouse.y += (mouse.targetY - mouse.y) * 0.65;
    if (mouse.targetX !== -100) drawActualQuill(ctx, mouse.x, mouse.y);
    requestAnimationFrame(animate);
  };

  resizeCanvas();
  animate();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const cleanText = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < cleanText.length; index += 1) {
    const char = cleanText[index];
    const next = cleanText[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows
    .filter((items) => items.some((item) => item.trim()))
    .map((items) =>
      Object.fromEntries(headers.map((header, index) => [header, items[index] || ""])),
    );
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/#/, "number")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeEnglishKey(value) {
  return String(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
