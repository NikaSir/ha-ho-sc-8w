(() => {
  const VERSION = "0.1.0";
  const BAD = new Set(["unknown", "unavailable", "", null, undefined]);

  class HOSC8WPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this._hass = null;
      this._view = "overview";
    }
    set hass(v) { this._hass = v; this.render(); }
    set panel(v) { this._panel = v; }
    set narrow(v) { this.toggleAttribute("narrow", Boolean(v)); }
    connectedCallback() { this.render(); }

    esc(v) { return String(v ?? "—").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
    states() { return this._hass?.states || {}; }
    entity(preferred, ...suffixes) {
      const s = this.states();
      if (preferred && s[preferred]) return preferred;
      const keys = Object.keys(s);
      for (const suffix of suffixes) {
        const hit = keys.find(k => k.endsWith(suffix));
        if (hit) return hit;
      }
      return preferred || null;
    }
    state(id) { return id && this.states()[id] ? this.states()[id].state : "unavailable"; }
    attrs(id) { return id && this.states()[id] ? this.states()[id].attributes || {} : {}; }
    bad(v) { return BAD.has(v); }
    zoneSet(v) {
      if (this.bad(v) || v === "None") return new Set();
      return new Set(String(v).split(",").map(x => x.trim()).filter(Boolean));
    }
    moreInfo(id) {
      if (!id || !this.states()[id]) return;
      this.dispatchEvent(new CustomEvent("hass-more-info", {detail:{entityId:id}, bubbles:true, composed:true}));
    }

    entities() {
      const base = "sensor.kontroller_poliva_ho_sc_8w";
      const e = {
        connection: this.entity(`${base}_connection_mode`, "_kontroller_poliva_ho_sc_8w_connection_mode"),
        operation: this.entity(`${base}_operation_mode`, "_kontroller_poliva_ho_sc_8w_operation_mode"),
        irrigation: this.entity(`${base}_irrigation_mode`, "_kontroller_poliva_ho_sc_8w_irrigation_mode"),
        active: this.entity(`${base}_active_zones`, "_kontroller_poliva_ho_sc_8w_active_zones"),
        queued: this.entity(`${base}_queued_zones`, "_kontroller_poliva_ho_sc_8w_queued_zones"),
        rain: this.entity(null, "_kontroller_poliva_ho_sc_8w_rain_sensor"),
        seasonal: this.entity(null, "_kontroller_poliva_ho_sc_8w_seasonal_adjustment"),
        timerError: this.entity(null, "_kontroller_poliva_ho_sc_8w_timer_error_alarm"),
        alarmVoice: this.entity(null, "_kontroller_poliva_ho_sc_8w_alarm_voice_cancel"),
        cache: this.entity(`${base}_schedule_cache`, "_kontroller_poliva_ho_sc_8w_schedule_cache"),
        zones: {}
      };
      for (let z=1; z<=8; z++) e.zones[z] = {
        remaining: this.entity(`${base}_zone_${z}_time_remaining`, `_kontroller_poliva_ho_sc_8w_zone_${z}_time_remaining`),
        elapsed: this.entity(`${base}_zone_${z}_time_elapsed`, `_kontroller_poliva_ho_sc_8w_zone_${z}_time_elapsed`),
        schedule: this.entity(`${base}_schedule_zone_${z}`, `_kontroller_poliva_ho_sc_8w_schedule_zone_${z}`)
      };
      return e;
    }

    statusCard(e) {
      const conn=this.state(e.connection), op=this.state(e.operation), activeV=this.state(e.active), queuedV=this.state(e.queued);
      const active=this.zoneSet(activeV), queued=this.zoneSet(queuedV), z=[...active][0];
      let cls="ok", icon="✓", title="Полив не идёт", sub="Контроллер готов";
      if (this.bad(conn)) { cls="danger"; icon="!"; title="Контроллер недоступен"; sub="Текущее состояние недостоверно"; }
      else if (this.bad(activeV)) { cls="danger"; icon="!"; title="Состояние неизвестно"; sub="Runtime-данные неполные"; }
      else if (z) { cls="active"; icon="💧"; title=`Полив идёт · зона ${z}`; sub=queued.size?`Далее: ${[...queued].join(", ")}`:"Очередь пуста"; }
      let progress="";
      if (z) {
        const rem=this.state(e.zones[Number(z)].remaining), el=this.state(e.zones[Number(z)].elapsed);
        const total=(Number(rem)||0)+(Number(el)||0), pct=total?Math.min(100,(Number(el)||0)/total*100):0;
        progress=`<div class="times"><span>Прошло <b>${this.esc(el)} мин</b></span><span>Осталось <b>${this.esc(rem)} мин</b></span></div><div class="bar"><i style="width:${pct}%"></i></div>`;
      }
      return `<section class="hero ${cls}"><div class="heroTop"><div class="orb">${icon}</div><div><small>ПОЛИВ СЕЙЧАС</small><h2>${title}</h2><p>${sub}</p></div></div>${progress}</section>`;
    }

    chip(label, value, id, tone="") {
      const bad=this.bad(value);
      return `<button class="chip ${bad?"warn":tone}" data-entity="${this.esc(id)}"><small>${label}</small><strong>${bad?"Нет данных":this.esc(value)}</strong></button>`;
    }

    overview(e) {
      const active=this.zoneSet(this.state(e.active)), queued=this.zoneSet(this.state(e.queued));
      const zones=[];
      for(let z=1;z<=6;z++){
        const sid=e.zones[z].schedule, ss=this.state(sid), a=this.attrs(sid);
        const isA=active.has(String(z)), isQ=queued.has(String(z));
        let status=isA?"Полив":isQ?"В очереди":ss==="disabled"?"Выключена":this.bad(ss)?"Нет данных":"Готова";
        const dur=a.duration_min ?? a.duration_minutes ?? "—";
        zones.push(`<button class="zoneLine ${isA?"running":""}" data-entity="${this.esc(sid)}"><span class="num">${z}</span><span><b>Зона ${z}</b><small>${status} · ${this.esc(dur)} мин</small></span><em>›</em></button>`);
      }
      return `${this.statusCard(e)}
        <div class="chips">
          ${this.chip("Связь",this.state(e.connection),e.connection,this.state(e.connection)==="local"?"good":"")}
          ${this.chip("Режим",this.state(e.operation),e.operation)}
          ${this.chip("Дождь",this.state(e.rain)==="enabled"?"Включён":this.state(e.rain),e.rain)}
          ${this.chip("Сезон",`${this.state(e.seasonal)} %`,e.seasonal)}
        </div>
        <div class="note"><b>Главный клапан</b><span>Источник ещё не подтверждён интеграцией — состояние не подменяется косвенными признаками.</span></div>
        <div class="sectionHead"><h2>Зоны 1–6</h2><button data-view="zones">Все зоны</button></div>
        <div class="zoneList">${zones.join("")}</div>
        <div class="actions"><button data-view="programs">▦<b>Программы</b><small>Расписание DP38</small></button><button data-view="diagnostics">⋯<b>Диагностика</b><small>Технические данные</small></button></div>`;
    }

    zones(e) {
      const active=this.zoneSet(this.state(e.active)), queued=this.zoneSet(this.state(e.queued));
      let out=`<div class="intro"><h2>Зоны</h2><p>Рабочие каналы 1–6. Управление появится только через подтверждённый API интеграции.</p></div><div class="cards">`;
      for(let z=1;z<=6;z++){
        const q=e.zones[z], sid=q.schedule, ss=this.state(sid), a=this.attrs(sid), isA=active.has(String(z)), isQ=queued.has(String(z));
        const starts=Array.isArray(a.start_times)?a.start_times.join(" · "):"—";
        out+=`<section class="card ${isA?"activeCard":""}"><div class="cardHead"><span class="num">${z}</span><div><h3>Зона ${z}</h3><p>${isA?"Полив идёт":isQ?"В очереди":ss==="configured"?"Готова":ss==="disabled"?"Выключена":"Нет достоверных данных"}</p></div><button data-entity="${this.esc(sid)}">•••</button></div>
          <div class="metrics"><div><small>Длительность</small><b>${this.esc(a.duration_min ?? "—")} мин</b></div><div><small>Прошло</small><b>${this.esc(this.state(q.elapsed))} мин</b></div><div><small>Осталось</small><b>${this.esc(this.state(q.remaining))} мин</b></div></div>
          <p class="schedule">Старт: <b>${this.esc(starts)}</b></p><div class="disabled">Ручной запуск/остановка пока не опубликованы как безопасные Actions.</div></section>`;
      }
      return out+`</div>`;
    }

    programs(e) {
      const seasonal=this.state(e.seasonal);
      let out=`<div class="intro"><h2>Программы</h2><p>Фактическое расписание DP38 normal_time. Только чтение — raw Tuya из панели не отправляется.</p></div><div class="season"><span>Сезонная коррекция</span><b>${this.esc(seasonal)} %</b></div><div class="cards">`;
      for(let z=1;z<=6;z++){
        const id=e.zones[z].schedule, st=this.state(id), a=this.attrs(id), starts=Array.isArray(a.start_times)?a.start_times:[];
        const mode=a.calendar_mode || a.cycle_mode || "—";
        const cycle=mode==="interval" && a.interval_days?`Каждые ${a.interval_days} дн.`:mode;
        const rain=a.rain_sensor_follow===true?"Учитывать":a.rain_sensor_follow===false?"Игнорировать":"—";
        out+=`<section class="card ${st==="disabled"?"dim":""}"><div class="programHead"><span class="num">${z}</span><div><h3>Зона ${z}</h3><p>${st==="configured"?(starts.join(" · ")||"Без времени"):st==="disabled"?"Выключена":"Нет достоверных данных"}</p></div><span class="badge">${this.esc(st)}</span></div>
          <div class="facts"><div><small>База</small><b>${this.esc(a.duration_min ?? "—")} мин</b></div><div><small>Цикл</small><b>${this.esc(cycle)}</b></div><div><small>Дата-якорь</small><b>${this.esc(a.interval_start ?? a.anchor_date ?? "—")}</b></div><div><small>Дождь</small><b>${rain}</b></div></div><button class="details" data-entity="${this.esc(id)}">Подробнее в HA <span>›</span></button></section>`;
      }
      return out+`</div>`;
    }

    diagnostics(e) {
      const rows=[
        ["Активное соединение",e.connection,this.state(e.connection)], ["Режим",e.operation,this.state(e.operation)],
        ["Режим полива",e.irrigation,this.state(e.irrigation)], ["Active zones",e.active,this.state(e.active)],
        ["Queued zones",e.queued,this.state(e.queued)], ["Schedule cache",e.cache,this.state(e.cache)],
        ["Rain sensor",e.rain,this.state(e.rain)], ["Timer error",e.timerError,this.state(e.timerError)]
      ];
      const z8=e.zones[8].schedule, a8=this.attrs(z8);
      return `<div class="intro"><h2>Диагностика</h2><p>Технический слой. Unknown/unavailable всегда показываются как ошибка достоверности.</p></div>
        <section class="diag">${rows.map(([l,id,v])=>`<button data-entity="${this.esc(id)}"><span>${l}</span><b class="${this.bad(v)?"bad":""}">${this.esc(v)}</b><em>›</em></button>`).join("")}</section>
        <section class="diag zone8"><h3>Зона 8 · лабораторная</h3><div><span>Состояние</span><b>${this.esc(this.state(z8))}</b></div><div><span>Источник cache</span><b>${this.esc(a8.cache_source)}</b></div><pre>${this.esc(a8.raw_hex || "RAW DP38 отсутствует")}</pre><p>Зона 8 не является пользовательской зоной. Панель не предоставляет raw-write управление.</p></section>`;
    }

    styles() { return `
      :host{--a:var(--primary-color,#1788ff);--card:var(--card-background-color,#fff);--bg:var(--primary-background-color,#f4f6f8);--text:var(--primary-text-color,#182026);--muted:var(--secondary-text-color,#6f7780);--danger:var(--error-color,#d84040);display:block;background:var(--bg);color:var(--text);min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif}
      *{box-sizing:border-box}.app{max-width:980px;margin:auto;padding:calc(14px + env(safe-area-inset-top)) 14px calc(92px + env(safe-area-inset-bottom))}.top{display:flex;justify-content:space-between;align-items:center;padding:4px 2px 12px}.top small{font-size:10px;color:var(--muted);letter-spacing:.12em;font-weight:700}.top h1{margin:2px 0 0;font-size:28px;letter-spacing:-.04em}.top h1 span{font-size:12px;color:var(--muted);font-weight:500}.drop{font-size:28px}
      .nav{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;position:sticky;top:0;z-index:4;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(18px);padding:7px 0 12px}.nav button{border:0;background:transparent;color:var(--muted);border-radius:14px;min-height:44px;font-size:11px;font-weight:650}.nav button.active{background:var(--card);color:var(--a);box-shadow:0 2px 12px #0000000c}.nav i{display:block;font-style:normal;font-size:16px;margin-bottom:2px}
      .hero{border-radius:26px;padding:19px;background:var(--card);border:1px solid color-mix(in srgb,var(--muted) 18%,transparent);box-shadow:0 9px 24px #00000009}.hero.active{background:linear-gradient(145deg,color-mix(in srgb,var(--a) 13%,var(--card)),var(--card));border-color:color-mix(in srgb,var(--a) 35%,transparent)}.hero.danger{border-color:color-mix(in srgb,var(--danger) 45%,transparent)}.heroTop{display:flex;gap:13px;align-items:center}.orb,.num{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--a) 12%,transparent);color:var(--a);font-weight:800;flex:0 0 auto}.hero small{font-size:9px;color:var(--muted);font-weight:800;letter-spacing:.08em}.hero h2{font-size:20px;margin:2px 0}.hero p{font-size:12px;color:var(--muted);margin:0}.times{display:flex;justify-content:space-between;margin-top:17px;font-size:11px}.bar{height:7px;border-radius:9px;background:color-mix(in srgb,var(--muted) 12%,transparent);overflow:hidden;margin-top:7px}.bar i{display:block;height:100%;background:var(--a);border-radius:9px}
      .chips{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}.chip{border:1px solid color-mix(in srgb,var(--muted) 16%,transparent);background:var(--card);border-radius:17px;min-height:66px;padding:11px;text-align:left}.chip small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase}.chip strong{display:block;margin-top:4px;font-size:14px}.chip.good strong{color:#2e9f65}.chip.warn strong{color:var(--danger)}
      .note{margin-top:10px;padding:12px 14px;border-radius:16px;border:1px dashed color-mix(in srgb,var(--muted) 30%,transparent);font-size:12px}.note b{display:block}.note span{display:block;color:var(--muted);margin-top:4px;line-height:1.4}.sectionHead{display:flex;justify-content:space-between;align-items:center;margin:21px 3px 9px}.sectionHead h2,.intro h2{font-size:20px;margin:0}.sectionHead button{border:0;background:none;color:var(--a);font-weight:700}.zoneList,.cards{display:grid;gap:9px}.zoneLine{display:flex;align-items:center;gap:11px;width:100%;background:var(--card);border:1px solid color-mix(in srgb,var(--muted) 16%,transparent);border-radius:18px;padding:9px 11px;text-align:left}.zoneLine.running{border-color:color-mix(in srgb,var(--a) 40%,transparent);background:color-mix(in srgb,var(--a) 6%,var(--card))}.zoneLine span:nth-child(2){flex:1}.zoneLine b{display:block;font-size:14px}.zoneLine small{display:block;color:var(--muted);font-size:11px;margin-top:2px}.zoneLine em{font-style:normal;color:var(--muted);font-size:24px}.actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.actions button{background:var(--card);border:1px solid color-mix(in srgb,var(--muted) 16%,transparent);border-radius:18px;padding:13px;text-align:left;font-size:20px}.actions b,.actions small{display:block}.actions b{font-size:13px;margin-top:4px}.actions small{font-size:10px;color:var(--muted);margin-top:2px}
      .intro{padding:7px 3px 14px}.intro p{margin:5px 0 0;color:var(--muted);font-size:12px;line-height:1.45}.card{background:var(--card);border:1px solid color-mix(in srgb,var(--muted) 16%,transparent);border-radius:22px;padding:14px}.activeCard{border-color:color-mix(in srgb,var(--a) 40%,transparent)}.cardHead,.programHead{display:flex;gap:11px;align-items:center}.cardHead>div:nth-child(2),.programHead>div:nth-child(2){flex:1}.card h3{margin:0;font-size:16px}.card p{margin:3px 0 0;color:var(--muted);font-size:11px}.cardHead button{width:38px;height:38px;border:0;border-radius:13px;background:color-mix(in srgb,var(--muted) 8%,transparent)}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px}.metrics div,.facts div{background:color-mix(in srgb,var(--muted) 6%,transparent);padding:9px;border-radius:13px}.metrics small,.facts small{display:block;font-size:8px;text-transform:uppercase;color:var(--muted)}.metrics b,.facts b{display:block;font-size:12px;margin-top:3px}.schedule{margin-top:10px!important}.disabled{margin-top:10px;padding:9px;border-radius:12px;background:color-mix(in srgb,var(--muted) 7%,transparent);color:var(--muted);font-size:10px;line-height:1.4}.season{display:flex;justify-content:space-between;background:linear-gradient(140deg,color-mix(in srgb,var(--a) 12%,var(--card)),var(--card));border:1px solid color-mix(in srgb,var(--a) 25%,transparent);border-radius:17px;padding:12px 14px;margin-bottom:10px}.season b{color:var(--a)}.badge{font-size:9px;color:var(--muted);background:color-mix(in srgb,var(--muted) 8%,transparent);padding:5px 7px;border-radius:20px}.facts{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}.details{width:100%;border:0;background:none;color:var(--a);display:flex;justify-content:space-between;padding:12px 2px 1px;font-weight:700}.dim{opacity:.66}
      .diag{background:var(--card);border:1px solid color-mix(in srgb,var(--muted) 16%,transparent);border-radius:20px;padding:3px 13px}.diag button{display:grid;grid-template-columns:1fr auto 12px;gap:8px;align-items:center;width:100%;min-height:48px;border:0;border-bottom:1px solid color-mix(in srgb,var(--muted) 13%,transparent);background:none;text-align:left}.diag button:last-child{border-bottom:0}.diag span{font-size:11px;color:var(--muted)}.diag b{font-size:11px}.diag em{font-style:normal;color:var(--muted)}.bad{color:var(--danger)!important}.zone8{margin-top:10px;padding:13px}.zone8 h3{margin:0 0 8px}.zone8>div{display:flex;justify-content:space-between;font-size:11px;padding:5px 0}.zone8>div span{color:var(--muted)}.zone8 pre{white-space:pre-wrap;word-break:break-all;font-size:9px;background:color-mix(in srgb,var(--muted) 7%,transparent);padding:9px;border-radius:11px}.zone8 p{font-size:10px;color:var(--muted);line-height:1.4}
      button{font:inherit;color:inherit;cursor:pointer}@media(min-width:700px){.cards{grid-template-columns:1fr 1fr}.chips{grid-template-columns:repeat(4,1fr)}}`;
    }

    render() {
      if (!this.shadowRoot) return;
      if (!this._hass) { this.shadowRoot.innerHTML=`<style>${this.styles()}</style><div class="app">Загрузка панели полива…</div>`; return; }
      const e=this.entities();
      const body=this._view==="zones"?this.zones(e):this._view==="programs"?this.programs(e):this._view==="diagnostics"?this.diagnostics(e):this.overview(e);
      const tabs=[["overview","⌂","Обзор"],["zones","◉","Зоны"],["programs","▦","Программы"],["diagnostics","⋯","Диагностика"]];
      this.shadowRoot.innerHTML=`<style>${this.styles()}</style><main class="app"><header class="top"><div><small>INKBIRD / HIOAZO · HO-SC-8W</small><h1>Полив <span>· v${VERSION}</span></h1></div><div class="drop">💧</div></header><nav class="nav">${tabs.map(t=>`<button data-view="${t[0]}" class="${this._view===t[0]?"active":""}"><i>${t[1]}</i>${t[2]}</button>`).join("")}</nav>${body}</main>`;
      this.shadowRoot.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{this._view=b.dataset.view;this.render();});
      this.shadowRoot.querySelectorAll("[data-entity]").forEach(b=>{
        let timer;
        const open=()=>this.moreInfo(b.dataset.entity);
        b.onclick=open;
        b.onpointerdown=()=>{timer=setTimeout(open,550)};
        ["pointerup","pointercancel","pointerleave"].forEach(n=>b.addEventListener(n,()=>clearTimeout(timer)));
      });
    }
  }
  if(!customElements.get("nikas-ho-sc-8w-panel")) customElements.define("nikas-ho-sc-8w-panel",HOSC8WPanel);
})();
