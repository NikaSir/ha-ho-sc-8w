"""One-zone DP38 editing with fresh all-zone preflight and exact read-back.

Odd/Even use the command format verified on Zone 7. Every edit keeps six
physical start slots, preserves untouched fields, and disables transport
resends. An uncertain result locks schedule writes for this API session.
"""

from __future__ import annotations

from copy import deepcopy
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
from .models import dp38_program_enabled, encode_dp38_weekdays, validate_dp38_block
from .parity_probe_api import dispatch_dp38_once
from .start_probe_api import StartProbeHOSC8WAPI

_ZONES = frozenset(range(1, NUM_ZONES + 1))
_FIELDS = frozenset({
    "duration_minutes", "start_times", "cycle_mode", "weekdays",
    "interval_days", "anchor_date", "rain_sensor_follow", "program_enabled",
})


def _integer(value: Any, name: str, minimum: int, maximum: int) -> int:
    """Do not silently truncate fractional values or treat booleans as numbers."""
    if isinstance(value, bool) or not isinstance(value, (int, str)):
        raise ValueError(f"{name} must be an integer {minimum}..{maximum}")
    try:
        number = int(value)
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer {minimum}..{maximum}") from exc
    if not minimum <= number <= maximum:
        raise ValueError(f"{name} must be {minimum}..{maximum}")
    return number


def _require_idle(api: Any) -> None:
    if api.active_transport != CONNECTION_MODE_LOCAL:
        raise RuntimeError("Schedule editing is available only over the local transport")
    if str(api.device.operation_mode).lower() != "auto":
        raise RuntimeError("Set the controller to ON/Auto before editing a schedule")
    if api.device.active_zone or api.device.queued_zone:
        raise RuntimeError("Stop all watering before applying schedule changes")


def _publish_snapshot(api: Any, snapshot: dict[int, dict[str, Any]]) -> None:
    for zone, entry in snapshot.items():
        try:
            block = bytes.fromhex(str(entry["raw_hex"]))
            validate_dp38_block(block, expected_zone=zone)
        except (KeyError, TypeError, ValueError):
            continue
        api.device.ingest_schedule_block(block, source="controller")


def _partial_snapshot(api: Any) -> dict[int, dict[str, Any]]:
    """Retain only unambiguous, newly collected observations on read failure."""
    variants: dict[int, dict[str, dict[str, Any]]] = {}
    for item in getattr(api.device, "zone8_hex_probe_samples", []):
        try:
            zone = int(item.get("station"))
            block = bytes.fromhex(str(item.get("raw_hex", "")))
            validate_dp38_block(block, expected_zone=zone)
        except (TypeError, ValueError):
            continue
        raw_hex = block.hex().upper()
        entry = deepcopy(item)
        entry.update({"zone": zone, "raw_hex": raw_hex})
        variants.setdefault(zone, {})[raw_hex] = entry
    return {
        zone: next(iter(entries.values()))
        for zone, entries in variants.items() if len(entries) == 1
    }


def _collect_snapshot(api: Any, *, check_safety: bool) -> dict[int, dict[str, Any]]:
    # Clear buffers before collection can fail, so an old baseline cannot be
    # advertised as a factual post-dispatch observation.
    api.device.zone8_hex_probe_samples = []
    api.device.zone8_hex_probe_trace = {}
    try:
        api._collect_zone8_dp38_samples(
            timeout_seconds=35.0,
            required_zones=set(range(1, NUM_ZONES + 1)),
            max_requests=80,
        )
        snapshot = api._build_full_dp38_snapshot()
    except Exception:
        partial = _partial_snapshot(api)
        _publish_snapshot(api, partial)
        api.device.production_schedule_result["latest_observations"] = [
            deepcopy(partial[z]) for z in sorted(partial)
        ]
        raise
    _publish_snapshot(api, snapshot)
    api.device.production_schedule_result["latest_observations"] = [
        deepcopy(snapshot[z]) for z in sorted(snapshot)
    ]
    if set(snapshot) != _ZONES:
        raise RuntimeError("Schedule editing requires all eight fresh DP38 blocks")
    for zone, entry in snapshot.items():
        if entry.get("fresh") is False or entry.get("valid") is False:
            raise RuntimeError(f"Zone {zone} has an invalid or stale DP38 block")
        validate_dp38_block(bytes.fromhex(str(entry["raw_hex"])), expected_zone=zone)
    if check_safety:
        seen = set(api.device.zone8_hex_probe_trace.get("safety_dps_seen", []))
        if not {DP_OPERATION_MODE, DP_ACTIVE_ZONE, DP_QUEUED_ZONE}.issubset(seen):
            raise RuntimeError("Fresh DP101/107/108 safety state was not received")
        _require_idle(api)
    return snapshot


def _validate_calendar_patch(source: bytes, patch: dict[str, Any]) -> None:
    """Resolve optional calendar fields against the fresh controller mode."""
    mode = patch.get("cycle_mode", source[14])
    if mode not in {0, 1, 2, 3}:
        raise ValueError("Unknown schedule mode; explicitly select a supported mode")
    if (source[19] >> 4) not in {0, 1} or (source[19] & 0x0F) not in {0, 1}:
        raise ValueError("Unknown program/rain flags; inspect the source block")
    if "weekdays" in patch and mode != 0:
        raise ValueError("weekdays may only be set for weekly mode")
    if "interval_days" in patch and mode != 3:
        raise ValueError("interval_days may only be set for interval mode")
    if "anchor_date" in patch and mode != 3:
        raise ValueError("anchor_date may only be set for interval mode")
    changing_mode = mode != source[14]
    if changing_mode and mode == 0 and "weekdays" not in patch:
        raise ValueError("Switching to weekly mode requires weekdays")
    if changing_mode and mode == 3 and not {"interval_days", "anchor_date"}.issubset(patch):
        raise ValueError("Switching to interval mode requires interval_days and anchor_date")
    if "anchor_date" in patch:
        chosen = date(*patch["anchor_date"])
        existing = (2000 + source[16], source[17], source[18])
        # An unchanged historical anchor remains valid; changing it (or
        # entering interval mode) requires today or later. Never invent a date.
        if (changing_mode or patch["anchor_date"] != existing) and chosen < date.today():
            raise ValueError("A new anchor_date may be today or a future date")


def _validate_target(block: bytes) -> None:
    """Reject controller normalization triggers before any transport write."""
    mode = block[14]
    enabled = dp38_program_enabled(block[19])
    if mode in {1, 2} and block[15:19] != b"\x00\x00\x00\x00":
        raise ValueError("Odd/Even requires zero period/date bytes; explicitly select its mode to prepare that format")
    if block[1] < 1 and (enabled or mode in {1, 2}):
        raise ValueError("Enabled programs and Odd/Even commands require at least 1 minute")
    if enabled and not any(block[2 + slot] != 0xFF for slot in range(6)):
        raise ValueError("An enabled program must have at least one start time")
    if mode == 0 and not 1 <= block[15] <= 0x7F:
        raise ValueError("Weekly mode requires at least one valid weekday")
    if mode == 3:
        if block[15] < 1:
            raise ValueError("Interval mode requires 1..255 days")
        try:
            date(2000 + block[16], block[17], block[18])
        except ValueError as exc:
            raise ValueError("Interval mode requires a valid anchor_date") from exc


class ProductionHOSC8WAPI(StartProbeHOSC8WAPI):
    """Native API with a guarded single-zone production schedule writer."""

    @staticmethod
    def _normalize_schedule_patch(schedule: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(schedule, dict):
            raise ValueError("schedule must be an object")
        if set(schedule) - _FIELDS:
            raise ValueError("Unknown schedule fields: " + ", ".join(sorted(set(schedule) - _FIELDS)))
        patch: dict[str, Any] = {}
        if "duration_minutes" in schedule:
            patch["duration_minutes"] = _integer(schedule["duration_minutes"], "duration_minutes", 0, 255)
        if "start_times" in schedule:
            raw_times = schedule["start_times"]
            if not isinstance(raw_times, list) or len(raw_times) > 6:
                raise ValueError("start_times must contain at most six values")
            parsed: list[tuple[int, int] | None] = []
            for raw in raw_times:
                if raw is None or raw == "":
                    parsed.append(None)
                    continue
                if not isinstance(raw, str):
                    raise ValueError("Start times must use HH:MM or an empty slot")
                value = raw.strip()
                if not value:
                    parsed.append(None)
                    continue
                try:
                    hour_text, minute_text = value.split(":", 1)
                    hour = _integer(hour_text, "start hour", 0, 23)
                    minute = _integer(minute_text, "start minute", 0, 59)
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Invalid start time: {value}") from exc
                parsed.append((hour, minute))
            patch["start_times"] = parsed
        if "cycle_mode" in schedule:
            mode = str(schedule["cycle_mode"]).strip().lower()
            if mode not in {"weekly", "odd", "even", "interval"}:
                raise ValueError(f"Unsupported cycle_mode: {mode}")
            patch["cycle_mode"] = {"weekly": 0, "odd": 1, "even": 2, "interval": 3}[mode]
        if "weekdays" in schedule:
            days = schedule["weekdays"]
            if not isinstance(days, list) or not days:
                raise ValueError("Weekly mode requires at least one weekday")
            patch["weekdays"] = [str(day).lower() for day in days]
            encode_dp38_weekdays(patch["weekdays"])
        if "interval_days" in schedule:
            patch["interval_days"] = _integer(schedule["interval_days"], "interval_days", 1, 255)
        if "anchor_date" in schedule:
            try:
                parsed_date = date.fromisoformat(str(schedule["anchor_date"]))
            except ValueError as exc:
                raise ValueError("anchor_date must use YYYY-MM-DD") from exc
            if not 2000 <= parsed_date.year <= 2255:
                raise ValueError("anchor year must be 2000..2255")
            patch["anchor_date"] = (parsed_date.year, parsed_date.month, parsed_date.day)
        for field in ("rain_sensor_follow", "program_enabled"):
            if field in schedule:
                if not isinstance(schedule[field], bool):
                    raise ValueError(f"{field} must be boolean")
                patch[field] = schedule[field]
        if not patch:
            raise ValueError("No schedule fields were supplied")
        return patch

    def apply_zone_schedule(self, zone: int, schedule: dict[str, Any]) -> dict[str, Any]:
        """Apply one zone draft with fresh preflight and full 1..8 read-back."""
        zone = _integer(zone, "zone", 1, NUM_ZONES)
        if getattr(self, "_production_schedule_locked", False) or getattr(self, "_zone7_parity_locked", False):
            raise RuntimeError("Schedule writes are locked after an unverified write; inspect the recorded result")
        patch = self._normalize_schedule_patch(schedule)
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("Schedule editing is available only over the local transport")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller action is still in progress")
        attempted = False
        state: dict[str, Any] = {
            "status": "preflight", "zone": zone, "verified": False, "locked": False,
            "dispatch_attempts": 0, "writes_performed": 0,
            "before_snapshot": [], "after_snapshot": [], "latest_observations": [],
        }
        self.device.production_schedule_result = state
        try:
            with self._io_lock:
                # Another caller can finish an uncertain write between the
                # first availability check and this nonblocking acquisition.
                if getattr(self, "_production_schedule_locked", False) or getattr(self, "_zone7_parity_locked", False):
                    raise RuntimeError("Schedule writes are locked after an unverified write; inspect the recorded result")
                self._require_fresh_command_state()
                _require_idle(self)
                before = _collect_snapshot(self, check_safety=True)
                state["before_snapshot"] = [deepcopy(before[z]) for z in sorted(before)]
                source = bytes.fromhex(str(before[zone]["raw_hex"]))
                _validate_calendar_patch(source, patch)
                plan = prepare_dp38_transaction(source, **patch)
                _validate_target(plan.expected_read)
                state.update({
                    "source_read_hex": plan.source_hex, "write_hex": plan.write_hex,
                    "expected_read_hex": plan.expected_read_hex, "diff": plan.as_dict()["diff"],
                })
                if not plan.changed:
                    state.update({"status": "unchanged", "verified": True, "changed": False})
                    return deepcopy(state)
                _require_idle(self)
                attempted = True
                state.update({"status": "writing", "dispatch_attempts": 1, "writes_performed": None})
                try:
                    dispatch_dp38_once(self, plan.write_block, zone)
                except Exception:
                    # A missing ACK may follow a saved command. Reconcile with
                    # one read-only collection while keeping the outcome locked.
                    self._production_schedule_locked = True
                    try:
                        observed = _collect_snapshot(self, check_safety=False)
                        state["after_snapshot"] = [deepcopy(observed[z]) for z in sorted(observed)]
                    except Exception:
                        state["after_snapshot"] = deepcopy(state["latest_observations"])
                    raise
                state.update({"status": "reading", "writes_performed": 1})
                time.sleep(0.7)
                after = _collect_snapshot(self, check_safety=False)
                state["after_snapshot"] = [deepcopy(after[z]) for z in sorted(after)]
                actual = bytes.fromhex(str(after[zone]["raw_hex"]))
                verification = verify_dp38_readback(plan, actual)
                comparison = self._compare_dp38_snapshots(before, after)
                collateral = [z for z in comparison["changed_zones"] if z != zone]
                state.update({
                    "actual_read_hex": actual.hex().upper(), "mismatches": verification["mismatches"],
                    "collateral_changed_zones": collateral, **comparison,
                })
                if not verification["verified"] or collateral:
                    state["status"] = "mismatch"
                    raise RuntimeError("DP38 read-back did not match exactly or another zone changed; no retry or rollback sent")
                state.update({"status": "verified", "verified": True, "changed": True,
                              "completed_at": datetime.now(timezone.utc).isoformat()})
                return deepcopy(state)
        except Exception as exc:
            state.update({"verified": False, "error": str(exc)})
            if attempted:
                # No retry and no automatic rollback after an uncertain dispatch.
                self._production_schedule_locked = True
                state["locked"] = True
                if state["status"] != "mismatch":
                    state["status"] = "uncertain"
                    state["after_snapshot"] = deepcopy(state["latest_observations"])
            else:
                state["status"] = "rejected"
            state["completed_at"] = datetime.now(timezone.utc).isoformat()
            if isinstance(exc, (PermissionError, RuntimeError, TypeError, ValueError)):
                raise
            raise RuntimeError(str(exc)) from exc
        finally:
            self._command_lock.release()
