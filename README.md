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
Current panel version: **0.4.2**.

The panel follows **Home Assistant NikaS · Integration Dashboard UI Standard v1.2**:

- compact Header with explicit `← Назад`;
- viewport-centered title without decorative Header icon;
- irrigation parent route: `/dashboard-actions`;
- full-width fixed non-floating Bottom Tab Bar;
- iOS Safe Area handling and bottom clearance;
- no top-tab navigation for primary sections.

### Information architecture v0.4

The user-facing application model is domain-oriented rather than protocol-oriented:

- **Обзор** — automatic-program status, current watering, next watering and zones 1–6;
- **Зона N** — drill-down from Overview with the factual schedule/settings of that zone;
- **Ручной** — select zone, set duration, then start; the start action remains intentionally disabled until a safe public Actions API is published;
- **Настройки** — controller-wide parameters such as operation mode, seasonal adjustment, rain sensor and irrigation order;
- **Диагн.** — integration health, transport/cache/errors and a read-only **Проверка программы** drill-down for confirming the complete decoded DP38 configuration.

The primary Bottom Tab Bar is:

```text
Обзор · Ручной · Настройки · Диагн.
```

`Программы` is not a primary application tab. Program configuration belongs to each zone; the complete read-only program snapshot belongs under Diagnostics.

### Compact Overview

The Overview density is tuned specifically for **iPhone Pro Max portrait**. The target is that zones **1–6 are visible on the initial Overview without vertical scrolling** while preserving practical touch targets and the fixed Bottom Tab Bar.

### Self-contained production frontend v0.4.2

The production panel follows the mandatory NikaS specialized-panel frontend release standard:

```text
Home Assistant
      ↓
/nikas-ho-sc-8w/irrigation-panel.js?v=0.4.2
      ↓
<nikas-ho-sc-8w-panel>
```

`irrigation-panel.js` is the only project-owned JavaScript file required at runtime. It does not import previous UI versions. Historical frontend implementations are retained by Git history rather than chained browser imports.

This release uses a stable production filename plus query-string cache busting. Correct panel loading must not depend on a warm browser cache.

## Safety boundary

- Zones 1–6 are production irrigation zones.
- Zone 8 is reserved for controlled development/diagnostic tests and is not exposed as a normal user zone.
- `unknown` and `unavailable` are unreliable states, never normal/off.
- The frontend must never construct or send raw Tuya DP payloads.
- Write operations may be exposed only through stable, tested integration APIs.
- Header and Bottom Tab Bar elements never execute device actions.
- Long press on factual Home Assistant entity-backed controls opens standard Home Assistant more-info.
- Manual selection and duration controls are local UI state only; the controller is not written until the integration publishes a verified Action.

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
- Specialized production frontend must be self-contained and must not depend on historical UI modules at runtime.
- Shared contribution/security/frontend standards are inherited from `NikaSir/.github` unless overridden here by an explicit architecture decision.

## License and third-party attribution

Repository code is distributed under the MIT license. Third-party attribution inherited from earlier MIT-licensed work is preserved in `THIRD_PARTY_NOTICES.md` where applicable.
