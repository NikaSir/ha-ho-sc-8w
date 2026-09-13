import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const panelPath = path.join(
  repositoryRoot,
  "custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js",
);

const browser = await chromium.launch({
  headless: true,
  executablePath: chromium.executablePath(),
});
try {
  const page = await browser.newPage({
    viewport: { width: 2048, height: 1152 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html>
    <html>
      <head>
        <style>
          html, body { width: 100%; height: 100%; margin: 0; }
          .ha-sidebar { position: fixed; inset: 0 auto 0 0; width: 386px; }
          .ha-panel-host {
            position: fixed;
            inset: 0 0 0 386px;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <aside class="ha-sidebar"></aside>
        <main class="ha-panel-host">
          <nikas-ho-sc-8w-panel id="panel"></nikas-ho-sc-8w-panel>
        </main>
      </body>
    </html>`);
  await page.addScriptTag({ path: panelPath });
  await page.waitForFunction(() => {
    const panel = document.querySelector("nikas-ho-sc-8w-panel");
    return Boolean(panel?.shadowRoot?.querySelector(".app"));
  });

  const readGeometry = () => page.evaluate(() => {
    const panel = document.querySelector("nikas-ho-sc-8w-panel");
    const host = document.querySelector(".ha-panel-host");
    const app = panel.shadowRoot.querySelector(".app");
    const bottomNav = panel.shadowRoot.querySelector(".bottomNav");
    const rect = (element) => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      };
    };
    return {
      host: rect(host),
      panel: rect(panel),
      app: rect(app),
      bottomNav: rect(bottomNav),
    };
  });

  const verifyGeometry = (geometry, label) => {
    assert.deepEqual(
      geometry.panel,
      geometry.host,
      `${label}: the specialized panel must use the Home Assistant content box`,
    );
    const expectedWidth = Math.min(geometry.host.width, 1280);
    const expectedLeft = geometry.host.left + (geometry.host.width - expectedWidth) / 2;
    assert.equal(geometry.app.width, expectedWidth, `${label}: work area width must respect its 1280 px maximum`);
    assert.equal(geometry.app.left, expectedLeft, `${label}: work area must be centered inside the HA content box`);
    assert.equal(geometry.bottomNav.left, geometry.app.left, `${label}: Bottom Tab Bar must stay inside the app shell`);
    assert.equal(geometry.bottomNav.right, geometry.app.right, `${label}: Bottom Tab Bar must stay out from under HA chrome`);
  };

  const expanded = await readGeometry();
  verifyGeometry(expanded, "Expanded sidebar");
  assert.equal(expanded.host.left, 386, "The supplied desktop fixture must retain the measured 386 px sidebar");
  assert.equal(expanded.app.left, 577, "The supplied desktop fixture must center the app at x=577");

  await page.evaluate(() => {
    document.querySelector(".ha-panel-host").style.left = "0";
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

  const collapsed = await readGeometry();
  verifyGeometry(collapsed, "Collapsed sidebar");
  assert.equal(collapsed.host.left, 0, "Collapsed sidebar must release the complete browser width");
  assert.equal(collapsed.app.left, 384, "Collapsed desktop fixture must recenter the 1280 px app shell");

  console.log("HO-SC-8W desktop Home Assistant host boundary verified for expanded and collapsed sidebars");
} finally {
  await browser.close();
}
