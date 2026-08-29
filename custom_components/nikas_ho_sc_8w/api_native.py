"""Field-validated native DP45 manual-control semantics for HO-SC-8W."""

from __future__ import annotations

import base64
import time
from typing import Any

from .api import HOSC8WAPI as _BaseHOSC8WAPI
from .const import (
    DP_IRRIGATION_MODE,
    DP_IRRIGATION_TIME_ALL,
    MANUAL_DURATION_MAX,
    MANUAL_DURATION_MIN,
    NUM_PRODUCTION_ZONES,
    NUM_ZONES,
)
from .models import encode_dp45_start_manual


class HOSC8WAPI(_BaseHOSC8WAPI):
    """HO-SC-8W API with DP45-native manual start/queue/Stop All semantics.

    DP101 is observed as controller state only for these actions. Manual start and
    Stop All do not write DP101. This isolates the field-test protocol from the
    older implementation while retaining the proven transport/session layer.
    """

    def _write_dp45_payload(self, raw_payload: bytes) -> None:
        local_payload = base64.b64encode(raw_payload).decode("ascii")
        self._write_command_value(
            DP_IRRIGATION_TIME_ALL,
            local_payload,
            cloud_code="irrigation_time_all",
            cloud_value=raw_payload.hex(),
            nowait=True,
        )

    def start_manual_queue(self, durations: dict[int, int]) -> dict[str, Any]:
        """Start the controller-native manual selection with one DP45 command."""
        normalized: dict[int, int] = {}
        for raw_zone, raw_duration in durations.items():
            zone = int(raw_zone)
            duration = int(raw_duration)
            if not 1 <= zone <= NUM_PRODUCTION_ZONES:
                raise ValueError(f"Manual zone must be 1..{NUM_PRODUCTION_ZONES}")
            if not MANUAL_DURATION_MIN <= duration <= MANUAL_DURATION_MAX:
                raise ValueError(
                    f"Zone {zone} duration must be {MANUAL_DURATION_MIN}..{MANUAL_DURATION_MAX} minutes"
                )
            normalized[zone] = duration
        if not normalized:
            raise ValueError("Manual queue must contain at least one zone")

        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Cannot replace a running or queued watering operation")

                if str(self.device.irrigation_mode).lower() != "order":
                    self._write_command_value(
                        DP_IRRIGATION_MODE,
                        "order",
                        cloud_code="irrigation_mode",
                    )
                    time.sleep(0.35)

                all_durations = {zone: 0 for zone in range(1, NUM_ZONES + 1)}
                all_durations.update(normalized)
                raw_payload = encode_dp45_start_manual(all_durations, NUM_ZONES)
                self._write_dp45_payload(raw_payload)
                time.sleep(0.6)

                expected_mask = sum(1 << (zone - 1) for zone in normalized)

                def _native_start_seen() -> bool:
                    observed = self.device.active_zone | self.device.queued_zone
                    return bool(observed & expected_mask) and not bool(observed & ~expected_mask)

                if not self._wait_for_readback(_native_start_seen, timeout_seconds=8.0):
                    raise RuntimeError(
                        "DP45 manual start was sent but DP107/108 did not confirm a selected zone; "
                        f"mode={self.device.operation_mode}, active={self.device.active_zone}, queued={self.device.queued_zone}"
                    )

                return {
                    "verified": True,
                    "transport": self.active_transport,
                    "protocol": "dp45_native",
                    "zones": [
                        {"zone": zone, "duration_minutes": normalized[zone]}
                        for zone in sorted(normalized)
                    ],
                    "active_zone_bitmask": self.device.active_zone,
                    "queued_zone_bitmask": self.device.queued_zone,
                    "operation_mode_observed": self.device.operation_mode,
                }
        finally:
            self._command_lock.release()

    def stop_manual(self) -> dict[str, Any]:
        """Stop all manual watering with DP45 command=1 and zero durations."""
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone == 0 and self.device.queued_zone == 0:
                    return {
                        "verified": True,
                        "changed": False,
                        "protocol": "dp45_native_stop_all",
                        "operation_mode_observed": self.device.operation_mode,
                    }

                raw_payload = encode_dp45_start_manual(
                    {zone: 0 for zone in range(1, NUM_ZONES + 1)}, NUM_ZONES
                )
                self._write_dp45_payload(raw_payload)
                time.sleep(0.6)

                if not self._wait_for_readback(
                    lambda: self.device.active_zone == 0 and self.device.queued_zone == 0,
                    timeout_seconds=8.0,
                ):
                    raise RuntimeError(
                        "DP45 Stop All was sent but DP107/108 did not clear; "
                        f"mode={self.device.operation_mode}, active={self.device.active_zone}, queued={self.device.queued_zone}"
                    )

                return {
                    "verified": True,
                    "changed": True,
                    "protocol": "dp45_native_stop_all",
                    "operation_mode_observed": self.device.operation_mode,
                }
        finally:
            self._command_lock.release()
