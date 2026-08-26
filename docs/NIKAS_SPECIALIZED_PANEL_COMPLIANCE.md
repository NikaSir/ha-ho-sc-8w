# Specialized Panel Compliance Audit

**Audit target:** NikaS Specialized Panel UI Standard v1.4
**Audited main:** `6455cd2a0a9db6166de7484650b176e5587df17a`
**Runtime inspected:** `custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js`
**Policy:** audit only; runtime is intentionally unchanged in this PR.

## Summary

The panel already has a single transform canvas, midpoint pinch, correct scale range, reset/snap, local persistence, local assets and native HA menu event. It does **not** yet satisfy the new 100% scrolling model or the exact UPS Header/Bottom Tab Bar geometry.

## Compliance

| Requirement | Result | Evidence / required correction |
|---|---|---|
| One work viewport/canvas; shell outside it | PASS | `_workspace()` emits one `.workViewport` and one `.workCanvas`; Header and `.bottomNav` are siblings. |
| Pinch midpoint, 75–200%, 97–103% snap, two-finger reset/toast | PASS | `VIEW_SCALE_*`, `beginPinch()`, `finishPointer()`, `_resetTransform()`. |
| Scale persisted per panel/client/view | PASS | `VIEW_STATE_PREFIX`, `_transformStorageKey()`, localStorage. |
| 100% native vertical scroll; x/y zero; no one-finger pan | GAP | `pointerdown` always starts `type: "pan"`; `pointermove` prevents default; `.workViewport`/canvas use the transform gesture surface. Switch to native vertical scrolling at 100%, force x/y to zero, and do not capture/prevent a single pointer. |
| Pan only above 100% | GAP | One-pointer pan starts at every scale, including 75–100%. Gate pan on `scale > 1`. |
| Pan only on overflowing axes; edge clamp; resize clamp | PASS (for transform mode) | `_clampAndApplyTransform()` calculates independent `minX/minY`; resize calls it. Preserve this when restricting transform pan to >100%. |
| Tab change returns to top and invalid offsets reset | GAP | Tab handlers change `_view` and restore per-view saved x/y. Reset native scrollTop to zero and re-clamp saved scale with new x/y origin on every view transition. |
| More-info protection | PASS | Second pointer cancels long press; gesture movement dispatches `pointercancel`; synthetic clicks are suppressed. |
| Header safe area, HA menu, Refresh command | PASS (behaviour) | `hass-toggle-menu` is bubbling/composed; menu and Refresh use `ha-icon`; safe-area is present. |
| UPS Header geometry and colour | GAP | Mobile overrides use 36×36 buttons, 13px radius, 22px icons, 36px rails, 52px Header, 19px title and 8.5/11px subtitle. Base uses 56×56. Required: 44×44, radius 16, icon 25, 52/1fr/52 (48 rails narrow), 62/60 height, title 21/800, subtitle 12/~560, card background/border/shadow, menu primary-text, Refresh primary. |
| Bottom Bar fixed/full-width/safe-area and `ha-icon` | PASS | Fixed full-width `.bottomNav`, equal grid, safe-area and MDI via `ha-icon`. |
| UPS Bottom Bar sizing/theme | GAP | Runtime uses 23px mobile/25px base icons, 11px forced labels, 62–65px tabs, radius 15–17 and fixed active colour. Required: icon 28, label 12/700, minimum tab 52, active 13–14 radius and ~11% `var(--primary-color)` background. |
| Manifest agrees with new runtime policy | GAP | `panel.json` says `pan_when_enlarged: true` but does not declare native-scroll-at-100, x/y origin, axis gating or tab-top reset. Update it together with runtime. |
| Local production assets and stable entry | PASS | Local WEBP assets, single `irrigation-panel.js`, versioned URLs, no runtime historical import. |
| HACS/HA integration path | PASS | `hacs.json` category is installed as custom Integration; README, domain `nikas_ho_sc_8w` and manifest agree. |
| Approved source brand asset exists | PASS | Square RGBA `custom_components/nikas_ho_sc_8w/brand/icon.png`, 256×256. |
| Integration icon is actually wired | GAP | The private `brand/icon.png` path is not a supported HA/HACS brand delivery path. Supply approved `icon.png` and `icon@2x.png` under the Home Assistant Brands custom-integration path for domain `nikas_ho_sc_8w`; add dark variants only if the approved art is not theme-neutral. |
| Repository visual identity | GAP | README has no logo/hero reference and the repository file cannot set GitHub social preview/avatar. Reuse the approved icon (do not redraw), add a README visual, and configure the repository social preview in GitHub settings. |

## Runtime contradictions to remove in the implementation PR

1. “Pan/scroll when enlarged” in the earlier v1.3 snapshot was implemented as transform pan at every scale; v1.4 requires native vertical scroll at 100% and transform pan only above 100%.
2. CSS mobile overrides shrink Header controls below the new fixed 44×44 UPS plaque.
3. Later typography rules force Bottom labels to 11px and later colour overrides hard-code the active tab instead of theme-derived ~11%.
4. Per-view transform persistence restores offsets on tab entry, contradicting mandatory return-to-top behaviour.

## Required phone acceptance after runtime correction

Test Status and long Diagnostics on iPhone: native vertical scroll at 100%; no sideways/top displacement; taps and holds remain native; pinch and axis-limited pan work only above 100%; release/resize stays clamped; Header and Bottom Bar remain fixed; menu/Refresh plaques and 28px tab icons match UPS.
