#!/usr/bin/env python3
"""Extract concise protocol evidence from apkanalyzer smali output.

Complete class bytecode remains in the short-lived workflow artifact. This
script commits only line-numbered excerpts around datapoint constants, command
transport calls, byte-array construction, and protocol-facing methods.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

DP_HEX = {
    "0x26": 38,
    "0x2c": 44,
    "0x2d": 45,
    "0x65": 101,
    "0x66": 102,
    "0x67": 103,
    "0x68": 104,
    "0x69": 105,
    "0x6a": 106,
    "0x6b": 107,
    "0x6c": 108,
    "0x6d": 109,
}

STRONG_RE = re.compile(
    r"(?:\b0x(?:26|2c|2d|65|66|67|68|69|6a|6b|6c|6d)\b|"
    r"normal_time|irrigation_time_all|irrigation_mode|operation_mode|"
    r"SeaAdjValue|RainSen_TotalONOFF|zonerun_state|pendingzone_state|"
    r"publishDps|publishCommands|publishDp|sendDp|setDp|controlDevice|"
    r"IThingDevice|ITuyaDevice|ThingDevice|TuyaDevice|"
    r"new-array|fill-array-data|array-put|aput-byte|aput|"
    r"Base64|JSONObject|Gson|toHex|hexString)",
    re.I,
)

METHOD_NAME_RE = re.compile(
    r"(?:manual|plan|sea|irrig|water|schedule|normal|zone|duration|"
    r"start|stop|copy|change|mode|publish|send|command|dp)",
    re.I,
)

METHOD_HEADER_RE = re.compile(r"^\.method\b.*?\s(?P<name>[\w$<>-]+)\(")


@dataclass
class MethodEvidence:
    class_name: str
    source_file: str
    method_header: str
    method_name: str
    start_line: int
    end_line: int
    dp_constants: list[int]
    strong_hit_lines: list[int]
    reasons: list[str]
    excerpts: list[str]


@dataclass
class ClassInventory:
    class_name: str
    source_file: str
    sha256: str
    line_count: int
    method_count: int
    protocol_method_count: int


def parse_methods(lines: list[str]) -> list[tuple[int, int, str, str]]:
    methods: list[tuple[int, int, str, str]] = []
    index = 0
    while index < len(lines):
        match = METHOD_HEADER_RE.match(lines[index].strip())
        if not match:
            index += 1
            continue
        start = index
        header = lines[index].strip()
        name = match.group("name")
        index += 1
        while index < len(lines) and lines[index].strip() != ".end method":
            index += 1
        end = min(index, len(lines) - 1)
        methods.append((start, end, header, name))
        index += 1
    return methods


def merge_ranges(ranges: list[tuple[int, int]], lower: int, upper: int) -> list[tuple[int, int]]:
    normalized = sorted((max(lower, a), min(upper, b)) for a, b in ranges)
    merged: list[tuple[int, int]] = []
    for start, end in normalized:
        if not merged or start > merged[-1][1] + 2:
            merged.append((start, end))
        else:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
    return merged


def dp_constants(text: str) -> list[int]:
    found: set[int] = set()
    for token, dp in DP_HEX.items():
        if re.search(rf"\b{re.escape(token)}\b", text, re.I):
            found.add(dp)
    return sorted(found)


def numbered(lines: list[str], start: int, end: int) -> str:
    return "\n".join(
        f"{line_no + 1:05d}: {lines[line_no]}"
        for line_no in range(start, end + 1)
    )


def collect(root: Path) -> tuple[list[ClassInventory], list[MethodEvidence]]:
    inventories: list[ClassInventory] = []
    evidence: list[MethodEvidence] = []

    for path in sorted(root.rglob("*.smali")):
        text = path.read_text(encoding="utf-8", errors="replace")
        lines = text.splitlines()
        methods = parse_methods(lines)
        protocol_count = 0
        for start, end, header, name in methods:
            body_lines = lines[start : end + 1]
            body = "\n".join(body_lines)
            hit_offsets = [
                offset
                for offset, line in enumerate(body_lines)
                if STRONG_RE.search(line)
            ]
            dps = dp_constants(body)
            name_relevant = bool(METHOD_NAME_RE.search(name))
            # A method name alone is weak evidence. Retain it only if it also
            # manipulates arrays/JSON/transport, has a DP constant, or is short.
            structural = bool(
                re.search(
                    r"(?:new-array|fill-array-data|aput|JSONObject|Base64|"
                    r"publish|send|ThingDevice|TuyaDevice)",
                    body,
                    re.I,
                )
            )
            retain = bool(hit_offsets or dps or (name_relevant and structural))
            if not retain:
                continue
            protocol_count += 1
            reasons: list[str] = []
            if dps:
                reasons.append("DP constants " + ", ".join(str(dp) for dp in dps))
            if hit_offsets:
                reasons.append("protocol/transport/array markers")
            if name_relevant:
                reasons.append("protocol-facing method name")

            if len(body_lines) <= 180:
                ranges = [(start, end)]
            else:
                absolute_hits = [start + offset for offset in hit_offsets]
                ranges = merge_ranges(
                    [(line_no - 14, line_no + 30) for line_no in absolute_hits],
                    start,
                    end,
                )
                if not ranges:
                    ranges = [(start, min(end, start + 100))]
            excerpts = [numbered(lines, a, b) for a, b in ranges[:16]]
            evidence.append(
                MethodEvidence(
                    class_name=path.stem,
                    source_file=str(path.relative_to(root)),
                    method_header=header,
                    method_name=name,
                    start_line=start + 1,
                    end_line=end + 1,
                    dp_constants=dps,
                    strong_hit_lines=[start + offset + 1 for offset in hit_offsets],
                    reasons=reasons,
                    excerpts=excerpts,
                )
            )

        inventories.append(
            ClassInventory(
                class_name=path.stem,
                source_file=str(path.relative_to(root)),
                sha256=hashlib.sha256(text.encode("utf-8")).hexdigest(),
                line_count=len(lines),
                method_count=len(methods),
                protocol_method_count=protocol_count,
            )
        )
    return inventories, evidence


def build_markdown(inventories: list[ClassInventory], evidence: list[MethodEvidence]) -> str:
    lines = [
        "# INKBIRD 2.1.11 — IIC-800 exact DEX bytecode evidence",
        "",
        "> Generated with Android `apkanalyzer dex code`. Complete class bytecode is retained only in the workflow artifact; this report contains focused excerpts.",
        "",
        "## Inventory",
        "",
        "| class | lines | methods | retained methods | SHA-256 |",
        "|---|---:|---:|---:|---|",
    ]
    for item in inventories:
        lines.append(
            f"| `{item.class_name}` | {item.line_count} | {item.method_count} | "
            f"{item.protocol_method_count} | `{item.sha256}` |"
        )

    grouped: dict[str, list[MethodEvidence]] = {}
    for item in evidence:
        grouped.setdefault(item.class_name, []).append(item)

    for class_name in sorted(grouped):
        lines += ["", f"## `{class_name}`", ""]
        for index, item in enumerate(grouped[class_name], 1):
            lines += [
                f"### {index}. `{item.method_name}` — lines {item.start_line}–{item.end_line}",
                "",
                f"Header: `{item.method_header.replace('`', '')}`",
                "",
                f"Evidence: {'; '.join(item.reasons)}.",
                "",
            ]
            for excerpt_no, excerpt in enumerate(item.excerpts, 1):
                if len(item.excerpts) > 1:
                    lines += [f"Excerpt {excerpt_no}:", ""]
                lines += ["```smali", excerpt, "```", ""]
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--smali-root", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    inventories, evidence = collect(args.smali_root)
    payload = {
        "inventory": [asdict(item) for item in inventories],
        "methods": [asdict(item) for item in evidence],
    }
    (args.output_dir / "smali-evidence.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    report = build_markdown(inventories, evidence)
    (args.output_dir / "smali-evidence.md").write_text(report, encoding="utf-8")
    print(report[:150000])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
