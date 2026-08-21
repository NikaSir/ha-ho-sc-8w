# Standalone migration plan

## Goal

Convert the currently verified production custom integration into a standalone Home Assistant integration dedicated to the **INKBIRD / HiOazo HO-SC-8W**.

Target identity:

```text
repository:  ha-ho-sc-8w
domain:      nikas_ho_sc_8w
directory:   custom_components/nikas_ho_sc_8w
integration: HO-SC-8W Irrigation · NikaS
manufacturer: INKBIRD / HiOazo
model:       HO-SC-8W
```

## Migration principles

1. Preserve the verified production behavior before cleanup.
2. Do not run two persistent local Tuya sessions against the controller at the same time.
3. Keep high-level Home Assistant UI contract sensors stable where practical.
4. Separate automatic-program editing from manual zone operation.
5. Remove multi-model abstractions that do not serve HO-SC-8W.
6. Keep required third-party MIT notices while removing runtime/update dependency on prior repository identity.
7. Do not introduce HACS-managed updates during the standalone migration.

## Source import

The migration starts from a ZIP of the currently running directory:

```text
/config/custom_components/inkbird_irrigation/
```

The archive must not include Home Assistant `.storage`, `secrets.yaml`, config-entry storage, Local Keys, cloud credentials, account tokens or private production diagnostics.

The imported baseline is reviewed before any namespace cleanup so verified fixes are not lost.

## Verified behavior that must survive the migration

- Local Tuya v3.3 connection.
- Persistent local push handling.
- HO-SC-8W DP45 Base64 parsing.
- Separate remaining and elapsed runtime values.
- DP107 active-zone bitmask.
- DP108 queued-zone bitmask.
- Current read-only automatic-program snapshot / DP38 knowledge.
- Seasonal-adjustment read/write behavior.
- Existing production-facing aggregate UI sensors after their low-level references are remapped.

## Domain migration sequence

1. Import the current working source into a migration branch.
2. Freeze a baseline commit before renaming Python modules/constants.
3. Change integration domain to `nikas_ho_sc_8w`.
4. Move source directory to `custom_components/nikas_ho_sc_8w`.
5. Replace user-facing generic IIC model labels with HO-SC-8W identity.
6. Remove IIC-600/IIC-400 and generic multi-model branches after parity tests identify which helpers are still required.
7. Update config flow, translations, entity unique IDs and device info deliberately.
8. Add migration documentation mapping old entity IDs to new entity IDs.
9. Update aggregate Home Assistant packages to reference the new low-level entities.
10. Disable the old config entry before enabling the new one.
11. Verify local connection, Auto mode and zero active/queued zones.
12. Verify DP38/DP45/DP107/DP108 read-only parity.
13. Remove the old integration only after the new standalone integration passes production checks.

## Stable UI contracts

The project currently relies on two aggregate template sensors:

```text
sensor.ho_sc_8w_programma_poliva
sensor.ho_sc_8w_poliv_seichas
```

These should remain stable across the low-level domain migration. Their internal entity references can be remapped to the new standalone entities so dashboards do not need a broad rewrite.

## Automatic-program editor rollout

Program editing is not enabled merely because DP38 can be written.

### Stage A — read-only model

- live cache of all eight DP38 blocks;
- strict decode/encode round-trip tests;
- checksum / raw representation;
- next-run calculations;
- draft editor and diff preview;
- no controller write.

### Stage B — Zone 8 no-op write

Preconditions:

```text
transport = local
active_mask = 0
queued_mask = 0
fresh Zone 8 DP38 block available
Zone 8 duration = 0
Zone 8 start slots disabled
```

Procedure:

```text
fresh read
-> backup all 8 blocks
-> write exact current Zone 8 block
-> wait for read-back/push
-> byte-for-byte compare
-> verify production zones unchanged
```

### Stage C — non-executing Zone 8 edit

After no-op PASS, change one non-executing Zone 8 field while keeping the channel disabled, verify read-back, then restore the exact original block.

### Stage D — protected editor

Only after Stages B/C pass:

- draft-first editing;
- expected-current-raw guard;
- explicit apply action;
- local transport only;
- active/queued-zone interlock;
- mandatory read-back;
- audit record;
- recovery from saved backup.

Production zones 1-6 are not writable by the editor until Zone 8 testing and safety gates are complete.

## Release boundary

No standalone release is considered production-ready until:

- the imported production baseline is traceable in Git history;
- local read-only parity is confirmed;
- Home Assistant restart/reload behavior is stable;
- dashboard contracts are remapped;
- Zone 8 no-op DP38 test passes;
- secrets scan and repository checks pass.
