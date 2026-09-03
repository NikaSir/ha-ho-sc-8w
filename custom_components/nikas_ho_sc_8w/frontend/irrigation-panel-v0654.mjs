import "./irrigation-panel-v0653.mjs";

const UI_VERSION = "0.6.54";
const SNAPSHOT_CONFIRMATION = "DP38_FULL_SNAPSHOT_READ_ONLY";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

p.runDp38FullSnapshot = async function runDp38FullSnapshotV0654(phase) {
  if (this.rejectUnavailableCommand("capture_dp38_snapshot")) return;
  const entities = this.entities();
  const attrs = this.attrs(entities.zones[8].schedule);
  const operation = String(this.state(entities.operation)).toLowerCase();
  if (operation !== "auto") {
    this.notify("Для обхода зон включите контроллер и установите режим Auto");
    return;
  }
  if (phase === "compare" && attrs.dp38_snapshot_baseline_available !== true) {
    this.notify("Сначала сохраните исходный снимок зон 1–8");
    return;
  }
  const message = phase === "baseline"
    ? [
      attrs.dp38_snapshot_baseline_available === true ? "Заменить ранее сохранённый исходный снимок?" : "Снять исходный снимок зон 1–8?",
      "",
      "Контроллер должен быть включён, находиться в режиме Auto и не выполнять полив.",
      "После запуска последовательно откройте на приборе зоны 1 → 8, ничего не изменяя. На сбор отведено до 35 секунд.",
      "",
      "Команды записи DP38 не отправляются.",
    ].join("\n")
    : [
      "Снять контрольный снимок и сравнить с исходным?",
      "",
      "Контроллер должен быть включён, находиться в режиме Auto и не выполнять полив.",
      "Сначала измените на самом приборе только согласованный параметр зоны 8. Затем во время чтения последовательно откройте зоны 1 → 8.",
      "",
      "Команды записи DP38 не отправляются.",
    ].join("\n");
  if (!window.confirm(message)) return;
  this._dp38SnapshotBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "capture_dp38_snapshot", {
      ...this.serviceTargetData(), phase, confirmation: SNAPSHOT_CONFIRMATION,
    });
    await this.refreshNow();
    this.notify(phase === "baseline" ? "Исходный снимок зон 1–8 сохранён" : "Контрольный снимок сопоставлен с исходным");
  } catch (error) {
    this.notify(this.serviceError(error, "Полный снимок DP38 не получен"));
  } finally {
    this._dp38SnapshotBusy = false;
    this.render();
  }
};

p._render = function renderV0654() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
