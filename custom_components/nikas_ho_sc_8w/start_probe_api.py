"""Guarded Zone-7 start-time research extension.

This layer adds only the fixed read/dry-run target start_time_1=06:30.  It
reuses the proven generic Zone-7 transaction writer and refuses to prepare the
plan unless all six start slots are empty in the freshly read source block.
"""

from __future__ import annotations

from typing import Any

from .manual_api import NativeManualHOSC8WAPI


class StartProbeHOSC8WAPI(NativeManualHOSC8WAPI):
    """Native API plus one guarded start-time laboratory target."""

    @staticmethod
    def _zone7_lab_patch_kwargs(field: str, raw_value: str) -> dict[str, Any]:
        field_name = str(field).strip()
        value = str(raw_value).strip()
        if field_name == "start_time_1":
            if value != "06:30":
                raise ValueError("The guarded Zone 7 start-time probe only allows 06:30")
            return {"start_times": [(6, 30)]}
        return NativeManualHOSC8WAPI._zone7_lab_patch_kwargs(field_name, value)

    def prepare_zone7_lab(self, field: str, value: str) -> dict[str, Any]:
        """Prepare generic lab transaction, adding strict empty-bank guard for time probe."""
        result = super().prepare_zone7_lab(field, value)
        if str(field).strip() != "start_time_1":
            return result

        plan = getattr(self.device, "zone7_lab_plan", None)
        if not isinstance(plan, dict):
            raise RuntimeError("Zone 7 start-time dry-run was not retained")
        try:
            source = bytes.fromhex(str(plan["source_read_hex"]))
        except (KeyError, TypeError, ValueError) as exc:
            self.device.zone7_lab_plan = None
            raise RuntimeError("Zone 7 start-time source block is invalid") from exc

        # Hours are bytes 2..7 and minutes are bytes 8..13.  For this first
        # time-field experiment we accept only the already observed empty bank.
        if source[2:8] != b"\xFF" * 6 or source[8:14] != b"\xFF" * 6:
            self.device.zone7_lab_plan = None
            self.device.zone7_lab_result = {
                "status": "blocked",
                "field": "start_time_1",
                "value": "06:30",
                "reason": "Zone 7 start-time bank is not fully empty",
                "source_read_hex": source.hex().upper(),
            }
            raise RuntimeError(
                "Zone 7 start-time probe requires all six source slots to be empty"
            )

        expected_offsets = {0, 2, 8}
        offsets = {
            int(item.get("offset"))
            for item in result.get("diff", [])
            if isinstance(item, dict) and item.get("offset") is not None
        }
        if offsets != expected_offsets:
            self.device.zone7_lab_plan = None
            self.device.zone7_lab_result = {
                "status": "blocked",
                "field": "start_time_1",
                "value": "06:30",
                "reason": f"Unexpected dry-run offsets: {sorted(offsets)}",
                "source_read_hex": source.hex().upper(),
            }
            raise RuntimeError(
                "Zone 7 start-time dry-run must change only selector, hour and minute bytes"
            )
        return result
