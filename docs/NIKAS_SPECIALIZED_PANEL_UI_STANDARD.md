# NikaS Specialized Panel UI Standard v1.0

**Status:** REQUIRED  
**Canonical source:** `NikaSir/ha-contract-generated-ui`  
**Canonical documents:** `docs/SPECIALIZED_PANEL_SHELL_STANDARD.md`, `docs/SPECIALIZED_PANEL_ZOOM_STANDARD.md`  
**Local role:** synchronized implementation snapshot; do not create repository-specific variants.

## Ownership boundary

This repository owns its domain/integration UI: entities, telemetry, commands, cards, device/domain semantics and diagnostics.

The shared NikaS shell standard owns only application chrome and viewport behavior:

```text
DEVICE / HA SAFE AREA
↓
SPECIALIZED PANEL HEADER                 native scale
↓
ZOOM CONTROLS                            native scale
↓
ZOOMABLE WORK VIEWPORT                   user scale
  └── domain/integration UI
↓
BOTTOM TAB BAR                           native scale
↓
BOTTOM SAFE AREA / HOME INDICATOR
```

**Migration rule:** do not refactor domain UI while adopting the shell. First migrate only Safe Area / Header / Back / Zoom / Bottom Tab Bar. Domain behavior must remain functionally unchanged.

## Top safe area and Header

- Respect `env(safe-area-inset-top, 0px)`, `right`, `bottom`, and `left` values.
- No title or control may render under a notch or Dynamic Island.
- Do not use device-specific fixes such as `top: 47px`.
- Header geometry is shared: Back left, geometrically centered title, at most one shell-level action right.
- Left/right rails should be symmetric; touch targets approximately 44×44 pt or larger.
- Back navigates to the declaratively defined canonical parent route, not browser history.
- Header remains at native scale and does not participate in user zoom.

## Bottom Tab Bar

- Primary in-app navigation with 3–5 sections uses one full-width fixed Bottom Tab Bar.
- It is edge-attached, not a floating card/pill.
- It respects `env(safe-area-inset-bottom, 0px)` and the iOS Home Indicator.
- Active tab must be unambiguous; items use icon + short label.
- Final work content must scroll fully above the bar.
- Domain UI must not add a competing bottom safe-area reserve.
- Bottom Tab Bar remains at native scale.

## Zoom

Every specialized panel supports both:

- pinch-to-zoom with two fingers;
- on-screen `− / percentage / +` controls.

Required defaults:

- minimum `75%`;
- maximum `200%`;
- button step `10%`;
- tapping percentage resets to `100%`.

Behavior:

- pinch scales around the point between the fingers;
- enlarged content can pan/scroll to every region;
- only the work viewport scales;
- Home Assistant chrome, Header, Back, zoom controls and Bottom Tab Bar remain native-sized;
- scale is stored locally per panel/per client;
- responsive mobile/tablet/desktop layout is selected before user zoom;
- zoom must not change entity semantics, thresholds, `unknown/unavailable`, routes, confirmations or commands.

## Prohibited patterns

Do not introduce:

- repository-specific Header geometry;
- repository-specific Bottom Tab Bar geometry;
- independent pinch/zoom implementation incompatible with the canonical contract;
- whole-page/browser zoom as panel zoom;
- hard-coded notch/Home Indicator offsets;
- simultaneous domain refactor during shell migration.

## Acceptance

A migration is accepted only when the panel keeps its existing domain behavior and additionally satisfies: safe Header below the notch/Dynamic Island, explicit Back, fixed full-width bottom navigation above the Home Indicator, pinch + `−/%/+`, focal-point zoom, pan/scroll when enlarged, 100% reset, per-panel persistence, and native-sized shell navigation.

> Canonical policy remains in `ha-contract-generated-ui`. If this snapshot conflicts with a newer canonical standard, the canonical standard wins and this local copy must be synchronized.