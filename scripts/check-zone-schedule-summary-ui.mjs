#!/usr/bin/env node
// Exercise the production panel import graph and verify readable schedule summaries.
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
panel._physicalZoneNumbers = () => [1, 2, 3, 4, 5, 6];
panel._zoneIndicators = () => '<span class="zoneIndicators"></span>';
panel.zoneRuntime = (_entities, zone) => ({
  tone: zone === 6 ? "off" : "ready",
  label: zone === 6 ? "Выключена" : "Готова",
  duration: zone * 10,
  starts: ["05:00"],
  start: "05:00",
  q: { schedule: `sensor.zone_${zone}` },
  attrs: [
    { calendar_mode: "interval", interval_days: 2, program_enabled: true },
    { calendar_mode: "interval", interval_days: 1, program_enabled: true },
    { calendar_mode: "weekly", weekdays: ["mon", "wed", "fri"], program_enabled: true },
    { calendar_mode: "odd", program_enabled: true },
    { calendar_mode: "even", program_enabled: true },
    { calendar_mode: "weekly", weekdays: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"], program_enabled: false },
  ][zone - 1],
});

const html = panel.zonesView({});
for (const expected of [
  "Каждые 2 дня",
  "Ежедневно",
  "Пн · Ср · Пт",
  "Нечётные дни",
  "Чётные дни",
  "Расписание выключено",
]) assert.ok(html.includes(expected), `Missing schedule summary: ${expected}`);
assert.equal((html.match(/class="zoneCardSchedule/g) || []).length, 6);

console.log(`Zone schedule summaries verified on ${entrypoint} (${loaded.size} production modules)`);
