#!/usr/bin/env node
// Protect the user-visible default zone artwork while preserving explicit browser choices.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const component = path.join(root, "custom_components/nikas_ho_sc_8w");
const constSource = fs.readFileSync(path.join(component, "const.py"), "utf8");
const entrypoint = constSource.match(/^PANEL_JS_URL\s*=.*\/(irrigation-panel(?:-v\d+)?\.(?:mjs|js))/m)?.[1];
assert.ok(entrypoint, "The registered production entrypoint must be discoverable");

const registry = new Map();
const storage = { getItem: () => null, setItem() {}, removeItem() {} };
const context = vm.createContext({
  HTMLElement: class {},
  customElements: { get: (name) => registry.get(name), define: (name, value) => registry.set(name, value) },
  localStorage: storage,
  window: { localStorage: storage, confirm: () => false, setTimeout },
  URL, console, setTimeout, clearTimeout, structuredClone,
});
const loaded = new Set();
function load(filename) {
  filename = path.resolve(filename);
  assert.ok(filename.startsWith(component + path.sep), "Imports must remain inside the integration");
  if (loaded.has(filename)) return;
  loaded.add(filename);
  const source = fs.readFileSync(filename, "utf8").replace(
    /^import\s+["']([^"']+)["'];?\s*$/gm,
    (_statement, specifier) => {
      assert.ok(specifier.startsWith("./"), "Only local side-effect imports are supported");
      load(path.resolve(path.dirname(filename), specifier.split("?")[0]));
      return "";
    },
  );
  vm.runInContext(`(function(){\n${source}\n})();`, context, { filename });
}
load(path.join(component, "frontend", entrypoint));

const Panel = registry.get("nikas-ho-sc-8w-panel");
assert.ok(Panel, "The production panel must register");

const properties = new Map();
const attributes = new Map();
const panel = Object.create(Panel.prototype);
panel.style = { setProperty: (name, value) => properties.set(name, value) };
panel.toggleAttribute = (name, force) => attributes.set(name, force);
panel._applyZoneArtwork();

const expected = {
  1: "zone-lawn-v2.webp",
  2: "zone-lawn-v2.webp",
  3: "zone-lawn-v2.webp",
  4: "zone-flowers-v2.webp",
  5: "zone-shrubs-v2.webp",
  6: "zone-greenhouse-v2.webp",
};
for (const [zone, filename] of Object.entries(expected)) {
  assert.match(
    properties.get(`--zone-artwork-${zone}`) || "",
    new RegExp(`/nikas-ho-sc-8w/assets/${filename.replaceAll(".", "\\.")}(?:\\?v=[^)\"]+)?`),
    `Zone ${zone} must show its bundled default artwork when the browser has no saved choice`,
  );
  assert.equal(attributes.get(`data-zone-artwork-${zone}-none`), false, `Zone ${zone} must not be marked as artwork-free by default`);
}

const explicitNoneProperties = new Map();
const explicitNoneAttributes = new Map();
const explicitNonePanel = Object.create(Panel.prototype);
explicitNonePanel.__zoneArtworkState = { 1: "none" };
explicitNonePanel.style = { setProperty: (name, value) => explicitNoneProperties.set(name, value) };
explicitNonePanel.toggleAttribute = (name, force) => explicitNoneAttributes.set(name, force);
explicitNonePanel._applyZoneArtwork();
assert.equal(explicitNoneProperties.get("--zone-artwork-1"), "none", "An explicit Без картинки choice must remain authoritative");
assert.equal(explicitNoneAttributes.get("data-zone-artwork-1-none"), true, "An explicit Без картинки choice must keep the neutral state marker");

console.log(`Default zone artwork verified on ${entrypoint}`);
