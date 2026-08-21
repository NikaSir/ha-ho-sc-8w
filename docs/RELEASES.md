# Release policy

## Source of truth

- `main` is the canonical source branch.
- A public release must be traceable to an immutable Git commit/tag.
- Release artifacts must be produced from committed source, never from an uncommitted local working tree.
- The standalone Home Assistant domain is `nikas_ho_sc_8w`.

## Distribution model

The standalone HO-SC-8W integration is not intended to be managed by HACS during the migration phase. A repository rename alone is not treated as an update boundary; the standalone domain and directory provide that boundary.

Target installation path:

```text
/config/custom_components/nikas_ho_sc_8w/
```

Release ZIPs may be published from reviewed tags after the migration gate is complete. HACS publication or automatic update support requires a separate explicit design decision.

## Version lineage

Existing project history is preserved. Repository bootstrap and domain migration are not reasons to erase historical development records.

The first standalone candidate will use a Home Assistant-compatible semantic version in `manifest.json`; the final version is assigned only after the current verified production archive has been imported and reviewed.

## Release gate

Before a standalone release:

1. The verified production integration archive is imported without secrets or production identifiers.
2. The integration imports successfully under `custom_components/nikas_ho_sc_8w`.
3. Repository checks are green.
4. Local HO-SC-8W connection is confirmed without running a competing old Tuya session.
5. Read-only DP38/DP45/DP107/DP108 telemetry matches the verified baseline.
6. Existing Home Assistant UI contract sensors continue to work after low-level entity remapping.
7. Zone 8 DP38 no-op write passes mandatory byte-for-byte read-back before any editable automatic-program feature is released.
8. `CHANGELOG.md` is updated.
9. No secrets, Local Keys, cloud credentials, private diagnostics or production identifiers are present in tracked files or release artifacts.
10. The release tag points to the exact reviewed commit.

Published tags are treated as immutable.
