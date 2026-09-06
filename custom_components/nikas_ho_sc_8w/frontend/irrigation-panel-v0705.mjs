import "./irrigation-panel-v0704.mjs";

const UI_VERSION = "0.7.05";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0704 panel is not registered");
const p = Panel.prototype;
const previousReadOnlyCard = p._programReadOnlyCardV0690;
const previousRender = p._render;

const snapshotStamp = (text) => {
  const value = String(text || "");
  const ru = value.match(/\b\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\b/);
  if (ru) return ru[0];
  const iso = value.match(/\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?/);
  return iso ? iso[0].replace("T", " ") : "";
};

function consolidateProgramSnapshot(card, fallbackStamp = "") {
  if (!card) return;
  const hero = card.querySelector(":scope > .zoneProgramHero");
  const canonical = card.querySelector(":scope > .programReadFresh");
  if (!hero || !canonical) return;

  let stale = false;
  let stamp = snapshotStamp(canonical.textContent) || fallbackStamp;
  let node = hero.nextElementSibling;
  while (node && node !== canonical) {
    const next = node.nextElementSibling;
    const text = node.textContent || "";
    if (/Данные\s+устарели/i.test(text)) stale = true;
    if (!stamp) stamp = snapshotStamp(text);
    node.remove();
    node = next;
  }

  const label = canonical.querySelector("b");
  if (label) {
    label.textContent = `${stale ? "Данные устарели" : "Данные актуальны"} · DP38${stamp ? ` · ${stamp}` : ""}`;
  }
  card.classList.toggle("programSnapshotStale", stale);
  card.classList.toggle("programSnapshotFresh", !stale);
}

p._programReadOnlyCardV0690 = function programReadOnlyCardV0705(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousReadOnlyCard.call(this, entities, zone);
  const card = template.content.querySelector(".programReadOnly");
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const fallback = attrs.updated_at || attrs.received_at || attrs.last_update || "";
  consolidateProgramSnapshot(card, snapshotStamp(fallback) || String(fallback || ""));
  return template.innerHTML;
};

p._syncSingleProgramFreshnessV0705 = function syncSingleProgramFreshnessV0705() {
  if (this._view !== "program") return;
  const entities = this.entities();
  const zone = Number(this._programZone) || 1;
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const fallback = attrs.updated_at || attrs.received_at || attrs.last_update || "";
  for (const card of this.shadowRoot?.querySelectorAll(".programReadOnly") || []) {
    consolidateProgramSnapshot(card, snapshotStamp(fallback) || String(fallback || ""));
  }
};

p._render = function renderV0705() {
  previousRender.call(this);
  this._syncSingleProgramFreshnessV0705();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
