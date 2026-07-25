from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LYRICS_FILE = ROOT / "lyrics-data.js"
WORD_FILE = ROOT / "word-data.js"
TOKEN_RE = re.compile(r"[^\W\d_]+(?:['’][^\W\d_]+)?(?:-[^\W\d_]+)*|\d+", re.UNICODE)
VOWELS = set("aeiouyɑæəɚɝɛɜɪɔʊʌɒœøɨɯ")

IPA_OVERRIDES = {
    "a": "ə",
    "an": "ən",
    "and": "ænd",
    "are": "ɑr",
    "for": "fɔr",
    "her": "hɝ",
    "of": "əv",
    "or": "ɔr",
    "our": "aʊr",
    "the": "ðə",
    "their": "ðɛr",
    "there": "ðɛr",
    "to": "tə",
    "were": "wɝ",
    "where": "wɛr",
    "your": "jʊr",
    "you're": "jʊr",
    "ami": "ami",
    "bonsoir": "bɔ̃swaʁ",
    "c'est": "sɛ",
    "casse": "kas",
    "cinq": "sɛ̃k",
    "deux": "dø",
    "huit": "ɥit",
    "je": "ʒə",
    "m'appelle": "mapɛl",
    "moi": "mwa",
    "mon": "mɔ̃",
    "neuf": "nœf",
    "oui": "wi",
    "pièce": "pjɛs",
    "quatre": "katʁ",
    "résistance": "ʁezistɑ̃s",
    "sept": "sɛt",
    "six": "sis",
    "toi": "twa",
    "trois": "tʁwa",
    "un": "œ̃",
}

ENTRY_OVERRIDES = {
    "beliefs": {"meaning": "信仰；信念（belief 的复数）", "en": "plural of belief"},
    "else": {"meaning": "别的；其他的；否则", "en": "other / otherwise"},
    "george": {"meaning": "乔治（男子名）", "en": "given name"},
    "georges": {"meaning": "乔治的；乔治（男子名）", "en": "given name / possessive form"},
    "george's": {"meaning": "乔治的", "en": "possessive form of George"},
}


def load_js(path: Path, prefix: str):
    source = path.read_text(encoding="utf-8")
    if not source.startswith(prefix):
        raise ValueError(f"Unexpected data wrapper in {path}")
    return json.loads(source[len(prefix) :].strip().removesuffix(";"))


def write_js(path: Path, prefix: str, data) -> None:
    path.write_text(f"{prefix}{json.dumps(data, ensure_ascii=False, indent=2)};\n", encoding="utf-8")


def move_stress_before_onset(value: str) -> str:
    chars = list(value)
    index = 0
    while index < len(chars):
        if chars[index] not in {"ˈ", "ˌ"}:
            index += 1
            continue
        mark = chars.pop(index)
        insertion = index
        while insertion > 0 and chars[insertion - 1] not in VOWELS and chars[insertion - 1] not in {"ˈ", "ˌ"}:
            insertion -= 1
        chars.insert(insertion, mark)
        index = max(index + 1, insertion + 1)
    return "".join(chars)


def normalize_american_ipa(raw: str, token: str, keep_stress: bool) -> str:
    value = raw.replace("\u200d", "").replace("\n", " ").strip()
    value = re.sub(r"\s+", "", value)
    value = value.replace("ɜːɹ", "ɝ").replace("ɜː", "ɝ")
    value = value.replace("ɑː", "ɑ").replace("ɔː", "ɔ").replace("iː", "i").replace("uː", "u")
    value = value.replace("ɐ", "ə").replace("ᵻ", "ɪ").replace("ʔ", "t").replace("ɹ", "r")
    value = value.replace("ɚr", "ər").replace("rr", "r")
    if "ɾ" in value:
        value = value.replace("ɾ", "d" if re.search(r"[aeiouy]d[aeiouy]", token.lower()) else "t")
    value = move_stress_before_onset(value)
    if not keep_stress:
        value = value.replace("ˈ", "").replace("ˌ", "")
    return value


def batch_ipa(tokens: list[str], keep_stress: bool) -> dict[str, str]:
    unique = list(dict.fromkeys(tokens))
    generated_tokens = [token for token in unique if token.lower().replace("’", "'") not in IPA_OVERRIDES]
    result = subprocess.run(
        ["espeak-ng", "-q", "--ipa=3", "-v", "en-us"],
        input="\n".join(token.replace("’", "'") for token in generated_tokens) + "\n",
        check=True,
        capture_output=True,
        text=True,
    )
    generated = result.stdout.splitlines()
    if len(generated) != len(generated_tokens):
        raise RuntimeError(f"IPA batch alignment failed: expected {len(generated_tokens)}, got {len(generated)}")
    mapping = {
        token.lower().replace("’", "'"): normalize_american_ipa(raw, token, keep_stress)
        for token, raw in zip(generated_tokens, generated, strict=True)
    }
    mapping.update(IPA_OVERRIDES)
    return mapping


def main() -> None:
    rows = load_js(LYRICS_FILE, "window.hamiltonLyricsRows = ")
    entries = load_js(WORD_FILE, "window.hamiltonWordEntries = ")
    line_tokens = [token for row in rows for token in TOKEN_RE.findall(row.get("english", ""))]
    for token in dict.fromkeys(line_tokens):
        if token.isdigit() and token not in entries:
            entries[token] = {"ipa": "", "meaning": f"数字：{token}", "en": "number", "speak": token}
    entry_tokens = [str(entry.get("speak") or key) for key, entry in entries.items()]
    broad_cache = batch_ipa(line_tokens, keep_stress=False)
    word_cache = batch_ipa(entry_tokens, keep_stress=True)

    for row in rows:
        parts = []
        for token in TOKEN_RE.findall(row.get("english", "")):
            key = token.lower().replace("’", "'")
            parts.append(broad_cache[key])
        row["ipa"] = f"/{' '.join(filter(None, parts))}/" if parts else ""

    for key, entry in entries.items():
        token = str(entry.get("speak") or key)
        cache_key = token.lower().replace("’", "'")
        entry["ipa"] = f"/{word_cache[cache_key]}/" if word_cache[cache_key] else ""
        if key in ENTRY_OVERRIDES:
            entry.update(ENTRY_OVERRIDES[key])

    write_js(LYRICS_FILE, "window.hamiltonLyricsRows = ", rows)
    write_js(WORD_FILE, "window.hamiltonWordEntries = ", entries)
    print(f"Updated {len(rows)} lines and {len(entries)} word entries; unique tokens={len(broad_cache)}")


if __name__ == "__main__":
    main()
