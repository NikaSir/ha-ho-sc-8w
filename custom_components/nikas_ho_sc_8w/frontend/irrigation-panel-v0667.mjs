import "./irrigation-panel-v0666.mjs";

const UI_VERSION = "0.6.67";
const SNAPSHOT_CONFIRMATION = "DP38_FULL_SNAPSHOT_READ_ONLY";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousSwitchView = p._switchView;
const previousProgramView = p.programView;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;
const previousStyles = p.styles;

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

p.commandBusy = function commandBusyV0667() {
  return previousCommandBusy.call(this)
    || Boolean(this._programDp38RefreshBusy)
    || Boolean(this._zone7RainPrepareBusy)
    || Boolean(this._zone7RainExecuteBusy);
};

p.refreshProgramDp38 = async function refreshProgramDp38V0667() {
  if (this._programDp38RefreshBusy) return;
  if (this.rejectUnavailableCommand("capture_dp38_snapshot")) {
    this._programDp38RefreshStatus = "unavailable";
    this.render();
    return;
  }
  this._programDp38RefreshBusy = true;
  this._programDp38RefreshStatus = "reading";
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "capture_dp38_snapshot", {
      ...this.serviceTargetData(),
      phase: "baseline",
      confirmation: SNAPSHOT_CONFIRMATION,
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[7].schedule);
    const snapshot = attrs.dp38_snapshot_baseline || {};
    const complete = Object.keys(snapshot).length === 8;
    this._programDp38RefreshStatus = complete ? "fresh" : "incomplete";
    this._programDp38RefreshAt = Date.now();
    if (!complete) this.notify("DP38: получен неполный снимок программ");
  } catch (error) {
    this._programDp38RefreshStatus = "error";
    this.notify(this.serviceError(error, "Не удалось обновить программы 1–8"));
  } finally {
    this._programDp38RefreshBusy = false;
    this.render();
  }
};

p._switchView = function switchViewV0667(view) {
  previousSwitchView.call(this, view);
  if (view === "program") queueMicrotask(() => this.refreshProgramDp38());
};

p.programView = function programViewV0667(entities) {
  const content = previousProgramView.call(this, entities);
  const status = String(this._programDp38RefreshStatus || "idle");
  const labels = {
    idle: "Ожидание обновления",
    reading: "Читаю программы 1–8 с контроллера…",
    fresh: "Программы 1–8 получены с контроллера",
    incomplete: "Получен неполный снимок — редактирование DP38 запрещено",
    unavailable: "Native DP38 refresh недоступен",
    error: "Не удалось получить свежие программы — редактирование DP38 запрещено",
  };
  const tone = status === "fresh" ? "ok" : status === "reading" || status === "idle" ? "waiting" : "error";
  const banner = `<section class="programFreshness ${tone}" role="status" aria-live="polite"><ha-icon icon="${status === "fresh" ? "mdi:database-check-outline" : status === "reading" ? "mdi:database-sync-outline" : "mdi:database-alert-outline"}"></ha-icon><span><small>DP38 · АКТУАЛЬНОСТЬ</small><b>${this.esc(labels[status] || status)}</b><em>При подготовке любой записи выполняется отдельный повторный preflight 1–8.</em></span></section>`;
  return `${banner}${content}`;
};

p.prepareZone7RainFalse = async function prepareZone7RainFalseV0667() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7RainPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: "rain_sensor_follow", value: "false",
    });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    if (result.status === "prepared" && result.field === "rain_sensor_follow" && String(result.value) === "false") {
      this.notify("Dry-run дождя зоны 7 подготовлен. Проверьте byte 19 перед записью");
    } else {
      this.notify("Dry-run дождя требует проверки; запись не выполняйте");
    }
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест Rain Sensor зоны 7"));
  } finally {
    this._zone7RainPrepareBusy = false;
    this.render();
  }
};

p.executeZone7RainFalse = async function executeZone7RainFalseV0667() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const prepared = result.status === "prepared" && String(result.field || "") === "rain_sensor_follow" && String(result.value || "") === "false";
  if (!prepared) {
    this.notify("Сначала подготовьте актуальный dry-run Rain Sensor зоны 7");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "", "Цель: Rain Sensor Follow = Нет.",
    "Ожидается изменение только low nibble byte 19: 11 → 10.",
    "Перед dispatch будет повторный полный preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "", "Повтора и автоматического rollback не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7RainExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    if (updated.verified === true) this.notify("Rain Sensor зоны 7 подтверждён; соседние зоны не изменились");
    else this.notify("Rain Sensor test не получил полного подтверждения — дальнейшие записи запрещены");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Rain Sensor test зоны 7 не подтверждён"));
  } finally {
    this._zone7RainExecuteBusy = false;
    this.render();
  }
};

p._zone7RainCard = function zone7RainCardV0667(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const status = String(result.status || "idle");
  const ours = String(result.field || "") === "rain_sensor_follow" && String(result.value || "") === "false";
  const prepared = ours && status === "prepared";
  const verified = ours && status === "verified";
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones) ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  return `<section class="lab zone7RainLab"><div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · дождь Да → Нет</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : "Dry-run"}</b></div><p>После подтверждённой длительности проверяем только флаг Rain Sensor. Ожидаем единственное информационное изменение в byte 19: <b>11 → 10</b>.</p>${source ? `<div class="maskWriteHex zone7LabHex"><span><small>ИСХОДНЫЙ READ · Z7</small><code>${this.esc(source)}</code></span><span><small>WRITE · MASK 40</small><code>${this.esc(write)}</code></span><span><small>ОЖИДАЕМЫЙ READ · Z7</small><code>${this.esc(expected)}</code></span>${actual ? `<span><small>ФАКТИЧЕСКИЙ READ · Z7</small><code>${this.esc(actual)}</code></span>` : ""}</div>` : ""}<div class="zone7LabDiff"><small>ПОБАЙТОВЫЙ DIFF</small><pre>${this.esc(diff)}</pre></div><div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run подготовлен — запись ещё не выполнялась" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span></div><div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-rain-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7RainPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-rain-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7RainExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div></section>`;
};

p.diagnosticsView = function diagnosticsViewV0667(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7RainCard(entities);
  const marker = '<section class="lab dp38MaskWriteTest">';
  if (content.includes(marker)) return content.replace(marker, `${card}${marker}`);
  return `${content}${card}`;
};

p._ensureV0667Events = function ensureV0667Events() {
  if (this._v0667EventsBound) return;
  this._v0667EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-rain-prepare]")) { this.prepareZone7RainFalse(); return; }
    if (event.target.closest?.("[data-zone7-rain-execute]")) this.executeZone7RainFalse();
  });
};

p._render = function renderV0667() {
  previousRender.call(this);
  this._ensureV0667Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0667() {
  return `${previousStyles.call(this)}
    .programFreshness{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:9px;margin:0 0 10px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}
    .programFreshness ha-icon{color:var(--muted)}.programFreshness span{display:grid;gap:1px}.programFreshness small{font-size:9px;font-weight:850;color:var(--muted)}.programFreshness b{font-size:12px}.programFreshness em{font-size:10px;font-style:normal;color:var(--muted);line-height:1.3}
    .programFreshness.ok{border-color:color-mix(in srgb,var(--green) 35%,var(--line));background:color-mix(in srgb,var(--green) 7%,var(--card))}.programFreshness.ok ha-icon,.programFreshness.ok b{color:var(--green)}
    .programFreshness.waiting{border-color:color-mix(in srgb,var(--a) 30%,var(--line))}.programFreshness.waiting ha-icon{color:var(--a)}
    .programFreshness.error{border-color:color-mix(in srgb,var(--error-color,#db4437) 35%,var(--line));background:color-mix(in srgb,var(--error-color,#db4437) 6%,var(--card))}.programFreshness.error ha-icon,.programFreshness.error b{color:var(--error-color,#db4437)}
    .zone7RainLab{display:grid;gap:11px;border-color:color-mix(in srgb,var(--green) 25%,var(--line))}.zone7RainLab>p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}.zone7RainLab>p b{color:var(--text)}
  `;
};
