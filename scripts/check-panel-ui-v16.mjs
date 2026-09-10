import fs from "node:fs";

const panelPath = "custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js";
const source = fs.readFileSync(panelPath, "utf8");

const count = (pattern) => [...source.matchAll(pattern)].length;
const requireMarker = (marker) => {
  if (!source.includes(marker)) throw new Error(`Missing UI v2.2 marker: ${marker}`);
};

if (count(/shadowRoot\.innerHTML\s*=/g) !== 1) {
  throw new Error("The full shadow root may be assigned only during initial shell mounting");
}
if (count(/class="workViewport /g) !== 1 || count(/class="workCanvas"/g) !== 1) {
  throw new Error("Exactly one work viewport and one transform canvas template are required");
}

for (const marker of [
  'const NIKAS_HO_SC_8W_UI_VERSION = "1.0.3"',
  '<strong>Автополив</strong>',
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
  ".bottomNav button ha-icon{--mdc-icon-size:26px}",
  "font-size:12px!important;font-weight:700",
  "VIEW_SCALE_MIN = 0.75",
  "VIEW_SCALE_MAX = 2",
  "VIEW_SCALE_SNAP_MIN = 0.97",
  "VIEW_SCALE_SNAP_MAX = 1.03",
  "this._suppressClicksUntil = Date.now() + 500",
  'this._showScaleToast("Масштаб 100%")',
  ":host{position:fixed;inset:0",
  ".app{position:absolute;inset:0",
  "overscroll-behavior:none",
  ".appHeader{position:relative;top:auto;z-index:60;touch-action:none}",
  "touch-action:none}",
  "viewport.scrollTop <= 0",
  "viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 1",
  "(atTop && deltaY > 0) || (atBottom && deltaY < 0)",
  'viewport.addEventListener("touchmove"',
  "event.touches[0].clientY - nativeTouchY",
  "{ passive: false }",
  "handedOffRaw !== null",
  "handedOffAtRaw !== null",
  "handedOffAge >= 0",
  "integrationServiceAvailable(service)",
  "controllerStateAvailable()",
  "rejectUnavailableCommand(service)",
  'class="systemConnection ${tone}"',
  'data-connection-indicator',
  '"Данные актуальны"',
  '"Данные устарели"',
  '"Нет связи"',
  'class="statusScreen"',
  "statusFitsViewport",
  'СЕЗОННАЯ КОРРЕКЦИЯ',
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
  "sensor.nikas_h2000_pro_voda_na_poliv_2",
  "<strong>HO-SC-8W</strong>",
]) {
  if (source.includes(forbidden)) throw new Error(`Forbidden stale UI marker: ${forbidden}`);
}

for (const marker of [
  "data-parent-nav",
  ".scene1,.scene2,.scene3",
  "zone-lawn-v2.webp?v=${NIKAS_HO_SC_8W_UI_VERSION}",
  "zone-flowers-v2.webp?v=${NIKAS_HO_SC_8W_UI_VERSION}",
  "detailStateList",
  "mdi:umbrella-outline",
  "simplifiedDiagram",
  "zoneLink",
  "Запустить ручной полив?",
  "Первый запуск",
  "width:min(360px,100%);height:52px;min-height:52px",
  "padding:5px 14px",
  "color-mix(in srgb,var(--primary-color,#03a9d9) 24%,var(--divider-color,#dfe3e8))",
  "color-mix(in srgb,var(--primary-color,#03a9d9) 5%,var(--card-background-color,#fff))",
  "0 5px 16px rgba(23,45,76,.06)",
  "color-mix(in srgb,var(--primary-color,#03a9d9) 13%,var(--card-background-color,#fff))",
  "color-mix(in srgb,var(--primary-color,#03a9d9) 42%,var(--divider-color,#dfe3e8))",
  "0 2px 7px rgba(23,45,76,.05)",
  "outline:2px solid var(--primary-color,#03a9d9)",
  "padding-inline:8px",
  "fullStarts(attrs)",
  'starts.join(" · ")',
  'this.startChips(z.starts, "programTimes")',
  'this.startChips(z.starts, "detailStartTimes")',
  'class="zoneCardTimes"',
  'class="programSeasonEditor',
  'class="programSeasonControls"',
  "viewport-locked chrome",
  "max-width:1280px",
  "grid-template-columns:repeat(3,minmax(15px,1fr))",
  'return "/dashboard-house-v13/home"',
  'return "/dashboard-rooms-v11/rooms"',
  "position:absolute;top:13px;right:13px;width:168px",
  "height:58px;min-height:58px;padding:11px 12px",
  "column-gap:9px",
  'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif',
  "line-height:17px",
  "line-height:14px",
  "top:-92px;right:-70px;width:205px;height:205px",
  "background:rgba(3,169,217,0.07)",
]) requireMarker(marker);

for (const forbidden of [
  "Read-only представление",
  "Actions API",
  '<small>Доступен</small>',
  "compactStarts",
  "Следующий полив",
  '${starts[0]} +${starts.length - 1}',
  "const singleStart =",
  "/dashboard-house-v11",
]) {
  if (source.includes(forbidden)) throw new Error(`Forbidden unfinished UI copy: ${forbidden}`);
}

if (source.includes('"Онлайн"')) {
  throw new Error("Local transport must be labelled Локально, not Онлайн");
}

console.log("HO-SC-8W UI standard v2.2 contract verified");

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
