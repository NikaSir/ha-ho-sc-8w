"""Isolated Zone 7 Odd/Even experiment; no production schedule unlock.

The AddPlan path in INKBIRD 2.1.11 writes mode 1/2 and clears the unused
period/date bytes. This probe reproduces that format while preserving every
other byte from a fresh controller observation. Its read-back must match
exactly; firmware normalization is reported, never accepted silently.
"""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import secrets
import time
from typing import Any

from .const import (
    CONNECTION_MODE_LOCAL,
    DP_ACTIVE_ZONE,
    DP_OPERATION_MODE,
    DP_QUEUED_ZONE,
    NUM_ZONES,
)
from .models import dp38_program_enabled, validate_dp38_block, validate_dp38_write_block

ZONE7_PARITY_CONFIRMATION = "WRITE_ZONE7_PARITY_ONCE"
ZONE7_PARITY_PLAN_TTL = 120.0
_ZONES = frozenset(range(1, NUM_ZONES + 1))


@dataclass(frozen=True)
class _ParityPlan:
    """Private immutable authority; the sensor's preview is never trusted."""

    plan_id: str
    mode: str
    baseline: tuple[bytes, ...]
    write_block: bytes
    expected_block: bytes
    expires_monotonic: float


class Zone7ParityProbeMixin:
    """Methods attached to the integration API; no Home Assistant dependency."""

    def _parity_state(self) -> dict[str, Any]:
        state = getattr(self.device, "zone7_parity_probe", None)
        if not isinstance(state, dict):
            state = {"status": "idle", "zone": 7, "locked": False, "history": []}
            self.device.zone7_parity_probe = state
        return state

    def _parity_require_available(self) -> None:
        if getattr(self, "_zone7_parity_locked", False):
            raise RuntimeError(
                "Zone 7 Odd/Even probes are locked after an unverified write; inspect the recorded result"
            )
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("Zone 7 Odd/Even probes require the local transport")

    def _parity_require_idle(self) -> None:
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("Zone 7 Odd/Even probe lost the local transport")
        if str(self.device.operation_mode).lower() != "auto":
            raise RuntimeError("Set the controller to ON/Auto before the Zone 7 Odd/Even probe")
        if self.device.active_zone or self.device.queued_zone:
            raise RuntimeError("Stop all watering before the Zone 7 Odd/Even probe")

    def _parity_publish_snapshot(self, snapshot: dict[int, dict[str, Any]]) -> None:
        """Publish factual observations, including partial read-back on failure."""
        for zone, entry in snapshot.items():
            try:
                block = bytes.fromhex(str(entry["raw_hex"]))
                validate_dp38_block(block, expected_zone=zone)
            except (KeyError, TypeError, ValueError):
                continue
            self.device.ingest_schedule_block(block, source="controller")

    def _parity_partial_snapshot(self) -> dict[int, dict[str, Any]]:
        """Keep unambiguous observations without inventing missing zones."""
        variants: dict[int, dict[str, dict[str, Any]]] = {}
        for item in getattr(self.device, "zone8_hex_probe_samples", []):
            try:
                zone = int(item.get("station"))
                block = bytes.fromhex(str(item.get("raw_hex", "")))
            except (TypeError, ValueError):
                continue
            if zone not in _ZONES or len(block) != 20 or block[0] != zone:
                continue
            raw_hex = block.hex().upper()
            entry = deepcopy(item)
            entry.update({"zone": zone, "raw_hex": raw_hex})
            variants.setdefault(zone, {})[raw_hex] = entry
        return {
            zone: next(iter(entries.values()))
            for zone, entries in variants.items()
            if len(entries) == 1
        }

    def _parity_collect_snapshot(self, check_safety: bool = True) -> dict[int, dict[str, Any]]:
        """Capture native DP38 reports with no schedule writes or cached fill-in."""
        if check_safety:
            self._require_fresh_command_state()
            self._parity_require_idle()
        # Never allow an exception before the native helper resets its buffer to
        # make a previous collection appear to be this operation's read-back.
        self.device.zone8_hex_probe_samples = []
        self.device.zone8_hex_probe_trace = {}
        try:
            self._collect_zone8_dp38_samples(
                timeout_seconds=35.0,
                required_zones=set(_ZONES),
                max_requests=80,
            )
            snapshot = self._build_full_dp38_snapshot()
        except Exception:
            partial = self._parity_partial_snapshot()
            self._parity_publish_snapshot(partial)
            self._parity_state()["latest_observations"] = [partial[z] for z in sorted(partial)]
            raise
        self._parity_publish_snapshot(snapshot)
        self._parity_state()["latest_observations"] = [deepcopy(snapshot[z]) for z in sorted(snapshot)]
        if set(snapshot) != _ZONES:
            raise RuntimeError("Zone 7 Odd/Even probe requires all eight fresh DP38 blocks")
        for zone, entry in snapshot.items():
            if entry.get("fresh") is False or entry.get("valid") is False:
                raise RuntimeError(f"Zone {zone} has an invalid or stale DP38 block")
            validate_dp38_block(bytes.fromhex(str(entry["raw_hex"])), expected_zone=zone)
        if check_safety:
            seen = set(self.device.zone8_hex_probe_trace.get("safety_dps_seen", []))
            if not {DP_OPERATION_MODE, DP_ACTIVE_ZONE, DP_QUEUED_ZONE}.issubset(seen):
                raise RuntimeError("Fresh DP101/107/108 safety state was not received")
            self._parity_require_idle()
        return snapshot

    def _parity_byte_diff(self, before: bytes, after: bytes) -> list[dict[str, Any]]:
        return [
            {
                "offset": offset,
                "field": self._dp38_snapshot_field(offset),
                "before": f"{old:02X}",
                "after": f"{new:02X}",
            }
            for offset, (old, new) in enumerate(zip(before, after, strict=True))
            if old != new
        ]

    def _parity_dispatch_once(self, block: bytes) -> None:
        """Suppress TinyTuya's internal resends for this experimental write.

        TinyTuya retries set_value on timeout/network errors by default. A
        single Python call is therefore not a single transport attempt unless
        its retry limit is zero. The fresh preflight already opened the socket;
        losing that socket must fail closed instead of reconnecting here.
        """
        transport = self._ensure_connection()
        if (
            transport is None
            or getattr(transport, "socket", None) is None
            or not hasattr(transport, "socketRetryLimit")
            or not hasattr(transport, "retry")
        ):
            raise RuntimeError("A connected local transport with controllable retry policy is required")
        retry_limit, retry = transport.socketRetryLimit, transport.retry
        try:
            transport.socketRetryLimit = 0
            transport.retry = False
            self._write_dp38_mask_block(block, zone=7)
        finally:
            transport.socketRetryLimit = retry_limit
            transport.retry = retry

    def _parity_finish(self) -> dict[str, Any]:
        state = self._parity_state()
        state["completed_at"] = datetime.now(timezone.utc).isoformat()
        state.pop("plan_id", None)
        history = state.get("history", [])
        entry = deepcopy({key: value for key, value in state.items() if key != "history"})
        state["history"] = (list(history) + [entry])[-4:]
        return deepcopy(state)

    def prepare_zone7_parity(self, mode: str) -> dict[str, Any]:
        """Prepare one exact Odd/Even write after a fresh full read; zero writes."""
        if mode not in {"odd", "even"}:
            raise ValueError("mode must be odd or even")
        self._parity_require_available()
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller action is still in progress")
        try:
            with self._io_lock:
                self._zone7_parity_plan = None
                old_history = deepcopy(self._parity_state().get("history", []))
                self.device.zone7_parity_probe = {
                    "status": "preparing", "zone": 7, "mode": mode,
                    "locked": False, "verified": False, "dispatch_attempts": 0,
                    "writes_performed": 0, "history": old_history,
                    "before_snapshot": [], "after_snapshot": [], "changes": [],
                    "changed_zones": [], "collateral_changed_zones": [],
                    "detail": "", "error": "",
                }
                state = self._parity_state()
                before = self._parity_collect_snapshot()
                state["before_snapshot"] = [deepcopy(before[z]) for z in sorted(before)]
                source = bytes.fromhex(str(before[7]["raw_hex"]))
                if source[14] not in {0, 1, 2, 3}:
                    raise ValueError("Zone 7 has an unknown schedule mode; inspect its source block before probing")
                if (source[19] >> 4) not in {0, 1} or (source[19] & 0x0F) not in {0, 1}:
                    raise ValueError("Zone 7 has unknown program/rain flags; inspect its source block before probing")
                if source[1] < 1:
                    raise ValueError(
                        "Set Zone 7 duration to at least 1 minute before this probe; zero-duration normalization must be excluded"
                    )
                if dp38_program_enabled(source[19]) and not any(
                    source[2 + slot] != 0xFF for slot in range(6)
                ):
                    raise ValueError("An enabled Zone 7 program must have at least one start time")
                expected = bytearray(source)
                expected[14] = 1 if mode == "odd" else 2
                expected[15:19] = b"\x00\x00\x00\x00"
                write = bytearray(expected)
                write[0] = 0x40
                validate_dp38_write_block(bytes(write), expected_zone=7)
                state.update({
                    "source_read_hex": source.hex().upper(),
                    "write_hex": bytes(write).hex().upper(),
                    "expected_read_hex": bytes(expected).hex().upper(),
                    "expected_diff": self._parity_byte_diff(source, bytes(expected)),
                    "confirmation": ZONE7_PARITY_CONFIRMATION,
                })
                if source == bytes(expected):
                    state.update({"status": "noop", "detail": "Zone 7 already contains the exact requested Odd/Even format; no write prepared"})
                    return self._parity_finish()
                now = datetime.now(timezone.utc)
                plan = _ParityPlan(
                    plan_id=secrets.token_urlsafe(24), mode=mode,
                    baseline=tuple(bytes.fromhex(str(before[z]["raw_hex"])) for z in sorted(_ZONES)),
                    write_block=bytes(write), expected_block=bytes(expected),
                    expires_monotonic=time.monotonic() + ZONE7_PARITY_PLAN_TTL,
                )
                self._zone7_parity_plan = plan
                state.update({
                    "status": "prepared", "plan_id": plan.plan_id,
                    "prepared_at": now.isoformat(),
                    "expires_at": (now + timedelta(seconds=ZONE7_PARITY_PLAN_TTL)).isoformat(),
                    "detail": "Prepared from all eight fresh zones; no write sent",
                })
                return deepcopy(state)
        except Exception as exc:
            self._zone7_parity_plan = None
            self._parity_state().update({"status": "rejected", "detail": str(exc), "error": str(exc)})
            self._parity_state().pop("plan_id", None)
            raise
        finally:
            self._command_lock.release()

    def execute_zone7_parity(self, plan_id: str, confirmation: str) -> dict[str, Any]:
        """Consume one prepared plan and dispatch once, then verify all zones."""
        if confirmation != ZONE7_PARITY_CONFIRMATION:
            raise PermissionError("Explicit Zone 7 Odd/Even write confirmation is required")
        self._parity_require_available()
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller action is still in progress")
        attempted = False
        try:
            with self._io_lock:
                state = self._parity_state()
                plan = getattr(self, "_zone7_parity_plan", None)
                if not isinstance(plan, _ParityPlan) or plan.plan_id != plan_id:
                    raise RuntimeError("The prepared Zone 7 Odd/Even plan is missing or no longer matches")
                # Remove the authority immediately: even failed preflight needs
                # a newly prepared, explicitly reviewed transaction.
                self._zone7_parity_plan = None
                state.pop("plan_id", None)
                if time.monotonic() >= plan.expires_monotonic:
                    state["status"] = "expired"
                    raise RuntimeError("Zone 7 Odd/Even plan expired; prepare a fresh plan")
                state["status"] = "preflight"
                before = self._parity_collect_snapshot()
                current = tuple(bytes.fromhex(str(before[z]["raw_hex"])) for z in sorted(_ZONES))
                state["preflight_snapshot"] = [deepcopy(before[z]) for z in sorted(before)]
                if current != plan.baseline:
                    state["status"] = "stale"
                    state["preflight_changed_zones"] = [
                        z for z in sorted(_ZONES) if current[z - 1] != plan.baseline[z - 1]
                    ]
                    raise RuntimeError("A zone changed since preparation; no write sent, prepare a fresh plan")
                # Collection can take 35 seconds; the lifetime must still hold
                # at the actual dispatch, not only when the service was called.
                if time.monotonic() >= plan.expires_monotonic:
                    state["status"] = "expired"
                    raise RuntimeError("Zone 7 Odd/Even plan expired during preflight; no write sent")
                self._parity_require_idle()
                state.update({"status": "writing", "dispatch_attempts": 1, "writes_performed": None})
                attempted = True
                self._parity_dispatch_once(plan.write_block)
                state.update({"status": "reading", "writes_performed": 1})
                # Use a fresh native all-zone collection, never the command
                # response alone, to establish the actual saved state.
                after = self._parity_collect_snapshot(check_safety=False)
                state["after_snapshot"] = [deepcopy(after[z]) for z in sorted(after)]
                actual = bytes.fromhex(str(after[7]["raw_hex"]))
                changes = self._compare_dp38_snapshots(before, after)
                collateral = [z for z in changes["changed_zones"] if z != 7]
                mismatch = self._parity_byte_diff(plan.expected_block, actual)
                state.update({
                    "actual_read_hex": actual.hex().upper(),
                    "changes": changes["changes"],
                    "changed_zones": changes["changed_zones"],
                    "unchanged_zones": changes["unchanged_zones"],
                    "collateral_changed_zones": collateral,
                    "mismatches": mismatch,
                })
                if mismatch or collateral:
                    state["status"] = "mismatch"
                    raise RuntimeError(
                        "Zone 7 Odd/Even read-back did not match exactly or another zone changed; no retry or rollback sent"
                    )
                state.update({"status": "verified", "verified": True,
                              "detail": "One write verified exactly; all seven neighbouring zones unchanged"})
                return self._parity_finish()
        except Exception as exc:
            self._zone7_parity_plan = None
            state = self._parity_state()
            state.pop("plan_id", None)
            state.update({"error": str(exc), "detail": str(exc), "verified": False})
            if attempted:
                self._zone7_parity_locked = True
                state["locked"] = True
                if state.get("status") != "mismatch":
                    state["status"] = "uncertain"
                    state["after_snapshot"] = deepcopy(state.get("latest_observations", [])) if state.get("writes_performed") == 1 else []
                self._parity_finish()
            elif state.get("status") not in {"expired", "stale"}:
                state["status"] = "rejected"
            raise
        finally:
            self._command_lock.release()
