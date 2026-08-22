# HO-SC-8W for Home Assistant

Custom Home Assistant integration for the **INKBIRD / HiOazo HO-SC-8W** irrigation controller.

## Status

The repository contains the standalone Home Assistant integration under the stable domain `nikas_ho_sc_8w` and an integration-owned irrigation panel.

The current runtime baseline is deliberately conservative and read-only for normal irrigation control. Schedule telemetry is decoded from the verified HO-SC-8W DP model; no frontend code writes raw Tuya DPs.

## Installation with HACS

Add this repository as a custom **Integration** repository in HACS:

`NikaSir/ha-ho-sc-8w`

HACS installs:

```text
custom_components/nikas_ho_sc_8w/
```

Restart Home Assistant after installation or update.

## Integration-owned panel

Stable route:

```text
/dashboard-irrigation
```

Sidebar title: **Полив**  
Primary UX target: **iPhone Pro Max · portrait · one-handed use**.  
Current panel version: **0.3.0**.

The panel follows the common Home Assistant NikaS application shell:

- fixed logical header with explicit `← Назад`;
- irrigation parent route: `/dashboard-actions`;
- device identity in compact secondary text;
- subject state immediately below the header;
- fixed bottom navigation for the panel's internal sections;
- iOS safe-area handling at both ends of the screen;
- no top-tab navigation for primary sections.

Internal sections:

- **Обзор** — current watering, controller state, next watering and zones 1–6;
- **Зоны** — runtime and decoded program information for working zones 1–6;
- **Программы** — human-readable DP38 schedule, currently read-only;
- **Диагностика** — transport, masks, cache, unverified main-valve source and laboratory Zone 8.

The panel is deployed with the integration itself. No separate Lovelace YAML copy or manual `configuration.yaml` dashboard registration is required.

## Safety boundary

- Zones 1–6 are production irrigation zones.
- Zone 8 is reserved for controlled development/diagnostic tests and is not exposed as a normal user zone.
- `unknown` and `unavailable` are unreliable states, never normal/off.
- The frontend must never construct or send raw Tuya DP payloads.
- Write operations may be exposed only through stable, tested integration APIs.
- Header and bottom-navigation elements never execute device actions.
- Long press on factual Home Assistant entity-backed controls opens standard Home Assistant more-info.

## Device scope

This repository is dedicated to **HO-SC-8W**. Other INKBIRD/IIC controller models are not part of this integration unless explicitly added and independently verified in the future.

## Repository layout

```text
custom_components/
  nikas_ho_sc_8w/
    __init__.py
    manifest.json
    config_flow.py
    api.py
    coordinator.py
    schedule_cache.py
    sensor.py
    frontend.py
    frontend/
      irrigation-panel-v03.js
    translations/
      en.json
      ru.json
docs/
hacs.json
```

## Repository policy

- Default branch: `main`.
- Secrets, Local Keys, tokens, account credentials and private device data must never be committed.
- Releases must be traceable to source commits.
- Production write behavior must be explicitly tested before promotion.
- Shared contribution/security defaults are inherited from `NikaSir/.github` unless overridden here.

## License and third-party attribution

Repository code is distributed under the MIT license. Third-party attribution inherited from earlier MIT-licensed work is preserved in `THIRD_PARTY_NOTICES.md` where applicable.
