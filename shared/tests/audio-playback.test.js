const assert = require("node:assert/strict");
const test = require("node:test");

const {
  MINIMUM_INTERVAL_MS,
  SEQUENCE_GAP_MS,
  BUSY_DELAY_MS,
  createController,
  preloadLocalAudio,
  clearAudioCache,
} = require("../audio-playback.js");

function makeButton() {
  const classes = new Set();
  const attributes = new Map();
  return {
    classList: {
      toggle(name, active) {
        if (active) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    getAttribute(name) {
      return attributes.get(name);
    },
    title: "",
  };
}

test("uses an 800ms minimum interval", () => {
  assert.equal(MINIMUM_INTERVAL_MS, 800);
});

test("uses a half-second breath between sequence items", () => {
  assert.equal(SEQUENCE_GAP_MS, 500);
});

test("delays the loading treatment so fast cached playback does not flash busy", async () => {
  let showBusy;
  let resolveAction;
  const button = makeButton();
  const controller = createController({
    schedule(callback, ms) {
      assert.equal(ms, BUSY_DELAY_MS);
      showBusy = callback;
      return 1;
    },
    cancelSchedule() {},
  });
  const action = controller.runUserAction(button, () => new Promise((resolve) => {
    resolveAction = resolve;
  }));

  assert.equal(button.classList.contains("is-audio-loading"), false);
  showBusy();
  assert.equal(button.classList.contains("is-audio-loading"), true);
  resolveAction();
  await action;
  assert.equal(button.classList.contains("is-audio-loading"), false);
});

test("reuses one local Audio object for repeated playback and preload", () => {
  const OriginalAudio = globalThis.Audio;
  let created = 0;
  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.paused = true;
      this.ended = false;
      this.readyState = 0;
      this.loadCalls = 0;
      created += 1;
    }
    load() {
      this.loadCalls += 1;
    }
    pause() {}
  }

  globalThis.Audio = FakeAudio;
  clearAudioCache();
  try {
    const first = preloadLocalAudio("audio/example.mp3");
    const second = preloadLocalAudio("audio/example.mp3");
    assert.equal(first, second);
    assert.equal(created, 1);
    assert.equal(first.loadCalls, 1);
  } finally {
    clearAudioCache();
    globalThis.Audio = OriginalAudio;
  }
});

test("ignores a second click while the first audio request is still loading", async () => {
  let resolveFirst;
  let calls = 0;
  let clock = 0;
  const controller = createController({ now: () => clock });
  const first = controller.runUserAction(makeButton(), () => {
    calls += 1;
    return new Promise((resolve) => {
      resolveFirst = resolve;
    });
  });

  clock = 2000;
  const accepted = await controller.runUserAction(makeButton(), async () => {
    calls += 1;
  });
  assert.equal(accepted, false);
  assert.equal(calls, 1);

  resolveFirst();
  await first;
});

test("ignores rapid clicks after loading and accepts a later deliberate click", async () => {
  let clock = 1000;
  let calls = 0;
  const controller = createController({ now: () => clock });
  assert.equal(await controller.runUserAction(makeButton(), async () => { calls += 1; }), true);
  clock = 1799;
  assert.equal(await controller.runUserAction(makeButton(), async () => { calls += 1; }), false);
  clock = 1800;
  assert.equal(await controller.runUserAction(makeButton(), async () => { calls += 1; }), true);
  assert.equal(calls, 2);
});

test("sequence playback advances in order and internal items bypass the click interval", async () => {
  let clock = 0;
  const played = [];
  const gaps = [];
  const button = makeButton();
  const controller = createController({
    now: () => clock,
    delay: async (ms) => gaps.push(ms),
  });
  await controller.toggleSequence({
    button,
    items: ["one", "two", "three"],
    playItem: async (item) => played.push(item),
  });

  assert.deepEqual(played, ["one", "two", "three"]);
  assert.deepEqual(gaps, [500, 500]);
  assert.equal(button.classList.contains("is-playing"), false);
  assert.equal(button.getAttribute("aria-pressed"), "false");
});

test("sequence remains active until playback ends and can be stopped immediately", async () => {
  let resolveCurrent;
  const button = makeButton();
  const controller = createController({
    stopCurrent: () => resolveCurrent?.(),
  });
  const sequence = controller.toggleSequence({
    button,
    items: ["one"],
    playItem: () => new Promise((resolve) => {
      resolveCurrent = resolve;
    }),
  });

  assert.equal(button.classList.contains("is-playing"), true);
  assert.equal(button.getAttribute("aria-pressed"), "true");
  controller.stopSequence();
  await sequence;
  assert.equal(controller.isSequenceActive(), false);
  assert.equal(button.classList.contains("is-playing"), false);
  assert.equal(button.getAttribute("aria-pressed"), "false");
});

test("manual playback stops an active sequence before starting", async () => {
  let resolveCurrent;
  let stopped = 0;
  let manualCalls = 0;
  let clock = 0;
  const controller = createController({
    now: () => clock,
    stopCurrent: () => {
      stopped += 1;
      resolveCurrent?.();
    },
  });
  const sequence = controller.toggleSequence({
    button: makeButton(),
    items: ["one", "two"],
    playItem: () => new Promise((resolve) => {
      resolveCurrent = resolve;
    }),
  });

  clock = 800;
  assert.equal(await controller.runUserAction(makeButton(), async () => { manualCalls += 1; }), true);
  await sequence;
  assert.equal(manualCalls, 1);
  assert.equal(stopped, 2);
});
