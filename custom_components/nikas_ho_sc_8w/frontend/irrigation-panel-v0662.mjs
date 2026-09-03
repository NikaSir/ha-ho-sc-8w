import "./irrigation-panel-v0661.mjs";

const UI_VERSION = "0.6.62";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousManualView = p.manualView;
const previousRender = p._render;
const previousStatusView = p.statusView;
const previousStyles = p.styles;
const previousZonesView = p.zonesView;

p._systemWideZoneCard = function systemWideZoneCardV0662(entities) {
  const active = this.activeRuntime(entities);
  const physical = new Set(this._physicalZoneNumbers());
  const queued = [...this.zoneSet(this.state(entities.queued))]
    .map(Number)
    .filter((zone) => Number.isInteger(zone) && physical.has(zone))
    .sort((left, right) => left - right);
  const next = active || queued.length
    ? null
    : this._nextPhysicalZone(entities);
  const zone = active?.zone || queued[0] || next?.zone;

  if (!zone) {
    return `<div class="systemZoneStatus empty"><span class="systemZoneStatusIcon"><ha-icon icon="mdi:calendar-remove-outline"></ha-icon></span><span><small>БЛИЖАЙШИЙ ПОЛИВ</small><b>Не запланирован</b><em>В подключённых зонах нет ближайших запусков</em></span></div>`;
  }

  const runtime = this.zoneRuntime(entities, zone);
  const entity = active
    ? (entities.zones[zone]?.remaining || entities.active || "")
    : (entities.zones[zone]?.schedule || entities.queued || "");
  const entityAttribute = entity ? ` data-entity="${this.esc(entity)}"` : "";
  const kind = active ? "АКТИВНАЯ ЗОНА" : queued.length ? "СЛЕДУЮЩАЯ В ОЧЕРЕДИ" : "СЛЕДУЮЩАЯ ПО ПРОГРАММЕ";
  const state = active ? "Полив выполняется" : queued.length ? "Ожидает запуска" : "Запланирована";
  const timing = active
    ? (active.remaining ? `Осталось ${active.remaining} мин` : `${runtime.duration} мин`)
    : queued.length
      ? `${runtime.duration} мин${queued.length > 1 ? ` · далее ${queued.slice(1).join(" → ")}` : ""}`
      : `${next.label} · ${runtime.duration} мин`;
  return `<button class="systemZoneStatus ${active ? "active" : ""}"${entityAttribute}><span class="scene scene${zone}" aria-hidden="true"></span><span class="systemZoneStatusText"><small>${kind}</small><b>Зона ${zone}</b><strong>${state}</strong><em>${this.esc(timing)}</em></span><ha-icon icon="mdi:chevron-right"></ha-icon></button>`;
};

p.statusView = function statusViewV0662(entities) {
  if (this._systemSettingsOpen) return previousStatusView.call(this, entities);
  const operation = this.state(entities.operation);
  const operationEntity = entities.operation ? ` data-entity="${this.esc(entities.operation)}"` : "";
  const modeCard = `<button class="systemCompactItem"${operationEntity}><ha-icon icon="mdi:autorenew"></ha-icon><span><small>Режим</small><b>${this.esc(this.human("operation", operation))}</b><em>Зоны ${this._physicalZoneNumbers().join(", ")} · по порядку</em></span></button>`;
  return previousStatusView.call(this, entities)
    .replace(/<button class="systemCompactItem[^"]*"[\s\S]*?<\/button>|<div class="systemCompactItem[^"]*"[\s\S]*?<\/div>/, modeCard)
    .replace('<button type="button" class="systemSettingsButton"', `${this._systemWideZoneCard(entities)}<button type="button" class="systemSettingsButton"`);
};

p.zonesView = function zonesViewV0662(entities) {
  if (this._drillZone) return previousZonesView.call(this, entities);
  return `${previousZonesView.call(this, entities)
    .replace("<p>Фактическое состояние и программа каждого подключённого канала.</p>", "")}<p class="viewFootnote"><b>Примечание.</b> Показаны фактическое состояние и программа каждого подключённого канала.</p>`;
};

p.manualView = function manualViewV0662(entities) {
  return previousManualView.call(this, entities)
    .replace("<p>Включите нужные зоны и задайте длительность.<br>Контроллер выполнит их по порядку сверху вниз.</p>", "")
    .replace("</section>", '<p class="viewFootnote"><b>Примечание.</b> Выберите зоны и задайте длительность. Контроллер выполнит очередь сверху вниз.</p></section>');
};

p._render = function renderV0662() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0662() {
  return `${previousStyles.call(this)}
    /* UI v0.6.62 — top-first zone views and operational System summary. */
    .pageIntro:has(+.zoneCards){padding-bottom:5px}.pageIntro:has(+.zoneCards)>h2{margin-bottom:0}
    .viewFootnote{margin:10px 4px 2px!important;padding:9px 11px;border-radius:13px;background:var(--soft);color:var(--muted);font-size:11px!important;line-height:1.35}.viewFootnote b{color:var(--text)}
    .systemCompactScreen{height:100%;min-height:0;grid-template-rows:auto auto minmax(0,1fr) auto;padding-bottom:4px}
    .systemZoneStatus{align-self:start;display:grid;grid-template-columns:82px minmax(0,1fr) 24px;align-items:center;gap:12px;width:100%;min-height:108px;padding:11px;border:1px solid var(--line);border-radius:19px;background:var(--card);color:var(--text);text-align:left;box-shadow:0 5px 16px #11182708}.systemZoneStatus.active{border-color:color-mix(in srgb,var(--a) 48%,var(--line));background:color-mix(in srgb,var(--a) 5%,var(--card))}.systemZoneStatus>.scene{width:82px;height:82px;border-radius:15px;background-position:center;background-size:cover}.systemZoneStatusText{display:grid;gap:2px;min-width:0}.systemZoneStatusText small{color:var(--muted);font-size:10px!important;font-weight:850;letter-spacing:.08em}.systemZoneStatusText b{font-size:21px;line-height:1.05}.systemZoneStatusText strong{color:var(--green);font-size:14px}.systemZoneStatus.active .systemZoneStatusText strong{color:var(--a)}.systemZoneStatusText em{overflow:hidden;color:var(--muted);font-size:12px!important;font-style:normal;line-height:1.2;text-overflow:ellipsis}.systemZoneStatus>ha-icon{color:var(--a);--mdc-icon-size:23px}.systemZoneStatus.empty{grid-template-columns:58px minmax(0,1fr);min-height:92px}.systemZoneStatus.empty>span:nth-child(2){display:grid;gap:3px}.systemZoneStatus.empty small{color:var(--muted);font-size:10px!important;font-weight:850;letter-spacing:.08em}.systemZoneStatus.empty b{font-size:18px}.systemZoneStatus.empty em{color:var(--muted);font-size:11px!important;font-style:normal}.systemZoneStatusIcon{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;background:var(--soft);color:var(--muted)}.systemZoneStatusIcon ha-icon{--mdc-icon-size:28px}
    .systemSettingsButton{position:static;z-index:auto;align-self:end;width:100%;min-height:56px;margin:0;background:var(--card);box-shadow:0 5px 16px #1118270c;backdrop-filter:none;-webkit-backdrop-filter:none}
    .manualApprovedScreen{height:auto;min-height:100%;grid-template-rows:auto auto auto}.manualApprovedIntro{align-items:start}.manualApprovedIntro>div{align-self:center}
    @media(max-width:520px){.systemZoneStatus{grid-template-columns:70px minmax(0,1fr) 20px;gap:9px;min-height:94px;padding:9px;border-radius:17px}.systemZoneStatus>.scene{width:70px;height:70px;border-radius:13px}.systemZoneStatusText b{font-size:19px}.systemSettingsButton{min-height:52px}.pageIntro:has(+.zoneCards){padding-top:3px}.manualApprovedIntro h1{margin-bottom:1px}}
  `;
};
