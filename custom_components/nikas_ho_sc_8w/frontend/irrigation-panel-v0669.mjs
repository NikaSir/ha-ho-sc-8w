import "./irrigation-panel-v0668.mjs";

const UI_VERSION = "0.6.69";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0668 panel is not registered");
const p = Panel.prototype;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousDecorateProgramFreshness = p._decorateProgramFreshnessV0668;
const previousRender = p._render;
const previousStyles = p.styles;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

p.refreshProgramDp38 = async function refreshProgramDp38V0669() {
  if (this._programDp38RefreshBusy) return;
  let attempts = 0;
  do {
    attempts += 1;
    await previousRefreshProgramDp38.call(this);
    if (this._programDp38RefreshStatus === "fresh") break;
    if (attempts < 3) await sleep(450);
  } while (attempts < 3);
  this._programDp38RefreshAttempts = attempts;
  this.render();
};

p._decorateProgramFreshnessV0668 = function decorateProgramFreshnessV0669() {
  previousDecorateProgramFreshness.call(this);
  const root = this.shadowRoot;
  if (!root) return;
  const line = root.querySelector(".dp38InlineFreshness");
  if (!line) return;
  const heading = [...root.querySelectorAll("h1,h2,h3,h4")]
    .find((node) => /^Зона\s+[1-8]$/.test((node.textContent || "").trim()));
  if (!heading) return;
  const section = heading.closest("section") || heading.parentElement?.parentElement;
  if (!section) return;
  const headerBlock = [...section.children].find((child) => child.contains?.(heading));
  if (headerBlock && line.parentElement !== section) {
    headerBlock.insertAdjacentElement("afterend", line);
  } else if (line.parentElement !== section) {
    section.prepend(line);
  }
  line.classList.add("fullWidth");
};

p._render = function renderV0669() {
  previousRender.call(this);
  this._decorateProgramFreshnessV0668();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0669() {
  return `${previousStyles.call(this)}
    .dp38InlineFreshness.fullWidth{width:100%;max-width:none;box-sizing:border-box;display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px;padding:0;grid-column:1/-1;align-self:stretch}
    .dp38InlineFreshness.fullWidth b{white-space:nowrap}
    .dp38InlineFreshness.fullWidth em{min-width:0;flex:1 1 240px;white-space:normal;overflow-wrap:normal;word-break:normal}
  `;
};
