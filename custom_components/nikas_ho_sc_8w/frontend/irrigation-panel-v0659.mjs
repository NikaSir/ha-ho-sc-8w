import "./irrigation-panel-v0658.mjs";

const UI_VERSION = "0.6.59";
const PHYSICAL_ZONES_STORAGE_KEY = "nikas_ho_sc_8w.physical_zones.v1";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousProgramZoneForm = p._programZoneForm;
const previousRender = p._render;
const previousStructureKey = p._structureKey;
const previousStyles = p.styles;
const previousStatusView = p.statusView;

p._physicalZoneNumbers = function physicalZoneNumbersV0659() {
  if (this.__physicalZoneNumbers) return this.__physicalZoneNumbers;
  let saved = null;
  try { saved = JSON.parse(window.localStorage.getItem(PHYSICAL_ZONES_STORAGE_KEY) || "null"); } catch (_error) {}
  const zones = Array.isArray(saved)
    ? [...new Set(saved.map(Number))].filter((zone) => Number.isInteger(zone) && zone >= 1 && zone <= 8).sort((a, b) => a - b)
    : [];
  this.__physicalZoneNumbers = zones.length ? zones : [1, 2, 3, 4, 5, 6];
  return this.__physicalZoneNumbers;
};

p._togglePhysicalZone = function togglePhysicalZoneV0659(zone) {
  if (!Number.isInteger(zone) || zone < 1 || zone > 8) return;
  const selected = new Set(this._physicalZoneNumbers());
  if (selected.has(zone)) {
    if (selected.size === 1) {
      this.notify("Должна остаться хотя бы одна физическая зона");
      return;
    }
    selected.delete(zone);
  } else {
    selected.add(zone);
  }
  const zones = [...selected].sort((a, b) => a - b);
  this.__physicalZoneNumbers = zones;
  this._manualQueue = (this._manualQueue || []).map(Number).filter((item) => selected.has(item));
  if (this._drillZone && !selected.has(Number(this._drillZone))) this._drillZone = null;
  if (!selected.has(Number(this._programZone))) this._programZone = zones[0];
  try { window.localStorage.setItem(PHYSICAL_ZONES_STORAGE_KEY, JSON.stringify(zones)); } catch (_error) {}
  this.render();
};

p.activeRuntime = function activeRuntimeV0659(entities) {
  const active = [...this.zoneSet(this.state(entities.active))]
    .map(Number)
    .filter((zone) => Number.isInteger(zone) && zone >= 1 && zone <= 8)
    .sort((a, b) => a - b);
  if (!active.length) return null;
  const zone = active[0];
  const remainingRaw = this.state(entities.zones[zone]?.remaining);
  const remaining = Number(String(remainingRaw).replace(",", "."));
  return { zone, remaining: Number.isFinite(remaining) && remaining > 0 ? Math.round(remaining) : null };
};

p._nextPhysicalZone = function nextPhysicalZoneV0659(entities) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  for (let offset = 0; offset <= 800; offset += 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12, 0, 0, 0);
    const candidates = [];
    for (const zone of this._physicalZoneNumbers()) {
      const runtime = this.zoneRuntime(entities, zone);
      if (this.state(runtime.q.schedule) !== "configured") continue;
      const cycle = this._zoneCyclePresentation(runtime.attrs);
      if (!this._zoneRunsOnDate(day, runtime.attrs, cycle)) continue;
      for (const slot of this._zoneProgramSlots(runtime.attrs)) {
        if (!slot.present || !slot.valid) continue;
        const [hour, minute] = slot.value.split(":").map(Number);
        const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
        if (at.getTime() > now.getTime()) candidates.push({ zone, at, time: slot.value });
      }
    }
    if (!candidates.length) continue;
    candidates.sort((left, right) => left.at - right.at || left.zone - right.zone);
    const next = candidates[0];
    const dayLabel = offset === 0 ? "Сегодня" : offset === 1 ? "Завтра" : new Intl.DateTimeFormat("ru-RU", {
      weekday: "short", day: "numeric", month: "short",
    }).format(next.at);
    return { ...next, label: `${dayLabel}, ${next.time}` };
  }
  return null;
};

p._systemZoneSummaryCard = function systemZoneSummaryCardV0659(entities) {
  const active = this.activeRuntime(entities);
  if (active) {
    const entity = entities.zones[active.zone]?.remaining || entities.active;
    const attribute = entity ? ` data-entity="${this.esc(entity)}"` : "";
    return `<button class="systemCompactItem active"${attribute}><ha-icon icon="mdi:water"></ha-icon><span><small>Активная зона</small><b>Зона ${active.zone}</b><em>${active.remaining ? `Осталось ${active.remaining} мин` : "Полив выполняется"}</em></span></button>`;
  }
  const physical = new Set(this._physicalZoneNumbers());
  const queued = [...this.zoneSet(this.state(entities.queued))]
    .map(Number)
    .filter((zone) => Number.isInteger(zone) && physical.has(zone))
    .sort((a, b) => a - b);
  if (queued.length) {
    const zone = queued[0];
    const entity = entities.zones[zone]?.schedule || entities.queued;
    const attribute = entity ? ` data-entity="${this.esc(entity)}"` : "";
    return `<button class="systemCompactItem"${attribute}><ha-icon icon="mdi:clock-outline"></ha-icon><span><small>Следующая в очереди</small><b>Зона ${zone}</b><em>${queued.length > 1 ? `Далее: ${queued.slice(1).join(" → ")}` : "Ожидает запуска"}</em></span></button>`;
  }
  const next = this._nextPhysicalZone(entities);
  if (next) {
    const entity = entities.zones[next.zone]?.schedule;
    const attribute = entity ? ` data-entity="${this.esc(entity)}"` : "";
    return `<button class="systemCompactItem"${attribute}><ha-icon icon="mdi:calendar-clock"></ha-icon><span><small>Следующая по программе</small><b>Зона ${next.zone}</b><em>${this.esc(next.label)}</em></span></button>`;
  }
  return '<div class="systemCompactItem"><ha-icon icon="mdi:calendar-remove-outline"></ha-icon><span><small>Следующая по программе</small><b>Не запланирована</b><em>Нет ближайших запусков</em></span></div>';
};

p.statusView = function statusViewV0659(entities) {
  if (this._systemSettingsOpen) return this._systemSettingsView(entities);
  const content = previousStatusView.call(this, entities)
    .replace(/<button class="systemCompactItem"[\s\S]*?<\/button>/, this._systemZoneSummaryCard(entities));
  const action = '<button type="button" class="systemSettingsButton" data-system-settings><ha-icon icon="mdi:cog-outline"></ha-icon><span><b>Настройки</b><small>Зоны, картинки и параметры</small></span><ha-icon icon="mdi:chevron-right"></ha-icon></button>';
  const end = content.lastIndexOf("</div>");
  return end < 0 ? `${content}${action}` : `${content.slice(0, end)}${action}${content.slice(end)}`;
};

p._systemSettingsView = function systemSettingsViewV0659(entities) {
  const zones = this._physicalZoneNumbers();
  const buttons = Array.from({ length: 8 }, (_, index) => index + 1).map((zone) => {
    const selected = zones.includes(zone);
    return `<button type="button" class="${selected ? "active" : ""}" data-physical-zone-toggle="${zone}" role="switch" aria-checked="${selected}" aria-label="${selected ? "Скрыть" : "Показать"} зону ${zone}">${zone}</button>`;
  }).join("");
  const artworkRows = zones.map((zone) => `<button type="button" class="settingsArtworkRow" data-zone-artwork-open="${zone}"><span class="scene scene${zone}" aria-hidden="true"></span><span><small>ЗОНА ${zone}</small><b>Картинка зоны</b></span><ha-icon icon="mdi:image-edit-outline"></ha-icon></button>`).join("");
  const seasonal = this.state(entities.seasonal);
  const seasonalAvailable = this.commandAvailable("set_seasonal_adjustment") && !this.bad(seasonal);
  const seasonalValue = this._seasonalDraft === null ? (this.bad(seasonal) ? "" : seasonal) : this._seasonalDraft;
  const rain = this.rainPresentation(entities);
  const overlay = this._zoneArtworkPickerZone
    ? artworkSheet(previousProgramZoneForm.call(this, entities, this._zoneArtworkPickerZone), this._zoneArtworkPickerZone).overlay
    : "";
  return `<div class="settingsScreen">
    <button type="button" class="inlineBack" data-settings-back><ha-icon icon="mdi:arrow-left"></ha-icon>Система</button>
    <div class="pageIntro settingsIntro"><small>НАСТРОЙКИ</small><h2>Параметры автополива</h2><p>Состав зон и оформление хранятся в этом браузере. Сезонная коррекция передаётся контроллеру с подтверждением.</p></div>
    <section class="settingsCard"><div class="settingsSectionHead"><span><small>ФИЗИЧЕСКИЕ ЗОНЫ</small><b>${zones.length} из 8 подключено</b></span></div><div class="physicalZoneButtons" aria-label="Физически подключённые зоны">${buttons}</div><p>Во всех рабочих вкладках отображаются только отмеченные зоны.</p></section>
    <section class="settingsCard"><div class="settingsSectionHead"><span><small>ОФОРМЛЕНИЕ</small><b>Картинки зон</b></span></div><div class="settingsArtworkList">${artworkRows}</div></section>
    <section class="settingsCard"><div class="settingsSectionHead"><span><small>ОБЩИЕ ПАРАМЕТРЫ</small><b>Контроллер</b></span></div><div class="settingsParameterGrid">
      <button type="button" data-entity="${this.esc(entities.operation)}"><small>Режим</small><b>${this.esc(this.human("operation", this.state(entities.operation)))}</b></button>
      <button type="button" data-entity="${this.esc(entities.rain)}"><small>Датчик дождя</small><b>${this.esc(rain.label)}</b></button>
    </div><div class="settingsSeasonal"><span><small>Сезонная коррекция</small><em>Общее значение для всех зон</em></span><label><input data-season-value type="number" inputmode="numeric" min="-90" max="100" step="10" value="${this.esc(seasonalValue)}" aria-label="Сезонная коррекция, процентов" ${seasonalAvailable ? "" : "disabled"}><b>%</b></label><button type="button" data-season-apply ${seasonalAvailable ? "" : "disabled"}>${this._seasonalBusy ? "Проверка…" : "Применить"}</button></div></section>
    ${overlay}
  </div>`;
};

p._programZoneNumber = function programZoneNumberV0659() {
  const zones = this._physicalZoneNumbers();
  const selected = Number(this._programZone);
  return zones.includes(selected) ? selected : zones[0];
};

p.programView = function programViewV0659(entities) {
  const zones = this._physicalZoneNumbers();
  const zone = this._programZoneNumber();
  const buttons = zones.map((number) => {
    const selected = number === zone;
    return `<button type="button" class="${selected ? "active" : ""}" data-program-zone="${number}" aria-label="Показать программу зоны ${number}" aria-pressed="${selected}">${number}</button>`;
  }).join("");
  return `<nav class="programZoneTabs" style="--physical-zone-count:${zones.length}" aria-label="Выбор зоны">${buttons}</nav>
    <div class="programSectionBody programZoneBody">${this._programZoneForm(entities, zone)}</div>`;
};

function artworkSheet(markup, zone) {
  const dialogStart = markup.indexOf('<dialog class="zoneArtworkDialog"');
  if (dialogStart < 0) return { form: markup, overlay: "" };
  const form = markup.slice(0, dialogStart);
  if (zone === null) return { form, overlay: "" };
  const dialog = markup.slice(dialogStart);
  const innerStart = dialog.indexOf(">");
  const innerEnd = dialog.lastIndexOf("</dialog>");
  if (innerStart < 0 || innerEnd < 0) return { form, overlay: "" };
  const sheet = dialog.slice(innerStart + 1, innerEnd)
    .replace('<form method="dialog" class="zoneArtworkSheet">', `<section class="zoneArtworkSheet" role="dialog" aria-modal="true" aria-label="Картинка зоны ${zone}">`)
    .replace("</form>", "</section>")
    .replace('type="submit" aria-label="Закрыть"', 'type="button" data-zone-artwork-close aria-label="Закрыть"');
  return {
    form,
    overlay: `<div class="zoneArtworkOverlay" data-zone-artwork-overlay="${zone}" role="presentation">${sheet}</div>`,
  };
}

p._programZoneForm = function programZoneFormV0659(entities, zone) {
  const markup = previousProgramZoneForm.call(this, entities, zone);
  const parts = artworkSheet(markup, null);
  return parts.form.replace(
    /<button type="button" class="scene scene\d+ zoneProgramScene zoneArtworkButton"[\s\S]*?<\/button>/,
    `<span class="scene scene${zone} zoneProgramScene" aria-hidden="true"></span>`,
  );
};

p._structureKey = function structureKeyV0659() {
  const key = previousStructureKey.call(this);
  if (this._view === "status" && this._systemSettingsOpen) {
    return `status:settings${this._zoneArtworkPickerZone ? `:artwork:${this._zoneArtworkPickerZone}` : ""}`;
  }
  return key;
};

p._closeZoneArtworkPicker = function closeZoneArtworkPickerV0659() {
  if (!this._zoneArtworkPickerZone) return;
  this._zoneArtworkPickerZone = null;
  this.render();
};

p._ensureZoneArtworkOverlayEvents = function ensureZoneArtworkOverlayEventsV0659() {
  if (this._zoneArtworkOverlayEventsBound) return;
  this._zoneArtworkOverlayEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const settings = event.target.closest?.("[data-system-settings]");
    if (settings) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this._systemSettingsOpen = true;
      this._pendingScrollTop = 0;
      this.render();
      return;
    }
    const settingsBack = event.target.closest?.("[data-settings-back]");
    if (settingsBack) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this._systemSettingsOpen = false;
      this._zoneArtworkPickerZone = null;
      this._pendingScrollTop = 0;
      this.render();
      return;
    }
    const navigation = event.target.closest?.("[data-view]");
    if (navigation && this._systemSettingsOpen) {
      this._systemSettingsOpen = false;
      this._zoneArtworkPickerZone = null;
      if (navigation.dataset.view === "status") {
        event.preventDefault();
        event.stopImmediatePropagation();
        this._pendingScrollTop = 0;
        this.render();
        return;
      }
    }
    const physicalZone = event.target.closest?.("[data-physical-zone-toggle]");
    if (physicalZone) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this._togglePhysicalZone(Number(physicalZone.dataset.physicalZoneToggle));
      return;
    }
    const open = event.target.closest?.("[data-zone-artwork-open]");
    if (open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const zone = Number(open.dataset.zoneArtworkOpen);
      if (!Number.isInteger(zone) || zone < 1 || zone > 8) return;
      this._zoneArtworkPickerZone = zone;
      this.render();
      requestAnimationFrame(() => this.shadowRoot.querySelector("[data-zone-artwork-close]")?.focus());
      return;
    }
    const option = event.target.closest?.("[data-zone-artwork-choice]");
    if (option) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const zone = Number(option.dataset.zoneArtworkZone);
      this._setZoneArtwork(zone, option.dataset.zoneArtworkChoice);
      this._zoneArtworkPickerZone = null;
      this.render();
      return;
    }
    const close = event.target.closest?.("[data-zone-artwork-close]");
    const backdrop = event.target.matches?.("[data-zone-artwork-overlay]");
    if (!close && !backdrop) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this._closeZoneArtworkPicker();
  }, true);
  this.shadowRoot.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !this._zoneArtworkPickerZone) return;
    event.preventDefault();
    this._closeZoneArtworkPicker();
  }, true);
};

p.zonesView = function zonesViewV0659(entities) {
  if (this._drillZone) return this.zoneDetail(entities, this._drillZone);
  const zones = this._physicalZoneNumbers();
  const cards = zones.map((zone) => {
    const runtime = this.zoneRuntime(entities, zone);
    const startTimes = runtime.starts.length
      ? `<span class="zoneCardTimes">${this.esc(runtime.start)}</span>`
      : '<span class="zoneCardTimes muted">Нет запусков</span>';
    const entity = runtime.q.schedule ? ` data-entity="${this.esc(runtime.q.schedule)}"` : "";
    return `<button class="zoneCard ${runtime.tone}" data-zone="${zone}"${entity}><span class="scene scene${zone}" aria-hidden="true"></span><span class="zoneCardText"><small>ЗОНА ${zone}</small><b>${this.esc(runtime.label)}</b><em>${this.esc(runtime.duration)} мин</em>${startTimes}</span>${this._zoneIndicators(runtime)}<ha-icon class="zoneChevron" icon="mdi:chevron-right"></ha-icon></button>`;
  }).join("");
  return `<div class="pageIntro"><small>ИСПОЛЬЗУЕМЫЕ ЗОНЫ · ${zones.length}</small><h2>Рабочие зоны</h2><p>Фактическое состояние и программа каждого подключённого канала.</p></div><div class="zoneCards">${cards}</div>`;
};

p.selectedManualZones = function selectedManualZonesV0659() {
  const physical = new Set(this._physicalZoneNumbers());
  return [...new Set(this._manualQueue || [])]
    .map(Number)
    .filter((zone) => Number.isInteger(zone) && zone >= 1 && zone <= 8 && physical.has(zone))
    .sort((a, b) => a - b);
};

p.manualView = function manualViewV0659(entities) {
  const runtime = this.activeRuntime(entities);
  const physicalZones = this._physicalZoneNumbers();
  const displayZones = runtime && !physicalZones.includes(runtime.zone)
    ? [...physicalZones, runtime.zone].sort((a, b) => a - b)
    : physicalZones;
  for (const zone of displayZones) {
    if (!Number.isFinite(Number(this._manualDurations?.[zone]))) {
      const duration = Number(this.zoneRuntime(entities, zone).duration || 10);
      this._manualDurations = { ...this._manualDurations, [zone]: duration };
    }
  }
  const localSelection = this._manualQueue || [];
  const selected = new Set(runtime
    ? localSelection.map(Number).filter((zone) => zone >= runtime.zone && physicalZones.includes(zone))
    : localSelection.map(Number).filter((zone) => physicalZones.includes(zone)));
  const watering = Boolean(runtime);
  const cards = displayZones.map((zone) => {
    const item = this.zoneRuntime(entities, zone);
    const active = runtime?.zone === zone;
    const enabled = selected.has(zone) || active;
    const duration = Number(this._manualDurations?.[zone] || item.duration || 10);
    const timeDisabled = !enabled || watering;
    const switchDisabled = watering ? (!active || !this.commandAvailable("skip_current_manual")) : false;
    const switchLabel = active
      ? `Остановить зону ${zone} и перейти к следующей`
      : `${enabled ? "Исключить" : "Включить"} зону ${zone}`;
    return `<article class="manualZoneCard ${enabled ? "selected" : ""} ${active ? "running" : ""}" data-manual-zone-card="${zone}">
      <span class="scene scene${zone}" aria-hidden="true"></span>
      <span class="manualZoneIdentity"><small>ЗОНА ${zone}</small><b>${active ? "Полив" : "Готова"}</b></span>
      <span class="manualDuration" aria-label="Длительность зоны ${zone}">
        <button type="button" class="manualTimeButton" data-queue-step="-1" data-queue-id="${zone}" ${timeDisabled ? "disabled" : ""} aria-label="Уменьшить время зоны ${zone}">−</button>
        <strong>${duration}<small>мин</small></strong>
        <button type="button" class="manualTimeButton" data-queue-step="1" data-queue-id="${zone}" ${timeDisabled ? "disabled" : ""} aria-label="Увеличить время зоны ${zone}">+</button>
      </span>
      <button type="button" class="manualZoneSwitch ${enabled ? "on" : ""}" data-queue-toggle="${zone}" role="switch" aria-checked="${enabled}" ${switchDisabled ? "disabled" : ""} aria-label="${switchLabel}"><span></span></button>
    </article>`;
  }).join("");
  const total = [...selected].reduce((sum, zone) => sum + Number(this._manualDurations?.[zone] || 0), 0);
  const startDisabled = selected.size === 0 || this._manualBusy || !this.commandAvailable("start_manual_queue");
  const topAction = watering
    ? `<button type="button" class="manualStartTop" data-manual-stop ${this._manualBusy || !this.commandAvailable("stop_manual") ? "disabled" : ""}><ha-icon icon="mdi:stop"></ha-icon><span>Стоп всё</span><small>очередь</small></button>`
    : `<button type="button" class="manualStartTop" data-manual-start ${startDisabled ? "disabled" : ""}><ha-icon icon="mdi:play"></ha-icon><span>Старт</span><small>${total ? `${total} мин` : ""}</small></button>`;
  return `<section class="manualApprovedScreen">
    <div class="manualApprovedIntro">
      <div><small>РУЧНОЙ РЕЖИМ</small><h1>Управление зонами</h1><p>Включите нужные зоны и задайте длительность.<br>Контроллер выполнит их по порядку сверху вниз.</p></div>
      ${topAction}
    </div>
    <div class="manualZoneCards" style="--physical-zone-count:${physicalZones.length}">${cards}</div>
  </section>`;
};

p._render = function renderV0659() {
  previousRender.call(this);
  this._ensureZoneArtworkOverlayEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0659() {
  return `${previousStyles.call(this)}
    /* UI v0.6.59 — stable artwork sheet and complete read-only zone list. */
    .zoneArtworkOverlay{position:fixed;inset:0;z-index:1000;display:grid;align-items:end;justify-items:center;padding:14px;background:#11182775;backdrop-filter:blur(3px)}
    .zoneArtworkOverlay .zoneArtworkSheet{width:min(460px,100%);max-height:calc(100dvh - 28px);overflow:auto;border-radius:23px;background:var(--card);color:var(--text);box-shadow:0 22px 70px #1118274a}
    .systemSettingsButton{position:fixed;z-index:19;left:max(14px,calc((100vw - 892px)/2));right:max(14px,calc((100vw - 892px)/2));bottom:calc(82px + env(safe-area-inset-bottom));display:grid;grid-template-columns:34px minmax(0,1fr) 24px;align-items:center;gap:10px;min-height:58px;padding:9px 14px;border:1px solid color-mix(in srgb,var(--a) 34%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--card) 93%,var(--a) 7%);color:var(--a);text-align:left;box-shadow:0 9px 28px #1118271f;backdrop-filter:blur(16px)}.systemSettingsButton>ha-icon:first-child{--mdc-icon-size:29px}.systemSettingsButton>span{display:grid;gap:1px}.systemSettingsButton b{font-size:16px}.systemSettingsButton small{color:var(--muted);font-size:10px}.systemSettingsButton>ha-icon:last-child{--mdc-icon-size:22px}.settingsScreen{display:grid;gap:10px;padding-bottom:72px}.settingsScreen>.inlineBack{justify-self:start;margin-bottom:0}.settingsIntro{padding-bottom:4px}.settingsCard{display:grid;gap:10px;padding:13px;border:1px solid var(--line);border-radius:19px;background:var(--card);box-shadow:0 5px 16px #11182708}.settingsSectionHead span{display:grid;gap:3px}.settingsSectionHead small{color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.09em}.settingsSectionHead b{font-size:17px}.settingsCard>p{margin:0;color:var(--muted);font-size:10px;line-height:1.3}.physicalZoneButtons{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px}.physicalZoneButtons button{display:grid;place-items:center;min-width:0;min-height:38px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--muted);font-weight:800}.physicalZoneButtons button.active{border-color:color-mix(in srgb,var(--a) 42%,var(--line));background:var(--accent-soft);color:var(--a)}.settingsArtworkList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.settingsArtworkRow{display:grid;grid-template-columns:54px minmax(0,1fr) 24px;align-items:center;gap:9px;min-height:68px;padding:7px;border:1px solid var(--line);border-radius:15px;background:var(--soft);text-align:left}.settingsArtworkRow .scene{width:54px;height:54px}.settingsArtworkRow>span:nth-child(2){display:grid;gap:2px}.settingsArtworkRow small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.07em}.settingsArtworkRow b{font-size:13px}.settingsArtworkRow>ha-icon{color:var(--a);--mdc-icon-size:21px}.settingsParameterGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.settingsParameterGrid button{display:grid;gap:3px;padding:10px;border:1px solid var(--line);border-radius:14px;background:var(--soft);text-align:left}.settingsParameterGrid small,.settingsSeasonal small{color:var(--muted);font-size:10px}.settingsParameterGrid b{font-size:14px}.settingsSeasonal{display:grid;grid-template-columns:minmax(0,1fr) 92px minmax(100px,.8fr);align-items:center;gap:7px}.settingsSeasonal>span{display:grid;gap:2px}.settingsSeasonal em{color:var(--muted);font-size:9px;font-style:normal}.settingsSeasonal label{display:grid;grid-template-columns:1fr auto;align-items:center;min-height:42px;padding:0 10px;border:1px solid var(--line);border-radius:13px;background:var(--soft)}.settingsSeasonal input{min-width:0;width:100%;border:0;outline:0;background:transparent;color:var(--text);font-size:18px;font-weight:800;text-align:right}.settingsSeasonal button{min-height:42px;border:1px solid color-mix(in srgb,var(--a) 48%,var(--line));border-radius:13px;background:var(--accent-soft);color:var(--a);font-weight:800}.settingsSeasonal button:disabled{opacity:.5}.programZoneTabs{grid-template-columns:repeat(var(--physical-zone-count),minmax(0,1fr))}.manualZoneCards{height:auto!important;grid-template-rows:none!important;grid-auto-rows:minmax(92px,auto)}
    @media(min-width:600px){.zoneArtworkOverlay{align-items:center}}
    @media(max-width:520px){.systemSettingsButton{left:10px;right:10px}.physicalZoneButtons{gap:3px}.physicalZoneButtons button{min-height:34px;border-radius:9px;font-size:13px}.settingsArtworkList{grid-template-columns:1fr}.settingsSeasonal{grid-template-columns:minmax(0,1fr) 78px}.settingsSeasonal>button{grid-column:1/3}.settingsArtworkRow{min-height:64px}}
  `;
};
