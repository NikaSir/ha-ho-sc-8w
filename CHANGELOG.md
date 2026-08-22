# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Changed

- `1.0.0-b005.5` / panel `0.4.2`: harden specialized-panel loading to the mandatory NikaS frontend release standard. Home Assistant now registers one stable `irrigation-panel.js` production bundle with query-string cache busting; the bundle contains the complete panel implementation and has no runtime imports of previous UI versions.
- `1.0.0-b005.5` / panel `0.4.2`: remove the production runtime dependency chain `v041 → v040 → v033 → v032 → v03`; historical frontend versions remain available through Git history rather than browser loading.
- `1.0.0-b005.5` / panel `0.4.2`: keep the v0.4 information architecture (`Обзор · Ручной · Настройки · Диагн.`) and enlarge the fixed Bottom Tab Bar targets/icons while preserving the compact one-screen Overview target for zones 1–6.
- `1.0.0-b005.4` / panel `0.4.1`: compact Overview for iPhone Pro Max portrait so zones 1–6 fit on the initial screen together with current/next irrigation status.
- `1.0.0-b005.3` / panel `0.4.0`: move to the domain-oriented information architecture — Overview, Manual, Settings and Diagnostics; zone configuration becomes a drill-down and complete program verification becomes a read-only Diagnostics drill-down.
- `1.0.0-b005.2` / panel `0.3.3`: align Header geometry with NikaS Integration Dashboard UI Standard v1.2 — viewport-centered title, no decorative Header icon, explicit Back.
- `1.0.0-b005.1` / panel `0.3.2`: align the irrigation application shell with Home Assistant NikaS specialized-panel UI standard — the primary Tab Bar is full-width, edge-attached to the viewport bottom, non-floating and iOS-safe.
- `1.0.0-b005` / panel `0.3.1`: finalize the Home Assistant NikaS specialized-panel application shell. Header Back explicitly navigates to `/dashboard-actions` and Home Assistant panel registration opts into safe-area handling.
- Renamed the GitHub repository from `ha-inkbird-irrigation` to `ha-ho-sc-8w` to match the supported HO-SC-8W scope.
- Kept the existing Home Assistant integration domain unchanged pending a separate compatibility-reviewed migration decision.

### Added

- CI release checks for JavaScript syntax, exactly one production frontend bundle, and rejection of historical-version runtime imports.
- Machine-readable panel metadata for the stable `/dashboard-irrigation` route, parent `/dashboard-actions`, current information architecture and self-contained frontend-bundle contract.
- Initial GitHub repository bootstrap and project boundary documentation.

> Historical integration/frontend versions are preserved in Git history; current production artifacts do not depend on them at runtime.
