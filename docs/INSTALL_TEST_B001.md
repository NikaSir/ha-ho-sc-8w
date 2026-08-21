# Installation test protocol — v1.0.0-b001

## Safety condition

The old `inkbird_irrigation` config entry and the new `nikas_ho_sc_8w` config entry must not be locally active at the same time. HO-SC-8W accepts one persistent local Tuya session reliably.

## Stage 1 — copy only

Copy `custom_components/nikas_ho_sc_8w/` to `/config/custom_components/nikas_ho_sc_8w/` while the old integration is still running. Do not add the new integration yet.

Run:

```bash
ha core check
```

If the check fails, remove the new folder and leave the production integration untouched.

## Stage 2 — discover integration

Restart Home Assistant with only the old config entry active. The new domain has no config entry yet and therefore must not open a controller socket.

## Stage 3 — hand over the local session

Disable/unload the old `inkbird_irrigation` config entry. Confirm its entities become unavailable before adding the new integration.

Add `HO-SC-8W Irrigation` using the same Device ID, Local Key and controller IP.

## Stage 4 — read-only PASS gate

Do not touch any switch/number control initially. Verify:

- connection transport = `local`;
- operation mode = `Auto`;
- irrigation mode = `order`;
- seasonal adjustment matches physical controller;
- active/queued bitmasks match current idle/running state;
- all eight remaining/elapsed sensors are available;
- the latest DP38 schedule block is decoded without altering the controller;
- no controller schedule changes occur.

## Rollback

If setup or telemetry is wrong:

1. disable/remove the new `nikas_ho_sc_8w` config entry;
2. re-enable the old `inkbird_irrigation` config entry;
3. restart Home Assistant if required;
4. do not delete the old integration folder until standalone PASS is complete.

## After PASS

Only after stable read-only operation is proven:

1. update aggregate package sensors to the new low-level entity IDs;
2. verify dashboards;
3. retire the old domain;
4. proceed to protected Zone 8 DP38 no-op write testing.
