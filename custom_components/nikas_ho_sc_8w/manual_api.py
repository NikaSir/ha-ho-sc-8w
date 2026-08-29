"""Field-test DP45 manual control semantics for HO-SC-8W.

The controller's native app treats DP45 command 0x01 as the manual
start/reset command.  Manual watering therefore must not be driven by DP101:
DP101 is observed as mode telemetry only.  This subclass keeps the stable
transport implementation and overrides only the two field-tested manual
control operations.
"""

from __future__ import annotations

import base64
import time
from typing import Any

from .api import HOSC8WAPI
from .const import (
    DP_IRRIGATION_MODE,
    DP_IRRIGATION_TIME_ALL,
    MANUAL_DURATION_MAX,
    MANUAL_DURATION_MIN,
    NUM_PRODUCTION_ZONES,
    NUM_ZONES,
)
from .models import encode_dp45_start_manual


class NativeManualHOSC8WAPI(HOSC8WAPI):
    """HO-SC-8W API using DP45 itself as manual start/reset control."""

    def _write_dp45_manual_payload(self, durations: dict[int, int]) -> None:
        """Write one native DP45 command=1,target=1 payload."""
        all_durations = {zone: 0 for zone in range(1, NUM_ZONES + 1)}
        all_durations.update(durations)
        raw_payload = encode_dp45_start_manual(all_durations, NUM_ZONES)
        local_payload = base64.b64encode(raw_payload).decode("ascii")
        self._write_command_value(
            DP_IRRIGATION_TIME_ALL,
            local_payload,
            cloud_code="irrigation_time_all",
            cloud_value=raw_payload.hex(),
            nowait=True,
        )

    def start_manual_queue(self, durations: dict[int, int]) -> dict[str, Any]:
        """Start the controller-native manual queue with one DP45 command.

        Do not pre-write DP101=Manual.  Field tests show DP101 changes mode but
        is not the manual watering command.  DP45 command 0x01 carries the
        selected station durations and lets the controller establish Manual,
        active-zone and pending-zone state itself.
        """
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

                self._write_dp45_manual_payload(normalized)
                time.sleep(0.6)

                expected_mask = sum(1 << (zone - 1) for zone in normalized)

                def _native_queue_confirmed() -> bool:
                    observed_mask = self.device.active_zone | self.device.queued_zone
                    return observed_mask & expected_mask == expected_mask

                if not self._wait_for_readback(_native_queue_confirmed, timeout_seconds=8.0):
                    observed = (
                        f"mode={self.device.operation_mode}, "
                        f"active={self.device.active_zone}, "
                        f"queued={self.device.queued_zone}"
                    )
                    # Deliberately do not write DP101 or issue a speculative
                    # recovery command here.  A failed read-back must not change
                    # the controller into Auto or OFF behind the user's back.
                    raise RuntimeError(
                        "DP45 manual queue was sent but DP107/108 did not confirm "
                        f"all selected zones ({observed})"
                    )

                return {
                    "verified": True,
                    "transport": self.active_transport,
                    "zones": [
                        {"zone": zone, "duration_minutes": normalized[zone]}
                        for zone in sorted(normalized)
                    ],
                    "operation_mode": self.device.operation_mode,
                    "active_zone_bitmask": self.device.active_zone,
                    "queued_zone_bitmask": self.device.queued_zone,
                    "control": "dp45_native",
                }
        finally:
            self._command_lock.release()

    def stop_manual(self) -> dict[str, Any]:
        """Stop all manual watering with DP45 reset (command=1, all times zero).

        DP101=Auto is intentionally not written: field tests show that it only
        changes the mode and does not close the active watering valve.
        """
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone == 0 and self.device.queued_zone == 0:
                    return {
                        "verified": True,
                        "changed": False,
                        "operation_mode": self.device.operation_mode,
                        "control": "dp45_reset",
                    }

                self._write_dp45_manual_payload({})
                time.sleep(0.6)
                if not self._wait_for_readback(
                    lambda: self.device.active_zone == 0 and self.device.queued_zone == 0,
                    timeout_seconds=8.0,
                ):
                    raise RuntimeError(
                        "DP45 reset did not confirm watering stop via DP107/108 "
                        f"(mode={self.device.operation_mode}, "
                        f"active={self.device.active_zone}, queued={self.device.queued_zone})"
                    )

                return {
                    "verified": True,
                    "changed": True,
                    "operation_mode": self.device.operation_mode,
                    "active_zone_bitmask": self.device.active_zone,
                    "queued_zone_bitmask": self.device.queued_zone,
                    "control": "dp45_reset",
                }
        finally:
            self._command_lock.release()
