# Standalone build candidate v1.0.0-b001

A standalone runtime candidate has been assembled from the verified production archive supplied on 2026-08-21.

## Candidate identity

- repository: `ha-ho-sc-8w`
- target Home Assistant domain: `nikas_ho_sc_8w`
- integration name: `HO-SC-8W Irrigation`
- manufacturer: `INKBIRD / HiOazo`
- model: `HO-SC-8W`
- zones: 8
- local protocol: Tuya v3.3

## Production baseline

Source archive SHA-256:

`72b9871b99fa387c4154880992756061b419d244a05e4f7770997a45597c8c56`

Key verified baseline hashes:

- `api.py`: `d3631c944517a044c03f8e2f8be9f66b31080508053b4ff497704c131aa7b583`
- `sensor.py`: `4a0b48b228632a63167464c72b6a2a8cb7074a4c183724fb55bdccac1b70a582`
- `models.py`: `cd437689b003ec24ac8b9afe5929a9a29a74b7edf23d6d4b3b0b8329aa35c6ec`

## Candidate changes

- independent domain `nikas_ho_sc_8w`;
- fixed HO-SC-8W hardware profile only;
- IIC-400/IIC-600 selection and autodetection removed;
- local protocol fixed to verified v3.3;
- verified DP45 `remaining` / `elapsed` behavior retained;
- DP38 decoder corrected to six hour bytes + six minute bytes;
- per-zone DP38 read-only cache sensors added;
- DP104 semantic decoder removed from production presentation; raw diagnostic retained only;
- manual duration controls explicitly separated from persistent automatic-program duration;
- no DP38 write service in b001.

## Static validation completed

- Python compile: PASS;
- JSON manifest/string/translation parsing: PASS;
- old runtime identity/reference scan: PASS;
- DP38 round-trip tests for the eight captured production zone blocks: PASS;
- Zone 6 decoded as `11:00`, `13:00`, `17:00`: PASS;
- DP45 synthetic remaining/elapsed regression: PASS.

## Release gate

This build is **not a release yet**. Next gate is Home Assistant validation and read-only migration testing. The old and new config entries must never hold simultaneous local Tuya sessions to the controller.
