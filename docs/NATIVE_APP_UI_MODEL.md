# Native INKBIRD / HiOazo HO-SC-8W app UI model

This document records the functional model observed in user-provided screenshots of the native HO-SC-8W mobile application. The screenshots themselves are not stored in this public repository because they contain user-specific zone names and property photos.

## Top-level watering UI

The device screen exposes three functional sections:

1. **Scheduled watering**
2. **Manual watering**
3. **Schedule / history**

These are UI sections. The controller itself still operates in automatic/manual/off execution modes; the third section is informational/configuration-oriented rather than a third execution mode.

## Scheduled watering zone card

Each zone card in the native app exposes or implies the following fields:

- zone enabled/disabled toggle;
- zone number;
- zone display name;
- per-zone rain-sensor behavior indicator;
- edit action;
- next scheduled watering time;
- optional zone image/photo;
- schedule period/cycle;
- cycle anchor/start date;
- base program duration;
- seasonal adjustment contribution shown separately from base duration;
- runtime information when a zone is active, including remaining time.

The screenshots confirm that the native UI deliberately separates **base program duration** from **seasonal adjustment** instead of presenting only one final duration value.

## Schedule cycle presentation

Observed interval-style schedules are presented in the form:

- every 1 day;
- every 2 days;
- every 3 days;

with a separate anchor/start date.

This aligns with the DP38 interval model already recovered from the production controller.

## Per-zone rain behavior

The scheduled-watering cards show both a normal rain-related icon and a crossed-out variant on different zones. This strongly indicates that rain behavior is configurable per zone, in addition to the global rain-sensor master switch.

The exact DP38 flag semantics must still be verified before writing this field. In particular, byte 19 must not be reduced to a guessed boolean until controlled Zone 8 tests confirm the mapping.

## Settings screen

The native settings screen exposes at least:

- global rain-sensor master enable;
- seasonal adjustment slider;
- seasonal adjustment range shown as **-90% to +100%**;
- additional settings;
- reset parameters;
- device power control.

The Home Assistant integration has already confirmed that the seasonal-adjustment entity is writable and that a value written from HA is reflected on the physical controller display.

## Bottom actions in scheduled watering

The scheduled-watering view exposes actions equivalent to:

- multi-zone plans;
- next zone / next step.

These functions should be treated separately from editing the persistent DP38 program until their exact device behavior and write DPs are confirmed.

## Consequences for the Home Assistant UI

The standalone integration should mirror the native application's functional separation rather than mixing all controls into one card.

### Auto

- current automatic cycle;
- active zone;
- next/queued zones;
- elapsed / remaining / progress;
- seasonal adjustment;
- persistent per-zone DP38 schedule editor;
- per-zone rain-follow behavior once verified.

### Manual

- manual zone selection;
- manual duration;
- start / stop;
- multi-zone manual execution;
- next zone where supported and verified.

Manual duration must remain semantically distinct from the persistent automatic-program duration stored in DP38.

### Plans / history

- persistent schedule overview;
- calculated next watering events;
- execution history;
- program-change history;
- DP104 history once fully decoded.

### Device settings

High-impact settings such as global rain sensor, seasonal adjustment, reset and power should remain outside the main informational dashboard and require explicit user intent.

## Data that appears app-specific/cloud-side

The screenshots contain user-facing zone names and zone photos. Current local DP research does not establish that these are contained in DP38 or any other known local DP.

Therefore the standalone integration must not assume that zone names/photos are locally writable until their storage source is identified. They may be app/cloud metadata rather than controller schedule data.

## Important open questions for Zone 8 testing

1. Exact DP38 encoding of the per-zone rain behavior icon.
2. Exact enable/disable representation for a zone beyond the observed duration/start-slot pattern.
3. Whether the controller normalizes DP38 after a write.
4. Whether next-watering timestamps are device-calculated, app-calculated, or cloud-calculated.
5. Exact semantics of multi-zone plans and the native **Next** action.
6. Exact rounding rule for seasonal adjustment; UI screenshots should not be used to infer this without runtime DP45 confirmation.

## Safety rule

All write research remains confined to unused **Zone 8** until read-back, checksum, restore and no-impact behavior are demonstrated. Working zones 1-6 are read-only unless separately approved.
