import "./irrigation-panel-v0640.mjs";

const UI_VERSION = "0.6.41";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;

p.diagnosticsView = function diagnosticsViewV0641(entities) {
  return previousDiagnosticsView.call(this, entities).replace(
    "Каждая кнопка меняет только одно поле. Успех показывается лишь после точного чтения 20-байтного блока из контроллера.",
    "Запись DP38 аварийно отключена: тест зоны 8 изменил производственные расписания. Доступен только просмотр."
  );
};

p.applyZone8LabField = function applyZone8LabFieldV0641() {
  this.notify("Запись DP38 отключена для защиты программы полива");
};

p.restoreZone8Lab = function restoreZone8LabV0641() {
  this.notify("Восстановление одного блока зоны 8 отключено: операция не изолирована от других зон");
};

p._render = function renderV0641() {
  previousRender.call(this);
  for (const control of this.shadowRoot?.querySelectorAll(
    "[data-zone8-field], [data-zone8-apply], [data-zone8-restore]"
  ) || []) {
    control.disabled = true;
  }
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0641() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
