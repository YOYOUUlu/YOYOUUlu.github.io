from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_MD = ROOT.parent.parent / "lyrics" / "Hamilton (Original Broadway Cast Recording) (3367211).md"
OUTPUT_JS = ROOT / "lyrics-data.js"

SONG_HEADING_RE = re.compile(r"^##\s+(\d+)\.\s+(.+?)\s*$")
TABLE_ROW_RE = re.compile(r"^\|(.+)\|\s*$")


def split_markdown_row(line: str) -> list[str]:
    match = TABLE_ROW_RE.match(line)
    if not match:
        return []

    cells: list[str] = []
    current: list[str] = []
    escaped = False
    for char in match.group(1):
        if escaped:
            current.append(char)
            escaped = False
            continue
        if char == "\\":
            escaped = True
            continue
        if char == "|":
            cells.append("".join(current).strip())
            current = []
            continue
        current.append(char)

    cells.append("".join(current).strip())
    return cells


def is_separator_row(cells: list[str]) -> bool:
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in cells)


def slugify(value: str) -> str:
    value = value.lower().replace("#", "number")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "song"


def parse_rows(markdown: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    current_order = ""
    current_title = ""
    current_zh_title = ""
    headers: list[str] = []

    for raw_line in markdown.splitlines():
        line = raw_line.strip()
        heading = SONG_HEADING_RE.match(line)
        if heading:
            current_order, current_title = heading.groups()
            current_zh_title = ""
            headers = []
            continue

        if line.startswith("中文歌名："):
            current_zh_title = line.removeprefix("中文歌名：").strip()
            if current_zh_title == "未提供":
                current_zh_title = ""
            continue

        cells = split_markdown_row(line)
        if not cells or is_separator_row(cells):
            continue

        if cells[:5] == ["行号", "英文歌词（校订）", "英文音标（IPA）", "中文翻译（校订）", "备注"]:
            headers = cells
            continue

        if len(cells) < 5 or not headers or not current_order or not current_title:
            continue

        line_index, english, ipa, chinese, note = cells[:5]
        if not line_index.isdigit() or not english:
            continue

        rows.append(
            {
                "song_order": str(int(current_order)),
                "song_title": current_title,
                "song_title_zh": current_zh_title,
                "song_id": slugify(f"{int(current_order):02d}-{current_title}"),
                "line_index": str(int(line_index)),
                "english": english,
                "ipa": ipa,
                "chinese_translation": chinese,
                "note": note,
                "source_file": SOURCE_MD.name,
            }
        )

    return rows


def main() -> None:
    markdown = SOURCE_MD.read_text(encoding="utf-8")
    rows = parse_rows(markdown)
    song_count = len({row["song_order"] for row in rows})

    payload = "window.hamiltonLyricsRows = "
    payload += json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    payload += ";\n"
    OUTPUT_JS.write_text(payload, encoding="utf-8")

    print(f"Wrote {OUTPUT_JS} with {len(rows)} rows from {song_count} songs")


if __name__ == "__main__":
    main()
