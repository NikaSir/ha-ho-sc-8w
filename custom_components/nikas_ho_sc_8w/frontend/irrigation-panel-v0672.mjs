import "./irrigation-panel-v0671.mjs";

const UI_VERSION = "0.6.72";
const LAST_FRESH_KEY = "nikas-ho-sc-8w.dp38.last-complete-snapshot";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0671 panel is not registered");
const p = Panel.prototype;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousRender = p._render;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function snapshotInfo(panel) {
  const schedule = panel.entities()?.zones?.[7]?.schedule;
  const state = schedule ? panel.states()?.[schedule] : null;
  const attrs = schedule ? panel.attrs(schedule) : {};
  const snapshot = attrs.dp38_snapshot_baseline || {};
  const zones = Object.keys(snapshot)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 8);
  return {
    complete: new Set(zones).size === 8,
    stamp: String(state?.last_reported || state?.last_updated || state?.last_changed || ""),
  };
}

function rememberFresh(panel) {
  const now = Date.now();
  panel._programDp38LastFreshAt = now;
  try { localStorage.setItem(LAST_FRESH_KEY, String(now)); } catch (_) {}
}

p.refreshProgramDp38 = async function refreshProgramDp38V0672() {
  // Preserve v0670's delayed entry trigger, but replace the actual refresh body.
  if (this._programSuppressImmediateRefresh) {
    return previousRefreshProgramDp38.call(this);
  }
  if (this._programDp38RefreshBusy) return;

  this._programDp38RefreshBusy = true;
  this._programDp38RefreshStatus = "reading";
  this.render();

  const before = snapshotInfo(this);
  let complete = false;
  let elapsedMs = 0;
  try {
    // Exactly the same command as the blue header refresh button.
    await this.refreshNow();

    // update_entity can return before HA has propagated the refreshed entity attributes
    // back to the panel. Wait for a new state stamp and a complete 1–8 snapshot.
    const deadline = Date.now() + 12_000;
    while (Date.now() < deadline) {
      await sleep(400);
      elapsedMs += 400;
      const current = snapshotInfo(this);
      const newState = current.stamp && current.stamp !== before.stamp;
      if (current.complete && (newState || !before.complete)) {
        complete = true;
        break;
      }
    }

    this._programDp38RefreshAttempts = 1;
    this._programDp38RefreshWaitMs = elapsedMs;
    this._programDp38RefreshStatus = complete ? "fresh" : "incomplete";
    if (complete) {
      rememberFresh(this);
    } else {
      this.notify("DP38: после обновления не получен новый полный снимок 1–8");
    }
  } catch (error) {
    this._programDp38RefreshStatus = "error";
    this.notify(this.serviceError(error, "Не удалось автоматически обновить программы 1–8"));
  } finally {
    this._programDp38RefreshBusy = false;
    this.render();
  }
};

p._render = function renderV0672() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
