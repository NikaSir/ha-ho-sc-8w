#!/usr/bin/env node
// Load the registered production import graph. All HA/device calls are stubs.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const component = path.join(root, "custom_components/nikas_ho_sc_8w");
const constSource = fs.readFileSync(path.join(component, "const.py"), "utf8");
const bundle = constSource.match(/^PANEL_JS_URL\s*=.*\/(irrigation-panel-v\d+\.mjs)/m)?.[1];
assert.ok(bundle, "The registered production entrypoint must be discoverable");
const registry = new Map();
const storage = { getItem: () => null, setItem() {}, removeItem() {} };
const browser = { localStorage: storage, confirm: () => true };
const context = vm.createContext({
  HTMLElement: class {},
  customElements: { get: (name) => registry.get(name), define: (name, value) => registry.set(name, value) },
  localStorage: storage, window: browser, URL, console,
  setTimeout, clearTimeout,
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
      assert.ok(specifier.startsWith("./"), "Only known local side-effect imports are supported");
      load(path.resolve(path.dirname(filename), specifier.split("?")[0]));
      return "";
    },
  );
  vm.runInContext(`(function(){\n${source}\n})();`, context, { filename });
}
load(path.join(component, "frontend", bundle));
const Panel = registry.get("nikas-ho-sc-8w-panel");
assert.ok(Panel);

function fixture() {
  const panel = Object.create(Panel.prototype);
  const calls = [], notices = [];
  const attributes = {
    manual_skip_allowed: true, manual_skip_zone: 2, manual_session_id: "session-a",
  };
  panel._panel = { config: { entry_id: "offline-controller" } };
  panel._manualQueue = [2, 4, 6];
  panel._manualDurations = { 2: 10, 4: 7, 6: 3 };
  panel._manualBusy = false;
  panel._seasonalBusy = false;
  panel._hass = {
    connection: { connected: true },
    services: { nikas_ho_sc_8w: { skip_current_manual: {}, start_manual_queue: {}, stop_manual: {} } },
    states: {
      "sensor.connection": { state: "local" },
      "sensor.operation": { state: "Manual" },
      "sensor.active": { state: "2", attributes },
    },
    callService: async (domain, service, data) => { calls.push({ domain, service, data }); },
  };
  panel.entities = () => ({
    connection: "sensor.connection", operation: "sensor.operation", active: "sensor.active",
  });
  panel._physicalZoneNumbers = () => [2, 4, 6];
  panel.render = () => {};
  panel.refreshNow = async () => {};
  panel.notify = (message) => notices.push(message);
  browser.confirm = () => true;
  return { panel, calls, notices, attributes };
}

for (const mode of ["Auto", "OFF", "unknown", "unavailable"]) {
  const { panel, calls } = fixture();
  panel._hass.states["sensor.operation"].state = mode;
  assert.equal(panel.commandAvailable("skip_current_manual"), false, mode);
  await panel.stopCurrentManual(2);
  assert.equal(calls.length, 0, mode);
}
for (const mutate of [
  ({ panel }) => { delete panel._hass.states["sensor.active"]; },
  ({ panel }) => { panel._hass.states["sensor.active"].state = "unavailable"; },
  ({ panel }) => { panel._hass.connection.connected = false; },
  ({ panel }) => { panel._manualBusy = true; },
  ({ panel }) => { delete panel._hass.services.nikas_ho_sc_8w.skip_current_manual; },
  ({ attributes }) => { attributes.manual_skip_allowed = false; },
  ({ attributes }) => { attributes.manual_skip_allowed = "true"; },
  ({ attributes }) => { delete attributes.manual_skip_allowed; },
  ({ attributes }) => { attributes.manual_session_id = ""; },
  ({ attributes }) => { attributes.manual_skip_zone = 0; },
  ({ attributes }) => { attributes.manual_skip_zone = "2"; },
]) {
  const state = fixture();
  mutate(state);
  assert.equal(state.panel.commandAvailable("skip_current_manual"), false);
  await state.panel.stopCurrentManual(2);
  assert.equal(state.calls.length, 0);
}
{
  const { panel, calls } = fixture();
  await panel.stopCurrentManual(4);
  assert.equal(calls.length, 0, "An old zone button cannot target the current zone");
  panel._hass.states["sensor.operation"].state = "Auto";
  assert.equal(panel.commandAvailable("stop_manual"), true, "Stop All remains available");
}
for (const change of ["session", "zone", "mode"]) {
  const { panel, calls, attributes } = fixture();
  browser.confirm = () => {
    if (change === "session") attributes.manual_session_id = "session-b";
    if (change === "zone") attributes.manual_skip_zone = 4;
    if (change === "mode") panel._hass.states["sensor.operation"].state = "Auto";
    return true;
  };
  await panel.stopCurrentManual(2);
  assert.equal(calls.length, 0, `Changed ${change} during confirmation`);
}
{
  const { panel, calls } = fixture();
  browser.confirm = () => false;
  await panel.stopCurrentManual(2);
  assert.equal(calls.length, 0);
}
{
  const { panel, calls } = fixture();
  assert.equal(panel.commandAvailable("skip_current_manual"), true);
  await panel.stopCurrentManual(2);
  assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), {
    domain: "nikas_ho_sc_8w", service: "skip_current_manual",
    data: { config_entry_id: "offline-controller", expected_zone: 2, expected_session_id: "session-a" },
  });
  assert.deepEqual([...panel._manualQueue], [4, 6]);
  assert.equal(panel._manualBusy, false);
}
{
  const { panel, notices } = fixture();
  panel._hass.callService = async () => { throw new Error("Session changed before dispatch"); };
  await panel.stopCurrentManual(2);
  assert.equal(panel._manualBusy, false);
  assert.deepEqual([...panel._manualQueue], [2, 4, 6]);
  assert.ok(notices.some((message) => message.includes("Session changed")));
}
console.log(`Manual-session UI checks passed on ${bundle} (${loaded.size} production modules)`);
