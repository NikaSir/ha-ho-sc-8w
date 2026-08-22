# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Changed

- `1.0.0-b005` / panel `0.3.1`: finalize the Home Assistant NikaS specialized-panel application shell. Header Back explicitly navigates to `/dashboard-actions`, primary section switching remains in the fixed iOS-safe bottom bar, and Home Assistant panel registration opts into safe-area handling.
- `1.0.0-b005` / panel `0.3.1`: preserve the existing mobile-first irrigation content and safety model; no raw Tuya writes or new device actions are introduced.
- Renamed the GitHub repository from `ha-inkbird-irrigation` to `ha-ho-sc-8w` to match the supported HO-SC-8W (IIC-800) scope.
- Kept the existing Home Assistant integration domain unchanged pending a separate compatibility-reviewed migration decision.

### Added

- Machine-readable panel metadata for the stable `/dashboard-irrigation` route, parent `/dashboard-actions`, and fixed-bottom navigation contract.
- Initial GitHub repository bootstrap and project boundary documentation.

> Historical integration versions will be imported during the controlled migration of the verified implementation; bootstrap commits do not reset or replace that history.
