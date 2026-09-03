import "./irrigation-panel-v0650.mjs";

const UI_VERSION = "0.6.51";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;

p.runZone8AnchorDateWrite = async function runZone8AnchorDateWriteDisabled() {
  this.notify("Запись DP38 полностью отключена после изменения зоны 4");
};

p.diagnosticsView = function diagnosticsViewV0651(entities) {
  const content = previousDiagnosticsView.call(this, entities).replace(
    /<section class="lab zone8AnchorDateTest">[\s\S]*?<\/section>/,
    "",
  );
  return `${content}
    <section class="lab zone8WriteIncident">
      <div class="zone8ProbeHead">
        <span><small>DP38 · БЕЗОПАСНОСТЬ</small><h3>Запись расписаний отключена</h3></span>
        <b class="blocked">Только чтение</b>
      </div>
      <p>Одиночный блок с идентификатором зоны 8 не оказался изолированным: зона 8 осталась без изменений, а контроллер применил нулевую длительность, пустые старты и дату теста к зоне 4, одновременно заменив ежедневный период недельной маской.</p>
      <div class="zone8IncidentFacts">
        <span><small>Зона 8</small><b>Не изменилась</b></span>
        <span><small>Зона 4</small><b>Затронута тестом</b></span>
      </div>
      <p class="zone8ProbeWarning">Все записи DP38, включая повтор, откат и восстановление, заблокированы до расшифровки адресации контроллера. Кнопка «Прочитать зону 8» безопасна и остаётся доступной.</p>
    </section>`;
};

p._render = function renderV0651() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0651() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0651() {
  return `${previousStyles.call(this)}
    .zone8AnchorDateTest{display:none!important}.zone8WriteIncident{display:grid;gap:10px;padding:14px}.zone8WriteIncident>p{margin:0;color:var(--muted);font-size:12px;line-height:1.4}.zone8IncidentFacts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.zone8IncidentFacts span{display:grid;gap:3px;padding:10px;border-radius:13px;background:var(--soft)}.zone8IncidentFacts small{color:var(--muted);font-size:11px}.zone8IncidentFacts b{font-size:13px}.zone8IncidentFacts span:first-child b{color:var(--green)}.zone8IncidentFacts span:last-child b{color:var(--danger)}`;
};
