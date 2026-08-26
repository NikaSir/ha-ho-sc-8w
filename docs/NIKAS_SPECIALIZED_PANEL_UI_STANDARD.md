# NikaS Specialized Panel UI Standard v1.4

**Status:** REQUIRED  
**Canonical source:** `NikaSir/ha-contract-generated-ui`  
**Visual reference:** Stark SolarPower UPS panel

## Scope and ownership

This repository owns its domain UI, entities, telemetry, commands, cards, diagnostics and local assets. The shared NikaS standard owns application-shell behaviour. A shell-only migration must not silently change domain semantics.

Only the working area may scale. Header, peer-device selector and Bottom Tab Bar remain at native size and fixed in the application shell. Each panel instance has exactly one zoom viewport and one canvas; nested zoom wrappers and duplicate gesture handlers are prohibited.

## Header and safe area

- Consume the effective top safe area exactly once. Header content must remain below Dynamic Island/notch.
- Header is outside the zoom viewport, does not scale and is geometrically symmetric.
- Header grid is `52px minmax(0, 1fr) 52px`; narrow mobile may use `48px minmax(0, 1fr) 48px`.
- Minimum Header height is `62px`; narrow mobile may use `60px`.
- The title is geometrically centred, `21px`, weight `800`. Optional subtitle/version is `12px`, weight approximately `560`, in `var(--secondary-text-color)`.
- The permanent left control is only the Home Assistant system menu. It uses `<ha-icon icon="mdi:menu">` and dispatches `hass-toggle-menu` with `bubbles: true` and `composed: true`.
- Back, parent-route, integration drawer and device actions are prohibited in the permanent left rail. Parent navigation belongs inside the work area.
- At most one global command occupies the right rail. When Refresh exists it uses `<ha-icon icon="mdi:refresh">`.
- Both Header controls use matching `44px × 44px` plaques: `16px` radius, `1px` divider-colour border, `var(--card-background-color)` background and the subtle UPS-style shadow.
- Header icons are `25px`. Menu uses `var(--primary-text-color)`; Refresh uses `var(--primary-color)`.
- If the right command is absent, preserve its rail so that the title stays centred.

## Peer-device selector

When multiple peer physical devices exist, the selector is persistent directly below Header and remains outside the zoom viewport. Peer order is fixed, selection survives tab changes, and subordinate zones/channels are not automatically peer devices.

## Zoom and scrolling

- Recommended scale range is `75–200%`; default is `100%`.
- Scaling uses a two-finger pinch relative to the midpoint between the fingers.
- Permanent `− / % / +` controls are prohibited.
- A stationary two-finger double tap resets scale and position to `100%`, origin and top, then briefly shows `Масштаб 100%`.
- A pinch ending in `97–103%` snaps to exactly `100%`.
- Scale persists locally per panel/client and per peer device when applicable.
- Re-render reconciliation is idempotent: no nested viewport, abandoned blank area, duplicate controls or progressive shrinking.

### At 100%

- The working area uses ordinary native vertical scrolling (`overflow-y: auto` or the equivalent HA scrolling surface).
- Horizontal scrolling is prohibited.
- Transform position is strictly `x = 0`, `y = 0`; one-finger pan and transform-based wheel handling are disabled.
- Content cannot be pulled sideways or beyond its top edge.
- Tap, hold/more-info and native scrolling respond without a gesture delay or conflict.

### Above 100%

- One-finger transform pan is enabled only while scale is greater than `100%`.
- Enable each axis independently only when scaled content exceeds the viewport on that axis.
- Clamp translation to actual scaled content edges; blank space outside the canvas must never be exposed.
- Re-clamp after pinch completion, content re-render and viewport/orientation resize.

At or below `100%`, one-finger transform pan remains disabled and transform offsets are reset to `x = 0`, `y = 0`.

## View changes and interactions

- Changing a Bottom Tab or peer device returns the work area to the top. Saved scale may remain, but offsets must be recomputed and invalid offsets discarded.
- The second pointer immediately cancels pending more-info. Starting a real pan dispatches/carries equivalent `pointercancel`; post-gesture synthetic clicks are briefly suppressed.
- A deliberate stationary hold continues to open native Home Assistant more-info.

## Bottom Tab Bar

- Use one fixed, edge-attached, full-width Bottom Tab Bar outside the zoom viewport; it is not a floating card.
- The bar uses `var(--card-background-color)`, a thin top divider and the subtle UPS-style top shadow.
- Account for `env(safe-area-inset-bottom)` exactly once and leave enough content clearance for the final row.
- Tabs have equal width and minimum height `52px`.
- Icons are MDI icons rendered only through `ha-icon`, size `28px`; text glyphs are prohibited as icons.
- Labels are one readable line, `12px`, weight `700`; shorten long names rather than wrap them.
- The active tab uses `var(--primary-color)` for icon and label and an approximately `11%` primary-colour background with `13–14px` radius. It has no extra shadow.
- Inactive tabs use `var(--secondary-text-color)`.

## State, assets and delivery

- Normal measurements use neutral typography. Green/amber/red are reserved for verified semantic states.
- `unknown`, `unavailable`, stale or untrusted data never appears healthy. Do not invent unsupported values.
- Prefer native HA more-info/history for factual detail.
- Critical visual assets ship locally; no CDN or Base64 substitute where a normal asset is suitable. Live values remain separate from background art.
- Keep one stable production frontend entry module and cache-bust it by UI/build version. Panel registration and machine-readable manifests must agree with runtime behaviour.

## Repository and integration identity

- Every integration repository must have a deliberate repository visual identity (README hero/logo and GitHub social preview/avatar where repository settings support it).
- The Home Assistant integration icon must follow the actually supported HA/HACS branding path for its domain. A private file is not considered wired merely because it exists in the repository.
- Preserve a square source icon and provide the required normal/high-resolution variants (`icon.png`, `icon@2x.png`) through the supported Home Assistant Brands contribution path; provide dark variants when the artwork is not theme-neutral.
- HACS category, `hacs.json`, integration domain, manifest name and README installation steps must agree.
- Do not invent a new brand without an approved source asset. Missing files or publication steps are recorded as compliance gaps.

## Mandatory iPhone acceptance

Verify on long Diagnostics content and the primary view: native vertical scroll at `100%`; no horizontal movement; no top-edge pull; only necessary pan axes above `100%`; clamping after release and resize; no pinch snap-back; taps do not become accidental pans; stationary hold opens more-info; Header, selector and Bottom Tab Bar remain fixed and native-sized; menu and Refresh plaques match UPS geometry; safe areas are correct.

> Newer canonical standards in `ha-contract-generated-ui` supersede this synchronized snapshot.
