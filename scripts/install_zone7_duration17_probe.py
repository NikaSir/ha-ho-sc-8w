#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMP = ROOT / "custom_components" / "nikas_ho_sc_8w"


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"marker not found in {path}: {old[:80]!r}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


# const.py
p = COMP / "const.py"
replace_once(
    p,
    'SERVICE_EXECUTE_ZONE7_LAB = "execute_zone7_lab"\n',
    'SERVICE_EXECUTE_ZONE7_LAB = "execute_zone7_lab"\n'
    'SERVICE_PREPARE_ZONE7_DURATION17 = "prepare_zone7_duration17"\n'
    'SERVICE_EXECUTE_ZONE7_DURATION17 = "execute_zone7_duration17"\n'
    'ZONE7_DURATION17_CONFIRMATION = "WRITE_ZONE7_DURATION_17_ONCE"\n',
)

# api.py: add fixed wrappers immediately before cloud-update tail marker if absent.
p = COMP / "api.py"
text = p.read_text(encoding="utf-8")
if "def prepare_zone7_duration17" not in text:
    marker = "    def prepare_zone7_lab(self, field: str, value: str) -> dict[str, Any]:\n"
    idx = text.find(marker)
    if idx < 0:
        raise SystemExit("prepare_zone7_lab marker not found")
    # fixed wrappers are inserted before generic prepare so they remain near the lab code
    wrapper = '''    def prepare_zone7_duration17(self) -> dict[str, Any]:\n        \"\"\"Prepare the first fixed Zone-7 probe: duration 17 minutes.\"\"\"\n        result = self.prepare_zone7_lab(\"duration_minutes\", \"17\")\n        result[\"fixed_probe\"] = \"zone7_duration17\"\n        return result\n\n    def execute_zone7_duration17(self, confirmation: str) -> dict[str, Any]:\n        \"\"\"Execute only the prepared fixed Zone-7 duration=17 plan once.\"\"\"\n        from .const import ZONE7_DURATION17_CONFIRMATION\n\n        if confirmation != ZONE7_DURATION17_CONFIRMATION:\n            raise PermissionError(\"Explicit Zone 7 duration-17 confirmation is required\")\n        plan = getattr(self.device, \"zone7_lab_plan\", None)\n        if not isinstance(plan, dict):\n            raise RuntimeError(\"Prepare the Zone 7 duration-17 probe first\")\n        if plan.get(\"field\") != \"duration_minutes\" or str(plan.get(\"value\")) != \"17\":\n            raise RuntimeError(\"Prepared Zone 7 plan is not the fixed duration-17 probe\")\n        return self.execute_zone7_lab(\n            str(plan.get(\"plan_id\", \"\")), str(plan.get(\"confirmation\", \"\"))\n        )\n\n'''
    text = text[:idx] + wrapper + text[idx:]
    p.write_text(text, encoding="utf-8")

# coordinator.py
p = COMP / "coordinator.py"
text = p.read_text(encoding="utf-8")
if "async_prepare_zone7_duration17" not in text:
    marker = "    async def async_prepare_zone7_lab(self, field: str, value: str) -> dict[str, object]:\n"
    idx = text.find(marker)
    if idx < 0:
        raise SystemExit("coordinator Zone7 marker not found")
    wrapper = '''    async def async_prepare_zone7_duration17(self) -> dict[str, object]:\n        \"\"\"Prepare fixed first Zone-7 duration probe without writing.\"\"\"\n        async with self._transport_lock:\n            result = await self.hass.async_add_executor_job(\n                self.api.prepare_zone7_duration17\n            )\n            self.async_set_updated_data(self.api.device)\n            return result\n\n    async def async_execute_zone7_duration17(self, confirmation: str) -> dict[str, object]:\n        \"\"\"Execute the fixed Zone-7 duration probe once.\"\"\"\n        async with self._transport_lock:\n            try:\n                return await self.hass.async_add_executor_job(\n                    self.api.execute_zone7_duration17, confirmation\n                )\n            finally:\n                self.async_set_updated_data(self.api.device)\n\n'''
    text = text[:idx] + wrapper + text[idx:]
    p.write_text(text, encoding="utf-8")

# __init__.py imports/constants + schema + handlers + registration.
p = COMP / "__init__.py"
text = p.read_text(encoding="utf-8")
if "SERVICE_PREPARE_ZONE7_DURATION17" not in text:
    text = text.replace(
        "    SERVICE_PREPARE_ZONE7_LAB,\n    SERVICE_EXECUTE_ZONE7_LAB,\n",
        "    SERVICE_PREPARE_ZONE7_LAB,\n    SERVICE_EXECUTE_ZONE7_LAB,\n"
        "    SERVICE_PREPARE_ZONE7_DURATION17,\n    SERVICE_EXECUTE_ZONE7_DURATION17,\n"
        "    ZONE7_DURATION17_CONFIRMATION,\n",
        1,
    )
    handler_marker = "async def _async_prepare_zone7_lab(hass: HomeAssistant, call: ServiceCall) -> None:\n"
    idx = text.find(handler_marker)
    if idx < 0:
        raise SystemExit("init Zone7 handler marker not found")
    handlers = '''async def _async_prepare_zone7_duration17(hass: HomeAssistant, call: ServiceCall) -> None:\n    coordinator = _coordinator_for_call(hass, call)\n    try:\n        await coordinator.async_prepare_zone7_duration17()\n    except (PermissionError, RuntimeError, ValueError) as exc:\n        raise HomeAssistantError(str(exc)) from exc\n\n\nasync def _async_execute_zone7_duration17(hass: HomeAssistant, call: ServiceCall) -> None:\n    coordinator = _coordinator_for_call(hass, call)\n    try:\n        await coordinator.async_execute_zone7_duration17(str(call.data[ATTR_CONFIRMATION]))\n    except (PermissionError, RuntimeError, ValueError) as exc:\n        raise HomeAssistantError(str(exc)) from exc\n\n\n'''
    text = text[:idx] + handlers + text[idx:]

    reg_marker = "    if not hass.services.has_service(DOMAIN, SERVICE_PREPARE_ZONE7_LAB):\n"
    idx = text.find(reg_marker)
    if idx < 0:
        raise SystemExit("init Zone7 registration marker not found")
    registrations = '''    if not hass.services.has_service(DOMAIN, SERVICE_PREPARE_ZONE7_DURATION17):\n        hass.services.async_register(\n            DOMAIN,\n            SERVICE_PREPARE_ZONE7_DURATION17,\n            partial(_async_prepare_zone7_duration17, hass),\n            schema=_ENTRY_COMMAND_SCHEMA,\n        )\n        hass.services.async_register(\n            DOMAIN,\n            SERVICE_EXECUTE_ZONE7_DURATION17,\n            partial(_async_execute_zone7_duration17, hass),\n            schema=vol.Schema(\n                {\n                    vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,\n                    vol.Required(ATTR_CONFIRMATION): vol.In({ZONE7_DURATION17_CONFIRMATION}),\n                },\n                extra=vol.PREVENT_EXTRA,\n            ),\n        )\n\n'''
    text = text[:idx] + registrations + text[idx:]
    p.write_text(text, encoding="utf-8")

# services.yaml
p = COMP / "services.yaml"
text = p.read_text(encoding="utf-8")
if "prepare_zone7_duration17:" not in text:
    text += '''\nprepare_zone7_duration17:\n  name: Prepare Zone 7 duration=17 probe\n  description: Read-only preflight. Captures all eight DP38 blocks and prepares a one-byte duration change for Zone 7. No write is sent.\n  fields:\n    config_entry_id:\n      selector:\n        config_entry:\n          integration: nikas_ho_sc_8w\n\nexecute_zone7_duration17:\n  name: Execute Zone 7 duration=17 probe\n  description: Executes exactly the previously prepared Zone 7 duration=17 DP38 transaction once, then re-reads and compares all eight zones. No retry or automatic rollback.\n  fields:\n    config_entry_id:\n      selector:\n        config_entry:\n          integration: nikas_ho_sc_8w\n    confirmation:\n      required: true\n      example: WRITE_ZONE7_DURATION_17_ONCE\n      selector:\n        select:\n          options:\n            - WRITE_ZONE7_DURATION_17_ONCE\n'''
    p.write_text(text, encoding="utf-8")

print("Zone 7 duration=17 fixed probe installed")
