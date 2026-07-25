(function initMusicalAudio(globalScope) {
  const MINIMUM_INTERVAL_MS = 800;
  const SEQUENCE_GAP_MS = 500;
  const BUSY_DELAY_MS = 160;
  const AUDIO_CACHE_LIMIT = 96;
  const audioCache = new Map();
  const preloadRequests = new WeakSet();

  function trimAudioCache() {
    for (const [key, audio] of audioCache) {
      if (audioCache.size <= AUDIO_CACHE_LIMIT) break;
      if (!audio.paused && !audio.ended) continue;
      audioCache.delete(key);
    }
  }

  function getCachedAudio(src) {
    if (!src) return null;
    const key = String(src);
    let audio = audioCache.get(key);
    if (audio?.error) {
      audioCache.delete(key);
      audio = null;
    }
    if (!audio) {
      if (typeof globalScope.Audio !== "function") return null;
      audio = new globalScope.Audio(key);
      audio.preload = "auto";
    } else {
      audioCache.delete(key);
    }
    audioCache.set(key, audio);
    trimAudioCache();
    return audio;
  }

  function preloadLocalAudio(src) {
    const audio = getCachedAudio(src);
    if (audio?.readyState === 0 && !preloadRequests.has(audio)) {
      preloadRequests.add(audio);
      audio.load?.();
    }
    return audio;
  }

  function clearAudioCache() {
    audioCache.forEach((audio) => audio.pause?.());
    audioCache.clear();
  }

  function setButtonBusy(button, busy) {
    if (!button) return;
    button.classList.toggle("is-audio-loading", busy);
    if (busy) {
      button.setAttribute("aria-busy", "true");
    } else {
      button.removeAttribute("aria-busy");
    }
  }

  function setSequenceButton(button, active) {
    if (!button) return;
    button.classList.toggle("is-playing", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", active ? "停止连续播放本曲" : "连续播放本曲");
    button.title = active ? "停止连续播放本曲" : "连续播放本曲";
  }

  function createController(options = {}) {
    const minimumIntervalMs = options.minimumIntervalMs ?? MINIMUM_INTERVAL_MS;
    const now = options.now || (() => globalScope.performance.now());
    const delay = options.delay || ((ms) => new Promise((resolve) => globalScope.setTimeout(resolve, ms)));
    const busyDelayMs = options.busyDelayMs ?? BUSY_DELAY_MS;
    const schedule = options.schedule || ((callback, ms) => globalScope.setTimeout(callback, ms));
    const cancelSchedule = options.cancelSchedule || ((timer) => globalScope.clearTimeout(timer));
    const stopCurrent = options.stopCurrent || (() => {});
    let lastAcceptedAt = Number.NEGATIVE_INFINITY;
    let userRequestPending = false;
    let sequenceActive = false;
    let sequenceToken = 0;
    let sequenceButton = null;

    function stopSequence() {
      if (!sequenceActive) return false;
      sequenceActive = false;
      sequenceToken += 1;
      stopCurrent();
      setSequenceButton(sequenceButton, false);
      sequenceButton = null;
      options.onSequenceStateChange?.(false);
      options.onItemClear?.();
      return true;
    }

    function stopAll() {
      if (!stopSequence()) {
        sequenceToken += 1;
        stopCurrent();
        options.onItemClear?.();
      }
    }

    async function runUserAction(button, action) {
      const acceptedAt = now();
      if (userRequestPending || acceptedAt - lastAcceptedAt < minimumIntervalMs) {
        return false;
      }

      lastAcceptedAt = acceptedAt;
      stopSequence();
      userRequestPending = true;
      let busyTimer = null;
      if (busyDelayMs <= 0) {
        setButtonBusy(button, true);
      } else {
        busyTimer = schedule(() => {
          busyTimer = null;
          if (userRequestPending) setButtonBusy(button, true);
        }, busyDelayMs);
      }
      try {
        await action();
        return true;
      } finally {
        if (busyTimer !== null) cancelSchedule(busyTimer);
        userRequestPending = false;
        setButtonBusy(button, false);
      }
    }

    function toggleSequence({
      button,
      items,
      playItem,
      onItemStart,
      onItemEnd,
      onItemError,
      onComplete,
      gapMs = SEQUENCE_GAP_MS,
    }) {
      if (sequenceActive) {
        stopSequence();
        return Promise.resolve(false);
      }

      const acceptedAt = now();
      if (userRequestPending || acceptedAt - lastAcceptedAt < minimumIntervalMs) {
        return Promise.resolve(false);
      }

      lastAcceptedAt = acceptedAt;
      stopCurrent();
      sequenceActive = true;
      sequenceButton = button || null;
      const token = ++sequenceToken;
      setSequenceButton(sequenceButton, true);
      options.onSequenceStateChange?.(true);

      return (async () => {
        for (let index = 0; index < items.length; index += 1) {
          if (!sequenceActive || token !== sequenceToken) break;
          const item = items[index];
          onItemStart?.(item, index, items[index + 1] || null);
          try {
            await playItem(item, index);
          } catch (error) {
            onItemError?.(error, item, index);
          }
          onItemEnd?.(item, index);
          const hasNextItem = index < items.length - 1;
          if (hasNextItem && gapMs > 0 && sequenceActive && token === sequenceToken) {
            await delay(gapMs);
          }
        }

        if (sequenceActive && token === sequenceToken) {
          sequenceActive = false;
          setSequenceButton(sequenceButton, false);
          sequenceButton = null;
          options.onSequenceStateChange?.(false);
          options.onItemClear?.();
          onComplete?.();
        }
        return true;
      })();
    }

    return {
      runUserAction,
      toggleSequence,
      stopSequence,
      stopAll,
      isSequenceActive: () => sequenceActive,
      isUserRequestPending: () => userRequestPending,
    };
  }

  const api = {
    MINIMUM_INTERVAL_MS,
    SEQUENCE_GAP_MS,
    BUSY_DELAY_MS,
    AUDIO_CACHE_LIMIT,
    createController,
    getCachedAudio,
    preloadLocalAudio,
    clearAudioCache,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  globalScope.MusicalAudio = api;
})(typeof window !== "undefined" ? window : globalThis);
