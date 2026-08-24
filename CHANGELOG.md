# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Changed

- `1.0.0-b005.14` / panel `0.5.6`: preserve one approved diagram aspect ratio across mobile and wide screens so the controller, rain sensor and manifold are no longer vertically compressed.
- `1.0.0-b005.14` / panel `0.5.6`: replace the small embedded JPEG crops with cleaned 3× WebP assets for sharper high-density rendering without increasing the production bundle footprint materially.
- `1.0.0-b005.14` / panel `0.5.6`: resolve the Home Assistant entity named `Датчик давления полив`, show its live state and unit on the incoming mainline and core-node card, and keep missing/unavailable readings fail-closed.
- `1.0.0-b005.13` / panel `0.5.5`: restore the approved light status render as the visual source of truth: full-width realistic manifold, physical controller and rain sensor, photographic zone thumbnails, larger diagram field and the original white-card hierarchy.
- `1.0.0-b005.13` / panel `0.5.5`: isolate the approved light palette from Home Assistant dark-theme text variables, preventing white-on-white and faded status content; a separate dark treatment is deferred until it can preserve the approved geometry.
- `1.0.0-b005.13` / panel `0.5.5`: retain the verified schematic topology and strict one-to-one vertical valve-to-zone routing while replacing the unrelated compact card composition.
- `1.0.0-b005.12` / panel `0.5.4`: restore the accepted compact iPhone status composition after the v0.5.3 topology update enlarged the diagram and exposed legacy mobile geometry.
- `1.0.0-b005.12` / panel `0.5.4`: align the exact centers of valves 1–6 with zone cards 1–6, reduce first-screen cards and navigation geometry, and retain the corrected separated water and electrical paths.
- `1.0.0-b005.11` / panel `0.5.3`: correct the system schematic topology. Water now follows only `incoming mainline → manifold → valve → zone`; the controller is connected to all six valve actuators by a separate grey control-wire bus, and the rain sensor is wired only to the controller.
- `1.0.0-b005.11` / panel `0.5.3`: place zones 1–6 in one row directly below valves 1–6 and use strict vertical one-to-one water paths without curves, crossings or side branches.
- `1.0.0-b005.11` / panel `0.5.3`: add a pressure-gauge presentation on the incoming mainline while preserving fail-closed truthfulness: the UI continues to show `Нет датчика` until a verified pressure entity exists.
- `1.0.0-b005.10` / panel `0.5.2`: align the production status screen with the approved irrigation render: `Состояние системы` hero, controller → six-valve manifold → zones 1–6 visualization, four factual KPI tiles, `Основные узлы`, `Текущий режим`, and the fixed five-tab navigation.
- `1.0.0-b005.10` / panel `0.5.2`: replace the integration-owned drawer with the native Home Assistant sidebar trigger. The upper-left `mdi:menu` control emits `hass-toggle-menu`; the upper-right control remains factual `homeassistant.update_entity` refresh.
- `1.0.0-b005.10` / panel `0.5.2`: preserve fail-closed semantics while matching the design. The mainline remains `Нет датчика`, Zone 8 remains diagnostics-only, Pause remains unavailable without a verified action API, and no raw DP38/DP45 write is introduced.
- `1.0.0-b005.9` / panel `0.5.1`: replace the Header Back control with a real panel menu and add a factual forced-refresh action on the right; the menu exposes the five panel sections and an explicit return to `/dashboard-actions`.
- `1.0.0-b005.9` / panel `0.5.1`: polish the primary status screen toward the approved visual render — larger controller/manifold composition, pictorial CSS zone thumbnails, separate next-watering card, tighter mainline/rain placement and removal of the redundant current-mode block from the status page.
- `1.0.0-b005.9` / panel `0.5.1`: preserve the factual boundary: mainline stays `Нет датчика`, Zone 8 stays diagnostics-only, `unknown/unavailable` are never healthy, and no raw DP38/DP45 write or unverified control action is introduced.
- `1.0.0-b005.8` / panel `0.5.0`: redesign the primary irrigation surface around a dynamic system-state visualization inspired by the shared NikaS ZONT / S8 OMNI application language. The panel now shows controller → six-valve manifold → zones 1–6, with active and queued paths derived from factual Home Assistant telemetry.
- `1.0.0-b005.8` / panel `0.5.0`: move primary navigation to `Состояние · Зоны · Программа · Ручной · Диагн.` and add dedicated production-zone and read-only DP38 program views.
- `1.0.0-b005.8` / panel `0.5.0`: keep the visualization fail-closed — the mainline / master-valve tile explicitly says `Нет датчика` because no verified source exists; Zone 8 remains diagnostics-only; no raw DP38/DP45 write or unverified control action is introduced.
- `1.0.0-b005.7` / panel `0.4.4`: align the irrigation shell with NikaS Integration Panel Template v1.0 — icon-only Back, symmetric 52/52 px Header slots (48/48 narrow), centered title and unchanged fixed Bottom Tab Bar.
- `1.0.0-b005.7` / panel `0.4.4`: UI-only standardization; controller logic, DP handling and write safety are unchanged.
- `1.0.0-b005.6` / panel `0.4.3`: expand the iPhone Pro Max Overview vertically to use the full field above the fixed Bottom Tab Bar while keeping zones 1–6 visible without first-screen scrolling.
- `1.0.0-b005.6` / panel `0.4.3`: enlarge Overview hero/status/next-watering and zone cards proportionally; controller behavior, DP handling and write safety are unchanged.
- `1.0.0-b005.5` / panel `0.4.2`: harden specialized-panel loading to the mandatory NikaS frontend release standard. Home Assistant now registers one stable `irrigation-panel.js` production bundle with query-string cache busting; the bundle contains the complete panel implementation and has no runtime imports of previous UI versions.
- `1.0.0-b005.5` / panel `0.4.2`: remove the production runtime dependency chain `v041 → v040 → v033 → v032 → v03`; historical frontend versions remain available through Git history rather than browser loading.
- `1.0.0-b005.5` / panel `0.4.2`: keep the v0.4 information architecture (`Обзор · Ручной · Настройки · Диагн.`) and enlarge the fixed Bottom Tab Bar targets/icons while preserving the compact one-screen Overview target for zones 1–6.
- `1.0.0-b005.4` / panel `0.4.1`: compact Overview for iPhone Pro Max portrait so zones 1–6 fit on the initial screen together with current/next irrigation status.
- `1.0.0-b005.3` / panel `0.4.0`: move to the domain-oriented information architecture — Overview, Manual, Settings and Diagnostics; zone configuration becomes a drill-down and complete program verification becomes a read-only Diagnostics drill-down.
- `1.0.0-b005.2` / panel `0.3.3`: align Header geometry with NikaS Integration Dashboard UI Standard v1.2 — viewport-centered title, no decorative Header icon, explicit Back.
- `1.0.0-b005.1` / panel `0.3.2`: align the irrigation application shell with Home Assistant NikaS specialized-panel UI standard — the primary Tab Bar is full-width, edge-attached to the viewport bottom, non-floating and iOS-safe.
- `1.0.0-b005` / panel `0.3.1`: finalize the Home Assistant NikaS specialized-panel application shell. Header Back explicitly navigates to `/dashboard-actions` and Home Assistant panel registration opts into safe-area handling.
- Renamed the GitHub repository from `ha-inkbird-irrigation` to `ha-ho-sc-8w` to match the supported HO-SC-8W scope.
- Kept the existing Home Assistant integration domain unchanged pending a separate compatibility-reviewed migration decision.

### Added

- Dynamic irrigation schematic with truthful controller, valve-channel, zone, rain-setting and mainline-source semantics.
- Five-tab mobile-first irrigation navigation matching the approved system-state render direction.
- CI release checks for JavaScript syntax, exactly one production frontend bundle, and rejection of historical-version runtime imports.
- Machine-readable panel metadata for the stable `/dashboard-irrigation` route, parent `/dashboard-actions`, current information architecture and self-contained frontend-bundle contract.
- Initial GitHub repository bootstrap and project boundary documentation.

> Historical integration/frontend versions are preserved in Git history; current production artifacts do not depend on them at runtime.
