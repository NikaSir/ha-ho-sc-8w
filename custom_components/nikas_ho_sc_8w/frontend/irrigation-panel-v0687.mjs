import "./irrigation-panel-v0686.mjs";

const UI_VERSION = "0.6.87";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0686 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p._programEditorNativeControlActive = function programEditorNativeControlActiveV0687() {
  if (this._view !== "program") return false;
  const active = this.shadowRoot?.activeElement;
  return Boolean(
    this._programNativePickerOpen ||
    active?.matches?.("[data-program-zone-edit], [data-program-start]")
  );
};

p._ensureV0687Events = function ensureV0687Events() {
  if (this._v0687EventsBound) return;
  this._v0687EventsBound = true;

  this.shadowRoot.addEventListener("pointerdown", (event) => {
    const control = event.target?.closest?.("[data-program-zone-edit], [data-program-start]");
    this._programNativePickerOpen = Boolean(control);
  }, true);

  this.shadowRoot.addEventListener("focusin", (event) => {
    if (event.target?.matches?.("[data-program-zone-edit], [data-program-start]")) {
      this._programNativePickerOpen = true;
    }
  }, true);

  this.shadowRoot.addEventListener("focusout", (event) => {
    if (!event.target?.matches?.("[data-program-zone-edit], [data-program-start]")) return;
    window.setTimeout(() => {
      const active = this.shadowRoot?.activeElement;
      if (active?.matches?.("[data-program-zone-edit], [data-program-start]")) return;
      this._programNativePickerOpen = false;
      if (this._view === "program") {
        this._programForceRender = true;
        try { this.render(); } finally { this._programForceRender = false; }
      }
    }, 80);
  }, true);

  this.shadowRoot.addEventListener("change", (event) => {
    if (!event.target?.matches?.("[data-program-zone-edit], [data-program-start]")) return;
    window.setTimeout(() => {
      this._programNativePickerOpen = false;
      if (this._view === "program") {
        this._programForceRender = true;
        try { this.render(); } finally { this._programForceRender = false; }
      }
    }, 120);
  }, true);
};

p._render = function renderV0687() {
  if (!this._programForceRender && this._programEditorNativeControlActive()) {
    const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
    if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
    return;
  }
  previousRender.call(this);
  this._ensureV0687Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0687() {
  return `${previousStyles.call(this)}
    /* UI v0.6.87 — native picker stability and explicit zone imagery. */
    .zoneProgramScene,.zoneRow .scene,.manualZone .scene{background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}
    .scene1{background-image:url("/nikas-ho-sc-8w/assets/zone-1.webp")!important}
    .scene2{background-image:url("/nikas-ho-sc-8w/assets/zone-2.webp")!important}
    .scene3{background-image:url("/nikas-ho-sc-8w/assets/zone-3.webp")!important}
    .scene4{background-image:url("/nikas-ho-sc-8w/assets/zone-4.webp")!important}
    .scene5{background-image:url("/nikas-ho-sc-8w/assets/zone-5.webp")!important}
    .scene6{background-image:url("/nikas-ho-sc-8w/assets/zone-6.webp")!important}
    .programEditField input,.programEditField select,.programEditStart input,.programInterval input{touch-action:manipulation}
  `;
};
