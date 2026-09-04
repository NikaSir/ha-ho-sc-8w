import "./irrigation-panel-v0676.mjs";

const UI_VERSION = "0.6.77";
const TARGET_VALUE = "06:30,12:45,23:59";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0676 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n");
}

p.commandBusy = function commandBusyV0677() {
  return previousCommandBusy.call(this) || Boolean(this._zone7Start3PrepareBusy) || Boolean(this._zone7Start3ExecuteBusy);
};

p.prepareZone7Start3_2359 = async function prepareZone7Start3_2359V0677() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7Start3PrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", { ...this.serviceTargetData(), field: "start_time_1", value: TARGET_VALUE });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    const ok = result.status === "prepared" && result.field === "start_time_1" && String(result.value) === TARGET_VALUE;
    this.notify(ok ? "Dry-run третьего запуска 23:59 подготовлен. Проверьте byte 4 и byte 10" : "Dry-run третьего запуска требует проверки; запись не выполняйте");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест третьего запуска 23:59 зоны 7"));
  } finally {
    this._zone7Start3PrepareBusy = false;
    this.render();
  }
};

p.executeZone7Start3_2359 = async function executeZone7Start3_2359V0677() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const prepared = result.status === "prepared" && result.field === "start_time_1" && String(result.value) === TARGET_VALUE;
  if (!prepared) { this.notify("Сначала подготовьте актуальный dry-run Z7: 06:30 + 12:45 + 23:59"); return; }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) { this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена"); return; }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Текущее ожидаемое состояние: Запуск 1 = 06:30, Запуск 2 = 12:45.",
    "Цель: добавить Запуск 3 = 23:59.",
    "Ожидается: byte 4 FF → 17 и byte 10 FF → 3B.",
    "Перед записью будет свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7Start3ExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", { ...this.serviceTargetData(), plan_id: planId, confirmation });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(updated.verified === true ? "Запуск 3 зоны 7 = 23:59 подтверждён; соседние зоны не изменились" : "Тест третьего запуска не получил полного подтверждения — дальнейшие записи запрещены");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест третьего запуска 23:59 зоны 7 не подтверждён"));
  } finally {
    this._zone7Start3ExecuteBusy = false;
    this.render();
  }
};

p._zone7Start3Card = function zone7Start3CardV0677(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = result.field === "start_time_1" && String(result.value || "") === TARGET_VALUE;
  const status = ours ? String(result.status || "idle") : "idle";
  const prepared = status === "prepared";
  const verified = status === "verified";
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones) ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  return `<section class="lab zone7Start3Lab"><div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Запуск 3 → 23:59</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : "Dry-run"}</b></div><p>Проверяем третий слот и граничные значения времени. Разрешено только если свежий Z7 содержит <b>06:30</b> и <b>12:45</b>, а слоты 3–6 пусты. Ожидаем только <b>byte 4: FF → 17</b> и <b>byte 10: FF → 3B</b>.</p>${source ? `<div class="maskWriteHex zone7LabHex"><span><small>ИСХОДНЫЙ READ · Z7</small><code>${this.esc(source)}</code></span><span><small>WRITE · MASK 40</small><code>${this.esc(write)}</code></span><span><small>ОЖИДАЕМЫЙ READ · Z7</small><code>${this.esc(expected)}</code></span>${actual ? `<span><small>ФАКТИЧЕСКИЙ READ · Z7</small><code>${this.esc(actual)}</code></span>` : ""}</div>` : ""}<div class="zone7LabDiff"><small>ПОБАЙТОВЫЙ DIFF</small><pre>${this.esc(diff)}</pre></div><div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run подготовлен — запись ещё не выполнялась" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span></div><div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-start3-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7Start3PrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-start3-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7Start3ExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div></section>`;
};

p.diagnosticsView = function diagnosticsViewV0677(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7Start3Card(entities);
  const marker = '<section class="lab zone7Start2Lab">';
  if (content.includes(marker)) return content.replace(marker, `${card}${marker}`);
  return `${card}${content}`;
};

p._ensureV0677Events = function ensureV0677Events() {
  if (this._v0677EventsBound) return;
  this._v0677EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-start3-prepare]")) { this.prepareZone7Start3_2359(); return; }
    if (event.target.closest?.("[data-zone7-start3-execute]")) this.executeZone7Start3_2359();
  });
};

p._render = function renderV0677() {
  previousRender.call(this);
  this._ensureV0677Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
