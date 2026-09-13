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
          nikas-ho-sc-8w-panel { width: 100%; height: 100%; }
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

  const geometry = await page.evaluate(() => {
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

  assert.deepEqual(
    geometry.panel,
    geometry.host,
    "The specialized panel must use the Home Assistant content box, not the browser viewport",
  );
  assert.equal(geometry.app.width, 1280, "Desktop work area must retain its 1280 px maximum width");
  assert.equal(geometry.app.left, 577, "Desktop work area must be centered inside the HA content box");
  assert.equal(geometry.bottomNav.left, geometry.app.left, "Bottom navigation must stay inside the centered app shell");
  assert.equal(geometry.bottomNav.right, geometry.app.right, "Bottom navigation must not extend under the HA sidebar");

  console.log("HO-SC-8W desktop Home Assistant host boundary verified");
} finally {
  await browser.close();
}
