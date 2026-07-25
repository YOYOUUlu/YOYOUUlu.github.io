const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const CURSOR_ASSET_VERSION = "20260715-reference-6";
const LYRICS_ROOT = path.resolve(ROOT, "..", "lyrics");
const ROUGE_SCRIPT = path.join(ROOT, "rouge-et-noir", "script.js");
const ROUGE_SONGS = path.join(ROOT, "rouge-et-noir", "songs.js");
const FREEDICT_GLOSSARY = path.join(ROOT, "scripts", "freedict-french-glossary.json");
const GOOGLE_ENGLISH_GLOSSARY = path.join(ROOT, "scripts", "google-english-glossary.json");
const AUTO_WORD_GLOSSARY = path.join(ROOT, "scripts", "auto-word-glossary.json");
const MANUAL_WORD_GLOSSARY = path.join(ROOT, "scripts", "manual-word-overrides.json");
const WAVE2_MANUAL_WORD_GLOSSARY = path.join(ROOT, "scripts", "manual-word-overrides-wave2.json");
const ELISION_WORD_GLOSSARY = path.join(ROOT, "scripts", "elision-word-overrides.json");
const LINE_MERGE_OVERRIDES = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts", "line-merge-overrides.json"), "utf8"),
);
const MERGED_LINE_TEXT_OVERRIDES = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts", "merged-line-text-overrides.json"), "utf8"),
);

const SHOWS = [
  {
    slug: "notre-dame-de-paris",
    source: "Notre-Dame de Paris (501410).md",
    title: "Notre-Dame de Paris",
    titleZh: "巴黎圣母院",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "roseWindow", trail: "stoneDust", click: "roseWindowGlow", primary: "#b98a54", secondary: "#d9c39a" },
    theme: {
      bg: "#120806",
      panel: "#23110b",
      accent: "#d74d2f",
      highlight: "#d9a85f",
      ink: "#f8efe3",
      muted: "rgba(248, 239, 227, 0.68)",
      serif: '"Times New Roman", "Songti SC", serif',
    },
  },
  {
    slug: "les-miserables",
    source: "Les Miserables - The Musical That Swept the World (10th Anniversary Concert at the Royal Albert Hall (501546).md",
    title: "Les Misérables",
    titleZh: "悲惨世界",
    language: "en",
    voice: "en-us",
    audioVoice: "Samantha",
    logo: "assets/show-logo.png",
    showEnglishToggle: false,
    effect: { icon: "flag", trail: "smoke", click: "dawnRays", primary: "#c92535", secondary: "#f1d792" },
    theme: {
      bg: "#071021",
      panel: "#101827",
      accent: "#b8202e",
      highlight: "#d6b25e",
      ink: "#f3ead7",
      muted: "rgba(243, 234, 215, 0.7)",
      serif: 'Garamond, "Times New Roman", "Songti SC", serif',
    },
  },
  {
    slug: "mozart-opera-rock",
    source: "Mozart L'opera Rock (Complete Recording) (500659).md",
    title: "Mozart, l'opéra rock",
    titleZh: "摇滚莫扎特",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "musicNote", trail: "staffGlow", click: "inkDrops", primary: "#f03c96", secondary: "#60e6d1" },
    theme: {
      bg: "#06141b",
      panel: "#0b2230",
      accent: "#f03c96",
      highlight: "#e8eef2",
      ink: "#f4fbff",
      muted: "rgba(244, 251, 255, 0.66)",
      serif: 'Montserrat, "Avenir Next", "PingFang SC", sans-serif',
    },
  },
  {
    slug: "romeo-et-juliette",
    source: "Roméo & Juliette de la Haine à l'Amour en Live (145210).md",
    title: "Roméo et Juliette",
    titleZh: "罗密欧与朱丽叶",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "rose", trail: "petals", click: "loveRipples", primary: "#b91932", secondary: "#3159b7" },
    theme: {
      bg: "#06133a",
      panel: "#0d1e4d",
      accent: "#c91f2c",
      highlight: "#f7f1ee",
      ink: "#f5f7ff",
      muted: "rgba(245, 247, 255, 0.68)",
      serif: '"Cormorant Garamond", "Times New Roman", "Songti SC", serif',
    },
  },
  {
    slug: "le-roi-soleil",
    source: "Le Roi Soleil (Le spectacle original) [L'intégrale] (501009).md",
    title: "Le Roi Soleil",
    titleZh: "太阳王",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "sun", trail: "goldDust", click: "sunHalo", primary: "#e6bd57", secondary: "#fff1b0" },
    theme: {
      bg: "#071a48",
      panel: "#102b68",
      accent: "#f5c542",
      highlight: "#e05222",
      ink: "#fff7d6",
      muted: "rgba(255, 247, 214, 0.7)",
      serif: '"Playfair Display", "Times New Roman", "Songti SC", serif',
    },
  },
  {
    slug: "1789-les-amants-de-la-bastille",
    source: "1789_ Les Amants de La Bastille (Intégrale Deluxe) (34515302).md",
    title: "1789: Les Amants de la Bastille",
    titleZh: "1789：巴士底狱的恋人",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "cocarde", trail: "revolutionDust", click: "revolutionGlow", primary: "#b72e38", secondary: "#f2e7d3" },
    theme: {
      bg: "#21090d",
      panel: "#3b1118",
      accent: "#b72e38",
      highlight: "#f2e7d3",
      ink: "#f6efe6",
      muted: "rgba(242, 231, 211, 0.7)",
      serif: 'Oswald, Arial, "PingFang SC", sans-serif',
    },
  },
  {
    slug: "don-juan",
    source: "Don Juan (Les plus grands succès du spectacle musical de Félix Gray) (39727394).md",
    title: "Don Juan",
    titleZh: "唐璜",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "rapier", trail: "bladeGlint", click: "crossedBlades", primary: "#8d1627", secondary: "#e8d6b2" },
    theme: {
      bg: "#050813",
      panel: "#0d1220",
      accent: "#c51622",
      highlight: "#d8dce8",
      ink: "#f5f1e8",
      muted: "rgba(245, 241, 232, 0.68)",
      serif: 'Georgia, "Songti SC", serif',
    },
  },
  {
    slug: "moliere-le-spectacle-musical",
    source: "Molière, le spectacle musical (185278333).md",
    title: "Molière",
    titleZh: "莫里哀",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "mask", trail: "spotlight", click: "curtainFold", primary: "#dc712c", secondary: "#75a5d8" },
    theme: {
      bg: "#061b4f",
      panel: "#0d2d75",
      accent: "#e7762e",
      highlight: "#f1d2aa",
      ink: "#f8fbff",
      muted: "rgba(248, 251, 255, 0.68)",
      serif: 'Poppins, "Avenir Next", "PingFang SC", sans-serif',
    },
  },
  {
    slug: "cyrano-de-bergerac",
    source: "Cyrano de Bergerac Le Spectacle Musical (146352430).md",
    title: "Cyrano de Bergerac",
    titleZh: "大鼻子情圣",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "moon", trail: "letters", click: "letterfall", primary: "#d8bfa0", secondary: "#8f3542" },
    theme: {
      bg: "#12080b",
      panel: "#241116",
      accent: "#8f3542",
      highlight: "#d8bfa0",
      ink: "#f4ece4",
      muted: "rgba(226, 210, 200, 0.72)",
      serif: 'Lora, "Times New Roman", "Songti SC", serif',
    },
  },
  {
    slug: "moulin-rouge",
    source: "Moulin Rouge! The Musical (Original Broadway Cast Recording) (81375858).md",
    title: "Moulin Rouge! The Musical",
    titleZh: "红磨坊",
    language: "en",
    voice: "en-us",
    audioVoice: "Samantha",
    logo: "assets/show-logo.png",
    showEnglishToggle: false,
    effect: { icon: "stage", trail: "cabaretGlow", click: "marqueeBurst", primary: "#d5233f", secondary: "#f4c76f" },
    theme: {
      bg: "#0b0205",
      panel: "#24070d",
      accent: "#e21d2a",
      highlight: "#d9a34b",
      ink: "#fff3df",
      muted: "rgba(244, 218, 184, 0.74)",
      line: "rgba(217, 163, 75, 0.32)",
      shadow: "rgba(0, 0, 0, 0.56)",
      bodyFont: '"Avenir Next", Avenir, "PingFang SC", sans-serif',
      displayFont: '"Bodoni 72 Smallcaps", "Bodoni 72", Didot, Georgia, serif',
      lyricFont: '"Bodoni 72", Didot, Georgia, "Songti SC", serif',
      radius: "6px",
      titleTracking: "0.015em",
      bodyPattern: "repeating-linear-gradient(90deg, transparent 0 58px, rgba(217, 163, 75, 0.035) 59px 60px), radial-gradient(ellipse at 50% -8%, rgba(226, 29, 42, 0.25), transparent 36rem)",
      heroPattern: "linear-gradient(128deg, rgba(226, 29, 42, 0.2), transparent 42%), repeating-linear-gradient(90deg, rgba(217, 163, 75, 0.055) 0 1px, transparent 1px 18px)",
      visualPattern: "linear-gradient(145deg, rgba(226, 29, 42, 0.2), transparent 48%), radial-gradient(circle at 50% 22%, rgba(217, 163, 75, 0.2), transparent 58%)",
      visualFilter: "drop-shadow(0 16px 22px rgba(0, 0, 0, 0.5)) saturate(1.08)",
    },
  },
  {
    slug: "elisabeth-das-musical",
    source: "Elisabeth - Das Musical - Gesamtaufnahme Live - Jubiläumsfassung (37313354).md",
    title: "Elisabeth",
    titleZh: "伊丽莎白",
    language: "de",
    voice: "de",
    audioVoice: "Anna",
    logo: "assets/show-logo.png",
    effect: { icon: "quill", trail: "silverDust", click: "crownGlow", primary: "#b5b2bf", secondary: "#d8b56d" },
    theme: {
      bg: "#07060d",
      panel: "#15121f",
      accent: "#67547e",
      highlight: "#e6e2ed",
      ink: "#f8f5fb",
      muted: "rgba(205, 197, 218, 0.72)",
      line: "rgba(190, 181, 208, 0.28)",
      shadow: "rgba(0, 0, 0, 0.58)",
      bodyFont: '"Avenir Next", Avenir, "PingFang SC", sans-serif',
      displayFont: '"Snell Roundhand", "Apple Chancery", cursive',
      lyricFont: 'Baskerville, "Iowan Old Style", Georgia, "Songti SC", serif',
      radius: "4px",
      titleTracking: "0.012em",
      bodyPattern: "repeating-linear-gradient(105deg, transparent 0 42px, rgba(163, 145, 190, 0.025) 43px 44px), radial-gradient(ellipse at 82% 0%, rgba(103, 84, 126, 0.26), transparent 34rem)",
      heroPattern: "conic-gradient(from 205deg at 88% 108%, rgba(159, 139, 184, 0.16), transparent 8deg 18deg, rgba(230, 226, 237, 0.055) 19deg 23deg, transparent 24deg 35deg), linear-gradient(118deg, rgba(36, 25, 52, 0.82), transparent 58%)",
      visualPattern: "conic-gradient(from 205deg at 50% 110%, rgba(159, 139, 184, 0.2), transparent 8deg 18deg, rgba(230, 226, 237, 0.08) 19deg 23deg, transparent 24deg 35deg)",
      visualFilter: "drop-shadow(0 18px 24px rgba(0, 0, 0, 0.62)) contrast(1.06)",
    },
  },
  {
    slug: "starmania",
    source: "Starmania (Live Intégral 1979) (179767).md",
    title: "Starmania",
    titleZh: "星幻",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "musicNote", trail: "neonTrail", click: "starBurst", primary: "#3fb6d8", secondary: "#f0d65d" },
    theme: {
      bg: "#051019",
      panel: "#102637",
      accent: "#4b9fbd",
      highlight: "#d7edf3",
      ink: "#f5fbfd",
      muted: "rgba(190, 216, 226, 0.73)",
      line: "rgba(135, 199, 219, 0.3)",
      shadow: "rgba(0, 8, 16, 0.55)",
      bodyFont: '"Avenir Next", Avenir, "PingFang SC", sans-serif',
      displayFont: '"Avenir Next Condensed", "Arial Narrow", "DIN Condensed", sans-serif',
      lyricFont: '"Avenir Next", Avenir, "PingFang SC", sans-serif',
      radius: "2px",
      titleTracking: "0.055em",
      bodyPattern: "linear-gradient(112deg, transparent 0 40%, rgba(126, 205, 228, 0.1) 40.5% 41%, transparent 41.5%), repeating-linear-gradient(90deg, transparent 0 66px, rgba(190, 225, 235, 0.025) 67px 68px)",
      heroPattern: "linear-gradient(112deg, transparent 0 38%, rgba(145, 218, 236, 0.16) 38.5% 39%, transparent 39.5%), linear-gradient(180deg, rgba(75, 159, 189, 0.13), transparent 56%)",
      visualPattern: "linear-gradient(112deg, transparent 0 44%, rgba(210, 241, 248, 0.18) 44.5% 45%, transparent 45.5%), linear-gradient(180deg, rgba(75, 159, 189, 0.2), transparent 66%)",
      visualFit: "cover",
      visualPosition: "50% 18%",
      visualWidth: "100%",
      visualHeight: "100%",
      visualTabletHeight: "340px",
      visualPadding: "0px",
      visualFrameRadius: "1px",
      visualFilter: "saturate(0.9) contrast(1.08)",
    },
  },
  {
    slug: "mozart-das-musical",
    source: "Mozart!-Das Musical-Gesamtaufnahme (Original Cast Wien) (35123377).md",
    title: "Mozart! Das Musical",
    titleZh: "莫扎特！",
    language: "de",
    voice: "de",
    audioVoice: "Anna",
    logo: "assets/show-logo.png",
    effect: { icon: "quill", trail: "inkTrail", click: "scoreBurst", primary: "#d6a52f", secondary: "#f2ead5" },
    theme: {
      bg: "#100d0f",
      panel: "#241a1d",
      accent: "#c91d2b",
      highlight: "#f0e9e2",
      ink: "#fff9f2",
      muted: "rgba(221, 207, 202, 0.72)",
      line: "rgba(225, 205, 201, 0.28)",
      shadow: "rgba(0, 0, 0, 0.54)",
      bodyFont: '"Avenir Next", Avenir, "PingFang SC", sans-serif',
      displayFont: '"Noteworthy", "Bradley Hand", "Marker Felt", cursive',
      lyricFont: 'Baskerville, "Iowan Old Style", Georgia, "Songti SC", serif',
      radius: "5px",
      titleTracking: "0.006em",
      bodyPattern: "linear-gradient(118deg, transparent 0 22%, rgba(201, 29, 43, 0.1) 22.5% 23%, transparent 23.5% 72%, rgba(240, 233, 226, 0.035) 72.5% 73%, transparent 73.5%), radial-gradient(ellipse at 12% 0%, rgba(201, 29, 43, 0.18), transparent 30rem)",
      heroPattern: "linear-gradient(118deg, rgba(201, 29, 43, 0.17) 0 1.5%, transparent 2% 68%, rgba(240, 233, 226, 0.055) 68.5% 69%, transparent 69.5%), linear-gradient(145deg, rgba(46, 31, 36, 0.9), transparent 68%)",
      visualPattern: "linear-gradient(118deg, rgba(201, 29, 43, 0.18) 0 2%, transparent 2.5% 72%, rgba(240, 233, 226, 0.07) 72.5% 73.5%, transparent 74%)",
      visualFilter: "drop-shadow(0 16px 20px rgba(0, 0, 0, 0.52)) contrast(1.04)",
    },
  },
  {
    slug: "phantom-of-the-opera",
    source: "Phantom Of The Opera (25th Anniversary Box Set_ 4CD) (103948).md",
    title: "The Phantom of the Opera",
    titleZh: "剧院魅影",
    language: "en",
    voice: "en-us",
    audioVoice: "Samantha",
    logo: "assets/show-logo.png",
    sourceOrderMax: 21,
    showEnglishToggle: false,
    effect: { icon: "rose", trail: "candleSmoke", click: "chandelierGlow", primary: "#c7ab67", secondary: "#f1eee7" },
    theme: {
      bg: "#030303",
      panel: "#111011",
      accent: "#7d1119",
      highlight: "#f0edef",
      ink: "#fbf8f5",
      muted: "rgba(207, 201, 202, 0.7)",
      line: "rgba(229, 224, 225, 0.25)",
      shadow: "rgba(0, 0, 0, 0.68)",
      bodyFont: '"Avenir Next", Avenir, "PingFang SC", sans-serif',
      displayFont: 'Didot, "Bodoni 72", Georgia, serif',
      lyricFont: '"Iowan Old Style", Baskerville, Georgia, "Songti SC", serif',
      radius: "2px",
      titleTracking: "0.018em",
      bodyPattern: "repeating-radial-gradient(circle at 84% -8%, transparent 0 34px, rgba(240, 237, 239, 0.025) 35px 36px), linear-gradient(128deg, rgba(125, 17, 25, 0.12), transparent 32%)",
      heroPattern: "repeating-radial-gradient(circle at 88% 0%, transparent 0 28px, rgba(240, 237, 239, 0.04) 29px 30px), linear-gradient(122deg, rgba(125, 17, 25, 0.16), transparent 45%)",
      visualPattern: "repeating-radial-gradient(circle at 50% -18%, transparent 0 23px, rgba(240, 237, 239, 0.075) 24px 25px), radial-gradient(circle at 50% 32%, rgba(125, 17, 25, 0.13), transparent 60%)",
      visualFilter: "drop-shadow(0 18px 24px rgba(0, 0, 0, 0.7)) contrast(1.12)",
    },
  },
  {
    slug: "love-never-dies",
    contentSlug: "phantom-of-the-opera",
    source: "Phantom Of The Opera (25th Anniversary Box Set_ 4CD) (103948).md",
    title: "Love Never Dies",
    titleZh: "真爱不死",
    language: "en",
    voice: "en-us",
    audioVoice: "Samantha",
    logo: "assets/show-logo.png",
    sourceOrderMin: 22,
    showEnglishToggle: false,
    effect: { icon: "rose", trail: "candleSmoke", click: "chandelierGlow", primary: "#4c9cc0", secondary: "#e8f4f7" },
    theme: {
      bg: "#080329",
      panel: "#1a1045",
      accent: "#7454ae",
      highlight: "#e2b15d",
      ink: "#faf6ff",
      muted: "rgba(217, 205, 236, 0.75)",
      line: "rgba(209, 181, 225, 0.3)",
      shadow: "rgba(2, 0, 24, 0.62)",
      bodyFont: '"Avenir Next", Avenir, "PingFang SC", sans-serif',
      displayFont: 'Didot, "Bodoni 72", Georgia, serif',
      lyricFont: 'Baskerville, "Iowan Old Style", Georgia, "Songti SC", serif',
      radius: "12px",
      titleTracking: "0.012em",
      bodyPattern: "repeating-radial-gradient(circle at 86% 8%, transparent 0 34px, rgba(226, 177, 93, 0.045) 35px 36px), radial-gradient(ellipse at 18% 0%, rgba(116, 84, 174, 0.28), transparent 34rem)",
      heroPattern: "repeating-radial-gradient(circle at 88% 10%, transparent 0 26px, rgba(226, 177, 93, 0.075) 27px 28px), linear-gradient(125deg, rgba(116, 84, 174, 0.22), transparent 58%)",
      visualPattern: "repeating-radial-gradient(circle at 50% 16%, transparent 0 22px, rgba(226, 177, 93, 0.12) 23px 24px), linear-gradient(180deg, rgba(116, 84, 174, 0.16), transparent 74%)",
      visualFit: "cover",
      visualPosition: "50% 0%",
      visualWidth: "min(360px, 100%)",
      visualHeight: "100%",
      visualDesktopHeight: "128px",
      visualTabletHeight: "132px",
      visualMobileHeight: "128px",
      visualMinHeight: "128px",
      visualPadding: "0px",
      visualFrameRadius: "8px",
      visualFilter: "saturate(1.04) contrast(1.04)",
    },
  },
  {
    slug: "les-souliers-rouges",
    source: "Les souliers rouges (34867633).md",
    title: "Les Souliers Rouges",
    titleZh: "红舞鞋",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "rose", trail: "ribbonTrail", click: "shoeSpark", primary: "#b51f2e", secondary: "#f0d8c6" },
    theme: {
      bg: "#05082b",
      panel: "#11164b",
      accent: "#e21b38",
      highlight: "#f1e8df",
      ink: "#fbfbff",
      muted: "rgba(206, 211, 236, 0.75)",
      line: "rgba(204, 211, 242, 0.28)",
      shadow: "rgba(0, 2, 28, 0.58)",
      bodyFont: '"Avenir Next", Avenir, "PingFang SC", sans-serif',
      displayFont: '"Snell Roundhand", "Apple Chancery", cursive',
      lyricFont: 'Baskerville, "Iowan Old Style", Georgia, "Songti SC", serif',
      radius: "10px",
      titleTracking: "0.006em",
      bodyPattern: "radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.18) 0 1px, transparent 2px), radial-gradient(circle at 78% 10%, rgba(255, 255, 255, 0.12) 0 1px, transparent 2px), radial-gradient(circle at 90% 54%, rgba(255, 255, 255, 0.1) 0 1px, transparent 2px), linear-gradient(135deg, rgba(226, 27, 56, 0.1), transparent 34%)",
      heroPattern: "radial-gradient(circle at 82% 16%, rgba(255, 255, 255, 0.18) 0 1px, transparent 2px), radial-gradient(circle at 70% 68%, rgba(255, 255, 255, 0.12) 0 1px, transparent 2px), linear-gradient(125deg, rgba(226, 27, 56, 0.17), transparent 50%)",
      visualPattern: "radial-gradient(circle at 22% 16%, rgba(255, 255, 255, 0.24) 0 1px, transparent 2px), radial-gradient(circle at 78% 28%, rgba(255, 255, 255, 0.18) 0 1px, transparent 2px), linear-gradient(180deg, rgba(17, 22, 75, 0.08), rgba(5, 8, 43, 0.28))",
      visualFit: "cover",
      visualPosition: "50% 36%",
      visualWidth: "100%",
      visualHeight: "100%",
      visualTabletHeight: "360px",
      visualPadding: "0px",
      visualFrameRadius: "7px",
      visualFilter: "saturate(1.08) contrast(1.03)",
    },
  },
  {
    slug: "la-legende-du-roi-arthur",
    source: "La légende du Roi Arthur (34664427).md",
    title: "La Légende du Roi Arthur",
    titleZh: "亚瑟王传奇",
    language: "fr",
    voice: "fr-fr",
    audioVoice: "Audrey",
    logo: "assets/show-logo.png",
    effect: { icon: "rapier", trail: "bladeGlint", click: "crownRays", primary: "#65793b", secondary: "#d7bb67" },
    theme: {
      bg: "#071317",
      panel: "#102832",
      accent: "#547f8d",
      highlight: "#d5b85d",
      ink: "#f6f2df",
      muted: "rgba(199, 216, 216, 0.72)",
      line: "rgba(207, 183, 100, 0.3)",
      shadow: "rgba(0, 7, 11, 0.6)",
      bodyFont: '"Avenir Next", Avenir, "PingFang SC", sans-serif',
      displayFont: 'Copperplate, "Copperplate Gothic Light", Georgia, serif',
      lyricFont: 'Baskerville, "Iowan Old Style", Georgia, "Songti SC", serif',
      radius: "4px",
      titleTracking: "0.035em",
      bodyPattern: "repeating-linear-gradient(0deg, transparent 0 72px, rgba(213, 184, 93, 0.03) 73px 74px), repeating-linear-gradient(90deg, transparent 0 132px, rgba(132, 179, 188, 0.028) 133px 134px), radial-gradient(ellipse at 80% 0%, rgba(84, 127, 141, 0.24), transparent 34rem)",
      heroPattern: "repeating-linear-gradient(0deg, transparent 0 54px, rgba(213, 184, 93, 0.045) 55px 56px), linear-gradient(125deg, rgba(84, 127, 141, 0.2), transparent 58%)",
      visualPattern: "linear-gradient(180deg, rgba(84, 127, 141, 0.08), rgba(7, 19, 23, 0.28)), repeating-linear-gradient(90deg, transparent 0 80px, rgba(213, 184, 93, 0.05) 81px 82px)",
      visualFit: "cover",
      visualPosition: "50% 66%",
      visualWidth: "100%",
      visualHeight: "100%",
      visualTabletHeight: "340px",
      visualPadding: "0px",
      visualFrameRadius: "2px",
      visualFilter: "saturate(0.88) contrast(1.08)",
    },
  },
];
const WAVE2_SHOW_SLUGS = new Set([
  "moulin-rouge",
  "elisabeth-das-musical",
  "starmania",
  "mozart-das-musical",
  "phantom-of-the-opera",
  "love-never-dies",
  "les-souliers-rouges",
  "la-legende-du-roi-arthur",
]);

const SONG_TITLE_TRANSLATIONS = {
  "moulin-rouge": {
    "Welcome To The Moulin Rouge!": "欢迎来到红磨坊！",
    "The Sparkling Diamond": "璀璨钻石",
    "Shut Up And Raise Your Glass": "闭嘴，举杯",
    Firework: "烟花",
    "Your Song": "你的歌",
    "So Exciting! (The Pitch Song)": "太精彩了！（提案之歌）",
    "Sympathy For The Duke": "同情公爵",
    "Nature Boy": "自然之子",
    "Elephant Love Medley": "大象爱之串烧",
    "Backstage Romance": "后台罗曼史",
    "Come What May": "无论如何",
    "Only Girl In A Material World": "物质世界里唯一的女孩",
    Chandelier: "水晶吊灯",
    "El Tango De Roxanne": "罗克珊探戈",
    "Crazy Rolling": "疯狂翻滚",
    "Your Song Reprise": "你的歌（重唱）",
    "Finale (Come What May)": "终曲（无论如何）",
    "More More More! (Encore)": "更多、更多、更多！（返场）",
  },
  "elisabeth-das-musical": {
    "Wie Du": "像你一样",
    "Schön, euch alle zu seh'n": "很高兴见到大家",
    "Rondo - schwarzer Prinz": "回旋曲——黑王子",
    "Jedem gibt er das seine": "他给每个人应得的一切",
    "Sie passt nicht": "她不合适",
    "Liebe mit Gaffern": "围观者眼中的爱情",
    "Stationen einer Ehe": "一段婚姻的历程",
    Debrezin: "德布勒森",
    "Die fröhliche Apokalypse": "欢快的末日",
    "Kind oder nicht!": "还算不算孩子！",
    "Elisabeth, mach auf": "伊丽莎白，开门",
    "Uns're Kaiserin soll sich wiegen": "让我们的皇后称一称体重",
    "Ich gehör nur mir (Reprise)": "我只属于我自己（重唱）",
    Kitsch: "媚俗",
    Éljen: "万岁",
    Nervenklinik: "精神病院",
    "Salon in der Hofburg": "霍夫堡宫的沙龙",
    "Wir oder sie": "我们还是她",
    "Das Wolf'sche Etablissement": "沃尔夫夫人的场所",
    "Die Maladie": "疾病",
    "Die letzte Chance": "最后的机会",
    "Ist das nun dein Lohn (Bellaria)": "这就是你的报偿吗（贝拉里亚）",
    "Die Schatten werden länger (Reprise)": "阴影渐长（重唱）",
    "Rudolf, ich bin ausser mir": "鲁道夫，我失去理智了",
    Hass: "仇恨",
    "Wie du (Reprise)": "像你一样（重唱）",
    "Wenn ich dein Spiegel wär": "如果我是你的镜子",
    "Mayerling-Walzer (Instrumental)": "梅耶林圆舞曲（器乐）",
    Totenklage: "悼亡曲",
    "Mein neues Sortiment": "我的新货品",
    "Boote in der Nacht": "夜航的船",
    "Alle Fragen sind gestellt (Reprise)": "所有问题都已问尽（重唱）",
    "Das Attentat": "刺杀",
    "Der Schleier fällt": "面纱落下",
  },
  starmania: {
    Ouverture: "序曲",
    "Sadia Et Johnny": "萨迪娅与强尼",
    "La serveuse et les clients": "女服务生与顾客们",
    "La complainte de la serveuse automate": "自动女服务生的哀歌",
    "Communique De L' Evangeliste Ⅱ": "新闻播报Ⅱ",
    "La chanson de ziggy": "齐吉之歌",
    "Le coup de téléphone": "那通电话",
    "Interview de johnny rockfort": "强尼·罗克福的访谈",
    "Communique De L' Evangeliste Ⅲ": "新闻播报Ⅲ",
    "Le meeting de zéro janvier": "泽罗·让维耶的集会",
    "Le bulletin special de télé capitale": "首都电视台特别新闻",
    "Besoin D' Amour": "需要爱",
    "Communique de l'evangelisteⅣ": "新闻播报Ⅳ",
    "Marie-jeanne et les clients du cafe": "玛丽-让娜与咖啡馆顾客",
    "Les adieux d'un *** symbol": "一位性感偶像的告别",
    "Le telegramme de zéro a stella": "泽罗给斯黛拉的电报",
    "Communiqué de l'Evangéliste et Marie-Jeanne": "新闻播报与玛丽-让娜",
    "S. o. s d'un terrien en detresse": "一个绝望地球人的求救",
    "Jingle De Stella": "斯黛拉的广告歌",
    "Le debat televise": "电视辩论",
    "*** shops, cinemas pornos": "性用品商店与色情影院",
    "Les parents de cristal": "克里斯塔尔的父母",
    "Quand on a plus rien a perdre": "当我们再无可失",
    "Les Uns contre les Autres": "人与人彼此对抗",
    "La Demande de Zéro à Stella": "泽罗向斯黛拉求婚",
    "ego trip": "自我之旅",
    "Communiqué de l'évangéliste": "新闻播报",
    "Petite Musique Terrienne": "地球小调",
    "Communique De L' Evangeliste Ⅵ": "新闻播报Ⅵ",
    "Communique De L' Évangéliste Ⅱ": "新闻播报Ⅱ",
    "Communique De L' Évangéliste Ⅲ": "新闻播报Ⅲ",
    "Communique de l'évangélisteⅣ": "新闻播报Ⅳ",
    "Communique De L' Évangéliste Ⅵ": "新闻播报Ⅵ",
    "Marie-jeanne et les clients du café": "玛丽-让娜与咖啡馆顾客",
    "Le télégramme de zéro a stella": "泽罗给斯黛拉的电报",
    "S. o. s d'un terrien en détresse": "一个绝望地球人的求救信号",
    "Le débat télévisé": "电视辩论",
    "*** shops, cinémas pornos": "色情商店与成人电影院",
    Monopolis: "垄断城",
    "Ce soir on danse à dnalizan (suite)": "今晚在纳利赞起舞（续）",
    "Le Monde Est Stone": "世界已石化",
    "La Victoire de Zéro Janvier": "泽罗·让维耶的胜利",
    "Le rêve de Stella Spotlight": "斯黛拉·聚光灯的梦",
    Final: "终曲",
  },
  "mozart-das-musical": {
    "Entr'acte": "幕间曲",
    Prolog: "序幕",
    "Was für ein Kind!": "这是怎样的孩子！",
    "Ah, das Fräulein Mozart!": "啊，莫扎特小姐！",
    "Eine ehrliche Familie": "一个正直的家庭",
    "Niemand applaudiert": "无人鼓掌",
    "Was für ein grausames Leben": "多么残酷的人生",
    "In Salzburg ist Winter": "萨尔茨堡正值寒冬",
    "Ein bissel für's Hirn und ein bissel für's Herz": "给头脑一点，也给心一点",
    "Gold von den Sternen": "来自群星的黄金",
    "Niemand liebt dich so wie ich (Reprise)": "没人比我更爱你（重唱）",
    "Wien wird mich um ihn beneiden": "维也纳会因他而嫉妒我",
    "Halten sie den Atem an!": "请屏住呼吸！",
    "Ich bin extraordinär": "我非同凡响",
    "Weil du so bist, wie du bist": "因为你就是你",
    "Wir zwei zusammen": "我们两人在一起",
    "Ich bleibe in Wien!": "我要留在维也纳！",
    "Entrґacte": "幕间曲",
    "Hier In Wien!": "就在维也纳！",
    "Du Hast Ihn An Der Angel": "你把他钓到手了",
    "Dich Kennen Heisst Dich Lieben": "认识你就是爱上你",
    "Ha! Ein Liebesnest!": "哈！一个爱巢！",
    "Dich Kennen Heisst Dich Lieben (Reprise)": "认识你就是爱上你（重唱）",
    "Wer Ist Wer?": "谁是谁？",
    "Der Prinz Ist Fort": "王子走了",
    "Irgendwo Wird Immer Getanzt": "总有某处在起舞",
    "Mozart-Zitat (Ouvertüre \"Titus\")": "莫扎特引曲（《狄托的仁慈》序曲）",
    "Wie Kann Es Möglich Sein?": "这怎么可能？",
    "Warum Kannst Du Mich Nicht Lieben?": "你为什么不能爱我？",
    "Mozarts Verwirrung": "莫扎特的迷惘",
    "Gold Von Den Sternen (Reprise)": "来自群星的黄金（重唱）",
    Bettelbriefe: "乞求信",
    "Papa Ist Tot": "爸爸死了",
    "Schliess Dein Herz In Eisen Ein (Reprise)": "把你的心锁进铁中（重唱）",
    "Irgendwo Wird Immer Getanzt (Reprise)": "总有某处在起舞（重唱）",
    "Der Einfache Weg": "简单的道路",
    "Mozart, Mozart!": "莫扎特，莫扎特！",
    "Mozarts Tod": "莫扎特之死",
    "Wie Wird Man Seinen Schatten Los? (Finale)": "如何摆脱自己的影子？（终曲）",
  },
  "phantom-of-the-opera": {
    "Prologue (Live)": "序幕（现场）",
    "Overture (Live)": "序曲（现场）",
    "Think Of Me (Live)": "想念我（现场）",
    "Angel Of Music (Live)": "音乐天使（现场）",
    "The Phantom Of The Opera (Live)": "剧院魅影（现场）",
    "The Music Of The Night (Live)": "夜之乐章（现场）",
    "I Remember .../Stranger Than You Dream It ... (Live)": "我记得……／比你梦中更陌生……（现场）",
    "I Remember.../Stranger Than You Dream It... (Live)": "我记得……／比你梦中更陌生……（现场）",
    "Magical Lasso (Live)": "魔法套索（现场）",
    "Notes .../Prima Donna (Live)": "信件……／首席女高音（现场）",
    "Notes.../Prima Donna (Live)": "信件……／首席女高音（现场）",
    "Poor Fool,He Makes Me Laugh (Live)": "可怜的傻瓜，他逗我发笑（现场）",
    "Why Have You Brought Me Here (Live)": "你为何带我来这里（现场）",
    "All I Ask Of You (Live)": "我对你唯一的请求（现场）",
    "Phantom Of The Opera (Live)": "剧院魅影（现场）",
    "Entr'Acte (Live)": "幕间曲（现场）",
    "Masquerade/Why So Silent (Live)": "假面舞会／为何如此沉默（现场）",
    "Wishing You Were Somehow Here Again (Live)": "愿你能再次回到这里（现场）",
    "Wandering Child .../Bravo,Monsieur ... (Live)": "迷途的孩子……／好极了，先生……（现场）",
    "Wandering Child.../Bravo,Monsieur... (Live)": "迷途的孩子……／好极了，先生……（现场）",
    "The Point Of No Return (Live)": "不归点（现场）",
    "Down Once More .../Track Down This Murderer ... (Live)": "再次下行……／追捕这个凶手……（现场）",
    "Down Once More.../Track Down This Murderer... (Live)": "再次下行……／追捕这个凶手……（现场）",
    Prologue: "序幕",
    "The Coney Island Waltz": "康尼岛圆舞曲",
    "That's The Place That You Ruined,You Fool!": "那就是你毁掉的地方，蠢货！",
    "Heaven By The Sea": "海滨天堂",
    "Only For Him / Only For You": "只为他／只为你",
    "The Aerie": "高巢",
    "Giry Confronts The Phantom / 'Til I Hear You Sing (Reprise)": "吉里质问魅影／直到听见你的歌声（重唱）",
    "Christine Disembarks": "克里斯汀下船",
    "What A Dreadful Town!...": "多么可怕的小镇！……",
    "Look With Your Heart": "用心去看",
    "Beneath A Moonless Sky": "在无月的天空下",
    "Once Upon Another Time": "曾在另一个时光",
    "Mother Please,I'm Scared!": "妈妈，求你了，我害怕！",
    "Dear Old Friend": "亲爱的老朋友",
    Beautiful: "美丽",
    "The Beauty Underneath": "潜藏之美",
    "The Phantom Confronts Christine": "魅影质问克里斯汀",
    "Entr'acte": "幕间曲",
    "Why Does She Love Me?": "她为什么爱我？",
    "Devil Take The Hindmost": "魔鬼带走落后者",
    "Heaven By The Sea (Reprise)": "海滨天堂（重唱）",
    "Bathing Beauty": "沐浴美人",
    "Before The Performance": "演出之前",
    "Love Never Dies": "真爱不死",
    "Ah,Christine!...": "啊，克里斯汀！……",
    "Ah, Christine!...": "啊，克里斯汀！……",
    "Gustave! Gustave!...": "古斯塔夫！古斯塔夫！……",
    "Please Miss Giry,I Want To Go Back...": "求你了，吉里小姐，我想回去……",
    "Poor Fool, He Makes Me Laugh (Live)": "可怜的傻瓜，他逗我发笑（现场）",
    "Wandering Child.../Bravo, Monsieur... (Live)": "迷途的孩子……／好极了，先生……（现场）",
    "That's The Place That You Ruined, You Fool!": "那就是你毁掉的地方，蠢货！",
    "Mother Please, I'm Scared!": "妈妈，求你了，我害怕！",
    "Please Miss Giry, I Want To Go Back...": "求你了，吉里小姐，我想回去……",
  },
  "les-souliers-rouges": {
    "Rêve d'opéra": "歌剧之梦",
    "Viens danser": "来跳舞吧",
    "Je tombe amoureux": "我坠入爱河",
    "Je sais": "我知道",
    "Vivre ou ne pas vivre": "活着，还是不活",
  },
  "la-legende-du-roi-arthur": {
    "Quelque chose de magique": "某种魔法",
    "Wake Up": "醒来",
    "Faire comme si": "假装若无其事",
    "Au diable": "见鬼去吧",
    "Je me relève": "我重新站起",
    "Rêver l'impossible": "梦想不可能",
    "A l'enfant": "致孩子",
    "Il est temps": "时候到了",
    "Promis c'est juré": "说定了，我发誓",
    "Tu vas le payer": "你会付出代价",
    "Dors, Morgane dors": "睡吧，摩根，睡吧",
    "Un nouveau départ": "新的开始",
    "Qui suis-je ?": "我是谁？",
    "Qui suis-je?": "我是谁？",
    "A nos voeux sacrés": "致我们的神圣誓言",
    "La Danse des guerriers (Instrumental)": "战士之舞（器乐）",
    "Le Monde est parfait": "世界完美无缺",
    "Le Chant du dragon (Instrumental)": "龙之歌（器乐）",
    "Jeux dangereux (Instrumental)": "危险游戏（器乐）",
    "Il est temps (Version troupe)": "时候到了（全体版）",
    "Tant de haine": "如此多的仇恨",
    "L'Ouverture d'Excalibur (Instrumental)": "王者之剑序曲（器乐）",
  },
  "1789-les-amants-de-la-bastille": {
    "Allez viens (c'est bientôt la fin)": "来吧（结局将近）",
  },
  "cyrano-de-bergerac": {
    "Marchand de rimes": "诗韵商人",
    "Je viens à toi": "我奔向你",
    "Je connais la chanson": "我熟悉这首歌",
  },
  "don-juan": {
    "L'homme qui a tout": "拥有一切的男人",
    "Cœur de pierre": "铁石心肠",
    "Du plaisir": "欢愉",
    "Les amoureux de Séville": "塞维利亚的恋人们",
    "Changer": "改变",
    "Je pense à lui": "我想念他",
    "Seul": "孤独",
    "Tristesa andalucia": "安达卢西亚的悲伤",
    "Don juan est mort": "唐璜死了",
    "On veut de l'amour": "我们渴望爱",
    "L'amour est plus fort": "爱更强大",
  },
  "le-roi-soleil": {
    "Personne n'est personne": "人人皆非无名之辈",
    "Et vice Versailles": "反之亦凡尔赛",
    "Tant qu'on rêve encore": "只要我们仍在梦想",
    "Je fais de toi mon essentiel (Version acoustique)": "你是我的全部（原声版）",
  },
  "les-miserables": {
    "Prologue": "序曲",
    "On Parole/The Bishop": "假释途中／主教",
    "Valjean's Soliloquy": "冉阿让独白",
    "At the End of the Day": "一日将尽",
    "I Dreamed a Dream": "我曾有梦",
    "Lovely Ladies": "可爱的姑娘们",
    "Fantine's Arrest": "芳汀被捕",
    "Runaway Cart": "失控的马车",
    "Who Am I? - The Trial": "我是谁？／审判",
    "Fantine's Death": "芳汀之死",
    "Confrontation": "对峙",
    "Castle on a Cloud": "云端城堡",
    "Master of the House": "酒馆主人",
    "Bargain - Waltz of Treachery": "交易／背叛圆舞曲",
    "Look Down": "低头看",
    "Stars": "繁星",
    "ABC Café/Red and Black": "ABC咖啡馆／红与黑",
    "Rue Plumet - In My Life": "卜吕梅街／在我生命中",
    "Heart Full of Love": "满怀爱意",
    "Attack on Rue Plumet": "卜吕梅街遇袭",
    "One Day More!": "只待明日！",
    "Building the Barricade/On My Own": "筑起街垒／形单影只",
    "Back at the Barricade": "重回街垒",
    "Javert's Arrival/Little People": "沙威到来／小人物",
    "Little Fall of Rain": "一阵小雨",
    "Night of Anguish": "苦痛之夜",
    "First Attack": "第一次进攻",
    "Drink with Me": "与我共饮",
    "Bring Him Home": "带他回家",
    "Second Attack/The Final Battle": "第二次进攻／最终战役",
    "Dog Eats Dog": "弱肉强食",
    "Javert's Suicide": "沙威自尽",
    "Turning": "转过街角",
    "Empty Chairs at Empty Tables": "空桌空椅",
    "Every Day/A Heart Full of Love (Reprise)": "每一天／满怀爱意（重唱）",
    "Wedding Chorale/Beggars at the Feast": "婚礼赞歌／宴席上的乞丐",
  },
  "romeo-et-juliette": {
    "Ouverture": "序曲",
    "La haine": "仇恨",
    "Un jour": "有一天",
    "Tu dois te marier": "你必须结婚",
    "Les rois du monde": "世界之王",
    "J'ai peur": "我害怕",
    "C'est pas ma faute": "这不是我的错",
    "Le poète": "诗人",
    "Le balcon": "阳台",
    "Les beaux, les laids": "美人与丑人",
    "Et voilà qu'elle aime": "她竟然爱上了",
    "Aimer": "相爱",
    "On dit dans la rue": "街头传言",
    "C'est le jour": "时辰已到",
    "Le duel": "决斗",
    "Mort de Mercutio": "茂丘西奥之死",
    "Le pouvoir": "权力",
    "Duo du désespoir": "绝望二重唱",
    "Demain": "明天",
    "Le poison": "毒药",
    "Comment lui dire": "如何告诉他",
    "La mort de la Juliette": "朱丽叶之死",
    "J'sais plus": "我已不知所措",
    "Les rois du monde (Rappels)": "世界之王（返场）",
  },
};

const SONG_TITLE_OVERRIDES = {
  starmania: {
    "Il Se Passe Quelque Chose à Monopolis": "垄断城出大事了",
  },
};

const LINE_TEXT_OVERRIDES = {
  "la-legende-du-roi-arthur-01-001": { zh: "我曾看见邪恶的仙女" },
  "la-legende-du-roi-arthur-01-002": { zh: "挡住我的去路" },
  "la-legende-du-roi-arthur-01-003": { zh: "尝过那有毒的滋味", en: "Tasted the toxic effects" },
  "la-legende-du-roi-arthur-01-004": { zh: "来自男人与他们的毒液", en: "Of men and their venom" },
  "la-legende-du-roi-arthur-01-005": { zh: "我逆转风向，倒转时间", en: "I defeated the wind, reversed time" },
  "la-legende-du-roi-arthur-01-007": { zh: "我消灭心魔，直面磨难", en: "Killed my demons, braved the torments" },
  "la-legende-du-roi-arthur-01-011": { zh: "就像一片磁场" },
  "la-legende-du-roi-arthur-01-012": { zh: "无法解释" },
  "la-legende-du-roi-arthur-01-014": { zh: "挑战着一切法则" },
  "la-legende-du-roi-arthur-01-017": { zh: "我看见我们英勇的灵魂" },
  "la-legende-du-roi-arthur-01-029": { zh: "就像一片磁场" },
  "la-legende-du-roi-arthur-01-032": { zh: "挑战着一切法则" },
  "la-legende-du-roi-arthur-01-041": { zh: "就像一片磁场" },
  "la-legende-du-roi-arthur-01-044": { zh: "挑战着一切法则" },
  "la-legende-du-roi-arthur-06-004": { zh: "被缠绵的思绪迷住" },
  "la-legende-du-roi-arthur-06-039": { zh: "你会越来越明白，不必拐弯抹角", en: "You will know more often, without beating around the bush" },
  "la-legende-du-roi-arthur-17-010": { zh: "别怪我" },
  "la-legende-du-roi-arthur-17-011": { zh: "因渴望而越过界限", en: "For desiring to the point of transgression" },
  "starmania-02-001": { zh: "这里是" },
  "starmania-02-002": { zh: "西半球的首都" },
  "starmania-02-003": { zh: "垄断城" },
  "starmania-02-004": { zh: "有事正在发生" },
  "starmania-02-005": { zh: "在垄断城" },
  "starmania-02-006": { zh: "这座从来无事发生的城市" },
  "starmania-02-007": { zh: "人们只会在" },
  "starmania-02-008": { zh: "丢了狗的时候报警" },
  "starmania-02-009": { zh: "有事正在发生" },
  "starmania-02-010": { zh: "在垄断城" },
  "starmania-02-011": { zh: "这座新城" },
  "starmania-02-012": { zh: "这座模范城市" },
  "starmania-02-013": { zh: "有着地下通道" },
  "starmania-02-014": { zh: "和空调" },
  "starmania-02-015": { zh: "还有玻璃大楼" },
  "starmania-02-016": { zh: "过滤着光线" },
  "starmania-02-017": { zh: "郊区则由" },
  "starmania-02-018": { zh: "太阳能供暖" },
  "starmania-02-019": { zh: "那里不再有夏天" },
  "starmania-02-020": { zh: "也不再有冬天" },
  "starmania-02-021": { zh: "有事正在发生" },
  "starmania-02-022": { zh: "在垄断城" },
  "starmania-02-023": { zh: "这座看起来" },
  "starmania-02-024": { zh: "是为人类幸福而建的城市" },
  "starmania-02-025": { zh: "如今也进入了" },
  "starmania-02-026": { zh: "恐怖时刻" },
  "starmania-02-027": { zh: "人们不再独自外出" },
  "starmania-02-028": { zh: "无论在纽约还是罗马" },
  "starmania-02-029": { zh: "当太阳落下" },
  "starmania-02-030": { zh: "整个西方都在恐惧" },
  "starmania-02-031": { zh: "有事正在发生" },
  "starmania-02-032": { zh: "在垄断城" },
  "starmania-02-033": { zh: "有事正在发生" },
  "starmania-02-034": { zh: "在垄断城" },
  "starmania-02-035": { zh: "当太阳落下" },
  "starmania-02-036": { zh: "整个西方都在恐惧" },
};

const SHOW_WORD_OVERRIDES = {
  "le-roi-soleil": {
    acoustique: ["原声的；不插电的", "acoustic", "acoustique"],
    acoustiques: ["原声的；不插电的", "acoustic", "acoustiques"],
    aeternam: ["永恒的（拉丁语）", "eternal", "aeternam"],
    "anne-laure": ["安娜-洛尔（人名）", "Anne-Laure", "Anne-Laure"],
    "apprends-moi": ["教教我；告诉我", "teach me", "Apprends-moi"],
    aurais: ["本会有；本可以", "would have", "aurais"],
    "aurais-tu": ["你会有吗；你本会……吗", "would you have", "aurais-tu"],
    bengdadadada: ["蹦哒哒哒哒（节奏拟声）", "rhythmic vocalization", "bengdadadada"],
    "blé": ["小麦；麦子", "wheat", "blé", "/ble/"],
    bonus: ["附加的；加收的", "bonus", "bonus"],
    dona: ["赐予（拉丁语）", "grant", "dona"],
    ex: ["从；出自（拉丁语）", "from / out of", "ex"],
    "fait-on": ["人们是否做；是否会", "does one do", "fait-on"],
    feat: ["合作演唱； featuring 的缩写", "featuring", "feat"],
    girbal: ["吉尔巴尔（姓氏）", "Girbal", "Girbal"],
    ha: ["哈；笑声或感叹声", "ha", "ha"],
    hymnus: ["赞美诗（拉丁语）", "hymn", "hymnus"],
    indicible: ["难以言喻的", "indescribable", "indicible"],
    invincible: ["不可战胜的；无敌的", "invincible", "invincible"],
    jaurais: ["我本会有；我本可以", "I would have", "j'aurais"],
    jerusalem: ["耶路撒冷", "Jerusalem", "Jérusalem"],
    luceat: ["愿……照耀（拉丁语）", "may it shine", "luceat"],
    nouvelle: ["新的；新出现的", "new", "nouvelle", "/nuvɛl/"],
    orationem: ["祈祷（拉丁语）", "prayer", "orationem"],
    oserais: ["敢；会敢", "would dare", "oserais"],
    "oserais-tu": ["你敢吗", "would you dare", "oserais-tu"],
    panurge: ["盲从者；随大流的人", "blind follower", "Panurge"],
    puisquil: ["既然他/它；因为他/它", "since he / it", "puisqu'il"],
    "quavons-nous": ["我们有什么；我们做了什么", "what have we", "qu'avons-nous"],
    repartir: ["重新出发；再次启程", "to set out again", "repartir"],
    requiem: ["安息；安魂曲", "rest / requiem", "requiem"],
    "sécroule": ["倒塌；崩溃", "collapses", "s'écroule"],
    "serai-je": ["我会是……吗", "will I be", "serai-je"],
    sio: ["西奥（姓氏）", "Sio", "Sio"],
    veniet: ["将来到（拉丁语）", "will come", "veniet"],
    versaille: ["凡尔赛", "Versailles", "Versailles"],
    versailles: ["凡尔赛", "Versailles", "Versailles"],
    version: ["版本", "version", "version"],
    versions: ["版本", "versions", "versions"],
    victoria: ["维多利亚（人名）", "Victoria", "Victoria"],
    viendrais: ["会来；本会来", "would come", "viendrais"],
    "viendrais-tu": ["你会来吗", "would you come", "viendrais-tu"],
    "voudrais-tu": ["你愿意吗；你想要吗", "would you like", "voudrais-tu"],
  },
};

const SHOW_LYRIC_CORRECTIONS = {
  "moulin-rouge": [
    [/Dancing and the way we go to/gu, "Dancing, and away we go..."],
    [/The most less lascivious racketeer around/gu, "The most lascivious racketeer around"],
    [/\bchocalata\b/giu, "chocolata"],
  ],
  "elisabeth-das-musical": [
    [/^_Die$/gu, ""],
    [/^_?Wie das$/gu, "Wie das?"],
    [/Ratschl\?gen/gu, "Ratschlägen"],
    [/\?sterreich/gu, "Österreich"],
    [/franz\?sisch/gu, "französisch"],
    [/K\?\s*fig/gu, "Käfig"],
    [/qu\?lt/gu, "quält"],
    [/Sch\?\s*nheit/gu, "Schönheit"],
    [/w\?\s*hrend/gu, "während"],
    [/h\?ren/gu, "hören"],
    [/verh\?\s*hnen/gu, "verhöhnen"],
    [/h\?\s*rt/gu, "hört"],
    [/pers\?\s*nlich/gu, "persönlich"],
    [/Majest\?\s*t/gu, "Majestät"],
    [/f\?\s*llt/gu, "fällt"],
    [/L\?\s*sch/gu, "Lösch"],
    [/geh\?\s*rst/gu, "gehörst"],
    [/geh\?\s*r/gu, "gehör"],
    [/Seht das Mädchen ench an/gu, "Seht das Mädchen euch an"],
    [/La\?\s*mich befreit sein/gu, "Lass mich frei sein"],
    [/\bAnsonstrm\b/gu, "Ansonsten"],
    [/\bavancienrt\b/gu, "avanciert"],
    [/\bbeitmachen\b/gu, "mitmachen"],
    [/\bBetrugerin\b/gu, "Betrügerin"],
    [/\bbloβ\b/gu, "bloß"],
    [/\bBrüden\b/gu, "Brüdern"],
    [/\bdeisem\b/gu, "diesem"],
    [/\bDeutchland\b/gu, "Deutschland"],
    [/\beinzuschliessen\b/gu, "einzuschließen"],
    [/\bElisabet(?:h|rth)?\b/gu, "Elisabeth"],
    [/\berwaten\b/gu, "erwarten"],
    [/\bgehoer\b/gu, "gehör"],
    [/\bgehoerst\b/gu, "gehörst"],
    [/\bgehoert\b/gu, "gehöre"],
    [/\bgeöhr\b/gu, "gehör"],
    [/\bGetu\b/gu, "Getue"],
    [/\bHifle\b/gu, "Hilfe"],
    [/\bHintermännar\b/gu, "Hintermänner"],
    [/\biher\b/gu, "ihrer"],
    [/\bJundenweiber\b/gu, "Judenweiber"],
    [/\bkinderkram\b/gu, "Kinderkram"],
    [/\bkummert\b/gu, "kümmert"],
    [/\blaenger\b/gu, "länger"],
    [/\bLäsung\b/gu, "Lösung"],
    [/\bLieratur\b/gu, "Literatur"],
    [/\blrrenhäuser\b/gu, "Irrenhäuser"],
    [/\bMärch\b/gu, "Märchen"],
    [/\bmeinesdeines\b/gu, "meines"],
    [/\bmur\b/gu, "nur"],
    [/\bparlie\b/gu, "parliert"],
    [/\bperque\b/gu, "perché"],
    [/\bplätzlich\b/gu, "plötzlich"],
    [/\bRoamntico\b/gu, "romantico"],
    [/\bsammeit\b/gu, "sammelt"],
    [/\bSchatzkammerfiel\b/gu, "Schatzkammer fiel"],
    [/\bScheusslich\b/gu, "Scheußlich"],
    [/franz\?\s*sisch/gu, "französisch"],
    [/\bsorechen\b/gu, "sprechen"],
    [/\bSussichten\b/gu, "Aussichten"],
    [/\buntertehn\b/gu, "unterstehn"],
    [/\bUrgarn\b/gu, "Ungarn"],
    [/\bveraendern\b/gu, "verändern"],
    [/\bverruckt\b/gu, "verrückt"],
    [/\bversdteh'n\b/gu, "versteh'n"],
    [/\bWahnsinnein\b/gu, "Wahnsinn ein"],
    [/Elisabrth/gu, "Elisabeth"],
    [/bloβ/gu, "bloß"],
    [/\bLa\?\s*mich/gu, "Lass mich"],
    [/qu\?\s*lt/gu, "quält"],
    [/Ratschl\?\s*gen/gu, "Ratschlägen"],
    [/von\?\s*sterreich/gu, "von Österreich"],
    [/\?\s*sterreich/gu, "Österreich"],
    [/Verla\?\s+die Schatten/gu, "Verlass die Schatten"],
    [/c'é/gu, "c'è"],
    [/\bcosi\b/gu, "così"],
    [/\bQue bel progetto/gu, "Che bel progetto"],
    [/\bgeschen'n\b/gu, "gescheh'n"],
    [/\bretouschier'n\b/gu, "retuschier'n"],
  ],
  "mozart-das-musical": [
    [/\s*【Mozart】\s*/gu, " / "],
    [/【Ich mit dich】/gu, "(Ich mit dir)"],
    [/\)\s*\(/gu, ") / ("],
    [/h\?ren/gu, "hören"],
    [/\bGlaeser\b/gu, "Gläser"],
    [/\bHoeflichkeit\b/gu, "Höflichkeit"],
    [/\bkaem\b/gu, "käme"],
    [/\bbalg ziehn\b/gu, "bald ziehn"],
    [/\bGehalt wir fürstlich\b/gu, "Gehalt wird fürstlich"],
    [/\bkriegem\b/gu, "kriege"],
    [/\bsir fördern\b/gu, "sie fördern"],
    [/\bDarür\b/gu, "Dafür"],
    [/\bFur eine Hausfrau\b/gu, "Für eine Hausfrau"],
    [/\bhoerst\b/gu, "hörst"],
    [/\bwarden der ich bin\b/gu, "werden, der ich bin"],
    [/\bso namlich an\b/gu, "so nämlich an"],
    [/\bEr friss je aus der Hand\b/gu, "Er frisst dir aus der Hand"],
    [/\baufgefordet\b/gu, "aufgefordert"],
    [/\bAusgeloescht\b/gu, "Ausgelöscht"],
    [/\bausgestossnen\b/gu, "ausgestoßenen"],
    [/\bbegeistet\b/gu, "begeistert"],
    [/\bBerzeihn\b/gu, "Verzeih'n"],
    [/\bbetrachen\b/gu, "betrachten"],
    [/\bblod\b/gu, "blöd"],
    [/\bCÄCILLA\b/gu, "CÄCILIA"],
    [/\bEntrґacte\b/gu, "Entr'acte"],
    [/\bEntshuldigen\b/gu, "Entschuldigen"],
    [/\bEumindest\b/gu, "Zumindest"],
    [/\bEweimal\b/gu, "Zweimal"],
    [/\bfaellt\b/gu, "fällt"],
    [/\bfreudliches\b/gu, "freundliches"],
    [/\bFusstritt\b/gu, "Fußtritt"],
    [/\bgefaelligst\b/gu, "gefälligst"],
    [/\bglücklish\b/gu, "glücklich"],
    [/\bHolfkompositeur\b/gu, "Hofkompositeur"],
    [/\bhor\b/gu, "hör"],
    [/\bIetzt\b/gu, "Jetzt"],
    [/\bIhrnach\b/gu, "Ihr nach"],
    [/\bKleidungstück\b/gu, "Kleidungsstück"],
    [/\bKnödeschädel\b/gu, "Knödelschädel"],
    [/\bKoeche\b/gu, "Köche"],
    [/\bKurscher\b/gu, "Kutscher"],
    [/\bMaximillian\b/gu, "Maximilian"],
    [/\bMorgan\b/gu, "Morgen"],
    [/\bSowiel\b/gu, "Soviel"],
    [/\bTraushein\b/gu, "Trauschein"],
    [/\bverhuten\b/gu, "verhüten"],
    [/\bverkümmen\b/gu, "verkümmern"],
    [/\bverschmaeht\b/gu, "verschmäht"],
    [/\bwolt\b/gu, "wollt"],
    [/\bwrid\b/gu, "wird"],
    [/entl\s+a\s+sst/gu, "entlässt"],
    [/\bhoern\b/gu, "hören"],
    [/\bhoert\b/gu, "hört"],
    [/\bJaehzorn\b/gu, "Jähzorn"],
    [/\bwaere\b/gu, "wäre"],
    [/\bdam Grafen\b/gu, "dem Grafen"],
    [/\bDamon\b/gu, "Dämon"],
    [/\bEcoutez\b/gu, "Écoutez"],
    [/\bmein'arme Weib\b/gu, "mein armes Weib"],
    [/\bMeissner\b/gu, "Meißner"],
    [/\bverzirh'n\b/gu, "verzier'n"],
    [/\bwurd ich danach gehn\b/gu, "würd ich danach geh'n"],
  ],
  starmania: [
    [/qu'on gratigne/gu, "qu'on égratigne"],
    [/\bdécus\b/gu, "déçus"],
    [/\brienJ'ai\b/gu, "rien. J'ai"],
    [/\bcontrole\b/gu, "contrôle"],
    [/\bimposеrons\b/gu, "imposerons"],
    [/nе/gu, "ne"],
    [/\beuxIls\b/gu, "eux. Ils"],
    [/\bcomplex Zéro\b/gu, "complexe Zéro"],
    [/\blassive\b/gu, "lascive"],
    [/\bChapplin\b/gu, "Chaplin"],
    [/\bgarcons\b/gu, "garçons"],
    [/\bgarcon\b/gu, "garçon"],
    [/\bje said\b/giu, "je sais"],
    [/\bsix Symbol\b/giu, "sex-symbol"],
    [/cafe/gu, "café"],
    [/cinemas/gu, "cinémas"],
    [/Conference/gu, "Conférence"],
    [/debat/gu, "débat"],
    [/detresse/gu, "détresse"],
    [/Etes-vous/gu, "Êtes-vous"],
    [/Etoiles/gu, "Étoiles"],
    [/Evangeliste/gu, "Évangéliste"],
    [/l'evangeliste/gu, "l'évangéliste"],
    [/telegramme/gu, "télégramme"],
    [/televise/gu, "télévisé"],
  ],
  "phantom-of-the-opera": [
    [/a great black hole served as the nose/giu, "A great black hole serves as the nose"],
    [/Shoot the shoots/gu, "Shoot the chutes"],
    [/\bbeated\b/gu, "beaten"],
    [/boss'whim/gu, "boss's whim"],
    [/\bCalet\b/gu, "Calais"],
    [/\bcollonades\b/gu, "colonnades"],
    [/\bgotWhat\b/gu, "got. What"],
    [/\bgreedious\b/gu, "greedy"],
    [/\bIcaressed\b/gu, "I caressed"],
    [/\bIunatic\b/gu, "lunatic"],
    [/Lady'sheart/gu, "Lady's heart"],
    [/\bloathesome\b/gu, "loathsome"],
    [/\bmeanians\b/gu, "menials"],
    [/\bmonsie ur\b/giu, "Monsieur"],
    [/\bmonsie\b/gu, "Monsieur"],
    [/\bmonsieurs\b/gu, "messieurs"],
    [/\bSwiring\b/gu, "Swirling"],
    [/\bthrought\b/gu, "through"],
    [/\bungreatful\b/gu, "ungrateful"],
    [/\bvipler\b/gu, "viper"],
    [/\bguida nce\b/giu, "guidance"],
  ],
  "les-souliers-rouges": [
    [/Les muscles brulées/gu, "Les muscles brûlés"],
    [/^éternelle audition$/gu, "Éternelle audition"],
    [/^A bout/gu, "À bout"],
    [/Je ne vous connaissait pas/gu, "Je ne vous connaissais pas"],
  ],
  "la-legende-du-roi-arthur": [
    [/conna\?tre/gu, "connaître"],
    [/conna\? tre/gu, "connaître"],
    [/conna tre/gu, "connaître"],
    [/^J'ai dé fait le vent inversé le temps$/gu, "J'ai défait le vent, inversé le temps"],
    [/^Tué mes dé mons bravé les tourments$/gu, "Tué mes démons, bravé les tourments"],
    [/Des hommes et leurs venins/gu, "Des hommes et leur venin"],
    [/Go té/gu, "Goûté"],
    [/fé es malé fiques/gu, "fées maléfiques"],
    [/\bdé fait\b/gu, "défait"],
    [/\bdé mons\b/gu, "démons"],
    [/\bmagné tique\b/gu, "magnétique"],
    [/\bdé fie\b/gu, "défie"],
    [/é soté rique/gu, "ésotérique"],
    [/dé fié/gu, "défié"],
    [/d'é bats/gu, "d'ébats"],
    [/\bEnsorcelé e\b/gu, "Ensorcelée"],
    [/\bpensé es\b/gu, "pensées"],
    [/Emmè ne/gu, "Emmène"],
    [/possé der/gu, "posséder"],
    [/dé sirer/gu, "désirer"],
    [/\bdé tour\b/gu, "détour"],
    [/\bdé lit\b/gu, "délit"],
    [/océ an/gu, "océan"],
    [/\bames\b/gu, "âmes"],
    [/\bame\b/gu, "âme"],
    [/gouté/gu, "goûté"],
    [/\bentraine\b/gu, "entraîne"],
    [/au delà-des/gu, "au-delà des"],
    [/au delà/gu, "au-delà"],
    [/\bFautil\b/gu, "Faut-il"],
    [/frolé/gu, "frôlé"],
    [/\brennaïtre\b/gu, "renaître"],
    [/\bpévenir\b/gu, "prévenir"],
    [/\bsourir\b/gu, "sourire"],
    [/\bchateau\b/gu, "château"],
    [/\bBati\b/gu, "Bâti"],
    [/\bsurcroit\b/gu, "surcroît"],
    [/\bEcrire\b/gu, "Écrire"],
    [/\bbalancais\b/gu, "balançais"],
    [/\bD'avalon\b/gu, "d'Avalon"],
    [/\bd'Huther\b/gu, "d'Uther"],
    [/\bRoi Hutère\b/gu, "Roi Uther"],
    [/^\]Dam/gu, "Dam"],
    [/Ce qu'il n'aurait jamais du/gu, "Ce qu'il n'aurait jamais dû"],
    [/Perdu le trone qui m'était du/gu, "Perdu le trône qui m'était dû"],
    [/Cette fois, c'est sur/gu, "Cette fois, c'est sûr"],
  ],
  "notre-dame-de-paris": [
    [/fian\?\s*ailles/gu, "fiançailles"],
    [/pa\?\s*enne/gu, "païenne"],
    [/pa\?\s*ens/gu, "païens"],
    [/\bBoussu\b/gu, "Bossu"],
    [/\bPheobus\b/gu, "Phoebus"],
    [/\bLaiss'moi\b/gu, "Laisse-moi"],
    [/\bVoila\b/gu, "Voilà"],
  ],
  "mozart-opera-rock": [
    [/fl\?\s*te/gu, "flûte"],
  ],
  "romeo-et-juliette": [
    [/c\?\s*ur/gu, "cœur"],
    [/\bMecrutio\b/gu, "Mercutio"],
    [/\bC'nest\b/gu, "Ce n'est"],
    [/M'a-t'il/gu, "M'a-t-il"],
  ],
  "1789-les-amants-de-la-bastille": [
    [/conna\?\s*t/gu, "connaît"],
    [/c\?\s*ur/gu, "cœur"],
    [/çauchemard/giu, "cauchemar"],
    [/D'avair/gu, "D'avoir"],
    [/d'um corps/gu, "d'un corps"],
    [/\bPourqoui\b/gu, "Pourquoi"],
    [/\bEr de l'Autriche\b/gu, "Et de l'Autriche"],
    [/\bFl mèneta les tiens\b/gu, "Il mènera les tiens"],
    [/\bJu vois la vertu\b/gu, "Tu vois la vertu"],
    [/\bVtiles\b/gu, "Utiles"],
    [/\bEnter nos mains\b/gu, "Entre nos mains"],
  ],
  "cyrano-de-bergerac": [
    [/\bChang'ment\b/gu, "Changement"],
  ],
};

const COMMON_FRENCH = {
  "molière": ["莫里哀", "Molière", "Molière"],
  a: ["有；已经", "has / have", "a"],
  "à": ["向；在；到", "to / at", "à", "/a/"],
  au: ["向……；在……；给……", "to the / at the", "au"],
  aux: ["向……；在……；给……", "to the / at the", "aux"],
  avec: ["和；带着；用", "with", "avec"],
  avoir: ["有；拥有；经历", "to have", "avoir"],
  beau: ["美的；漂亮的；美好", "beautiful / fine", "beau"],
  belle: ["美丽的；漂亮的", "beautiful", "belle"],
  bien: ["好；确实；很", "well / good", "bien"],
  bon: ["好的；善良的；可口的", "good", "bon"],
  car: ["因为", "because", "car"],
  ce: ["这；那；这个", "this / that", "ce"],
  ces: ["这些；那些", "these / those", "ces"],
  cet: ["这个；那个", "this / that", "cet"],
  cette: ["这个；那个", "this / that", "cette"],
  chaque: ["每个；每一", "each / every", "chaque"],
  comme: ["像；如同；作为", "like / as", "comme"],
  comment: ["如何；怎么", "how", "comment"],
  dans: ["在……里；进入", "in / into", "dans"],
  de: ["的；从；由", "of / from", "de"],
  des: ["一些；……的；从这些", "some / of the", "des"],
  deux: ["二；两个", "two", "deux"],
  doit: ["必须；应该", "must / has to", "doit"],
  donc: ["所以；那么", "so / therefore", "donc"],
  du: ["……的；一些；从……", "of the / some", "du"],
  elle: ["她；它", "she / it", "elle"],
  elles: ["她们；它们", "they", "elles"],
  en: ["在……中；对此；以……", "in / of it", "en"],
  encore: ["再次；仍然；还", "again / still", "encore"],
  enfin: ["终于；总算", "finally / at last", "enfin"],
  entre: ["在……之间；进入", "between / among / enters", "entre"],
  est: ["是；位于", "is", "est"],
  et: ["和；并且", "and", "et"],
  être: ["是；存在；成为", "to be", "être"],
  fait: ["做；使；事实", "does / makes / fact", "fait"],
  femme: ["女人；妻子", "woman / wife", "femme"],
  femmes: ["女人们；妻子们", "women / wives", "femmes"],
  homme: ["男人；人", "man / human being", "homme"],
  hommes: ["男人们；人们", "men / human beings", "hommes"],
  il: ["他；它", "he / it", "il"],
  ils: ["他们；它们", "they", "ils"],
  je: ["我", "I", "je"],
  jour: ["日子；一天；白昼", "day", "jour"],
  la: ["这；那；她；阴性定冠词", "the / her", "la"],
  le: ["这；那；他；阳性定冠词", "the / him", "le"],
  les: ["这些；那些；定冠词复数", "the", "les"],
  leur: ["他们的；给他们", "their / to them", "leur"],
  leurs: ["他们的；她们的", "their", "leurs"],
  lui: ["他；她；给他/她", "him / her / to him", "lui"],
  ma: ["我的", "my", "ma"],
  mais: ["但是", "but", "mais"],
  me: ["我；给我；使我", "me", "me"],
  mes: ["我的", "my", "mes"],
  moi: ["我；我自己", "me / myself", "moi"],
  mon: ["我的", "my", "mon"],
  monde: ["世界；世人", "world / people", "monde"],
  ne: ["不；否定结构的一部分", "not", "ne"],
  nos: ["我们的", "our", "nos"],
  notre: ["我们的", "our", "notre"],
  nous: ["我们", "we / us", "nous"],
  nuit: ["夜晚", "night", "nuit"],
  on: ["人们；我们；有人", "one / people / we", "on"],
  ont: ["有；已经", "have", "ont"],
  ou: ["或者", "or", "ou"],
  "où": ["哪里；在……的地方", "where", "où"],
  oui: ["是；愿意；同意", "yes", "oui"],
  par: ["被；通过；由；每", "by / through", "par"],
  pas: ["不；不是；脚步", "not / step", "pas"],
  plus: ["更多；更；不再", "more / no longer", "plus"],
  pour: ["为了；给；对于", "for / in order to", "pour"],
  pourquoi: ["为什么", "why", "pourquoi"],
  quand: ["当……时候；什么时候", "when", "quand"],
  que: ["那；什么；引导从句", "that / what", "que"],
  quel: ["什么；哪一个；多么", "what / which", "quel"],
  quelle: ["什么；哪一个；多么", "what / which", "quelle"],
  qui: ["谁；引导从句", "who / that", "qui"],
  rien: ["什么也没有；无事", "nothing", "rien"],
  sa: ["他/她的", "his / her", "sa"],
  sans: ["没有；不带", "without", "sans"],
  se: ["自己；相互", "oneself", "se"],
  ses: ["他/她的；其", "his / her", "ses"],
  si: ["如果；如此；是的", "if / so / yes", "si"],
  son: ["他/她/一个人的", "his / her / one's", "son"],
  sont: ["是；处于", "are", "sont"],
  sous: ["在……之下", "under", "sous"],
  sur: ["在……上；关于", "on / upon", "sur"],
  ta: ["你的", "your", "ta"],
  tant: ["如此多；这么", "so much / so many", "tant"],
  te: ["你；给你", "you", "te"],
  tes: ["你的", "your", "tes"],
  toi: ["你；你自己", "you / yourself", "toi"],
  ton: ["你的", "your", "ton"],
  tous: ["所有；全部", "all", "tous"],
  tout: ["全部；一切", "all / everything", "tout"],
  toute: ["全部的；整个的", "all / whole", "toute"],
  toutes: ["所有；全部", "all", "toutes"],
  très: ["很；非常", "very", "très"],
  tu: ["你", "you", "tu"],
  un: ["一个；一位", "a / one", "un"],
  une: ["一个；一位", "a / one", "une"],
  va: ["去；走向；将要", "goes / is going to", "va"],
  vers: ["朝向；向", "toward", "vers"],
  vie: ["生命；生活", "life", "vie"],
  vient: ["来到；来自", "comes", "vient"],
  voir: ["看见；理解", "to see", "voir"],
  vois: ["看见；明白", "see", "vois"],
  vont: ["去；将要", "go / are going", "vont"],
  votre: ["你们的；您的", "your", "votre"],
  vous: ["你；你们；您", "you", "vous"],
};

const COMMON_GERMAN = {
  aber: ["但是", "but", "aber"],
  alle: ["所有人；全部", "all / everyone", "alle"],
  als: ["作为；当……时；比", "as / when / than", "als"],
  auch: ["也；还", "also / too", "auch"],
  auf: ["在……上；向上", "on / upon", "auf"],
  aus: ["从……出来；来自", "out of / from", "aus"],
  bei: ["在……旁；在……那里", "at / with", "bei"],
  bin: ["是", "am", "bin"],
  bist: ["是", "are", "bist"],
  da: ["那里；因为", "there / since", "da"],
  das: ["这；那个；定冠词", "that / the", "das"],
  dass: ["……这一事实；引导从句", "that", "dass"],
  dein: ["你的", "your", "dein"],
  deine: ["你的", "your", "deine"],
  dem: ["这个；那个；定冠词第三格", "the / that", "dem"],
  den: ["这个；那个；定冠词", "the", "den"],
  denn: ["因为；那么", "because / then", "denn"],
  der: ["这；那；定冠词", "the / that", "der"],
  des: ["……的；定冠词第二格", "of the", "des"],
  dich: ["你", "you", "dich"],
  die: ["这；那；定冠词", "the", "die"],
  dir: ["给你；对你", "to you", "dir"],
  doch: ["可是；毕竟；确实", "yet / after all", "doch"],
  du: ["你", "you", "du"],
  ein: ["一个", "a / one", "ein"],
  eine: ["一个", "a / one", "eine"],
  einen: ["一个", "a / one", "einen"],
  einer: ["一个；某人", "one / someone", "einer"],
  er: ["他", "he", "er"],
  es: ["它；这", "it", "es"],
  für: ["为了；给", "for", "für"],
  haben: ["有；拥有", "to have", "haben"],
  hat: ["有", "has", "hat"],
  ich: ["我", "I", "ich"],
  ihr: ["她；她的；你们", "her / you", "ihr"],
  im: ["在……里面", "in the", "im"],
  in: ["在……里；进入", "in / into", "in"],
  ist: ["是", "is", "ist"],
  kein: ["没有；不是任何", "no / not any", "kein"],
  keine: ["没有；不是任何", "no / not any", "keine"],
  man: ["人们；有人", "one / people", "man"],
  mein: ["我的", "my", "mein"],
  meine: ["我的", "my", "meine"],
  mich: ["我", "me", "mich"],
  mit: ["和；带着；用", "with", "mit"],
  muss: ["必须", "must", "muss"],
  nicht: ["不；没有", "not", "nicht"],
  nichts: ["什么也没有", "nothing", "nichts"],
  noch: ["还；仍然；再", "still / yet", "noch"],
  nur: ["只；仅仅", "only", "nur"],
  oder: ["或者", "or", "oder"],
  ohne: ["没有；不带", "without", "ohne"],
  schon: ["已经；确实", "already / indeed", "schon"],
  sein: ["是；他的", "to be / his", "sein"],
  sie: ["她；他们；您", "she / they / you", "sie"],
  sind: ["是", "are", "sind"],
  so: ["这样；如此", "so / like this", "so"],
  über: ["在……上方；关于", "over / about", "über"],
  um: ["围绕；为了", "around / in order to", "um"],
  und: ["和；并且", "and", "und"],
  uns: ["我们", "us", "uns"],
  unser: ["我们的", "our", "unser"],
  von: ["从；属于", "from / of", "von"],
  vor: ["在……前；以前", "before / in front of", "vor"],
  war: ["曾是", "was", "war"],
  was: ["什么；……的事", "what", "was"],
  weil: ["因为", "because", "weil"],
  wenn: ["如果；当……时", "if / when", "wenn"],
  wer: ["谁", "who", "wer"],
  wie: ["如何；像；多么", "how / like", "wie"],
  wir: ["我们", "we", "wir"],
  wird: ["将会；变成", "will / becomes", "wird"],
  wo: ["哪里", "where", "wo"],
  zu: ["向；到；太；去做", "to / too", "zu"],
  zum: ["向这个；为了", "to the / for", "zum"],
  zur: ["向这个；为了", "to the / for", "zur"],
};

Object.assign(COMMON_FRENCH, {
  âme: ["灵魂", "soul", "âme"],
  âmes: ["灵魂", "souls", "âmes"],
  amour: ["爱；爱情", "love", "amour"],
  amours: ["爱情；恋情", "loves", "amours"],
  ange: ["天使", "angel", "ange"],
  anges: ["天使", "angels", "anges"],
  avenir: ["未来", "future", "avenir"],
  beauté: ["美；美丽", "beauty", "beauté"],
  bonheur: ["幸福；快乐", "happiness", "bonheur"],
  chanson: ["歌曲；歌", "song", "chanson"],
  chansons: ["歌曲", "songs", "chansons"],
  chant: ["歌声；歌唱", "song / singing", "chant"],
  chemin: ["道路；路径", "path / road", "chemin"],
  ciel: ["天空；天堂", "sky / heaven", "ciel"],
  corps: ["身体", "body", "corps"],
  cœur: ["心；内心", "heart", "cœur"],
  coeur: ["心；内心", "heart", "cœur"],
  cœurs: ["心；内心", "hearts", "cœurs"],
  coeurs: ["心；内心", "hearts", "cœurs"],
  désir: ["欲望；渴望", "desire", "désir"],
  désire: ["渴望；想要", "desires / wants", "désire"],
  désirée: ["被渴望的；想要的", "desired / wanted", "désirée"],
  désirent: ["渴望；想要", "desire / want", "désirent"],
  désirer: ["渴望；想要", "to desire / to want", "désirer"],
  désirs: ["欲望；渴望", "desires", "désirs"],
  desir: ["欲望；渴望", "desire", "désir"],
  desire: ["渴望；想要", "desires / wants", "désire"],
  desiree: ["被渴望的；想要的", "desired / wanted", "désirée"],
  desirent: ["渴望；想要", "desire / want", "désirent"],
  desirer: ["渴望；想要", "to desire / to want", "désirer"],
  desirs: ["欲望；渴望", "desires", "désirs"],
  d: ["字母 D；歌词音节", "letter D / lyric syllable", "D"],
  dieu: ["上帝；神", "God / god", "Dieu"],
  douleur: ["痛苦；疼痛", "pain", "douleur"],
  douleurs: ["痛苦；疼痛", "pains", "douleurs"],
  enfant: ["孩子", "child", "enfant"],
  enfants: ["孩子们", "children", "enfants"],
  envie: ["欲望；愿望；羡慕", "desire / wish / envy", "envie"],
  envies: ["欲望；愿望", "desires / wishes", "envies"],
  espoir: ["希望", "hope", "espoir"],
  étoile: ["星星；明星", "star", "étoile"],
  étoiles: ["星星", "stars", "étoiles"],
  feu: ["火；火焰", "fire", "feu"],
  fille: ["女孩；女儿", "girl / daughter", "fille"],
  filles: ["女孩们；女儿们", "girls / daughters", "filles"],
  fils: ["儿子", "son", "fils"],
  fleur: ["花", "flower", "fleur"],
  fleurs: ["花", "flowers", "fleurs"],
  folie: ["疯狂", "madness", "folie"],
  frère: ["兄弟", "brother", "frère"],
  frères: ["兄弟们", "brothers", "frères"],
  histoire: ["故事；历史", "story / history", "histoire"],
  histoires: ["故事；历史", "stories / histories", "histoires"],
  joie: ["喜悦；快乐", "joy", "joie"],
  larme: ["眼泪", "tear", "larme"],
  larmes: ["眼泪", "tears", "larmes"],
  liberté: ["自由", "freedom", "liberté"],
  lumière: ["光；光明", "light", "lumière"],
  lumières: ["光；灯光", "lights", "lumières"],
  lune: ["月亮", "moon", "lune"],
  main: ["手", "hand", "main"],
  mains: ["手", "hands", "mains"],
  mal: ["痛苦；恶；坏", "pain / evil", "mal"],
  mère: ["母亲", "mother", "mère"],
  moment: ["时刻；片刻", "moment", "moment"],
  mort: ["死亡；死神", "death", "mort"],
  morts: ["死者；死亡", "dead / deaths", "morts"],
  mot: ["词；话语", "word", "mot"],
  mots: ["词语；话语", "words", "mots"],
  nom: ["名字", "name", "nom"],
  ombre: ["影子；阴影", "shadow", "ombre"],
  ombres: ["影子；阴影", "shadows", "ombres"],
  passé: ["过去", "past", "passé"],
  père: ["父亲", "father", "père"],
  peur: ["恐惧；害怕", "fear", "peur"],
  plaisir: ["快乐；愉悦", "pleasure", "plaisir"],
  plaisirs: ["快乐；愉悦", "pleasures", "plaisirs"],
  porte: ["门", "door / gate", "porte"],
  portes: ["门", "doors / gates", "portes"],
  prière: ["祈祷；祷告", "prayer", "prière"],
  prières: ["祈祷；祷告", "prayers", "prières"],
  raison: ["理性；理由", "reason", "raison"],
  regard: ["目光；眼神", "look / gaze", "regard"],
  rêve: ["梦；梦想", "dream", "rêve"],
  rêves: ["梦；梦想", "dreams", "rêves"],
  r: ["字母 R；歌词音节", "letter R / lyric syllable", "R"],
  roi: ["国王", "king", "roi"],
  sang: ["血；血液", "blood", "sang"],
  secret: ["秘密", "secret", "secret"],
  sœur: ["姐妹；妹妹/姐姐", "sister", "sœur"],
  soeur: ["姐妹；妹妹/姐姐", "sister", "sœur"],
  soleil: ["太阳", "sun", "soleil"],
  terre: ["土地；大地；地球", "earth / land", "terre"],
  tête: ["头；脑袋", "head", "tête"],
  tour: ["塔；轮次；转弯", "tower / turn", "tour"],
  tours: ["塔；轮次；转弯", "towers / turns", "tours"],
  ville: ["城市", "city", "ville"],
  voix: ["声音；嗓音", "voice", "voix"],
  x: ["字母 X；歌词音节", "letter X / lyric syllable", "X"],
  yeux: ["眼睛", "eyes", "yeux"],
});

Object.assign(COMMON_FRENCH, {
  "a-t-il": ["他/它有吗；是否", "has he / does it", "a-t-il"],
  abandonn: ["被抛弃的；遗弃", "abandoned", "abandonné"],
  abri: ["庇护；避难处", "shelter", "abri"],
  accourt: ["跑来；赶来", "runs up", "accourt"],
  accusée: ["被控告的；被指责的", "accused", "accusée"],
  adore: ["热爱；崇拜", "adores / loves", "adore"],
  ai: ["有；已经（avoir 第一人称）", "have", "ai"],
  aiguille: ["针；指针", "needle / hand", "aiguille"],
  ailles: ["去（aller 虚拟式）", "go", "ailles"],
  aim: ["爱；喜欢", "love / like", "aimer"],
  aimait: ["爱；喜欢", "loved / liked", "aimait"],
  aimante: ["有爱意的；慈爱的", "loving", "aimante"],
  aime: ["爱；喜欢", "love / like", "aime"],
  aimé: ["被爱的；爱过", "loved", "aimé"],
  alentours: ["周围；附近", "surroundings", "alentours"],
  alléluia: ["哈利路亚", "hallelujah", "alléluia"],
  alléluias: ["哈利路亚", "hallelujahs", "alléluias"],
  allure: ["姿态；样子；步态", "appearance / gait", "allure"],
  amantes: ["情人；恋人", "lovers", "amantes"],
  amants: ["情人；恋人", "lovers", "amants"],
  amies: ["朋友", "friends", "amies"],
  amoureux: ["相爱的；恋人", "in love / lover", "amoureux"],
  anathème: ["诅咒；谴责", "curse / anathema", "anathème"],
  années: ["年份；岁月", "years", "années"],
  anonymes: ["匿名的；无名的", "anonymous", "anonymes"],
  ans: ["年；岁", "years old / years", "ans"],
  apparaître: ["出现；显现", "to appear", "apparaître"],
  appelle: ["叫；呼唤", "calls", "appelle"],
  arbre: ["树", "tree", "arbre"],
  archers: ["弓箭手", "archers", "archers"],
  armure: ["盔甲", "armor", "armure"],
  arrêter: ["停止；逮捕", "to stop / to arrest", "arrêter"],
  arriver: ["到达；发生", "to arrive / happen", "arriver"],
  arrives: ["到达；发生", "arrive / happen", "arrives"],
  artistes: ["艺术家；艺人", "artists", "artistes"],
  as: ["有（avoir 第二人称）", "have", "as"],
  astre: ["星体；天体", "star / heavenly body", "astre"],
  atours: ["装饰；盛装", "finery", "atours"],
  attend: ["等待；期待", "waits / expects", "attend"],
  aucun: ["没有任何；无一", "no / none", "aucun"],
  aura: ["将有；光环", "will have / aura", "aura"],
  auras: ["你将有", "will have", "auras"],
  auront: ["他们将有", "will have", "auront"],
  avais: ["曾有；曾经", "had", "avais"],
  avait: ["曾有；曾经", "had", "avait"],
  bal: ["舞会", "ball / dance", "bal"],
  barreaux: ["栏杆；铁窗", "bars", "barreaux"],
  bataille: ["战斗；斗争", "battle", "bataille"],
  beaux: ["美丽的；漂亮的", "beautiful", "beaux"],
  blessures: ["伤口；伤痛", "wounds", "blessures"],
  blanche: ["白色的", "white", "blanche"],
  blâme: ["责备；谴责", "blame", "blâme"],
  bleu: ["蓝色的；蓝色", "blue", "bleu"],
  boire: ["喝", "to drink", "boire"],
  bouche: ["嘴", "mouth", "bouche"],
  brillent: ["闪耀；发亮", "shine", "brillent"],
  briser: ["打破；粉碎", "to break", "briser"],
  c: ["这；那（ce 的省略）", "it / this", "c'"],
  ca: ["这；那", "this / that", "ça"],
  cache: ["隐藏；藏住", "hides", "cache"],
  cage: ["笼子", "cage", "cage"],
  celles: ["那些；那些人/物", "those", "celles"],
  cent: ["一百", "hundred", "cent"],
  cesse: ["停止", "stops / ceases", "cesse"],
  changer: ["改变", "to change", "changer"],
  chanter: ["唱歌", "to sing", "chanter"],
  chants: ["歌声；圣歌", "songs / chants", "chants"],
  chaud: ["热的；温暖的", "hot / warm", "chaud"],
  chemins: ["道路；路径", "paths / roads", "chemins"],
  cherche: ["寻找；追求", "seeks / looks for", "cherche"],
  chercher: ["寻找；追求", "to seek / look for", "chercher"],
  chez: ["在……家；在……那里", "at the home of / among", "chez"],
  chien: ["狗", "dog", "chien"],
  cieux: ["天空；天堂", "heavens", "cieux"],
  citoyens: ["公民", "citizens", "citoyens"],
  combats: ["战斗；斗争", "fights / battles", "combats"],
  comprends: ["理解；明白", "understand", "comprends"],
  connais: ["认识；知道", "know", "connais"],
  condamné: ["被判罪的；被谴责的", "condemned", "condamné"],
  condamne: ["谴责；判罪", "condemns", "condamne"],
  coule: ["流动；流逝", "flows", "coule"],
  cour: ["宫廷；院子", "court / courtyard", "cour"],
  cours: ["课程；过程；河道", "course / class", "cours"],
  couronne: ["王冠；加冕", "crown", "couronne"],
  cri: ["喊声；呼喊", "cry / shout", "cri"],
  crime: ["罪行", "crime", "crime"],
  crimes: ["罪行", "crimes", "crimes"],
  cris: ["喊声；呼喊", "cries / shouts", "cris"],
  cru: ["相信过；以为", "believed", "cru"],
  danse: ["舞蹈；跳舞", "dance", "danse"],
  danser: ["跳舞", "to dance", "danser"],
  debout: ["站着；起来", "standing / up", "debout"],
  défaites: ["失败；败仗", "defeats", "défaites"],
  depuis: ["自从；以来", "since / for", "depuis"],
  dessus: ["在上面；上方", "above / on top", "dessus"],
  devenir: ["成为", "to become", "devenir"],
  devant: ["在……前面；面对", "in front of / before", "devant"],
  déteste: ["讨厌；憎恨", "hates", "déteste"],
  doigts: ["手指", "fingers", "doigts"],
  dieux: ["众神", "gods", "dieux"],
  différences: ["差异；不同", "differences", "différences"],
  diras: ["你将说", "will say", "diras"],
  discours: ["演说；话语", "speech / discourse", "discours"],
  dois: ["必须；欠", "must / owe", "dois"],
  donne: ["给；赋予", "gives", "donne"],
  donné: ["给过的；被给予的", "given", "donné"],
  donnent: ["给；赋予", "give", "donnent"],
  droits: ["权利；正直的", "rights / straight", "droits"],
  enfance: ["童年", "childhood", "enfance"],
  entier: ["整个的；完整的", "whole / entire", "entier"],
  erreurs: ["错误", "errors", "erreurs"],
  été: ["夏天；曾经是", "summer / been", "été"],
  était: ["曾是；当时是", "was", "était"],
  étrange: ["奇怪的；陌生的", "strange", "étrange"],
  facile: ["容易的", "easy", "facile"],
  façon: ["方式；方法", "way / manner", "façon"],
  fer: ["铁", "iron", "fer"],
  ferai: ["我将做", "will do / make", "ferai"],
  fête: ["节日；庆典", "party / feast", "fête"],
  fil: ["线；丝线", "thread", "fil"],
  finit: ["结束；完成", "finishes / ends", "finit"],
  fois: ["次；回", "time / times", "fois"],
  force: ["力量；强迫", "strength / force", "force"],
  fout: ["搞砸；粗俗语", "damn / messes with", "fout"],
  fous: ["疯狂的；疯子", "mad / fools", "fous"],
  fragile: ["脆弱的", "fragile", "fragile"],
  gammes: ["音阶；练习曲", "scales", "gammes"],
  garde: ["守卫；保留", "keeps / guard", "garde"],
  grand: ["大的；伟大的", "great / big", "grand"],
  grande: ["大的；伟大的", "great / big", "grande"],
  grandes: ["大的；伟大的", "great / big", "grandes"],
  grandir: ["成长；变大", "to grow", "grandir"],
  grandi: ["成长了；长大了", "grown", "grandi"],
  grands: ["大的；伟大的", "great / big", "grands"],
  hais: ["憎恨", "hate", "hais"],
  heureux: ["幸福的；快乐的", "happy", "heureux"],
  ici: ["这里", "here", "ici"],
  idées: ["想法；主意", "ideas", "idées"],
  image: ["图像；形象", "image", "image"],
  jeux: ["游戏；玩笑", "games", "jeux"],
  jours: ["日子；白天", "days", "jours"],
  juré: ["发誓的；陪审员", "sworn / juror", "juré"],
  justice: ["正义；司法", "justice", "justice"],
  laissé: ["留下；让", "left / let", "laissé"],
  langue: ["语言；舌头", "language / tongue", "langue"],
  lève: ["升起；举起", "raises / rises", "lève"],
  libre: ["自由的", "free", "libre"],
  lignes: ["线；行", "lines", "lignes"],
  longtemps: ["长久地；很久", "for a long time", "longtemps"],
  mâle: ["男性；雄性的", "male", "mâle"],
  malheureux: ["不幸的；悲伤的", "unhappy / unfortunate", "malheureux"],
  marche: ["走；行进；台阶", "walk / march / step", "marche"],
  maris: ["丈夫", "husbands", "maris"],
  mémoire: ["记忆；记忆力", "memory", "mémoire"],
  mensonge: ["谎言", "lie", "mensonge"],
  mer: ["海", "sea", "mer"],
  mêmes: ["相同的；自己", "same / selves", "mêmes"],
  mets: ["放；摆；菜肴", "put / dish", "mets"],
  mieux: ["更好；最好", "better", "mieux"],
  milieu: ["中间；环境", "middle / milieu", "milieu"],
  mirage: ["海市蜃楼；幻象", "mirage", "mirage"],
  misères: ["苦难；贫困", "miseries", "misères"],
  moi: ["我；我自己", "me / myself", "moi"],
  moitié: ["一半", "half", "moitié"],
  mur: ["墙", "wall", "mur"],
  murs: ["墙", "walls", "murs"],
  musique: ["音乐", "music", "musique"],
  n: ["不（ne 的省略）", "not", "n'"],
  nature: ["自然；本性", "nature", "nature"],
  ni: ["也不；既不", "nor / neither", "ni"],
  nuits: ["夜晚", "nights", "nuits"],
  ouvert: ["打开的；开放的", "open", "ouvert"],
  pages: ["页；页面", "pages", "pages"],
  pareil: ["相同的；一样的", "same / alike", "pareil"],
  parvis: ["教堂前广场", "forecourt", "parvis"],
  pardonne: ["原谅", "forgives", "pardonne"],
  passage: ["通道；经过；段落", "passage", "passage"],
  passe: ["经过；过去；发生", "passes / goes by", "passe"],
  pensées: ["思想；想法", "thoughts", "pensées"],
  pensent: ["认为；思考", "think", "pensent"],
  perds: ["失去；迷失", "lose", "perds"],
  permis: ["允许的；许可证", "allowed / permit", "permis"],
  personne: ["人；没有人", "person / nobody", "personne"],
  peut: ["能够；可能", "can / may", "peut"],
  pied: ["脚；底部", "foot", "pied"],
  pleurs: ["哭泣；眼泪", "weeping / tears", "pleurs"],
  pluie: ["雨", "rain", "pluie"],
  poids: ["重量；负担", "weight", "poids"],
  poser: ["放下；提出", "to place / ask", "poser"],
  posé: ["放下的；平静的", "placed / calm", "posé"],
  pourrais: ["能够；可以", "could", "pourrais"],
  pourrait: ["能够；可能", "could / might", "pourrait"],
  printemps: ["春天", "spring", "printemps"],
  prison: ["监狱；囚禁", "prison", "prison"],
  prisons: ["监狱；囚禁", "prisons", "prisons"],
  prix: ["价格；奖赏；代价", "price / prize", "prix"],
  promesses: ["承诺；诺言", "promises", "promesses"],
  promis: ["承诺的；许诺", "promised", "promis"],
  putain: ["妓女；粗俗感叹", "whore / damn", "putain"],
  quitte: ["离开；抛下", "leaves", "quitte"],
  raconte: ["讲述；叙述", "tells / recounts", "raconte"],
  regrets: ["遗憾；后悔", "regrets", "regrets"],
  ressemble: ["像；相似", "resembles", "ressemble"],
  retour: ["返回；回归", "return", "retour"],
  rêver: ["做梦；梦想", "to dream", "rêver"],
  rêvé: ["梦见的；梦想的", "dreamed", "rêvé"],
  robe: ["裙子；长袍", "dress / robe", "robe"],
  rois: ["国王们", "kings", "rois"],
  route: ["道路；路线", "road / route", "route"],
  rue: ["街道", "street", "rue"],
  rues: ["街道", "streets", "rues"],
  sais: ["知道；会", "know", "sais"],
  salut: ["你好；拯救", "hello / salvation", "salut"],
  satin: ["缎子", "satin", "satin"],
  seconde: ["秒；第二的", "second", "seconde"],
  semble: ["似乎；看起来", "seems", "semble"],
  sera: ["将是", "will be", "sera"],
  seras: ["你将是", "will be", "seras"],
  serments: ["誓言", "oaths", "serments"],
  serons: ["我们将是", "will be", "serons"],
  seront: ["他们将是", "will be", "seront"],
  solitaire: ["孤独的", "solitary / lonely", "solitaire"],
  sombres: ["阴暗的；忧郁的", "dark / gloomy", "sombres"],
  sommes: ["是；我们是", "are / we are", "sommes"],
  sonne: ["响起；敲响", "rings", "sonne"],
  souvenirs: ["回忆；纪念品", "memories / souvenirs", "souvenirs"],
  souviens: ["记得；回想", "remember", "souviens"],
  suffit: ["足够；够了", "is enough", "suffit"],
  surtout: ["尤其；特别", "especially / above all", "surtout"],
  su: ["知道过；懂得", "known", "su"],
  t: ["你；给你（te 的省略）", "you", "t'"],
  taire: ["使沉默；闭嘴", "to silence / be quiet", "taire"],
  tard: ["晚；迟", "late", "tard"],
  tellement: ["如此；这么", "so much / so", "tellement"],
  tendre: ["温柔的；伸出", "tender / to stretch", "tendre"],
  tendresse: ["温柔；柔情", "tenderness", "tendresse"],
  tiens: ["拿着；属于你；喂", "hold / yours", "tiens"],
  tourne: ["转动；转身", "turns", "tourne"],
  vent: ["风", "wind", "vent"],
  vies: ["生命；生活", "lives", "vies"],
  violence: ["暴力；强烈", "violence", "violence"],
  vis: ["生活；看见；螺丝", "live / saw", "vis"],
  voudrait: ["想要；愿意", "would like", "voudrait"],
  voudrais: ["想要；愿意", "would like", "voudrais"],
  voulait: ["想要；愿意", "wanted", "voulait"],
  y: ["那里；在其中", "there / in it", "y"],
});

const COMMON_ENGLISH = {
  a: ["不定冠词；一个", "indefinite article", "a"],
  all: ["全部；所有", "all / everything", "all"],
  am: ["是；be 的第一人称单数现在式", "first-person singular of be", "am"],
  an: ["不定冠词；一个", "indefinite article", "an"],
  and: ["和；并且", "and", "and"],
  are: ["是；be 的复数或第二人称现在式", "plural / second-person form of be", "are"],
  as: ["作为；像……一样；当……时", "as / like / while", "as"],
  be: ["是；成为；存在", "to be", "be"],
  but: ["但是；除了", "but / except", "but"],
  by: ["被；通过；在……旁边", "by / through", "by"],
  do: ["做；用于疑问、否定或强调", "do; auxiliary verb", "do"],
  does: ["do 的第三人称单数；用于疑问、否定或强调", "third-person singular of do; auxiliary verb", "does"],
  for: ["为了；给；因为", "for", "for"],
  from: ["从；来自", "from", "from"],
  he: ["他", "he", "he"],
  her: ["她；她的", "her", "her"],
  his: ["他的", "his", "his"],
  i: ["我", "I", "I"],
  in: ["在……里面；进入", "in / into", "in"],
  is: ["是；be 的第三人称单数现在式", "third-person singular of be", "is"],
  it: ["它；这件事", "it", "it"],
  me: ["我；给我", "me", "me"],
  my: ["我的", "my", "my"],
  no: ["不；没有", "no", "no"],
  not: ["不；没有", "not", "not"],
  of: ["……的；属于", "of", "of"],
  on: ["在……上；关于；继续", "on", "on"],
  or: ["或者；否则", "or", "or"],
  she: ["她", "she", "she"],
  so: ["所以；如此", "so", "so"],
  that: ["那个；那件事；引导从句", "that", "that"],
  the: ["定冠词；这个/那个", "definite article", "the"],
  their: ["他们的；她们的", "their", "their"],
  them: ["他们；她们；它们", "them", "them"],
  they: ["他们；她们；它们", "they", "they"],
  to: ["到；向；为了；不定式标记", "to", "to"],
  was: ["是；be 的过去式", "past tense of be", "was"],
  we: ["我们", "we", "we"],
  were: ["是；be 的过去式", "past tense of be", "were"],
  what: ["什么；多么", "what", "what"],
  who: ["谁；……的人", "who", "who"],
  with: ["和；带着；用", "with", "with"],
  you: ["你；你们", "you", "you"],
  your: ["你的；你们的", "your", "your"],
};

function main() {
  const rougeGlossary = loadRougeGlossary();
  const freedictGlossary = loadFreedictGlossary();
  const englishGlossary = loadEnglishGlossary();
  const summary = [];

  const requestedSlug = process.argv.find((arg) => arg.startsWith("--show="))?.slice("--show=".length);
  const dryRun = process.argv.includes("--dry-run");
  const textOnly = process.argv.includes("--text-only");
  const stylesOnly = process.argv.includes("--styles-only");
  const cursorsOnly = process.argv.includes("--cursors-only");
  const testsOnly = process.argv.includes("--tests-only");
  const indexOnly = process.argv.includes("--index-only");
  const scriptsOnly = process.argv.includes("--scripts-only");
  const selectedShows = requestedSlug ? SHOWS.filter((show) => show.slug === requestedSlug) : SHOWS;
  if (requestedSlug && selectedShows.length === 0) throw new Error(`Unknown show slug: ${requestedSlug}`);

  selectedShows.forEach((show) => {
    if (cursorsOnly) {
      if (WAVE2_SHOW_SLUGS.has(show.slug)) {
        writeFile(path.join(ROOT, "shared", "cursors"), `${show.slug}.js`, renderReferenceCursor(show));
        summary.push({ slug: show.slug, cursor: "built" });
      }
      return;
    }
    if (testsOnly) {
      const testDir = path.join(ROOT, show.slug, "tests");
      fs.mkdirSync(testDir, { recursive: true });
      writeFile(testDir, "behavior.test.js", renderTests(show));
      summary.push({ slug: show.slug, tests: "built" });
      return;
    }
    if (indexOnly) {
      const outDir = path.join(ROOT, show.slug);
      fs.mkdirSync(outDir, { recursive: true });
      writeFile(outDir, "index.html", renderIndex(show));
      summary.push({ slug: show.slug, index: "built" });
      return;
    }
    if (scriptsOnly) {
      const outDir = path.join(ROOT, show.slug);
      fs.mkdirSync(outDir, { recursive: true });
      writeFile(outDir, "script.js", renderScript(show));
      summary.push({ slug: show.slug, script: "built" });
      return;
    }
    if (stylesOnly) {
      const outDir = path.join(ROOT, show.slug);
      fs.mkdirSync(outDir, { recursive: true });
      writeFile(outDir, "style.css", renderStyle(show));
      summary.push({ slug: show.slug, styles: "built" });
      return;
    }
    const sourcePath = path.join(LYRICS_ROOT, show.source);
    const songs = parseMarkdown(sourcePath, show);
    if (dryRun) {
      const lines = songs.flatMap((song) => song.lines);
      const missingTitles = songs.filter((song) => !song.titleZh).map((song) => song.title);
      if (missingTitles.length) {
        console.error(`${show.slug} missing Chinese song titles: ${JSON.stringify(missingTitles)}`);
      }
      summary.push({
        slug: show.slug,
        songs: songs.length,
        lines: lines.length,
        words: "not-built",
        missingTitleZh: missingTitles.length,
        missingIpa: lines.filter((line) => !line.ipa).length,
        missingZh: lines.filter((line) => !line.zh).length,
        missingEn: show.language === "en" ? 0 : lines.filter((line) => !line.en).length,
      });
      return;
    }
    if (textOnly) {
      const outDir = path.join(ROOT, show.slug);
      fs.mkdirSync(outDir, { recursive: true });
      writeFile(outDir, "songs.js", `window.songs = ${JSON.stringify(songs, null, 2)};\n`);
      summary.push({
        slug: show.slug,
        songs: songs.length,
        lines: songs.reduce((total, song) => total + song.lines.length, 0),
        words: "not-built",
      });
      return;
    }
    const glossaryShow = show.contentSlug ? { ...show, slug: show.contentSlug } : show;
    const wordEntries = buildWordEntries(glossaryShow, songs, rougeGlossary, freedictGlossary, englishGlossary);
    const outDir = path.join(ROOT, show.slug);

    fs.mkdirSync(path.join(outDir, "scripts"), { recursive: true });
    fs.mkdirSync(path.join(outDir, "tests"), { recursive: true });
    fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });
    fs.mkdirSync(path.join(outDir, "audio", "lines"), { recursive: true });
    fs.mkdirSync(path.join(outDir, "audio", "words"), { recursive: true });

    writeFile(outDir, "index.html", renderIndex(show));
    writeFile(outDir, "style.css", renderStyle(show));
    writeFile(outDir, "script.js", renderScript(show));
    writeFile(outDir, "songs.js", `window.songs = ${JSON.stringify(songs, null, 2)};\n`);
    writeFile(outDir, "word-data.js", `window.wordEntries = ${JSON.stringify(wordEntries, null, 2)};\n`);
    writeFile(path.join(outDir, "scripts"), "build-audio.js", renderAudioBuilder(show));
    writeFile(path.join(outDir, "tests"), "behavior.test.js", renderTests(show));
    if (WAVE2_SHOW_SLUGS.has(show.slug)) {
      writeFile(path.join(ROOT, "shared", "cursors"), `${show.slug}.js`, renderReferenceCursor(show));
    }

    summary.push({
      slug: show.slug,
      songs: songs.length,
      lines: songs.reduce((total, song) => total + song.lines.length, 0),
      words: Object.keys(wordEntries).length,
    });
  });

  console.table(summary);
}

function loadRougeGlossary() {
  const glossary = {};

  if (!fs.existsSync(ROUGE_SCRIPT)) return glossary;
  const source = fs.readFileSync(ROUGE_SCRIPT, "utf8");
  const match = source.match(/const COMMON_WORD_GLOSSARY = (\{[\s\S]*?\n\});/);
  try {
    if (match) {
      mergeGlossaryObject(glossary, vm.runInNewContext(`(${match[1]})`, {}));
    }
  } catch {
    // Keep going; the per-song glossary below is more valuable for content words.
  }

  if (!fs.existsSync(ROUGE_SONGS)) return glossary;
  try {
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(ROUGE_SONGS, "utf8"), context);
    (context.window.songs || []).forEach((song) => {
      mergeGlossaryObject(glossary, song.wordGlossary || {});
      (song.lines || []).forEach((line) => {
        ((line.analysis || {}).words || []).forEach((word) => {
          if (!word.fr || !word.zh || !word.en) return;
          addGlossaryEntry(glossary, word.fr, {
            zh: word.zh,
            en: word.en,
            speak: word.fr,
          });
        });
      });
    });
  } catch {
    return glossary;
  }

  return glossary;
}

function loadFreedictGlossary() {
  if (!fs.existsSync(FREEDICT_GLOSSARY)) return {};
  try {
    return JSON.parse(fs.readFileSync(FREEDICT_GLOSSARY, "utf8"));
  } catch {
    return {};
  }
}

function loadEnglishGlossary() {
  if (!fs.existsSync(GOOGLE_ENGLISH_GLOSSARY)) return {};
  try {
    return JSON.parse(fs.readFileSync(GOOGLE_ENGLISH_GLOSSARY, "utf8"));
  } catch {
    return {};
  }
}

function mergeGlossaryObject(target, source) {
  Object.entries(source || {}).forEach(([key, entry]) => {
    addGlossaryEntry(target, entry.speak || key, {
      zh: entry.zh || entry.meaning,
      en: entry.en,
      ipa: entry.ipa,
      speak: entry.speak || key,
    });
  });
}

function addGlossaryEntry(target, term, entry) {
  const tokens = collectTokens(term);
  const candidates = tokens.length ? tokens : [term];

  candidates.forEach((candidate) => {
    const key = normalizeKey(candidate);
    if (!key || target[key] || !entry.zh || !entry.en) return;
    target[key] = {
      zh: entry.zh,
      en: shortEnglishGloss(entry.en),
      ipa: entry.ipa,
      speak: normalizeSpeak(candidate),
    };

    const singular = singularFrenchKey(key);
    if (singular && !target[singular]) {
      target[singular] = {
        zh: String(entry.zh).replace(/们/g, ""),
        en: singularEnglishGloss(entry.en),
        ipa: entry.ipa,
        speak: normalizeSpeak(candidate).replace(/s$/i, ""),
      };
    }
  });
}

function parseMarkdown(file, show) {
  const contentShow = show.contentSlug ? { ...show, slug: show.contentSlug } : show;
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const songs = [];
  let current = null;
  let currentTitleZh = "";
  let header = null;
  let pendingSpeaker = "";

  lines.forEach((raw) => {
    const heading = raw.match(/^##\s+(\d+)\.\s+(.+?)\s*$/);
    if (heading) {
      const sourceTitle = normalizeGeneratedLineText(contentShow, heading[2].trim(), "original");
      current = {
        order: Number(heading[1]),
        id: slugify(`${heading[1]}-${sourceTitle}`),
        sourceTitle,
        title: stripSongTitleVersionSuffix(sourceTitle),
        titleZh: "",
        lines: [],
      };
      songs.push(current);
      currentTitleZh = "";
      header = null;
      pendingSpeaker = "";
      return;
    }

    if (!current) return;

    const zhTitle = raw.match(/^中文歌名：(.+?)\s*$/);
    if (zhTitle) {
      currentTitleZh = zhTitle[1].trim();
      current.titleZh = currentTitleZh === "未提供" ? "" : stripSongTitleVersionSuffix(currentTitleZh);
      return;
    }

    if (!raw.startsWith("|")) return;
    const cells = splitMarkdownRow(raw);
    if (!cells.length) return;
    if (cells.some((cell) => /^---/.test(cell))) return;
    if (cells.includes("行号")) {
      header = cells;
      return;
    }
    if (!header || !/^\d+$/.test(cells[0] || "")) return;

    const row = rowByHeader(header, cells);
    const original = row["法语歌词（校订）"] || row["德语歌词（校订）"] || row["英文歌词（校订）"] || "";
    if (!original.trim()) return;
    if (/^--.*--$/u.test(original.trim())) return;
    const speakerCell = extractSpeaker(original);
    if (!speakerCell.text) {
      pendingSpeaker = speakerCell.speaker || pendingSpeaker;
      return;
    }
    const cleanedOriginal = cleanLineCell(contentShow, speakerCell.text, "original");
    if (!cleanedOriginal) return;

    const lineNumber = Number(cells[0]);
    const lineId = `${contentShow.slug}-${String(current.order).padStart(2, "0")}-${String(lineNumber).padStart(3, "0")}`;
    const textOverride = LINE_TEXT_OVERRIDES[lineId] || {};
    current.lines.push({
      id: lineId,
      lineIndex: lineNumber,
      speaker: speakerCell.speaker || pendingSpeaker,
      original: cleanedOriginal,
      ipa: cleanCell(row["法语音标（IPA）"] || row["德语音标（IPA）"] || row["英文音标（IPA）"] || ""),
      zh: textOverride.zh ?? cleanLineCell(contentShow, stripTranslationSpeaker(row["中文翻译（校订）"] || "", speakerCell.speaker), "zh"),
      en: textOverride.en ?? cleanLineCell(contentShow, stripTranslationSpeaker(row["English Translation"] || "", speakerCell.speaker), "en"),
      note: cleanCell(row["备注"] || ""),
    });
    pendingSpeaker = "";
  });

  const renderedSongs = songs
    .filter((song) => song.lines.length > 0)
    .filter((song) => show.sourceOrderMin === undefined || song.order >= show.sourceOrderMin)
    .filter((song) => show.sourceOrderMax === undefined || song.order <= show.sourceOrderMax)
    .map((song, index) => {
      const { sourceTitle, ...displaySong } = song;
      const translatedTitle = SONG_TITLE_OVERRIDES[contentShow.slug]?.[sourceTitle]
        || song.titleZh
        || SONG_TITLE_TRANSLATIONS[show.slug]?.[sourceTitle]
        || SONG_TITLE_TRANSLATIONS[contentShow.slug]?.[sourceTitle]
        || SONG_TITLE_OVERRIDES[contentShow.slug]?.[song.title]
        || SONG_TITLE_TRANSLATIONS[show.slug]?.[song.title]
        || SONG_TITLE_TRANSLATIONS[contentShow.slug]?.[song.title]
        || "";
      return {
        ...displaySong,
        titleZh: stripSongTitleVersionSuffix(translatedTitle),
        sourceOrder: song.order,
        displayOrder: index + 1,
      };
    });

  return normalizeSongsForShow(contentShow, renderedSongs);
}

function normalizeSongsForShow(show, songs) {
  return songs.map((song) => {
    let lines = show.slug === "le-roi-soleil" && song.sourceOrder === 2
      ? splitRoiSoleilOpening(song.lines, show)
      : normalizeGeneratedSongLines(show, song.lines);
    if (show.slug === "1789-les-amants-de-la-bastille" && song.sourceOrder === 2) {
      lines = merge1789OpeningLines(lines, show);
    }
    return { ...song, lines: mergeReviewedLineWraps(lines, show) };
  });
}

function mergeReviewedLineWraps(lines, show) {
  const groups = new Map(
    (LINE_MERGE_OVERRIDES[show.slug] || []).map((ids) => [ids[0], ids]),
  );
  const merged = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const ids = groups.get(line.id);
    if (!ids) {
      merged.push(line);
      index += 1;
      continue;
    }
    const members = lines.slice(index, index + ids.length);
    const actualIds = members.map((member) => member.id);
    if (actualIds.join("\n") !== ids.join("\n")) {
      throw new Error(`Line merge mismatch for ${show.slug}: expected ${ids.join(", ")}; got ${actualIds.join(", ")}`);
    }
    const textOverride = MERGED_LINE_TEXT_OVERRIDES[line.id] || {};
    const joinedOriginal = members.map((member) => member.original).join(" ")
      .replace(/\s+([,.;!?…])/gu, "$1")
      .trim();
    const original = textOverride.original || joinedOriginal;
    const joinedEnglish = members.map((member) => member.en).filter(Boolean).join(" ")
      .replace(/\s+([,.;!?…])/gu, "$1")
      .trim();
    const joinedChinese = members.map((member) => member.zh).filter(Boolean).join("").trim();
    merged.push({
      ...line,
      original,
      ipa: ipaFor(original, show.voice),
      en: textOverride.en ?? joinedEnglish,
      zh: textOverride.zh ?? joinedChinese,
      note: members.map((member) => member.note).filter(Boolean).join("；"),
    });
    index += ids.length;
  }
  return merged.map((line, index) => ({ ...line, lineIndex: index + 1 }));
}

function merge1789OpeningLines(lines, show) {
  const groups = new Map([
    ["1789-les-amants-de-la-bastille-02-004", { count: 3, original: "Pour qui courir le risque de marcher à genoux ?", en: "For whom take the risk of walking on one's knees?", zh: "为了谁，要冒险卑躬屈膝？" }],
    ["1789-les-amants-de-la-bastille-02-009", { count: 3, original: "L'odieux chant du phénix qui nous prend tout", en: "The hateful song of the phoenix that takes everything from us", zh: "那可憎的凤凰之歌夺走了我们的一切" }],
    ["1789-les-amants-de-la-bastille-02-012", { count: 2, original: "J'ai subi le supplice du baiser sur la joue", en: "I endured the torment of a kiss on the cheek", zh: "我承受了面颊之吻的折磨" }],
    ["1789-les-amants-de-la-bastille-02-014", { count: 2, original: "Faut-il boire le calice jusqu'au bout ?", en: "Must we drink the bitter cup to the very end?", zh: "难道必须把这杯苦酒喝到底？" }],
    ["1789-les-amants-de-la-bastille-02-016", { count: 2, original: "Rien ne vaut le prix d'un homme", en: "Nothing is worth the price of a man", zh: "没有什么抵得上一个人的价值" }],
    ["1789-les-amants-de-la-bastille-02-018", { count: 2, original: "Ne tisse pas ta couronne dans le fil qui nous tient", en: "Do not weave your crown with the thread that binds us", zh: "不要用束缚我们的线编织你的王冠" }],
    ["1789-les-amants-de-la-bastille-02-020", { count: 2, original: "Le cri de ma naissance valait le tien", en: "The cry at my birth was worth yours", zh: "我出生时的啼哭与你的一样珍贵" }],
    ["1789-les-amants-de-la-bastille-02-025", { count: 2, original: "On se perd dans les rixes des règles que l'on fixe", en: "We lose ourselves in brawls over rules we set", zh: "我们迷失在自己定下规则的争斗中" }],
    ["1789-les-amants-de-la-bastille-02-027", { count: 4, original: "Soldats de père en fils, sans cesse au garde à vous, sous le joug des milices jusqu'au bout", en: "Soldiers from father to son, forever at attention under the yoke of militias to the very end", zh: "父子代代为兵，永远立正，直到最后都受民兵枷锁奴役" }],
    ["1789-les-amants-de-la-bastille-02-031", { count: 2, original: "Rien ne vaut le prix d'un homme", en: "Nothing is worth the price of a man", zh: "没有什么抵得上一个人的价值" }],
    ["1789-les-amants-de-la-bastille-02-033", { count: 2, original: "Ne tisse pas ta couronne dans le fil qui nous tient", en: "Do not weave your crown with the thread that binds us", zh: "不要用束缚我们的线编织你的王冠" }],
    ["1789-les-amants-de-la-bastille-02-035", { count: 2, original: "Le cri de ma naissance valait le tien", en: "The cry at my birth was worth yours", zh: "我出生时的啼哭与你的一样珍贵" }],
  ]);
  const merged = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const group = groups.get(line.id);
    if (!group) {
      merged.push(line);
      index += 1;
      continue;
    }
    merged.push({
      ...line,
      original: group.original,
      ipa: ipaFor(group.original, show.voice),
      en: group.en,
      zh: group.zh,
    });
    index += group.count;
  }
  return merged.map((line, index) => ({ ...line, lineIndex: index + 1 }));
}

function normalizeGeneratedSongLines(show, lines) {
  const splitOrdinaryComma = new Set([
    "1789-les-amants-de-la-bastille",
    "moliere-le-spectacle-musical",
  ]).has(show.slug);

  const expanded = lines.flatMap((line) => {
    let originals = [line.original];
    if (line.original.includes("，")) {
      originals = line.original.split(/\s*，\s*/u).filter(Boolean);
    } else if (splitOrdinaryComma || (show.slug === "mozart-opera-rock" && line.original === "On se reverra, On se reverra")) {
      const candidates = line.original.split(/\s*,\s*(?=[A-ZÀÂÄÇÉÈÊËÎÏÔÙÛÜŸŒÆ])/u).filter(Boolean);
      if (candidates.length > 1 && new Set(candidates.map((part) => part.toLocaleLowerCase("fr-FR"))).size > 1) {
        originals = candidates;
      }
    }

    const count = originals.length;
    const english = alignParallelSegments(String(line.en).split(/\s*[,，]\s*(?=[A-Z])/u).filter(Boolean), count, ", ");
    const chinese = alignParallelSegments(String(line.zh).split(/\s*，\s*/u).filter(Boolean), count, "，");

    return originals.map((original, index) => {
      const normalizedOriginal = normalizeGeneratedLineText(show, original, "original");
      return {
        ...line,
        id: count === 1 ? line.id : `${line.id}-${String.fromCharCode(97 + index)}`,
        original: normalizedOriginal,
        ipa: count === 1 && normalizedOriginal === line.original && line.ipa ? line.ipa : ipaFor(normalizedOriginal, show.voice),
        en: normalizeGeneratedLineText(show, english[index] || line.en, "en"),
        zh: chinese[index] || line.zh,
        note: index === 0 ? line.note : "",
      };
    });
  });

  return expanded.map((line, index) => ({ ...line, lineIndex: index + 1 }));
}

function alignParallelSegments(parts, count, joiner) {
  if (parts.length <= count) return parts;
  const leadingCount = parts.length - count + 1;
  return [parts.slice(0, leadingCount).join(joiner), ...parts.slice(leadingCount)];
}

function normalizeGeneratedLineText(show, value, field) {
  let cleaned = String(value || "")
    .replace(/[！]/gu, "!")
    .replace(/[？]/gu, "?")
    .replace(/[：]/gu, ":")
    .replace(/[；]/gu, ";")
    .replace(/[，]/gu, ",")
    .replace(/[（）]/gu, (character) => character === "（" ? "(" : ")")
    .replace(/([.!?]|\p{Script=Latin})\(/gu, "$1 (")
    .replace(/\)(?=\p{Script=Latin})/gu, ") ")
    .replace(/——+/gu, "—")
    .replace(/^_+|_+$/gu, "")
    .replace(/_{2,}/gu, "…")
    .replace(/\\+\s*$/gu, "")
    .replace(/,\s*(?=\S)/gu, ", ")
    .replace(/([!?])(?=\p{L})/gu, "$1 ")
    .replace(/([:;])(?=\p{L})/gu, "$1 ")
    .replace(/\s*，\s*/gu, ", ")
    .replace(/\s*：\s*/gu, ": ")
    .replace(/\s*；\s*/gu, "; ")
    .replace(/,\s*,+/gu, ", ")
    .replace(/\s+([,.;!?])/gu, "$1")
    .replace(/,+\s*$/gu, "")
    .trim();
  if (field === "original") {
    (SHOW_LYRIC_CORRECTIONS[show.slug] || []).forEach(([pattern, replacement]) => {
      cleaned = cleaned.replace(pattern, replacement);
    });
  }
  return cleaned;
}

function splitRoiSoleilOpening(lines, show) {
  const splitOriginal = (value) => String(value).split(/\s*[,，]\s*(?=[A-ZÀÂÄÇÉÈÊËÎÏÔÙÛÜŸŒÆ])/u).filter(Boolean);
  const splitEnglish = (value) => String(value).split(/\s*[,，]\s*(?=[A-Z])/u).filter(Boolean);
  const splitChinese = (value) => String(value).split(/\s*，\s*/u).filter(Boolean);
  const align = (parts, count) => {
    if (parts.length <= count) return parts;
    const leadingCount = parts.length - count + 1;
    return [parts.slice(0, leadingCount).join("，"), ...parts.slice(leadingCount)];
  };
  const expanded = [];

  lines.forEach((line) => {
    const originals = splitOriginal(line.original);
    const english = align(splitEnglish(line.en), originals.length);
    const chinese = align(splitChinese(line.zh), originals.length);
    originals.forEach((original, index) => {
      const lineIndex = expanded.length + 1;
      expanded.push({
        ...line,
        id: `${show.slug}-${String(line.id.match(/-(\d{2})-/)?.[1] || 2).padStart(2, "0")}-${String(lineIndex).padStart(3, "0")}`,
        lineIndex,
        original,
        ipa: ipaFor(original, show.voice),
        en: english[index] || line.en,
        zh: chinese[index] || line.zh,
        note: index === 0 ? line.note : "",
      });
    });
  });

  return expanded;
}

function splitMarkdownRow(row) {
  return row
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function rowByHeader(header, cells) {
  return Object.fromEntries(header.map((name, index) => [name, cells[index] || ""]));
}

function cleanCell(value) {
  return String(value)
    .replace(/(?:\[\d{1,2}:\d{2}(?:\.\d+)?\])+/gu, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\\\|/g, "|")
    .replace(/\u00b4/gu, "'")
    .replace(/(\p{Script=Latin}),(?=\p{Script=Latin})/gu, "$1, ")
    .replace(/(\p{Script=Latin})([.!?;:])(?=\p{Script=Latin})/gu, "$1$2 ")
    .replace(/(\p{Script=Latin}|[.!?])\(/gu, "$1 (")
    .replace(/\)(?=\p{Script=Latin})/gu, ") ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripSongTitleVersionSuffix(value) {
  let title = cleanCell(value);
  const versionSuffix = /\s*(?:[（(\[［]\s*(?:live(?:\s+[^)）\]］]*)?|现场(?:版|录音|演出版)?)(?:[)）\]］])|[-–—]\s*live)\s*$/iu;
  while (versionSuffix.test(title)) {
    title = title.replace(versionSuffix, "").trim();
  }
  return title;
}

const SPEAKER_HINT = /(?:judge|lucheni|toten|sophie|ludovika|max|\bfj\b|rudolf|\btod\b|chor|sisi|herzog|verwandt|ehepaar|schwager|helene|gouvernante|erzherzog|graf|kardinal|franz|mutter|fürst|hochzeit|gräfin|hofdame|zofe|friseuse|männer|frauen|menge|aristokrat|professor|journalist|student|bohemien|poet|cafégast|arzt|baron|rauscher|richter|elisabeth|eisabeth|gäste|leopold|zinzendorf|salieri|waldstätten|nannerl|mesmer|wolfgang|chamberlain|arco|ensemble|anna|händlerin|gemüsefrau|gewürzhändlerin|obstfrau|passanten|schikaneder|colloredo|constanze|constance|cecilia|aloysia|josephine|raoul|andre|confidante|fop|firmin|countess|attilio|carlotta|phantom|meg|christine|chief|firemen|marksman|voice|don juan|passarino|aminta|giry|stagehand|sadia|johnny|marie-jeanne|roger|gourou|stella|zéro|clapman|cristal|speakerine|clients|both|all|chorus|\bp\b|\br\b|\bmj\b|\bgel\b|ge-l)/iu;

function extractSpeaker(value) {
  const clean = cleanCell(value);
  if (clean === "_Die") return { speaker: "", text: "" };
  const bracketed = clean.match(/^\s*(?:\[([^\]]{1,48})\]|【([^】]{1,48})】)\s*(.*)$/u);
  if (bracketed) {
    return { speaker: (bracketed[1] || bracketed[2] || "").trim(), text: (bracketed[3] || "").trim() };
  }

  const labelled = clean.match(/^([^:：]{1,48})[:：]\s*(.*)$/u);
  if (!labelled) return { speaker: "", text: clean };
  const label = labelled[1].trim();
  if (/[()!?]/u.test(label)) return { speaker: "", text: clean };
  const upper = label === label.toLocaleUpperCase() && /\p{L}/u.test(label);
  if (!upper && !SPEAKER_HINT.test(label)) return { speaker: "", text: clean };
  return { speaker: label, text: labelled[2].trim() };
}

function stripTranslationSpeaker(value, sourceSpeaker) {
  const clean = cleanCell(value);
  if (!sourceSpeaker) return clean;
  const withoutBracketedSpeaker = clean.replace(/^\s*(?:\[[^\]]{1,48}\]|【[^】]{1,48}】)\s*/u, "");
  if (withoutBracketedSpeaker !== clean) return withoutBracketedSpeaker.trim();
  return clean.replace(/^\s*[^:：]{1,48}[:：]\s*/u, "").trim();
}

function cleanLineCell(show, value, field) {
  let cleaned = cleanCell(value);
  if (show.slug === "le-roi-soleil" && (field === "original" || field === "en")) {
    cleaned = cleaned
      .replace(/\s*，\s*/gu, ", ")
      .replace(/,\s*,+/gu, ", ")
      .replace(/\s+([,.;!?])/gu, "$1")
      .replace(/,+\s*$/gu, "");
  }
  if (show.slug === "le-roi-soleil" && field === "original") {
    const corrections = [
      [/qu'on aura pas/gu, "qu'on n'aura pas"],
      [/champs de blés pillés/gu, "champs de blé pillés"],
      [/nos priers/gu, "nos prières"],
      [/d'un main de fer/gu, "d'une main de fer"],
      [/quand on la serre/gu, "quand on la sert"],
      [/\bA mains nues\b/gu, "À mains nues"],
      [/\bdevont\b/gu, "devons"],
      [/l'injustice qu'en finit pas/gu, "l'injustice qui n'en finit pas"],
      [/\bnouvee ère\b/gu, "nouvelle ère"],
      [/\br\?le\b/gu, "rôle"],
      [/\bｃa\b/gu, "ça"],
      [/\bca\b/gu, "ça"],
      [/au fond de soit/gu, "au fond de soi"],
      [/loin de soit/gu, "loin de soi"],
      [/en soit/gu, "en soi"],
      [/Alors qu'elle bat/gu, "Alors qu'il bat"],
      [/s'endorme ne rêve plus/gu, "ne s'endorme et ne rêve plus"],
      [/t'inquiètes/gu, "t'inquiète"],
    ];
    corrections.forEach(([pattern, replacement]) => {
      cleaned = cleaned.replace(pattern, replacement);
    });
  }
  if (show.slug === "don-juan" && (field === "original" || field === "en")) {
    return cleaned.replace(/,+\s*$/u, "");
  }
  return cleaned;
}

function buildWordEntries(show, songs, rougeGlossary, freedictGlossary, englishGlossary) {
  const entries = {};
  const common = show.language === "en"
    ? COMMON_ENGLISH
    : show.language === "de" ? COMMON_GERMAN : COMMON_FRENCH;

  songs.forEach((song) => {
    collectTokens(song.title).forEach((token) => addEntry(entries, token, show, common, rougeGlossary, freedictGlossary, englishGlossary, {
      zh: song.titleZh || show.titleZh,
      en: song.title,
      proper: false,
    }));

    song.lines.forEach((line) => {
      collectTokens(line.original).forEach((token) => addEntry(entries, token, show, common, rougeGlossary, freedictGlossary, englishGlossary, {
        zh: line.zh,
        en: line.en,
        proper: false,
      }));
    });
  });

  return Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b, "fr")));
}

function addEntry(entries, token, show, common, rougeGlossary, freedictGlossary, englishGlossary, context) {
  const key = normalizeKey(token);
  if (!key || entries[key]) return;

  const speak = normalizeSpeak(token);
  const elisionKey = getElisionKey(speak, key);
  const commonEntry = common[key] || (elisionKey ? common[elisionKey] : null);
  const rougeEntry = show.language === "fr" ? rougeGlossary[key] || (elisionKey ? rougeGlossary[elisionKey] : null) : null;
  const freedictEntry = show.language === "fr" ? freedictGlossary[key] || (elisionKey ? freedictGlossary[elisionKey] : null) : null;
  const englishEntry = show.language === "en" ? englishGlossary[key] : null;
  const showOverride = SHOW_WORD_OVERRIDES[show.slug]?.[key];
  const manualEntry = loadManualWordGlossary(show.slug, key);
  const autoEntry = loadAutoWordGlossary(show.slug, key);

  if (showOverride) {
    entries[key] = {
      ipa: showOverride[3] || ipaFor(showOverride[2] || speak, show.voice),
      meaning: showOverride[0],
      en: showOverride[1],
      speak: showOverride[2] || speak,
    };
    return;
  }

  if (manualEntry?.zh && manualEntry?.en) {
    entries[key] = {
      ipa: manualEntry.ipa || ipaFor(manualEntry.speak || speak, show.voice),
      meaning: manualEntry.zh,
      en: shortEnglishGloss(manualEntry.en),
      speak: manualEntry.speak || speak,
    };
    return;
  }

  if (autoEntry?.zh && autoEntry?.en) {
    entries[key] = {
      ipa: ipaFor(speak, show.voice),
      meaning: autoEntry.zh,
      en: shortEnglishGloss(autoEntry.en),
      speak,
    };
    return;
  }

  if (commonEntry) {
    entries[key] = {
      ipa: commonEntry[3] || ipaFor(speak, show.voice),
      meaning: commonEntry[0],
      en: commonEntry[1],
      speak: commonEntry[2] || speak,
    };
    return;
  }

  if (rougeEntry && rougeEntry.zh && rougeEntry.en) {
    entries[key] = {
      ipa: rougeEntry.ipa || ipaFor(rougeEntry.speak || speak, show.voice),
      meaning: rougeEntry.zh,
      en: rougeEntry.en,
      speak: rougeEntry.speak || speak,
    };
    return;
  }

  if (freedictEntry && freedictEntry.meaning && freedictEntry.en) {
    entries[key] = {
      ipa: ipaFor(speak, show.voice),
      meaning: freedictEntry.meaning,
      en: shortEnglishGloss(freedictEntry.en),
      speak,
    };
    return;
  }

  if (englishEntry && englishEntry.meaning) {
    entries[key] = {
      ipa: ipaFor(speak, show.voice),
      meaning: englishEntry.meaning,
      en: englishEntry.en || key,
      speak,
    };
    return;
  }

  entries[key] = guessEntry(speak, show, context);
}

let autoWordGlossaryCache;
let manualWordGlossaryCache;
function loadManualWordGlossary(show, key) {
  if (manualWordGlossaryCache === undefined) {
    try {
      const reviewedElisions = JSON.parse(fs.readFileSync(ELISION_WORD_GLOSSARY, "utf8"));
      const manual = JSON.parse(fs.readFileSync(MANUAL_WORD_GLOSSARY, "utf8"));
      const wave2Manual = JSON.parse(fs.readFileSync(WAVE2_MANUAL_WORD_GLOSSARY, "utf8"));
      manualWordGlossaryCache = {};
      for (const showName of new Set([...Object.keys(reviewedElisions), ...Object.keys(manual), ...Object.keys(wave2Manual)])) {
        manualWordGlossaryCache[showName] = {
          ...(reviewedElisions[showName] || {}),
          ...(manual[showName] || {}),
          ...(wave2Manual[showName] || {}),
        };
      }
    } catch {
      manualWordGlossaryCache = {};
    }
  }
  return manualWordGlossaryCache[show]?.[key];
}

function loadAutoWordGlossary(show, key) {
  if (autoWordGlossaryCache === undefined) {
    try {
      autoWordGlossaryCache = JSON.parse(fs.readFileSync(AUTO_WORD_GLOSSARY, "utf8"));
    } catch {
      autoWordGlossaryCache = {};
    }
  }
  return autoWordGlossaryCache[show]?.[key];
}

function guessEntry(speak, show, context) {
  const key = normalizeKey(speak);
  const elisionKey = getElisionKey(speak, key);
  const englishGloss = englishEquivalentFromContext(context.en || "", speak);
  const zhGloss = chineseGlossFromEnglish(englishGloss, speak);

  if (show.language === "en") {
    return {
      ipa: ipaFor(speak, show.voice),
      meaning: context.proper ? "专有名词；人名、地名或剧中称谓" : zhGloss,
      en: context.proper ? "proper noun" : englishGloss,
      speak,
      needsReview: true,
    };
  }

  if (context.proper) {
    return {
      ipa: ipaFor(speak, show.voice),
      meaning: "专有名词；人名、地名或剧中称谓",
      en: "proper noun or character/place name",
      speak,
      needsReview: true,
    };
  }

  const contraction = frenchContractionEntry(speak, key, elisionKey);
  if (contraction) {
    return { ipa: ipaFor(speak, show.voice), ...contraction, speak, needsReview: true };
  }

  return {
    ipa: ipaFor(speak, show.voice),
    meaning: zhGloss,
    en: englishGloss,
    speak,
    needsReview: true,
  };
}

function frenchContractionEntry(speak, key, bare) {
  if (!bare || !/[’']/.test(speak)) return null;
  const prefixes = [
    ["c", "ce", "这/那"],
    ["d", "de", "的；从"],
    ["j", "je", "我"],
    ["l", "le/la", "这/那；他/她"],
    ["m", "me", "我；给我"],
    ["n", "ne", "不"],
    ["qu", "que", "那；什么；引导从句"],
    ["s", "se", "自己；相互"],
    ["t", "te", "你；给你"],
  ];
  const hit = prefixes.find(([prefix]) => key.startsWith(prefix) && bare !== key);
  if (!hit) return null;
  return {
    meaning: hit[2],
    en: `${hit[1]} + ${bare || "word"}`,
  };
}

function englishEquivalentFromContext(english, fallback) {
  const stop = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it",
    "of", "on", "or", "that", "the", "this", "to", "with", "you", "your",
  ]);
  const words = String(english || "")
    .toLowerCase()
    .match(/[a-z]+(?:'[a-z]+)?/g) || [];
  const useful = words.filter((word) => !stop.has(word)).slice(0, 3);
  return shortEnglishGloss(useful.length ? useful.join(" / ") : normalizeSpeak(fallback));
}

function shortEnglishGloss(value) {
  const clean = String(value || "")
    .replace(/[.!?。！？].*$/u, "")
    .replace(/\b(to|the|a|an)\b\s+/gi, "")
    .split(/\s*[,;]\s*/)[0]
    .split(/\s+\/\s+/)
    .slice(0, 3)
    .join(" / ")
    .trim();
  return shorten(clean, 48);
}

function singularEnglishGloss(value) {
  return shortEnglishGloss(value).replace(/\b([a-z]+)ies\b/gi, "$1y").replace(/\b([a-z]+)s\b/gi, "$1");
}

function singularFrenchKey(key) {
  if (!key || key.length <= 4 || !key.endsWith("s")) return "";
  return key.slice(0, -1);
}

function getElisionKey(speak, key) {
  const normalized = String(speak || "").normalize("NFC").toLocaleLowerCase("fr-FR");
  const match = normalized.match(/^(c|d|j|l|m|n|s|t|qu)['’]([\p{L}-]+)$/u);
  return match ? normalizeKey(match[2]) : "";
}

function chineseGlossFromEnglish(englishGloss, fallback) {
  const first = String(englishGloss || "")
    .toLowerCase()
    .split(/\s*\/\s*|\s+/)
    .find(Boolean);
  const map = {
    affair: "风流事；事件",
    angel: "天使",
    beauty: "美；美丽",
    blood: "血；血液",
    body: "身体",
    brother: "兄弟",
    child: "孩子",
    city: "城市",
    death: "死亡",
    desire: "欲望；渴望",
    dream: "梦；梦想",
    earth: "大地；土地",
    envy: "羡慕；欲望",
    fear: "恐惧",
    fire: "火；火焰",
    flower: "花",
    freedom: "自由",
    future: "未来",
    girl: "女孩",
    god: "神；上帝",
    hand: "手",
    happiness: "幸福",
    heart: "心；内心",
    history: "历史",
    hope: "希望",
    joy: "喜悦",
    king: "国王",
    land: "土地",
    light: "光；光明",
    love: "爱；爱情",
    madness: "疯狂",
    man: "男人；人",
    moment: "时刻",
    moon: "月亮",
    mother: "母亲",
    name: "名字",
    night: "夜晚",
    pain: "痛苦",
    past: "过去",
    path: "道路",
    pleasure: "快乐；愉悦",
    prayer: "祈祷",
    reason: "理性；理由",
    road: "道路",
    shadow: "影子；阴影",
    sister: "姐妹",
    sky: "天空",
    song: "歌曲；歌声",
    soul: "灵魂",
    star: "星星",
    story: "故事",
    sun: "太阳",
    tear: "眼泪",
    voice: "声音",
    wish: "愿望",
    woman: "女人",
    word: "词语；话语",
  };
  return map[first] || `词义：${normalizeSpeak(fallback)}`;
}

function collectTokens(text) {
  return String(text || "").match(/\p{L}+(?:['’]\p{L}+)*(?:-\p{L}+)*/gu) || [];
}

function normalizeKey(token) {
  return String(token || "")
    .normalize("NFC")
    .toLocaleLowerCase("fr-FR")
    .replace(/[’‘`]/gu, "'")
    .replace(/'/g, "")
    .replace(/[^\p{L}-]/gu, "")
    .trim();
}

function normalizeSpeak(token) {
  return String(token || "")
    .normalize("NFC")
    .replace(/[’‘`]/gu, "'")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    .trim();
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ipaFor(text, voice) {
  const normalized = String(text || "").normalize("NFC").toLocaleLowerCase("fr-FR");
  const overrides = {
    a: "/a/",
    "à": "/a/",
  };
  if (overrides[normalized]) return overrides[normalized];

  const result = spawnSync("espeak-ng", ["-q", "--ipa=3", "-v", voice, "--", text], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  let ipa = (result.stdout || "").replace(/\s+/g, " ").trim();
  if (String(voice).startsWith("fr")) {
    ipa = ipa.replace(/[ˈˌ-]/gu, "").replace(/\s+/g, " ").trim();
  }
  return ipa ? `/${ipa}/` : "";
}

function shorten(value, max) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function writeFile(dir, name, content) {
  fs.writeFileSync(path.join(dir, name), content, "utf8");
}

function renderIndex(show) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-E49LJ5T1V6"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-E49LJ5T1V6');
    </script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(show.title)}｜${escapeHtml(show.titleZh)}歌词学习</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <canvas id="effectCanvas" aria-hidden="true"></canvas>
    <div class="app-shell">
      <aside class="song-sidebar" aria-label="歌曲列表">
        <div class="sidebar-top">
          <button class="sidebar-toggle" id="sidebarToggle" type="button" aria-label="收起歌曲列表" aria-expanded="true">‹</button>
          <div class="sidebar-title">
            <strong id="showTitle"></strong>
            <span>歌曲列表</span>
          </div>
        </div>
        <nav id="songList" class="song-list"></nav>
      </aside>
      <main class="content">
        <header class="hero">
          <a class="home-button" href="../index.html" aria-label="返回音乐剧展示架" title="返回音乐剧展示架">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </a>
          <div class="hero-copy">
            <p class="musical-name">${escapeHtml(show.title)}</p>
            <div class="song-title-row">
              <h2 id="songTitle"></h2>
              <button class="song-play-button" id="songPlayButton" type="button" aria-label="连续播放本曲" aria-pressed="false" title="连续播放本曲">
                <svg viewBox="0 0 28 24" aria-hidden="true">
                  <path class="playlist-play-mark" d="M3.5 5.2v13.6l10-6.8z" />
                  <path class="playlist-lines-mark" d="M16.5 6h8M16.5 12h8M16.5 18h8" />
                  <rect class="playlist-stop-mark" x="8" y="6" width="12" height="12" rx="1.5" />
                </svg>
              </button>
            </div>
            <p id="songSubtitle" class="song-subtitle"></p>
            <div class="toolbar" role="group" aria-label="显示设置">
              <button class="toggle-btn is-active" type="button" data-toggle="showZh" aria-pressed="true">中文</button>
              <button class="toggle-btn is-active" type="button" data-toggle="showIpa" aria-pressed="true">音标</button>
              ${show.showEnglishToggle === false ? "" : '<button class="toggle-btn is-active" type="button" data-toggle="showEn" aria-pressed="true">英文</button>'}
              <button class="toggle-btn feedback-btn" id="feedbackButton" type="button">反馈</button>
            </div>
          </div>
          <div class="show-visual" data-mark="${escapeHtml(show.effect.icon)}" aria-hidden="true">
            <div class="show-visual-inner">
              <img class="show-visual-image" src="${escapeHtml(show.logo)}" alt="" />
            </div>
          </div>
        </header>
        <label class="mobile-picker" for="songSelect">
          <span>选择歌曲</span>
          <select id="songSelect"></select>
        </label>
        <section id="lyrics" class="lyrics" aria-live="polite"></section>
      </main>
    </div>
    <div id="wordPopover" class="word-popover" hidden></div>
    <button class="back-to-top" id="backToTop" type="button" aria-label="返回顶部" title="返回顶部" hidden>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
    </button>
    <script>
      window.pageConfig = ${JSON.stringify({
        title: show.title,
        titleZh: show.titleZh,
        slug: show.slug,
        language: show.language,
        showEnglishToggle: show.showEnglishToggle !== false,
        effect: show.effect,
      }, null, 8)};
    </script>
    <script src="songs.js"></script>
    <script src="word-data.js"></script>
    <script src="../shared/audio-playback.js"></script>
    <script src="../shared/cursors/${escapeHtml(show.slug)}.js?v=${CURSOR_ASSET_VERSION}"></script>
    <script src="script.js"></script>
    <script src="../shared/feedback-widget.js"></script>
    <script>
      window.MusicalFeedback.mount({
        id: ${JSON.stringify(show.slug)},
        siteName: ${JSON.stringify(`${show.titleZh}歌词学习`)},
        recipient: "fulife@agent.qq.com",
        trigger: "#feedbackButton",
        songs: (window.songs || []).map((song) => ({
          value: song.id,
          label: \`\${String(song.displayOrder || song.order).padStart(2, "0")}. \${song.title}\`,
        })),
        getCurrentSongId: () => (typeof getCurrentSong === "function" ? getCurrentSong()?.id : undefined),
      });
    </script>
  </body>
</html>
`;
}

function renderStyle(show) {
  const t = show.theme;
  const bodyFont = t.bodyFont || 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
  const displayFont = t.displayFont || t.serif;
  const lyricFont = t.lyricFont || t.serif;
  const bodyPattern = t.bodyPattern || "linear-gradient(transparent, transparent)";
  const heroPattern = t.heroPattern || "linear-gradient(transparent, transparent)";
  const visualPattern = t.visualPattern || "linear-gradient(transparent, transparent)";
  return `:root {
  color-scheme: dark;
  --bg: ${t.bg};
  --panel: ${t.panel};
  --accent: ${t.accent};
  --highlight: ${t.highlight};
  --ink: ${t.ink};
  --muted: ${t.muted};
  --line: ${t.line || "color-mix(in srgb, var(--highlight), transparent 72%)"};
  --shadow: ${t.shadow || "rgba(0, 0, 0, 0.34)"};
  --body-font: ${bodyFont};
  --display-font: ${displayFont};
  --lyric-font: ${lyricFont};
  --title-font: var(--display-font);
  --title-tracking: ${t.titleTracking || "0"};
  --radius: ${t.radius || "8px"};
  --visual-fit: ${t.visualFit || "contain"};
  --visual-position: ${t.visualPosition || "50% 50%"};
  --visual-width: ${t.visualWidth || "min(250px, 88%)"};
  --visual-height: ${t.visualHeight || "128px"};
  --visual-desktop-height: ${t.visualDesktopHeight || "auto"};
  --visual-tablet-height: ${t.visualTabletHeight || "auto"};
  --visual-mobile-height: ${t.visualMobileHeight || "auto"};
  --visual-min-height: ${t.visualMinHeight || "160px"};
  --visual-padding: ${t.visualPadding || "14px"};
  --visual-frame-radius: ${t.visualFrameRadius || "999px"};
  --visual-filter: ${t.visualFilter || "drop-shadow(0 12px 18px rgba(0, 0, 0, 0.3))"};
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink);
  font-family: var(--body-font);
  overflow-x: hidden;
  background:
    ${bodyPattern},
    linear-gradient(104deg, color-mix(in srgb, var(--accent), transparent 78%), transparent 38%),
    linear-gradient(74deg, transparent 52%, color-mix(in srgb, var(--highlight), transparent 88%)),
    radial-gradient(circle at 18% 10%, color-mix(in srgb, var(--accent), transparent 72%), transparent 30rem),
    radial-gradient(circle at 82% 4%, color-mix(in srgb, var(--highlight), transparent 84%), transparent 28rem),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 12px),
    linear-gradient(180deg, color-mix(in srgb, var(--panel), black 18%), var(--bg) 46%, color-mix(in srgb, var(--bg), black 28%));
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 8% 88%, color-mix(in srgb, var(--accent), transparent 88%), transparent 24rem),
    linear-gradient(135deg, transparent 0 46%, rgba(255, 255, 255, 0.025) 46% 47%, transparent 47% 100%);
  opacity: 0.82;
}

#effectCanvas {
  position: fixed;
  inset: 0;
  z-index: 999999;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

button,
select {
  font: inherit;
}

.app-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 30px;
  width: min(1440px, calc(100% - 34px));
  margin: 0 auto;
  padding: 26px 0 60px;
  transition: grid-template-columns 180ms ease;
}

.app-shell.is-collapsed {
  grid-template-columns: 66px minmax(0, 1fr);
}

.song-sidebar {
  position: sticky;
  top: 18px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  max-height: calc(100vh - 52px);
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--panel), white 5%), color-mix(in srgb, var(--bg), black 8%));
  box-shadow: 0 24px 60px var(--shadow);
}

.sidebar-top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid var(--line);
}

.sidebar-toggle {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--highlight);
  background: color-mix(in srgb, var(--highlight), transparent 90%);
  cursor: pointer;
}

.sidebar-title {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.sidebar-title strong {
  display: block;
  min-width: 0;
  color: var(--highlight);
  font-family: var(--title-font);
  font-size: 1.04rem;
  line-height: 1.08;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-title span {
  color: var(--muted);
  font-size: 0.78rem;
}

.app-shell.is-collapsed .sidebar-title,
.app-shell.is-collapsed .song-button strong,
.app-shell.is-collapsed .song-button span:not(.song-order) {
  display: none;
}

.app-shell.is-collapsed .song-sidebar {
  justify-items: center;
}

.musical-name,
.song-subtitle {
  color: var(--muted);
}

h1,
h2 {
  margin: 0;
  font-family: var(--title-font);
  letter-spacing: var(--title-tracking);
}

h1 {
  font-size: 2.25rem;
  line-height: 1.05;
  color: var(--highlight);
}

h2 {
  font-size: clamp(1.7rem, 3.6vw, 3.25rem);
  line-height: 1.06;
  color: var(--ink);
}

.song-title-row {
  display: block;
  min-width: 0;
}

.song-title-row h2 {
  display: inline;
  min-width: 0;
}

.song-play-button {
  position: relative;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  width: 38px;
  height: 38px;
  margin-inline-start: 0.32em;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--highlight);
  background: color-mix(in srgb, var(--panel), black 10%);
  cursor: pointer;
  vertical-align: 0.08em;
  transition: border-color 140ms ease, background-color 140ms ease, opacity 140ms ease;
}

.song-play-button:hover,
.song-play-button:focus-visible,
.song-play-button.is-playing {
  border-color: var(--highlight);
  background: color-mix(in srgb, var(--highlight), transparent 84%);
  outline: none;
}

.song-play-button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.song-play-button svg {
  width: 22px;
  height: 19px;
  overflow: visible;
}

.playlist-play-mark,
.playlist-stop-mark {
  fill: currentColor;
  stroke: none;
}

.playlist-lines-mark {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
}

.playlist-stop-mark,
.song-play-button.is-playing .playlist-play-mark,
.song-play-button.is-playing .playlist-lines-mark {
  display: none;
}

.song-play-button.is-playing .playlist-stop-mark {
  display: block;
}

.song-list {
  display: grid;
  align-content: start;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  scrollbar-color: color-mix(in srgb, var(--highlight), transparent 48%) rgba(255, 255, 255, 0.04);
}

.song-button {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 4px 10px;
  align-items: baseline;
  width: 100%;
  min-width: 0;
  padding: 9px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--ink);
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.app-shell.is-collapsed .song-button {
  grid-template-columns: 1fr;
  padding-inline: 4px;
}

.song-button:hover,
.song-button.is-active {
  border-color: var(--line);
  background: color-mix(in srgb, var(--accent), transparent 82%);
}

.song-button strong {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
  font-family: var(--lyric-font);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.song-order {
  color: var(--highlight);
  font-family: var(--lyric-font);
  font-size: 0.78rem;
  text-align: center;
}

.song-button span:not(.song-order) {
  display: block;
  grid-column: 2;
  min-width: 0;
  color: var(--muted);
  font-size: 0.85rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.content {
  min-width: 0;
  opacity: 1;
  transform: translateY(0);
  filter: none;
  transition: opacity 180ms ease, transform 180ms ease, filter 180ms ease;
  will-change: opacity, transform;
}

.content.is-song-changing {
  opacity: 0;
  transform: translateY(7px);
  filter: blur(1px);
}

.content.is-song-settling .lyric-card {
  animation: lyric-card-soft-in 260ms ease both;
}

.content.is-song-settling .lyric-card:nth-child(2n) {
  animation-delay: 18ms;
}

@keyframes lyric-card-soft-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(190px, 270px);
  gap: 24px;
  align-items: center;
  min-height: 250px;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  background:
    ${heroPattern},
    linear-gradient(115deg, color-mix(in srgb, var(--panel), black 24%), color-mix(in srgb, var(--bg), transparent 18%)),
    radial-gradient(circle at 78% 10%, color-mix(in srgb, var(--highlight), transparent 76%), transparent 38%);
  box-shadow: 0 24px 60px var(--shadow);
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.028) 0 1px, transparent 1px 12px);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.home-button {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--highlight);
  text-decoration: none;
  background: color-mix(in srgb, var(--panel), black 10%);
  box-shadow: 0 10px 24px var(--shadow);
}

.home-button svg,
.back-to-top svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.home-button:hover {
  color: var(--bg);
  border-color: var(--highlight);
  background: var(--highlight);
}

.musical-name {
  margin: 0 0 10px;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.22em;
}

.song-subtitle {
  margin: 12px 0 0;
  color: var(--highlight);
  font-family: "Songti SC", "Noto Serif CJK SC", serif;
  font-size: clamp(1.08rem, 2vw, 1.42rem);
  line-height: 1.35;
}

.toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-top: 18px;
}

.mobile-picker {
  display: none;
}

.show-visual {
  position: relative;
  display: grid;
  place-items: center;
  height: var(--visual-desktop-height);
  min-height: var(--visual-min-height);
  border: 1px solid color-mix(in srgb, var(--highlight), transparent 62%);
  border-radius: var(--radius);
  overflow: hidden;
  background:
    ${visualPattern},
    radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--highlight), transparent 70%), transparent 44%),
    linear-gradient(145deg, color-mix(in srgb, var(--accent), transparent 82%), rgba(255, 255, 255, 0.035)),
    color-mix(in srgb, var(--panel), black 6%);
  box-shadow: 0 16px 34px var(--shadow);
}

.show-visual::before {
  content: "";
  position: absolute;
  inset: 12px;
  border: 1px solid color-mix(in srgb, var(--highlight), transparent 74%);
  border-radius: var(--visual-frame-radius);
  opacity: 0.82;
}

.show-visual::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.032) 0 1px, transparent 1px 14px),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 38%);
  opacity: 0.8;
}

.show-visual-inner {
  position: relative;
  z-index: 1;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  justify-items: center;
  padding: var(--visual-padding);
  text-align: center;
}

.show-visual-image {
  display: block;
  width: var(--visual-width);
  height: var(--visual-height);
  object-fit: var(--visual-fit);
  object-position: var(--visual-position);
  filter: var(--visual-filter);
}

.show-visual-symbol::before,
.show-visual-symbol::after {
  content: "";
  position: absolute;
}

.show-visual[data-mark="roseWindow"] .show-visual-symbol::before {
  width: 54px;
  height: 54px;
  border: 2px solid currentColor;
  border-radius: 50%;
  background:
    conic-gradient(from 20deg, color-mix(in srgb, var(--accent), transparent 18%), transparent 18deg 38deg, currentColor 40deg 48deg, transparent 50deg 74deg);
}

.show-visual[data-mark="flag"] .show-visual-symbol::before {
  width: 46px;
  height: 38px;
  border-left: 3px solid currentColor;
  background: linear-gradient(90deg, #244a9b 0 33%, #f7f7f2 33% 66%, #c92535 66%);
  clip-path: polygon(0 0, 100% 10%, 92% 74%, 0 62%);
}

.show-visual[data-mark="musicNote"] .show-visual-symbol::before {
  width: 18px;
  height: 48px;
  border-right: 5px solid currentColor;
  border-top: 5px solid currentColor;
  transform: rotate(-8deg);
}

.show-visual[data-mark="musicNote"] .show-visual-symbol::after {
  width: 22px;
  height: 15px;
  border-radius: 50%;
  background: var(--accent);
  transform: translate(-13px, 18px) rotate(-12deg);
}

.show-visual[data-mark="rose"] .show-visual-symbol::before {
  width: 50px;
  height: 50px;
  background:
    radial-gradient(circle at 50% 50%, var(--accent) 0 18%, transparent 19%),
    conic-gradient(from 0deg, var(--accent), color-mix(in srgb, var(--highlight), transparent 12%), var(--accent));
  clip-path: polygon(50% 0, 63% 31%, 98% 35%, 70% 56%, 79% 91%, 50% 72%, 21% 91%, 30% 56%, 2% 35%, 37% 31%);
}

.show-visual[data-mark="sun"] .show-visual-symbol::before {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background:
    radial-gradient(circle, var(--highlight) 0 28%, transparent 31%),
    conic-gradient(var(--highlight), transparent 10deg 22deg, var(--highlight) 26deg 38deg, transparent 42deg 54deg, var(--highlight) 58deg 70deg, transparent 74deg);
  filter: blur(0.2px);
}

.show-visual[data-mark="cocarde"] .show-visual-symbol::before {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: radial-gradient(circle, #244a9b 0 28%, #f7f7f2 29% 54%, #c92535 55% 100%);
}

.show-visual[data-mark="rapier"] .show-visual-symbol::before {
  width: 58px;
  height: 3px;
  background: currentColor;
  transform: rotate(-42deg);
}

.show-visual[data-mark="rapier"] .show-visual-symbol::after {
  width: 22px;
  height: 22px;
  border: 2px solid var(--accent);
  border-radius: 50%;
  transform: translate(-15px, 14px) rotate(-42deg);
}

.show-visual[data-mark="stage"] .show-visual-symbol::before {
  width: 56px;
  height: 38px;
  border: 3px solid currentColor;
  border-radius: 5px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent), transparent 20%) 0 22%, transparent 22% 78%, color-mix(in srgb, var(--accent), transparent 20%) 78%);
}

.show-visual[data-mark="quill"] .show-visual-symbol::before {
  width: 22px;
  height: 58px;
  border-radius: 80% 20% 80% 20%;
  background: currentColor;
  transform: rotate(34deg);
}

.toggle-btn {
  min-width: 64px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
}

.toggle-btn.is-active {
  color: var(--bg);
  border-color: var(--highlight);
  background: var(--highlight);
}

.lyrics {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.lyric-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  padding: 16px 17px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--accent), transparent 86%), transparent 44%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.018)),
    color-mix(in srgb, var(--panel), transparent 4%);
  box-shadow: 0 16px 36px var(--shadow);
}

.line-main {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.line-original {
  margin: 0;
  font-family: var(--lyric-font);
  font-size: clamp(1.08rem, 1.72vw, 1.38rem);
  line-height: 1.32;
  overflow-wrap: anywhere;
}

.line-speaker {
  margin: 0 0 2px;
  color: var(--highlight);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.line-zh,
.line-en {
  margin: 0;
  color: var(--muted);
  line-height: 1.46;
  overflow-wrap: anywhere;
}

.line-zh {
  font-family: "Songti SC", "Noto Serif CJK SC", serif;
}

.line-en {
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
}

.line-actions {
  display: grid;
  align-content: start;
  justify-items: center;
}

.speak-button,
.popover-speak {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--highlight);
  background: rgba(255, 255, 255, 0.045);
  cursor: pointer;
}

.speak-button:hover,
.popover-speak:hover {
  border-color: var(--highlight);
  background: color-mix(in srgb, var(--highlight), transparent 86%);
}

.speak-button.is-audio-loading,
.popover-speak.is-audio-loading {
  opacity: 0.56;
  pointer-events: none;
}

.lyric-card.is-sequence-active {
  border-color: color-mix(in srgb, var(--highlight), transparent 36%);
  box-shadow: inset 3px 0 0 color-mix(in srgb, var(--highlight), transparent 18%), 0 14px 38px var(--shadow);
}

.lyric-word,
.song-title-word {
  display: inline;
  padding: 0 1px;
  border: 0;
  border-radius: 5px;
  color: inherit;
  white-space: normal;
  background: transparent;
  cursor: pointer;
  transition: color 120ms ease, background-color 120ms ease;
}

.line-original .lyric-token {
  display: inline-grid;
  grid-template-rows: auto auto;
  align-items: start;
  margin-right: 0.08em;
  vertical-align: top;
}

.word-phonetic {
  display: block;
  color: color-mix(in srgb, var(--highlight), white 28%);
  font-family: var(--lyric-font);
  font-size: 0.68em;
  line-height: 1.12;
  white-space: nowrap;
}

.word-phonetic[hidden] {
  display: none;
}

.lyric-word:hover,
.lyric-word:focus-visible,
.song-title-word:hover,
.song-title-word:focus-visible {
  color: var(--ink);
  background: color-mix(in srgb, var(--highlight), transparent 84%);
  outline: none;
}

.word-popover {
  position: fixed;
  z-index: 30;
  width: min(320px, calc(100vw - 24px));
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--ink);
  background: color-mix(in srgb, var(--panel), black 12%);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.46);
}

.word-popover[hidden],
[hidden] {
  display: none !important;
}

.popover-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.popover-term {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 9px;
  flex-wrap: wrap;
}

.popover-word {
  margin: 0;
  color: var(--highlight);
  font-family: var(--lyric-font);
  font-size: 1.45rem;
}

.popover-meaning,
.popover-en {
  margin: 8px 0 0;
  line-height: 1.55;
}

.popover-ipa {
  margin: 0;
  color: color-mix(in srgb, var(--highlight), white 28%);
  font-size: 0.94rem;
  white-space: nowrap;
}

.popover-en {
  color: var(--muted);
}

.back-to-top {
  position: fixed;
  right: max(20px, calc((100vw - 1440px) / 2 + 18px));
  bottom: 22px;
  z-index: 50;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--highlight);
  background: color-mix(in srgb, var(--panel), black 12%);
  box-shadow: 0 12px 28px var(--shadow);
  cursor: pointer;
}

.back-to-top:hover {
  border-color: var(--highlight);
  background: color-mix(in srgb, var(--highlight), transparent 82%);
}

@media (max-width: 980px) {
  .app-shell,
  .app-shell.is-collapsed {
    display: block;
    grid-template-columns: minmax(0, 1fr);
    width: min(calc(100% - 22px), 760px);
    padding-top: 18px;
  }

  .song-sidebar {
    display: none;
  }

  .hero {
    grid-template-columns: 1fr;
    min-height: 0;
    padding: 20px;
  }

  .toolbar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
    width: 100%;
  }

  .toggle-btn {
    width: 100%;
    min-width: 0;
    white-space: nowrap;
  }

  .show-visual {
    min-height: 104px;
    order: -1;
  }

  .mobile-picker {
    display: grid;
    gap: 6px;
    margin-top: 14px;
    color: var(--muted);
  }

  .mobile-picker select {
    width: 100%;
    max-width: 100%;
    min-height: 40px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    color: var(--ink);
    background: color-mix(in srgb, var(--panel), black 18%);
  }

  .lyric-card {
    grid-template-columns: minmax(0, 1fr) 38px;
    padding: 14px;
  }

  .line-actions {
    justify-items: center;
  }

  .content,
  .hero-copy,
  .mobile-picker,
  .lyrics,
  .lyric-card,
  .line-main {
    min-width: 0;
    max-width: 100%;
  }

  .speak-button {
    width: 34px;
    height: 34px;
  }

  .back-to-top {
    right: 12px;
    bottom: 12px;
  }
}

@media (min-width: 421px) and (max-width: 980px) {
  .show-visual {
    height: var(--visual-tablet-height);
  }
}

@media (max-width: 420px) {
  .app-shell,
  .app-shell.is-collapsed {
    width: calc(100% - 16px);
    padding-top: 8px;
  }

  .hero {
    gap: 16px;
    padding: 16px;
  }

  .song-title-row {
    align-items: flex-start;
    gap: 9px;
  }

  .song-play-button {
    width: 34px;
    height: 34px;
  }

  .show-visual {
    height: var(--visual-mobile-height);
  }

  h2 {
    font-size: 1.85rem;
    overflow-wrap: anywhere;
  }

  .toolbar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .feedback-btn {
    grid-column: -2 / -1;
  }

  .lyric-card {
    gap: 9px;
    padding: 12px;
  }
}

@media (hover: hover) and (pointer: fine) {
  body,
  body * {
    cursor: none !important;
  }
}
`;
}

function renderScript(show) {
  return `const SETTINGS_KEY = "${show.slug}-display-settings";
const CURRENT_SONG_KEY = "${show.slug}-current-song";
const SIDEBAR_KEY = "${show.slug}-sidebar-collapsed";
const TOKEN_RE = /\\p{L}+(?:['’]\\p{L}+)*(?:-\\p{L}+)*/gu;

const songs = window.songs || [];
const wordEntries = window.wordEntries || {};
const config = window.pageConfig || {};

const state = {
  settings: readSettings(),
  sidebarCollapsed: localStorage.getItem(SIDEBAR_KEY) === "true",
  currentSongId: localStorage.getItem(CURRENT_SONG_KEY) || "",
  audio: null,
  audioFinish: null,
  speechFinish: null,
  preloadAudio: null,
};

const dom = {
  shell: document.querySelector(".app-shell"),
  content: document.querySelector(".content"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  songSelect: document.getElementById("songSelect"),
  showTitle: document.getElementById("showTitle"),
  songList: document.getElementById("songList"),
  songTitle: document.getElementById("songTitle"),
  songPlayButton: document.getElementById("songPlayButton"),
  songSubtitle: document.getElementById("songSubtitle"),
  lyrics: document.getElementById("lyrics"),
  popover: document.getElementById("wordPopover"),
  backToTop: document.getElementById("backToTop"),
};

const audioController = window.MusicalAudio.createController({
  stopCurrent: stopCurrentPlayback,
  onItemClear: clearSequenceHighlight,
});

init();

function init() {
  if (!state.currentSongId && songs[0]) state.currentSongId = songs[0].id;
  dom.showTitle.append(renderClickableWords(config.title || "", "song-title-word"));
  renderSongList();
  renderSong();
  bindToggles();
  bindSidebar();
  bindBackToTop();
  dom.songPlayButton?.addEventListener("click", toggleCurrentSongPlayback);
  syncSidebarState();
  initThemedCursor();
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".word-popover") && !event.target.closest(".lyric-word") && !event.target.closest(".song-title-word")) {
      hidePopover();
    }
  });
}

function readSettings() {
  const defaultShowEn = config.showEnglishToggle !== false;
  try {
    return { showZh: true, showIpa: true, showEn: defaultShowEn, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { showZh: true, showIpa: true, showEn: defaultShowEn };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function bindToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    const key = button.dataset.toggle;
    button.classList.toggle("is-active", Boolean(state.settings[key]));
    button.setAttribute("aria-pressed", String(Boolean(state.settings[key])));
    button.addEventListener("click", () => {
      state.settings[key] = !state.settings[key];
      button.classList.toggle("is-active", Boolean(state.settings[key]));
      button.setAttribute("aria-pressed", String(Boolean(state.settings[key])));
      saveSettings();
      renderSong();
    });
  });
}

function bindSidebar() {
  dom.sidebarToggle?.addEventListener("click", () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    localStorage.setItem(SIDEBAR_KEY, String(state.sidebarCollapsed));
    syncSidebarState();
  });
  dom.songSelect?.addEventListener("change", (event) => selectSong(event.target.value));
  window.addEventListener("resize", syncSidebarState, { passive: true });
}

function bindBackToTop() {
  if (!dom.backToTop) return;
  const sync = () => {
    dom.backToTop.hidden = window.scrollY < Math.max(420, window.innerHeight * 0.65);
  };
  window.addEventListener("scroll", sync, { passive: true });
  dom.backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  sync();
}

function syncSidebarState() {
  const isNarrowLayout = window.matchMedia("(max-width: 980px)").matches;
  dom.shell?.classList.toggle("is-collapsed", state.sidebarCollapsed && !isNarrowLayout);
  if (!dom.sidebarToggle) return;
  dom.sidebarToggle.textContent = state.sidebarCollapsed ? "›" : "‹";
  dom.sidebarToggle.setAttribute("aria-expanded", String(!state.sidebarCollapsed));
  dom.sidebarToggle.setAttribute("aria-label", state.sidebarCollapsed ? "展开歌曲列表" : "收起歌曲列表");
}

function renderSongList() {
  dom.songList.replaceChildren(...songs.map((song) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = \`song-button\${song.id === state.currentSongId ? " is-active" : ""}\`;
    const order = document.createElement("span");
    order.className = "song-order";
    order.textContent = String(song.displayOrder || song.order).padStart(2, "0");
    const title = document.createElement("strong");
    title.textContent = song.title;
    const sub = document.createElement("span");
    sub.textContent = song.titleZh || "";
    button.append(order, title, sub);
    button.addEventListener("click", () => selectSong(song.id));
    return button;
  }));

  if (dom.songSelect) {
    dom.songSelect.replaceChildren(...songs.map((song) => {
      const option = document.createElement("option");
      option.value = song.id;
      option.textContent = \`\${String(song.displayOrder || song.order).padStart(2, "0")}  \${song.title}\`;
      option.selected = song.id === state.currentSongId;
      return option;
    }));
  }
}

function selectSong(songId) {
  if (songId === state.currentSongId) return;
  audioController.stopAll();
  state.currentSongId = songId;
  localStorage.setItem(CURRENT_SONG_KEY, songId);
  renderSongList();
  hidePopover();
  renderCurrentSongWithTransition();
  resetSongScrollPosition();
}

function resetSongScrollPosition() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function renderCurrentSongWithTransition() {
  if (!dom.content) {
    renderSong();
    return;
  }
  dom.content.classList.remove("is-song-settling");
  dom.content.classList.add("is-song-changing");
  window.setTimeout(() => {
    renderSong();
    dom.content.classList.remove("is-song-changing");
    dom.content.classList.add("is-song-settling");
    window.setTimeout(() => dom.content.classList.remove("is-song-settling"), 360);
  }, 170);
}

function renderSong() {
  const song = getCurrentSong();
  if (!song) return;
  dom.songTitle.replaceChildren(renderClickableWords(song.title, "song-title-word"));
  dom.songSubtitle.textContent = song.titleZh || "";
  dom.songPlayButton.disabled = !song.lines.length;
  dom.lyrics.replaceChildren(...song.lines.map((line) => renderLine(song, line)));
}

function getCurrentSong() {
  return songs.find((item) => item.id === state.currentSongId) || songs[0] || null;
}

function renderLine(song, line) {
  const card = document.createElement("article");
  card.className = "lyric-card";
  card.dataset.lineId = line.id;
  const main = document.createElement("div");
  main.className = "line-main";

  if (line.speaker) {
    const speaker = document.createElement("p");
    speaker.className = "line-speaker";
    speaker.textContent = line.speaker;
    main.append(speaker);
  }

  const original = document.createElement("p");
  original.className = "line-original";
  original.append(renderClickableWords(line.original, "lyric-word", { showPhonetics: true, line }));
  main.append(original);

  const en = document.createElement("p");
  en.className = "line-en";
  en.hidden = !state.settings.showEn || !line.en;
  en.textContent = line.en;
  main.append(en);

  const zh = document.createElement("p");
  zh.className = "line-zh";
  zh.hidden = !state.settings.showZh;
  zh.textContent = line.zh;
  main.append(zh);

  const actions = document.createElement("div");
  actions.className = "line-actions";
  const speak = document.createElement("button");
  speak.type = "button";
  speak.className = "speak-button";
  speak.setAttribute("aria-label", "播放整句发音");
  speak.textContent = "▶";
  speak.addEventListener("click", () => audioController.runUserAction(
    speak,
    () => playAudio(getLineAudioPath(song, line), line.original),
  ));
  actions.append(speak);

  card.append(main, actions);
  return card;
}

function renderClickableWords(text, className, options = {}) {
  const fragment = document.createDocumentFragment();
  const wordParts = Array.from(String(text || "").matchAll(TOKEN_RE)).map((match) => match[0]);
  const ipaParts = splitIpa(options.line?.ipa || "");
  let lastIndex = 0;
  let wordIndex = 0;
  for (const match of String(text || "").matchAll(TOKEN_RE)) {
    if (match.index > lastIndex) fragment.append(document.createTextNode(text.slice(lastIndex, match.index)));
    const token = match[0];
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = token;
    button.addEventListener("click", (event) => showWord(token, event.currentTarget));
    if (options.showPhonetics) {
      const tokenWrap = document.createElement("span");
      tokenWrap.className = "lyric-token";
      const phonetic = document.createElement("span");
      phonetic.className = "word-phonetic";
      phonetic.hidden = !state.settings.showIpa;
      phonetic.textContent = getAlignedWordIpa(token, wordIndex, wordParts.length, ipaParts);
      tokenWrap.append(button, phonetic);
      fragment.append(tokenWrap);
    } else {
      fragment.append(button);
    }
    wordIndex += 1;
    lastIndex = match.index + token.length;
  }
  if (lastIndex < String(text).length) fragment.append(document.createTextNode(String(text).slice(lastIndex)));
  return fragment;
}

function getAlignedWordIpa(token, wordIndex, wordCount, ipaParts) {
  if (ipaParts.length === wordCount && ipaParts[wordIndex]) return formatLineIpaPart(ipaParts[wordIndex], wordIndex, wordCount);
  const entry = wordEntries[normalizeKey(token)];
  return formatLineIpaPart(entry?.ipa || "", wordIndex, wordCount);
}

function formatLineIpaPart(value, wordIndex, wordCount) {
  const bare = stripIpaSlashes(value);
  if (!bare || /见|标题词/u.test(bare)) return "";
  const prefix = wordIndex === 0 ? "/" : "";
  const suffix = wordIndex === wordCount - 1 ? "/" : "";
  return \`\${prefix}\${bare}\${suffix}\`;
}

function splitIpa(ipa) {
  return stripIpaSlashes(ipa)
    .split(/\\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function stripIpaSlashes(value) {
  return String(value || "").replace(/^\\/|\\/$/g, "").trim();
}

function showWord(token, anchor) {
  const key = normalizeKey(token);
  const entry = wordEntries[key] || {
    ipa: "",
    meaning: token,
    en: normalizeKey(token),
    speak: token,
  };
  dom.popover.replaceChildren();

  const head = document.createElement("div");
  head.className = "popover-head";
  const term = document.createElement("div");
  term.className = "popover-term";
  const word = document.createElement("p");
  word.className = "popover-word";
  word.textContent = token;
  const ipa = document.createElement("p");
  ipa.className = "popover-ipa";
  ipa.textContent = entry.ipa || "";
  const speak = document.createElement("button");
  speak.type = "button";
  speak.className = "popover-speak";
  speak.setAttribute("aria-label", "播放单词发音");
  speak.textContent = "▶";
  speak.addEventListener("click", () => audioController.runUserAction(
    speak,
    () => playAudio(getWordAudioPath(key), entry.speak || token),
  ));
  term.append(word, ipa);
  head.append(term, speak);
  const meaning = document.createElement("p");
  meaning.className = "popover-meaning";
  meaning.textContent = entry.meaning || "";
  const en = document.createElement("p");
  en.className = "popover-en";
  en.textContent = entry.en || "";
  dom.popover.append(head, meaning);
  if (config.language !== "en" && entry.en) {
    dom.popover.append(en);
  }

  const rect = anchor.getBoundingClientRect();
  const top = Math.min(window.innerHeight - 20, rect.bottom + 10);
  const left = Math.min(window.innerWidth - 332, Math.max(12, rect.left));
  dom.popover.style.top = \`\${top}px\`;
  dom.popover.style.left = \`\${Math.max(12, left)}px\`;
  dom.popover.hidden = false;
}

function hidePopover() {
  dom.popover.hidden = true;
}

function normalizeKey(token) {
  return String(token || "")
    .normalize("NFC")
    .toLocaleLowerCase("fr-FR")
    .replace(/[’‘\`]/gu, "'")
    .replace(/'/g, "")
    .replace(/[^\\p{L}-]/gu, "")
    .trim();
}

function getLineAudioPath(song, line) {
  return \`audio/lines/\${encodeURIComponent(song.id)}/\${encodeURIComponent(line.id)}.wav\`;
}

function getWordAudioPath(key) {
  return \`audio/words/\${encodeURIComponent(key)}.wav\`;
}

function stopCurrentPlayback() {
  if (state.audioFinish) {
    const finish = state.audioFinish;
    state.audioFinish = null;
    finish();
  }
  if (state.audio) {
    state.audio.pause();
    state.audio.currentTime = 0;
    state.audio = null;
  }
  if (state.speechFinish) {
    const finish = state.speechFinish;
    state.speechFinish = null;
    finish();
  }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  state.preloadAudio = null;
}

async function playAudio(src, text) {
  try {
    await playLocalAudio(src, false);
  } catch {
    await playSpeech(text, false);
  }
}

function playLocalAudio(src, waitForEnd) {
  if (!src) return Promise.reject(new Error("Missing audio source"));
  stopCurrentPlayback();
  const audio = new Audio(src);
  audio.preload = "auto";
  state.audio = audio;
  if (!waitForEnd) return audio.play();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      if (state.audio === audio) state.audio = null;
      if (state.audioFinish === stopAndResolve) state.audioFinish = null;
      if (error) reject(error);
      else resolve();
    };
    const handleEnded = () => finish();
    const handleError = () => finish(new Error("Audio playback failed"));
    const stopAndResolve = () => finish();
    state.audioFinish = stopAndResolve;
    audio.addEventListener("ended", handleEnded, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    Promise.resolve(audio.play()).catch(finish);
  });
}

function playSpeech(text, waitForEnd) {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance !== "function") {
    return Promise.reject(new Error("Speech synthesis unavailable"));
  }
  stopCurrentPlayback();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = config.language === "en" ? "en-US" : config.language === "de" ? "de-DE" : "fr-FR";
  if (!waitForEnd) {
    speechSynthesis.speak(utterance);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      if (state.speechFinish === stopAndResolve) state.speechFinish = null;
      if (error) reject(error);
      else resolve();
    };
    const stopAndResolve = () => finish();
    state.speechFinish = stopAndResolve;
    utterance.onend = () => finish();
    utterance.onerror = () => finish(new Error("Speech synthesis failed"));
    speechSynthesis.speak(utterance);
  });
}

async function playLineToEnd(song, line) {
  try {
    await playLocalAudio(getLineAudioPath(song, line), true);
  } catch {
    await playSpeech(line.original, true);
  }
}

function toggleCurrentSongPlayback() {
  const song = getCurrentSong();
  if (!song?.lines.length) return;
  audioController.toggleSequence({
    button: dom.songPlayButton,
    items: song.lines,
    playItem: (line) => playLineToEnd(song, line),
    onItemStart: (line, index, nextLine) => {
      setSequenceHighlight(line.id);
      if (nextLine) preloadLineAudio(song, nextLine);
    },
  });
}

function preloadLineAudio(song, line) {
  const audio = new Audio(getLineAudioPath(song, line));
  audio.preload = "auto";
  audio.load();
  state.preloadAudio = audio;
}

function setSequenceHighlight(lineId) {
  clearSequenceHighlight();
  const card = Array.from(dom.lyrics.querySelectorAll(".lyric-card")).find((item) => item.dataset.lineId === lineId);
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
  dom.lyrics?.querySelectorAll(".lyric-card.is-sequence-active").forEach((card) => {
    card.classList.remove("is-sequence-active");
  });
}

function initThemedCursor() {
  if (window.referenceCursorActive) return;
  const canvas = document.getElementById("effectCanvas");
  if (!canvas || window.matchMedia("(pointer: coarse)").matches) return;
  const ctx = canvas.getContext("2d");
  const effect = config.effect || {};
  const colors = {
    primary: effect.primary || "#d8b15b",
    secondary: effect.secondary || "#ffffff",
  };
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, px: window.innerWidth / 2, py: window.innerHeight / 2, down: false };
  const particles = [];
  const bursts = [];
  const maxParticles = 54;
  const maxBursts = 30;
  let time = 0;
  let lastTrailAt = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function addTrail(x, y, dx, dy) {
    const trail = effect.trail || "stoneDust";
    const letters = String(config.title || "Lyrics").replace(/\s+/g, "").split("");
    const base = {
      x,
      y,
      vx: -dx * 0.025 + (Math.random() - 0.5) * 0.65,
      vy: -dy * 0.025 + (Math.random() - 0.5) * 0.65,
      life: 1,
      size: 2 + Math.random() * 3.5,
      rot: Math.random() * Math.PI,
      kind: trail,
      text: trail === "letters" ? letters[Math.floor(Math.random() * letters.length)] : "",
      color: trail === "petals"
        ? [colors.primary, colors.secondary, "#f7f1ee"][Math.floor(Math.random() * 3)]
        : (Math.random() > 0.55 ? colors.primary : colors.secondary),
    };
    particles.push(base);
    if (particles.length > maxParticles) particles.splice(0, particles.length - maxParticles);
  }

  function addBurst(x, y) {
    const click = effect.click || "rings";
    if (click === "letterfall") {
      String(config.title || "Cyrano").replace(/\s+/g, "").split("").forEach((letter, index) => {
        const angle = Math.PI * (0.15 + Math.random() * 0.7);
        const speed = 0.45 + Math.random() * 0.85;
        bursts.push({ x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 8, vx: Math.cos(angle) * speed, vy: -Math.sin(angle) * speed, life: 1, radius: 5, angle: (Math.random() - 0.5) * 0.25, delay: index * 2, kind: click, text: letter, color: index % 2 ? colors.primary : colors.secondary });
      });
      return;
    }
    const ringKinds = new Set(["roseWindowGlow", "loveRipples", "sunHalo", "moonHalo"]);
    if (ringKinds.has(click)) {
      const count = click === "roseWindowGlow" ? 2 : 3;
      for (let index = 0; index < count; index += 1) {
        bursts.push({ x, y, vx: 0, vy: 0, life: 1, radius: 8 + index * 8, angle: 0, delay: index * 3, kind: click, color: index % 2 ? colors.primary : colors.secondary });
      }
      return;
    }

    const count = click === "tricolorConfetti" ? 12 : click === "dawnRays" ? 10 : click === "inkDrops" ? 9 : 6;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.18;
      const speed = click === "curtainFold" ? 0.25 : 0.7 + Math.random() * 1.45;
      bursts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        radius: 5,
        angle,
        kind: click,
        color: click === "tricolorConfetti" ? ["#244a9b", "#f7f7f2", "#c92535"][index % 3] : (index % 2 ? colors.primary : colors.secondary),
      });
    }
    if (bursts.length > maxBursts) bursts.splice(0, bursts.length - maxBursts);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (event) => {
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (Math.hypot(dx, dy) >= 5 && event.timeStamp - lastTrailAt >= 14) {
      addTrail(pointer.x, pointer.y, dx, dy);
      lastTrailAt = event.timeStamp;
    }
  });
  window.addEventListener("mousedown", () => {
    pointer.down = true;
    addBurst(pointer.x, pointer.y);
  });
  window.addEventListener("mouseup", () => {
    pointer.down = false;
  });

  function tick() {
    time += 1;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawParticles(ctx, particles, bursts, colors);
    drawCursorIcon(ctx, pointer, effect.icon || "star", colors, time);
    requestAnimationFrame(tick);
  }

  resize();
  tick();
}

function drawParticles(ctx, particles, bursts, colors) {
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const p = particles[index];
    p.life -= p.kind === "bladeGlint" ? 0.11 : p.kind === "metalSparks" ? 0.075 : 0.032;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.kind === "petals" ? 0.025 : p.kind === "goldDust" || p.kind === "metalSparks" || p.kind === "stoneDust" ? 0.045 : 0.008;
    p.rot += p.kind === "petals" ? 0.055 : 0.025;
    if (p.life <= 0) {
      particles.splice(index, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    if (p.kind === "petals") {
      ctx.scale(1.6, 0.72);
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.quadraticCurveTo(0, -p.size, p.size, 0);
      ctx.quadraticCurveTo(0, p.size * 0.7, -p.size, 0);
      ctx.fill();
    } else if (p.kind === "bladeGlint" || p.kind === "metalSparks") {
      ctx.lineWidth = p.kind === "bladeGlint" ? 1.1 : 1.35;
      ctx.beginPath();
      ctx.moveTo(-p.size * 2.4, 0);
      ctx.lineTo(p.size * 2.4, 0);
      ctx.stroke();
    } else if (p.kind === "goldDust" || p.kind === "spotlight" || p.kind === "smoke") {
      ctx.globalCompositeOperation = "screen";
      const spread = p.kind === "spotlight" ? 4.2 : p.kind === "smoke" ? 3.4 : 2.6;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * spread);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * spread, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "staffGlow") {
      ctx.globalCompositeOperation = "screen";
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 7;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-2, 2, p.size * 0.7, 0, Math.PI * 2);
      ctx.moveTo(p.size * 0.7 - 2, 2);
      ctx.lineTo(p.size * 0.7 - 2, -p.size * 2.1);
      ctx.stroke();
    } else if (p.kind === "letters") {
      ctx.font = "14px Georgia, serif";
      ctx.fillText(p.text, 0, 0);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (let index = bursts.length - 1; index >= 0; index -= 1) {
    const b = bursts[index];
    if (b.delay > 0) {
      b.delay -= 1;
      continue;
    }
    b.life -= b.kind === "letterfall" ? 0.025 : /Glow|Ripples|Halo/.test(b.kind) ? 0.045 : 0.065;
    b.x += b.vx;
    b.y += b.vy;
    b.vy += b.kind === "letterfall" ? 0.018 : b.kind === "tricolorConfetti" || b.kind === "inkDrops" ? 0.05 : 0.006;
    b.radius += /Glow|Ripples|Halo/.test(b.kind) ? 0.75 : 0.35;
    if (b.life <= 0) {
      bursts.splice(index, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = b.life;
    ctx.strokeStyle = b.color;
    ctx.fillStyle = b.color;
    ctx.lineWidth = 1.05;
    if (b.kind === "letterfall") {
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle + Math.sin(b.life * 8) * 0.15);
      ctx.font = "15px Georgia, serif";
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fillText(b.text, 0, 0);
    } else if (["roseWindowGlow", "loveRipples", "sunHalo", "moonHalo"].includes(b.kind)) {
      ctx.globalCompositeOperation = "screen";
      ctx.shadowColor = b.color;
      ctx.shadowBlur = b.kind === "sunHalo" ? 18 : 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.stroke();
      if (b.kind === "roseWindowGlow") {
        for (let ray = 0; ray < 12; ray += 1) {
          const angle = (Math.PI * 2 * ray) / 12;
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(angle) * b.radius * 0.45, b.y + Math.sin(angle) * b.radius * 0.45);
          ctx.lineTo(b.x + Math.cos(angle) * b.radius, b.y + Math.sin(angle) * b.radius);
          ctx.stroke();
        }
      }
    } else if (b.kind === "tricolorConfetti") {
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle + (1 - b.life) * 2);
      ctx.fillRect(-4, -2, 8, 4);
    } else if (b.kind === "inkDrops") {
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.kind === "dawnRays") {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 13, b.y - b.vy * 13);
      ctx.stroke();
    } else if (b.kind === "crossedBlades") {
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 8, b.y - b.vy * 8);
      ctx.lineTo(b.x + b.vx * 5, b.y + b.vy * 5);
      ctx.stroke();
    } else if (b.kind === "curtainFold") {
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 10 + (1 - b.life) * 24, b.angle, b.angle + Math.PI / 3);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 5, b.y - b.vy * 5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawCursorIcon(ctx, pointer, icon, colors, time) {
  ctx.save();
  ctx.translate(pointer.x, pointer.y);
  ctx.scale(pointer.down ? 0.88 : 1, pointer.down ? 0.88 : 1);
  ctx.strokeStyle = colors.secondary;
  ctx.fillStyle = colors.primary;
  ctx.lineWidth = 2;
  ctx.shadowColor = colors.primary;
  ctx.shadowBlur = 12;
  ctx.translate(16, 16);
  ctx.rotate(Math.PI);

  if (icon === "key") {
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.moveTo(6, 0);
    ctx.lineTo(27, 0);
    ctx.moveTo(20, 0);
    ctx.lineTo(20, 7);
    ctx.moveTo(25, 0);
    ctx.lineTo(25, 5);
    ctx.stroke();
  } else if (icon === "roseWindow") {
    ctx.rotate(time * 0.0015);
    ctx.lineWidth = 1.25;
    for (let index = 0; index < 12; index += 1) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.bezierCurveTo(-4, -7, -5, -13, 0, -17);
      ctx.bezierCurveTo(5, -13, 4, -7, 0, -3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.moveTo(6, 0);
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();
  } else if (icon === "flag") {
    ctx.beginPath();
    ctx.moveTo(-12, 16);
    ctx.lineTo(-12, -18);
    ctx.moveTo(-12, -15);
    ctx.bezierCurveTo(-1, -22, 8, -11, 19, -17);
    ctx.lineTo(17, 1);
    ctx.bezierCurveTo(6, 7, -2, -3, -12, 3);
    ctx.stroke();
  } else if (icon === "musicNote") {
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(-5, 11, 7, 5, -0.25, 0, Math.PI * 2);
    ctx.moveTo(2, 11);
    ctx.lineTo(2, -20);
    ctx.bezierCurveTo(12, -16, 16, -11, 16, -3);
    ctx.stroke();
  } else if (icon === "star") {
    drawStar(ctx, 0, 0, 7, 17, 5);
  } else if (icon === "quill") {
    ctx.rotate(-0.7);
    ctx.beginPath();
    ctx.ellipse(0, -8, 7, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(0, 22);
    ctx.stroke();
  } else if (icon === "rose") {
    for (let index = 0; index < 8; index += 1) {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = index % 2 ? colors.primary : colors.secondary;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.bezierCurveTo(7, -7, 15, -5, 16, 0);
      ctx.bezierCurveTo(12, 5, 6, 5, 2, 0);
      ctx.fill();
    }
    ctx.fillStyle = colors.secondary;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === "sun") {
    ctx.lineWidth = 1.2;
    for (let index = 0; index < 16; index += 1) {
      ctx.rotate(Math.PI / 8);
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(0, -18 - (index % 2) * 3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-3, -1, 1.2, 0, Math.PI * 2);
    ctx.arc(3, -1, 1.2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (icon === "gear") {
    ctx.rotate(time * 0.003);
    ctx.lineWidth = 2;
    for (let index = 0; index < 10; index += 1) {
      ctx.rotate(Math.PI / 5);
      ctx.strokeRect(-2, -21, 4, 7);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.moveTo(6, 0);
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();
  } else if (icon === "rapier") {
    ctx.rotate(-Math.PI / 4);
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(-16, 16);
    ctx.lineTo(22, -22);
    ctx.lineTo(27, -27);
    ctx.moveTo(-12, 8);
    ctx.lineTo(-4, 16);
    ctx.moveTo(-14, 12);
    ctx.bezierCurveTo(-22, 5, -18, -3, -7, -5);
    ctx.bezierCurveTo(1, 2, -2, 12, -12, 12);
    ctx.stroke();
  } else if (icon === "mask") {
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.moveTo(-17, -12);
    ctx.quadraticCurveTo(-3, -18, 0, -4);
    ctx.quadraticCurveTo(3, -18, 17, -12);
    ctx.quadraticCurveTo(15, 10, 0, 17);
    ctx.quadraticCurveTo(-15, 10, -17, -12);
    ctx.fill();
    ctx.fillStyle = colors.secondary;
    ctx.beginPath();
    ctx.ellipse(-7, -3, 4, 2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(7, -3, 4, 2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.secondary;
    ctx.beginPath();
    ctx.arc(0, 4, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else if (icon === "moon") {
    ctx.fillStyle = colors.secondary;
    ctx.beginPath();
    ctx.arc(0, 0, 14, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(6, 0, 14, Math.PI * 1.5, Math.PI * 0.5, true);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawStar(ctx, x, y, inner, outer, points) {
  ctx.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 ? inner : outer;
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
`;
}

function renderAudioBuilder(show) {
  return `const path = require("node:path");
const { runBuild } = require(path.resolve(__dirname, "..", "..", "shared", "build-natural-audio.js"));

runBuild({
  root: path.resolve(__dirname, ".."),
  voice: process.env.MUSICAL_TTS_VOICE || "${show.audioVoice}",
  rate: Number(process.env.MUSICAL_TTS_RATE || "0.48"),
  kind: "generated",
});
`;
}

function getCursorMarker(slug) {
  return {
    "1789-les-amants-de-la-bastille": "preRenderRevolutionCocarde",
    "don-juan": "preRenderCrimsonRose",
    "cyrano-de-bergerac": "preRenderPaperAirplane",
    "le-roi-soleil": "preRenderTrueApolloSun",
    "notre-dame-de-paris": "preRenderRoseWindow",
    "les-miserables": "preRenderBaguette",
    "mozart-opera-rock": "preRenderNeonNote",
    "romeo-et-juliette": "preRenderPureBlockRose",
    "moliere-le-spectacle-musical": "preRenderPureQuill",
    "moulin-rouge": "preRenderMoulinWindmill",
    "elisabeth-das-musical": "preRenderClassicTiara",
    "starmania": "preRenderBlackStar",
    "mozart-das-musical": "preRenderInspirationPoint",
    "phantom-of-the-opera": "preRenderGrandChandelier",
    "love-never-dies": "preRenderWindingKey",
    "les-souliers-rouges": "preRenderPosterMoon",
    "la-legende-du-roi-arthur": "preRenderExcalibur",
  }[slug];
}

function getReferenceCursorConfig(show) {
  const profiles = {
    "moulin-rouge": {
      motif: "windmill",
      trail: "goldSparkleRosePetal",
      burst: "spectacular",
      motion: "turn",
      accent: "#e21d2a",
      size: 62,
      follow: 0.45,
      emitDistance: 25,
      clickOn: "up",
      burstParticles: 9,
      hotspot: [0.5, 0.5],
    },
    "elisabeth-das-musical": {
      motif: "classicTiara",
      trail: "diamondDust",
      burst: "softDiamondGlow",
      motion: "still",
      accent: "#17121f",
      size: 58,
      follow: 0.45,
      emitDistance: 25,
      clickOn: "up",
      burstParticles: 3,
      hotspot: [0.5, 0.5],
    },
    starmania: {
      motif: "blackStar",
      trail: "glitchPixel",
      burst: "glitchRipple",
      motion: "still",
      accent: "#98d9ea",
      size: 82,
      follow: 0.45,
      emitInterval: 30,
      clickOn: "up",
      burstParticles: 6,
      hotspot: [0.5, 0.5],
    },
    "mozart-das-musical": {
      motif: "inspirationPoint",
      trail: "fiveLineStaff",
      burst: "goldenRippleNotes",
      motion: "still",
      accent: "#ffd700",
      size: 54,
      follow: 0.6,
      emitDistance: 8,
      clickOn: "down",
      burstParticles: 0,
      hotspot: [0.5, 0.5],
    },
    "phantom-of-the-opera": {
      motif: "grandChandelier",
      trail: "crystalGlint",
      burst: "pressGlow",
      motion: "still",
      accent: "#7d1119",
      size: 50,
      follow: 0.35,
      emitDistance: 10,
      clickOn: "down",
      burstParticles: 6,
      hotspot: [0.5, 0.5],
    },
    "love-never-dies": {
      motif: "windingKey",
      trail: "neonSpark",
      burst: "subtleRipple",
      motion: "still",
      accent: "#7454ae",
      size: 58,
      follow: 0.55,
      emitInterval: 35,
      clickOn: "down",
      burstParticles: 2,
      hotspot: [0.1875, 0.1875],
    },
    "les-souliers-rouges": {
      motif: "posterMoon",
      trail: "moonMist",
      burst: "lunarBloom",
      motion: "still",
      accent: "#e21b38",
      size: 64,
      follow: 0.45,
      emitDistance: 16,
      clickOn: "down",
      burstParticles: 0,
      hotspot: [0.5, 0.5],
    },
    "la-legende-du-roi-arthur": {
      motif: "excalibur",
      trail: "magicDust",
      burst: "crispShockwave",
      motion: "still",
      accent: "#d5b85d",
      size: 72,
      follow: 0.68,
      emitDistance: 14,
      clickOn: "down",
      burstParticles: 3,
      hotspot: [0, 0],
    },
  };
  return {
    ...profiles[show.slug],
    primary: show.effect.primary,
    secondary: show.effect.secondary,
  };
}

function renderReferenceCursor(show) {
  const marker = getCursorMarker(show.slug);
  const config = getReferenceCursorConfig(show);
  return `window.referenceCursorActive = true;

(() => {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  const canvas = document.getElementById("effectCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const config = ${JSON.stringify(config)};
  const particles = [];
  const bursts = [];
  const trailPoints = [];
  const mouse = { x: -100, y: -100, targetX: -100, targetY: -100 };
  const lastEmit = { x: -100, y: -100 };
  let lastEmitTime = 0;
  let pressed = false;
  let windmillRotation = 0;
  let chandelierLight = 0;
  const pointerScale = 1;

  canvas.dataset.cursorMotif = config.motif;
  canvas.dataset.cursorTrail = config.trail;
  canvas.dataset.cursorBurst = config.burst;
  canvas.dataset.cursorTrailEmissions = "0";
  canvas.dataset.cursorClickBursts = "0";

  const cache = document.createElement("canvas");
  const cacheScale = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));
  cache.width = 96 * cacheScale;
  cache.height = 96 * cacheScale;
  const cacheCtx = cache.getContext("2d");
  cacheCtx.setTransform(cacheScale, 0, 0, cacheScale, 0, 0);
  const bladeCache = document.createElement("canvas");
  bladeCache.width = 96 * cacheScale;
  bladeCache.height = 96 * cacheScale;
  const bladeCtx = bladeCache.getContext("2d");
  bladeCtx.setTransform(cacheScale, 0, 0, cacheScale, 0, 0);

  function drawDiamond(target, x, y, radius) {
    target.beginPath();
    target.moveTo(x, y - radius);
    target.lineTo(x + radius * 0.68, y);
    target.lineTo(x, y + radius);
    target.lineTo(x - radius * 0.68, y);
    target.closePath();
  }

  function ${marker}() {
    cacheCtx.clearRect(0, 0, 96, 96);
    cacheCtx.save();
    cacheCtx.translate(48, 48);
    cacheCtx.strokeStyle = config.primary;
    cacheCtx.fillStyle = config.secondary;
    cacheCtx.lineCap = "round";
    cacheCtx.lineJoin = "round";
    cacheCtx.lineWidth = 2.2;

    if (config.motif === "windmill") {
      const millBody = cacheCtx.createLinearGradient(0, 2, 0, 36);
      millBody.addColorStop(0, "#ef2835");
      millBody.addColorStop(0.52, "#b80f20");
      millBody.addColorStop(1, "#650611");
      cacheCtx.fillStyle = millBody;
      cacheCtx.strokeStyle = "#e6b85e";
      cacheCtx.lineWidth = 1.35;
      cacheCtx.shadowColor = "rgba(0,0,0,0.7)";
      cacheCtx.shadowBlur = 2;
      cacheCtx.beginPath();
      cacheCtx.moveTo(-8, 3);
      cacheCtx.quadraticCurveTo(0, -1, 8, 3);
      cacheCtx.lineTo(14, 35);
      cacheCtx.lineTo(-14, 35);
      cacheCtx.closePath();
      cacheCtx.fill();
      cacheCtx.stroke();
      cacheCtx.shadowBlur = 0;
      cacheCtx.strokeStyle = "rgba(255,225,151,0.78)";
      cacheCtx.lineWidth = 0.75;
      cacheCtx.beginPath();
      cacheCtx.moveTo(-11, 19);
      cacheCtx.lineTo(11, 19);
      cacheCtx.moveTo(-13, 30);
      cacheCtx.lineTo(13, 30);
      cacheCtx.stroke();
      [[-8,12],[0,13],[8,12],[-11,24],[11,24],[-12,32],[-6,34],[0,34],[6,34],[12,32]].forEach((bulb) => {
        cacheCtx.beginPath();
        cacheCtx.arc(bulb[0], bulb[1], 1.05, 0, Math.PI * 2);
        cacheCtx.fillStyle = "#fff1a8";
        cacheCtx.fill();
      });
      cacheCtx.fillStyle = "#2a050b";
      cacheCtx.strokeStyle = "#e6b85e";
      cacheCtx.lineWidth = 0.9;
      cacheCtx.fillRect(-4, 22, 8, 13);
      cacheCtx.strokeRect(-4, 22, 8, 13);
      cacheCtx.beginPath();
      cacheCtx.arc(0, 0, 4.2, 0, Math.PI * 2);
      cacheCtx.fillStyle = "#e6b85e";
      cacheCtx.fill();
    } else if (config.motif === "classicTiara") {
      cacheCtx.translate(0, -3);
      cacheCtx.strokeStyle = "rgba(249,247,255,0.96)";
      cacheCtx.fillStyle = "rgba(183,166,211,0.24)";
      cacheCtx.shadowColor = "rgba(230,226,237,0.72)";
      cacheCtx.shadowBlur = 3;
      cacheCtx.lineWidth = 1.15;
      cacheCtx.beginPath();
      cacheCtx.moveTo(-27, 32);
      cacheCtx.quadraticCurveTo(0, 38, 27, 32);
      cacheCtx.lineTo(25, 37);
      cacheCtx.quadraticCurveTo(0, 44, -25, 37);
      cacheCtx.closePath();
      cacheCtx.fill();
      cacheCtx.stroke();
      const tiaraArches = [
        [-25,32,-22,18,-19,14,-14,31],
        [-18,32,-14,10,-10,8,-5,31],
        [-8,32,-4,9,0,0,5,31],
        [8,32,4,9,0,0,-5,31],
        [18,32,14,10,10,8,5,31],
        [25,32,22,18,19,14,14,31],
      ];
      tiaraArches.forEach((arch) => {
        cacheCtx.beginPath();
        cacheCtx.moveTo(arch[0], arch[1]);
        cacheCtx.bezierCurveTo(arch[2], arch[3], arch[4], arch[5], arch[6], arch[7]);
        cacheCtx.stroke();
      });
      cacheCtx.shadowBlur = 0;
      cacheCtx.strokeStyle = "rgba(211,198,231,0.88)";
      cacheCtx.lineWidth = 0.85;
      cacheCtx.beginPath();
      cacheCtx.moveTo(-18, 27);
      cacheCtx.quadraticCurveTo(-9, 17, 0, 29);
      cacheCtx.quadraticCurveTo(9, 17, 18, 27);
      cacheCtx.moveTo(-12, 31);
      cacheCtx.quadraticCurveTo(0, 19, 12, 31);
      cacheCtx.stroke();
      drawDiamond(cacheCtx, 0, 15, 6.5);
      cacheCtx.fillStyle = "rgba(103,84,126,0.9)";
      cacheCtx.fill();
      cacheCtx.strokeStyle = "#ffffff";
      cacheCtx.stroke();
      [[0,0,3.1],[-10,8,2.4],[10,8,2.4],[-19,14,1.9],[19,14,1.9],[0,15,1.7],[-7,23,1.25],[7,23,1.25]].forEach((gem) => {
        cacheCtx.beginPath();
        cacheCtx.arc(gem[0], gem[1], gem[2], 0, Math.PI * 2);
        cacheCtx.fillStyle = gem[0] === 0 && gem[1] === 15 ? "#e6e2ed" : "#ffffff";
        cacheCtx.shadowColor = "#ffffff";
        cacheCtx.shadowBlur = 4;
        cacheCtx.fill();
      });
      cacheCtx.shadowBlur = 1;
      for (let x = -22; x <= 22; x += 4) {
        cacheCtx.beginPath();
        cacheCtx.arc(x, 36 + Math.abs(x) * 0.035, 1.15, 0, Math.PI * 2);
        cacheCtx.fill();
      }
    } else if (config.motif === "blackStar") {
      cacheCtx.translate(0, 16);
      cacheCtx.beginPath();
      cacheCtx.moveTo(0, -16);
      cacheCtx.lineTo(5, -4);
      cacheCtx.lineTo(20, 0);
      cacheCtx.lineTo(5, 5);
      cacheCtx.lineTo(0, 20);
      cacheCtx.lineTo(-5, 5);
      cacheCtx.lineTo(-20, 0);
      cacheCtx.lineTo(-5, -4);
      cacheCtx.closePath();
      cacheCtx.fillStyle = "rgba(5,2,10,0.96)";
      cacheCtx.fill();
      cacheCtx.strokeStyle = "#00f3ff";
      cacheCtx.shadowColor = "#00f3ff";
      cacheCtx.shadowBlur = 10;
      cacheCtx.lineWidth = 1.7;
      cacheCtx.stroke();
      cacheCtx.beginPath();
      cacheCtx.arc(0, 0, 3.2, 0, Math.PI * 2);
      cacheCtx.fillStyle = "#ff00ff";
      cacheCtx.shadowColor = "#ff00ff";
      cacheCtx.shadowBlur = 8;
      cacheCtx.fill();
    } else if (config.motif === "inspirationPoint") {
      const glow = cacheCtx.createRadialGradient(0, 0, 0, 0, 0, 34);
      glow.addColorStop(0, "rgba(255,255,255,1)");
      glow.addColorStop(0.1, "rgba(255,239,181,0.96)");
      glow.addColorStop(0.28, "rgba(255,205,66,0.7)");
      glow.addColorStop(0.58, "rgba(201,29,43,0.22)");
      glow.addColorStop(1, "rgba(255,215,0,0)");
      cacheCtx.fillStyle = glow;
      cacheCtx.beginPath();
      cacheCtx.arc(0, 0, 34, 0, Math.PI * 2);
      cacheCtx.fill();
      cacheCtx.fillStyle = "#ffffff";
      cacheCtx.shadowColor = "#ffffff";
      cacheCtx.shadowBlur = 4;
      cacheCtx.beginPath();
      cacheCtx.arc(0, 0, 2.5, 0, Math.PI * 2);
      cacheCtx.fill();
    } else if (config.motif === "grandChandelier") {
      const brass = cacheCtx.createLinearGradient(-32, 0, 32, 0);
      brass.addColorStop(0, "#684513");
      brass.addColorStop(0.3, "#c99535");
      brass.addColorStop(0.5, "#ffe3a0");
      brass.addColorStop(0.72, "#b77a24");
      brass.addColorStop(1, "#5a370f");
      cacheCtx.strokeStyle = brass;
      cacheCtx.fillStyle = brass;
      cacheCtx.lineWidth = 1.8;
      cacheCtx.shadowColor = "rgba(255,225,155,0.38)";
      cacheCtx.shadowBlur = 2.5;

      const drawFacetedCrystal = (x, y, width, height) => {
        cacheCtx.save();
        const crystal = cacheCtx.createLinearGradient(x - width, y, x + width, y);
        crystal.addColorStop(0, "rgba(123,206,240,0.94)");
        crystal.addColorStop(0.42, "rgba(255,255,255,0.98)");
        crystal.addColorStop(0.66, "rgba(218,243,252,0.96)");
        crystal.addColorStop(1, "rgba(193,160,232,0.88)");
        cacheCtx.shadowColor = "rgba(190,236,255,0.7)";
        cacheCtx.shadowBlur = 3.6;
        cacheCtx.beginPath();
        cacheCtx.moveTo(x, y - height * 0.55);
        cacheCtx.lineTo(x + width * 0.72, y - height * 0.16);
        cacheCtx.lineTo(x + width * 0.5, y + height * 0.34);
        cacheCtx.lineTo(x, y + height * 0.56);
        cacheCtx.lineTo(x - width * 0.5, y + height * 0.34);
        cacheCtx.lineTo(x - width * 0.72, y - height * 0.16);
        cacheCtx.closePath();
        cacheCtx.fillStyle = crystal;
        cacheCtx.strokeStyle = "rgba(245,252,255,0.92)";
        cacheCtx.lineWidth = 0.8;
        cacheCtx.fill();
        cacheCtx.stroke();
        cacheCtx.beginPath();
        cacheCtx.moveTo(x, y - height * 0.48);
        cacheCtx.lineTo(x, y + height * 0.46);
        cacheCtx.moveTo(x - width * 0.56, y - height * 0.12);
        cacheCtx.lineTo(x + width * 0.48, y + height * 0.3);
        cacheCtx.strokeStyle = "rgba(255,255,255,0.58)";
        cacheCtx.lineWidth = 0.55;
        cacheCtx.stroke();
        cacheCtx.restore();
      };

      // Ceiling rose, linked chain and glass baluster make the silhouette read as a chandelier.
      cacheCtx.beginPath();
      cacheCtx.ellipse(0, -35, 8.5, 2.5, 0, 0, Math.PI * 2);
      cacheCtx.fill();
      [-30.5, -25.5, -20.5].forEach((y, index) => {
        cacheCtx.beginPath();
        cacheCtx.ellipse(0, y, 2.2, 3.2, index % 2 ? Math.PI / 2 : 0, 0, Math.PI * 2);
        cacheCtx.stroke();
      });
      cacheCtx.beginPath();
      cacheCtx.moveTo(0, -18);
      cacheCtx.bezierCurveTo(-5.8, -15, -5.5, -10.5, 0, -7.5);
      cacheCtx.bezierCurveTo(5.5, -10.5, 5.8, -15, 0, -18);
      cacheCtx.stroke();
      drawFacetedCrystal(0, -11.5, 3.6, 8.5);
      const glassBowl = cacheCtx.createLinearGradient(-27, 10, 27, 18);
      glassBowl.addColorStop(0, "rgba(119,198,230,0.2)");
      glassBowl.addColorStop(0.48, "rgba(255,255,255,0.4)");
      glassBowl.addColorStop(1, "rgba(179,147,217,0.22)");
      cacheCtx.beginPath();
      cacheCtx.moveTo(-27, 8);
      cacheCtx.quadraticCurveTo(0, 31, 27, 8);
      cacheCtx.quadraticCurveTo(0, 18, -27, 8);
      cacheCtx.closePath();
      cacheCtx.fillStyle = glassBowl;
      cacheCtx.strokeStyle = "rgba(222,244,252,0.72)";
      cacheCtx.lineWidth = 0.8;
      cacheCtx.fill();
      cacheCtx.stroke();
      [[0,-6,11,2.7],[0,8,27,6],[0,14,34,6.5]].forEach((ring) => {
        cacheCtx.beginPath();
        cacheCtx.ellipse(ring[0], ring[1], ring[2], ring[3], 0, 0, Math.PI * 2);
        cacheCtx.strokeStyle = brass;
        cacheCtx.lineWidth = ring[2] > 20 ? 2 : 1.5;
        cacheCtx.stroke();
      });

      // Five candle arms and cups remain readable at the reviewed 50px cursor size.
      const candles = [
        { x: -32, y: -3 },
        { x: -17, y: -8 },
        { x: 0, y: -10 },
        { x: 17, y: -8 },
        { x: 32, y: -3 },
      ];
      candles.forEach(({ x, y }) => {
        const direction = Math.sign(x);
        cacheCtx.beginPath();
        cacheCtx.moveTo(direction * 2, 9);
        cacheCtx.bezierCurveTo(x * 0.35, 18, x * 0.82, 10, x, y + 4);
        cacheCtx.quadraticCurveTo(x + direction * 3.3, y, x, y - 2);
        cacheCtx.strokeStyle = brass;
        cacheCtx.lineWidth = 1.9;
        cacheCtx.stroke();
        cacheCtx.beginPath();
        cacheCtx.ellipse(x, y - 2, 5.2, 1.9, 0, 0, Math.PI * 2);
        cacheCtx.fillStyle = brass;
        cacheCtx.fill();
        cacheCtx.stroke();
        const wax = cacheCtx.createLinearGradient(x - 2.2, 0, x + 2.2, 0);
        wax.addColorStop(0, "#b99e71");
        wax.addColorStop(0.48, "#fff8de");
        wax.addColorStop(1, "#c9ac79");
        cacheCtx.fillStyle = wax;
        cacheCtx.fillRect(x - 2, y - 8, 4, 6);
        cacheCtx.fillStyle = "#f4e5c4";
        cacheCtx.beginPath();
        cacheCtx.moveTo(x, y - 14.5);
        cacheCtx.quadraticCurveTo(x + 3, y - 11, x, y - 8);
        cacheCtx.quadraticCurveTo(x - 3, y - 11, x, y - 14.5);
        cacheCtx.fillStyle = "#fff2a6";
        cacheCtx.shadowColor = "#ffd671";
        cacheCtx.shadowBlur = 4;
        cacheCtx.fill();
        cacheCtx.fillStyle = brass;
        cacheCtx.shadowBlur = 1.5;
      });

      const drawBeadSwag = (startX, endX, startY, sag) => {
        for (let step = 0; step <= 8; step += 1) {
          const t = step / 8;
          const x = startX + (endX - startX) * t;
          const y = startY + Math.sin(t * Math.PI) * sag;
          cacheCtx.beginPath();
          cacheCtx.arc(x, y, step % 4 === 0 ? 1.4 : 0.9, 0, Math.PI * 2);
          cacheCtx.fillStyle = step % 4 === 0 ? "#ffffff" : "#cfe7f1";
          cacheCtx.shadowColor = "rgba(225,246,255,0.72)";
          cacheCtx.shadowBlur = 1.8;
          cacheCtx.fill();
        }
      };
      drawBeadSwag(-32, 0, 0, 13);
      drawBeadSwag(0, 32, 0, 13);
      drawBeadSwag(-17, 17, -4, 12);

      // A dense lower tier of faceted prisms gives the chandelier its crystal identity.
      [-29,-20,-10,0,10,20,29].forEach((x, index) => {
        const depth = 19 + (3 - Math.abs(index - 3)) * 1.4;
        cacheCtx.beginPath();
        cacheCtx.moveTo(x, 14 + Math.abs(index - 3) * 0.5);
        cacheCtx.lineTo(x, depth - 3);
        cacheCtx.strokeStyle = "rgba(219,239,248,0.82)";
        cacheCtx.lineWidth = 0.75;
        cacheCtx.stroke();
        drawFacetedCrystal(x, depth + 2.5, index === 3 ? 5.4 : 3.9, index === 3 ? 12 : 8.5);
      });
      cacheCtx.beginPath();
      cacheCtx.moveTo(0, 16);
      cacheCtx.lineTo(0, 29);
      cacheCtx.strokeStyle = brass;
      cacheCtx.lineWidth = 1;
      cacheCtx.stroke();
      drawFacetedCrystal(0, 35, 6.2, 13.5);
    } else if (config.motif === "windingKey") {
      cacheCtx.translate(-30, -30);
      cacheCtx.strokeStyle = "#e2b15d";
      cacheCtx.shadowColor = "rgba(116,84,174,0.86)";
      cacheCtx.shadowBlur = 5;
      cacheCtx.lineWidth = 3;
      cacheCtx.beginPath();
      cacheCtx.moveTo(0, 0);
      cacheCtx.lineTo(39, 39);
      cacheCtx.stroke();
      cacheCtx.lineWidth = 2.2;
      cacheCtx.beginPath();
      cacheCtx.moveTo(7, 7);
      cacheCtx.lineTo(1, 13);
      cacheCtx.lineTo(8, 20);
      cacheCtx.lineTo(14, 14);
      cacheCtx.moveTo(16, 16);
      cacheCtx.lineTo(13, 20);
      cacheCtx.stroke();
      cacheCtx.strokeStyle = "rgba(250,246,255,0.75)";
      cacheCtx.lineWidth = 0.8;
      cacheCtx.beginPath();
      cacheCtx.moveTo(3, 2);
      cacheCtx.lineTo(38, 37);
      cacheCtx.stroke();
      cacheCtx.lineWidth = 3;
      cacheCtx.strokeStyle = "#e2b15d";
      cacheCtx.beginPath();
      cacheCtx.arc(47, 39, 8, 0, Math.PI * 2);
      cacheCtx.arc(39, 47, 8, 0, Math.PI * 2);
      cacheCtx.stroke();
      cacheCtx.fillStyle = "#9b78d0";
      cacheCtx.shadowColor = "#7454ae";
      cacheCtx.shadowBlur = 6;
      cacheCtx.beginPath();
      cacheCtx.arc(43, 43, 2.5, 0, Math.PI * 2);
      cacheCtx.fill();
      cacheCtx.fillStyle = "#ffffff";
      cacheCtx.shadowColor = "#ffffff";
      cacheCtx.beginPath();
      cacheCtx.arc(0, 0, 1.8, 0, Math.PI * 2);
      cacheCtx.fill();
    } else if (config.motif === "posterMoon") {
      const halo = cacheCtx.createRadialGradient(0, 0, 12, 0, 0, 29);
      halo.addColorStop(0, "rgba(239,236,255,0.16)");
      halo.addColorStop(0.55, "rgba(188,178,229,0.08)");
      halo.addColorStop(1, "rgba(188,178,229,0)");
      cacheCtx.fillStyle = halo;
      cacheCtx.beginPath();
      cacheCtx.arc(0, 0, 29, 0, Math.PI * 2);
      cacheCtx.fill();

      const moon = cacheCtx.createRadialGradient(-6, -7, 2, 0, 0, 18);
      moon.addColorStop(0, "#fffdf6");
      moon.addColorStop(0.42, "#e9e5f4");
      moon.addColorStop(0.78, "#bbb2d6");
      moon.addColorStop(1, "#756b98");
      cacheCtx.fillStyle = moon;
      cacheCtx.shadowColor = "rgba(221,213,255,0.45)";
      cacheCtx.shadowBlur = 4;
      cacheCtx.beginPath();
      cacheCtx.arc(0, 0, 18, 0, Math.PI * 2);
      cacheCtx.fill();

      cacheCtx.shadowBlur = 0;
      cacheCtx.fillStyle = "rgba(91,79,126,0.14)";
      [[-7,-5,3.2],[6,-8,2.2],[5,6,3.8],[-8,9,2.1]].forEach((crater) => {
        cacheCtx.beginPath();
        cacheCtx.arc(crater[0], crater[1], crater[2], 0, Math.PI * 2);
        cacheCtx.fill();
      });
      cacheCtx.strokeStyle = "rgba(255,255,255,0.48)";
      cacheCtx.lineWidth = 0.7;
      cacheCtx.beginPath();
      cacheCtx.arc(-2, -2, 15.5, -2.8, -0.45);
      cacheCtx.stroke();
    } else if (config.motif === "excalibur") {
      cacheCtx.translate(-48, -48);
      const blade = cacheCtx.createLinearGradient(0, 0, 35, 35);
      blade.addColorStop(0, "#ffffff");
      blade.addColorStop(0.34, "#dce8eb");
      blade.addColorStop(0.52, "#7da2ac");
      blade.addColorStop(0.7, "#eef7f5");
      blade.addColorStop(1, "#9ab2b7");
      cacheCtx.beginPath();
      cacheCtx.moveTo(0, 0);
      cacheCtx.lineTo(22, 35);
      cacheCtx.lineTo(35, 22);
      cacheCtx.closePath();
      cacheCtx.fillStyle = blade;
      cacheCtx.fill();
      cacheCtx.strokeStyle = "#d4af37";
      cacheCtx.lineWidth = 1.25;
      cacheCtx.stroke();
      cacheCtx.beginPath();
      cacheCtx.moveTo(1.5, 1.5);
      cacheCtx.lineTo(29, 29);
      cacheCtx.strokeStyle = "rgba(255,255,255,0.95)";
      cacheCtx.lineWidth = 1.1;
      cacheCtx.stroke();
      cacheCtx.strokeStyle = "rgba(84,127,141,0.9)";
      cacheCtx.lineWidth = 1;
      [[10,11,14,13],[15,18,19,17],[20,24,24,22]].forEach((rune) => {
        cacheCtx.beginPath();
        cacheCtx.moveTo(rune[0], rune[1]);
        cacheCtx.lineTo(rune[2], rune[3]);
        cacheCtx.stroke();
      });
      cacheCtx.beginPath();
      cacheCtx.moveTo(17, 41);
      cacheCtx.quadraticCurveTo(25, 33, 41, 17);
      cacheCtx.strokeStyle = "#d4af37";
      cacheCtx.lineWidth = 4.5;
      cacheCtx.stroke();
      cacheCtx.fillStyle = "#d5b85d";
      [[17,41],[41,17]].forEach((cap) => {
        cacheCtx.beginPath();
        cacheCtx.arc(cap[0], cap[1], 2.4, 0, Math.PI * 2);
        cacheCtx.fill();
      });
      cacheCtx.beginPath();
      cacheCtx.moveTo(31, 31);
      cacheCtx.lineTo(42, 42);
      cacheCtx.strokeStyle = "#17343d";
      cacheCtx.lineWidth = 5.2;
      cacheCtx.stroke();
      cacheCtx.strokeStyle = "#d5b85d";
      cacheCtx.lineWidth = 1.1;
      for (let wrap = 0; wrap < 3; wrap += 1) {
        const p = 34 + wrap * 3.5;
        cacheCtx.beginPath();
        cacheCtx.moveTo(p - 2, p + 2);
        cacheCtx.lineTo(p + 2, p - 2);
        cacheCtx.stroke();
      }
      cacheCtx.beginPath();
      cacheCtx.arc(45, 45, 3.8, 0, Math.PI * 2);
      cacheCtx.fillStyle = "#d4af37";
      cacheCtx.fill();
      cacheCtx.beginPath();
      cacheCtx.arc(45, 45, 1.7, 0, Math.PI * 2);
      cacheCtx.fillStyle = "#547f8d";
      cacheCtx.fill();
    }
    cacheCtx.restore();
  }
  ${marker}();

  function preRenderWindmillBlades() {
    if (config.motif !== "windmill") return;
    bladeCtx.clearRect(0, 0, 96, 96);
    bladeCtx.save();
    bladeCtx.translate(48, 48);
    bladeCtx.strokeStyle = "#e6b85e";
    bladeCtx.lineWidth = 1.25;
    bladeCtx.lineJoin = "round";
    for (let arm = 0; arm < 4; arm += 1) {
      bladeCtx.save();
      bladeCtx.rotate(Math.PI / 4 + arm * Math.PI / 2);
      bladeCtx.beginPath();
      bladeCtx.moveTo(2, 0);
      bladeCtx.lineTo(8, -4);
      bladeCtx.lineTo(29, -8);
      bladeCtx.lineTo(24, 3);
      bladeCtx.lineTo(7, 4);
      bladeCtx.closePath();
      const sail = bladeCtx.createLinearGradient(2, 0, 29, -5);
      sail.addColorStop(0, "#7a0713");
      sail.addColorStop(0.52, arm % 2 ? "#cf1830" : "#ef3040");
      sail.addColorStop(1, "#8c0918");
      bladeCtx.fillStyle = sail;
      bladeCtx.fill();
      bladeCtx.stroke();
      bladeCtx.strokeStyle = "rgba(255,224,154,0.72)";
      bladeCtx.lineWidth = 0.72;
      bladeCtx.beginPath();
      bladeCtx.moveTo(8, -2.5);
      bladeCtx.lineTo(26, -6.2);
      bladeCtx.moveTo(11, 2.4);
      bladeCtx.lineTo(24, 0.6);
      bladeCtx.moveTo(15, -4.1);
      bladeCtx.lineTo(16, 1.8);
      bladeCtx.moveTo(21, -5.4);
      bladeCtx.lineTo(21.5, 1.1);
      bladeCtx.stroke();
      bladeCtx.strokeStyle = "#e6b85e";
      bladeCtx.lineWidth = 1.25;
      bladeCtx.restore();
    }
    bladeCtx.beginPath();
    bladeCtx.arc(0, 0, 5, 0, Math.PI * 2);
    bladeCtx.fillStyle = "#e6b85e";
    bladeCtx.fill();
    bladeCtx.beginPath();
    bladeCtx.arc(0, 0, 2.2, 0, Math.PI * 2);
    bladeCtx.fillStyle = "#fff0b0";
    bladeCtx.fill();
    bladeCtx.restore();
  }
  preRenderWindmillBlades();

  class TrailParticle {
    constructor(x, y, burst = false, index = 0, movementAngle = 0) {
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? 0.9 + Math.random() * 1.7 : 0.18 + Math.random() * 0.42;
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.radius = 0.8 + Math.random() * 1.5;
      this.alpha = 0.92;
      this.spin = (Math.random() - 0.5) * 0.18;
      this.angle = movementAngle + (Math.random() - 0.5) * 0.55;
      this.color = index % 3 === 0 ? config.accent : index % 2 ? config.primary : config.secondary;
      this.variant = index % 2;
      if (config.trail === "goldSparkleRosePetal") {
        this.vy -= this.variant ? 0.05 : 0.38;
        this.radius += this.variant ? 1.1 : 0;
      }
      if (config.trail === "diamondDust") this.vy += 0.18;
      if (config.trail === "glitchPixel") {
        this.vx = (Math.random() - 0.5) * (burst ? 3.2 : 1.5);
        this.vy = (Math.random() - 0.5) * (burst ? 3.2 : 1.5);
        this.color = index % 3 === 0 ? "#ffffff" : index % 2 ? "#ff00ff" : "#00f3ff";
      }
      if (config.trail === "neonSpark") {
        this.vx *= 0.7;
        this.vy *= 0.7;
        this.color = index % 2 ? "#e2b15d" : "#9b78d0";
      }
      if (config.trail === "crystalGlint") {
        this.vx *= burst ? 0.62 : 0.32;
        this.vy = burst ? this.vy * 0.62 : 0.03 + Math.random() * 0.16;
        this.radius = burst ? 1.15 + Math.random() * 1.25 : 0.85 + Math.random() * 1.05;
        this.alpha = burst ? 0.9 : 0.76;
        this.color = index % 3 === 0 ? "#ffffff" : index % 2 ? "#bfe8f5" : "#efdca4";
      }
      if (config.trail === "moonMist") {
        this.vx *= 0.24;
        this.vy *= 0.24;
        this.radius = 0.8 + Math.random() * 1.1;
        this.alpha = 0.32;
        this.color = index % 2 ? "#d9d1ef" : "#fffdf7";
      }
      if (config.trail === "magicDust") {
        this.vx = burst ? this.vx * 1.7 : 0.15 + Math.random() * 0.45;
        this.vy = burst ? this.vy * 1.7 : 0.4 + Math.random() * 0.75;
        this.color = index % 3 ? "#d4af37" : "#ffffff";
      }
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= config.trail === "magicDust" ? 0.97 : 0.93;
      this.vy *= config.trail === "magicDust" ? 0.97 : 0.93;
      this.angle += this.spin;
      this.alpha -= config.trail === "glitchPixel" ? 0.055 : config.trail === "magicDust" ? 0.018 : config.trail === "moonMist" ? 0.016 : config.trail === "crystalGlint" ? 0.024 : 0.03;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 3;
      ctx.strokeStyle = this.color;
      ctx.fillStyle = this.color;
      ctx.lineCap = "round";
      if (config.trail === "goldSparkleRosePetal" && this.variant) {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = "#b30b23";
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.7, this.radius * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (config.trail === "goldSparkleRosePetal" || config.trail === "diamondDust") {
        const length = this.radius * (config.trail === "diamondDust" ? 2.8 : 2.2);
        ctx.beginPath();
        ctx.moveTo(this.x - length, this.y);
        ctx.lineTo(this.x + length, this.y);
        ctx.moveTo(this.x, this.y - length);
        ctx.lineTo(this.x, this.y + length);
        ctx.stroke();
      } else if (config.trail === "glitchPixel") {
        ctx.fillRect(this.x, this.y, this.radius * 3.2, this.radius * 1.25);
      } else if (config.trail === "neonSpark" || config.trail === "magicDust") {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (config.trail === "magicDust" ? 0.85 : 0.7), 0, Math.PI * 2);
        ctx.fill();
      } else if (config.trail === "crystalGlint") {
        ctx.shadowBlur = 4;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        drawDiamond(ctx, 0, 0, this.radius * 1.8);
        ctx.fill();
        ctx.globalAlpha *= 0.72;
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 3.3, 0);
        ctx.lineTo(this.radius * 3.3, 0);
        ctx.moveTo(0, -this.radius * 2.7);
        ctx.lineTo(0, this.radius * 2.7);
        ctx.stroke();
      } else if (config.trail === "moonMist") {
        ctx.shadowBlur = 2.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class ClickBurst {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.age = 0;
      this.maxAge = 28;
    }
    update() {
      this.age += 1;
    }
    draw() {
      const progress = this.age / this.maxAge;
      const radius = 8 + progress * 40;
      const alpha = Math.max(0, 1 - progress);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = config.primary;
      ctx.fillStyle = config.secondary;
      ctx.lineWidth = 1.5;
      if (config.burst === "spectacular") {
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "#ff2a2a";
        ctx.shadowBlur = 8;
        ctx.font = "700 14px Georgia";
        ctx.textAlign = "center";
        ctx.fillText("SPECTACULAR!", 0, -8 - progress * 12);
      } else if (config.burst === "softDiamondGlow") {
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.7);
        glow.addColorStop(0, "rgba(255,255,255,0.8)");
        glow.addColorStop(0.35, "rgba(224,247,250,0.4)");
        glow.addColorStop(1, "rgba(224,247,250,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else if (config.burst === "glitchRipple") {
        ctx.strokeStyle = "#00f3ff";
        ctx.beginPath();
        ctx.ellipse(-2, 0, radius * 0.72, radius * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#ff00ff";
        ctx.beginPath();
        ctx.ellipse(2, 0, radius * 0.72, radius * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (config.burst === "goldenRippleNotes") {
        ctx.strokeStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#ffd700";
        ctx.font = "20px Georgia";
        ctx.fillText("♪", -12 - progress * 8, -8 - progress * 12);
        ctx.fillText("♫", 10 + progress * 10, 2 - progress * 15);
      } else if (config.burst === "pressGlow") {
        const lightRadius = 11 + progress * 20;
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, lightRadius);
        glow.addColorStop(0, "rgba(255,250,218,0.76)");
        glow.addColorStop(0.25, "rgba(255,224,137,0.42)");
        glow.addColorStop(0.62, "rgba(191,232,245,0.15)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, lightRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha *= 0.58;
        ctx.strokeStyle = "#fff3b8";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-6 - progress * 5, 0);
        ctx.lineTo(6 + progress * 5, 0);
        ctx.moveTo(0, -5 - progress * 4);
        ctx.lineTo(0, 5 + progress * 4);
        ctx.stroke();
      } else if (config.burst === "subtleRipple") {
        ctx.strokeStyle = "#9b78d0";
        ctx.lineWidth = 1.2;
        ctx.shadowColor = "#7454ae";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha *= 0.62;
        ctx.strokeStyle = "#e2b15d";
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
        ctx.stroke();
      } else if (config.burst === "lunarBloom") {
        const bloomRadius = 4 + progress * 9;
        const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, bloomRadius);
        bloom.addColorStop(0, "rgba(255,253,247,0.24)");
        bloom.addColorStop(0.38, "rgba(224,218,243,0.14)");
        bloom.addColorStop(0.72, "rgba(168,155,208,0.07)");
        bloom.addColorStop(1, "rgba(168,155,208,0)");
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(0, 0, bloomRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha *= 0.34;
        ctx.strokeStyle = "#eee9fb";
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5 + progress * 4.5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (config.burst === "crispShockwave") {
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2 - progress;
        ctx.shadowColor = "#d4af37";
        ctx.shadowBlur = 8;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawMotionTrail() {
    if (config.trail === "fiveLineStaff" && trailPoints.length > 1) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 1.2;
      [-14, -7, 0, 7, 14].forEach((offset) => {
        ctx.beginPath();
        trailPoints.forEach((point, index) => {
          const alpha = (index + 1) / trailPoints.length;
          ctx.globalAlpha = alpha * 0.48;
          if (index === 0) ctx.moveTo(point.x, point.y + offset);
          else ctx.lineTo(point.x, point.y + offset);
        });
        ctx.stroke();
      });
      ctx.restore();
      return;
    }
  }

  function drawChandelierLightPulse(size, foreground = false) {
    if (config.motif !== "grandChandelier" || chandelierLight < 0.01) return;
    const intensity = Math.min(1, chandelierLight);
    const candleLights = [
      [-0.333, -0.182],
      [-0.177, -0.234],
      [0, -0.255],
      [0.177, -0.234],
      [0.333, -0.182],
    ];
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    if (!foreground) {
      ctx.globalAlpha = intensity * 0.74;
      const halo = ctx.createRadialGradient(0, -size * 0.05, 0, 0, -size * 0.05, size * 0.72);
      halo.addColorStop(0, "rgba(255,242,184,0.6)");
      halo.addColorStop(0.38, "rgba(255,207,100,0.28)");
      halo.addColorStop(0.7, "rgba(186,226,244,0.12)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, -size * 0.05, size * 0.72, 0, Math.PI * 2);
      ctx.fill();
      candleLights.forEach(([x, y]) => {
        const lampGlow = ctx.createRadialGradient(x * size, y * size, 0, x * size, y * size, size * 0.16);
        lampGlow.addColorStop(0, "rgba(255,255,238,0.98)");
        lampGlow.addColorStop(0.25, "rgba(255,228,132,0.76)");
        lampGlow.addColorStop(1, "rgba(255,211,92,0)");
        ctx.fillStyle = lampGlow;
        ctx.beginPath();
        ctx.arc(x * size, y * size, size * 0.16, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      ctx.globalAlpha = intensity * 0.88;
      ctx.strokeStyle = "rgba(255,255,244,0.96)";
      ctx.lineWidth = Math.max(0.55, size * 0.013);
      candleLights.forEach(([x, y], index) => {
        const px = x * size;
        const py = y * size;
        const ray = size * (index === 2 ? 0.075 : 0.056);
        ctx.beginPath();
        ctx.moveTo(px - ray, py);
        ctx.lineTo(px + ray, py);
        ctx.moveTo(px, py - ray);
        ctx.lineTo(px, py + ray);
        ctx.stroke();
      });
      [[-0.21, 0.24], [0, 0.35], [0.21, 0.24]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x * size, y * size, size * 0.022, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(205,239,255,0.9)";
        ctx.fill();
      });
    }
    ctx.restore();
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("mousemove", (event) => {
    mouse.targetX = event.clientX;
    mouse.targetY = event.clientY;
    const distance = Math.hypot(event.clientX - lastEmit.x, event.clientY - lastEmit.y);
    const now = Date.now();
    const shouldEmit = config.emitInterval
      ? now - lastEmitTime >= config.emitInterval
      : distance >= (config.emitDistance || 12);
    if (shouldEmit) {
      const movementAngle = Math.atan2(event.clientY - lastEmit.y, event.clientX - lastEmit.x);
      if (config.trail !== "fiveLineStaff") {
        particles.push(new TrailParticle(event.clientX, event.clientY, false, particles.length, movementAngle));
      }
      canvas.dataset.cursorTrailEmissions = String(Number(canvas.dataset.cursorTrailEmissions) + 1);
      lastEmit.x = event.clientX;
      lastEmit.y = event.clientY;
      lastEmitTime = now;
    }
  });
  function triggerBurst(event) {
    const hasPointerPosition = Number.isFinite(event?.clientX) && Number.isFinite(event?.clientY);
    const x = hasPointerPosition ? event.clientX : mouse.x > 0 ? mouse.x : mouse.targetX;
    const y = hasPointerPosition ? event.clientY : mouse.y > 0 ? mouse.y : mouse.targetY;
    if (hasPointerPosition) {
      mouse.x = x;
      mouse.y = y;
      mouse.targetX = x;
      mouse.targetY = y;
    }
    bursts.push(new ClickBurst(x, y));
    if (config.motif === "grandChandelier") chandelierLight = 1;
    canvas.dataset.cursorClickBursts = String(Number(canvas.dataset.cursorClickBursts) + 1);
    for (let index = 0; index < config.burstParticles; index += 1) {
      particles.push(new TrailParticle(x, y, true, index, index * Math.PI * 2 / config.burstParticles));
    }
  }
  window.addEventListener("mousedown", (event) => {
    pressed = true;
    if (config.clickOn === "down") triggerBurst(event);
  });
  window.addEventListener("mouseup", (event) => {
    pressed = false;
    if (config.clickOn === "up") triggerBurst(event);
  });

  function animate() {
    if (document.hidden) {
      requestAnimationFrame(animate);
      return;
    }
    if (particles.length > 72) particles.splice(0, particles.length - 72);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.update();
      if (particle.alpha <= 0) particles.splice(index, 1); else particle.draw();
    }
    for (let index = bursts.length - 1; index >= 0; index -= 1) {
      const burst = bursts[index];
      burst.update();
      if (burst.age >= burst.maxAge) bursts.splice(index, 1); else burst.draw();
    }
    if (bursts.length > 8) bursts.splice(0, bursts.length - 8);
    mouse.x += (mouse.targetX - mouse.x) * config.follow;
    mouse.y += (mouse.targetY - mouse.y) * config.follow;
    if (mouse.targetX > -50) {
      if (config.trail === "fiveLineStaff") {
        trailPoints.push({ x: mouse.x, y: mouse.y });
        if (trailPoints.length > 35) trailPoints.shift();
      }
      drawMotionTrail();
      const size = (pressed ? config.size * 0.9 : config.size) * pointerScale * 1;
      ctx.save();
      ctx.translate(mouse.x, mouse.y);
      if (config.motif === "windmill") {
        ctx.drawImage(cache, -size * 0.5, -size * 0.5, size, size);
        windmillRotation += 0.02;
        ctx.rotate(windmillRotation);
        ctx.drawImage(bladeCache, -size * 0.5, -size * 0.5, size, size);
      } else {
        drawChandelierLightPulse(size, false);
        ctx.drawImage(
          cache,
          -size * config.hotspot[0],
          -size * config.hotspot[1],
          size,
          size,
        );
        drawChandelierLightPulse(size, true);
      }
      ctx.restore();
    }
    chandelierLight *= 0.965;
    if (chandelierLight < 0.006) chandelierLight = 0;
    requestAnimationFrame(animate);
  }

  resizeCanvas();
  animate();
})();
`;
}

function renderTests(show) {
  return `const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scriptJs = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styleCss = fs.readFileSync(path.join(root, "style.css"), "utf8");
const songsJs = fs.readFileSync(path.join(root, "songs.js"), "utf8");
const wordDataJs = fs.readFileSync(path.join(root, "word-data.js"), "utf8");
const audioBuilderJs = fs.readFileSync(path.join(root, "scripts", "build-audio.js"), "utf8");
const cursorJs = fs.readFileSync(path.join(root, "..", "shared", "cursors", "${show.slug}.js"), "utf8");
const cursorMarker = ${JSON.stringify(getCursorMarker(show.slug))};

test("page includes the shared Google Analytics tag", () => {
  assert.match(indexHtml, /https:\\/\\/www\\.googletagmanager\\.com\\/gtag\\/js\\?id=G-E49LJ5T1V6/);
  assert.match(indexHtml, /gtag\\('config', 'G-E49LJ5T1V6'\\)/);
});

test("lyrics do not contain OCR acute apostrophes or glued Latin punctuation", () => {
  const punctuationSandbox = { window: {} };
  vm.runInNewContext(songsJs, punctuationSandbox);
  const displayedLyrics = punctuationSandbox.window.songs.flatMap((song) => [
    song.title,
    song.titleZh,
    ...song.lines.flatMap((line) => [line.original, line.en, line.zh]),
  ]).filter(Boolean).join("\\n");
  assert.doesNotMatch(displayedLyrics, /´/u);
  assert.doesNotMatch(
    displayedLyrics,
    /\\p{Script=Latin},\\p{Script=Latin}|\\p{Script=Latin}[!?;:]\\p{Script=Latin}|\\p{Ll}\\.\\p{Script=Latin}|\\p{Script=Latin}\\.\\p{Ll}|\\p{Script=Latin}[!?]\\(|\\)\\p{Script=Latin}/u,
  );
});

test("favorites are not present", () => {
  const combined = \`\${indexHtml}\\n\${scriptJs}\\n\${styleCss}\`;
  ["favorite", "Favorite", "收藏", "onlyFavorites", "song-star"].forEach((term) => {
    assert.equal(combined.includes(term), false, \`found removed favorite term: \${term}\`);
  });
});

test("Chinese, IPA, and optional English toggles exist", () => {
  assert.match(indexHtml, /data-toggle="showZh"/);
  assert.match(indexHtml, /data-toggle="showIpa"/);
  assert.match(indexHtml, /id="feedbackButton"[^>]*>反馈<\\/button>/);
  assert.ok(indexHtml.indexOf('data-toggle="showIpa"') < indexHtml.indexOf('id="feedbackButton"'));
  if (${JSON.stringify(show.showEnglishToggle === false)}) {
    assert.doesNotMatch(indexHtml, /data-toggle="showEn"/);
  } else {
    assert.match(indexHtml, /data-toggle="showEn"/);
    assert.ok(indexHtml.indexOf('data-toggle="showEn"') < indexHtml.indexOf('id="feedbackButton"'));
  }
  assert.match(scriptJs, /showIpa:\\s*true/);
  assert.match(scriptJs, /phonetic\\.hidden\\s*=\\s*!state\\.settings\\.showIpa/);
  assert.match(scriptJs, /function getAlignedWordIpa/);
  assert.match(scriptJs, /function formatLineIpaPart/);
  assert.match(styleCss, /\\.word-phonetic/);
  assert.match(styleCss, /\\.song-order/);
  assert.match(styleCss, /#effectCanvas \\{[\\s\\S]*z-index:\\s*999999/);
  assert.doesNotMatch(scriptJs, /行歌词/);
});

test("page mounts the shared feedback widget with current song selection", () => {
  assert.match(indexHtml, /\\.\\.\\/shared\\/feedback-widget\\.js/);
  assert.match(indexHtml, /window\\.MusicalFeedback\\.mount/);
  assert.match(indexHtml, /trigger:\\s*"#feedbackButton"/);
  assert.match(indexHtml, /recipient:\\s*"fulife@agent\\.qq\\.com"/);
  assert.match(indexHtml, /getCurrentSongId:\\s*\\(\\) =>/);
  assert.match(scriptJs, /function getCurrentSong/);
});

test("script initializes page config before reading display settings", () => {
  const configIndex = scriptJs.indexOf("const config = window.pageConfig || {};");
  const stateIndex = scriptJs.indexOf("const state = {");
  const readSettingsIndex = scriptJs.indexOf("settings: readSettings(),");
  assert.notEqual(configIndex, -1);
  assert.notEqual(stateIndex, -1);
  assert.notEqual(readSettingsIndex, -1);
  assert.ok(configIndex < stateIndex);
  assert.ok(configIndex < readSettingsIndex);
});

test("song header includes a right-side show visual and soft switching", () => {
  assert.match(indexHtml, /class="hero"/);
  assert.match(indexHtml, /class="home-button" href="\\.\\.\\/index\\.html" aria-label="返回音乐剧展示架"/);
  assert.match(indexHtml, /class="show-visual"/);
  assert.match(indexHtml, /class="show-visual-image" src="assets\\/show-logo\\.png"/);
  assert.match(styleCss, /\\.hero/);
  assert.match(styleCss, /\\.show-visual/);
  assert.match(scriptJs, /function renderCurrentSongWithTransition/);
  assert.match(scriptJs, /is-song-changing/);
  assert.match(scriptJs, /is-song-settling/);
  assert.match(styleCss, /@keyframes lyric-card-soft-in/);
});

test("song switching resets the new song to the top of the page", () => {
  assert.match(scriptJs, /function resetSongScrollPosition/);
  assert.match(scriptJs, /window\\.scrollTo\\(\\{ top: 0, left: 0, behavior: "auto" \\}\\)/);
  assert.match(scriptJs, /renderCurrentSongWithTransition\\(\\);\\s*resetSongScrollPosition\\(\\);/);
});

test("playlist button stays in the inline title flow", () => {
  assert.match(styleCss, /\\.song-title-row\\s*\\{[\\s\\S]*?display:\\s*block;/);
  assert.match(styleCss, /\\.song-title-row h2\\s*\\{[\\s\\S]*?display:\\s*inline;/);
  assert.match(styleCss, /\\.song-play-button\\s*\\{[\\s\\S]*?margin-inline-start:\\s*0\\.32em;/);
});

test("page follows the Hamilton-style collapsible navigation frame", () => {
  assert.match(indexHtml, /id="sidebarToggle"/);
  assert.match(indexHtml, /id="songSelect"/);
  assert.match(styleCss, /\\.app-shell\\.is-collapsed/);
  assert.match(styleCss, /\\.song-sidebar/);
  assert.match(styleCss, /\\.mobile-picker/);
  assert.match(scriptJs, /const SIDEBAR_KEY/);
  assert.match(scriptJs, /function syncSidebarState/);
  assert.match(scriptJs, /dom\\.songSelect\\?\\.addEventListener/);
  assert.doesNotMatch(indexHtml, />合集<\\/a>/);
});

test("page includes a themed canvas cursor effect", () => {
  assert.match(indexHtml, /<canvas id="effectCanvas"/);
  assert.match(styleCss, /#effectCanvas\\s*\\{/);
  assert.match(styleCss, /cursor:\\s*none !important/);
  assert.match(indexHtml, /\\.\\.\\/shared\\/cursors\\/${show.slug}\\.js/);
  assert.match(scriptJs, /initThemedCursor\\(\\)/);
  assert.match(scriptJs, /if \\(window\\.referenceCursorActive\\) return/);
  assert.match(cursorJs, /window\\.referenceCursorActive = true/);
  assert.match(cursorJs, new RegExp(cursorMarker));
  assert.match(cursorJs, /Math\\.min\\(window\\.devicePixelRatio \\|\\| 1, 1\\.5\\)/);
  assert.match(cursorJs, /particles\\.length > 72/);
  assert.match(cursorJs, /document\\.hidden/);
});

test("songs and word data are populated", () => {
  const sandbox = { window: {} };
  vm.runInNewContext(songsJs, sandbox);
  vm.runInNewContext(wordDataJs, sandbox);
  assert.ok(sandbox.window.songs.length > 0);
  assert.ok(sandbox.window.songs.every((song) => song.lines.length > 0));
  assert.ok(sandbox.window.songs.every((song) => song.titleZh));
  const versionLabel = /(?:[（(\\[［]\\s*(?:live|现场)|[-–—]\\s*live)/iu;
  assert.ok(sandbox.window.songs.every((song) => !versionLabel.test(song.title) && !versionLabel.test(song.titleZh)));
  assert.ok(Object.keys(sandbox.window.wordEntries).length > 0);
});

test("visible song numbers are consecutive after empty tracks are removed", () => {
  const sandbox = { window: {} };
  vm.runInNewContext(songsJs, sandbox);
  const songs = sandbox.window.songs;
  assert.deepEqual(songs.map((song) => song.displayOrder), songs.map((_, index) => index + 1));
  assert.match(scriptJs, /song\.displayOrder \|\| song\.order/);
});

test("Starmania opening keeps the reviewed Chinese translation", () => {
  if (${JSON.stringify(show.slug)} !== "starmania") return;
  const sandbox = { window: {} };
  vm.runInNewContext(songsJs, sandbox);
  const opening = sandbox.window.songs[0];
  assert.equal(opening.titleZh, "垄断城出大事了");
  assert.equal(opening.lines.find((line) => line.lineIndex === 3).zh, "垄断城");
  assert.equal(opening.lines.find((line) => line.lineIndex === 29).zh, "当太阳落下");
});

test("Phantom and Love Never Dies stay in separate source ranges", () => {
  if (!["phantom-of-the-opera", "love-never-dies"].includes(${JSON.stringify(show.slug)})) return;
  const sandbox = { window: {} };
  vm.runInNewContext(songsJs, sandbox);
  const songs = sandbox.window.songs;
  if (${JSON.stringify(show.slug)} === "phantom-of-the-opera") {
    assert.equal(songs.length, 18);
    assert.equal(Math.max(...songs.map((song) => song.sourceOrder)), 21);
    assert.equal(songs[0].title, "Prologue");
    assert.equal(songs[0].titleZh, "序幕");
    assert.ok(songs.every((song) => !/live|现场/iu.test(song.title) && !/live|现场/iu.test(song.titleZh)));
    return;
  }
  assert.equal(songs.length, 26);
  assert.equal(Math.min(...songs.map((song) => song.sourceOrder)), 22);
  assert.match(songs[0].lines[0].id, /^phantom-of-the-opera-22-/);
});

test("reviewed OCR word fragments are reassembled", () => {
  if (!["la-legende-du-roi-arthur", "phantom-of-the-opera"].includes(${JSON.stringify(show.slug)})) return;
  const sandbox = { window: {} };
  vm.runInNewContext(songsJs, sandbox);
  vm.runInNewContext(wordDataJs, sandbox);
  const lines = sandbox.window.songs.flatMap((song) => song.lines);
  const brokenTerms = ["Go té", "dé mons", "dé fait", "magné tique", "dé fie", "Ensorcelé e", "pensé es", "dé tour", "dé lit", "gouté", "au delà", "guida nce", "Monsieur ur"];
  assert.equal(brokenTerms.find((term) => songsJs.includes(term)), undefined);

  if (${JSON.stringify(show.slug)} === "la-legende-du-roi-arthur") {
    assert.equal(lines.find((line) => line.id === "la-legende-du-roi-arthur-01-003").original, "Goûté aux effets toxiques");
    assert.equal(lines.find((line) => line.id === "la-legende-du-roi-arthur-01-007").original, "Tué mes démons, bravé les tourments");
    assert.equal(lines.find((line) => line.id === "la-legende-du-roi-arthur-06-004").original, "Ensorcelée par de sensuelles pensées");
    assert.equal(lines.find((line) => line.id === "la-legende-du-roi-arthur-17-011").original, "De désirer jusqu'au délit");
    assert.equal(sandbox.window.wordEntries["goûté"].meaning, "尝过；品尝过");
    assert.equal(sandbox.window.wordEntries.démons.meaning, "恶魔；心魔");
    return;
  }

  assert.equal(lines.find((line) => line.id === "phantom-of-the-opera-19-003").original, "yearning for my guidance...");
  assert.equal(lines.find((line) => line.id === "phantom-of-the-opera-19-043").original, "Let's see, Monsieur, how far you dare go?");
  assert.equal(sandbox.window.wordEntries.guidance.meaning, "指引；指导");
});

test("word cards do not contain placeholder copy", () => {
  const combined = \`\${scriptJs}\\n\${wordDataJs}\`;
  ["word from the lyric line", "暂未收录", "not in the local glossary yet", "title word", "contextual lyric term", "结合本句", "语境", "词义：", "de + ésir", "专有名词；人名、地名或剧中称谓", "proper noun or character/place name"].forEach((term) => {
    assert.equal(combined.includes(term), false, \`found placeholder: \${term}\`);
  });
  const sandbox = { window: {} };
  vm.runInNewContext(wordDataJs, sandbox);
  const unresolved = Object.entries(sandbox.window.wordEntries).find(([, entry]) => /^(?:ce|de|je|le\\/la|me|ne|que|se|te) \\+ /i.test(entry.en || ""));
  assert.equal(unresolved, undefined, \`found unresolved contraction: \${unresolved?.[0]}\`);
});

test("Le Roi Soleil keeps clean lyric breaks and real glosses", () => {
  if (${JSON.stringify(show.slug)} !== "le-roi-soleil") return;
  const sandbox = { window: {} };
  vm.runInNewContext(songsJs, sandbox);
  vm.runInNewContext(wordDataJs, sandbox);
  const opening = sandbox.window.songs.find((song) => song.sourceOrder === 2);
  assert.equal(opening.lines.length, 54);
  assert.equal(opening.lines[0].original, "Pour une couronne qu'on n'aura pas");
  assert.equal(opening.lines[1].original, "Un jour meilleur qui ne vient pas");
  assert.equal(opening.lines.some((line) => /,\\s*[，,]|，/u.test(line.original)), false);
  assert.equal(sandbox.window.songs.some((song) => song.lines.some((line) => /,\\s*[，,]|，/u.test(line.original))), false);
  assert.equal(sandbox.window.wordEntries["apprends-moi"].meaning, "教教我；告诉我");
  assert.equal(sandbox.window.wordEntries.versailles.meaning, "凡尔赛");
  assert.equal(sandbox.window.wordEntries.jerusalem.meaning, "耶路撒冷");
  assert.equal(sandbox.window.wordEntries.panurge.meaning, "盲从者；随大流的人");
});

test("French desire words keep dictionary glosses instead of elision fragments", () => {
  if (${JSON.stringify(show.language)} !== "fr") return;
  const sandbox = { window: {} };
  vm.runInNewContext(wordDataJs, sandbox);
  ["désir", "désirs", "désirer", "désire", "désirée", "désirent"].forEach((key) => {
    const entry = sandbox.window.wordEntries[key];
    if (!entry) return;
    assert.match(entry.meaning, /欲望|渴望|想要/);
    assert.match(entry.en, /desire|want|desired|wanted/);
    assert.doesNotMatch(entry.en, /\\+\\s*ésir/);
  });
});

test("Moliere keeps the requested show name and dictionary meaning", () => {
  if (${JSON.stringify(show.slug)} !== "moliere-le-spectacle-musical") return;
  const sandbox = { window: {} };
  vm.runInNewContext(wordDataJs, sandbox);
  assert.match(indexHtml, /"title": "Molière"/);
  assert.match(indexHtml, /"titleZh": "莫里哀"/);
  assert.equal(sandbox.window.wordEntries["molière"].meaning, "莫里哀");
  assert.equal(sandbox.window.wordEntries["molière"].en, "Molière");
});

test("every word entry has IPA, Chinese meaning, English definition, and speak text", () => {
  const sandbox = { window: {} };
  vm.runInNewContext(wordDataJs, sandbox);
  const missing = Object.entries(sandbox.window.wordEntries).filter(([, entry]) => !entry.ipa || !entry.meaning || !entry.en || !entry.speak);
  assert.deepEqual(missing.slice(0, 10), []);
});

test("word-card English gloss is short, and English pages hide it", () => {
  if (${JSON.stringify(show.language)} === "en") {
    assert.match(scriptJs, /config\\.language !== "en"/);
    assert.doesNotMatch(scriptJs, /dom\\.popover\\.append\\(head, ipa, meaning, en\\)/);
    return;
  }

  const sandbox = { window: {} };
  vm.runInNewContext(wordDataJs, sandbox);
  const longGlosses = Object.entries(sandbox.window.wordEntries)
    .filter(([, entry]) => String(entry.en || "").length > 48);
  assert.deepEqual(longGlosses.slice(0, 10), []);
});

test("clickable song title and lyric words are wired", () => {
  assert.match(scriptJs, /renderClickableWords\\(config\\.title/);
  assert.match(scriptJs, /renderClickableWords\\(song\\.title/);
  assert.match(scriptJs, /renderClickableWords\\(line\\.original/);
  assert.match(scriptJs, /className = className/);
  assert.match(styleCss, /\\.lyric-word/);
  assert.match(styleCss, /\\.song-title-word/);
});

test("word-card IPA sits beside the word and translations keep English above Chinese", () => {
  assert.match(scriptJs, /term\\.append\\(word, ipa\\)/);
  assert.match(styleCss, /\\.popover-term\\s*\\{[\\s\\S]*display:\\s*flex/);
  assert.ok(scriptJs.indexOf('en.className = "line-en"') < scriptJs.indexOf('zh.className = "line-zh"'));
  assert.match(styleCss, /h2\\s*\\{[\\s\\S]*font-size:\\s*clamp\\(1\\.7rem, 3\\.6vw, 3\\.25rem\\)/);
});

test("page includes an unobtrusive return-to-top control", () => {
  assert.match(indexHtml, /id="backToTop"/);
  assert.match(scriptJs, /function bindBackToTop/);
  assert.match(scriptJs, /window\\.scrollTo\\(\\{ top: 0, behavior: "smooth" \\}\\)/);
  assert.match(styleCss, /\\.back-to-top/);
});

test("sentence and word audio prefer local wav files", () => {
  assert.match(scriptJs, /new Audio\\(src\\)/);
  assert.match(scriptJs, /audio\\/lines/);
  assert.match(scriptJs, /audio\\/words/);
  assert.match(indexHtml, /\\.\\.\\/shared\\/audio-playback\\.js/);
  assert.match(indexHtml, /id="songPlayButton"/);
  assert.match(indexHtml, /playlist-lines-mark/);
  assert.match(indexHtml, /playlist-stop-mark" x="8"/);
  assert.match(scriptJs, /MusicalAudio\\.createController/);
  assert.match(scriptJs, /audioController\\.runUserAction/);
  assert.match(scriptJs, /audioController\\.toggleSequence/);
  assert.match(scriptJs, /function playLineToEnd/);
  assert.match(scriptJs, /function preloadLineAudio/);
  assert.match(scriptJs, /function followSequenceCard/);
  assert.match(scriptJs, /scrollIntoView/);
  assert.match(scriptJs, /audio\\.addEventListener\\("ended"/);
  assert.match(styleCss, /\\.song-play-button/);
  assert.match(styleCss, /\\.lyric-card\\.is-sequence-active/);
  assert.match(audioBuilderJs, /build-natural-audio\\.js/);
  assert.match(audioBuilderJs, /runBuild\\(\\{/);
  assert.match(audioBuilderJs, /MUSICAL_TTS_VOICE/);
  assert.match(audioBuilderJs, /kind:\\s*"generated"/);
});

test("narrow and mobile layouts override a persisted collapsed sidebar", () => {
  assert.match(styleCss, /@media \\(max-width: 980px\\)[\\s\\S]*\\.app-shell,\\s*[\\s\\S]*\\.app-shell\\.is-collapsed\\s*\\{[\\s\\S]*display:\\s*block/);
  assert.match(styleCss, /@media \\(max-width: 980px\\)[\\s\\S]*\\.toolbar\\s*\\{[\\s\\S]*grid-template-columns:\\s*repeat\\(auto-fit, minmax\\(64px, 1fr\\)\\)/);
  assert.match(styleCss, /@media \\(max-width: 980px\\)[\\s\\S]*\\.lyric-card\\s*\\{[\\s\\S]*grid-template-columns:\\s*minmax\\(0, 1fr\\) 38px;/);
  assert.match(scriptJs, /window\\.matchMedia\\("\\(max-width: 980px\\)"\\)\\.matches/);
  assert.match(scriptJs, /state\\.sidebarCollapsed && !isNarrowLayout/);
  assert.match(scriptJs, /window\\.addEventListener\\("resize", syncSidebarState/);
  assert.match(styleCss, /overflow-wrap:\\s*anywhere/);
});
`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main();
