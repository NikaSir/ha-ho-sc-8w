# Publication policy

## Source of truth

- `main` is the canonical source branch.
- HACS installs the selected published release from this custom Integration repository; `main` remains the source branch.
- A stable integration version in the exact `X.Y.Z` form creates a GitHub Release automatically after a reviewed change reaches `main`.
- The existing automatic workflow skips prerelease versions. Approved beta candidates are published explicitly as GitHub prereleases after their checks pass.
- Published beta and stable tags and Release objects are preserved; do not delete, retarget or rewrite them to change channels.
- Every published stable state is traceable to its reviewed commit and matching GitHub release tag.

## Version lineage

Existing project version history is preserved in Git. Repository/bootstrap or frontend-hardening work is not a reason to discard historical versions.

## Specialized-panel frontend rule

The production integration-owned panel must ship as one self-contained JavaScript bundle.

For HO-SC-8W the production contract is:

```text
module_url = /nikas-ho-sc-8w/irrigation-panel.js?v=<PANEL_VERSION>
```

Requirements:

- the registered production bundle contains all project-owned runtime code required by the panel;
- no runtime import of `irrigation-panel-vXXX.js` or any previous UI version is allowed;
- historical frontend versions live in Git history, not in the browser dependency graph;
- a cold browser cache must be sufficient to load the current panel;
- changing bundle/loading architecture requires a distinct UI version and CHANGELOG entry.

## Publication gate

Before merging a publication change to `main`:

1. Repository checks are green.
2. Functional tests for the affected integration behavior are complete.
3. `CHANGELOG.md` is updated.
4. No secrets or private diagnostics are present in tracked files.
5. JavaScript syntax validation passes for the production panel bundle.
6. Exactly one production panel JavaScript bundle is present in `custom_components/nikas_ho_sc_8w/frontend/`.
7. The production bundle contains no historical-version runtime import.
8. The panel is checked after a full Home Assistant restart and from a cold client/cache.
9. Local access and Home Assistant Cloud / Nabu Casa loading are both verified before production promotion.

## Verified beta delivery snapshot — 2026-09-14

- Published GitHub prerelease: [`1.1.2-b1`](https://github.com/NikaSir/ha-ho-sc-8w/releases/tag/1.1.2-b1).
- Source commit: `53e2d992c4129de27ad4c26c219aab36f3c3e1a9`.
- The tag matches the integration manifest version.
- HACS and Hassfest checks on this exact commit completed successfully.
- Delivery uses the standard GitHub source archive. `hacs.json` does not require a separately uploaded ZIP asset.
- **Target Home Assistant installation and device acceptance remain unverified.** A published beta and green CI are not evidence of a successful installed update.

## Beta acceptance in Home Assistant

1. Open this custom Integration repository in HACS and enable beta/prerelease versions in its version selection.
2. Confirm the selected version is `1.1.2-b1`, install it, and restart Home Assistant as required.
3. Confirm the loaded integration version and panel UI version against the selected release; reopen the panel from a cold client/cache.
4. Verify the fixed header and bottom menu, device selectors, black Refresh button and completion feedback, scrolling, pinch zoom and reset. Verify telemetry updates without a full panel redraw.
5. Record the installed version, Home Assistant/HACS versions, device/client, checks performed and any errors. Do not mark acceptance complete without this evidence.
6. Publish stable only after user acceptance and version-consistent checks. Preserve existing published beta/stable tags and releases; use a new reviewed version for corrections.

This repository-specific beta policy reflects the approved publication decision and takes precedence over older blanket no-Releases wording in shared documentation. Shared pinned standards are not modified here.
