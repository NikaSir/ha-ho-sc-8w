import "./irrigation-panel-v0655.mjs";

const UI_VERSION = "0.6.56";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStructureKey = p._structureKey;
const previousStyles = p.styles;

p._programSectionName = function programSectionNameV0656() {
  return "zones";
};

p._programZoneNumber = function programZoneNumberV0656() {
  const zone = Number(this._programZone);
  return Number.isInteger(zone) && zone >= 1 && zone <= 8 ? zone : 1;
};

p.programView = function programViewV0656(entities) {
  const zone = this._programZoneNumber();
  const buttons = Array.from({ length: 8 }, (_, index) => index + 1).map((number) => {
    const selected = number === zone;
    return `<button type="button" class="${selected ? "active" : ""}" data-program-zone="${number}" aria-label="Показать программу зоны ${number}" aria-pressed="${selected}">${number}</button>`;
  }).join("");
  return `<nav class="programZoneTabs" aria-label="Выбор зоны">${buttons}</nav>
    <div class="programSectionBody programZoneBody">${this._programZoneForm(entities, zone)}</div>`;
};

p._structureKey = function structureKeyV0656() {
  if (this._view === "program") return `program:zone:${this._programZoneNumber()}`;
  return previousStructureKey.call(this);
};

p.header = function headerV0656() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small data-ui-version>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p._syncProgramHeader = function syncProgramHeaderV0656() {
  const refresh = this.shadowRoot?.querySelector("[data-refresh]");
  if (refresh) refresh.hidden = false;
};

p._ensureProgramZoneTabsEvents = function ensureProgramZoneTabsEvents() {
  if (this._programZoneTabsEventsBound) return;
  this._programZoneTabsEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-program-zone]");
    if (!button) return;
    const zone = Number(button.dataset.programZone);
    if (!Number.isInteger(zone) || zone < 1 || zone > 8 || zone === this._programZoneNumber()) return;
    this._programZone = zone;
    this._pendingScrollTop = 0;
    this.render();
  });
};

p._render = function renderV0656() {
  previousRender.call(this);
  this._ensureProgramZoneTabsEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0656() {
  return `${previousStyles.call(this)}
    /* UI v0.6.56 — direct zone program navigation without redundant sections. */
    .programZoneTabs{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px;margin:2px 0 10px;padding:7px;border:1px solid var(--line);border-radius:18px;background:var(--soft);box-shadow:0 5px 16px #11182708}
    .programZoneTabs button{display:grid;place-items:center;min-width:0;min-height:42px;padding:0;border:1px solid transparent;border-radius:12px;background:transparent;color:var(--muted);font-weight:850;cursor:pointer}
    .programZoneTabs button.active{border-color:color-mix(in srgb,var(--a) 30%,var(--line));background:var(--card);color:var(--a);box-shadow:0 3px 10px #11182712}
    .programZoneTabs button:focus-visible{outline:3px solid color-mix(in srgb,var(--a) 28%,transparent);outline-offset:1px}
    .programZoneBody{padding-bottom:72px}.programZoneBody .zoneProgramDetail{margin:0}.programZoneBody .zoneProgramIdentity>small{display:none}.programZoneBody .zoneProgramIdentity{grid-template-rows:auto auto;align-content:center}.programZoneBody .zoneProgramIdentity h2{grid-column:1/3}.programZoneBody .zoneProgramScene.scene7,.programZoneBody .zoneProgramScene.scene8{display:grid!important;place-items:center;background-image:none!important;background-color:var(--soft)!important;color:var(--muted)}.programZoneBody .zoneProgramScene.scene7::after,.programZoneBody .zoneProgramScene.scene8::after{font-size:34px;font-weight:850}.programZoneBody .zoneProgramScene.scene7::after{content:"7"}.programZoneBody .zoneProgramScene.scene8::after{content:"8"}
    @media(max-width:520px){.programZoneTabs{gap:4px;margin-top:1px;padding:5px;border-radius:15px}.programZoneTabs button{min-height:38px;border-radius:10px;font-size:14px}.programZoneBody .zoneProgramDetail{padding-top:12px!important}}
  `;
};
