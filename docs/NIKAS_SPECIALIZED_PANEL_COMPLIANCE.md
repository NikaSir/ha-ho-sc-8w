# Specialized Panel Compliance Audit

**Audit target:** NIKAS Specialized Panel UI Standard v1.5
**Runtime:** `custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js` v0.6.11
**Manifest:** integration `1.0.0-b005.29`

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
| Fixed UPS Header | PASS | 52/1fr/52 (48 narrow), 62/60 minimum plus safe area, 44×44 radius-16 bordered plaques, 25 px MDI icons, 21/12 typography; menu and Refresh use theme text/primary colours. |
| Permanent left system menu | PASS | Header always emits composed/bubbling `hass-toggle-menu`; no Header Back action. |
| Fixed UPS Bottom Tab Bar | PASS | Shell grid row outside viewport, safe-area padding, equal tabs, minimum 52 px, `ha-icon` 28 px, labels 12/700, theme-derived 11% active background. |
| Machine-readable contract agrees | PASS | `panel.json` and registration declare native scroll at 100, fixed origin, >100-only axis pan, resize clamp and tab-top reset. |
| Approved icon source preserved | PASS | Existing 256×256 RGBA `custom_components/nikas_ho_sc_8w/brand/icon.png` is unchanged and now shown in README. |
| Integration icon visible through supported HA Brands path | GAP | Repository-local brand art alone cannot publish the HA integration icon. Submit the approved source as `icon.png` and `icon@2x.png` for domain `nikas_ho_sc_8w` through Home Assistant Brands; add dark variants only if required. |
| GitHub social preview/avatar | GAP | Repository settings are external to this code PR. Reuse the approved icon; do not redraw it. |
| iPhone field acceptance | GAP | Static and CI checks pass, but Companion App verification is still required after installation. |

## Required phone check

At 100% verify native scrolling on Diagnostics, no horizontal/top displacement and immediate tap/hold response. Above 100% verify only necessary axes pan and every release/resize remains clamped. Confirm Header and Bottom navigation stay fixed and match UPS.
