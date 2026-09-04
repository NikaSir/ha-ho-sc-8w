"""Guarded Zone-7 start-time research extension.

This layer exposes only fixed laboratory time-bank targets. It reuses the
proven generic Zone-7 transaction writer and refuses to prepare a plan unless
the freshly read source matches the exact state expected from the preceding
confirmed experiment.
"""

from __future__ import annotations

from typing import Any

from .manual_api import NativeManualHOSC8WAPI


class StartProbeHOSC8WAPI(NativeManualHOSC8WAPI):
    """Native API plus guarded Zone-7 start-time laboratory targets."""

    @staticmethod
    def _zone7_lab_patch_kwargs(field: str, raw_value: str) -> dict[str, Any]:
        field_name = str(field).strip()
        value = str(raw_value).strip()
        if field_name == "start_time_1":
            if value == "06:30":
                return {"start_times": [(6, 30)]}
            if value == "06:30,12:45":
                return {"start_times": [(6, 30), (12, 45)]}
            if value == "06:30,12:45,23:59":
                return {"start_times": [(6, 30), (12, 45), (23, 59)]}
            raise ValueError(
                "The guarded Zone 7 start-time probe only allows 06:30, 06:30,12:45 or 06:30,12:45,23:59"
            )
        return NativeManualHOSC8WAPI._zone7_lab_patch_kwargs(field_name, value)

    def prepare_zone7_lab(self, field: str, value: str) -> dict[str, Any]:
        """Prepare generic lab transaction with strict source-state guards."""
        result = super().prepare_zone7_lab(field, value)
        if str(field).strip() != "start_time_1":
            return result

        target = str(value).strip()
        plan = getattr(self.device, "zone7_lab_plan", None)
        if not isinstance(plan, dict):
            raise RuntimeError("Zone 7 start-time dry-run was not retained")
        try:
            source = bytes.fromhex(str(plan["source_read_hex"]))
        except (KeyError, TypeError, ValueError) as exc:
            self.device.zone7_lab_plan = None
            raise RuntimeError("Zone 7 start-time source block is invalid") from exc

        hours = source[2:8]
        minutes = source[8:14]
        if target == "06:30":
            source_ok = hours == b"\xFF" * 6 and minutes == b"\xFF" * 6
            expected_offsets = {0, 2, 8}
            reason = "Zone 7 start-time bank is not fully empty"
        elif target == "06:30,12:45":
            source_ok = (
                hours == bytes((0x06, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF))
                and minutes == bytes((0x1E, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF))
            )
            expected_offsets = {0, 3, 9}
            reason = "Zone 7 must contain only Start 1 = 06:30 before the Start 2 probe"
        elif target == "06:30,12:45,23:59":
            source_ok = (
                hours == bytes((0x06, 0x0C, 0xFF, 0xFF, 0xFF, 0xFF))
                and minutes == bytes((0x1E, 0x2D, 0xFF, 0xFF, 0xFF, 0xFF))
            )
            expected_offsets = {0, 4, 10}
            reason = "Zone 7 must contain Start 1 = 06:30, Start 2 = 12:45 and empty slots 3-6 before the Start 3 probe"
        else:
            self.device.zone7_lab_plan = None
            raise RuntimeError("Unsupported guarded Zone 7 start-time target")

        if not source_ok:
            self.device.zone7_lab_plan = None
            self.device.zone7_lab_result = {
                "status": "blocked",
                "field": "start_time_1",
                "value": target,
                "reason": reason,
                "source_read_hex": source.hex().upper(),
            }
            raise RuntimeError(reason)

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
                "value": target,
                "reason": f"Unexpected dry-run offsets: {sorted(offsets)}",
                "source_read_hex": source.hex().upper(),
            }
            raise RuntimeError(
                "Zone 7 start-time dry-run changed bytes outside the guarded target"
            )
        return result
