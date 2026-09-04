#!/usr/bin/env python3
"""Extract exact IIC-800 protocol-facing methods from retained JADX evidence.

The full APK and full decompiled source are deliberately not stored in the
repository.  ``command-class-evidence.md`` contains line-numbered excerpts from
selected classes.  This script reconstructs the available source lines,
extracts complete method bodies where possible, and emits a compact protocol
reference suitable for review and implementation.
"""

from __future__ import annotations

import argparse
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


CLASS_HEADING_RE = re.compile(r"^## `(?P<class>[^`]+)`\s*$")
CODE_FENCE_RE = re.compile(r"^```(?:java)?\s*$")
NUMBERED_LINE_RE = re.compile(r"^(?P<number>\d{5,6}): (?P<text>.*)$")
SEND_COMMAND_RE = re.compile(
    r'DeviceUtils\.sendCommand\(\\?"(?P<dp>\d+)\\?"\s*,\s*(?P<payload>.+?),\s*'
)


@dataclass(frozen=True)
class MethodSpec:
    class_name: str
    method_name: str
    signature_fragment: str


METHODS = (
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.model.Iic800Model",
        "parseZoneInfo",
        "parseZoneInfo(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800Presenter",
        "initNormalTime",
        "initNormalTime(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800Presenter",
        "getWateringTime",
        "getWateringTime(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800Presenter",
        "clearAlarm",
        "clearAlarm(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800Presenter",
        "onDpUpdate",
        "onDpUpdate(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter",
        "stopManual",
        "stopManual(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter",
        "stopAllManual",
        "stopAllManual(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter",
        "startManuals",
        "startManuals(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter",
        "startManuals2",
        "startManuals2(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter",
        "changeManuals",
        "changeManuals(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter",
        "startAllManual",
        "startAllManual(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter",
        "changeAllManual",
        "changeAllManual(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter",
        "getPowerStatus",
        "getPowerStatus(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter",
        "startManuals",
        "startManuals(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter",
        "stopManual",
        "stopManual(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter",
        "setPlan",
        "setPlan(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter",
        "parseIICZoneBean",
        "parseIICZoneBean(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter",
        "setScheduleTime",
        "setScheduleTime(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800AddPlanPresenter",
        "reset",
        "reset(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800AddPlanPresenter",
        "setPlan",
        "setPlan(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800AddPlanPresenter",
        "parseIICZoneBean",
        "parseIICZoneBean(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter",
        "changeRainSensor",
        "changeRainSensor(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter",
        "changeMainValve",
        "changeMainValve(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter",
        "changeSeaAdjValue",
        "changeSeaAdjValue(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter",
        "resetDevice",
        "resetDevice(",
    ),
    MethodSpec(
        "com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter",
        "setPowerStatus",
        "setPowerStatus(",
    ),
)


def strip_java_strings_and_comments(line: str) -> str:
    """Return a brace-counting approximation with strings/comments removed."""
    result: list[str] = []
    index = 0
    in_string = False
    quote = ""
    while index < len(line):
        char = line[index]
        if not in_string and index + 1 < len(line) and line[index : index + 2] == "//":
            break
        if in_string:
            if char == "\\":
                index += 2
                continue
            if char == quote:
                in_string = False
            index += 1
            continue
        if char in {'"', "'"}:
            in_string = True
            quote = char
            index += 1
            continue
        result.append(char)
        index += 1
    return "".join(result)


def parse_evidence(path: Path) -> dict[str, dict[int, str]]:
    classes: dict[str, dict[int, str]] = defaultdict(dict)
    current_class: str | None = None
    in_code = False
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        heading = CLASS_HEADING_RE.match(raw_line)
        if heading:
            current_class = heading.group("class")
            in_code = False
            continue
        if CODE_FENCE_RE.match(raw_line):
            in_code = not in_code
            continue
        if not in_code or current_class is None:
            continue
        numbered = NUMBERED_LINE_RE.match(raw_line)
        if numbered:
            classes[current_class][int(numbered.group("number"))] = numbered.group("text")
    return dict(classes)


def contiguous_source(lines: dict[int, str]) -> list[tuple[int, str]]:
    return sorted(lines.items())


def extract_method(
    lines: dict[int, str], signature_fragment: str
) -> tuple[list[tuple[int, str]], bool]:
    ordered = contiguous_source(lines)
    starts = [
        position
        for position, (_line_no, text) in enumerate(ordered)
        if signature_fragment in text
        and not text.lstrip().startswith(("//", "*"))
        and ("(" in text)
    ]
    if not starts:
        return [], False

    # Prefer a declaration over a call site.
    declaration_tokens = (" public ", " private ", " protected ", " static ")
    start = starts[0]
    for candidate in starts:
        padded = f" {ordered[candidate][1].strip()} "
        if any(token in padded for token in declaration_tokens):
            start = candidate
            break

    extracted: list[tuple[int, str]] = []
    brace_depth = 0
    saw_open = False
    previous_number: int | None = None
    complete = False
    for line_no, text in ordered[start:]:
        if previous_number is not None and line_no != previous_number + 1:
            break
        previous_number = line_no
        extracted.append((line_no, text))
        structural = strip_java_strings_and_comments(text)
        opens = structural.count("{")
        closes = structural.count("}")
        if opens:
            saw_open = True
        brace_depth += opens - closes
        if saw_open and brace_depth == 0:
            complete = True
            break
    return extracted, complete


def command_rows(methods: list[tuple[MethodSpec, list[tuple[int, str]], bool]]) -> list[tuple[str, str, str, str]]:
    rows: list[tuple[str, str, str, str]] = []
    for spec, method_lines, _complete in methods:
        for line_no, text in method_lines:
            if "DeviceUtils.sendCommand" not in text:
                continue
            match = SEND_COMMAND_RE.search(text)
            if match:
                rows.append(
                    (
                        spec.class_name.rsplit(".", 1)[-1],
                        spec.method_name,
                        match.group("dp"),
                        match.group("payload").strip(),
                    )
                )
            else:
                rows.append(
                    (
                        spec.class_name.rsplit(".", 1)[-1],
                        spec.method_name,
                        "?",
                        f"line {line_no}: {text.strip()}",
                    )
                )
    return rows


def derive_findings(
    classes: dict[str, dict[int, str]],
    methods: list[tuple[MethodSpec, list[tuple[int, str]], bool]],
) -> list[str]:
    corpus = "\n".join(text for lines in classes.values() for text in lines.values())
    findings: list[str] = []

    checks = (
        (
            'DeviceUtils.sendCommand("45", "0101"',
            "DP45 `01 01` — старт выбранных зон в последовательном режиме.",
        ),
        (
            'DeviceUtils.sendCommand("45", "0201"',
            "DP45 `02 01` — изменение уже запущенного набора выбранных зон.",
        ),
        (
            'DeviceUtils.sendCommand("45", "0100"',
            "DP45 `01 00` — старт/сброс общего (одновременного) режима; с нулевыми банками штатное приложение выполняет общий стоп.",
        ),
        (
            'DeviceUtils.sendCommand("45", "0200"',
            "DP45 `02 00` — изменение уже запущенного общего/одновременного режима.",
        ),
        (
            'DeviceUtils.sendCommand("45", "00000000000000000000000000000000000000000000000000000000000000000000"',
            "DP45 `00 00` + 32 нулевых байта — безопасный запрос актуальных ручных времён, а не команда остановки.",
        ),
        (
            '1 << (iicZoneBean.getZoneId() - 1)',
            "DP38 при записи использует one-hot маску зоны `1 << (zone - 1)`.",
        ),
        (
            'setEnable(Integer.valueOf(string.substring(38, 39), 16).intValue() != 0)',
            "Старшая тетрада байта 19 DP38 — отдельный флаг включения программы.",
        ),
        (
            'setSeaAdjSwitch(Integer.valueOf(string.substring(39, 40), 16).intValue() != 0)',
            "Младшая тетрада байта 19 DP38 — отдельный зональный флаг, названный в bean `SeaAdjSwitch`.",
        ),
        (
            'sensorGroup.getCheckedRadioButtonId() != R.id.rb_sensor_yes',
            "По коду Activity поле `SeaAdjSwitch` связано с переключателем «Obey/Ignore Rain Sensor», а не с глобальным DP103.",
        ),
        (
            'DeviceUtils.sendCommand("102"',
            "DP102 — глобальное включение/выключение входа датчика дождя.",
        ),
        (
            'DeviceUtils.sendCommand("103"',
            "DP103 — прямое целочисленное значение сезонной коррекции.",
        ),
        (
            'DeviceUtils.sendCommand("109", true',
            "DP109 `true` — подтверждённая штатная команда очистки/приглушения временной тревоги.",
        ),
    )
    for needle, statement in checks:
        if needle in corpus:
            findings.append(statement)

    complete_count = sum(1 for _spec, extracted, complete in methods if extracted and complete)
    found_count = sum(1 for _spec, extracted, _complete in methods if extracted)
    findings.append(
        f"Из доказательных фрагментов восстановлено {found_count} целевых методов; "
        f"{complete_count} имеют полный баланс фигурных скобок в сохранённом диапазоне."
    )
    return findings


def format_method(method_lines: list[tuple[int, str]]) -> str:
    return "\n".join(f"{line_no:05d}: {text}" for line_no, text in method_lines)


def build_report(
    source: Path,
    classes: dict[str, dict[int, str]],
    methods: list[tuple[MethodSpec, list[tuple[int, str]], bool]],
) -> str:
    rows = command_rows(methods)
    findings = derive_findings(classes, methods)
    output: list[str] = [
        "# IIC-800 — точные методы команд из APK INKBIRD 2.1.11",
        "",
        f"> Автоматически извлечено из `{source.as_posix()}`. Полный APK и полный декомпилированный исходник в репозитории не хранятся.",
        "",
        "## Выводы, непосредственно подтверждённые кодом",
        "",
    ]
    output.extend(f"{index}. {finding}" for index, finding in enumerate(findings, 1))
    output.extend(
        [
            "",
            "## Все найденные отправки DP в целевых методах",
            "",
            "| Класс | Метод | DP | Выражение значения |",
            "|---|---|---:|---|",
        ]
    )
    if rows:
        for class_name, method_name, dp, payload in rows:
            escaped = payload.replace("|", "\\|")
            output.append(f"| `{class_name}` | `{method_name}` | `{dp}` | `{escaped}` |")
    else:
        output.append("| — | — | — | Отправки не найдены в сохранённых диапазонах |")

    output.extend(
        [
            "",
            "## Протокольная матрица DP45",
            "",
            "| command | mode | Штатное назначение | Банки времени |",
            "|---:|---:|---|---|",
            "| `00` | `00` | запрос/обновление телеметрии ручного полива | 16 × `0000` |",
            "| `01` | `01` | старт выбранных зон по очереди; также пересборка/остановка выбранной зоны | первый банк — длительность/остаток, второй — уже полито |",
            "| `02` | `01` | изменить действующую последовательную операцию | первый банк — новое значение, второй — уже полито |",
            "| `01` | `00` | старт всех зон одновременно; при нулевых банках — общий стоп | восемь значений + восемь значений |",
            "| `02` | `00` | изменить действующую одновременную операцию | восемь значений + восемь значений |",
            "",
            "`mode=01` соответствует последовательному набору зон, `mode=00` — одновременному/общему режиму. В APK этот байт называется `manualMode`; он считывается из байта 1 отчёта DP45.",
            "",
            "## Точный хвост DP38",
            "",
            "Штатный декодер приложения разбирает последние два HEX-символа независимо:",
            "",
            "```text",
            "char 38 (старшая тетрада byte 19) → enable программы зоны",
            "char 39 (младшая тетрада byte 19) → per-zone Obey/Ignore Rain Sensor",
            "```",
            "",
            "Название bean-поля `SeaAdjSwitch` вводит в заблуждение. Activity связывает его с `sensorGroup` и ресурсами `iic800_rain_sensor_obey` / `iic800_rain_sensor_ignore`. Сезонная коррекция передаётся отдельно через числовой DP103.",
            "",
            "## Извлечённые методы",
            "",
        ]
    )

    for spec, extracted, complete in methods:
        output.extend(
            [
                f"### `{spec.class_name}.{spec.method_name}`",
                "",
                f"Статус: **{'полный метод' if complete else 'частичный сохранённый диапазон' if extracted else 'не найден'}**.",
                "",
            ]
        )
        if extracted:
            output.extend(["```java", format_method(extracted), "```", ""])
        else:
            output.append("Метод отсутствует в сохранённых доказательных диапазонах.\n")

    return "\n".join(output).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    classes = parse_evidence(args.source)
    methods: list[tuple[MethodSpec, list[tuple[int, str]], bool]] = []
    for spec in METHODS:
        extracted, complete = extract_method(
            classes.get(spec.class_name, {}), spec.signature_fragment
        )
        methods.append((spec, extracted, complete))

    report = build_report(args.source, classes, methods)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(report, encoding="utf-8")
    print(f"Wrote {args.output} ({len(report)} characters)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
