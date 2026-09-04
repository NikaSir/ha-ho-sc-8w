#!/usr/bin/env python3
"""Extract concise command-building evidence from selected IIC-800 APK classes.

This script consumes already decompiled *selected* Java classes and emits short,
line-numbered excerpts around protocol-relevant code. It deliberately does not
publish complete proprietary source files.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path


CLASS_HINTS = (
    "Iic800Constant",
    "IIic800Model",
    "Iic800Model",
    "Iic800Presenter",
    "Iic800ManualPresenter",
    "Iic800SchedulePresenter",
    "Iic800AddPlanPresenter",
    "Iic800SettingsPresenter",
    "Iic800ManualFragment",
    "Iic800AddPlanActivity",
    "IicZoneBean",
    "IrrigationBean",
    "StartTimeBean",
)

# Strong markers receive a wider context. These are expected to expose the
# command JSON, DP IDs, raw byte assembly, or public presenter/model boundary.
STRONG = re.compile(
    r"(?:publishDps|publishCommands|publishDp|sendDp|setDp|controlDevice|"
    r"changeSeaAdjValue|SeaAdjValue|normal_time|irrigation_time_all|"
    r"irrigation_mode|operation_mode|zonerun_state|pendingzone_state|"
    r"IThingDevice|ThingDevice|new\s+byte\s*\[\s*34\s*\]|"
    r"byte\s*\[\s*34\s*\]|JSONObject|Gson|toHex|fromHex|hexString|"
    r"getNormal|setNormal|startManual|stopManual|manualIrrigation|"
    r"addPlan|copyZone|startWater|stopWater)",
    re.I,
)

# Structural markers are retained only inside the IIC-800 target classes and
# help recover obfuscated method names that manipulate fixed-size protocol data.
STRUCTURAL = re.compile(
    r"(?:byte\[|ByteBuffer|StringBuilder|String\.format|Integer\.toHexString|"
    r"Base64|put\(|get\(|\b38\b|\b44\b|\b45\b|\b101\b|\b102\b|\b103\b|"
    r"\b104\b|\b105\b|\b106\b|\b107\b|\b108\b|\b109\b|"
    r"manual|schedule|irrigation|watering|season|rain|zone)",
    re.I,
)

METHOD_DECL = re.compile(
    r"^\s*(?:public|protected|private|static|final|synchronized|native|abstract|\s)+"
    r"[\w<>,.?\[\] ]+\s+(?P<name>[A-Za-z_$][\w$]*)\s*\([^;]*\)\s*(?:throws [^{]+)?\{?\s*$"
)


@dataclass
class SourceSummary:
    requested_class: str
    source_path: str
    sha256: str
    line_count: int
    strong_hit_lines: list[int]
    structural_hit_lines: list[int]
    method_names: list[str]


@dataclass
class Excerpt:
    requested_class: str
    source_path: str
    start_line: int
    end_line: int
    reasons: list[str]
    text: str


def merge_ranges(ranges: list[tuple[int, int, str]], max_line: int) -> list[tuple[int, int, list[str]]]:
    normalized = sorted((max(1, start), min(max_line, end), reason) for start, end, reason in ranges)
    merged: list[tuple[int, int, list[str]]] = []
    for start, end, reason in normalized:
        if not merged or start > merged[-1][1] + 3:
            merged.append((start, end, [reason]))
            continue
        old_start, old_end, reasons = merged[-1]
        merged[-1] = (old_start, max(old_end, end), sorted(set(reasons + [reason])))
    return merged


def find_source_for_class(root: Path, requested_class: str) -> Path | None:
    simple = requested_class.rsplit(".", 1)[-1]
    candidates = sorted(root.rglob(f"{simple}.java"))
    if candidates:
        expected = requested_class.replace(".", "/") + ".java"
        for candidate in candidates:
            if str(candidate).replace("\\", "/").endswith(expected):
                return candidate
        return candidates[0]
    # Some JADX versions write a single class to an explicitly named file.
    aliases = sorted(root.rglob("*.java"))
    for candidate in aliases:
        text = candidate.read_text(encoding="utf-8", errors="replace")[:10000]
        if re.search(rf"\bclass\s+{re.escape(simple)}\b|\binterface\s+{re.escape(simple)}\b", text):
            return candidate
    return None


def collect(root: Path, requested_classes: list[str]) -> tuple[list[SourceSummary], list[Excerpt], list[str]]:
    summaries: list[SourceSummary] = []
    excerpts: list[Excerpt] = []
    missing: list[str] = []

    for requested in requested_classes:
        source = find_source_for_class(root, requested)
        if source is None:
            missing.append(requested)
            continue
        text = source.read_text(encoding="utf-8", errors="replace")
        lines = text.splitlines()
        strong_hits = [index + 1 for index, line in enumerate(lines) if STRONG.search(line)]
        structural_hits = [index + 1 for index, line in enumerate(lines) if STRUCTURAL.search(line)]
        method_names = [
            match.group("name")
            for line in lines
            if (match := METHOD_DECL.match(line)) is not None
        ]

        ranges: list[tuple[int, int, str]] = []
        for line_no in strong_hits:
            ranges.append((line_no - 18, line_no + 28, "strong protocol marker"))
        # Keep structural-only evidence bounded. A class with hundreds of UI
        # references otherwise creates a noisy report.
        for line_no in structural_hits[:80]:
            ranges.append((line_no - 7, line_no + 11, "IIC-800 structural marker"))

        # Constants/interfaces/beans are compact and their declarations can
        # explain field ordering even when no readable DP code name survived.
        simple = requested.rsplit(".", 1)[-1]
        if simple in {"Iic800Constant", "IIic800Model", "IicZoneBean", "IrrigationBean", "StartTimeBean"}:
            if len(lines) <= 450:
                ranges.append((1, len(lines), "compact protocol-facing class"))
            else:
                for line_no in range(1, min(len(lines), 450) + 1):
                    if re.search(r"(?:static final|interface|byte|int|String|List|ArrayList|zone|time|date|rain)", lines[line_no - 1], re.I):
                        ranges.append((line_no - 4, line_no + 8, "protocol-facing declaration"))

        merged = merge_ranges(ranges, len(lines))
        # Hard bound by class: prefer earlier merged contexts but retain all
        # strong-hit ranges. This keeps the generated report reviewable.
        emitted_chars = 0
        for start, end, reasons in merged:
            numbered = "\n".join(
                f"{line_no:05d}: {lines[line_no - 1]}"
                for line_no in range(start, end + 1)
            )
            if emitted_chars > 70000 and "strong protocol marker" not in reasons:
                continue
            excerpts.append(
                Excerpt(
                    requested_class=requested,
                    source_path=str(source.relative_to(root)),
                    start_line=start,
                    end_line=end,
                    reasons=reasons,
                    text=numbered,
                )
            )
            emitted_chars += len(numbered)

        summaries.append(
            SourceSummary(
                requested_class=requested,
                source_path=str(source.relative_to(root)),
                sha256=hashlib.sha256(text.encode("utf-8")).hexdigest(),
                line_count=len(lines),
                strong_hit_lines=strong_hits,
                structural_hit_lines=structural_hits,
                method_names=method_names,
            )
        )
    return summaries, excerpts, missing


def build_markdown(summaries: list[SourceSummary], excerpts: list[Excerpt], missing: list[str]) -> str:
    lines = [
        "# INKBIRD 2.1.11 — IIC-800 command-class evidence",
        "",
        "> Concise, line-numbered excerpts from selected JADX output. Complete decompiled classes are not committed.",
        "",
        "## Class inventory",
        "",
        "| requested class | lines | strong hits | structural hits | decompiled path |",
        "|---|---:|---:|---:|---|",
    ]
    for summary in summaries:
        lines.append(
            f"| `{summary.requested_class}` | {summary.line_count} | "
            f"{len(summary.strong_hit_lines)} | {len(summary.structural_hit_lines)} | "
            f"`{summary.source_path}` |"
        )
    if missing:
        lines += ["", "## Missing classes", ""]
        lines.extend(f"- `{item}`" for item in missing)

    by_class: dict[str, list[Excerpt]] = {}
    for excerpt in excerpts:
        by_class.setdefault(excerpt.requested_class, []).append(excerpt)

    for summary in summaries:
        lines += [
            "",
            f"## `{summary.requested_class}`",
            "",
            f"Methods detected: `{', '.join(summary.method_names) if summary.method_names else 'none/read failure'}`",
            "",
        ]
        for number, excerpt in enumerate(by_class.get(summary.requested_class, []), 1):
            lines += [
                f"### Excerpt {number}: lines {excerpt.start_line}–{excerpt.end_line}",
                "",
                f"Reasons: {', '.join(excerpt.reasons)}.",
                "",
                "```java",
                excerpt.text,
                "```",
                "",
            ]
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--decompiled-root", type=Path, required=True)
    parser.add_argument("--classes-file", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    requested = [
        line.strip()
        for line in args.classes_file.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]
    output = args.output_dir
    output.mkdir(parents=True, exist_ok=True)
    summaries, excerpts, missing = collect(args.decompiled_root, requested)
    payload = {
        "summaries": [asdict(item) for item in summaries],
        "excerpts": [asdict(item) for item in excerpts],
        "missing": missing,
    }
    (output / "command-class-evidence.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (output / "command-class-evidence.md").write_text(
        build_markdown(summaries, excerpts, missing), encoding="utf-8"
    )
    print(build_markdown(summaries, excerpts, missing)[:100000])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
