import "./irrigation-panel-v03.js";

const UI_VERSION = "0.3.2";
const PARENT_ROUTE = "/dashboard-actions";
const Panel = customElements.get("nikas-ho-sc-8w-panel");

function explicitNavigate(path) {
  const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.history.pushState({ from }, "", path);
  window.dispatchEvent(
    new CustomEvent("location-changed", {
      bubbles: true,
      composed: true,
      detail: { replace: false },
    }),
  );
}

function applyTabBarContract(root) {
  if (!root || root.querySelector("style[data-nikas-tabbar-v032]")) return;

  const style = document.createElement("style");
  style.dataset.nikasTabbarV032 = "";
  style.textContent = `
    /* NikaS specialized-panel standard: full-width docked Tab Bar, never floating. */
    .app {
      padding-bottom: calc(108px + env(safe-area-inset-bottom)) !important;
    }

    .bottomNav {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 7px 10px calc(7px + env(safe-area-inset-bottom)) !important;
      border-top: 1px solid var(--line) !important;
      border-radius: 0 !important;
      background: color-mix(in srgb, var(--bg) 96%, transparent) !important;
      box-shadow: none !important;
      transform: none !important;
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
    }

    .bottomNavInner {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 4px !important;
      width: 100% !important;
      max-width: 860px !important;
      margin: 0 auto !important;
      padding: 0 !important;
    }

    .bottomNav button {
      min-width: 0 !important;
      min-height: 54px !important;
      margin: 0 !important;
      border: 0 !important;
      border-radius: 12px !important;
      background: transparent !important;
      box-shadow: none !important;
      transform: none !important;
    }

    .bottomNav button.active {
      background: color-mix(in srgb, var(--a) 10%, transparent) !important;
      color: var(--a) !important;
      box-shadow: none !important;
      transform: none !important;
    }
  `;
  root.appendChild(style);
}

function replaceUiVersion(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  for (const textNode of nodes) {
    if (textNode.nodeValue?.includes("v0.3.0")) {
      textNode.nodeValue = textNode.nodeValue.replaceAll("v0.3.0", `v${UI_VERSION}`);
    }
  }
}

if (Panel && !Panel.prototype.__nikasTabBarV032) {
  Panel.prototype.__nikasTabBarV032 = true;
  const previousRender = Panel.prototype.render;

  Panel.prototype.goBack = function () {
    explicitNavigate(this._panel?.config?.parent_path || PARENT_ROUTE);
  };

  Panel.prototype.render = function (...args) {
    previousRender.apply(this, args);
    applyTabBarContract(this.shadowRoot);
    replaceUiVersion(this.shadowRoot);
    const nav = this.shadowRoot?.querySelector(".bottomNav");
    if (nav) nav.setAttribute("aria-label", "Разделы Полив");
  };
}
