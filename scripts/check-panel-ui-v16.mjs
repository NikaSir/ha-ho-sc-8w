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
  'const UI_VERSION = "0.6.14"',
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
]) requireMarker(marker);

if (source.includes('"Онлайн"')) {
  throw new Error("Local transport must be labelled Локально, not Онлайн");
}

console.log("HO-SC-8W UI standard v1.6 contract verified");
