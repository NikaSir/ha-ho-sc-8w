# INKBIRD / HiOazo HO-SC-8W device profile

## Hardware identity

This project targets one controller family only:

- Manufacturer: **INKBIRD / HiOazo**
- Model: **HO-SC-8W**
- Display: yes
- Irrigation zones: 8
- Connectivity: Wi-Fi
- Verified local Tuya protocol: v3.3

The project must not present this device as `IIC-800-WIFI`. Internal compatibility knowledge may reference older model labels while code is being migrated, but the Home Assistant device identity and user-facing documentation use `HO-SC-8W`.

## Native application model

The native application is treated as three interface areas:

1. Scheduled / Auto
2. Manual
3. Schedules & History

The controller operating model itself has Auto and Manual behavior. Home Assistant must keep automatic-program editing separate from manual runtime control.

## Verified DP map

| DP | Meaning | Project status |
|---:|---|---|
| 38 | `normal_time` automatic program | Read and reconstructed from real device/report logs |
| 44 | irrigation execution mode | `order` verified |
| 45 | irrigation runtime payload | remaining/elapsed layout verified on production cycle |
| 101 | operation mode | `Auto / Manual / OFF` observed |
| 102 | rain sensor enable | available |
| 103 | seasonal adjustment | read/write; write confirmed on controller display |
| 104 | history / accumulated runtime | unresolved; do not expose as authoritative |
| 105 | reset device | writable capability exists; not used by project workflows |
| 106 | timer error alarm | available |
| 107 | active-zone bitmask | verified |
| 108 | queued-zone bitmask | verified |
| 109 | alarm voice control | available |

## DP45 verified runtime layout

The HO-SC-8W reports a 34-byte DP45 payload.

For the verified production controller:

```text
bytes 0-1    header / command-target fields
bytes 2-17   remaining minutes, zones 1-8, uint16 big-endian
bytes 18-33  elapsed minutes, zones 1-8, uint16 big-endian
```

Observed production behavior confirmed that remaining decreases while elapsed increases for the active zone.

## DP107 active-zone bitmask

Verified mapping:

```text
Zone 1 = 1
Zone 2 = 2
Zone 3 = 4
Zone 4 = 8
Zone 5 = 16
Zone 6 = 32
Zone 7 = 64
Zone 8 = 128
```

Zones 7 and 8 are not part of the normal production watering layout. Zone 8 is physically unused and reserved for controlled schedule-write testing.

## DP38 automatic program block

The production controller reports one 20-byte block per zone.

Verified layout for the active interval-mode program:

```text
byte 0       zone number 1..8
byte 1       base duration in minutes
bytes 2-7    up to six start HOURS
bytes 8-13   corresponding start MINUTES
0xFF         unused start slot
byte 14      calendar mode
byte 15      interval / calendar parameter
bytes 16-18  anchor date YY/MM/DD
byte 19      controller flags; full bit semantics not yet verified
```

Do not use a generic decoder that treats bytes 2-13 as six interleaved hour/minute pairs; that interpretation is incorrect for the verified HO-SC-8W payloads.

## Current production program reference

The current confirmed schedule snapshot contains:

| Zone | Base duration | Start times | Calendar |
|---:|---:|---|---|
| 1 | 10 min | 05:00 | every 2 days |
| 2 | 20 min | 05:00 | daily |
| 3 | 10 min | 05:10 | every 2 days |
| 4 | 10 min | 05:00 | every 2 days |
| 5 | 7 min | 16:10 | every 2 days |
| 6 | 20 min | 11:00, 13:00, 17:00 | daily |
| 7 | 0 | none | disabled |
| 8 | 0 | none | disabled |

This table is a diagnostic reference, not a hard-coded desired schedule. Runtime code must read the controller program rather than assume these values forever.

## Safety notes

- Production zones 1-6 are not modified without explicit test scope.
- DP38 write development begins with Zone 8 only.
- The first Zone 8 write is a no-op write of the exact current block.
- Every DP38 write requires fresh read, backup, validation and read-back comparison.
- No automatic Zone 8 launch is required for write-transport validation.
