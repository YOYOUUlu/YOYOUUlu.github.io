from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path("/Users/jady/Documents/03_Areas/剧院与现场/Hamilton中英歌词")
OUTPUT = ROOT / "songs.js"


GLOSSARY = {
    "bastard": ("私生子；也可作骂人的粗话", "开场用很粗粝的身份标签，把 Hamilton 的出身压到最低。"),
    "orphan": ("孤儿", "Hamilton 幼年丧母，父亲离开，这个词直接进入他的创伤叙事。"),
    "whore": ("妓女；非常冒犯的说法", "这里是别人对他母亲的羞辱性称呼，显示阶级和名誉压力。"),
    "providence": ("天意；命运安排", "带宗教色彩，像是在说他被命运丢进历史。"),
    "impoverished": ("贫困的", "比 poor 更书面，强调长期贫穷。"),
    "squalor": ("肮脏贫困的环境", "常指贫民窟式的困顿生活。"),
    "scholar": ("学者；读书人", "和 hero 押韵，写他靠学习和写作翻身。"),
    "founding father": ("美国开国元勋", "Hamilton 是美国建国核心人物之一，十美元纸币上也印有他的肖像。"),
    "charter": ("特许状；贸易执照；章程", "殖民地贸易语境里常见，说明他很早进入商业文书世界。"),
    "slaughtered": ("被屠杀", "比 killed 更血腥，指向奴隶贸易的暴力背景。"),
    "barter": ("以物易物；讨价还价", "和 beg, steal, borrow 连用，表示为了出路什么都肯试。"),
    "hurricane": ("飓风", "Hamilton 少年时期写飓风报道，文章帮助他获得去北美大陆受教育的机会。"),
    "devastation": ("毁灭；满目疮痍", "常用于灾难之后的破坏。"),
    "refrain": ("副歌；反复句", "在音乐剧里也有元叙事意味，写作变成他进入历史的方式。"),
    "testament": ("证明；见证", "他的文字成了痛苦的证词。"),
    "insane": ("疯狂的；难以置信的", "口语里也可表示厉害得离谱。"),
    "mainland": ("大陆", "指离开加勒比海岛，前往北美大陆。"),
    "revolution": ("革命", "既是美国革命，也是人物命运的剧烈转向。"),
    "abolitionist": ("废奴主义者", "和奴隶制背景相关，是美国革命时代的重要政治议题。"),
    "redcoat": ("英国兵；红衣军", "美国独立战争中对英军士兵的称呼。"),
    "loyalist": ("效忠派", "美国革命中支持英国王室的一派。"),
    "anarchy": ("无政府状态；混乱", "政治辩论里用来指秩序崩坏。"),
    "legacy": ("遗产；身后名", "全剧反复追问人能留下什么。"),
    "duel": ("决斗", "贯穿全剧的重要命运机制。"),
    "pamphlet": ("小册子；政治传单", "18 世纪政治传播常用形式，也对应 Reynolds Pamphlet。"),
    "treasury": ("财政部；国库", "Hamilton 是美国第一任财政部长。"),
    "cabinet": ("内阁", "Cabinet Battle 把政治会议写成说唱 battle。"),
    "federalist": ("联邦党人；支持强联邦政府者", "Hamilton 是联邦党阵营的重要人物。"),
    "republican": ("共和派；共和主义者", "剧中多指 Jefferson/Madison 阵营。"),
    "immigrant": ("移民", "Hamilton 的身份关键词，也是剧中著名台词的核心。"),
    "satisfied": ("满足的；满意的", "Angelica 的核心主题词，表面是祝酒，里面是自我压抑。"),
    "helpless": ("无助的；无法自拔的", "在情歌语境里更像被爱情击中。"),
    "hurricane": ("飓风", "既是现实灾难，也是 Hamilton 内心和命运的隐喻。"),
    "room where it happens": ("事情真正发生的房间", "指政治交易发生的核心场域，也象征权力只在少数人之间流动。"),
    "obedient servant": ("忠实仆人；旧式书信用语", "Your Obedient Servant 是当时书信结尾敬语，剧中带强烈讽刺。"),
}

PHRASES = {
    "i am not throwing away my shot": "我不会白白浪费我的机会",
    "just you wait": "你等着看吧",
    "wait for it": "等着它到来",
    "look around": "看看四周",
    "rise up": "站起来",
    "stay alive": "活下去",
    "non-stop": "停不下来",
    "that would be enough": "那就已经足够",
    "who lives, who dies, who tells your story": "谁活下去，谁死去，又是谁讲述你的故事",
    "history has its eyes on you": "历史正注视着你",
    "the world turned upside down": "世界被彻底颠倒",
    "dear theodosia": "亲爱的西奥多西亚",
    "one last time": "最后一次",
    "burn": "烧掉",
}

WORD_TRANSLATIONS = {
    "i": "我",
    "me": "我",
    "it": "它",
    "you": "你",
    "he": "他",
    "she": "她",
    "we": "我们",
    "they": "他们",
    "him": "他",
    "his": "他的",
    "my": "我的",
    "your": "你的",
    "our": "我们的",
    "the": "",
    "a": "",
    "an": "",
    "and": "和",
    "or": "或",
    "but": "但",
    "not": "不",
    "don't": "不要；并不",
    "never": "绝不",
    "if": "如果",
    "when": "当",
    "so": "所以",
    "just": "只是",
    "now": "现在",
    "out": "出去",
    "as": "作为",
    "more": "更多",
    "there": "那里",
    "then": "然后",
    "well": "好吧",
    "no": "不",
    "am": "是",
    "is": "是",
    "are": "是",
    "was": "曾是",
    "were": "曾是",
    "have": "有",
    "has": "有",
    "had": "曾有",
    "do": "做",
    "can": "能够",
    "will": "将会",
    "would": "会",
    "be": "成为",
    "to": "去",
    "in": "在",
    "on": "在",
    "with": "与",
    "for": "为了",
    "from": "从",
    "of": "的",
    "all": "全部",
    "this": "这",
    "that": "那",
    "what": "什么",
    "how": "如何",
    "who": "谁",
    "where": "哪里",
    "world": "世界",
    "hamilton": "汉密尔顿",
    "burr": "伯尔",
    "jefferson": "杰斐逊",
    "madison": "麦迪逊",
    "washington": "华盛顿",
    "lafayette": "拉法耶特",
    "alexander": "亚历山大",
    "eliza": "伊莱莎",
    "angelica": "安吉莉卡",
    "new": "新的",
    "york": "纽约",
    "name": "名字",
    "time": "时间",
    "life": "人生",
    "love": "爱",
    "heart": "心",
    "war": "战争",
    "fight": "战斗",
    "write": "写下",
    "story": "故事",
    "history": "历史",
    "shot": "机会",
    "wait": "等待",
    "live": "活着",
    "die": "死去",
    "know": "知道",
    "see": "看见",
    "look": "看",
    "tell": "讲述",
    "say": "说",
    "said": "说过",
    "let": "让",
    "get": "得到",
    "take": "拿起；接受",
    "need": "需要",
    "got": "得到；有",
    "gonna": "将要",
    "go": "走",
    "come": "来",
    "back": "回来",
    "away": "远去",
    "right": "正确；右边",
    "man": "人；男人",
    "sir": "先生",
    "king": "国王",
    "father": "父亲",
    "son": "儿子",
    "daughter": "女儿",
    "country": "国家",
    "president": "总统",
    "home": "家",
    "work": "工作",
    "side": "一边；阵营",
    "down": "倒下；向下",
    "dropped": "被丢下",
    "middle": "中间",
    "forgotten": "被遗忘的",
    "spot": "角落；地点",
    "caribbean": "加勒比海",
    "grow": "成长",
    "hero": "英雄",
    "scholar": "学者",
    "without": "没有",
    "farther": "走得更远",
    "harder": "更加努力",
    "smarter": "更聪明",
    "self": "自己",
    "starter": "主动开局的人",
    "fourteen": "十四岁",
    "placed": "被安排",
    "charge": "负责",
    "trading": "贸易",
    "slaves": "奴隶",
    "guard": "防备",
    "inside": "内心",
    "longing": "渴望",
    "something": "某种东西",
    "part": "一部分",
    "around": "四周",
    "every": "每一个",
    "young": "年轻",
    "hungry": "饥渴；野心勃勃",
    "enough": "足够",
    "room": "房间",
    "happens": "发生",
    "burn": "烧掉",
    "quiet": "安静",
    "uptown": "城北住宅区",
}

MERGE_ENDINGS = {
    "a",
    "an",
    "the",
    "of",
    "to",
    "in",
    "and",
    "or",
    "for",
    "with",
    "from",
    "by",
    "across",
    "down",
}

SPEAKER_RE = re.compile(r"^([A-Z][A-Z .,'&/-]{1,40}):\s*(.+)$")
PDF_PREFIX_RE = re.compile(r"^(\d+)")


def normalize_ascii(text: str) -> str:
    return (
        text.replace("\x00", "")
        .replace("y“", '"')
        .replace("y”", '"')
        .replace("dony’t", "don't")
        .replace("’", "'")
        .replace("“", '"')
        .replace("”", '"')
        .strip()
    )


def is_english_line(line: str) -> bool:
    if not line:
        return False
    printable = sum(1 for ch in line if ch.isascii() and (ch.isprintable() or ch.isspace()))
    ratio = printable / max(len(line), 1)
    return ratio > 0.86 and bool(re.search(r"[A-Za-z]", line))


def clean_line(line: str) -> str:
    line = normalize_ascii(line)
    line = re.sub(r"\s+", " ", line)
    line = line.replace(" ,", ",").replace(" .", ".").replace(" ?", "?").replace(" !", "!")
    return line.strip()


def extract_english_lines(pdf_path: Path) -> list[str]:
    reader = PdfReader(str(pdf_path))
    raw_lines: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        raw_lines.extend(text.splitlines())

    lines: list[str] = []
    for raw in raw_lines:
        line = clean_line(raw)
        if not is_english_line(line):
            continue
        if line in {"|", "/", "†"}:
            continue
        lines.append(line)

    return merge_wrapped_lines(lines)


def merge_wrapped_lines(lines: list[str]) -> list[str]:
    merged: list[str] = []
    for line in lines:
        if not merged:
            merged.append(line)
            continue
        previous = merged[-1]
        previous_last = re.sub(r"[^A-Za-z']+", "", previous.split()[-1]).lower() if previous.split() else ""
        current_is_speaker = bool(SPEAKER_RE.match(line))
        previous_is_title = len(merged) == 1
        if (
            not previous_is_title
            and not current_is_speaker
            and previous_last in MERGE_ENDINGS
        ):
            merged[-1] = f"{previous} {line}"
        else:
            merged.append(line)
    return merged


def title_from_path(pdf_path: Path, fallback: str) -> tuple[int, str]:
    match = PDF_PREFIX_RE.match(pdf_path.name)
    order = int(match.group(1)) if match else 999
    title = fallback or pdf_path.stem
    title = re.sub(r"^\d+", "", title).strip()
    title = re.sub(r"\s+", " ", title)
    return order, title


def slugify(value: str) -> str:
    value = value.lower().replace("#", "number")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "song"


def rough_translate(line: str) -> str:
    speaker_match = SPEAKER_RE.match(line)
    prefix = ""
    body = line
    if speaker_match:
        prefix = speaker_match.group(1).title().replace("And", "and") + "："
        body = speaker_match.group(2)

    normalized = re.sub(r"[^a-z0-9']+", " ", body.lower()).strip()
    for phrase, zh in PHRASES.items():
        if phrase in normalized:
            return prefix + zh

    words = re.findall(r"[A-Za-z']+", body.lower())
    translated: list[str] = []
    for term, (meaning, _) in sorted(GLOSSARY.items(), key=lambda item: len(item[0]), reverse=True):
        if re.search(rf"\b{re.escape(term.lower())}\b", normalized):
            translated.append(meaning.split("；", 1)[0])

    translated.extend(WORD_TRANSLATIONS[word] for word in words if word in WORD_TRANSLATIONS and WORD_TRANSLATIONS[word])
    if translated:
        return prefix + " ".join(dict.fromkeys(translated[:16]))
    return prefix + "中文意译初稿待补"


def words_for_line(line: str, used_terms: set[str]) -> list[dict[str, str]]:
    normalized = re.sub(r"[^a-z0-9 ]+", " ", line.lower())
    words: list[dict[str, str]] = []
    for term, (meaning, note) in sorted(GLOSSARY.items(), key=lambda item: len(item[0]), reverse=True):
        key = term.lower()
        if key in used_terms:
            continue
        if re.search(rf"\b{re.escape(key)}\b", normalized):
            entry = {"term": term, "meaning": meaning}
            if note:
                entry["note"] = note
            words.append(entry)
            used_terms.add(key)
    return words


def build_song(pdf_path: Path) -> dict:
    lines = extract_english_lines(pdf_path)
    title_line = lines[0] if lines else pdf_path.stem
    order, title = title_from_path(pdf_path, title_line)
    lyric_lines = lines[1:] if lines and lines[0].lower() == title.lower() else lines
    used_terms: set[str] = set()
    song_id = slugify(f"{order:02d}-{title}")

    return {
        "id": song_id,
        "order": order,
        "title": title,
        "musical": "Hamilton",
        "lines": [
            {
                "id": f"ham-{order:02d}-{index:03d}",
                "en": line,
                "zh": rough_translate(line),
                "analysis": {"words": words_for_line(line, used_terms)},
            }
            for index, line in enumerate(lyric_lines, start=1)
        ],
    }


def main() -> None:
    songs = [build_song(path) for path in sorted(SOURCE_ROOT.glob("*.pdf"))]
    songs.sort(key=lambda song: song["order"])
    payload = "const hamiltonSongs = "
    payload += json.dumps(songs, ensure_ascii=False, separators=(",", ":"))
    payload += ";\n\nwindow.hamiltonSongs = hamiltonSongs;\n"
    OUTPUT.write_text(payload, encoding="utf-8")
    print(f"Wrote {OUTPUT} with {len(songs)} songs and {sum(len(song['lines']) for song in songs)} lines")


if __name__ == "__main__":
    main()
