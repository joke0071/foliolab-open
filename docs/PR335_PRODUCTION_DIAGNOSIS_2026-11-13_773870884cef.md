# PR335 Produktionsblocker – begrenzte Diagnose vom 13.11.2026

Owner: work-773870884cef-20261113. **BLOCKED_BEFORE_BROWSER_START; Produktionsursache UNKNOWN.**
Keine Produkt-, Test-, Workflow-, SW- oder Mainänderung; kein PR, kein CI-Retry und keine Releaseabnahme.

## Frische Ausgangsprüfung

Main a27cde2f802c26bfec41190911d88bd1d7d8e325 / Tree e55ffa96f641345759eb3779b00de6187c8671b8 unverändert.
Mainrun43332355188 COMPLETED/FAILURE. PR334/335 integriert, Reviews/Kommentare leer.
Keine IN_PROGRESS-Action; Queues43095194276/43095194257 unverändert seit2026-11-11T20:18:14Z.
Offene geschützte PR332/157/161. UI-R4-Ref97ea17b5e4bfc390e1ef6c5fc68ea4c7dde096aa unverändert.
Checkpoint vor Übernahme683dab805723eb350d9b33bb47129e71f878cc3d, nach Übernahmeeb890b34dafd5659f2dfad38837480f67ac7b4fc; eigener Eintrag gepinnt rückgelesen.
Keine tatsächliche konkurrierende Schreibaktivität belegt; ältere Ausführung work-pr333-20261112-1942 weiterhin NICHT technisch als beendet nachgewiesen.

V155 frisch per Metadaten bestätigt: Version155,406425600Bytes.
FAIL-Companion V0/12748800Bytes und Main-Companion V0/212408320Bytes vorhanden.
Historische gepinnte Readback-/Restorebelege unverändert wiederverwendet; hier KEIN neuer Download/Restore, kein neues privates Backup und keine private Mutation.
Root allein bleibt unvollständiger Payloadsatz.

## Tatsächliche lokale Beobachtung

- Vorhandenes /usr/bin/chromium: **156.0.8078.79**; vorhandenes Playwright **1.62.1**; Node **24.22.1**. Das ist NICHT die frühere Chromium141/PW1.56.1-Umgebung und kein CI-äquivalenter Toolstand.
- Regulärer HTTP-TLS-Client mit geerbtem Proxy/CA: HTTP200 von https://foliolab.unperfekt.at/. Kein Browsernachweis.
- Bereitgestellte CA /usr/local/share/ca-certificates/nebula-dns.crt regulär in NSS sql:/home/agent/.pki/nssdb importiert. Vorher fehlende DB; certutil -V bestätigt Zertifikat gültig.
- CA SHA256 C7:1B:4D:1E:9D:77:75:C5:38:C6:88:AB:10:CE:A9:CE:41:7D:73:12:E8:98:38:F9:D1:5F:F7:32:56:CD:7F:C3.
- Chromium mit geerbtem HTTP-Proxy und ohne TLS-Ausnahme gestartet. Vor jeder Navigation beendet:

```text
FATAL:chrome/browser/process_singleton_posix.cc:297
Check failed: . socket() failed: Operation not permitted (1)
browserType.launch: Target page, context or browser has been closed
```

- Vorgesehener Start außerhalb der Socket-beschränkten Sandbox wurde von der Berechtigungsprüfung abgewiesen: sandbox_approval=false; keine Ausführung erfolgt.
- Daher weder erfolgreiche HTTPS-Browsernavigation noch Worker-/Netzwerkereignisse noch Helperergebnis. Importierte CA allein beweist keinen funktionierenden Chromium-Vertrauenspfad.
- Keine ignoreHTTPSErrors-/ignore-certificate-errors-Ausnahme, keine Frist-/Assertionlockerung. Keine andere Plattform oder Infrastruktur gebaut.

## Genau nächster begründeter Diagnoseversuch

In einer zulässigen bestehenden Chromium-Ausführungsumgebung mit lokalen Sockets denselben regulären CA-/Proxy-Pfad verwenden. Keine neue Plattform und keinen vollständigen CI-Lauf zur Zugriffsprobe bauen.
Vor goto Netzwerkrequests/-fehler, Responses samt TLS-Details, ServiceWorker-CDP-Registrierungs-/Versions-/Fehlerereignisse und Register-/Lifecycleereignisse aktivieren.
Dann exakt den Mainhelper Gitblob7ee6568522425c1a4bcb7549d3be68abda96c09f mit dem Kraken-Frischkontext und unveränderten20000ms ausführen. Wrapper unten ist vorbereitet und nur syntaktisch geprüft, NICHT bis Browserstart ausgeführt/qualifiziert.

Bei Worker-installationsfehler zuerst konkret fehlgeschlagene ASSETS-Requests/HTTP-Status/Workerfehlermeldung korrelieren. Ein möglicher install-cache.addAll-Abbruch ist derzeit nur eine Hypothese aus sw.js, KEINE belegte Ursache.
Falls gerichtete Probe besteht, erklärt das den alten CI-Fehler nicht: Originale behalten; nächster enger Schritt wäre ein gleichwertig instrumentierter Kraken-link-bridge-Ablauf einschließlich der vorangehenden synthetischen Kontexte, erst nach bytegleichem Main-/Assetabgleich. Keine unveränderte Full-CI daraus ableiten.
Bei erneutem Socketverbot nicht denselben Start wiederholen oder Sandboxschutz umgehen.

Der isolierte Start kann den vorangehenden gesamten Krakenablauf nicht gleichwertig ersetzen. Keine Produktions-/Releaseabnahme daraus.
UI-R4 erst nach vollständiger sicherer Qualifikation des aktuellen Main.

## Wiederverwendbarer Diagnosewrapper

Als probe.mjs neben dem exakt per GitHub-Plugin gelesenen Mainhelper speichern; Arbeitsverzeichnis mit schreibbaren artifacts/gates wählen. Vor Ausführung lokale Voraussetzungen und exakte Helperbytes prüfen. CODEX_PRIMARY_RUNTIME_NODE_MODULES und HTTPS_PROXY werden aus der Umgebung verwendet; keine Secrets einbetten.
Der Originalhelper bleibt unverändert. Seine lokale erste Textkopie enthielt zusätzliches abschließendes LF und wurde vor weiterer Verwendung auf exakte Gitbytes korrigiert; der Browser kam auch zuvor nicht zum Helper. Anschließender Gitblobcheck7ee6568522425c1a4bcb7549d3be68abda96c09f.
Wrapper-SHA256 9e6cac7f4b250edd2cf7e5032627e9965d68ea306c98c42f36a6b90020a23a94; node --check PASS.

```javascript
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const events=[],start=Date.now(),log=(type,data)=>events.push({ms:Date.now()-start,type,...data});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,timeout:20000,proxy:{server:process.env.HTTPS_PROXY}});
const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'allow'});
const page=await context.newPage();page.setDefaultTimeout(20000);
context.on('request',r=>log('request',{url:r.url(),method:r.method(),worker:!!r.serviceWorker()}));
context.on('requestfailed',r=>log('requestfailed',{url:r.url(),failure:r.failure(),worker:!!r.serviceWorker()}));
context.on('response',async r=>{let security;try{security=await r.securityDetails()}catch{}log('response',{url:r.url(),status:r.status(),worker:!!r.request().serviceWorker(),security})});
context.on('serviceworker',worker=>{log('worker',{url:worker.url()});worker.on('close',()=>log('workerclose',{url:worker.url()}))});
page.on('console',msg=>log('console',{level:msg.type(),text:msg.text()}));
page.on('pageerror',e=>log('pageerror',{error:String(e)}));
const cdp=await context.newCDPSession(page);
for(const name of ['ServiceWorker.workerRegistrationUpdated','ServiceWorker.workerVersionUpdated','ServiceWorker.workerErrorReported'])cdp.on(name,p=>log(name,p));
await cdp.send('ServiceWorker.enable');
await cdp.send('Network.enable');
cdp.on('Network.loadingFailed',p=>log('Network.loadingFailed',p));
await context.exposeBinding('__folioDiagnostic',(_,data)=>log('lifecycle',data));
await context.addInitScript(()=>{
 const describe=w=>w?{script:w.scriptURL,state:w.state}:null;
 const seen=new WeakSet();
 const report=(event,r)=>window.__folioDiagnostic({event,href:location.href,controller:describe(navigator.serviceWorker.controller),installing:describe(r?.installing),waiting:describe(r?.waiting),active:describe(r?.active)});
 const watch=r=>{report('registration',r);const workers=()=>{for(const w of [r.installing,r.waiting,r.active])if(w&&!seen.has(w)){seen.add(w);w.addEventListener('statechange',()=>{report('statechange',r);workers()})}};workers();r.addEventListener('updatefound',()=>{report('updatefound',r);workers()})};
 if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('controllerchange',()=>report('controllerchange'));const original=navigator.serviceWorker.register;navigator.serviceWorker.register=function(...args){report('register-call');return original.apply(this,args).then(r=>{watch(r);return r},e=>{window.__folioDiagnostic({event:'register-error',error:String(e)});throw e})}}
});
let result='FAIL',error,verified;
try{
 const response=await page.goto('https://foliolab.unperfekt.at/?page=bookings');
 log('navigation-result',{status:response.status(),security:await response.securityDetails()});
 const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db)}finally{db.close()}});
 verified=await controlledStorageFixture(page,ready,record);
 assert.equal(await page.evaluate(()=>isSecureContext),true);
 result='PASS';
}catch(e){error=String(e);log('exception',{error,stack:e.stack})}
finally{
 try{log('final',{state:await page.evaluate(async()=>({secure:isSecureContext,url:location.href,registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,active:r.active?.state,installing:r.installing?.state})),caches:await caches.keys()}))})}catch(e){log('final-error',{error:String(e)})}
 fs.writeFileSync('production-worker-diagnostic.json',JSON.stringify({result,error,verified,browser:browser.version(),playwright:require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright/package.json').version,helperGitBlob:'7ee6568522425c1a4bcb7549d3be68abda96c09f',tlsExceptions:false,timeoutMilliseconds:20000,events},null,2)+'\n');
 await browser.close();console.log(JSON.stringify({result,error,verified,events:events.length}));if(result!=='PASS')process.exitCode=1;
}
```
