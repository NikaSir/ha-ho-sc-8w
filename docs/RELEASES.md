# Release policy

## Source of truth

- `main` is the canonical source branch.
- A public release must be traceable to an immutable Git commit/tag.
- Release artifacts must be produced from committed source, never from an uncommitted local working tree.

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
- historical frontend versions live in Git history/tags/releases, not in the browser dependency graph;
- a cold browser cache must be sufficient to load the current panel;
- changing bundle/loading architecture requires a distinct UI version and CHANGELOG entry.

## Release gate

Before a release:

1. Repository checks are green.
2. Functional tests for the affected integration behavior are complete.
3. `CHANGELOG.md` is updated.
4. No secrets or private diagnostics are present in tracked files or release artifacts.
5. The release tag points to the exact reviewed commit.
6. JavaScript syntax validation passes for the production panel bundle.
7. Exactly one production panel JavaScript bundle is present in `custom_components/nikas_ho_sc_8w/frontend/`.
8. The production bundle contains no historical-version runtime import.
9. The panel is checked after a full Home Assistant restart and from a cold client/cache.
10. Local access and Home Assistant Cloud / Nabu Casa loading are both verified before production promotion.

Published tags are treated as immutable.
