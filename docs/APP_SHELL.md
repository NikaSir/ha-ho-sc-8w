# Home Assistant NikaS specialized-panel app shell

This integration implements **Home Assistant NikaS · Integration Dashboard UI Standard v1.2** for the HO-SC-8W specialized panel.

## Primary device

- iPhone Pro Max
- portrait orientation
- one-handed operation

Tablet and desktop layouts are secondary adaptations of the accepted mobile hierarchy.

## Shell contract

HO-SC-8W is a single-device application and therefore uses three persistent levels:

1. **Header** — exit from the irrigation application.
2. **Content** — irrigation status, zones, programs and diagnostics.
3. **Bottom Tab Bar** — switch only between the application's main sections.

A Device Selector is intentionally absent: irrigation zones are channels of one controller, not peer physical devices.

### Header

Canonical HO-SC-8W Header:

```text
← Назад             Полив             [reserved]
                    HO-SC-8W · UI v0.3.3
```

Requirements implemented by the panel:

- `mdi:arrow-left` Back control on the left;
- explicit parent route `/dashboard-actions`;
- no browser-history dependency as the navigation contract;
- `Полив` geometrically centered relative to the viewport;
- symmetric left/right Header zones so controls do not shift the title;
- no decorative integration/device icon beside the title;
- model/UI version kept as secondary subtitle;
- Header controls never execute irrigation actions and have no hold/double-tap device behavior.

### Bottom Tab Bar

Persistent sections:

```text
Обзор · Зоны · Программы · Диагн.
```

The Tab Bar is a **full-width docked part of the application shell**:

- fixed to the lower viewport edge;
- no floating/pill-card outer gaps;
- includes iOS bottom Safe Area;
- remains visible during vertical scrolling;
- page content has sufficient bottom clearance;
- icon + short label for every section;
- active tab is indicated inside the shared bar;
- no detached elevation, shadow or vertical lift for the active tab;
- primary-section tabs are never duplicated at the top.

## First-screen rule

Immediately after the Header, Overview starts with factual irrigation state. The Header answers *where am I?*; the hero card answers *what is happening now?*.

## Entity interaction

Long press on factual Home Assistant entity-backed UI opens Home Assistant more-info where applicable. Header and Bottom Tab Bar are navigation-only.

## Reliability and safety

- `unknown` / `unavailable` are never rendered as normal or off.
- No raw Tuya DP writes are implemented in the frontend.
- No unverified controls are synthesized.
- Zone 8 remains diagnostics/development-only.
- Main-valve state is not inferred until the integration exposes a verified source.

## Acceptance

The HO-SC-8W panel is compliant only when, on iPhone Pro Max portrait:

- Back is explicit and targets `/dashboard-actions`;
- title is geometrically centered and remains one line;
- Header contains no decorative device/brand icon;
- current irrigation state is the first major content block;
- Bottom Tab Bar is full-width, fixed and non-floating;
- active tab remains visually inside the common bar;
- no horizontal scrolling exists;
- the final content card can fully scroll above the Tab Bar;
- light and dark themes remain readable.
