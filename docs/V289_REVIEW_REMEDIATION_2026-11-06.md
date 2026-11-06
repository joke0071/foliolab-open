# v289 – verifizierte Reviewkorrekturen

Alleiniger Owner bleibt `414503ed33c6`. Der unabhängige ausschließlich lesende Review ist abgeschlossen; sein [vollständiger Originalbericht](reviews/V289_INDEPENDENT_REVIEW_2026-11-06.md) wurde unverändert übernommen (SHA256 `57afe93cbf78c78156aab31eb6e4fa03e8dbe4c1531b527f7554ad9513fd88fa`). Der Reviewer führte keine Repros aus. Die folgenden Reproduktionen und Korrekturen stammen vom bestehenden Owner.

Basis ist der unveränderte v289-Main `652e80bcb31aec13c85a0457332bdf53cf98a521`, Tree `ee506c874fa9578f1daf3387da24b299bba5103e`. **v289 bleibt LIVE_ACCEPTED; keine erneute Releaseabnahme.** Die Korrekturen sind ein neuer Kandidat, nicht nachträglich in v289 enthalten.

## Separat reproduziert und minimal behoben

| Befund | Synthetischer Ist-Nachweis auf v289 | Begrenzte Korrektur |
| --- | --- | --- |
| H1 | Dieselbe native Bankquelle wurde unter einem zweiten lokalen Depot erneut für zwei wirtschaftliche Buchungen angeboten | Eigener nativer Bankschlüssel `sourceId + externalId`, zusätzlich zum unveränderten allgemeinen CSV-Schlüssel; Kontowechselkonflikt in Staging und CSV-Kern, kein Direktaufruf-Bypass |
| H2 | Walletbeobachtung 1→2 nach fremder Cashbuchung blieb bei Eröffnung 1; `safeImport` lehnte den widersprüchlichen Stand ab | Globaler Refresh nutzt denselben geschützten Rescan-Helfer. Nur undatierte beobachtete Eröffnung ohne Wallet-Mengenjournal nachführen; datierte Eröffnungen und Mengenjournale vor jeder Mutation schützen |
| H3 | Dieselbe EVM-Wallet unter zwei lokalen Konten erhöhte den synthetischen Gesamtwert von 200 auf 300 EUR | Konkrete Walletidentität kontenübergreifend prüfen, vor neuen Konten/Anbietern und auf dem zentralen Erfassungspfad. Mehrere Scanänderungen auf einem isolierten Entwurf und einmaliger bestehender CAS. Keine automatische Zusammenführung vorhandener Historien |
| M1 | Unterschiedliche case-sensitive SPL-Mints erhielten denselben Assetkey | Kleine gemeinsame netzwerkspezifische Identitätsfunktion: EVM normalisieren, Base58/Solana exakt erhalten; Chain, Asset-/Stakeart und konkrete Kennung nicht durch Ticker ersetzen |
| M2 | Automatischer undatierter Kurs erzeugte `observed` und eine scheinbar berechenbare Rendite | Automatische Stichtage verwenden die vorhandene Kursqualitätsprüfung plus notwendige datierte FX-Evidenz. Ungeklärtes bleibt `partial`; explizite manuelle Gesamtbewertung bleibt möglich. Frische undatierte Scanpreise erben keine alte Kursprovenienz |
| M3 | Restore akzeptierte abweichendes Datum einer modern journalverknüpften Buchung und doppelte Journalsequenz | Modern verknüpfte Buchung verlangt passendes Journaldatum; vorhandene Sequenzen müssen gültig und eindeutig sein. Ältere Buchungen ohne Journalverknüpfung und unsequenzierte unverbundene Legacyjournale behalten ihre Leserpfade; keine rückwirkende Journalerzeugung |

Vorhandene doppelte Walletdarstellungen werden beim Restore **nicht** automatisch zusammengeführt oder gelöscht. Ein rein lesender Hinweis im bestehenden Prüfbereich und ein unvollständiger automatischer Bewertungsstatus machen den Konflikt sichtbar. Eine ausdrücklich ausgeschlossene, auf die angerechnete Position verweisende Darstellung bleibt möglich. Bestehende Journale, IDs und Eröffnungen werden nicht umgeschrieben.

## Reproduktion und Nachweise

`docs/repros/V289_REVIEW_BASELINE_2026-11-06.mjs` ist ausdrücklich eine Diagnose des **alten festen v289-Quellstands**. Auf eine unveränderte, über das GitHub-Plugin bezogene v289-Quellkopie zeigen:

```sh
node docs/repros/V289_REVIEW_BASELINE_2026-11-06.mjs /absolute/path/to/v289 /absolute/path/to/report.json
```

Erwartet werden die alten Fehler, keine erfolgreiche heutige Importfähigkeit. [Redigierte tatsächliche Diagnose](release-evidence/review-v289-baseline-facts.json). Die neuen `review-v289-high.test.mjs` und `review-v289-medium.test.mjs` verlangen dagegen das sichere Verhalten des Korrekturkandidaten. Keine privaten Originalbeträge oder Walletdaten in öffentlichen Tests.

Initialer lokaler Stand: vollständige Unit-Suite mit begrenzter Parallelität **1.241/1.241 PASS**, zusätzlich verbindlicher Orchestrierungstest PASS, Syntax PASS. Chromium141/Firefox157/WebKit27.2 bestehen die neue tatsächliche UI-/IDB-Kette: geänderte Flatex-Zuordnung, globaler Walletrefresh, genau ein CAS, Quota und post-put-Abbruch ohne Byte-/Revisionsänderung, datierter Anfang, echter Zweittab-Konflikt, Walletdubletten-Sperre, fünf Mobilbreiten/Axe, manipulierter Klartextrestore ohne Mutation, verschlüsselter Fresh-Restore und echter Offline-Reload. Drei tatsächliche synthetische Bilder gesichtet. Reguläre Integrations-CI und tatsächliche Produktion des neuen Releases bleiben erforderlich.

Die 81 bestehenden privaten Originalgruppen wurden mit dem unveränderten unabhängigen Original-Decimaloracle gegen den Korrekturkandidaten regressionsgeprüft: 69 Käufe, 12 Verkäufe, unveränderte Assetpostings/alte Audits, exakter Nettocash, unbekannte Kosten, kein erfundener externer Fluss, Replay und v5-Restore PASS. Das ist kein Vollständigkeits-, Eigentums- oder neuer privater 2:1-Originalnachweis.

Vorhandene synthetische Testaufbauten mussten gültige Journalsequenzen verwenden: unabhängige Modelle werden vor Erzeugung geschützter Originalbuchungen komponiert; eine doppelte Auditsequenz wird nun bereits vom strengeren Leser abgewiesen. Keine Sicherheitserwartung wurde gelockert. Ein neu sichtbarer Axe-Kontrastfehler in drei Textfarben der Wallet-Ergebnisliste wurde eng begrenzt korrigiert.

Der vorhandene Binding-Browsertest enthielt außerdem genau die alte H1-Erwartung: Nach Wechsel des lokalen Depots sollten fünf bereits verwendete Bankquellen erneut als Betragsangebote erscheinen. Er verlangt jetzt stattdessen null Angebote, fünf ausdrückliche Quellenkonflikte und unveränderte gespeicherte Bytes. Die übrigen damaligen Prüfungen bleiben erhalten. Der vollständige bestehende Binding-/Betragsprüfpfad einschließlich der neuen Integritätskette besteht in Chromium, Firefox und WebKit. Auch die bestehende FIN-E2E-Kette besteht in allen drei Engines.

Lokale Erstfehler bleiben dokumentiert: kurzzeitiger Ausführungs-Verbindungsfehler, zu hohe Unit-Prozessparallelität, getrennt gestarteter lokaler HTTP-Server, ein nicht zurückgesetzter CAS-Testmock und WebKit-Netzwerk-Mocking über einen echten Service Worker. Der finale Providerfixture sitzt deshalb am Fetch-Rand; echte Providerabrufe sind verboten und werden als Fehler erfasst. Der reale App-Service-Worker und alle Assertions/Fristen bleiben unverändert aktiv. Keine zusätzliche CI oder blinden Workflow-Retries.

Die neue Browserkette hängt einmal am vorhandenen nativen Binding-Prüfpfad und läuft dadurch in den bestehenden vier Integrations-/Produktionspfaden. Alle bisherigen Workflowbodies und Schutzgates bleiben unverändert. Browserfixture-Anpassungen erzeugen valide synthetische globale Sequenzen und ersetzen keine fachlichen Assertions.

## Verbindliche Reihenfolge

1. Diese grundlegenden Korrekturen zusammenhängend integrativ und produktiv qualifizieren, Befunde einzeln nachvollziehbar halten.
2. Danach ein begrenztes UI-REFRESH01-Paket #300: Dashboard, Navigation, kompakte vorhandene Kennzahlen und Zugang zum bestehenden Prüfbereich. Gewinn nur bei belegbarer Berechnung; sonst passend bezeichnete Veränderung oder Nichtverfügbarkeit. Keine neue Finanz-/Prüfengine.
3. 3:1 EUR vorläufig nachrangig. Weitere N:M-, FX-, Referenz-, Wallet- und Stakingfälle bleiben nach ihren jeweiligen Fachverträgen offen. L1 ist kein Auftrag für eine pauschale Neuarchitektur.

Alle Originale und EFF01/HND01-, Journal-, Identitäts-, Finanz-, v5-, IDB-/CAS-, Backup-/Restore-, Offline-, Datenschutz- und Folgeaufträge bleiben erhalten. GitHub ausschließlich Plugin; Checkpointbranch niemals vollständig nach Main mergen.

Der erste reguläre Integrationslauf `42210661072`, Versuch 1, reproduzierte im Firefox-UI07-Setup eine weitere Zusammenstellung unabhängiger synthetischer manueller Modelle mit doppelter Sequenz 1. Die Produktprüfung wies dies wie vorgesehen ab. Nur die ungeschützten manuellen Fixturejournale erhalten vor der Zusammenstellung eine eindeutige globale Reihenfolge. Der vollständige UI07-Pfad besteht lokal anschließend in Chromium/Firefox/WebKit mit jeweils 66 tatsächlichen Scans, sechs Breiten, 200%-Zoom, Tastatur/Fokus und exakter Datennichtmutation. Zwei vorhandene Benchmark-Fixtures verwenden nun unterschiedliche synthetische EVM-Adressen für ihre unterschiedlichen Positionen; ihre vollständigen tatsächlichen Modellbauer und `safeImport` bestehen mit 3.000 Buchungen sowie dem vorgesehenen leeren Kontrollfall. Mengen, Wertstruktur, Positionsanzahl und Sicherheitsgates bleiben gleich. Diese erste Fixturekorrektur änderte keine fachlichen Produktbytes oder Workflowbodies; kein CI-Abbruch oder blinder Retry.

## Zusätzliche H3-Grenze vor Integration

Nach der ersten Korrektur wurde auf den festen Produktbytes des Kandidaten `f761a8ccaf4fde0d5cc63e211fde2a76bc51c212` ein weiterer H3-Negativfall tatsächlich reproduziert: Ein wirkungsloses `contract`-Metadatum an derselben nativen EVM-Wallet änderte den Holdingkey. Zwei lokale Konten konnten dadurch denselben beobachteten nativen Bestand anrechnen (ausschließlich synthetisch 100→200 EUR). [Tatsächlicher Negativbeleg](release-evidence/v290-native-identity-boundary.json); [ausführbare Diagnose mit festen Gitblob-Prüfungen](repros/V290_NATIVE_IDENTITY_BOUNDARY_2026-11-06.mjs).

Der kleine Identitätshelfer richtet die Contract-Komponente jetzt exakt nach den vorhandenen Saldenlesern aus: ERC20, SPL, Solana-Stake, Sonic-Stake, Cosmos-Stake/Unbonding und XRP-Token verwenden die konkrete Kennung; die nativen Leser ignorieren dieses ungenutzte Feld auch im Holdingkey. Keine gespeicherten Felder, IDs, Historien oder Journale werden normalisiert oder zusammengeführt. Der Neuzugang wird gesperrt; alte doppelte Darstellungen bleiben erhalten und werden im vorhandenen Prüfbereich sichtbar. EVM-/Base58-Casevertrag und die Trennung der Netzwerke bleiben unverändert.

Gewünschter Sicherheitstest vorher FAIL, nachher alle 16 gezielten Reviewtests PASS. Vollständige aktuelle Suite **1.243/1.243 PASS**, 0 Fehler/Skips, Syntax PASS. Die tatsächliche UI-/IDB-Kette mit zusätzlichem direkten Kern-/Commit-Bypassversuch besteht lokal in Chromium und Firefox; gespeicherte Bytes bleiben exakt gleich. WebKit kann in diesem separaten Ausführungshost wegen fehlender `libgstreamer-1.0.so.0` nicht starten und wird ausdrücklich nicht als lokal bestanden ausgegeben. Reguläre verpflichtende WebKit-CI am endgültigen Head bleibt vor dem Merge erforderlich. Alle 81 Originalgruppen wurden auch nach dieser Produktänderung mit demselben unveränderten unabhängigen Decimaloracle erfolgreich geprüft.

Der vorherige Head bleibt trotz seiner laufenden regulären CI gegen Merge vorgemerkt, bis dieser Nachtrag gesichert und vollständig am neuen Head qualifiziert ist. Kein Abbruch, blinder Retry oder zusätzlicher manueller CI-Dispatch. Der Befund ist eine eng begrenzte Erweiterung von H3; HD-Alias-/Staking-/Eigentums- und übrige UH05-Sonderfälle werden dadurch nicht pauschal als gelöst behauptet. v289 bleibt LIVE_ACCEPTED.
