# Home Assistant NikaS specialized-panel app shell

This integration implements the shared NikaS navigation shell for specialized Home Assistant panels.

## Primary device

- iPhone Pro Max
- portrait orientation
- one-handed operation

Tablet and desktop layouts are secondary adaptations.

## Shell contract

Every main view uses the same three-level application structure:

1. **Header** — exit from the integration application and optional global panel actions.
2. **Content** — device-specific status, controls, telemetry and workflows.
3. **Bottom Tab Bar** — switch only between the panel's own main sections.

### Header

HO-SC-8W uses:

```text
← Назад        Полив        [integration mark]
               INKBIRD / HiOazo · HO-SC-8W
```

The Back action is an explicit Home Assistant navigation to:

```text
/dashboard-actions
```

It must not use browser-history semantics as the navigation contract. Header buttons never execute device actions and have no hold/double-tap device behavior.

### Bottom Tab Bar

HO-SC-8W uses four persistent sections:

```text
Обзор · Зоны · Программы · Диагн.
```

The Tab Bar is a **full-width docked part of the application shell**. It is fixed to the lower viewport edge and must never be rendered as a floating navigation card over content.

Required geometry and behavior:

- occupies the full useful width of the viewport;
- fixed to the bottom during vertical scrolling;
- includes the iOS bottom safe area;
- page content has enough bottom padding for the last card to scroll fully above the Tab Bar;
- same shell height and touch-target geometry as other NikaS specialized panels;
- each tab uses an icon plus a short label;
- the active tab is indicated **inside the common bar** using accent color and a light local background;
- the active tab must not use elevation, detached-card shadow or vertical offset that makes it appear to float above the bar;
- primary-section tabs must never be duplicated at the top of the panel.

## Navigation levels

The meanings are fixed across the NikaS ecosystem:

- **Header Back** exits the specialized application to its declared parent route.
- **Bottom Tab Bar** switches between main sections of the current specialized application.

Switching `Обзор → Зоны → Программы → Диагн.` never changes the meaning of Back.

## First-screen rule

Immediately after the Header, Overview starts with the factual current irrigation state. A second navigation layer must not occupy the valuable first-content position.

## Version placement

UI/version information is secondary metadata and belongs in Diagnostics or similarly low-priority metadata, not in a second large title below the Header.

## Entity interaction

Long press on factual Home Assistant entity-backed UI opens Home Assistant more-info. Header and Bottom Tab Bar controls are navigation-only and never invoke entity-specific actions.

## Reliability and safety

- `unknown` / `unavailable` are never rendered as normal or off.
- No raw Tuya DP writes are implemented in the frontend.
- No unverified controls are synthesized.
- Zone 8 remains diagnostics/development-only.
- Main-valve state is not inferred until the integration exposes a verified source.

## Acceptance

A specialized panel is compliant only when:

- an explicit Back control is always available in the compact top Header;
- primary sections are switched only through the full-width fixed Bottom Tab Bar;
- the bar does not float over content and does not disappear while scrolling;
- iOS safe-area handling is preserved;
- no horizontal scrolling is present on iPhone Pro Max portrait;
- the last content card can be fully scrolled above the Tab Bar.

This shell is intentionally compatible with the wider NikaS specialized-panel standard used by S8 OMNI, Keenetic and UPS panels; only the domain-specific content changes.
