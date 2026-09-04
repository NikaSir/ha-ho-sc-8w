import "./irrigation-panel-v0674.mjs";

const UI_VERSION = "0.6.75";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0674 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n");
}

p.commandBusy = function commandBusyV0675() {
  return previousCommandBusy.call(this)
    || Boolean(this._zone7StartPrepareBusy)
    || Boolean(this._zone7StartExecuteBusy);
};

p.prepareZone7Start0630 = async function prepareZone7Start0630V0675() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7StartPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: "start_time_1", value: "06:30",
    });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    const ok = result.status === "prepared"
      && result.field === "start_time_1"
      && String(result.value) === "06:30";
    this.notify(ok
      ? "Dry-run запуска 06:30 подготовлен. Проверьте byte 2 и byte 8"
      : "Dry-run запуска требует проверки; запись не выполняйте");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест запуска 06:30 зоны 7"));
  } finally {
    this._zone7StartPrepareBusy = false;
    this.render();
  }
};

p.executeZone7Start0630 = async function executeZone7Start0630V0675() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const prepared = result.status === "prepared"
    && result.field === "start_time_1"
    && String(result.value) === "06:30";
  if (!prepared) {
    this.notify("Сначала подготовьте актуальный dry-run Z7 Запуск 1 = 06:30");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Цель: Запуск 1 = 06:30.",
    "Ожидается: byte 2 FF → 06 и byte 8 FF → 1E.",
    "Перед записью будет свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7StartExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(updated.verified === true
      ? "Запуск 1 зоны 7 = 06:30 подтверждён; соседние зоны не изменились"
      : "Тест запуска не получил полного подтверждения — дальнейшие записи запрещены");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест запуска 06:30 зоны 7 не подтверждён"));
  } finally {
    this._zone7StartExecuteBusy = false;
    this.render();
  }
};

p._zone7Start0630Card = function zone7Start0630CardV0675(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = result.field === "start_time_1" && String(result.value || "") === "06:30";
  const status = ours ? String(result.status || "idle") : "idle";
  const prepared = status === "prepared";
  const verified = status === "verified";
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  return `<section class="lab zone7StartLab"><div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Запуск 1 → 06:30</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : "Dry-run"}</b></div><p>Первый тест банка времени. Разрешён только при шести пустых слотах Z7. Ожидаем <b>byte 2: FF → 06</b> и <b>byte 8: FF → 1E</b>; остальные информационные байты должны сохраниться.</p>${source ? `<div class="maskWriteHex zone7LabHex"><span><small>ИСХОДНЫЙ READ · Z7</small><code>${this.esc(source)}</code></span><span><small>WRITE · MASK 40</small><code>${this.esc(write)}</code></span><span><small>ОЖИДАЕМЫЙ READ · Z7</small><code>${this.esc(expected)}</code></span>${actual ? `<span><small>ФАКТИЧЕСКИЙ READ · Z7</small><code>${this.esc(actual)}</code></span>` : ""}</div>` : ""}<div class="zone7LabDiff"><small>ПОБАЙТОВЫЙ DIFF</small><pre>${this.esc(diff)}</pre></div><div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run подготовлен — запись ещё не выполнялась" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span></div><div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-start-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7StartPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-start-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7StartExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div></section>`;
};

p.diagnosticsView = function diagnosticsViewV0675(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7Start0630Card(entities);
  const marker = '<section class="lab zone7RainLab">';
  if (content.includes(marker)) return content.replace(marker, `${card}${marker}`);
  return `${card}${content}`;
};

p._ensureV0675Events = function ensureV0675Events() {
  if (this._v0675EventsBound) return;
  this._v0675EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-start-prepare]")) { this.prepareZone7Start0630(); return; }
    if (event.target.closest?.("[data-zone7-start-execute]")) this.executeZone7Start0630();
  });
};

p._render = function renderV0675() {
  previousRender.call(this);
  this._ensureV0675Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
