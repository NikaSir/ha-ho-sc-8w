# Publication policy

## Source of truth

- `main` is the canonical source branch.
- HACS installs and updates the integration from the custom repository's default `main` branch.
- GitHub Releases and automatic release tags are not used for normal panel publication.
- Every published state must be traceable to a reviewed commit in `main`.

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
