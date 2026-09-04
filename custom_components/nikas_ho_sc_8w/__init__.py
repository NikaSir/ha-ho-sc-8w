"""Home Assistant integration for INKBIRD / HiOazo HO-SC-8W."""

from __future__ import annotations

import logging
from functools import partial

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import CoreState, Event, HomeAssistant, ServiceCall
from homeassistant.exceptions import ConfigEntryNotReady, HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.typing import ConfigType

from .start_probe_api import StartProbeHOSC8WAPI as HOSC8WAPI
from .const import (
    ATTR_CONFIG_ENTRY_ID,
    ATTR_CONFIRMATION,
    ATTR_DURATION_MINUTES,
    ATTR_FIELD,
    ATTR_PHASE,
    ATTR_PLAN_ID,
    ATTR_VALUE,
    ATTR_ZONE,
    ATTR_ZONES,
    CONF_CLOUD_API_KEY,
    CONF_CLOUD_API_REGION,
    CONF_CLOUD_API_SECRET,
    CONF_CONNECTION_MODE,
    CONF_DEVICE_ID,
    CONF_DEVICE_IP,
    CONF_LOCAL_KEY,
    CONNECTION_MODE_AUTO,
    CONNECTION_MODE_CLOUD,
    CONNECTION_MODE_LOCAL,
    DP38_SNAPSHOT_CONFIRMATION,
    DOMAIN,
    MANUAL_DURATION_MAX,
    MANUAL_DURATION_MIN,
    NUM_PRODUCTION_ZONES,
    SEASONAL_ADJUST_MAX,
    SEASONAL_ADJUST_MIN,
    SEASONAL_ADJUST_STEP,
    SERVICE_CAPTURE_DP38_SNAPSHOT,
    SERVICE_PROBE_ZONE8_DP38_HEX,
    SERVICE_PREPARE_ZONE7_LAB,
    SERVICE_EXECUTE_ZONE7_LAB,
    SERVICE_PREPARE_ZONE7_DURATION17,
    SERVICE_EXECUTE_ZONE7_DURATION17,
    ZONE7_DURATION17_CONFIRMATION,
    SERVICE_RESUME_AUTOMATIC,
    SERVICE_RESTORE_ZONE8_SCHEDULE,
    SERVICE_RESTORE_ZONE8_KNOWN_BACKUP,
    SERVICE_SET_SEASONAL_ADJUSTMENT,
    SERVICE_SET_ZONE8_SCHEDULE_FIELD,
    SERVICE_SKIP_CURRENT_MANUAL,
    SERVICE_START_MANUAL_QUEUE,
    SERVICE_STOP_MANUAL,
    SERVICE_TEST_ZONE8_ANCHOR_DATE_WRITE,
    SERVICE_TEST_ZONE8_MASK_WRITE,
    ZONE8_ANCHOR_DATE_TEST_CONFIRMATION,
    ZONE8_ANCHOR_DATE_TEST_ENABLED,
    ZONE8_MASK_WRITE_TEST_CONFIRMATION,
    ZONE8_MASK_WRITE_TEST_ENABLED,
    ZONE8_KNOWN_RESTORE_ENABLED,
)
from .coordinator import HOSC8WCoordinator
from .frontend import async_setup_panel

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

# Writes are exposed only as validated integration services; entity platforms
# remain factual sensors rather than generic raw-DP controls.
PLATFORMS: list[Platform] = [Platform.SENSOR]

_ZONE_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ZONE): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=NUM_PRODUCTION_ZONES)
        ),
        vol.Required(ATTR_DURATION_MINUTES): vol.All(
            vol.Coerce(int),
            vol.Range(min=MANUAL_DURATION_MIN, max=MANUAL_DURATION_MAX),
        ),
    },
    extra=vol.PREVENT_EXTRA,
)

_START_MANUAL_QUEUE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_ZONES): vol.All(
            cv.ensure_list,
            [_ZONE_ITEM_SCHEMA],
            vol.Length(min=1, max=NUM_PRODUCTION_ZONES),
        ),
    }
)

_ENTRY_COMMAND_SCHEMA = vol.Schema(
    {vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string}
)

_SEASONAL_ADJUSTMENT_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_VALUE): vol.All(
            vol.Coerce(int),
            vol.In(
                range(
                    SEASONAL_ADJUST_MIN,
                    SEASONAL_ADJUST_MAX + 1,
                    SEASONAL_ADJUST_STEP,
                )
            ),
        ),
    }
)

_ZONE8_SCHEDULE_FIELD_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_FIELD): vol.In(
            {
                "duration_minutes",
                "start_time_1",
                "start_time_2",
                "start_time_3",
                "start_time_4",
                "start_time_5",
                "start_time_6",
                "cycle_mode",
                "cycle_value",
                "anchor_date",
                "rain_sensor_follow",
            }
        ),
        vol.Required(ATTR_VALUE): cv.string,
    },
    extra=vol.PREVENT_EXTRA,
)

_ZONE8_HEX_PROBE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_CONFIRMATION): vol.In({"ZONE8_DP38_HEX_PROBE"}),
    },
    extra=vol.PREVENT_EXTRA,
)

_DP38_SNAPSHOT_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_PHASE): vol.In({"baseline", "compare"}),
        vol.Required(ATTR_CONFIRMATION): vol.In({DP38_SNAPSHOT_CONFIRMATION}),
    },
    extra=vol.PREVENT_EXTRA,
)

_ZONE8_KNOWN_RESTORE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_CONFIRMATION): vol.In({"RESTORE_ZONE8_KNOWN_BACKUP"}),
    },
    extra=vol.PREVENT_EXTRA,
)

_ZONE8_ANCHOR_DATE_TEST_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_CONFIRMATION): vol.In(
            {ZONE8_ANCHOR_DATE_TEST_CONFIRMATION}
        ),
    },
    extra=vol.PREVENT_EXTRA,
)

_ZONE8_MASK_WRITE_TEST_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_CONFIRMATION): vol.In(
            {ZONE8_MASK_WRITE_TEST_CONFIRMATION}
        ),
    },
    extra=vol.PREVENT_EXTRA,
)



_ZONE7_LAB_PREPARE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_FIELD): vol.In(
            {
                "duration_minutes",
                "start_time_1",
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


def _coordinator_for_call(hass: HomeAssistant, call: ServiceCall) -> HOSC8WCoordinator:
    """Resolve one config entry without ever guessing between controllers."""
    coordinators = hass.data.get(DOMAIN, {})
    entry_id = call.data.get(ATTR_CONFIG_ENTRY_ID)
    if entry_id:
        coordinator = coordinators.get(entry_id)
        if coordinator is None:
            raise HomeAssistantError(
                f"HO-SC-8W config entry {entry_id} is not loaded"
            )
        return coordinator
    loaded = [
        item
        for item in coordinators.values()
        if isinstance(item, HOSC8WCoordinator)
    ]
    if len(loaded) != 1:
        raise HomeAssistantError(
            "Specify config_entry_id when zero or multiple HO-SC-8W controllers are loaded"
        )
    return loaded[0]


async def _async_start_manual_queue(hass: HomeAssistant, call: ServiceCall) -> None:
    coordinator = _coordinator_for_call(hass, call)
    durations: dict[int, int] = {}
    for item in call.data[ATTR_ZONES]:
        zone = int(item[ATTR_ZONE])
        if zone in durations:
            raise HomeAssistantError(f"Zone {zone} occurs more than once in the queue")
        durations[zone] = int(item[ATTR_DURATION_MINUTES])
    try:
        await coordinator.async_start_manual_queue(durations)
    except (RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_stop_manual(hass: HomeAssistant, call: ServiceCall) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_stop_manual()
    except (RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_skip_current_manual(hass: HomeAssistant, call: ServiceCall) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_skip_current_manual()
    except (RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_resume_automatic(hass: HomeAssistant, call: ServiceCall) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_resume_automatic()
    except (RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_set_seasonal_adjustment(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_set_seasonal_adjustment(int(call.data[ATTR_VALUE]))
    except (RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_set_zone8_schedule_field(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_set_zone8_schedule_field(
            str(call.data[ATTR_FIELD]), str(call.data[ATTR_VALUE])
        )
    except (RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_restore_zone8_schedule(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_restore_zone8_schedule()
    except (RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_probe_zone8_dp38_hex(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_probe_zone8_dp38_hex(
            str(call.data[ATTR_CONFIRMATION])
        )
    except (PermissionError, RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_capture_dp38_snapshot(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_capture_dp38_snapshot(
            str(call.data[ATTR_PHASE]), str(call.data[ATTR_CONFIRMATION])
        )
    except (PermissionError, RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_restore_zone8_known_backup(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_restore_zone8_known_backup(
            str(call.data[ATTR_CONFIRMATION])
        )
    except (PermissionError, RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_test_zone8_anchor_date_write(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_test_zone8_anchor_date_write(
            str(call.data[ATTR_CONFIRMATION])
        )
    except (PermissionError, RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_test_zone8_mask_write(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_test_zone8_mask_write(
            str(call.data[ATTR_CONFIRMATION])
        )
    except (PermissionError, RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc



async def _async_prepare_zone7_duration17(hass: HomeAssistant, call: ServiceCall) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_prepare_zone7_duration17()
    except (PermissionError, RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


async def _async_execute_zone7_duration17(hass: HomeAssistant, call: ServiceCall) -> None:
    coordinator = _coordinator_for_call(hass, call)
    try:
        await coordinator.async_execute_zone7_duration17(str(call.data[ATTR_CONFIRMATION]))
    except (PermissionError, RuntimeError, ValueError) as exc:
        raise HomeAssistantError(str(exc)) from exc


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


async def async_setup(hass: HomeAssistant, _config: ConfigType) -> bool:
    """Set up integration-wide resources once per Home Assistant process."""
    await async_setup_panel(hass)
    if (
        not ZONE8_KNOWN_RESTORE_ENABLED
        and hass.services.has_service(DOMAIN, SERVICE_RESTORE_ZONE8_KNOWN_BACKUP)
    ):
        hass.services.async_remove(DOMAIN, SERVICE_RESTORE_ZONE8_KNOWN_BACKUP)
    if (
        not ZONE8_ANCHOR_DATE_TEST_ENABLED
        and hass.services.has_service(DOMAIN, SERVICE_TEST_ZONE8_ANCHOR_DATE_WRITE)
    ):
        hass.services.async_remove(DOMAIN, SERVICE_TEST_ZONE8_ANCHOR_DATE_WRITE)
    if not hass.services.has_service(DOMAIN, SERVICE_START_MANUAL_QUEUE):
        hass.services.async_register(
            DOMAIN,
            SERVICE_START_MANUAL_QUEUE,
            partial(_async_start_manual_queue, hass),
            schema=_START_MANUAL_QUEUE_SCHEMA,
        )
        hass.services.async_register(
            DOMAIN,
            SERVICE_SKIP_CURRENT_MANUAL,
            partial(_async_skip_current_manual, hass),
            schema=_ENTRY_COMMAND_SCHEMA,
        )
        hass.services.async_register(
            DOMAIN,
            SERVICE_STOP_MANUAL,
            partial(_async_stop_manual, hass),
            schema=_ENTRY_COMMAND_SCHEMA,
        )
        hass.services.async_register(
            DOMAIN,
            SERVICE_RESUME_AUTOMATIC,
            partial(_async_resume_automatic, hass),
            schema=_ENTRY_COMMAND_SCHEMA,
        )
        hass.services.async_register(
            DOMAIN,
            SERVICE_SET_SEASONAL_ADJUSTMENT,
            partial(_async_set_seasonal_adjustment, hass),
            schema=_SEASONAL_ADJUSTMENT_SCHEMA,
        )
        hass.services.async_register(
            DOMAIN,
            SERVICE_PROBE_ZONE8_DP38_HEX,
            partial(_async_probe_zone8_dp38_hex, hass),
            schema=_ZONE8_HEX_PROBE_SCHEMA,
        )
        if ZONE8_ANCHOR_DATE_TEST_ENABLED:
            hass.services.async_register(
                DOMAIN,
                SERVICE_TEST_ZONE8_ANCHOR_DATE_WRITE,
                partial(_async_test_zone8_anchor_date_write, hass),
                schema=_ZONE8_ANCHOR_DATE_TEST_SCHEMA,
            )
        if ZONE8_KNOWN_RESTORE_ENABLED:
            hass.services.async_register(
                DOMAIN,
                SERVICE_RESTORE_ZONE8_KNOWN_BACKUP,
                partial(_async_restore_zone8_known_backup, hass),
                schema=_ZONE8_KNOWN_RESTORE_SCHEMA,
            )
    if not hass.services.has_service(DOMAIN, SERVICE_CAPTURE_DP38_SNAPSHOT):
        hass.services.async_register(
            DOMAIN,
            SERVICE_CAPTURE_DP38_SNAPSHOT,
            partial(_async_capture_dp38_snapshot, hass),
            schema=_DP38_SNAPSHOT_SCHEMA,
        )
    if (
        ZONE8_MASK_WRITE_TEST_ENABLED
        and not hass.services.has_service(DOMAIN, SERVICE_TEST_ZONE8_MASK_WRITE)
    ):
        hass.services.async_register(
            DOMAIN,
            SERVICE_TEST_ZONE8_MASK_WRITE,
            partial(_async_test_zone8_mask_write, hass),
            schema=_ZONE8_MASK_WRITE_TEST_SCHEMA,
        )

    if not hass.services.has_service(DOMAIN, SERVICE_PREPARE_ZONE7_DURATION17):
        hass.services.async_register(
            DOMAIN,
            SERVICE_PREPARE_ZONE7_DURATION17,
            partial(_async_prepare_zone7_duration17, hass),
            schema=_ENTRY_COMMAND_SCHEMA,
        )
        hass.services.async_register(
            DOMAIN,
            SERVICE_EXECUTE_ZONE7_DURATION17,
            partial(_async_execute_zone7_duration17, hass),
            schema=vol.Schema(
                {
                    vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
                    vol.Required(ATTR_CONFIRMATION): vol.In({ZONE7_DURATION17_CONFIRMATION}),
                },
                extra=vol.PREVENT_EXTRA,
            ),
        )

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
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up one HO-SC-8W config entry."""
    preference = entry.options.get(CONF_CONNECTION_MODE, CONNECTION_MODE_AUTO)
    if preference not in {
        CONNECTION_MODE_AUTO,
        CONNECTION_MODE_CLOUD,
        CONNECTION_MODE_LOCAL,
    }:
        preference = CONNECTION_MODE_AUTO

    api = HOSC8WAPI(
        entry.data[CONF_DEVICE_ID],
        entry.data[CONF_LOCAL_KEY],
        entry.data[CONF_DEVICE_IP],
        cloud_api_key=entry.data.get(CONF_CLOUD_API_KEY, ""),
        cloud_api_secret=entry.data.get(CONF_CLOUD_API_SECRET, ""),
        cloud_api_region=entry.data.get(CONF_CLOUD_API_REGION, "eu"),
        connection_preference=preference,
    )

    if preference == CONNECTION_MODE_CLOUD:
        connected = await hass.async_add_executor_job(api.activate_cloud)
        transport = "cloud"
    else:
        connected = await hass.async_add_executor_job(api.activate_local)
        transport = "local"
        if not connected and preference == CONNECTION_MODE_AUTO and api.has_cloud:
            connected = await hass.async_add_executor_job(api.activate_cloud)
            transport = "cloud"

    if not connected:
        raise ConfigEntryNotReady(
            f"Cannot connect to HO-SC-8W using requested policy {preference}"
        )

    _LOGGER.info("Starting HO-SC-8W integration using %s transport", transport)
    coordinator = HOSC8WCoordinator(hass, api, entry)
    await coordinator.async_initialize_schedule_cache()
    await coordinator.async_config_entry_first_refresh()
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator

    registry = er.async_get(hass)
    for entity in list(er.async_entries_for_config_entry(registry, entry.entry_id)):
        if entity.platform == DOMAIN and entity.domain in {"switch", "number", "select"}:
            registry.async_remove(entity.entity_id)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    async def _async_late_schedule_bootstrap(_event: Event | None = None) -> None:
        """Retry legacy snapshot import after YAML template entities exist."""
        imported = await coordinator.schedule_cache.async_late_bootstrap()
        if imported:
            _LOGGER.info("Late DP38 bootstrap imported %d schedule zone(s)", imported)
            coordinator.async_set_updated_data(api.device)

    if hass.state == CoreState.running:
        await _async_late_schedule_bootstrap()
    else:
        entry.async_on_unload(
            hass.bus.async_listen_once(
                EVENT_HOMEASSISTANT_STARTED,
                _async_late_schedule_bootstrap,
            )
        )

    await coordinator.async_start_listener()
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload one HO-SC-8W config entry."""
    coordinator: HOSC8WCoordinator | None = hass.data.get(DOMAIN, {}).get(
        entry.entry_id
    )
    if coordinator:
        await coordinator.async_stop_listener()
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok