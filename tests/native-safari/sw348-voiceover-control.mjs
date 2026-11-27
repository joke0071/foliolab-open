import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';
import { voiceOver, MacOSKeyCodes } from '@guidepup/guidepup';

const html = `<!doctype html><meta charset="utf-8"><title>VoiceOver control</title>
<div id="target"></div><script type="module">
let processed;
setInterval(async () => {
  const { stage } = await (await fetch('/state')).json();
  if (!stage || stage === processed) return;
  const root = document.querySelector('#target');
  if (stage === 'control') {
    root.innerHTML = '<button id="control">FolioLab Kontrollansage Sieben</button>';
    root.firstElementChild.focus();
    processed = stage;
    await fetch('/observed', {method:'POST',body:JSON.stringify({stage, id:document.activeElement.id, browser:navigator.userAgent})});
    return;
  }
  let frame = root.querySelector('iframe');
  if (!frame) {
    root.innerHTML = '<iframe title="FolioLab Open" src="/app/index.html" width="100%" height="700"></iframe>';
    return;
  }
  const doc = frame.contentDocument;
  if (!doc?.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv')) return;
  const selectors = { link:'.skip-to-content', main:'#mainContent', positions:'nav [data-page="positions"]', bookings:'nav [data-page="bookings"]' };
  const expected = [...doc.querySelectorAll(selectors[stage])].find(node => node.getBoundingClientRect().width > 0);
  if (!expected) return;
  if (stage !== 'main') {
    frame.contentWindow.focus();
    expected.focus();
  }
  if (doc.activeElement !== expected) return;
  processed = stage;
  await fetch('/observed', {method:'POST',body:JSON.stringify({stage, id:expected.id, tag:expected.tagName, browser:navigator.userAgent, hash:frame.contentWindow.location.hash, selector:selectors[stage], label:expected.getAttribute('aria-label') || (stage === 'main' ? doc.getElementById('pageTitle').textContent : expected.textContent.trim())})});
}, 300);
</script>`;

const app = spawn('python3', ['-m', 'http.server', '4187', '--bind', '127.0.0.1'], { stdio: 'ignore' });
const observations = new Map();
const report = { product: '4e3e4a256ce0d81946ed6907b965d1f30aac33fe', runnerImage: process.env.ImageVersion, scope: 'Real Safari, unchanged local product bytes in same-origin observation frame, real system VoiceOver.', stages: [] };
let stage;
const server = createServer(async (request, response) => {
  try {
    if (request.url === '/') {
      response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}).end(html);
    } else if (request.url === '/state') {
      response.writeHead(200, {'Cache-Control':'no-store'}).end(JSON.stringify({stage}));
    } else if (request.url === '/observed' && request.method === 'POST') {
      let body = '';
      for await (const chunk of request) body += chunk;
      const value = JSON.parse(body);
      observations.set(value.stage, value);
      response.writeHead(204).end();
    } else if (request.url.startsWith('/app/')) {
      const upstream = await fetch('http://127.0.0.1:4187' + request.url.slice(4));
      response.writeHead(upstream.status, {'Content-Type':upstream.headers.get('content-type') || 'application/octet-stream'})
        .end(Buffer.from(await upstream.arrayBuffer()));
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
  if (activate) await voiceOver.perform({keyCode:MacOSKeyCodes.Return,modifiers:[]}, {capture:false});
  for (let attempt = 0; attempt < 18 && !observations.has(name); attempt++) await pause(500);
  sample.focus = observations.get(name);
  assert.ok(sample.focus, 'Safari focus receipt missing for ' + name);
  for (let attempt = 0; attempt < 6; attempt++) {
    const phrase = await voiceOver.lastSpokenPhrase();
    if (phrase && !sample.phrases.includes(phrase)) sample.phrases.push(phrase);
    if (wanted.test(phrase ?? '')) {
      sample.spoken = phrase;
      break;
    }
    await pause(350);
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
  report.phase = 'control';
  await observe('control', /FolioLab Kontrollansage Sieben/i);
  assert.match(report.stages[0].focus.browser, /Version\/[^ ]+ Safari\//);
  report.phase = 'FolioLab';
  await observe('link', /Direkt zum Inhalt/i);
  await observe('main', /Übersicht|Hauptinhalt|main/i, true);
  assert.equal(observations.get('main').id, 'mainContent');
  assert.equal(observations.get('main').hash, '#mainContent');
  await observe('positions', /Positionen/i);
  await observe('bookings', /Buchungen/i);
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
