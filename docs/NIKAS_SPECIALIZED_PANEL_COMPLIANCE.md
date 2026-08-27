# Specialized Panel Compliance Audit

**Audit target:** NikaS Specialized Panel UI Standard v1.6
**Runtime:** `custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js` v0.6.13
**Manifest:** integration `1.0.0-b005.33`

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
| Fixed UPS Header | PASS | 52/1fr/52 (48 narrow), 62/60 minimum plus safe area, 44×44 radius-16 bordered plaques, 25 px MDI icons, 23/14 typography (21/13 narrow); menu and Refresh use theme text/primary colours. |
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
