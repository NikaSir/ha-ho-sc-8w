# Specialized Panel Compliance Audit

**Audit target:** NikaS Specialized Panel UI Standard v1.6
**Runtime:** `custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js` v0.6.27
**Manifest:** integration `1.0.0-b005.45`

## Compliance

| Requirement | Result | Evidence / blocker |
|---|---|---|
| One autonomous production bundle and one viewport/canvas | PASS | One `irrigation-panel.js`, one `.workViewport` and one `.workCanvas`; `module_url` points directly to the versioned bundle. |
| 75–200% focal pinch, 97–103 snap, two-finger reset toast, persistence | PASS | Scale constants, midpoint content coordinates, `_resetTransform()` and per-panel/view localStorage. |
| Native vertical scroll at 100%; x/y zero; no horizontal or one-finger transform pan | PASS | `isNative` uses `overflow-y:auto`, `overflow-x:hidden`, `touch-action:pan-y`; clamp returns x/y zero at scale <=1; the first pointer enters `native`, not `pan`. |
| Pan only above 100% and only overflowing axes | PASS | Pan starts only when `scale > 1`; independent minX/minY are derived from real scaled dimensions. |
| Clamp after gesture/render/resize | PASS | `_clampAndApplyTransform()` runs after gestures, render and real/visual viewport resize. |
| Tab transition returns to top, saved scale retained | PASS | `_switchView()` restores scale, resets x/y and pending native scroll to zero. |
| Hold/more-info and click guards | PASS | Second pointer/pan cancels pending holds; post-gesture clicks are suppressed; stationary hold remains. |
| Stable DOM / no flicker | PASS | `shadowRoot.innerHTML` is used only for initial shell mounting; telemetry point-patches existing nodes while Header, viewport, scroll and Bottom Tab Bar retain identity. |
| Lazy work-view DOM cache | PASS | Visited tab and zone structure nodes are cached by structural key, reattached on return and point-patched before display; shell and zoom owners are never replaced. |
| Fixed UPS Header | PASS | 52/1fr/52 (48 narrow), 62/60 minimum plus safe area, 44×44 radius-16 bordered plaques, 25 px MDI icons, 23/14 typography (21/13 narrow); menu and Refresh use theme text/primary colours. The centered title returns to the configured parent panel without adding a Header Back arrow. |
| Permanent left system menu | PASS | Header always emits composed/bubbling `hass-toggle-menu`; no Header Back action. |
| Fixed UPS Bottom Tab Bar | PASS | Shell grid row outside viewport, safe-area padding, equal tabs, minimum 52 px, `ha-icon` 28 px, labels 12/700, theme-derived 11% active background. |
| Meaningful typography 12–25 px | PASS | Final v0.6.13 rules raise semantic labels and values to 12 px or more and cap primary headings at 25 px; only the redundant control-wire caption remains 10 px. |
| Optional two-level indicator | PASS | Explicitly enabled for HO-SC-8W: canonical transport/freshness vocabulary, 16/13 typography, status tint, stable subtree and point-patched updates. |
| Machine-readable contract agrees | PASS | `panel.json` and registration declare native scroll at 100, fixed origin, >100-only axis pan, resize clamp and tab-top reset. |
| Repository validation | PASS | Local syntax, JSON, Python and asset checks pass; CI now runs the repository contract guard, HACS Action and Home Assistant Hassfest for every pull request. |
| Approved icon source preserved | PASS | Existing 256×256 RGBA `custom_components/nikas_ho_sc_8w/brand/icon.png` is unchanged and now shown in README. |
| Integration icon visible through supported HA Brands path | GAP | Repository-local brand art alone cannot publish the HA integration icon. Submit the approved source as `icon.png` and `icon@2x.png` for domain `nikas_ho_sc_8w` through Home Assistant Brands; add dark variants only if required. |
| GitHub social preview/avatar | GAP | Repository settings are external to this code PR. Reuse the approved icon; do not redraw it. |
| iPhone field acceptance | GAP | Static and CI checks pass, but Companion App verification is still required after installation. |

## Required phone check

At 100% verify native scrolling on Diagnostics, no horizontal/top displacement and immediate tap/hold response. Above 100% verify only necessary axes pan and every release/resize remains clamped. Confirm Header and Bottom navigation stay fixed and match UPS.

## UI 0.6.15 composition delta

- Status strip removed from the first screen.
- Standard two-level connection/freshness indicator enabled by explicit product request.
- Pressure remains compact in the hero; duplicate status cards are absent.
- Rain sensor moved away from the controller and linked by one direct horizontal midline.
- Phone schematic height is viewport-responsive to consume the freed first-screen space without changing Header/Bottom Tab Bar geometry.
- Zoom/scroll engine is unchanged: one viewport/canvas, native vertical scroll at 100%, >100% axis-aware pan, two-finger reset.

## UI 0.6.22 composition delta

- The redundant `СОСТОЯНИЕ СИСТЕМЫ` eyebrow and control-wire caption are removed.
- The status view is explicitly sized to the work viewport and has no native vertical scroll at 100%; long views such as Diagnostics retain native vertical scrolling.
- Zone cards again show image, `Зона N`, factual activity state and DP38 programmed duration at the 12 px semantic-text floor.
- Summary row is `Программа / Режим / Сезонная коррекция`; telemetry age remains represented by the connection freshness indicator rather than a duplicate card.
- Rain sensor text reports only factual DP102 participation semantics: `Учитывается / Не учитывается / Нет данных`. The current wet-contact blocking state is not claimed because the integration does not expose it.
- Zone scenes follow the accepted mapping: zones 1–3 lawn, zone 4 flowerbed, zone 5 shrubs and zone 6 greenhouse. Decorative glyph overlays are absent.
- Every zone keeps readiness, program and rain-accounting indicators visible; a disabled rain flag is shown as a muted crossed umbrella rather than removing the indicator.
- The production entrypoint is one self-contained bundle; the temporary `approved-v0619.js` runtime layer is removed and the loaded bundle is the one validated by CI.
- The status view no longer renders photorealistic valves or a manifold. A compact control topology preserves controller-to-zone relationships and live active/queued emphasis without decorative plumbing.
- Every production zone retains three indicators. Missing rain-accounting data uses a muted crossed umbrella instead of collapsing the third slot.
- Program uses user-facing Russian copy and keeps DP38 cache state in Diagnostics. Manual control is explicitly unavailable until its command path is verified.
- All one-to-six DP38 start times are rendered explicitly on Program, Zones and zone-detail views. The UI no longer replaces additional times with a `+N` counter; time chips wrap and the native 100% scroll path carries the taller content.
- The status summary labels the earliest configured time as `Первый запуск`, not as a computed next irrigation event. Every compact zone card reserves three fixed indicator columns, so unknown rain-accounting data cannot collapse the third icon.
- Pinch, reset, pan, one viewport/canvas and stable DOM architecture are unchanged.

## UI 0.6.23 phone-target completion

- Every zone now renders all three fixed indicators with official Material Design Icons: green umbrella when rain accounting is enabled, muted closed umbrella when disabled and muted outline umbrella when the DP38 flag is absent.
- Idle controller-to-zone links are neutral gray; active links remain blue and queued links remain orange, so color communicates live state rather than decorative water flow.
- A zone with one configured start keeps duration and time on one compact line. Multiple starts remain fully expanded without `+N`, including all three zone 6 times in the accepted phone sample.
- The Zones view includes dedicated bottom scroll clearance so the final card can be raised completely above the fixed Bottom Tab Bar on iPhone safe-area layouts.
- Header, Bottom Tab Bar, stable DOM and the 75–200% work-canvas zoom implementation are unchanged.

## UI 0.6.24 Header version synchronization

- One module-level constant is now the source of truth for the bundle, Header and asset cache version.
- The late production Header override no longer contains a stale literal version.
- An already-mounted stable Header is point-patched only when its version text differs; the Header subtree is not rebuilt and telemetry updates remain flicker-free.
- CI rejects hard-coded `UI vX.Y.Z` text inside Header markup.

## UI 0.6.25 readable zone assets

- Four new 512×512 WebP sources are composed for the actual 62 px phone thumbnail: one central subject, high local contrast and no decorative overlays.
- Zones 1–3 use a large lawn sprinkler, zone 4 uses large red, pink and yellow flowers, zone 5 uses a centered shrub with a visible drip line and zone 6 uses a close greenhouse.
- Rain accounting uses a solid green umbrella when enabled and a muted open outline umbrella when disabled. Missing DP38 rain data uses a separate help-circle outline instead of an ambiguous folded umbrella.

## UI 0.6.26 secondary image framing

- Zone-list and zone-detail artwork uses centered `contain` sizing and no repetition, so the complete 512×512 image is visible inside every secondary card.
- The first-screen diagram retains its separately approved framing and geometry.
- Asset query versions are derived from the same module-level UI version constant as the Header and bundle registration.

## UI 0.6.27 verified controller actions

- Manual watering supports an ordered selection of production zones 1–6 and an independent 1–120 minute duration for every selected zone.
- One explicit start button presents the complete queue for confirmation; stop and return-to-Auto actions have their own confirmations.
- Seasonal adjustment remains a local draft while typing. `Применить` or Enter opens the same confirmation and only then calls the integration service.
- The frontend never writes raw Tuya DPs. Integration-owned services validate DP45/DP101/DP103 commands and report success only after DP101/107/108 or DP103 read-back matches the requested state.
- The permanent Header, Bottom Tab Bar and zoom canvas remain outside all device-action controls.
