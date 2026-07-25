(function initMusicalFeedback(global) {
  "use strict";

  const STYLE_ID = "musical-feedback-styles";
  const ROOT_CLASS = "musical-feedback";
  const DEFAULT_LABELS = {
    trigger: "反馈",
    title: "一键反馈",
    song: "选择歌曲",
    message: "反馈内容",
    placeholder: "可以填写网站建议、歌词更正或其他意见…",
    cancel: "取消",
    send: "发送",
    close: "关闭反馈弹窗",
    sending: "发送中…",
    success: "反馈已发送，谢谢你的帮助！",
    activation: "反馈已提交。首次使用需要站长先在收件邮箱完成服务激活。",
    error: "发送失败，请稍后再试。",
  };

  function normalizeId(value) {
    const normalized = String(value || "musical-feedback")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || "musical-feedback";
  }

  function normalizeSongs(songs) {
    return (Array.isArray(songs) ? songs : [])
      .map((song, index) => ({
        value: String(song.value ?? song.id ?? index + 1),
        label: String(song.label ?? song.title ?? `歌曲 ${index + 1}`),
      }))
      .filter((song) => song.label.trim());
  }

  function resolveEndpoint(options = {}) {
    if (options.endpoint) return String(options.endpoint);
    const recipient = String(options.recipient || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      throw new Error("MusicalFeedback requires a valid recipient or endpoint");
    }
    return `https://formsubmit.co/ajax/${recipient}`;
  }

  function buildPayload({ siteName, song, message, pageUrl, honey = "", subjectPrefix = "网站反馈" }) {
    const submittedAt = new Date().toISOString();
    return {
      _subject: `【${siteName}】${subjectPrefix}：${song.label}`,
      _template: "table",
      _honey: honey,
      _url: pageUrl,
      剧目: siteName,
      歌曲: song.label,
      反馈内容: message.trim(),
      页面: pageUrl,
      提交时间: submittedAt,
    };
  }

  async function submitFeedback(endpoint, payload, fetchImpl = global.fetch) {
    if (typeof fetchImpl !== "function") throw new Error("Fetch is unavailable");
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    const rejected = data.success === false || data.success === "false";
    if (!response.ok || rejected) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  }

  function renderMarkup(prefix, labels) {
    return `
      <button class="mf-trigger" type="button" data-mf-open>${labels.trigger}</button>
      <div class="mf-overlay" data-mf-overlay hidden>
        <section class="mf-dialog" role="dialog" aria-modal="true" aria-labelledby="${prefix}-title">
          <button class="mf-close" type="button" aria-label="${labels.close}" data-mf-close>×</button>
          <h2 id="${prefix}-title">${labels.title}</h2>
          <form data-mf-form novalidate>
            <label class="mf-field" for="${prefix}-song">
              <span>${labels.song}</span>
              <select id="${prefix}-song" data-mf-song></select>
            </label>
            <label class="mf-field" for="${prefix}-message">
              <span>${labels.message}</span>
              <textarea id="${prefix}-message" rows="7" maxlength="2000" placeholder="${labels.placeholder}" data-mf-message required></textarea>
            </label>
            <label class="mf-honey" aria-hidden="true">
              <span>Leave this field empty</span>
              <input type="text" autocomplete="off" tabindex="-1" data-mf-honey />
            </label>
            <p class="mf-status" role="status" aria-live="polite" data-mf-status></p>
            <div class="mf-actions">
              <button class="mf-button mf-button-secondary" type="button" data-mf-cancel>${labels.cancel}</button>
              <button class="mf-button mf-button-primary" type="submit" data-mf-submit disabled>${labels.send}</button>
            </div>
          </form>
        </section>
      </div>`;
  }

  function ensureStyles(documentRef) {
    if (documentRef.getElementById(STYLE_ID)) return;
    const style = documentRef.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      body.mf-modal-open { overflow: hidden; }
      .${ROOT_CLASS} {
        --mf-accent: var(--feedback-accent, var(--highlight, var(--gold-bright, var(--accent, #d7c7a1))));
        --mf-deep: var(--feedback-deep, var(--bg-deep, var(--bg, #062925)));
        --mf-surface: var(--feedback-surface, var(--surface, var(--panel, #103d37)));
        --mf-text: var(--ink, #f6f4ea);
        --mf-muted: var(--annotation, var(--muted, rgba(246, 244, 234, 0.72)));
        --mf-line: var(--line, rgba(215, 199, 161, 0.38));
        font-family: inherit;
      }
      .${ROOT_CLASS} *, .${ROOT_CLASS} *::before, .${ROOT_CLASS} *::after { box-sizing: border-box; }
      .${ROOT_CLASS} .mf-trigger {
        position: fixed;
        left: max(16px, env(safe-area-inset-left));
        bottom: max(16px, env(safe-area-inset-bottom));
        z-index: 8000;
        min-width: 70px;
        min-height: 42px;
        padding: 9px 16px;
        border: 1px solid var(--mf-line);
        border-radius: 999px;
        color: var(--mf-text);
        background: color-mix(in srgb, var(--mf-deep) 88%, transparent);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(10px);
        cursor: pointer;
        font: inherit;
        font-weight: 700;
      }
      .${ROOT_CLASS} .mf-trigger:hover { border-color: var(--mf-accent); }
      .${ROOT_CLASS} .mf-trigger:focus-visible,
      .${ROOT_CLASS} button:focus-visible,
      .${ROOT_CLASS} select:focus-visible,
      .${ROOT_CLASS} textarea:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--mf-accent) 55%, transparent);
        outline-offset: 2px;
      }
      .${ROOT_CLASS} .mf-overlay[hidden] { display: none; }
      .${ROOT_CLASS} .mf-overlay {
        position: fixed;
        inset: 0;
        z-index: 9000;
        display: grid;
        isolation: isolate;
        place-items: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.62);
      }
      .${ROOT_CLASS} .mf-dialog {
        position: relative;
        z-index: 1;
        isolation: isolate;
        width: min(520px, 100%);
        max-height: calc(100vh - 40px);
        overflow: auto;
        padding: 26px;
        border: 1px solid var(--mf-line);
        border-radius: 18px;
        color: var(--mf-text);
        background-color: var(--mf-deep);
        box-shadow: 0 28px 80px rgba(0, 0, 0, 0.46);
      }
      .${ROOT_CLASS} .mf-dialog h2 {
        margin: 0 42px 20px 0;
        color: var(--mf-accent);
        font-family: var(--font-song, var(--title-font, var(--font-serif, inherit)));
        font-size: 1.4rem;
        line-height: 1.3;
        letter-spacing: 0.08em;
      }
      .${ROOT_CLASS} .mf-close {
        position: absolute;
        top: 14px;
        right: 14px;
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: 1px solid var(--mf-line);
        border-radius: 999px;
        color: var(--mf-text);
        background: transparent;
        cursor: pointer;
        font: inherit;
        font-size: 1.35rem;
      }
      .${ROOT_CLASS} .mf-close:hover,
      .${ROOT_CLASS} .mf-close:focus-visible {
        color: var(--mf-deep);
        border-color: var(--mf-accent);
        background: var(--mf-accent);
        outline: none;
      }
      .${ROOT_CLASS} form {
        display: grid;
        gap: 16px;
        color: color-mix(in srgb, var(--mf-text) 90%, transparent);
        font-size: 0.92rem;
        line-height: 1.72;
      }
      .${ROOT_CLASS} .mf-field { display: grid; gap: 7px; }
      .${ROOT_CLASS} .mf-field > span { color: var(--mf-muted); font-size: 1em; }
      .${ROOT_CLASS} select,
      .${ROOT_CLASS} textarea {
        width: 100%;
        border: 1px solid var(--mf-line);
        border-radius: 10px;
        color: var(--mf-text);
        background: color-mix(in srgb, var(--mf-surface) 82%, var(--mf-deep));
        font: inherit;
      }
      .${ROOT_CLASS} select { min-height: 44px; padding: 9px 38px 9px 12px; }
      .${ROOT_CLASS} textarea { min-height: 150px; padding: 12px; resize: vertical; line-height: 1.72; }
      .${ROOT_CLASS} textarea::placeholder { color: var(--mf-muted); opacity: 0.72; }
      .${ROOT_CLASS} .mf-honey {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        clip: rect(0 0 0 0) !important;
        white-space: nowrap !important;
      }
      .${ROOT_CLASS} .mf-status { min-height: 1.4em; margin: 0; color: var(--mf-muted); font-size: 1em; }
      .${ROOT_CLASS} .mf-status.is-error { color: #ffb4ab; }
      .${ROOT_CLASS} .mf-status.is-success { color: var(--mf-accent); }
      .${ROOT_CLASS} .mf-actions { display: flex; justify-content: flex-end; gap: 10px; }
      .${ROOT_CLASS} .mf-button {
        min-height: 42px;
        padding: 9px 18px;
        border: 1px solid var(--mf-line);
        border-radius: 999px;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
      }
      .${ROOT_CLASS} .mf-button-secondary { color: var(--mf-text); background: transparent; }
      .${ROOT_CLASS} .mf-button-primary { color: var(--mf-deep); background: var(--mf-accent); }
      .${ROOT_CLASS} .mf-button:disabled { cursor: not-allowed; opacity: 0.48; }
      @media (max-width: 520px) {
        .${ROOT_CLASS} .mf-overlay { align-items: end; padding: 12px; }
        .${ROOT_CLASS} .mf-dialog { max-height: calc(100vh - 24px); padding: 20px; border-radius: 16px; }
        .${ROOT_CLASS} .mf-actions { display: grid; grid-template-columns: 1fr 1fr; }
        .${ROOT_CLASS} .mf-button { width: 100%; }
      }
      @media (prefers-reduced-motion: no-preference) {
        .${ROOT_CLASS} .mf-overlay { animation: mf-overlay-in 150ms ease-out; }
        .${ROOT_CLASS} .mf-dialog { animation: mf-dialog-in 180ms ease-out; }
        @keyframes mf-overlay-in { from { opacity: 0; } }
        @keyframes mf-dialog-in { from { opacity: 0; transform: translateY(10px) scale(0.985); } }
      }
    `;
    documentRef.head.append(style);
  }

  function mount(options = {}) {
    const documentRef = options.document || global.document;
    if (!documentRef?.body) throw new Error("MusicalFeedback.mount requires a document body");

    const songs = normalizeSongs(options.songs);
    if (!songs.length) throw new Error("MusicalFeedback requires at least one song");
    const prefix = normalizeId(options.id || options.siteName);
    const rootId = `${prefix}-feedback-root`;
    const existing = documentRef.getElementById(rootId);
    if (existing) return existing.__musicalFeedbackController;

    const labels = { ...DEFAULT_LABELS, ...(options.labels || {}) };
    const endpoint = options.transport ? "" : resolveEndpoint(options);
    ensureStyles(documentRef);

    const root = documentRef.createElement("div");
    root.id = rootId;
    root.className = ROOT_CLASS;
    root.innerHTML = renderMarkup(prefix, labels);
    documentRef.body.append(root);

    const refs = {
      trigger: root.querySelector("[data-mf-open]"),
      overlay: root.querySelector("[data-mf-overlay]"),
      dialog: root.querySelector(".mf-dialog"),
      form: root.querySelector("[data-mf-form]"),
      song: root.querySelector("[data-mf-song]"),
      message: root.querySelector("[data-mf-message]"),
      honey: root.querySelector("[data-mf-honey]"),
      status: root.querySelector("[data-mf-status]"),
      submit: root.querySelector("[data-mf-submit]"),
      cancel: root.querySelector("[data-mf-cancel]"),
      close: root.querySelector("[data-mf-close]"),
    };
    const externalTrigger = typeof options.trigger === "string"
      ? documentRef.querySelector(options.trigger)
      : options.trigger;
    const trigger = externalTrigger || refs.trigger;
    if (externalTrigger) refs.trigger.hidden = true;

    songs.forEach((song) => {
      const option = documentRef.createElement("option");
      option.value = song.value;
      option.textContent = song.label;
      refs.song.append(option);
    });
    function resolveSongValue(preferredValue) {
      const value = String(preferredValue ?? "");
      return songs.some((song) => song.value === value) ? value : songs[0].value;
    }

    function syncCurrentSongSelection() {
      const currentSongId = typeof options.getCurrentSongId === "function"
        ? options.getCurrentSongId()
        : options.defaultSong;
      refs.song.value = resolveSongValue(currentSongId ?? options.defaultSong);
    }

    syncCurrentSongSelection();

    let submitting = false;
    let lastActiveElement = null;

    function setStatus(message = "", type = "") {
      refs.status.textContent = message;
      refs.status.className = `mf-status${type ? ` is-${type}` : ""}`;
    }

    function updateSubmitState() {
      refs.submit.disabled = submitting || !refs.message.value.trim();
    }

    function open() {
      lastActiveElement = documentRef.activeElement;
      syncCurrentSongSelection();
      refs.overlay.hidden = false;
      documentRef.body.classList.add("mf-modal-open");
      setStatus();
      updateSubmitState();
      global.setTimeout(() => refs.message.focus(), 0);
    }

    function close() {
      if (submitting) return;
      refs.overlay.hidden = true;
      documentRef.body.classList.remove("mf-modal-open");
      setStatus();
      lastActiveElement?.focus?.();
    }

    function selectedSong() {
      return songs.find((song) => song.value === refs.song.value) || songs[0];
    }

    function handleKeydown(event) {
      if (refs.overlay.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...refs.dialog.querySelectorAll("button:not([disabled]), select:not([disabled]), textarea:not([disabled])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && documentRef.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && documentRef.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    trigger.addEventListener("click", open);
    refs.cancel.addEventListener("click", close);
    refs.close.addEventListener("click", close);
    refs.message.addEventListener("input", () => {
      setStatus();
      updateSubmitState();
    });
    refs.overlay.addEventListener("click", (event) => {
      if (event.target === refs.overlay) close();
    });
    documentRef.addEventListener("keydown", handleKeydown);
    refs.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = refs.message.value.trim();
      if (!message || submitting) return;

      submitting = true;
      refs.submit.textContent = labels.sending;
      refs.cancel.disabled = true;
      refs.close.disabled = true;
      updateSubmitState();
      setStatus(labels.sending);

      const payload = buildPayload({
        siteName: String(options.siteName || documentRef.title || "音乐剧歌词网页"),
        song: selectedSong(),
        message,
        pageUrl: String(options.pageUrl || global.location?.href || ""),
        honey: refs.honey.value,
        subjectPrefix: String(options.subjectPrefix || "网站反馈"),
      });

      try {
        const result = options.transport
          ? await options.transport(payload)
          : await submitFeedback(endpoint, payload, options.fetch || global.fetch);
        const responseMessage = String(result?.message || "");
        const needsActivation = /activat|confirm|验证|激活/i.test(responseMessage);
        setStatus(needsActivation ? labels.activation : labels.success, "success");
        refs.message.value = "";
      } catch (error) {
        const detail = error?.message ? ` ${error.message}` : "";
        setStatus(`${labels.error}${detail}`, "error");
      } finally {
        submitting = false;
        refs.submit.textContent = labels.send;
        refs.cancel.disabled = false;
        refs.close.disabled = false;
        updateSubmitState();
      }
    });

    const controller = {
      open,
      close,
      destroy() {
        trigger.removeEventListener("click", open);
        documentRef.removeEventListener("keydown", handleKeydown);
        documentRef.body.classList.remove("mf-modal-open");
        root.remove();
      },
    };
    root.__musicalFeedbackController = controller;
    return controller;
  }

  const api = Object.freeze({ buildPayload, mount, normalizeSongs, renderMarkup, resolveEndpoint, submitFeedback });
  global.MusicalFeedback = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
