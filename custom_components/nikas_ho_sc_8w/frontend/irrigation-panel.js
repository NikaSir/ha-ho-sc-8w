(() => {
  const VERSION = "0.2.0";
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
        connection: this.entity(
          `${base}_connection_mode`,
          "_kontroller_poliva_ho_sc_8w_connection_mode",
        ),
        operation: this.entity(
          `${base}_operation_mode`,
          "_kontroller_poliva_ho_sc_8w_operation_mode",
        ),
        irrigation: this.entity(
          `${base}_irrigation_mode`,
          "_kontroller_poliva_ho_sc_8w_irrigation_mode",
        ),
        active: this.entity(
          `${base}_active_zones`,
          "_kontroller_poliva_ho_sc_8w_active_zones",
        ),
        queued: this.entity(
          `${base}_queued_zones`,
          "_kontroller_poliva_ho_sc_8w_queued_zones",
        ),
        rain: this.entity(null, "_kontroller_poliva_ho_sc_8w_rain_sensor"),
        seasonal: this.entity(
          null,
          "_kontroller_poliva_ho_sc_8w_seasonal_adjustment",
        ),
        timerError: this.entity(
          null,
          "_kontroller_poliva_ho_sc_8w_timer_error_alarm",
        ),
        alarmVoice: this.entity(
          null,
          "_kontroller_poliva_ho_sc_8w_alarm_voice_cancel",
        ),
        cache: this.entity(
          `${base}_schedule_cache`,
          "_kontroller_poliva_ho_sc_8w_schedule_cache",
        ),
        zones: {},
      };

      for (let zone = 1; zone <= 8; zone += 1) {
        entities.zones[zone] = {
          remaining: this.entity(
            `${base}_zone_${zone}_time_remaining`,
            `_kontroller_poliva_ho_sc_8w_zone_${zone}_time_remaining`,
          ),
          elapsed: this.entity(
            `${base}_zone_${zone}_time_elapsed`,
            `_kontroller_poliva_ho_sc_8w_zone_${zone}_time_elapsed`,
          ),
          schedule: this.entity(
            `${base}_schedule_zone_${zone}`,
            `_kontroller_poliva_ho_sc_8w_schedule_zone_${zone}`,
          ),
        };
      }
      return entities;
    }

    humanValue(kind, value) {
      if (this.bad(value)) return "Нет данных";
      const map = {
        operation: {
          Auto: "Авто",
          Manual: "Ручной",
          OFF: "Выключен",
        },
        irrigation: {
          order: "По порядку",
        },
        rain: {
          enabled: "Включён",
          disabled: "Выключен",
          true: "Включён",
          false: "Выключен",
        },
        alarm: {
          clear: "Нет",
          false: "Нет",
          true: "Есть",
        },
        cache: {
          complete: "Полный",
          partial: "Неполный",
        },
        zones: {
          None: "Нет",
        },
      };
      return map[kind]?.[String(value)] ?? String(value);
    }

    scheduleStatus(state) {
      if (state === "configured") return "Активна";
      if (state === "disabled") return "Выключена";
      if (this.bad(state)) return "Нет данных";
      return state;
    }

    rainText(value, compact = false) {
      if (value === true) return compact ? "дождь ✓" : "Учитывать";
      if (value === false) return compact ? "дождь ✕" : "Игнорировать";
      return compact ? "дождь —" : "—";
    }

    starts(attrs) {
      return Array.isArray(attrs.start_times)
        ? attrs.start_times.filter(Boolean)
        : [];
    }

    compactStarts(attrs) {
      const starts = this.starts(attrs);
      if (!starts.length) return "Без запуска";
      if (starts.length === 1) return starts[0];
      return `${starts[0]} +${starts.length - 1}`;
    }

    cycleText(attrs) {
      const mode = attrs.calendar_mode || attrs.cycle_mode || "—";
      if (mode === "interval" && attrs.interval_days) {
        const n = Number(attrs.interval_days);
        return `Каждые ${n} ${n === 1 ? "день" : n >= 2 && n <= 4 ? "дня" : "дней"}`;
      }
      if (mode === "odd") return "По нечётным дням";
      if (mode === "even") return "По чётным дням";
      if (mode === "weekly") return "По дням недели";
      if (mode === "disabled") return "Выключено";
      return String(mode);
    }

    dateOnly(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    parseLocalDate(value) {
      if (!value || typeof value !== "string") return null;
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return null;
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }

    eligibleDay(attrs, candidate) {
      const mode = attrs.calendar_mode || attrs.cycle_mode;
      if (mode === "disabled") return false;
      if (mode === "odd") return candidate.getDate() % 2 === 1;
      if (mode === "even") return candidate.getDate() % 2 === 0;
      if (mode === "interval" && Number(attrs.interval_days) > 0) {
        const anchor = this.parseLocalDate(
          attrs.interval_start || attrs.anchor_date || "",
        );
        if (!anchor) return true;
        const diff = Math.round(
          (this.dateOnly(candidate) - this.dateOnly(anchor)) / 86400000,
        );
        return diff >= 0 && diff % Number(attrs.interval_days) === 0;
      }
      return true;
    }

    nextWatering(entities) {
      const now = new Date();
      let best = null;

      for (let zone = 1; zone <= 6; zone += 1) {
        const scheduleId = entities.zones[zone].schedule;
        if (this.state(scheduleId) !== "configured") continue;
        const attrs = this.attrs(scheduleId);
        const starts = this.starts(attrs);
        if (!starts.length) continue;

        for (let offset = 0; offset <= 35; offset += 1) {
          const day = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + offset,
          );
          if (!this.eligibleDay(attrs, day)) continue;

          for (const start of starts) {
            const match = String(start).match(/^(\d{1,2}):(\d{2})$/);
            if (!match) continue;
            const candidate = new Date(
              day.getFullYear(),
              day.getMonth(),
              day.getDate(),
              Number(match[1]),
              Number(match[2]),
              0,
              0,
            );
            if (candidate <= now) continue;
            if (!best || candidate < best.when) {
              best = {
                zone,
                when: candidate,
                time: `${String(candidate.getHours()).padStart(2, "0")}:${String(
                  candidate.getMinutes(),
                ).padStart(2, "0")}`,
                duration: attrs.duration_min ?? "—",
                rain: attrs.rain_sensor_follow,
              };
            }
          }
        }
      }
      return best;
    }

    relativeDay(date) {
      const now = new Date();
      const today = this.dateOnly(now);
      const target = this.dateOnly(date);
      const diff = Math.round((target - today) / 86400000);
      if (diff === 0) return "Сегодня";
      if (diff === 1) return "Завтра";
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
      }).format(date);
    }

    statusCard(entities) {
      const connection = this.state(entities.connection);
      const activeValue = this.state(entities.active);
      const queuedValue = this.state(entities.queued);
      const active = this.zoneSet(activeValue);
      const queued = this.zoneSet(queuedValue);
      const zone = [...active][0];

      let tone = "ok";
      let icon = "✓";
      let title = "Полив не идёт";
      let subtitle = "Контроллер готов";

      if (this.bad(connection)) {
        tone = "danger";
        icon = "!";
        title = "Контроллер недоступен";
        subtitle = "Текущее состояние недостоверно";
      } else if (this.bad(activeValue)) {
        tone = "danger";
        icon = "!";
        title = "Состояние неизвестно";
        subtitle = "Runtime-данные неполные";
      } else if (zone) {
        tone = "active";
        icon = "💧";
        title = `Полив идёт · зона ${zone}`;
        subtitle = queued.size
          ? `Далее: ${[...queued].join(", ")}`
          : "Очередь пуста";
      }

      let progress = "";
      if (zone) {
        const zoneEntities = entities.zones[Number(zone)];
        const remaining = this.state(zoneEntities.remaining);
        const elapsed = this.state(zoneEntities.elapsed);
        const total = (Number(remaining) || 0) + (Number(elapsed) || 0);
        const percent = total
          ? Math.min(100, ((Number(elapsed) || 0) / total) * 100)
          : 0;
        progress = `
          <div class="times">
            <span>Прошло <b>${this.esc(elapsed)} мин</b></span>
            <span>Осталось <b>${this.esc(remaining)} мин</b></span>
          </div>
          <div class="bar"><i style="width:${percent}%"></i></div>
        `;
      }

      return `
        <section class="hero ${tone}">
          <div class="heroTop">
            <div class="orb">${icon}</div>
            <div>
              <small>ПОЛИВ СЕЙЧАС</small>
              <h2>${this.esc(title)}</h2>
              <p>${this.esc(subtitle)}</p>
            </div>
          </div>
          ${progress}
        </section>
      `;
    }

    chip(label, value, entityId, tone = "") {
      const isBad = this.bad(value);
      return `
        <button class="chip ${isBad ? "warn" : tone}" data-entity="${this.esc(
          entityId,
        )}">
          <small>${this.esc(label)}</small>
          <strong>${isBad ? "Нет данных" : this.esc(value)}</strong>
        </button>
      `;
    }

    nextCard(entities) {
      const connection = this.state(entities.connection);
      if (this.bad(connection)) {
        return `
          <section class="next warnBox">
            <small>СЛЕДУЮЩИЙ ПОЛИВ</small>
            <h3>Нет достоверных данных</h3>
            <p>Расчёт скрыт, пока контроллер недоступен.</p>
          </section>
        `;
      }

      const next = this.nextWatering(entities);
      if (!next) {
        return `
          <section class="next">
            <small>СЛЕДУЮЩИЙ ПОЛИВ</small>
            <h3>Не найден в текущем расписании</h3>
            <p>Проверь программы зон.</p>
          </section>
        `;
      }

      return `
        <section class="next">
          <div>
            <small>СЛЕДУЮЩИЙ ПОЛИВ</small>
            <h3>${this.esc(this.relativeDay(next.when))} · ${this.esc(
              next.time,
            )}</h3>
            <p>Зона ${next.zone} · база ${this.esc(
              next.duration,
            )} мин · ${this.esc(this.rainText(next.rain, true))}</p>
          </div>
          <span class="nextDrop">💧</span>
        </section>
      `;
    }

    overview(entities) {
      const active = this.zoneSet(this.state(entities.active));
      const queued = this.zoneSet(this.state(entities.queued));
      const zoneRows = [];

      for (let zone = 1; zone <= 6; zone += 1) {
        const scheduleId = entities.zones[zone].schedule;
        const scheduleState = this.state(scheduleId);
        const attrs = this.attrs(scheduleId);
        const isActive = active.has(String(zone));
        const isQueued = queued.has(String(zone));
        const duration = attrs.duration_min ?? "—";
        const remaining = this.state(entities.zones[zone].remaining);

        let stateText = "";
        if (isActive) stateText = `Полив · осталось ${remaining} мин`;
        else if (isQueued) stateText = "В очереди";
        else if (scheduleState === "disabled") stateText = "Выключена";
        else if (this.bad(scheduleState)) stateText = "Нет данных";
        else {
          stateText = `${this.compactStarts(attrs)} · ${duration} мин · ${this.rainText(
            attrs.rain_sensor_follow,
            true,
          )}`;
        }

        zoneRows.push(`
          <button class="zoneLine ${isActive ? "running" : ""}" data-entity="${this.esc(
            scheduleId,
          )}">
            <span class="num">${zone}</span>
            <span>
              <b>Зона ${zone}</b>
              <small>${this.esc(stateText)}</small>
            </span>
            <em>›</em>
          </button>
        `);
      }

      const rainState = this.state(entities.rain);
      const seasonalState = this.state(entities.seasonal);
      const seasonalText = this.bad(seasonalState)
        ? "Нет данных"
        : `${seasonalState} %`;

      return `
        ${this.statusCard(entities)}
        <div class="chips">
          ${this.chip(
            "Связь",
            this.state(entities.connection),
            entities.connection,
            this.state(entities.connection) === "local" ? "good" : "",
          )}
          ${this.chip(
            "Режим",
            this.humanValue("operation", this.state(entities.operation)),
            entities.operation,
          )}
          ${this.chip(
            "Дождь",
            this.humanValue("rain", rainState),
            entities.rain,
          )}
          ${this.chip("Сезон", seasonalText, entities.seasonal)}
        </div>
        ${this.nextCard(entities)}
        <div class="sectionHead">
          <h2>Зоны 1–6</h2>
          <button data-view="zones">Все зоны</button>
        </div>
        <div class="zoneList">${zoneRows.join("")}</div>
      `;
    }

    zones(entities) {
      const active = this.zoneSet(this.state(entities.active));
      const queued = this.zoneSet(this.state(entities.queued));
      let output = `
        <div class="intro">
          <h2>Зоны</h2>
          <p>Рабочие каналы 1–6. Ручное управление появится только через подтверждённый API интеграции.</p>
        </div>
        <div class="cards">
      `;

      for (let zone = 1; zone <= 6; zone += 1) {
        const zoneEntities = entities.zones[zone];
        const scheduleId = zoneEntities.schedule;
        const scheduleState = this.state(scheduleId);
        const attrs = this.attrs(scheduleId);
        const isActive = active.has(String(zone));
        const isQueued = queued.has(String(zone));
        const starts = this.starts(attrs);
        const stateText = isActive
          ? "Полив идёт"
          : isQueued
            ? "В очереди"
            : scheduleState === "configured"
              ? "Готова"
              : scheduleState === "disabled"
                ? "Выключена"
                : "Нет достоверных данных";

        output += `
          <section class="card ${isActive ? "activeCard" : ""}">
            <div class="cardHead">
              <span class="num">${zone}</span>
              <div>
                <h3>Зона ${zone}</h3>
                <p>${this.esc(stateText)}</p>
              </div>
              <button class="more" data-entity="${this.esc(scheduleId)}">•••</button>
            </div>
            <div class="metrics">
              <div>
                <small>База</small>
                <b>${this.esc(attrs.duration_min ?? "—")} мин</b>
              </div>
              <div>
                <small>Прошло</small>
                <b>${this.esc(this.state(zoneEntities.elapsed))} мин</b>
              </div>
              <div>
                <small>Осталось</small>
                <b>${this.esc(this.state(zoneEntities.remaining))} мин</b>
              </div>
            </div>
            <div class="zoneMeta">
              <span><small>СТАРТ</small><b>${this.esc(
                starts.length ? starts.join(" · ") : "—",
              )}</b></span>
              <span><small>ЦИКЛ</small><b>${this.esc(
                this.cycleText(attrs),
              )}</b></span>
              <span><small>ДОЖДЬ</small><b>${this.esc(
                this.rainText(attrs.rain_sensor_follow),
              )}</b></span>
            </div>
          </section>
        `;
      }

      return `${output}</div>`;
    }

    programs(entities) {
      const seasonal = this.state(entities.seasonal);
      const seasonalText = this.bad(seasonal) ? "Нет данных" : `${seasonal} %`;
      let output = `
        <div class="intro">
          <h2>Программы</h2>
          <p>Фактическое расписание контроллера. Сейчас доступен безопасный режим просмотра.</p>
        </div>
        <div class="season">
          <span>Сезонная коррекция</span>
          <b>${this.esc(seasonalText)}</b>
        </div>
        <div class="cards">
      `;

      for (let zone = 1; zone <= 6; zone += 1) {
        const scheduleId = entities.zones[zone].schedule;
        const state = this.state(scheduleId);
        const attrs = this.attrs(scheduleId);
        const starts = this.starts(attrs);

        output += `
          <section class="card ${state === "disabled" ? "dim" : ""}">
            <div class="programHead">
              <span class="num">${zone}</span>
              <div>
                <h3>Зона ${zone}</h3>
                <p>${
                  state === "configured"
                    ? this.esc(starts.join(" · ") || "Без времени")
                    : state === "disabled"
                      ? "Выключена"
                      : "Нет достоверных данных"
                }</p>
              </div>
              <span class="badge ${this.bad(state) ? "badBadge" : ""}">${this.esc(
                this.scheduleStatus(state),
              )}</span>
            </div>
            <div class="facts">
              <div>
                <small>База</small>
                <b>${this.esc(attrs.duration_min ?? "—")} мин</b>
              </div>
              <div>
                <small>Цикл</small>
                <b>${this.esc(this.cycleText(attrs))}</b>
              </div>
              <div>
                <small>Начало цикла</small>
                <b>${this.esc(
                  attrs.interval_start ?? attrs.anchor_date ?? "—",
                )}</b>
              </div>
              <div>
                <small>Дождь</small>
                <b>${this.esc(this.rainText(attrs.rain_sensor_follow))}</b>
              </div>
            </div>
            <button class="details" data-entity="${this.esc(scheduleId)}">
              Подробнее в HA <span>›</span>
            </button>
          </section>
        `;
      }

      return `${output}</div>`;
    }

    diagnosticRow(label, entityId, value, kind = "") {
      const display = kind ? this.humanValue(kind, value) : value;
      return `
        <button data-entity="${this.esc(entityId)}">
          <span>${this.esc(label)}</span>
          <b class="${this.bad(value) ? "bad" : ""}">${this.esc(display)}</b>
          <em>›</em>
        </button>
      `;
    }

    diagnostics(entities) {
      const zone8 = entities.zones[8].schedule;
      const zone8Attrs = this.attrs(zone8);
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

      return `
        <div class="intro">
          <h2>Диагностика</h2>
          <p>Технический слой. Unknown/unavailable всегда считаются ошибкой достоверности.</p>
        </div>
        <section class="diag">
          ${rows
            .map(([label, entityId, value, kind]) =>
              this.diagnosticRow(label, entityId, value, kind),
            )
            .join("")}
        </section>
        <section class="diag infoBox">
          <h3>Главный клапан</h3>
          <div>
            <span>Источник состояния</span>
            <b>Не подтверждён</b>
          </div>
          <p>Панель намеренно не вычисляет состояние главного клапана по косвенным признакам. Оно появится здесь после публикации проверенного источника интеграцией.</p>
        </section>
        <section class="diag zone8">
          <h3>Зона 8 · лабораторная</h3>
          <div>
            <span>Состояние</span>
            <b>${this.esc(this.scheduleStatus(this.state(zone8)))}</b>
          </div>
          <div>
            <span>Источник кэша</span>
            <b>${this.esc(zone8Attrs.cache_source ?? "—")}</b>
          </div>
          <pre>${this.esc(zone8Attrs.raw_hex || "RAW DP38 отсутствует")}</pre>
          <p>Зона 8 не является пользовательской зоной. Панель не предоставляет raw-write управление.</p>
        </section>
      `;
    }

    styles() {
      return `
        :host {
          --accent: var(--primary-color, #08a0cf);
          --card: var(--card-background-color, #fff);
          --bg: var(--primary-background-color, #f7f8fa);
          --text: var(--primary-text-color, #16181b);
          --muted: var(--secondary-text-color, #6d7176);
          --line: color-mix(in srgb, var(--text) 12%, transparent);
          --soft: color-mix(in srgb, var(--text) 5%, var(--card));
          --danger: var(--error-color, #d84040);
          display: block;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          background: var(--bg);
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", Roboto, sans-serif;
        }

        * { box-sizing: border-box; }

        button {
          font: inherit;
          color: inherit;
          -webkit-tap-highlight-color: transparent;
        }

        .app {
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          padding:
            max(8px, env(safe-area-inset-top))
            14px
            calc(34px + env(safe-area-inset-bottom));
        }

        .top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          padding: 4px 2px 10px;
        }

        .top small {
          display: block;
          color: var(--muted);
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .top h1 {
          margin: 3px 0 0;
          font-size: clamp(28px, 7vw, 38px);
          line-height: 1;
          letter-spacing: -.04em;
        }

        .top h1 span {
          color: var(--muted);
          font-size: 12px;
          font-weight: 550;
          letter-spacing: -.01em;
        }

        .drop {
          padding-bottom: 2px;
          font-size: 28px;
          line-height: 1;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 5;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 4px;
          margin: 4px 0 14px;
          padding: 7px 0 10px;
          background: color-mix(in srgb, var(--bg) 92%, transparent);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .nav button {
          min-width: 0;
          min-height: 46px;
          border: 0;
          border-radius: 16px;
          background: transparent;
          color: var(--muted);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .nav button.active {
          background: var(--card);
          color: var(--accent);
          box-shadow: 0 4px 18px #0000000c;
        }

        .nav i {
          display: block;
          margin-bottom: 3px;
          font-style: normal;
          font-size: 18px;
          line-height: 1;
        }

        .hero,
        .next,
        .chip,
        .zoneLine,
        .card,
        .season,
        .diag {
          background: var(--card);
          border: 1px solid var(--line);
          box-shadow: 0 1px 0 #00000003;
        }

        .hero {
          border-radius: 24px;
          padding: 20px;
        }

        .heroTop {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .orb,
        .num {
          display: inline-grid;
          place-items: center;
          flex: 0 0 auto;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--accent) 13%, var(--card));
          color: var(--accent);
          font-size: 20px;
          font-weight: 800;
        }

        .hero small,
        .next small {
          color: var(--muted);
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .12em;
        }

        .hero h2,
        .next h3 {
          margin: 2px 0 3px;
          font-size: 22px;
          line-height: 1.15;
          letter-spacing: -.025em;
        }

        .hero p,
        .next p,
        .intro p,
        .cardHead p,
        .programHead p,
        .diag p {
          margin: 0;
          color: var(--muted);
        }

        .hero.danger {
          border-color: color-mix(in srgb, var(--danger) 38%, var(--line));
        }

        .hero.danger .orb {
          background: color-mix(in srgb, var(--danger) 12%, var(--card));
          color: var(--danger);
        }

        .hero.active {
          border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
        }

        .times {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 15px;
          color: var(--muted);
          font-size: 12px;
        }

        .times b { color: var(--text); }

        .bar {
          height: 6px;
          margin-top: 8px;
          overflow: hidden;
          border-radius: 99px;
          background: var(--soft);
        }

        .bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--accent);
        }

        .chips {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 10px;
        }

        .chip {
          min-height: 68px;
          padding: 13px 14px;
          border-radius: 19px;
          text-align: left;
          cursor: pointer;
        }

        .chip small {
          display: block;
          margin-bottom: 4px;
          color: var(--muted);
          font-size: 10px;
          text-transform: uppercase;
        }

        .chip strong {
          display: block;
          overflow: hidden;
          font-size: 17px;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chip.good strong { color: #2ba66a; }
        .chip.warn strong { color: var(--danger); }

        .next {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 10px;
          padding: 16px 18px;
          border-radius: 20px;
        }

        .next h3 { font-size: 18px; }
        .next p { font-size: 13px; }
        .nextDrop { font-size: 28px; }
        .warnBox { border-color: color-mix(in srgb, var(--danger) 35%, var(--line)); }

        .sectionHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 22px 3px 10px;
        }

        .sectionHead h2,
        .intro h2 {
          margin: 0;
          font-size: 25px;
          letter-spacing: -.035em;
        }

        .sectionHead button {
          border: 0;
          background: transparent;
          color: var(--accent);
          font-weight: 750;
          cursor: pointer;
        }

        .zoneList {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .zoneLine {
          display: grid;
          grid-template-columns: 46px minmax(0, 1fr) 20px;
          align-items: center;
          gap: 12px;
          width: 100%;
          min-height: 72px;
          padding: 10px 12px;
          border-radius: 20px;
          text-align: left;
          cursor: pointer;
        }

        .zoneLine b {
          display: block;
          font-size: 16px;
        }

        .zoneLine small {
          display: block;
          margin-top: 2px;
          overflow: hidden;
          color: var(--muted);
          font-size: 12px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .zoneLine em {
          color: var(--muted);
          font-size: 28px;
          font-style: normal;
          text-align: right;
        }

        .zoneLine.running {
          border-color: color-mix(in srgb, var(--accent) 48%, var(--line));
          background: color-mix(in srgb, var(--accent) 7%, var(--card));
        }

        .intro {
          padding: 6px 4px 14px;
        }

        .intro p {
          margin-top: 5px;
          font-size: 14px;
          line-height: 1.4;
        }

        .cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .card {
          padding: 15px;
          border-radius: 22px;
        }

        .card.activeCard {
          border-color: color-mix(in srgb, var(--accent) 50%, var(--line));
          background: color-mix(in srgb, var(--accent) 5%, var(--card));
        }

        .cardHead,
        .programHead {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cardHead > div,
        .programHead > div {
          min-width: 0;
          flex: 1;
        }

        .cardHead h3,
        .programHead h3 {
          margin: 0;
          font-size: 19px;
          letter-spacing: -.02em;
        }

        .cardHead p,
        .programHead p {
          margin-top: 2px;
          font-size: 13px;
        }

        .more {
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 14px;
          background: var(--soft);
          font-weight: 800;
          cursor: pointer;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
          margin-top: 13px;
        }

        .metrics > div,
        .facts > div {
          min-width: 0;
          padding: 10px;
          border-radius: 15px;
          background: var(--soft);
        }

        .metrics small,
        .facts small,
        .zoneMeta small {
          display: block;
          color: var(--muted);
          font-size: 9px;
          text-transform: uppercase;
        }

        .metrics b,
        .facts b {
          display: block;
          margin-top: 3px;
          font-size: 14px;
          line-height: 1.2;
        }

        .zoneMeta {
          display: grid;
          grid-template-columns: 1.25fr 1.25fr .9fr;
          gap: 10px;
          margin-top: 12px;
          padding: 0 2px;
        }

        .zoneMeta span { min-width: 0; }

        .zoneMeta b {
          display: block;
          margin-top: 3px;
          overflow: hidden;
          font-size: 12px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .season {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 13px 15px;
          border-color: color-mix(in srgb, var(--accent) 42%, var(--line));
          border-radius: 20px;
          background: color-mix(in srgb, var(--accent) 6%, var(--card));
        }

        .season b {
          color: var(--accent);
          font-size: 19px;
        }

        .programHead .badge {
          padding: 7px 10px;
          border-radius: 99px;
          background: var(--soft);
          color: var(--muted);
          font-size: 10px;
          white-space: nowrap;
        }

        .programHead .badBadge {
          color: var(--danger);
        }

        .facts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
          margin-top: 13px;
        }

        .details {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-top: 12px;
          padding: 5px 3px 1px;
          border: 0;
          background: transparent;
          color: var(--accent);
          font-weight: 750;
          text-align: left;
          cursor: pointer;
        }

        .details span { font-size: 24px; }

        .dim { opacity: .58; }

        .diag {
          overflow: hidden;
          border-radius: 22px;
        }

        .diag > button,
        .diag > div {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto 16px;
          align-items: center;
          gap: 8px;
          width: 100%;
          min-height: 50px;
          padding: 0 15px;
          border: 0;
          border-bottom: 1px solid var(--line);
          background: transparent;
          text-align: left;
        }

        .diag > button:last-child,
        .diag > div:last-of-type {
          border-bottom: 0;
        }

        .diag > button {
          cursor: pointer;
        }

        .diag span {
          color: var(--muted);
          font-size: 13px;
        }

        .diag b {
          font-size: 13px;
          text-align: right;
        }

        .diag em {
          color: var(--muted);
          font-size: 19px;
          font-style: normal;
        }

        .diag .bad { color: var(--danger); }

        .diag + .diag {
          margin-top: 10px;
        }

        .infoBox,
        .zone8 {
          padding: 15px;
        }

        .infoBox h3,
        .zone8 h3 {
          margin: 0 0 8px;
          font-size: 18px;
        }

        .infoBox > div,
        .zone8 > div {
          min-height: 36px;
          padding: 0;
        }

        .infoBox p,
        .zone8 p {
          margin-top: 9px;
          font-size: 12px;
          line-height: 1.4;
        }

        .zone8 pre {
          overflow-x: auto;
          margin: 10px 0 0;
          padding: 10px;
          border-radius: 14px;
          background: var(--soft);
          color: var(--text);
          font-size: 10px;
        }

        @media (min-width: 720px) {
          .app { padding-left: 22px; padding-right: 22px; }
          .zoneList { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 420px) {
          .app { padding-left: 10px; padding-right: 10px; }
          .top h1 { font-size: 30px; }
          .nav button { font-size: 10px; }
          .hero { padding: 17px; }
          .hero h2 { font-size: 21px; }
          .zoneMeta { grid-template-columns: 1.1fr 1.1fr .8fr; gap: 6px; }
          .facts > div, .metrics > div { padding: 9px 8px; }
        }
      `;
    }

    nav() {
      const items = [
        ["overview", "⌂", "Обзор"],
        ["zones", "◉", "Зоны"],
        ["programs", "▦", "Программы"],
        ["diagnostics", "•••", "Диагностика"],
      ];
      return `
        <nav class="nav">
          ${items
            .map(
              ([view, icon, label]) => `
                <button class="${this._view === view ? "active" : ""}" data-view="${view}">
                  <i>${icon}</i>${label}
                </button>
              `,
            )
            .join("")}
        </nav>
      `;
    }

    render() {
      if (!this.shadowRoot) return;

      if (!this._hass) {
        this.shadowRoot.innerHTML = `
          <style>${this.styles()}</style>
          <div class="app">
            <header class="top">
              <div>
                <small>INKBIRD / HIOAZO · HO-SC-8W</small>
                <h1>Полив <span>· v${VERSION}</span></h1>
              </div>
              <div class="drop">💧</div>
            </header>
            <div class="hero"><p>Загрузка данных…</p></div>
          </div>
        `;
        return;
      }

      const entities = this.entities();
      const content =
        this._view === "zones"
          ? this.zones(entities)
          : this._view === "programs"
            ? this.programs(entities)
            : this._view === "diagnostics"
              ? this.diagnostics(entities)
              : this.overview(entities);

      this.shadowRoot.innerHTML = `
        <style>${this.styles()}</style>
        <div class="app">
          <header class="top">
            <div>
              <small>INKBIRD / HIOAZO · HO-SC-8W</small>
              <h1>Полив <span>· v${VERSION}</span></h1>
            </div>
            <div class="drop" aria-hidden="true">💧</div>
          </header>
          ${this.nav()}
          <main>${content}</main>
        </div>
      `;

      this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => {
        button.addEventListener("click", () => {
          this._view = button.dataset.view || "overview";
          this.render();
          this.shadowRoot.querySelector("main")?.scrollIntoView({
            block: "start",
            behavior: "auto",
          });
        });
      });

      this.shadowRoot.querySelectorAll("[data-entity]").forEach((button) => {
        button.addEventListener("click", () => {
          this.moreInfo(button.dataset.entity);
        });
      });
    }
  }

  if (!customElements.get("nikas-ho-sc-8w-panel")) {
    customElements.define("nikas-ho-sc-8w-panel", HOSC8WPanel);
  }
})();
