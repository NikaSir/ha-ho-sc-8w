"""Guarded Zone-7 weekly multi-day mask probe.

This layer preserves every previously verified DP38 laboratory path and adds
one fixed experiment only: Weekly Tuesday (0x04) -> Tuesday+Thursday (0x14).
"""

from __future__ import annotations

from typing import Any

from .start_probe_api import StartProbeHOSC8WAPI


class WeekdayComboProbeHOSC8WAPI(StartProbeHOSC8WAPI):
    """Start-probe API plus one guarded multi-day weekly-mask target."""

    @staticmethod
    def _zone7_lab_patch_kwargs(field: str, raw_value: str) -> dict[str, Any]:
        field_name = str(field).strip()
        value = str(raw_value).strip()
        if field_name == "weekdays" and value == "tue,thu":
            return {"cycle_mode": 0, "weekdays": ["tue", "thu"]}
        return StartProbeHOSC8WAPI._zone7_lab_patch_kwargs(field_name, value)

    @staticmethod
    def _validate_zone7_weekday_plan(plan: dict[str, Any]) -> None:
        """Validate the fixed Weekly Tuesday -> Tuesday+Thursday experiment."""
        if not isinstance(plan, dict):
            raise ValueError("Zone 7 weekday dry-run was not retained")
        if plan.get("field") != "weekdays" or plan.get("value") != "tue,thu":
            return StartProbeHOSC8WAPI._validate_zone7_weekday_plan(plan)

        source = bytes.fromhex(str(plan.get("source_read_hex", "")))
        expected_source = bytes.fromhex(
            "0711060C17FFFFFF1E2D3BFFFFFF00041A090410"
        )
        if source != expected_source:
            raise ValueError(
                "Zone 7 must exactly match confirmed Weekly/Tuesday state "
                "before the Tuesday+Thursday probe"
            )

        expected = bytearray(source)
        expected[15] = 0x14
        write = bytearray(expected)
        write[0] = 0x40
        if (
            bytes.fromhex(str(plan.get("write_hex", ""))) != bytes(write)
            or bytes.fromhex(str(plan.get("expected_read_hex", ""))) != bytes(expected)
        ):
            raise ValueError(
                "Zone 7 multi-day weekday probe must change only byte 15: 04 -> 14"
            )

        changes = [
            (item["offset"], item["before"], item["after"])
            for item in plan.get("diff", [])
        ]
        if changes != [(0, "07", "40"), (15, "04", "14")]:
            raise ValueError("Unexpected Zone 7 multi-day weekday dry-run diff")
