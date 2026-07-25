from __future__ import annotations

import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INPUT_CSV = ROOT / "hamilton_lyrics.csv"
OUTPUT_CSV = ROOT / "hamilton_lyrics_en_based.csv"


def key(text: str) -> str:
    text = text.lower().strip()
    text = text.replace("’", "'").replace("“", '"').replace("”", '"')
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([?!,.;:)])", r"\1", text)
    text = re.sub(r"([(])\s+", r"\1", text)
    return text


TRANSLATION_OVERRIDES = {
    "advice": "建议",
    "hamilton: ha": "汉密尔顿：哈",
    "burr: good luck with that you're takin' a stand": "伯尔：祝你好运，你终于表态了",
    "whoa, whoa, whoa hey!": "哇，哇，哇，嘿！",
    "work, work": "行动起来，行动起来",
    "work!": "行动起来！",
    "eliza, i'm lookin' for a mind at work (work, work)": "伊莱莎，我在寻找一个运转不停的头脑（行动起来，行动起来）",
    "and we just happen to be in the greatest city in the world": "而我们恰好身在世界上最伟大的城市",
    "(the revolution's happening in new york)": "（革命正在纽约发生）",
    "congress.\"": "国会。”",
    "da da da dat da dat da da da da ya da": "哒哒哒哒，哒哒哒，哒哒呀哒",
    "da da dat dat da ya da": "哒哒哒哒哒呀哒",
    "da da dat da da": "哒哒哒哒哒",
    "embellishin ' my elegance and eloquence": "修饰我的风度与雄辩",
    "let 's take a stand with the stamina god has granted us": "让我们凭上帝赐予的毅力挺身而出",
    "yo, let 's steal their cannons": "哟，我们去偷他们的大炮",
    "goes the cannon, watch the blood and the shit spray": "炮声一响，看鲜血与污秽四溅",
    "goes the cannon, we 're abandonin ' kips bay": "炮声一响，我们就撤出基普斯湾",
    "washington: close the door on your way out.": "华盛顿：出去时把门关上。",
    "washington: don 't get me wrong.": "华盛顿：别误会我的意思。",
    "boom!": "轰！",
    "(helpless)": "（无法自拔）",
    "(down for the count and i 'm drownin ' in 'em)": "（我彻底沦陷，沉溺其中）",
    "(wait for it, wait for it, wait for it, wait for it)": "（等着吧，等着吧，等着吧，等着吧）",
    "i am inimitable, i am an original": "我是无可仿效的，我是独一无二的",
    "wait for it(wait for it, wait for it, wait for it...)": "等着吧（等着吧，等着吧，等着吧……）",
    "to win this.": "来赢下这一仗。",
    "hamilton/washington:": "汉密尔顿/华盛顿：",
    "lee: i'm a general. whee!": "李：我是将军。哇哈！",
    "have lafayette take the lead.": "让拉法耶特领头。",
    "lafayette: a thousand soldiers die in a hundred degree": "拉法耶特：上千士兵死在百余华氏度的酷热中",
    "frenchman": "法国人",
    "get your right hand-man back (hamilton)": "把你的左膀右臂找回来（汉密尔顿）",
    "da da da dat da": "哒哒哒哒哒",
    "you 're on your own": "你只能靠自己了",
    "why do you assume you're the smartest in the room?": "你凭什么认定自己是房间里最聪明的人？",
    "sing along in harmony": "一起和声歌唱",
    "throwing verbal rocks at these mediocrities": "用语言的石块砸向这些平庸之辈",
    "convention": "会议",
    "burr: goes and proposes his own form of government": "伯尔：他竟提出自己的一套政府形式",
    "why do you always say what you believe?": "你为什么总要把心里相信的全说出来？",
    "thomas jefferson's coming home!": "托马斯·杰斐逊要回来了！",
    "washington: young man, i'm from virginia, so watch": "华盛顿：年轻人，我来自弗吉尼亚，所以注意点",
    "hamilton: they don't have a plan. they just hate mine!": "汉密尔顿：他们没有方案，只是讨厌我的方案！",
    "un, deux, trois, quatre, cinq, six, sept, huit, neuf": "一、二、三、四、五、六、七、八、九",
    "sept, huit, neuf": "七、八、九",
    "then her mouth is on mine and i don't say": "接着她吻上我，而我没有说",
    "(no! no!say no to this)": "（不！不！对这事说不）",
    "there is nowhere i can go (go, go, go)": "我无处可逃（走，走，走）",
    "when her body's on mine i do not say": "当她贴近我时，我没有说",
    "(no! say no to this)yes": "（不！对这事说不）是的",
    "(no!) yes": "（不！）是的",
    "mercer?": "默瑟？",
    "no one else was in the room where it happened": "没有别人身在那间事发的房间",
    "the room where it happened": "那间事发的房间",
    "a quid pro quo": "一场交换条件的交易",
    "god help and forgive me": "愿上帝帮助并宽恕我",
    "were needy": "都需要帮助",
    "washington: we're too fragile to start another fight": "华盛顿：我们太脆弱，承受不起另一场争斗",
    "in which i promise myself to realize the sweet enjoyment": "在信中，我答应自己去体会那甜美的享受",
    "madison: gentlemen, let's go": "麦迪逊：先生们，我们走吧",
    "i would always change the line": "我总会改掉那一句",
    "it might be nice": "那也许不错",
    "to get hamilton on your side": "把汉密尔顿拉到你这边",
    "well, i'll be damned": "好吧，真让我吃惊",
    "thank him for the endorsement.": "感谢他的背书。",
    "the room where it happens": "那间事发的房间",
    "the world was wide enough": "世界本足够辽阔",
    "can i show you what i'm proudest of?": "我能给你看看我最骄傲的事吗？",
    "(the orphanage)": "（孤儿院）",
    "ha": "哈",
}

TARGETED_FIXES = {
    "you're for HAMILTON: You can't be serious": "你的立场是什么？汉密尔顿：你不会是认真的吧",
    "BURR: You wanna get ahead?": "伯尔：你想出人头地吗？",
    "HAMILTON: Yes": "汉密尔顿：想",
    "BURR: Fools who run their mouths off wind up dead": "伯尔：口无遮拦的傻瓜最后都会丧命",
    "stall for?": "还在等什么？",
    "HAMILTON: If you stand for nothing, Burr, what'll you fall for? LAURENS: Ooh, Who are you?": "汉密尔顿：如果你毫无立场，伯尔，你又会为什么倒下？劳伦斯：噢，你是谁？",
    "MULLIGAN: Who are you?": "马利根：你是谁？",
    "LAFAYETTE: Who are you?": "拉法耶特：你是谁？",
    "MULLIGAN/LAFAYETTE/LAURENS: Ooh, who is this kid? What's he gonna do?": "马利根/拉法耶特/劳伦斯：噢，这小子是谁？他要做什么？",
    "President Jefferson.": "杰斐逊总统。",
    "President Madison.": "麦迪逊总统。",
}

ROW_FIXES = {
    ("7", "31"): "永永远远，永永远远。你会像从前一样回来；我会奋战并赢下战争，为了你的爱，为了你的称颂，我会爱你直到生命尽头",
    ("7", "32"): "你离开后，我会发疯",
    ("7", "33"): "所以别丢掉我们曾拥有的一切；因为到最后关头",
    ("7", "34"): "我会杀掉你的朋友和家人",
    ("7", "35"): "让你记起我的爱",
    ("7", "39"): "哒哒哒——大家一起！",
    ("7", "42"): "哒哒哒哒，哒哒哒，哒哒呀哒，哒哒哒——哒哒哒呀哒",
    ("28", "26"): "汉密尔顿：决策正在晚餐桌上发生",
    ("28", "77"): "麦迪逊：你不想离家近一点工作吗？",
    ("28", "110"): "我想建立某种比我活得更久的东西",
    ("28", "111"): "你想要什么，伯尔？",
    ("28", "112"): "你想要什么，伯尔？",
    ("28", "125"): "我必须置身其中，我必须置身那间房间，那间宽大的房间。妥协的艺术",
    ("28", "126"): "捏住鼻子，闭上眼睛",
    ("28", "127"): "我们希望领袖拯救局面",
    ("28", "128"): "可他们拿什么去交易，我们无权置喙",
    ("28", "129"): "我们梦想一个全新的开始",
    ("28", "130"): "但大多数时候，我们只是在黑暗中做梦",
    ("28", "131"): "事发的房间里，黑得像坟墓",
    ("28", "132"): "我必须置身那间房间（那间事发的房间）",
    ("28", "133"): "我必须在场（那间事发的房间）",
    ("28", "134"): "我必须，我必须置身那间房间（那间事发的房间）",
    ("28", "135"): "我必须，我必须在场（那间事发的房间）",
    ("28", "136"): "我想置身那间房间——咔哒，轰",
    ("46", "1"): "让我告诉你，我多希望年轻时就懂得这一点",
    ("46", "2"): "当我年轻、梦想荣耀时",
    ("46", "6"): "这一点我承认，他的金融体系是天才之作",
    ("46", "7"): "就算我想推翻它，也做不到",
    ("46", "8"): "而我确实试过",
    ("46", "12"): "我不愿承认，但他得到的赞誉还不够",
    ("46", "13"): "远不及他给我们的信用与功劳",
    ("46", "27"): "我采访每一位曾与你并肩作战的士兵",
    ("46", "28"): "（她讲述我们的故事）",
    ("46", "37"): "我问自己：“如果你还有更多时间，你会做什么？”",
    ("46", "38"): "仁慈的主",
    ("46", "41"): "我在华盛顿特区为华盛顿纪念碑筹款",
    ("46", "42"): "（她讲述我的故事）",
    ("46", "45"): "当我的时间走到尽头，我做得够多了吗？",
    ("46", "49"): "我在纽约市创办了第一所私立孤儿院",
    ("46", "51"): "我帮助抚养了数百名孩子",
    ("46", "52"): "我得以看着他们长大",
    ("46", "55"): "每一次我都看见你",
    ("46", "56"): "当我的时间走到尽头，我做得够多了吗？",
}


def translate(row: dict[str, str]) -> str:
    english = row["english"].strip()
    row_key = (row["song_order"], row["line_index"])
    if row_key in ROW_FIXES:
        return ROW_FIXES[row_key]

    if english in TARGETED_FIXES:
        return TARGETED_FIXES[english]

    normalized = key(english)
    if normalized in TRANSLATION_OVERRIDES:
        return TRANSLATION_OVERRIDES[normalized]

    existing = row["chinese"].strip()
    if existing:
        return existing

    # Keep a readable fallback for rare stage sounds or names that appear after future re-extraction.
    if re.fullmatch(r"[()A-Za-z .,'!-]+", english):
        return english
    return "待校对"


def main() -> None:
    with INPUT_CSV.open(encoding="utf-8-sig", newline="") as file:
        rows = list(csv.DictReader(file))

    output_rows = []
    for row in rows:
        output_rows.append(
            {
                "song_order": row["song_order"],
                "song_title": row["song_title"],
                "line_index": row["line_index"],
                "page": row["page"],
                "english": row["english"].strip(),
                "chinese_translation": translate(row),
                "source_chinese": row["chinese"].strip(),
                "source_file": row["source_file"],
            }
        )

    with OUTPUT_CSV.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=[
                "song_order",
                "song_title",
                "line_index",
                "page",
                "english",
                "chinese_translation",
                "source_chinese",
                "source_file",
            ],
        )
        writer.writeheader()
        writer.writerows(output_rows)

    blanks = [row for row in output_rows if not row["chinese_translation"]]
    pending = [row for row in output_rows if row["chinese_translation"] == "待校对"]
    print(f"Wrote {OUTPUT_CSV} with {len(output_rows)} rows")
    print(f"blank translations: {len(blanks)}")
    print(f"pending translations: {len(pending)}")


if __name__ == "__main__":
    main()
