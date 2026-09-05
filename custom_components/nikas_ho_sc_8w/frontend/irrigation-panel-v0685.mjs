import "./irrigation-panel-v0684.mjs";

const UI_VERSION = "0.6.85";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0684 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

function cleanCompletedLabs(html) {
  return String(html || "").replace(/<section class="lab\s+([^\"]*zone7[^\"]*)">[\s\S]*?<\/section>/gi, "");
}

function pretty(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch (_) { return String(value); }
}

p.commandBusy = function commandBusyV0685() {
  return previousCommandBusy.call(this) || Boolean(this._rainDryBusy) || Boolean(this._rainWetBusy);
};

p.captureRainDry = async function captureRainDryV0685() {
  if (this.rejectUnavailableCommand("capture_dp38_snapshot")) return;
  this._rainDryBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "capture_dp38_snapshot", {
      ...this.serviceTargetData(), phase: "baseline", confirmation: "DP38_FULL_SNAPSHOT_READ_ONLY",
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[8].schedule);
    this._rainDryTrace = attrs.dp38_snapshot_trace || {};
    this._rainDryAt = attrs.dp38_snapshot_baseline_at || "";
    this.notify("Состояние «Сухо» сохранено. Дождитесь реального дождя и нажмите «Идёт дождь».");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось сохранить состояние «Сухо»"));
  } finally {
    this._rainDryBusy = false;
    this.render();
  }
};

p.captureRainWet = async function captureRainWetV0685() {
  if (this.rejectUnavailableCommand("capture_dp38_snapshot")) return;
  this._rainWetBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "capture_dp38_snapshot", {
      ...this.serviceTargetData(), phase: "compare", confirmation: "DP38_FULL_SNAPSHOT_READ_ONLY",
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[8].schedule);
    this._rainWetTrace = attrs.dp38_snapshot_trace || {};
    this._rainWetAt = attrs.dp38_snapshot_current_at || "";
    this.notify("Состояние «Идёт дождь» сохранено и сопоставлено с «Сухо».");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось сохранить состояние «Идёт дождь»"));
  } finally {
    this._rainWetBusy = false;
    this.render();
  }
};

p._rainSensorProbeCard = function rainSensorProbeCardV0685(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const baseline = attrs.dp38_snapshot_baseline || [];
  const current = attrs.dp38_snapshot_current || [];
  const diff = attrs.dp38_snapshot_diff || [];
  const baselineAt = this._rainDryAt || attrs.dp38_snapshot_baseline_at || "";
  const currentAt = this._rainWetAt || attrs.dp38_snapshot_current_at || "";
  const dryTrace = this._rainDryTrace || {};
  const wetTrace = this._rainWetTrace || attrs.dp38_snapshot_trace || {};
  const hasDry = Array.isArray(baseline) && baseline.length === 8;
  const hasWet = Array.isArray(current) && current.length === 8 && Boolean(currentAt);
  const busy = this.commandBusy();
  const available = this.commandAvailable("capture_dp38_snapshot") && !busy;
  const diffText = Array.isArray(diff) && diff.length ? pretty(diff) : (hasWet ? "Изменений DP38 не обнаружено" : "Снимок «Идёт дождь» ещё не сохранён");
  return `<section class="lab rainSensorProbeLab">
    <div class="zone8ProbeHead"><span><small>RAIN SENSOR · READ-ONLY</small><h3>Сухо / Идёт дождь</h3></span><b class="${hasDry && hasWet ? "ready" : hasDry ? "waiting" : "blocked"}">${hasDry && hasWet ? "Есть два снимка" : hasDry ? "Ждём дождь" : "Нет baseline"}</b></div>
    <p>Две кнопки только читают контроллер. Никаких DP-записей не выполняется. Сначала сохраните состояние при сухом датчике, затем — во время реального дождя.</p>
    <div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-rain-dry ${available ? "" : "disabled"}><ha-icon icon="mdi:weather-sunny"></ha-icon>${this._rainDryBusy ? "Снимаю…" : "Сухо"}</button><button type="button" class="zone8ProbeButton secondary" data-rain-wet ${available && hasDry ? "" : "disabled"}><ha-icon icon="mdi:weather-rainy"></ha-icon>${this._rainWetBusy ? "Снимаю…" : "Идёт дождь"}</button></div>
    <div class="maskWriteHex zone7LabHex"><span><small>СУХО · ВРЕМЯ</small><code>${this.esc(baselineAt || "—")}</code></span><span><small>ИДЁТ ДОЖДЬ · ВРЕМЯ</small><code>${this.esc(currentAt || "—")}</code></span></div>
    <div class="zone7LabDiff"><small>DP38 · DIFF СУХО → ДОЖДЬ</small><pre>${this.esc(diffText)}</pre></div>
    <details class="dp38SnapshotFold"><summary>Служебные DP · Сухо</summary><pre>${this.esc(pretty(dryTrace))}</pre></details>
    <details class="dp38SnapshotFold"><summary>Служебные DP · Идёт дождь</summary><pre>${this.esc(pretty(wetTrace))}</pre></details>
    <p><b>Важно.</b> Для анализа пришлите фото этой карточки в состоянии «Сухо» и после фиксации «Идёт дождь». Особый интерес: DP102, DP107/108 и изменения byte 19.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0685(entities) {
  const raw = previousDiagnosticsView.call(this, entities);
  const cleaned = cleanCompletedLabs(raw);
  const rain = this._rainSensorProbeCard(entities);
  const marker = '<section class="lab dp38SnapshotLab">';
  if (cleaned.includes(marker)) return cleaned.replace(marker, `${rain}${marker}`);
  const snapshotTitle = "DP38 · СНИМОК 1–8";
  const titleAt = cleaned.indexOf(snapshotTitle);
  if (titleAt >= 0) {
    const sectionAt = cleaned.lastIndexOf('<section class="lab', titleAt);
    if (sectionAt >= 0) return `${cleaned.slice(0, sectionAt)}${rain}${cleaned.slice(sectionAt)}`;
  }
  return `${rain}${cleaned}`;
};

p._ensureV0685Events = function ensureV0685Events() {
  if (this._v0685EventsBound) return;
  this._v0685EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-rain-dry]")) { this.captureRainDry(); return; }
    if (event.target.closest?.("[data-rain-wet]")) this.captureRainWet();
  });
};

p._render = function renderV0685() {
  previousRender.call(this);
  this._ensureV0685Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
