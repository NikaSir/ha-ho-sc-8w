#!/usr/bin/env python3
"""Acquire and statically inspect the INKBIRD 2.1.11 Android bundle.

The script is intentionally evidence-first:
- the vendor bundle is downloaded only into the CI workspace;
- no APK/XAPK or complete decompiled source is copied to the repository;
- the output contains hashes, inventories, exact string hits and short
  decompiler contexts needed to identify irrigation command construction.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import time
import urllib.parse
import zipfile
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, Iterator

import requests


PACKAGE_NAME = "com.inkbird.inkbirdapp"
EXPECTED_VERSION = "2.1.11"
EXPECTED_VERSION_CODE = "190"
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
    "dps",
    "dpId",
    "dp_id",
)
DOMAIN_TERMS = (
    "irrigation",
    "watering",
    "sprinkler",
    "seasonal",
    "rain sensor",
    "station",
)
ALL_TERMS = EXACT_TERMS + TRANSPORT_TERMS + DOMAIN_TERMS
TERM_RE = re.compile("|".join(re.escape(term) for term in sorted(ALL_TERMS, key=len, reverse=True)), re.I)
EXACT_RE = re.compile("|".join(re.escape(term) for term in sorted(EXACT_TERMS, key=len, reverse=True)), re.I)
TRANSPORT_RE = re.compile("|".join(re.escape(term) for term in sorted(TRANSPORT_TERMS, key=len, reverse=True)), re.I)

TEXT_EXTENSIONS = {
    ".txt", ".json", ".js", ".mjs", ".html", ".htm", ".xml", ".properties",
    ".yaml", ".yml", ".cfg", ".conf", ".ini", ".csv", ".md", ".kt", ".java",
}


@dataclass
class ApkInfo:
    path: str
    size: int
    sha256: str
    dex_files: list[str]
    native_libs: int
    assets: int
    candidate_base_score: tuple[int, int, int, int]


@dataclass
class Hit:
    container: str
    member: str
    source: str
    term: str
    text: str


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


def human_size(value: int) -> str:
    units = ("B", "KiB", "MiB", "GiB")
    number = float(value)
    for unit in units:
        if number < 1024 or unit == units[-1]:
            return f"{number:.2f} {unit}"
        number /= 1024
    return f"{value} B"


def safe_extract_zip(archive: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    root = destination.resolve()
    with zipfile.ZipFile(archive) as zf:
        for member in zf.infolist():
            target = (destination / member.filename).resolve()
            if root not in target.parents and target != root:
                raise RuntimeError(f"Unsafe archive path: {member.filename}")
        zf.extractall(destination)


def download_yandex_public(public_url: str, destination: Path) -> dict[str, str | int]:
    api_url = (
        "https://cloud-api.yandex.net/v1/disk/public/resources/download?"
        + urllib.parse.urlencode({"public_key": public_url})
    )
    headers = {"User-Agent": "Mozilla/5.0 APK protocol research"}
    meta_response = requests.get(api_url, headers=headers, timeout=60)
    meta_response.raise_for_status()
    meta = meta_response.json()
    href = meta.get("href")
    if not href:
        raise RuntimeError(f"Yandex API did not return href: {meta!r}")

    destination.parent.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256()
    total = 0
    with requests.get(href, headers=headers, stream=True, timeout=(60, 600)) as response:
        response.raise_for_status()
        with destination.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                handle.write(chunk)
                digest.update(chunk)
                total += len(chunk)
    return {
        "api_url": api_url,
        "downloaded_file": destination.name,
        "size": total,
        "sha256": digest.hexdigest(),
    }


def recursively_expand_bundle(source: Path, destination: Path, max_depth: int = 4) -> list[Path]:
    """Expand ZIP-like wrappers but preserve APK files as atomic inputs."""
    queue: list[tuple[Path, int]] = [(source, 0)]
    expanded: list[Path] = []
    seen_hashes: set[str] = set()
    while queue:
        archive, depth = queue.pop(0)
        if depth > max_depth or not archive.is_file() or archive.suffix.lower() == ".apk":
            continue
        try:
            is_zip = zipfile.is_zipfile(archive)
        except OSError:
            is_zip = False
        if not is_zip:
            continue
        digest = sha256_file(archive)
        if digest in seen_hashes:
            continue
        seen_hashes.add(digest)
        extract_dir = destination / f"level_{depth}_{len(expanded):02d}_{archive.stem[:40]}"
        safe_extract_zip(archive, extract_dir)
        expanded.append(extract_dir)
        for child in extract_dir.rglob("*"):
            if (
                child.is_file()
                and child.suffix.lower() in {".zip", ".xapk", ".apkm", ".apks"}
                and zipfile.is_zipfile(child)
            ):
                queue.append((child, depth + 1))
    return expanded


def apk_info(path: Path, root: Path) -> ApkInfo:
    with zipfile.ZipFile(path) as zf:
        names = zf.namelist()
    dex = sorted(
        name for name in names
        if re.fullmatch(r"(?:.*/)?classes(?:\d+)?\.dex", name, re.I)
    )
    native_libs = sum(1 for name in names if name.startswith("lib/") and name.endswith(".so"))
    assets = sum(1 for name in names if name.startswith("assets/"))
    lower_name = path.name.lower()
    exact_base = int(lower_name in {"base.apk", f"{PACKAGE_NAME}.apk"})
    not_config = int(not (
        lower_name.startswith("config.")
        or "split_config" in lower_name
        or lower_name.startswith("split_")
    ))
    score = (exact_base, not_config, len(dex), path.stat().st_size)
    return ApkInfo(
        path=str(path.relative_to(root)),
        size=path.stat().st_size,
        sha256=sha256_file(path),
        dex_files=dex,
        native_libs=native_libs,
        assets=assets,
        candidate_base_score=score,
    )


def run_strings(binary_path: Path) -> Iterator[str]:
    process = subprocess.Popen(
        ["strings", "-a", "-n", "4", str(binary_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    assert process.stdout is not None
    for line in process.stdout:
        yield line.rstrip("\n")
    process.stdout.close()
    process.wait()
    if process.returncode not in (0, None):
        raise RuntimeError(f"strings failed for {binary_path} with {process.returncode}")


def record_line_hits(
    hits: list[Hit],
    *,
    container: str,
    member: str,
    source: str,
    line: str,
    per_source_limit: int,
    source_count: int,
) -> int:
    if source_count >= per_source_limit:
        return source_count
    matches = list(TERM_RE.finditer(line))
    if not matches:
        return source_count
    compact = re.sub(r"\s+", " ", line).strip()
    if len(compact) > 500:
        compact = compact[:497] + "..."
    terms_seen: set[str] = set()
    for match in matches:
        normalized = match.group(0)
        key = normalized.lower()
        if key in terms_seen:
            continue
        terms_seen.add(key)
        hits.append(
            Hit(
                container=container,
                member=member,
                source=source,
                term=normalized,
                text=compact,
            )
        )
        source_count += 1
        if source_count >= per_source_limit:
            break
    return source_count


def scan_apk(path: Path, relative_name: str, temp_dir: Path) -> list[Hit]:
    hits: list[Hit] = []
    temp_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path) as zf:
        members = zf.infolist()
        interesting = []
        for info in members:
            suffix = Path(info.filename).suffix.lower()
            is_dex = bool(re.fullmatch(r"(?:.*/)?classes(?:\d+)?\.dex", info.filename, re.I))
            is_native = suffix == ".so"
            is_text = suffix in TEXT_EXTENSIONS and info.file_size <= 25 * 1024 * 1024
            if is_dex or is_native or is_text:
                interesting.append((info, is_dex, is_native, is_text))

        for index, (info, is_dex, is_native, is_text) in enumerate(interesting):
            member_key = re.sub(r"[^A-Za-z0-9_.-]+", "_", info.filename)[-120:]
            extracted = temp_dir / f"{index:04d}_{member_key}"
            with zf.open(info) as src, extracted.open("wb") as dst:
                shutil.copyfileobj(src, dst)
            source_count = 0
            try:
                if is_dex or is_native:
                    for line in run_strings(extracted):
                        source_count = record_line_hits(
                            hits,
                            container=relative_name,
                            member=info.filename,
                            source="strings",
                            line=line,
                            per_source_limit=800 if is_dex else 250,
                            source_count=source_count,
                        )
                        if source_count >= (800 if is_dex else 250):
                            break
                elif is_text:
                    data = extracted.read_bytes()
                    text = data.decode("utf-8", errors="replace")
                    for line in text.splitlines():
                        source_count = record_line_hits(
                            hits,
                            container=relative_name,
                            member=info.filename,
                            source="asset_text",
                            line=line,
                            per_source_limit=500,
                            source_count=source_count,
                        )
                        if source_count >= 500:
                            break
            finally:
                extracted.unlink(missing_ok=True)
    return hits


def framework_markers(apk_paths: Iterable[Path]) -> dict[str, list[str]]:
    markers: dict[str, list[str]] = defaultdict(list)
    tests = {
        "Flutter": ("libflutter.so", "flutter_assets/"),
        "React Native": ("libreactnativejni.so", "index.android.bundle", "libhermes.so"),
        "Unity": ("libunity.so", "global-metadata.dat"),
        "Cordova/Capacitor": ("cordova.js", "capacitor.config"),
        "Tuya panel assets": ("panel", "miniapp", "microapp", "thingclipsmart"),
    }
    for apk in apk_paths:
        with zipfile.ZipFile(apk) as zf:
            names = [name.lower() for name in zf.namelist()]
        for framework, needles in tests.items():
            found = sorted({needle for needle in needles if any(needle in name for name in names)})
            if found:
                markers[framework].extend(f"{apk.name}: {needle}" for needle in found)
    return dict(markers)


def run_jadx(jadx_bin: Path, targets: list[Path], destination: Path) -> tuple[int, str]:
    destination.mkdir(parents=True, exist_ok=True)
    command = [
        str(jadx_bin),
        "-j", "4",
        "--deobf",
        "--comments-level", "WARN",
        "--log-level", "error",
        "-d", str(destination),
        *[str(path) for path in targets],
    ]
    env = os.environ.copy()
    env["JAVA_OPTS"] = "-Xmx5g"
    started = time.time()
    process = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
        timeout=5400,
        check=False,
    )
    elapsed = time.time() - started
    log = f"$ {' '.join(command)}\nexit={process.returncode}; elapsed={elapsed:.1f}s\n{process.stdout}"
    return process.returncode, log


def iter_text_source_files(root: Path) -> Iterator[Path]:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() in TEXT_EXTENSIONS or path.suffix.lower() in {".smali"}:
            if path.stat().st_size <= 8 * 1024 * 1024:
                yield path


def collect_decompiled_contexts(root: Path, max_contexts: int = 1600) -> tuple[list[dict[str, object]], Counter[str]]:
    contexts: list[dict[str, object]] = []
    term_counts: Counter[str] = Counter()
    for path in iter_text_source_files(root):
        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue
        match_indexes = [index for index, line in enumerate(lines) if TERM_RE.search(line)]
        if not match_indexes:
            continue
        for index in match_indexes:
            line = lines[index]
            terms = [m.group(0) for m in TERM_RE.finditer(line)]
            for term in terms:
                term_counts[term.lower()] += 1
            start = max(0, index - 5)
            end = min(len(lines), index + 6)
            excerpt = "\n".join(f"{line_no + 1:06d}: {lines[line_no]}" for line_no in range(start, end))
            contexts.append(
                {
                    "file": str(path.relative_to(root)),
                    "line": index + 1,
                    "terms": sorted(set(terms), key=str.lower),
                    "excerpt": excerpt,
                }
            )
            if len(contexts) >= max_contexts:
                return contexts, term_counts
    return contexts, term_counts


def write_context_file(contexts: list[dict[str, object]], destination: Path) -> None:
    with destination.open("w", encoding="utf-8") as handle:
        for number, context in enumerate(contexts, 1):
            handle.write(
                f"===== CONTEXT {number}: {context['file']}:{context['line']} "
                f"[{', '.join(context['terms'])}] =====\n"
            )
            handle.write(str(context["excerpt"]))
            handle.write("\n\n")


def find_direct_source_files(contexts: list[dict[str, object]]) -> list[str]:
    direct: set[str] = set()
    for context in contexts:
        excerpt = str(context["excerpt"])
        if EXACT_RE.search(excerpt):
            direct.add(str(context["file"]))
    return sorted(direct)


def markdown_escape(value: object) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def build_report(
    *,
    acquisition: dict[str, str | int],
    bundle_source: Path,
    bundle_root: Path,
    apk_infos: list[ApkInfo],
    base_info: ApkInfo,
    frameworks: dict[str, list[str]],
    raw_hits: list[Hit],
    contexts: list[dict[str, object]],
    term_counts: Counter[str],
    direct_files: list[str],
    jadx_status: int,
    jadx_log: str,
    expanded_dirs: list[Path],
) -> str:
    exact_raw = [hit for hit in raw_hits if any(hit.term.lower() == term.lower() for term in EXACT_TERMS)]
    exact_contexts = [
        context for context in contexts
        if EXACT_RE.search(str(context["excerpt"]))
    ]
    transport_contexts = [
        context for context in contexts
        if TRANSPORT_RE.search(str(context["excerpt"]))
    ]

    all_hash_matches = [
        info.path for info in apk_infos if info.sha256.lower() == KNOWN_XAPK_SHA256.lower()
    ]
    source_hash_match = str(acquisition["sha256"]).lower() == KNOWN_XAPK_SHA256.lower()

    lines: list[str] = []
    lines += [
        "# INKBIRD 2.1.11 APK — irrigation command static-analysis report",
        "",
        "> Generated in the isolated `analysis/apk-irrigation-commands` branch. "
        "The APK/XAPK and complete decompiled source are intentionally not committed.",
        "",
        "## Acquisition and identity",
        "",
        f"- Public source: `{markdown_escape(acquisition['api_url'])}`",
        f"- Downloaded wrapper: `{bundle_source.name}` — {human_size(int(acquisition['size']))}",
        f"- Wrapper SHA-256: `{acquisition['sha256']}`",
        f"- Expected APKPure XAPK SHA-256: `{KNOWN_XAPK_SHA256}`",
        f"- Expected identity: `{PACKAGE_NAME}` version `{EXPECTED_VERSION}` (`{EXPECTED_VERSION_CODE}`)",
        f"- Known XAPK hash matched wrapper: **{'yes' if source_hash_match else 'no'}**",
        f"- Known XAPK hash matched an extracted APK: **{', '.join(all_hash_matches) if all_hash_matches else 'no'}**",
        f"- ZIP-like layers expanded: **{len(expanded_dirs)}**",
        "",
        "## APK inventory",
        "",
        "| file | size | dex | native libs | assets | SHA-256 |",
        "|---|---:|---:|---:|---:|---|",
    ]
    for info in sorted(apk_infos, key=lambda item: item.size, reverse=True):
        lines.append(
            f"| `{markdown_escape(info.path)}` | {human_size(info.size)} | "
            f"{len(info.dex_files)} | {info.native_libs} | {info.assets} | `{info.sha256}` |"
        )
    lines += [
        "",
        f"Selected base APK: **`{base_info.path}`** "
        f"({human_size(base_info.size)}, {len(base_info.dex_files)} DEX files).",
        "",
        "## Framework markers",
        "",
    ]
    if frameworks:
        for framework, markers in sorted(frameworks.items()):
            lines.append(f"- **{framework}:** " + "; ".join(f"`{marker}`" for marker in sorted(set(markers))))
    else:
        lines.append("- No Flutter, React Native, Unity, Cordova/Capacitor or obvious Tuya panel marker was detected by filename.")

    lines += [
        "",
        "## Exact protocol strings in raw APK contents",
        "",
    ]
    if exact_raw:
        lines.append("| term | container/member | sample |")
        lines.append("|---|---|---|")
        shown: set[tuple[str, str, str]] = set()
        for hit in exact_raw:
            key = (hit.term.lower(), hit.container, hit.member)
            if key in shown:
                continue
            shown.add(key)
            lines.append(
                f"| `{markdown_escape(hit.term)}` | `{markdown_escape(hit.container)} :: "
                f"{markdown_escape(hit.member)}` | `{markdown_escape(hit.text[:240])}` |"
            )
            if len(shown) >= 100:
                break
    else:
        lines.append(
            "No exact IIC-800 product ID/model string or DP code name was found in DEX, "
            "native-library strings or bundled text assets."
        )

    lines += [
        "",
        "## JADX result",
        "",
        f"- Exit status: **{jadx_status}**",
        f"- Decompiled matching contexts retained: **{len(contexts)}**",
        f"- Source/resource files containing exact IIC-800/DP terms: **{len(direct_files)}**",
    ]
    if direct_files:
        for file_name in direct_files[:100]:
            lines.append(f"  - `{file_name}`")
    lines += [
        "",
        "### Match counts in decompiled text",
        "",
        "| term | count |",
        "|---|---:|",
    ]
    for term, count in term_counts.most_common(100):
        lines.append(f"| `{markdown_escape(term)}` | {count} |")

    lines += [
        "",
        "## Evidence-based interpretation",
        "",
    ]
    if exact_contexts:
        lines.append(
            "1. Exact irrigation datapoint/model strings are present in decompiled code or resources. "
            "The retained context file should be used to trace the enclosing method to the Tuya publish call."
        )
    else:
        lines.append(
            "1. Exact IIC-800 datapoint names were not recovered from decompiled app code/resources. "
            "This is evidence that the product panel/schema is likely supplied dynamically by the Tuya/Thing "
            "panel runtime rather than hard-coded in the INKBIRD shell APK; it is not proof by itself."
        )
    if transport_contexts:
        lines.append(
            "2. Generic Tuya/Thing datapoint transport calls are present. Their enclosing classes are retained "
            "as short contexts, allowing separation of the generic app transport from product-specific payload assembly."
        )
    else:
        lines.append(
            "2. No readable generic datapoint publish-call context was recovered. Obfuscation, JNI/native code, "
            "or a downloaded mini-app may own the command path."
        )
    lines += [
        "3. The report does not infer byte positions merely from UI labels. DP38/DP45 conclusions must be tied "
        "to an exact encoder or to controller before/after captures.",
        "4. Full source and binaries remain only inside the ephemeral CI workspace; `evidence-contexts.txt` contains "
        "short surrounding excerpts for protocol research.",
        "",
        "## Files produced",
        "",
        "- `evidence-contexts.txt` — short JADX excerpts around exact, transport and domain terms.",
        "- `raw-hits.json` — structured string hits from DEX/native libraries/assets.",
        "- `decompiled-contexts.json` — structured line contexts.",
        "- `apk-inventory.json` — hashes and archive inventory.",
        "- `jadx.log` — decompiler status and diagnostics.",
        "",
        "## Decompiler log tail",
        "",
        "```text",
        *jadx_log[-8000:].splitlines(),
        "```",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--public-url", required=True)
    parser.add_argument("--work-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--jadx-bin", type=Path, required=True)
    args = parser.parse_args()

    work_dir = args.work_dir.resolve()
    output_dir = args.output_dir.resolve()
    download_dir = work_dir / "download"
    expanded_root = work_dir / "expanded"
    scan_temp = work_dir / "scan-temp"
    jadx_output = work_dir / "jadx"
    for directory in (download_dir, expanded_root, scan_temp, output_dir):
        directory.mkdir(parents=True, exist_ok=True)

    bundle_source = download_dir / "inkbird_public_bundle.bin"
    acquisition = download_yandex_public(args.public_url, bundle_source)
    expanded_dirs = recursively_expand_bundle(bundle_source, expanded_root)

    apk_paths = sorted(
        {
            path.resolve()
            for root in [download_dir, expanded_root]
            for path in root.rglob("*.apk")
            if path.is_file()
        }
    )
    if not apk_paths:
        for root in expanded_dirs:
            for path in root.rglob("*"):
                if not path.is_file() or not zipfile.is_zipfile(path):
                    continue
                with zipfile.ZipFile(path) as zf:
                    if any(re.fullmatch(r"(?:.*/)?classes(?:\d+)?\.dex", n, re.I) for n in zf.namelist()):
                        apk_paths.append(path.resolve())
    if not apk_paths:
        raise RuntimeError("No APK containing classes*.dex found after expanding the public bundle")

    apk_infos = [apk_info(path, work_dir) for path in apk_paths]
    base_info = max(apk_infos, key=lambda info: info.candidate_base_score)
    base_path = work_dir / base_info.path

    frameworks = framework_markers(apk_paths)

    raw_hits: list[Hit] = []
    exact_hit_apks: set[Path] = set()
    for index, apk_path in enumerate(apk_paths):
        relative = str(apk_path.relative_to(work_dir))
        current_hits = scan_apk(apk_path, relative, scan_temp / f"apk_{index:02d}")
        raw_hits.extend(current_hits)
        if any(EXACT_RE.search(hit.text) for hit in current_hits):
            exact_hit_apks.add(apk_path)

    jadx_targets = [base_path]
    for candidate in sorted(exact_hit_apks, key=lambda path: path.stat().st_size, reverse=True):
        if candidate not in jadx_targets and len(jadx_targets) < 3:
            jadx_targets.append(candidate)

    jadx_status, jadx_log = run_jadx(args.jadx_bin.resolve(), jadx_targets, jadx_output)
    contexts, term_counts = collect_decompiled_contexts(jadx_output)
    direct_files = find_direct_source_files(contexts)

    write_context_file(contexts, output_dir / "evidence-contexts.txt")
    (output_dir / "raw-hits.json").write_text(
        json.dumps([asdict(hit) for hit in raw_hits], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (output_dir / "decompiled-contexts.json").write_text(
        json.dumps(contexts, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (output_dir / "apk-inventory.json").write_text(
        json.dumps(
            {
                "acquisition": acquisition,
                "apks": [asdict(info) for info in apk_infos],
                "selected_base": asdict(base_info),
                "frameworks": frameworks,
                "jadx_targets": [str(path.relative_to(work_dir)) for path in jadx_targets],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (output_dir / "jadx.log").write_text(jadx_log, encoding="utf-8")
    report = build_report(
        acquisition=acquisition,
        bundle_source=bundle_source,
        bundle_root=expanded_root,
        apk_infos=apk_infos,
        base_info=base_info,
        frameworks=frameworks,
        raw_hits=raw_hits,
        contexts=contexts,
        term_counts=term_counts,
        direct_files=direct_files,
        jadx_status=jadx_status,
        jadx_log=jadx_log,
        expanded_dirs=expanded_dirs,
    )
    (output_dir / "report.md").write_text(report, encoding="utf-8")
    print(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
