# Home Assistant NikaS specialized-panel app shell — HO-SC-8W

**Normative shell:** `docs/NIKAS_SPECIALIZED_PANEL_UI_STANDARD.md` v1.6  
**Primary device:** iPhone Pro Max, portrait  
**Panel type:** one physical irrigation controller; no peer Device Selector

## Shell contract

```text
HEADER: ☰ | Полив / HO-SC-8W · UI version | Refresh
EXACTLY ONE WORK VIEWPORT
BOTTOM TAB BAR
```

- Header and Bottom Tab Bar are stationary native-scale shell elements.
- Work Viewport is the sole vertical scroll and zoom owner.
- Short views fill the available work height and never pull either menu with their content.
- Long views retain enough bottom clearance for the final control/card to remain fully reachable above Bottom Tab Bar.
- Irrigation zones are channels of one controller, not peer physical devices; therefore a peer Device Selector is intentionally absent.

## Header

- Left action is only `mdi:menu` and dispatches bubbling/composed `hass-toggle-menu`.
- Permanent Back and browser-history navigation are prohibited in Header.
- Any required parent transition belongs inside Work Viewport.
- Title is geometrically centered through symmetric 52/48px rails.
- Menu and Refresh use matching 44×44px UPS-style plaques with 25px `ha-icon`.
- Menu uses primary text color; Refresh uses theme primary color.
- No decorative integration/device icon appears beside the title.
- Top safe area is consumed exactly once below Dynamic Island/notch.

## Bottom Tab Bar

Primary sections:

```text
Обзор · Зоны · Программы · Диагн.
```

- full-width and edge-attached, never floating;
- outside Work Viewport and the zoom transform;
- above the iOS Home Indicator;
- equal-width destinations with 28px MDI `ha-icon`;
- one-line 12px/700 labels;
- active icon/label use theme primary and a light primary-color background;
- no detached lift or second shadow for the active tab.

## Scroll, zoom and interactions

- At 100%, Work Viewport uses native vertical-only scrolling with transform `x=0,y=0` and no one-finger pan.
- Above 100%, one-finger pan is permitted only on actually overflowing axes and remains clamped to factual content edges.
- Pinch range is 75–200%; 97–103% snaps to 100%.
- Two-finger double tap resets to 100%/origin and shows `Масштаб 100%`.
- Pinch/reset never opens history or more-info; intentional stationary hold on factual entities remains available.
- There is exactly one active zoom viewport and no permanent zoom toolbar.

## Live-update stability

- Shell and view structure mount once.
- Tuya/DP telemetry patches existing nodes and does not redraw Header, Rain-Clik image, Work Viewport, canvas or Bottom Tab Bar.
- Polling during upward scroll or inertia does not show a blank/loading frame, move navigation or reset scroll.
- An unchanged image never receives the same `src` again.

## Indicator policy

The common two-level connection/freshness indicator is not enabled for HO-SC-8W. Do not restore the removed standalone blue `Локально` badge without a separate explicit requirement.

## Safety

- `unknown` and `unavailable` are never rendered as normal/off.
- No raw Tuya DP write is introduced in the frontend.
- No unverified controls are synthesized.
- Zone 8 remains diagnostics/development-only.
- Main-valve state is not inferred until a verified source exists.

## Acceptance

The panel is accepted only when:

- system Menu opens Home Assistant;
- Header and Bottom Tab Bar remain at identical screen coordinates during scroll, inertia, boundary pull and pinch;
- short views do not move navigation;
- long diagnostics scroll only inside Work Viewport;
- final content remains above Bottom Tab Bar;
- two-finger reset works without opening more-info/history;
- live polling causes no flicker, image reload or scroll jump;
- light and dark themes remain readable;
- meaningful text is at least 12px.
