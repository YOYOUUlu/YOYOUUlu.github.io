from __future__ import annotations

import csv
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
SOURCE_ROOT = Path("/Users/jady/Documents/03_Areas/剧院与现场/Hamilton中英歌词")
OUTPUT_CSV = ROOT / "hamilton_lyrics.csv"
TMP_ROOT = WORKSPACE / "tmp" / "hamilton_pdf_extract"

SWIFT = Path("/usr/bin/swift")
SWIFTC = Path("/usr/bin/swiftc")

TITLE_RE = re.compile(r"^\d+\s*")
PDF_ORDER_RE = re.compile(r"^(\d+)")
HAN_RE = re.compile(r"[\u3400-\u9fff]")
ASCII_WORD_RE = re.compile(r"[A-Za-z0-9]")

WEAK_ENDINGS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "been",
    "being",
    "by",
    "for",
    "from",
    "her",
    "his",
    "in",
    "is",
    "it",
    "its",
    "my",
    "of",
    "on",
    "or",
    "our",
    "that",
    "the",
    "their",
    "this",
    "to",
    "was",
    "were",
    "with",
    "you",
    "your",
}


@dataclass
class PositionedLine:
    text: str
    mid: float


def command_env() -> dict[str, str]:
    env = os.environ.copy()
    module_cache = TMP_ROOT / "swift-module-cache"
    module_cache.mkdir(parents=True, exist_ok=True)
    env["CLANG_MODULE_CACHE_PATH"] = str(module_cache)
    return env


def run(cmd: list[str | Path], **kwargs) -> subprocess.CompletedProcess:
    return subprocess.run([str(part) for part in cmd], check=True, text=True, **kwargs)


def compile_pdfkit_reader() -> Path:
    binary = TMP_ROOT / "pdfkit_text"
    source = ROOT / "scripts" / "pdfkit_text.swift"
    if binary.exists() and binary.stat().st_mtime >= source.stat().st_mtime:
        return binary

    binary.parent.mkdir(parents=True, exist_ok=True)
    try:
        run([SWIFTC, "-O", source, "-o", binary], env=command_env(), capture_output=True)
        return binary
    except subprocess.CalledProcessError:
        return source


def read_pdf_pages(reader: Path, pdf_path: Path) -> list[dict]:
    cmd: list[str | Path]
    if reader.suffix == ".swift":
        cmd = [SWIFT, reader, pdf_path]
    else:
        cmd = [reader, pdf_path]
    result = run(cmd, env=command_env(), capture_output=True)
    return json.loads(result.stdout or "[]")


def song_order(path: Path) -> int:
    match = PDF_ORDER_RE.match(path.name)
    return int(match.group(1)) if match else 999


def song_title(path: Path) -> str:
    return TITLE_RE.sub("", path.stem).strip()


def normalize_text(text: str) -> str:
    text = text.replace("\u00a0", " ").replace("’", "'")
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("（", "(").replace("）", ")")
    text = text.replace(" ,", ",").replace(" .", ".")
    text = text.replace(" ?", "?").replace(" !", "!")
    return re.sub(r"\s+", " ", text).strip()


def normalize_chinese(text: str) -> str:
    text = text.replace("(", "（").replace(")", "）")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def is_junk_line(line: str) -> bool:
    compact = re.sub(r"\s+", "", line)
    if not compact:
        return True
    if compact in {"园园丨鼠鼠", "园园|鼠鼠", "Hamilton"}:
        return True
    if re.fullmatch(r"[丨|·•\-\d]+", compact):
        return True
    return False


def is_english_line(line: str) -> bool:
    if is_junk_line(line) or HAN_RE.search(line):
        return False
    return bool(ASCII_WORD_RE.search(line))


def is_chinese_line(line: str) -> bool:
    if is_junk_line(line):
        return False
    return bool(HAN_RE.search(line))


def split_page_lines(raw_text: str, title: str) -> tuple[list[str], list[str]]:
    raw_lines = [normalize_text(line) for line in raw_text.splitlines()]
    raw_lines = [line for line in raw_lines if not is_junk_line(line)]

    english_start = next((i for i, line in enumerate(raw_lines) if is_english_line(line)), None)
    if english_start is None:
        return [], []

    body = raw_lines[english_start:]
    if body and body[0].lower() == title.lower():
        body = body[1:]

    first_chinese = next((i for i, line in enumerate(body) if is_chinese_line(line)), None)
    if first_chinese is None:
        return [line for line in body if is_english_line(line)], []

    english = [line for line in body[:first_chinese] if is_english_line(line)]
    chinese = [normalize_chinese(line) for line in body[first_chinese:] if is_chinese_line(line)]
    return english, chinese


def line_positions(page: pdfplumber.page.Page, side: str) -> list[float]:
    rows: list[list[dict]] = []
    for char in sorted(page.chars, key=lambda item: (item["top"], item["x0"])):
        if char["top"] < 120 or char["top"] > 815:
            continue
        if not rows or abs(rows[-1][0]["top"] - char["top"]) > 3.4:
            rows.append([char])
        else:
            rows[-1].append(char)

    positions: list[float] = []
    for row in rows:
        row = sorted(row, key=lambda item: item["x0"])
        divider = page.width * 0.565
        if side == "left":
            row = [c for c in row if c["x0"] < divider]
        else:
            row = [c for c in row if c["x1"] >= divider]
        if not row:
            continue

        text = normalize_text("".join(c["text"] for c in row if c["text"] not in {"|", "丨"}))
        if side == "left" and (not is_english_line(text) or text.lower() == "hamilton"):
            continue
        if side == "right":
            compact = re.sub(r"\s+", "", text)
            if not compact or compact in {"园园", "鼠鼠", "园园丨鼠鼠"}:
                continue
        positions.append((min(c["top"] for c in row) + max(c["bottom"] for c in row)) / 2)
    return positions


def last_word(line: str) -> str:
    words = re.findall(r"[A-Za-z']+", line)
    return words[-1].lower() if words else ""


def first_word(line: str) -> str:
    words = re.findall(r"[A-Za-z']+", line)
    return words[0].lower() if words else ""


def starts_lower(line: str) -> bool:
    stripped = line.lstrip("\"'([{")
    return bool(stripped) and stripped[0].islower()


def should_merge(previous: str, current: str) -> bool:
    previous_clean = previous.rstrip()
    if not previous_clean:
        return False
    if previous_clean.endswith(("-", "—", "–")):
        return True
    if previous_clean.endswith((",", "?", "!", ".", '"', ")")):
        return False
    if last_word(previous_clean) in WEAK_ENDINGS:
        return True
    return False


def boundary_score(previous: str, current: str) -> int:
    score = 0
    if should_merge(previous, current):
        score -= 50
    if last_word(previous) in WEAK_ENDINGS:
        score -= 20
    if starts_lower(current) and not previous.rstrip().endswith((",", "?", "!", ".", '"', ")")):
        score -= 25
    if previous.rstrip().endswith((",", ";", ":")):
        score += 8
    if previous.rstrip().endswith((".", "?", "!", '"', ")")):
        score += 35
    if re.match(r"^[\"'(]?[A-Z]", current.strip()):
        score += 15
    if len(previous.split()) <= 3 and previous.rstrip().endswith((",", "?", "!")):
        score += 25
    return score


def merge_once(lines: list[str]) -> list[str]:
    if len(lines) < 2:
        return lines
    index = min(range(len(lines) - 1), key=lambda i: boundary_score(lines[i], lines[i + 1]))
    return lines[:index] + [normalize_text(f"{lines[index]} {lines[index + 1]}")] + lines[index + 2 :]


def merge_wrapped_english(lines: list[PositionedLine]) -> list[PositionedLine]:
    merged: list[PositionedLine] = []
    merged_last_line: list[bool] = []
    for line in lines:
        can_merge = bool(merged and should_merge(merged[-1].text, line.text))
        if (
            can_merge
            and merged_last_line[-1]
            and starts_lower(line.text)
            and last_word(merged[-1].text) not in WEAK_ENDINGS
        ):
            can_merge = False

        if can_merge:
            merged[-1] = PositionedLine(
                normalize_text(f"{merged[-1].text} {line.text}"),
                (merged[-1].mid + line.mid) / 2,
            )
            merged_last_line[-1] = True
        else:
            merged.append(line)
            merged_last_line.append(False)
    return merged


def merge_wrapped_english_to_count(lines: list[str], target_count: int) -> list[str]:
    positioned = [PositionedLine(text, index) for index, text in enumerate(lines)]
    merged = [line.text for line in merge_wrapped_english(positioned)]
    while target_count and len(merged) > target_count:
        merged = merge_once(merged)
    return merged


def zip_text_positions(texts: list[str], positions: list[float]) -> list[PositionedLine]:
    if not texts:
        return []
    if len(positions) < len(texts):
        positions = positions + [positions[-1] + 18 * (i + 1) for i in range(len(texts) - len(positions))] if positions else [150 + 18 * i for i in range(len(texts))]
    return [PositionedLine(text, positions[index]) for index, text in enumerate(texts)]


def pair_page(
    english: list[str],
    chinese: list[str],
    english_positions: list[float],
    chinese_positions: list[float],
) -> list[tuple[str, str]]:
    if not english:
        return []
    merged_english = merge_wrapped_english(zip_text_positions(english, english_positions))
    positioned_chinese = zip_text_positions(chinese, chinese_positions)

    zh_by_english: list[list[str]] = [[] for _ in merged_english]
    for zh in positioned_chinese:
        nearest_index = min(
            range(len(merged_english)),
            key=lambda index: abs(merged_english[index].mid - zh.mid),
        )
        previous_mid = merged_english[nearest_index - 1].mid if nearest_index > 0 else -9999
        next_mid = merged_english[nearest_index + 1].mid if nearest_index + 1 < len(merged_english) else 9999
        upper = (previous_mid + merged_english[nearest_index].mid) / 2
        lower = (merged_english[nearest_index].mid + next_mid) / 2
        if upper <= zh.mid < lower:
            zh_by_english[nearest_index].append(zh.text)
        else:
            zh_by_english[nearest_index].append(zh.text)

    pairs: list[tuple[str, str]] = []
    for index, line in enumerate(merged_english):
        pairs.append((line.text, " ".join(zh_by_english[index]).strip()))
    blank_chinese = sum(1 for _, zh in pairs if not zh)
    if blank_chinese > max(2, int(len(pairs) * 0.18)):
        sequential_english = merge_wrapped_english_to_count(english, len(chinese))
        max_len = max(len(sequential_english), len(chinese))
        return [
            (
                sequential_english[index] if index < len(sequential_english) else "",
                chinese[index] if index < len(chinese) else "",
            )
            for index in range(max_len)
            if (index < len(sequential_english) and sequential_english[index])
            or (index < len(chinese) and chinese[index])
        ]
    return pairs


def extract_pdf(pdf_path: Path, reader: Path) -> list[dict[str, str | int]]:
    rows: list[dict[str, str | int]] = []
    order = song_order(pdf_path)
    title = song_title(pdf_path)
    pages = read_pdf_pages(reader, pdf_path)
    line_index = 1

    with pdfplumber.open(pdf_path) as pdf:
        for page_payload, pdf_page in zip(pages[:-1], pdf.pages[:-1]):
            english, chinese = split_page_lines(page_payload["text"], title)
            english_positions = line_positions(pdf_page, "left")
            chinese_positions = line_positions(pdf_page, "right")
            for en, zh in pair_page(english, chinese, english_positions, chinese_positions):
                rows.append(
                    {
                        "song_order": order,
                        "song_title": title,
                        "line_index": line_index,
                        "page": page_payload["page"],
                        "english": en,
                        "chinese": zh,
                        "source_file": pdf_path.name,
                    }
                )
                line_index += 1
    return rows


def main() -> None:
    if not SOURCE_ROOT.exists():
        raise SystemExit(f"Source folder not found: {SOURCE_ROOT}")

    TMP_ROOT.mkdir(parents=True, exist_ok=True)
    reader = compile_pdfkit_reader()
    pdfs = sorted(SOURCE_ROOT.glob("*.pdf"), key=song_order)
    all_rows: list[dict[str, str | int]] = []

    for pdf_path in pdfs:
        rows = extract_pdf(pdf_path, reader)
        all_rows.extend(rows)
        print(f"{song_order(pdf_path):02d} {song_title(pdf_path)}: {len(rows)} lines")

    with OUTPUT_CSV.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=["song_order", "song_title", "line_index", "page", "english", "chinese", "source_file"],
        )
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"Wrote {OUTPUT_CSV} with {len(all_rows)} rows from {len(pdfs)} PDFs")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        sys.stderr.write(f"Command failed: {error.cmd}\n")
        if error.stdout:
            sys.stderr.write(error.stdout)
        if error.stderr:
            sys.stderr.write(error.stderr)
        raise
