#!/usr/bin/env node
// Exercise the shipped header, without any Home Assistant or device calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ui = JSON.parse(fs.readFileSync(path.join(root, '.nikas-ui-standard.json'), 'utf8')).ui_version;
const integration = JSON.parse(fs.readFileSync(path.join(root, 'custom_components/nikas_ho_sc_8w/manifest.json'), 'utf8')).version;
const pattern = /^\d+\.\d+\.\d+(-beta\d{3})?$/;
assert.match(ui, pattern);
assert.match(integration, pattern);
assert.equal(ui.match(pattern)[1], integration.match(pattern)[1], 'UI must retain the published beta number');
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromium.executablePath() });
try {
  for (const [width, height] of [[320,800],[430,932],[932,430],[768,1024],[1024,768],[1440,900]]) {
    const page = await browser.newPage({ viewport: {width, height}, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,main{margin:0;width:100%;height:100%}</style><main></main>');
      await page.addScriptTag({ path: path.join(root, 'custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js') });
      await page.evaluate(() => {
        const panel = document.createElement('nikas-ho-sc-8w-panel');
        panel.hass = { states: {}, connection: { connected: true }, services: {},
          callService: async () => { throw new Error('Header test must never call device services'); } };
        window.panel = panel;
        document.querySelector('main').append(panel);
      });
      await page.waitForFunction(() => panel.shadowRoot.querySelector('[data-ui-version]'));
      for (const dark of [false, true]) {
        const result = await page.evaluate(async dark => {
          panel.style.setProperty('--card-background-color', dark ? '#1c2530' : '#ffffff');
          panel.style.setProperty('--primary-text-color', dark ? '#f2f5f7' : '#111317');
          const original = panel.shadowRoot.querySelector('[data-ui-version]');
          for (const view of ['manual', 'status']) {
            panel._view = view;
            panel.render();
          }
          panel.hass = {...panel._hass};
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const version = panel.shadowRoot.querySelector('[data-ui-version]');
          const plaque = panel.shadowRoot.querySelector('.headerTitle');
          const bounds = plaque.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(version);
          const text = range.getBoundingClientRect();
          return { text: version.textContent.trim(), same: version === original,
            width: bounds.width, height: bounds.height,
            fits: text.left >= bounds.left && text.right <= bounds.right && text.top >= bounds.top && text.bottom <= bounds.bottom };
        }, dark);
        assert.equal(result.text, `UI v${ui}`, 'The rendered header must include the complete suffix');
        assert.equal(result.same, true, 'Telemetry must not remount the version node');
        assert.equal(result.fits, true, `Full version must fit at ${width}x${height}`);
        assert.ok(result.width > 0 && result.height > 0, 'The header must be visible');
      }
      assert.deepEqual(errors, []);
      console.log(`PASS full header UI v${ui}: ${width}x${height}, both themes, telemetry and tab return`);
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
