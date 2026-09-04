import "./irrigation-panel-v0665.mjs";

const UI_VERSION = "0.6.66";
const EXECUTE_CONFIRMATION = "WRITE_ZONE7_DURATION_17_ONCE";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousCommandBusy = p.commandBusy;
const previousDiagnosticsView = p.diagnosticsView;
const previousManualView = p.manualView;
const previousRender = p._render;
const previousStyles = p.styles;

function labStatus(result) {
  const status = String(result?.status || "idle");
  return {
    idle: "Не подготовлено",
    prepared: "Dry-run подготовлен — запись ещё не выполнялась",
    verified: "Подтверждено полным read-back 1–8",
    mismatch: "Read-back не совпал — дальнейшие записи запрещены",
  }[status] || status;
}

function labTone(result) {
  const status = String(result?.status || "idle");
  if (status === "verified") return "ok";
  if (status === "prepared") return "waiting";
  if (status === "mismatch") return "error";
  return "";
}

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => {
    const offset = Number(item?.offset);
    const field = String(item?.field || "byte");
    const before = String(item?.before ?? item?.source ?? "??");
    const after = String(item?.after ?? item?.target ?? "??");
    return `byte ${Number.isInteger(offset) ? offset : "?"} · ${field}: ${before} → ${after}`;
  }).join("\n");
}

p.manualView = function manualViewV0666(entities) {
  return previousManualView.call(this, entities)
    .replace(
      "<h1>Управление зонами</h1>",
      '<h1>Управление зонами</h1><p class="manualDurationHint">Выберите зоны и задайте длительность полива в минутах.</p>',
    )
    .replace(
      /<strong>(\d+)<small>мин<\/small><\/strong>/g,
      "<strong>$1</strong>",
    )
    .replace(
      '<p class="viewFootnote"><b>Примечание.</b> Выберите зоны и задайте длительность. Контроллер выполнит очередь сверху вниз.</p>',
      '<p class="viewFootnote"><b>Примечание.</b> Контроллер выполнит выбранные зоны по порядку сверху вниз.</p>',
    );
};

p.commandBusy = function commandBusyV0666() {
  return previousCommandBusy.call(this)
    || Boolean(this._zone7LabPrepareBusy)
    || Boolean(this._zone7LabExecuteBusy);
};

p.prepareZone7Duration17 = async function prepareZone7Duration17V0666() {
  if (this.rejectUnavailableCommand("prepare_zone7_duration17")) return;
  this._zone7LabPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_duration17", {
      ...this.serviceTargetData(),
    });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    if (result.status === "prepared") {
      this.notify("Dry-run зоны 7 подготовлен. Проверьте HEX и diff перед записью");
    } else {
      this.notify("Dry-run выполнен, но статус плана требует проверки");
    }
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест зоны 7"));
  } finally {
    this._zone7LabPrepareBusy = false;
    this.render();
  }
};

p.executeZone7Duration17 = async function executeZone7Duration17V0666() {
  if (this.rejectUnavailableCommand("execute_zone7_duration17")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const prepared = result.status === "prepared"
    && String(result.field || "") === "duration_minutes"
    && String(result.value || "") === "17";
  if (!prepared) {
    this.notify("Сначала подготовьте актуальный dry-run зоны 7 = 17 минут");
    return;
  }

  const diffText = formatDiff(result.diff);
  const message = [
    "Выполнить единственную лабораторную запись DP38 зоны 7?",
    "",
    "Цель: длительность зоны 7 = 17 минут.",
    "Перед записью контроллер повторно считает все 8 зон и отменит устаревший план.",
    "После записи будут снова считаны все 8 зон.",
    "",
    `Dry-run:\n${diffText}`,
    "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;

  this._zone7LabExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_duration17", {
      ...this.serviceTargetData(), confirmation: EXECUTE_CONFIRMATION,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    if (updated.verified === true) {
      this.notify("Зона 7 подтверждена; зоны 1–6 и 8 не изменились");
    } else {
      this.notify("Тест завершён без полного подтверждения — дальнейшие записи не выполнять");
    }
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Запись зоны 7 не подтверждена"));
  } finally {
    this._zone7LabExecuteBusy = false;
    this.render();
  }
};

p._zone7LabCard = function zone7LabCardV0666(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const status = String(result.status || "idle");
  const prepared = status === "prepared"
    && String(result.field || "") === "duration_minutes"
    && String(result.value || "") === "17";
  const prepareAvailable = this.commandAvailable("prepare_zone7_duration17")
    && !this._zone7LabPrepareBusy
    && !this._zone7LabExecuteBusy;
  const executeAvailable = prepared
    && this.commandAvailable("execute_zone7_duration17")
    && !this._zone7LabPrepareBusy
    && !this._zone7LabExecuteBusy;
  const source = result.source_read_hex || plan.source_read_hex || "";
  const write = result.write_hex || plan.write_hex || "";
  const expected = result.expected_read_hex || plan.expected_read_hex || "";
  const actual = result.actual_read_hex || "";
  const collateral = Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет"
    : "—";
  const diff = formatDiff(result.diff || plan.diff);
  const readbackDiff = formatDiff(result.readback_diff);

  return `<section class="lab zone7Dp38Lab">
    <div class="zone8ProbeHead"><span><small>DP38 · ЛАБОРАТОРИЯ</small><h3>Зона 7 · длительность 17 минут</h3></span><b class="${executeAvailable ? "ready" : prepared ? "waiting" : "blocked"}">${prepared ? "Готов к записи" : status === "verified" ? "Подтверждено" : "Dry-run"}</b></div>
    <p>Тест изменяет только длительность свободной зоны 7. Этап «Подготовить» строго read-only. Запись выполняется отдельно и только один раз после повторного снимка всех восьми зон.</p>
    <div class="zone7LabSteps" aria-label="Этапы теста">
      <span class="${status !== "idle" ? "done" : "active"}"><b>1</b><em>Снимок 1–8</em></span>
      <span class="${prepared || status === "verified" || status === "mismatch" ? "active" : ""}"><b>2</b><em>Dry-run</em></span>
      <span class="${status === "verified" ? "done" : status === "mismatch" ? "error" : ""}"><b>3</b><em>Read-back 1–8</em></span>
    </div>
    <div class="maskWriteHex zone7LabHex">
      <span><small>ИСХОДНЫЙ READ · Z7</small><code>${this.esc(source)}</code></span>
      <span><small>WRITE · MASK 40</small><code>${this.esc(write)}</code></span>
      <span><small>ОЖИДАЕМЫЙ READ · Z7</small><code>${this.esc(expected)}</code></span>
      ${actual ? `<span><small>ФАКТИЧЕСКИЙ READ · Z7</small><code>${this.esc(actual)}</code></span>` : ""}
    </div>
    <div class="zone7LabDiff"><small>ПОБАЙТОВЫЙ DIFF</small><pre>${this.esc(diff)}</pre></div>
    ${result.readback_diff?.length ? `<div class="zone7LabDiff error"><small>READ-BACK MISMATCH</small><pre>${this.esc(readbackDiff)}</pre></div>` : ""}
    <div class="dp38SnapshotState ${labTone(result)}" role="status" aria-live="polite"><small>Статус</small><b>${this.esc(labStatus(result))}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span></div>
    <div class="zone7LabActions">
      <button type="button" class="zone8ProbeButton secondary" data-zone7-duration17-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7LabPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button>
      <button type="button" class="zone8ProbeButton danger" data-zone7-duration17-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7LabExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button>
    </div>
    <p class="zone8ProbeWarning"><b>Защита.</b> Зоны 1–6 и 8 должны остаться byte-for-byte неизменными. При stale baseline, активном поливе, несовпадении plan или read-back запись считается неподтверждённой и не повторяется.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0666(entities) {
  const card = this._zone7LabCard(entities);
  const content = previousDiagnosticsView.call(this, entities);
  const marker = '<section class="lab dp38MaskWriteTest">';
  if (content.includes(marker)) return content.replace(marker, `${card}${marker}`);
  const incident = '<section class="lab zone8WriteIncident">';
  if (content.includes(incident)) return content.replace(incident, `${card}${incident}`);
  return `${card}${content}`;
};

p._ensureZone7LabEvents = function ensureZone7LabEventsV0666() {
  if (this._zone7LabEventsBound) return;
  this._zone7LabEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-duration17-prepare]")) {
      this.prepareZone7Duration17();
      return;
    }
    if (event.target.closest?.("[data-zone7-duration17-execute]")) {
      this.executeZone7Duration17();
    }
  });
};

p._render = function renderV0666() {
  previousRender.call(this);
  this._ensureZone7LabEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0666() {
  return `${previousStyles.call(this)}
    /* UI v0.6.66 — one shared minutes explanation and guarded Zone 7 DP38 lab. */
    .manualApprovedIntro .manualDurationHint{margin:5px 0 0;color:var(--muted);font-size:12px!important;line-height:1.3}
    .manualDuration strong{display:grid;place-items:center;min-width:0;font-variant-numeric:tabular-nums}
    .zone7Dp38Lab{display:grid;gap:11px;border-color:color-mix(in srgb,var(--a) 28%,var(--line));background:color-mix(in srgb,var(--a) 2.5%,var(--card))}
    .zone7Dp38Lab>p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}.zone7Dp38Lab>p b{color:var(--text)}
    .zone7LabSteps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.zone7LabSteps span{display:grid;grid-template-columns:26px minmax(0,1fr);align-items:center;gap:6px;min-height:42px;padding:6px 8px;border:1px solid var(--line);border-radius:12px;background:var(--soft);color:var(--muted)}.zone7LabSteps b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--card);font-size:11px}.zone7LabSteps em{font-size:10px;font-style:normal;font-weight:750;line-height:1.15}.zone7LabSteps span.active{border-color:color-mix(in srgb,var(--a) 38%,var(--line));color:var(--a)}.zone7LabSteps span.done{border-color:color-mix(in srgb,var(--green) 35%,var(--line));color:var(--green)}.zone7LabSteps span.error{border-color:color-mix(in srgb,var(--error-color,#db4437) 35%,var(--line));color:var(--error-color,#db4437)}
    .zone7LabHex code{font-size:10px;line-height:1.35}.zone7LabDiff{display:grid;gap:4px;padding:9px 10px;border:1px solid var(--line);border-radius:13px;background:var(--soft)}.zone7LabDiff small{color:var(--muted);font-size:10px;font-weight:850}.zone7LabDiff pre{margin:0;overflow:auto;color:var(--text);font:700 10.5px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.zone7LabDiff.error{border-color:color-mix(in srgb,var(--error-color,#db4437) 35%,var(--line));background:color-mix(in srgb,var(--error-color,#db4437) 5%,var(--card))}
    .zone7LabActions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.zone7LabActions .zone8ProbeButton{min-height:58px}.zone7LabActions .secondary{background:var(--soft);color:var(--a)}.zone7LabActions .danger:not(:disabled){border-color:color-mix(in srgb,var(--error-color,#db4437) 40%,var(--line));background:color-mix(in srgb,var(--error-color,#db4437) 7%,var(--card));color:var(--error-color,#db4437)}
    @media(max-width:520px){.manualApprovedIntro .manualDurationHint{margin-top:4px}.zone7LabSteps{grid-template-columns:1fr}.zone7LabActions{grid-template-columns:1fr}.zone7LabActions .zone8ProbeButton{min-height:52px}}
  `;
};
