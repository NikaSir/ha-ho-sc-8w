# DP38 Zone 8 protocol lab

This document defines the controlled hardware probe for the HO-SC-8W `normal_time` datapoint (DP38).

## Scope

The probe exists only to verify the per-zone rain-sensor flag on the physically unused Zone 8 before any DP38 write capability is considered for production zones.

The current working hypothesis is that byte offset 19 (the twentieth byte of one 20-byte DP38 zone block), bit 0, represents whether that zone follows the rain sensor. This remains a protocol hypothesis until the controller write/read-back experiment succeeds.

## Hard safety gates

The probe must refuse to run unless all of these conditions are true:

1. The payload is exactly one valid 20-byte DP38 block.
2. The station byte is exactly Zone 8.
3. The source of the current Zone 8 block is `controller`, not Home Assistant Store, legacy bootstrap data, or any reconstructed value.
4. The active transport is local LAN.
5. DP107 reports no active watering zones.
6. DP108 reports no queued watering zones.
7. The candidate differs from the original by exactly one bit: byte offset 19, mask `0x01`.
8. The explicit confirmation token is `ZONE8_DP38_WRITE`.

The laboratory write method is private and is not registered as a Home Assistant service, entity action, or frontend command.

## Wire encoding

Internally the integration keeps DP38 as bytes. For TinyTuya local control the RAW datapoint candidate is sent as a Base64 ASCII string. Read-back is decoded through the existing RAW parser and compared byte-for-byte with the candidate.

## Probe sequence

The sequence is intentionally transactional:

1. Read the current controller-sourced Zone 8 block from the integration cache.
2. Validate the block and capture it as the rollback snapshot.
3. Build a candidate by toggling only bit 0 at byte offset 19.
4. Compute and inspect a byte-level diff.
5. Write the candidate to DP38 over the active local TinyTuya session.
6. Wait for a controller DP38 push and require byte-for-byte equality with the candidate.
7. In a `finally` path, write the exact original 20-byte block back to DP38.
8. Wait for a controller DP38 push and require byte-for-byte equality with the original rollback snapshot.

## PASS criteria

The protocol probe is PASS only when all four outcomes are true:

- candidate write was sent;
- candidate was read back exactly;
- rollback write was sent;
- rollback was read back exactly.

A PASS validates only the controlled Zone 8 write/read-back/rollback path. It does not automatically authorize production-zone writes.

## FAIL criteria

Any of the following is a FAIL and blocks promotion of DP38 writes:

- no fresh controller-sourced Zone 8 block;
- more than one byte changed;
- byte other than offset 19 changed;
- XOR delta other than `0x01`;
- controller not idle;
- transport not local;
- candidate not read back exactly;
- rollback not read back exactly;
- unexpected controller normalization of any other byte.

If rollback cannot be verified, do not repeat the probe until the actual Zone 8 state has been independently inspected.

## Production promotion gate

Only after a successful physical probe should the project consider a separate change that:

- marks the rain-flag write semantics as verified;
- generalizes mutation logic beyond Zone 8;
- adds a normal Home Assistant action/API with read-before-write, diff validation and read-back;
- keeps raw DP writes out of Lovelace/frontend code;
- preserves rollback and conflict protection for schedule edits.

This laboratory branch must remain draft until the physical result is recorded.
