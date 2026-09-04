#!/usr/bin/env python3
"""Targeted static analyzer for a cached Tuya/Thing device panel.

The INKBIRD APK is commonly only a Tuya/Thing application shell. Product UI
and product-specific DP encoders may be downloaded at runtime as a panel,
mini-app, React Native bundle or compressed web package. This tool accepts a
single captured file or a directory/ZIP of app cache and:

- recursively expands safe ZIP/TAR/GZIP/XZ/BZ2 wrappers;
- inventories JavaScript, JSON, source maps, text, Hermes and native payloads;
- finds exact HO-SC-8W/IIC-800 DP names and product identifiers;
- retains short contexts around publishDps/setDps/device-control calls;
- detects constants 38, 44, 45 and 101..109 near byte/hex encoders;
- writes a compact evidence report without copying the full proprietary panel.

No network access and no device command are performed.
"""

from __future__ import annotations

import argparse
import bz2
import gzip
import hashlib
import json
import lzma
import os
import re
import shutil
import subprocess
import tarfile
import tempfile
import zipfile
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Iterator


EXACT_TERMS = (
    "h71ip90tp4mfd6mx",
    "IIC-800",
    "IIC_800",
    "IIC800",
    "HO-SC-8W",
    "HO_SC_8W",
    "normal_time",
    "irrigation_mode",
    "irrigation_time_all",
    "operation_mode",
    "RainSen_TotalONOFF",
    "SeaAdjValue",
    "Merge_History",
    "ResetDevice",
    "timeerror_alarm",
    "zonerun_state",
    "pendingzone_state",
    "cancel_timealarm_voice",
)
PUBLISH_TERMS = (
    "publishDps",
    "publishDp",
    "publishCommands",
    "publishDeviceData",
    "setDps",
    "setDp",
    "sendDps",
    "sendDp",
    "controlDevice",
    "deviceControl",
    "putDeviceData",
    "TYDevice",
    "ThingDevice",
    "TuyaDevice",
)
ENCODER_TERMS = (
    "Uint8Array",
    "DataView",
    "ArrayBuffer",
    "Buffer.from",
    "writeUInt16BE",
    "setUint16",
    "toString(16)",
    "parseInt",
    "base64",
    "Base64",
    "bytesToHex",
    "hexToBytes",
    "byteToHex",
    "stringToHex",
    "padStart",
    "charCodeAt",
)
DOMAIN_TERMS = (
    "irrigation",
    "watering",
    "sprinkler",
    "seasonal",
    "rain sensor",
    "station",
    "zone run",
    "pending zone",
)
DP_NUMBERS = (38, 44, 45, 101, 102, 103, 104, 105, 106, 107, 108, 109)
ALL_TERMS = EXACT_TERMS + PUBLISH_TERMS + ENCODER_TERMS + DOMAIN_TERMS
TERM_RE = re.compile(
    "|".join(re.escape(term) for term in sorted(ALL_TERMS, key=len, reverse=True)),
    re.I,
)
EXACT_RE = re.compile(
    "|".join(re.escape(term) for term in sorted(EXACT_TERMS, key=len, reverse=True)),
    re.I,
)
PUBLISH_RE = re.compile(
    "|".join(re.escape(term) for term in sorted(PUBLISH_TERMS, key=len, reverse=True)),
    re.I,
)
ENCODER_RE = re.compile(
    "|".join(re.escape(term) for term in sorted(ENCODER_TERMS, key=len, reverse=True)),
    re.I,
)
DP_LITERAL_RE = re.compile(
    r"(?<!\d)(?:" + "|".join(str(dp) for dp in DP_NUMBERS) + r")(?!\d)"
)
HEX40_RE = re.compile(r"(?i)(?<![0-9a-f])[0-9a-f]{40}(?![0-9a-f])")
HEX68_RE = re.compile(r"(?i)(?<![0-9a-f])[0-9a-f]{68}(?![0-9a-f])")

TEXT_SUFFIXES = {
    ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".json", ".map",
    ".html", ".htm", ".css", ".xml", ".txt", ".properties", ".yaml",
    ".yml", ".ini", ".cfg", ".conf", ".md", ".csv", ".bundle",
}
ARCHIVE_SUFFIXES = {
    ".zip", ".xapk", ".apkm", ".apks", ".jar", ".aar", ".tgz", ".tar",
    ".gz", ".xz", ".bz2",
}
MAX_FILE_SIZE = 256 * 1024 * 1024
MAX_TEXT_SIZE = 96 * 1024 * 1024
MAX_ARCHIVE_MEMBERS = 150_000
MAX_DEPTH = 7


@dataclass
class InventoryItem:
    path: str
    size: int
    sha256: str
    kind: str


@dataclass
class Evidence:
    path: str
    source: str
    offset_or_line: int
    terms: list[str]
    dp_numbers: list[int]
    has_publish: bool
    has_encoder: bool
    has_hex40: bool
    has_hex68: bool
    context: str


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def safe_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", value)[-120:]


def is_within(root: Path, target: Path) -> bool:
    root = root.resolve()
    target = target.resolve()
    return target == root or root in target.parents


def safe_extract_zip(source: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(source) as archive:
        members = archive.infolist()
        if len(members) > MAX_ARCHIVE_MEMBERS:
            raise RuntimeError(f"ZIP has too many members: {len(members)}")
        for member in members:
            target = destination / member.filename
            if not is_within(destination, target):
                raise RuntimeError(f"Unsafe ZIP member: {member.filename}")
        archive.extractall(destination)


def safe_extract_tar(source: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    with tarfile.open(source, "r:*") as archive:
        members = archive.getmembers()
        if len(members) > MAX_ARCHIVE_MEMBERS:
            raise RuntimeError(f"TAR has too many members: {len(members)}")
        for member in members:
            target = destination / member.name
            if not is_within(destination, target):
                raise RuntimeError(f"Unsafe TAR member: {member.name}")
        archive.extractall(destination, filter="data")


def decompress_single(source: Path, destination: Path) -> Path:
    suffix = source.suffix.lower()
    output = destination / source.stem
    if suffix == ".gz":
        opener = gzip.open
    elif suffix == ".xz":
        opener = lzma.open
    elif suffix == ".bz2":
        opener = bz2.open
    else:
        raise ValueError(suffix)
    destination.mkdir(parents=True, exist_ok=True)
    with opener(source, "rb") as src, output.open("wb") as dst:
        shutil.copyfileobj(src, dst)
    return output


def looks_like_zip(path: Path) -> bool:
    try:
        return zipfile.is_zipfile(path)
    except OSError:
        return False


def looks_like_tar(path: Path) -> bool:
    try:
        return tarfile.is_tarfile(path)
    except OSError:
        return False


def copy_input(source: Path, root: Path) -> Path:
    destination = root / "input"
    if source.is_dir():
        shutil.copytree(source, destination, symlinks=False)
    else:
        destination.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination / source.name)
    return destination


def recursively_expand(root: Path) -> list[Path]:
    expanded: list[Path] = []
    seen: set[str] = set()
    queue: list[tuple[Path, int]] = [
        (path, 0) for path in root.rglob("*") if path.is_file()
    ]
    sequence = 0
    while queue:
        source, depth = queue.pop(0)
        if depth >= MAX_DEPTH or not source.exists() or not source.is_file():
            continue
        if source.stat().st_size > MAX_FILE_SIZE:
            continue
        try:
            digest = sha256_file(source)
        except OSError:
            continue
        if digest in seen:
            continue
        seen.add(digest)

        output = root / "expanded" / f"{sequence:05d}_{safe_name(source.name)}"
        sequence += 1
        produced: list[Path] = []
        try:
            if looks_like_zip(source):
                safe_extract_zip(source, output)
                produced = [p for p in output.rglob("*") if p.is_file()]
            elif looks_like_tar(source):
                safe_extract_tar(source, output)
                produced = [p for p in output.rglob("*") if p.is_file()]
            elif source.suffix.lower() in {".gz", ".xz", ".bz2"}:
                produced = [decompress_single(source, output)]
            else:
                continue
        except (OSError, ValueError, zipfile.BadZipFile, tarfile.TarError, EOFError):
            continue

        if produced:
            expanded.append(output)
            for child in produced:
                if child.stat().st_size <= MAX_FILE_SIZE:
                    queue.append((child, depth + 1))
    return expanded


def classify_file(path: Path) -> str:
    suffix = path.suffix.lower()
    name = path.name.lower()
    if suffix in TEXT_SUFFIXES:
        return "text"
    if suffix == ".hbc" or "hermes" in name:
        return "hermes"
    if suffix == ".so":
        return "native"
    if suffix in ARCHIVE_SUFFIXES or looks_like_zip(path) or looks_like_tar(path):
        return "archive"
    try:
        head = path.read_bytes()[:64]
    except OSError:
        return "binary"
    if head.startswith(b"HBC") or b"Hermes" in head:
        return "hermes"
    if head.lstrip().startswith((b"{", b"[", b"<!DOCTYPE", b"<html", b"function", b"var ", b"const ", b"let ")):
        return "text"
    return "binary"


def decode_text_candidates(data: bytes) -> list[tuple[str, str]]:
    candidates: list[tuple[str, str]] = []
    for encoding in ("utf-8", "utf-16-le", "utf-16-be", "latin-1"):
        try:
            text = data.decode(encoding, errors="strict")
        except UnicodeDecodeError:
            continue
        printable = sum(ch.isprintable() or ch in "\r\n\t" for ch in text)
        if text and printable / len(text) >= 0.75:
            candidates.append((encoding, text))
    if not candidates:
        candidates.append(("utf-8-replace", data.decode("utf-8", errors="replace")))
    return candidates


def strings_output(path: Path) -> str:
    try:
        process = subprocess.run(
            ["strings", "-a", "-n", "4", str(path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=180,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return ""
    return process.stdout


def context_windows(text: str, radius: int = 900) -> Iterator[tuple[int, str]]:
    matches = list(TERM_RE.finditer(text))
    if not matches:
        # Numeric DP + encoder/publish proximity can reveal minified code with no names.
        for match in DP_LITERAL_RE.finditer(text):
            start = max(0, match.start() - radius)
            end = min(len(text), match.end() + radius)
            window = text[start:end]
            if PUBLISH_RE.search(window) or ENCODER_RE.search(window) or HEX40_RE.search(window) or HEX68_RE.search(window):
                yield match.start(), window
        return

    merged: list[tuple[int, int]] = []
    for match in matches:
        start = max(0, match.start() - radius)
        end = min(len(text), match.end() + radius)
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    for start, end in merged:
        yield start, text[start:end]


def line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def compact_context(value: str, limit: int = 6000) -> str:
    value = value.replace("\x00", "")
    if len(value) > limit:
        value = value[: limit // 2] + "\n…<cut>…\n" + value[-limit // 2 :]
    return value


def analyze_text(path: Path, relative: str, source: str, text: str) -> list[Evidence]:
    evidence: list[Evidence] = []
    for offset, window in context_windows(text):
        terms = sorted({m.group(0) for m in TERM_RE.finditer(window)}, key=str.lower)
        dps = sorted({int(value) for value in DP_LITERAL_RE.findall(window)})
        evidence.append(
            Evidence(
                path=relative,
                source=source,
                offset_or_line=line_number(text, offset),
                terms=terms,
                dp_numbers=dps,
                has_publish=bool(PUBLISH_RE.search(window)),
                has_encoder=bool(ENCODER_RE.search(window)),
                has_hex40=bool(HEX40_RE.search(window)),
                has_hex68=bool(HEX68_RE.search(window)),
                context=compact_context(window),
            )
        )
    return evidence


def analyze_file(path: Path, root: Path, kind: str) -> list[Evidence]:
    relative = str(path.relative_to(root))
    if kind == "text" and path.stat().st_size <= MAX_TEXT_SIZE:
        data = path.read_bytes()
        result: list[Evidence] = []
        for encoding, text in decode_text_candidates(data):
            result.extend(analyze_text(path, relative, f"text:{encoding}", text))
        return result

    if kind in {"binary", "native", "hermes"}:
        text = strings_output(path)
        return analyze_text(path, relative, f"strings:{kind}", text)
    return []


def evidence_score(item: Evidence) -> tuple[int, int, int, int, int]:
    exact = sum(1 for term in item.terms if EXACT_RE.fullmatch(term))
    return (
        exact,
        int(item.has_publish and item.has_encoder),
        int(item.has_publish),
        int(item.has_encoder),
        len(item.dp_numbers),
    )


def write_contexts(items: list[Evidence], destination: Path) -> None:
    with destination.open("w", encoding="utf-8") as handle:
        for index, item in enumerate(items, 1):
            handle.write(
                f"===== {index}: {item.path}:{item.offset_or_line} "
                f"source={item.source}; terms={item.terms}; dps={item.dp_numbers}; "
                f"publish={item.has_publish}; encoder={item.has_encoder}; "
                f"hex40={item.has_hex40}; hex68={item.has_hex68} =====\n"
            )
            handle.write(item.context)
            handle.write("\n\n")


def markdown_escape(value: object) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def build_report(
    source: Path,
    expanded: list[Path],
    inventory: list[InventoryItem],
    evidence: list[Evidence],
) -> str:
    ordered = sorted(evidence, key=evidence_score, reverse=True)
    exact_items = [item for item in ordered if any(EXACT_RE.fullmatch(term) for term in item.terms)]
    publish_items = [item for item in ordered if item.has_publish]
    encoder_items = [item for item in ordered if item.has_encoder]
    combined_items = [item for item in ordered if item.has_publish and item.has_encoder]
    dp_counts: Counter[int] = Counter(dp for item in evidence for dp in item.dp_numbers)
    term_counts: Counter[str] = Counter(term.lower() for item in evidence for term in item.terms)

    exact_names = sorted(
        {
            term
            for item in exact_items
            for term in item.terms
            if EXACT_RE.fullmatch(term)
        },
        key=str.lower,
    )
    likely_files = []
    seen_files: set[str] = set()
    for item in ordered:
        if item.path in seen_files:
            continue
        if evidence_score(item)[:4] > (0, 0, 0, 0):
            seen_files.add(item.path)
            likely_files.append(item.path)

    lines = [
        "# HO-SC-8W / IIC-800 cached Tuya panel analysis",
        "",
        f"Source: `{markdown_escape(source)}`",
        "",
        "## Inventory",
        "",
        f"- Files inspected: **{len(inventory)}**",
        f"- Expanded archive layers: **{len(expanded)}**",
        f"- Evidence windows retained: **{len(evidence)}**",
        f"- Exact product/DP windows: **{len(exact_items)}**",
        f"- Publish-call windows: **{len(publish_items)}**",
        f"- Encoder windows: **{len(encoder_items)}**",
        f"- Publish + encoder in one window: **{len(combined_items)}**",
        "",
        "## Exact identifiers found",
        "",
    ]
    if exact_names:
        for name in exact_names:
            lines.append(f"- `{name}`")
    else:
        lines.append("- No exact HO-SC-8W/IIC-800 identifier or known DP code name was found.")

    lines += [
        "",
        "## Candidate panel/encoder files",
        "",
    ]
    if likely_files:
        for path in likely_files[:100]:
            lines.append(f"- `{markdown_escape(path)}`")
    else:
        lines.append("- None identified.")

    lines += [
        "",
        "## DP numeric literal proximity",
        "",
        "| DP | retained windows |",
        "|---:|---:|",
    ]
    for dp in DP_NUMBERS:
        lines.append(f"| {dp} | {dp_counts[dp]} |")

    lines += [
        "",
        "## Highest-value contexts",
        "",
        "| file:line | exact/publish/encoder | DP literals | terms |",
        "|---|---|---|---|",
    ]
    for item in ordered[:100]:
        markers = "/".join(
            marker
            for marker, active in (
                ("exact", any(EXACT_RE.fullmatch(term) for term in item.terms)),
                ("publish", item.has_publish),
                ("encoder", item.has_encoder),
                ("hex40", item.has_hex40),
                ("hex68", item.has_hex68),
            )
            if active
        ) or "context"
        lines.append(
            f"| `{markdown_escape(item.path)}:{item.offset_or_line}` | {markers} | "
            f"{', '.join(map(str, item.dp_numbers)) or '—'} | "
            f"{', '.join(f'`{markdown_escape(term)}`' for term in item.terms[:15]) or '—'} |"
        )

    lines += [
        "",
        "## Interpretation rules",
        "",
        "1. An exact DP name alone proves only that the panel knows the schema.",
        "2. The useful command path is an exact DP name or DP literal in the same function/window as a publish call.",
        "3. DP38 is confirmed only when the path shows a 20-byte/40-HEX encoder and the read/write selector transformation.",
        "4. DP45 is confirmed only when the path shows a 34-byte/68-HEX or equivalent raw/base64 encoder.",
        "5. Minified or Hermes bytecode may require a dedicated Hermes disassembler after this first-pass inventory.",
        "",
        "Full retained excerpts are in `panel-contexts.txt`; the complete captured panel is not copied into the report.",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="Captured panel file, cache directory or ZIP")
    parser.add_argument("--output-dir", type=Path, default=Path("panel-analysis-output"))
    parser.add_argument("--work-dir", type=Path)
    args = parser.parse_args()

    source = args.source.expanduser().resolve()
    if not source.exists():
        raise SystemExit(f"Source not found: {source}")
    output = args.output_dir.expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)

    temp_owner = None
    if args.work_dir:
        work = args.work_dir.expanduser().resolve()
        work.mkdir(parents=True, exist_ok=True)
    else:
        temp_owner = tempfile.TemporaryDirectory(prefix="tuya-irrigation-panel-")
        work = Path(temp_owner.name)

    captured_root = copy_input(source, work / "capture")
    expanded = recursively_expand(captured_root)

    inventory: list[InventoryItem] = []
    evidence: list[Evidence] = []
    seen_paths: set[Path] = set()
    for path in captured_root.rglob("*"):
        if not path.is_file() or path.is_symlink():
            continue
        resolved = path.resolve()
        if resolved in seen_paths:
            continue
        seen_paths.add(resolved)
        try:
            size = path.stat().st_size
            if size > MAX_FILE_SIZE:
                continue
            kind = classify_file(path)
            inventory.append(
                InventoryItem(
                    path=str(path.relative_to(captured_root)),
                    size=size,
                    sha256=sha256_file(path),
                    kind=kind,
                )
            )
            evidence.extend(analyze_file(path, captured_root, kind))
        except OSError:
            continue

    evidence = sorted(evidence, key=evidence_score, reverse=True)
    write_contexts(evidence, output / "panel-contexts.txt")
    (output / "panel-evidence.json").write_text(
        json.dumps([asdict(item) for item in evidence], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (output / "panel-inventory.json").write_text(
        json.dumps([asdict(item) for item in inventory], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    report = build_report(source, expanded, inventory, evidence)
    (output / "panel-report.md").write_text(report, encoding="utf-8")
    print(report)

    if temp_owner is not None:
        temp_owner.cleanup()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
