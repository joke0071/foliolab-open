import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';
import { voiceOver, macOSActivateId, voiceOverKeyCodeCommands } from '@guidepup/guidepup';

const controlPage = `<!doctype html><meta charset="utf-8"><title>VoiceOver control</title>
<button id="control">FolioLab Kontrollansage Sieben</button><script type="module" src="/__observer.js"></script>`;

const observer = `
let processed;
for (const name of ['focusin','keydown','click','hashchange']) {
  window.addEventListener(name,event => {
    const target = event.target;
    const anchor = target?.closest?.('.skip-to-content');
    if (!anchor && name !== 'hashchange' && target?.id !== 'mainContent') return;
    void fetch('/__trace',{method:'POST',body:JSON.stringify({name, trusted:event.isTrusted, key:event.key, target:target?.id || target?.className || '', hash:location.hash, active:document.activeElement?.id || document.activeElement?.className || ''})});
  },true);
}
setInterval(async () => {
  const { stage } = await (await fetch('/__state')).json();
  if (!stage || stage === processed) return;
  const control = location.pathname === '/';
  if ((stage === 'control') !== control) return;
  if (!control && !document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv')) return;
  const selectors = { control:'#control', link:'.skip-to-content', main:'#mainContent', positions:'#sidebarNav [data-page="positions"],#mobileNav [data-page="positions"]', bookings:'#sidebarNav [data-page="bookings"],#mobileNav [data-page="bookings"]' };
  const expected = [...document.querySelectorAll(selectors[stage])].find(node => node.getBoundingClientRect().width > 0);
  if (!expected) return;
  if (stage !== 'main') expected.focus();
  if (document.activeElement !== expected) return;
  processed = stage;
  await fetch('/__observed', {method:'POST',body:JSON.stringify({
    stage, id:expected.id, tag:expected.tagName, browser:navigator.userAgent, hash:location.hash,
    selector:selectors[stage], label:expected.getAttribute('aria-label') || (stage === 'main' ? document.getElementById('pageTitle').textContent : expected.textContent.trim()),
  })});
}, 250);
`;

const app = spawn('python3', ['-m', 'http.server', '4187', '--bind', '127.0.0.1'], { stdio: 'ignore' });
const observations = new Map();
const report = { product: '4e3e4a256ce0d81946ed6907b965d1f30aac33fe', runnerImage: process.env.ImageVersion, scope: 'Real Safari, top-level local release with only an external focus observer added to HTML, real system VoiceOver.', stages: [], trace: [] };
let stage;
const server = createServer(async (request, response) => {
  try {
    if (request.url === '/') {
      response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}).end(controlPage);
    } else if (request.url === '/__observer.js') {
      response.writeHead(200, {'Content-Type':'text/javascript; charset=utf-8'}).end(observer);
    } else if (request.url === '/__state') {
      response.writeHead(200, {'Cache-Control':'no-store'}).end(JSON.stringify({stage}));
    } else if (['/__observed','/__trace'].includes(request.url) && request.method === 'POST') {
      let body = '';
      for await (const chunk of request) body += chunk;
      const value = JSON.parse(body);
      if (request.url === '/__trace') report.trace.push(value);
      else observations.set(value.stage, value);
      response.writeHead(204).end();
    } else if (request.url.startsWith('/app/')) {
      const upstream = await fetch('http://127.0.0.1:4187' + request.url.slice(4));
      const type = upstream.headers.get('content-type') || 'application/octet-stream';
      const body = request.url === '/app/index.html'
        ? (await upstream.text()).replace('</body>', '<script type="module" src="/__observer.js"></script></body>')
        : Buffer.from(await upstream.arrayBuffer());
      response.writeHead(upstream.status, {'Content-Type':type}).end(body);
    } else {
      response.writeHead(404).end();
    }
  } catch {
    response.writeHead(502).end();
  }
});

async function observe(name, wanted, activate = false) {
  await voiceOver.clearSpokenPhraseLog();
  const sample = { name, phrases: [] };
  report.stages.push(sample);
  stage = name;
  if (activate) {
    await voiceOver.act({capture:true});
    const observed = report.trace.findLast(event => event.name==='focusin' && event.trusted && event.target==='mainContent' && event.active==='mainContent');
    if (observed) observations.set(name,{stage:name,id:observed.target,hash:observed.hash,source:'trusted focusin'});
  }
  for (let attempt = 0; attempt < 45 && !observations.has(name); attempt++) await pause(500);
  sample.focus = observations.get(name);
  assert.ok(sample.focus, 'Safari focus receipt missing for ' + name);
  const capture = async () => {
    sample.phrases = [...await voiceOver.spokenPhraseLog()];
    sample.spoken = sample.phrases.find(phrase => wanted.test(phrase));
  };
  await capture();
  if (!sample.spoken) {
    await voiceOver.perform(voiceOverKeyCodeCommands.moveCursorToKeyboardFocus, {capture:true});
    await capture();
  }
  if (!sample.spoken && name !== 'control' && sample.phrases.some(phrase => /web content group|enter the web area/i.test(phrase))) {
    sample.enteredWebArea = true;
    await voiceOver.interact({capture:true});
    await voiceOver.perform(voiceOverKeyCodeCommands.moveCursorToKeyboardFocus,{capture:true});
    await capture();
    if (!sample.spoken && name === 'main') {
      sample.usedNextHeading = true;
      await voiceOver.nextHeading({capture:true});
      await capture();
    }
  }
  if (!sample.spoken) {
    await voiceOver.perform(voiceOverKeyCodeCommands.hearItemDescription, {capture:true});
    await capture();
  }
  if (!sample.spoken && name === 'control') {
    await voiceOver.next({capture:true});
    await capture();
  }
  assert.ok(sample.spoken, 'VoiceOver did not announce ' + wanted + ' at ' + name);
}

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let started = false;
try {
  report.phase = 'open Safari';
  execFileSync('open', ['-a', 'Safari', 'http://127.0.0.1:' + server.address().port + '/']);
  await pause(1800);
  report.phase = 'start VoiceOver';
  await voiceOver.start({timeout:12000,retries:1});
  started = true;
  await macOSActivateId('com.apple.Safari');
  report.phase = 'control';
  await observe('control', /FolioLab Kontrollansage Sieben/i);
  assert.match(report.stages[0].focus.browser, /Version\/[^ ]+ Safari\//);
  report.phase = 'FolioLab';
  execFileSync('open', ['-a', 'Safari', 'http://127.0.0.1:' + server.address().port + '/app/index.html']);
  await macOSActivateId('com.apple.Safari');
  await observe('link', /Direkt zum Inhalt/i);
  report.sequenceErrors = [];
  for (const [name,phrase] of [['main',/Übersicht|Hauptinhalt|\bmain\b/i],['positions',/Positionen/i],['bookings',/Buchungen/i]]) {
    try {
      await observe(name,phrase,name==='main');
      if (name==='main') {
        assert.equal(observations.get('main').id,'mainContent');
        assert.equal(observations.get('main').hash,'#mainContent');
      }
    } catch (error) {
      report.sequenceErrors.push({name,error:String(error)});
    }
  }
  assert.deepEqual(report.sequenceErrors,[]);
  report.result = 'PASS';
} catch (error) {
  report.error = String(error);
  process.exitCode = 1;
} finally {
  if (started) {
    try { await voiceOver.stop({timeout:5000,retries:1}); }
    catch (error) { report.stopError = String(error); }
  }
  app.kill();
  server.close();
  const output = 'artifacts/native-safari';
  await mkdir(output, {recursive:true});
  const json = JSON.stringify(report, null, 2) + '\n';
  await writeFile(output + '/report.json', json);
  console.log(json);
}
