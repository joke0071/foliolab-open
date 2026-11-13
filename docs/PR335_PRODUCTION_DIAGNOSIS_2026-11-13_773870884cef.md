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


## Begrenzter GitHub-Runnerweg · Prüfung 13.11.2026 / work-7bd4ba401567-20261113

**PREPARED_CONTRACT / RUNNER_CHANGE_REQUIRED / NOT_EXECUTED.** Kein unveränderter Full-CI-Retry und keine neue Browserplattform. Der Work-Executor wurde nicht erneut mit dem bekannten AF_UNIX-Fehlstart belastet. Der ursprüngliche GitHub-Job hatte Chromium bereits gestartet; lokale Socketverbote erklären seinen Workerfehler nicht.

Frisch gelesene unveränderliche Eingaben:

| Eingabe | Exakte Identität |
| --- | --- |
| Main | a27cde2f802c26bfec41190911d88bd1d7d8e325 |
| Mainbaum | e55ffa96f641345759eb3779b00de6187c8671b8 |
| Vollständiger Kraken-Test | tests/browser-kraken-import.mjs / Gitblob5cd2025e30423997b5d99660a98e96cb22154b3f |
| Originalhelper | tests/browser-controlled-storage-fixture.mjs / Gitblob7ee6568522425c1a4bcb7549d3be68abda96c09f |
| Hauptworkflow | .github/workflows/import.yml / Gitblob27306b749887459a3ca71da36c3e3e5457d8bfa9 |
| Vorhandener Diagnoseworkflow | .github/workflows/live-initialization-diagnostics.yml / Gitblob3864de8e98ae407b9195870755f4a9d9d6980d4f |
| Bestehender Wrapper | dieses Dokument / Originalcommit703187e2cf6ae8690559ed65650e7f606fadaca1 / WrapperSHA2569e6cac7f4b250edd2cf7e5032627e9965d68ea306c98c42f36a6b90020a23a94 |
| Fehleroriginal | Run43332355188 / Job131591512462 / Artifact13996793680 / 12448968Bytes / SHA256fd35575239ded0d3ef93ae14b2c18397cc944d3cba623eebdd992b972630a69c |

Der ursprüngliche Joblog wurde gezielt über GitHub gelesen, kein neuer Artefakttransfer: Ubuntu24.04-Image20261101.360, Node22.23.4, Playwright1.56.1, ChromiumHeadlessShell141.0.7390.37/build1194, axe-core4.10.3 und pngjs7.0.0. Diese Versionen sind echte Originalbeobachtungen, kein heutiger Runner-PASS. Ein späterer Versuch muss tatsächlichen Image-/Node-/Browser-/Playwrightstand vor dem Test protokollieren und Abweichungen zum Original ausdrücklich bewerten. Kein behauptetes Imagepinning aus runs-on:ubuntu-24.04.

**Erforderlicher enger Ausführungsvertrag:** genau ein vorhandener ubuntu-24.04-Diagnosejob, keine Matrix/zweiteFinalCI/Retry. Unveränderten vollständigen Kraken-Test gegen gepinnten Main ausführen; UH03_BASE=https://foliolab.unperfekt.at/, HISTORY_ENGINES=chromium; UH03_SCENARIOS MUSS ungesetzt bleiben. Reihenfolge link-bridge,solana-bridge,ethereum-bridge,bitcoin-bridge,distinct-fee,cross-reference,same-asset-fee unverändert. Insbesondere den ganzen vorausgehenden Link-UI-/Import-/Restore-/Fehlerkontext vor seinem frischen Offlinekontext erhalten. Kein direkter isolierter Helperaufruf als Ersatz für diesen Zusammenhang; dieser historische Wrapper ist Diagnosevorlage, noch kein fertig qualifizierter Full-Kraken-Launcher.

Vor JEDEM goto müssen die vorhandenen Wrapperbeobachtungen auf alle neu angelegten Testkontexte übertragen werden: Contextrequest/response/requestfailed, TLSsecurityDetails und Fetchfehler, ServiceWorker-Registrierung/Version/Fehler viaCDP sowie Register/updatefound/statechange/controllerchange. Die Übertragung muss abgeschlossen sein, bevor der Originaltest die jeweilige Page erhält; ein bloßer asynchroner page-Eventhandler ohne Barrier genügt nicht. Keine neue readiness-Wartezeit, kein Retry, kein neues Cachecleanup, keine Requestinterception oder Assertion-/20000ms-Änderung. cache.addAll-Abbruch bleibt Hypothese; bei Fehler Assetrequests/HTTP-Status/Cacheinstall/Lifecycle zeitlich korrelieren.

Nur synthetische Originalfixtures und frische Testkontexte; keine privaten Portfolios, Sitzungen, OAuth-/Providercredentials, Header-/Body-/Cookieausgaben. Vor Test veröffentlichte Appbytes gegen gepinnten Main prüfen; bei Drift keine stillschweigende andere Version untersuchen. Sechs Appbaumwurzeln(src/icons/index/styles/manifest/sw) und .github/package wurden heute frisch gegen historischesv311 verglichen: exaktidentisch. Diese Identität qualifiziert keinen fehlgeschlagenen neuen Test.

**Abbruch/Originale:** Abweichende Test-/Helperbytes, unfreigegebener Kandidaten-SHA, erforderliche Fähigkeit fehlt, unerwartete private Daten oder überschrittenes enges Diagnosebudget verhindern Start. Assertion-/Timeoutfehler beendet den EINEN Versuch regulär; keine Wiederholung. Synthetische Fehleroriginale und vorhandene Helpertrace bleiben unverändert; Zusatzereignisse unter eindeutigem neuem Diagnosepfad mit Run/Job/Versuch/Main-/KandidatenSHA/Toolversionen erhalten. Kein Erfolg aus fehlenden oder abgeschnittenen Ereignissen. Kein Release-/LIVE_ACCEPTED aus DiagnosePASS.

**Konkrete Fähigkeits-/Freigabegrenze:** der vorhandene Diagnoseworkflow reagiert auf historische PR-Pfade und feste v220/v221-Branchselektoren; seine vorhandenen Jobs rufen nicht den vollständigen Kraken-Test auf. Das vorhandene Hauptworkflow-Livegate lässt sich nicht als isolierter Diagnosejob starten, ohne den regulären vollständigen Mainweg auszulösen. Die vorhandenen Connector-Rerun-Aktionen wären unveränderte Retries und werden nicht benutzt. Deshalb braucht der nächste tatsächliche Versuch zuerst einen eng reviewbaren Launcher-/Workflowdelta mit exaktem KandidatenSHA; dann die konkrete bestehende#229-Freigabe vor Workflowintegration bzw separat freigabepflichtigemStart. Noch kein solcher Ausführungskandidat veröffentlicht/gestartet und keine pauschale Freigabe angefragt. Diesen Vertrag und die bestehende Instrumentierung weiterverwenden, keine neue Gesamtinventur.

UnabhängigeFLH04-Arbeit zulässig. Mainrun43332355188 bleibtCOMPLETED/FAILURE, ProduktionsursacheUNKNOWN und RELEASE_GATE_OPEN. Historischev311-Produktabnahme nur für identischeKomponenten wiederverwendbar. Alle späteren tatsächlichen Produktions-/Browser-/Offline-/Sicherungs-/Readback-/Restoregates bleiben bestehen.


## Konkreter noch nicht aktivierter Kandidat · work-d62125b28794-20261113

[Vollständiger enger Patch, Prüfung und konkrete Entscheidungsgrenze](PR335_FULL_KRAKEN_DIAGNOSTIC_CANDIDATE_2026-11-13_d62125b28794.md): unreferenzierter Commit e9578124495709ef7550273f239840c96d4a1b1c/Treee17b95fddc8f87dfffa9288f2878785bd7f1979c, exakt3Dateienbytegleichrückgelesen.7lokaleMockgegenproben/Syntax/YAMLstrukturPASS,keinBrowser-/Runner-/ProduktionsPASS. NeuerBranchtest/pr335-full-kraken-d62125b28794NICHTangelegt;AnlagewürdeEINENcreate-Diagnosejobstartenundbedarfderkonkreten#229-FreigabezuSHAundVersuch. KeineaktiveWorkflow-/Main-/Produkt-/Originaltest-/Helperänderung,keinPR/Runner/Retry/Release. ProduktionsursacheUNKNOWN/RELEASE_GATE_OPEN;FLH04Review-/Keyslotgatesoffen. VollständigerPatchimDokumentgesichert;keinUmhüllungscode.


## Einmal autorisierter vollständiger Krakenlauf abgeschlossen · work-d62125b28794-20261113

[Ergebnis/Belegindex/aktuelleÜbergabe](PR335_FULL_KRAKEN_DIAGNOSTIC_RESULT_2026-11-13_d62125b28794.md):Run43421311524/Job131871726863/Versuch1SUCCESS,Kandidate9578124495709ef7550273f239840c96d4a1b1c.7Szenarien/7HelperPASS,154Appdateienbytegleich,15Kontexte/Pagesvollständigbeobachtet/22033Ereignisse/0Worker-/Fetch-/Observerfehler. GenauEINLaufgemäßkonkretem„Ja“,keinRetry/PR/Mainmerge/Deployment. HistorischerFehlernach5PASSdem6.Szenariocross-referencezugeordnet,nichtLink;before-reload20000msTimeout. NeuerLaufreproduziertihnnicht,UrsacheUNKNOWN/Imageabweichung/Instrumentierungseinflussmöglich. Mainrun43332355188bleibtFAILURE/RELEASE_GATE_OPEN,keinReleasePASS. NeueOriginaleV0/2181120Bytesgesichert/gepinntbytegleicheReadback/tatsächlicherbegrenzterCompanionrestore;allealtenOriginalkettenunverändert. AktiverOwnerabschließendSTOPPED/HANDOVER_READY,keinHintergrundbetrieb. DerobennochvorgeseheneersteVersuchistdamitabgeschlossen,nichterneutstarten.
