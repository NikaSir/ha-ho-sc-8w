# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Changed

- Renamed the GitHub repository from `ha-inkbird-irrigation` to `ha-ho-sc-8w`.
- Fixed the hardware identity to **INKBIRD / HiOazo HO-SC-8W** with display, 8 irrigation zones and Wi-Fi; generic `IIC-800-WIFI` naming is no longer the project identity.
- Chosen standalone Home Assistant domain: `nikas_ho_sc_8w`.
- Defined the target integration directory as `custom_components/nikas_ho_sc_8w`.
- Removed HACS-managed installation from the target standalone architecture; repository releases remain independent of HACS unless explicitly reconsidered later.
- Limited the project scope to HO-SC-8W; IIC-600/IIC-400 and generic multi-model support are out of scope.

### Added

- Standalone migration policy preserving the verified production implementation before source-tree cleanup.
- Safety policy for automatic-program editing based on fresh read, backup, draft, diff, explicit apply and mandatory read-back.
- Zone 8 designated as the physically unused controlled test channel for initial DP38 no-op/write validation.
- Documented verified telemetry baseline for DP38, DP44, DP45, DP101-103 and DP107-109.

### Pending validation

- Import of the current verified production integration archive.
- Standalone domain migration in Home Assistant without running two local Tuya sessions simultaneously.
- DP38 Zone 8 no-op write and byte-for-byte read-back.
- Final DP104 history decoding.
