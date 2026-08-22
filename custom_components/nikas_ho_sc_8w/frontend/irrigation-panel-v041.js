import "./irrigation-panel-v040.js";

const UI_VERSION = "0.4.1";
const Panel = customElements.get("nikas-ho-sc-8w-panel");

if (Panel && !Panel.prototype.__nikasCompactOverviewV041) {
  Panel.prototype.__nikasCompactOverviewV041 = true;

  const previousStyles = Panel.prototype.v040Styles;
  const previousRender = Panel.prototype.render;

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

    const connection = this.state(entities.connection);
    const rain = this.state(entities.rain);
    const seasonal = this.state(entities.seasonal);

    return `
      <div class="overviewCompact">
        ${this.hero(entities)}
        <div class="chips">
          ${this.chip("Связь", this.bad(connection) ? "Нет данных" : connection, entities.connection, connection === "local" ? "good" : "")}
          ${this.chip("Режим", this.human("operation", this.state(entities.operation)), entities.operation)}
          ${this.chip("Дождь", this.human("rain", rain), entities.rain)}
          ${this.chip("Сезон", this.bad(seasonal) ? "Нет данных" : `${seasonal} %`, entities.seasonal)}
        </div>
        ${this.nextCard(entities)}
        <div class="sectionHead sectionHeadPlain"><h2>Зоны 1–6</h2></div>
        <div class="zoneList">${rows.join("")}</div>
      </div>
    `;
  };

  Panel.prototype.v040Styles = function () {
    return `${previousStyles.call(this)}
      /* v0.4.1 — compact Overview for iPhone Pro Max portrait. */
      .appHeader{
        min-height:56px!important;
        padding:calc(4px + env(safe-area-inset-top)) 0 4px!important;
      }
      .headerTitle strong{font-size:17px!important;line-height:1.05!important}
      .headerTitle small{margin-top:1px!important;font-size:8px!important;line-height:1.1!important}
      .content{padding-top:4px!important}

      .overviewCompact .hero{padding:11px 13px!important;border-radius:18px!important}
      .overviewCompact .heroRow{gap:9px!important}
      .overviewCompact .orb{width:38px!important;height:38px!important}
      .overviewCompact .orb ha-icon{--mdc-icon-size:21px!important}
      .overviewCompact .hero small{font-size:7.5px!important;letter-spacing:.1em!important}
      .overviewCompact .hero h1{margin:1px 0 1px!important;font-size:20px!important;line-height:1.08!important}
      .overviewCompact .hero p{font-size:11px!important;line-height:1.15!important}
      .overviewCompact .times{margin-top:7px!important;font-size:9px!important}
      .overviewCompact .bar{height:4px!important;margin-top:4px!important}

      .overviewCompact .chips{
        grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:5px!important;
        margin-top:6px!important;
      }
      .overviewCompact .chip{
        min-height:48px!important;
        padding:7px 8px!important;
        border-radius:14px!important;
      }
      .overviewCompact .chip small{margin-bottom:2px!important;font-size:7px!important}
      .overviewCompact .chip strong{font-size:12px!important;line-height:1.05!important}

      .overviewCompact .next{
        min-height:54px!important;
        margin-top:6px!important;
        padding:8px 12px!important;
        border-radius:15px!important;
      }
      .overviewCompact .next small{font-size:7px!important;letter-spacing:.1em!important}
      .overviewCompact .next h2{margin:1px 0!important;font-size:15px!important;line-height:1.1!important}
      .overviewCompact .next p{font-size:9.5px!important;line-height:1.15!important}
      .overviewCompact .next>ha-icon{--mdc-icon-size:22px!important}

      .overviewCompact .sectionHead{
        margin:11px 2px 5px!important;
      }
      .overviewCompact .sectionHead h2{font-size:21px!important;line-height:1.05!important}
      .overviewCompact .zoneList{gap:5px!important}
      .overviewCompact .zoneLine{
        grid-template-columns:38px minmax(0,1fr) 20px!important;
        gap:9px!important;
        min-height:57px!important;
        padding:6px 10px!important;
        border-radius:16px!important;
      }
      .overviewCompact .zoneLine .num{
        width:38px!important;
        height:38px!important;
        font-size:16px!important;
      }
      .overviewCompact .zoneLine b{font-size:14px!important;line-height:1.05!important}
      .overviewCompact .zoneLine small{margin-top:1px!important;font-size:9.5px!important;line-height:1.05!important}
      .overviewCompact .zoneLine>ha-icon{--mdc-icon-size:20px!important}

      @media(max-width:390px){
        .overviewCompact .chips{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      }
    `;
  };

  Panel.prototype.render = function (...args) {
    previousRender.apply(this, args);
    if (!this.shadowRoot) return;
    const walker = document.createTreeWalker(this.shadowRoot, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    for (const textNode of nodes) {
      if (textNode.nodeValue?.includes("v0.4.0")) {
        textNode.nodeValue = textNode.nodeValue.replaceAll("v0.4.0", `v${UI_VERSION}`);
      }
    }
  };
}
