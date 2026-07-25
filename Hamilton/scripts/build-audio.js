const path = require("node:path");
const { runBuild } = require(path.resolve(__dirname, "..", "..", "shared", "build-natural-audio.js"));

runBuild({
  root: path.resolve(__dirname, ".."),
  voice: process.env.HAMILTON_TTS_VOICE || "Samantha",
  rate: Number(process.env.HAMILTON_TTS_RATE || "0.48"),
  kind: "hamilton",
});
