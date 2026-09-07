import "./irrigation-panel-v0709.mjs";

const UI_VERSION = "0.7.10";
const REFRESH_FEEDBACK_MIN_MS = 900;
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0709 panel is not registered");
const p = Panel.prototype;
const previousRenderV0710 = p._render;
const previousStylesV0710 = p.styles;

p._setRefreshFeedbackV0710 = function setRefreshFeedbackV0710(busy) {
  const buttons = this.shadowRoot?.querySelectorAll?.("[data-refresh]") || [];
  for (const button of buttons) {
    button.disabled = busy;
    button.classList.toggle("busy", busy);
    if (busy) {
      button.setAttribute("aria-busy", "true");
      button.setAttribute("aria-disabled", "true");
      button.setAttribute("aria-label", "Обновление данных");
    } else {
      button.removeAttribute("aria-busy");
      button.removeAttribute("aria-disabled");
      button.setAttribute("aria-label", "Обновить");
    }
  }
};

p.refreshNow = async function refreshNowV0710() {
  if (this._refreshBusy) return false;
  const startedAt = Date.now();
  this._refreshBusy = true;
  this._setRefreshFeedbackV0710(true);
  let updated = false;
  try {
    if (!this._hass?.callService) throw new Error("Home Assistant update service is unavailable");
    const e = this.entities();
    const ids = [
      e.connection, e.operation, e.irrigation, e.active, e.queued,
      e.rain, e.pressure, e.seasonal, e.timerError, e.cache,
      ...Object.values(e.zones || {}).flatMap((zone) => [zone.remaining, zone.elapsed, zone.schedule]),
    ].filter((id, index, all) => id && this.states()[id] && all.indexOf(id) === index);
    if (!ids.length) throw new Error("No entities are available for refresh");
    await this._hass.callService("homeassistant", "update_entity", { entity_id: ids });
    updated = true;
  } catch (_error) {
    this.notify("Не удалось обновить данные");
  } finally {
    const remaining = REFRESH_FEEDBACK_MIN_MS - (Date.now() - startedAt);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    this._refreshBusy = false;
    this._setRefreshFeedbackV0710(false);
  }
  return updated;
};

p.styles = function stylesV0710() {
  return `${previousStylesV0710.call(this)}
    /* UI v0.7.10 — unambiguous feedback for the global refresh action. */
    .refreshButton.busy{cursor:wait;background:color-mix(in srgb,var(--a) 11%,var(--card));border-color:color-mix(in srgb,var(--a) 38%,var(--line))}
    .refreshButton.busy ha-icon{animation:nikasRefreshSpin .9s linear infinite;transform-origin:center}
    @keyframes nikasRefreshSpin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.refreshButton.busy ha-icon{animation:none;opacity:.45}}
  `;
};

p._render = function renderV0710() {
  previousRenderV0710.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
  this._setRefreshFeedbackV0710(Boolean(this._refreshBusy));
};
