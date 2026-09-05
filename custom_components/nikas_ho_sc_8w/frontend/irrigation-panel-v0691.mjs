import "./irrigation-panel-v0690.mjs";

const UI_VERSION = "0.6.91";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0690 panel is not registered");
const p = Panel.prototype;
const previousStatusView = p.statusView;
const previousRender = p._render;
const previousStyles = p.styles;

p.statusView = function statusViewV0691(entities) {
  const content = previousStatusView.call(this, entities);
  if (this._systemSettingsOpen) return content;

  const template = document.createElement("template");
  template.innerHTML = content;
  const screen = template.content.querySelector(".systemCompactScreen");
  if (!screen) return content;

  const zone = screen.querySelector(".systemZoneStatus");
  const settings = screen.querySelector(".systemSettingsButton");
  const manual = screen.querySelector(".systemManualAction");

  // Approved order on the System page: zone → settings → manual start/stop.
  // append() moves existing nodes without recreating them, so all data/action
  // attributes and event handlers remain unchanged.
  if (zone) screen.append(zone);
  if (settings) screen.append(settings);
  if (manual) screen.append(manual);

  return template.innerHTML;
};

p._render = function renderV0691() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0691() {
  return `${previousStyles.call(this)}
    /* UI v0.6.91 — equal System cards, compact top-to-bottom action flow. */
    .systemCompactScreen{
      height:auto!important;
      min-height:100%;
      grid-template-rows:auto auto auto auto auto!important;
      align-content:start!important;
      gap:10px!important;
      padding-bottom:4px!important;
    }
    .systemZoneStatus,
    .systemSettingsButton,
    .systemManualAction{
      box-sizing:border-box;
      align-self:stretch!important;
      width:100%;
      height:108px!important;
      min-height:108px!important;
      max-height:108px!important;
      margin:0!important;
    }
    .systemSettingsButton,
    .systemManualAction{
      position:static!important;
      inset:auto!important;
    }
    .systemSettingsButton{
      display:grid;
      grid-template-columns:58px minmax(0,1fr) 24px;
      align-items:center;
      gap:12px;
      padding:11px 14px!important;
    }
    .systemSettingsButton>ha-icon:first-child{
      justify-self:center;
      --mdc-icon-size:34px;
    }
    .systemSettingsButton>span{
      display:grid;
      gap:3px;
      min-width:0;
      text-align:left;
    }
    .systemSettingsButton>span b{font-size:18px;line-height:1.08}
    .systemSettingsButton>span small{font-size:12px;line-height:1.2}
    .systemManualAction{
      padding:11px 14px!important;
      border-radius:19px!important;
    }
    .systemManualActionIcon{
      flex:0 0 58px!important;
      width:58px!important;
      height:58px!important;
    }
    @media(max-width:520px){
      .systemCompactScreen{gap:9px!important}
      .systemZoneStatus,
      .systemSettingsButton,
      .systemManualAction{
        height:94px!important;
        min-height:94px!important;
        max-height:94px!important;
      }
      .systemSettingsButton{
        grid-template-columns:52px minmax(0,1fr) 20px;
        gap:9px;
        padding:9px 12px!important;
        border-radius:17px!important;
      }
      .systemSettingsButton>ha-icon:first-child{--mdc-icon-size:31px}
      .systemSettingsButton>span b{font-size:17px}
      .systemSettingsButton>span small{font-size:11px}
      .systemManualAction{
        padding:9px 12px!important;
        border-radius:17px!important;
      }
      .systemManualActionIcon{
        flex-basis:52px!important;
        width:52px!important;
        height:52px!important;
      }
    }
  `;
};
