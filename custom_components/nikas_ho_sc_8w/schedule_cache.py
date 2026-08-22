"""Persistent read-only DP38 cache for HO-SC-8W."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .api import HOSC8WDevice
from .const import DOMAIN, NUM_ZONES
from .models import validate_dp38_block

_LOGGER = logging.getLogger(__name__)

STORE_VERSION = 1
LEGACY_SNAPSHOT_ENTITY = "sensor.ho_sc_8w_programma_poliva"


class HOSC8WScheduleCache:
    """Persist DP38 blocks without ever writing them to the controller."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        device: HOSC8WDevice,
    ) -> None:
        self.hass = hass
        self.entry = entry
        self.device = device
        self._store: Store[dict[str, Any]] = Store(
            hass,
            STORE_VERSION,
            f"{DOMAIN}.schedule_cache.{entry.entry_id}",
        )

    async def async_load_and_bootstrap(self) -> None:
        """Load persisted blocks, then fill missing zones from legacy snapshot."""
        stored = await self._store.async_load() or {}
        blocks = stored.get("blocks", {})
        sources = stored.get("sources", {})
        for zone_text, raw_hex in blocks.items():
            try:
                zone = int(zone_text)
                if zone in self.device.schedule_blocks:
                    continue
                block = bytes.fromhex(str(raw_hex))
                validate_dp38_block(block, expected_zone=zone)
            except (TypeError, ValueError) as exc:
                _LOGGER.warning(
                    "Ignoring invalid persisted DP38 cache block for zone %s: %s",
                    zone_text,
                    exc,
                )
                continue
            self.device.ingest_schedule_block(
                block,
                source=str(sources.get(str(zone), "persistent_cache")),
            )
        await self.async_bootstrap_from_legacy_snapshot()
        await self.async_save()

    async def async_bootstrap_from_legacy_snapshot(self) -> int:
        """Import missing raw blocks from the verified legacy HA snapshot sensor."""
        state = self.hass.states.get(LEGACY_SNAPSHOT_ENTITY)
        if state is None:
            return 0
        imported = 0
        for zone in range(1, NUM_ZONES + 1):
            if zone in self.device.schedule_blocks:
                continue
            raw_hex = state.attributes.get(f"zone_{zone}_raw_dp38")
            if not raw_hex:
                continue
            try:
                block = bytes.fromhex(str(raw_hex))
                validate_dp38_block(block, expected_zone=zone)
            except ValueError as exc:
                _LOGGER.warning(
                    "Legacy DP38 snapshot zone %d was rejected: %s", zone, exc
                )
                continue
            if self.device.ingest_schedule_block(block, source="legacy_snapshot"):
                imported += 1
        if imported:
            _LOGGER.info(
                "Bootstrapped %d missing HO-SC-8W schedule zones from %s",
                imported,
                LEGACY_SNAPSHOT_ENTITY,
            )
        return imported

    async def async_late_bootstrap(self) -> int:
        """Retry bootstrap after Home Assistant has finished creating YAML templates."""
        imported = await self.async_bootstrap_from_legacy_snapshot()
        if imported:
            await self.async_save()
        return imported

    async def async_save(self) -> None:
        """Persist currently known schedule blocks."""
        data = {
            "blocks": {
                str(zone): block.hex().upper()
                for zone, block in sorted(self.device.schedule_blocks.items())
            },
            "sources": {
                str(zone): self.device.schedule_sources.get(zone, "unknown")
                for zone in sorted(self.device.schedule_blocks)
            },
        }
        await self._store.async_save(data)
