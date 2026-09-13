#!/usr/bin/env node
// Exercise the production style cascade and protect Home Assistant theme inheritance.
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
const panel = Object.create(Panel.prototype);
const css = panel.styles();

const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
const rules = [...cssWithoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
  selectors: match[1].split(",").map((selector) => selector.trim()),
  body: match[2],
}));
function finalDeclaration(selector, property) {
  let value = null;
  for (const rule of rules) {
    if (!rule.selectors.includes(selector)) continue;
    for (const declaration of rule.body.split(";")) {
      const separator = declaration.indexOf(":");
      if (separator === -1) continue;
      const name = declaration.slice(0, separator).trim();
      if (name === property) value = declaration.slice(separator + 1).trim();
    }
  }
  return value;
}

assert.match(finalDeclaration(":host", "--card") || "", /var\(--card-background-color/, "Card surfaces must inherit the active Home Assistant theme");
assert.match(finalDeclaration(":host", "--bg") || "", /var\(--primary-background-color/, "The panel background must inherit the active Home Assistant theme");
assert.match(finalDeclaration(":host", "--text") || "", /var\(--primary-text-color/, "Primary text must inherit the active Home Assistant theme");
assert.match(finalDeclaration(":host", "--muted") || "", /var\(--secondary-text-color/, "Secondary text must inherit the active Home Assistant theme");
assert.equal(finalDeclaration(":host", "color-scheme"), "light dark", "Native controls must support both Home Assistant color schemes");

for (const selector of [".zoneCard", ".hero", ".metric", ".programRow", ".diagList button"]) {
  assert.equal(finalDeclaration(selector, "background"), "var(--card)", `${selector} must use the themed card surface`);
  assert.equal(finalDeclaration(selector, "color"), "var(--text)", `${selector} must use themed text`);
}
assert.match(finalDeclaration(".appHeader", "background") || "", /var\(--bg\)/, "The Header must use the themed panel background");
assert.match(finalDeclaration(".bottomNav", "background") || "", /var\(--bg\)/, "The Bottom Tab Bar must use the themed panel background");
assert.equal(finalDeclaration(".systemDiagram", "background"), "var(--card)", "The system diagram must not remain a white island in dark mode");
assert.equal(finalDeclaration(".zoneRow .diagramZone", "background"), "var(--card)", "Diagram zone cards must use the themed card surface");
assert.equal(finalDeclaration(".heroHead p", "color"), "var(--muted)", "Hero supporting text must use the themed secondary text color");
assert.equal(
  finalDeclaration(".schemaGrid .diagramZone.running", "background"),
  "color-mix(in srgb,var(--a) 10%,var(--card))!important",
  "The active diagram zone must override the legacy important white surface",
);

console.log(`Home Assistant light/dark theme inheritance verified on ${entrypoint}`);
