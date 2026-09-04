#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMP = ROOT / "custom_components" / "nikas_ho_sc_8w"


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if new in text:
        return
    if old not in text:
        raise RuntimeError(f"marker not found in {path}: {old[:80]!r}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def append_once(path: Path, marker: str, block: str) -> None:
    text = path.read_text(encoding="utf-8")
    if marker in text:
        return
    path.write_text(text.rstrip() + "\n\n" + block.rstrip() + "\n", encoding="utf-8")


# const.py
const = COMP / "const.py"
replace_once(
    const,
    'SERVICE_TEST_ZONE8_MASK_WRITE = "test_zone8_mask_write"\n',
    'SERVICE_TEST_ZONE8_MASK_WRITE = "test_zone8_mask_write"\n'
    'SERVICE_PREPARE_ZONE7_LAB = "prepare_zone7_lab"\n'
    'SERVICE_EXECUTE_ZONE7_LAB = "execute_zone7_lab"\n',
)
replace_once(
    const,
    'ATTR_PHASE = "phase"\n',
    'ATTR_PHASE = "phase"\nATTR_PLAN_ID = "plan_id"\n',
)

# api.py imports + methods
api = COMP / "api.py"
replace_once(
    api,
    'from .models import (\n',
    'from .dp38_transaction import prepare_dp38_transaction, verify_dp38_readback\nfrom .models import (\n',
)
replace_once(api, 'import logging\n', 'import hashlib\nimport logging\n')

api_methods = r'''
    @staticmethod
    def _zone7_lab_patch_kwargs(field: str, raw_value: str) -> dict[str, Any]:
        """Translate one laboratory editor field into a conservative DP38 patch."""
        field = str(field).strip()
        value = str(raw_value).strip()
        if field == "duration_minutes":
            return {"duration_minutes": int(value)}
        if field.startswith("start_time_"):
            slot = int(field.removeprefix("start_time_"))
            if not 1 <= slot <= 6:
                raise ValueError("start_time slot must be 1..6")
            # The transaction planner replaces the whole start-time bank, so a
            # single-slot edit is intentionally not accepted here.  The lab UI
            # will use start_times_json once multi-slot editing is needed.
            raise ValueError("Use a non-time field for the first Zone 7 lab test")
        if field == "cycle_mode":
            modes = {"weekly": 0, "odd": 1, "even": 2, "interval": 3}
            if value not in modes:
                raise ValueError("cycle_mode must be weekly, odd, even or interval")
            return {"cycle_mode": modes[value]}
        if field == "cycle_value":
            return {"interval_days": int(value)}
        if field == "weekdays":
            days = [item.strip().lower() for item in value.split(",") if item.strip()]
            return {"cycle_mode": 0, "weekdays": days}
        if field == "anchor_date":
            parsed = date.fromisoformat(value)
            return {"anchor_date": (parsed.year, parsed.month, parsed.day)}
        if field == "program_enabled":
            if value not in {"true", "false"}:
                raise ValueError("program_enabled must be true or false")
            return {"program_enabled": value == "true"}
        if field == "rain_sensor_follow":
            if value not in {"true", "false"}:
                raise ValueError("rain_sensor_follow must be true or false")
            return {"rain_sensor_follow": value == "true"}
        raise ValueError(f"Unsupported Zone 7 lab field: {field}")

    def prepare_zone7_lab(self, field: str, value: str) -> dict[str, Any]:
        """Prepare a write plan for Zone 7 without sending any controller write."""
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("Zone 7 laboratory editor is local-transport only")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before preparing a Zone 7 lab transaction")
                self._collect_zone8_dp38_samples(
                    timeout_seconds=12.0,
                    required_zones=set(range(1, NUM_ZONES + 1)),
                    max_requests=24,
                )
                baseline = self._build_full_dp38_snapshot()
                source = bytes.fromhex(str(baseline[7]["raw_hex"]))
                validate_dp38_block(source, expected_zone=7)
                kwargs = self._zone7_lab_patch_kwargs(field, value)
                # cycle_value is overloaded in DP38.  For the lab we only allow
                # direct cycle_value edits when the source is already interval.
                if field == "cycle_value" and source[14] != 3:
                    raise ValueError("cycle_value direct edit is allowed only when Zone 7 is already interval")
                plan = prepare_dp38_transaction(source, **kwargs)
                plan_dict = plan.as_dict()
                digest = hashlib.sha256(
                    (plan_dict["source_read_hex"] + plan_dict["write_hex"]).encode("ascii")
                ).hexdigest()[:12].upper()
                confirmation = f"WRITE_ZONE7_LAB_{digest}"
                self.device.zone7_lab_plan = {
                    **plan_dict,
                    "plan_id": digest,
                    "confirmation": confirmation,
                    "field": field,
                    "value": value,
                    "baseline": baseline,
                }
                self.device.zone7_lab_result = {
                    "status": "prepared",
                    "plan_id": digest,
                    "confirmation": confirmation,
                    "field": field,
                    "value": value,
                    "diff": plan_dict["diff"],
                    "source_read_hex": plan_dict["source_read_hex"],
                    "write_hex": plan_dict["write_hex"],
                    "expected_read_hex": plan_dict["expected_read_hex"],
                }
                return dict(self.device.zone7_lab_result)
        finally:
            self._command_lock.release()

    def execute_zone7_lab(self, plan_id: str, confirmation: str) -> dict[str, Any]:
        """Execute one prepared Zone 7 write, then compare all eight DP38 blocks."""
        plan = getattr(self.device, "zone7_lab_plan", None)
        if not isinstance(plan, dict):
            raise RuntimeError("No prepared Zone 7 laboratory transaction exists")
        if str(plan_id).strip().upper() != str(plan.get("plan_id", "")).upper():
            raise PermissionError("Zone 7 lab plan_id does not match the prepared transaction")
        if str(confirmation).strip() != str(plan.get("confirmation", "")):
            raise PermissionError("Zone 7 lab confirmation token does not match the prepared transaction")
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("Zone 7 laboratory editor is local-transport only")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before executing a Zone 7 lab transaction")

                self._collect_zone8_dp38_samples(
                    timeout_seconds=12.0,
                    required_zones=set(range(1, NUM_ZONES + 1)),
                    max_requests=24,
                )
                before = self._build_full_dp38_snapshot()
                baseline = plan["baseline"]
                changed_before = [
                    zone for zone in range(1, NUM_ZONES + 1)
                    if str(before[zone]["raw_hex"]) != str(baseline[zone]["raw_hex"])
                ]
                if changed_before:
                    raise RuntimeError(
                        "DP38 changed after prepare; transaction cancelled. Changed zones: "
                        + ", ".join(map(str, changed_before))
                    )

                write_block = bytes.fromhex(str(plan["write_hex"]))
                validate_dp38_write_block(write_block, expected_zone=7)
                self._write_dp38_hex_block(write_block)
                time.sleep(1.0)

                self._collect_zone8_dp38_samples(
                    timeout_seconds=12.0,
                    required_zones=set(range(1, NUM_ZONES + 1)),
                    max_requests=24,
                )
                after = self._build_full_dp38_snapshot()
                actual_zone7 = bytes.fromhex(str(after[7]["raw_hex"]))
                verification = verify_dp38_readback(
                    prepare_dp38_transaction(
                        bytes.fromhex(str(plan["source_read_hex"])),
                        # Reconstructing the same plan is unnecessary here; the
                        # expected read block is stored in the immutable plan.
                    ),
                    actual_zone7,
                )
                # The helper call above represents a no-op plan, so compare the
                # stored expected read explicitly for the actual transaction.
                expected_zone7 = bytes.fromhex(str(plan["expected_read_hex"]))
                exact_zone7 = actual_zone7 == expected_zone7
                readback_diff = []
                if not exact_zone7:
                    for offset, (expected, actual) in enumerate(zip(expected_zone7, actual_zone7, strict=True)):
                        if expected != actual:
                            readback_diff.append({
                                "offset": offset,
                                "field": self._dp38_snapshot_field(offset),
                                "expected": f"{expected:02X}",
                                "actual": f"{actual:02X}",
                            })
                collateral = [
                    zone for zone in range(1, NUM_ZONES + 1)
                    if zone != 7
                    and str(after[zone]["raw_hex"]) != str(baseline[zone]["raw_hex"])
                ]
                result = {
                    "status": "verified" if exact_zone7 and not collateral else "mismatch",
                    "verified": exact_zone7 and not collateral,
                    "plan_id": plan["plan_id"],
                    "field": plan["field"],
                    "value": plan["value"],
                    "expected_read_hex": expected_zone7.hex().upper(),
                    "actual_read_hex": actual_zone7.hex().upper(),
                    "readback_diff": readback_diff,
                    "collateral_changed_zones": collateral,
                    "before": before,
                    "after": after,
                }
                self.device.zone7_lab_result = result
                # One prepared plan is single-use regardless of success.  Never
                # retry or auto-rollback a DP38 write.
                self.device.zone7_lab_plan = None
                if not result["verified"]:
                    raise RuntimeError(
                        "Zone 7 DP38 write was not isolated/confirmed; inspect zone7_lab_result before any further write"
                    )
                return result
        finally:
            self._command_lock.release()
'''

append_once(api, 'def prepare_zone7_lab(self, field: str, value: str)', api_methods)

# Remove the accidental no-op verifier dependency from runtime behavior by
# replacing that small block with a stored expected-read comparison only.
text = api.read_text(encoding="utf-8")
old = '''                verification = verify_dp38_readback(\n                    prepare_dp38_transaction(\n                        bytes.fromhex(str(plan["source_read_hex"])),\n                        # Reconstructing the same plan is unnecessary here; the\n                        # expected read block is stored in the immutable plan.\n                    ),\n                    actual_zone7,\n                )\n                # The helper call above represents a no-op plan, so compare the\n                # stored expected read explicitly for the actual transaction.\n'''
if old in text:
    text = text.replace(old, '', 1)
    api.write_text(text, encoding="utf-8")

# coordinator.py
coord = COMP / "coordinator.py"
coord_methods = r'''
    async def async_prepare_zone7_lab(self, field: str, value: str) -> dict[str, object]:
        """Prepare a Zone 7 DP38 transaction without writing."""
        async with self._transport_lock:
            result = await self.hass.async_add_executor_job(
                self.api.prepare_zone7_lab, field, value
            )
            self.async_set_updated_data(self.api.device)
            return result

    async def async_execute_zone7_lab(
        self, plan_id: str, confirmation: str
    ) -> dict[str, object]:
        """Execute one prepared Zone 7 transaction and publish full verification."""
        async with self._transport_lock:
            try:
                result = await self.hass.async_add_executor_job(
                    self.api.execute_zone7_lab, plan_id, confirmation
                )
            finally:
                self.async_set_updated_data(self.api.device)
            return result
'''
replace_once(
    coord,
    '    async def async_start_listener(self) -> None:\n',
    coord_methods + '\n    async def async_start_listener(self) -> None:\n',
)

# __init__.py imports/schema/handlers/registration
init = COMP / "__init__.py"
replace_once(
    init,
    '    ATTR_PHASE,\n',
    '    ATTR_PHASE,\n    ATTR_PLAN_ID,\n',
)
replace_once(
    init,
    '    SERVICE_PROBE_ZONE8_DP38_HEX,\n',
    '    SERVICE_PROBE_ZONE8_DP38_HEX,\n    SERVICE_PREPARE_ZONE7_LAB,\n    SERVICE_EXECUTE_ZONE7_LAB,\n',
)

schema_block = r'''
_ZONE7_LAB_PREPARE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_FIELD): vol.In(
            {
                "duration_minutes",
                "cycle_mode",
                "cycle_value",
                "weekdays",
                "anchor_date",
                "program_enabled",
                "rain_sensor_follow",
            }
        ),
        vol.Required(ATTR_VALUE): cv.string,
    },
    extra=vol.PREVENT_EXTRA,
)

_ZONE7_LAB_EXECUTE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_PLAN_ID): cv.string,
        vol.Required(ATTR_CONFIRMATION): cv.string,
    },
    extra=vol.PREVENT_EXTRA,
)
'''
replace_once(init, '\n\ndef _coordinator_for_call(', '\n\n' + schema_block + '\n\ndef _coordinator_for_call(')

handler_block = r'''
async def _async_prepare_zone7_lab(hass: HomeAssistant, call: ServiceCall) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_prepare_zone7_lab(
            str(call.data[ATTR_FIELD]), str(call.data[ATTR_VALUE])
        )
    except (PermissionError, RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_execute_zone7_lab(hass: HomeAssistant, call: ServiceCall) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_execute_zone7_lab(
            str(call.data[ATTR_PLAN_ID]), str(call.data[ATTR_CONFIRMATION])
        )
    except (PermissionError, RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


'''
replace_once(init, 'async def async_setup(hass: HomeAssistant, _config: ConfigType) -> bool:\n', handler_block + 'async def async_setup(hass: HomeAssistant, _config: ConfigType) -> bool:\n')

registration = r'''
    if not hass.services.has_service(DOMAIN, SERVICE_PREPARE_ZONE7_LAB):
        hass.services.async_register(
            DOMAIN,
            SERVICE_PREPARE_ZONE7_LAB,
            partial(_async_prepare_zone7_lab, hass),
            schema=_ZONE7_LAB_PREPARE_SCHEMA,
        )
        hass.services.async_register(
            DOMAIN,
            SERVICE_EXECUTE_ZONE7_LAB,
            partial(_async_execute_zone7_lab, hass),
            schema=_ZONE7_LAB_EXECUTE_SCHEMA,
        )
'''
replace_once(init, '    return True\n\n\nasync def async_setup_entry', registration + '    return True\n\n\nasync def async_setup_entry')

# services.yaml
services = COMP / "services.yaml"
append_once(
    services,
    'prepare_zone7_lab:',
    r'''
prepare_zone7_lab:
  name: Prepare Zone 7 DP38 lab transaction
  description: Read-only prepare step. Captures all eight DP38 blocks, builds a minimal Zone 7 patch and returns plan_id, confirmation token and byte diff. Sends no write.
  fields:
    config_entry_id:
      selector:
        config_entry:
          integration: nikas_ho_sc_8w
    field:
      required: true
      selector:
        select:
          options:
            - duration_minutes
            - cycle_mode
            - cycle_value
            - weekdays
            - anchor_date
            - program_enabled
            - rain_sensor_follow
    value:
      required: true
      selector:
        text:

execute_zone7_lab:
  name: Execute prepared Zone 7 DP38 lab transaction
  description: Single-use guarded write. Re-reads all eight zones, refuses stale plans, writes Zone 7 once, then verifies Zone 7 and confirms that zones 1-6 and 8 stayed byte-for-byte unchanged. No retry and no automatic rollback.
  fields:
    config_entry_id:
      selector:
        config_entry:
          integration: nikas_ho_sc_8w
    plan_id:
      required: true
      selector:
        text:
    confirmation:
      required: true
      selector:
        text:
''',
)

# sensor.py: expose latest lab result through Zone 7 schedule entity attributes.
sensor = COMP / "sensor.py"
replace_once(
    sensor,
    '        if self._zone == 8:\n',
    '        if self._zone == 7:\n'
    '            attrs["zone7_lab_plan"] = getattr(device, "zone7_lab_plan", None)\n'
    '            attrs["zone7_lab_result"] = getattr(device, "zone7_lab_result", None)\n'
    '        if self._zone == 8:\n',
)

print("Zone 7 lab editor integration patch installed")
