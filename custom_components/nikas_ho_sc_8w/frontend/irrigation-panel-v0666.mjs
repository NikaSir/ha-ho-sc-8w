import "./irrigation-panel-v0665.mjs";

const UI_VERSION = "0.6.66";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousManualView = p.manualView;
const previousRender = p._render;
const previousStyles = p.styles;

p.manualView = function manualViewV0666(entities) {
  return previousManualView.call(this, entities)
    .replace(
      "<h1>Управление зонами</h1>",
      '<h1>Управление зонами</h1><p class="manualDurationHint">Выберите зоны и задайте длительность полива в минутах.</p>',
    )
    .replace(
      /<strong>(\d+)<small>мин<\/small><\/strong>/g,
      "<strong>$1</strong>",
    )
    .replace(
      '<p class="viewFootnote"><b>Примечание.</b> Выберите зоны и задайте длительность. Контроллер выполнит очередь сверху вниз.</p>',
      '<p class="viewFootnote"><b>Примечание.</b> Контроллер выполнит выбранные зоны по порядку сверху вниз.</p>',
    );
};

p._render = function renderV0666() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0666() {
  return `${previousStyles.call(this)}
    /* UI v0.6.66 — one shared minutes explanation instead of repeated unit labels. */
    .manualApprovedIntro .manualDurationHint{
      margin:5px 0 0;
      color:var(--muted);
      font-size:12px!important;
      line-height:1.3;
    }
    .manualDuration strong{
      display:grid;
      place-items:center;
      min-width:0;
      font-variant-numeric:tabular-nums;
    }
    @media(max-width:520px){
      .manualApprovedIntro .manualDurationHint{margin-top:4px}
    }
  `;
};
