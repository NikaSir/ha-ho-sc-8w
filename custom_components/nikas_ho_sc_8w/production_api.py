"""Production-safe DP38 schedule editing for HO-SC-8W.

The editor performs one explicit user-requested write for one zone.  Every
operation starts from a fresh native 1..8 DP38 snapshot, patches only requested
fields, writes the target zone once using the proven one-hot selector, then
reads all eight zones again and rejects any collateral change.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
import time
from typing import Any

from .const import (
    CONNECTION_MODE_LOCAL,
    DP_ACTIVE_ZONE,
    DP_OPERATION_MODE,
    DP_QUEUED_ZONE,
    NUM_ZONES,
)
from .dp38_transaction import prepare_dp38_transaction, verify_dp38_readback
from .start_probe_api import StartProbeHOSC8WAPI


class ProductionHOSC8WAPI(StartProbeHOSC8WAPI):
    """Native API with a guarded single-zone production schedule writer."""

    @staticmethod
    def _normalize_schedule_patch(schedule: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(schedule, dict):
            raise ValueError("schedule must be an object")

        patch: dict[str, Any] = {}

        if "duration_minutes" in schedule:
            duration = int(schedule["duration_minutes"])
            if not 0 <= duration <= 255:
                raise ValueError("duration_minutes must be 0..255")
            patch["duration_minutes"] = duration

        if "start_times" in schedule:
            raw_times = schedule["start_times"]
            if not isinstance(raw_times, list) or len(raw_times) > 6:
                raise ValueError("start_times must contain at most six values")
            parsed: list[tuple[int, int] | None] = []
            for raw in raw_times:
                value = str(raw or "").strip()
                if not value:
                    # Preserve the physical slot index. A blank value means this
                    # exact slot is FF/FF; later starts must never shift upward.
                    parsed.append(None)
                    continue
                try:
                    hour_text, minute_text = value.split(":", 1)
                    hour, minute = int(hour_text), int(minute_text)
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Invalid start time: {value}") from exc
                if not 0 <= hour <= 23 or not 0 <= minute <= 59:
                    raise ValueError(f"Invalid start time: {value}")
                parsed.append((hour, minute))
            patch["start_times"] = parsed

        mode = str(schedule.get("cycle_mode", "")).strip().lower()
        if mode:
            if mode == "weekly":
                weekdays = schedule.get("weekdays", [])
                if not isinstance(weekdays, list) or not weekdays:
                    raise ValueError("Weekly mode requires at least one weekday")
                patch["cycle_mode"] = 0
                patch["weekdays"] = [str(day).lower() for day in weekdays]
            elif mode == "interval":
                interval = int(schedule.get("interval_days", 0))
                if not 1 <= interval <= 255:
                    raise ValueError("Interval mode requires 1..255 days")
                patch["cycle_mode"] = 3
                patch["interval_days"] = interval
            elif mode in {"odd", "even"}:
                raise ValueError(
                    "Odd/even schedule writes are not enabled until field verification is complete"
                )
            else:
                raise ValueError(f"Unsupported cycle_mode: {mode}")

        if "anchor_date" in schedule:
            raw_date = str(schedule["anchor_date"] or "").strip()
            try:
                parsed_date = date.fromisoformat(raw_date)
            except ValueError as exc:
                raise ValueError("anchor_date must use YYYY-MM-DD") from exc
            if parsed_date < date.today():
                raise ValueError("anchor_date may be today or a future date")
            patch["anchor_date"] = (
                parsed_date.year,
                parsed_date.month,
                parsed_date.day,
            )

        if "rain_sensor_follow" in schedule:
            rain = schedule["rain_sensor_follow"]
            if not isinstance(rain, bool):
                raise ValueError("rain_sensor_follow must be boolean")
            patch["rain_sensor_follow"] = rain

        if "program_enabled" in schedule:
            enabled = schedule["program_enabled"]
            if not isinstance(enabled, bool):
                raise ValueError("program_enabled must be boolean")
            # The program enable flag is the high nibble of DP38 byte 19.  The
            # patch builder changes that nibble only and preserves the low
            # rain-follow nibble byte-for-byte when it is not part of this edit.
            patch["program_enabled"] = enabled

        if not patch:
            raise ValueError("No schedule fields were supplied")
        return patch

    def apply_zone_schedule(self, zone: int, schedule: dict[str, Any]) -> dict[str, Any]:
        """Apply one zone draft with fresh preflight and full 1..8 read-back."""
        zone = int(zone)
        if not 1 <= zone <= NUM_ZONES:
            raise ValueError("zone must be 1..8")
        patch = self._normalize_schedule_patch(schedule)
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("Schedule editing is available only over the local transport")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller action is still in progress")

        dispatched = False
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if str(self.device.operation_mode).lower() != "auto":
                    raise RuntimeError("Set the controller to ON/Auto before editing a schedule")
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before applying schedule changes")

                self._collect_zone8_dp38_samples(
                    timeout_seconds=35.0,
                    required_zones=set(range(1, NUM_ZONES + 1)),
                    max_requests=80,
                )
                required_safety = {DP_OPERATION_MODE, DP_ACTIVE_ZONE, DP_QUEUED_ZONE}
                seen_safety = set(
                    self.device.zone8_hex_probe_trace.get("safety_dps_seen", [])
                )
                if not required_safety.issubset(seen_safety):
                    raise RuntimeError("Fresh DP101/107/108 safety state was not received")
                if str(self.device.operation_mode).lower() != "auto":
                    raise RuntimeError("Controller left Auto during schedule preflight")
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Watering started during schedule preflight")

                before = self._build_full_dp38_snapshot()
                source = bytes.fromhex(str(before[zone]["raw_hex"]))
                plan = prepare_dp38_transaction(source, **patch)
                if not plan.changed:
                    return {
                        "verified": True,
                        "changed": False,
                        "zone": zone,
                        "writes_performed": 0,
                        "diff": plan.as_dict()["diff"],
                    }

                self._write_dp38_mask_block(plan.write_block, zone)
                dispatched = True
                time.sleep(0.7)

                self._collect_zone8_dp38_samples(
                    timeout_seconds=35.0,
                    required_zones=set(range(1, NUM_ZONES + 1)),
                    max_requests=80,
                )
                after = self._build_full_dp38_snapshot()
                actual = bytes.fromhex(str(after[zone]["raw_hex"]))

                # The post-write snapshot is factual controller state even when
                # it does not equal our expected frame. Publish it before any
                # mismatch exception so the UI never remains on a stale baseline.
                for entry in after.values():
                    if entry.get("valid"):
                        self.device.ingest_schedule_block(
                            bytes.fromhex(str(entry["raw_hex"])), source="controller"
                        )

                verification = verify_dp38_readback(plan, actual)
                if not verification["verified"]:
                    mismatch_fields = sorted(
                        {str(item.get("field", "byte")) for item in verification.get("mismatches", [])}
                    )
                    detail = ", ".join(mismatch_fields) or "unknown field"
                    raise RuntimeError(
                        "DP38 write was sent once but target read-back did not match "
                        f"({detail}); do not repeat"
                    )

                collateral: list[int] = []
                for other in range(1, NUM_ZONES + 1):
                    if other == zone:
                        continue
                    if before[other]["raw_hex"] != after[other]["raw_hex"]:
                        collateral.append(other)
                if collateral:
                    raise RuntimeError(
                        "DP38 write changed neighbouring zones "
                        + ", ".join(map(str, collateral))
                        + "; do not repeat"
                    )

                return {
                    "verified": True,
                    "changed": True,
                    "zone": zone,
                    "writes_performed": 1,
                    "source_read_hex": plan.source_hex,
                    "write_hex": plan.write_hex,
                    "expected_read_hex": plan.expected_read_hex,
                    "actual_read_hex": actual.hex().upper(),
                    "diff": plan.as_dict()["diff"],
                    "collateral_changed_zones": [],
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                }
        except Exception:
            if dispatched:
                # No retry and no automatic rollback after an uncertain dispatch.
                pass
            raise
        finally:
            self._command_lock.release()
