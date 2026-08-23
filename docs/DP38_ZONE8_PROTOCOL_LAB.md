# DP38 Zone 8 protocol lab

This document defines the controlled hardware probe for the HO-SC-8W `normal_time` datapoint (DP38).

## Scope

The probe exists only to verify the per-zone rain-sensor flag on the physically unused Zone 8 before any DP38 write capability is considered for production zones.

The current working hypothesis is that byte offset 19 (the twentieth byte of one 20-byte DP38 zone block), bit 0, represents whether that zone follows the rain sensor. This remains a protocol hypothesis until the controller write/read-back experiment succeeds.

## Laboratory actions

The `protocol/dp38-zone8-rain-probe` branch intentionally registers two temporary Home Assistant actions:

- `nikas_ho_sc_8w.protocol_lab_zone8_rain_preflight` — read-only; builds the exact opposite bit-0 candidate and returns the byte-level diff without sending anything to the controller;
- `nikas_ho_sc_8w.protocol_lab_zone8_rain_probe` — performs the confirmed write/read-back/rollback transaction.

Both actions require a real Home Assistant administrator context. Calls without a user context, including unattended automation/system calls, are rejected. These actions are laboratory tooling and must be removed before production promotion.

No writable entity platform is enabled by this branch. The integration continues to load only `sensor` entities.

## Hard safety gates

The write probe must refuse to run unless all of these conditions are true:

1. The payload is exactly one valid 20-byte DP38 block.
2. The station byte is exactly Zone 8.
3. The source of the current Zone 8 block is `controller`, not Home Assistant Store, legacy bootstrap data, or any reconstructed value.
4. The active transport is local LAN.
5. DP107 reports no active watering zones.
6. DP108 reports no queued watering zones.
7. The candidate differs from the original by exactly one bit: byte offset 19, mask `0x01`.
8. The explicit confirmation token is `ZONE8_DP38_WRITE`.

The zone number is not accepted as action input. Zone 8 is hard-coded in the protocol API so the laboratory action cannot be redirected to a production zone.

## Wire encoding

Internally the integration keeps DP38 as bytes. For TinyTuya local control the RAW datapoint candidate is sent as a Base64 ASCII string. Read-back is decoded through the existing RAW parser and compared byte-for-byte with the candidate.

## Install the laboratory component

The branch contains `tools/dp38_zone8_lab_component.sh`. It changes only `/config/custom_components/nikas_ho_sc_8w`, keeps the existing component under `/config/.ha-ho-sc-8w-dp38-lab-backup`, and does not touch config entries, `.storage`, Home Assistant data, or controller state.

From Home Assistant Terminal & SSH, download the helper from this branch and run it with `install`:

```sh
curl -fL \
  https://github.com/NikaSir/ha-ho-sc-8w/raw/refs/heads/protocol/dp38-zone8-rain-probe/tools/dp38_zone8_lab_component.sh \
  -o /tmp/dp38_zone8_lab_component.sh
sh /tmp/dp38_zone8_lab_component.sh install
```

If `curl` is unavailable, download the same file with `wget` and run it with `sh`.

The helper deliberately does not restart Home Assistant. Restart Home Assistant manually after it reports `LAB COMPONENT INSTALLED`.

Do not use HACS Update/Redownload for this integration while the lab component is installed, because that would replace the branch files with the normal repository version.

## Step 1 — read-only preflight

After installing this laboratory branch and restarting Home Assistant:

1. Open **Developer Tools → Actions**.
2. Select `nikas_ho_sc_8w.protocol_lab_zone8_rain_preflight`.
3. Select the HO-SC-8W configuration entry.
4. Run the action and inspect the response.

The preflight must report all of the following before proceeding:

- `zone: 8`;
- `source: controller`;
- `local_transport: true`;
- `controller_idle: true`;
- `preflight_only: true`;
- `already_in_requested_state: false`;
- `diff` contains exactly one item;
- that item has `offset: 19` and `xor: 1`;
- `before_hex` and `candidate_hex` are each exactly 40 hexadecimal characters and differ only in the final byte bit 0.

The response also provides:

- `current_follow_rain_sensor` — current decoded bit-0 value;
- `proposed_follow_rain_sensor` — the exact opposite value to use for the write probe.

Do not run the write probe if any preflight fact differs from these expectations.

## Step 2 — controlled write probe

Only after the preflight response has been reviewed:

1. Open `nikas_ho_sc_8w.protocol_lab_zone8_rain_probe`.
2. Select the same HO-SC-8W configuration entry.
3. Set `follow_rain_sensor` exactly to the preflight `proposed_follow_rain_sensor` value.
4. Enter the confirmation token exactly as `ZONE8_DP38_WRITE`.
5. Run the action once.

The sequence is transactional:

1. Re-read the current controller-sourced Zone 8 block from the integration cache.
2. Validate the block and capture it as the rollback snapshot.
3. Rebuild the requested candidate by changing only bit 0 at byte offset 19.
4. Recompute the byte-level diff and re-check local/idle gates.
5. Write the Base64-encoded candidate to DP38 over the active local TinyTuya session.
6. Wait for a controller DP38 push and require byte-for-byte equality with the candidate.
7. In a `finally` path, write the exact original 20-byte block back to DP38.
8. Wait for a controller DP38 push and require byte-for-byte equality with the original rollback snapshot.

## PASS criteria

The protocol probe is PASS only when all of these response fields are true:

- `candidate_sent`;
- `candidate_read_back`;
- `rollback_sent`;
- `rollback_read_back`;
- `probe_verified`.

The response must also still show the one-byte `offset: 19`, `xor: 1` diff and `wire_encoding: base64`.

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
- unexpected controller normalization of any other byte;
- any exception during the transaction.

If rollback cannot be verified, do not repeat the probe until the actual Zone 8 state has been independently inspected.

## Roll back the laboratory component

After the test, or at any time before the write probe, restore the exact component that was present before lab installation:

```sh
sh /tmp/dp38_zone8_lab_component.sh rollback
```

If `/tmp` has been cleared by the restart, download the helper again with the same command above, then run it with `rollback`. The persistent backup remains under `/config/.ha-ho-sc-8w-dp38-lab-backup` until rollback succeeds.

Restart Home Assistant manually after the helper reports `ORIGINAL COMPONENT RESTORED`.

## Production promotion gate

Only after a successful physical probe should the project consider a separate change that:

- records the physical result in the PR;
- removes the branch-only `protocol_lab.py` actions, laboratory `services.yaml` entries, and install helper;
- marks the rain-flag write semantics as verified only for the proven field;
- separately designs any production schedule-write API with read-before-write, diff validation, conflict protection, read-back and rollback;
- keeps raw DP writes out of Lovelace/frontend code.

This laboratory PR must remain draft until the physical result is recorded and the lab-only action surface is removed or the PR is superseded by a clean production change.
