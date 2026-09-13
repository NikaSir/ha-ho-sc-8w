#!/usr/bin/env node
// Exercise the production panel and protect host-bound desktop geometry plus the compact mobile zone-card contract.
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
panel._drillZone = null;
panel._physicalZoneNumbers = () => [1];
panel._zoneIndicators = () => '<span class="zoneIndicators"><ha-icon class="ready"></ha-icon><ha-icon class="program"></ha-icon><ha-icon class="rain"></ha-icon></span>';
panel.zoneRuntime = () => ({
  tone: "ready",
  label: "Готова",
  duration: 10,
  starts: ["05:00"],
  start: "05:00",
  q: { schedule: "sensor.zone_1" },
  attrs: { calendar_mode: "interval", interval_days: 2, program_enabled: true },
});

const html = panel.zonesView({});
assert.match(
  html,
  /<button class="zoneCard ready"[^>]*><span class="scene scene1"[^>]*><\/span><span class="zoneCardText"><small class="zoneCardNumber">ЗОНА 1<\/small><b class="zoneCardStatus">Готова<\/b><span class="zoneCardSchedule">Каждые 2 дня<\/span><em class="zoneCardDuration">10 мин<\/em><span class="zoneCardTimes">05:00<\/span><\/span><span class="zoneIndicators">(?:<ha-icon[^>]*><\/ha-icon>){3}<\/span><ha-icon class="zoneChevron"[^>]*><\/ha-icon><\/button>/,
  "The mobile card must keep artwork left, three-row facts in the middle, and indicators plus chevron right",
);

const css = panel.styles();
function atRuleBodies(source, prelude) {
  const bodies = [];
  let cursor = 0;
  while ((cursor = source.indexOf(prelude, cursor)) !== -1) {
    const open = source.indexOf("{", cursor + prelude.length);
    if (open === -1) break;
    let depth = 1;
    let end = open + 1;
    while (end < source.length && depth > 0) {
      if (source[end] === "{") depth += 1;
      if (source[end] === "}") depth -= 1;
      end += 1;
    }
    if (depth === 0) bodies.push(source.slice(open + 1, end - 1));
    cursor = end;
  }
  return bodies;
}
const hostRules = [...css.matchAll(/:host\{([^}]*)\}/g)];
assert.ok(hostRules.length, "The panel must define host geometry");
const finalHostRule = hostRules.at(-1)[1];
assert.match(finalHostRule, /position:\s*relative/, "The final host geometry must be bound to the Home Assistant panel container");
assert.doesNotMatch(finalHostRule, /position:\s*fixed/, "The final host geometry must not escape beneath the desktop sidebar");
assert.match(finalHostRule, /(?:inline-size|width):\s*100%/, "The host must use the available panel-container width");

assert.match(css, /\.zoneCardText\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)\s+minmax\(0,1fr\)/, "Zone facts must use two equal information columns");
assert.match(css, /\.zoneCardNumber\{[^}]*grid-column:\s*1\s*\/\s*-1/, "The zone number must span the first row");
assert.match(css, /\.zoneCardSchedule\{[^}]*text-align:\s*right/, "The schedule must align as the right-hand fact");
assert.match(css, /\.zoneCardTimes\{[^}]*text-align:\s*right/, "Start times must align as the right-hand fact");
const phoneCss = atRuleBodies(css, "@media(max-width:520px)").join("\n");
assert.match(
  phoneCss,
  /\.zoneCards\{padding-bottom:72px\}\.zoneCard\{grid-template-columns:\s*62px\s+minmax\(0,1fr\)\s+auto\s+20px!important/,
  "At phone width the outer card grid must reserve columns for artwork, facts, indicators and chevron",
);

console.log(`Responsive host and mobile zone-card layout verified on ${entrypoint}`);
