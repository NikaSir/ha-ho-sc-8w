import "./irrigation-panel-v0705.mjs";

const UI_VERSION = "0.7.06";
const PREPARE = "prepare_zone7_parity";
const EXECUTE = "execute_zone7_parity";
const CONFIRMATION = "WRITE_ZONE7_PARITY_ONCE";
const MODE_LABEL = Object.freeze({ odd: "Нечётные дни", even: "Чётные дни" });
const STATUS_LABEL = Object.freeze({
  idle: "Выберите режим и подготовьте проверку",
  preparing: "Читаю все восемь зон…",
  prepared: "План подготовлен · запись ещё не выполнялась",
  noop: "Такое состояние уже на приборе · запись не нужна",
  preflight: "Проверяю, что исходные данные не изменились…",
  writing: "Отправляю одну команду…",
  reading: "Сверяю все восемь зон…",
  verified: "Запись подтверждена · остальные зоны без изменений",
  stale: "Состояние изменилось · подготовьте новый план",
  expired: "Срок плана истёк · подготовьте новый план",
  rejected: "Проверка условий не пройдена",
  mismatch: "Ответ отличается от ожидаемого · тест остановлен",
  uncertain: "Результат записи не подтверждён · тест остановлен",
});
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0705 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;
const previousStyles = p.styles;

function blockSummary(hex) {
  if (!/^[0-9a-f]{40}$/i.test(String(hex || ""))) return "Нет полного блока";
  const bytes = hex.match(/../g).map((v) => parseInt(v, 16));
  const pad = (n) => String(n).padStart(2, "0");
  const slots = Array.from({ length: 6 }, (_, i) => bytes[i + 2] === 255 && bytes[i + 8] === 255
    ? "--:--" : `${pad(bytes[i + 2])}:${pad(bytes[i + 8])}`);
  const repeat = ["По дням недели", "Нечётные дни", "Чётные дни", `Каждые ${bytes[15]} дн.`][bytes[14]] || "Неизвестный режим";
  return `${bytes[1]} мин · ${repeat} · программа ${bytes[19] >> 4 ? "включена" : "выключена"} · дождь ${bytes[19] & 15 ? "учитывается" : "не учитывается"} · ${slots.join(" / ")}`;
}

p._zone7ParityState = function zone7ParityState() {
  return this.attrs(this.entities().zones[7]?.schedule).zone7_parity_probe || {};
};

p._zone7ParityWriteReady = function zone7ParityWriteReady(result) {
  return result.status === "prepared" && !result.locked
    && result.mode === (this._zone7ParityMode || "odd")
    && Boolean(result.plan_id) && result.confirmation === CONFIRMATION
    && Date.parse(result.expires_at) > Date.now()
    && !this._zone7ParityConsumedIds?.has(result.plan_id);
};

p.commandBusy = function commandBusyV0706() {
  return previousCommandBusy.call(this) || Boolean(this._zone7ParityBusy);
};

p.prepareZone7Parity = async function prepareZone7ParityV0706() {
  if (this.rejectUnavailableCommand(PREPARE) || this._zone7ParityState().locked) return;
  const mode = this._zone7ParityMode || "odd";
  if (!MODE_LABEL[mode]) return;
  this._zone7ParityBusy = "prepare";
  this._zone7ParityError = "";
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", PREPARE, { ...this.serviceTargetData(), mode });
    // The service publishes its result through the coordinator. Do not start
    // another controller refresh or silently dispatch a write from preparation.
  } catch (error) {
    this._zone7ParityError = this.serviceError(error, "Не удалось подготовить проверку зоны 7");
    this.notify(this._zone7ParityError);
  } finally {
    this._zone7ParityBusy = "";
    this.render();
  }
};

p.executeZone7Parity = async function executeZone7ParityV0706() {
  if (this.rejectUnavailableCommand(EXECUTE)) return;
  const result = this._zone7ParityState();
  if (!this._zone7ParityWriteReady(result)) {
    this.notify("Подготовьте новый план выбранного режима");
    return;
  }
  if (!window.confirm([
    `Записать «${MODE_LABEL[result.mode]}» в зону 7 один раз?`,
    "Длительность, все шесть времён, включение программы и правило дождя сохраняются.",
    "Параметры интервала и его даты обнуляются согласно формату штатного приложения.",
    "Перед записью и после неё автоматически проверяются все восемь зон.",
    "Повтора и автоматического отката не будет.",
    "", `Пакет: ${result.write_hex}`,
  ].join("\n"))) return;
  // The user can keep the confirmation dialog open beyond the plan lifetime.
  if (!this._zone7ParityWriteReady(result)) {
    this.notify("Срок плана истёк · подготовьте новый план");
    return;
  }
  this._zone7ParityConsumedIds ||= new Set();
  this._zone7ParityConsumedIds.add(result.plan_id);
  this._zone7ParityBusy = "execute";
  this._zone7ParityError = "";
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", EXECUTE, {
      ...this.serviceTargetData(), plan_id: result.plan_id, confirmation: CONFIRMATION,
    });
  } catch (error) {
    this._zone7ParityError = this.serviceError(error, "Результат записи не подтверждён");
    this.notify(this._zone7ParityError);
  } finally {
    this._zone7ParityBusy = "";
    this.render();
  }
};

p.downloadZone7ParityReport = function downloadZone7ParityReport() {
  const result = this._zone7ParityState();
  if (!result.before_snapshot?.length) return;
  const report = { schema: "nikas.zone7-parity.v1", ui_version: UI_VERSION, exported_at: new Date().toISOString(), result };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "ho-sc-8w-zone7-parity-report.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

p._zone7ParityCard = function zone7ParityCardV0706() {
  const result = this._zone7ParityState();
  const status = result.status || "idle";
  const mode = this._zone7ParityMode || "odd";
  const prepared = this._zone7ParityWriteReady(result);
  const verified = status === "verified" && result.verified === true;
  const prepareAllowed = this.commandAvailable(PREPARE) && !result.locked;
  const executeAllowed = this.commandAvailable(EXECUTE) && prepared;
  const diff = (result.expected_diff || []).map((item) => `Байт ${item.offset}: ${item.before} → ${item.after}`).join("\n");
  const hexRows = [["Исходный ответ", result.source_read_hex], ["Пакет записи · маска 40", result.write_hex],
    ["Ожидаемый ответ", result.expected_read_hex], ["Фактический ответ", result.actual_read_hex]]
    .filter(([, value]) => value).map(([label, value]) => `<div><small>${label}</small><code>${this.esc(value)}</code></div>`).join("");
  const snapshotRows = (rows) => (rows || []).map((row) => `<li><b>Зона ${Number(row.zone)}</b><code>${this.esc(row.raw_hex || "")}</code></li>`).join("");
  const changes = (result.changes || []).map((change) => `<li><b>Зона ${Number(change.zone)}</b><code>${this.esc(change.before_hex)}</code><span>↓</span><code>${this.esc(change.after_hex)}</code><span>Байты: ${this.esc((change.offsets || []).join(", "))}</span></li>`).join("");
  const history = (result.history || []).map((entry) => `<li><b>${this.esc(MODE_LABEL[entry.mode] || entry.mode)}</b><span>${this.esc(STATUS_LABEL[entry.status] || entry.status)}</span><code>${this.esc(entry.actual_read_hex || "")}</code></li>`).join("");
  const tone = verified ? "ok" : result.locked || status === "rejected" ? "error" : "";
  const label = status === "prepared" && !prepared && result.mode === mode ? "Срок плана истёк или запись уже запрошена" : STATUS_LABEL[status] || status;
  return `<section class="lab zone7ParityLab">
    <div class="zone8ProbeHead"><span><small>DP38 · ПРОВЕРКА ЗОНЫ 7</small><h3>Нечётные / чётные дни</h3></span><b class="${verified ? "ready" : "blocked"}">${verified ? "Ответ подтверждён" : "Испытание"}</b></div>
    <p>Проверяем каждый режим отдельно. Контроллер — ON/Auto, полив и очередь остановлены. Длительность зоны 7 — больше 0 минут.</p>
    <label class="parityModeLabel">Режим проверки<select data-zone7-parity-mode ${this._zone7ParityBusy || result.locked ? "disabled" : ""}>
      ${Object.entries(MODE_LABEL).map(([value, title]) => `<option value="${value}" ${value === mode ? "selected" : ""}>${title}</option>`).join("")}
    </select></label>
    <div class="dp38SnapshotState ${tone}" role="status" aria-live="polite"><small>${this.esc(MODE_LABEL[result.mode] || "Результат")}</small><b>${this.esc(label)}</b>${result.detail ? `<span>${this.esc(result.detail)}</span>` : ""}</div>
    ${this._zone7ParityError ? `<p class="parityError" role="alert">${this.esc(this._zone7ParityError)}</p>` : ""}
    ${result.source_read_hex ? `<div class="parityFacts"><small>Исходная программа зоны 7</small><span>${this.esc(blockSummary(result.source_read_hex))}</span>${result.actual_read_hex ? `<small>После записи</small><span>${this.esc(blockSummary(result.actual_read_hex))}</span>` : ""}</div>` : ""}
    ${hexRows ? `<details class="parityEvidence"><summary>Пакет и изменения по байтам</summary><div class="parityHex">${hexRows}</div><pre>${this.esc(diff || "Информационные байты уже совпадают")}</pre><p>Первый байт ответа 07 — зона 7; первый байт команды 40 — её маска. В режиме нечётных/чётных дней параметры интервала и его даты равны нулю.</p></details>` : ""}
    ${changes ? `<details class="parityEvidence"><summary>Изменились зоны: ${this.esc((result.changed_zones || []).join(", "))}</summary><ul>${changes}</ul></details>` : ""}
    ${result.before_snapshot?.length ? `<details class="parityEvidence"><summary>Снимки всех зон · до ${result.before_snapshot.length}/8 · после ${result.after_snapshot?.length || 0}/8</summary><b>До записи</b><ul>${snapshotRows(result.before_snapshot)}</ul><b>После записи</b><ul>${snapshotRows(result.after_snapshot)}</ul></details>` : ""}
    ${history ? `<details class="parityEvidence"><summary>Предыдущие проверки</summary><ul>${history}</ul></details>` : ""}
    <div class="zone7LabActions">
      <button type="button" class="zone8ProbeButton secondary" data-zone7-parity-prepare ${prepareAllowed ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7ParityBusy === "prepare" ? "Читаю 1–8…" : "1. Подготовить план"}</button>
      <button type="button" class="zone8ProbeButton" data-zone7-parity-execute ${executeAllowed ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7ParityBusy === "execute" ? "Запись и проверка…" : "2. Записать один раз"}</button>
      ${result.before_snapshot?.length ? '<button type="button" class="zone8ProbeButton secondary" data-zone7-parity-report><ha-icon icon="mdi:download-outline"></ha-icon>Скачать протокол проверки</button>' : ""}
    </div>
    <p>План действует 2 минуты. Чтение всех зон выполняется автоматически. После подтверждённой записи проверьте режим зоны 7 на экране прибора, затем отдельно проверьте второй режим.</p>
    ${result.locked ? '<p class="parityError">Дальнейшие записи этого теста остановлены. Сохраните протокол для разбора результата.</p>' : ""}
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0706(entities) {
  return `${this._zone7ParityCard()}${previousDiagnosticsView.call(this, entities)}`;
};

p._render = function renderV0706() {
  previousRender.call(this);
  if (this.shadowRoot && !this._zone7ParityEventsBound) {
    this._zone7ParityEventsBound = true;
    this.shadowRoot.addEventListener("change", (event) => {
      if (!event.target.matches?.("[data-zone7-parity-mode]")) return;
      if (MODE_LABEL[event.target.value]) this._zone7ParityMode = event.target.value;
      this._zone7ParityError = "";
      this.render();
    });
    this.shadowRoot.addEventListener("click", (event) => {
      if (event.target.closest?.("[data-zone7-parity-prepare]")) this.prepareZone7Parity();
      else if (event.target.closest?.("[data-zone7-parity-execute]")) this.executeZone7Parity();
      else if (event.target.closest?.("[data-zone7-parity-report]")) this.downloadZone7ParityReport();
    });
  }
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0706() {
  return `${previousStyles.call(this)}
    .zone7ParityLab{min-width:0}.zone7ParityLab .zone8ProbeHead{flex-wrap:wrap}
    .parityModeLabel{display:grid;gap:8px;font-size:14px;font-weight:700}
    .parityModeLabel select{box-sizing:border-box;width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--card);color:var(--text);font:inherit;font-size:16px}
    .parityFacts,.parityHex{display:grid;gap:8px;min-width:0}.parityFacts{padding:12px;background:var(--soft);border-radius:14px}.parityFacts small,.parityHex small{display:block;color:var(--muted);font-size:12px}
    .parityEvidence{min-width:0;border:1px solid var(--line);border-radius:14px;padding:12px}.parityEvidence summary{cursor:pointer;font-size:14px;font-weight:700;line-height:1.4}.parityEvidence[open] summary{margin-bottom:12px}
    .parityEvidence code{display:block;font-size:12px;overflow-wrap:anywhere;word-break:break-all}.parityEvidence pre{white-space:pre-wrap;font-size:12px}.parityEvidence ul{list-style:none;padding:0;margin:8px 0;display:grid;gap:10px}.parityEvidence li{display:grid;gap:4px;min-width:0}
    .zone7ParityLab .parityError{color:var(--danger)!important}.zone7ParityLab button{min-height:44px;white-space:normal}
  `;
};
