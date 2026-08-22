import "./irrigation-panel-v033.js";

const UI_VERSION = "0.4.0";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
const parentGoBack = Panel?.prototype.goBack;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

if (Panel && !Panel.prototype.__nikasInformationArchitectureV040) {
  Panel.prototype.__nikasInformationArchitectureV040 = true;

  Panel.prototype.bottomNav = function () {
    const tabs = [
      ["overview", "mdi:home-outline", "Обзор"],
      ["manual", "mdi:watering-can-outline", "Ручной"],
      ["settings", "mdi:cog-outline", "Настройки"],
      ["diagnostics", "mdi:stethoscope", "Диагн."],
    ];
    return `
      <nav class="bottomNav" aria-label="Разделы Полив">
        <div class="bottomNavInner">
          ${tabs.map(([view, icon, label]) => `
            <button
              class="${this._view === view ? "active" : ""}"
              data-view="${view}"
              aria-current="${this._view === view ? "page" : "false"}"
            >
              <ha-icon icon="${icon}"></ha-icon>
              <span>${label}</span>
            </button>
          `).join("")}
        </div>
      </nav>
    `;
  };

  Panel.prototype.header = function () {
    if (this._drill?.type === "zone") {
      return `
        <header class="appHeader">
          <button class="backButton" data-back aria-label="Назад">
            <ha-icon icon="mdi:arrow-left"></ha-icon><span>Назад</span>
          </button>
          <div class="headerTitle">
            <strong>Зона ${this._drill.zone}</strong>
            <small>Полив · HO-SC-8W</small>
          </div>
          <div class="headerRight" aria-hidden="true"></div>
        </header>
      `;
    }

    if (this._drill?.type === "program-audit") {
      return `
        <header class="appHeader">
          <button class="backButton" data-back aria-label="Назад">
            <ha-icon icon="mdi:arrow-left"></ha-icon><span>Назад</span>
          </button>
          <div class="headerTitle headerTitleCompact">
            <strong>Проверка программы</strong>
            <small>Диагностика · только просмотр</small>
          </div>
          <div class="headerRight" aria-hidden="true"></div>
        </header>
      `;
    }

    return `
      <header class="appHeader">
        <button class="backButton" data-back aria-label="Назад">
          <ha-icon icon="mdi:arrow-left"></ha-icon><span>Назад</span>
        </button>
        <div class="headerTitle">
          <strong>Полив</strong>
          <small>HO-SC-8W · UI v${UI_VERSION}</small>
        </div>
        <div class="headerRight" aria-hidden="true"></div>
      </header>
    `;
  };

  Panel.prototype.goBack = function () {
    if (this._drill) {
      this._view = this._drill.parentView || "overview";
      this._drill = null;
      this.render();
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    parentGoBack?.call(this);
  };

  Panel.prototype.zoneStateText040 = function (state) {
    if (state === "configured") return "Активна";
    if (state === "disabled") return "Выключена";
    if (this.bad(state)) return "Нет данных";
    return String(state);
  };

  Panel.prototype.overview040 = function (entities) {
    const active = this.zoneSet(this.state(entities.active));
    const queued = this.zoneSet(this.state(entities.queued));
    const rows = [];

    for (let zone = 1; zone <= 6; zone += 1) {
      const q = entities.zones[zone];
      const id = q.schedule;
      const st = this.state(id);
      const a = this.attrs(id);
      const isActive = active.has(String(zone));
      const isQueued = queued.has(String(zone));
      const remaining = this.state(q.remaining);
      let detail;

      if (isActive) detail = `Полив · осталось ${remaining} мин`;
      else if (isQueued) detail = "В очереди";
      else if (st === "disabled") detail = "Выключена";
      else if (this.bad(st)) detail = "Нет данных";
      else detail = `${this.compactStarts(a)} · ${a.duration_min ?? "—"} мин · ${this.rainText(a.rain_sensor_follow, true)}`;

      rows.push(`
        <button
          class="zoneLine ${isActive ? "running" : ""}"
          data-zone-detail="${zone}"
          data-entity="${this.esc(id)}"
        >
          <span class="num">${zone}</span>
          <span>
            <b>Зона ${zone}</b>
            <small>${this.esc(detail)}</small>
          </span>
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
      `);
    }

    const rain = this.state(entities.rain);
    const seasonal = this.state(entities.seasonal);

    return `
      ${this.hero(entities)}
      <div class="chips">
        ${this.chip(
          "Связь",
          this.bad(this.state(entities.connection)) ? "Нет данных" : this.state(entities.connection),
          entities.connection,
          this.state(entities.connection) === "local" ? "good" : "",
        )}
        ${this.chip("Режим", this.human("operation", this.state(entities.operation)), entities.operation)}
        ${this.chip("Дождь", this.human("rain", rain), entities.rain)}
        ${this.chip("Сезон", this.bad(seasonal) ? "Нет данных" : `${seasonal} %`, entities.seasonal)}
      </div>
      ${this.nextCard(entities)}
      <div class="sectionHead sectionHeadPlain"><h2>Зоны 1–6</h2></div>
      <div class="zoneList">${rows.join("")}</div>
    `;
  };

  Panel.prototype.zoneDetail040 = function (entities, zone) {
    const q = entities.zones[zone];
    const id = q.schedule;
    const st = this.state(id);
    const a = this.attrs(id);
    const starts = this.starts(a);
    const seasonal = this.state(entities.seasonal);
    const enabled = st === "configured";

    return `
      <div class="intro drillIntro">
        <div class="titleRow">
          <h2>Настройка зоны</h2>
          <span class="readOnly">Только просмотр</span>
        </div>
        <p>Фактические параметры программы, сохранённые контроллером.</p>
      </div>

      <section class="zoneDetailStatus ${enabled ? "enabled" : "disabledState"}">
        <div class="zoneDetailStatusIcon"><ha-icon icon="${enabled ? "mdi:check-circle-outline" : "mdi:minus-circle-outline"}"></ha-icon></div>
        <div>
          <small>СОСТОЯНИЕ ПРОГРАММЫ</small>
          <h2>${this.esc(this.zoneStateText040(st))}</h2>
          <p>Зона ${zone}</p>
        </div>
      </section>

      <section class="detailCard">
        <h3>Расписание</h3>
        <div class="detailGrid">
          <div><small>Базовая длительность</small><b>${this.esc(a.duration_min ?? "—")} мин</b></div>
          <div><small>Старт</small><b>${this.esc(starts.length ? starts.join(" · ") : "—")}</b></div>
          <div><small>Цикл</small><b>${this.esc(this.cycleText(a))}</b></div>
          <div><small>Начало цикла</small><b>${this.esc(a.interval_start ?? a.anchor_date ?? "—")}</b></div>
          <div><small>Дождь</small><b>${this.esc(this.rainText(a.rain_sensor_follow))}</b></div>
          <div><small>Сезонная коррекция</small><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b></div>
        </div>
      </section>

      <section class="lockedInfo">
        <ha-icon icon="mdi:lock-outline"></ha-icon>
        <div>
          <b>Редактирование пока не опубликовано</b>
          <p>Этот экран уже соответствует будущей настройке зоны, но запись появится только через проверенный публичный API интеграции.</p>
        </div>
      </section>

      <button class="wideMore" data-entity="${this.esc(id)}">
        <span>Подробнее в Home Assistant</span><ha-icon icon="mdi:chevron-right"></ha-icon>
      </button>
    `;
  };

  Panel.prototype.manual040 = function (entities) {
    if (!this._manualZone) this._manualZone = 1;
    if (!this._manualDuration) this._manualDuration = 10;

    const zoneButtons = [];
    for (let zone = 1; zone <= 6; zone += 1) {
      zoneButtons.push(`
        <button class="manualZone ${this._manualZone === zone ? "active" : ""}" data-manual-zone="${zone}">
          <span>${zone}</span>
          <small>Зона ${zone}</small>
        </button>
      `);
    }

    const active = this.zoneSet(this.state(entities.active));
    const controllerBusy = active.size > 0;

    return `
      <div class="intro">
        <h2>Ручной полив</h2>
        <p>Выбери зону и длительность. Запуск будет передан контроллеру только после публикации безопасного Actions API.</p>
      </div>

      <section class="manualCard">
        <div class="manualHead">
          <div>
            <small>ЗОНА</small>
            <h3>Выбери канал</h3>
          </div>
          <ha-icon icon="mdi:watering-can-outline"></ha-icon>
        </div>
        <div class="manualZones">${zoneButtons.join("")}</div>

        <div class="manualDurationBlock">
          <small>ДЛИТЕЛЬНОСТЬ</small>
          <div class="durationStepper">
            <button data-duration-step="-1" aria-label="Уменьшить время"><ha-icon icon="mdi:minus"></ha-icon></button>
            <div><strong>${this._manualDuration}</strong><span>мин</span></div>
            <button data-duration-step="1" aria-label="Увеличить время"><ha-icon icon="mdi:plus"></ha-icon></button>
          </div>
        </div>

        <div class="manualSummary">
          <span>Зона ${this._manualZone}</span>
          <b>${this._manualDuration} мин</b>
        </div>

        <button class="manualStart" disabled>
          <ha-icon icon="mdi:play"></ha-icon>
          <span>${controllerBusy ? "Контроллер занят" : "Запуск пока недоступен"}</span>
        </button>
        <p class="manualSafety">Кнопка намеренно заблокирована: панель не отправляет raw DP45 и не имитирует неподтверждённое управление.</p>
      </section>
    `;
  };

  Panel.prototype.settingRow040 = function (label, value, entityId, icon, hint = "") {
    return `
      <button class="settingRow" data-entity="${this.esc(entityId)}">
        <span class="settingIcon"><ha-icon icon="${icon}"></ha-icon></span>
        <span class="settingText"><b>${this.esc(label)}</b>${hint ? `<small>${this.esc(hint)}</small>` : ""}</span>
        <strong>${this.esc(value)}</strong>
        <ha-icon class="settingChevron" icon="mdi:chevron-right"></ha-icon>
      </button>
    `;
  };

  Panel.prototype.settings040 = function (entities) {
    const seasonal = this.state(entities.seasonal);
    return `
      <div class="intro">
        <div class="titleRow">
          <h2>Настройки</h2>
          <span class="readOnly">Только просмотр</span>
        </div>
        <p>Общие параметры всего контроллера. Параметры отдельных зон открываются с Обзора.</p>
      </div>

      <section class="settingsCard">
        ${this.settingRow040("Режим контроллера", this.human("operation", this.state(entities.operation)), entities.operation, "mdi:autorenew", "Auto / Manual / Off")}
        ${this.settingRow040("Сезонная коррекция", this.bad(seasonal) ? "Нет данных" : `${seasonal} %`, entities.seasonal, "mdi:percent-outline", "Общая для всех зон")}
        ${this.settingRow040("Датчик дождя", this.human("rain", this.state(entities.rain)), entities.rain, "mdi:weather-rainy", "Глобальное разрешение")}
        ${this.settingRow040("Порядок полива", this.human("irrigation", this.state(entities.irrigation)), entities.irrigation, "mdi:format-list-numbered", "Последовательное выполнение")}
      </section>

      <section class="lockedInfo settingsLock">
        <ha-icon icon="mdi:lock-outline"></ha-icon>
        <div>
          <b>Изменение параметров пока закрыто</b>
          <p>Настройки станут интерактивными только после публикации проверенного API записи. Текущие значения — фактические данные контроллера.</p>
        </div>
      </section>
    `;
  };

  Panel.prototype.programAudit040 = function (entities) {
    const seasonal = this.state(entities.seasonal);
    const rain = this.state(entities.rain);
    const cards = [];

    for (let zone = 1; zone <= 6; zone += 1) {
      const id = entities.zones[zone].schedule;
      const st = this.state(id);
      const a = this.attrs(id);
      const starts = this.starts(a);
      cards.push(`
        <button class="auditZone" data-entity="${this.esc(id)}">
          <div class="auditZoneTop">
            <span class="num">${zone}</span>
            <div><b>Зона ${zone}</b><small>${this.esc(this.zoneStateText040(st))}</small></div>
            <span class="auditBadge">${this.esc(this.zoneStateText040(st))}</span>
          </div>
          <div class="auditPrimary">${this.esc(starts.length ? starts.join(" · ") : "—")} · ${this.esc(a.duration_min ?? "—")} мин</div>
          <div class="auditSecondary">${this.esc(this.cycleText(a))} · ${this.esc(this.rainText(a.rain_sensor_follow))}</div>
          <div class="auditAnchor">Начало цикла: ${this.esc(a.interval_start ?? a.anchor_date ?? "—")}</div>
        </button>
      `);
    }

    return `
      <div class="intro drillIntro">
        <h2>Фактическая программа</h2>
        <p>Контрольный снимок декодированного DP38. Здесь ничего не редактируется.</p>
      </div>

      <section class="auditSummary">
        <div><small>Сезонная коррекция</small><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b></div>
        <div><small>Датчик дождя</small><b>${this.esc(this.human("rain", rain))}</b></div>
      </section>

      <div class="auditList">${cards.join("")}</div>
    `;
  };

  Panel.prototype.diagnostics040 = function (entities) {
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
    const rowHtml = rows.map(([label, id, value, kind]) => `
      <button data-entity="${this.esc(id)}">
        <span>${this.esc(label)}</span>
        <b class="${this.bad(value) ? "bad" : ""}">${this.esc(kind ? this.human(kind, value) : value)}</b>
        <ha-icon icon="mdi:chevron-right"></ha-icon>
      </button>
    `).join("");

    const z8 = entities.zones[8].schedule;
    const a8 = this.attrs(z8);

    return `
      <div class="intro">
        <h2>Диагностика</h2>
        <p>Проверка достоверности данных, состояния интеграции и фактически сохранённой программы.</p>
      </div>

      <button class="diagnosticAction" data-drill="program-audit">
        <span class="diagnosticActionIcon"><ha-icon icon="mdi:clipboard-check-outline"></ha-icon></span>
        <span><b>Проверка программы</b><small>Сверить все параметры зон 1–6</small></span>
        <ha-icon icon="mdi:chevron-right"></ha-icon>
      </button>

      <section class="diag diagnosticRows">${rowHtml}</section>

      <section class="diag infoBox">
        <h3>Панель</h3>
        <div><span>UI</span><b>v${UI_VERSION}</b></div>
        <div><span>Назад</span><b>${this.esc(this.parentPath())}</b></div>
      </section>

      <section class="diag infoBox">
        <h3>Главный клапан</h3>
        <div><span>Источник состояния</span><b>Не подтверждён</b></div>
        <p>Панель не вычисляет состояние главного клапана по косвенным признакам.</p>
      </section>

      <section class="diag zone8">
        <h3>Зона 8 · лабораторная</h3>
        <div><span>Состояние</span><b>${this.esc(this.zoneStateText040(this.state(z8)))}</b></div>
        <div><span>Источник кэша</span><b>${this.esc(a8.cache_source ?? "—")}</b></div>
        <pre>${this.esc(a8.raw_hex || "RAW DP38 отсутствует")}</pre>
        <p>Зона 8 не является пользовательской зоной. Raw-write из панели отсутствует.</p>
      </section>
    `;
  };

  Panel.prototype.v040Styles = function () {
    return `
      .app{padding-bottom:calc(110px + env(safe-area-inset-bottom))!important}
      .appHeader{grid-template-columns:82px minmax(0,1fr) 82px!important}
      .headerTitle{text-align:center!important;min-width:0}.headerTitle strong{white-space:nowrap}.headerTitle small{text-align:center!important}.headerRight{width:82px;min-height:44px}.headerTitleCompact strong{font-size:16px!important}
      .bottomNav{position:fixed!important;left:0!important;right:0!important;bottom:0!important;width:100%!important;margin:0!important;padding:7px 10px calc(7px + env(safe-area-inset-bottom))!important;border-top:1px solid var(--line)!important;border-radius:0!important;background:color-mix(in srgb,var(--bg) 96%,transparent)!important;box-shadow:none!important;transform:none!important;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}
      .bottomNavInner{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important;width:100%!important;max-width:860px!important;margin:0 auto!important;padding:0!important}.bottomNav button{min-height:54px!important;margin:0!important;border-radius:12px!important;background:transparent!important;box-shadow:none!important;transform:none!important}.bottomNav button.active{background:color-mix(in srgb,var(--a) 10%,transparent)!important;color:var(--a)!important;box-shadow:none!important;transform:none!important}
      .sectionHeadPlain{justify-content:flex-start!important}.drillIntro{padding-top:8px}.zoneDetailStatus,.detailCard,.lockedInfo,.manualCard,.settingsCard,.auditSummary,.auditZone,.diagnosticAction,.wideMore{background:var(--card);border:1px solid var(--line)}
      .zoneDetailStatus{display:flex;align-items:center;gap:14px;padding:17px;border-radius:22px}.zoneDetailStatusIcon{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:color-mix(in srgb,var(--a) 12%,var(--card));color:var(--a)}.zoneDetailStatusIcon ha-icon{--mdc-icon-size:25px}.zoneDetailStatus small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.zoneDetailStatus h2{margin:3px 0 1px;font-size:22px}.zoneDetailStatus p{margin:0;color:var(--muted)}.zoneDetailStatus.disabledState{opacity:.65}
      .detailCard{margin-top:10px;padding:16px;border-radius:22px}.detailCard h3{margin:0 0 12px;font-size:18px}.detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.detailGrid>div{min-width:0;padding:11px;border-radius:15px;background:var(--soft)}.detailGrid small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase}.detailGrid b{display:block;margin-top:3px;font-size:13px;line-height:1.25;word-break:break-word}
      .lockedInfo{display:flex;gap:11px;margin-top:10px;padding:14px;border-radius:19px;background:color-mix(in srgb,var(--text) 3%,var(--card))}.lockedInfo>ha-icon{flex:0 0 auto;color:var(--muted);--mdc-icon-size:22px}.lockedInfo b{font-size:13px}.lockedInfo p{margin:4px 0 0;color:var(--muted);font-size:11px;line-height:1.42}.wideMore{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:50px;margin-top:10px;padding:0 15px;border-radius:18px;color:var(--a);font-weight:750;text-align:left}.wideMore ha-icon{--mdc-icon-size:22px}
      .manualCard{padding:16px;border-radius:22px}.manualHead{display:flex;align-items:center;justify-content:space-between}.manualHead small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.manualHead h3{margin:2px 0 0;font-size:19px}.manualHead>ha-icon{color:var(--a);--mdc-icon-size:28px}.manualZones{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.manualZone{min-height:64px;border:1px solid var(--line);border-radius:17px;background:var(--soft);display:grid;place-items:center;align-content:center;gap:2px}.manualZone span{font-size:20px;font-weight:800}.manualZone small{color:var(--muted);font-size:10px}.manualZone.active{border-color:color-mix(in srgb,var(--a) 55%,var(--line));background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}
      .manualDurationBlock{margin-top:18px}.manualDurationBlock>small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.durationStepper{display:grid;grid-template-columns:56px 1fr 56px;align-items:center;gap:10px;margin-top:8px}.durationStepper button{display:grid;place-items:center;min-height:54px;border:1px solid var(--line);border-radius:17px;background:var(--soft)}.durationStepper button ha-icon{--mdc-icon-size:24px}.durationStepper>div{text-align:center}.durationStepper strong{font-size:34px;letter-spacing:-.04em}.durationStepper span{margin-left:5px;color:var(--muted);font-size:14px}.manualSummary{display:flex;justify-content:space-between;margin-top:15px;padding:12px 2px;border-top:1px solid var(--line);color:var(--muted)}.manualSummary b{color:var(--text)}.manualStart{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;margin-top:4px;border:0;border-radius:17px;background:var(--soft);color:var(--muted);font-weight:800;opacity:.8}.manualSafety{margin:9px 2px 0;color:var(--muted);font-size:10px;line-height:1.4}
      .settingsCard{overflow:hidden;border-radius:22px}.settingRow{display:grid;grid-template-columns:42px minmax(0,1fr) auto 20px;align-items:center;gap:10px;width:100%;min-height:68px;padding:8px 13px;border:0;border-bottom:1px solid var(--line);background:transparent;text-align:left}.settingRow:last-child{border-bottom:0}.settingIcon{display:grid;place-items:center;width:38px;height:38px;border-radius:13px;background:var(--soft);color:var(--a)}.settingIcon ha-icon{--mdc-icon-size:21px}.settingText{min-width:0}.settingText b{display:block;font-size:13px}.settingText small{display:block;margin-top:2px;overflow:hidden;color:var(--muted);font-size:10px;text-overflow:ellipsis;white-space:nowrap}.settingRow>strong{font-size:13px;text-align:right}.settingChevron{color:var(--muted);--mdc-icon-size:20px}.settingsLock{margin-top:10px}
      .diagnosticAction{display:grid;grid-template-columns:44px minmax(0,1fr) 22px;align-items:center;gap:11px;width:100%;min-height:70px;margin-bottom:10px;padding:10px 14px;border-radius:20px;text-align:left}.diagnosticActionIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}.diagnosticActionIcon ha-icon{--mdc-icon-size:22px}.diagnosticAction b{display:block;font-size:14px}.diagnosticAction small{display:block;margin-top:2px;color:var(--muted);font-size:10px}.diagnosticAction>ha-icon{color:var(--muted);--mdc-icon-size:21px}.diagnosticRows{margin-bottom:10px}
      .auditSummary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;overflow:hidden;border-radius:20px;margin-bottom:9px}.auditSummary>div{padding:13px 14px}.auditSummary>div+div{border-left:1px solid var(--line)}.auditSummary small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase}.auditSummary b{display:block;margin-top:3px;font-size:16px}.auditList{display:grid;grid-template-columns:1fr;gap:8px}.auditZone{width:100%;padding:13px 14px;border-radius:20px;text-align:left}.auditZoneTop{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:10px}.auditZoneTop .num{width:42px;height:42px}.auditZoneTop b{display:block;font-size:15px}.auditZoneTop small{display:block;margin-top:1px;color:var(--muted);font-size:10px}.auditBadge{padding:5px 8px;border-radius:99px;background:var(--soft);color:var(--muted);font-size:9px}.auditPrimary{margin-top:10px;font-size:14px;font-weight:750}.auditSecondary{margin-top:3px;color:var(--muted);font-size:11px}.auditAnchor{margin-top:4px;color:var(--muted);font-size:10px}
      @media(min-width:720px){.auditList{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:420px){.appHeader{grid-template-columns:74px minmax(0,1fr) 74px!important}.headerRight{width:74px}.headerTitleCompact strong{font-size:15px!important}.manualZones{gap:6px}.detailGrid{gap:6px}.settingRow{grid-template-columns:40px minmax(0,1fr) auto 18px;gap:8px}}
    `;
  };

  Panel.prototype.bindActions = function () {
    this.shadowRoot.querySelector("[data-back]")?.addEventListener("click", () => this.goBack());

    this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        this._drill = null;
        this._view = button.dataset.view || "overview";
        this.render();
        window.scrollTo({ top: 0, behavior: "auto" });
      });
    });

    this.shadowRoot.querySelectorAll("[data-drill]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.drill === "program-audit") {
          this._drill = { type: "program-audit", parentView: "diagnostics" };
          this._view = "diagnostics";
          this.render();
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      });
    });

    this.shadowRoot.querySelectorAll("[data-manual-zone]").forEach((button) => {
      button.addEventListener("click", () => {
        this._manualZone = Number(button.dataset.manualZone) || 1;
        this.render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-duration-step]").forEach((button) => {
      button.addEventListener("click", () => {
        this._manualDuration = clamp((this._manualDuration || 10) + Number(button.dataset.durationStep || 0), 1, 120);
        this.render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-entity]").forEach((button) => {
      let timer = null;
      let held = false;
      const entityId = button.dataset.entity;
      const zoneDetail = Number(button.dataset.zoneDetail || 0);
      const cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
      };

      button.addEventListener("pointerdown", () => {
        held = false;
        timer = setTimeout(() => {
          held = true;
          this.moreInfo(entityId);
        }, 550);
      });
      button.addEventListener("pointerup", cancel);
      button.addEventListener("pointercancel", cancel);
      button.addEventListener("pointerleave", cancel);
      button.addEventListener("click", (event) => {
        if (held) {
          event.preventDefault();
          held = false;
          return;
        }
        if (zoneDetail) {
          this._drill = { type: "zone", zone: zoneDetail, parentView: "overview" };
          this._view = "overview";
          this.render();
          window.scrollTo({ top: 0, behavior: "auto" });
          return;
        }
        this.moreInfo(entityId);
      });
    });
  };

  Panel.prototype.render = function () {
    if (!this.shadowRoot) return;
    if (!this._view || !["overview", "manual", "settings", "diagnostics"].includes(this._view)) {
      this._view = "overview";
    }

    const header = this.header();
    if (!this._hass) {
      this.shadowRoot.innerHTML = `
        <style>${this.styles()}</style>
        <style>${this.v040Styles()}</style>
        <div class="app">${header}<main class="content"><section class="hero"><p>Загрузка данных…</p></section></main></div>
        ${this.bottomNav()}
      `;
      this.bindActions();
      return;
    }

    const entities = this.entities();
    let content;

    if (this._drill?.type === "zone") content = this.zoneDetail040(entities, this._drill.zone);
    else if (this._drill?.type === "program-audit") content = this.programAudit040(entities);
    else if (this._view === "manual") content = this.manual040(entities);
    else if (this._view === "settings") content = this.settings040(entities);
    else if (this._view === "diagnostics") content = this.diagnostics040(entities);
    else content = this.overview040(entities);

    this.shadowRoot.innerHTML = `
      <style>${this.styles()}</style>
      <style>${this.v040Styles()}</style>
      <div class="app">${header}<main class="content">${content}</main></div>
      ${this.bottomNav()}
    `;
    this.bindActions();
  };
}
