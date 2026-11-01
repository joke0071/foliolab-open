# FolioLab Open – verbindlicher Ergänzungsplan: CSV und Blockchain gemeinsam importieren

Nutzerauftrag vom 01.11.2026. Status: PLAN AKTUALISIERT, Umsetzung und Abnahme offen. Gemeinsamer Fachumfang von #174 (FLH05), #148 (FLH03), #119 (Wallet-Historie), #159 (Ledger Live), #165 (Buchungsverwaltung) und #255 (Finanz-E2E). Keine zweite Finanz-/Journal-/Importengine, kein paralleler Implementierungsstrang.

## 1. Ziel und Priorität

Original-CSVs von **Flatex AT, Bitpanda, Bittr, Ledger Live und Kraken** sowie **Blockchain-Historien** sollen über denselben verständlichen Prüf- und Übernahmeablauf nutzbar werden. Für bereits eindeutig zugeordnete Konten soll im Normalfall gelten: Dateien auswählen oder Wallet-Historie aktualisieren → automatische Analyse und Quellenabgleich → kompakte Übersicht → einmal bestätigen.

Ein wirtschaftlicher Vorgang beziehungsweise seine einzelnen Kontenbewegungen werden genau einmal berücksichtigt, auch wenn mehrere CSVs, ein Wallet-Scan und mehrere Explorer dieselben Vorgänge belegen. Die Belege bleiben erhalten und werden verknüpft. Nicht einfach doppelte Zeilen löschen; Kauf, Transfer, Gebühren und reine zusätzliche Belege unterscheiden.

Der laufende Release wird nicht unterbrochen. Die bereits verbindliche #266-Etappe (reale Kursversorgung, Marketstack, API-/Backup-Bereinigung) bleibt erhalten. Danach diesen gemeinsamen Import-/Historienumfang als zusammenhängendes **P1-Kernpaket vor neuen rein kosmetischen Erweiterungen** bearbeiten. #257 und alle übrigen ACTIVE-Pakete bleiben im Master; keine konkurrierende Umsetzung. Ältere Pläne, die CSV und Blockchain dauerhaft als voneinander unabhängige Vorschauen behandeln, werden insoweit durch diesen Nachtrag ersetzt. Sicherheitsgrenzen werden nicht aufgehoben.

## 2. Geprüfte Grundlage und Originaldateien wiederverwenden

Gezielte Codeprüfung auf Main `ca99237f8cbe40490d360dd0bd57f9df76dcf584`:
- `src/wallet-history-core.js`: kanonische Blockchain-Ereignisidentität, exakte Rohmengen, Dubletten-/Konfliktprüfung, Bestandsrekonstruktion und Coverage existieren bereits.
- `src/wallet-history-state.js`: übernommene Historien, Wiederanlaufmetadaten, atomare Entwürfe und Backupprojektion existieren; keine automatische Journalisierung jedes Chain-Events.
- `src/purchase-evidence.js`: Bittr-CSV-Leser und exakte BTC-Kaufbelegverknüpfung einschließlich Mehrfachausgängen existieren bereits; diese Funktion ist dokumentarisch, kein allgemeiner Kaufimport.
- `src/ledger-live.js`: Ledger-Beobachtungen und Verweise auf Wallet-/Bittr-Belege existieren; `writeEnabled:false` und `ready:false`, kein vollständiger wirtschaftlicher Ledger-Import.
- `src/import-identity.js`: Quellidentität, Herkunft, manuelle Änderungen und begrenzte Lösch-/Wiederimportbelege existieren. Das ist noch kein vollständiger quellenübergreifender Abgleich für alle Anbieter.

Die Nutzerdateien für alle fünf Anbieter wurden bereits früher bereitgestellt und nach Nutzerangabe analysiert. Zuerst zugängliche private Originale, vorhandene Analyseartefakte, Formatkatalog, Checkpoints und frühere Sollwertprüfungen wiederfinden. Nicht pauschal erneut Dateien verlangen oder dieselbe Recherche neu beginnen. Nur konkret fehlende, nach Suche nicht zugängliche Belege privat anfordern. Unveränderte Anbieteroriginale von formatgetreuen Rekonstruktionen/Konsolidierungen unterscheiden; Analyse eines Formats nicht als vollständige finanzielle Importabnahme ausgeben.

Vor Produktänderungen frischen Main-/PR-/Owner-/Checkpoint-Abgleich durchführen. Versionsangaben dieser Grundlage sind kein Ersatz dafür. Historischen Checkpointbranch niemals vollständig nach Main mergen.

## 3. Einheitlicher Nutzerablauf

**CSV:** Ein Einstieg für eine oder mehrere Dateien. Anbieter, Dialekt, Datenbereiche und bereits bekannte Konten/Wallets automatisch erkennen. Eindeutige Zuordnungen vorbelegen; mehrere plausible Konten niemals durch Auswahl des ersten Kontos auflösen. Neue Konten/Positionen nur im sichtbaren Übernahmeplan anlegen.

**Blockchain:** Vorhandene öffentliche Walletkonfiguration verwenden; bei neuer Wallet Netzwerk und öffentliche Adresse oder unterstützten öffentlichen HD-Schlüssel einmal festlegen. Historie abrufen/aktualisieren, Coverage und aktuelle Bestände prüfen und unmittelbar mit sämtlichen vorhandenen CSV-/Journal-/Wallet-Belegen abgleichen. Keine erneute Walletanlage nur für Historie, keine privaten Schlüssel, Seed-Phrasen oder Signaturen. Explorer-/RPC-Abfragen und deren Datenschutzwirkung sichtbar halten.

**Gemeinsame Übersicht:** getrennte Anzahlen für Quellbeobachtungen und wirtschaftliche Vorgänge; neu importierbar, bereits vorhanden, zusätzliche Belege, zugeordnete interne Transfers und ungeklärte Fälle. Zeitraum, Abdeckung, Bestands-/Cash-/Gebühren-/Ertragswirkung und verbleibende Lücken zeigen. Ein Button „Geprüfte Änderungen übernehmen“ bestätigt den aktuellen Gesamtplan, nicht Hunderte Einzelzeilen. Details nur bei Bedarf öffnen.

Gespeicherte, bestätigte Zuordnungen wiederverwenden, bei widersprüchlicher Identität erneut prüfen. Unklare Fälle gezielt und mit konkretem Lösungsschritt anzeigen. Keine stillschweigende Übernahme allein durch Dateiauswahl, Scan, Vorschau oder Hintergrundaktualisierung. Bei bereits vorhandenen Vorgängen bedeutet ein weiterer Beleg keine neue Bestandsbuchung.

## 4. Quellenbeobachtung, Ereignis und wirtschaftliche Wirkung trennen

Die bestehenden Bausteine um einen gemeinsamen Abgleich erweitern, keine konkurrierende Finanzengine bauen. Mindestens logisch unterscheiden:

1. Originale Quellbeobachtung mit Anbieter-/Kontokontext, stabiler Quellkennung, Dialektversion und Herkunft.
2. Normalisiertes Ereignis beziehungsweise einzelne Kontenbewegung mit exakter Asset-/Netzwerkidentität.
3. Nachgewiesene Beziehungen: derselbe Vorgang, Gegenbein eines Transfers, zugehörige Gebühr, zusätzliche Kaufpreis-/Kosteninformation oder Konflikt.
4. Bestehende kanonische Buchung/Historie mit nachvollziehbarer wirtschaftlicher Wirkung und mehreren Quellenbelegen.

**Beispiel:** Ein Kauf bei Kraken ist ein Kauf. Die spätere Auszahlung an eine eigene Ledger-Wallet ist ein davon verschiedener interner Transfer. Kraken-Auszahlungsbeleg, Ledger-Eingang und Blockchain-Eingang können denselben Transfer aus unterschiedlichen Perspektiven belegen. Kauf einmal, Transfer mit korrekten beiden Kontenbewegungen einmal, jede tatsächliche Gebühr einmal; keine zusätzliche externe Einzahlung oder weiterer Kauf durch Ledger-/Blockchain-Belege.

Wird zuerst die Blockchain-Historie und später der Kaufbeleg eingelesen, ergänze gesicherte Kosten-/Herkunftsinformationen, statt den schon erfassten Zugang ein zweites Mal zu buchen. Fehlende Kostenbasis bleibt unbekannt, bis passende Belege vorliegen. Ein späterer Konflikt darf vorhandene Nutzerkorrekturen nicht still überschreiben.

## 5. Automatischer Dublettenschutz und Matchingregeln

**Starke Belege automatisch verknüpfen:** verifizierte Quellreferenzen, Netzwerk/Chain-ID, vollständige Transaktionskennung, nativer Ereignis-Locator, Asset/Contract/Mint, eigene Konten-/Walletidentität und exakte Mengenbeziehung. Dateiname, Zeilennummer, Ticker, gleiche Menge oder zeitliche Nähe allein sind keine sichere Identität. Wiederholte identische Zahlungen mit verschiedenen Referenzen bleiben eigenständige Vorgänge.

**Bitcoin:** Transaktionskennung plus Ein-/Ausgangsindex und Eigentumsbereich beachten. Wechselgeld, mehrere eigene Ausgänge, Batch-Auszahlungen sowie HD-/Einzeladress-Überlappungen korrekt behandeln. Niemals die ganze Transaktion allein wegen gleicher TxID als eine Dublette verwerfen. Die gesamte Mining-Gebühr einer Sammeltransaktion nicht unbelegt einem einzelnen Empfänger zurechnen.

**Ethereum/EVM:** Chain-ID, native Transfers, Token-Contract und Log-/Trace-Locator unterscheiden; mehrere Ereignisse derselben Transaktion erhalten. Gas einmal und getrennt von eventuellen Börsen-Abhebegebühren behandeln. Gleiche Ticker auf verschiedenen Contracts/Chains nicht gleichsetzen.

**Solana:** Signatur, äußere/innere Instruction-Locators, Mint sowie Tokenkonto-/Eigentümerbezug prüfen. Mehrere Instruktionen und Tokens derselben Signatur nicht zusammenwerfen. SOL-Gebühren und Gebührenzahler explizit berücksichtigen.

**Börsen:** Trade-, Ledger-, Order-, Auszahlungs- und Referenz-IDs in ihrem jeweiligen Anbieter-/Kontokontext unterscheiden. Eine Order kann mehrere echte Ausführungen haben; eine Blockchain-Transaktion kann mehrere Kunden-/Wallet-Auszahlungen enthalten. N:M-Zuordnungen nur bei belegter Identität und exakter Mengen-/Gebührenbilanz übernehmen.

**Schwache Treffer:** Zeit-/Betragsähnlichkeit nur als Vorschlag, nicht automatisch verschmelzen. Fehlende Locator-Daten nicht erfinden. Unverwechselbare zusätzliche Originalreferenzen oder eine transparente Nutzerentscheidung verlangen; deren Grenzen protokollieren. Keine pauschalen Prozenttoleranzen bei Finanzmengen.

Die normale Reihenfolge der Quelleingänge darf den bestätigten wirtschaftlichen Endzustand nicht verändern: CSV→Blockchain→Ledger, Blockchain→Ledger→CSV und Wiederholungen müssen nach vollständigem Abgleich dieselben Bestände, Kosten, Cashflows und Gebühren ergeben. Unterschiedliche Beobachtungszeitpunkte/Provenienz dürfen bestehen bleiben.

## 6. Blockchain-Historie vollständig und ehrlich rekonstruieren

Priorität auf den vorhandenen BTC-/HD-, Ethereum-/ERC20- und Solana-/SPL-Pfaden; weitere bereits unterstützte Netze und Stakingformen nach ihrer tatsächlichen Abdeckung. Kein paralleler Umbau für beliebige neue Chains.

Pagination, sichere Fortsetzung, Scanabbruch, Rate-Limits, Archivlücken, Finalität und Reorganisationen müssen korrekt behandelt werden. #268-Cursor-/Neustartarbeit wiederverwenden. Unbestätigte, fehlgeschlagene oder verwaiste Ereignisse nicht als endgültige erfolgreiche Mengenbewegungen übernehmen; belegte tatsächlich angefallene Gebühren separat behandeln. Reorganisationen markieren betroffene Belege/Abdeckungsansprüche und lösen kontrollierten Neuabgleich aus, keine blinde Löschung bestätigter Portfoliobuchungen.

Bestände im vergleichbaren Zeitraum/Block gegen aktuelle belegte Walletbestände prüfen. Ein aktueller Scanbestand ist ein Kontrollwert, keine zusätzliche historische Einzahlung. Bestehende Anfangsbestände, manuelle Buchungen und Stichtage nicht nochmals addieren. Historische Rekonstruktion in ein bereits bestücktes Portfolio erst nach kontrolliertem Backfill-/Bestandsabgleich.

Unvollständige Geschichte bleibt teilweise/unbekannt, nicht Null. Blockchain-Fakten belegen nicht automatisch Börsenkaufpreise, externen Kapitaleinsatz oder persönliche Kostenbasis. Historischer Marktwert und Anschaffungskosten getrennt führen. Fehlende Kurse nicht erfinden und technische Bewegungen nicht als garantierte steuerliche Einordnung ausgeben.

Rewards, Delegation, Unbonding, Wrapping, Rebase, Swaps und interne Transfers fachlich auseinanderhalten. Staking-Hauptbetrag ist kein neuer Ertrag; Rebase und ausgewiesener Reward dürfen dieselbe Bestandsänderung nicht doppelt zählen. Nur belegte unterstützte Protokollfälle automatisch behandeln; Unbekanntes nachvollziehbar zurückstellen.

## 7. Anbieterbezogene Restarbeit

**Flatex AT:** Depot- und Kontoumsätze gemeinsam oder getrennt verarbeiten; Original-/Beta-Dopplung zu einem verständlichen Standardablauf zusammenführen. Bestehende native Simulation nicht neu bauen. Orderbeine, echte Ausführungen, Gebühren, Steuern, Depotüberträge und Kapitalmaßnahmen korrekt unterscheiden. Lesbare Paargruppen oder bestätigte Konten allein sind noch keine vollständige Buchungsfreigabe. Klare zeilenbezogene Sperrgründe statt pauschalem „Simulation gesperrt“.

**Bitpanda:** Tatsächliche bereits vorliegende Originalvarianten einschließlich der beanstandeten Spaltenabweichung analysieren und versioniert unterstützen. Keine pauschale Lockerung von Spaltenprüfungen, keine fehlenden Gebühren-/Steuerfelder automatisch nullsetzen. Käufe, Verkäufe, Earn/Staking, Transfers und spätere Walletbelege gemeinsam prüfen.

**Bittr:** Vorhandenen echten CSV-Leser und Kaufbelegabgleich in den gemeinsamen Einstieg einbinden. Fiat-/BTC-/Gebührenbelege mit Ledger- und Blockchain-Ausgängen verknüpfen; vorhandene Walletzugänge nicht doppelt erzeugen.

**Ledger Live:** Vorhandene Beobachtungen und Walletreferenzen zum sicheren gemeinsamen Abgleich weiterentwickeln. Countervalue ist ein Bewertungsbeleg, nicht automatisch Kaufpreis. Fehlende native Locators über verifizierte Blockchainereignisse auflösen, nicht aus CSV-Zeilen erfinden.

**Kraken:** Vorliegenden Ledger- und gegebenenfalls bereits zugänglichen Trade-/Earn-Export gemeinsam auswerten; Ausführungen, Gegenbeine, Teilfüllungen, Gebührenwährungen, Rewards und Transfers prüfen. Balance-Snapshots nicht als Einzahlungen importieren. Ungeklärte Ereignisse einzeln benennen, nicht die vollständige sichere Analyse verhindern.

## 8. Übernahme, Bestandsdaten und Datenschutz

Analyse, Abgleich und Vorschau dürfen keine wirtschaftlichen Daten verändern. Optionaler temporärer Scan-/Resumezustand muss getrennt und als solcher gekennzeichnet bleiben. Erst die ausdrückliche Bestätigung erzeugt einen atomaren bestehenden IDB-/CAS-Commit aus dem noch aktuellen Prüfplan. Bei veralteter Revision erneut abgleichen; kein halber Batch bei Abbruch, Quota, Konflikt oder Fehler.

Standard ist die vollständig geprüfte Auswahl. Eine unabhängige sichere Teilmenge nur nach expliziter Auswahl und erneuter vollständiger Abhängigkeitsprüfung übernehmen; gesperrte Restmenge offen ausweisen. Das ist kein stiller Teilcommit.

Quellenverknüpfungen, manuelle Entscheidungen, Importidentitäten und Lösch-/Wiederimportschutz müssen Reload, Offline, Mehrtab und Backup/Restore überstehen. Gelöschte wirtschaftliche Vorgänge nicht durch einen anderen Importkanal unbemerkt wiederbeleben. Bei Undo Quellenentfernung und Buchungsrücknahme unterscheiden; weitere bestätigte Quellenbelege und abhängige Transaktionen erhalten beziehungsweise kontrolliert prüfen. Manuelle Korrekturen nicht ungefragt zurücksetzen.

Nur freigegebene private Originale isoliert testen. Keine echten Walletadressen, xpubs, Transaktionskennungen, Kontonamen, Originaldateien, Schlüssel oder Passwörter in GitHub, Screenshots oder CI-Artefakten. Öffentliche Tests rein synthetisch. Keine zentralen Geheimnisse oder Pflichtserver, keine schreibenden Börsen-/Blockchainaktionen. Keine kostenpflichtigen Dienste eigenständig buchen.

## 9. Konkrete serielle Etappen

**UH01 – Vorhandene Belege und Verträge zusammenführen.** Kurzer Deltaabgleich, keine neue Gesamtaudit-Schleife. Private Originalanalysen wiederverwenden; je Anbieter/Chain vorhandene Erkennung, Vorschau, Verknüpfung, Übernahme und Lücken aufführen. Gemeinsame Herkunfts-/Wirkungs-/Konfliktregeln und unabhängige Sollwerte in bestehenden Strukturen festlegen.

**UH02 – Erste vollständige quellenübergreifende Kette.** Die vorhandene BTC-/Bittr-/Ledger-Implementierung als kleinsten nachweisbaren vertikalen Schnitt nutzen: echte Dateiformate + Blockchainbelege → automatische sichere Zuordnung → kompakte Vorschau → einmal bestätigen → korrekter persistenter Bestand/Historie/Kostenbeleg → Wiederimport/Undo/Restore. Keine neue reine Vorschaufunktion als Abschluss melden.

**UH03 – Kraken und Bitpanda, Ethereum und Solana.** Dieselben Verträge auf Börsenkäufe, Gebühren, interne Transfers und unterstützte Rewards ausdehnen. Originalspaltenprobleme beseitigen; BTC sowie ETH/ERC20 und SOL/SPL anhand konkreter kombinierter Fälle abnehmen. Unbelegbare Spezialfälle getrennt begrenzen.

**UH04 – Flatex-End-to-End.** Native Depot-/Kontodateien im gemeinsamen Assistenten bis zur korrekten Übernahme und Historie führen, einschließlich sicherem Abgleich vorhandener Bestände. Kein zweiter Importkern.

**UH05 – Gesamtabnahme und Alltagstauglichkeit.** Alle fünf Anbieter und unterstützten Blockchainpfade zusammen testen, große Stapel performant und auf Android kompakt bedienen, Datenqualität/Abdeckung und echte Restlücken dokumentieren. Sichere abgeschlossene Inkremente nach bestehender Freigabe veröffentlichen; nicht alles bis zu einem Großrelease zurückhalten.

Der aktive Work-Owner darf technische Abhängigkeiten innerhalb dieser Reihenfolge begründet optimieren; alle fünf Anbieter und der gemeinsame Quellenabgleich bleiben verbindlich. Reine Kosmetik darf die wirtschaftlich nutzbare Umsetzung nicht verdrängen.

## 10. Pflichtabnahme

Eine reine Parser-/Vorschauabnahme ist kein fertiger Import. Für jeden Anbieter mindestens eine vollständige, privat originalvalidierte und unabhängig abgeglichene Ende-zu-Ende-Kette plus offen ausgewiesene Rest-Ereignisklassen nachweisen. Für den gemeinsamen Kern mindestens:

- Bittr-Kauf + Ledger-Eingang + Bitcoin-Historie; zusätzliche Quelle verändert bereits gezählten Bestand nicht.
- Kraken-Kauf + Auszahlung + eigene Wallet + Ledger; Kauf und interner Transfer bleiben verschieden, keine falsche externe Einzahlung.
- Bitpanda-Auszahlung/Reward + Chain-/Ledgerbeleg; Ertrag und Gebühren je tatsächlichem Vorgang genau einmal.
- Gleiches Asset/gleiche Menge/nahe Zeit, aber verschiedene echte Transaktionen: nicht verschmelzen.
- Mehrere BTC-Ausgänge, mehrere ERC20-Logs und mehrere Solana-Instruktionen in einer Transaktion; N:M-/Batchfälle und Teilfüllungen.
- HD-/Einzeladress-Überlappung, gleiche Ticker mit anderen Contracts/Netzen, unterschiedliche Gebührenwährungen und Gebührenzahler.
- Dieselben Dateien mehrfach, überlappende Exporte, erneuter Scan, vertauschte Quellreihenfolgen und nachträgliche Kaufbelege: wirtschaftlich identischer Endzustand.
- Vorhandene manuelle Buchungen/Stichtage/Anfangsbestände, gelöschte und korrigierte Vorgänge; keine unbemerkte Verdopplung oder Wiederbelebung.
- Scanlücken, ungültiger Cursor, fehlende Preise/Referenzen, Reorganisation, fehlgeschlagene Transaktion mit belegter Gebühr, Abbruch und veraltete CAS-Revision.
- Bestätigen → Reload → Offline → verschlüsseltes Backup/Restore → Wiederimport → sichere Rücknahme; exakte Mengen, Cash, Gebühren, Kostenbasis und zulässige Rendite-/Cashflowklassifikation.

Die Abnahme verwendet nicht nur dieselbe Produktionsfunktion als Sollwert. Synthetische unabhängige Oracles und private Originalabgleiche trennen. Chromium/Firefox/WebKit und 320–430 px; echte Android-Hardware nur bei tatsächlichem Nachweis. Keine Finanz-/IDB-/CAS-/Backup-/Offline-Gates zugunsten des Ein-Klick-Ziels entfernen.

## 11. Koordination und unmittelbarer Arbeitsauftrag

Dieser Nachtrag ist eine Planänderung, keine Entwicklungsübernahme durch eine zweite Sitzung. Aktueller Work-Owner integriert ihn konfliktfrei in `docs/WORK_RESTPAKETE_CHECKPOINT.md`, `docs/KONSOLIDIERTE_ROADMAP.md` und die Priorisierung. Neuere Release-/Owner-Einträge erhalten. Keine CI abbrechen, kein zweiter Branch für dieselbe Arbeit, keine neuen großen Testläufe allein für diesen Dokumentationsnachtrag.

Nach aktueller Release-/Kursversorgungsabnahme die vorhandenen Originalanalysen zusammenführen und den kleinsten vollständigen CSV-/Blockchain-Abgleich tatsächlich implementieren. Nicht erneut bei Preview-only stoppen. Echte externe Blocker präzise benennen, unabhängige sichere Teile fortführen. Nach jeder Etappe Status je Quelle, Tests, PR, Produktionsabnahme und nächsten ausführbaren Schritt remote sichern.

## Technische Primärquellen

Zusätzlich zur oben genannten konkreten Codeprüfung: Bitcoin Esplora API https://github.com/Blockstream/esplora/blob/master/API.md ; Ethereum Receipt-/Log-Vertrag https://ethereum.github.io/execution-apis/api/methods/eth_getTransactionReceipt/ ; Solana getTransaction/JSON-Strukturen https://solana.com/docs/rpc/http/gettransaction und https://solana.com/docs/rpc/json-structures . Diese Quellen belegen Transaktions-/Unterereignisstrukturen, nicht automatisch Konto-Eigentum, Kostenbasis oder eine fertige FolioLab-Integration.
