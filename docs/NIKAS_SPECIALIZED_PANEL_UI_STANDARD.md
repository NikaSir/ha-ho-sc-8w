# NikaS Specialized Panel UI Standard v1.3

**Status:** REQUIRED  
**Canonical source:** `NikaSir/ha-contract-generated-ui`  
**Canonical documents:** `docs/SPECIALIZED_PANEL_SHELL_STANDARD.md`, `docs/SPECIALIZED_PANEL_ZOOM_STANDARD.md`, `docs/INTEGRATION_DASHBOARD_UI_STANDARD.md`  
**Field reference:** Stark SolarPower mobile panel  
**Local role:** synchronized implementation snapshot; do not create repository-specific variants.

## Ownership boundary

This repository owns domain/integration UI: entities, telemetry, commands, cards, device/domain semantics and diagnostics. The shared standard owns safe areas, Header, Home Assistant menu behavior, peer-device selector placement, zoom viewport behavior and Bottom Tab Bar.

**Migration rule:** do not refactor domain UI while adopting shell v1.3.

## Header and safe area

- Safe area is consumed exactly once; no device-specific offsets.
- No Header content may render under notch/Dynamic Island.
- Permanent left Header control is always Home Assistant system menu `☰`.
- It MUST dispatch the standard `hass-toggle-menu` event.
- It is never Back, browser history, integration drawer or device action.
- Parent/drill-down navigation, if required, belongs inside work area.
- Title is geometrically centered; at most one shell/global action is on right.
- Header/menu/title/right action remain native scale.

## Device Selector

When the application has multiple peer physical devices:

- selector is directly below Header;
- selector remains native scale and outside zoom viewport;
- device order is fixed;
- selection does not reorder devices;
- selected peer survives Bottom Tab changes;
- detailed content belongs only to selected peer.

Subordinate channels are not peer devices merely because they are selectable.

## Bottom Tab Bar

- Primary 3–5 sections use one full-width fixed edge-attached Bottom Tab Bar.
- It respects effective bottom safe area/Home Indicator.
- Active tab is unambiguous; icon + short label.
- Final work content scrolls fully above bar.
- Bottom Tab Bar remains native scale.

## Zoom — Stark field baseline

- Exactly one zoomable work viewport exists per panel instance.
- Only work area scales; Header, Device Selector and Bottom Tab Bar stay native.
- Primary interaction is two-finger focal-point pinch.
- Enlarged content can pan/scroll.
- Permanent on-screen `− / % / +` controls are not used.
- When pinch ends at **97–103%**, scale snaps to exactly **100%**.
- **Two-finger double tap** resets scale and work-area scroll to **100%**.
- Reset briefly shows native-scale confirmation `Масштаб 100%`.
- Scale persists locally per panel/client and preferably per peer device when applicable.
- Shell installation/reconciliation is idempotent: never wrap an already zoomable area again.
- Repeated HA updates must not create nested wrappers, duplicate gesture handlers, blank wrapper space or progressive shrinkage.

## Visual/data rules from Stark experience

- Normal measurements use neutral typography; semantic colors are reserved for confirmed health/warning/fault.
- `unknown`, `unavailable`, stale/source loss never appear healthy.
- Backend semantic entities/thresholds own factual meaning; frontend does not silently duplicate business logic.
- Do not invent unsupported runtime, watts, alarms or reserve estimates.
- Panel-critical artwork ships locally; no external CDN and no Base64 images in production JS.
- Background/context art contains no live HA values; dynamic values/status/flow layers remain separate runtime UI.
- Use version/cache busting for local frontend assets.
- Prefer native Home Assistant more-info/history for factual entity detail when appropriate.

## Render/delivery rules

- Avoid full UI rebuilds for unrelated Home Assistant state churn when practical.
- Optimization must preserve exactly one shell/work viewport, selected peer, active Bottom Tab and zoom state.
- Production frontend uses one deterministic entry module; historical modules are not runtime dependency chain.
- CI validates syntax, registration/manifest parity and packaged assets.

## Acceptance

A migration is accepted only when existing domain behavior is preserved and the panel passes real mobile checks for: safe areas, `hass-toggle-menu`, centered Header, native selector where applicable, fixed Bottom Tab Bar, focal-point pinch, 97–103% snap, two-finger reset + `Масштаб 100%`, persistence, exactly one zoom viewport after repeated HA updates, explicit unavailable/stale states and unchanged domain safety.

> Canonical policy remains in `ha-contract-generated-ui`. If this snapshot conflicts with a newer canonical standard, the canonical standard wins and this local copy must be synchronized.