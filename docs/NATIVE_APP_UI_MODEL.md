# Native INKBIRD / HiOazo HO-SC-8W app UI model

This document records the functional model observed in user-provided screenshots of the native HO-SC-8W mobile application and cross-checked against official INKBIRD application instructions. The user screenshots themselves are not stored in this public repository because they contain user-specific zone names and property photos.

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

### Observed card states

User screenshots show both compact and expanded scheduled-zone cards:

- inactive/unused zones can appear as grey compact rows while still exposing an edit action;
- configured zones appear as expanded white cards with enable toggle, rain behavior icon and schedule detail;
- a running zone can show a large **remaining time** value in addition to the configured base duration and seasonal-adjustment contribution;
- zone descriptions and photos are presentation data and must not yet be assumed to be local DP fields.

## Schedule cycle presentation

Observed interval-style schedules are presented in the form:

- every 1 day;
- every 2 days;
- every 3 days;

with a separate anchor/start date.

Official INKBIRD documentation confirms four schedule-cycle choices:

- odd days;
- even days;
- selected weekdays/custom days;
- intervals every N days.

This aligns with the DP38 calendar-mode model already recovered from the production controller.

## Per-zone rain behavior

The scheduled-watering cards show both a normal rain-related icon and a crossed-out variant on different zones.

The production screenshots provide a particularly strong controlled correlation:

- zones 1-5 show the normal rain-behavior icon;
- zone 6 shows the crossed-out rain icon and is known to ignore the rain sensor;
- DP38 byte 19 is `0x11` for zones 1-5 and `0x10` for zone 6.

This strongly suggests that **bit 0 of DP38 byte 19 encodes per-zone rain obey/ignore**:

- bit 0 = 1: obey/use rain sensor;
- bit 0 = 0: ignore rain sensor.

This is still marked as **strongly inferred**, not fully write-verified, until the unused Zone 8 controlled test changes only the rain option and confirms the expected `0x11 ↔ 0x10` transition with read-back.

## Settings screen

The native settings screen exposes at least:

- global rain-sensor master enable;
- seasonal adjustment slider;
- seasonal adjustment range shown as **-90% to +100%**;
- additional settings;
- reset parameters;
- device power control.

Official product documentation confirms the same -90% to +100% seasonal-adjustment range.

The Home Assistant integration has already confirmed that the seasonal-adjustment entity is writable and that a value written from HA is reflected on the physical controller display.

### Seasonal-adjustment presentation

The scheduled-zone UI shows the adjustment as a **minute contribution** next to the base program duration (for example a base duration plus an additional number of minutes), while the settings screen edits the global value as a percentage.

Therefore the Home Assistant UI should preserve all three concepts separately:

- base program duration;
- global seasonal-adjustment percentage;
- calculated/effective duration or minute contribution.

Exact controller rounding must be determined from runtime DP45 rather than inferred solely from screenshots.

## Bottom actions in scheduled watering

The scheduled-watering view exposes actions equivalent to:

- **Multi-zone plans**;
- **Next** / advance to the next zone or step.

Official INKBIRD instructions describe multi-zone scheduling and sequential execution. These functions should remain separate from persistent single-zone DP38 editing until their exact local write semantics are verified.

## Official INKBIRD UI correspondence

Official INKBIRD application instructions show the same overall structure as the user screenshots:

- Scheduled Mode / Manual Mode / Schedules & History tabs;
- per-zone edit action;
- four watering-period modes;
- per-zone Obey/Ignore rain-sensor choice;
- up to six start times per day;
- multi-zone scheduling;
- manual single- and multi-zone watering;
- seasonal adjustment;
- schedule/history views.

This means a full native-app information model can be reconstructed without re-pairing the production controller to INKBIRD Cloud solely for UI discovery.

Re-pairing may still be useful later as a separate cloud-behavior experiment, but it is no longer required just to understand the application interface.

## Consequences for the Home Assistant UI

The standalone integration should mirror the native application's functional separation rather than mixing all controls into one card.

### Auto

- current automatic cycle;
- active zone;
- next/queued zones;
- elapsed / remaining / progress;
- seasonal adjustment;
- persistent per-zone DP38 schedule editor;
- per-zone rain-follow behavior once write-verified.

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

1. Write-confirm DP38 byte 19 bit 0 as the per-zone rain obey/ignore flag.
2. Exact enable/disable representation for a zone beyond the observed duration/start-slot pattern.
3. Whether the controller normalizes DP38 after a write.
4. Whether next-watering timestamps are device-calculated, app-calculated, or cloud-calculated.
5. Exact semantics of multi-zone plans and the native **Next** action.
6. Exact rounding rule for seasonal adjustment; UI screenshots should not be used to infer this without runtime DP45 confirmation.
7. Whether zone names/photos are stored in controller-local data, Tuya/INKBIRD cloud metadata, or app-only metadata.

## Safety rule

All write research remains confined to unused **Zone 8** until read-back, checksum, restore and no-impact behavior are demonstrated. Working zones 1-6 are read-only unless separately approved.
