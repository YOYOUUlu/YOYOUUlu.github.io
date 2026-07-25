from __future__ import annotations

import json
import re
import subprocess
import sys
from csv import DictReader
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INPUT_JS = ROOT / "lyrics-data.js"
OUTPUT_JS = ROOT / "word-data.js"
OVERRIDES_JSON = ROOT / "word-overrides.json"
DEFAULT_DICT = Path("/tmp/ecdict.csv")

TOKEN_RE = re.compile(r"[^\W\d_]+(?:['’][^\W\d_]+)?(?:-[^\W\d_]+)*", re.UNICODE)
DROPPED_G_RE = re.compile(r"\b([A-Za-z]+in)['’](?=\W|$)", re.IGNORECASE)
DOMAIN_LABEL_RE = re.compile(r"\[(?:计|医|化|经|法)\][^；;]*")

SPECIAL_GLOSSARY = {
    "a": ("不定冠词；一个", "indefinite article"),
    "about": ("关于；大约；在周围", "preposition / adverb"),
    "above": ("在……上方；超过；上文", "preposition / adverb"),
    "across": ("穿过；横过；在对面", "preposition / adverb"),
    "alexander": ("亚历山大（男子名）", "given name"),
    "alex": ("亚历克斯（人名 Alexander 的简称）", "given name"),
    "all": ("全部；所有；完全地", "determiner / pronoun / adverb"),
    "am": ("be 的第一人称单数现在式；是", "first-person singular be verb"),
    "an": ("不定冠词；一个", "indefinite article"),
    "and": ("和；并且", "conjunction"),
    "angelica": ("安吉莉卡（女子名）", "given name"),
    "are": ("be 的复数或第二人称现在式；是", "be verb plural / second-person"),
    "around": ("在周围；大约；到处", "preposition / adverb"),
    "as": ("作为；像……一样；当……时；因为", "conjunction / preposition"),
    "at": ("在；向；以某一点", "preposition"),
    "away": ("离开；向远处", "adverb"),
    "be": ("是；成为；存在", "be verb"),
    "been": ("be 的过去分词；曾经是", "past participle of be"),
    "being": ("存在；生物；be 的现在分词", "noun / present participle of be"),
    "burr": ("伯尔（姓氏；剧中指 Aaron Burr）", "surname"),
    "but": ("但是；除了；仅仅", "conjunction / preposition"),
    "by": ("被；通过；在……旁边", "preposition / adverb"),
    "eliza": ("伊莱莎（女子名；Elizabeth 的昵称）", "given name"),
    "every": ("每一个；所有的", "determiner"),
    "for": ("为了；给；因为；对于", "preposition / conjunction"),
    "from": ("从；来自；由于", "preposition"),
    "hamilton": ("汉密尔顿（姓氏；剧中指 Alexander Hamilton）", "surname"),
    "he": ("他", "pronoun"),
    "her": ("她；她的", "pronoun / possessive determiner"),
    "here": ("这里；在这里", "adverb"),
    "him": ("他（宾格）", "pronoun"),
    "his": ("他的", "possessive pronoun / determiner"),
    "how": ("如何；怎样；多么", "adverb"),
    "i": ("我", "pronoun"),
    "if": ("如果；是否", "conjunction"),
    "in": ("在……里面；进入；在……期间", "preposition / adverb"),
    "is": ("be 的第三人称单数现在式；是", "third-person singular be verb"),
    "it": ("它；这件事", "pronoun"),
    "its": ("它的", "possessive determiner"),
    "just": ("刚刚；只是；正好；公正的", "adverb / adjective"),
    "lafayette": ("拉法耶特（法国贵族姓氏；剧中人物）", "surname"),
    "laurens": ("劳伦斯（姓氏；剧中指 John Laurens）", "surname"),
    "me": ("我（宾格）", "pronoun"),
    "mulligan": ("马利根（姓氏；剧中指 Hercules Mulligan）", "surname"),
    "my": ("我的", "possessive determiner"),
    "no": ("不；没有；否定回答", "determiner / adverb"),
    "not": ("不；没有", "adverb"),
    "of": ("……的；属于；关于", "preposition"),
    "off": ("离开；关闭；脱离", "adverb / preposition"),
    "on": ("在……上；关于；继续", "preposition / adverb"),
    "or": ("或者；否则", "conjunction"),
    "our": ("我们的", "possessive determiner"),
    "out": ("出去；在外；出局", "adverb / preposition"),
    "schuyler": ("斯凯勒（姓氏；剧中家族名）", "surname"),
    "she": ("她", "pronoun"),
    "so": ("所以；如此；非常", "adverb / conjunction"),
    "some": ("一些；某个", "determiner / pronoun"),
    "something": ("某事；某物", "pronoun"),
    "that": ("那个；那件事；引导从句", "pronoun / determiner / conjunction"),
    "the": ("定冠词；这个/那个", "definite article"),
    "their": ("他们的；她们的；它们的", "possessive determiner"),
    "them": ("他们；她们；它们（宾格）", "pronoun"),
    "then": ("然后；当时", "adverb"),
    "there": ("那里；有", "adverb / pronoun"),
    "they": ("他们；她们；它们", "pronoun"),
    "theodosia": ("西奥多西亚（女子名）", "given name"),
    "this": ("这；这个", "pronoun / determiner"),
    "to": ("到；向；为了；不定式标记", "preposition / infinitive marker"),
    "up": ("向上；起来；增加", "adverb / preposition"),
    "us": ("我们（宾格）", "pronoun"),
    "was": ("be 的过去式；曾是；当时是", "past tense of be"),
    "washington": ("华盛顿（姓氏；剧中指 George Washington）", "surname/place name"),
    "we": ("我们", "pronoun"),
    "were": ("be 的过去式；曾是；当时是", "past tense of be"),
    "what": ("什么；多么", "pronoun / determiner"),
    "when": ("什么时候；当……时", "adverb / conjunction"),
    "where": ("哪里；在……的地方", "adverb / conjunction"),
    "which": ("哪一个；哪个", "pronoun / determiner"),
    "who": ("谁", "pronoun"),
    "why": ("为什么；原因", "adverb / noun"),
    "will": ("将会；愿意", "modal verb"),
    "with": ("和；带着；用", "preposition"),
    "without": ("没有；不带；在……之外", "preposition / adverb"),
    "yorktown": ("约克镇（美国地名）", "place name"),
    "you": ("你；你们", "pronoun"),
    "your": ("你的；你们的", "possessive determiner"),
    "wo": ("哇；呼喊声", "exclamation"),
    "whoa": ("哇；慢点；表示惊讶或制止", "exclamation"),
    "yo": ("哟；打招呼或说唱感叹词", "exclamation"),
    "did": ("do 的过去式；做；确实", "past tense of do"),
    "do": ("做；进行；用于疑问句、否定句或强调", "do; auxiliary verb for questions, negatives, and emphasis"),
    "does": ("do 的第三人称单数；做；用于疑问句、否定句或强调", "third-person singular of do; auxiliary verb"),
    "doing": ("正在做；进行", "present participle of do"),
    "done": ("完成；做完；do 的过去分词", "past participle of do"),
    "down": ("向下；往下；下降", "adverb / preposition"),
    "dropped": ("落下；丢下；使掉下（drop 的过去式/过去分词）", "past tense / past participle of drop"),
    "founding": ("创立的；建立的；建国的", "founding; establishing"),
    "got": ("get 的过去式/过去分词；得到；变得；必须", "past tense / past participle of get"),
    "kid": ("孩子；年轻人", "child; young person"),
    "providence": ("天意；神意；深谋远虑", "divine care; fate; foresight"),
    "self-starter": ("主动做事的人；有自驱力的人", "proactive person; self-motivated person"),
    "slave": ("奴隶；被迫苦干的人", "enslaved person"),
    "slaves": ("奴隶（复数）；被迫苦干的人", "plural of slave; enslaved people"),
    "adams": ("亚当斯（姓氏；剧中多指 John Adams）", "surname"),
}

for letter in "bcdefghjklmnopqrstuvwxyz":
    SPECIAL_GLOSSARY.setdefault(letter, (f"字母 {letter.upper()}", "letter name"))

CONTRACTIONS = {
    "ain't": "不是；没有（非正式）",
    "can't": "不能；不会",
    "couldn't": "不能；没能",
    "didn't": "没有；未曾",
    "don't": "不要；不",
    "hadn't": "没有",
    "hasn't": "没有",
    "haven't": "没有；尚未",
    "he'd": "他会；他曾",
    "he'll": "他将会",
    "he's": "他是；他已经",
    "i'd": "我会；我曾",
    "i'll": "我将会",
    "i'm": "我是",
    "i've": "我已经",
    "isn't": "不是",
    "it's": "它是；这是；它已经",
    "let's": "让我们",
    "she'll": "她将会",
    "she's": "她是；她已经",
    "that's": "那是；那已经",
    "there's": "有；那里是",
    "they'll": "他们将会",
    "they're": "他们是",
    "they've": "他们已经",
    "we'll": "我们将会",
    "we're": "我们是",
    "we've": "我们已经",
    "what'd": "什么会；什么曾",
    "what'll": "什么将会",
    "what's": "什么是；怎么了",
    "who's": "谁是；谁已经",
    "won't": "不会；不愿",
    "wouldn't": "不会；不愿",
    "you'd": "你会；你曾",
    "you'll": "你将会",
    "you're": "你是",
    "you've": "你已经",
}


def normalize_token(token: str) -> str:
    return token.lower().replace("’", "'").strip()


def extract_rows() -> list[dict[str, str]]:
    text = INPUT_JS.read_text(encoding="utf-8")
    prefix = "window.hamiltonLyricsRows = "
    if not text.startswith(prefix):
        raise ValueError(f"{INPUT_JS} does not look like generated Hamilton lyric data")
    return json.loads(text[len(prefix) :].strip().removesuffix(";"))


def load_overrides() -> dict[str, dict[str, str]]:
    raw = json.loads(OVERRIDES_JSON.read_text(encoding="utf-8"))
    return {
        normalize_token(key): {
            "meaning": value["meaning"],
            "en": value.get("en", "Hamilton lyric usage"),
        }
        for key, value in raw.items()
    }


def load_dictionary(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(
            f"Missing {path}. Download ECDICT first, for example: "
            "curl -L https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv -o /tmp/ecdict.csv"
        )

    entries: dict[str, dict[str, str]] = {}
    with path.open(encoding="utf-8", newline="") as file:
        for row in DictReader(file):
            word = normalize_token(row.get("word", ""))
            translation = clean_translation(row.get("translation", ""))
            if word and translation:
                entries[word] = {
                    "meaning": translation,
                    "en": clean_definition(row.get("definition", ""), word) or "ECDICT",
                }
    return entries


def clean_translation(value: str | None) -> str:
    lines = []
    for raw in (value or "").replace("\\r", "").replace("\\n", "\n").replace("\r", "").splitlines():
        line = clean_domain_noise(raw.strip())
        if not line or line.startswith("[网络]"):
            continue
        line = re.sub(r"\s+", " ", line)
        lines.append(line)
        if len(lines) >= 2:
            break
    return "；".join(lines)


def clean_domain_noise(value: str) -> str:
    parts = []
    for part in re.split(r"[；;]\s*", value):
        if re.match(r"^\s*\[(?:计|医|化|经|法)\]", part):
            continue
        clean = DOMAIN_LABEL_RE.sub("", part).strip(" ,，；;")
        if clean:
            parts.append(clean)
    return "；".join(parts)


def clean_definition(value: str | None, key: str) -> str:
    lines = []
    for raw in (value or "").replace("\\n", "\n").splitlines():
        line = raw.strip()
        if line and is_useful_definition_line(key, line):
            lines.append(line)
        if len(lines) >= 2:
            break
    return "; ".join(lines)


def is_useful_definition_line(key: str, line: str) -> bool:
    if "(computer science)" in line.lower():
        return False
    if len(key) <= 3 and re.search(
        r"blood group|radioactive|transuranic|arsenic|samoa|square meters|hospital|programing language|letter of the roman alphabet",
        line,
        flags=re.IGNORECASE,
    ):
        return False
    if re.search(r"Adam and Eve", line, flags=re.IGNORECASE):
        return False
    return True


def speak_text(token: str) -> str:
    return token.replace("’", "'")


def ipa_for_word(token: str) -> str:
    result = subprocess.run(
        ["espeak-ng", "-q", "--ipa=3", "-v", "en-us", speak_text(token)],
        check=True,
        capture_output=True,
        text=True,
    )
    ipa = result.stdout.strip().replace("\u200d", "")
    return f"/{ipa}/" if ipa else ""


def dictionary_candidates(key: str, prefer_restored_ing: bool = False) -> list[str]:
    candidates = [f"{key}g", key] if prefer_restored_ing else [key]
    if key.endswith("in") and len(key) > 4:
        candidates.append(f"{key}g")
    if key.endswith("in'") and len(key) > 5:
        candidates.append(f"{key[:-1]}g")
    if key.endswith("'s") and len(key) > 3:
        candidates.append(key[:-2])
    if key.endswith("s") and len(key) > 3:
        candidates.append(key[:-1])
    if key.endswith("ies") and len(key) > 4:
        candidates.append(f"{key[:-3]}y")
    if key.endswith("ed") and len(key) > 4:
        candidates.extend([key[:-1], key[:-2]])
    if key.endswith("er") and len(key) > 4:
        candidates.append(key[:-2])
    return list(dict.fromkeys(candidates))


def classify_missing(key: str, token: str) -> dict[str, str] | None:
    if key in CONTRACTIONS:
        return {"meaning": CONTRACTIONS[key], "en": "English contraction"}
    if key in SPECIAL_GLOSSARY:
        meaning, en = SPECIAL_GLOSSARY[key]
        return {"meaning": meaning, "en": en}
    if re.fullmatch(r"(?:[a-z]-){2,}[a-z]", key):
        return {"meaning": f"逐字母拼写：{token}", "en": "spelled letters"}
    if re.fullmatch(r"[a-z]-(?:[a-z]+)", key):
        return {"meaning": f"歌词断词或说唱垫词：{token}", "en": "lyric syllable"}
    if re.fullmatch(r"a+h+|o+h+|u+h+|m+m+|h+a+|y+o+", key) or re.search(r"(ah|ay|oh|oo|uh|ya|yo|da|na){2,}", key):
        return {"meaning": f"拟声词或说唱垫词：{token}", "en": "vocalization"}
    return None


def priority_lookup(key: str, prefer_restored_ing: bool) -> dict[str, str] | None:
    for candidate in dictionary_candidates(key, prefer_restored_ing):
        if candidate in CONTRACTIONS:
            return {"meaning": CONTRACTIONS[candidate], "en": "English contraction"}
        if candidate in SPECIAL_GLOSSARY:
            meaning, en = SPECIAL_GLOSSARY[candidate]
            return {"meaning": meaning, "en": en}
    return None


def lookup_meaning(
    key: str,
    token: str,
    dictionary: dict[str, dict[str, str]],
    overrides: dict[str, dict[str, str]],
    prefer_restored_ing: bool,
) -> dict[str, str]:
    if key in overrides:
        return overrides[key]
    priority = priority_lookup(key, prefer_restored_ing)
    if priority:
        return priority
    for candidate in dictionary_candidates(key, prefer_restored_ing):
        if candidate in dictionary:
            return dictionary[candidate]
    fallback = classify_missing(key, token)
    if fallback:
        return fallback
    raise ValueError(
        f"No reviewed meaning for {token!r} ({key}). Add it to {OVERRIDES_JSON}; "
        "generic proper-noun and lyric-term placeholders are forbidden."
    )


def main() -> None:
    dictionary_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DICT
    dictionary = load_dictionary(dictionary_path)
    rows = extract_rows()
    overrides = load_overrides()
    dropped_g_keys = {
        normalize_token(match.group(1))
        for row in rows
        for source in (row["song_title"], row["english"])
        for match in DROPPED_G_RE.finditer(source)
    }
    original_tokens: dict[str, str] = {}
    for row in rows:
        for source in (row["song_title"], row["english"]):
            for token in TOKEN_RE.findall(source):
                key = normalize_token(token)
                original_tokens.setdefault(key, speak_text(token))

    word_entries = {}
    for key, token in sorted(original_tokens.items()):
        entry = lookup_meaning(
            key,
            token,
            dictionary,
            overrides,
            prefer_restored_ing=key in dropped_g_keys,
        )
        word_entries[key] = {
            "ipa": ipa_for_word(token),
            "meaning": entry["meaning"],
            "en": entry["en"],
            "speak": token,
        }

    payload = "window.hamiltonWordEntries = "
    payload += json.dumps(word_entries, ensure_ascii=False, separators=(",", ":"))
    payload += ";\n"
    OUTPUT_JS.write_text(payload, encoding="utf-8")
    print(f"Wrote {OUTPUT_JS} with {len(word_entries)} word entries")


if __name__ == "__main__":
    main()
