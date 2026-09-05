import "./irrigation-panel-v0679.mjs";

const UI_VERSION = "0.6.80";
const TARGET_FIELD = "cycle_mode";
const TARGET_VALUE = "weekly";
const EXPECTED_SOURCE = "0711060C17FFFFFF1E2D3BFFFFFF03021A090410";
const EXPECTED_WRITE = "4011060C17FFFFFF1E2D3BFFFFFF00021A090410";
const EXPECTED_READ = "0711060C17FFFFFF1E2D3BFFFFFF00021A090410";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0679 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

const isOurs = (result) => result.field === TARGET_FIELD && String(result.value || "") === TARGET_VALUE;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n");
}

function exactPrepared(result, plan) {
  if (!isOurs(result) || result.status !== "prepared") return false;
  const source = String(result.source_read_hex || plan.source_read_hex || "").toUpperCase();
  const write = String(result.write_hex || plan.write_hex || "").toUpperCase();
  const expected = String(result.expected_read_hex || plan.expected_read_hex || "").toUpperCase();
  const diff = result.diff || plan.diff || [];
  return source === EXPECTED_SOURCE && write === EXPECTED_WRITE && expected === EXPECTED_READ
    && Array.isArray(diff) && diff.length === 2
    && Number(diff[0]?.offset) === 0 && String(diff[0]?.before) === "07" && String(diff[0]?.after) === "40"
    && Number(diff[1]?.offset) === 14 && String(diff[1]?.before) === "03" && String(diff[1]?.after) === "00";
}

function exactVerified(result) {
  return isOurs(result) && result.status === "verified" && result.verified === true
    && String(result.expected_read_hex || "").toUpperCase() === EXPECTED_READ
    && String(result.actual_read_hex || "").toUpperCase() === EXPECTED_READ
    && Array.isArray(result.collateral_changed_zones)
    && result.collateral_changed_zones.length === 0;
}

p.commandBusy = function commandBusyV0680() {
  return previousCommandBusy.call(this) || Boolean(this._zone7WeeklyPrepareBusy) || Boolean(this._zone7WeeklyExecuteBusy);
};

p.prepareZone7Weekly = async function prepareZone7WeeklyV0680() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7WeeklyPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: TARGET_FIELD, value: TARGET_VALUE,
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[7].schedule);
    const result = attrs.zone7_lab_result || {};
    const plan = attrs.zone7_lab_plan || {};
    this.notify(exactPrepared(result, plan)
      ? "Dry-run Weekly подготовлен. Проверьте: только byte 14: 03 → 00"
      : "Dry-run Weekly не совпал с фиксированным планом — запись запрещена");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест Interval → Weekly зоны 7"));
  } finally {
    this._zone7WeeklyPrepareBusy = false;
    this.render();
  }
};

p.executeZone7Weekly = async function executeZone7WeeklyV0680() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  if (!exactPrepared(result, plan)) {
    this.notify("Фиксированный dry-run Interval → Weekly не подтверждён — запись запрещена");
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
    "Режим: Интервал (03) → Недельный (00).",
    "byte 15 остаётся 02. По APK-карте в Weekly это маска только понедельника.",
    "Ожидается единственное информационное изменение: byte 14 03 → 00.",
    "Сохраняются: 17 мин, 06:30 / 12:45 / 23:59, byte 15=02, дата 04.09.2026, дождь выключен.",
    "Этот опыт подтверждает код режима 00. Семантику битов дней недели проверим отдельным следующим тестом.",
    "Запись разрешена только при Auto/ON и отсутствии активного полива/очереди.",
    "Перед записью — свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7WeeklyExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(exactVerified(updated)
      ? "Weekly mode зоны 7 подтверждён: byte 14 = 00; соседние зоны не изменились"
      : "Weekly-тест не получил точного подтверждения — повторную запись не выполняйте");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Weekly-тест зоны 7 не подтверждён; запись не повторяйте"));
  } finally {
    this._zone7WeeklyExecuteBusy = false;
    this.render();
  }
};

p._zone7WeeklyCard = function zone7WeeklyCardV0680(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = isOurs(result);
  const prepared = exactPrepared(result, plan);
  const verified = exactVerified(result);
  const failed = ours && ["blocked", "mismatch", "failed"].includes(String(result.status || ""));
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
  return `<section class="lab zone7WeeklyLab">
    <div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Интервал → По дням недели</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : failed ? "Заблокировано" : "Dry-run"}</b></div>
    <p>Изолируем <b>byte 14</b>. Текущий Z7 должен быть: 17 мин, <b>06:30 / 12:45 / 23:59</b>, interval <b>2 дня</b>, дата <b>04.09.2026</b>, дождь выключен. Цель — weekly mode <b>00</b>. <b>byte 15 остаётся 02</b>; по APK-гипотезе это понедельник. Ожидаем только <b>byte 14: 03 → 00</b>.</p>
    ${blocks ? `<div class="maskWriteHex zone7LabHex">${blocks}</div>` : ""}
    <div class="zone7LabDiff"><small>${verified ? "СВЕРКА READ-BACK" : "ПОБАЙТОВЫЙ DIFF"}</small><pre>${this.esc(diff)}</pre></div>
    <div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run совпал с фиксированным планом" : failed ? "Запись не подтверждена / заблокирована" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span>${reason ? `<span>${this.esc(reason)}</span>` : ""}</div>
    <div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-weekly-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7WeeklyPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-weekly-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7WeeklyExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div>
    <p><b>Важно.</b> Этот тест подтверждает сохранение режима <b>00</b> контроллером. Битовое соответствие дней недели будет физически проверено следующим отдельным изменением byte 15.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0680(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7WeeklyCard(entities);
  const marker = '<section class="lab zone7AnchorDateLab">';
  return content.includes(marker) ? content.replace(marker, `${card}${marker}`) : `${card}${content}`;
};

p._ensureV0680Events = function ensureV0680Events() {
  if (this._v0680EventsBound) return;
  this._v0680EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-weekly-prepare]")) { this.prepareZone7Weekly(); return; }
    if (event.target.closest?.("[data-zone7-weekly-execute]")) this.executeZone7Weekly();
  });
};

p._render = function renderV0680() {
  previousRender.call(this);
  this._ensureV0680Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
