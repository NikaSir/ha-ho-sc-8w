import "./irrigation-panel-v0678.mjs";

const UI_VERSION = "0.6.79";
const TARGET_FIELD = "anchor_date";
const TARGET_VALUE = "2026-09-04";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0678 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;
const isOurs = (result) => result.field === TARGET_FIELD && String(result.value || "") === TARGET_VALUE;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n");
}

p.commandBusy = function commandBusyV0679() {
  return previousCommandBusy.call(this) || Boolean(this._zone7AnchorDatePrepareBusy) || Boolean(this._zone7AnchorDateExecuteBusy);
};

p.prepareZone7AnchorDate = async function prepareZone7AnchorDateV0679() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7AnchorDatePrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: TARGET_FIELD, value: TARGET_VALUE,
    });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(isOurs(result) && result.status === "prepared"
      ? "Dry-run даты 04.09.2026 подготовлен. Проверьте byte 18: 03 → 04"
      : "Dry-run даты требует проверки; запись не выполняйте");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест даты зоны 7"));
  } finally {
    this._zone7AnchorDatePrepareBusy = false;
    this.render();
  }
};

p.executeZone7AnchorDate = async function executeZone7AnchorDateV0679() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  if (!isOurs(result) || result.status !== "prepared") {
    this.notify("Сначала подготовьте актуальный dry-run Z7: дата 03.09 → 04.09.2026");
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
    "Дата начала цикла: 03.09.2026 → 04.09.2026.",
    "Ожидается только byte 18: 03 → 04 и служебный selector 07 → 40.",
    "Сохраняются: 17 мин, 06:30 / 12:45 / 23:59, интервал 2 дня, дождь выключен.",
    "При периоде 2 дня новая опорная дата сдвигает календарные дни полива.",
    "Запись разрешена только при отсутствии активного полива и очереди, в Auto/ON.",
    "Перед записью — свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7AnchorDateExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    const verified = isOurs(updated) && updated.plan_id === planId && updated.verified === true;
    this.notify(verified
      ? "Дата зоны 7 = 04.09.2026 подтверждена; соседние зоны не изменились"
      : "Тест даты не получил полного подтверждения — повторную запись не выполняйте");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест даты зоны 7 не подтверждён; запись не повторяйте"));
  } finally {
    this._zone7AnchorDateExecuteBusy = false;
    this.render();
  }
};

p._zone7AnchorDateCard = function zone7AnchorDateCardV0679(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = isOurs(result);
  const status = ours ? String(result.status || "idle") : "idle";
  const prepared = status === "prepared";
  const verified = status === "verified" && result.verified === true;
  const failed = ["blocked", "mismatch", "failed"].includes(status);
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = verified ? "Нет расхождений с ожидаемым ответом"
    : ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const reason = ours ? String(result.reason || "") : "";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  const blocks = [["ИСХОДНЫЙ READ · Z7", source], ["WRITE · MASK 40", write],
    ["ОЖИДАЕМЫЙ READ · Z7", expected], ["ФАКТИЧЕСКИЙ READ · Z7", actual]]
    .filter(([, value]) => value).map(([label, value]) => `<span><small>${label}</small><code>${this.esc(value)}</code></span>`).join("");
  return `<section class="lab zone7AnchorDateLab">
    <div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Дата 03.09 → 04.09.2026</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : failed ? "Заблокировано" : "Dry-run"}</b></div>
    <p>Проверяем только день опорной даты. Исходный Z7: <b>17 мин</b>, старты <b>06:30 / 12:45 / 23:59</b>, интервал <b>2 дня</b>, дата <b>03.09.2026</b>, дождь выключен. Ожидаем <b>byte 18: 03 → 04</b>. Год, месяц и остальные параметры сохраняются.</p>
    ${blocks ? `<div class="maskWriteHex zone7LabHex">${blocks}</div>` : ""}
    <div class="zone7LabDiff"><small>${verified ? "СВЕРКА READ-BACK" : "ПОБАЙТОВЫЙ DIFF"}</small><pre>${this.esc(diff)}</pre></div>
    <div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run подготовлен — запись ещё не выполнялась" : failed ? "Запись не подтверждена / заблокирована" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span>${reason ? `<span>${this.esc(reason)}</span>` : ""}</div>
    <div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-anchor-date-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7AnchorDatePrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-anchor-date-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7AnchorDateExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div>
    <p><b>Защита.</b> Нужны Auto/ON, отсутствие активного полива и очереди. Зоны 1–6 и 8 должны остаться побайтно неизменными. При периоде 2 дня смена опорной даты сдвигает календарные дни полива.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0679(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7AnchorDateCard(entities);
  const marker = '<section class="lab zone7Interval2Lab">';
  return content.includes(marker) ? content.replace(marker, `${card}${marker}`) : `${card}${content}`;
};

p._ensureV0679Events = function ensureV0679Events() {
  if (this._v0679EventsBound) return;
  this._v0679EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-anchor-date-prepare]")) { this.prepareZone7AnchorDate(); return; }
    if (event.target.closest?.("[data-zone7-anchor-date-execute]")) this.executeZone7AnchorDate();
  });
};

p._render = function renderV0679() {
  previousRender.call(this);
  this._ensureV0679Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
