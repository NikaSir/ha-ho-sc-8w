import "./irrigation-panel-v03.js";

const UI_VERSION = "0.3.1";
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

function replaceVersion(root) {
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

if (Panel && !Panel.prototype.__nikasShellV031) {
  Panel.prototype.__nikasShellV031 = true;
  const originalRender = Panel.prototype.render;

  // Back is a deterministic application route. It never depends on browser history.
  Panel.prototype.goBack = function () {
    explicitNavigate(this._panel?.config?.parent_path || PARENT_ROUTE);
  };

  Panel.prototype.render = function (...args) {
    originalRender.apply(this, args);
    if (!this.shadowRoot) return;
    replaceVersion(this.shadowRoot);
    const nav = this.shadowRoot.querySelector(".bottomNav");
    if (nav) nav.setAttribute("aria-label", "Разделы Полив");
  };
}
