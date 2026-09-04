import "./irrigation-panel-v0670.mjs";

const UI_VERSION = "0.6.71";
const LAST_FRESH_KEY = "nikas-ho-sc-8w.dp38.last-complete-snapshot";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0670 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function snapshotComplete(panel) {
  const schedule = panel.entities()?.zones?.[7]?.schedule;
  const attrs = schedule ? panel.attrs(schedule) : {};
  const snapshot = attrs.dp38_snapshot_baseline || {};
  const zones = Object.keys(snapshot)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 8);
  return new Set(zones).size === 8;
}

function rememberFresh(panel) {
  const now = Date.now();
  panel._programDp38LastFreshAt = now;
  try { localStorage.setItem(LAST_FRESH_KEY, String(now)); } catch (_) {}
}

p.refreshProgramDp38 = async function refreshProgramDp38V0671() {
  if (this._programSuppressImmediateRefresh) {
    this._programSuppressImmediateRefresh = false;
    if (this._programAutoRefreshTimer) window.clearTimeout(this._programAutoRefreshTimer);
    this._programAutoRefreshTimer = window.setTimeout(() => {
      this._programAutoRefreshTimer = null;
      this.refreshProgramDp38();
    }, 900);
    return;
  }
  if (this._programDp38RefreshBusy) return;

  this._programDp38RefreshBusy = true;
  this._programDp38RefreshStatus = "reading";
  this.render();

  let complete = false;
  let attempts = 0;
  try {
    while (attempts < 3 && !complete) {
      attempts += 1;
      // Deliberately use exactly the same HA entity-refresh path as the blue header ↻ button.
      await this.refreshNow();
      await sleep(700);
      complete = snapshotComplete(this);
      if (!complete && attempts < 3) await sleep(500);
    }

    this._programDp38RefreshAttempts = attempts;
    this._programDp38RefreshStatus = complete ? "fresh" : "incomplete";
    if (complete) {
      rememberFresh(this);
    } else {
      this.notify("DP38: автоматическое обновление не получило полный снимок 1–8");
    }
  } catch (error) {
    this._programDp38RefreshStatus = "error";
    this.notify(this.serviceError(error, "Не удалось автоматически обновить программы 1–8"));
  } finally {
    this._programDp38RefreshBusy = false;
    this.render();
  }
};

p._render = function renderV0671() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
