# Specialized dashboard specification — HO-SC-8W

## Ownership and route

The irrigation dashboard is integration-owned and maintained in `ha-ho-sc-8w`.

Stable navigation contract:

```yaml
panel:
  id: irrigation
  title: Полив
  path: /dashboard-irrigation
  icon: mdi:sprinkler
  owner: ha-ho-sc-8w
  expose_in_generated_ui: true
  preferred_view: overview
```

`ha-contract-generated-ui` may expose summary/status/deep-links, but must not duplicate the specialized implementation.

## Primary usage target

The primary day-to-day usage mode is **iPhone Pro Max in portrait orientation**.

The dashboard must therefore be designed mobile-first and tested first on a Pro Max-class viewport before tablet and desktop refinement.

Acceptance rules for the primary mobile layout:

- no horizontal scrolling;
- primary status visible above the fold;
- one-handed interaction for common actions;
- touch targets sized for reliable phone use;
- safe-area aware top/bottom spacing;
- no dense entity-list presentation;
- no dependency on opening Home Assistant entity lists for routine irrigation work;
- clear visual separation of normal, active, warning, unknown and unavailable states.

Tablet and desktop layouts may use additional columns, but must preserve the same information hierarchy and navigation contract.

## Design quality target

The visual and interaction target is **close to or better than the native INKBIRD application**, without copying it pixel-for-pixel.

The dashboard should feel like a dedicated irrigation application inside Home Assistant rather than a Lovelace entity collection.

Reference qualities to preserve or improve:

- clear current watering state;
- obvious active zone and remaining time;
- human-readable schedule cards;
- explicit base duration versus seasonal adjustment;
- per-zone rain behavior where verified;
- concise zone cards with progressive disclosure;
- visually calm normal state and prominent exceptional states;
- direct access to common safe actions;
- technical diagnostics moved out of the primary operational flow.

Prefer native Home Assistant Cards and Sections. Additional HACS cards may be introduced only when they provide a substantial UX improvement and do not create an unnecessary maintenance dependency.

## Information architecture

The dashboard follows the domain model:

`controller/system → current watering → zones → programs → diagnostics`

Primary views:

1. **Overview** — operational status and current watering.
2. **Zones** — daily interaction with working zones 1–6.
3. **Programs** — persistent DP38 automatic schedule, initially read-only.
4. **Diagnostics** — transport, masks, cache/source status, timestamps and laboratory Zone 8 data.

Zone 8 is a development/test channel and must not appear as a normal user zone.

## Overview requirements

Within a few seconds the user must be able to determine:

- controller availability;
- active transport (Local / Cloud when supported);
- Auto / Manual mode;
- global rain sensor state;
- main valve state when the integration exposes a verified source;
- whether irrigation is running;
- active zone;
- elapsed and remaining time;
- queued zones;
- important warnings including unknown/unavailable data.

The Overview must not be overloaded with diagnostic detail.

## Zone requirements

The normal user-facing zone set is 1–6.

For each zone, expose only verified integration data and controls:

- zone name/label;
- state;
- configured duration relevant to the current mode;
- elapsed;
- remaining;
- manual start/stop once stable integration Actions/entities are available;
- active/queued membership;
- appropriate long-press `more-info` where useful.

Manual duration and persistent automatic-program duration must remain semantically distinct.

## Programs / Schedule

The program screen should visually resemble the information model of the native INKBIRD schedule UI while using Home Assistant design language.

Initially it is read-only and uses decoded DP38 data only.

Display human-readable:

- zone;
- enabled/disabled state;
- base duration;
- start times;
- calendar/cycle mode;
- interval or weekday data;
- anchor/start date;
- per-zone rain-follow behavior when verified;
- seasonal adjustment as a separate concept from base duration.

The UI must never construct or send raw Tuya DP payloads directly.

Schedule editing may be added only after the integration exposes a tested safe write API.

## Diagnostics

Diagnostics may include:

- connection preference;
- active transport;
- active and queued masks;
- timestamps / age of data;
- schedule cache status and data source;
- raw/decoded schedule diagnostics;
- rain sensor status;
- laboratory/test information for Zone 8;
- unsupported or not-yet-verified fields explicitly marked as such.

Diagnostics must not leak into the normal operational interface.

## Safety rules

The dashboard must not invent capabilities that the integration does not provide.

Prohibited:

- raw-DP writes from Lovelace;
- duplicated Tuya protocol logic in dashboard templates;
- fake entity IDs;
- treating `unknown` or `unavailable` as normal/off;
- presenting unverified data as authoritative;
- direct write workarounds outside the integration API.

All write operations must go through stable integration-provided entities, services or Actions.

## Reference-architecture role

This dashboard is the first reference implementation of the integration-owned-dashboard architecture. The same ownership pattern should later be reusable for `ha-s8-omni`, `ha-keenetic-hero-4g`, UPS integrations and other complex device domains.
