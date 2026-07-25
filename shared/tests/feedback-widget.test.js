const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const widget = require("../feedback-widget.js");

test("resolves the static FormSubmit endpoint", () => {
  assert.equal(
    widget.resolveEndpoint({ recipient: "fulife@agent.qq.com" }),
    "https://formsubmit.co/ajax/fulife@agent.qq.com",
  );
});

test("builds an email payload with musical and song context", () => {
  const payload = widget.buildPayload({
    siteName: "大状王歌词粤拼",
    song: { value: "01-申冤", label: "1. 申冤" },
    message: "  第三句歌词需要核对。  ",
    pageUrl: "https://example.test/dazhuangwang/",
  });
  assert.equal(payload.剧目, "大状王歌词粤拼");
  assert.equal(payload.歌曲, "1. 申冤");
  assert.equal(payload.反馈内容, "第三句歌词需要核对。");
  assert.match(payload._subject, /大状王歌词粤拼.*1\. 申冤/);
});

test("submits JSON and surfaces service errors", async () => {
  let request;
  const success = await widget.submitFeedback("https://example.test/feedback", { message: "hello" }, async (url, init) => {
    request = { url, init };
    return { ok: true, json: async () => ({ success: "true" }) };
  });
  assert.equal(success.success, "true");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers.Accept, "application/json");
  assert.deepEqual(JSON.parse(request.init.body), { message: "hello" });

  await assert.rejects(
    () => widget.submitFeedback("https://example.test/feedback", {}, async () => ({
      ok: false,
      status: 422,
      json: async () => ({ success: false, message: "invalid" }),
    })),
    /invalid/,
  );
});

test("renders close, cancel, song, message, and disabled send controls", () => {
  const markup = widget.renderMarkup("dzw", {
    trigger: "反馈",
    title: "一键反馈",
    song: "选择歌曲",
    message: "反馈内容",
    placeholder: "请填写",
    cancel: "取消",
    send: "发送",
    close: "关闭",
  });
  assert.match(markup, /data-mf-overlay hidden/);
  assert.match(markup, /data-mf-close/);
  assert.match(markup, /data-mf-cancel/);
  assert.match(markup, /data-mf-song/);
  assert.match(markup, /data-mf-message/);
  assert.match(markup, /data-mf-submit disabled/);
});

test("shared feedback dialog uses the page's about-dialog typography", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../feedback-widget.js"), "utf8");
  assert.match(source, /--mf-accent: var\(--feedback-accent, var\(--highlight, var\(--gold-bright, var\(--accent/);
  assert.match(source, /font-family: var\(--font-song, var\(--title-font, var\(--font-serif, inherit\)\)\)/);
  assert.doesNotMatch(source, /body\.mf-modal-open #effectCanvas/);
  assert.doesNotMatch(source, /body\.mf-modal-open #rougeCursor/);
  assert.doesNotMatch(source, /cursor: auto !important/);
  assert.match(source, /font-size: 1\.4rem/);
  assert.match(source, /letter-spacing: 0\.08em/);
  assert.match(source, /padding: 26px/);
});

test("shared feedback dialog refreshes the selected song when opened", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../feedback-widget.js"), "utf8");
  assert.match(source, /options\.getCurrentSongId/);
  assert.match(source, /function syncCurrentSongSelection/);
  assert.match(source, /function open\(\) \{[\s\S]*syncCurrentSongSelection\(\);[\s\S]*refs\.overlay\.hidden = false/);
});

test("dazhuangwang page mounts the shared widget with all songs", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../../dazhuangwang/index.html"), "utf8");
  assert.match(page, /\.\.\/shared\/feedback-widget\.js/);
  assert.match(page, /if \(window\.MusicalFeedback\)/);
  assert.match(page, /recipient:\s*"fulife@agent\.qq\.com"/);
  assert.match(page, /trigger:\s*"#feedbackButton"/);
  assert.match(page, /window\.dazhuangwangSongs/);
  assert.match(page, /getCurrentSongId:\s*\(\) =>/);
  assert.match(page, /getCurrentSong\(\)\?\.id/);
});

test("Hamilton and Rouge et Noir mount feedback next to display controls", () => {
  const hamilton = fs.readFileSync(path.resolve(__dirname, "../../Hamilton/index.html"), "utf8");
  assert.match(hamilton, /data-toggle="showIpa"[\s\S]*id="feedbackButton"[^>]*>反馈<\/button>/);
  assert.match(hamilton, /\.\.\/shared\/feedback-widget\.js/);
  assert.match(hamilton, /window\.MusicalFeedback\.mount/);
  assert.match(hamilton, /window\.hamiltonLyricsRows/);
  assert.match(hamilton, /getCurrentSong\(\)\?\.id/);

  const rouge = fs.readFileSync(path.resolve(__dirname, "../../rouge-et-noir/index.html"), "utf8");
  const rougeStyle = fs.readFileSync(path.resolve(__dirname, "../../rouge-et-noir/style.css"), "utf8");
  assert.match(rouge, /data-toggle="showPhonetics"[\s\S]*id="feedbackButton"[^>]*>[\s\S]*反馈[\s\S]*<\/button>/);
  assert.match(rouge, /\.\.\/shared\/feedback-widget\.js/);
  assert.match(rouge, /window\.MusicalFeedback\.mount/);
  assert.match(rouge, /window\.songs/);
  assert.match(rouge, /getCurrentSong\(\)\?\.id/);
  assert.match(rougeStyle, /--feedback-accent:\s*var\(--gold-soft\)/);
  assert.match(rougeStyle, /--feedback-deep:\s*#14090a/);
});

test("dazhuangwang header orders jyutping, feedback, and about controls", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../../dazhuangwang/index.html"), "utf8");
  assert.doesNotMatch(page, /内容仅供参考/);
  assert.match(page, /class="title-dragonfly"[^>]+src="assets\/dragonfly-title\.png"/);
  assert.match(page, /data-toggle="showJyutping"[\s\S]*id="feedbackButton"[\s\S]*id="aboutButton"/);
  assert.match(page, /id="aboutOverlay"[\s\S]*role="dialog"/);
  assert.match(page, /《大状王》场刊/);
  assert.match(page, /https:\/\/xhslink\.com\/m\/3Daf2cCrRFx/);
  assert.match(page, /内容整理与网页制作：[\s\S]*>阿浮在剧院<\/a>/);
  assert.match(page, /粤拼标注及网站由<a[^>]+3Daf2cCrRFx[^>]*>阿浮在剧院<\/a>基于个人兴趣制作/);
  assert.match(page, /https:\/\/xhslink\.com\/m\/6LcXtrmWzER/);
  assert.match(page, /https:\/\/xhslink\.com\/m\/6T6gOmMV9QF/);
  assert.doesNotMatch(page, />晨小魚<\/a>/);
  assert.match(page, /粤拼校对：[\s\S]*晨小魚Vega Chan<\/a>/);
  assert.match(page, /注释及典故：[\s\S]*晨小魚Vega Chan<\/a>、<a[^>]+6T6gOmMV9QF[^>]*>鱼冻<\/a>/);
  assert.match(page, /https:\/\/bcn3wq3y5frs\.feishu\.cn\/wiki\/space\/7660416182926789820/);
});

test("dazhuangwang about dialog keeps its close button visible on mobile", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../../dazhuangwang/index.html"), "utf8");
  assert.match(page, /class="about-header"[\s\S]*id="aboutClose"/);
  assert.match(page, /\.about-dialog\s*\{[\s\S]*max-height:\s*calc\(100dvh - 40px\)[\s\S]*overflow:\s*hidden/);
  assert.match(page, /\.about-content\s*\{[\s\S]*overflow-y:\s*auto/);
});

test("dazhuangwang renders collapsible song-level annotations above lyrics", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../../dazhuangwang/index.html"), "utf8");
  const songsSource = fs.readFileSync(path.resolve(__dirname, "../../dazhuangwang/songs.js"), "utf8");
  assert.match(page, /id="songAnnotations"[^>]+aria-label="本首歌注释"/);
  assert.match(page, /function renderSongAnnotations/);
  assert.match(page, /function collectSongAnnotations/);
  assert.match(page, /song\.annotations \|\| song\.notes \|\| song\.footnotes/);
  assert.match(songsSource, /"annotations":\[/);
  assert.doesNotMatch(page, /const dazhuangwangSongAnnotations =/);
  assert.doesNotMatch(page, /normalizeAnnotationEntries\(line\.analysis\?\.words\)/);
  assert.match(page, /className = "annotation-toggle"/);
  assert.match(page, /textContent = collapsed \? "展开" : "收起"/);
  assert.match(page, /state\.collapsedAnnotations\[song\.id\] !== false/);
  assert.match(page, /state\.collapsedAnnotations\[song\.id\] = !collapsed/);
  assert.match(page, /\.annotation-term::after[\s\S]*content: "："/);
  assert.match(page, /className = "annotation-term-text"/);
  assert.match(page, /\.annotation-term\.is-jump-link \.annotation-term-text/);

  const sandbox = { window: {} };
  require("node:vm").runInNewContext(songsSource, sandbox);
  const songs = sandbox.window.dazhuangwangSongs;
  const expected = [
    [1, "郇", "郇嘢"],
    [5, "打小人", "心理转运"],
    [10, "贔屭", "龙生九子"],
  ];
  expected.forEach(([order, term, meaningFragment]) => {
    const song = songs.find((item) => item.order === order);
    const annotation = song?.annotations?.find((item) => item.term === term);
    assert.ok(annotation, `M${String(order).padStart(2, "0")} 本首注释缺少 ${term}`);
    assert.match(annotation.meaning, new RegExp(meaningFragment));
  });
});

test("dazhuangwang renders a second annotation collapse control below the list", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../../dazhuangwang/index.html"), "utf8");
  assert.match(page, /bottomToggle\.className = "annotation-toggle annotation-toggle-bottom"/);
  assert.match(page, /bottomToggle\.textContent = "↑"/);
  assert.match(page, /bottomToggle\.setAttribute\("aria-label", "收起本首注释"\)/);
  assert.match(page, /bottomToggle\.addEventListener\("click", toggleAnnotations\)/);
  assert.match(page, /refs\.songAnnotations\.append\(head, summary, list, footer\)/);
  assert.match(page, /\.song-annotations\.is-collapsed \.annotation-footer\s*\{\s*display:\s*none/);
});

test("dazhuangwang word cards use the currently visible simplified or traditional term", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../../dazhuangwang/index.html"), "utf8");
  assert.match(page, /const visibleWord = \[\.\.\.anchor\.closest\("\.token-wrap"\)\.querySelectorAll/);
  assert.match(page, /title\.textContent = visibleWord \|\| word\.term/);
});
