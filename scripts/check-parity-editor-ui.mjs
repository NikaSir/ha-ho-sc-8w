#!/usr/bin/env node
// Exercise the real editor wrapper chain without a browser or controller I/O.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const frontend = new URL("../custom_components/nikas_ho_sc_8w/frontend/", import.meta.url);
const versions = [...Array.from({ length: 14 }, (_, i) => `06${86 + i}`),
  ...Array.from({ length: 8 }, (_, i) => `070${i}`)];
const TODAY = "2026-09-07";
const clean = (value) => JSON.parse(JSON.stringify(value));

function factual(overrides = {}) {
  return {
    raw_hex: "07020EFFFFFFFFFF18FFFFFFFFFF020000000011",
    duration_minutes: 2, start_slots: ["14:24", null, null, null, null, null],
    calendar_mode: "even", weekdays: [], interval_days: 0,
    anchor_date: "2026-09-07", rain_sensor_follow: true, program_enabled: true,
    ...overrides,
  };
}

function harness(attributes = factual()) {
  const confirmations = [];
  let confirmResult = () => false;
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : ["2026-09-07T12:00:00"])); }
    static now() { return new Clock().getTime(); }
  }
  class Panel {
    constructor() {
      this.data = clean(attributes);
      this.calls = [];
      this.notifications = [];
      this.handlers = {};
      this.available = true;
      this.parentBusy = false;
      this.states = { connection: "local", operation: "auto", active: "", queued: "" };
      this.refreshes = 0;
      this.serviceAction = async () => undefined;
      this.shadowRoot = {
        addEventListener: (type, handler, capture) => {
          (this.handlers[type] ||= []).push({ handler, capture });
        },
        querySelector: () => null,
        querySelectorAll: () => [],
      };
      this._hass = { callService: async (domain, service, data) => {
        this.calls.push({ domain, service, data: clean(data) });
        return this.serviceAction(service, data);
      } };
    }
    entities() {
      return {
        connection: "connection", operation: "operation", active: "active", queued: "queued",
        zones: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i + 1, { schedule: `zone${i + 1}` }])),
      };
    }
    attrs() { return this.data; }
    state(entity) { return this.states[entity]; }
    zoneSet(value) { return new Set(value ? String(value).split(",") : []); }
    commandBusy() { return this.parentBusy; }
    commandAvailable() { return this.available && !this.commandBusy(); }
    serviceTargetData() { return { config_entry_id: "offline-editor" }; }
    serviceError(error) { return String(error); }
    notify(message) { this.notifications.push(message); }
    render() { this.onRender?.(); }
    _render() {}
    styles() { return ""; }
    statusView() { return ""; }
    manualView() { return ""; }
    diagnosticsView() { return ""; }
    zoneDetail() { return ""; }
    systemStatus() { return { title: "Нет данных", tone: "unknown" }; }
    _structureKey() { return ""; }
    refreshNow() { this.refreshes += 1; return Promise.resolve(); }
  }
  const context = vm.createContext({
    customElements: { get: () => Panel }, Date: Clock, Set, structuredClone,
    window: {
      confirm: (message) => { confirmations.push(message); return confirmResult(message); },
      setTimeout: () => undefined,
    },
  });
  for (const version of versions) {
    const file = new URL(`irrigation-panel-v${version}.mjs`, frontend);
    const source = fs.readFileSync(file, "utf8").replace(/^import[^\n]*\n/gm, "");
    vm.runInContext(`{\n${source}\n}`, context, { filename: file.pathname });
  }
  const panel = new Panel();
  return {
    panel, confirmations,
    state: () => panel._programEditorState(panel.entities(), 7),
    choose: (mode) => panel._programEditorSelectMode(panel._programEditorState(panel.entities(), 7), mode),
    confirm: (fn = () => true) => { confirmResult = fn; },
    bind: () => panel._render(),
    dispatch: (type, target) => {
      const event = { type, target, immediate: false, stopped: false,
        preventDefault() {}, stopPropagation() { this.stopped = true; },
        stopImmediatePropagation() { this.immediate = true; this.stopped = true; },
      };
      const registered = panel.handlers[type] || [];
      // Browser capture listeners precede the bubble listeners on the root;
      // keep registration order within each phase.
      for (const capture of [true, false]) {
        if (!capture && event.stopped) break;
        for (const item of registered.filter((item) => Boolean(item.capture) === capture)) {
          item.handler(event);
          if (event.immediate) break;
        }
        if (event.immediate) break;
      }
    },
  };
}

function control(dataset, value = "") {
  return { dataset, value, disabled: false,
    matches(selector) {
      return selector.split(",").some((part) => {
        const match = part.trim().match(/^\[data-([\w-]+)\]$/);
        const name = match?.[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        return name && Object.prototype.hasOwnProperty.call(this.dataset, name);
      });
    },
    closest(selector) { return this.matches(selector) ? this : null; },
  };
}

const checks = [];
const check = (name, run) => checks.push({ name, run });
const patch = (h) => clean(h.panel._programEditorPatch(h.state()));
const validate = (h) => h.panel._programEditorValidation(h.state());
function edit(h, field, value, intent = field) {
  const state = h.state();
  state.values[field] = value;
  state.intent.add(intent);
  return state;
}

check("factual parity/weekly modes never invent an anchor date", () => {
  for (const mode of ["odd", "even", "weekly"]) {
    const h = harness(factual({ calendar_mode: mode, anchor_date: TODAY }));
    assert.equal(h.state().base.anchor_date, "", mode);
    assert.equal(h.state().values.anchor_date, "", mode);
    assert.deepEqual(patch(h), {}, mode);
  }
  const interval = harness(factual({ calendar_mode: "interval", interval_days: 2, anchor_date: "2026-08-01" }));
  assert.equal(interval.state().base.anchor_date, "2026-08-01");
  assert.equal(validate(interval), "");
});

check("selecting either parity mode sends only the chosen repeat mode", () => {
  for (const target of ["odd", "even"]) {
    const h = harness(factual({ calendar_mode: "interval", interval_days: 2, anchor_date: "2026-08-01", weekdays: ["mon"] }));
    h.choose(target);
    assert.deepEqual(patch(h), { cycle_mode: target });
    assert.equal(validate(h), "");
  }
});

check("switching parity removes earlier interval/date edits from the command", () => {
  const h = harness(factual({ calendar_mode: "interval", interval_days: 2, anchor_date: "2026-08-01" }));
  edit(h, "interval_days", 5, "repeat");
  edit(h, "anchor_date", "2026-09-08");
  h.choose("odd");
  assert.deepEqual(patch(h), { cycle_mode: "odd" });
  assert.equal(h.state().values.anchor_date, "");
});

check("unchosen differences cannot become a write after refreshed controller data", () => {
  const h = harness();
  const state = h.state();
  state.values.duration_minutes = 90;
  state.values.start_times = ["01:00", "02:00", "", "", "", ""];
  state.values.anchor_date = "2030-01-01";
  state.values.rain_sensor_follow = false;
  state.values.program_enabled = false;
  assert.deepEqual(clean(h.panel._programEditorPatch(state)), {});
  h.panel.data = factual({ raw_hex: "fresh-controller-state", duration_minutes: 7, calendar_mode: "odd" });
  assert.equal(h.state().values.duration_minutes, 7);
  assert.equal(h.state().values.cycle_mode, "odd");
  assert.deepEqual(patch(h), {});
});

check("explicit duration/rain/enable edits preserve parity and omit calendar fields", () => {
  const h = harness();
  edit(h, "duration_minutes", 3);
  edit(h, "rain_sensor_follow", false);
  edit(h, "program_enabled", false);
  assert.deepEqual(patch(h), { duration_minutes: 3, rain_sensor_follow: false, program_enabled: false });
  assert.equal(validate(h), "");
});

check("all six time slots keep physical positions including cleared starts", () => {
  const h = harness();
  edit(h, "start_times", ["", "06:20", "", "17:35", "", "23:55"]);
  assert.deepEqual(patch(h), { start_times: [null, "06:20", null, "17:35", null, "23:55"] });
  assert.equal(validate(h), "");
});

check("choosing the original repeat mode is a no-op", () => {
  for (const mode of ["odd", "even"]) {
    const h = harness(factual({ calendar_mode: mode }));
    h.choose(mode === "odd" ? "even" : "odd");
    h.choose(mode);
    assert.deepEqual(patch(h), {});
  }
});

check("unknown mode selections cannot mutate the draft", () => {
  const h = harness();
  assert.equal(h.choose("monthly"), false);
  assert.equal(h.state().values.cycle_mode, "even");
  assert.deepEqual(patch(h), {});
});

check("parity to interval requires an explicit date with no old date resurrection", () => {
  const h = harness();
  h.choose("interval");
  assert.equal(h.state().values.anchor_date, "");
  assert.notEqual(validate(h), "");
  edit(h, "interval_days", 2, "repeat");
  edit(h, "anchor_date", TODAY);
  assert.equal(validate(h), "");
  assert.deepEqual(patch(h), { cycle_mode: "interval", interval_days: 2, anchor_date: TODAY });
  h.choose("even");
  h.choose("interval");
  assert.equal(h.state().values.anchor_date, "");
  assert.notEqual(validate(h), "");
});

check("date checks reject impossible or new past dates but retain unchanged historical dates", () => {
  for (const date of ["2026-09-06", "2026-02-30", "2026-09-31", "2026-13-01", "2026-00-01", "bad-date"]) {
    const h = harness();
    h.choose("interval");
    edit(h, "interval_days", 2, "repeat");
    edit(h, "anchor_date", date);
    assert.notEqual(validate(h), "", date);
  }
  const h = harness(factual({ calendar_mode: "interval", interval_days: 2, anchor_date: "2026-08-01" }));
  edit(h, "duration_minutes", 3);
  assert.equal(validate(h), "");
  assert.deepEqual(patch(h), { duration_minutes: 3 });
});

check("parity rejects zero duration even while disabled", () => {
  for (const mode of ["odd", "even"]) {
    for (const enabled of [true, false]) {
      const h = harness(factual({ calendar_mode: mode, duration_minutes: 0, program_enabled: enabled }));
      assert.notEqual(validate(h), "", `${mode} enabled=${enabled}`);
    }
  }
});

check("enabled programmes need a start while disabled parity may keep all six empty", () => {
  const enabled = harness(factual({ start_slots: [null, null, null, null, null, null] }));
  assert.notEqual(validate(enabled), "");
  const disabled = harness(factual({ program_enabled: false, start_slots: [null, null, null, null, null, null] }));
  assert.equal(validate(disabled), "");
});

check("unsupported modes and malformed or duplicate starts fail validation", () => {
  for (const mode of ["unknown", "monthly", ""]) {
    const h = harness(factual({ calendar_mode: mode }));
    assert.notEqual(validate(h), "", mode);
  }
  for (const slots of [
    ["25:00", "", "", "", "", ""], ["14:24", "14:24", "", "", "", ""],
    ["14:24", "", "", "", "", "", "20:00"],
  ]) {
    const h = harness();
    edit(h, "start_times", slots);
    assert.notEqual(validate(h), "", JSON.stringify(slots));
  }
});

check("confirmation summaries name Odd/Even in Russian without a fictitious start date", () => {
  for (const [mode, label] of [["odd", "Нечётные дни"], ["even", "Чётные дни"]]) {
    const h = harness();
    const text = h.panel._programEditorSummary({ cycle_mode: mode }).join("\n");
    assert(text.includes(label), text);
    assert.doesNotMatch(text, /Опорная дата|\bodd\b|\beven\b/);
  }
});

check("cancelled actual Apply sends no command and leaves the user's draft intact", async () => {
  const h = harness();
  h.choose("odd");
  await h.panel.applyProgramDraft(7);
  assert.equal(h.confirmations.length, 1);
  assert.match(h.confirmations[0], /Нечётные дни/);
  assert.equal(h.panel.calls.length, 0);
  assert.equal(h.panel.refreshes, 0);
  assert.deepEqual(patch(h), { cycle_mode: "odd" });
});

check("confirmed actual Apply sends one selected-zone patch through the ordinary service", async () => {
  const h = harness();
  h.choose("odd");
  h.confirm();
  h.panel.serviceAction = async (service) => {
    assert.equal(service, "apply_zone_schedule");
    h.panel.data = factual({ raw_hex: "confirmed-odd", calendar_mode: "odd", anchor_date: "" });
  };
  await h.panel.applyProgramDraft(7);
  await h.panel.applyProgramDraft(7);
  assert.equal(h.confirmations.length, 1);
  assert.deepEqual(h.panel.calls, [{ domain: "nikas_ho_sc_8w", service: "apply_zone_schedule",
    data: { config_entry_id: "offline-editor", zone: 7, schedule: { cycle_mode: "odd" } } }]);
  assert.equal(h.panel.commandBusy(), false);
  assert.deepEqual(patch(h), {});
});

check("invalid, disconnected, OFF, active or already-busy editor cannot dispatch", async () => {
  for (const configure of [
    (h) => { h.panel.states.connection = "cloud"; },
    (h) => { h.panel.states.operation = "off"; },
    (h) => { h.panel.states.active = "3"; },
    (h) => { h.panel.states.queued = "5"; },
    (h) => { h.panel.available = false; },
    (h) => { h.panel.parentBusy = true; },
    (h) => { h.panel.data.dp38_schedule_write_locked = true; },
    (h) => edit(h, "duration_minutes", 0),
  ]) {
    const h = harness();
    h.choose("odd");
    configure(h);
    h.confirm();
    await h.panel.applyProgramDraft(7);
    assert.equal(h.panel.calls.length, 0);
    assert.equal(h.confirmations.length, 0);
  }
});

check("actual capture ordering retains a selected mode across legacy immediate renders", () => {
  const h = harness();
  h.state();
  h.bind();
  let renders = 0;
  h.panel.onRender = () => { renders += 1; h.state(); };
  h.dispatch("change", control({ programZoneEdit: "7", programField: "cycle_mode" }, "odd"));
  assert.equal(h.state().values.cycle_mode, "odd");
  assert.deepEqual(patch(h), { cycle_mode: "odd" });
  assert.equal(renders, 1);
});

check("actual clear and enabled click handlers preserve intent before factual refresh", () => {
  const h = harness(factual({ start_slots: ["14:24", null, "17:30", null, "20:55", null] }));
  h.state();
  h.bind();
  h.panel.onRender = () => h.state();
  h.dispatch("click", control({ programStartClear: "7:2" }));
  assert.deepEqual(patch(h), { start_times: ["14:24", null, null, null, "20:55", null] });
  h.dispatch("click", control({ programEnabledToggle: "7" }));
  assert.deepEqual(patch(h), {
    start_times: ["14:24", null, null, null, "20:55", null], program_enabled: false,
  });
  assert.equal(h.panel.calls.length, 0);
});

check("actual duration and weekday change gestures survive immediate state synchronization", () => {
  const h = harness();
  h.state();
  h.bind();
  h.panel.onRender = () => h.state();
  const duration = control({ programZoneEdit: "7", programField: "duration_minutes" }, "4");
  h.dispatch("input", duration);
  h.dispatch("change", duration);
  assert.deepEqual(patch(h), { duration_minutes: 4 });
  h.dispatch("change", control({ programZoneEdit: "7", programField: "cycle_mode" }, "weekly"));
  h.dispatch("click", control({ programZoneEdit: "7", programWeekday: "tue" }));
  assert.deepEqual(patch(h), { duration_minutes: 4, cycle_mode: "weekly", weekdays: ["tue"] });
  assert.equal(validate(h), "");
  assert.equal(h.panel.calls.length, 0);
});

check("in-flight actual Apply blocks a duplicate command", async () => {
  const h = harness();
  h.choose("odd");
  h.confirm();
  let finish;
  h.panel.serviceAction = () => new Promise((resolve) => { finish = resolve; });
  const pending = h.panel.applyProgramDraft(7);
  assert.equal(h.panel.commandBusy(), true);
  await h.panel.applyProgramDraft(7);
  assert.equal(h.panel.calls.length, 1);
  assert.equal(h.confirmations.length, 1);
  h.panel.data = factual({ raw_hex: "confirmed-odd", calendar_mode: "odd" });
  finish();
  await pending;
  assert.equal(h.panel.commandBusy(), false);
});

check("ambiguous actual service error never retries or rolls back a parity change", async () => {
  const h = harness();
  h.choose("odd");
  h.confirm();
  h.panel.serviceAction = async () => { throw new Error("read-back interrupted"); };
  await h.panel.applyProgramDraft(7);
  await h.panel.applyProgramDraft(7);
  assert.equal(h.panel.calls.length, 1);
  assert.equal(h.panel.calls[0].service, "apply_zone_schedule");
  assert.equal(h.confirmations.length, 1);
  assert.equal(h.panel.commandBusy(), false);
  assert.equal(h.panel._programApplyFeedback.kind, "error");
  assert.deepEqual(patch(h), {});
});

let passed = 0;
for (const { name, run } of checks) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}
console.log(`Parity editor UI: ${passed}/${checks.length} offline checks passed`);
