import "./irrigation-panel-v0689.mjs";

const UI_VERSION = "0.6.90";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0689 panel is not registered");
const p = Panel.prototype;
const previousZoneDetail = p.zoneDetail;
const previousRender = p._render;
const previousStructureKey = p._structureKey;
const previousStyles = p.styles;

const WEEKDAY_LABELS = Object.freeze({ sun: "Вс", mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб" });

p._programReadOnlyCardV0690 = function programReadOnlyCardV0690(entities, zone) {
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const base = this._programEditorBase(entities, zone);
  const seasonal = this.state(entities.seasonal);
  const starts = Array.from({ length: 6 }, (_, index) => base.start_times[index] || "--:--");
  const startsCount = base.start_times.filter(Boolean).length;
  let repeatTitle = String(base.cycle_mode || "Нет данных");
  let repeatDetail = "Из DP38";
  if (base.cycle_mode === "interval") {
    repeatTitle = "Интервал";
    repeatDetail = `Каждые ${this.esc(base.interval_days)} дн.`;
  } else if (base.cycle_mode === "weekly") {
    repeatTitle = "По дням недели";
    repeatDetail = (base.weekdays || []).map((day) => WEEKDAY_LABELS[day] || day).join(" · ") || "Дни не заданы";
  } else if (base.cycle_mode === "odd") {
    repeatTitle = "Нечётные дни";
  } else if (base.cycle_mode === "even") {
    repeatTitle = "Чётные дни";
  }
  const date = base.anchor_date && /^\d{4}-\d{2}-\d{2}$/.test(base.anchor_date)
    ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${base.anchor_date}T12:00:00`))
    : "Не задана";
  const rain = base.rain_sensor_follow === true ? "Учитывать" : base.rain_sensor_follow === false ? "Не учитывать" : "Нет данных";
  const enabled = attrs.dp38_program_enabled === true ? "Включена" : attrs.dp38_program_enabled === false ? "Выключена" : "Нет данных";
  const received = attrs.updated_at || attrs.received_at || attrs.last_update || "";
  return `<section class="detailCard zoneProgramDetail programReadOnly">
    <div class="zoneProgramHero">
      <span class="scene scene${zone} zoneProgramScene" aria-hidden="true"></span>
      <div class="zoneProgramIdentity"><small>ЗОНА ${zone}</small><h2>Зона ${zone}</h2><span class="zoneProgramStatus ready"><ha-icon icon="mdi:eye-outline"></ha-icon>Просмотр</span><span class="zoneProgramCount">${startsCount} из 6</span></div>
    </div>
    <div class="programReadFresh"><span><i></i><b>Фактическая программа контроллера</b></span>${received ? `<em>${this.esc(received)}</em>` : ""}</div>
    <div class="programReadGrid">
      <article><small>Базовая длительность</small><b>${this.esc(base.duration_minutes)} мин</b><em>До сезонной коррекции</em></article>
      <article><small>Сезонная коррекция</small><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b><em>Общая для всех зон</em></article>
      <article><small>Режим повтора</small><b>${this.esc(repeatTitle)}</b><em>${this.esc(repeatDetail)}</em></article>
      <article><small>Опорная дата</small><b>${this.esc(date)}</b><em>Фактическое значение DP38</em></article>
      <article><small>Датчик дождя</small><b>${this.esc(rain)}</b><em>Правило этой зоны</em></article>
      <article><small>Состояние программы</small><b>${this.esc(enabled)}</b><em>High nibble byte 19</em></article>
    </div>
    <section class="programReadStarts"><div class="programEditorSectionHead"><span><small>ВРЕМЯ ЗАПУСКА</small><b>Все шесть слотов</b></span><em>${startsCount} из 6</em></div><div>${starts.map((value, index) => `<article class="${value === "--:--" ? "empty" : ""}"><small>Запуск ${index + 1}</small><b>${this.esc(value)}</b></article>`).join("")}</div></section>
    <p class="programReadNote"><ha-icon icon="mdi:database-eye-outline"></ha-icon><span>Только просмотр. Здесь показывается фактическое состояние DP38 контроллера; черновики редактора сюда не подмешиваются. Редактирование выполняется через «Зоны» → выбранная зона.</span></p>
  </section>`;
};

p.programView = function programViewV0690(entities) {
  const zones = this._physicalZoneNumbers ? this._physicalZoneNumbers() : Array.from({ length: 8 }, (_, i) => i + 1);
  const selected = Number(this._programZone);
  const zone = zones.includes(selected) ? selected : zones[0];
  this._programZone = zone;
  const tabs = zones.map((number) => `<button type="button" class="${number === zone ? "active" : ""}" data-program-zone="${number}" aria-pressed="${number === zone}">${number}</button>`).join("");
  return `<nav class="programZoneTabs" style="--physical-zone-count:${zones.length}" aria-label="Выбор зоны">${tabs}</nav><div class="programSectionBody programZoneBody">${this._programReadOnlyCardV0690(entities, zone)}</div>`;
};

p.zoneDetail = function zoneDetailV0690(entities, zone) {
  const number = Number(zone);
  if (!Number.isInteger(number) || number < 1 || number > 8) return previousZoneDetail.call(this, entities, zone);
  return `<button class="inlineBack" data-drill-back><ha-icon icon="mdi:arrow-left"></ha-icon>Зоны</button>${this._programEditorCard(entities, number)}`;
};

p._structureKey = function structureKeyV0690() {
  if (this._view === "program") return `program:readonly:${Number(this._programZone) || 1}`;
  return previousStructureKey.call(this);
};

p._render = function renderV0690() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0690() {
  return `${previousStyles.call(this)}
    .programReadOnly{gap:12px!important}.programReadFresh{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px;color:var(--muted);font-size:11px}.programReadFresh>span{display:flex;align-items:center;gap:7px}.programReadFresh i{width:9px;height:9px;border-radius:50%;background:var(--green)}.programReadFresh b{color:var(--green);font-size:12px}.programReadFresh em{font-style:normal}.programReadGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.programReadGrid article{display:grid;align-content:start;gap:5px;min-height:100px;padding:11px;border:1px solid var(--line);border-radius:17px;background:var(--soft)}.programReadGrid small,.programReadStarts small{color:var(--muted);font-size:11px;font-weight:800}.programReadGrid b{font-size:18px;line-height:1.15}.programReadGrid em{color:var(--muted);font-size:10.5px;font-style:normal;line-height:1.25}.programReadStarts{display:grid;gap:8px;padding:12px;border:1px solid var(--line);border-radius:18px;background:var(--card)}.programReadStarts>div:last-child{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.programReadStarts article{display:grid;gap:5px;padding:10px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}.programReadStarts article b{font-size:18px;text-align:center}.programReadStarts article.empty b{color:var(--muted)}.programReadNote{display:grid!important;grid-template-columns:28px minmax(0,1fr);align-items:start;gap:7px;margin:0!important;padding:10px;border-radius:14px;background:var(--soft);color:var(--muted)!important;font-size:10.5px!important;line-height:1.35}.programReadNote ha-icon{color:var(--a);--mdc-icon-size:22px}.programReadOnly .zoneProgramStatus.ready{color:var(--green)}
    @media(max-width:520px){.programReadGrid{gap:7px}.programReadGrid article{min-height:96px;padding:10px}.programReadStarts>div:last-child{gap:6px}}
  `;
};
