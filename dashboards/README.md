# HO-SC-8W specialized dashboard

Version: `0.1.0`

Owner: `ha-ho-sc-8w`

Stable route: `/dashboard-irrigation`

Primary usage target: **iPhone Pro Max, portrait orientation**.

## Scope of v0.1.0

This is the first working integration-owned dashboard implementation for HO-SC-8W. It is deliberately conservative: the dashboard exposes only telemetry and Actions that exist in the integration and does not recreate Tuya protocol logic in Lovelace.

Views:

- `overview` — current irrigation and essential controller state;
- `zones` — operational view of user zones 1–6;
- `programs` — human-readable DP38 schedule, read-only;
- `diagnostics` — connection, masks, schedule cache and service Zone 8.

Zone 8 is intentionally excluded from normal user views.

## Current write capability boundary

At the integration build used to design this dashboard, normal zones 1–6 do not yet have a stable user-facing manual start/stop API. Therefore v0.1.0 does **not** render fake buttons or direct raw-DP calls.

When safe Actions/entities are promoted by the integration, the zone cards may expose them without changing the dashboard route or information architecture.

The b005 Zone 8 protected laboratory Action is not exposed on Overview or Zones. Zone 8 remains diagnostics-only.

## Main valve boundary

The current standalone integration does not expose a verified main-valve entity. Overview explicitly reports that fact instead of inferring valve state from active-zone telemetry.

## Installation in Home Assistant

Copy `dashboard-irrigation.yaml` to a stable Home Assistant path, for example:

`/config/dashboards/ho_sc_8w.yaml`

Then merge this dashboard registration into the existing `lovelace:` configuration:

```yaml
lovelace:
  dashboards:
    dashboard-irrigation:
      mode: yaml
      title: Полив
      icon: mdi:sprinkler
      show_in_sidebar: true
      require_admin: false
      filename: dashboards/ho_sc_8w.yaml
```

Do not create a second top-level `lovelace:` key if one already exists.

The dashboard key `dashboard-irrigation` is the navigation contract and produces the stable route `/dashboard-irrigation`.

After deployment:

1. run `ha core check`;
2. restart Home Assistant;
3. open `/dashboard-irrigation` on the primary iPhone Pro Max;
4. verify there is no horizontal scrolling;
5. verify `unknown` / `unavailable` are presented as warnings, not normal/off;
6. compare Overview values with the device page and current controller state;
7. verify all long-press entity interactions open Home Assistant `more-info` where configured.

## Entity binding

Home Assistant entity IDs are user-editable. The checked-in YAML is the tested NikaS production binding. The semantic contract is documented in `ENTITY_BINDINGS.md` and must be kept aligned with integration entities.

A future release may add automatic runtime binding, but it must use the integration entity registry/unique IDs rather than raw Tuya data.

## UX rules

The design target is close to or better than the native INKBIRD app in information clarity, without pixel-copying it. On the primary phone viewport:

- current irrigation is the first visual block;
- connection/mode/rain/seasonal state are immediately visible;
- six user zones have compact status on Overview and full cards on Zones;
- persistent schedule is separated from runtime/manual concepts;
- diagnostics are outside the primary operational flow;
- unsupported capabilities are shown explicitly instead of being simulated.
