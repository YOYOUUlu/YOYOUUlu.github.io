const libraryLanguages = [
  { id: "en", label: "英语音乐剧" },
  { id: "ko", label: "韩语音乐剧" },
  { id: "de", label: "德语音乐剧" },
];

const libraryShows = [
  {
    id: "hamilton",
    deployed: true,
    language: "en",
    cardClass: "hamilton",
    href: "Hamilton/index.html",
    title: "Hamilton",
    image: "Hamilton/assets/Hamilton-Logo-1.svg",
    prefetch: ["Hamilton/lyrics-data.js"],
    meta: ["英语", "IPA", "中文对照"],
  },
  {
    id: "death-note",
    deployed: true,
    language: "ko",
    cardClass: "deathnote",
    href: "Death-Note/index.html",
    title: "Death Note",
    image: "Death-Note/assets/show-logo.png",
    prefetch: ["Death-Note/songs.js"],
    coverLines: ["Death Note"],
    originalTitle: "Death Note",
    meta: ["韩语", "罗马音", "中文对照"],
  },
  {
    id: "les-miserables",
    language: "en",
    cardClass: "lesmis",
    href: "les-miserables/index.html",
    title: "悲惨世界",
    image: "les-miserables/assets/show-logo.png",
    coverLines: ["悲惨", "世界"],
    originalTitle: "Les Misérables",
    meta: ["英语", "IPA", "中文对照"],
  },
  {
    id: "moulin-rouge",
    language: "en",
    cardClass: "moulin",
    href: "moulin-rouge/index.html",
    title: "红磨坊",
    image: "moulin-rouge/assets/show-logo.png",
    originalTitle: "Moulin Rouge! The Musical",
    meta: ["英语", "IPA", "中文对照"],
  },
  {
    id: "phantom-of-the-opera",
    language: "en",
    cardClass: "phantom",
    href: "phantom-of-the-opera/index.html",
    title: "剧院魅影",
    image: "phantom-of-the-opera/assets/show-logo.png",
    originalTitle: "The Phantom of the Opera",
    meta: ["英语", "IPA", "中文对照"],
  },
  {
    id: "love-never-dies",
    language: "en",
    cardClass: "love-never-dies",
    href: "love-never-dies/index.html",
    title: "真爱不死",
    image: "love-never-dies/assets/show-logo.png",
    originalTitle: "Love Never Dies",
    meta: ["英语", "IPA", "中文对照"],
  },
  {
    id: "elisabeth-das-musical",
    language: "de",
    cardClass: "elisabeth",
    href: "elisabeth-das-musical/index.html",
    title: "伊丽莎白",
    image: "elisabeth-das-musical/assets/show-logo.png",
    originalTitle: "Elisabeth",
    meta: ["德语", "IPA", "中英对照"],
  },
  {
    id: "mozart-das-musical",
    language: "de",
    cardClass: "mozart-musical",
    href: "mozart-das-musical/index.html",
    title: "莫扎特！",
    image: "mozart-das-musical/assets/show-logo.png",
    originalTitle: "Mozart! Das Musical",
    meta: ["德语", "IPA", "中英对照"],
  },
];

if (typeof window !== "undefined") {
  window.libraryLanguages = libraryLanguages;
  window.libraryShows = libraryShows;
}

if (typeof module !== "undefined") {
  module.exports = { libraryLanguages, libraryShows };
}
