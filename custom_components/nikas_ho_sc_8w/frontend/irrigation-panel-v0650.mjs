import "./irrigation-panel-v0649.mjs";

const UI_VERSION = "0.6.50";
const CONFIRMATION = "WRITE_ZONE8_ANCHOR_DATE_2026_09_02_ONCE";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousCommandBusy = p.commandBusy;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;
const previousZone8LabCurrent = p._zone8LabCurrent;

p.commandBusy = function commandBusyV0650() {
  return previousCommandBusy.call(this) || Boolean(this._zone8AnchorDateTestBusy);
};

p._zone8AnchorDateTestStatusText = function zone8AnchorDateTestStatusText(status) {
  return {
    idle: "Запись ещё не выполнялась",
    reading_before: "Проверяю точный исходный блок",
    writing_once: "Отправлена единственная запись",
    reading_after: "Проверяю новую дату чтением",
    confirmed: "Дата 02.09.2026 записана и прочитана",
    readback_mismatch: "Ответ не совпал — повтора и отката не было",
    blocked: "Тест остановлен защитой",
  }[status] || String(status || "Нет данных");
};

p._zone8LatestDecoded = function zone8LatestDecoded(attrs) {
  const samples = Array.isArray(attrs.hex_probe_samples) ? attrs.hex_probe_samples : [];
  const sample = samples
    .filter((item) => Number(item.station) === 8
      && Number(item.length) === 20
      && Number(item.count) >= 2
      && item.fresh !== false
      && item.valid !== false)
    .sort((left, right) => Number(right.count || 0) - Number(left.count || 0))[0];
  const rawHex = String(sample?.raw_hex || "").toUpperCase();
  if (!/^[0-9A-F]{40}$/.test(rawHex)) return null;
  const bytes = Array.from({ length: 20 }, (_, index) =>
    Number.parseInt(rawHex.slice(index * 2, index * 2 + 2), 16));
  const starts = Array.from({ length: 6 }, (_, slot) => {
    const hour = bytes[2 + slot];
    const minute = bytes[8 + slot];
    if (hour === 0xFF && minute === 0xFF) return "";
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  });
  const mode = ["weekly", "odd", "even", "interval"][bytes[14] & 0x03] || "unknown";
  const anchorDate = bytes[16] && bytes[17] && bytes[18]
    ? `${2000 + bytes[16]}-${String(bytes[17]).padStart(2, "0")}-${String(bytes[18]).padStart(2, "0")}`
    : "";
  return {
    rawHex,
    duration: bytes[1],
    starts,
    mode,
    cycleValue: bytes[15],
    anchorDate,
    rain: (bytes[19] & 0x01) === 0x01 ? "true" : "false",
  };
};

p._zone8LabCurrent = function zone8LabCurrentV0650(field, attrs) {
  const decoded = this._zone8LatestDecoded(attrs);
  if (!decoded) return previousZone8LabCurrent.call(this, field, attrs);
  if (field.startsWith("start_time_")) {
    const slot = Number(field.slice(-1)) - 1;
    return decoded.starts[slot] || "";
  }
  if (field === "duration_minutes") return decoded.duration;
  if (field === "cycle_mode") return decoded.mode;
  if (field === "cycle_value") return decoded.cycleValue;
  if (field === "anchor_date") return decoded.anchorDate;
  if (field === "rain_sensor_follow") return decoded.rain;
  return previousZone8LabCurrent.call(this, field, attrs);
};

p._zone8LabValue = function zone8LabValueV0650(field, attrs) {
  return this._zone8LabCurrent(field, attrs);
};

p.runZone8AnchorDateWrite = async function runZone8AnchorDateWrite() {
  if (this.rejectUnavailableCommand("test_zone8_anchor_date_write")) return;
  const attrs = this.attrs(this.entities().zones[8].schedule);
  const before = attrs.anchor_date_test_expected_from_hex || "";
  const after = attrs.anchor_date_test_expected_to_hex || "";
  const warning = [
    "Изменить только опорную дату зоны 8?",
    "",
    "03.09.2026 → 02.09.2026",
    `ДО: ${before}`,
    `ПОСЛЕ: ${after}`,
    "",
    "Будет отправлена ровно одна запись DP38. Длительность останется 0 минут, запусков нет. Контроллер должен быть в OFF.",
    "При несовпадении ответа повторной записи и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(warning)) return;
  this._zone8AnchorDateTestBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "test_zone8_anchor_date_write", {
      ...this.serviceTargetData(), confirmation: CONFIRMATION,
    });
    await this.refreshNow();
    this.notify("Зона 8: дата 02.09.2026 подтверждена чтением");
  } catch (error) {
    this.notify(this.serviceError(error, "Тест записи даты зоны 8 остановлен"));
  } finally {
    this._zone8AnchorDateTestBusy = false;
    this.render();
  }
};

p.diagnosticsView = function diagnosticsViewV0650(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const decoded = this._zone8LatestDecoded(attrs);
  const status = attrs.anchor_date_test_status || "idle";
  const expected = String(attrs.anchor_date_test_expected_from_hex || "").toUpperCase();
  const samples = Array.isArray(attrs.hex_probe_samples) ? attrs.hex_probe_samples : [];
  const stableZone8 = samples.some((sample) =>
    Number(sample.station) === 8
    && Number(sample.length) === 20
    && Number(sample.count) >= 2
    && sample.fresh !== false
    && sample.valid !== false);
  const exactCurrent = samples.some((sample) =>
    Number(sample.station) === 8
    && Number(sample.length) === 20
    && Number(sample.count) >= 2
    && sample.fresh !== false
    && sample.valid !== false
    && String(sample.raw_hex || "").toUpperCase() === expected);
  const operationOff = String(this.state(entities.operation)).toLowerCase() === "off";
  const attempted = attrs.anchor_date_test_attempted === true;
  const ready = attrs.anchor_date_test_allowed === true
    && exactCurrent
    && operationOff
    && !attempted
    && !this._zone8AnchorDateTestBusy
    && this.commandAvailable("test_zone8_anchor_date_write");
  const badge = attempted ? "Запись уже отправлялась"
    : ready ? "Точный блок ДО найден"
      : !operationOff ? "Переведите контроллер в OFF"
        : !stableZone8 ? "Сначала прочитайте зону 8"
          : "Исходный блок отличается";
  const tone = status === "confirmed" ? "ok"
    : ["blocked", "readback_mismatch"].includes(status) ? "error" : "";
  const cycleLabel = decoded?.mode === "interval" ? "Интервал, дней"
    : decoded?.mode === "weekly" ? "Дни недели, маска"
      : "Значение цикла";

  let content = previousDiagnosticsView.call(this, entities);
  content = content
    .replace("Программа зоны 8", "Расшифрованное состояние зоны 8")
    .replace("Значение цикла", cycleLabel)
    .replace("Изменений ещё не было", "Последний стабильный ответ DP38")
    .replace(
      "Запись DP38 аварийно отключена: тест зоны 8 изменил производственные расписания. Доступен только просмотр.",
      "Поля расшифрованы из последнего стабильного ответа DP38 зоны 8. Универсальная запись отключена.",
    );
  content = content.replace(
    /<section class="lab zone8KnownRestore">[\s\S]*?<\/section>/,
    "",
  );
  return `${content}
    <section class="lab zone8AnchorDateTest">
      <div class="zone8ProbeHead">
        <span><small>DP38 · ОДНОРАЗОВЫЙ ТЕСТ</small><h3>Дата начала зоны 8</h3></span>
        <b class="${ready ? "ready" : "blocked"}">${this.esc(badge)}</b>
      </div>
      <p>Меняется один байт: день опорной даты <b>03 → 02</b>. Длительность зоны 8 остаётся 0 минут, запусков нет.</p>
      <div class="zone8DateChange"><span>03.09.2026</span><ha-icon icon="mdi:arrow-right"></ha-icon><strong>02.09.2026</strong></div>
      <div class="zone8HexPair"><small>ДО</small><code>${this.esc(expected)}</code><small>ПОСЛЕ</small><code>${this.esc(attrs.anchor_date_test_expected_to_hex || "")}</code></div>
      <div class="zone8ProbeResult ${tone}" role="status" aria-live="polite">
        <small>Результат</small>
        <b>${this.esc(this._zone8AnchorDateTestStatusText(status))}</b>
        ${attrs.anchor_date_test_detail ? `<span>${this.esc(attrs.anchor_date_test_detail)}</span>` : ""}
        ${attrs.anchor_date_test_readback_hex ? `<code>${this.esc(attrs.anchor_date_test_readback_hex)}</code>` : ""}
      </div>
      <button type="button" class="zone8ProbeButton" data-zone8-anchor-date-test ${ready ? "" : "disabled"}>
        <ha-icon icon="mdi:calendar-edit"></ha-icon>
        ${this._zone8AnchorDateTestBusy ? "Проверка выполняется" : "Записать дату 02.09.2026 один раз"}
      </button>
      <p class="zone8ProbeWarning">Перед нажатием: контроллер OFF, полив остановлен. После теста проверьте дату зоны 8 на самом приборе.</p>
    </section>`;
};

p._ensureZone8AnchorDateTestEvents = function ensureZone8AnchorDateTestEvents() {
  if (this._zone8AnchorDateTestEventsBound) return;
  this._zone8AnchorDateTestEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const target = event.target.closest?.("[data-zone8-anchor-date-test]");
    if (target) this.runZone8AnchorDateWrite();
  });
};

p._render = function renderV0650() {
  previousRender.call(this);
  this._ensureZone8AnchorDateTestEvents();
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0650() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0650() {
  return `${previousStyles.call(this)}
    .zone8ProgramLab [data-zone8-apply],.zone8ProgramLab [data-zone8-restore]{display:none}.zone8ProgramLab .zone8LabControl{grid-template-columns:minmax(0,1fr)}.zone8ProgramLab [data-zone8-field]:disabled{opacity:1;color:var(--text);-webkit-text-fill-color:var(--text)}
    .zone8AnchorDateTest{display:grid;gap:10px;padding:14px}.zone8AnchorDateTest>p{margin:0;color:var(--muted);font-size:12px;line-height:1.35}.zone8DateChange{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:10px;border-radius:13px;background:var(--soft);text-align:center}.zone8DateChange span,.zone8DateChange strong{font-size:15px}.zone8DateChange ha-icon{width:20px;height:20px;color:var(--a)}.zone8AnchorDateTest .zone8ProbeResult code{overflow-wrap:anywhere;font-size:11px;font-weight:700}
  `;
};
