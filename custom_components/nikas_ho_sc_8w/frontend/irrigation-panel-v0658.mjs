import "./irrigation-panel-v0657.mjs";

const UI_VERSION = "0.6.58";
const ASSET_BASE = "/nikas-ho-sc-8w/assets";
const ARTWORK_STORAGE_KEY = "nikas_ho_sc_8w.zone_artwork.v1";
const ARTWORKS = Object.freeze({
  lawn: { label: "Газон", file: "zone-lawn-v2.webp" },
  flowers: { label: "Цветы", file: "zone-flowers-v2.webp" },
  shrubs: { label: "Кустарники", file: "zone-shrubs-v2.webp" },
  greenhouse: { label: "Теплица", file: "zone-greenhouse-v2.webp" },
  none: { label: "Без картинки", file: null },
});
const DEFAULT_ARTWORKS = Object.freeze({
  1: "lawn", 2: "lawn", 3: "lawn", 4: "flowers",
  5: "shrubs", 6: "greenhouse", 7: "none", 8: "none",
});

const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousProgramZoneForm = p._programZoneForm;
const previousRender = p._render;
const previousStyles = p.styles;

p.bottomNav = function bottomNavV0657() {
  const tabs = [
    ["status", "mdi:tune-variant", "Система"],
    ["zones", "mdi:sprinkler", "Зоны"],
    ["program", "mdi:calendar-clock", "Программа"],
    ["manual", "mdi:hand-back-right-outline", "Ручной"],
    ["diagnostics", "mdi:stethoscope", "Диагн."],
  ];
  return `<nav class="bottomNav"><div class="bottomNavInner">${tabs.map(([id, icon, label]) => `<button class="${this._view === id ? "active" : ""}" data-view="${id}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</div></nav>`;
};

p.statusView = function statusViewV0657(entities) {
  const status = this.systemStatus(entities);
  const pressure = this.pressurePresentation(entities);
  const rain = this.rainPresentation(entities);
  const operation = this.state(entities.operation);
  const seasonal = this.state(entities.seasonal);
  const active = [...this.zoneSet(this.state(entities.active))].map(Number).filter(Boolean).sort((a, b) => a - b);
  const queued = [...this.zoneSet(this.state(entities.queued))].map(Number).filter(Boolean).sort((a, b) => a - b);
  const controllerEntity = entities.connection ? ` data-entity="${this.esc(entities.connection)}"` : "";
  const pressureEntity = entities.pressure ? ` data-entity="${this.esc(entities.pressure)}"` : "";
  const rainEntity = entities.rain ? ` data-entity="${this.esc(entities.rain)}"` : "";
  const operationEntity = entities.operation ? ` data-entity="${this.esc(entities.operation)}"` : "";
  const seasonalEntity = entities.seasonal ? ` data-entity="${this.esc(entities.seasonal)}"` : "";
  const queueText = active.length
    ? `Полив: зона ${active.join(", ")}`
    : queued.length ? `Очередь: ${queued.join(" → ")}` : "Зоны 1–6 · по порядку";
  return `<div class="systemCompactScreen">
    <section class="systemOverview ${this.esc(status.tone)}">
      <button class="systemControllerPhoto"${controllerEntity} aria-label="Контроллер HO-SC-8W"></button>
      ${this.connectionIndicator(entities)}
      <div class="systemReadiness"><h1>${this.esc(status.title)}</h1><p>${this.esc(status.sub)}</p></div>
    </section>
    <section class="systemCompactGrid" aria-label="Параметры системы">
      <button class="systemCompactItem"${operationEntity}><ha-icon icon="mdi:autorenew"></ha-icon><span><small>Режим</small><b>${this.esc(this.human("operation", operation))}</b><em>${this.esc(queueText)}</em></span></button>
      <button class="systemCompactItem ${this.esc(rain.tone)}"${rainEntity}><ha-icon icon="${rain.icon}"></ha-icon><span><small>Датчик дождя</small><b>${this.esc(rain.label)}</b><em>${this.esc(rain.detail)}</em></span></button>
      <button class="systemCompactItem"${pressureEntity}><ha-icon icon="mdi:gauge"></ha-icon><span><small>Давление</small><b>${this.esc(pressure.value)}</b><em>Линия полива</em></span></button>
      <button class="systemCompactItem"${seasonalEntity}><ha-icon icon="mdi:percent-outline"></ha-icon><span><small>Сезонная коррекция</small><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b><em>Общее значение</em></span></button>
    </section>
  </div>`;
};

p._zoneArtworkState = function zoneArtworkState() {
  if (this.__zoneArtworkState) return this.__zoneArtworkState;
  let saved = {};
  try { saved = JSON.parse(window.localStorage.getItem(ARTWORK_STORAGE_KEY) || "{}"); } catch (_error) {}
  this.__zoneArtworkState = Object.fromEntries(Array.from({ length: 8 }, (_, index) => {
    const zone = index + 1;
    const choice = ARTWORKS[saved[zone]] ? saved[zone] : DEFAULT_ARTWORKS[zone];
    return [zone, choice];
  }));
  return this.__zoneArtworkState;
};

p._applyZoneArtwork = function applyZoneArtwork() {
  const state = this._zoneArtworkState();
  for (let zone = 1; zone <= 8; zone += 1) {
    const choice = ARTWORKS[state[zone]] ? state[zone] : DEFAULT_ARTWORKS[zone];
    const artwork = ARTWORKS[choice];
    const image = artwork.file ? `url("${ASSET_BASE}/${artwork.file}?v=${UI_VERSION}")` : "none";
    this.style.setProperty(`--zone-artwork-${zone}`, image);
    this.toggleAttribute(`data-zone-artwork-${zone}-none`, choice === "none");
  }
};

p._setZoneArtwork = function setZoneArtwork(zone, choice) {
  if (!Number.isInteger(zone) || zone < 1 || zone > 8 || !ARTWORKS[choice]) return;
  const state = { ...this._zoneArtworkState(), [zone]: choice };
  this.__zoneArtworkState = state;
  try { window.localStorage.setItem(ARTWORK_STORAGE_KEY, JSON.stringify(state)); } catch (_error) {}
  this._applyZoneArtwork();
};

p._programZoneForm = function programZoneFormV0657(entities, zone) {
  const state = this._zoneArtworkState();
  const choice = ARTWORKS[state[zone]] ? state[zone] : DEFAULT_ARTWORKS[zone];
  const options = Object.entries(ARTWORKS).map(([id, artwork]) => {
    const preview = artwork.file
      ? ` style="--artwork-preview:url('${ASSET_BASE}/${artwork.file}?v=${UI_VERSION}')"`
      : "";
    return `<button type="button" class="zoneArtworkOption ${choice === id ? "active" : ""}" data-zone-artwork-choice="${id}" data-zone-artwork-zone="${zone}"${preview}><span class="zoneArtworkPreview ${id === "none" ? "empty" : ""}" aria-hidden="true"></span><b>${artwork.label}</b>${choice === id ? '<ha-icon icon="mdi:check-circle"></ha-icon>' : ""}</button>`;
  }).join("");
  const original = previousProgramZoneForm.call(this, entities, zone);
  const picture = `<button type="button" class="scene scene${zone} zoneProgramScene zoneArtworkButton" data-zone-artwork-open="${zone}" aria-label="Выбрать картинку зоны ${zone}"><span class="zoneArtworkEdit"><ha-icon icon="mdi:image-edit-outline"></ha-icon></span></button>`;
  const form = original.replace(`<span class="scene scene${zone} zoneProgramScene" aria-hidden="true"></span>`, picture);
  return `${form}<dialog class="zoneArtworkDialog" data-zone-artwork-dialog="${zone}"><form method="dialog" class="zoneArtworkSheet"><div class="zoneArtworkHead"><span><small>ЗОНА ${zone}</small><h3>Выберите картинку</h3></span><button type="submit" aria-label="Закрыть"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="zoneArtworkOptions">${options}</div><p>Выбор хранится только в этом браузере и не изменяет программу контроллера.</p></form></dialog>`;
};

p._ensureZoneArtworkEvents = function ensureZoneArtworkEvents() {
  if (this._zoneArtworkEventsBound) return;
  this._zoneArtworkEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const open = event.target.closest?.("[data-zone-artwork-open]");
    if (open) {
      const dialog = this.shadowRoot.querySelector(`[data-zone-artwork-dialog="${open.dataset.zoneArtworkOpen}"]`);
      if (dialog && !dialog.open) dialog.showModal();
      return;
    }
    const option = event.target.closest?.("[data-zone-artwork-choice]");
    if (!option) return;
    const zone = Number(option.dataset.zoneArtworkZone);
    this._setZoneArtwork(zone, option.dataset.zoneArtworkChoice);
    option.closest("dialog")?.close();
    this.render();
  });
};

p._render = function renderV0657() {
  this._applyZoneArtwork();
  previousRender.call(this);
  this._ensureZoneArtworkEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0657() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small data-ui-version>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0657() {
  return `${previousStyles.call(this)}
    /* UI v0.6.58 — compact System workspace and local zone artwork picker. */
    .scene1{background-image:var(--zone-artwork-1)!important}.scene2{background-image:var(--zone-artwork-2)!important}.scene3{background-image:var(--zone-artwork-3)!important}.scene4{background-image:var(--zone-artwork-4)!important}.scene5{background-image:var(--zone-artwork-5)!important}.scene6{background-image:var(--zone-artwork-6)!important}.scene7{background-image:var(--zone-artwork-7)!important}.scene8{background-image:var(--zone-artwork-8)!important}
    :host([data-zone-artwork-1-none]) .scene1,:host([data-zone-artwork-2-none]) .scene2,:host([data-zone-artwork-3-none]) .scene3,:host([data-zone-artwork-4-none]) .scene4,:host([data-zone-artwork-5-none]) .scene5,:host([data-zone-artwork-6-none]) .scene6,:host([data-zone-artwork-7-none]) .scene7,:host([data-zone-artwork-8-none]) .scene8{background-color:#e8ecef!important}
    :host([data-zone-artwork-7-none]) .zoneProgramScene.scene7::after,:host([data-zone-artwork-8-none]) .zoneProgramScene.scene8::after{display:none}
    .systemCompactScreen{display:grid;gap:10px;padding-bottom:72px}.systemOverview{display:grid;grid-template-columns:minmax(118px,.82fr) minmax(160px,1.18fr);gap:10px;padding:12px;border:1px solid color-mix(in srgb,var(--green) 24%,var(--line));border-radius:22px;background:var(--card);box-shadow:0 7px 22px #1118270b}.systemControllerPhoto{min-height:116px;border:0;border-radius:17px;background:var(--soft) url('${ASSET_BASE}/ho-sc-8w-controller-v4.webp?v=${UI_VERSION}') center/contain no-repeat}.systemOverview>.connectionWrap{align-self:center;width:100%;min-width:0}.systemOverview .systemConnection{width:100%;min-height:58px;padding:12px 14px;border-radius:18px}.systemReadiness{grid-column:1/3;padding:1px 3px 2px}.systemReadiness h1{margin:0;font-size:25px;line-height:1.08}.systemReadiness p{margin:4px 0 0;color:var(--muted);font-size:13px;line-height:1.3}
    .systemCompactGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.systemCompactItem{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:9px;min-height:92px;padding:11px;border:1px solid var(--line);border-radius:17px;background:var(--card);color:var(--text);text-align:left;box-shadow:0 5px 16px #11182708}.systemCompactItem>ha-icon{--mdc-icon-size:29px;color:var(--a)}.systemCompactItem>span{display:grid;gap:2px;min-width:0}.systemCompactItem small,.systemCompactItem b,.systemCompactItem em{display:block}.systemCompactItem small{color:var(--muted);font-size:12px;font-weight:700}.systemCompactItem b{font-size:17px;line-height:1.12}.systemCompactItem em{overflow:hidden;color:var(--muted);font-size:11px;font-style:normal;line-height:1.25;text-overflow:ellipsis}.systemCompactItem.clear>ha-icon,.systemCompactItem.clear b{color:var(--green)}.systemCompactItem.blocked>ha-icon,.systemCompactItem.blocked b{color:var(--orange)}
    .zoneArtworkButton{position:relative;padding:0;cursor:pointer}.zoneArtworkEdit{position:absolute;right:6px;bottom:6px;display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:#fffffff0;color:var(--a);box-shadow:0 3px 10px #1118272b}.zoneArtworkEdit ha-icon{display:block!important;--mdc-icon-size:20px}.zoneArtworkButton:focus-visible{outline:3px solid color-mix(in srgb,var(--a) 30%,transparent);outline-offset:2px}
    .zoneArtworkDialog{width:min(460px,calc(100vw - 28px));max-height:min(680px,calc(100dvh - 40px));padding:0;border:0;border-radius:23px;background:var(--card);color:var(--text);box-shadow:0 22px 70px #1118274a}.zoneArtworkDialog::backdrop{background:#11182775;backdrop-filter:blur(3px)}.zoneArtworkSheet{display:grid;gap:12px;padding:16px}.zoneArtworkHead{display:flex;align-items:center;justify-content:space-between;gap:12px}.zoneArtworkHead small{color:var(--muted);font-size:11px;font-weight:850;letter-spacing:.1em}.zoneArtworkHead h3{margin:3px 0 0;font-size:21px}.zoneArtworkHead>button{display:grid;place-items:center;width:42px;height:42px;padding:0;border:1px solid var(--line);border-radius:14px;background:var(--soft);color:var(--text)}.zoneArtworkOptions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.zoneArtworkOption{position:relative;display:grid;grid-template-columns:58px minmax(0,1fr) 22px;align-items:center;gap:9px;min-height:72px;padding:7px;border:1px solid var(--line);border-radius:16px;background:var(--soft);color:var(--text);text-align:left}.zoneArtworkOption.active{border-color:color-mix(in srgb,var(--a) 48%,var(--line));background:var(--accent-soft)}.zoneArtworkPreview{display:block;width:58px;height:58px;border-radius:12px;background:var(--soft) var(--artwork-preview) center/cover no-repeat}.zoneArtworkPreview.empty{background:#dfe4e8}.zoneArtworkOption b{font-size:13px}.zoneArtworkOption>ha-icon{--mdc-icon-size:21px;color:var(--a)}.zoneArtworkSheet>p{margin:0;color:var(--muted);font-size:11px;line-height:1.35}
    @media(max-width:520px){.systemOverview{grid-template-columns:minmax(105px,.8fr) minmax(145px,1.2fr);gap:8px;padding:10px}.systemControllerPhoto{min-height:104px}.systemReadiness h1{font-size:23px}.systemCompactGrid{gap:7px}.systemCompactItem{grid-template-columns:30px minmax(0,1fr);min-height:88px;padding:9px;gap:7px}.systemCompactItem>ha-icon{--mdc-icon-size:26px}.systemCompactItem b{font-size:15px}.zoneArtworkOptions{grid-template-columns:1fr}.zoneArtworkDialog{max-height:calc(100dvh - 24px)}.zoneArtworkSheet{padding:14px}}
  `;
};
