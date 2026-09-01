import "./irrigation-panel-v0637.mjs";

const UI_VERSION = "0.6.38";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p.header = function headerV0638() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p._render = function renderV0638() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;

  const runtime = this.activeRuntime(this.entities());
  for (const node of this.shadowRoot?.querySelectorAll(".manualZoneRemaining") || []) {
    if (!node.closest(".manualZoneCard.running")) node.remove();
  }
  const identity = this.shadowRoot?.querySelector(".manualZoneCard.running .manualZoneIdentity");
  if (!identity || !runtime) return;

  let remainingNode = identity.querySelector(".manualZoneRemaining");
  if (!remainingNode) {
    remainingNode = document.createElement("span");
    remainingNode.className = "manualZoneRemaining";
    remainingNode.setAttribute("role", "status");
    remainingNode.setAttribute("aria-live", "polite");
    identity.append(remainingNode);
  }
  remainingNode.textContent = runtime.remaining
    ? `Осталось ${runtime.remaining} мин`
    : "Полив выполняется";
};

p.styles = function stylesV0638() {
  return `${previousStyles.call(this)}
    /* UI v0.6.38 — factual active-zone remaining time in Manual. */
    .manualZoneRemaining{display:block;margin-top:4px;color:var(--a);font-size:12px;font-weight:800;line-height:1.08;white-space:nowrap}
    @media(max-width:520px){.manualZoneRemaining{margin-top:3px;font-size:10.5px;white-space:normal}}
  `;
};
