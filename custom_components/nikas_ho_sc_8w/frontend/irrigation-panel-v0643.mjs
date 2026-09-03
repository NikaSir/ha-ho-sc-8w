import "./irrigation-panel-v0642.mjs";

const UI_VERSION = "0.6.43";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

p._zone8HexProbeStatusText = function zone8HexProbeStatusTextV0643(status) {
  return {
    idle: "Тест ещё не запускался",
    reading_before: "Активный сбор свежих DP38 — требуется 8 из 8 зон",
    testing_no_change: "Проверка точной записи без изменения",
    testing_change: "Проверка одного бита только зоны 8",
    restoring_zone8: "Возврат исходного блока зоны 8",
    verified: "HEX-запись подтверждена, зона 8 восстановлена",
    failed: "Тест остановлен защитой до записи",
  }[status] || String(status || "Нет данных");
};

p._render = function renderV0643() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0643() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
