# HO-SC-8W Irrigation · NikaS

Standalone Home Assistant integration project for the **INKBIRD / HiOazo HO-SC-8W** irrigation controller with display, 8 irrigation zones and Wi-Fi.

## Status

Controlled standalone migration is in progress. The verified production implementation will be imported from the running Home Assistant instance before the integration source tree is finalized. Placeholder code is not treated as a release.

## Hardware scope

Supported device:

- Manufacturer: **INKBIRD / HiOazo**
- Model: **HO-SC-8W**
- Display: yes
- Irrigation zones: 8
- Connectivity: Wi-Fi
- Local protocol used by the verified installation: Tuya v3.3

The project is intentionally scoped to this controller. `IIC-600-WIFI`, `IIC-400` and generic multi-model support are out of scope.

## Integration identity

Target standalone identity:

```text
Repository:  ha-ho-sc-8w
Domain:      nikas_ho_sc_8w
Directory:   custom_components/nikas_ho_sc_8w
Integration: HO-SC-8W Irrigation · NikaS
Device:      Контроллер полива HO-SC-8W
Manufacturer: INKBIRD / HiOazo
Model:       HO-SC-8W
```

The new domain is intentionally separate from the earlier `inkbird_irrigation` installation. Migration will be compatibility-tested before the old config entry is removed.

## Functional model

The native application behavior is treated as three interface areas:

1. **Scheduled / Auto** — controller-resident automatic program (`DP38 normal_time`).
2. **Manual** — manual zone operation and runtime (`DP45`).
3. **Schedules & History** — saved program, upcoming watering and historical data.

The controller itself has Auto and Manual operating modes. The Home Assistant UI must keep automatic program editing separate from manual zone control.

## Verified telemetry baseline

Verified on the production HO-SC-8W:

- `DP38` — saved per-zone automatic program;
- `DP44` — irrigation execution mode (`order` verified);
- `DP45` — first 16-byte zone block = remaining time, second block = elapsed time;
- `DP101` — operation mode (`Auto / Manual / OFF`);
- `DP102` — rain sensor enable;
- `DP103` — seasonal adjustment; write from Home Assistant confirmed on the controller display;
- `DP107` — active-zone bitmask;
- `DP108` — queued-zone bitmask;
- `DP109` — alarm voice control.

`DP104` history decoding remains under investigation and must not be presented as authoritative until validated.

## Automatic program safety

The production watering program must not be modified casually. Program writes will use a protected workflow:

```text
fresh read -> backup -> draft -> diff -> explicit apply -> read-back -> byte comparison
```

Zone 8 is physically unused and is reserved as the controlled test channel for the first `DP38` write experiments. The first write test will be a no-op write of the exact current Zone 8 block, followed by mandatory read-back validation. No automatic launch of Zone 8 is required for transport validation.

## Repository / update policy

This repository is the source of truth for the standalone integration. It is **not intended to be managed by HACS** during the standalone migration:

- no dependency on the previous repository identity;
- no automatic HACS replacement of the standalone domain;
- releases are traceable to reviewed Git commits/tags;
- secrets, local keys, tokens, account credentials and production identifiers must never be committed.

The standalone integration may later have its own release/update mechanism, but that is a separate explicit decision.

## Target layout

```text
custom_components/
  nikas_ho_sc_8w/
docs/
tests/
tools/
.github/workflows/
README.md
CHANGELOG.md
LICENSE
THIRD_PARTY_NOTICES.md
```

## Licensing

Parts of the verified implementation originate from MIT-licensed code. Required copyright and license notices will be preserved in `LICENSE` and/or `THIRD_PARTY_NOTICES.md`. This licensing requirement does not create a runtime or update dependency on another repository.
