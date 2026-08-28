# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Changed

- `1.0.0-b005.47` / panel `0.6.29`: fix physical IIC-800 local manual starts. DP101 now enters and confirms `Manual` before DP45, and requested durations are encoded in DP45 bytes 2–17 as required by the controller. The fail-safe `OFF` remains active only when the corrected start is not confirmed by DP101/107/108.

- `1.0.0-b005.46` / panel `0.6.29`: require a complete, finite and non-future source-route hand-off before the Header return plaque can consume it; orphaned route/timestamp values now fail closed to the saved/configured safe route.
- `1.0.0-b005.46` / panel `0.6.29`: adopt NikaS UI Standard v1.9 data-truth, autonomous-bundle and version-coherence guards without changing the integration-owned confirmed watering command contract.

- `1.0.0-b005.46` / panel `0.6.28`: keep seasonal adjustment display-only on the first page and move its confirmed editor to the `Сезон` tile on `Программа`; the DP103 validation, confirmation and read-back contract is unchanged.
- `1.0.0-b005.46` / panel `0.6.28`: render duration and every start time on separate lines for all six zone cards, using the readable bold time treatment previously shown only for Zone 6.
- `1.0.0-b005.46` / panel `0.6.28`: rebuild the panel against rule set 1.17 and the NikaS v1.8 fixed-chrome, stable-DOM and responsive 1280×800 reference geometry.

- `1.0.0-b005.45` / panel `0.6.27`: add a validated manual-watering queue for production zones 1–6 with independent 1–120 minute durations, one confirmed start action, confirmed stop/Auto actions and DP101/107/108 read-back.
- `1.0.0-b005.45` / panel `0.6.27`: make seasonal adjustment writable through an explicit `Применить` action only; validate the −90%…100% range and 10% step, require confirmation and verify DP103 after the write.
- `1.0.0-b005.45` / panel `0.6.27`: enforce the shared write contract in both the frontend and integration: local draft → explicit action → user confirmation → integration-owned command → factual controller read-back. The frontend never constructs or sends raw Tuya payloads.

- `1.0.0-b005.44` / panel `0.6.26`: render zone artwork at its complete intrinsic aspect ratio on the Zones list and zone-detail screens; secondary thumbnails now use centered `contain` sizing instead of exposing a 62×62 fragment of the original 512×512 background.
- `1.0.0-b005.44` / panel `0.6.26`: derive secondary zone-asset cache keys from the single UI version constant so the artwork and production bundle cannot drift to different browser-cache revisions.

- `1.0.0-b005.43` / panel `0.6.25`: replace the low-resolution landscape crops with sharp square zone thumbnails designed for 62 px cards: lawn sprinkler for zones 1–3, explicit flowers for zone 4, shrub drip irrigation for zone 5 and a close greenhouse for zone 6.
- `1.0.0-b005.43` / panel `0.6.25`: replace the ambiguous muted folded umbrella with a recognizable open outline umbrella when rain accounting is disabled; reserve the help-circle outline for missing data.

- `1.0.0-b005.42` / panel `0.6.24`: remove the hard-coded `UI v0.6.22` from the late Header override, derive every visible version from one bundle constant and synchronize an already-mounted stable Header without rebuilding its DOM.
- `1.0.0-b005.42` / panel `0.6.24`: add a repository guard that rejects any future hard-coded semantic version inside Header markup.

- `1.0.0-b005.41` / panel `0.6.23`: complete the accepted phone target with supported rain-accounting icons for all three states, including an explicit muted unknown indicator for zone 6.
- `1.0.0-b005.41` / panel `0.6.23`: make idle topology links neutral while retaining blue active and orange queued emphasis; compact single-start zone rows, keep every multi-start time explicit and add bottom scroll clearance above the fixed navigation.

- `1.0.0-b005.40` / panel `0.6.22`: render every DP38 start time explicitly across Program, Zones and zone detail; replace the `first +N` abbreviation with wrapping time chips that support all six schedule slots.
- `1.0.0-b005.40` / panel `0.6.22`: label the status summary as the first configured start rather than an unverified next event, and reserve three fixed zone-indicator columns so missing rain data remains visible.

- `1.0.0-b005.39` / panel `0.6.21`: remove the photorealistic valve row and black manifold from the status screen; retain a compact controller-to-six-zone topology with numbered nodes, thin links and live active/queued colour states.
- `1.0.0-b005.39` / panel `0.6.21`: keep the rain-accounting indicator visible for every production zone, including missing data; give the centered parent-return title a visible plaque treatment.
- `1.0.0-b005.39` / panel `0.6.21`: replace developer-facing Program and Manual copy, move DP38 cache detail back to Diagnostics, and report manual control as unavailable until a verified command path exists.

- `1.0.0-b005.38` / panel `0.6.20`: consolidate the approved mobile UI into the single production `irrigation-panel.js` bundle, remove the runtime patch import and synchronize panel metadata and automated guards.
- `1.0.0-b005.38` / panel `0.6.20`: restore the accepted zone scenes (1–3 lawn, 4 flowerbed, 5 shrubs, 6 greenhouse), remove decorative glyph overlays, keep all three factual zone indicators visible and expand the zone detail view.
- `1.0.0-b005.38` / panel `0.6.20`: make the centered Header title a return plaque, remove the redundant product subtitle and report DP102 only as rain-sensor participation (`Учитывается / Не учитывается`) without claiming the unexposed wet-contact state.

- `1.0.0-b005.31` / panel `0.6.13`: complete the v1.6 stable-rendering contract with a lazy DOM cache for work views. Returning to a visited tab or zone subtree reattaches and point-patches the same node instead of rebuilding it; Header, viewport, canvas and Bottom Tab Bar remain mounted. Add HACS/Hassfest validation and declare config-entry-only setup explicitly.

- `1.0.0-b005.30` / panel `0.6.12`: align with NikaS Specialized Panel UI Standard v1.6 — mount Header, one zoom viewport and Bottom Tab Bar once, point-patch live telemetry, and preserve scroll/gesture state without tab or screen flicker.
- `1.0.0-b005.30` / panel `0.6.12`: use 23/14 px Header typography (21/13 narrow), enforce the 12–25 px meaningful-copy range, retain only the existing factual transport badge, and replace the redundant controller value `Онлайн` with `Локально`.

- `1.0.0-b005.29` / panel `0.6.11`: implement NIKAS Specialized Panel UI Standard v1.5 — native vertical scrolling with fixed origin at 100%, scale-gated axis-clamped pan above 100%, UPS Header plaques and 28 px Bottom Tab icons; tab changes return to top.

- `1.0.0-b005.28` / panel `0.6.10`: reduce the approved rain-sensor illustration to exactly 50% of its previous rendered size and move its label alongside the smaller body. Controller, wiring, manifold, zones and transform-canvas scaling are unchanged.
- `1.0.0-b005.28` / panel `0.6.10`: restore the original HACS delivery model through the custom repository's `main` branch; stop creating automatic GitHub Releases when the integration manifest changes.
- `1.0.0-b005.27` / panel `0.6.9`: ship the final approved rain-sensor cutout instead of the oversized diagonal-bracket revision. The new local WebP uses a compact vertical warm-white body, clear ventilation slots, a short rear aluminum plate and no dangling cable.
- `1.0.0-b005.27` / panel `0.6.9`: preserve the accepted controller/valve/zone geometry and v1.3 transform-canvas scaling; only the versioned rain-sensor asset and cache key change.
- `1.0.0-b005.26` / panel `0.6.8`: replace the iOS-unstable CSS `zoom` implementation with one idempotent Pointer Events transform canvas. Header, native HA menu, refresh action and Bottom Tab Bar remain at native scale while the work area supports focal-point pinch and pan.
- `1.0.0-b005.26` / panel `0.6.8`: align with NikaS Zoom v1.3 — 75–200% range, 100% default, per-client/per-view persistence, 97–103% snap and two-finger double-tap reset with a temporary `Масштаб 100%` confirmation; remove permanent zoom controls.
- `1.0.0-b005.25` / panel `0.6.7`: align the zoom percentage control with the shared specialized-panel standard: pressing the current percentage now resets the content to 100%, while the persisted initial/default scale remains 75%.
- `1.0.0-b005.24` / panel `0.6.6`: move the live irrigation-pressure value from beneath the zone cards into the connection-status stack below `Локально`, preventing the value from being clipped or covered at any zone-card height.
- `1.0.0-b005.24` / panel `0.6.6`: add content-only panel zoom with a persisted 75% default, on-screen minus/reset/plus controls, two-finger pinch centered on the touch midpoint and horizontal panning when enlarged; keep the Header and Bottom Tab Bar fixed at native size.
- `1.0.0-b005.23` / panel `0.6.5`: replace the generic clamp-style rain detector with an original unbranded asset informed by the Hunter Rain-Clik construction: warm matte polycarbonate, prominent vertical vents, an adjustable upper section and a restrained aluminum extension bracket.
- `1.0.0-b005.23` / panel `0.6.5`: retain a truly transparent local WebP and all dynamic interface layers; no Hunter photograph, branding, labels or external image URL is embedded in the HACS integration.
- `1.0.0-b005.23` / panel `0.6.5`: publish versioned HACS-ready GitHub releases directly from the integration manifest after validated changes reach `main`.
- `1.0.0-b005.22` / panel `0.6.4`: replace the incorrect metallic cylindrical rain sensor with an accurate off-white slotted plastic detector, articulated clamp and short cable reconstructed from the supplied product reference.
- `1.0.0-b005.22` / panel `0.6.4`: enlarge the real sensor without crossing the valve control bus and terminate the orthogonal controller cable at the detector lead instead of inside the label.
- `1.0.0-b005.21` / panel `0.6.3`: replace the blurred 204×285 opaque rain-sensor thumbnail with an optimized 420×577 transparent WebP derived from the high-resolution source.
- `1.0.0-b005.21` / panel `0.6.3`: preserve the sensor's natural proportions, move its label clear of the body and route the grey cable to the lower sensor terminal without a visible gap.
- `1.0.0-b005.20` / panel `0.6.2`: replace the incorrect opaque manual-valve thumbnails with a transparent high-resolution irrigation solenoid-valve cutout; the repeated valve elements now reveal one continuous black manifold rail.
- `1.0.0-b005.20` / panel `0.6.2`: reconnect the grey control drops and blue hydraulic branches to every valve, move the control-wire caption clear of channels 4–6, increase zone-card content space and reduce the mobile schematic height without breaking the shared 1–6 axes.
- `1.0.0-b005.19` / panel `0.6.1`: move every production illustration out of the JavaScript bundle into `custom_components/nikas_ho_sc_8w/frontend/assets/`; serve them through the integration-owned `/nikas-ho-sc-8w/` static route with query-string cache busting.
- `1.0.0-b005.19` / panel `0.6.1`: add a machine-readable asset manifest and CI checks that reject missing files, inline Base64 images and externally hosted image URLs while preserving the approved six-column valve-to-zone geometry and live Home Assistant data layers.
- `1.0.0-b005.18` / panel `0.6.0`: rebuild the status schematic as one responsive six-column grid. Each column now owns its valve number, valve image, vertical water branch and matching zone card, so valves 1–6 cannot drift away from zones 1–6 at any mobile width.
- `1.0.0-b005.18` / panel `0.6.0`: replace the fragile full-manifold background/SVG coordinate mix with repeated isolated valve visuals over one CSS manifold rail; keep the blue hydraulic inlet on the left, the grey controller-to-valve bus, and the rain sensor connected only to the controller.
- `1.0.0-b005.18` / panel `0.6.0`: adopt the approved S8 OMNI hierarchy below the hero — program/mode/telemetry summary, three primary actions and four factual status cards — while retaining text-only irrigation pressure from `sensor.nikas_h2000_pro_voda_na_poliv_2` and diagnostics-only Zone 8.
- `1.0.0-b005.17` / panel `0.5.9`: bind irrigation pressure to the confirmed Home Assistant entity `sensor.nikas_h2000_pro_voda_na_poliv_2`, render the value as text-only `Давление полива: 2,90 bar`, and retain conservative fallback discovery for compatible `Вода на полив` sensors measured in bar.
- `1.0.0-b005.17` / panel `0.5.9`: remove the obsolete pressure-gauge pictogram and stretch the manifold, six valve overlays, strict vertical valve-to-zone branches and six zone cards across the diagram's usable width with shared measured centers.
- `1.0.0-b005.16` / panel `0.5.8`: replace the incorrect tall white controller crop with an accurate wide turquoise INKBIRD / HiOazo HO-SC-8W front product cutout reconstructed from the supplied reference, including the LCD and eight-zone identity; preserve its natural proportions and reconnect the rain/control wires orthogonally.
- `1.0.0-b005.16` / panel `0.5.8`: enforce an 11 px mobile copy floor equal to the `Локально` badge and expand zone, KPI, core-node, mode and navigation geometry so secondary labels no longer collapse into unreadable microtype.
- `1.0.0-b005.15` / panel `0.5.7`: reroute incoming water from the pressure gauge vertically upward and into the left end of the manifold with strict orthogonal segments; remove the bottom traverse, right riser and baked-in right blue branch.
- `1.0.0-b005.15` / panel `0.5.7`: retain exact `Датчик давления полив` lookup and add a conservative pressure-plus-irrigation entity-name fallback for Home Assistant installations whose generated friendly name differs.
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
