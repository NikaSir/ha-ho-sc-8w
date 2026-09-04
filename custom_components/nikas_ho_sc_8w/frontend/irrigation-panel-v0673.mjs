import "./irrigation-panel-v0672.mjs";

const UI_VERSION = "0.6.73";
const LAST_FRESH_KEY = "nikas-ho-sc-8w.dp38.last-complete-snapshot";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0672 panel is not registered");
const p = Panel.prototype;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousRender = p._render;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function snapshotInfo(panel) {
  // Full DP38 snapshot metadata is intentionally exposed by the zone-8 schedule entity.
  const schedule = panel.entities()?.zones?.[8]?.schedule;
  const attrs = schedule ? panel.attrs(schedule) : {};
  return {
    complete: attrs.dp38_snapshot_baseline_available === true,
    stamp: String(attrs.dp38_snapshot_baseline_at || ""),
  };
}

function rememberFresh(panel, stamp) {
  const parsed = stamp ? Date.parse(stamp) : NaN;
  const at = Number.isFinite(parsed) ? parsed : Date.now();
  panel._programDp38LastFreshAt = at;
  try { localStorage.setItem(LAST_FRESH_KEY, String(at)); } catch (_) {}
}

p.refreshProgramDp38 = async function refreshProgramDp38V0673() {
  // Preserve the existing delayed entry trigger, replacing only the snapshot validation.
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
  let acceptedStamp = "";
  try {
    // Exactly the same read path as the working blue header refresh button.
    await this.refreshNow();

    // Wait for the backend's canonical full-snapshot timestamp to advance.
    const deadline = Date.now() + 12_000;
    while (Date.now() < deadline) {
      await sleep(400);
      elapsedMs += 400;
      const current = snapshotInfo(this);
      const newSnapshot = current.stamp && current.stamp !== before.stamp;
      if (current.complete && (newSnapshot || !before.complete)) {
        complete = true;
        acceptedStamp = current.stamp;
        break;
      }
    }

    this._programDp38RefreshAttempts = 1;
    this._programDp38RefreshWaitMs = elapsedMs;
    this._programDp38RefreshStatus = complete ? "fresh" : "incomplete";
    if (complete) {
      rememberFresh(this, acceptedStamp);
    } else {
      this.notify("DP38: после обновления backend не подтвердил новый полный снимок 1–8");
    }
  } catch (error) {
    this._programDp38RefreshStatus = "error";
    this.notify(this.serviceError(error, "Не удалось автоматически обновить программы 1–8"));
  } finally {
    this._programDp38RefreshBusy = false;
    this.render();
  }
};

p._render = function renderV0673() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
