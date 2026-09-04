#!/usr/bin/env python3
"""Extract exact IIC-800 schedule/calendar semantics from full smali dumps.

Input is the temporary apkanalyzer output produced in CI. The script keeps only
small line-numbered excerpts around schedule/calendar setters and DP38 codec
methods so full APK bytecode is not committed.
"""
from __future__ import annotations

import argparse
from pathlib import Path

TERMS = (
    "parseZoneInfo",
    "parseIICZoneBean",
    "setScheduleMode",
    "setScheduleDay",
    "setIntervalYear",
    "setIntervalMonth",
    "setIntervalDay",
    "getScheduleMode",
    "getScheduleDay",
    "getIntervalYear",
    "getIntervalMonth",
    "getIntervalDay",
    "setEnable",
    "setSeaAdjSwitch",
    "isEnable",
    "isSeaAdjSwitch",
    "weekly",
    "odd",
    "even",
    "interval",
    "repeat",
    "rg_rain_sensor",
    "rb_sensor_yes",
    "rb_sensor_no",
)

TARGETS = {
    "Iic800Model.smali",
    "Iic800SchedulePresenter.smali",
    "Iic800AddPlanPresenter.smali",
    "Iic800AddPlanActivity.smali",
    "IicZoneBean.smali",
    "Iic800Constant.smali",
}


def merge(ranges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    out: list[tuple[int, int]] = []
    for a, b in sorted(ranges):
        if not out or a > out[-1][1] + 2:
            out.append((a, b))
        else:
            out[-1] = (out[-1][0], max(out[-1][1], b))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--smali-root", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()

    report = [
        "# IIC-800 DP38 schedule semantics — exact smali excerpts",
        "",
        "> Focused evidence only; complete smali remains in the ephemeral workflow artifact.",
        "",
    ]
    hits_total = 0
    for path in sorted(args.smali_root.rglob("*.smali")):
        if path.name not in TARGETS:
            continue
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        hits = []
        for i, line in enumerate(lines):
            lower = line.lower()
            if any(term.lower() in lower for term in TERMS):
                hits.append(i)
        if not hits:
            continue
        hits_total += len(hits)
        ranges = merge([(max(0, i - 18), min(len(lines) - 1, i + 38)) for i in hits])
        report += [f"## `{path.name}`", ""]
        for n, (a, b) in enumerate(ranges, 1):
            report += [f"### Excerpt {n} — lines {a+1}–{b+1}", "", "```smali"]
            report += [f"{j+1:05d}: {lines[j]}" for j in range(a, b + 1)]
            report += ["```", ""]

    report += [f"Total matched lines: **{hits_total}**", ""]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(report), encoding="utf-8")
    print("\n".join(report[:1200]))
    if hits_total == 0:
        raise SystemExit("No schedule semantic markers found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
