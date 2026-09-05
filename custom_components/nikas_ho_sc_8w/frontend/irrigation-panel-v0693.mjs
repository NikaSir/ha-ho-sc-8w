import "./irrigation-panel-v0692.mjs";

const UI_VERSION = "0.6.93";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0692 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

// The schedule editor now lives under Zones. The old v0687 guard was scoped
// to _view === "program", so HA state refreshes could rebuild the DOM while a
// native select/time picker was open. Guard any active editor control instead.
p._programEditorNativeControlActive = function programEditorNativeControlActiveV0693() {
  const active = this.shadowRoot?.activeElement;
  return Boolean(
    this._programNativePickerOpen ||
    active?.matches?.("[data-program-zone-edit], [data-program-start]")
  );
};

p._render = function renderV0693() {
  if (!this._programForceRender && this._programEditorNativeControlActive()) {
    const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
    if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
    return;
  }
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0693() {
  return `${previousStyles.call(this)}
    /* UI 0.6.93 — stable native pickers in Zones editor and fixed clear-button geometry. */
    .programEditStart{min-width:0!important;overflow:hidden!important}
    .programEditStart .programTimeInputShell{
      position:relative!important;
      display:grid!important;
      grid-template-columns:minmax(0,1fr) 42px!important;
      column-gap:8px!important;
      align-items:center!important;
      width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
    }
    .programEditStart .programTimeInputShell>input{
      grid-column:1!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      box-sizing:border-box!important;
      margin:0!important;
    }
    .programEditStart .programTimeClear{
      position:static!important;
      grid-column:2!important;
      justify-self:end!important;
      align-self:center!important;
      width:42px!important;
      min-width:42px!important;
      max-width:42px!important;
      height:42px!important;
      min-height:42px!important;
      max-height:42px!important;
      margin:0!important;
      padding:0!important;
      border-radius:12px!important;
      box-sizing:border-box!important;
    }
    .programEditStart .programTimeClear ha-icon{--mdc-icon-size:22px!important}
    .programEditStart .programTimeEmpty{
      left:0!important;
      right:50px!important;
      width:auto!important;
    }
    @media(max-width:520px){
      .programEditStart .programTimeInputShell{
        grid-template-columns:minmax(0,1fr) 38px!important;
        column-gap:6px!important;
      }
      .programEditStart .programTimeClear{
        width:38px!important;
        min-width:38px!important;
        max-width:38px!important;
        height:38px!important;
        min-height:38px!important;
        max-height:38px!important;
      }
      .programEditStart .programTimeEmpty{right:44px!important}
    }
  `;
};
