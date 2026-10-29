# Konsolidierter Ergänzungsvertrag: Qualität, CI, Android, Drive und Datenintegrität

Verbindlicher Nutzerauftrag vom 29.10.2026. Ergänzt denselben FolioLab-Open-Master, UI-MASTER28, DELETE-MASTER28, FLH03, FLH04, FLH-PERF01, IndexedDB/Recovery sowie sämtliche Nachträge vom 25.–29.10.2026.

Repository: https://github.com/joke0071/foliolab-open  
Produktion: https://foliolab.unperfekt.at/  
Zentraler Checkpoint: docs/WORK_RESTPAKETE_CHECKPOINT.md auf feature/flh05-import-foundation.

## 1. Fortsetzung und Kollisionsschutz

Kein Neustart, keine neue Roadmap, parallele Implementierung, Doppelentwicklung oder Änderung der vereinbarten Prioritäten. ChatGPT Work bleibt allein für Implementierung, QA, Integration und Release verantwortlich. Vor Schreibaktionen den tatsächlichen GitHub-Stand prüfen.

PR201 regulär abschließen, bevor neue konfliktträchtige Änderungen beginnen. Vor Merge/Deployment ist eine gesonderte ausdrückliche Nutzerfreigabe erforderlich. Diesen Nachtrag zuerst sichern und anschließend in bestehende passende Pakete integrieren.

Neuerer gesicherter Stand bei Übernahme:

- PR200 DONE / LIVE_ACCEPTED: v213/SW213, main6ec0cf9c6e28edf1b19993357c3b839106b8aa80, Pipeline40916302834 SUCCESS. Großer synthetischer Produktionskaltstart3186,6→1611,3ms (-49,44%). Android-, gemischte Wallet- und Hardwaremessungen bleiben separat offen.
- PR201: feature/ui-selection-reasons-v214, HEAD78dc4ca4784694e543cc46a525ef629bf93f9333, Tree74aa1231c62364b094416aa7dbf822784d7be70a. TECHNICALLY_ACCEPTED / REVIEW_READY, Pflicht40923950987 und Wallet40923951032 SUCCESS,953Tests und drei Engines. Noch nicht freigegeben, gemergt oder deployed; SW214 unveröffentlicht.
- Sämtliche UI-, TradingView-/Kursoptionen- und Androidverträge dokumentiert. FLH05 und FLH-PROJ01 OPEN/PARKED.

## 2. GitHub Actions und Playwright optimieren – P2

Den Auftrag vom 26.10.2026 zur Beschleunigung der Entwicklungs- und Testläufe ausdrücklich erhalten.

Repräsentative erfolgreiche und fehlgeschlagene Läufe auswerten. Getrennte Laufzeiten für npm/Dependencies, Playwright-Browserinstallation, Chromium, Firefox, WebKit, Unit/Syntax, Wallet-/Blockchain-Tests, Artefakte, Testmerge-/Releasegates, Deployment und Liveabnahme erfassen.

Prüfen:

- npm- und Browsercaching; Wiederverwendung installierter Abhängigkeiten.
- Sinnvolle Parallelisierung und Sharding.
- Doppelte Browserinstallationen und unnötig wiederholte Vorbereitung vermeiden.
- Zuverlässige Fixtures und Service-Worker-Vorbedingungen.
- Langsame und instabile Tests nachweisen.

Vorhandenes Sharding und bereits abgenommene CI-Verbesserungen nicht erneut entwickeln. Vorher-/Nachher-Laufzeiten dokumentieren; nur nachweislich sinnvolle Optimierungen übernehmen.

Frühere WebKit-, Browser-Back-, Controller- und Offlineprobleme anhand aktueller Tests prüfen. Flakiness gezielt an der nachgewiesenen Ursache beheben. Keine pauschalen Änderungen an beforeunload, History oder Sicherheitsabläufen. Keine Tests abschwächen/auslassen und keine Releasegates reduzieren.

Status: PARTIAL. Zwei Shards bestehen bereits; weitere Laufzeitoptimierung folgt am geeigneten Workflowcheckpoint. Die konkrete Controller-Vorbedingung in PR201 ersetzt nicht den gesamten CI-Auftrag.

## 3. Android- und PWA-Abnahme

Der vollständige Androidvertrag bleibt gültig. Zusätzlich ausdrücklich prüfen:

- Android Chrome und installierte PWA.
- Offline-Kaltstart, Warmstart und Rückkehr aus dem Hintergrund.
- App-Update mit vorhandenen lokalen Daten und Service-Worker-Wechsel.
- Große IndexedDB, vergrößerte Systemschrift, Bildschirmtastatur und kleine Höhen.
- Android-Zurücknavigation, TalkBack und Tastaturzugänglichkeit, soweit verfügbar.

Ohne echtes Gerät ausschließlich Emulationsergebnisse dokumentieren. Hardware niemals als DONE markieren, wenn nicht geprüft. Ein extern nicht zugängliches Nutzergerät darf unabhängige sichere Releases nicht pauschal blockieren.

PWA-Updates prüfen: alter/neuer Worker, Cacheaktualisierung nach Deployment, tatsächlich geladene CSS-/JS-Assets, keine inkompatiblen Versionsmischungen, unnötigen Datenbankinitialisierungen, veralteten Finanzwerte, Datenverluste bei Update/Wiederaufnahme oder festhängenden Ladeanzeigen. Die tatsächlich aktive PWA-Version muss bei Fehleranalysen nachvollziehbar sein. Offline-, CAS- und Recoveryverträge erhalten.

Status: Androidbaseline OPEN; Hardware EXTERNAL. Bestehende PWA-Regressionen in CI erneut bestanden, keine pauschale Android-Komplettabnahme.

## 4. Mehrtabbetrieb, Speicherfehler und Recovery

IndexedDB-only ohne Legacy-Speicherumschaltung. Uneingeschränkt bewahren:

- Atomare Schreibvorgänge und CAS-/Revisionsprüfung.
- Konflikte zwischen Tabs.
- Quota-Fehler, Transaktionsabbrüche und unterbrochene Speicherung.
- Backup/Restore und Offline-Wiederaufnahme.
- Sichere Datenübernahme bei Versionswechseln.
- Nachvollziehbare Handlungsoptionen bei Fehlern.

Keine Erfolgsmeldung nach fehlgeschlagenem Save. Performancecaches dürfen wirtschaftliche Ergebnisse nicht unkontrolliert wiederverwenden. Nach Änderungen keine veralteten Kurs-, Buchungs-, Konto- oder Historienzustände anzeigen. Originaldatenbewahrung und sichere Recovery erhalten.

Bestehende Implementierung und laufende Regressionspflicht unterscheiden; ein UI-Release schließt nicht sämtliche Recovery-Themen.

## 5. FLH04 – unmittelbarer sicherer Ablauf nach Drive-Verbindung

Früheren Nutzerwunsch erhalten: Nach erfolgreichem OAuth soll der bestehende Backup-/Sync-Ablauf möglichst unmittelbar starten oder direkt angeboten werden, ohne unnötige weitere Navigation.

Der Fachvertrag prüft:

- Tatsächlichen OAuth-Erfolg und erteilte Berechtigungen.
- Vorhandenes Backup-Passwort und erforderliche Verschlüsselung.
- Letzten lokalen und entfernten Datenstand.
- Mehrtab- und Konfliktzustände.
- Offline-/Online-Übergänge.
- Wiederaufnahme nach unterbrochener Verbindung.

Sind alle Voraussetzungen und Einwilligungen erfüllt, den bereits autorisierten Ablauf direkt auslösen. Fehlt eine sicherheitsrelevante Entscheidung, sie unmittelbar verständlich anbieten.

Keine unbemerkte Cloudüberschreibung, stille unberechtigte Synchronisation, zweite Sync-Engine oder zentralen Geheimnisse. Bestehender FLH04-Vertrag, Revisionen, Recovery, Verschlüsselung sowie externe OAuth-/Transport-/Operatorgrenzen bleiben maßgeblich.

Status: PARTIAL/EXTERNAL nach bestehendem Nachweis; keine Implementierung allein durch diesen Dokumentationsschritt.

## 6. Historische Datenqualität und Rekonstruktion

Historische Wertpapier-/Kryptokurse, EUR-Wechselkurse, damalige Positionsmengen, CSV-Kursverläufe, Eröffnungen, Referenzen, unvollständige Bestandsbelege, fehlende Handelstage, unbekannte Einstandswerte, Kapitalflüsse und Gebühren fachlich erhalten.

Verbindliche Regeln:

- Heutige Kurse niemals still für historische Bewertungen verwenden.
- Fehlende EUR-Wechselkurse nicht erfinden.
- Fehlende Daten nicht als Null interpretieren.
- Keine unbelegte Interpolation.
- Kursbeobachtung, Positionswert und Portfoliorendite trennen.
- Tatsächliche Abdeckung, Quellenherkunft und Qualität nachvollziehbar erhalten.

Automatisch/Linie/Punkte ändert ausschließlich die Visualisierung, keine finanzielle Aussage. Lange Kryptoperioden nur bei tatsächlich verfügbaren historischen Daten. Bestehende Finanzregressionen erhalten.

## 7. FLH03 – native Importe und Originalbelege

Das Parken von FLH05 darf aktive native Arbeiten nicht verlieren: flatex AT, Bittr, Kraken, Bitpanda, Ledger Live und Trade Republic, soweit bereits im aktiven FLH03-Vertrag.

Besondere Fälle:

- Unvollständige flatex-Exporte sowie Depot- und Kontoumsätze.
- Wiederholungsimporte und Dubletten.
- Partielle Ausführungen, getrennte Gebühren und Steuerzeilen.
- Kryptotausch, Fiat-Währungsumrechnung und interne Transfers.
- Kraken-Ledger-/Ledger-Wallet-Doppelzählung.
- Historische Zuordnung von Beständen.
- Unbekannte oder fehlende Originalangaben.
- Sichere Korrektur und Rücknahme.

Original-CSVs ausschließlich zur vorgesehenen Validierung nutzen. Keine echten personenbezogenen Daten, Kontonummern, Beträge, Transaktionen, Wallet-Adressen oder Zugriffsdaten in öffentliche Repositories oder CI-Artefakte übernehmen. Öffentliche Tests mit synthetischen, strukturell passenden Fixtures. Benutzerdateien nicht als festes Beispielportfolio in die Anwendung integrieren.

Die universelle FLH05-CSV-Engine bleibt OPEN/PARKED. Notwendige Kompatibilität nur bei ohnehin laufender FLH03-Arbeit berücksichtigen. Keine heimliche Vorziehung oder neue universelle Importarchitektur ohne eigene Freigabe. Anbieterbezogene Fach- und Originalbeleggates erhalten.

## 8. UI- und DELETE-Verträge

Vollständig erhalten: Verwalten/Fertig, Bearbeiten-Text im Normalmodus, Gmail-Dreistufenauswahl, kompakte Sperrgründe, kleine Archiv-Dropdowns, sichere Folgenvorschau, historische Referenzverwaltung, Liquidität auf Desktop/Mobile, kompakte Gebuchte Vorgänge, entfernte redundante Stichtagstexte, Diagrammmodi, mobile Tooltips/Zeiträume, schlanker Header und konsistente technische Einstellungen.

TradingView-Responsive-Optimierung SUPERSEDED; vollständige Entfernung OPEN/P2. Native Kurse und CSV-Optionen bewahren.

DELETE-MASTER28 ausdrücklich OPEN für migrierte Referenzen und komplexe importierte Buchungen: sichere quellbezogene Korrektur/inverse Rücknahme mit Abhängigkeitsbeweis weiter prüfen. Keine pauschale Löschfreigabe, unsichtbaren Teillöschungen oder zweite Fachlogik. PR201 ist ausschließlich kompaktere Darstellung und kein Nachweis erweiterter Löschmöglichkeiten.

## 9. Weitere Restverträge

FLH04: verschlüsselte Sync, OAuth, Konflikte, Wiederherstellung und direkt autorisierter Ablauf nach Verbindung.

Wallets/Staking: korrekte Bestandsrekonstruktion, keine Doppelzählung, unterstützte Blockchain-/Stakingpfade erhalten, Quellen- und Walletausfälle korrekt behandeln.

Konten/Vermögen: nachvollziehbare Vollständigkeit, sichere Zuordnung, historische Eröffnungen, ungeklärte Geldflüsse; keine falschen Rendite- oder Steuerbehauptungen.

FLH-PROJ01 ausschließlich dokumentiert/PARKED: Sparrate, Horizont, Szenarien, Renditeannahmen und Inflation. Keine Implementierung ohne eigene Nutzerentscheidung. Vorhandene Festgeld-Zinsprognosen nicht damit verwechseln.

## 10. Veröffentlichung und tatsächliche Abnahme

Je Release prüfen: exakt freigegebener PR-HEAD, getesteter Commit, Merge-/Testmergebaum, alle Pflichtjobs, Chromium/Firefox/WebKit, Main-/Pages-Deployment, Service-Worker-Version, tatsächlich veröffentlichte Assets, Produktionsfunktionen und Offline-/Recoveryregressionen.

CI-Erfolg ist keine Liveabnahme. Freigaben gelten PR-spezifisch und werden nicht übertragen. UI-Korrekturen erst nach tatsächlichem Deployment und geprüften geladenen Assets als produktiv sichtbar behaupten.

Bereits erledigte Präsentations-/Websiteänderungen nicht neu aufrollen. Nur neue tatsächlich belegte Fehler aufnehmen.

## 11. Status und bestehende Reihenfolge

Statusvokabular: DONE/LIVE_ACCEPTED, PARTIAL, OPEN, BLOCKED, EXTERNAL, PARKED, SUPERSEDED. Lokal getestet, CI-geprüft, reviewbereit, freigegeben, gemergt und live getrennt führen. Keine pauschale Erledigung durch einen einzelnen Release.

Verbindliche Reihenfolge:

1. PR201 sicher abschließen, einschließlich eigener Releasefreigabe.
2. Offene UI-P1 nach bestehendem Plan.
3. Androidperformance messen und belegte Probleme korrigieren.
4. UI-P2 und geplante Fach-/Sicherheitsarbeiten konfliktfrei.
5. CI-Optimierung am geeigneten Workflowcheckpoint.
6. FLH04/FLH03 nach bisheriger Priorität und Freigabegrenzen.
7. Geparktes ausdrücklich geparkt lassen.

Keinen neuen Gesamtplan beginnen.

## 12. Dauerhafte Sicherung

Nach jeder sicheren Etappe und vor Limits, Unterbrechungen oder Kontextwechseln: main/Branches/PRs/CI/Working Tree prüfen; sicher committen/pushen; Remote-SHA verifizieren; Checkpoint separat committen/pushen; tatsächliche Test-/Releasebelege, Status, Blocker und exakte Fortsetzungsstelle sichern; Master regulär fortsetzen.

Historischen Dokumentationsbranch niemals als alten Anwendungscode nach main mergen. Alle Qualitäts-, Performance-, Sicherheits-, Import-, Drive- und UI-Anforderungen im selben Master erhalten.

Dieser Sollvertrag dokumentiert den vollständigen zusätzlichen Umfang und keine pauschale Erledigung. Neuere tatsächlich verifizierte Zustände haben Vorrang vor historischen Ausgangsdaten.
