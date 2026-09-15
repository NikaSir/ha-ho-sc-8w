#!/usr/bin/env node
// Execute the shipped panel and its real render/activation path, without HA/device I/O.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js');
const themes = {
  light: { card: [255,255,255], primary: [3,169,217], text: 'rgb(17, 19, 23)' },
  dark: { card: [28,37,48], primary: [7,143,232], text: 'rgb(242, 245, 247)' },
};
function channels(value) {
  const srgb = value.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\)$/);
  const rgb = value.match(/^rgb\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\)$/);
  assert.ok(srgb || rgb, `Expected opaque sRGB color: ${value}`);
  return srgb ? srgb.slice(1).map(v => Number(v)*255) : rgb.slice(1).map(Number);
}
function mix(actual, base, accent, weight, label) {
  channels(actual).forEach((value, i) => assert.ok(
    Math.abs(value - (base[i]*(1-weight) + accent[i]*weight)) <= 0.51,
    `${label}: channel ${i} in ${actual} must use ${weight*100}% accent`,
  ));
}
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromium.executablePath() });
async function mount(viewport = { width:430, height:932 }, reducedMotion = 'no-preference') {
  const page = await browser.newPage({ viewport, reducedMotion, hasTouch:true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,main{margin:0;width:100%;height:100%}</style><main></main>');
  await page.addScriptTag({ path:source });
  await page.evaluate(() => {
    const panel = document.createElement('nikas-ho-sc-8w-panel');
    const base = 'sensor.kontroller_poliva_ho_sc_8w';
    const entity = (state, attributes={}) => ({ state, attributes, last_updated:'2026-09-15T12:00:00Z', last_changed:'2026-09-15T12:00:00Z' });
    const states = {};
    for (const [key,value] of Object.entries({ connection_mode:'local', operation_mode:'Auto', irrigation_mode:'order', active_zones:'none', queued_zones:'none', schedule_cache:'complete' })) states[base+'_'+key]=entity(value);
    states['sensor.irrigation_pressure']=entity('3.1',{ friendly_name:'Датчик давления полив', unit_of_measurement:'bar' });
    window.calls=[];window.notices=[];
    panel.addEventListener('hass-notification', e => window.notices.push(e.detail.message));
    panel.hass={ states, connection:{connected:true}, services:{homeassistant:{update_entity:{}}}, callService:(...args)=>{
      window.calls.push(args);
      return new Promise((resolve,reject)=>{window.resolveRefresh=resolve;window.rejectRefresh=()=>reject(new Error('test unavailable'));});
    }};
    window.panel=panel;document.querySelector('main').append(panel);
  });
  await page.waitForFunction(() => window.panel.shadowRoot.querySelector('.systemOverview'));
  await page.evaluate(() => {
    const r=panel.shadowRoot;window.buttonRef=r.querySelector('[data-refresh]');window.heroRef=r.querySelector('.systemOverview');window.photoRef=r.querySelector('.systemControllerPhoto');
    window.clockStates=[];let last='';
    const observe=()=>{const next=buttonRef.classList.contains('busy')?'busy':buttonRef.classList.contains('refresh-success')?'success':buttonRef.classList.contains('refresh-error')?'error':'idle';if(last!==next){clockStates.push({state:next,time:performance.now()});last=next;}};
    new MutationObserver(observe).observe(buttonRef,{attributes:true});observe();
  });
  return { page, errors };
}
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function theme(page, name) {
  await page.evaluate(t => {
    panel.style.setProperty('--card-background-color',`rgb(${t.card.join(',')})`);
    panel.style.setProperty('--primary-color',`rgb(${t.primary.join(',')})`);
    panel.style.setProperty('--primary-text-color',t.text);
  }, themes[name]);
  await frame(page);
}
const read = page => page.evaluate(() => {
  const r=panel.shadowRoot,b=r.querySelector('[data-refresh]'),h=r.querySelector('.systemOverview'),icon=b.querySelector('ha-icon');
  const pressure=[...r.querySelectorAll('.systemCompactItem')].find(n=>n.querySelector('small')?.textContent==='Давление');
  const box=b.getBoundingClientRect();
  return { bg:getComputedStyle(h).backgroundColor, image:getComputedStyle(h).backgroundImage, title:h.querySelector('h1').textContent,
    heroSame:h===heroRef, photoSame:r.querySelector('.systemControllerPhoto')===photoRef, photo:getComputedStyle(photoRef).backgroundImage,
    circle:getComputedStyle(h,'::before').backgroundColor, pressureBg:getComputedStyle(pressure).backgroundColor,
    buttonSame:b===buttonRef, color:getComputedStyle(icon).color, buttonBg:getComputedStyle(b).backgroundColor,
    icon:icon.getAttribute('icon'), disabled:b.disabled, busy:b.getAttribute('aria-busy'), animation:getComputedStyle(icon).animationName,
    label:b.getAttribute('aria-label'), box:{width:box.width,height:box.height,left:box.left,top:box.top}, calls:window.calls, notices:window.notices };
});
const patch = page => page.evaluate(() => { panel.hass={...panel._hass}; });
const waitResult = (page, state) => page.waitForFunction(s => buttonRef.classList.contains('refresh-'+s), state);
const tests = [];
const test = (name, run) => tests.push({name,run});
test('live HERO stays 95/5 through telemetry, tab return, themes and all viewport sizes', async () => {
  for (const [width,height] of [[430,932],[932,430],[768,1024],[1024,768],[1440,900]]) {
    const {page,errors}=await mount({width,height});
    try {
      for (const name of ['light','dark']) {
        await theme(page,name);const t=themes[name];
        await patch(page);await frame(page);
        const s=await read(page);
        assert.equal(s.title,'Система готова');mix(s.bg,t.card,t.primary,0.05,`${width}/${name} real HERO`);
        assert.equal(s.image,'none');mix(s.circle,t.card,t.primary,0.12,'Unchanged corner accent');
        mix(s.pressureBg,t.card,[8,165,43],0.08,'Pressure must stay green independently');
        assert.ok(s.heroSame && s.photoSame && s.buttonSame);
        await page.evaluate(()=>{panel._view='manual';panel.render();});await frame(page);
        await page.evaluate(()=>{panel._view='status';panel.render();});await frame(page);
        const after=await read(page);mix(after.bg,t.card,t.primary,0.05,'HERO after tab return');
        assert.equal(after.photo,s.photo);assert.ok(after.heroSame && after.buttonSame);
      }
      // Normal readiness must not suppress pressure alarms or missing-data tones.
      for (const [value, accent, weight] of [['2.0',[232,154,18],0.09],['0',[216,64,64],0.09],['unavailable',[242,245,247],0.08],['3.1',themes.dark.primary,0.05]]) {
        await page.evaluate(value=>{panel.hass={...panel._hass,states:{...panel._hass.states,'sensor.irrigation_pressure':{...panel._hass.states['sensor.irrigation_pressure'],state:value}}};},value);
        await frame(page);mix((await read(page)).bg,themes.dark.card,accent,weight,`Pressure ${value}`);
      }
      assert.deepEqual(errors,[]);
    } finally {await page.close();}
  }
});
test('real refresh: dark idle/busy -> green check and surface -> idle, without remount',async()=>{
  const {page,errors}=await mount();
  try {
    for(const name of ['light','dark']) {
      await theme(page,name);const t=themes[name],idle=await read(page),before=idle.calls.length;
      assert.equal(idle.color,t.text);mix(idle.buttonBg,t.card,t.primary,0,'Idle surface');
      await page.locator('nikas-ho-sc-8w-panel [data-refresh]').click();
      const busy=await read(page);assert.equal(busy.color,t.text);assert.equal(busy.icon,'mdi:refresh');assert.equal(busy.disabled,true);
      mix(busy.buttonBg,t.card,t.primary,0.11,'Busy surface');assert.equal(busy.animation,'nikasRefreshSpin');
      assert.equal(await page.evaluate(()=>panel.refreshNow()),false);assert.equal((await read(page)).calls.length,before+1);
      assert.deepEqual(busy.calls.at(-1).slice(0,2),['homeassistant','update_entity']);
      await page.evaluate(()=>resolveRefresh());await page.waitForTimeout(100);assert.equal((await read(page)).busy,'true');
      await waitResult(page,'success');const success=await read(page);
      assert.equal(success.icon,'mdi:check');assert.equal(success.color,'rgb(67, 160, 71)');
      mix(success.buttonBg,t.card,[67,160,71],0.12,'Success surface');assert.equal(success.animation,'none');
      assert.equal(success.disabled,false);assert.equal(success.label,'Запрос обновления выполнен');assert.deepEqual(success.box,idle.box);
      await patch(page);await frame(page);assert.equal((await read(page)).icon,'mdi:check');assert.ok((await read(page)).buttonSame);
      await page.waitForFunction(()=>!buttonRef.classList.contains('refresh-success'));
      const reset=await read(page);assert.equal(reset.icon,'mdi:refresh');assert.equal(reset.color,t.text);
      const times=await page.evaluate(()=>clockStates.slice(-3));
      assert.deepEqual(times.map(x=>x.state),['busy','success','idle']);
      assert.ok(times[1].time-times[0].time>=880,'Busy must last at least 900 ms (20 ms observer tolerance)');
      assert.ok(times[2].time-times[1].time>=1380,'Result must last 1400 ms (20 ms observer tolerance)');
    }
    assert.deepEqual(errors,[]);
  } finally {await page.close();}
});
test('slow rejected refresh and reduced motion never produce a green confirmation',async()=>{
  const {page,errors}=await mount(undefined,'reduce');
  try {
    await theme(page,'light');await page.locator('nikas-ho-sc-8w-panel [data-refresh]').click();
    assert.equal((await read(page)).animation,'none');await page.waitForTimeout(1050);
    assert.equal((await read(page)).busy,'true');await page.evaluate(()=>rejectRefresh());
    await waitResult(page,'error');const s=await read(page);
    assert.equal(s.icon,'mdi:alert-circle-outline');assert.equal(s.color,'rgb(229, 57, 53)');
    mix(s.buttonBg,themes.light.card,[229,57,53],0.12,'Error surface');assert.equal(s.disabled,false);
    assert.deepEqual(s.notices,['Не удалось обновить данные']);
    await patch(page);await frame(page);assert.equal((await read(page)).icon,'mdi:alert-circle-outline');
    assert.deepEqual(errors,[]);
  } finally {await page.close();}
});
let failures=0;
try {
  for(const {name,run} of tests){try{await run();console.log('PASS',name);}catch(e){failures++;console.error('FAIL',name,'\n',e.stack);}}
}finally{await browser.close();}
if(failures)process.exitCode=1;
