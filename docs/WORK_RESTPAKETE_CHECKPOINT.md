## #255 FIN-E2E01 / PR262 – MERGED · Produktionsabnahme PENDING · 01.11.2026

**Main `87d4669c217e5a9f7362e50239d3f85f83bcaa3b`**, Tree `e2f6670913e353bfc7828822470c33b58aac8da0` = exakt geprüftem HEAD `70400c3ac42c2663757a2cf6c1b195c924a0729d` und synthetischem Merge `49f1be8db6560eeecfb05e77fe23cb1f5dbefe0b`. [PR262](https://github.com/joke0071/foliolab-open/pull/262) kontrolliert gemergt, erwarteter HEAD bestätigt, Main unmittelbar davor unverändert; nur historische Drafts157/161 daneben offen, Reviews/Inlinekommentare leer. Keine Integration des historischen Checkpoint-Branches.

**Volle finale PR-CI 41282037334 SUCCESS, Wallet41282037355 SUCCESS**: 1047/1047 Tests,0 Fehler/Skips,Syntax,Chromium/alle3Firefox-WebKit-Shards. Logs tatsächlich gelesen, neue gesamte Finanzkette **Chromium/Firefox/WebKit PASS**, sieben Breiten/Axe, reale IDB-CAS-/Quota-/Abort-/Zweittab-/Offline-/v2-UI-Restore-Kette. Keine fachliche oder technische Produkterweiterung: ausschließlich Test-/CI-/Scope-Dateien, Appassets/SW **v251 unverändert**.

**Main-/Produktionslauf 41282762467 gestartet. Noch KEIN neuer Main-Deploy-/LIVE_ACCEPTED-Beleg für diese Integration.** Letzte vollständige Produktionsbasis bleibt v251/Main7c720dd. Zusätzliche unabhängige neue Kette vor Merge tatsächlich auf unveränderter Produktion Chromium+Firefox PASS, sieben separat TLS-verifizierte Assets bytegleich; lokaler Browsertransport mit dokumentierter Proxy-Zertifikatsausnahme, kein eigener WebKit-/Hardware-/OAuth-Beleg. Dauerhaft `docs/release-evidence/fin-e2e01-pr262-candidate.json`.

Owner Work/root50f1560a1a9f, einziger aktiver Abschlussstrang. Nächster Schritt: Main-Gates,Deployment und tatsächliche neue Finanzkette/Kernassets in allen3Engines bis vollständigem Abschluss verfolgen; erst dann nächsten Kandidaten beginnen. **#255 insgesamt PARTIAL**, begrenzte Kette umgesetzt, weitereFX/Partialfills/Wallet/Staking/Renditeoracles offen. Danach #256 seriell. Andere ACTIVE-Masterpakete/Freigaben unverändert.

---

## #255 / PR262 – finaler Testkandidat IN_PROGRESS · 01.11.2026

**Aktueller PR-HEAD `70400c3ac42c2663757a2cf6c1b195c924a0729d`**, Tree `e2f6670913e353bfc7828822470c33b58aac8da0` = lokalem Index, Branch `test/fin-e2e01-cash-chain`. Owner Work /root 50f1560a1a9f. Vollständiger neuer PR-Lauf **41282037334**, Wallet **41282037355** gestartet. **Noch kein CI_ACCEPTED/MERGED/Produktionsketten-PASS**. Produktion bleibt v251 auf Main7c720dd; keine Appassets geändert.

Erster Lauf **41281116451 regulär beendet**: Chromiumvollsuite/1047Tests/Syntax, Cross1 und Cross3/FAST SUCCESS; ausschließlich Cross2 wegen neuem Firefox-Offline-Testtransport FAILED. Bestehende PWA-/Recoveryfälle davor Firefox+WebKit PASS. Kein CI-Cancel. Nach vollständigem Abschluss Testharnessfix per expected_sha auf denselben PR veröffentlicht. Lokale korrigierte ganze Kette Chromium+Firefox PASS; aktive SW/Controller explizit abwarten und Testnetzwerkumleitungen vor echtem Offline-Reload entfernen. Keine Produkt-/Sandbox-/Sicherheitsgateänderung.

Nächster Schritt: exakte finale Pflicht-CI bis zum Ergebnis, dann kontrollierter Merge und echte zusätzliche Produktionskette in Chromium/Firefox/WebKit. Vor Schreibschritten erneut Main/PR/Checkpoint abgleichen. #255 bleibt fachlich PARTIAL gemäß Scope-Dokument; danach #256 seriell. Alle historischen Gates/Hashes erhalten, keine zweite Implementation/keine Integration des historischen Checkpoint-Branches.

---

## #255 / PR262 – erster CI-Lauf, gezielter Testharnessfix · 01.11.2026

Weiterhin ein Strang / Owner Work /root 50f1560a1a9f. PR-HEAD `02bc4a174ece00f08df76bc1396dbda6afa026b5`; volle CI **41281116451** noch laufend, Wallet **41281116367 SUCCESS**. Cross2/Job **124773104890 FAILED**: neue Kette besteht bis Offlinephase; Firefox `page.reload: NS_ERROR_OFFLINE` bei noch aktiver Playwright-Netzwerkumleitung. Bestehende PWA-/Recovery-Suiten unmittelbar davor beide Engines PASS. Keine Produktregression behauptet.

Gezielter Fix im neuen Test: echte aktive SW-Registrierung/Controller abwarten und danach Fixture-Netzwerkumleitungen vor echtem Offline-Reload entfernen. **Korrigierte volle neue Kette lokal Chromium und Firefox PASS**, inklusive aller Finanz-/CAS-/Rollback-/UI-v2-Restore-Gates. Firefox1.56.1 lokal mit Laufzeitflag MOZ_DISABLE_CONTENT_SANDBOX=1; keine Produkt- oder CI-Sandboxänderung. Remote Gitobjekt **`70400c3ac42c2663757a2cf6c1b195c924a0729d`**, Tree **`e2f6670913e353bfc7828822470c33b58aac8da0`** = lokaler Index, noch NICHT als PR-HEAD veröffentlicht. Dies vermeidet automatisches Abbrechen noch laufender erster CI-Gruppen. Kein manuelles CI-Cancel. Nächster Schritt: ersten Lauf abschließen lassen, dann unverändertem PR-Ref den getesteten Nachfolgecommit per expected_sha vorziehen; volle finale Pflicht-CI und Produktionsabnahme bleiben erforderlich. Produktion unverändert v251 LIVE_ACCEPTED. Kein Merge/Deployment für PR262 bisher.

---

## #255 FIN-E2E01 – PR #262 / IN_PROGRESS · 01.11.2026

Owner Work /root, Sitzung 50f1560a1a9f; einziger Strang `test/fin-e2e01-cash-chain`. [PR #262](https://github.com/joke0071/foliolab-open/pull/262), HEAD `02bc4a174ece00f08df76bc1396dbda6afa026b5`, Tree `3826012e0e08a4cc6695346a597b387f7fc4db18` exakt gleich lokalem Index. Basis Main unverändert `7c720dddd5450fd4c2342deae9c7d91427ee01e7` / v251 LIVE_ACCEPTED. Keine ausgelieferten Appassets geändert; SW bleibt v251. Vollständige Pflicht-CI für PR gestartet, noch kein MERGED/Produktionsketten-PASS.

Lokal **1047/1047 Tests, 0 Fehler/Skips**, Syntax PASS; neue vollständige Chromium-Kette PASS: exakte 18-stellige Bestände, externe Flüsse, Kostenbasis101/realisiert15/Gebühren3/Steuer3, Importidentität, zulässige Korrektur, Transfer, belegte Löschung/Undo/Reimport, Archiv/Wiederherstellung, echte IDB-CAS-Revisionen, Abbruch/veraltete Vorschau/Quota/post-put Abort ohne Byte-/Revisionsänderung, echter zweiter Tab, Offline-Reload, sieben Breiten/Axe und tatsächlicher verschlüsselter v2-UI-Download mit frischem UI-Restore/Reload/gelöschter Identität. Browser-Finanzaktionen über existierende Produkt-APIs, nicht sämtliche Schritte per UI-Klick. Test-Dokument `docs/FIN_E2E01_CASH_CHAIN.md`. Keine Finanz-/Krypto-/Schema-/Löschrechte erweitert; nicht beweisbare Präzisionsrücknahmen/gekoppelte Trades/Transfers/Referenzen bleiben geschützt. Chromium1.56.1 lokal; volle Firefox/WebKit-CI Pflicht. Kein Hardware-/OAuth-Nachweis.

Nächster Schritt: exakten PR-HEAD bis vollständiger CI verfolgen, bei grünen Gates kontrollierte Integration; zusätzliche neue Kette tatsächlich gegen Produktion in allen3Engines abnehmen. #255 insgesamt bleibt PARTIAL (FX/Partialfills/Wallet/Staking/weitere Rendite-/Fehleroracles offen); danach #256 seriell. Historischen Checkpoint-Branch niemals vollständig nach Main mergen. Bisherige Freigaben/ACTIVE-Masterpakete unverändert.

---

## #255 FIN-E2E01 – Übernahme 01.11.2026 / IN_PROGRESS

Aktiver Owner: Work /root, Sitzung 50f1560a1a9f. Einziger Kandidat `test/fin-e2e01-cash-chain`, Basis Main `7c720dddd5450fd4c2342deae9c7d91427ee01e7` / v251. Frisch geprüft: nur historische Drafts #157/#161 offen, letzte Main-/PR-Läufe erfolgreich und beendet, keine neuere Implementierung im Checkpoint. GitHub-Aktivität allein beweist keine Chat-Inaktivität; vor weiteren Remote-Schreibschritten frischen Stand prüfen. Keine laufende CI abgebrochen.

Umfang: bestehende Engines als deterministische Kette orchestrieren; EUR-Import/erlaubte manuelle Korrektur/Transferzuordnung/belegbare Importlöschung/Undo/Reimport/Archiv/verschlüsseltes Restore, exakte Sollwerte und IDB-CAS-/Fehler-Nichtmutation. Ausschließlich synthetisch. Keine neue Finanzengine und keine Erweiterung wirtschaftlicher Löschrechte. #255 insgesamt bleibt PARTIAL bis seine übrige Fachmatrix tatsächlich abgenommen ist. Produktion unverändert v251 LIVE_ACCEPTED. Danach #256 seriell.

---

## STOP / Übergabe des abgebenden Chats abgeschlossen · 01.11.2026

**Ausschließlich der alte Work-Chat /root in Sitzung `97b37cee055e` ist gestoppt.** Die Entwicklungs-, Integrations-, QA- und Releaseverantwortung ist vollständig an den neuen Work-Chat übergeben. Dessen neuerer Übernahmeeintrag oben hat Vorrang und bleibt unverändert. **Dieser STOP blockiert nicht den neuen Chat.**

### Kollisionsschutz und bereits erfolgte Übernahme

Der erste reine Dokumentationsversuch des alten Chats wurde mit HTTP 409 wegen zwischenzeitlich geänderter Checkpoint-Blob-SHA abgewiesen. Es wurde nichts überschrieben. Danach frisch gelesen: **neuer aktiver Owner Sitzung `50f1560a1a9f`**, #255 FIN-E2E01 **IN_PROGRESS**, Kandidat `test/fin-e2e01-cash-chain`, Basis v251/Main `7c720dddd5450fd4c2342deae9c7d91427ee01e7`. Dieser neue Strang wird vom alten Chat weder übernommen noch doppelt implementiert. Der STOP-Vermerk wird nur unterhalb des erhaltenen neuen Übernahmeeintrags eingefügt und unter aktueller Datei-SHA gesichert.

### Frisch geprüfter Stand dieses Übergabeabschlusses

- Main unverändert **`7c720dddd5450fd4c2342deae9c7d91427ee01e7`**, Tree **`1e16eb23f2c80f83ccfa36c987e517985240ff55`**, SW **`foliolab-open-v251`**. Bestehender Status **v251 LIVE_ACCEPTED**, Main-/Produktionslauf **41251425999 completed / success**. Vorhandene 1044/1044 Tests, Chromium/Firefox/WebKit und tatsächliche Produktionsabnahme mit 123 URL-Byteprüfungen bleiben gültige Nachweise. Jetzt keine neuen Produkt-/Browser-/Lasttests gestartet.
- Actions-Statusfilter separat geprüft: **0 in_progress, 0 queued** zum Snapshot. Neuere vom neuen Chat ausgelöste Läufe haben Vorrang. Keine Actions abgebrochen, verändert oder erneut gestartet.
- Offene historische Drafts: **#157** `feature/flh03-d-native-guard`, HEAD `08714cc602110bae479083b3d38fa1adc9be280c`; **#161** `feature/flh04-sync-design`, HEAD `0d980c2f43f28fd06ef9a7403b2144b6099fbc74`. Bestehende Blocker/Abnahmegrenzen in ihren PR-Bodies beachten; keine Integration im Rahmen dieses STOPs.
- Abgeschlossene eigene Quellbranches noch vorhanden: **#260 MERGED** / `feature/recovery-backup-size-preflight`, HEAD `f630beee13c330511742fbcef01e9037a4554604`; **#261 MERGED** / `feature/recovery-envelope-utf8-size`, HEAD `c674165f378cc6a174ff4e22287584310d3dacb1`. Keine ungemergten eigenen Produktänderungen dort, keine Wiederholung von Merge/Deployment.
- Seit v251-Abschluss **keine Folgeimplementierung durch den alten Chat**, insbesondere kein eigener Beginn von #255. Der neue Chat hat #255 bereits selbst übernommen.

### Exakter lokaler Zustand des alten Chats

Checkout `/workspace/scratch/97b37cee055e/foliolab-open`, detached HEAD auf oben genanntem Main; getrackter Diff **leer**. Keine ungesicherten Produktänderungen oder eigenen laufenden Implementierungen.

Ungetrackt ausschließlich synthetische QA-Ausgaben in:
- `artifacts/gates/recovery-limits/`
- `artifacts/gates/recovery-limits-local-production/`
- `artifacts/gates/recovery-limits-v251-production/`

Jeder Ordner enthält `chromium-320.png`, `chromium-1440.png`, `firefox-320.png`, `firefox-1440.png`, `report-chromium-firefox.json` (insgesamt 12 PNG + 3 JSON). Lokale Zwischenartefakte, keine ausstehenden Produktänderungen; nicht versehentlich in Produkt-PRs aufnehmen. Relevante Reproskripte, Ergebnisse, kontrollierte Bildhashes und Abnahmegrenzen sind bereits remote unter `docs/release-evidence/v250-*` und `v251-*` gesichert; vollständige CI-/Live-Artefakte über dokumentierte Actions-IDs. Keine Behauptung, dass diese zusätzlichen lokalen PNG selbst im Repo gespeichert seien.

Außerdem ungetrackt: `node_modules` als lokaler Abhängigkeits-Symlink auf `/workspace/scratch/8511ad112518/foliolab-open/node_modules`. Nicht committen; bei fehlender Umgebung im neuen Chat die Workflow-fixierten Testabhängigkeiten neu einrichten. Temporäre produktive Probe-Skripte im Testordner wurden bereits vor diesem STOP entfernt; Repros/Ergebnisse remote gesichert.

### Offene Grenzen / Verantwortung ausschließlich im neuen Chat

#254 bleibt PARTIAL für weitere historische Format-/Reader-/Writer-/alte-Tab-/Versions-/Crash-/Quota-/Recoveryketten. Physisches Android, native Safari, echtes OAuth und TalkBack nicht abgenommen. Lokales WebKit scheiterte hier an fehlenden Hostbibliotheken/Container-UID-Grenzen; die erforderlichen WebKit-Gates in GitHub-CI und Produktion sind für v251 tatsächlich erfolgreich. Kein Hardwarebeleg daraus ableiten.

Der neue Owner führt den bereits übernommenen #255-Strang fort, danach #256 und weitere aktive Masterpakete. FLH05/#174 und FLH-PROJ01/#252 bleiben ACTIVE; alte Budget-/Wochenend-/PARKED-Sperren bleiben SUPERSEDED. Der historische Checkpoint-Branch darf weiterhin **niemals vollständig nach Main gemergt** werden.

**STOP endgültig für diesen alten Chat: nach Sicherung keine weiteren Entwicklungsschritte, Implementierungen, PRs, Merges, Deployments oder Folgepakete. Keine laufende fremde Arbeit anfassen.**

---

## v251 – LIVE_ACCEPTED · bestätigte aktuelle Produktion / 01.11.2026

**Dieser abgeschlossene Stand übersteuert alle älteren Pending-/MERGED-/DEPLOYED-Zeilen darunter.** Main **`7c720dddd5450fd4c2342deae9c7d91427ee01e7`**, Tree **`1e16eb23f2c80f83ccfa36c987e517985240ff55`**, SW **`foliolab-open-v251`**, [PR #261](https://github.com/joke0071/foliolab-open/pull/261). Main zum Abschluss per GitHub frisch bestätigt und unverändert. Kandidat `c674165f378cc6a174ff4e22287584310d3dacb1`/synthetischer Merge `6af05d66042ac63e9b4152a317ef1110ce82a3bd` besitzen exakt denselben geprüften Tree.

**Vollständiger Main-/Produktionslauf [41251425999](https://github.com/joke0071/foliolab-open/actions/runs/41251425999) completed / success.** 1044/1044 Tests, 0 Fehler/Skips, Syntax, Chromium und alle drei Firefox-/WebKit-Shards, Deployment und tatsächliche vollständige Live-Abnahme SUCCESS. Livejob **124688467110** bestätigt exakten RELEASE_SHA, **123 tatsächliche HTTPS-Assetmatches**, 6 Kernprüfgruppen/18 Core-Axe-Scans sowie erweiterte Recovery-/Klartext-/Hüllen-Unicode-/Größen-/Nichtmutationssuite auf Produktion in **Chromium, Firefox und WebKit PASS**, je 320/360/390/412/430/768/1440 px und sieben Axe-Scans. Weitere unveränderte produktive UI-/Transfer-/Offline-/IDB-/Backupabläufe PASS. Gesamte Abschlusslogs/Steps tatsächlich gelesen und Ergebnisse kontrolliert.

**Statisches Artefakt 13061174819**, SHA256 `856184f7250585c1ddc7edfd124a322017e29a28e0fd6593f9457cb51c13e45e`; **Live-Artefakt 13062002190**, SHA256 `4af09a1abac7a38bae560d8d37b101ebab89ebea3394478de01950ee7f051ac8`. Jeweils API-Digest exakt gleich Uploadlog. Zusätzlicher unabhängiger HTTPS-Abgleich von SW/Index/Guard/Vault bytegleich zu Main; eigener produktiver Chromium-/Firefox-Lauf mit neuem Hüllenfall/echtem verschlüsseltem Download/abgewiesener Restoredatei/unveränderten IDB-Bytes und Revision/Reload/14 Axe-Scans PASS. Produktionsbilder Chromium-320 und Firefox-1440 tatsächlich angesehen. Dauerhaft: `docs/release-evidence/v251-live-acceptance.json`, `v251-recovery-candidate.json`, `v251-local-production-recovery.*`, `v251-independent-production-assets.json` im Checkpoint-Branch. Zusatzbrowser nutzt dokumentierte Prüfnetz-Zertifikatsausnahme; direkte HTTPS-Prüfung/CI separat. Kein eigener ZIP-CRC-/Android-/nativeSafari-/OAuth-/TalkBack-Hardwarebeleg behauptet.

**Produktiv abgeschlossene begrenzte #254-Etappe (v250 + v251):** gemeinsame transparente Vorprüfung vor Verschlüsselung/Download/Drive-Upload. UTF-8-Klartext, GCM-Tag, Base64-Padding, tatsächliche JSON-Hülle sowohl in JS-Zeichen als auch UTF-8-Dateibytes geprüft. V1-Datenfeld 6.000.000 Base64-Zeichen; v2-Klartext 10.000.000 JS-Zeichen und Ciphertext 15.000.000 Bytes; Drive-Datei 15.000.000 Zeichen; lokale Datei 20.000.000 Bytes – **keine bestehende Readergrenze erhöht oder reduziert**. Keine Finanz-/Schema-/KDF-/AES-/AAD-/CAS-Änderung, keine Metadatenkürzung, kein unverschlüsselter Fallback. Alte lesbare Sicherungen behalten ihre bisherigen Readerpfade; abgelehnte neue Exporte verändern Quelle/Vault/Portfolio nicht und bestätigen keinen neuen Backup-Erfolg. Synthetischer gültiger alter Wrap mit unbekannten Unicode-Zusatzfeldern über echte Adoptionsfunktion im Mock-Vault reproduziert und gezielt geschützt; kein physischer Neugeräte-/Quota-Adoptionsbeleg. Normale Backup-Wraps unverändert.

**#254 insgesamt bleibt PARTIAL**, nicht durch diese Größenetappe geschlossen: restliche historische Reader-/Writer-/Formatkompatibilität, alte Tabs/Versions-Downgrade, unterbrochene Updates/Restores, erweiterte Quota-/Crash-/Recoveryketten und reale Android-/OS-/OAuth-/TalkBack-Fälle bleiben offen. Vorhandene bestätigte v247/v249/v250/v251-Nachweise wiederverwenden. Aktuelle kompatible Rückfallbasis **v251**, vorherige **v250** (`0b804f09ff83324898e9f86a021fe1831c71e1d2`).

**Kein weiterer aktiver Implementierungs-PR:** frischer GitHub-Abgleich nur historische Drafts #157/#161 offen; keine zweite neue Implementierung gestartet. Owner Work /root (97b37cee055e). Keine ungesicherten Produktänderungen; zusätzliche lokale QA-Skripte/Artefakte synthetisch, relevante Repros/Ergebnisse remote gesichert. Historischen Checkpoint-Branch weiterhin niemals vollständig nach Main mergen.

**Nächster ausführbarer Schritt #255 FIN-E2E01:** ein zusammenhängender, deterministischer Finanzkettenfall Import → erlaubte Korrektur → Transferzuordnung → sichere Löschung → Undo → Wiederimport → Archiv/Wiederherstellung → verschlüsseltes Backup/Restore. Bestehende Engines/Oracles und exakte Decimal-/Journal-/Identitätsverträge verwenden; nach jedem Schritt unabhängige Cash-/Bestands-/Fluss-/Quellidentitätsprüfung. Keine zweite Finanzengine, keine unbelegte Broker-/Wallet-Freigabe. Vor neuem Branch Main/PR/Actions/neuesten Checkpoint frisch prüfen, ein aktiver Strang. Danach #256 Androidmessung (EMULATED klar getrennt von EXTERNAL Hardware) und weitere aktive Masterpakete. FLH03 #148, FLH04 #160, FLH05 #174, FLH-PROJ01 #252, HIST-VIS01 und fachliche DELETE-MASTER28-Reste bleiben ACTIVE/PARTIAL gemäß Belegen; #257-UI seit v249 produktiv, komplexe wirtschaftliche Rücknahmen nicht pauschal freigeben. Alle alten PARKED-/0-€-/Wochenendsperren bleiben SUPERSEDED, keine neue Budgetgrenze.

---

## v251 – DEPLOYED / LIVE_ACCEPTANCE_PENDING

Main **`7c720dddd5450fd4c2342deae9c7d91427ee01e7`**, exakt geprüfter Tree `1e16eb23f2c80f83ccfa36c987e517985240ff55`, SW **`foliolab-open-v251`**. Mainlauf **[41251425999](https://github.com/joke0071/foliolab-open/actions/runs/41251425999)**: **1044/1044 Tests/0 Fehler/0 Skips**, Syntax, Chromium und alle drei Firefox-/WebKit-Shards SUCCESS. Deploymentjob **124688380780 SUCCESS**, veröffentlicht exakt denselben Main; nachgelagerter Homepage-/SW-Abgleich SUCCESS. Statisches Artefakt **13061174819**, SHA256 **`856184f7250585c1ddc7edfd124a322017e29a28e0fd6593f9457cb51c13e45e`** exakt gleich in Uploadlog und Artefakt-API.

**Livejob 124688467110 IN_PROGRESS** gegen `https://foliolab.unperfekt.at/`: 123 tatsächliche HTTPS-Assetmatches/Kernabläufe/IDB/Offline/Backup, erweiterte neue Klartext-/Hüllen-Unicode-/Größen-/Nichtmutationssuite und weitere bestehende produktive UI-/Transfer-Gates in Chromium/Firefox/WebKit. **Noch kein LIVE_ACCEPTED für v251.** Zusätzlich eigene gezielte produktive Chromium-/Firefox-Probe mit denselben Assertions gestartet; bekannte Prüfnetz-Zertifikatsausnahme nur im separaten lokalen Browsertransport, keine Produktänderung. Keine Hardware-/OAuth-/nativeSafari-/TalkBack-Abnahme behaupten. V250 bleibt letzte vollständig bestätigte Rückfallbasis.

#254 insgesamt weiterhin PARTIAL; nach tatsächlichem Live-Abschluss Belege/Produktionsstatus sichern und #255-Finanzketten sequenziell fortsetzen. Keine weitere Produktänderung während dieser Abnahme.

---

