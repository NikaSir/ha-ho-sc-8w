import fs from "node:fs";

const panelPath = "custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js";
const source = fs.readFileSync(panelPath, "utf8");

const count = (pattern) => [...source.matchAll(pattern)].length;
const requireMarker = (marker) => {
  if (!source.includes(marker)) throw new Error(`Missing UI v1.6 marker: ${marker}`);
};

if (count(/shadowRoot\.innerHTML\s*=/g) !== 1) {
  throw new Error("The full shadow root may be assigned only during initial shell mounting");
}
if (count(/class="workViewport /g) !== 1 || count(/class="workCanvas"/g) !== 1) {
  throw new Error("Exactly one work viewport and one transform canvas template are required");
}

for (const marker of [
  'const NIKAS_HO_SC_8W_UI_VERSION = "0.6.26"',
  "const UI_VERSION = NIKAS_HO_SC_8W_UI_VERSION",
  "const ASSET_VERSION = UI_VERSION",
  "this._viewNodeCache = new Map()",
  "_reuseWorkContent(content, structureKey)",
  "this._viewNodeCache.set(structureKey, next)",
  "_patchWorkContent(content)",
  "_patchExistingTree(current, next)",
  "this._renderedStructureKey !== structureKey",
  "grid-template-columns:52px minmax(0,1fr) 52px",
  "grid-template-columns:48px minmax(0,1fr) 48px",
  "width:44px;height:44px",
  "border-radius:16px",
  "--mdc-icon-size:25px",
  "font-size:23px",
  "font-size:14px",
  "font-size:21px",
  "font-size:13px",
  "--mdc-icon-size:28px",
  "font-size:12px!important;font-weight:700",
  "VIEW_SCALE_MIN = 0.75",
  "VIEW_SCALE_MAX = 2",
  "VIEW_SCALE_SNAP_MIN = 0.97",
  "VIEW_SCALE_SNAP_MAX = 1.03",
  "this._suppressClicksUntil = Date.now() + 500",
  'this._showScaleToast("Масштаб 100%")',
  'class="systemConnection ${tone}"',
  'data-connection-indicator',
  '"Данные актуальны"',
  '"Данные устарели"',
  '"Нет связи"',
  'class="statusScreen"',
  "statusFitsViewport",
  '"СЕЗОННАЯ КОРРЕКЦИЯ"',
  '<b>Зона ${zone}</b>',
  '_scheduleGestureTransform(transform)',
  'label: "Не учитывается"',
  'label: "Учитывается"',
  'class="rainStatusCard ${rain.tone}"',
  '<em>по программе</em>',
]) requireMarker(marker);

for (const forbidden of [
  'import "/nikas-ho-sc-8w/irrigation-panel.js',
  "Система полива · UI v",
  "Фактические параметры DP38",
  "Игнорируется",
]) {
  if (source.includes(forbidden)) throw new Error(`Forbidden stale UI marker: ${forbidden}`);
}

for (const marker of [
  "data-parent-nav",
  ".scene1,.scene2,.scene3",
  "zone-lawn-v2.webp?v=${NIKAS_HO_SC_8W_UI_VERSION}",
  "zone-flowers-v2.webp?v=${NIKAS_HO_SC_8W_UI_VERSION}",
  "zone-shrubs-v2.webp?v=${NIKAS_HO_SC_8W_UI_VERSION}",
  "zone-greenhouse-v2.webp?v=${NIKAS_HO_SC_8W_UI_VERSION}",
  ".zoneCard .scene,.detailHead .scene{background-position:center!important;background-size:contain!important;background-repeat:no-repeat!important",
  "detailStateList",
  "mdi:umbrella-outline",
  "mdi:help-circle-outline",
  "simplifiedDiagram",
  '"queue" : "idle"',
  ".zoneLink.idle{background:#a8b2ba}",
  "Ручной запуск заблокирован",
  "Первый запуск",
  "min-width:190px",
  "fullStarts(attrs)",
  'starts.join(" · ")',
  'this.startChips(z.starts, "programTimes")',
  'this.startChips(z.starts, "detailStartTimes")',
  'class="zoneCardTimes"',
  "const singleStart = z.starts.length === 1",
  ".zoneCards{padding-bottom:64px}",
  ".zoneCards{padding-bottom:72px}",
  'function renderV0624()',
  'querySelector(".headerTitle small")',
  'UI v${NIKAS_HO_SC_8W_UI_VERSION}',
  "grid-template-columns:repeat(3,minmax(15px,1fr))",
]) requireMarker(marker);

for (const forbidden of [
  "Read-only представление",
  "Actions API",
  '<small>Доступен</small>',
  "compactStarts",
  "Следующий полив",
  '${starts[0]} +${starts.length - 1}',
  "mdi:umbrella-off-outline",
  "mdi:umbrella-closed-outline",
]) {
  if (source.includes(forbidden)) throw new Error(`Forbidden unfinished UI copy: ${forbidden}`);
}

if (source.includes('"Онлайн"')) {
  throw new Error("Local transport must be labelled Локально, not Онлайн");
}

if (/<small[^>]*>UI v\d+\.\d+\.\d+<\/small>/.test(source)) {
  throw new Error("Header version must be derived from the bundle version constant");
}

console.log("HO-SC-8W UI standard v1.6 contract verified");

if (source.includes("${this.nodes(e)}")) {
  throw new Error("Status strip must not be rendered on the status view");
}

if (source.includes("<small>СОСТОЯНИЕ СИСТЕМЫ</small>")) {
  throw new Error("Redundant system-state eyebrow must be absent from the first screen");
}
if (source.includes("<span>Провод управления клапанами</span>")) {
  throw new Error("Control-wire caption must be removed from the first screen");
}
if (source.includes('"ТЕЛЕМЕТРИЯ"')) {
  throw new Error("Telemetry age summary card must be replaced by seasonal adjustment");
}
