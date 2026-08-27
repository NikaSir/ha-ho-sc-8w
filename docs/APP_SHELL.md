# HO-SC-8W specialized-panel app shell

The integration implements **NikaS Specialized Panel UI Standard v1.7** for iPhone Pro Max portrait first, with tablet and desktop as secondary adaptations.

## Stable shell

The application has three persistent rows:

1. **Header** — native Home Assistant menu, centered panel identity and Refresh.
2. **Work viewport** — irrigation status, zones, program, manual preparation and diagnostics.
3. **Bottom Tab Bar** — the five primary panel sections.

HO-SC-8W is one physical controller. Irrigation zones are subordinate channels, so there is no peer-device selector.

Header, viewport and Bottom Tab Bar mount once. Home Assistant telemetry point-patches existing content and must not recreate these nodes, reload imagery, jump scroll position or interrupt pinch/pan. Explicit tab or zone-detail transitions may replace only work-area children.

## Header

```text
[☰]                 HO-SC-8W                 [↻]
                 Система полива · UI
```

- grid: `52 / 1fr / 52`, narrow `48 / 1fr / 48`;
- both plaques: 44×44 px, 16 px radius, 1 px theme divider and the UPS shadow;
- icons: `ha-icon` with `mdi:menu` / `mdi:refresh`, 25 px;
- title/subtitle: 23/14 px, narrow 21/13 px;
- the left control only emits bubbling/composed `hass-toggle-menu`;
- Back, integration menus and irrigation actions are forbidden in the permanent Header;
- safe area is consumed once below Dynamic Island/notch.

## Work viewport

- exactly one viewport and one `translate3d + scale` canvas;
- 75–200% pinch at finger midpoint, 97–103% snap, two-finger double-tap reset and `Масштаб 100%` toast;
- at 100%: native vertical scroll, no horizontal scroll, `x = 0`, `y = 0`, no one-pointer transform pan;
- above 100%: one-pointer pan only on overflowing axes and always clamped to content edges;
- tab change returns to top while the selected scale may remain;
- second pointer/pan cancels pending hold; post-gesture click is suppressed; deliberate stationary hold still opens native `more-info`.

## Bottom Tab Bar

```text
Состояние · Зоны · Программа · Ручной · Диагн.
```

The bar is a native-scale grid row outside the viewport, full width and safe-area aware. Every tab is at least 52 px high, uses an MDI `ha-icon` at 28 px and a one-line 12 px/700 label. The active tab uses the theme primary colour and approximately 11% primary tint without a detached shadow.

## Typography and indicator policy

Meaningful copy is 12–25 px. Only the redundant control-wire caption may use 10 px. The shared two-level connection/freshness indicator is opt-in and is not enabled here; the existing factual single-line `Локально`/`Облако` transport badge remains unchanged in scope.

## Safety and acceptance

- `unknown` / `unavailable` are never rendered as healthy;
- no raw Tuya DP write or unverified action is synthesized;
- Zone 8 remains diagnostics-only;
- at 100%, Diagnostics scrolls vertically while Header and Bottom Tab Bar remain stationary;
- at increased scale, only necessary pan axes move and blank space cannot be exposed;
- telemetry refresh during scroll, inertia or gestures causes no flash, menu movement, image reload or scroll jump.
