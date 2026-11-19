// Exercise connection/freshness semantics and the shipped responsive composition.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ headless:true,
  executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromium.executablePath() });
try {
  for (const width of [320,390,430,768,1024,1440]) {
    const page = await browser.newPage({viewport:{width,height:932}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/nikas-ho-sc-8w/assets/**', route => {
      const filename = new URL(route.request().url()).pathname.split('/').at(-1);
      return route.fulfill({path:path.join(root,'custom_components/nikas_ho_sc_8w/frontend/assets',filename)});
    });
    await page.route('http://irrigation.test/',route=>route.fulfill({contentType:'text/html',body:'<style>html,body,main{margin:0;width:100%;height:100%}</style><main></main>'}));
    await page.goto('http://irrigation.test/');
    await page.addScriptTag({path:path.join(root,'custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js')});
    await page.evaluate(()=>{
      const el=document.createElement('nikas-ho-sc-8w-panel');
      const base='sensor.kontroller_poliva_ho_sc_8w_';
      const record=(state,attributes={})=>({state,attributes,last_updated:'2026-01-01T00:00:00Z'});
      const states=Object.fromEntries(Object.entries({operation_mode:'OFF',irrigation_mode:'order',active_zones:'None',queued_zones:'None',timer_error_alarm:'clear'}).map(([k,v])=>[base+k,record(v)]));
      states[base+'connection_mode']=record('local',{online:true,fail_count:0});
      states['sensor.nikas_h2000_pro_voda_na_poliv_2']=record('0',{unit_of_measurement:'bar'});
      el.hass={states,connection:{connected:true},services:{},callService:()=>{throw Error('Status checks must not send a service call');}};
      window.panel=el;window.base=base;document.querySelector('main').append(el);
    });
    await page.waitForFunction(()=>panel.shadowRoot.querySelector('.systemStatusIcons'));
    for (const dark of [false,true]) {
      const layout=await page.evaluate(async dark=>{
        panel.hass={...panel._hass,themes:{darkMode:dark}};
        panel.style.setProperty('--card-background-color',dark?'#1c2530':'#ffffff');
        panel.style.setProperty('--primary-text-color',dark?'#f2f5f7':'#111317');
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const root=panel.shadowRoot;
        const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
        const header=rect(root.querySelector('.appHeader')),title=rect(root.querySelector('.headerTitle'));
        const card=rect(root.querySelector('.systemOverview')),copy=rect(root.querySelector('.systemHeroCopy')),photo=rect(root.querySelector('.systemControllerPhoto'));
        return {header,title,card,copy,photo,plaque:!!root.querySelector('.systemOverview .systemConnection'),text:root.querySelector('.systemReadiness').textContent};
      },dark);
      assert.equal(layout.plaque,false,'The large connection plaque is replaced');
      assert.equal(layout.header.height,60);
      assert.ok(Math.abs((layout.title.left+layout.title.right)/2-(layout.header.left+layout.header.right)/2)<1,'The title stays centered');
      assert.ok(layout.copy.right<=layout.photo.left,'The device image is on the right, without overlap');
      assert.ok(layout.photo.right<=layout.card.right && layout.copy.left>=layout.card.left,'Hero content stays inside the card');
      assert.match(layout.text,/Нет давления/);
      assert.doesNotMatch(layout.text,/зим/,'Zero pressure never invents winter shutdown');
    }
    await page.evaluate(()=>{
      const r=panel.shadowRoot;
      window.refs={header:r.querySelector('.appHeader'),photo:r.querySelector('.systemControllerPhoto'),icons:[...r.querySelectorAll('[data-status-icon]')],glyphs:[...r.querySelectorAll('[data-status-icon] ha-icon')]};
    });
    const cases=[
      ['local',{online:true,fail_count:0},true,['mdi:cloud','mdi:check-circle-outline']],
      ['cloud',{online:true,fail_count:0},true,['mdi:cloud','mdi:check-circle-outline']],
      ['reserve',{online:true,fail_count:0},true,['mdi:cloud','mdi:check-circle-outline']],
      ['local',{online:true,fail_count:0},false,['mdi:cloud-off-outline','mdi:check-circle-outline']],
      ['local',{online:false,fail_count:1},true,['mdi:cloud-off-outline','mdi:clock-alert-outline']],
      ['local',{online:true},true,['mdi:cloud','mdi:clock-outline']],
      ['unavailable',{},true,['mdi:cloud-question-outline','mdi:clock-outline']],
      ['unknown',{},true,['mdi:cloud-question-outline','mdi:clock-outline']],
      [null,{},true,['mdi:cloud-question-outline','mdi:clock-outline']],
      ['local',{online:true,fail_count:0},true,['mdi:cloud','mdi:check-circle-outline']],
    ];
    for(const [state,attributes,connected,expected] of cases) {
      const actual=await page.evaluate(async ({state,attributes,connected})=>{
        const states={...panel._hass.states};
        if(state===null)delete states[base+'connection_mode'];
        else states[base+'connection_mode']={state,attributes,last_updated:'2026-01-01T00:00:00Z'};
        panel.hass={...panel._hass,states,connection:{connected}};
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const root=panel.shadowRoot,icons=[...root.querySelectorAll('[data-status-icon]')];
        return {icons:icons.map(n=>n.querySelector('ha-icon').getAttribute('icon')),
          same:icons.every((n,i)=>n===refs.icons[i] && n.querySelector('ha-icon')===refs.glyphs[i]) && root.querySelector('.appHeader')===refs.header && root.querySelector('.systemControllerPhoto')===refs.photo,
          labels:icons.map(n=>n.getAttribute('aria-label')),question:icons[1].querySelector('.hasQuestion')!==null};
      },{state,attributes,connected});
      assert.deepEqual(actual.icons,expected);
      assert.equal(actual.same,true,'Telemetry patches the existing header, photo, icons and glyphs');
      assert.ok(actual.labels.every(Boolean),'Both independent states have accessible labels');
      assert.equal(actual.question,expected[1]==='mdi:clock-outline');
    }
    await page.evaluate(()=>{panel._view='diagnostics';panel.render();});
    assert.match(await page.locator('nikas-ho-sc-8w-panel .irrigationSourceDetails').textContent(),/Связь есть.*Данные актуальны/s);
    await page.evaluate(()=>{panel._view='status';panel.render();});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    assert.equal(await page.evaluate(()=>panel.shadowRoot.querySelector('[data-status-icon]')===refs.icons[0]),true);
    assert.deepEqual(errors,[]);
    if(process.env.NIKAS_SCREENSHOT_DIR && width===430) await page.screenshot({path:path.join(process.env.NIKAS_SCREENSHOT_DIR,'irrigation-compact-dark.png')});
    console.log(`PASS compact status: ${width}px, both themes, image right, ten state transitions, stable DOM and diagnostics`);
    await page.close();
  }
}finally{await browser.close();}
