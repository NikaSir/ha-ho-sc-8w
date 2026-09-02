import "./irrigation-panel-v0639.mjs";

const UI_VERSION = "0.6.40";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

p._ensureZone8LabEvents = function ensureZone8LabEventsV0640() {
  // The base element can be upgraded and connected while an earlier module in
  // the import chain is still evaluating.  Bind from render as well as from
  // connectedCallback so Zone 8 drafts never depend on module timing.
  if (this._zone8LabEventsBound) return;
  this._zone8LabEventsBound = true;
  this.shadowRoot.addEventListener("input", (event) => {
    const input = event.target;
    if (!input?.matches?.("[data-zone8-field]")) return;
    this._zone8LabDrafts = {
      ...(this._zone8LabDrafts || {}),
      [input.dataset.zone8Field]: input.value,
    };
  });
  this.shadowRoot.addEventListener("change", (event) => {
    const input = event.target;
    if (!input?.matches?.("[data-zone8-field]")) return;
    this._zone8LabDrafts = {
      ...(this._zone8LabDrafts || {}),
      [input.dataset.zone8Field]: input.value,
    };
  });
  this.shadowRoot.addEventListener("click", (event) => {
    const target = event.target.closest?.(
      "[data-zone8-apply], [data-zone8-restore]"
    );
    if (!target) return;
    if (target.dataset.zone8Apply) {
      this.applyZone8LabField(target.dataset.zone8Apply);
    } else {
      this.restoreZone8Lab();
    }
  });
};

p._render = function renderV0640() {
  previousRender.call(this);
  this._ensureZone8LabEvents();
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0640() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
