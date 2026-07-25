(function () {
  const groupsRoot = document.querySelector("#languageGroups");
  const countNode = document.querySelector("#showCount");
  const prefetchedPages = new Set();

  function appendCoverTitle(cover, show) {
    if (show.image) {
      const image = document.createElement("img");
      image.className = "show-logo";
      image.src = show.image;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      cover.append(image);
      return;
    }

    const title = document.createElement("div");
    title.className = "cover-title";
    const strong = document.createElement("strong");
    show.coverLines.forEach((line, index) => {
      if (index > 0) strong.append(document.createElement("br"));
      strong.append(document.createTextNode(line));
    });
    const originalTitle = document.createElement("span");
    originalTitle.textContent = show.originalTitle;
    title.append(strong, originalTitle);
    cover.append(title);
  }

  function prefetchShowPage(show) {
    if (window.location.protocol === "file:") return;

    [show.href, ...(show.prefetch || [])].forEach((href) => {
      if (prefetchedPages.has(href)) return;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      document.head.append(link);
      prefetchedPages.add(href);
    });
  }

  function createCard(show) {
    const card = document.createElement("a");
    card.className = `show-card ${show.cardClass}`;
    card.href = show.href;

    const cover = document.createElement("div");
    cover.className = "cover";
    cover.setAttribute("aria-hidden", "true");
    appendCoverTitle(cover, show);

    const copy = document.createElement("div");
    copy.className = "show-copy";
    const meta = document.createElement("span");
    meta.className = "show-meta";
    meta.textContent = show.meta.join(" / ");
    const title = document.createElement("strong");
    title.textContent = show.title;
    copy.append(meta, title);
    card.append(cover, copy);
    card.addEventListener("pointerenter", () => prefetchShowPage(show), { once: true });
    card.addEventListener("focus", () => prefetchShowPage(show), { once: true });
    return card;
  }

  function createGroup(language, shows) {
    const section = document.createElement("section");
    section.className = "language-group";
    section.setAttribute("aria-labelledby", `${language.id}-heading`);

    const heading = document.createElement("div");
    heading.className = "language-heading";
    const title = document.createElement("h2");
    title.id = `${language.id}-heading`;
    title.textContent = language.label;
    const count = document.createElement("span");
    count.textContent = `${shows.length} 部`;
    heading.append(title, count);

    const displayCase = document.createElement("div");
    displayCase.className = "display-case";
    const collection = document.createElement("div");
    collection.className = "collection";
    collection.append(...shows.map(createCard));
    displayCase.append(collection);
    section.append(heading, displayCase);
    return section;
  }

  function renderLibrary() {
    const availableShows = window.location.protocol === "file:"
      ? window.libraryShows
      : window.libraryShows.filter((show) => show.deployed);

    countNode.textContent = String(availableShows.length);
    const groups = window.libraryLanguages.flatMap((language) => {
      const shows = availableShows.filter((show) => show.language === language.id);
      return shows.length ? [createGroup(language, shows)] : [];
    });
    groupsRoot.replaceChildren(...groups);
  }

  renderLibrary();
})();
