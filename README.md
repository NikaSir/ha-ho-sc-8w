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
Current panel version: **0.6.4**.

The panel follows **Home Assistant NikaS · Integration Dashboard UI Standard v1.2**:

It also conforms to **NikaS Integration Panel Template v1.0**.

- compact symmetric Header with icon-only `←` Back;
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

### Full-field Overview v0.4.3

The Overview is tuned specifically for **iPhone Pro Max portrait** and now uses the previously unused vertical field above the fixed Bottom Tab Bar. The hero, global status row, next-watering card and especially zones 1–6 are enlarged proportionally.

Acceptance target:

- zones **1–6 remain visible on the initial Overview without vertical scrolling**;
- the large dead area before the Bottom Tab Bar is removed;
- touch targets become larger rather than compressing content;
- no horizontal clipping is introduced;
- Bottom Tab Bar remains fixed and iOS-safe.

### Correct hydraulic and electrical topology v0.5.3

The primary status diagram keeps two systems visually and semantically separate:

- blue water path: incoming mainline → pressure-control boundary → manifold → valves 1–6 → zones 1–6;
- grey electrical path: HO-SC-8W controller → six valve actuators;
- grey sensor path: rain sensor → HO-SC-8W controller.

Water never enters or exits the controller in the diagram. Every valve is placed directly above its matching zone, and all valve-to-zone connections are vertical. Mainline pressure is read from the Home Assistant entity whose friendly name is `Датчик давления полив`; missing or unavailable data is never presented as healthy.

### Compact mobile status composition v0.5.4

The iPhone layout restores the accepted compact first-screen composition. The header, system diagram, KPI row, core nodes and current-mode controls use reduced mobile geometry; the six valve centers remain aligned with the six zone cards, and the corrected hydraulic/electrical topology is unchanged.

### Approved light visual composition v0.5.5

The status screen now treats the approved light render as the visual source of truth. It restores the full-width realistic manifold, the physical controller and rain-sensor presentation, photographic zone thumbnails, the larger diagram field and the original white-card hierarchy. The light surface is isolated from Home Assistant dark-theme text variables so a dark host theme cannot produce white text on white cards. A dedicated dark visual treatment is intentionally deferred until it can preserve this approved geometry instead of replacing it.

### Undistorted equipment and live pressure v0.5.6

The approved schematic now keeps one proportional canvas at every viewport width, preventing the controller, rain sensor and manifold from being compressed vertically on wide screens. Embedded equipment and zone imagery is pre-scaled with high-quality interpolation for cleaner Retina rendering. The mainline gauge and node card resolve `Датчик давления полив` by its Home Assistant friendly name and display its live state and unit.

### Left-side mainline entry v0.5.7

The incoming water path now runs from the pressure gauge vertically upward and then horizontally into the left end of the manifold. The previous bottom run and right-side riser are removed, including the old blue branch embedded in the manifold image. Pressure lookup keeps the exact `Датчик давления полив` friendly-name match and adds a conservative pressure-plus-irrigation token fallback.

### Actual HO-SC-8W controller and readable type v0.5.8

The schematic now uses the real wide turquoise INKBIRD / HiOazo HO-SC-8W enclosure with its LCD, eight-zone marking and Wi-Fi-capable product identity instead of the incorrect tall white cabinet. Its proportions are preserved with `contain` rendering. On mobile, supporting text has an 11 px floor—the same size as the `Локально` badge—and the diagram/KPI/node/mode cards are given enough height to avoid compressed labels.

### Shared-axis irrigation schematic v0.6.0

- the production schematic is built as one six-column responsive grid;
- every column contains the same zone number, valve visual, vertical water branch and zone card;
- the controller-to-valve bus is electrical only, and the rain sensor connects only to the controller;
- incoming water enters the manifold from the left and never passes through the controller;
- the status page follows the approved S8 OMNI hierarchy: summary, primary actions and factual status cards;
- irrigation pressure remains text-only and is resolved from `sensor.nikas_h2000_pro_voda_na_poliv_2`.

### Confirmed irrigation pressure and full-width manifold v0.5.9

The pressure readout is bound first to the confirmed Home Assistant entity `sensor.nikas_h2000_pro_voda_na_poliv_2`. It is presented as text only (`Давление полива: 2,90 bar`) with two decimal places; the obsolete gauge pictogram is removed. The manifold, all six valve-state overlays, vertical valve-to-zone branches and zone cards now share the full diagram width and the same measured valve centers.

### Self-contained production frontend v0.4.3

The production panel follows the mandatory NikaS specialized-panel frontend release standard:

```text
Home Assistant
      ↓
/nikas-ho-sc-8w/irrigation-panel.js?v=0.6.4
      ↓
<nikas-ho-sc-8w-panel>
```

`irrigation-panel.js` is the only project-owned JavaScript bundle required at runtime. It does not import previous UI versions. Raster illustrations are separate optimized files under `frontend/assets/`, are served by the integration itself, and use `?v=0.6.4` cache busting. The bundle contains no Base64 images and does not fetch image assets from external servers.

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
