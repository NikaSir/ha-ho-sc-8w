import "./irrigation-panel-v0643.mjs";

const UI_VERSION = "0.6.44";
const CONFIRMATION = "ZONE8_DP38_HEX_PROBE";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;

p._zone8HexProbeStatusText = function zone8HexProbeStatusTextV0644(status) {
  return {
    idle: "Тест ещё не запускался",
    reading_before: "Двойное чтение текущего блока зоны 8",
    verified: "Текущий блок зоны 8 прочитан без записи",
    failed: "Чтение не выполнено",
  }[status] || String(status || "Нет данных");
};

p.runZone8HexProbe = async function runZone8HexProbeV0644() {
  if (this.rejectUnavailableCommand("probe_zone8_dp38_hex")) return;
  const entities = this.entities();
  if (String(this.state(entities.operation)).toLowerCase() !== "off") {
    this.notify("Перед тестом физически переведите контроллер в режим OFF");
    return;
  }
  this._zone8HexProbeBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "probe_zone8_dp38_hex", {
      ...this.serviceTargetData(), confirmation: CONFIRMATION,
    });
    await this.refreshNow();
    this.notify("Текущий блок зоны 8 прочитан без записи");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось прочитать DP38 зоны 8"));
  } finally {
    this._zone8HexProbeBusy = false;
    this.render();
  }
};

p.diagnosticsView = function diagnosticsViewV0644(entities) {
  return previousDiagnosticsView.call(this, entities)
    .replace("DP38 · КОНТРОЛЬНЫЙ ТЕСТ", "DP38 · ЧТЕНИЕ")
    .replace("HEX-запись зоны 8", "Текущая программа зоны 8")
    .replace(
      "Три защищённых шага: запись без изменения, один бит зоны 8, точный возврат. На каждом шаге сравниваются все восемь зон.",
      "Два одинаковых свежих чтения текущего блока DP38 зоны 8. Команды записи не отправляются.",
    )
    .replace("Проверить HEX на зоне 8", "Прочитать зону 8")
    .replace(
      "Это проверка транспорта, не восстановление повреждённых зон 1, 2 и 4.",
      "Только чтение зоны 8. Запись и восстановление всех расписаний отключены.",
    );
};

p._render = function renderV0644() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0644() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
