# Manual session safety — b006.29 / UI 0.7.08

## Problem and behavior

The old Skip Current path retained the last submitted DP45 plan after a manual run ended. A later automatic run on the same zone could therefore send the old remainder as a new manual command. The old confirmation also accepted cached DP107 data after a partial or unsuccessful read.

A plan is now owned only after a native DP45 start receives fresh valid DP101 (Manual), DP107 (exact first-zone mask), DP108 (no zones outside the plan), and DP44 (sequential order). Before starting or preserving a queue, a successful fresh read must contain every required safety DP. A zero DP108 remains valid: the field-tested firmware does not expose its internal remainder there.

Every observed mode exit, idle state, unexpected/multiple/regressive active zone, incompatible queue, sequential-mode change, connection gap or uncertain command revokes ownership. Matching telemetry later cannot recreate it. Natural ascending progression retains only unfinished zones. Each successful explicit start or skip issues a new token.

The active-zones sensor publishes permission, the current zone, and a process-local token. The panel checks these before and after confirmation and sends `expected_zone` and `expected_session_id`. The service and coordinator forward both to the backend, which checks them after fresh preflight and before any write. An outdated intent is rejected without invalidating an otherwise valid current session. Service callers may omit the intent fields; a confirmed owned session is still mandatory.

Stop All keeps the native all-zero DP45 command and requires fresh mode/active/queued confirmation. It does not require a saved plan or sequential mode. Returning to Auto revokes any manual plan before dispatch. Command errors also publish the updated permission to Home Assistant.

## Evidence and limits

- `python scripts/check-manual-skip-contract.py` runs the real native API and DP45 encoder with an offline wire peer. Negative cases assert zero writes; positive cases exercise start, natural progression, successive skips, and stop. It covers partial/stale/malformed reads, unconfirmed writes, foreign runs, session tokens and connection failures.
- `python scripts/check-manual-session-adapters.py` executes the production service, coordinator and sensor methods with only the Home Assistant boundary stubbed. It checks intent forwarding, error conversion, lock release and publication of revoked permissions.
- `node scripts/check-manual-session-ui.mjs` loads the actual registered production entry and its import graph. It checks Auto/unknown/unavailable states, busy/missing services, changed confirmation intent, successful dispatch and retained drafts on failure.
- Existing DP38, parity editor and panel checks remain required in CI. The new entry replaces v0707 at the same import depth; consolidation of the historical modules is a separate audit item.

These checks do not send device commands and are not physical acceptance. After deployment, verify that this firmware supplies DP44 with fresh DP101/107/108 and that a supervised manual start/skip/stop behaves as expected. Missing evidence conservatively disables the operation.

The controller protocol has no session ID. An external stop and restart with identical mode and zone that occurs entirely between observations cannot be distinguished. An observed idle transition, including a possible brief transition between zones, revokes permission; Stop All remains available. Absolute device-side identity requires protocol support or exclusive command ownership beyond this patch.

## Publishing

The update follows the agreed `main`/HACS path. The workflow that automatically created GitHub Releases on manifest changes is removed; existing tags and releases are untouched. Branch protection is a separate planned change.
