# HO-SC-8W for Home Assistant

<p align="center">
  <img src="custom_components/nikas_ho_sc_8w/brand/icon.png" width="128" height="128" alt="HO-SC-8W Irrigation icon">
</p>

Custom Home Assistant integration for the **INKBIRD / HiOazo HO-SC-8W** irrigation controller.

## Status

The repository contains the standalone Home Assistant integration under the stable domain `nikas_ho_sc_8w` and an integration-owned irrigation panel.

The current runtime exposes only verified controller actions through integration-owned services. Schedule telemetry is decoded from the verified HO-SC-8W DP model; no frontend code writes raw Tuya DPs.

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

Sidebar title: **Автополив**
Primary UX target: **iPhone Pro Max · portrait · one-handed use**.  
Current panel version: **0.6.57** (the approved visual design remains based on 0.6.30).

The panel follows **NikaS Specialized Panel UI Standard v1.9** and the mandatory navigation/return contract:

It also conforms to **NikaS Integration Panel Template v1.9**.

- compact symmetric Header with the native Home Assistant `☰` menu;
- viewport-centered title and one global refresh action;
- full-width edge-attached non-floating Bottom Tab Bar;
- iOS Safe Area handling and bottom clearance;
- one autonomous work canvas; Header and Bottom Tab Bar stay at native scale;
- native vertical scrolling with x/y fixed at zero at 100%, focal-point pinch in the 75–200% range, and axis-clamped one-pointer pan only above 100%;
- two-finger double tap resets the work canvas to 100%; 97–103% snaps to 100%;
- scale and position persist locally without nesting wrappers during HA updates.
- Home Assistant telemetry patches existing nodes; Header, viewport, scroll position and Bottom Tab Bar are not reconstructed and do not flicker.
- previously opened work views are retained in a lazy DOM cache and reattached on return instead of being rebuilt.
- meaningful interface copy stays in the 12–25 px range; only a redundant schematic wiring caption uses 10 px.

### Information architecture v0.4

The user-facing application model is domain-oriented rather than protocol-oriented:

- **Состояние** — factual controller state, six-axis zone schematic and display-only program, mode and seasonal values;
- **Зоны** — production zones 1–6 with a complete read-only program drill-down: base duration, all six start slots, cycle mode/value and weekly days, cycle start date, seasonal adjustment, calculated next start and rain handling;
- **Программа** — direct 1–8 zone switching below the Header and the complete decoded read-only automatic program for the selected zone;
- **Ручной** — confirmed manual queue for zones 1–6 with an independent 1–120 minute duration per zone;
- **Диагн.** — integration health, decoded Zone 8 state, full read-only snapshots of zones 1–8 and one guarded Zone 8 mask-write test. Generic DP38 schedule writes remain disabled.

The only enabled DP38 schedule write is a fixed field experiment based on the controller's separate read/write selectors. A read report starts with the plain zone number (`08` for Zone 8), while a write starts with a one-hot bitmask (`80` for Zone 8). The experiment requires a fresh exact baseline for all eight zones with Zone 8 at `2026-09-04`, sends one 20-byte block as 40 uppercase ASCII-HEX characters, and changes only byte 18 from `04` to `05`. It sends once, never retries or rolls back, and remains unverified until a new full control snapshot confirms Zones 1–7 unchanged and Zone 8 exactly at `2026-09-05`.

The primary Bottom Tab Bar is:

```text
Состояние · Зоны · Программа · Ручной · Диагн.
```

The `Программа` tab shows the complete decoded DP38 schedule for zones 1–6 and owns only the confirmed seasonal-correction editor. Production schedule editing is not exposed. In Diagnostics, the Zone 8 editor decodes its duration, all six start slots, cycle mode/value, anchor date and rain flag directly from the latest repeated valid raw Zone 8 DP38 response; stale drafts cannot replace those factual values. Generic field editing, restoration and every production-zone write remain disabled. The raw observer continues to expose every returned valid or invalid block with request/response counts and the observed DP set. The fixed Zone 8 experiment requires local transport, physical Auto/ON, idle state and a fresh complete baseline; it then sends one masked block and requires a separate all-zone control snapshot. Production-zone recovery remains disabled.

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

The schematic now uses the real wide turquoise INKBIRD / HiOazo HO-SC-8W enclosure with its LCD, eight-zone marking and Wi-Fi-capable product identity instead of the incorrect tall white cabinet. Its proportions are preserved with `contain` rendering. Current v1.9 typography keeps meaningful mobile copy at 12 px or larger; only the redundant control-wire caption may use 10 px.

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

The production panel follows the mandatory NikaS specialized-panel frontend delivery standard:

```text
Home Assistant
      ↓
/nikas-ho-sc-8w/irrigation-panel.js?v=0.6.30
      ↓
<nikas-ho-sc-8w-panel>
```

`irrigation-panel.js` is the only project-owned JavaScript bundle required at runtime. It does not import previous UI versions. Raster illustrations are separate optimized files under `frontend/assets/`, are served by the integration itself, and use independent query-string cache busting. The bundle contains no Base64 images and does not fetch image assets from external servers.

This build uses a stable production filename plus query-string cache busting. Correct panel loading must not depend on a warm browser cache. Normal publication is through `main` and HACS; GitHub Releases are not used.

## Safety boundary

- Zones 1–6 are production irrigation zones.
- Zone 8 is reserved for controlled development/diagnostic tests and is not exposed as a normal user zone.
- `unknown` and `unavailable` are unreliable states, never normal/off.
- The frontend must never construct or send raw Tuya DP payloads.
- Every controller write follows local draft → explicit action → confirmation → integration-owned command → factual read-back.
- Header and Bottom Tab Bar elements never execute device actions.
- Long press on factual Home Assistant entity-backed controls opens standard Home Assistant more-info.
- Manual watering writes only after confirmed queue start/stop/Auto actions and verifies DP101/107/108.
- Seasonal correction is display-only on `Состояние`; only the `Сезон` tile on `Программа` can apply −90…100% in 10% steps, with confirmation and DP103 read-back.

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
