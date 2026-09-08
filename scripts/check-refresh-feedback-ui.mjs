#!/usr/bin/env node
// Offline behavior checks for the global Header refresh action. No HA/device I/O.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const component = path.join(root, "custom_components/nikas_ho_sc_8w");
const constSource = fs.readFileSync(path.join(component, "const.py"), "utf8");
const bundle = constSource.match(/^PANEL_JS_URL\s*=.*\/(irrigation-panel(?:-v\d+\.mjs|\.js))/m)?.[1];
assert.ok(bundle, "The registered production entrypoint must be discoverable");

let now = 10_000;
const timers = [];
class Clock extends Date {
  static now() { return now; }
}
const registry = new Map();
const storage = { getItem: () => null, setItem() {}, removeItem() {} };
const browser = { localStorage: storage, confirm: () => true };
const context = vm.createContext({
  HTMLElement: class {},
  customElements: { get: (name) => registry.get(name), define: (name, value) => registry.set(name, value) },
  localStorage: storage, window: browser, URL, console, Date: Clock,
  setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
  clearTimeout() {},
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

function buttonFixture() {
  const classes = new Set();
  const attributes = new Map([["aria-label", "Обновить"]]);
  return {
    querySelector: () => ({
      setAttribute: (name, value) => attributes.set("icon:" + name, value),
    }),
    disabled: false,
    classList: {
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
      contains: (name) => classes.has(name),
    },
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    getAttribute: (name) => attributes.get(name) ?? null,
  };
}

function fixture({ entities = true, service = "deferred" } = {}) {
  timers.length = 0;
  now = 10_000;
  const button = buttonFixture();
  const calls = [], notices = [];
  let resolveService;
  let rejectService;
  const panel = Object.create(Panel.prototype);
  panel.shadowRoot = {
    querySelectorAll: (selector) => selector === "[data-refresh]" ? [button] : [],
    querySelector: () => null,
  };
  panel.entities = () => ({
    connection: "sensor.connection", operation: "sensor.operation", zones: {},
  });
  const states = entities ? {
    "sensor.connection": { state: "local" }, "sensor.operation": { state: "Auto" },
  } : {};
  panel.states = () => states;
  panel.notify = (message) => notices.push(message);
  panel._hass = service === "missing" ? { states } : {
    states,
    callService: (domain, name, data) => {
      calls.push({ domain, name, data });
      if (service === "success") return Promise.resolve();
      if (service === "failure") return Promise.reject(new Error("offline"));
      return new Promise((resolve, reject) => { resolveService = resolve; rejectService = reject; });
    },
  };
  return { panel, button, calls, notices, resolveService: () => resolveService(), rejectService: () => rejectService(new Error("offline")) };
}

async function settleToTimer(expectedDelay = 900) {
  for (let index = 0; index < 8 && timers.length === 0; index += 1) await Promise.resolve();
  assert.equal(timers.length, 1, "refresh feedback must remain visible through the minimum interval");
  assert.equal(timers[0].delay, expectedDelay);
  timers.shift().callback();
}

{
  const h = fixture();
  const pending = h.panel.refreshNow();
  assert.equal(h.button.disabled, true);
  assert.equal(h.button.classList.contains("busy"), true);
  assert.equal(h.button.getAttribute("aria-busy"), "true");
  assert.equal(h.button.getAttribute("aria-disabled"), "true");
  assert.equal(h.button.getAttribute("aria-label"), "Обновление данных");
  assert.equal(h.calls.length, 1);
  assert.equal(await h.panel.refreshNow(), false, "a repeated activation must be rejected while busy");
  assert.equal(h.calls.length, 1, "a repeated activation must not start another HA refresh");
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls[0])), {
    domain: "homeassistant", name: "update_entity",
    data: { entity_id: ["sensor.connection", "sensor.operation"] },
  });
  now += 350;
  h.resolveService();
  await settleToTimer(550);
  assert.equal(await pending, true);
  assert.equal(h.button.disabled, false);
  assert.equal(h.button.classList.contains("busy"), false);
  assert.equal(h.button.getAttribute("aria-busy"), null);
  assert.equal(h.button.getAttribute("aria-disabled"), null);
  assert.equal(h.button.getAttribute("aria-label"), "Запрос обновления выполнен");
  assert.equal(h.button.getAttribute("icon:icon"), "mdi:check");
  assert.equal(h.button.classList.contains("refresh-success"), true);
  h.panel._setRefreshFeedbackV0710(false);
  assert.equal(h.button.getAttribute("icon:icon"), "mdi:check", "HA repaint must preserve the result");
  assert.equal(timers[0].delay, 1400);
  timers.shift().callback();
  assert.equal(h.button.getAttribute("icon:icon"), "mdi:refresh");
  assert.equal(h.button.getAttribute("aria-label"), "Обновить");
}

for (const options of [{ service: "failure" }, { service: "missing" }, { entities: false, service: "success" }]) {
  const h = fixture(options);
  const pending = h.panel.refreshNow();
  await settleToTimer();
  assert.equal(await pending, false);
  assert.deepEqual(h.notices, ["Не удалось обновить данные"]);
  assert.equal(h.button.getAttribute("icon:icon"), "mdi:alert-circle-outline");
  assert.equal(h.button.classList.contains("refresh-error"), true);
  timers.shift().callback();
  assert.equal(h.button.getAttribute("icon:icon"), "mdi:refresh");
  assert.equal(h.button.disabled, false);
  assert.equal(h.button.classList.contains("busy"), false);
}

const styles = Panel.prototype.styles.call(Object.create(Panel.prototype));
assert.match(styles, /\.refreshButton\.busy ha-icon\{animation:nikasRefreshSpin \.9s linear infinite/);
assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
console.log(`Refresh-feedback UI checks passed on ${bundle} (${loaded.size} production modules)`);
