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
3. **Bottom navigation** — switch only between the panel's own main sections.

### Header

HO-SC-8W uses:

```text
← Назад        Полив        [integration mark]
               INKBIRD / HiOazo · HO-SC-8W
```

The Back action is an explicit navigation to:

```text
/dashboard-actions
```

It must not use browser-history semantics. Header buttons never execute device actions and have no hold/double-tap device behavior.

### Bottom navigation

HO-SC-8W uses four persistent sections:

```text
Обзор · Зоны · Программы · Диагн.
```

The bar is fixed to the bottom, includes the iOS bottom safe area, uses large touch targets and clearly marks the active section.

Primary-section tabs must not be duplicated at the top of the panel.

## First-screen rule

Immediately after the header, Overview starts with the factual current irrigation state. Navigation must not occupy the valuable first-content position.

## Version placement

UI/version information is secondary metadata and is shown in Diagnostics rather than as a second large title below the header.

## Entity interaction

Long press on factual Home Assistant entity-backed UI opens Home Assistant more-info. Header and bottom-navigation controls are navigation-only and never invoke entity actions.

## Reliability and safety

- `unknown` / `unavailable` are never rendered as normal or off.
- No raw Tuya DP writes are implemented in the frontend.
- No unverified controls are synthesized.
- Zone 8 remains diagnostics/development-only.
- Main-valve state is not inferred until the integration exposes a verified source.

This shell is intentionally compatible with the wider NikaS specialized-panel standard used by S8 OMNI, Keenetic and UPS panels; only the domain-specific content changes.
