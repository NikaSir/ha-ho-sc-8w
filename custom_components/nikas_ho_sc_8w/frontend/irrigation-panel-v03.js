(() => {
  const VERSION = "0.3.0";
  const FALLBACK_PARENT = "/dashboard-actions";
  const BAD = new Set(["unknown", "unavailable", "", null, undefined]);

  class HOSC8WPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._panel = null;
      this._view = "overview";
    }

    set hass(value) {
      this._hass = value;
      this.render();
    }

    set panel(value) {
      this._panel = value;
      this.render();
    }

    set narrow(value) {
      this.toggleAttribute("narrow", Boolean(value));
    }

    connectedCallback() {
      this.render();
    }

    esc(value) {
      return String(value ?? "—").replace(
        /[&<>\"]/g,
        (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char],
      );
    }

    states() {
      return this._hass?.states || {};
    }

    entity(preferred, ...suffixes) {
      const states = this.states();
      if (preferred && states[preferred]) return preferred;
      const keys = Object.keys(states);
      for (const suffix of suffixes) {
        const hit = keys.find((key) => key.endsWith(suffix));
        if (hit) return hit;
      }
      return preferred || null;
    }

    state(entityId) {
      return entityId && this.states()[entityId]
        ? this.states()[entityId].state
        : "unavailable";
    }

    attrs(entityId) {
      return entityId && this.states()[entityId]
        ? this.states()[entityId].attributes || {}
        : {};
    }

    bad(value) {
      return BAD.has(value);
    }

    zoneSet(value) {
      if (this.bad(value) || value === "None") return new Set();
      return new Set(
        String(value)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      );
    }

    parentPath() {
      return this._panel?.config?.parent_path || FALLBACK_PARENT;
    }

    goBack() {
      window.location.assign(this.parentPath());
    }

    moreInfo(entityId) {
      if (!entityId || !this.states()[entityId]) return;
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId },
          bubbles: true,
          composed: true,
        }),
      );
    }

    entities() {
      const base = "sensor.kontroller_poliva_ho_sc_8w";
      const entities = {
        connection: this.entity(`${base}_connection_mode`, "_kontroller_poliva_ho_sc_8w_connection_mode"),
        operation: this.entity(`${base}_operation_mode`, "_kontroller_poliva_ho_sc_8w_operation_mode"),
        irrigation: this.entity(`${base}_irrigation_mode`, "_kontroller_poliva_ho_sc_8w_irrigation_mode"),
        active: this.entity(`${base}_active_zones`, "_kontroller_poliva_ho_sc_8w_active_zones"),
        queued: this.entity(`${base}_queued_zones`, "_kontroller_poliva_ho_sc_8w_queued_zones"),
        rain: this.entity(null, "_kontroller_poliva_ho_sc_8w_rain_sensor"),
        seasonal: this.entity(null, "_kontroller_poliva_ho_sc_8w_seasonal_adjustment"),
        timerError: this.entity(null, "_kontroller_poliva_ho_sc_8w_timer_error_alarm"),
        cache: this.entity(`${base}_schedule_cache`, "_kontroller_poliva_ho_sc_8w_schedule_cache"),
        zones: {},
      };
      for (let zone = 1; zone <= 8; zone += 1) {
        entities.zones[zone] = {
          remaining: this.entity(`${base}_zone_${zone}_time_remaining`, `_kontroller_poliva_ho_sc_8w_zone_${zone}_time_remaining`),
          elapsed: this.entity(`${base}_zone_${zone}_time_elapsed`, `_kontroller_poliva_ho_sc_8w_zone_${zone}_time_elapsed`),
          schedule: this.entity(`${base}_schedule_zone_${zone}`, `_kontroller_poliva_ho_sc_8w_schedule_zone_${zone}`),
        };
      }
      return entities;
    }

    human(kind, value) {
      if (this.bad(value)) return "Нет данных";
      const maps = {
        operation: { Auto: "Авто", Manual: "Ручной", OFF: "Выключен" },
        irrigation: { order: "По порядку" },
        rain: { enabled: "Включён", disabled: "Выключен", true: "Включён", false: "Выключен" },
        alarm: { clear: "Нет", false: "Нет", true: "Есть" },
        cache: { complete: "Полный", partial: "Неполный" },
        zones: { None: "Нет" },
      };
      return maps[kind]?.[String(value)] ?? String(value);
    }

    scheduleStatus(value) {
      if (value === "configured") return "Активна";
      if (value === "disabled") return "Выключена";
      if (this.bad(value)) return "Нет данных";
      return String(value);
    }

    starts(attrs) {
      return Array.isArray(attrs.start_times) ? attrs.start_times.filter(Boolean) : [];
    }

    compactStarts(attrs) {
      const starts = this.starts(attrs);
      if (!starts.length) return "Без запуска";
      return starts.length === 1 ? starts[0] : `${starts[0]} +${starts.length - 1}`;
    }

    rainText(value, compact = false) {
      if (value === true) return compact ? "дождь ✓" : "Учитывать";
      if (value === false) return compact ? "дождь ✕" : "Игнорировать";
      return compact ? "дождь —" : "—";
    }

    cycleText(attrs) {
      const mode = attrs.calendar_mode || attrs.cycle_mode || "—";
      if (mode === "interval" && attrs.interval_days) {
        const n = Number(attrs.interval_days);
        return `Каждые ${n} ${n === 1 ? "день" : n >= 2 && n <= 4 ? "дня" : "дней"}`;
      }
      if (mode === "odd") return "Нечётные дни";
      if (mode === "even") return "Чётные дни";
      if (mode === "weekly") return "По дням недели";
      if (mode === "disabled") return "Выключено";
      return String(mode);
    }

    parseDate(value) {
      if (!value || typeof value !== "string") return null;
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
    }

    dayOnly(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    eligibleDay(attrs, date) {
      const mode = attrs.calendar_mode || attrs.cycle_mode;
      if (mode === "disabled") return false;
      if (mode === "odd") return date.getDate() % 2 === 1;
      if (mode === "even") return date.getDate() % 2 === 0;
      if (mode === "weekly") return false;
      if (mode === "interval" && Number(attrs.interval_days) > 0) {
        const anchor = this.parseDate(attrs.interval_start || attrs.anchor_date || "");
        if (!anchor) return false;
        const diff = Math.round((this.dayOnly(date) - this.dayOnly(anchor)) / 86400000);
        return diff >= 0 && diff % Number(attrs.interval_days) === 0;
      }
      return false;
    }

    nextWatering(entities) {
      const now = new Date();
      let best = null;
      for (let zone = 1; zone <= 6; zone += 1) {
        const id = entities.zones[zone].schedule;
        if (this.state(id) !== "configured") continue;
        const attrs = this.attrs(id);
        for (let offset = 0; offset <= 35; offset += 1) {
          const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
          if (!this.eligibleDay(attrs, day)) continue;
          for (const start of this.starts(attrs)) {
            const match = String(start).match(/^(\d{1,2}):(\d{2})$/);
            if (!match) continue;
            const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(match[1]), Number(match[2]));
            if (candidate <= now) continue;
            if (!best || candidate < best.when) {
              best = { zone, when: candidate, time: start, duration: attrs.duration_min ?? "—", rain: attrs.rain_sensor_follow };
            }
          }
        }
      }
      return best;
    }

    relativeDay(date) {
      const diff = Math.round((this.dayOnly(date) - this.dayOnly(new Date())) / 86400000);
      if (diff === 0) return "Сегодня";
      if (diff === 1) return "Завтра";
      return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
    }

    header() {
      return `
        <header class="appHeader">
          <button class="backButton" data-back aria-label="Назад">
            <ha-icon icon="mdi:arrow-left"></ha-icon><span>Назад</span>
          </button>
          <div class="headerTitle">
            <strong>Полив</strong>
            <small>INKBIRD / HiOazo · HO-SC-8W</small>
          </div>
          <div class="headerMark" aria-hidden="true"><ha-icon icon="mdi:sprinkler-variant"></ha-icon></div>
        </header>
      `;
    }

    bottomNav() {
      const tabs = [
        ["overview", "mdi:home-outline", "Обзор"],
        ["zones", "mdi:sprinkler-variant", "Зоны"],
        ["programs", "mdi:calendar-clock", "Программы"],
        ["diagnostics", "mdi:stethoscope", "Диагн."],
      ];
      return `
        <nav class="bottomNav" aria-label="Разделы панели">
          <div class="bottomNavInner">
            ${tabs.map(([view, icon, label]) => `
              <button class="${this._view === view ? "active" : ""}" data-view="${view}" aria-current="${this._view === view ? "page" : "false"}">
                <ha-icon icon="${icon}"></ha-icon><span>${label}</span>
              </button>
            `).join("")}
          </div>
        </nav>
      `;
    }

    hero(entities) {
      const connection = this.state(entities.connection);
      const activeValue = this.state(entities.active);
      const queued = this.zoneSet(this.state(entities.queued));
      const active = this.zoneSet(activeValue);
      const zone = [...active][0];
      let cls = "ok", icon = "mdi:check", title = "Полив не идёт", sub = "Контроллер готов";
      if (this.bad(connection)) {
        cls = "danger"; icon = "mdi:alert"; title = "Контроллер недоступен"; sub = "Текущее состояние недостоверно";
      } else if (this.bad(activeValue)) {
        cls = "danger"; icon = "mdi:alert"; title = "Состояние неизвестно"; sub = "Runtime-данные неполные";
      } else if (zone) {
        cls = "active"; icon = "mdi:water"; title = `Полив идёт · зона ${zone}`; sub = queued.size ? `Далее: ${[...queued].join(", ")}` : "Очередь пуста";
      }
      let progress = "";
      if (zone) {
        const q = entities.zones[Number(zone)];
        const remaining = this.state(q.remaining), elapsed = this.state(q.elapsed);
        const total = (Number(remaining) || 0) + (Number(elapsed) || 0);
        const pct = total ? Math.min(100, ((Number(elapsed) || 0) / total) * 100) : 0;
        progress = `<div class="times"><span>Прошло <b>${this.esc(elapsed)} мин</b></span><span>Осталось <b>${this.esc(remaining)} мин</b></span></div><div class="bar"><i style="width:${pct}%"></i></div>`;
      }
      return `<section class="hero ${cls}"><div class="heroRow"><div class="orb"><ha-icon icon="${icon}"></ha-icon></div><div><small>ПОЛИВ СЕЙЧАС</small><h1>${this.esc(title)}</h1><p>${this.esc(sub)}</p></div></div>${progress}</section>`;
    }

    chip(label, display, entityId, tone = "") {
      return `<button class="chip ${tone}" data-entity="${this.esc(entityId)}"><small>${label}</small><strong>${this.esc(display)}</strong></button>`;
    }

    nextCard(entities) {
      if (this.bad(this.state(entities.connection))) return "";
      const next = this.nextWatering(entities);
      if (!next) return `<section class="next"><div><small>СЛЕДУЮЩИЙ ПОЛИВ</small><h2>Расчёт недоступен</h2><p>Для текущего типа программы недостаточно декодированных данных.</p></div></section>`;
      return `<section class="next"><div><small>СЛЕДУЮЩИЙ ПОЛИВ</small><h2>${this.esc(this.relativeDay(next.when))} · ${this.esc(next.time)}</h2><p>Зона ${next.zone} · база ${this.esc(next.duration)} мин · ${this.esc(this.rainText(next.rain, true))}</p></div><ha-icon icon="mdi:water-outline"></ha-icon></section>`;
    }

    overview(entities) {
      const active = this.zoneSet(this.state(entities.active));
      const queued = this.zoneSet(this.state(entities.queued));
      const rows = [];
      for (let zone = 1; zone <= 6; zone += 1) {
        const id = entities.zones[zone].schedule, st = this.state(id), a = this.attrs(id);
        const isActive = active.has(String(zone)), isQueued = queued.has(String(zone));
        const rem = this.state(entities.zones[zone].remaining);
        let detail = isActive ? `Полив · осталось ${rem} мин` : isQueued ? "В очереди" : st === "disabled" ? "Выключена" : this.bad(st) ? "Нет данных" : `${this.compactStarts(a)} · ${a.duration_min ?? "—"} мин · ${this.rainText(a.rain_sensor_follow, true)}`;
        rows.push(`<button class="zoneLine ${isActive ? "running" : ""}" data-entity="${this.esc(id)}"><span class="num">${zone}</span><span><b>Зона ${zone}</b><small>${this.esc(detail)}</small></span><ha-icon icon="mdi:chevron-right"></ha-icon></button>`);
      }
      const rain = this.state(entities.rain), seasonal = this.state(entities.seasonal);
      return `${this.hero(entities)}<div class="chips">${this.chip("Связь", this.bad(this.state(entities.connection)) ? "Нет данных" : this.state(entities.connection), entities.connection, this.state(entities.connection) === "local" ? "good" : "")}${this.chip("Режим", this.human("operation", this.state(entities.operation)), entities.operation)}${this.chip("Дождь", this.human("rain", rain), entities.rain)}${this.chip("Сезон", this.bad(seasonal) ? "Нет данных" : `${seasonal} %`, entities.seasonal)}</div>${this.nextCard(entities)}<div class="sectionHead"><h2>Зоны 1–6</h2><button data-view="zones">Все зоны</button></div><div class="zoneList">${rows.join("")}</div>`;
    }

    zones(entities) {
      const active = this.zoneSet(this.state(entities.active)), queued = this.zoneSet(this.state(entities.queued));
      let out = `<div class="intro"><h2>Зоны</h2><p>Рабочие каналы 1–6. Ручное управление появится только через подтверждённый API интеграции.</p></div><div class="cards">`;
      for (let zone = 1; zone <= 6; zone += 1) {
        const q = entities.zones[zone], id = q.schedule, st = this.state(id), a = this.attrs(id);
        const stateText = active.has(String(zone)) ? "Полив идёт" : queued.has(String(zone)) ? "В очереди" : st === "configured" ? "Готова" : st === "disabled" ? "Выключена" : "Нет достоверных данных";
        out += `<section class="card ${active.has(String(zone)) ? "activeCard" : ""}"><div class="cardHead"><span class="num">${zone}</span><div><h3>Зона ${zone}</h3><p>${stateText}</p></div><button class="more" data-entity="${this.esc(id)}" aria-label="Подробнее"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div><div class="metrics"><div><small>База</small><b>${this.esc(a.duration_min ?? "—")} мин</b></div><div><small>Прошло</small><b>${this.esc(this.state(q.elapsed))} мин</b></div><div><small>Осталось</small><b>${this.esc(this.state(q.remaining))} мин</b></div></div><div class="zoneMeta"><span><small>СТАРТ</small><b>${this.esc(this.starts(a).join(" · ") || "—")}</b></span><span><small>ЦИКЛ</small><b>${this.esc(this.cycleText(a))}</b></span><span><small>ДОЖДЬ</small><b>${this.esc(this.rainText(a.rain_sensor_follow))}</b></span></div></section>`;
      }
      return `${out}</div>`;
    }

    programs(entities) {
      const seasonal = this.state(entities.seasonal);
      let out = `<div class="intro"><div class="titleRow"><h2>Программы</h2><span class="readOnly">Только просмотр</span></div><p>Фактическое расписание контроллера из DP38 normal_time.</p></div><div class="season"><span>Сезонная коррекция</span><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b></div><div class="cards">`;
      for (let zone = 1; zone <= 6; zone += 1) {
        const id = entities.zones[zone].schedule, st = this.state(id), a = this.attrs(id), starts = this.starts(a);
        out += `<section class="card ${st === "disabled" ? "dim" : ""}"><div class="programHead"><span class="num">${zone}</span><div><h3>Зона ${zone}</h3><p>${st === "configured" ? this.esc(starts.join(" · ") || "Без времени") : this.scheduleStatus(st)}</p></div><span class="badge">${this.esc(this.scheduleStatus(st))}</span></div><div class="facts"><div><small>База</small><b>${this.esc(a.duration_min ?? "—")} мин</b></div><div><small>Цикл</small><b>${this.esc(this.cycleText(a))}</b></div><div><small>Начало цикла</small><b>${this.esc(a.interval_start ?? a.anchor_date ?? "—")}</b></div><div><small>Дождь</small><b>${this.esc(this.rainText(a.rain_sensor_follow))}</b></div></div><button class="details" data-entity="${this.esc(id)}">Подробнее в HA <ha-icon icon="mdi:chevron-right"></ha-icon></button></section>`;
      }
      return `${out}</div>`;
    }

    diagnostics(entities) {
      const rows = [
        ["Активное соединение", entities.connection, this.state(entities.connection), ""],
        ["Режим контроллера", entities.operation, this.state(entities.operation), "operation"],
        ["Порядок полива", entities.irrigation, this.state(entities.irrigation), "irrigation"],
        ["Активные зоны", entities.active, this.state(entities.active), "zones"],
        ["Очередь зон", entities.queued, this.state(entities.queued), "zones"],
        ["Кэш расписания", entities.cache, this.state(entities.cache), "cache"],
        ["Датчик дождя", entities.rain, this.state(entities.rain), "rain"],
        ["Ошибка таймера", entities.timerError, this.state(entities.timerError), "alarm"],
      ];
      const z8 = entities.zones[8].schedule, a8 = this.attrs(z8);
      const rowHtml = rows.map(([label, id, value, kind]) => `<button data-entity="${this.esc(id)}"><span>${label}</span><b class="${this.bad(value) ? "bad" : ""}">${this.esc(kind ? this.human(kind, value) : value)}</b><ha-icon icon="mdi:chevron-right"></ha-icon></button>`).join("");
      return `<div class="intro"><h2>Диагностика</h2><p>Технический слой. Unknown/unavailable всегда считаются ошибкой достоверности.</p></div><section class="diag">${rowHtml}</section><section class="diag infoBox"><h3>Панель</h3><div><span>UI</span><b>v${VERSION}</b></div><div><span>Назад</span><b>${this.esc(this.parentPath())}</b></div></section><section class="diag infoBox"><h3>Главный клапан</h3><div><span>Источник состояния</span><b>Не подтверждён</b></div><p>Панель не вычисляет его состояние по косвенным признакам.</p></section><section class="diag zone8"><h3>Зона 8 · лабораторная</h3><div><span>Состояние</span><b>${this.esc(this.scheduleStatus(this.state(z8)))}</b></div><div><span>Источник кэша</span><b>${this.esc(a8.cache_source ?? "—")}</b></div><pre>${this.esc(a8.raw_hex || "RAW DP38 отсутствует")}</pre><p>Зона 8 не является пользовательской зоной. Raw-write из панели отсутствует.</p></section>`;
    }

    styles() {
      return `
        :host{--a:var(--primary-color,#08a0cf);--card:var(--card-background-color,#fff);--bg:var(--primary-background-color,#f7f8fa);--text:var(--primary-text-color,#17191c);--muted:var(--secondary-text-color,#6d7176);--line:color-mix(in srgb,var(--text) 12%,transparent);--soft:color-mix(in srgb,var(--text) 5%,var(--card));--danger:var(--error-color,#d84040);display:block;min-height:100vh;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif}*{box-sizing:border-box}button{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}.app{max-width:860px;min-height:100vh;margin:0 auto;padding:0 14px calc(98px + env(safe-area-inset-bottom))}.appHeader{position:sticky;top:0;z-index:8;display:grid;grid-template-columns:82px minmax(0,1fr) 44px;align-items:center;gap:8px;min-height:64px;padding:calc(6px + env(safe-area-inset-top)) 0 7px;background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}.backButton{display:flex;align-items:center;gap:3px;min-width:0;min-height:44px;padding:0 5px;border:0;background:transparent;color:var(--a);font-size:13px;font-weight:700;cursor:pointer}.backButton ha-icon{--mdc-icon-size:23px}.headerTitle{min-width:0;text-align:left}.headerTitle strong{display:block;font-size:19px;line-height:1.1;letter-spacing:-.02em}.headerTitle small{display:block;margin-top:2px;overflow:hidden;color:var(--muted);font-size:9px;line-height:1.2;text-overflow:ellipsis;white-space:nowrap}.headerMark{display:grid;place-items:center;width:44px;height:44px;color:var(--a)}.headerMark ha-icon{--mdc-icon-size:24px}.content{padding-top:8px}.hero,.next,.chip,.zoneLine,.card,.season,.diag{background:var(--card);border:1px solid var(--line);box-shadow:0 1px 0 #00000003}.hero{padding:19px;border-radius:24px}.heroRow{display:flex;align-items:center;gap:14px}.orb,.num{display:inline-grid;place-items:center;flex:0 0 auto;width:46px;height:46px;border-radius:50%;background:color-mix(in srgb,var(--a) 13%,var(--card));color:var(--a);font-weight:800}.orb ha-icon{--mdc-icon-size:24px}.hero small,.next small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.12em}.hero h1{margin:2px 0 3px;font-size:24px;line-height:1.12;letter-spacing:-.035em}.hero p,.next p,.intro p,.cardHead p,.programHead p,.diag p{margin:0;color:var(--muted)}.hero.danger{border-color:color-mix(in srgb,var(--danger) 40%,var(--line))}.hero.danger .orb{background:color-mix(in srgb,var(--danger) 12%,var(--card));color:var(--danger)}.hero.active{border-color:color-mix(in srgb,var(--a) 48%,var(--line))}.times{display:flex;justify-content:space-between;gap:12px;margin-top:14px;color:var(--muted);font-size:12px}.times b{color:var(--text)}.bar{height:6px;margin-top:7px;overflow:hidden;border-radius:99px;background:var(--soft)}.bar i{display:block;height:100%;border-radius:inherit;background:var(--a)}.chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:9px}.chip{min-height:66px;padding:12px 14px;border-radius:18px;text-align:left;cursor:pointer}.chip small{display:block;margin-bottom:3px;color:var(--muted);font-size:9px;text-transform:uppercase}.chip strong{display:block;overflow:hidden;font-size:16px;line-height:1.15;text-overflow:ellipsis;white-space:nowrap}.chip.good strong{color:#2ba66a}.next{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:9px;padding:15px 17px;border-radius:19px}.next h2{margin:2px 0 3px;font-size:18px;line-height:1.15}.next p{font-size:12px}.next>ha-icon{flex:0 0 auto;color:var(--a);--mdc-icon-size:27px}.sectionHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:21px 3px 9px}.sectionHead h2,.intro h2{margin:0;font-size:25px;letter-spacing:-.035em}.sectionHead button{min-height:44px;border:0;background:transparent;color:var(--a);font-weight:750;cursor:pointer}.zoneList,.cards{display:grid;grid-template-columns:1fr;gap:8px}.zoneLine{display:grid;grid-template-columns:46px minmax(0,1fr) 24px;align-items:center;gap:11px;width:100%;min-height:70px;padding:10px 12px;border-radius:19px;text-align:left;cursor:pointer}.zoneLine b{display:block;font-size:16px}.zoneLine small{display:block;margin-top:2px;overflow:hidden;color:var(--muted);font-size:11px;text-overflow:ellipsis;white-space:nowrap}.zoneLine>ha-icon{color:var(--muted);--mdc-icon-size:23px}.zoneLine.running{border-color:color-mix(in srgb,var(--a) 48%,var(--line));background:color-mix(in srgb,var(--a) 7%,var(--card))}.intro{padding:5px 4px 13px}.intro p{margin-top:5px;font-size:13px;line-height:1.42}.titleRow{display:flex;align-items:center;justify-content:space-between;gap:10px}.readOnly,.badge{padding:6px 9px;border-radius:99px;background:var(--soft);color:var(--muted);font-size:9px;white-space:nowrap}.card{padding:15px;border-radius:21px}.card.activeCard{border-color:color-mix(in srgb,var(--a) 50%,var(--line));background:color-mix(in srgb,var(--a) 5%,var(--card))}.cardHead,.programHead{display:flex;align-items:center;gap:11px}.cardHead>div,.programHead>div{min-width:0;flex:1}.cardHead h3,.programHead h3{margin:0;font-size:19px;letter-spacing:-.02em}.cardHead p,.programHead p{margin-top:2px;font-size:12px}.more{display:grid;place-items:center;width:42px;height:42px;border:0;border-radius:14px;background:var(--soft);cursor:pointer}.more ha-icon{--mdc-icon-size:22px}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}.metrics>div,.facts>div{min-width:0;padding:10px;border-radius:14px;background:var(--soft)}.metrics small,.facts small,.zoneMeta small{display:block;color:var(--muted);font-size:8px;text-transform:uppercase}.metrics b,.facts b{display:block;margin-top:3px;font-size:13px;line-height:1.2}.zoneMeta{display:grid;grid-template-columns:1.25fr 1.25fr .9fr;gap:8px;margin-top:11px;padding:0 2px}.zoneMeta span{min-width:0}.zoneMeta b{display:block;margin-top:3px;overflow:hidden;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.season{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;padding:13px 15px;border-color:color-mix(in srgb,var(--a) 42%,var(--line));border-radius:19px;background:color-mix(in srgb,var(--a) 6%,var(--card))}.season b{color:var(--a);font-size:18px}.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:12px}.details{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:42px;margin-top:8px;padding:4px 2px 0;border:0;background:transparent;color:var(--a);font-weight:750;text-align:left;cursor:pointer}.details ha-icon{--mdc-icon-size:22px}.dim{opacity:.58}.diag{overflow:hidden;border-radius:21px}.diag>button,.diag>div{display:grid;grid-template-columns:minmax(0,1fr) auto 22px;align-items:center;gap:8px;width:100%;min-height:50px;padding:0 14px;border:0;border-bottom:1px solid var(--line);background:transparent;text-align:left}.diag>button:last-child,.diag>div:last-of-type{border-bottom:0}.diag>button{cursor:pointer}.diag span{color:var(--muted);font-size:12px}.diag b{font-size:12px;text-align:right}.diag ha-icon{color:var(--muted);--mdc-icon-size:20px}.diag .bad{color:var(--danger)}.diag+.diag{margin-top:9px}.infoBox,.zone8{padding:14px}.infoBox h3,.zone8 h3{margin:0 0 7px;font-size:17px}.infoBox>div,.zone8>div{min-height:34px;padding:0}.infoBox p,.zone8 p{margin-top:8px;font-size:11px;line-height:1.42}.zone8 pre{overflow-x:auto;margin:9px 0 0;padding:9px;border-radius:13px;background:var(--soft);color:var(--text);font-size:9px}.bottomNav{position:fixed;z-index:10;right:0;bottom:0;left:0;padding:7px 10px calc(7px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--bg) 94%,transparent);border-top:1px solid var(--line);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}.bottomNavInner{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;max-width:860px;margin:0 auto}.bottomNav button{display:grid;place-items:center;align-content:center;gap:2px;min-height:54px;border:0;border-radius:16px;background:transparent;color:var(--muted);font-size:10px;font-weight:700;cursor:pointer}.bottomNav button ha-icon{--mdc-icon-size:22px}.bottomNav button.active{background:var(--card);color:var(--a);box-shadow:0 3px 14px #0000000d}@media(min-width:720px){.app{padding-right:22px;padding-left:22px}.zoneList,.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){.app{padding-right:10px;padding-left:10px}.appHeader{grid-template-columns:74px minmax(0,1fr) 40px}.backButton span{font-size:12px}.headerTitle strong{font-size:18px}.hero{padding:17px}.hero h1{font-size:22px}.metrics>div,.facts>div{padding:9px 8px}.zoneMeta{gap:5px}}
      `;
    }

    bindActions() {
      this.shadowRoot.querySelector("[data-back]")?.addEventListener("click", () => this.goBack());
      this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => {
        button.addEventListener("click", () => {
          this._view = button.dataset.view || "overview";
          this.render();
          window.scrollTo({ top: 0, behavior: "auto" });
        });
      });
      this.shadowRoot.querySelectorAll("[data-entity]").forEach((button) => {
        let timer = null;
        let held = false;
        const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
        button.addEventListener("pointerdown", () => {
          held = false;
          timer = setTimeout(() => {
            held = true;
            this.moreInfo(button.dataset.entity);
          }, 550);
        });
        button.addEventListener("pointerup", cancel);
        button.addEventListener("pointercancel", cancel);
        button.addEventListener("pointerleave", cancel);
        button.addEventListener("click", (event) => {
          if (held) { event.preventDefault(); held = false; return; }
          this.moreInfo(button.dataset.entity);
        });
      });
    }

    render() {
      if (!this.shadowRoot) return;
      const header = this.header();
      if (!this._hass) {
        this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${header}<main class="content"><section class="hero"><p>Загрузка данных…</p></section></main></div>${this.bottomNav()}`;
        this.bindActions();
        return;
      }
      const entities = this.entities();
      const content = this._view === "zones" ? this.zones(entities) : this._view === "programs" ? this.programs(entities) : this._view === "diagnostics" ? this.diagnostics(entities) : this.overview(entities);
      this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${header}<main class="content">${content}</main></div>${this.bottomNav()}`;
      this.bindActions();
    }
  }

  if (!customElements.get("nikas-ho-sc-8w-panel")) {
    customElements.define("nikas-ho-sc-8w-panel", HOSC8WPanel);
  }
})();
