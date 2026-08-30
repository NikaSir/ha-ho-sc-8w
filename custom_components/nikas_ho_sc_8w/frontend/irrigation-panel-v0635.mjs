import "./irrigation-panel-v0634.mjs";

const UI_VERSION = "0.6.35";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousProgramView = p.programView;
const previousRender = p._render;
const previousStyles = p.styles;

p.header = function headerV0635() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.programView = function programViewV0635(e) {
  return previousProgramView.call(this, e)
    .replace('class="pageIntro"', 'class="pageIntro programPageIntro"')
    .replace(
      "Программа зон доступна для просмотра. Сезонная коррекция изменяется отдельно с подтверждением.",
      "Зоны — просмотр. Сезон — изменение с подтверждением.",
    );
};

p._render = function renderV0635() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0635() {
  return `${previousStyles.call(this)}
    .programPageIntro{padding-bottom:8px}
    .programPageIntro p{white-space:nowrap}
  `;
};
