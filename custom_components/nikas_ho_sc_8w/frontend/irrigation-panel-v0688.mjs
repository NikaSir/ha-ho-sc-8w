import "./irrigation-panel-v0687.mjs";

const UI_VERSION = "0.6.88";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0687 panel is not registered");
const p = Panel.prototype;
const previousProgramEditorCard = p._programEditorCard;
const previousRender = p._render;
const previousStyles = p.styles;

p._programEditorCard = function programEditorCardV0688(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousProgramEditorCard.call(this, entities, zone);

  template.content.querySelectorAll(".programEditStart").forEach((field) => {
    const input = field.querySelector("input[data-program-start]");
    if (!input) return;

    const slot = Number(input.dataset.programStart);
    const shell = document.createElement("span");
    shell.className = "programTimeInputShell";
    input.replaceWith(shell);
    shell.append(input);

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "programTimeClear";
    clear.dataset.programStartClear = `${zone}:${slot}`;
    clear.disabled = !input.value;
    clear.setAttribute("aria-label", `Очистить время запуска ${slot + 1}`);
    clear.setAttribute("title", "Очистить время");
    clear.innerHTML = '<ha-icon icon="mdi:close"></ha-icon>';
    shell.append(clear);
  });

  return template.innerHTML;
};

p._ensureV0688Events = function ensureV0688Events() {
  if (this._v0688EventsBound) return;
  this._v0688EventsBound = true;

  this.shadowRoot.addEventListener("click", (event) => {
    const clear = event.target?.closest?.("[data-program-start-clear]");
    if (!clear) return;

    event.preventDefault();
    event.stopPropagation();

    const [zoneText, slotText] = String(clear.dataset.programStartClear || "").split(":");
    const zone = Number(zoneText);
    const slot = Number(slotText);
    const state = this._programDrafts?.[zone];
    if (!state || !Number.isInteger(slot) || slot < 0 || slot > 5) return;

    state.values.start_times[slot] = "";
    this._programNativePickerOpen = false;
    this._programForceRender = true;
    try { this.render(); } finally { this._programForceRender = false; }
  }, true);
};

p._render = function renderV0688() {
  previousRender.call(this);
  this._ensureV0688Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0688() {
  return `${previousStyles.call(this)}
    /* UI v0.6.88 — explicit per-slot time clearing. */
    .programTimeInputShell{display:grid;grid-template-columns:minmax(0,1fr) 38px;align-items:center;gap:6px;width:100%;min-width:0}
    .programTimeInputShell>input{min-width:0!important;width:100%!important}
    .programTimeClear{display:grid;place-items:center;width:38px;height:42px;padding:0;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--a);outline:0;touch-action:manipulation}
    .programTimeClear ha-icon{--mdc-icon-size:21px}
    .programTimeClear:disabled{color:var(--muted);opacity:.32}
    .programTimeClear:not(:disabled):active{transform:scale(.96)}
    @media(max-width:520px){.programTimeInputShell{grid-template-columns:minmax(0,1fr) 36px;gap:5px}.programTimeClear{width:36px;height:42px}}
  `;
};
