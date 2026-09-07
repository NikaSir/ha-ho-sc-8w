#!/usr/bin/env node
// Offline behavior checks of the isolated parity lab. No browser or device I/O.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const panelPath = new URL("../custom_components/nikas_ho_sc_8w/frontend/irrigation-panel-v0706.mjs", import.meta.url);
const source = fs.readFileSync(panelPath, "utf8").replace(/^import[^\n]*\n/, "");
const PREPARE = "prepare_zone7_parity";
const EXECUTE = "execute_zone7_parity";
const CONFIRMATION = "WRITE_ZONE7_PARITY_ONCE";
const NOW = Date.parse("2026-09-07T12:00:00Z");

function block(zone, mode = 3) {
  return [zone, 10, 5, 255, 255, 255, 255, 255, 0, 255, 255, 255, 255, 255,
    mode, mode === 3 ? 1 : 0, mode === 3 ? 26 : 0, mode === 3 ? 9 : 0,
    mode === 3 ? 8 : 0, 17].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function prepared(overrides = {}) {
  return {
    status: "prepared", mode: "odd", plan_id: "parity-1", confirmation: CONFIRMATION,
    expires_at: new Date(NOW + 120_000).toISOString(), locked: false,
    source_read_hex: block(7), expected_read_hex: block(7, 1),
    write_hex: `40${block(7, 1).slice(2)}`, ...overrides,
  };
}

function harness(state = {}) {
  let now = NOW;
  const confirmations = [];
  const blobs = [];
  const anchors = [];
  const revoked = [];
  const timers = [];
  let onConfirm = () => false;
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  class Panel {
    constructor() {
      this.calls = [];
      this.notifications = [];
      this.data = { zone7_parity_probe: state };
      this.available = true;
      this.parentBusy = false;
      this.renders = 0;
      this.serviceAction = async () => undefined;
      this.handlers = {};
      this.shadowRoot = {
        addEventListener: (type, handler) => { this.handlers[type] = handler; },
        querySelector: () => null,
      };
      this._hass = { callService: async (domain, service, data) => {
        this.calls.push({ domain, service, data });
        return this.serviceAction(service, data);
      } };
    }
    commandBusy() { return this.parentBusy; }
    commandAvailable() { return this.available && !this.commandBusy(); }
    rejectUnavailableCommand(service) { return !this.commandAvailable(service); }
    diagnosticsView() { return '<section class="existing-diagnostics">Existing diagnostics</section>'; }
    _render() {}
    render() { this.renders += 1; }
    styles() { return ".existing-diagnostics{display:block}"; }
    serviceTargetData() { return { config_entry_id: "test-entry" }; }
    entities() { return { zones: { 7: { schedule: "zone7-schedule" } } }; }
    attrs() { return this.data; }
    notify(message) { this.notifications.push(message); }
    serviceError(error) { return String(error); }
    esc(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    }
  }
  vm.runInNewContext(source, {
    customElements: { get: () => Panel }, Date: Clock,
    window: { confirm: (message) => { confirmations.push(message); return onConfirm(message); } },
    Blob: class Blob {
      constructor(parts, options) { this.parts = parts; this.type = options.type; blobs.push(this); }
    },
    URL: {
      createObjectURL: () => "blob:offline-parity-report",
      revokeObjectURL: (url) => revoked.push(url),
    },
    document: { createElement: (tag) => {
      assert.equal(tag, "a");
      const anchor = { clicks: 0, click() { this.clicks += 1; } };
      anchors.push(anchor);
      return anchor;
    } },
    setTimeout: (callback) => { timers.push(callback); },
  }, { filename: panelPath.pathname });
  const panel = new Panel();
  panel._render();
  return {
    panel, confirmations, blobs, anchors, revoked, timers,
    confirm: (action = () => true) => { onConfirm = action; },
    advance: (milliseconds) => { now += milliseconds; },
    choose: (mode) => panel.handlers.change({ target: { value: mode, matches: () => true } }),
  };
}

const checks = [];
function check(name, run) { checks.push({ name, run }); }
const writes = (panel) => panel.calls.filter(({ service }) => service === EXECUTE);

check("preparation publishes a plan but never asks for confirmation or executes", async () => {
  const h = harness();
  h.choose("even");
  h.panel.serviceAction = async (service) => {
    assert.equal(service, PREPARE);
    h.panel.data.zone7_parity_probe = prepared({ mode: "even" });
  };
  await h.panel.prepareZone7Parity();
  assert.equal(h.panel.calls.length, 1);
  assert.equal(h.panel.calls[0].domain, "nikas_ho_sc_8w");
  assert.equal(h.panel.calls[0].data.mode, "even");
  assert.equal(h.panel.calls[0].data.config_entry_id, "test-entry");
  assert.equal(h.confirmations.length, 0);
  assert.equal(writes(h.panel).length, 0);
  assert.equal(h.panel.commandBusy(), false);
});

check("cancelled confirmation sends nothing and leaves the plan usable", async () => {
  const h = harness(prepared());
  await h.panel.executeZone7Parity();
  assert.equal(h.confirmations.length, 1);
  assert.equal(h.panel.calls.length, 0);
  assert.equal(h.panel._zone7ParityWriteReady(h.panel.data.zone7_parity_probe), true);
  assert.equal(h.panel.commandBusy(), false);
});

check("confirmed plan executes once despite unchanged websocket state", async () => {
  const h = harness(prepared());
  h.confirm();
  await h.panel.executeZone7Parity();
  await h.panel.executeZone7Parity();
  assert.equal(writes(h.panel).length, 1);
  assert.equal(h.confirmations.length, 1);
  assert.equal(h.panel.calls[0].data.plan_id, "parity-1");
  assert.equal(h.panel.calls[0].data.confirmation, CONFIRMATION);
  assert.equal(h.panel.calls[0].data.config_entry_id, "test-entry");
  assert.match(h.confirmations[0], /Нечётные дни/);
  assert(h.confirmations[0].includes(prepared().write_hex));
  assert.equal(h.panel.commandBusy(), false);
  assert.equal(h.panel._zone7ParityWriteReady(h.panel.data.zone7_parity_probe), false);
});

check("ambiguous service error consumes the token without retry or rollback", async () => {
  const h = harness(prepared());
  h.confirm();
  h.panel.serviceAction = async () => { throw new Error("connection lost after dispatch"); };
  await h.panel.executeZone7Parity();
  await h.panel.executeZone7Parity();
  assert.equal(h.panel.calls.length, 1);
  assert.equal(h.panel.calls[0].service, EXECUTE);
  assert.equal(h.confirmations.length, 1);
  assert.match(h.panel._zone7ParityError, /connection lost/);
  assert.equal(h.panel.commandBusy(), false);
  assert.equal(h.panel._zone7ParityWriteReady(h.panel.data.zone7_parity_probe), false);
});

check("an in-flight execution blocks repeated execute and prepare actions", async () => {
  const h = harness(prepared());
  h.confirm();
  let finish;
  h.panel.serviceAction = () => new Promise((resolve) => { finish = resolve; });
  const pending = h.panel.executeZone7Parity();
  assert.equal(h.panel.commandBusy(), true);
  await h.panel.executeZone7Parity();
  await h.panel.prepareZone7Parity();
  assert.equal(h.panel.calls.length, 1);
  finish();
  await pending;
  assert.equal(h.panel.commandBusy(), false);
});

check("missing, invalid, expired and locked plans cannot dispatch", async () => {
  for (const change of [
    { plan_id: "" }, { confirmation: "WRONG" }, { expires_at: "invalid" },
    { expires_at: new Date(NOW).toISOString() }, { locked: true },
    { status: "noop" }, { status: "mismatch" }, { mode: "even" },
  ]) {
    const h = harness(prepared(change));
    h.confirm();
    await h.panel.executeZone7Parity();
    assert.equal(h.panel.calls.length, 0, JSON.stringify(change));
    assert.equal(h.confirmations.length, 0, JSON.stringify(change));
  }
});

check("expiry while the confirmation is open prevents dispatch", async () => {
  const h = harness(prepared());
  h.confirm(() => { h.advance(120_001); return true; });
  await h.panel.executeZone7Parity();
  assert.equal(h.confirmations.length, 1);
  assert.equal(h.panel.calls.length, 0);
  assert.equal(h.panel.commandBusy(), false);
});

check("changing the selected mode cannot apply the other mode's plan", async () => {
  const h = harness(prepared());
  h.confirm();
  h.choose("even");
  await h.panel.executeZone7Parity();
  assert.equal(h.panel.calls.length, 0);
  assert.equal(h.confirmations.length, 0);
  h.choose("odd");
  h.confirm(() => { h.choose("even"); return true; });
  await h.panel.executeZone7Parity();
  assert.equal(h.confirmations.length, 1);
  assert.equal(h.panel.calls.length, 0);
});

check("unavailable commands and locked sessions make no service calls", async () => {
  for (const configure of [
    (panel) => { panel.available = false; },
    (panel) => { panel.parentBusy = true; },
    (panel) => { panel.data.zone7_parity_probe.locked = true; },
  ]) {
    const h = harness(prepared());
    h.confirm();
    configure(h.panel);
    await h.panel.prepareZone7Parity();
    await h.panel.executeZone7Parity();
    assert.equal(h.panel.calls.length, 0);
    assert.equal(h.confirmations.length, 0);
  }
});

check("mismatch and uncertain results cannot render a green success", () => {
  for (const status of ["mismatch", "uncertain", "rejected"]) {
    const h = harness(prepared({ status, locked: true, verified: false }));
    const html = h.panel._zone7ParityCard();
    assert.doesNotMatch(html, /class="ready"|class="dp38SnapshotState ok"/);
    assert.match(html, /data-zone7-parity-execute disabled/);
  }
  const unconfirmed = harness(prepared({ status: "verified", verified: false }));
  assert.doesNotMatch(unconfirmed.panel._zone7ParityCard(), /class="ready"|class="dp38SnapshotState ok"/);
  const verified = harness(prepared({ status: "verified", verified: true }));
  assert.match(verified.panel._zone7ParityCard(), /class="dp38SnapshotState ok"/);
  assert(verified.panel.diagnosticsView().includes("existing-diagnostics"));
});

check("download preserves every before/after zone and previous test without I/O", () => {
  const before = Array.from({ length: 8 }, (_, index) => ({ zone: index + 1, raw_hex: block(index + 1) }));
  const after = before.map((row) => ({ ...row, raw_hex: row.zone === 7 ? block(7, 1) : row.raw_hex }));
  const result = prepared({
    status: "verified", verified: true, before_snapshot: before, after_snapshot: after,
    actual_read_hex: block(7, 1), changed_zones: [7],
    changes: [{ zone: 7, before_hex: block(7), after_hex: block(7, 1), offsets: [14, 15, 16, 17, 18] }],
    history: [{ mode: "even", status: "verified", before_snapshot: before, after_snapshot: after, actual_read_hex: block(7, 2) }],
  });
  const h = harness(result);
  const original = JSON.stringify(result);
  h.panel.downloadZone7ParityReport();
  assert.equal(h.panel.calls.length, 0);
  assert.equal(h.confirmations.length, 0);
  assert.equal(h.blobs.length, 1);
  assert.equal(h.blobs[0].type, "application/json");
  const report = JSON.parse(h.blobs[0].parts.join(""));
  assert.equal(report.schema, "nikas.zone7-parity.v1");
  assert.equal(report.ui_version, "0.7.06");
  assert.deepEqual(report.result, result);
  assert.equal(report.result.before_snapshot.length, 8);
  assert.equal(report.result.after_snapshot.length, 8);
  assert.equal(report.result.history[0].before_snapshot.length, 8);
  assert.equal(report.result.history[0].after_snapshot.length, 8);
  assert.equal(JSON.stringify(result), original);
  assert.equal(h.anchors[0].clicks, 1);
  assert.equal(h.anchors[0].href, "blob:offline-parity-report");
  assert.equal(h.anchors[0].download, "ho-sc-8w-zone7-parity-report.json");
  h.timers.forEach((callback) => callback());
  assert.deepEqual(h.revoked, ["blob:offline-parity-report"]);
});

check("download without a captured baseline creates no empty report", () => {
  const h = harness();
  h.panel.downloadZone7ParityReport();
  assert.equal(h.blobs.length, 0);
  assert.equal(h.anchors.length, 0);
  assert.equal(h.panel.calls.length, 0);
});

let passed = 0;
for (const { name, run } of checks) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}
console.log(`Zone 7 parity UI: ${passed}/${checks.length} offline checks passed`);
