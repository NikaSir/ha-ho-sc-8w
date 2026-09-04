#!/usr/bin/env python3
"""Targeted INKBIRD APK scan for irrigation command evidence.

Unlike the broad JADX job, this pass does not decompile the whole application.
It scans every split APK, identifies only DEX files that contain protocol or
Tuya transport strings, disassembles those DEX files with baksmali, and keeps
short contexts around the relevant instructions.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import time
import urllib.parse
import zipfile
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Iterator

import requests


PACKAGE_NAME = "com.inkbird.inkbirdapp"
VERSION_NAME = "2.1.11"
VERSION_CODE = 190
KNOWN_XAPK_SHA256 = "bf84b1edc22a71786e5c6969156c1fca78a015148f62f3eba2b566954c008a40"

EXACT_TERMS = (
    "normal_time",
    "irrigation_time_all",
    "irrigation_mode",
    "operation_mode",
    "RainSen_TotalONOFF",
    "SeaAdjValue",
    "Merge_History",
    "ResetDevice",
    "timeerror_alarm",
    "zonerun_state",
    "pendingzone_state",
    "cancel_timealarm_voice",
    "h71ip90tp4mfd6mx",
    "IIC-800",
    "IIC_800",
    "IIC800",
    "HO-SC-8W",
    "HO_SC_8W",
)
TRANSPORT_TERMS = (
    "publishDps",
    "publishDp",
    "publishCommands",
    "sendDp",
    "setDp",
    "controlDevice",
    "IThingDevice",
    "ITuyaDevice",
    "ThingDevice",
    "TuyaDevice",
    "ThingSmart",
    "TuyaSmart",
)
PANEL_TERMS = (
    "miniapp",
    "microapp",
    "device panel",
    "panel bundle",
    "panelPackage",
    "panelUrl",
    "downloadPanel",
    "RNPanel",
    "BizBundle",
)
DOMAIN_TERMS = (
    "irrigation",
    "watering",
    "sprinkler",
    "seasonal",
    "rain sensor",
    "station",
)
ALL_TERMS = EXACT_TERMS + TRANSPORT_TERMS + PANEL_TERMS + DOMAIN_TERMS
EXACT_RE = re.compile("|".join(re.escape(x) for x in sorted(EXACT_TERMS, key=len, reverse=True)), re.I)
TRANSPORT_RE = re.compile("|".join(re.escape(x) for x in sorted(TRANSPORT_TERMS, key=len, reverse=True)), re.I)
PANEL_RE = re.compile("|".join(re.escape(x) for x in sorted(PANEL_TERMS, key=len, reverse=True)), re.I)
ALL_RE = re.compile("|".join(re.escape(x) for x in sorted(ALL_TERMS, key=len, reverse=True)), re.I)
DEX_NAME_RE = re.compile(r"(?:.*/)?classes(?:\d+)?\.dex$", re.I)
TEXT_SUFFIXES = {
    ".js", ".mjs", ".json", ".txt", ".html", ".htm", ".xml", ".properties",
    ".cfg", ".conf", ".ini", ".yaml", ".yml", ".csv", ".md", ".bundle",
}


@dataclass
class ApkRecord:
    path: str
    size: int
    sha256: str
    dex_members: list[str]
    native_members: int
    asset_members: int
    panel_name_markers: list[str]


@dataclass
class DexRecord:
    apk: str
    member: str
    extracted_path: str
    size: int
    sha256: str
    exact_terms: list[str]
    transport_terms: list[str]
    panel_terms: list[str]
    domain_terms: list[str]


@dataclass
class Hit:
    container: str
    member: str
    source: str
    line: int | None
    terms: list[str]
    text: str


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(chunk_size):
            h.update(chunk)
    return h.hexdigest()


def human_size(size: int) -> str:
    n = float(size)
    for unit in ("B", "KiB", "MiB", "GiB"):
        if n < 1024 or unit == "GiB":
            return f"{n:.2f} {unit}"
        n /= 1024
    return str(size)


def download_yandex(public_url: str, output: Path) -> dict[str, object]:
    api = (
        "https://cloud-api.yandex.net/v1/disk/public/resources/download?"
        + urllib.parse.urlencode({"public_key": public_url})
    )
    headers = {"User-Agent": "Mozilla/5.0 INKBIRD protocol research"}
    response = requests.get(api, headers=headers, timeout=60)
    response.raise_for_status()
    meta = response.json()
    href = meta.get("href")
    if not href:
        raise RuntimeError(f"Yandex public API returned no href: {meta!r}")
    output.parent.mkdir(parents=True, exist_ok=True)
    h = hashlib.sha256()
    total = 0
    with requests.get(href, headers=headers, stream=True, timeout=(60, 900)) as response:
        response.raise_for_status()
        with output.open("wb") as f:
            for chunk in response.iter_content(1024 * 1024):
                if not chunk:
                    continue
                f.write(chunk)
                h.update(chunk)
                total += len(chunk)
    return {"api": api, "size": total, "sha256": h.hexdigest(), "file": output.name}


def safe_extract_zip(archive: Path, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    root = output.resolve()
    with zipfile.ZipFile(archive) as z:
        for item in z.infolist():
            target = (output / item.filename).resolve()
            if target != root and root not in target.parents:
                raise RuntimeError(f"Unsafe ZIP member: {item.filename}")
        z.extractall(output)


def expand_wrappers(source: Path, output: Path, max_depth: int = 4) -> list[Path]:
    queue: list[tuple[Path, int]] = [(source, 0)]
    expanded: list[Path] = []
    seen: set[str] = set()
    while queue:
        archive, depth = queue.pop(0)
        if depth > max_depth or not archive.is_file() or archive.suffix.lower() == ".apk":
            continue
        try:
            if not zipfile.is_zipfile(archive):
                continue
        except OSError:
            continue
        digest = sha256_file(archive)
        if digest in seen:
            continue
        seen.add(digest)
        target = output / f"{depth}_{len(expanded):02d}_{archive.stem[:48]}"
        safe_extract_zip(archive, target)
        expanded.append(target)
        for child in target.rglob("*"):
            if (
                child.is_file()
                and child.suffix.lower() in {".zip", ".xapk", ".apkm", ".apks"}
            ):
                try:
                    if zipfile.is_zipfile(child):
                        queue.append((child, depth + 1))
                except OSError:
                    pass
    return expanded


def run_strings(path: Path) -> Iterator[str]:
    proc = subprocess.Popen(
        ["strings", "-a", "-n", "4", str(path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    assert proc.stdout is not None
    for line in proc.stdout:
        yield line.rstrip("\n")
    proc.stdout.close()
    proc.wait()
    if proc.returncode:
        raise RuntimeError(f"strings failed for {path}: {proc.returncode}")


def terms_in_lines(lines: Iterable[str], limit: int = 2000) -> tuple[set[str], list[str]]:
    found: set[str] = set()
    samples: list[str] = []
    for line in lines:
        matches = [m.group(0) for m in ALL_RE.finditer(line)]
        if not matches:
            continue
        found.update(m.lower() for m in matches)
        if len(samples) < limit:
            compact = re.sub(r"\s+", " ", line).strip()
            samples.append(compact[:600])
    return found, samples


def normalize_terms(found: set[str], candidates: tuple[str, ...]) -> list[str]:
    candidate_map = {term.lower(): term for term in candidates}
    return sorted((candidate_map[key] for key in found if key in candidate_map), key=str.lower)


def inspect_apk(
    apk_path: Path,
    relative: str,
    dex_root: Path,
    asset_hits: list[Hit],
    raw_hits: list[Hit],
) -> tuple[ApkRecord, list[DexRecord]]:
    dex_records: list[DexRecord] = []
    with zipfile.ZipFile(apk_path) as z:
        infos = z.infolist()
        names_lower = [info.filename.lower() for info in infos]
        dex_infos = [info for info in infos if DEX_NAME_RE.fullmatch(info.filename)]
        panel_markers = sorted(
            {
                marker
                for marker in (
                    "index.android.bundle", "flutter_assets", "libhermes.so",
                    "libreactnativejni.so", "miniapp", "microapp", "panel",
                    "thingclipsmart", "tuyasmart",
                )
                if any(marker in name for name in names_lower)
            }
        )
        record = ApkRecord(
            path=relative,
            size=apk_path.stat().st_size,
            sha256=sha256_file(apk_path),
            dex_members=[info.filename for info in dex_infos],
            native_members=sum(1 for i in infos if i.filename.endswith(".so")),
            asset_members=sum(1 for i in infos if i.filename.startswith("assets/")),
            panel_name_markers=panel_markers,
        )

        apk_dex_dir = dex_root / re.sub(r"[^A-Za-z0-9_.-]+", "_", Path(relative).stem)
        apk_dex_dir.mkdir(parents=True, exist_ok=True)
        for index, info in enumerate(dex_infos):
            out = apk_dex_dir / f"{index:02d}_{Path(info.filename).name}"
            with z.open(info) as src, out.open("wb") as dst:
                shutil.copyfileobj(src, dst)
            found, samples = terms_in_lines(run_strings(out), limit=300)
            exact = normalize_terms(found, EXACT_TERMS)
            transport = normalize_terms(found, TRANSPORT_TERMS)
            panel = normalize_terms(found, PANEL_TERMS)
            domain = normalize_terms(found, DOMAIN_TERMS)
            dex_records.append(
                DexRecord(
                    apk=relative,
                    member=info.filename,
                    extracted_path=str(out),
                    size=out.stat().st_size,
                    sha256=sha256_file(out),
                    exact_terms=exact,
                    transport_terms=transport,
                    panel_terms=panel,
                    domain_terms=domain,
                )
            )
            for sample in samples[:100]:
                matches = sorted({m.group(0) for m in ALL_RE.finditer(sample)}, key=str.lower)
                raw_hits.append(Hit(relative, info.filename, "dex_strings", None, matches, sample))

        for info in infos:
            suffix = Path(info.filename).suffix.lower()
            is_text = suffix in TEXT_SUFFIXES and info.file_size <= 80 * 1024 * 1024
            is_native = suffix == ".so"
            if not (is_text or is_native):
                continue
            if is_text and not (
                info.filename.startswith("assets/")
                or info.filename.startswith("res/raw/")
                or "panel" in info.filename.lower()
                or "mini" in info.filename.lower()
            ):
                continue
            temp = dex_root / "_member.tmp"
            with z.open(info) as src, temp.open("wb") as dst:
                shutil.copyfileobj(src, dst)
            try:
                if is_native:
                    found, samples = terms_in_lines(run_strings(temp), limit=100)
                    source = "native_strings"
                else:
                    text = temp.read_bytes().decode("utf-8", errors="replace")
                    found, samples = terms_in_lines(text.splitlines(), limit=500)
                    source = "asset_text"
                if found:
                    for sample in samples[:200]:
                        matches = sorted({m.group(0) for m in ALL_RE.finditer(sample)}, key=str.lower)
                        asset_hits.append(
                            Hit(relative, info.filename, source, None, matches, sample[:800])
                        )
            finally:
                temp.unlink(missing_ok=True)
    return record, dex_records


def choose_base(apks: list[ApkRecord]) -> ApkRecord:
    def score(item: ApkRecord) -> tuple[int, int, int, int]:
        name = Path(item.path).name.lower()
        exact = int(name in {"base.apk", f"{PACKAGE_NAME}.apk"})
        non_config = int(not (
            name.startswith("config.")
            or name.startswith("split_config")
            or name.startswith("split_")
        ))
        return (exact, non_config, len(item.dex_members), item.size)
    return max(apks, key=score)


def select_dex_for_smali(records: list[DexRecord], base_apk: str) -> list[DexRecord]:
    exact = [r for r in records if r.exact_terms]
    selected: list[DexRecord] = list(exact)
    if not selected:
        base_transport = [
            r for r in records
            if r.apk == base_apk and (r.transport_terms or r.panel_terms)
        ]
        selected.extend(base_transport[:8])
    else:
        apk_names = {r.apk for r in exact}
        candidates = [
            r for r in records
            if r.apk in apk_names and (r.transport_terms or r.panel_terms)
        ]
        for record in candidates:
            if record not in selected and len(selected) < 12:
                selected.append(record)
    return selected[:12]


def disassemble_dex(baksmali: Path, record: DexRecord, output_root: Path) -> tuple[Path, str]:
    name = re.sub(r"[^A-Za-z0-9_.-]+", "_", f"{Path(record.apk).stem}_{record.member}")
    output = output_root / name
    output.mkdir(parents=True, exist_ok=True)
    command = [
        "java", "-Xmx4g", "-jar", str(baksmali),
        "disassemble", record.extracted_path,
        "--output", str(output),
        "--use-locals",
    ]
    started = time.time()
    proc = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=1800,
        check=False,
    )
    elapsed = time.time() - started
    log = f"$ {' '.join(command)}\nexit={proc.returncode}; elapsed={elapsed:.1f}s\n{proc.stdout}"
    return output, log


def smali_method_bounds(lines: list[str], index: int) -> tuple[int, int]:
    start = index
    while start > 0 and not lines[start].lstrip().startswith(".method"):
        start -= 1
    end = index
    while end + 1 < len(lines) and not lines[end].lstrip().startswith(".end method"):
        end += 1
    if start == 0 and not lines[start].lstrip().startswith(".method"):
        start = max(0, index - 8)
    if end + 1 >= len(lines):
        end = min(len(lines) - 1, index + 12)
    return start, end


def collect_smali_contexts(root: Path, max_hits: int = 1200) -> list[Hit]:
    hits: list[Hit] = []
    for path in root.rglob("*.smali"):
        try:
            lines = path.read_text("utf-8", errors="replace").splitlines()
        except OSError:
            continue
        matching = [i for i, line in enumerate(lines) if ALL_RE.search(line)]
        if not matching:
            continue
        for index in matching:
            method_start, method_end = smali_method_bounds(lines, index)
            context_start = max(method_start, index - 12)
            context_end = min(method_end, index + 18)
            excerpt = "\n".join(
                f"{line_no + 1:06d}: {lines[line_no]}"
                for line_no in range(context_start, context_end + 1)
            )
            terms = sorted({m.group(0) for m in ALL_RE.finditer(excerpt)}, key=str.lower)
            hits.append(
                Hit(
                    container=str(root.name),
                    member=str(path.relative_to(root)),
                    source="smali",
                    line=index + 1,
                    terms=terms,
                    text=excerpt,
                )
            )
            if len(hits) >= max_hits:
                return hits
    return hits


def write_hits_text(hits: list[Hit], path: Path) -> None:
    with path.open("w", encoding="utf-8") as f:
        for n, hit in enumerate(hits, 1):
            f.write(
                f"===== {n}: {hit.container} :: {hit.member}"
                f"{':' + str(hit.line) if hit.line else ''} "
                f"[{', '.join(hit.terms)}] =====\n"
            )
            f.write(hit.text)
            f.write("\n\n")


def md_escape(text: object) -> str:
    return str(text).replace("|", "\\|").replace("\n", " ")


def build_report(
    acquisition: dict[str, object],
    wrapper: Path,
    expanded: list[Path],
    apk_records: list[ApkRecord],
    dex_records: list[DexRecord],
    base: ApkRecord,
    selected: list[DexRecord],
    raw_hits: list[Hit],
    asset_hits: list[Hit],
    smali_hits: list[Hit],
    logs: list[str],
) -> str:
    exact_raw = [h for h in raw_hits + asset_hits if any(EXACT_RE.search(t) for t in h.terms)]
    exact_smali = [h for h in smali_hits if EXACT_RE.search(h.text)]
    transport_smali = [h for h in smali_hits if TRANSPORT_RE.search(h.text)]
    panel_evidence = [
        h for h in smali_hits + asset_hits
        if PANEL_RE.search(h.text) or any(PANEL_RE.search(t) for t in h.terms)
    ]
    exact_terms = Counter(
        t.lower()
        for h in exact_raw + exact_smali
        for t in h.terms
        if EXACT_RE.fullmatch(t)
    )

    lines = [
        "# INKBIRD 2.1.11 — targeted irrigation-command APK analysis",
        "",
        "> Targeted DEX/asset pass. APK/XAPK and complete disassembly are not committed.",
        "",
        "## Source identity",
        "",
        f"- Package target: `{PACKAGE_NAME}`",
        f"- Version target: `{VERSION_NAME}` (`versionCode {VERSION_CODE}`)",
        f"- Downloaded wrapper: `{wrapper.name}`, {human_size(int(acquisition['size']))}",
        f"- Wrapper SHA-256: `{acquisition['sha256']}`",
        f"- Known APKPure XAPK SHA-256: `{KNOWN_XAPK_SHA256}`",
        f"- Known hash matches wrapper: **{str(acquisition['sha256']).lower() == KNOWN_XAPK_SHA256}**",
        f"- Expanded ZIP/XAPK layers: **{len(expanded)}**",
        "",
        "## APK inventory",
        "",
        "| APK | size | DEX | native | assets | panel/runtime filename markers | SHA-256 |",
        "|---|---:|---:|---:|---:|---|---|",
    ]
    for item in sorted(apk_records, key=lambda x: x.size, reverse=True):
        lines.append(
            f"| `{md_escape(item.path)}` | {human_size(item.size)} | {len(item.dex_members)} | "
            f"{item.native_members} | {item.asset_members} | "
            f"{', '.join(f'`{md_escape(x)}`' for x in item.panel_name_markers) or '—'} | "
            f"`{item.sha256}` |"
        )
    lines += [
        "",
        f"Selected base APK: **`{base.path}`**.",
        "",
        "## DEX selection",
        "",
        "| APK / member | exact terms | transport terms | panel terms | domain terms |",
        "|---|---|---|---|---|",
    ]
    for record in dex_records:
        if not (record.exact_terms or record.transport_terms or record.panel_terms or record.domain_terms):
            continue
        lines.append(
            f"| `{md_escape(record.apk)} :: {md_escape(record.member)}` | "
            f"{', '.join(f'`{x}`' for x in record.exact_terms) or '—'} | "
            f"{', '.join(f'`{x}`' for x in record.transport_terms) or '—'} | "
            f"{', '.join(f'`{x}`' for x in record.panel_terms) or '—'} | "
            f"{', '.join(f'`{x}`' for x in record.domain_terms) or '—'} |"
        )
    lines += [
        "",
        f"DEX files disassembled with baksmali: **{len(selected)}**.",
        "",
        "## Exact product/DP terms",
        "",
    ]
    if exact_terms:
        for term, count in exact_terms.most_common():
            lines.append(f"- `{term}`: {count} retained occurrence(s)")
    else:
        lines.append(
            "- No exact IIC-800 product ID/model name or DP code name was found "
            "in bundled DEX strings, native libraries, text assets or selected smali."
        )

    lines += [
        "",
        "## Relevant classes and methods",
        "",
    ]
    if exact_smali:
        files = sorted({h.member for h in exact_smali})
        lines.append("Exact protocol terms are referenced from:")
        for file in files[:150]:
            lines.append(f"- `{file}`")
    else:
        lines.append("- No app method references an exact IIC-800/HO-SC-8W DP name in the bundled bytecode.")
    if transport_smali:
        files = sorted({h.member for h in transport_smali})
        lines.append("")
        lines.append("Generic Tuya/Thing transport references are present in:")
        for file in files[:150]:
            lines.append(f"- `{file}`")
    else:
        lines.append("- No readable generic Tuya/Thing publish call was recovered in the selected DEX files.")

    lines += [
        "",
        "## Interpretation",
        "",
    ]
    if exact_smali:
        lines.append(
            "1. The product-specific command path is bundled in the APK. "
            "Use `smali-contexts.txt` to trace each exact DP string through the enclosing method "
            "to the final publish call and reconstruct the payload byte-for-byte."
        )
    elif exact_raw:
        lines.append(
            "1. Exact product/DP strings exist in the bundle but were not referenced in selected smali. "
            "They may belong to a bundled JavaScript/panel asset, native code, or a DEX that requires a second targeted pass."
        )
    else:
        lines.append(
            "1. The static shell APK does not contain the exact IIC-800 schema names or product ID. "
            "Together with panel/mini-app runtime markers, this supports the hypothesis that the "
            "device panel and its payload encoder are downloaded at runtime from Tuya/Thing cloud."
        )
    if panel_evidence:
        lines.append(
            "2. Panel/mini-app runtime evidence is present; retained contexts identify the loader/runtime classes."
        )
    else:
        lines.append(
            "2. No direct panel-runtime term was retained. Absence is not conclusive because names can be obfuscated."
        )
    lines += [
        "3. Field-proven DP45 and DP103 behavior remains valid regardless of where the product panel is hosted.",
        "4. DP38 production writes must remain disabled until the exact one-hot selector and 20-byte encoder "
        "are independently tied to app/panel code or another controlled before/after capture.",
        "",
        "## Output files",
        "",
        "- `smali-contexts.txt` — short method-local disassembly contexts.",
        "- `asset-contexts.txt` — short matching asset/native contexts.",
        "- `raw-string-hits.json` — DEX string hits.",
        "- `dex-inventory.json` — hashes, selected DEX files and terms.",
        "- `baksmali.log` — command status.",
        "",
        "## Baksmali log tail",
        "",
        "```text",
        *("\n".join(logs)[-10000:].splitlines()),
        "```",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--public-url", required=True)
    parser.add_argument("--work-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--baksmali", type=Path, required=True)
    args = parser.parse_args()

    work = args.work_dir.resolve()
    output = args.output_dir.resolve()
    wrappers = work / "expanded"
    dex_root = work / "dex"
    smali_root = work / "smali"
    for p in (work, output, wrappers, dex_root, smali_root):
        p.mkdir(parents=True, exist_ok=True)

    wrapper = work / "inkbird-public-bundle.bin"
    acquisition = download_yandex(args.public_url, wrapper)
    expanded = expand_wrappers(wrapper, wrappers)

    apk_paths = sorted({p.resolve() for p in wrappers.rglob("*.apk") if p.is_file()})
    if not apk_paths:
        raise RuntimeError("No .apk files found after expanding the public bundle")

    apk_records: list[ApkRecord] = []
    dex_records: list[DexRecord] = []
    raw_hits: list[Hit] = []
    asset_hits: list[Hit] = []
    for apk_path in apk_paths:
        relative = str(apk_path.relative_to(work))
        apk_record, current_dex = inspect_apk(
            apk_path, relative, dex_root, asset_hits, raw_hits
        )
        apk_records.append(apk_record)
        dex_records.extend(current_dex)

    base = choose_base(apk_records)
    selected = select_dex_for_smali(dex_records, base.path)
    if not selected:
        raise RuntimeError(
            "No DEX contained exact, Tuya transport or panel runtime strings; "
            "raw inventory was written but there is nothing useful to disassemble"
        )

    logs: list[str] = []
    smali_hits: list[Hit] = []
    for record in selected:
        out, log = disassemble_dex(args.baksmali.resolve(), record, smali_root)
        logs.append(log)
        smali_hits.extend(collect_smali_contexts(out))

    write_hits_text(smali_hits, output / "smali-contexts.txt")
    write_hits_text(asset_hits, output / "asset-contexts.txt")
    (output / "raw-string-hits.json").write_text(
        json.dumps([asdict(h) for h in raw_hits], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (output / "smali-hits.json").write_text(
        json.dumps([asdict(h) for h in smali_hits], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (output / "dex-inventory.json").write_text(
        json.dumps(
            {
                "acquisition": acquisition,
                "apks": [asdict(x) for x in apk_records],
                "dex": [asdict(x) for x in dex_records],
                "base_apk": asdict(base),
                "selected_dex": [asdict(x) for x in selected],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (output / "baksmali.log").write_text("\n\n".join(logs), encoding="utf-8")
    report = build_report(
        acquisition, wrapper, expanded, apk_records, dex_records, base,
        selected, raw_hits, asset_hits, smali_hits, logs
    )
    (output / "report.md").write_text(report, encoding="utf-8")
    print(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
