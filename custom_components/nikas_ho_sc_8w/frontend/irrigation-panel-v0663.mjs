import "./irrigation-panel-v0662.mjs";

const UI_VERSION = "0.6.63";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousConnectionIndicator = p.connectionIndicator;
const previousRender = p._render;
const previousStyles = p.styles;

p.connectionIndicator = function connectionIndicatorV0663(entities) {
  return previousConnectionIndicator.call(this, entities)
    .replace(
      '<span class="systemConnectionMain"><i></i><b>',
      '<i class="systemConnectionLamp" aria-hidden="true"></i><span class="systemConnectionCopy"><b>',
    )
    .replace(
      '</b></span><small class="freshness ',
      '</b><small class="freshness ',
    )
    .replace(
      '</small></button></div>',
      '</small></span></button></div>',
    );
};

p._render = function renderV0663() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0663() {
  return `${previousStyles.call(this)}
    /* UI v0.6.63 — NikaS Specialized Panel UI Standard v2.2 connection plaque. */
    .systemOverview>.connectionWrap{
      align-self:center;
      justify-self:end;
      width:168px;
      min-width:168px;
      max-width:100%;
      text-align:left;
    }
    .systemOverview .systemConnection{
      justify-self:end;
      display:grid;
      grid-template-columns:10px minmax(0,1fr);
      align-items:center;
      column-gap:11px;
      width:168px;
      min-width:168px;
      max-width:100%;
      min-height:58px;
      padding:12px 14px;
      border:1px solid color-mix(in srgb,var(--divider-color,#dfe3e8) 72%,transparent);
      border-radius:18px;
      background:var(--card-background-color,#fff);
      color:var(--disabled-text-color,var(--secondary-text-color,#6f6f72));
      box-shadow:0 4px 14px rgba(0,0,0,.055);
      white-space:nowrap;
    }
    .systemOverview .systemConnectionLamp{
      display:block;
      width:10px;
      height:10px;
      border-radius:50%;
      background:currentColor;
    }
    .systemOverview .systemConnectionCopy{
      display:flex;
      min-width:0;
      flex-direction:column;
      gap:3px;
    }
    .systemOverview .systemConnectionCopy b{
      color:currentColor;
      font-size:16px;
      font-weight:700;
      line-height:1.05;
      white-space:nowrap;
    }
    .systemOverview .systemConnectionCopy .freshness{
      display:block;
      margin:0;
      color:var(--secondary-text-color,#6f6f72);
      font-size:13px!important;
      font-weight:600;
      line-height:1.05;
      white-space:nowrap;
    }
    .systemOverview .systemConnection.ok{
      color:var(--success-color,#43a047);
      background:color-mix(in srgb,var(--success-color,#43a047) 11%,var(--card-background-color,#fff));
      border-color:color-mix(in srgb,var(--success-color,#43a047) 30%,var(--divider-color,#dfe3e8));
    }
    .systemOverview .systemConnection.reserve{
      color:var(--warning-color,#f6a623);
      background:color-mix(in srgb,var(--warning-color,#f6a623) 10%,var(--card-background-color,#fff));
      border-color:color-mix(in srgb,var(--warning-color,#f6a623) 30%,var(--divider-color,#dfe3e8));
    }
    .systemOverview .systemConnection.offline{
      color:var(--error-color,#db4437);
      background:color-mix(in srgb,var(--error-color,#db4437) 10%,var(--card-background-color,#fff));
      border-color:color-mix(in srgb,var(--error-color,#db4437) 30%,var(--divider-color,#dfe3e8));
    }
    .systemOverview .systemConnection.unknown{
      color:var(--disabled-text-color,var(--secondary-text-color,#6f6f72));
      background:color-mix(in srgb,var(--secondary-text-color,#6f6f72) 8%,var(--card-background-color,#fff));
      border-color:color-mix(in srgb,var(--secondary-text-color,#6f6f72) 28%,var(--divider-color,#dfe3e8));
    }
    .systemOverview .systemConnectionCopy .freshness.stale{
      color:var(--warning-color,#f6a623);
      font-weight:600;
    }
    .systemOverview .systemConnectionCopy .freshness.nodata{
      color:var(--secondary-text-color,#6f6f72);
    }
    @media(max-width:520px){
      .systemOverview>.connectionWrap,
      .systemOverview .systemConnection{
        width:168px;
        min-width:168px;
        max-width:100%;
      }
    }
  `;
};
