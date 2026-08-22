# Dashboard entity bindings

Dashboard version: `0.1.0`

This file documents the semantic contract used by `dashboard-irrigation.yaml`.

## Controller/runtime

| Semantic key | Entity |
| --- | --- |
| connection | `sensor.kontroller_poliva_ho_sc_8w_connection_mode` |
| operation_mode | `sensor.kontroller_poliva_ho_sc_8w_operation_mode` |
| irrigation_mode | `sensor.kontroller_poliva_ho_sc_8w_irrigation_mode` |
| active_zones | `sensor.kontroller_poliva_ho_sc_8w_active_zones` |
| queued_zones | `sensor.kontroller_poliva_ho_sc_8w_queued_zones` |
| rain_sensor | `sensor.09_kotelnaia_kontroller_poliva_ho_sc_8w_rain_sensor` |
| seasonal_adjustment | `sensor.09_kotelnaia_kontroller_poliva_ho_sc_8w_seasonal_adjustment` |
| timer_error_alarm | `sensor.09_kotelnaia_kontroller_poliva_ho_sc_8w_timer_error_alarm` |
| alarm_voice_cancel | `sensor.09_kotelnaia_kontroller_poliva_ho_sc_8w_alarm_voice_cancel` |
| schedule_cache | `sensor.09_kotelnaia_kontroller_poliva_ho_sc_8w_schedule_cache` |

## Zones 1–6

For `N = 1..6`:

- runtime remaining: `sensor.kontroller_poliva_ho_sc_8w_zone_N_time_remaining`
- runtime elapsed: `sensor.kontroller_poliva_ho_sc_8w_zone_N_time_elapsed`
- persistent schedule: `sensor.kontroller_poliva_ho_sc_8w_schedule_zone_N`

The schedule entity attributes used by the panel are:

- `duration_min`
- `start_times`
- `calendar_mode`
- `interval_days`
- `interval_start`
- `rain_sensor_follow`
- `rain_flag_write_verified`
- `cache_source`
- `complete_zone_cache`

## Diagnostics-only Zone 8

- schedule: `sensor.kontroller_poliva_ho_sc_8w_schedule_zone_8`
- protected no-op test diagnostic entity is integration-owned but is intentionally not required by the normal dashboard flow.

Zone 8 must never be promoted into the normal Zones view merely because the physical controller has eight outputs.

## Deliberately unbound capabilities

The dashboard does not bind these until the integration exposes a verified stable API:

- main valve state/control;
- manual start/stop for zones 1–6;
- manual duration write;
- schedule editing;
- direct DP38/DP45/raw Tuya calls.

`unknown` and `unavailable` must not be converted to `off`, `idle`, or any other normal state by dashboard logic.
