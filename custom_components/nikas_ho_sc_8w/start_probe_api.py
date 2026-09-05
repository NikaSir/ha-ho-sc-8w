"""Guarded Zone-7 DP38 research extension.

This layer exposes only fixed laboratory targets. It reuses the proven generic
Zone-7 transaction writer and refuses to prepare a plan unless the freshly read
source matches the exact state expected from preceding confirmed experiments.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from .const import (
    CONNECTION_MODE_LOCAL,
    DP38_SNAPSHOT_CONFIRMATION,
    DP_ACTIVE_ZONE,
    DP_OPERATION_MODE,
    DP_QUEUED_ZONE,
    NUM_ZONES,
)
from .manual_api import NativeManualHOSC8WAPI


class StartProbeHOSC8WAPI(NativeManualHOSC8WAPI):
    """Native API plus guarded Zone-7 laboratory targets."""

    def capture_dp38_snapshot(
        self, phase: str, confirmation: str
    ) -> dict[str, Any]:
        """Capture a baseline during Auto watering without weakening write guards.

        The native DP38 zero-trigger is a read/synchronization operation.  The
        production Program view uses the baseline phase to refresh schedules,
        so an active automatic zone must not make that read-only refresh fail.
        Comparison snapshots retain the base implementation and its historical
        laboratory policy.
        """
        if phase != "baseline":
            return super().capture_dp38_snapshot(phase, confirmation)
        if confirmation != DP38_SNAPSHOT_CONFIRMATION:
            raise PermissionError(
                "Explicit read-only DP38 snapshot confirmation is required"
            )
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("The full DP38 snapshot is local-transport only")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller action is still in progress")
        try:
            with self._io_lock:
                self.device.dp38_snapshot_status = "capturing_baseline"
                self.device.dp38_snapshot_detail = ""
                self._collect_zone8_dp38_samples(
                    timeout_seconds=35.0,
                    required_zones=set(range(1, NUM_ZONES + 1)),
                    max_requests=80,
                )
                self.device.dp38_snapshot_trace = dict(
                    self.device.zone8_hex_probe_trace
                )
                required_safety = {
                    DP_OPERATION_MODE,
                    DP_ACTIVE_ZONE,
                    DP_QUEUED_ZONE,
                }
                seen_safety = set(
                    self.device.zone8_hex_probe_trace.get("safety_dps_seen", [])
                )
                if not required_safety.issubset(seen_safety):
                    raise RuntimeError("Fresh DP101/107/108 safety state was not received")
                if str(self.device.operation_mode).lower() != "auto":
                    raise RuntimeError(
                        "Set the physical controller to ON/Auto before the DP38 snapshot"
                    )

                # Read-only Program refresh is allowed while an automatic zone
                # or controller queue is active.  All DP38 write paths keep
                # their independent idle-controller guards in the base API.
                self.device.dp38_snapshot_trace.update(
                    {
                        "active_watering_allowed": True,
                        "active_zone_at_capture": int(self.device.active_zone or 0),
                        "queued_zone_at_capture": int(self.device.queued_zone or 0),
                    }
                )
                snapshot = self._build_full_dp38_snapshot()
                captured_at = datetime.now(timezone.utc).isoformat()
                for entry in snapshot.values():
                    if entry["valid"]:
                        self.device.ingest_schedule_block(
                            bytes.fromhex(entry["raw_hex"]), source="controller"
                        )

                self.device.dp38_snapshot_baseline = snapshot
                self.device.dp38_snapshot_current = {}
                self.device.dp38_snapshot_diff = {
                    "changed": False,
                    "changed_zones": [],
                    "unchanged_zones": list(range(1, NUM_ZONES + 1)),
                    "changes": [],
                }
                self.device.dp38_snapshot_baseline_at = captured_at
                self.device.dp38_snapshot_current_at = ""
                self.device.dp38_snapshot_status = "baseline_saved"
                self.device.dp38_snapshot_detail = (
                    "Complete read-only baseline for zones 1-8 was saved"
                )
                return {
                    "verified": True,
                    "read_only": True,
                    "writes_performed": 0,
                    "phase": phase,
                    "captured_at": captured_at,
                    "blocks": {
                        str(zone): item["raw_hex"]
                        for zone, item in snapshot.items()
                    },
                    "diff": self.device.dp38_snapshot_diff,
                    "trace": self.device.dp38_snapshot_trace,
                }
        except Exception as exc:
            self.device.dp38_snapshot_status = "incomplete"
            self.device.dp38_snapshot_detail = str(exc)
            raise
        finally:
            self._command_lock.release()

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
        if field_name == "cycle_value" and value == "2":
            return {"interval_days": 2}
        if field_name == "anchor_date":
            if value != "2026-09-04":
                raise ValueError("The guarded Zone 7 date probe only allows 2026-09-04")
            return {"anchor_date": (2026, 9, 4)}
        if field_name == "weekdays":
            if value == "tue":
                return {"cycle_mode": 0, "weekdays": ["tue"]}
            if value == "tue,thu":
                return {"cycle_mode": 0, "weekdays": ["tue", "thu"]}
            raise ValueError(
                "The guarded Zone 7 weekday probe only allows Tuesday or Tuesday+Thursday"
            )
        if field_name == "program_enabled":
            if value != "false":
                raise ValueError("The guarded Zone 7 program flag probe only allows false")
            return {"program_enabled": False}
        return NativeManualHOSC8WAPI._zone7_lab_patch_kwargs(field_name, value)

    @staticmethod
    def _validate_zone7_anchor_date_plan(plan: dict[str, Any]) -> None:
        """Validate every byte, not just offsets, of the fixed date experiment."""
        if not isinstance(plan, dict):
            raise ValueError("Zone 7 date dry-run was not retained")
        if plan.get("field") != "anchor_date" or plan.get("value") != "2026-09-04":
            raise ValueError("Zone 7 date dry-run has an unexpected target")
        source = bytes.fromhex(str(plan.get("source_read_hex", "")))
        expected_source = bytes.fromhex("0711060C17FFFFFF1E2D3BFFFFFF03021A090310")
        if source != expected_source:
            raise ValueError(
                "Zone 7 must match 17 min / 06:30 / 12:45 / 23:59 / "
                "interval 2 days / 03.09.2026 / rain off before the date probe"
            )
        expected = bytearray(source)
        expected[18] = 0x04
        write = bytearray(expected)
        write[0] = 0x40
        if (
            bytes.fromhex(str(plan.get("write_hex", ""))) != bytes(write)
            or bytes.fromhex(str(plan.get("expected_read_hex", ""))) != bytes(expected)
        ):
            raise ValueError("Zone 7 date probe must change only byte 18: 03 -> 04")
        changes = [
            (item["offset"], item["before"], item["after"])
            for item in plan.get("diff", [])
        ]
        if changes != [(0, "07", "40"), (18, "03", "04")]:
            raise ValueError("Unexpected Zone 7 date dry-run diff")

    @staticmethod
    def _validate_zone7_weekday_plan(plan: dict[str, Any]) -> None:
        """Validate fixed Weekly byte-15 experiments."""
        if not isinstance(plan, dict):
            raise ValueError("Zone 7 weekday dry-run was not retained")
        if plan.get("field") != "weekdays":
            raise ValueError("Zone 7 weekday dry-run has an unexpected target")

        target = str(plan.get("value", ""))
        if target == "tue":
            expected_source = bytes.fromhex(
                "0711060C17FFFFFF1E2D3BFFFFFF00021A090410"
            )
            expected_value = 0x04
            expected_diff = [(0, "07", "40"), (15, "02", "04")]
            source_reason = (
                "Zone 7 must exactly match confirmed Weekly/Monday state "
                "before the Tuesday probe"
            )
            diff_reason = "Zone 7 weekday probe must change only byte 15: 02 -> 04"
        elif target == "tue,thu":
            expected_source = bytes.fromhex(
                "0711060C17FFFFFF1E2D3BFFFFFF00041A090410"
            )
            expected_value = 0x14
            expected_diff = [(0, "07", "40"), (15, "04", "14")]
            source_reason = (
                "Zone 7 must exactly match confirmed Weekly/Tuesday state "
                "before the Tuesday+Thursday probe"
            )
            diff_reason = (
                "Zone 7 multi-day weekday probe must change only byte 15: 04 -> 14"
            )
        else:
            raise ValueError("Zone 7 weekday dry-run has an unsupported target")

        source = bytes.fromhex(str(plan.get("source_read_hex", "")))
        if source != expected_source:
            raise ValueError(source_reason)
        expected = bytearray(source)
        expected[15] = expected_value
        write = bytearray(expected)
        write[0] = 0x40
        if (
            bytes.fromhex(str(plan.get("write_hex", ""))) != bytes(write)
            or bytes.fromhex(str(plan.get("expected_read_hex", ""))) != bytes(expected)
        ):
            raise ValueError(diff_reason)
        changes = [
            (item["offset"], item["before"], item["after"])
            for item in plan.get("diff", [])
        ]
        if changes != expected_diff:
            raise ValueError("Unexpected Zone 7 weekday dry-run diff")

    @staticmethod
    def _validate_zone7_program_enabled_plan(plan: dict[str, Any]) -> None:
        """Validate fixed program enabled -> disabled byte-19 experiment."""
        if not isinstance(plan, dict):
            raise ValueError("Zone 7 program-flag dry-run was not retained")
        if plan.get("field") != "program_enabled" or plan.get("value") != "false":
            raise ValueError("Zone 7 program-flag dry-run has an unexpected target")
        source = bytes.fromhex(str(plan.get("source_read_hex", "")))
        expected_source = bytes.fromhex(
            "0711060C17FFFFFF1E2D3BFFFFFF00141A090410"
        )
        if source != expected_source:
            raise ValueError(
                "Zone 7 must exactly match confirmed Weekly Tuesday+Thursday enabled state before the program-off probe"
            )
        expected = bytearray(source)
        expected[19] = 0x00
        write = bytearray(expected)
        write[0] = 0x40
        if (
            bytes.fromhex(str(plan.get("write_hex", ""))) != bytes(write)
            or bytes.fromhex(str(plan.get("expected_read_hex", ""))) != bytes(expected)
        ):
            raise ValueError(
                "Zone 7 program flag probe must change only byte 19: 10 -> 00"
            )
        changes = [
            (item["offset"], item["before"], item["after"])
            for item in plan.get("diff", [])
        ]
        if changes != [(0, "07", "40"), (19, "10", "00")]:
            raise ValueError("Unexpected Zone 7 program-flag dry-run diff")

    def prepare_zone7_lab(self, field: str, value: str) -> dict[str, Any]:
        """Prepare generic lab transaction with strict source-state guards."""
        result = super().prepare_zone7_lab(field, value)
        field_name = str(field).strip()
        target = str(value).strip()
        if field_name == "anchor_date":
            plan = getattr(self.device, "zone7_lab_plan", None)
            try:
                self._validate_zone7_anchor_date_plan(plan)
            except (KeyError, TypeError, ValueError) as exc:
                self.device.zone7_lab_plan = None
                self.device.zone7_lab_result = {
                    "status": "blocked",
                    "field": field_name,
                    "value": target,
                    "reason": str(exc),
                    "source_read_hex": result.get("source_read_hex", ""),
                }
                raise RuntimeError(str(exc)) from exc
            return result
        if field_name == "weekdays":
            plan = getattr(self.device, "zone7_lab_plan", None)
            try:
                self._validate_zone7_weekday_plan(plan)
            except (KeyError, TypeError, ValueError) as exc:
                self.device.zone7_lab_plan = None
                self.device.zone7_lab_result = {
                    "status": "blocked",
                    "field": field_name,
                    "value": target,
                    "reason": str(exc),
                    "source_read_hex": result.get("source_read_hex", ""),
                }
                raise RuntimeError(str(exc)) from exc
            return result
        if field_name == "program_enabled":
            plan = getattr(self.device, "zone7_lab_plan", None)
            try:
                self._validate_zone7_program_enabled_plan(plan)
            except (KeyError, TypeError, ValueError) as exc:
                self.device.zone7_lab_plan = None
                self.device.zone7_lab_result = {
                    "status": "blocked",
                    "field": field_name,
                    "value": target,
                    "reason": str(exc),
                    "source_read_hex": result.get("source_read_hex", ""),
                }
                raise RuntimeError(str(exc)) from exc
            return result
        if field_name not in {"start_time_1", "cycle_value"}:
            return result

        plan = getattr(self.device, "zone7_lab_plan", None)
        if not isinstance(plan, dict):
            raise RuntimeError("Zone 7 guarded dry-run was not retained")
        try:
            source = bytes.fromhex(str(plan["source_read_hex"]))
        except (KeyError, TypeError, ValueError) as exc:
            self.device.zone7_lab_plan = None
            raise RuntimeError("Zone 7 guarded source block is invalid") from exc

        hours = source[2:8]
        minutes = source[8:14]
        if field_name == "cycle_value":
            expected_source = bytes.fromhex("0711060C17FFFFFF1E2D3BFFFFFF03011A090310")
            source_ok = source == expected_source
            expected_offsets = {0, 15}
            reason = (
                "Zone 7 must exactly match the confirmed 17 min / 06:30 / 12:45 / 23:59 / "
                "interval 1 day / 03.09.2026 / rain off state before the interval-2 probe"
            )
        elif target == "06:30":
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
            raise RuntimeError("Unsupported guarded Zone 7 target")

        if not source_ok:
            self.device.zone7_lab_plan = None
            self.device.zone7_lab_result = {
                "status": "blocked",
                "field": field_name,
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
                "field": field_name,
                "value": target,
                "reason": f"Unexpected dry-run offsets: {sorted(offsets)}",
                "source_read_hex": source.hex().upper(),
            }
            raise RuntimeError("Zone 7 guarded dry-run changed bytes outside the target")
        return result
