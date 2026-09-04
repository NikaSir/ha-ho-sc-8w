import "./irrigation-panel-v0673.mjs";

const UI_VERSION = "0.6.74";
const LAST_FRESH_KEY = "nikas-ho-sc-8w.dp38.last-complete-snapshot";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0673 panel is not registered");
const p = Panel.prototype;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousRender = p._render;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function snapshotInfo(panel) {
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

p.refreshProgramDp38 = async function refreshProgramDp38V0674() {
  // Keep the delayed entry trigger from the prior UI layer.
  if (this._programSuppressImmediateRefresh) {
    return previousRefreshProgramDp38.call(this);
  }
  if (this._programDp38RefreshBusy) return;

  this._programDp38RefreshBusy = true;
  this._programDp38RefreshStatus = "reading";
  this.render();

  const before = snapshotInfo(this);
  let complete = false;
  let acceptedStamp = "";
  try {
    // Use the exact read-only backend operation proven by the manual 1–8 snapshot button.
    // The service itself waits while the controller emits all DP38 blocks; on this device
    // that normally takes about 10–15 seconds.
    await this._hass.callService("nikas_ho_sc_8w", "capture_dp38_snapshot", {
      ...this.serviceTargetData(),
      phase: "baseline",
      confirmation: "DP38_FULL_SNAPSHOT_READ_ONLY",
    });

    // Ask HA to publish the newly stored backend attributes, then allow a short
    // propagation window for the zone-8 schedule entity to reach the panel.
    await this.refreshNow();
    const deadline = Date.now() + 8_000;
    while (Date.now() < deadline) {
      const current = snapshotInfo(this);
      const advanced = current.stamp && current.stamp !== before.stamp;
      if (current.complete && (advanced || !before.complete)) {
        complete = true;
        acceptedStamp = current.stamp;
        break;
      }
      await sleep(400);
    }

    this._programDp38RefreshAttempts = 1;
    this._programDp38RefreshStatus = complete ? "fresh" : "incomplete";
    if (complete) {
      rememberFresh(this, acceptedStamp);
    } else {
      this.notify("DP38: полный снимок 1–8 завершён, но его метаданные ещё не появились в панели");
    }
  } catch (error) {
    this._programDp38RefreshStatus = "error";
    this.notify(this.serviceError(error, "Не удалось автоматически получить полный снимок программ 1–8"));
  } finally {
    this._programDp38RefreshBusy = false;
    this.render();
  }
};

p._render = function renderV0674() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
