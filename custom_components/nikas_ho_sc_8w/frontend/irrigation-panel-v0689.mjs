import "./irrigation-panel-v0688.mjs";

const UI_VERSION = "0.6.89";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0688 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;

p._dp38SnapshotLabV0689 = function dp38SnapshotLabV0689(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const status = String(attrs.dp38_snapshot_status || "idle");
  const baseline = attrs.dp38_snapshot_baseline || [];
  const current = attrs.dp38_snapshot_current || [];
  const diff = attrs.dp38_snapshot_diff || {};
  const trace = attrs.dp38_snapshot_trace || {};
  const baselineAvailable = attrs.dp38_snapshot_baseline_available === true;
  const allowed = attrs.dp38_snapshot_allowed === true
    && this.commandAvailable("capture_dp38_snapshot")
    && !this._dp38SnapshotBusy;
  const tone = status === "baseline_saved" || status === "compared_unchanged"
    ? "ok"
    : status === "compared_changes"
      ? "changed"
      : status === "incomplete" ? "error" : "";

  return `<section class="lab dp38SnapshotLab dp38FullSnapshot">
    <div class="zone8ProbeHead">
      <span><small>DP38 · СНИМОК 1–8</small><h3>До и после изменения на приборе</h3></span>
      <b class="${allowed ? "ready" : "blocked"}">Только чтение</b>
    </div>
    <p>Сохраняются точные 20-байтовые блоки всех зон. При контрольном чтении сравнивается каждый байт каждой зоны.</p>
    <div class="dp38SnapshotState ${tone}" role="status" aria-live="polite">
      <small>Результат</small><b>${this.esc(this._dp38SnapshotStatusText(status))}</b>
      ${attrs.dp38_snapshot_detail ? `<span>${this.esc(attrs.dp38_snapshot_detail)}</span>` : ""}
    </div>
    ${this._dp38SnapshotDiff(diff, status)}
    <details class="dp38SnapshotDetails" ${baselineAvailable && !current.length ? "open" : ""}>
      <summary>Исходный снимок · ${baseline.length || 0} из 8</summary>
      ${this._dp38SnapshotRows(baseline, "Исходный снимок отсутствует")}
    </details>
    ${current.length ? `<details class="dp38SnapshotDetails"><summary>Контрольный снимок · ${current.length} из 8</summary>${this._dp38SnapshotRows(current, "Контрольный снимок отсутствует")}</details>` : ""}
    ${Number.isFinite(Number(trace.active_requests)) ? `<div class="zone8Trace">Запросов: ${Number(trace.active_requests)} · ответов: ${Number(trace.responses || 0)} · зоны: ${this.esc((trace.zones_seen || []).join(", ") || "нет")}</div>` : ""}
    <div class="dp38SnapshotActions">
      <button type="button" class="zone8ProbeButton secondary" data-dp38-snapshot-phase="baseline" ${allowed ? "" : "disabled"}>
        <ha-icon icon="mdi:camera-outline"></ha-icon>${this._dp38SnapshotBusy ? "Идёт чтение" : baselineAvailable ? "Переснять исходный снимок 1–8" : "Снять исходный снимок 1–8"}
      </button>
      <button type="button" class="zone8ProbeButton" data-dp38-snapshot-phase="compare" ${allowed && baselineAvailable ? "" : "disabled"}>
        <ha-icon icon="mdi:compare"></ha-icon>Снять контрольный снимок и сравнить
      </button>
    </div>
    <p class="zone8ProbeWarning">Во время каждого снимка последовательно откройте на самом приборе зоны 1–8. Ничего не редактируйте до завершения чтения.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0689(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const snapshot = this._dp38SnapshotLabV0689(entities);
  const rainMarker = '<section class="lab rainSensorProbeLab">';
  if (content.includes(rainMarker)) return content.replace(rainMarker, `${snapshot}${rainMarker}`);
  return `${snapshot}${content}`;
};

p._render = function renderV0689() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
