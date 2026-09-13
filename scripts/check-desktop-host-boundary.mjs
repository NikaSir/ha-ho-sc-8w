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
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromium.executablePath(),
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
  await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.className = "schemaGrid themeRegressionProbe";
    probe.innerHTML = `
      <section class="systemOverview"><p>Готова</p></section>
      <button class="systemCompactItem">Режим</button>
      <section class="hero"><div class="heroHead"><p>Поддерживающий текст</p></div></section>
      <button class="metric">Параметр</button>
      <div class="systemDiagram"></div>
      <button class="diagramZone running"><span class="zoneText"><b>ЗОНА 1</b><small>Каждые 2 дня</small></span><span class="duration">10 мин</span></button>
    `;
    document.querySelector("nikas-ho-sc-8w-panel").shadowRoot.append(probe);
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

  const applyTheme = (theme) => page.evaluate((values) => {
    const panel = document.querySelector("nikas-ho-sc-8w-panel");
    for (const [name, value] of Object.entries(values)) panel.style.setProperty(name, value);
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, theme);
  const readTheme = () => page.evaluate(() => {
    const panel = document.querySelector("nikas-ho-sc-8w-panel");
    const root = panel.shadowRoot;
    const style = (selector) => {
      const element = root.querySelector(selector);
      if (!element) throw new Error(`Missing browser theme probe: ${selector}`);
      return getComputedStyle(element);
    };
    const hostStyle = getComputedStyle(panel);
    return {
      cardToken: hostStyle.getPropertyValue("--card").trim(),
      backgroundToken: hostStyle.getPropertyValue("--bg").trim(),
      textToken: hostStyle.getPropertyValue("--text").trim(),
      colorScheme: hostStyle.colorScheme,
      overviewBackground: style(".themeRegressionProbe .systemOverview").backgroundColor,
      overviewText: style(".themeRegressionProbe .systemOverview").color,
      factBackground: style(".themeRegressionProbe .systemCompactItem").backgroundColor,
      activeZoneBackground: style(".themeRegressionProbe .diagramZone.running").backgroundColor,
      activeZoneText: style(".themeRegressionProbe .zoneText b").color,
      headerBackground: style(".appHeader").backgroundColor,
      navigationBackground: style(".bottomNav").backgroundColor,
    };
  });

  await applyTheme({
    "--primary-background-color": "#10151c",
    "--card-background-color": "#1c2530",
    "--primary-text-color": "#f2f5f7",
    "--secondary-text-color": "#aeb8c2",
    "--divider-color": "#34404d",
    "--primary-color": "#03a9d9",
  });
  const darkTheme = await readTheme();
  assert.equal(darkTheme.cardToken, "#1c2530", "Card token must inherit the active HA dark theme");
  assert.equal(darkTheme.backgroundToken, "#10151c", "Panel token must inherit the active HA dark theme");
  assert.equal(darkTheme.textToken, "#f2f5f7", "Text token must inherit the active HA dark theme");
  assert.equal(darkTheme.colorScheme, "light dark", "Native controls must support both HA color schemes");
  assert.equal(darkTheme.overviewBackground, "rgb(28, 37, 48)", "Overview must use the HA dark card surface");
  assert.equal(darkTheme.overviewText, "rgb(242, 245, 247)", "Overview must use the HA dark theme text");
  assert.equal(darkTheme.factBackground, "rgb(28, 37, 48)", "System facts must not remain white in dark mode");
  assert.equal(darkTheme.activeZoneText, "rgb(242, 245, 247)", "Active zone text must use the HA dark theme");

  await applyTheme({
    "--primary-background-color": "#f7f8fa",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#111317",
    "--secondary-text-color": "#626a73",
    "--divider-color": "#e2e6e9",
    "--primary-color": "#078fe8",
  });
  const lightTheme = await readTheme();
  assert.equal(lightTheme.overviewBackground, "rgb(255, 255, 255)", "Overview must return to the HA light card surface live");
  assert.equal(lightTheme.overviewText, "rgb(17, 19, 23)", "Overview text must return to the HA light theme live");
  assert.equal(lightTheme.factBackground, "rgb(255, 255, 255)", "System facts must return to the HA light card surface live");
  assert.equal(lightTheme.activeZoneText, "rgb(17, 19, 23)", "Active zone text must return to the HA light theme live");
  assert.notEqual(lightTheme.activeZoneBackground, darkTheme.activeZoneBackground, "Active zone surface must react to a live HA theme change");
  assert.notEqual(lightTheme.headerBackground, darkTheme.headerBackground, "Header must react to a live HA theme change");
  assert.notEqual(lightTheme.navigationBackground, darkTheme.navigationBackground, "Bottom Tab Bar must react to a live HA theme change");

  console.log("HO-SC-8W desktop host boundary and live Home Assistant theme inheritance verified");
} finally {
  await browser.close();
}
