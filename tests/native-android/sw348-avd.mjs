import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { chromium } from 'playwright';

const mode = process.argv[2];
assert.ok(['source','target'].includes(mode));
const temp = process.env.RUNNER_TEMP;
const output = 'artifacts/android-avd';
const browserPackage = 'com.android.chrome';
const chromeActivity = browserPackage + '/com.google.android.apps.chrome.Main';
const devtools = 'http://127.0.0.1:9222';
const password = 'SYNTHETIC K4 restore 10000!';
const original = join(temp, 'portfolio-10000.json');
const transfer = join(temp, 'FolioLab-AVD-Transfer.json');
const bytes = await readFile(original);
const hash = value => createHash('sha256').update(value).digest('hex');
const originalHash = hash(bytes);
assert.equal(originalHash, '67d9526811d4065448b777ba2ba304f928c253a3096792ed37b0153e18afb809');
const expected = JSON.parse(bytes);
const products = {
  321: {sha:'e272297ab1ba855a2922c1faa4010b83c558a796', port:4371},
  348: {sha:'4e3e4a256ce0d81946ed6907b965d1f30aac33fe', port:4378},
};
const report = {mode, deviceType:'Android Emulator x86_64', fixtureSHA256:originalHash, runner:process.env.ImageVersion, products:{}, errors:[]};
await mkdir(output, {recursive:true});

function adb(...args) {
  return execFileSync('adb', args, {encoding:'utf8', timeout:30000}).trim();
}
function shell(...args) {
  return adb('shell', ...args);
}
async function until(check, label, seconds = 25) {
  const deadline = Date.now() + seconds * 1000;
  do {
    try {
      const result = await check();
      if (result) return result;
    } catch {}
    await pause(250);
  } while (Date.now() < deadline);
  throw Error('Timed out: ' + label);
}
function xml() {
  shell('uiautomator','dump','/sdcard/foliolab-ui.xml');
  return shell('cat','/sdcard/foliolab-ui.xml');
}
function tapNode(pattern, tree = xml()) {
  const node = [...tree.matchAll(/<node [^>]+>/g)].map(match => match[0]).find(text => pattern.test(text));
  const bounds = node?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  if (!bounds) return false;
  shell('input','tap',String(Math.round((+bounds[1]+ +bounds[3])/2)),String(Math.round((+bounds[2]+ +bounds[4])/2)));
  return true;
}
function reportError(stage, error) {
  report.errors.push({stage, message:String(error), stack:error.stack});
  console.log(report.errors.at(-1));
}
async function save() {
  await writeFile(join(output,mode+'.json'),JSON.stringify(report,null,2)+'\n');
}
function stopChrome() {
  shell('am','force-stop',browserPackage);
  assert.equal(shell('pidof '+browserPackage+' || true'),'');
}
function startChrome(url) {
  return shell('am','start','-W','-n',chromeActivity,'-a','android.intent.action.VIEW','-d',url);
}
const root = version => join(temp, 'foliolab-sw'+version);
const origin = version => 'http://127.0.0.1:' + products[version].port;
const servers = new Map();
async function startOrigin(version) {
  const port = products[version].port;
  const child = spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root(version),stdio:'ignore'});
  servers.set(version,child);
  await until(async () => (await fetch(origin(version))).ok, 'local application origin');
}
async function stopOrigin(version) {
  const child = servers.get(version);
  if (!child) return;
  await new Promise(resolve => {
    child.once('exit',resolve);
    if (!child.kill()) resolve();
  });
  servers.delete(version);
}
function navigate(url) {
  const command = startChrome(url);
  assert.match(command,/Status: ok/);
  return command;
}
async function connect(url) {
  await until(async () => {
    const targets = await (await fetch(devtools+'/json/list')).json();
    return targets.some(target => target.type === 'page' && target.url.startsWith(url));
  }, 'Android Chrome DevTools for '+url);
  const browser = await chromium.connectOverCDP(devtools,{timeout:12000});
  let page;
  try {
    page = await until(() => browser.contexts().flatMap(context => context.pages()).find(tab => tab.url().startsWith(url)), 'Playwright attached to the Android tab '+url,15);
  } catch (error) {
    await browser.close();
    throw error;
  }
  page.on('dialog', dialog => {
    report.dialogs ??= [];
    report.dialogs.push({type:dialog.type(), message:dialog.message()});
    return dialog.accept(dialog.type()==='prompt' ? password : undefined);
  });
  page.on('pageerror', error => {
    report.pageErrors ??= [];
    report.pageErrors.push({url:page.url(), error:String(error)});
  });
  page.setDefaultTimeout(25000);
  return {browser,page};
}
async function ready(page) {
  const handle = await page.waitForFunction(() =>
    !document.querySelector('.layout')?.inert && document.getElementById('appStartup')?.hidden &&
    document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv') &&
    performance.getEntriesByName('foliolab-interactive').at(-1), null, {timeout:45000});
  await handle.dispose();
}
async function portfolio(page) {
  return page.evaluate(async () => {
    const storage = await import('/src/atomic-storage.js');
    const model = await import('/src/model.js');
    const db = await storage.openPortfolioDB();
    try {
      const record = await storage.readPortfolioRecord(db);
      return {record, total:model.totalExactEUR(model.safeImport(JSON.parse(record.raw)))};
    } finally { db.close(); }
  });
}
function reference(state) {
  const model = JSON.parse(state.record.raw);
  for (const field of ['providers','accounts','positions','openingPositions','bookings','journalEntries','externalCashFlows','snapshots','walletHistory']) {
    assert.deepEqual(model[field], expected[field], field+' matches independent original');
  }
  assert.equal(state.total, '1000');
  return {cashEUR:state.total, bookings:model.bookings.length, journals:model.journalEntries.length, walletHistory:model.walletHistory??null, revision:state.record.revision, rawSHA256:hash(state.record.raw)};
}
async function waitRestored(page) {
  await page.waitForFunction(() => document.getElementById('toast')?.textContent.startsWith('Backup wiederhergestellt.') &&
    !document.getElementById('backupStatus').classList.contains('lab-loading'), null, {timeout:120000});
}
async function seed(page) {
  const before = await portfolio(page);
  assert.equal(JSON.parse(before.record.raw).bookings.length,0,'Origin starts with an empty synthetic profile');
  await page.locator('#backupFile').setInputFiles({name:'portfolio-10000.json',mimeType:'application/json',buffer:bytes});
  await waitRestored(page);
  return reference(await portfolio(page));
}
async function configureChrome() {
  assert.match(shell('pm','path',browserPackage),/package:/);
  shell('am','set-debug-app','--persistent',browserPackage);
  shell("echo 'chrome --disable-fre --no-default-browser-check --disable-background-networking' > /data/local/tmp/chrome-command-line");
  adb('forward','tcp:9222','localabstract:chrome_devtools_remote');
  for (const {port} of Object.values(products)) adb('reverse','tcp:'+port,'tcp:'+port);
  report.avd = {
    android:shell('getprop','ro.build.version.release'),
    build:shell('getprop','ro.build.fingerprint'),
    sdk:shell('getprop','ro.build.version.sdk'),
    chrome:shell("dumpsys package com.android.chrome | grep -m 1 versionName").trim(),
    display:shell('wm','size'),
    density:shell('wm','density'),
  };
}
async function firstChrome(url) {
  navigate(url);
  for (let tryIndex=0;tryIndex<6;tryIndex++) {
    try {
      if ((await fetch(devtools+'/json/version')).ok) return;
    } catch {}
    try {
      tapNode(/text="(Use without an account|Continue without an account|No thanks|Got it|Accept &amp; continue|Continue)"/i);
    } catch {}
    await pause(1000);
  }
  await until(async () => (await fetch(devtools+'/json/version')).ok,'Chrome first run');
}
async function versionInfo(page, version) {
  await page.waitForFunction(() => !!navigator.serviceWorker.controller,null,{timeout:60000});
  const receipt = await page.evaluate(async () => ({
    ua:navigator.userAgent, controller:navigator.serviceWorker.controller.scriptURL, caches:await caches.keys(),
    standalone:matchMedia('(display-mode: standalone)').matches,
  }));
  assert.match(receipt.ua,/Android.*Chrome\//);
  assert.ok(receipt.caches.includes('foliolab-open-v'+version));
  return receipt;
}
async function connectTarget(url) {
  const target = await until(async () => {
    const targets = await (await fetch(devtools+'/json/list')).json();
    return targets.find(tab => tab.type==='page' && tab.url.startsWith(url) && tab.webSocketDebuggerUrl);
  },'visible Chrome page target for '+url,35);
  const endpoint = new URL(target.webSocketDebuggerUrl);
  endpoint.hostname = '127.0.0.1';
  endpoint.port = '9222';
  const socket = new WebSocket(endpoint);
  const pending = new Map();
  let sequence = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timeout);
    if (message.error) entry.reject(Error(message.error.message));
    else entry.resolve(message.result);
  });
  const fail = event => {
    for (const entry of pending.values()) {
      clearTimeout(entry.timeout);
      entry.reject(Error('Chrome page DevTools connection closed: '+event.type));
    }
    pending.clear();
  };
  socket.addEventListener('close',fail);
  socket.addEventListener('error',fail);
  try {
    await until(() => socket.readyState===WebSocket.OPEN,'Chrome page socket',10);
  } catch (error) {
    socket.close();
    throw error;
  }
  function send(method, params={}) {
    return new Promise((resolve,reject) => {
      if (socket.readyState!==WebSocket.OPEN) return reject(Error('Closed Chrome page socket'));
      const id = ++sequence;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(Error('CDP timeout: '+method));
      },20000);
      pending.set(id,{resolve,reject,timeout});
      socket.send(JSON.stringify({id,method,params}));
    });
  }
  return {
    id:target.id,
    send,
    close:() => socket.close(),
    async value(expression) {
      const response = await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if (response.exceptionDetails) throw Error(response.exceptionDetails.exception?.description??response.exceptionDetails.text);
      return response.result.value;
    },
  };
}
async function takeSample(tab, version, start, platformStart, kind, truth, previous) {
  const doc = await until(() => tab.value(`(() => {
    const mark = performance.getEntriesByName('foliolab-interactive').at(-1);
    if (!mark || document.querySelector('.layout')?.inert || !document.getElementById('appStartup')?.hidden ||
        !document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv')) return null;
    return {
      timeOrigin:performance.timeOrigin, interactiveMs:mark.startTime,
      firstContentfulPaintMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime??null,
      serviceWorker:!!navigator.serviceWorker.controller,
      standalone:matchMedia('(display-mode: standalone)').matches,
    };
  })()`).then(receipt => receipt?.timeOrigin!==previous && receipt), 'interactive SW'+version+' '+kind,45);
  const readinessObservedMs = performance.now() - start;
  const point = await tab.value(`(() => {
    const buttons = document.querySelectorAll('#mobileNav [data-page="positions"],#sidebarNav [data-page="positions"]');
    const button = Array.from(buttons).find(node => {
      const bounds = node.getBoundingClientRect();
      return bounds.width>0 && bounds.height>0 && bounds.x>=0 && bounds.y>=0 && bounds.bottom<=innerHeight;
    });
    if (!button) return null;
    const bounds = button.getBoundingClientRect();
    return {x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  })()`);
  assert.ok(point,'An in-viewport Positions control is available');
  await tab.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await tab.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await until(() => tab.value("document.getElementById('pageTitle')?.textContent.includes('Positionen')"),'first safe Positions navigation',12);
  const safeInteractionObservedMs = performance.now() - start;
  const state = await tab.value(`(async () => {
    const storage = await import('/src/atomic-storage.js');
    const model = await import('/src/model.js');
    const db = await storage.openPortfolioDB();
    try {
      const record = await storage.readPortfolioRecord(db);
      return {record,total:model.totalExactEUR(model.safeImport(JSON.parse(record.raw)))};
    } finally { db.close(); }
  })()`);
  const value = reference(state);
  assert.deepEqual(value,truth,'Read-only navigation leaves financial state and revision unchanged');
  if (kind==='offline') {
    assert.ok(doc.serviceWorker,'Offline start is controlled by the application worker');
    assert.equal(shell('settings','get','global','airplane_mode_on'),'1');
  }
  return {kind,...doc,readinessObservedMs,safeInteractionObservedMs,platformStart,financial:value};
}
function describe(values) {
  const sorted = [...values].sort((a,b) => a-b);
  const mean = values.reduce((sum, value) => sum + value,0) / values.length;
  return {median:sorted[2], min:sorted[0], max:sorted.at(-1), sampleStandardDeviation:Math.sqrt(values.reduce((sum,value) => sum+(value-mean)**2,0)/(values.length-1))};
}
async function benchmark(version, truth) {
  const receipts = report.products[version];
  let tab;
  try {
    for (const kind of ['cold','warm','offline']) {
      const samples = [];
      receipts[kind] = {samples};
      if (kind === 'offline') {
        tab?.close();
        tab = null;
        shell('cmd','connectivity','airplane-mode','enable');
        shell('svc','wifi','disable');
        shell('svc','data','disable');
        await stopOrigin(version);
        adb('reverse','--remove','tcp:'+products[version].port);
        receipts.offline.android = {
          airplaneMode:shell('settings','get','global','airplane_mode_on'),
          wifiOn:shell('settings','get','global','wifi_on'),
          dataOn:shell('settings','get','global','mobile_data'),
          reverseRoutes:adb('reverse','--list'),
        };
        assert.equal(receipts.offline.android.airplaneMode,'1');
        assert.equal(receipts.offline.android.wifiOn,'0');
        assert.ok(!receipts.offline.android.reverseRoutes.includes('tcp:'+products[version].port));
        await assert.rejects(fetch(origin(version)+'/'));
      }
      try {
        for (let index=0;index<5;index++) {
          let start;
          let previous;
          let platformStart = null;
          if (kind === 'warm') {
            assert.ok(tab,'Warm reload reuses the last verified Chrome page target');
            assert.ok(shell('pidof '+browserPackage+' || true'),'Warm reload preserves the browser process');
            previous = (samples.at(-1)??receipts.cold.samples.at(-1)).timeOrigin;
            start = performance.now();
            await tab.send('Page.reload');
          } else {
            tab?.close();
            tab = null;
            stopChrome();
            start = performance.now();
            platformStart = navigate(origin(version)+'/');
            tab = await connectTarget(origin(version));
          }
          const sample = await takeSample(tab,version,start,platformStart,kind,truth,previous);
          samples.push({...sample,target:tab.id});
          console.log('SW'+version+' '+kind+' sample '+(index+1)+' verified');
          await save();
        }
        for (const metric of ['interactiveMs','readinessObservedMs','safeInteractionObservedMs']) {
          receipts[kind][metric] = describe(samples.map(sample => sample[metric]));
        }
      } finally {
        if (kind === 'offline') {
          shell('cmd','connectivity','airplane-mode','disable');
          shell('svc','wifi','enable');
          shell('svc','data','enable');
          adb('reverse','tcp:'+products[version].port,'tcp:'+products[version].port);
          await startOrigin(version);
        }
      }
    }
  } finally {
    tab?.close();
  }
}
async function encryptedExport(page) {
  await page.locator('#backupPasswordSetup > summary').click();
  if (await page.locator('#backupPasswordForm').isVisible()) {
    await page.locator('#backupPassword').fill(password);
    await page.locator('#backupPasswordConfirm').fill(password);
    await page.locator('#saveBackupPassword').click();
  }
  await page.locator('#fullBackupIncludeHistory').check();
  await page.locator('#fullBackupIncludeSettings').check();
  const before = await portfolio(page);
  const browserCDP = await page.context().newCDPSession(page);
  await browserCDP.send('Browser.setDownloadBehavior',{behavior:'default',eventsEnabled:true});
  const names = () => shell('ls','-1','/sdcard/Download').split('\n').filter(Boolean);
  const existing = names();
  const findBackup = () => {
    const added = names().filter(name => !existing.includes(name) && name.endsWith('.json'));
    return added.length === 1 && added[0];
  };
  await page.locator('#exportEncryptedBackup').click();
  let filename;
  try {
    filename = await until(findBackup,'Android Chrome completed native download',25);
  } catch {
    const toast = await page.locator('#toast').textContent();
    const ui = xml();
    report.downloadDiagnostic = {toast, files:names(), nativeVisibleText:[...ui.matchAll(/text="([^"]+)"/g)].map(match => match[1]).slice(0,24)};
    tapNode(/text="(?:Download anyway|Download|Save)"/i,ui);
    filename = await until(findBackup,'Android Chrome completed native download with UI confirmation',35);
  }
  adb('pull','/sdcard/Download/'+filename,transfer);
  const backup = await readFile(transfer);
  assert.equal(JSON.parse(backup).format,'foliolab-open-encrypted-v2');
  assert.deepEqual(await portfolio(page),before,'Export leaves the source record unchanged');
  report.export = {filename, bytes:backup.length, sha256:hash(backup), source:reference(before)};
  await writeFile(join(output,'source-transfer.json'),JSON.stringify(report.export,null,2)+'\n');
}
async function nativeRestore(page) {
  const originalTransfer = JSON.parse(await readFile(join(output,'source-transfer.json')));
  const backup = await readFile(transfer);
  assert.equal(hash(backup),originalTransfer.sha256);
  const before = await portfolio(page);
  assert.equal(JSON.parse(before.record.raw).bookings.length,0,'AVD B starts with an empty portfolio');
  const filename = 'FolioLab-AVD-Transfer.json';
  adb('push',transfer,'/sdcard/Download/'+filename);
  shell('am','broadcast','-a','android.intent.action.MEDIA_SCANNER_SCAN_FILE','-d','file:///sdcard/Download/'+filename);
  await page.locator('#importBackup').click({noWaitAfter:true});
  const chooser = await until(() => {
    const candidate = xml();
    return /package="(?:com.google.android.documentsui|com.android.documentsui)"/.test(candidate) && candidate;
  }, 'native Android DocumentsUI');
  if (!tapNode(/text="FolioLab-AVD-Transfer\.json"/,chooser)) {
    tapNode(/content-desc="Show roots"/,chooser);
    await until(() => tapNode(/text="Downloads"/), 'DocumentsUI Downloads root');
    await until(() => tapNode(/text="FolioLab-AVD-Transfer\.json"/), 'native file selection');
  }
  await waitRestored(page);
  const after = await portfolio(page);
  const value = reference(after);
  assert.equal(value.revision,before.record.revision+1,'Target restore commits one local revision');
  assert.equal(value.rawSHA256,originalTransfer.source.rawSHA256,'Same canonical model in the independent target');
  report.restore = {chooser:'Android DocumentsUI', transferredSHA256:hash(backup), targetRevisionBefore:before.record.revision, state:value};
  return after;
}
try {
  await configureChrome();
  await startOrigin(348);
  if (mode === 'source') await startOrigin(321);
  await firstChrome(origin(mode === 'source' ? 321 : 348)+'/?page=more');
  if (mode === 'source') {
    for (const version of [321,348]) {
      try {
        if (version!==321) stopChrome();
        navigate(origin(version)+'/?page=more');
        const {browser,page} = await connect(origin(version));
        try {
          await page.goto(origin(version)+'/?page=more', {waitUntil:'domcontentloaded'});
          try { await ready(page); } catch (error) {
            report.startupFailure ??= {};
            report.startupFailure[version] = await page.evaluate(() => ({
              url:location.href, title:document.title, startup:document.getElementById('appStartupText')?.textContent,
              storage:document.getElementById('portfolioStorageState')?.textContent,
              mark:performance.getEntriesByName('foliolab-interactive').length,
            }));
            throw error;
          }
          const truth = await seed(page);
          report.products[version] = {sha:products[version].sha, startup:await versionInfo(page,version), seed:truth};
          if (version === 348 && process.env.FOLIOLAB_SKIP_RECOVERY !== '1') {
            try { await encryptedExport(page); }
            catch (error) { reportError('AVD A encrypted export',error); }
          }
        } finally { await browser.close(); }
        await benchmark(version,report.products[version].seed);
      } catch (error) { reportError('SW'+version+' Android startup',error); }
      await save();
    }
  } else {
    let session = await connect(origin(348));
    let restored;
    try { await ready(session.page); restored = await nativeRestore(session.page); }
    finally { await session.browser.close(); }
    stopChrome();
    navigate(origin(348)+'/');
    session = await connect(origin(348));
    try {
      await ready(session.page);
      const afterRestart = await portfolio(session.page);
      assert.deepEqual(afterRestart,restored,'Complete target record and revision survive an observed Chrome process exit');
      report.reopen = reference(afterRestart);
    } finally { await session.browser.close(); }
  }
} catch (error) {
  reportError(mode,error);
} finally {
  try { report.finalWindow = shell("dumpsys activity activities | grep -m 1 -E 'topResumedActivity|mResumedActivity'"); } catch {}
  try { stopChrome(); } catch {}
  for (const version of servers.keys()) await stopOrigin(version);
  report.result = report.errors.length ? 'FAIL' : 'PASS';
  if (report.startupFailure || report.downloadDiagnostic) console.log(JSON.stringify({startupFailure:report.startupFailure,downloadDiagnostic:report.downloadDiagnostic,pageErrors:report.pageErrors}));
  await save();
  console.log(JSON.stringify({result:report.result,device:report.avd,export:report.export,restore:report.restore,reopen:report.reopen,errors:report.errors}));
  if (report.errors.length) process.exitCode = 1;
}
