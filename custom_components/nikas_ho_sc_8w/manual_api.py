"""Field-test DP45 manual control semantics for HO-SC-8W.

The controller's native app treats DP45 command 0x01 as the manual
start/reset command. Manual watering therefore must not be driven by DP101:
DP101 is observed as mode telemetry only.

This subclass also implements the native IIC-800 DP38 refresh handshake used
by the official application: one all-zero DP38 trigger followed by unsolicited
per-zone DP38 replies on the persistent local socket. The zero frame is a
firmware read/synchronization request, not a schedule payload.
"""

from __future__ import annotations

import base64
import time
from typing import Any
from uuid import uuid4

from .api import HOSC8WAPI
from .const import (
    CONNECTION_MODE_LOCAL,
    DP_ACTIVE_ZONE,
    DP_IRRIGATION_MODE,
    DP_IRRIGATION_TIME_ALL,
    DP_NORMAL_TIME,
    DP_OPERATION_MODE,
    DP_QUEUED_ZONE,
    MANUAL_DURATION_MAX,
    MANUAL_DURATION_MIN,
    NUM_PRODUCTION_ZONES,
    NUM_ZONES,
)
from .models import decode_dp38, encode_dp45_start_manual, validate_dp38_block

_MANUAL_SAFETY_DPS = (DP_OPERATION_MODE, DP_ACTIVE_ZONE, DP_QUEUED_ZONE)
_MANUAL_QUEUE_DPS = (*_MANUAL_SAFETY_DPS, DP_IRRIGATION_MODE)


class NativeManualHOSC8WAPI(HOSC8WAPI):
    """HO-SC-8W API using native DP45 control and native DP38 refresh."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        # DP108 is always zero on the field-tested controller even though its
        # internal queue works. Keep the last submitted plan so the current
        # station can be removed without guessing from stale DP45 telemetry.
        self._manual_queue_plan: dict[int, int] = {}
        self._manual_last_zone = 0
        self._manual_transport = ""
        self._manual_session_id = ""
        self._manual_skip_reason = "Нет подтверждённой ручной очереди этой интеграции"
        self.device.on_dps_update = self._observe_manual_session

    def _invalidate_manual_session(self, reason: str) -> None:
        """Forget ownership permanently; later matching telemetry cannot restore it."""
        self._manual_queue_plan = {}
        self._manual_last_zone = 0
        self._manual_transport = ""
        self._manual_session_id = ""
        self._manual_skip_reason = reason

    @staticmethod
    def _manual_mask(value: Any) -> int:
        if isinstance(value, bool) or not isinstance(value, (int, str)):
            raise ValueError("Invalid controller zone bitmask")
        if isinstance(value, str) and not value.isdecimal():
            raise ValueError("Invalid controller zone bitmask")
        mask = int(value)
        if not 0 <= mask < (1 << NUM_ZONES):
            raise ValueError("Invalid controller zone bitmask")
        return mask

    def _observe_manual_session(self, dps: dict[str, Any]) -> None:
        """Consume every observed transition, including partial socket updates.

        Firmware provides no session ID. This tracks uninterrupted ownership
        established by our verified DP45 start; it cannot identify an external
        stop/restart that produces no distinguishable observation.
        """
        if not self._manual_queue_plan:
            return
        if str(DP_OPERATION_MODE) in dps and str(dps[str(DP_OPERATION_MODE)]).lower() != "manual":
            self._invalidate_manual_session("Контроллер вышел из ручного режима")
            return
        if str(DP_IRRIGATION_MODE) in dps and str(dps[str(DP_IRRIGATION_MODE)]).lower() != "order":
            self._invalidate_manual_session("Последовательный режим очереди изменился")
            return
        try:
            if str(DP_ACTIVE_ZONE) in dps:
                active = self._manual_mask(dps[str(DP_ACTIVE_ZONE)])
                if not active or active & (active - 1):
                    self._invalidate_manual_session("Ручная очередь завершилась или активная зона неоднозначна")
                    return
                zone = active.bit_length()
                if zone not in self._manual_queue_plan or zone < self._manual_last_zone:
                    self._invalidate_manual_session("Наблюдается другая последовательность полива")
                    return
                self._manual_last_zone = zone
                # Completed zones can never become eligible again.
                self._manual_queue_plan = {
                    item: duration for item, duration in self._manual_queue_plan.items()
                    if item >= zone
                }
            if str(DP_QUEUED_ZONE) in dps:
                queued = self._manual_mask(dps[str(DP_QUEUED_ZONE)])
                allowed = sum(1 << (zone - 1) for zone in self._manual_queue_plan)
                if queued & ~allowed:
                    self._invalidate_manual_session("Контроллер сообщил другую очередь полива")
        except (TypeError, ValueError):
            self._invalidate_manual_session("Нет достоверной маски работающих зон")

    @property
    def manual_skip_status(self) -> dict[str, Any]:
        """Return cached UI permission without controller I/O or a blocking lock."""
        if self._command_lock.locked():
            return {"allowed": False, "reason": "Выполняется команда контроллера"}
        return self._manual_session_status()

    def _manual_session_status(self) -> dict[str, Any]:
        # UI reads can overlap the receive thread. Capture scalars once and
        # reject an invalidation in progress; never wait for its socket lock.
        zone = self._manual_last_zone
        session_id = self._manual_session_id
        if not self._manual_queue_plan:
            return {"allowed": False, "reason": self._manual_skip_reason}
        if not 1 <= zone <= NUM_PRODUCTION_ZONES or not session_id:
            return {"allowed": False, "reason": "Подтверждение ручной очереди обновляется"}
        if not self.device.online or self.active_transport != self._manual_transport:
            return {"allowed": False, "reason": "Непрерывность связи с контроллером не подтверждена"}
        if str(self.device.operation_mode).lower() != "manual":
            return {"allowed": False, "reason": "Контроллер должен находиться в ручном режиме"}
        active = self.device.active_zone
        if active != (1 << (zone - 1)) or session_id != self._manual_session_id:
            return {"allowed": False, "reason": "Текущая зона ручной очереди не подтверждена"}
        return {
            "allowed": True, "reason": "",
            "session_id": session_id,
            "active_zone": zone,
        }

    def _on_transport_error(self) -> None:
        self._invalidate_manual_session("Связь прерывалась; остаток очереди не подтверждён")

    def _reset_connection(self) -> None:
        self._on_transport_error()
        super()._reset_connection()

    def _ensure_connection(self):
        if not self._tuya or not self._connected:
            self._on_transport_error()
        return super()._ensure_connection()

    def _cloud_update(self) -> bool:
        with self._io_lock:
            success = super()._cloud_update()
            if not success:
                self._on_transport_error()
            return success

    def _refresh_command_state(self) -> bool:
        success = super()._refresh_command_state()
        if not success:
            self._on_transport_error()
        return success

    def _write_command_value(self, dp: int, value: Any, **kwargs: Any) -> None:
        # Inherited resume_automatic holds both command and I/O locks here.
        # Forget ownership before dispatch, even when the write is unconfirmed.
        if dp == DP_OPERATION_MODE:
            self._invalidate_manual_session("Запрошено изменение режима контроллера")
        try:
            super()._write_command_value(dp, value, **kwargs)
        except Exception:
            self._on_transport_error()
            raise

    def _require_manual_state(self, required_dps: tuple[int, ...] = _MANUAL_SAFETY_DPS) -> None:
        """Require each safety DP to be observed in this successful fresh read."""
        before = dict(self.device.dps_revisions)
        if not self._refresh_command_state() or any(
            self.device.dps_revisions.get(str(dp), 0) <= before.get(str(dp), 0)
            for dp in required_dps
        ):
            self._invalidate_manual_session("Не получены свежие данные режима и работающих зон")
            raise RuntimeError(
                "Cannot read fresh " + "/".join(f"DP{dp}" for dp in required_dps)
                + " before the manual command"
            )
        try:
            if str(self.device.raw_dps[str(DP_OPERATION_MODE)]).lower() not in {"auto", "manual", "off"}:
                raise ValueError("Invalid operation mode")
            self._manual_mask(self.device.raw_dps[str(DP_ACTIVE_ZONE)])
            self._manual_mask(self.device.raw_dps[str(DP_QUEUED_ZONE)])
        except (KeyError, TypeError, ValueError) as exc:
            self._invalidate_manual_session("Нет достоверных данных режима и работающих зон")
            raise RuntimeError("Controller returned invalid manual safety state") from exc

    def _wait_for_manual_readback(
        self, predicate, timeout_seconds: float = 8.0,
        *, required_dps: tuple[int, ...] = _MANUAL_SAFETY_DPS,
    ) -> bool:
        """Never confirm a write using cached DPs or an unsuccessful status call."""
        deadline = time.monotonic() + timeout_seconds
        while time.monotonic() < deadline:
            try:
                self._require_manual_state(required_dps)
            except RuntimeError:
                pass
            else:
                if predicate():
                    return True
            time.sleep(0.35)
        return False

    def _confirm_manual_session(self, plan: dict[int, int]) -> None:
        self._manual_queue_plan = dict(plan)
        self._manual_last_zone = min(plan)
        self._manual_transport = self.active_transport
        self._manual_session_id = uuid4().hex
        self._manual_skip_reason = ""

    def _collect_native_dp38_round(
        self,
        timeout_seconds: float,
        required_zones: set[int],
    ) -> list[bytes]:
        """Request and collect one complete native DP38 schedule round.

        Official IIC-800 application behavior recovered from APK 2.1.11:
        send DP38 as 20 zero bytes once, then consume asynchronous DP38 updates
        until the last zone arrives. No operator interaction and no per-zone
        write selector is involved.
        """
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("Native DP38 refresh is local-transport only")
        device = self._ensure_connection()
        if not device:
            raise RuntimeError("Local controller connection is unavailable")

        expected = set(required_zones)
        if not expected or not expected.issubset(set(range(1, NUM_ZONES + 1))):
            raise ValueError("Native DP38 refresh requires zones within 1..8")

        observed: dict[bytes, dict[str, Any]] = {}
        zone_blocks: dict[int, bytes] = {}
        safety_dps_seen: set[int] = set()
        dps_seen: set[int] = set()
        response_count = 0
        receive_count = 0

        def ingest(source: str, response: Any, *, accept_dp38: bool = True) -> None:
            nonlocal response_count
            if not isinstance(response, dict) or response.get("Err"):
                return
            dps = response.get("dps")
            if not isinstance(dps, dict):
                return
            response_count += 1
            normalized = {str(key): value for key, value in dps.items()}
            for key in normalized:
                try:
                    dps_seen.add(int(key))
                except (TypeError, ValueError):
                    pass
            for dp in (DP_OPERATION_MODE, DP_ACTIVE_ZONE, DP_QUEUED_ZONE):
                if str(dp) in normalized:
                    safety_dps_seen.add(dp)

            operational = {
                key: value
                for key, value in normalized.items()
                if key != str(DP_NORMAL_TIME)
            }
            if operational:
                self.device.update_from_dps(operational)
            if not accept_dp38:
                return

            value = normalized.get(str(DP_NORMAL_TIME))
            if value is None:
                return
            raw = self.device._parse_raw_dp(value)
            if raw == b"\x00" * 20:
                return
            for offset in range(0, len(raw), 20):
                current = bytes(raw[offset : offset + 20])
                if len(current) != 20 or current == b"\x00" * 20:
                    continue
                station = current[0]
                entry = observed.setdefault(
                    current,
                    {
                        "raw_hex": current.hex().upper(),
                        "length": 20,
                        "station": station,
                        "count": 0,
                        "sources": [],
                        "fresh": True,
                        "valid": False,
                    },
                )
                entry["count"] += 1
                if source not in entry["sources"]:
                    entry["sources"].append(source)
                try:
                    validate_dp38_block(current)
                    channel = decode_dp38(current)[0]
                except ValueError as exc:
                    entry["error"] = str(exc)
                    continue
                entry["valid"] = True
                entry.update(channel.as_dict())
                if station in expected:
                    # Preserve all variants in diagnostics. The snapshot builder
                    # will reject ambiguity instead of silently choosing one.
                    zone_blocks[station] = current

        # Obtain fresh safety telemetry before triggering the schedule stream.
        # Crucially, no status()/updatedps() calls are made after the trigger,
        # because those active requests can consume or overwrite intermediate
        # DP38 replies before receive() sees them.
        try:
            ingest("preflight_status", device.status(), accept_dp38=False)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError("Cannot read fresh safety state before DP38 refresh") from exc

        trigger_hex = "00" * 20
        device.set_socketTimeout(1)
        try:
            # The official app uses DeviceUtils.sendCommand("38", 40 zero HEX
            # chars). TinyTuya nowait preserves the persistent socket so the
            # following unsolicited Z1..Z8 replies remain available to receive().
            trigger_response = device.set_value(
                DP_NORMAL_TIME,
                trigger_hex,
                nowait=True,
            )
            # Do not treat an echoed all-zero DP38 as a schedule block, but keep
            # any accompanying operational DPs if the transport returned them.
            ingest("trigger", trigger_response, accept_dp38=False)

            deadline = time.monotonic() + timeout_seconds
            while not expected.issubset(zone_blocks) and time.monotonic() < deadline:
                try:
                    response = device.receive()
                    receive_count += 1
                except Exception:  # noqa: BLE001
                    time.sleep(0.03)
                    continue
                if response:
                    ingest("receive", response)
        finally:
            device.set_socketTimeout(5)

        self.device.zone8_hex_probe_samples = list(observed.values())
        zones_seen = sorted(
            {
                int(item["station"])
                for item in observed.values()
                if item.get("valid")
                and isinstance(item.get("station"), int)
                and 1 <= int(item["station"]) <= NUM_ZONES
            }
        )
        self.device.zone8_hex_probe_trace = {
            "mode": "native_zero_trigger_receive",
            "trigger_dp": DP_NORMAL_TIME,
            "trigger_hex": trigger_hex.upper(),
            "active_requests_after_trigger": 0,
            "responses": response_count,
            "receive_calls": receive_count,
            "dps_seen": sorted(dps_seen),
            "safety_dps_seen": sorted(safety_dps_seen),
            "dp38_variants": len(observed),
            "zones_seen": zones_seen,
            "required_zones": sorted(expected),
            "target_collected": expected.issubset(zone_blocks),
            "complete_round": set(range(1, NUM_ZONES + 1)).issubset(zone_blocks),
        }

        if not expected.issubset(zone_blocks):
            missing = sorted(expected - set(zone_blocks))
            raise RuntimeError(
                "Native DP38 refresh incomplete; missing zones: "
                + ", ".join(map(str, missing))
            )

        # Keep return compatibility with the legacy collector, which returns
        # Zone-8 samples while storing the full forensic set in device state.
        return [
            bytes.fromhex(str(item["raw_hex"]))
            for item in self.device.zone8_hex_probe_samples
            if item.get("station") == 8 and item.get("valid")
        ]

    def _collect_zone8_dp38_samples(
        self,
        timeout_seconds: float = 12.0,
        *,
        required_zones: set[int] | None = None,
        max_requests: int = 24,
    ) -> list[bytes]:
        """Use native zero-trigger refresh whenever a multi-zone snapshot is required."""
        if required_zones is None:
            return super()._collect_zone8_dp38_samples(
                timeout_seconds=timeout_seconds,
                required_zones=None,
                max_requests=max_requests,
            )
        return self._collect_native_dp38_round(timeout_seconds, required_zones)

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

        Do not pre-write DP101=Manual. Field tests show DP101 changes mode but
        is not the manual watering command. DP45 command 0x01 carries the
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
                self._require_manual_state(_MANUAL_QUEUE_DPS)
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Cannot replace a running watering operation")

                self._invalidate_manual_session("Ожидается подтверждение новой ручной очереди")

                if str(self.device.irrigation_mode).lower() != "order":
                    self._write_command_value(
                        DP_IRRIGATION_MODE,
                        "order",
                        cloud_code="irrigation_mode",
                    )
                    time.sleep(0.35)
                    self._require_manual_state(_MANUAL_QUEUE_DPS)
                    if str(self.device.irrigation_mode).lower() != "order":
                        raise RuntimeError("DP44 did not confirm sequential manual watering")
                    if self.device.active_zone or self.device.queued_zone:
                        raise RuntimeError("Watering started before the manual queue write")

                self._write_dp45_manual_payload(normalized)
                time.sleep(0.6)

                first_zone = min(normalized)
                first_zone_mask = 1 << (first_zone - 1)

                def _native_queue_confirmed() -> bool:
                    return (
                        str(self.device.operation_mode).lower() == "manual"
                        and str(self.device.irrigation_mode).lower() == "order"
                        and self.device.active_zone == first_zone_mask
                        and not self.device.queued_zone & ~sum(
                            1 << (zone - 1) for zone in normalized
                        )
                    )

                if not self._wait_for_manual_readback(
                    _native_queue_confirmed, timeout_seconds=8.0,
                    required_dps=_MANUAL_QUEUE_DPS,
                ):
                    observed = (
                        f"mode={self.device.operation_mode}, "
                        f"active={self.device.active_zone}, "
                        f"queued={self.device.queued_zone}"
                    )
                    raise RuntimeError(
                        "DP45 manual queue was sent but DP107 did not confirm "
                        f"the first selected zone {first_zone} ({observed})"
                    )

                self._confirm_manual_session(normalized)

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

    def skip_current_manual(
        self,
        expected_zone: int | None = None,
        expected_session_id: str | None = None,
    ) -> dict[str, Any]:
        """Remove the active zone and restart only the stored remainder."""
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_manual_state(_MANUAL_QUEUE_DPS)
                status = self._manual_session_status()
                if not status["allowed"]:
                    raise RuntimeError(
                        "Cannot skip without a current verified manual session; "
                        + str(status["reason"]) + "; use Stop All instead"
                    )
                active_mask = int(self.device.active_zone or 0)
                active_zones = [
                    zone
                    for zone in range(1, NUM_PRODUCTION_ZONES + 1)
                    if active_mask & (1 << (zone - 1))
                ]
                if len(active_zones) != 1:
                    raise RuntimeError(
                        "Cannot skip current zone: DP107 must confirm exactly one active zone"
                    )
                current_zone = active_zones[0]
                if expected_zone is not None and expected_zone != current_zone:
                    raise RuntimeError("The active zone changed; confirm the current zone again")
                if expected_session_id is not None and expected_session_id != self._manual_session_id:
                    raise RuntimeError("The manual queue changed; confirm the current queue again")

                remaining = {
                    zone: duration
                    for zone, duration in self._manual_queue_plan.items()
                    if zone > current_zone
                }
                self._invalidate_manual_session("Ожидается подтверждение перехода ручной очереди")
                self._write_dp45_manual_payload(remaining)
                time.sleep(0.6)

                if remaining:
                    next_zone = min(remaining)
                    next_mask = 1 << (next_zone - 1)
                    confirmed = self._wait_for_manual_readback(
                        lambda: str(self.device.operation_mode).lower() == "manual"
                        and str(self.device.irrigation_mode).lower() == "order"
                        and self.device.active_zone == next_mask
                        and not self.device.queued_zone & ~sum(
                            1 << (zone - 1) for zone in remaining
                        ),
                        timeout_seconds=8.0,
                        required_dps=_MANUAL_QUEUE_DPS,
                    )
                else:
                    next_zone = None
                    confirmed = self._wait_for_manual_readback(
                        lambda: self.device.active_zone == 0 and self.device.queued_zone == 0,
                        timeout_seconds=8.0,
                    )
                if not confirmed:
                    raise RuntimeError(
                        "DP45 revised queue was sent but DP107 did not confirm "
                        f"the transition (active={self.device.active_zone}, "
                        f"current={current_zone}, next={next_zone})"
                    )

                if remaining:
                    self._confirm_manual_session(remaining)
                else:
                    self._invalidate_manual_session("Ручная очередь завершена")
                return {
                    "verified": True,
                    "skipped_zone": current_zone,
                    "next_zone": next_zone,
                    "remaining_zones": sorted(remaining),
                    "active_zone_bitmask": self.device.active_zone,
                    "control": "dp45_revised_queue",
                }
        finally:
            self._command_lock.release()

    def stop_manual(self) -> dict[str, Any]:
        """Stop all manual watering with DP45 reset (command=1, all times zero)."""
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._invalidate_manual_session("Запрошена остановка ручной очереди")
                self._require_manual_state()
                if self.device.active_zone == 0 and self.device.queued_zone == 0:
                    return {
                        "verified": True,
                        "changed": False,
                        "operation_mode": self.device.operation_mode,
                        "control": "dp45_reset",
                    }

                self._write_dp45_manual_payload({})
                time.sleep(0.6)
                if not self._wait_for_manual_readback(
                    lambda: self.device.active_zone == 0 and self.device.queued_zone == 0,
                    timeout_seconds=8.0,
                ):
                    raise RuntimeError(
                        "DP45 reset did not confirm watering stop via DP107 "
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
