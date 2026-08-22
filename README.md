# HO-SC-8W for Home Assistant

Custom Home Assistant integration for the **INKBIRD / HiOazo HO-SC-8W** irrigation controller.

## Status

The repository contains the standalone Home Assistant integration under the stable domain `nikas_ho_sc_8w` and an integration-owned irrigation panel.

The current runtime baseline is deliberately conservative and read-only for normal irrigation control. Schedule telemetry is decoded from the verified HO-SC-8W DP model; no Lovelace/frontend code writes raw Tuya DPs.

## Installation with HACS

Add this repository as a custom **Integration** repository in HACS:

`NikaSir/ha-ho-sc-8w`

HACS installs:

```text
custom_components/nikas_ho_sc_8w/
```

Restart Home Assistant after installation or update.

## Integration-owned dashboard

The integration ships its own panel frontend and registers the stable route:

```text
/dashboard-irrigation
```

Sidebar title: **Полив**  
Primary UX target: **iPhone Pro Max, portrait orientation**.

Current panel version: **0.2.0**.

The panel information architecture is:

- Overview — current watering, essential controller state and next scheduled watering;
- Zones — working user zones 1–6 with compact runtime/program information;
- Programs — human-readable DP38 schedule, currently read-only;
- Diagnostics — transport, masks, schedule cache, unverified main-valve source and service information including Zone 8.

The panel is deployed with the integration itself. No separate Lovelace YAML copy or manual `configuration.yaml` dashboard registration is required.

### Panel v0.2 UX changes

- moves the unverified main-valve explanation out of Overview and into Diagnostics;
- removes duplicate Overview navigation cards;
- adds a computed **Next watering** card based on decoded schedule data;
- makes Overview zone rows more informative without increasing card height;
- removes the repeated manual-control warning from every zone card;
- localizes user-facing program and diagnostic values;
- keeps Zone 8 diagnostics-only and keeps the frontend free of raw-DP write logic.

## Safety boundary

- Zones 1–6 are production irrigation zones.
- Zone 8 is reserved for controlled development/diagnostic tests and is not exposed as a normal user zone.
- `unknown` and `unavailable` are treated as unreliable states, not as normal/off.
- The frontend must never construct or send raw Tuya DP payloads.
- Write operations may be exposed only through stable, tested integration APIs.
- The current HACS baseline does not add general write controls.

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
      irrigation-panel.js
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
