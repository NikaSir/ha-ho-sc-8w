import "./irrigation-panel-v0651.mjs";

const UI_VERSION = "0.6.52";
const DAY_MS = 86_400_000;
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

const parseLocalDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return parsed;
};

const formatLocalDate = (value) => {
  const parsed = parseLocalDate(value);
  if (!parsed) return value ? "Некорректная дата" : "Не задана";
  return `${String(parsed.getDate()).padStart(2, "0")}.${String(parsed.getMonth() + 1).padStart(2, "0")}.${parsed.getFullYear()}`;
};

const dayWord = (value) => {
  const amount = Math.abs(Number(value));
  if (amount % 10 === 1 && amount % 100 !== 11) return "день";
  if ([2, 3, 4].includes(amount % 10) && ![12, 13, 14].includes(amount % 100)) return "дня";
  return "дней";
};

const startWord = (value) => {
  const amount = Math.abs(Number(value));
  if (amount % 10 === 1 && amount % 100 !== 11) return "запуск";
  if ([2, 3, 4].includes(amount % 10) && ![12, 13, 14].includes(amount % 100)) return "запуска";
  return "запусков";
};

p._zoneProgramSlots = function zoneProgramSlots(attrs) {
  const explicit = Array.isArray(attrs.start_slots) ? attrs.start_slots : [];
  const compact = Array.isArray(attrs.start_times) ? attrs.start_times.filter(Boolean) : [];
  return Array.from({ length: 6 }, (_, index) => {
    const raw = explicit.length ? explicit[index] : compact[index];
    const value = raw === null || raw === undefined || raw === "" ? "" : String(raw);
    return {
      index: index + 1,
      value,
      present: Boolean(value),
      valid: !value || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value),
    };
  });
};

p._zoneCyclePresentation = function zoneCyclePresentation(attrs) {
  const mode = String(attrs.calendar_mode || attrs.cycle_mode || "unknown");
  const rawMode = Number(attrs.cycle_mode_raw);
  const cycleValue = Number(attrs.cycle_value);
  if (mode === "interval") {
    const interval = Number(attrs.interval_days ?? attrs.cycle_value);
    if (!Number.isInteger(interval) || interval < 1) {
      return { mode, value: "Интервал не задан", detail: "Проверьте значение цикла" };
    }
    return {
      mode,
      value: interval === 1 ? "Каждый день" : `Каждые ${interval} ${dayWord(interval)}`,
      detail: `Период: ${interval} ${dayWord(interval)}`,
    };
  }
  if (mode === "weekly") {
    const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const selected = weekdays.filter((_label, index) => Number.isInteger(cycleValue) && (cycleValue & (1 << index)) !== 0);
    return {
      mode,
      value: "По дням недели",
      detail: selected.length === 7 ? "Все дни недели" : selected.length ? selected.join(" · ") : "Дни не выбраны",
    };
  }
  if (mode === "odd") return { mode, value: "По нечётным датам", detail: "Нечётные числа месяца" };
  if (mode === "even") return { mode, value: "По чётным датам", detail: "Чётные числа месяца" };
  if (mode === "disabled") return { mode, value: "Выключен", detail: "Повтор не задан" };
  return {
    mode,
    value: "Неизвестный режим",
    detail: Number.isFinite(rawMode) ? `Код режима: ${rawMode}` : "Нет данных",
  };
};

p._zoneRunsOnDate = function zoneRunsOnDate(date, attrs, cycle) {
  if (cycle.mode === "weekly") {
    const mask = Number(attrs.cycle_value);
    return Number.isInteger(mask) && mask > 0 && (mask & (1 << date.getDay())) !== 0;
  }
  if (cycle.mode === "odd") return date.getDate() % 2 === 1;
  if (cycle.mode === "even") return date.getDate() % 2 === 0;
  if (cycle.mode !== "interval") return false;
  const interval = Number(attrs.interval_days ?? attrs.cycle_value);
  const anchor = parseLocalDate(attrs.anchor_date || attrs.interval_start);
  if (!anchor || !Number.isInteger(interval) || interval < 1) return false;
  const currentDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const elapsedDays = Math.round((currentDay.getTime() - anchor.getTime()) / DAY_MS);
  return elapsedDays >= 0 && elapsedDays % interval === 0;
};

p._zoneNextStart = function zoneNextStart(attrs, enabled) {
  if (!enabled) return { value: "Не запланирован", detail: "Программа зоны выключена" };
  const slots = this._zoneProgramSlots(attrs);
  const starts = slots
    .filter((slot) => slot.present && slot.valid)
    .map((slot) => {
      const [hour, minute] = slot.value.split(":").map(Number);
      return { hour, minute, value: slot.value };
    })
    .sort((left, right) => left.hour - right.hour || left.minute - right.minute);
  if (!starts.length) {
    const hasInvalid = slots.some((slot) => slot.present && !slot.valid);
    return {
      value: hasInvalid ? "Не рассчитан" : "Не запланирован",
      detail: hasInvalid ? "Есть некорректное время" : "Время запуска не задано",
    };
  }
  const cycle = this._zoneCyclePresentation(attrs);
  if (!["interval", "weekly", "odd", "even"].includes(cycle.mode)) {
    return { value: "Не рассчитан", detail: "Неизвестный режим повторения" };
  }
  if (cycle.mode === "interval" && !parseLocalDate(attrs.anchor_date || attrs.interval_start)) {
    return { value: "Не рассчитан", detail: "Не задана дата начала цикла" };
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  for (let offset = 0; offset <= 800; offset += 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12, 0, 0, 0);
    if (!this._zoneRunsOnDate(day, attrs, cycle)) continue;
    for (const start of starts) {
      const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), start.hour, start.minute, 0, 0);
      if (candidate.getTime() <= now.getTime()) continue;
      const dayLabel = offset === 0 ? "Сегодня" : offset === 1 ? "Завтра" : new Intl.DateTimeFormat("ru-RU", {
        weekday: "short", day: "numeric", month: "short",
      }).format(candidate);
      return { value: `${dayLabel}, ${start.value}`, detail: "Расчёт по программе" };
    }
  }
  return { value: "Не рассчитан", detail: "В пределах ближайших 800 дней запусков нет" };
};

p.zoneDetail = function zoneDetailV0652(e, zone) {
  const z = this.zoneRuntime(e, zone);
  const attrs = z.attrs;
  const enabled = this.state(z.q.schedule) === "configured";
  const slots = this._zoneProgramSlots(attrs);
  const startsCount = slots.filter((slot) => slot.present).length;
  const cycle = this._zoneCyclePresentation(attrs);
  const nextStart = this._zoneNextStart(attrs, enabled);
  const seasonalRaw = this.state(e.seasonal);
  const seasonal = this.bad(seasonalRaw) ? "Нет данных" : `${seasonalRaw} %`;
  const rain = attrs.rain_sensor_follow === true ? "Учитывается"
    : attrs.rain_sensor_follow === false ? "Не учитывается" : "Нет данных";
  const statusIcon = z.tone === "running" ? "mdi:water" : z.tone === "queued" ? "mdi:clock-outline"
    : z.tone === "unknown" || z.tone === "off" ? "mdi:help-circle-outline" : "mdi:check-circle";
  const slotCards = slots.map((slot) => `<div class="zoneProgramSlot ${slot.present ? "filled" : "empty"} ${slot.valid ? "" : "invalid"}">
    <small>Запуск ${slot.index}</small>
    <b>${slot.present ? this.esc(slot.value) : "Не задан"}</b>
  </div>`).join("");
  return `<button class="inlineBack" data-drill-back><ha-icon icon="mdi:arrow-left"></ha-icon>Зоны</button>
    <section class="detailCard zoneProgramDetail">
      <div class="zoneProgramHero">
        <span class="scene scene${zone} zoneProgramScene" aria-hidden="true"></span>
        <div class="zoneProgramIdentity">
          <small>ЗОНА ${zone}</small>
          <h2>Зона ${zone}</h2>
          <span class="zoneProgramStatus ${this.esc(z.tone)}"><ha-icon icon="${statusIcon}"></ha-icon>${this.esc(z.label)}</span>
          <span class="zoneProgramCount">${startsCount} ${startWord(startsCount)}</span>
        </div>
      </div>

      <div class="zoneProgramFacts">
        <article class="zoneProgramFact"><small>Базовая длительность</small><b>${this.esc(z.duration)} мин</b><span>До сезонной коррекции</span></article>
        <article class="zoneProgramFact"><small>Сезонная коррекция</small><b>${this.esc(seasonal)}</b><span>Общая для контроллера</span></article>
        <article class="zoneProgramFact"><small>Повтор</small><b>${this.esc(cycle.value)}</b><span>${this.esc(cycle.detail)}</span></article>
        <article class="zoneProgramFact"><small>Дата начала цикла</small><b>${this.esc(formatLocalDate(attrs.anchor_date || attrs.interval_start))}</b><span>Опорная дата программы</span></article>
        <article class="zoneProgramFact"><small>Датчик дождя</small><b>${rain}</b><span>Правило этой зоны</span></article>
        <article class="zoneProgramFact next"><small>Ближайший запуск</small><b>${this.esc(nextStart.value)}</b><span>${this.esc(nextStart.detail)}</span></article>
      </div>

      <section class="zoneProgramStarts" aria-label="Все времена запуска">
        <div class="zoneProgramStartsHead"><span><small>ВРЕМЯ ЗАПУСКА</small><h3>Все шесть слотов</h3></span><b>${startsCount} из 6</b></div>
        <div class="zoneProgramSlots">${slotCards}</div>
      </section>
      <p class="zoneProgramNote"><ha-icon icon="mdi:eye-outline"></ha-icon><span>Параметры доступны только для просмотра. Ближайший запуск рассчитан по сохранённой программе; фактический полив зависит от режима контроллера и датчика дождя.</span></p>
    </section>`;
};

p._render = function renderV0652() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0652() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0652() {
  return `${previousStyles.call(this)}
    /* UI v0.6.52 — complete decoded zone program form. */
    .zoneProgramDetail{min-height:0!important;display:grid;gap:14px;padding:16px!important}
    .zoneProgramHero{display:grid;grid-template-columns:112px minmax(0,1fr);align-items:stretch;gap:14px}
    .zoneProgramScene{display:block!important;width:112px!important;height:112px!important;align-self:stretch;border:1px solid var(--line);border-radius:17px!important;background-position:center!important;background-size:cover!important;background-repeat:no-repeat!important;background-color:var(--soft)!important;box-shadow:inset 0 0 0 1px #ffffff35,0 5px 14px #11182712}
    .zoneProgramIdentity{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto auto;align-content:center;gap:5px 8px;min-width:0;padding:2px 0}
    .zoneProgramIdentity>small{grid-column:1/3;color:var(--muted);font-size:12px;font-weight:800;letter-spacing:.11em}
    .zoneProgramIdentity h2{grid-column:1/3;margin:0;color:var(--text);font-size:25px;line-height:1.05}
    .zoneProgramStatus,.zoneProgramCount{display:inline-flex;align-items:center;min-height:30px;border-radius:999px;font-size:12px;font-weight:800;white-space:nowrap}
    .zoneProgramStatus{gap:5px;justify-self:start;padding:4px 9px;background:var(--green-soft);color:var(--green)}.zoneProgramStatus ha-icon{--mdc-icon-size:18px}
    .zoneProgramStatus.running,.zoneProgramStatus.queued{background:var(--accent-soft);color:var(--a)}.zoneProgramStatus.unknown,.zoneProgramStatus.off{background:var(--soft);color:var(--muted)}
    .zoneProgramCount{justify-self:end;padding:4px 10px;background:var(--soft);color:var(--muted)}
    .zoneProgramFacts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .zoneProgramFact{display:grid;align-content:start;gap:4px;min-height:86px;padding:11px 12px;border:1px solid color-mix(in srgb,var(--line) 80%,transparent);border-radius:15px;background:var(--soft)}
    .zoneProgramFact>small{color:var(--muted);font-size:12px;font-weight:650}.zoneProgramFact>b{color:var(--text);font-size:15px;line-height:1.18}.zoneProgramFact>span{color:var(--muted);font-size:12px;line-height:1.25}
    .zoneProgramFact.next{background:color-mix(in srgb,var(--a) 7%,var(--card));border-color:color-mix(in srgb,var(--a) 18%,var(--line))}.zoneProgramFact.next>b{color:var(--a)}
    .zoneProgramStarts{display:grid;gap:9px;padding:12px;border:1px solid var(--line);border-radius:17px;background:var(--card)}
    .zoneProgramStartsHead{display:flex;align-items:end;justify-content:space-between;gap:12px}.zoneProgramStartsHead small{display:block;color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.1em}.zoneProgramStartsHead h3{margin:3px 0 0;font-size:17px;line-height:1.1}.zoneProgramStartsHead>b{padding:5px 9px;border-radius:999px;background:var(--soft);color:var(--muted);font-size:12px;white-space:nowrap}
    .zoneProgramSlots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.zoneProgramSlot{display:grid;gap:3px;min-width:0;padding:9px 10px;border-radius:13px;background:var(--soft)}.zoneProgramSlot small{color:var(--muted);font-size:11px}.zoneProgramSlot b{overflow:hidden;color:var(--text);font-size:14px;line-height:1.15;text-overflow:ellipsis}.zoneProgramSlot.empty b{color:var(--muted);font-weight:600}.zoneProgramSlot.invalid{background:color-mix(in srgb,var(--danger) 8%,var(--card));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--danger) 24%,transparent)}.zoneProgramSlot.invalid b{color:var(--danger)}
    .zoneProgramNote{display:grid;grid-template-columns:24px minmax(0,1fr);align-items:start;gap:8px;margin:0!important;padding:11px 12px;border-radius:15px;background:var(--soft);color:var(--muted)!important;font-size:12px!important;line-height:1.38!important}.zoneProgramNote ha-icon{--mdc-icon-size:22px;color:var(--a)}
    @media(max-width:520px){
      .zoneProgramDetail{gap:11px;padding:13px!important}.zoneProgramHero{grid-template-columns:94px minmax(0,1fr);gap:11px}.zoneProgramScene{width:94px!important;height:94px!important;border-radius:15px!important}.zoneProgramIdentity{gap:4px 6px}.zoneProgramIdentity h2{font-size:22px}.zoneProgramStatus,.zoneProgramCount{min-height:27px;padding:3px 7px;font-size:11px}.zoneProgramStatus ha-icon{--mdc-icon-size:16px}
      .zoneProgramFacts{gap:7px}.zoneProgramFact{min-height:82px;padding:10px}.zoneProgramFact>b{font-size:14px}.zoneProgramFact>small,.zoneProgramFact>span{font-size:11px}.zoneProgramSlots{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.zoneProgramSlot{padding:8px 9px}.zoneProgramStarts{padding:11px}.zoneProgramNote{padding:10px}
    }
  `;
};
