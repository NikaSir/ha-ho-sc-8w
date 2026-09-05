import "./irrigation-panel-v0694.mjs";

const UI_VERSION = "0.6.95";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0694 panel is not registered");
const p = Panel.prototype;
const previousEditorBase = p._programEditorBase;
const previousReadOnlyCard = p._programReadOnlyCardV0690;
const previousRender = p._render;
const previousStyles = p.styles;

function factualProgramEnabled(attrs) {
  if (attrs?.program_enabled === true || attrs?.enabled === true) return true;
  if (attrs?.program_enabled === false || attrs?.enabled === false) return false;
  return null;
}

p._programEditorBase = function programEditorBaseV0695(entities, zone) {
  const base = previousEditorBase.call(this, entities, zone);
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  base.program_enabled = factualProgramEnabled(attrs);
  return base;
};

p._programReadOnlyCardV0690 = function programReadOnlyCardV0695(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousReadOnlyCard.call(this, entities, zone);
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const enabled = factualProgramEnabled(attrs);
  const articles = [...template.content.querySelectorAll(".programReadGrid > article")];

  // Duration, repeat/date/rain and valid seasonal correction are factual values
  // read from controller-backed entities. Give every known fact one visual tone.
  articles.forEach((article, index) => {
    const value = article.querySelector("b")?.textContent?.trim() || "";
    const unknown = value === "Нет данных" || value === "Не задана" || value === "—";
    if (!unknown) article.classList.add("factualConfirmed");
    else article.classList.add("factualUnknown");
    if (index === 5) {
      article.classList.toggle("factualConfirmed", typeof enabled === "boolean");
      article.classList.toggle("factualUnknown", typeof enabled !== "boolean");
      const valueNode = article.querySelector("b");
      if (valueNode) valueNode.textContent = enabled === true ? "Включена" : enabled === false ? "Выключена" : "Нет данных";
    }
  });

  for (const slot of template.content.querySelectorAll(".programReadStarts article")) {
    const value = slot.querySelector("b")?.textContent?.trim() || "--:--";
    slot.classList.add(value === "--:--" ? "factualEmpty" : "factualConfirmed");
  }
  return template.innerHTML;
};

p._render = function renderV0695() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0695() {
  return `${previousStyles.call(this)}
    /* UI 0.6.95 — one factual color language and corrected mobile editor geometry. */
    .programReadOnly .programReadGrid article.factualConfirmed,
    .programReadOnly .programReadStarts article.factualConfirmed{
      border-color:color-mix(in srgb,var(--green) 38%,var(--line))!important;
      background:color-mix(in srgb,var(--green) 7%,var(--card))!important;
    }
    .programReadOnly .programReadGrid article.factualUnknown,
    .programReadOnly .programReadStarts article.factualEmpty{
      border-color:var(--line)!important;
      background:var(--soft)!important;
    }

    /* Keep native date controls inside the two-column editor grid. */
    .programEditor [data-program-field="anchor_date"]{
      display:block!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      box-sizing:border-box!important;
    }
    .programEditor [data-program-field="anchor_date"]::-webkit-date-and-time-value{
      min-width:0!important;
      text-align:center!important;
    }
    .programEditor .programEditField:has([data-program-field="anchor_date"]){
      min-width:0!important;
      overflow:hidden!important;
    }

    /* Time field is one control: value + clear action. No overlapping pills. */
    .programEditStart .programTimeInputShell{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) 40px!important;
      column-gap:0!important;
      width:100%!important;
      min-width:0!important;
      height:44px!important;
      border:1px solid var(--line)!important;
      border-radius:13px!important;
      background:var(--card)!important;
      overflow:hidden!important;
      box-sizing:border-box!important;
    }
    .programEditStart .programTimeInputShell>input{
      grid-column:1!important;
      width:100%!important;
      min-width:0!important;
      height:42px!important;
      margin:0!important;
      padding:0 8px!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      text-align:center!important;
      box-sizing:border-box!important;
    }
    .programEditStart .programTimeClear{
      position:static!important;
      grid-column:2!important;
      width:40px!important;
      min-width:40px!important;
      max-width:40px!important;
      height:42px!important;
      min-height:42px!important;
      max-height:42px!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      border-left:1px solid var(--line)!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      color:var(--a)!important;
      box-sizing:border-box!important;
    }
    .programEditStart .programTimeClear:disabled{color:var(--muted)!important;opacity:.34!important}
    .programEditStart .programTimeClear ha-icon{--mdc-icon-size:20px!important}
    .programEditStart .programTimeEmpty{
      left:0!important;
      right:40px!important;
      height:42px!important;
      width:auto!important;
    }
    @media(max-width:520px){
      .programEditStart .programTimeInputShell{grid-template-columns:minmax(0,1fr) 38px!important;height:42px!important}
      .programEditStart .programTimeClear{width:38px!important;min-width:38px!important;max-width:38px!important;height:40px!important;min-height:40px!important;max-height:40px!important}
      .programEditStart .programTimeInputShell>input{height:40px!important}
      .programEditStart .programTimeEmpty{right:38px!important;height:40px!important}
    }
  `;
};
