import "./irrigation-panel-v032.js";

const UI_VERSION = "0.3.3";
const Panel = customElements.get("nikas-ho-sc-8w-panel");

function applyHeaderV12(root) {
  if (!root || root.querySelector("style[data-nikas-header-v12]")) return;

  const style = document.createElement("style");
  style.dataset.nikasHeaderV12 = "";
  style.textContent = `
    /* NikaS UI Standard v1.2: viewport-centered title, no decorative Header icon. */
    .appHeader {
      grid-template-columns: 82px minmax(0, 1fr) 82px !important;
    }

    .headerTitle {
      min-width: 0 !important;
      text-align: center !important;
    }

    .headerTitle strong {
      white-space: nowrap !important;
    }

    .headerTitle small {
      text-align: center !important;
    }

    .headerRight {
      width: 82px;
      min-height: 44px;
      pointer-events: none;
    }

    @media (max-width: 420px) {
      .appHeader {
        grid-template-columns: 74px minmax(0, 1fr) 74px !important;
      }

      .headerRight {
        width: 74px;
      }
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
    if (textNode.nodeValue?.includes("v0.3.2")) {
      textNode.nodeValue = textNode.nodeValue.replaceAll("v0.3.2", `v${UI_VERSION}`);
    }
  }
}

if (Panel && !Panel.prototype.__nikasUiStandardV12) {
  Panel.prototype.__nikasUiStandardV12 = true;

  Panel.prototype.header = function () {
    return `
      <header class="appHeader">
        <button class="backButton" data-back aria-label="Назад">
          <ha-icon icon="mdi:arrow-left"></ha-icon><span>Назад</span>
        </button>
        <div class="headerTitle">
          <strong>Полив</strong>
          <small>HO-SC-8W · UI v${UI_VERSION}</small>
        </div>
        <div class="headerRight" aria-hidden="true"></div>
      </header>
    `;
  };

  const previousRender = Panel.prototype.render;
  Panel.prototype.render = function (...args) {
    previousRender.apply(this, args);
    applyHeaderV12(this.shadowRoot);
    replaceUiVersion(this.shadowRoot);
  };
}
