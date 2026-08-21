# HO-SC-8W for Home Assistant

Custom Home Assistant integration project for the **INKBIRD / HiOazo HO-SC-8W (IIC-800)** irrigation controller.

## Status

Repository bootstrap and migration to GitHub are in progress. Existing verified implementation knowledge and working code will be migrated deliberately; placeholder scaffolding is not treated as a release.

## Scope

This repository is for the Home Assistant integration layer: device communication, entities, diagnostics, program decoding/editing, tests, documentation, HACS packaging, and releases.

The **IIC-600-WIFI is out of scope** for this project.

## Repository policy

- Default branch: `main`.
- Secrets, local keys, tokens, account credentials, and private device data must never be committed.
- Releases must be traceable to source commits.
- Shared contribution/security defaults are inherited from `NikaSir/.github` unless overridden here.

## Target layout

```text
custom_components/inkbird_irrigation/
docs/
.github/workflows/
hacs.json
```

The repository name is `ha-ho-sc-8w`. The existing Home Assistant integration domain is intentionally not renamed as part of the repository rename; any domain migration must be handled separately and compatibility-tested.

The integration implementation will be introduced during the controlled migration phase rather than generated as fake production code.
