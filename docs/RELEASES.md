# Release policy

## Source of truth

- `main` is the canonical source branch.
- A public release must be traceable to an immutable Git commit/tag.
- Release artifacts must be produced from committed source, never from an uncommitted local working tree.

## Version lineage

Existing project version history must be preserved during GitHub migration. Repository bootstrap is not a reason to reset or renumber the integration.

Before HACS publication, the final release/tag format and the integration manifest version format must be validated against current Home Assistant/HACS requirements. Until that validation is complete, no synthetic version number is introduced by this repository scaffold.

## Release gate

Before a release:

1. Repository checks are green.
2. Functional tests for the affected integration behavior are complete.
3. `CHANGELOG.md` is updated.
4. No secrets or private diagnostics are present in tracked files or release artifacts.
5. The release tag points to the exact reviewed commit.

Published tags are treated as immutable.
