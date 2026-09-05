"""Runtime extensions for guarded DP38 research and production editing."""

from __future__ import annotations

from typing import Any

from .coordinator import HOSC8WCoordinator
from .production_service import setup_production_service
from .start_probe_api import StartProbeHOSC8WAPI


_ORIGINAL_PATCH_KWARGS = StartProbeHOSC8WAPI._zone7_lab_patch_kwargs
_ORIGINAL_VALIDATE_PROGRAM = StartProbeHOSC8WAPI._validate_zone7_program_enabled_plan
_ORIGINAL_COORDINATOR_INIT = HOSC8WCoordinator.__init__
_PATCHED = False


def _zone7_lab_patch_kwargs(field: str, raw_value: str) -> dict[str, Any]:
    field_name = str(field).strip()
    value = str(raw_value).strip()
    if field_name == "program_enabled" and value == "true":
        return {"program_enabled": True}
    return _ORIGINAL_PATCH_KWARGS(field_name, value)


def _validate_zone7_program_enabled_plan(plan: dict[str, Any]) -> None:
    if not isinstance(plan, dict):
        raise ValueError("Zone 7 program-flag dry-run was not retained")
    target = str(plan.get("value", ""))
    if plan.get("field") != "program_enabled":
        raise ValueError("Zone 7 program-flag dry-run has an unexpected target")
    if target == "false":
        _ORIGINAL_VALIDATE_PROGRAM(plan)
        return
    if target != "true":
        raise ValueError("Zone 7 program-flag dry-run has an unsupported target")

    source = bytes.fromhex(str(plan.get("source_read_hex", "")))
    expected_source = bytes.fromhex(
        "0711060C17FFFFFF1E2D3BFFFFFF00141A090400"
    )
    if source != expected_source:
        raise ValueError(
            "Zone 7 must exactly match confirmed Weekly Tuesday+Thursday disabled state before the program-on probe"
        )
    expected = bytearray(source)
    expected[19] = 0x10
    write = bytearray(expected)
    write[0] = 0x40
    if (
        bytes.fromhex(str(plan.get("write_hex", ""))) != bytes(write)
        or bytes.fromhex(str(plan.get("expected_read_hex", ""))) != bytes(expected)
    ):
        raise ValueError(
            "Zone 7 program restore probe must change only byte 19: 00 -> 10"
        )
    changes = [
        (item["offset"], item["before"], item["after"])
        for item in plan.get("diff", [])
    ]
    if changes != [(0, "07", "40"), (19, "00", "10")]:
        raise ValueError("Unexpected Zone 7 program-restore dry-run diff")


def _coordinator_init_with_production_service(self: HOSC8WCoordinator, *args: Any, **kwargs: Any) -> None:
    _ORIGINAL_COORDINATOR_INIT(self, *args, **kwargs)
    setup_production_service(self.hass)


def apply_patch() -> None:
    """Extend the existing guarded runtime in place."""
    global _PATCHED
    if _PATCHED:
        return
    StartProbeHOSC8WAPI._zone7_lab_patch_kwargs = staticmethod(_zone7_lab_patch_kwargs)
    StartProbeHOSC8WAPI._validate_zone7_program_enabled_plan = staticmethod(
        _validate_zone7_program_enabled_plan
    )
    HOSC8WCoordinator.__init__ = _coordinator_init_with_production_service
    _PATCHED = True
