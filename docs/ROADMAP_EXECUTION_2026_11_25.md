# FolioLab Open · Checkpoint vom 25.11.2026

## Aktive Arbeitsreihenfolge ab SW341

Ziel ist die frühestmögliche vollständige Zeilenabnahme ohne weitere Unterlagen, Kontozugänge oder Geräteprüfungen durch den Anwender. Ausgangspunkt ist SW341 auf `162d76ae` mit 6/6 Kernbereichen und 11/29 Folgepaketen. Für offene Kriterien gilt die Paketmatrix am Dateiende. Für die nächste Durchführung gilt folgende Reihenfolge.

1. **FIN-E2E01 und Verwaltung gemeinsam bearbeiten.** Für den Fondsverkauf liegt das unabhängige Soll bereits vor. Ein gezielter Produkt-PR kann die Modellrücknahme und die Bedienung derselben Buchung tragen. Vor Arbeitsbeginn offenen PR und Branch zum selben Fall übernehmen, falls vorhanden. An einem Produktstand den positiven Fall ohne Folgeabhängigkeit, den geschützten Fall mit späterem Kontrollpunkt und eine unbeteiligte Buchung prüfen. FIN-E2E01 anhand von Bestand, Kostenbasis, realisiertem Ergebnis, Cash, Gebühren, Steuern und Flows bewerten. Verwaltung anhand von Auswahl, Bestätigung, Abbruch, veralteter Revision, Audit, Wiederimport, Undo und Restore bewerten. Jedes Paket erhält seinen eigenen Abschlussentscheid.
2. **Kurze Rückmeldung vor teurer CI.** Vom Belegzweig den [Modelltest für die Fondsrücknahme](release-evidence/fund-disposal-preflight-2026-11-25.mjs) mit `node docs/release-evidence/fund-disposal-preflight-2026-11-25.mjs <Produkt-Checkout> blocked` ausführen. Auf SW341 bestätigt: Import mit 39.038,06 EUR Cash, null Stichtagen, vier fachlichen Sperrgründen und bytegleichem Eingangsmodell. Auf dem Kandidaten `ready` verwenden. Dieser Modus prüft zusätzlich Stückzahl, Kostenbasis, Cash, unbeteiligte Reserveposition und externe Flows der Vorschau. Der vorhandene [Drei-Browser-Beleg](release-evidence/sw340-fund-disposal-roundtrip-2026-11-25.json) deckt den Import-Undo ab. Für die neue Einzelrücknahme gezielt die Bestätigung und ihre Folgezustände testen. Die lokale Baseline der beiden Suiten `tests/booking-management-changes.test.mjs` und `tests/fin-e2e.test.mjs` bestand auf SW341 mit 20/20 Tests.
3. **Den vollständigen Buchungspfad in einem Schnitt ändern.** `src/booking-management.js` prüft Herkunft und Journalform und korrigiert im bestehenden Cashpfad eine Position. `src/transactions.js` prüft die archivierten Originale beim Restore. `src/import-identity.js` schützt entfernte Cash-Importe beim Wiederimport. Alle drei Verträge am selben Wertpapierfall qualifizieren. Erst nach positiven und geschützten Modellfällen den gemeinsamen PR-Stand durch die Pflichtprüfungen schicken. Bei grüner CI Integration, Pages und Live eigenständig bis zum Ergebnis begleiten. Die bestehende serielle Live-Reihenfolge gilt.
4. **CI-Wartezeit für unabhängige Arbeit nutzen.** Als Nächstes die ausgelieferten Grafiken mit offener Herkunft anhand des TRUST01-Inventars bearbeiten oder den vorhandenen Cosmos-Reward durch Historienimport und Wiederimport verfolgen. Diese Schnitte sind unabhängig vom Fondsverkauf. Eigene Prüfergebnisse auf dem jeweiligen Commit festhalten und nur konfliktfreie, fertig geprüfte Änderungen zur Integration bringen. Ein unabhängiges Paket mit inzwischen vollständig verfügbaren Voraussetzungen hat Vorrang vor einer weiteren Teilprüfung.

| Gemeinsam nutzbarer Eingang | Paket / auslösende Änderung | Arbeit bei verfügbarem Eingang |
| --- | --- | --- |
| Gerätezeit | Startperformance, Recovery, TRUST01, später FLH04 | Bereits autorisierte Sitzung anhand von Gerät, Offlinebetrieb, Persistenz und Zweitgerät prüfen. Geeignete Fälle in derselben Sitzung mit der vorhandenen Fixture vorbereiten. Vergleichsläufe für Performance isolieren. FLH04 benötigt zusätzlich sein unabhängiges Review und die konkrete Sicherheitsfreigabe. |
| Neue, passende Brokerunterlage | FLH05, FLH03, AT03, AT05, Barausgleich | Vor Parser- oder Browserarbeit Anbieter, Zeitraum, Geschäft und unabhängiges Soll zuordnen. Nur passende Teilfüllung plus Nettoabrechnung, Export plus Einzelabrechnung, Originalsaldenpaar, Jahresbeleg desselben Depots oder individuell zugeordneten Stückrest prüfen. Vorhandene negative Suchen erst bei neuer Quelle wieder aufnehmen. |
| Erlaubte Datenquelle | VWCE und UI-SENTIMENT01 | Nutzbaren Datenzugang und dokumentierte Anzeigerechte je Quelle zuerst prüfen. Vorhandene Vergleichsrechnung, Darstellung und Cachetests wiederverwenden. |
| Originalantwort, Kontozuordnung oder veränderter technischer Vertrag | ETH-Cursor, FLH03-18, weitere Wallets | Historischen Cursor bzw. privaten Besitz nur mit passendem Original zuordnen. Die 24-stellige NEAR-Referenz erst mit einem durchgängigen Präzisionsentwurf erneut produktseitig qualifizieren. |
| Messbare Änderung am kritischen CI-Pfad oder neuer Veröffentlichungsauftrag | CI-Effizienz, Produktmaster | #430 bei einem neuen Kandidaten oder aussagekräftigeren Vergleich wieder aufnehmen. Die interne Vorschau ist fertig. Öffentliche Bewerbung bleibt zurückgestellt. |

**Wiedereinstieg:** Beim Wechsel von Aufgabe oder Sitzung nur Änderungen seit dem letzten belegten Stand prüfen. Den Arbeitsplan im vorhandenen Paketeintrag um Ergebnis, Beleglink und den nächsten ausführbaren Schritt bzw. konkreten Wiedereinstiegsauslöser ergänzen. Ein fehlender Zugang parkt die betroffene Arbeit. Alle unabhängigen Arbeiten gehen weiter. Maß für den Fortschritt sind vollständig abgenommene Zeilen und die Zeit bis zur Live-Abnahme eines konkreten Kandidaten.

Main `8de635271c341d7462d4d33e5f268089c26da6d0`, Tree
`d80ec391347b9586e28b73389d193edec866bab3`. **SW339 LIVE_ACCEPTED**,
**6/6 Kernbereiche und 10/29 Folgepakete abgenommen**.
Der [Mainlauf](https://github.com/joke0071/foliolab-open/actions/runs/45481111315)
zu [#428](https://github.com/joke0071/foliolab-open/pull/428) bestand Pflicht-CI,
Pages und den zuvor noch laufenden
[Livejob](https://github.com/joke0071/foliolab-open/actions/runs/45481111315/job/138770447941)
einschließlich Chromium, Firefox und WebKit. Direkter erneuter Abruf von
`/`, `/index.html` und `/sw.js` stimmt bytegenau mit Main überein.
SHA-256 für beide HTML-Pfade
`50fb8992d48d0f00255f660b92ae4d14a840bc2ee23ba555ff404555774d80d3`,
für `sw.js`
`439e0851ea4e04e34807443015048a97ae281de3f36c2c6ea4e22057b640ff7a`.

## Freigabewege ab 25.11.2026

Die Entwicklungsleitung beschafft und prüft die Nachweise. Neue Kontoauszüge, Wallet-Adressen, Gerätesitzungen oder Abnahmeprotokolle vom Anwender sind kein Arbeitsschritt. Ausgangspunkt ist Checkpoint `19be0555` mit SW339, **6/6 Kernbereichen und 10/29 abgenommenen Folgepaketen**. Die folgenden Wege sind Arbeitsaufträge. Jeder Paketstatus folgt dem tatsächlich erreichten Prüfergebnis.

### Reihenfolge für die nächste Übernahme

1. **Mit vorhandenen Belegen beginnen.** Die fünf abgeschlossenen Originalkernfälle, den Bitpanda-Quartalsabgleich, die Kraken-Order-/Ledger-Zuordnung und die vorhandenen Restore-Originale einmal nach Anbieter, Zeitraum, Ereignis und unabhängiger Sollgröße abgleichen. Im privaten Arbeitsbereich pro Lücke festhalten, welcher Beleg sie abdeckt oder warum er ausscheidet. Dadurch kann ein einziger geeigneter Fall AT03, FLH05, FIN-E2E01 und Verwaltung speisen. [Kernfälle](FOLIOLAB_1_0_ORIGINAL_CORE_2026-11-18.md) · [Anbietermatrix](FLH03_PROVIDER_MATRIX.md)
2. **Unabhängige Arbeit vorziehen.** Die drei Produktentscheidungen unten als Arbeitsvorgaben verwenden. Bestehende CI-Läufe auswerten, die Alt-PWA aufbauen und die Verfügbarkeit von Projektgeräten sowie einer unabhängigen Reviewstelle prüfen. Fehlt ein Zugang, mit der nächsten ausführbaren Zeile weiterarbeiten. Ein erneuter Versuch lohnt sich bei einem neuen Beleg, Zugang, Anbieterstand oder Produktkandidaten.
3. **Abnahme buchen.** Je Zeile Quelle mit Version/Stichtag, unabhängiges Soll, Ist, Abweichung, geprüften Umfang und verbleibende Lücke im bestehenden Paketcheckpoint erfassen. Öffentlich genügen anonymisierte Ergebnisse und Verweise auf freigegebene Artefakte. Persönliche Originale, Adressen, Cursor und Zugangsdaten bleiben privat. Softwareänderungen durchlaufen die bestehenden Integrations-, Wallet-, Main-, Pages- und Live-Gates im geltenden Umfang. Der Zähler steigt erst bei vollständiger Zeilenabnahme. Ein bestandener generischer Test, eine zurückgestellte Funktion und ein nachgewiesener persönlicher Fall haben jeweils einen eigenen Status.

### Produktentscheidungen ohne Rückfrage

| Paket | Arbeitsentscheidung | Abnahme und Reichweite |
| --- | --- | --- |
| UI-Refresh · #300 | Die bestehende Gliederung in „Mehr“ als Standard wählen. Drei Sprunglinks nur dann erproben, wenn mindestens einer der drei Zielbereiche bei Tastatur- oder Mobilbedienung nachweisbar schwer erreichbar ist. | Alle drei Bereiche bei 320 px, 200 % Zoom und per Tastatur erreichen, Fokus und Zurückweg sowie Erhalt ungespeicherter Eingaben prüfen. Bei bestandenem Test Variante und Befund im UI-Checkpoint dokumentieren. |
| Benchmark/Roadmap · #124 | Für den ersten nachvollziehbaren Vergleich 100 % VWCE, Xetra, EUR als beschriftete ETF-Referenz ansetzen. Dies ist eine Produktvorgabe für den Pilotvergleich. | Nutzbare historische EUR-Reihe, Datenrechte und Behandlung von Ausschüttungen/Kapitalmaßnahmen belegen. Auf gemeinsamen Bewertungstagen mit identischem Startwert die zeitgewichtete Portfoliorendite gegen eine unabhängig geprüfte Referenzrechnung stellen. Datenlücken sichtbar lassen. Bei fehlender Reihenqualität bleibt nur dieser Vergleich aus. |
| Produktmaster · #149 | Die fachlich abgenommene App und die öffentliche Bewerbung getrennt führen. Die bestehende Entscheidung für den privaten Webauftritt respektieren. Eine Vorschau mit synthetischen Daten intern vorbereiten. | Texte und Screens gegen ausgelieferte Funktionen prüfen, private Inhalte ausschließen und Vorschau intern abnehmen. Veröffentlichung auf der Website bleibt eine gesonderte, zurückgestellte Aktion. Die übrigen Pakete können veröffentlicht werden, soweit ihre eigenen Gates erfüllt sind. |

### Originalbelege, Finanzfunktionen und Wallets

Ein veröffentlichter Musterfall kommt in Betracht, wenn Herkunft, Verwendung, Region, Schema und sämtliche erforderlichen Felder nachvollziehbar sind. Vor dem Import die Erwartungen aus einer zweiten Quelle oder der belegten Abrechnung festhalten. Synthetische Grenzfälle ergänzen die Regression. Ein Wert aus demselben Parser oder eine Rückrechnung aus denselben Umsätzen liefert keinen unabhängigen Originalwert.

| Paket | Wie die Entwicklung den Eingang beschafft | Entscheidung anhand des Ergebnisses |
| --- | --- | --- |
| AT03 · #127 | Vorhandene Umsatzexports, Abrechnungen und datierte **gebuchte** Salden paaren. Zwei aufeinanderfolgende Abschlüsse oder Buchungszeilen mit explizitem laufendem Saldo können die Grenzen desselben Kontos, derselben Währung und Periode liefern. Für einen generischen Kontrollfall auch selbst einen passenden freigegebenen Anbieter-Musterfall suchen. | Beide Originalsalden separat ablesen und alle Bewegungen einschließlich Transfers dazwischen abstimmen. Verfügbarer Betrag, doppelte Anzeige desselben Saldos oder Bitpanda-Gesamtportfoliowert reichen dafür nicht. Den persönlichen Zeitraum nur mit seinem eigenen Saldenpaar abschließen. |
| FLH05 · #174 | In der vorhandenen Kraken-Order-/Ledger-Korrespondenz eine weitere zusammengehörige Gruppe mit Teilfüllungen, Gebühren, Fremdwährung und einem separat ausgewiesenen Nettobetrag suchen. Alternativ dokumentierten Anbieter-Testexport mit Orderabrechnung desselben Falls verwenden. | Ausführungen über ihre Quell-IDs verbinden, FX-Richtung, Gebührenwährung und Netto exakt prüfen. Reihenfolge vertauschen, erneut importieren, zurücknehmen und wiederherstellen. Nur das geprüfte Anbieterprofil und Ereignismuster freigeben. |
| FIN-E2E01 · #255 | Aus dem qualifizierten Originalfall die Herkunft, Gegenposition, Cash, Kostenbasis und Journalwerte **vor** dem Test festschreiben. Mit der vorhandenen FIN-E2E-Strecke eine zusätzliche konkret erlaubte Rücknahme prüfen. | Nach Import, Rücknahme, Undo und Restore exakt gegen die Sollzustände vergleichen, einschließlich externer Flows und Historie. Abbruch und veraltete Revision müssen den vollständigen Vorzustand erhalten. Nur belegte Rücknahmeklassen erlauben. |
| Verwaltung/Buchungsmutationen · #165/#257 | Den gleichen Beleg über die tatsächliche Verwaltungsoberfläche auswählen. Erlaubte Buchung und einen geschützten Gegenfall mit Folgeabhängigkeit gegenüberstellen. | Korrektur, Abbruch, Sperrgrund, Gegenbuchung, Journal, Kosten und Flows prüfen. Wiederimport darf die zurückgenommene Identität nicht wiederbeleben. Eigenes UI-Ergebnis mit Verweis auf den FIN-E2E-Beleg erfassen. |
| FLH03 · #148 | Bitpanda-Quartalsauszug, späteren Cashbeleg und vorhandene Transaktionsexporte nach unabhängigen Cash- und BCI25-Komponentenzeilen zum Stichtag prüfen. Für den generischen TR-Import gezielt einen freigegebenen Export im unterstützten Regionalformat mit separater Abrechnung suchen. Öffentliche PDF-Textbeispiele können Feldbedeutungen belegen, ein CSV-Profil benötigt einen passenden Export. | Cash und jede BCI25-Komponente nach Datum, Asset und Menge abgleichen. Öffentliche Indexgewichte erlauben Methodenprüfungen, persönliche Anteile benötigen datierte Stückzahlen. Persönlicher TR-Fall bleibt `NOT_APPLICABLE`. Generische TR-Abnahme erfolgt separat je belegtem Format. |
| FLH03-18 · #159 | Bereits zugeordnete Ledger-Exporte nach einer weiteren Stake-Position mit datierter Delegation und Endbestand durchsuchen. Für den allgemeinen Adapter ist ein dokumentiertes Projekt-Testkonto mit Export und separat lesbarem Kettenbestand ein eigener Prüffall. | Konto-/Wallet-Zuordnung unabhängig belegen, am gleichen finalisierten Block bzw. Stichtag verfügbare und gebundene Menge abstimmen. Transfer, Reward und interne Verschiebung gegen Doppelzählung prüfen. Eine persönliche Zuordnung bleibt an ihren Beleg gebunden. |
| Weitere Wallet-Abdeckung · #119 | Pro zusätzlichem Netzwerk einen dokumentierten Projekt- oder öffentlichen Referenzfall mit festem Block, Zeit und Finalität wählen. Historische Protokoll-/Node-Abfrage und unabhängigen Explorerbeleg sichern. | Bestand, Stake, Unbonding und Rewards gemäß Adapterumfang separat prüfen. Bei Lücken Teilabdeckung ausweisen. Eine öffentliche Beispieladresse belegt Netzwerkverhalten. Für einen Eigentumsnachweis braucht es die Kontozuordnung des konkreten Falls. |
| ETH-HISTORY-CURSOR01 · #268 | Vom [abgenommenen öffentlichen Fall](release-evidence/sw321-eth-cursor-public-2026-11-16.json) ausgehen. Vorhandene private Artefakte gezielt auf das ursprüngliche Antwortpaar prüfen. Für die allgemeine Fehlerklasse eine neue öffentliche Mehrseitenfolge inklusive unverändertem Folgetoken, Antwort und Blockbezug aufzeichnen. | Seitenfolge, eindeutige Events und Abschluss gegen unabhängige Chain-Daten prüfen. Ungültiger, zyklischer oder unterbrochener Cursor muss einen ehrlichen Teilstatus ergeben. Den persönlichen Vorfall nur bei auffindbarem Originalpaar als reproduziert kennzeichnen. |
| AT05 · #129 | Vorhandene Jahresabrechnungen oder einen freigegebenen österreichischen Musterfall mit unabhängiger Fachlösung nach ISIN, Jahr, Stückzahl und steuerlichem Ereignis der passenden OeKB-Meldung zuordnen. Eine bereits veröffentlichte fachliche Gegenprüfung muss genau diesen Sachverhalt und Rechenweg abdecken. [OeKB-Steuerdaten](https://www.oekb.at/kapitalmarkt-services/unser-datenangebot/fonds/steuerdaten.html) | Ausgewiesene Jahreswerte und Export mit Brokerabrechnung und unabhängiger Fachprüfung abstimmen. Fehlende Zuordnung als unbekannt führen. Ohne passenden Fall bleibt die belegte Buchungsübersicht nutzbar und die zusätzliche Steuerqualifikation offen. |
| Barausgleich · #52 | Ein veröffentlichtes Emittentenereignis mit einer freigegebenen Brokerabrechnung desselben Ereignisses verbinden. Bezugsverhältnis, Stückbruchteil, Abrechnungstag, Geldbetrag, Währung, FX, Kosten und ausgewiesene Steuerbasis erfassen. | Aktien- und Cashbuchungen gemeinsam abstimmen, einschließlich Rundung, atomarer Ablehnung und Restore. Fehlende Steuerbasis als unbekannt führen. Eine reine Corporate-Action-Mitteilung belegt keine individuelle Nettoauszahlung. |

### Infrastruktur, Anbieter und Freigaben

| Paket | Ausführbarer Weg | Freigabekriterium und Ausweichweg |
| --- | --- | --- |
| CI-Effizienz · #229 / PR #430 | Bei den nächsten fachlich erforderlichen regulären Läufen seriellen und parallelen Kandidaten paarweise mit gleicher App, Runnerklasse, Browsern, Shards und Prüfumfang messen. Den gesamten lokalen Pflichtpfad unter gleichen Bedingungen paaren und CPU-/Speicherauslastung sowie die Zeit außerhalb P1A in Shard 2 erfassen. Vorhandene Läufe als Baseline verwenden. | Zeit bis zum letzten Pflichtjob und bis zur Live-Abnahme, Wiederanläufe, geprüfte Fälle und Artefakte vergleichen. Übernahme erst bei wiederholtem Gesamtgewinn außerhalb der beobachteten Streuung und gleicher Abdeckung. Sonst seriellen Ablauf beibehalten und den Versuch mit Messwerten abschließen. |
| Startperformance · #177/#256 | Vorhandene 10k-Fixture anhand ihres Hashs übernehmen. Ein bereits autorisiertes physisches Android-Projektgerät nutzen. Als Alternative zu den früher blockierten Lab-Einstiegen ein verfügbares Projektkontingent für [Android Device Streaming](https://developer.android.com/studio/run/android-device-streaming) auf Installation, Prozessende und Offlinebetrieb prüfen. | Auf demselben Modell mit gleicher Chrome-/PWA-Version je fünf Kalt-, Warm- und Offline-Starts pro Vergleichsstand. Einzelwerte, Median, Streuung, erste sichere Interaktion und Finanzgleichheit dokumentieren. Verhindert das Labor einen Messmodus, nur die durchgeführten Modi buchen. |
| Speicher/Migration/Recovery · #44/#254 | Historische App und Service Worker aus dem vorgesehenen Release auf einer kontrollierten HTTPS-Origin installieren, vorhandenen 10k-Bestand über die alte UI anlegen und dann auf derselben Origin aktualisieren. Alten Tab offen halten. Für Zweitgeräte-Restore zwei getrennte, autorisierte Laborgeräte und den vorhandenen verschlüsselten Export nutzen. | Version, Schlüssel-/Installationsidentität, Revision, Journal, Historie und Kontostände vor/nach Update, Abbruch und Restore vergleichen. Inkompatibler Writer bleibt gesperrt. Profil-Neustart, echte Gerätewiederherstellung und beobachtete OS-Eviction jeweils separat protokollieren. |
| TRUST01 · #298 | Herkunftsinventar des ausgelieferten Builds verwenden. Für ungeklärte Grafiken eine eigenständig erstellte oder ausdrücklich passend lizenzierte Ersatzquelle samt reproduzierbarem PNG-Export vorbereiten. Natives Safari/VoiceOver und ITP auf geeignetem Projektgerät prüfen. HTTP-Frame-Schutz auf einem autorisierten Auslieferungsweg mit effektiven Antwortheadern erproben. [Grafikinventar](K6_TRUST_GRAPHIC_PROVENANCE_V316_2026-11-15.md) | Rechtekette für alle ausgelieferten Ersatzassets und deren Referenzen nachweisen. Native Fokus-/Ansagefolge und tatsächliches ITP-Verhalten mit persistenter Sitzung samt Wiederöffnung belegen. Einen wirksamen Frame-Schutz erst nach Headerprüfung und blockiertem Fremd-Framing der tatsächlich ausgelieferten Origin buchen. |
| UI-SENTIMENT01 · #405 | Krypto und Aktien einzeln behandeln. Für CMC vorhandenen autorisierten Projektzugang und zugelassenen serverseitigen Abruf einschließlich Anzeigerechten prüfen. Der dokumentierte Keyless-Endpunkt eignet sich für die Evaluation, der Produktionsbrowser scheiterte bereits an CORS. Für CNN einen offiziell erlaubten Feed oder eine freigegebene Einbettung mit passendem Anzeigeumfang prüfen. [Bisheriger Quellenversuch](release-evidence/sentiment-sources-2026-11-20.json) · [CMC-Dokumentation](https://coinmarketcap.com/api/documentation/pro-api-reference/keyless-public-api/) | Freigabe je Originalindex nach belegten Rechten und echtem Abruf aus dem Produktpfad mit Quelle, Stand, Cache und Ausfalltest. Ohne Zugang bleibt der betroffene Zahlenwert deaktiviert. Ein Quellenlink kann die Originalseite erschließen. Die vollständige Zwei-Index-Abnahme setzt beide Quellen voraus. |
| Drive/FLH04 · #160 / PR #427 | Den [Reviewauftrag auf `84ef0b37`](https://github.com/joke0071/foliolab-open/blob/84ef0b3746d48f24a7b130ecce80c6409f579463/docs/FLH04_AUTHORITY_CONTINUATION_REVIEW.md) mit vollständiger Kette, Grenzen 128/129/130, Neustart, Widerruf und Konflikten über einen bereits verfügbaren unabhängigen Kryptoreview-Pfad prüfen lassen. Befunde am Kandidaten nachtesten. Danach den isolierten Verifier qualifizieren. Erst bei vorhandener Projekt-OAuth-Origin, Testkonto, zwei autorisierten realen Geräten und erforderlicher konkreter Sicherheitsfreigabe den produktionsnahen Schreibtest planen. | Aktuelle Schreibberechtigung, bestätigter Write, unabhängiger Readback auf Gerät B, Konflikt ohne Datenverlust und wirksamer Widerruf müssen belegt sein. Fehlt Review, Autorisierung oder konkrete Freigabe, bleiben Enrollment und Remote-Write gesperrt. Lokaler Betrieb und bereits abgenommene Backups können weiter ausgeliefert werden. |

**Fortschreibung.** Für jeden Versuch Datum, Kandidat, Ergebnis und nächsten technisch erreichbaren Schritt eintragen. Wo eine externe Voraussetzung fehlt, den konkret betroffenen Funktionsumfang benennen und den nächsten unabhängigen Auftrag ziehen. Vergleichsfälle können allgemeine Produktfunktionen qualifizieren. Ein historischer privater Originalfall, eine Anbietererlaubnis oder eine unabhängige Sicherheitsfreigabe bleiben als solche erkennbar.

## FLH04

Draft [#427](https://github.com/joke0071/foliolab-open/pull/427), Head
`84ef0b3746d48f24a7b130ecce80c6409f579463`, Tree
`638ec5dc0f4977c8fc4ac08c923c669b8819dfa2`. Vorprüfung und Fixture-Verifier
arbeiten jetzt mit derselben lokalen Kopie der Segmentstrings. Das Modell
prüft Bezeichner und Writerlisten einschließlich der vertraglichen Grenze
von 64 Mitgliedern. Drei Regressionstests prüfen stabile Eingaben,
ungültige Verifier-Rückgaben und ungültige Startparameter. **1.732/1.732
Node-Tests lokal**, davon 18 Ablaufmodelltests. Der
[Reviewauftrag](https://github.com/joke0071/foliolab-open/blob/84ef0b3746d48f24a7b130ecce80c6409f579463/docs/FLH04_AUTHORITY_CONTINUATION_REVIEW.md)
enthält konkrete Fragen und erwartete Belege. Die Signaturprüfung ist
simuliert. Enrollment und Remote-Write bleiben gesperrt.
Der [isolierte CI-Lauf](https://github.com/joke0071/foliolab-open/actions/runs/45559424391)
bestand 1.732/1.732 Node-Tests und die bestehenden Outbox-, Recovery- und
Speicherprüfungen in Chromium, Firefox und WebKit. Der geprüfte gemeinsame
Stand `31d586319b708b122aea53e12d586d27bdaddd92` ist baumgleich mit dem Draft-Head.

## CI-Effizienz

Zeitmessung aus GitHub Actions ab `run_started_at` bis zum letzten
Pflichtjob vor Deployment. Jeweils erste Ausführung. Angaben gerundet
auf Sekunden, Zeiten außerhalb P1A aus Schrittzeit minus P1A-Bericht.

| Messgröße | [#428 PR seriell](https://github.com/joke0071/foliolab-open/actions/runs/45477599208) | [Main seriell](https://github.com/joke0071/foliolab-open/actions/runs/45481111315) | [#430 PR parallel](https://github.com/joke0071/foliolab-open/actions/runs/45481395180) |
| --- | ---: | ---: | ---: |
| Start bis Ende Pflichtstrecke | 19:06 | 26:34 | 21:11 |
| Letzter Pflichtjob | test | cross-engine (2) | cross-engine (2) |
| Start letzter Pflichtjob ab Run-Start | 0:42 | 0:13 | 0:21 |
| Chromium-Browserschritt | 17:33 | 17:02 | 16:41 |
| Chromium außerhalb P1A | 16:44 | 16:15 | 16:16 |
| Firefox/WebKit-Browserschritt, Shard 2 | 17:14 | 25:23 | 19:56 |
| Firefox/WebKit außerhalb P1A, Shard 2 | 15:46 | 22:55 | 18:37 |
| Shard 1 gesamte Jobzeit | 10:06 | 10:38 | 10:19 |
| Shard 2 gesamte Jobzeit | 17:58 | 26:21 | 20:50 |
| Shard 3 gesamte Jobzeit | 12:55 | 14:05 | 12:51 |

#428 und Main haben denselben Tree. Die serielle Spanne bis zum letzten
Pflichtjob beträgt 7:28. #430 liegt 2:05 über der PR-Referenz und 5:23
unter der Push-Referenz. Beide Änderungen überschreiten die gemessene
P1A-Differenz deutlich. GitHub meldet für die Shards `ubuntu-24.04`.
Die regulären Läufe enthalten keine vergleichbare CPU-/Speicherauslastung.
Aus getrennten Runnern und verschiedenen Events folgt kein kausaler
Gesamtvergleich.

Der [kontrollierte ABBA-Test aus #429](https://github.com/joke0071/foliolab-open/actions/runs/45480145717)
belegt 42–46 % Medianersparnis für P1A bei gleicher Fall- und Screenshotzahl.
Die Prüfung von #430 zeigt unveränderte fachliche Assertions in P1A,
getrennte Browserprofile, aggregierte Fehler als fehlgeschlagenen Lauf
und exakt zwei lokale Aktivierungen. Live läuft seriell. Die
[Wallet-CI](https://github.com/joke0071/foliolab-open/actions/runs/45481395351)
war nach 0:59 abgeschlossen und lag außerhalb des kritischen Pfads.
**#430 bleibt zurückgestellt.** Ein weiterer einzelner Kandidatenlauf
würde die zeitliche Streuung der Referenzen nicht auflösen. Nächster
aussagekräftiger Versuch wäre ein gepaarter Vergleich des ganzen lokalen
Pflichtpfads bei gleichen Runner-Bedingungen, mit gleicher Testliste,
Node-/Browser-Versionen und gesonderter Ressourcenmessung.

Der Mainlauf brauchte **68:22** bis Live-Abschluss. Im Livejob entfielen
11:10 auf Chromium und 28:24 auf Firefox/WebKit. Die Browserinstallation
lag bei 0:07 bzw. 1:14. Für weitere Releasebeschleunigung haben Messungen
innerhalb des Firefox-/WebKit-Liveblocks und außerhalb P1A in Shard 2
Vorrang vor Änderungen an Browserinstallation oder Wallet-CI. Für einen
Eingriff in die Live-Reihenfolge fehlt derzeit ein qualifizierter
Vergleich der gesamten Abnahme.

In den Shard-2-Logs umfasst der Import von `browser-reference-management.mjs`
auch Referenzentfernung und P1A. Direkt vor dem ersten P1A-Aufruf betrug die
Zeitspanne vom Importbeginn bis zum WebKit-Abschluss der
Referenzentfernung auf #430 68 s gegenüber 84 s auf Main und 56 s auf
#428. Der größte Teil der Schwankung außerhalb P1A liegt damit außerhalb
dieser zusammengefassten Referenzstrecke. Für einen gepaarten Vergleich
sollten die Zeitmarken der übrigen Browserprüfgruppen aus denselben
Joblogs mit ausgewertet werden.


## Ausgangsbefund vor Festlegung der Freigabewege

Die folgenden Zeilen dokumentieren die offenen Kriterien zum Übergabezeitpunkt. Für ihre Bearbeitung und die drei Produktentscheidungen gilt der Arbeitsplan oben.

Abgleich mit der [Roadmap](KONSOLIDIERTE_ROADMAP.md) auf Checkpoint
`74987389`. Die vorhandenen Teilnachweise sind für die bezeichneten Fälle
weiter verwendbar.

| Paket | Ausgeführt oder für die Abnahme verwendbar | Benötigter Eingang und nächster Schritt |
| --- | --- | --- |
| Drive / FLH04 | Modell und Reviewauftrag oben. Lokale Outbox-/Recovery-Belege vorhanden. | Unabhängiges Kryptografie-/Architekturreview, qualifizierter Aktualitätsnachweis, autorisierte Origin mit OAuth-Testkonto und zwei isolierte Geräte. Danach Wire- und Signaturbelege, bestätigter Write und unabhängiger Readback. |
| CI-Effizienz | Pflichtzeiten einschließlich Warte- und P1A-Anteilen ausgewertet. | Gepaarter Vergleich unter gleichen Runner-Bedingungen, sobald ein regulärer Vergleich die Schwankung außerhalb P1A einordnen kann. |
| TRUST01 | CSP-Vertrag auf Main lokal 7/7. HTTPS-Readback lieferte weder CSP-Header noch X-Frame-Options. Statische Meta-CSP und Live-Belege vorhanden. | Qualifizierter Host für HTTP-Frame-Schutz, natives Safari/VoiceOver mit beobachtetem ITP-Speicherverhalten, Originalzeichnung und Primärbeleg zur Rechtekette. |
| FIN-E2E01 | Synthetische Rücknahme-/Bestandsbelege und produktive Fixes vorhanden. | Konkretes Original der Rücknahme mit unabhängig ausgewiesenem Journal-, Kosten- und Cash-Sollwert. |
| FLH03 | Synthetische Bitpanda-Prüfung in Windows Chrome und Edge in [#350](https://github.com/joke0071/foliolab-open/pull/350). | Bitpanda-Stichtagswert und BCI25-Einzelaufstellung, separat generisches Trade-Republic-Original. |
| AT03 | Vorhandener unabhängiger Abgleichpfad für Cash-Salden. | Gebuchter Anfangs- und Endsaldo für dieselbe Periode und dasselbe Konto. |
| FLH05 | Import- und Wiederimportverträge wiederverwendbar. | Originalzeilen derselben Teilfüllung mit FX und Gebühren, unabhängig gebuchter Nettosollwert. |
| Verwaltung / Buchungsmutationen | Produktive Verwaltungs- und Mutationstests vorhanden. | Originalbuchung samt Gegenposition und erwartete Journal-, Kosten- und Flow-Werte. |
| ETH-HISTORY-CURSOR01 | Produktiver WETH-Teilnachweis auf SW329. | Privater Originalcursor mit zugehöriger Provider-Folgeantwort. |
| FLH03-18 | Ledger-/Staking-Importpfad und Vergleichsverfahren vorhanden. | Zusätzliche konkrete Ledger-/Stakingposition mit eigener Kontozuordnung und datiertem Endbestand. |
| Weitere Wallet-Abdeckung | Bestehende öffentliche und synthetische Wallet-Belege wiederverwendbar. | Datierter eigener Bestand mit Menge und nachvollziehbarer Finalität. |
| AT05 | Bestehender dokumentierender AT-Teilumfang. | Brokerjahresabrechnung, zugehörige OeKB-Daten und unabhängige fachliche Prüfung. |
| Barausgleich | Erwartete Belegfelder sind dokumentiert. | Abrechnung mit Bruchteil, Kosten, Auszahlungswährung und Steuerbasis. |
| UI-SENTIMENT01 | Darstellung und Offline-Cache in drei Browserengines mit Fixtures qualifiziert. | Zugelassener CMC-Abrufweg samt FolioLab-Zugang und CNN-Feed mit Anzeigerechten. |
| Speicher / Migration / Recovery | Lokale Datei-Restore-Abnahme sowie separater nativer Windows-Teilbeleg aus [#348](https://github.com/joke0071/foliolab-open/pull/348). | Repräsentative Altinstallation mit Testbestand und zweites autorisiertes Gerät für den geräteübergreifenden Fall. |
| Startperformance | [Android-Messprotokoll](PERF_ANDROID03_REAL_DEVICE_CHECKLIST.md) und gemischte synthetische Fixture vorhanden. | Benanntes physisches Android-Gerät mit Messzugriff, fünf Kalt-, Warm- und Offline-Starts mit demselben Bestand. |
| UI-Refresh | Mobile Navigation abgenommen, die drei Rubriken existieren. | Soll „Mehr“ Sprunglinks bekommen? Empfehlung: bestehende Gliederung. Bei Freigabe der Links Fokus, Zurück-Navigation, Entwurfserhalt und Datengleichheit prüfen. |
| Benchmark / Roadmap | Vorhandene Projektion und unabhängige Renditeprüfungen wiederverwenden. | Welche Reihe, Währung und Gewichtung gelten? Empfehlung für den ersten Vergleich: eine qualifizierte EUR-Gesamtrenditeserie mit 100 % Gewicht, sofern die Datenquelle freigegeben ist. Alternativ einen gewichteten Korb oder eine andere Basiswährung festlegen. Danach Überlappung und Renditen extern gegenprüfen. |
| Produktmaster | Release-Abnahme und bereits ausgelieferte Detailumfänge sind dokumentiert. | Öffentlichen Produktauftritt inklusive Umfang freigeben oder zurückstellen. Empfehlung: erst nach ausdrücklicher Freigabe des konkreten Auftritts veröffentlichen. |

Soweit dieselbe Brokerperiode passt, Finanzoriginale als ein Belegpaket
mit gebuchten Salden, relevanten Transaktionen und separat ermittelten
Sollwerten vorbereiten. Originale und Zugangsdaten ausschließlich im
dafür autorisierten Testkontext verarbeiten. Gerätezugänge lassen sich
für die jeweils passenden Recovery-, FLH04-, TRUST01- und
Performanceprüfungen koordinieren.

## PR-Entscheidungen

- **#428 integriert und live bestätigt.**
- **#427 Draft, Modell erweitert, lokale Tests und isolierte Pflicht-CI grün.** Unabhängiger Review
  und externe Abnahme bleiben offen.
- **#429 Messreferenz.** Der Versuchsworkflow gehört auf den isolierten Zweig.
- **#430 zurückgestellt.** Die Voraussetzung eines reproduzierbaren
  Vorteils im Pflichtpfad ist offen.
- **#348 und #350 Referenz für abgegrenzte Windows-QA.** Die QA-Zweige sind
  keine Produktintegration.
- **#161 historische FLH04-Designreferenz.** Die aktuelle Arbeit folgt
  dem isolierten FLH04-Zweig und dem Reviewstand aus #427.

## Durchführung der Freigabewege · 25.11.2026

Kandidat **SW339**, Main `8de635271c341d7462d4d33e5f268089c26da6d0`,
Tree `d80ec391347b9586e28b73389d193edec866bab3`. Der veröffentlichte
Service Worker stimmt beim erneuten Abruf bytegleich mit Main überein.
Die Heads von #427 und #430 entsprechen den zuvor geprüften Ständen.
Keine Produktdatei geändert.

### Broker und Originalbezüge

Die fünf [abgenommenen Kernfälle](FOLIOLAB_1_0_ORIGINAL_CORE_2026-11-18.md)
wurden gegen die offene Anforderung verglichen. Flatex und Bittr behalten
ihre bereits belegte Import- bzw. Rücknahmereichweite, Kraken den
Spotabgleich, Bitpanda den POL-Einzelfall und Ledger Live den zugeordneten
SOL-Eingang. Keiner dieser abgegrenzten Nachweise enthält die zusätzlich
gesuchte Kombination aus einem neuen Originalereignis, Teilfüllung und
separat gebuchtem Netto. Der separat abgelegte Kraken-Ledgerexport und die Kopie im Spotbeleg sind bytegleich. Die archivierte unabhängige Decimal-Quittung bestätigt 13/13 Spotmengen. Die verschachtelte private Projektfortsetzung und die zusätzlichen Restore-Quittungen wurden nach einschlägigen Artefakten eingeordnet. Dabei wurde kein zweiter Kraken-Orderexport für den Fall gefunden. Private Quellen bleiben außerhalb von GitHub.

| Paket | Fall und erwarteter Nachweis | Ist, Reichweite und nächste Voraussetzung |
| --- | --- | --- |
| Kraken / FLH05 | Ausführungs-ID je Teilfüllung, gemeinsame Order-ID, getrennte Gebührenwährung, FX-Richtung und separat ausgewiesenes Netto derselben Ausführung. | Abgeglichen wurden 1.499 Ledgerzeilen mit 229 Trade-Referenzgruppen und der separat exportierte Spot-Stichtag. Alle 229 Gruppen haben je drei Ledgerzeilen. Ledger-ID, gemeinsame Ausführungsreferenz, EUR-/USD-Werte, Gebührenfelder und laufende Ledger-Salden sind vorhanden. Der konkrete Export enthält keine `ordertxid`. Der eigenständige Spotexport enthält Assetmengen und USD-Bewertungen zum Stichtag, keine Netto-Orderabrechnung. USD-Bewertungen und aus Bewegungen errechnete Nettowerte ersetzen keinen separat gebuchten Nettobetrag. Das öffentliche [Kraken-Exportfeldschema](https://support.kraken.com/articles/360001184886-how-to-interpret-trades-history-fields) bestätigt die Trennung von Ausführungs- und Order-ID. Das [Kraken-Illustrationsbeispiel](https://support.kraken.com/gb/articles/115000302707-differences-between-ledger-and-trades-history) erklärt die Gebührenfelder an einem EUR-Einzelfill. Für FLH05 fehlt weiterhin eine zweite Quelle, die dieselbe Fremdwährungs-Teilfüllung samt Netto belegt. |
| FIN-E2E01 und Verwaltung / Buchungsmutationen | Eine zusätzliche Rücknahmeklasse mit vorab unabhängigen Sollwerten für Gegenposition, Journal, Kostenbasis, Flows und wiederhergestellten Bestand. | Die Kernfälle und Kraken-Belege ergeben keinen neuen Fall mit diesen Sollwerten. Bestehende Freigaben bleiben gültig. Für einen neuen Import-, Rücknahme-, Undo- und Restore-Lauf zuerst das passende Originalpaar und den Sollzustand festschreiben. |
| AT03 | Gebuchter Anfangs- und Endsaldo desselben Kontos, derselben Währung und derselben Periode. | Der Kraken-Spotexport liefert einen unabhängigen Endstichtag. Die frühere Öffnung ist bei den betroffenen EUR- und BTC-Strömen aus Ledgerbewegungen abgeleitet. Die Flatex-Ansichten wiederholen denselben gebuchten Saldo. Der Bitpanda-Nachtrag deckt einen anderen Stichtag ab. Der unabhängige Kraken-Spotabgleich bleibt gültig. Für die Zusatzfreigabe fehlt eine zweite belegte Periodengrenze desselben Kontos. |
| FLH03 / Bitpanda und Trade Republic | Eigenständiger Cash-Bestand und datierte Stückzahlen der einzelnen BCI25-Komponenten für den PDF-Quartalsstichtag. Für TR passender regionaler Export plus separate Abrechnung. | Quartalsauszug, späterer Nachtrag und vorhandener Trade-CSV geprüft. Die BCI25-Zuordnung im Quartalsauszug weist keine separat abgestimmten Stückzahlen je Komponente aus. Der spätere Cash-Beleg deckt den Quartalsstichtag nicht ab. Die abgenommene POL-Reward bleibt der belegte Originalumfang. Das [österreichische TR-Hilfezentrum](https://support.traderepublic.com/de-at/267-Wie-erhalte-ich-einen-Depotauszug-und-meine-Jahressteuerbescheinigung) beschreibt den PDF-Kontoauszug. Ein veröffentlichter, passender CSV-Export mit der separaten Abrechnung derselben Buchung wurde dabei nicht belegt. Persönlicher TR-Bezug bleibt `NOT_APPLICABLE`. |

### Neue Prüfresultate auf SW339

[Maschinenlesbarer Prüfnachweis](release-evidence/sw339-roadmap-followups-2026-11-25.json).

| Paket / Prüfpfad | Erwartet | Tatsächlich erreicht und verbleibende Grenze |
| --- | --- | --- |
| UI-Refresh · „Mehr“ | Alle drei Bereiche auf schmalem Layout per Tastatur erreichen. Fokus sichtbar zwischen festen Leisten, Rückweg nutzbar und Entwurf nach abgelehntem Verwerfen erhalten. | Chromium 141.0.7390.37 mit Tab und Firefox 142.0.1 mit Umschalt+Tab erreichten die drei primären Bedienelemente bei 320 px sowie bei 640 px mit CSS-Vergrößerung 200 %. Kein horizontaler Dokumentüberlauf. Der Anbieterentwurf blieb nach abgelehntem Escape erhalten. Nach bestätigtem Verwerfen ging der Fokus zum Auslöser. „Übersicht“ und erneutes „Mehr“ funktionierten mit Tastatur, vollständiger IndexedDB-Datensatz blieb gleich. Vorwärtsnavigation ab letzter mobiler Navigationstaste erreichte im Firefox-Headless-Versuch den Inhalt nicht. Der Rückwärtsweg funktionierte. System-/Browserzoom wurde nicht positiv bestätigt und WebKit konnte wegen fehlender GTK-/Medienbibliotheken in dieser Umgebung nicht starten. Drei Bereiche beibehalten. Freigabe für den gemessenen Teilumfang, vollständige Zeile noch offen. |
| Speicher / Migration / Recovery | Historische App installieren, 10.000 Buchungen über alte UI wiederherstellen, auf derselben HTTPS-Origin mit offenem Alt-Tab aktualisieren und exakte Daten nach frischem Prozess offline wiederlesen. | Chromium 141.0.7390.37, SW321 `e272297ab1ba855a2922c1faa4010b83c558a796` → SW339. Die [synthetische Projektfixture](perf-evidence/2026-11-01/android03-v251/seed-10000.json.gz) hat SHA-256 `963bbc09f00bb1354e496f3ed0dddb4dcaebde34666d2ad6aba394bcfa6baea2`. Nach Restore in der alten UI waren 19 Positionen, 10.000 Buchungen und 1.825 Stichtage geladen. Der SW wechselte auf Cache v339, die alte Dokumentinstanz war beim Wechsel noch offen. Im neuen Tab und nach vollständigem Prozessende bei Offline-Start stimmten der vollständige gelesene IndexedDB-Datensatz und die angezeigte Summe exakt mit SW321 überein. Damit ist der lokale 10k-HTTPS-Wechsel für diesen Versionspfad belegt. Ein inkompatibler Writer, OS-Eviction und ein zweites physisches Gerät sind davon unabhängig. |
| Benchmark / Roadmap · 100 % VWCE | ISIN, MIC, Währung und Ausschüttungsbehandlung prüfen. Kurzer Reihenabgleich, gleicher Startwert, unabhängige Renditeberechnung und ehrliches Verhalten bei Datenlücken. | [Vanguard](https://fund-docs.vanguard.com/FTSE_All-World_UCITS_ETF_USD_Accumulating_9679_EU_INT_EN.pdf?tipo-di-prodotto=fondo-comuni) bestätigt IE00BK5BQT80, Deutsche Börse, VWCE, EUR und thesaurierende Anteilklasse. [Morningstar](https://www.morningstar.com/etfs/xetr/vwce/historical-data), [Yahoo Finance](https://uk.finance.yahoo.com/quote/VWCE.DE/history/) und [Twelve Data](https://twelvedata.com/markets/762896/etf/xetr/vwce/historical-data) zeigen übereinstimmende Xetra-Schlusskurse für fünf Handelstage vom 9. bis 13.11.2026. Unabhängige Decimal-Rechnung ab Startwert 100 ergab **101,45741250**. Der Produkt-TWR eines synthetischen Portfolios auf gemeinsamen Start-/Endtagen ergab beim erwarteten **+3,5 %** denselben Wert bis auf Gleitkommarundung. Bei fehlender Endbewertung oder eingelegtem externen Cashflow gab die bestehende Produktfunktion vertragsgemäß `null` aus. Damit sind Instrumentidentität, Kurzstichprobe und Vergleichsrechnung belegt. Eine vollständige kapitalmaßnahmenbereinigte Historie, Rechte für den konkret genutzten Serienfeed und der Vergleich bei externen Flows bleiben offen. Die [Börsenbedingungen](https://console.marketplace.deutsche-boerse.com/assets/GTC_Marketplace.pdf) binden historische Datenlizenzen an das jeweilige Paket und den vereinbarten Umfang. Sichtbare Kursseiten sind keine FolioLab-Lizenz. |

### Weitere Freigabegrenzen

- **FLH04.** Der [isolierte grüne Reviewstand](https://github.com/joke0071/foliolab-open/pull/427),
  sein Reviewauftrag und die getrennten Abnahmebedingungen bleiben maßgeblich.
  Die verfügbare Projektspur enthält bisher keine unabhängige Freigabe,
  autorisierte OAuth-Sitzung oder bestätigte Zwei-Geräte-Schreibabnahme.
- **CI-Effizienz.** Der vorhandene #430-Kandidat bleibt auf seinem
  Messstand. Es gab in diesem Durchlauf keinen fachlich erforderlichen
  Produkt-PR mit regulärer Pflichtstrecke. Das nächste Paar muss denselben
  vollständigen Pflichtpfad auf gleicher Runnerklasse messen.
- **Startperformance und TRUST01.** Das lokale Linux-Profil liefert den
  isolierten Migrationsbefund. Es liegt kein verwendbarer physischer
  Android- oder nativer Safari-/VoiceOver-/ITP-Zugang für die verbleibenden
  Fälle vor. Der separate Rechte- und Headerumfang aus dem
  [TRUST-Inventar](K6_TRUST_GRAPHIC_PROVENANCE_V316_2026-11-15.md) bleibt offen.
- **ETH-HISTORY-CURSOR01.** Neue allgemeine Zwei-Seiten-Probe am öffentlichen
  [USDC-Vertrag auf Ethereum](https://eth.blockscout.com/address/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48).
  Erwartet waren unveränderte Weitergabe der beiden Providerfelder
  `index` und `block_number`, keine Überschneidung und ein fortschreitender
  Blockbereich. Der SW339-Validator akzeptierte beide Tokens. Blockscout
  lieferte 50 + 50 eindeutige Log-Identitäten ohne Überschneidung. Die
  beiden Randlogs am Seitenwechsel wurden über Routescan anhand Blockhash,
  Blocknummer, Log-Index und Tokenvertrag in den On-chain-Receipts bestätigt.
  Antwort-SHA-256 `caa51612afba792d8b8109da173730e1af869311bce08b9d82d12f75df29626f`
  und `8206adfb03b680f5a29d224c83161b868c35291f7fd86c7679766ef8263044df`.
  Letzte Blocknummern je Seite 26.349.235 und 26.218.104. Der höchste
  enthaltene Block 26.487.387 liegt vor dem unabhängig per Routescan
  gelesenen finalisierten Block 26.491.356. Die 22
  ETH-History-Tests auf SW339 bestanden, einschließlich unterbrochener,
  zyklischer und ungültiger Cursor. Dieser Teilnachweis belegt den
  allgemeinen Übergang zwischen zwei Seiten. Der private ursprüngliche
  Cursor mit Antwortpaar bleibt offen.
- **FLH03-18 und weitere Wallets.** Der zugeordnete SOL-Brückenfall
  bleibt gültig. Für eine private Erweiterung fehlt eine weitere
  datierte Position mit belegter Kontozuordnung und unabhängig gelesenem
  Endbestand. Zusätzliche Netzwerke brauchen jeweils einen benannten
  finalisierten Prüffall.
- **AT05 und Barausgleich.** Nur eine zum Ereignis passende
  Brokerabrechnung mit separater Referenzrechnung kann die Zusatzfreigabe
  tragen. Für AT05 gehört die unabhängige Fachprüfung dazu. Ein
  Emittentenereignis allein liefert keine individuelle Steuerbasis.
- **UI-SENTIMENT01.** Vorhandene Fixture-Abnahme für Darstellung und Cache
  bleibt gültig. Für CMC und CNN fehlt weiterhin der zugelassene
  Produktabruf mit belegtem Anzeigeumfang.
- **Produktmaster.** Öffentlicher Auftritt laut Arbeitsentscheidung
  zurückgestellt. Die vorhandene 1.0-Produktabnahme gilt für ihren
  dokumentierten Appumfang. Eine interne Textvorschau mit synthetischem
  Portfolio, CSV-Vorschau, Verlauf und Backup wurde privat abgelegt. Die
  Aussagen sind am SW339-Funktionsumfang und der 1.0-Abnahme gespiegelt.
  Eine visuelle Freigabe und Veröffentlichung bleiben zurückgestellt.

**Stand der Zeilenabnahme: 6/6 Kernbereiche und 10/29 Folgepakete.**
Die neuen Ergebnisse buchen Teilumfänge. Die ausstehenden Kriterien der
betroffenen Zeilen bleiben erhalten.

### Nachtrag · Flatex-Originalfelder und öffentlicher AT05-Abrechnungsfall

- **AT03 und FLH05.** Die zwei vorhandenen Flatex-Original-CSV-Dialekte
  wurden separat eingelesen. Der Kontoexport enthält Betrag, Währung und
  Transaktionsreferenz. Gebuchte Anfangs-/Endsalden oder laufende
  Salden stehen nicht in den Originalspalten. Der Depotexport enthält
  Stückzahl, Kurs und Transaktionsreferenz. Die ZIP-Belege ergänzen
  CSV-Varianten, aber keine separate Abrechnung mit je Teilfüllung
  belegter FX-Richtung und gebuchtem Netto. Daher bleibt die konkrete
  Salden- bzw. Ausführungslücke bestehen.
- **AT05 Teilabnahme für gebuchte Steuer.** Der veröffentlichte
  [Flatex-Fall zum Fonds IE00BNG8L278](https://www.broker-test.at/steuern/fondsthesaurierung/)
  verknüpft eine Brokerabrechnung mit der OeKB-Jahresmeldung vom
  17.01.2022 und einer getrennten Erläuterung. Vor dem Produkttest aus
  dem veröffentlichten KESt-Abzugswert je Anteil, Stückzahl und
  Abrechnungs-FX mit Python Decimal **27,22 EUR** berechnet. Die
  Anschaffungskostenkorrektur ergab als separate Gegenrechnung
  **4,7465 EUR je Anteil** aus dem angegebenen Einstandswert und der
  veröffentlichten Korrekturrate. Der Produktversuch auf SW339 buchte
  den vorab festgelegten Steuerbetrag in ein synthetisches EUR-Konto.
  Ist: genau ein Journalvorgang, Cash **72,78 EUR** ausgehend von 100 EUR,
  Jahresansicht und Jahressumme **−27,22 EUR**, identischer Bericht nach
  portablem Backup/Restore. Der belegte Umfang ist die Wiedergabe
  einer vorgegebenen gebuchten Steuer. Die
  [historische OeKB-Meldung](https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=IE00BNG8L278)
  lieferte im Abruf keine lesbaren Primärdaten. Jahresabrechnung,
  unabhängige OeKB-Primärzusammenführung und automatischer
  Anschaffungskostenabgleich bleiben für die vollständige Zeile offen.
- **Barausgleich.** Die fünf Vertragsregressionen für Kapitalmaßnahmen
  und Fremdwährung auf SW339 bestanden. Positiv übergebener
  Barausgleich wird bei Split, Swap und Fusion atomar abgelehnt.
  Der geforderte Abrechnungsfall für eine automatische Zuordnung bleibt
  ohne belegte Nettoauszahlung samt Steuerbasis offen.

## Fortsetzung ab Checkpoint `c6a5578` · 25.11.2026

Vor der Arbeit abgeglichen: Main `8de63527`, Arbeitszweig
`feature/flh05-import-foundation` auf `c6a5578`, Draft #427 auf
`84ef0b37`, #430 auf `5c2d7aca`. Die vier Stände waren seit dem
Checkpoint unverändert. Für #427 lagen keine eingereichten Reviews oder
Reviewthreads vor.

### UI-Refresh · „Mehr“

- **Soll und Ausgangsbefund.** Bei sichtbarem Firefox 142.0.1 und
  585 × 770 CSS-Pixeln stand der Fokus auf der letzten mobilen Taste
  „Mehr“. Nach `Enter → Tab` zeigte der X11-Mitschnitt den Fokus auf
  „Firefox View“ in der Browserleiste. Im Dokument blieb „Mehr“ als
  letzter aktiver Knoten gespeichert.
  [SW339 im sichtbaren Firefox](release-evidence/sw340-firefox-focus/sw339-after-tab.png).
- **Korrektur und Gegenprobe.** [SW340, PR #431](https://github.com/joke0071/foliolab-open/pull/431)
  setzt die feste Mobilnavigation im DOM zwischen Kopfzeile und Hauptinhalt.
  Auf dem [Kandidaten d20f202a](https://github.com/joke0071/foliolab-open/commit/d20f202a104fbf2a90c5c0c03f5c2f7c9671f5ca)
  geht der Fokus nach derselben Tastenfolge an „App installieren“, bei
  ausgeblendeter Installation an „+ Konto“. Umschalt+Tab führt zurück
  zu „Mehr“. Die bestehende Pflichtprüfung enthält den Übergang bei
  320 und 390 px. Syntax und 1.533 Node-Tests lokal bestanden.
  [SW340 im sichtbaren Firefox](release-evidence/sw340-firefox-focus/sw340-after-tab.png).
- **Drei Rubriken.** Firefox mit OS-Tastatur bei 450 CSS-Pixeln und bei
  echtem Browserzoom 200 % bestand Vorwärts- und Rückweg. Der Browserzoom
  wurde mit sechs Vergrößerungsschritten von 100 % auf 200 % gesetzt:
  640 → 320 CSS-Pixel, DPR 1 → 2 und CSS-Zoom 1. Chromium 141 und WebKit
  26 bestanden bei 320 px und separat bei CSS-Zoom 200 % auf 640 px.
  Alle drei primären Bedienelemente zeigten sichtbaren Fokus zwischen den
  Leisten. Abgelehntes Verwerfen erhielt den Entwurf, bestätigtes
  Verwerfen stellte den Fokus zum Auslöser wieder her. „Übersicht“ und
  erneut „Mehr“ funktionierten per Tastatur. Der vollständige gelesene
  IndexedDB-Datensatz war vor und nach jedem Fall identisch.
- **Abnahme.** Die drei bestehenden Rubriken sind als Standard bestätigt.
  [Integration](https://github.com/joke0071/foliolab-open/actions/runs/45617054520),
  [Wallet-CI](https://github.com/joke0071/foliolab-open/actions/runs/45617054505)
  sowie Main, Pages und der [Drei-Engine-Live-Wiederanlauf](https://github.com/joke0071/foliolab-open/actions/runs/45620573232/job/139241875358)
  bestanden auf baumgleichem Produktstand. Die UI-Refresh-Zeile ist
  abgenommen. Der bestehende CSS-Nachweis auf SW339 bleibt separat erhalten.
  [Messwerte](release-evidence/sw340-roadmap-ui-at05-2026-11-25.json).

### AT05 · OeKB-Original und zugehörige Flatex-Abrechnung

Im [öffentlichen OeKB-Portal](https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=IE00BNG8L278)
wurde über die Meldungsnavigation die finale Jahresmeldung **343333** vom
**17.01.2022** für **IE00BNG8L278** geöffnet. Die Originaltabellen in USD
je Anteil lieferten 0,0197 ausschüttungsgleichen Ertrag, 0,0018 anrechenbare
Quellensteuer, 0,0036 im Steuerabzug erhobene KESt (Position 12) und 0,0171
Anschaffungskostenkorrektur (16.4). Der USD-Quellensteuerbetrag ist in
Position 12.4 bereits als Abzug erfasst.

Das unabhängig festgelegte Soll aus der [Flatex-Abrechnung und dem
Depotumsatz](https://www.broker-test.at/steuern/fondsthesaurierung/) war
27,22 EUR Steuer, 112,88 USD steuerpflichtiger Ertrag und 4,7465 EUR
korrigierter Einstand je Anteil. Mit 8.622,7 Anteilen und 1,14030 USD/EUR
ergab Decimal aus dem Original alle drei Werte. Der Zuwachs je Anteil
beträgt 0,01499605367 EUR. Der Listenpunkt im Artikel zeigt für den
ausschüttungsgleichen Ertrag abweichend 0,197 USD, während OeKB und
Fließtext 0,0197 USD ausweisen. Die Buchung und der Restore waren bereits
auf SW339 bestätigt. Damit ist der Bezug zwischen Originalmeldung,
Einzelabrechnung und Einstandskorrektur hergestellt. Die
Brokerjahresabrechnung, die unabhängige Fachabnahme derselben
Jahreszusammenführung und der automatische Produktabgleich der
Anschaffungskosten bleiben offen.
[Originalfeld-Codes und Prüfsummen](release-evidence/sw340-roadmap-ui-at05-2026-11-25.json).

**Zeilenabnahme zu diesem Stand: 6/6 Kernbereiche, 10/29 Folgepakete.**

### Speicher und Recovery · inkompatibler SW88-Writer

Der historische [SW88-Stand 58c8aab6](https://github.com/joke0071/foliolab-open/commit/58c8aab6ce93d605cae6e4f2dd8cb7f7bf8d3128)
und SW339 liefen auf getrennten Pfaden derselben isolierten HTTPS-Origin
in Chromium 141. Der alte Tab legte vor dem Cutover erfolgreich einen
synthetischen Anbieter über die Oberfläche an. Dieser Tab blieb
durchgehend offen. SW339 stellte ausdrücklich auf IndexedDB um und
spielte die vorhandene 10k-Fixture über die Backup-Oberfläche ein.

Unabhängiges Soll nach dem erneuten Speicherversuch aus dem
localStorage-Modus: Revision 2, 10.000 Buchungen und 10.000
Journalvorgänge unverändert, einschließlich aller IndexedDB-Stores
mit ihren Schlüsseln und der eingefrorenen localStorage-Kopie.
Die alte UI wies die Änderung mit einem Hinweis auf den anderen Tab
zurück. Ein zusätzlicher direkter Aufruf des unveränderten historischen
Speicheradapters wies sie mit „IndexedDB ist in einem anderen Tab
aktiv“ zurück. Soll und Ist stimmen vollständig überein.
Der Altwriter-Teil ist für diesen Cutover belegt. Beobachtete
OS-Speicherbereinigung und Wiederherstellung auf einem zweiten
autorisierten physischen Gerät bleiben separat offen.
[Prüfnachweis](release-evidence/sw339-incompatible-writer-2026-11-25.json).

### Benchmark · unabhängiger Ein- und Auszahlungsfall

Der [PortfolioAnalyst-Referenzfall von Interactive Brokers](https://www.interactivebrokers.com/images/common/Statements/MWR-TWR_white_paper.pdf)
auf Seite 3 enthält eine Auszahlung von 225.000 USD und eine Einzahlung
von 81.500 USD jeweils am Tagesbeginn sowie fünf Vor- und Endwerte.
Das veröffentlichte Soll ist 0,14 %. Die unabhängige Verknüpfung mit
ganzzahligen Cent-Brüchen ergibt **0,139931612453 %**. FolioLabs
`twr`-Funktion liefert bei denselben bereits flowbereinigten
Teilperiodengrenzen **0,139931612453 %**. Auf Portfolioebene liefert SW339
mit Tagesstichtagen und externem Ab- bzw. Zufluss vertragsgemäß `null`.
Der Snapshot-Vertrag enthält keine belegte Bewertungsgrenze unmittelbar
vor und nach dem Flow. Das gilt einzeln für Einzahlung und Auszahlung.
[Prüfnachweis](release-evidence/sw339-ibkr-twr-flow-2026-11-25.json).

Für VWCE sind [Instrument, Notierungsdatum und Anteilsklasse](https://global.vanguard.com/private-anleger/anlageprodukte/etf/aktien/9679/ftse-all-world-ucits-etf-usd-accumulating)
bestätigt. EODHD beschreibt eine split- und ausschüttungsbereinigte
Schlusskursreihe sowie eine gesonderte Lizenz für externe
Darstellung. Twelve Data dokumentiert Xetra-Such- und EOD-Abdeckung,
externen Anzeigeumfang nach Vertrag und zusätzliche Börsenfreigaben.
Die öffentlichen Yahoo-Finance-Datenangaben schließen Weitergabe aus.
Die Xetra-Open-Data-Reihe ist laut Anbieter eingestellt und für
nichtkommerzielle Zwecke lizenziert. Diese Wege qualifizieren derzeit
keine vollständige kapitalmaßnahmenbereinigte EUR-Reihe für die
konkrete FolioLab-Anzeige. Die fünftägige Stichprobe bleibt der belegte
Marktdatenumfang. Für die Zeilenabnahme fehlen die nutzbare lizenzierte
Reihe und ein belegter Produktpfad für Bewertungen an Flow-Grenzen.
[EODHD-Methodik](https://eodhd.com/help/methodology) ·
[EODHD-Lizenz](https://eodhd.com/help/commercial) ·
[Twelve Data](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage) ·
[Yahoo](https://uk.help.yahoo.com/kb/SLN2352.html) ·
[Open Data](https://registry.opendata.aws/deutsche-boerse-pds/).

### Broker und Buchungsverwaltung · gebuchte Salden und EUR-Abgänge

Der in der Portfolio-Performance-Testsammlung veröffentlichte,
anonymisierte [Trade-Republic-Kontoauszug 24](https://github.com/portfolio-performance/portfolio/blob/024294dd4a7f58aa6b9417126a3f56cb1cc622ab/name.abuchen.portfolio.tests/src/name/abuchen/portfolio/datatransfer/pdf/traderepublic/Kontoauszug24.txt)
weist einen gebuchten EUR-Anfangssaldo von 10.361,85 und einen
gebuchten Endsaldo von 7.324,06 für dasselbe Konto aus. Die drei
gebuchten Abgänge vom 29.–31.12.2024 betragen 18,94, 3.000,00 und
18,85 EUR. Unabhängige Cent-Rechnung und im Dokument ausgewiesene
Zwischensalden stimmen auf allen drei Stufen überein. Der Beleg wurde
für den Test manuell in das generische FolioLab-CSV-Schema übertragen.
Veröffentlicht werden nur Prüfwerte und Quellverweis.

- **AT03.** Auf SW339 in Chromium stimmen beide Anker im
  Kontostandsdialog. Die CSV-Vorschau blieb schreibfrei. Der reguläre
  Import speicherte drei Journale mit gleichem Gegenbetrag für das
  externe Clearing und drei externe Flüsse. Der entstandene
  Stichtagsbezug sperrt die isolierte Rücknahme. Abgebrochenes
  Import-Undo ließ den ganzen Datensatz gleich, bestätigtes Undo
  stellte den exakten Stand vor Import wieder her. Der generische
  EUR-Abgleich ist belegt. Persönliche Konto- und Periodenabnahme
  benötigt weiterhin ihr direkt ausgewiesenes Saldenpaar.
- **FIN-E2E01.** Die bestehende Importfunktion wurde zusätzlich in
  einem isolierten Bestand ohne spätere Beobachtung verwendet. Soll
  bei Wegfall des letzten EUR-Abgangs: 7.342,91 EUR, zwei Flüsse und
  die Journal-Gegenposition der zurückgenommenen Buchung im
  Änderungsbeleg. Alle Werte stimmten. Ein konkurrierender Tab speicherte während der
  geöffneten Rücknahmevorschau eine neue Revision. Der veraltete
  Submit wurde abgelehnt und ließ den vollständigen gewinnenden
  IndexedDB-Datensatz exakt gleich. Undo und frischer portabler
  Restore stellten die bestätigten Portfolio-Bytes wieder her.
  Abgedeckt ist der belegte EUR-Geldabgang. Eine neue Rücknahme mit
  unabhängig prüfbarer Wertpapierkostenbasis bleibt offen.
- **Verwaltung.** Dieselbe EUR-Buchung war im isolierten Bestand über
  die reguläre Verwaltungsoberfläche auswählbar. Abbruch erhielt
  Revision und Bytes. Die bestätigte Einzelrücknahme schrieb genau
  eine Revision. Der Import derselben Identität blieb gesperrt. Die
  bestehende Sperre mit späterem Kontrollpunkt war sowohl nach
  regulärem Import als auch mit separat gesetztem Abschlussstichtag
  wirksam. Umfang: Abbruch, EUR-Rücknahme, Schutz mit Kontrollpunkt,
  genaues Undo und Wiederimportsperre. Die wertpapierbezogene
  Verwaltung mit unabhängig belegter Kostenbasis bleibt offen.
- **FLH05.** Die neue Belegart zeigt EUR-Kontoabgänge. Eine nach
  gemeinsamer Order-ID belegte Fremdwährungs-Teilfüllung samt separater
  Nettoabrechnung wurde damit nicht qualifiziert.
- **FLH03.** In derselben öffentlichen Testsammlung liegen sechs
  native [Trade-Republic-CSV-Fälle](https://github.com/portfolio-performance/portfolio/tree/024294dd4a7f58aa6b9417126a3f56cb1cc622ab/name.abuchen.portfolio.tests/src/name/abuchen/portfolio/datatransfer/traderepublic)
  mit Handels-/Cashkategorie, Originalwährung und Transaktions-ID.
  Für den generischen Regionalfall bleibt die Zuordnung derselben
  CSV-Transaktion zur separaten Abrechnung offen. Die drei
  Kontoauszugsabgänge belegen den manuellen generischen CSV-Pfad.
  Der persönliche TR-Fall bleibt `NOT_APPLICABLE`.

[Prüfnachweis](release-evidence/sw339-at03-public-statement-2026-11-25.json).

### Weitere Wallet-Abdeckung · NEAR-Präzisionsgrenze

SW339 fragte über den realen Produktadapter bei FastNear jeweils den
finalisierten Kontostand von `aurora` und `figment.poolv1.near` ab.
Der zweite öffentliche NEAR-RPC lieferte dieselben Beträge und
Sperrbestände an den identischen Blockhashes. Soll war die exakte
Dezimaldarstellung der YoctoNEAR-Beträge. Beide Konten enthalten
Beträge, die mehr als 18 Nachkommastellen benötigen. SW339 wies beide
mit der ausdrücklich ausgewiesenen Präzisionsgrenze zurück. Für die
betroffenen Daten gab es keine importierbare Position. Der Befund
bleibt eine Produktgrenze bis zu einer exakt nachweisbaren Behandlung
dieser Präzision im bestehenden Mengen- und Journalvertrag.
Externe Delegationen, Rewards und privates Eigentum sind eigene Kriterien.
[NEAR-RPC-Referenz](https://docs.fastnear.com/rpc/account/view-account) ·
[Blockreferenzen und Prüfnachweis](release-evidence/sw339-near-final-precision-2026-11-25.json).

### Weitere Originalanforderungen

- **ETH-Cursor und FLH04.** Der aktuelle private Restnachweis bestätigt
  die öffentliche Mehrseitenabnahme und dokumentiert das weiterhin
  fehlende private ursprüngliche Antwortpaar. #427 hat weiterhin
  keinen unabhängigen Review. Enrollment und Remote-Write bleiben
  bis zur konkreten Sicherheitsfreigabe und autorisierten
  Zwei-Geräte-Abnahme gesperrt.
- **Barausgleich.** Der [Citigroup-Emittentenfall](https://www.citigroup.com/rcs/citigpa/akpublic/storage/public/tap_tax_basis.pdf?ieNocache=165)
  enthält Stückbruchteile, Beispielauszahlungen und zugeordnete
  US-Steuerbasis. Er eignet sich als Rechenvergleich, enthält
  jedoch keine unabhängige tatsächliche Brokerabrechnung desselben
  Vorgangs mit Kosten und Auszahlungs-FX. Für die Produktfreigabe
  bleibt diese Kombination erforderlich.
- **Geräte und Vorschau.** Der bereits autorisierte Geräteumfang
  liefert weiterhin kein verfügbares physisches Android-Projektgerät
  mit Messzugriff und keine native Safari-/VoiceOver-/ITP-Sitzung.
  Android Device Streaming verlangt einen autorisierten
  [Firebase-/Cloud-Projektzugang](https://developer.android.com/studio/run/android-device-streaming).
  Die interne Produktvorschau ist fertig. Öffentliche Bewerbung bleibt
  gemäß Arbeitsentscheidung zurückgestellt.

### Weitere Wallet-Abdeckung · Cosmos Hub

Am finalisierten Block **34.042.495** von `cosmoshub-4` bestätigten
Cosmos Directory, PublicNode und Polkachu denselben Blockhash und
dieselbe Antwort für das öffentliche Selbstdelegationskonto des
Validators Kraken03. Jeder Kontoreadback bestätigte die angeforderte
Blockhöhe. Das vorab aus den Rohbeträgen berechnete Soll war
**9,995 ATOM frei, 1 ATOM delegiert, 0 ATOM in Unbonding**. Der echte
SW339-Adapter lieferte die ersten beiden Positionen einzeln, keinen
Unbonding-Eintrag und den Hinweis auf unvollständige Reward- und
Assetabdeckung. Geprüft ist dieser öffentliche Zustand. Private
Zuordnung, ein positiver Unbonding-Fall und Rewards bleiben offen.
[Cosmos-Staking-Referenz](https://github.com/cosmos/cosmos-sdk/blob/main/x/staking/README.md) ·
[Block und Prüfnachweis](release-evidence/sw339-cosmos-final-balance-2026-11-25.json).

**TRUST01.** Der erneute HTTP-Readback der ausgelieferten Origin
bestätigt weiterhin Antwortstatus 200 ohne HTTP-CSP- und
X-Frame-Options-Header. Der vorhandene Meta-CSP-Beleg und das getrennte
PNG-Reproduktionsprotokoll behalten ihren Umfang. Für die ausstehende
Teilabnahme fehlen ein autorisierter Auslieferungspfad mit wirksamen
HTTP-Headern, natives Safari/VoiceOver/ITP und der Primärnachweis zur
ursprünglichen Zeichnung.

### SW340 · auf Main integriert

[PR #431](https://github.com/joke0071/foliolab-open/pull/431) bestand
die Pflichtintegration einschließlich aller drei Browser-Shards
und den separaten Wallet-Lauf. Der gemeinsame Prüfstamm
`dda5be4ca1d49c6e40712a9c11114408adf2adbd` und der integrierte Main
`7adbf028ff407df2c48f5c8e2e788ed10e8573f0` haben denselben Tree
`09ce84403c8d79be0b077ad33d5ae7fa8e7568a2`. Der [Main-, Pages- und
Live-Lauf 45620573232](https://github.com/joke0071/foliolab-open/actions/runs/45620573232)
läuft. Gezählt sind weiterhin 10/29 Folgepakete.

### Cosmos Hub · positiver Unbonding-Fall

Für die erfolgreiche öffentliche Undelegation im Block **34.042.462**
bestätigt das Ereignis `unbond` **3.487.930 uATOM**. Der
Transaktionsauftrag enthält 3.487.931 uATOM. Im nachfolgenden
finalisierten Block bestätigten alle drei Knoten den Ereignisbetrag
als aktuellen Unbonding-Bestand. FolioLab lieferte **3,48793 ATOM
in Freigabe**, separat von **6,984256 ATOM** Bankguthaben und ohne
verbleibende Delegation. Damit ist auch eine positive Unbonding-Menge
im öffentlichen Adapterpfad belegt. Rewards und die private
Kontozuordnung bleiben offen.
[Prüfnachweis](release-evidence/sw339-cosmos-final-unbonding-2026-11-25.json).

### TRUST01 · lizenzierter Kolbenersatz für die Prüfung

Für die offene ursprüngliche Kolbenzeichnung liegt ein Ersatzkandidat
auf Basis des [Lucide-Kolbens](https://lucide.dev/icons/flask-conical)
aus dem gepinnten [Upstream `f12b0de1`](https://github.com/lucide-icons/lucide/tree/f12b0de177fbc2a6795e99be065887e72b237123)
vor. Das unveränderte Upstream-SVG und sein vollständiger Lizenzhinweis
liegen bei. Die lokale Ableitung verwendet die bestehende Farbpalette
und exportiert transparente PNGs in 192 und 512 px und ein opakes
maskierbares PNG in 512 px. Zwei unabhängige Renderläufe in Chromium
141 verglichen die drei PNGs bytegenau. Der Kantenradius des
Vordergrunds der maskierbaren Fassung lag bei **132,21 px** innerhalb
der 204,8-px-Sicherheitszone. Die Kandidatendateien liegen auf dem
Arbeitszweig als Beleg. Die weiteren Grafikgruppen, native
Safari-/VoiceOver-Prüfung und HTTP-Framingschutz bleiben offen.
[Quelle, Lizenz und Ausgabeprüfung](release-evidence/trust-flask-candidate-2026-11-25/verification.json) ·
[Reproduktion](release-evidence/trust-flask-candidate-2026-11-25/reproduce.mjs).

### Broker-Nachtrag · CSV-Referenzsuche und gemischte Fusion

- **FLH03.** Die sechs regionalen Trade-Republic-CSV-Fixtures
  enthalten zusammen 363 Zeilen. Der Abgleich mit den 249
  anonymisierten Trade-Republic-PDF-Textfällen derselben gepinnten
  Testsammlung ergab drei Kandidaten mit gleicher ISIN und Datum
  im jeweiligen Dokument. Bei keinem stimmte der gebuchte Betrag
  überein. Der untersuchte Wertpapierkorpus liefert damit kein
  belastbares Paar aus Originalexport und unabhängiger
  Einzelabrechnung. Die generische CSV-Abnahme des Kontoauszugs
  bleibt separat belegt.
- **Barausgleich.** Die anonymisierte Trade-Republic-Abrechnung
  zur Slack/Salesforce-Fusion enthält 10 Slack-Aktien, 0,776
  gutgeschriebene Salesforce-Aktien und den fixen Bargeldanteil
  der Fusion. Der [SEC-Emittentenbeleg](https://www.sec.gov/Archives/edgar/data/1764925/000119312520307607/d86251d425.htm)
  bestätigt 0,0776 Aktien und 26,79 USD je Slack-Aktie. Daraus
  ergeben sich 267,90 USD. Mit Broker-FX und ausgewiesenen
  Abzügen ergeben sich exakt 163,68 EUR gebuchter Nettozufluss.
  Die Abrechnung weist dabei die vollständigen 0,776 Aktien aus
  und keinen zusätzlich abgegoltenen Stückrest. SW339 wies die
  automatische Übernahme des kombinierten Geldvorgangs atomar ab.
  Wertpapier- und Cashbestand einschließlich Journal blieben
  unverändert. Für die Zeilenabnahme bleibt ein tatsächlicher
  Stückrest-Ausgleich samt ausgewiesener Steuerbasis offen.
  [Prüfnachweis](release-evidence/sw339-slack-merger-boundary-2026-11-25.json).

### CI-Effizienz · Pflichtpfad paaren

Der erste serielle Versuch führte die vorhandenen Chromium-, drei
Cross-Engine- und Wallet-Pflichtjobs auf demselben lokalen Rechner aus.
Installierte Versionen: Chromium 141, Firefox 157, WebKit 27.2,
Node 22.23.5 bzw. 20.20.2. Neun logische CPUs waren zugänglich.
Wallet und Shard 1 bestanden. Nach 27:00 endete der letzte Job.
Chromium und Shard 3 hatten zuvor wegen des zunächst fehlenden
Axe-Dateipfads am geteilten Fixture-Server abgebrochen. Der Pfad
wurde für die Folgeläufe korrigiert.

Shard 2 brach mit einem WebKit-Axe-Befund in der Buchungsliste ab.
Der isolierte Nachlauf reproduzierte den Befund bei 412 und 430 px
mit dem Debian-WebKit und mit dem Ubuntu-WebKit-Build auf demselben
lokalen Host. Die Schaltfläche besitzt 77 × 44 px. In der beobachteten
Scrollposition sind durch die Kopfzeile nur 15,7 px Höhe frei
anklickbar. Das ist ein eigener Befund außerhalb des geprüften
„Mehr“-Übergangs. Die fehlgeschlagene Pflichtstrecke liefert keine
vergleichbare Gesamtzeit.
[Lokaler Mess- und Geometriebeleg](release-evidence/sw339-local-ci-baseline-diagnostic-2026-11-25.json).

Für den vollständigen Vergleich läuft eine [isolierte Ubuntu-Matrix](https://github.com/joke0071/foliolab-open/actions/runs/45623781167).
Jeder Browser-Pflichtjob und Wallet laufen innerhalb eines
Runnerjobs einmal seriell/parallel und in einem zweiten Runnerjob
in umgekehrter Reihenfolge. Beide Varianten verwenden
die unveränderten Appbytes und die jeweiligen Original-Prüfkommandos.
Die Messung erfasst Liste, Ausstiegsstatus, Dauer, CPU und Speicher
je Job. Für die modellierte Dauer des gleichzeitig gestarteten
Pflichtpfads zählt je Reihenfolge der längste Pflichtjob.
Diese Messung ist von der tatsächlichen GitHub-Laufdauer mit
Installation, Zuteilung, Pages und Live getrennt.
[#430](https://github.com/joke0071/foliolab-open/pull/430) bleibt bis
zum reproduzierbaren, vollständigen Gewinn zurückgestellt.

### SW340 · veröffentlicht und Zielprüfung auf der Produktivseite

Die Pflichtjobs auf Main und Pages sind grün. Der Originalbeleg
`15026602135` bestand SHA-256 und ZIP-CRC und enthält **1.533/1.533
erfolgreiche Node-Tests**. Das erneut aus GitHub
gelesene Pages-Original `15024890193` bestand SHA-256 und ZIP-CRC.
Alle **159 Paketdateien** waren bytegleich mit Main. Auf
`https://foliolab.unperfekt.at/` wurden `/`, `/index.html` und `/sw.js`
erneut abgerufen. Alle drei Antworten waren bytegleich mit Main
`7adbf028`. Der echte Browserzoom in sichtbarem Firefox bestand auf
dieser ausgelieferten Origin ebenfalls. Bei 200 % und 320 CSS-Pixeln
blieben alle drei Ziele per Tab und Umschalt+Tab erreichbar. Entwurf,
Fokus-Rückweg und Gleichheit des vollständigen IndexedDB-Datensatzes
bestanden. Ein weiterer sichtbarer Produktionslauf mit Firefox 157
bestand dieselben OS-Tasten, 640 → 320 CSS-Pixel bei DPR 2 und
CSS-Zoom 1. WebKit 27.2 bestand auf dem lokalen SW340-Stand
bei 320 px und in der separaten CSS-Vergrößerung bei 200 %.
Separat wurde die in der lokalen Buchungsliste beim
Scrollen teilweise verdeckte Bearbeiten-Taste auf SW340 per
Tastatur geprüft. Der tatsächliche Fokus brachte die gesamte
44-px-Treffhöhe unter die Kopfzeile.

Der erste [Livejob](https://github.com/joke0071/foliolab-open/actions/runs/45620573232/job/139239730947)
bestand 11 Kerngruppen, 22 Axe-Scans und 160 Dateiübereinstimmungen.
Die gesonderte PWA-Ladeprüfung erreichte nach simuliertem verzögertem
Modulstart in Zeile 37:19 das 30-Sekunden-Limit. Der zurückgelesene
Live-Beleg `15026562830` zeigt den ersten Wartepunkt unmittelbar
nach dem Freigeben der App-Anfrage vor dem Reload. Ein konkreter
HTTP-Fehler ist für diesen Versuch nicht ausgewiesen. Der
[gezielte Wiederanlauf desselben Livejobs](https://github.com/joke0071/foliolab-open/actions/runs/45620573232/job/139241875358)
verwendete denselben Main-SHA und dieselben Prüfungen. Der Wiederanlauf
bestand vollständig in Chromium, Firefox und WebKit. **SW340 ist auf
`7adbf028` LIVE_ACCEPTED.** Der ZIP-Rückabruf `15031490573` bestand
SHA-256 und CRC für alle **1.947 Einträge**. Der Lauf bestätigt **160**
bytegleiche Produktivpfade, **11** Kerngruppen und **22** Axe-Scans.
Die Loader-, UI-, Finanz- und Restore-Prüfungen liefen im regulären
Pfad. Der direkte Abruf von `/`, `/index.html` und `/sw.js` war auch
nach dem Live-Abschluss bytegleich mit Main.
[Produktivnachweis](release-evidence/sw340-published-focus-2026-11-25.json).

### Barausgleich · gebuchter Vodafone-Stückrest

Im [Vodafone-Emittentenbeleg](https://www.vodafone.com/news/newsroom/corporate-and-financial/vz-shares-and-ratio-announcement)
gilt das Verhältnis sechs neue zu elf alten Aktien. Für die im
[veröffentlichten Tatbestand, Rn. 9](https://nrwe.justiz.nrw.de/pdfdownload/downloadEntscheidung.php?entscheidung=%2Fnrwe%2Ffgs%2Fmuenster%2Fj2018%2F9_K_2117_16_E_Urteil_20180228.html)
genannten 709.933 Altaktien ergibt das 387.236 ganze Aktien und
den exakten Rest 2/11. Die dort dokumentierte Depotbank buchte
387.236 Aktien und schrieb für den gerundeten Rest von 0,1818 Aktien
**0,48 EUR** gut. Damit liegt zusätzlich zur Slack-Fusion ein
tatsächlich gebuchter Stückrest vor.

SW340 wies Split und Geldanteil gemeinsam ab. Vollständiges Modell
und wieder eingelesene Sicherung stimmten mit dem Vorzustand
überein. Der reine Split ohne Ausgleich ergab erwartungsgemäß
387.236,181818181818181818 Aktien und keinen Cashzufluss. Dieser
Pfad bildet die konkrete Brokerabrechnung daher nicht ab.
Die im Tatbestand genannten Anschaffungskosten gehören zu den
separat zugeteilten Verizon-Aktien. Für den Vodafone-Stückrest
fehlt weiterhin die Abrechnung mit zugeordneter historischer
Steuerbasis, Kosten und Auszahlungs-FX. Der
[Revisionsentscheid](https://www.bundesfinanzhof.de/en/entscheidungen/entscheidungen-online/decision-detail/STRE202110192/)
hob das erste Urteil auf und dient hier zur Einordnung des
Verfahrensstands.
[Prüfnachweis](release-evidence/sw340-vodafone-fractional-reference-2026-11-25.json).

### UI-SENTIMENT01 · Originalquellen auf SW340

CoinMarketCap lieferte am offiziellen Keyless-Endpunkt HTTP 200,
einen numerischen Wert und einen Aktualisierungszeitpunkt. Chromium
verweigerte von der aktuellen FolioLab-Origin aus den Abruf. Das
fehlende `Access-Control-Allow-Origin` ist im Browserprotokoll und
im separaten HTTP-Abruf belegt. Der
[CMC-Leitfaden](https://coinmarketcap.com/api/resources/coinmarketcap-keyless-public-api-guide-developers-guide/)
verweist für den Produktionseinsatz auf die authentifizierte API.

Ein gewöhnlicher Abruf der CNN-Indexseite erreichte die öffentliche
internationale Seite. Deren Antwort enthielt eine
`frame-ancestors`-Liste ohne FolioLab. Ein unabhängiger Frame-Versuch
erhielt eine abweichende Browserantwort ohne diesen Header.
Auf SW340 selbst meldete Chromium beim Einbettungsversuch zuverlässig
eine Verletzung von `frame-src`. Damit ist die öffentlich erreichbare
Indexseite kein qualifizierter Produktabruf. Offen bleiben der offiziell
erlaubte Feed für die kompakte Aktienanzeige und der für FolioLab
zugelassene CMC-Abruf samt dokumentiertem Anzeigeumfang. Beide
Originalwerte wurden in der App nicht aktiviert.
[CNN-Lizenzweg](https://commercial.cnn.com/contact-us/) ·
[Prüfnachweis](release-evidence/sw340-sentiment-source-gates-2026-11-25.json).

### AT05 · getrennte Jahres- und Fachbelege

Die [flatex-Dokumentation](https://www.flatex.at/service/faqs/detail/steuern/allgemein-zu-steuern/welche-steuerdokumente-werden-ausgegeben/)
bezeichnet die detaillierte Gesamtaufstellung der steuerlichen
Wertpapierumsätze als Erträgnisaufstellung. Das [BMF](https://findok.bmf.gv.at/findok/iwg/83/83598/83598.1.pdf#page=150)
unterscheidet die bis einschließlich 2024 relevanten Vorgaben von
dem ab 2025 geltenden Steuerreporting. Für 2022 wäre eine
Jahresbescheinigung oder Erträgnisaufstellung desselben Depots der
nächste Beleg. Die veröffentlichte Einzelabrechnung und die OeKB-Meldung
tragen den Einzelfall. Der [unabhängige PwC-Fachleitfaden](https://www.oegsw.at/static/content/e2/e6/e21/e6158/e7723/download/ger/2025-10%20Veranlagung%20Fondsertr%C3%A4ge.pdf?checksum=446c84ad28ac3767e9508eaf1fba1f6bfcd3f9c7)
bestätigt in den allgemeinen Hinweisen Meldewährung, Stückzahl am
Zuflussstichtag und gesondert gemeldete Anschaffungskostenkorrektur.
Er prüft keine Jahresergebnisse des konkreten Depots. Diese
Jahresabrechnung und die fallbezogene unabhängige Jahresprüfung
sind weiterhin gesonderte offene Kriterien.

### CI-Effizienz · vollständiger lokaler Kandidatenversuch

Für #430 liefen Chromium, drei Cross-Engine-Shards und Wallet auf
demselben Debian-Host mit identischen Browser- und Node-Versionen wie
die serielle Referenz. Wallet und die Shards 1 und 3 bestanden.
Chromium brach im Dialog-Bildvergleich mit Pixeldifferenzen und
abweichenden Wallet-Dialogmaßen ab. Shard 2 reproduzierte im
WebKit-Lauf denselben Befund an der teilweise verdeckten
Bearbeiten-Taste in der Buchungsliste. Ende des letzten Jobs
nach **30:03**, ohne Wiederanlauf. Der Lauf ist wegen der
fehlgeschlagenen Gates kein Geschwindigkeitsbeleg. Erfasst sind
Jobzeiten, Ressourcen und Hashes der per Job geplanten Prüfkommandos.
[Lokaler Vergleich](release-evidence/sw339-local-ci-baseline-diagnostic-2026-11-25.json).

### FLH05 · separate IBKR-Order- und Cash-Belege

Der [offizielle Flex-CSV-Musterreport](https://www.interactivebrokers.com/docs/web-api/api-reference/get-statement)
zeigt drei AAPL-Ausführungen mit derselben Order-ID. Aus Stückzahl
und Ausführungspreis ergeben sich **200 Stück zu insgesamt
61.991,20 USD brutto**. Gebühren, Umrechnung und der separat gebuchte
Nettobetrag sind im Beispiel nicht ausgewiesen. Die
[Trades-Spezifikation](https://www.ibkrguides.com/reportingreference/reportguide/tradesfq.htm)
definiert Net Cash als Rechenfeld derselben Trades. Der getrennte
[Statement of Funds](https://ibkrguides.com/reportingreference/reportguide/statement%20of%20fundsfq.htm)
wäre der geeignete Cash-Sollbeleg mit tatsächlich gebuchtem Betrag,
Währung und Trade-ID. In den beiden zusätzlich gepinnten
öffentlichen Flex-Testsammlungen fand sich keine passende Gruppe
mit mehreren Ausführungen und zugehöriger Cash-Ledger-Zeile.
Das Providerbeispiel qualifiziert die Mehrfachausführung als
Belegart. Der vollständige FLH05-Test benötigt weiterhin die
separate Nettoabrechnung derselben Gebühren-/FX-Gruppe.
[Quellen- und Prüfliste](release-evidence/ibkr-order-and-net-cash-source-search-2026-11-25.json).

### Cosmos Hub · positive ausstehende Rewards

Drei unabhängige Endpunkte lieferten auf Block **34.043.049** dieselbe
finalisierte Blockidentität und denselben ausstehenden
Reward von **0,032072533799423334 ATOM** im öffentlichen Kraken03-
Selbstdelegationskonto. Die tatsächlichen Bank- und Stakebestände
waren **9,995 ATOM** frei und **1 ATOM** delegiert. SW340 zeigte
exakt diese beiden Mengen, führte keinen noch ungezahlten Reward
als Besitz und meldete die fehlende vollständige Reward-Abdeckung.
Der positive öffentliche Fall belegt die Abgrenzung gegen
Doppelzählung. Import und Abgleich tatsächlich ausgezahlter Rewards
sowie private Kontozuordnung bleiben gesondert.
[Block und Prüfnachweis](release-evidence/sw340-cosmos-unclaimed-reward-2026-11-25.json).

### Barausgleich · Lorillard/Reynolds mit Anschaffungskosten

Der [SEC-Emittentenbeleg](https://www.sec.gov/Archives/edgar/data/1275283/000119312515221972/d941569d8k.htm)
bestätigt je Lorillard-Aktie 0,2909 Reynolds-Aktien und 50,50 USD.
Aus 2.000 Aktien folgen exakt 581 ganze neue Aktien, 0,8 als
Stückrest und 101.000 USD fester Bargeldanteil. Der
[Bundesfinanzhof VIII R 44/18](https://www.bundesfinanzhof.de/de/entscheidung/entscheidungen-online/detail/STRE202210151/)
gibt für denselben Fall die Bankwerte getrennt wieder. 89.801,73 EUR
Barzuzahlung, 49,29 EUR Spitzenausgleich und 35.796,54 EUR Wert
der eingebuchten Aktien ergeben 125.647,56 EUR. Nach den im
Revisionsentscheid ausgewiesenen Anschaffungskosten beider Lose von
insgesamt 78.034,13 EUR stimmen **47.613,43 EUR** mit dem deutschen
Entscheidungssoll überein.

SW340 wies die automatische Fusion sowohl mit dem Stückrest
als auch mit beiden Geldkomponenten zusammen ab. Gegenpositionen,
volle Kostenbasis, Journal und wieder eingelesene Sicherung blieben
in beiden Versuchen exakt gleich. Qualifiziert sind der historische
Gesamtfall und die atomare Abweisung. Für eine eigene Buchung des
Stückrests fehlen der separate Auszahlungs-FX, die gesonderten
Abwicklungskosten und eine ausgewiesene Einzelzuordnung der
Anschaffungskosten. Die deutsche Fallentscheidung liefert keine
österreichische Regel.
[Rechen- und Produktbeleg](release-evidence/sw340-lorillard-merger-court-reference-2026-11-25.json).

### CI-Effizienz · Entscheidung nach beiden vollständigen Paaren

Alle zehn [Ubuntu-Paare](https://github.com/joke0071/foliolab-open/actions/runs/45623781167)
bestanden ohne Jobwiederanlauf. Pro Job waren die ausgeführten
Prüfkommandos gleich. Der Kandidat enthielt zusätzlich den vorgesehenen
Node-Vertrag für Parallelität (1.534 statt 1.533 Tests). Die P1A-Phasen
hatten je Engine in beiden Varianten jeweils zwölf Initialisierungen,
42 responsive Prüfungen und 42 Screenshot-Ausgaben. Alle zehn
Originalartefakte wurden über SHA-256 und ZIP-CRC geprüft. Die
Prüflisten, Browserstände, CPU-/Speicherwerte sowie die Dauer
innerhalb und außerhalb P1A sind festgehalten.

| Reihenfolge | Letzter modellierter Pflichtjob | Seriell | Parallel | Gewinn |
| --- | --- | ---: | ---: | ---: |
| Seriell → parallel | Chromium einschließlich Node und Syntax | 22:49,24 | 22:16,70 | 32,54 s |
| Parallel → seriell | Firefox/WebKit, Shard 2 | 26:54,72 | 25:48,12 | 66,60 s |

Die zwei seriellen Referenzen liegen **4:05,48** auseinander.
Der modellierte Zeitgewinn liegt in beiden Paaren innerhalb dieser
beobachteten Streuung. Erfasst ist die längste Laufzeit der parallel
gestarteten Pflichtjobs auf Loopback. Installation, Runnerzuteilung,
Pages und Live liegen außerhalb dieses Paarvergleichs. Die korrigierte
lokale serielle Probe endete nach 32:06 und reproduzierte die
Chromium-Bildabweichungen sowie den WebKit-Befund aus dem lokalen
Parallelversuch. Beide Debian-Läufe liefern wegen dieser Pflichtfehler
keine belastbare Laufzeitdifferenz. **#430 bleibt zurückgestellt.**
Für die Freigabe fehlt ein Gesamtgewinn außerhalb der Streuung,
einschließlich des regulären Releasepfads.
[Prüflisten, Messdaten und geprüfte Originale](release-evidence/ci-430-full-local-path-pairs-2026-11-25.json).

### SW340 · NEAR-Mengengrenze im normalen Wallet-Pfad

Getesteter Produktstand [Main `7adbf028`](https://github.com/joke0071/foliolab-open/commit/7adbf028ff407df2c48f5c8e2e788ed10e8573f0). FastNear und NEAR RPC lieferten bei erneutem Abruf desselben finalisierten Blocks 226.157.919 bytegleiche Antwortkörper. Das unabhängige Soll lautet **145768498431409676817125837316 YoctoNEAR** bzw. **145768,498431409676817125837316 NEAR**. Auf dem 18-stelligen Raster bleiben **837316 YoctoNEAR** außerhalb der Darstellbarkeit.

Chromium 141, Firefox 157 und WebKit 27.2 führten die Wallet-Oberfläche mit den gepinnten RPC-Bytes über isolierten Transport aus. Zwei bekannte, darstellbare Kontrollmengen erschienen als **2,5 NEAR frei** und **1,25 NEAR gesperrt**. Nach Übernahme, Wiederöffnung, lokalem Backup und Restore in einem frischen Browserprofil ergab die Rückrechnung exakt die beiden atomaren Ausgangsmengen. Der öffentliche Aurora-Fall zeigte vor der Vorschau die Präzisionsmeldung, erzeugte keine Ergebniszeile und ließ die Übernahme gesperrt. Inhalt und Revision des IndexedDB-Datensatzes blieben exakt gleich.

Die erste Grenze ist [`atomicDecimal()` → `units()`](https://github.com/joke0071/foliolab-open/blob/7adbf028ff407df2c48f5c8e2e788ed10e8573f0/src/decimal.js#L59). Derselbe Wert wurde gesondert von Positionserstellung, Restore des Eröffnungsbestands, Journal-Mengenprüfung und Backup-Restore abgelehnt. Validator, Wallet-Metadatum `decimals: 24` und Positionstext allein ändern den Mengenvertrag nicht. Ein exakter Import braucht eine durchgängige Repräsentation samt Rechenregeln für Position, Eröffnungsmenge, Journal-Deltas und Restore-Kompatibilität. Die sichere Ablehnung bleibt aktiv. Belegt sind der bisherige Weg und die Vertragsgrenze. Der positive 24-stellige Import, Rewards-Abdeckung und private Kontozuordnung bleiben offen.

[Maschinenbeleg](release-evidence/sw340-near-precision-roundtrip-2026-11-25.json) · [Reproduktion](release-evidence/sw340-near-precision-roundtrip-2026-11-25.mjs).

### SW340 · Fondsverkauf mit unabhängiger Kostenbasis und Gegenbuchung

Im [BFH-Urteil VIII R 22/23](https://www.bundesfinanzhof.de/de/entscheidung/entscheidungen-online/detail/STRE202610013/) gehören die 386 Fondsanteile, die 39.303,64 EUR historischen Anschaffungskosten, der Verkauf für 39.819,76 EUR, die Provision von 69,90 EUR und die tatsächliche Bankauszahlung von 39.038,06 EUR zu demselben Geschäft. Aus 674,70 EUR Steuer und 37,10 EUR Zuschlag folgen 711,80 EUR gesamter Abzug. Die unabhängig ermittelten Sollwerte waren vor dem Import fixiert. Der Buchungstag 31.12.2018 und der auf null gesetzte Cash-Anfang sind Testparameter. Die Quelle nennt das Verkaufsjahr und den Cash-Zugang, jedoch keinen konkreten Verkaufstag oder Kontosaldo.

Auf [SW340](https://github.com/joke0071/foliolab-open/commit/7adbf028ff407df2c48f5c8e2e788ed10e8573f0) ergaben der allgemeine CSV-Import und das Journal **386 Stück Abgang**, **39.038,06 EUR Cash-Zugang** und Kostenbasis null nach vollständigem Verkauf. Das Journal buchte Provision und Steuer einzeln und erzeugte keinen externen Kapitalfluss. 446,22 EUR Ergebnis vor Steuer entsprechen dem Urteil. Das Ergebnis im FolioLab-Ledger nach den erfassten Abzügen beträgt −265,58 EUR. Abgebrochener Undo ließ selbst die Revision gleich. Der Import-Undo stellte den kompletten vorherigen Datensatz bytegleich wieder her. Wiederimport, Backup, frischer Restore und Wiederöffnung reproduzierten den bestätigten Zustand.

Die einzelne Rücknahme über die Buchungsverwaltung blieb gesperrt. Die Oberfläche nennt importierte Herkunft, Begrenzung auf qualifizierte EUR-Geldbuchungen, Kostenverknüpfung und späteren Kontrollpunkt. Der Prüfversuch änderte keine Bytes und keine Revision. Der Referenzfall und die reguläre Import-/Undo-/Restore-Kette sind damit auf Chromium, Firefox und WebKit belegt. Für die Zeilen FIN-E2E01 und Verwaltung bleibt die gezielte wertpapierbezogene Rücknahme mit vollständigem Gegenbuchungs- und Kontrollpunktvertrag offen.

[Maschinenbeleg](release-evidence/sw340-fund-disposal-roundtrip-2026-11-25.json) · [Reproduktion](release-evidence/sw340-fund-disposal-roundtrip-2026-11-25.mjs).

### AT05 · Produktgrenze der automatischen Einstandszuordnung

Der unabhängige Sollwert aus OeKB-Feld 10289 und der Flatex-Abrechnung ist eine Erhöhung um rund **0,01499605 EUR je Anteil**. Die gezielte Prüfung mit dem Instrument, den 8.622,7 Anteilen und einer synthetischen Transkription im Flatex-CSV-Schema erreicht auf SW340 die Klassifikation `accumulation`. Der Produktadapter hält die Zeile als `event-review`; die Übernahme bleibt gesperrt und die gesetzte Kontroll-Kostenbasis bleibt exakt gleich. Die synthetische Transkription prüft die Produktgrenze. Jahresabrechnung desselben Depots, unabhängiger Jahresfachbeleg und positive automatische Zuordnung sind weiter offen. Die öffentliche [Einzelabrechnung](https://www.broker-test.at/steuern/fondsthesaurierung/) und [flatex-Dokumentation](https://www.flatex.at/service/faqs/detail/steuern/allgemein-zu-steuern/welche-steuerdokumente-werden-ausgegeben/) belegen unterschiedliche Umfänge.

[Prüfnachweis](release-evidence/sw340-at05-cost-basis-boundary-2026-11-25.json).

### TRUST01 · Auslieferungsabgleich und SW341

HTML und alle vier Kolbendateien wurden von der produktiven SW340-Origin zurückgelesen und stimmen bytegleich mit Main überein. Alle 20 Inline-SVGs stimmen einzeln mit den gepinnten v316-Fragmenten überein. `format.js` und die sieben Positionszeichen sind bytegleich zu v316. Die Herkunftsbelege der ursprünglichen Funktionszeichen, Inline-Zeichen einschließlich Kalender und Anlageklassenzeichen bleiben jeweils offen. Loader und Diagramme verwenden lokale Geometrie. Auch die seit v316 geänderte Portfolio-Projektion zeichnet berechnete Linien.

Im Kandidaten [SW341](https://github.com/joke0071/foliolab-open/commit/c33aefacdd2d3f46f72c74b080219bb314703845) deckt der vorbereitete Ersatz jedes der vier Manifest-Assets ab. Upstream-SVG und ISC-Lizenz stimmen mit Lucide 0.468.0 überein. Die Lizenz wird neben den Icons ausgeliefert und mit der PWA gecacht. Lokal bestanden Syntax, 1.533 Node-Tests und Chromium-Loading/PWA. Nach einem Offline-Reload waren alle vier Icon-Dateien und die Lizenz bytegenau abrufbar. [PR #432](https://github.com/joke0071/foliolab-open/pull/432) bestand die [Pflichtintegration](https://github.com/joke0071/foliolab-open/actions/runs/45649013303) und das [Wallet-Gate](https://github.com/joke0071/foliolab-open/actions/runs/45649013359). Der geprüfte Merge-Stand und [Main `162d76ae`](https://github.com/joke0071/foliolab-open/commit/162d76aeba6a441d761cac1132e964516a867b3e) sind baumgleich. Im lokalen Wechsel SW340 → SW341 hielt Chromium einen zuvor in der Oberfläche gespeicherten Datensatz nach Aktualisierung und Offline-Neuladen byte- und revisionsgleich. Die SW340-HTTP-Antwort hatte weder CSP- noch X-Frame-Options-Header. Die vier Kolbendateien und der Lizenztext sind auf der Produktivdomain bytegenau bestätigt. Das Pages-Original `15041691232` bestand SHA-256- und ZIP-CRC-Prüfung, alle 160 Dateien stimmen mit Main überein. [Main und Pages](https://github.com/joke0071/foliolab-open/actions/runs/45651922252) sind grün. Der [Live-Abnahmelauf](https://github.com/joke0071/foliolab-open/actions/runs/45651922252/job/139349885940) bestand im ersten Versuch in Chromium, Firefox und WebKit. Das Live-Original `15046896303` bestand SHA-256- und ZIP-CRC-Prüfung. Es enthält 161 bytegleiche URL-Antworten, elf Funktionsgruppen und 22 Axe-Prüfungen sowie die drei Loading-/PWA-Berichte. **SW341 ist LIVE_ACCEPTED.** Die Teilabnahme betrifft die vier veröffentlichten Kolbendateien und die ISC-Lizenz samt Offline-Cache. Native Safari/VoiceOver/ITP und wirksamer HTTP-Framingschutz bleiben eigene Kriterien.

[Inventar, Datei- und Lizenzhashes](release-evidence/sw340-trust-inventory-sw341-2026-11-25.json) · [Pages, Origin-Readback und Live-Abnahme](release-evidence/sw341-pages-and-origin-2026-11-25.json).

### Cosmos Hub · ausgezahlter Reward und Gebührengegenprobe

Drei CometBFT-Endpunkte lieferten dieselbe erfolgreiche Transaktion `F0F894B8…B9569D` auf Block **34.044.337**. Zwei separate Block- und Ergebnisabrufe bestätigten die Transaktionsbytes am selben Index und den Zahlungsevent. Drei REST-Endpunkte bestätigten die Bankbestände vor und nach dem Block über den jeweiligen Höhenheader. Das unabhängige Soll in µATOM ist **281.159 + 536.836 − 6.823 = 811.172**. Bankeingang und `withdraw_rewards` bestätigen denselben Reward. Der Wallet-Adapter auf SW340 gab **0,811172 ATOM frei** und die zwei Delegationsbestände getrennt aus. Der abgegoltene Reward erschien nur im freien Bestand und erzeugte keine zusätzliche Position oder Einnahmebuchung. Damit ist die Berücksichtigung im Bestand belegt. Ein historischer Reward-/Gebührenimport und die private Zuordnung bleiben offen.

[Positionen, Blockidentität und Antwortprüfsummen](release-evidence/sw340-cosmos-paid-reward-2026-11-25.json).

### Weitere Freigabewege · zusätzliche Quellenprüfung

- **FLH05.** Die öffentlichen [IBKR-Activity-Beispiele](https://www.interactivebrokers.eu/images/common/Statements/sample_html_individual.htm) für Individual, Introducing Broker und Prime enthalten Ausführungslisten und Cash-Übersichten. Das separate Cash-Ledger mit Trade-/Order-Bezug fehlt. Im gepinnten [ibflex-Quellstand](https://github.com/csingley/ibflex/tree/9cfc26c574b10ddebd1b31acffeb02caf4ff5b4e) gehört die in der README ausgewiesene WMIH-Teilausführung zu einem anderen Trade als die Cash-Ledger-Testzeile. Die Quellen tragen keinen gemeinsamen Fall. Der fehlende Nachweis bleibt die separate Nettoabrechnung derselben Gebühren-/FX-/Teilausführungsgruppe.
- **Barausgleich.** Der [SEC-Fusionsvertrag, § 2.02(f)](https://www.sec.gov/Archives/edgar/data/1275283/000119312514423543/d803939ds4a.htm) bestätigt für denselben Lorillard/Reynolds-Stückrest einen Fünf-Tage-VWAP als USD-Berechnungsbasis. Das [Clearing-Memo #36892](https://www.miaxglobal.com/sites/default/files/alert-files/LO_Merger_36892.pdf) dokumentiert die getrennte Abwicklung. Belegt sind die Preisformel und die getrennte Ausgleichskomponente. Für die konkreten 49,29 EUR fehlen weiterhin der tatsächlich angewandte Auszahlungs-FX, separate Kosten und der diesem Bruchteil zugeordnete Einstand.
- **VWCE.** [Deutsche Börse](https://live.deutsche-boerse.com/en/etf/vanguard-ftse-all-world-ucits-etf-usd-accumulating/price-history/historical-prices-and-volumes) führt das exakte Instrument und bietet eine historische Ansicht mit Anpassungsoptionen. [Twelve Data](https://support.twelvedata.com/en/articles/12682324-end-of-day-eod-pricing-market-data) nennt einen vollständigen historischen EOD-Datenumfang und abgestufte Ausgaberechte. Die konkreten Vertragsrechte für FolioLab liegen nicht vor. [Yahoo](https://help.yahoo.com/kb/SLN2310.html) untersagt die Weiterverteilung. Der [eingestellte Xetra Public Data Set](https://registry.opendata.aws/deutsche-boerse-pds/) gab beim dokumentierten anonymen S3-Zugriff für drei Datumsprefixe `403 AccessDenied` zurück. Die Fünf-Tage-Probe bleibt erhalten. Kein weiterer qualifizierter Serienvergleich.
- **FLH03/FLH03-18.** Der [Portfolio-Performance-Thread](https://forum.portfolio-performance.info/t/import-trade-republic-csv-transaktionsexport/39126) enthält Transaktionsexportbeispiele und einzelne Zeilen, aber keine separat daneben belegte Abrechnung desselben regionalen Geschäfts. Öffentliche [SOL-Treuhandberichte](https://www.sec.gov/Archives/edgar/data/1896677/000189667726000020/gsol-20260930.htm) belegen datierte Gesamtbestände beziehungsweise die Staking-Tätigkeit. Eine unabhängige Zuordnung der exakt gleichen Ledger-/Stakingposition bleibt erforderlich.
- **Recovery und Startperformance.** Der autorisierte Umfang aus der Android-Gerätecheckliste und der Windows-Abnahme wurde erneut geprüft. Der verfügbare Linux-Executor hat keinen physischen Android-/ADB-Testendpunkt und keine native Safari-/VoiceOver-Sitzung. Der [Firebase-Weg](https://developer.android.com/studio/run/android-device-streaming) erfordert eine eingerichtete, autorisierte physische Projektsitzung. Die ausstehenden Restore-, Eviction- und Startmessungen wurden daher separat offen gehalten.
- **FLH04, ETH-Cursor und CI.** #427 weist weiterhin null eingereichte Reviews und null Reviewthreads aus. Der veröffentlichte Prüfauftrag trägt noch keine externe Freigabe. Beim historischen ETH-Cursor zählt weiterhin das ursprüngliche Antwortpaar. Der Stand von #430 enthält keine neue Änderung für einen weiteren aussagekräftigen gepaarten Lauf. Die serielle Pflichtstrecke bleibt in SW341 aktiv.
- **UI-SENTIMENT01, AT03 und Produktmaster.** Die [CMC-Dokumentation](https://coinmarketcap.com/api/documentation/pro-api-reference/keyless-public-api/) bestätigt den bereits geprüften öffentlichen Endpunkt. Der FolioLab-Origin- und CNN-Anzeigepfad bleibt offen. Für AT03 liegt der öffentliche EUR-Saldovergleich vor. Für die private Zeile fehlt weiterhin der passende persönliche Kontozeitraum. Die interne Produktvorschau ist fertig und die öffentliche Bewerbung bleibt zurückgestellt.

### Übernahme · SW342-Kandidat und Nachweise vom 25.11.2026

Der Direktabgleich beim Einstieg bestätigte Main `162d76ae` und den Arbeitsplanzweig `9cabe0c2` unverändert. Der unabhängige Origin-Abruf glich alle 160 erwarteten Cache-Pfade einschließlich Service Worker bytegenau ab. Der Arbeitsplanzweig enthält die Live-Nachweise getrennt vom Produktzweig. Maßgeblich ist die Paketmatrix am Ende.

**FIN-E2E01 · unabhängiges Soll vor dem Test.** Die Centrechnung zu [BFH VIII R 22/23](https://www.bundesfinanzhof.de/de/entscheidung/entscheidungen-online/detail/STRE202610013/) ergibt für die Rücknahme +386 Anteile, +39.303,64 EUR Einstand, −39.038,06 EUR Verrechnung und die Entfernung des Verkaufsbeitrags von −265,58 EUR. Die über diesen Verkauf gebuchten 69,90 EUR Provision und 711,80 EUR Steuern einschließlich Zuschlag entfallen. Das aktive Verkaufsjournal mit vier Posten entfällt und ein neutraler Nachweis erhält die Originale. Der Verkauf erzeugt keinen externen Kapitalfluss. Ein gesonderter Fluss von +25,51 EUR gehört zur unabhängigen Testbuchung. Der 31.12.2018, der Cash-Anfangssaldo von null, die lokalen Referenzen und der unabhängige Bestand sind Testparameter. [Vorab-Soll](release-evidence/sw342-fund-sale-soll-2026-11-25.txt)

**FIN-E2E01 · Ist.** Chromium, Firefox und WebKit erreichten alle Sollwerte. Im isolierten Portfolio erzeugt der reguläre CSV-Import mangels EUR-Kurs einer unabhängigen USD-Position keinen vollständigen Kontrollpunkt. Die separat gebuchte Einzahlung, ihr Journal und ihr externer Kapitalfluss blieben erhalten. Eine Wiederimportvorschau vor und nach frischem Backup-Restore konnte die Quelle nicht erneut anlegen. [Produktcommit](https://github.com/joke0071/foliolab-open/commit/9ff78374d8dcff659fb16284bddab3c49f2595a2) · [Ergebnis je Browser](release-evidence/sw342-fund-sale-removal-2026-11-25.json)

**Verwaltung · Ist.** Die Auswahl im regulären Verwaltungsdialog, Prüfung und bestätigte Rücknahme erhöhten die Revision genau einmal. Abbruch, veraltete Bestätigung und Gegenfall hinterließen die jeweils aktuellen Bytes und die Revision unverändert. Beim Kontrollfall besitzt derselbe Verkauf einen späteren aktuellen Vollstichtag aus dem regulären CSV-Import. Beide Verwaltungszugänge sperrten ihn. Auch ein ausgelöstes Formularereignis konnte die Schreibsperre nicht umgehen. Der Node-Test prüft separat fehlende Herkunft, abweichende Kosten, fehlenden Eröffnungseinstand, einen späteren Cash-Abgang und einen Kontrollpunkt. Der frühere Fall auf SW340 bleibt als zusätzlicher Gegenbeleg erhalten. Das Sitzungs-Undo stellte nach der Einzelrücknahme die Bytes vor der Löschung in allen drei Browsern mit genau einer neuen Revision wieder her. [Undo-Beleg](release-evidence/sw342-fund-sale-management-undo-2026-11-25.json) · [Browser-Reproduktion](https://github.com/joke0071/foliolab-open/blob/9ff78374d8dcff659fb16284bddab3c49f2595a2/tests/browser-fund-sale-removal.mjs) · [Schreibprüfung](https://github.com/joke0071/foliolab-open/blob/9ff78374d8dcff659fb16284bddab3c49f2595a2/tests/fund-sale-removal.test.mjs)

Der geprüfte Umfang ist die Einzelrücknahme eines generisch importierten EUR-Fondsverkaufs beim vollständigen Abgang des dokumentierten Eröffnungsbestands. Konto und Gebühren-/Steuerposten müssen mit Quelle und Journal übereinstimmen. Nachgelagerte Verrechnungsvorgänge, weitere Fondsbuchungen und Stichtage ab Verkaufsdatum sperren die Rücknahme. Die Pflichtintegration auf Merge-Stand `0e00f845` und das Wallet-Gate sind grün. Die geprüften Originalartefakte `15052892567` und `15051557320` enthalten den Fall mit Chromium, Firefox und WebKit. Prüfsummen und ZIP-CRC sind im Fallbeleg aufgenommen. [Main `513c2a41`](https://github.com/joke0071/foliolab-open/commit/513c2a41e9a82d9c175c35a7cbee580be4951638) hat denselben Baum. [Main und Pages](https://github.com/joke0071/foliolab-open/actions/runs/45678926971) sind grün. ZIP-CRC und alle 160 Dateien des Pages-Originals `15053785609` stimmen mit Main überein. Die Produktivdomain liefert den passenden Worker und die geänderten Runtime-Dateien bytegenau. Der isolierte funktionale Live-Fall inklusive Sitzungs-Undo bestand in Chromium, Firefox und WebKit auf der Produktivdomain. Beim ersten unabhängigen Firefox-Durchlauf mit deaktiviertem Browsercache lieferte die Origin zeitweise HTTP 429. Die Wiederholung mit Browsercache bestand. Der [reguläre Live-Abnahmelauf](https://github.com/joke0071/foliolab-open/actions/runs/45678926971/job/139449020283) bestand im ersten Versuch. Das Original `15059760445` bestand ZIP-CRC und SHA-256-Prüfung. Seine 161 Origin-Antworten sind mit Main abgeglichen. Elf Funktionsgruppen, 22 Axe-Prüfungen und die Loading/PWA-Berichte der drei Browser sind grün. **SW342 ist LIVE_ACCEPTED.** Die wirtschaftliche Zeile und die Verwaltungszeile sind im Umfang der Paketmatrix jeweils abgenommen. [PR #433](https://github.com/joke0071/foliolab-open/pull/433) · [Pflichtintegration](https://github.com/joke0071/foliolab-open/actions/runs/45674710469) · [Wallet](https://github.com/joke0071/foliolab-open/actions/runs/45674710545)

### Cosmos · Ereignis, Gebühr und Wiederholung

Die drei gepinnten RPC-Antworten lieferten dieselben Transaktionsbytes. Der Hash stimmt mit dem Transaktionsschlüssel überein. Zwei Blockbelege verknüpfen Index 0 und das erfolgreiche Ergebnis mit Block 34.044.337. Der Auszahlungsereignisindex 11 und die Kontogutschrift bei Index 8 bezeichnen denselben Reward von **0,536836 ATOM**. Die gesamte Kontobelastung von **0,006823 ATOM** besteht laut Ergebnis getrennt aus **0,002599 ATOM Gebühr** und **0,004224 ATOM Tip**. Andere Transaktionen und Blockereignisse liefern keine weitere Kontobewegung in diesem Block.

Drei getrennte Bankzustandsquellen bestätigen **0,281159 + 0,536836 − 0,006823 = 0,811172 ATOM**. Der bestehende Read-only-Replay reduziert einen doppelt übergebenen Beleg auf zwei stabile Ereignisse und stimmt den Endsaldo auf das µATOM ab. Wird der bereits erhöhte Banksaldo als Anfang eingesetzt, meldet der Abgleich exakt **+0,530013 ATOM** Differenz. Das qualifiziert den öffentlichen Ereignis- und Saldenbeleg. Die Finanzübernahme bleibt offen. Der Session-Reader akzeptiert aktuell nur BTC, ETH und SOL und der Buchungsschreiber weist automatisierte Walletpositionen ab. Für die nächste Implementierung fehlen eine persistente Cosmos-Ereignisbindung an die bestätigte Walletposition und ein Schreib-/Restore-Vertrag, der Position und Saldo unverändert lässt, wenn der gescannte Bestand dieselbe Transaktion bereits enthält. [Maschinenbeleg](release-evidence/sw341-cosmos-reward-replay-2026-11-25.json) · [Reproduktion](release-evidence/sw341-cosmos-reward-replay-2026-11-25.mjs)

Der Browserabruf von der Produktivdomain bestätigte den Archivweg: Über `abci_query` lieferten Polkachu und Cosmos Directory im Browser beide festgeschriebenen Höhen mit Betrag und Höhe im Antwortkörper. Die REST-Route von Cosmos Directory lieferte Zahlen, exponierte den historischen Höhenheader aber nicht für Browser-JavaScript. PublicNode hatte die abgefragten historischen Zustände inzwischen bereinigt. Ein separater Konsolenabruf über Cosmos Directory sah die Elternhöhe zeitweise ebenfalls nicht. Ein Adapter muss die Höhe aus der Antwort prüfen und fehlende Quellen sichtbar ablehnen. Die bisherigen Versorgungsausfälle belegen keinen fehlenden Kontoumsatz. [Browser- und Transportbeleg](release-evidence/sw341-cosmos-archive-access-2026-11-25.json)

Die parallel integrierte Fortsetzung [#436 / SW345](https://github.com/joke0071/foliolab-open/pull/436) übernimmt genau den archivierten öffentlichen Reward als Wallet-Historie der bestätigten freien ATOM-Position. Soll bleiben **811.172 µATOM** Bankbestand, genau ein Reward über **536.836 µATOM** und eine Belastung über **6.823 µATOM** aus Gebühr und Tip. Der getestete Kandidat ist baumgleich mit [Main `9d7df163`](https://github.com/joke0071/foliolab-open/commit/9d7df163e27d48011887a5c117d6d823c7d22e11). Die Pflichtintegration bestätigt in Chromium, Firefox und WebKit eine einmalige Übernahme, die identische Revision beim Wiederimport, den bestätigten Saldo nach erneutem Wallet-Scan und den verschlüsselten Restore in ein frisches Profil. Die Wallet-Historie ergänzt genau den belegten Block. Der reguläre CSV-Schreibweg für gescannte Wallets bleibt gesperrt. Der gezielte Node-Test und der lokale Chromium-Fall auf dem exakten Main-Checkout bestätigen die Grenzen erneut. [Produkt- und Prüfbeleg](release-evidence/sw345-cosmos-history-release-2026-11-25.json) · [Main, Pages und Live](https://github.com/joke0071/foliolab-open/actions/runs/45703846358)

SW345 enthält zusätzlich den aus dem SW343-Befund abgeleiteten offenen Kursquellen-Status aus [#435](https://github.com/joke0071/foliolab-open/pull/435). Bei nachgeliefertem Detail-Toggle übernimmt der neu gerenderte Bereich den zuvor geöffneten Zustand. Die Browserprüfung misst das 44-px-Ziel nach dem tatsächlichen Austausch und ohne erneutes Öffnen.

### TRUST01 · lizenzierte UI-Grafiken auf SW343

Aus dem gepinnten ISC-Archiv `lucide-static@0.468.0` wurden **23 Funktionszeichen, sieben Anlageklassenzeichen und 19 statische SVG-Vorkommen** ersetzt. Die Inventarzeile des Ladezeichens beschreibt lokale Kreisgeometrie. Kurslinien, Allokationsdiagramme und Projektion verwenden aus Daten berechnete Geometrie. Die bereits ausgelieferte ISC-Notice ist zum Paket bytegleich. Im lokalen Chromium blieb sie mit HTML und beiden Symbolmodulen auch offline exakt verfügbar. Alle zugeordneten Symbolfragmente stimmen mit den archivierten Upstream-Assets überein. Syntax, 1.534 Node-Tests und Chromium-Loading/PWA sind grün. Beim lokalen Wechsel von SW342 auf SW343 blieb ein über die reguläre Oberfläche gespeicherter Datensatz beim Update und anschließendem Offline-Neuladen byte- und revisionsgleich. Die Pflichtintegration von [PR #434](https://github.com/joke0071/foliolab-open/pull/434) startet vom baumgleichen Kandidaten auf Main `513c2a41`. Das [Wallet-Gate](https://github.com/joke0071/foliolab-open/actions/runs/45679059263) ist grün. [Pflichtintegration](https://github.com/joke0071/foliolab-open/actions/runs/45679059500) ist ebenfalls grün. Der zugrunde liegende Merge-Stand `681d814e` ist baumgleich mit dem Kandidaten. Nach der SW342-Live-Abnahme ist SW343 auf [Main `af3cdff0`](https://github.com/joke0071/foliolab-open/commit/af3cdff0b83ea9b0c406e0204efd3d9e32896165) baumgleich integriert. [Main und Pages](https://github.com/joke0071/foliolab-open/actions/runs/45691776339) sind grün. ZIP-CRC und alle 160 Dateien im Pages-Original `15058508200` stimmen mit Main überein. Auf der Produktivdomain stimmen HTML, beide Grafikmodule, Service Worker und ISC-Notice bytegenau überein. Der Live-Abruf auf SW343 liefert weiterhin weder HTTP-CSP noch X-Frame-Options. Der [erste reguläre SW343-Live-Lauf](https://github.com/joke0071/foliolab-open/actions/runs/45691776339/job/139493614412) erreichte 161 bytegleiche Antworten und bestand die Core-Prüfung. Die Chromium-Navigationsprobe brach bei 430 px ab, nachdem der Kurs-CSV-Button verborgen blieb. Der identische unveränderte Test bestand lokal dreimal je Produktstand auf SW342 und SW343 und anschließend auf der veröffentlichten SW343-Origin. Beide Stände reproduzieren beim Detail-`toggle` denselben DOM-Austausch mit neuem 44-px-Ziel. Der [gezielte Wiederanlauf](https://github.com/joke0071/foliolab-open/actions/runs/45691776339/job/139499107248) verwendet dieselben Gates und denselben Produktstand. Der Live-Wiederanlauf bestand vollständig in Chromium, Firefox und WebKit, einschließlich Navigation. Das Original `15064720633` bestand ZIP-CRC und SHA-256-Prüfung. Es enthält 161 bytegenaue Origin-Antworten, elf Funktionsgruppen und 22 Axe-Prüfungen. **SW343 ist LIVE_ACCEPTED.** Für TRUST01 sind damit die Rechtekette und die Offline-Notice aller inventarisierten Grafiken abgenommen. Wirksamer HTTP-Framingschutz und natives Safari/VoiceOver/ITP bleiben offen. Die verifizierten Main-Originale `15061295679` und `15059707400` enthalten außerdem den unverändert exakten Fondsfall in allen drei Browsern auf SW343. Auf der Produktivdomain liefert SW341 weder einen HTTP-CSP-Header noch X-Frame-Options. Eine Origin mit Headerkontrolle und ein natives Safari-/VoiceOver-/ITP-Protokoll bleiben eigene Kriterien. [Kandidat](https://github.com/joke0071/foliolab-open/commit/09fe66ea387faec55a3eea3bd120a74e6909d3c2) · [Zuordnung und Prüfsummen](release-evidence/sw343-licensed-ui-inventory-2026-11-25.json)

### AT05, FLH05, VWCE und Geräte · Stand der Restkriterien

- **AT05.** Die Klassifikation `accumulation` läuft aus dem Text des Flatex-Umsatzes in `event-review`. Die native Handelsprojektion setzt eine unstornierte Kauf- oder Verkaufsorder voraus. Der öffentliche Fall lässt **IE00BNG8L278**, OeKB-Jahresmeldung **343333**, **8.622,7** Anteile und **0,0171 USD pro Anteil** als Erhöhungsbetrag abgleichen. Die unabhängige Decimal-Rechnung ergibt 129,306471981 EUR Gesamterhöhung. Die Differenz der auf vier Nachkommastellen ausgewiesenen Brokerpreise ergäbe 129,34050 EUR. Für einen automatischen exakten Einstand sind daher Originalfeld, FX und exakter Positionsbezug erforderlich. Damit ein Sonderereignis den Einstand automatisch ändern kann, fehlen ein natives Depot- und Ereignispaar mit stichtagsbezogenem Anteilbestand und eine belegte Zuordnung genau zu dieser Position. Die vorhandene Klassifikation hält den Einstand geschützt. Jahresbeleg und unabhängige Prüfung derselben Jahreszusammenführung bleiben eigene Kriterien. [Flatex-Abrechnung](https://www.broker-test.at/steuern/fondsthesaurierung/) · [Bisheriger Produktbeleg](release-evidence/sw340-at05-cost-basis-boundary-2026-11-25.json)
- **FLH05.** Das zusätzliche öffentliche IBKR-Mehrkontenmuster enthält Handelszeilen, Ausführungs- und Provisionshinweise sowie Cash-Übersichten. Für zugehörige separate Cash-Zeilen fand sich kein gemeinsamer Order-/Trade-Schlüssel für dieselben Fremdwährungs-Teilfüllungen. Eine für den Settlement-Zeitpunkt ausgewiesene Summe ist noch kein einzelnes Netto mit dieser Identität. Die dokumentierte Order-ID aus der Trade Confirmation bleibt als Suchschlüssel erhalten. [IBKR-Mehrkontenmuster](https://www.interactivebrokers.com/download/statements/Friends_and_Family_consolidated.pdf) · [Trade Confirmation](https://www.interactivebrokers.com/support/faq/content/create-trade-confirmation-flex-query-35784625)
- **VWCE.** Deutsche Börse bestätigt das Instrument und die Anpassungsoptionen. Xetra nennt einen eigenen Anbieterweg für historische Börsendaten. Twelve Data weist volle EOD-Historie aus und knüpft Drittanzeige an den Tarif und gegebenenfalls an die Börsenzulassung. Für FolioLab fehlen weiterhin eine abrufbare vollständige Xetra-EUR-Reihe und der dokumentierte Anzeigeumfang. Der bisherige Fünf-Tage-Abgleich bleibt der belegte Umfang. [Instrument und Anpassungen](https://live.deutsche-boerse.com/en/etf/vanguard-ftse-all-world-ucits-etf-usd-accumulating/price-history/historical-prices-and-volumes) · [Xetra-Marktdaten](https://www.eurexgroup.com/xetra-en/trading/market-quality/market-data) · [EOD-Nutzung](https://support.twelvedata.com/en/articles/12682324-end-of-day-eod-pricing-market-data)
- **FLH03.** Der öffentliche Trade-Republic-Downloader führt Dokumentpfade je Transaktion, erzeugt den CSV-Datensatz aber selbst aus Webdaten. Die neue alternative Parser-Fixture ist ausdrücklich synthetisch. Beides ergibt kein Paar aus nativem Regionalexport und Originalabrechnung desselben Geschäfts. Der Bitpanda-Stichtag bleibt davon unabhängig. [Downloader-Format](https://github.com/dhojayev/traderepublic-portfolio-downloader) · [CSV-Fixture](https://github.com/aritzmmartinez/libtraderepublic)
- **FLH03-18.** Die unabhängige Moore-Bescheinigung für Luno bestätigt Zugriff und Aggregation der Solana-Stake-Konten. Beim veröffentlichten Bericht sind die exakten Einzelbestände ausgespart. Für einen zusätzlichen FolioLab-Fall fehlen damit weiterhin separat nachprüfbar dieselbe Ledger-/Stake-Position, ihre Zuordnung und ihr datierter Betrag. [Bescheinigung, Staked SOL](https://discover.luno.com/wp-content/uploads/2025/07/LunoPoR_May2025.pdf)
- **FLH04 und #430.** Der Review-Entwurf #427 steht auf `84ef0b37` und hat keine Diskussion oder Review-Einreichung. #430 steht weiterhin auf `5c2d7aca`. Maßgeblich bleiben die externe Sicherheitsfreigabe beziehungsweise ein aussagekräftiger neuer Gesamtvergleich. [FLH04](https://github.com/joke0071/foliolab-open/pull/427) · [CI-Kandidat](https://github.com/joke0071/foliolab-open/pull/430)
- **Geräte.** Der verfügbare Linux-Testlauf hat weder ADB noch einen USB-Gerätepfad. Die vorhandene Projekt-Zugangsakte weist keine freigeschaltete physische Sitzung aus. Der 10.000-Buchungen-Datenbestand und die bestehenden Geräteprotokolle sind verfügbar. Physische Restore-, Eviction- und Startmessungen sowie natives Safari mit VoiceOver/ITP bleiben offen. [Zugangsakte](ANDROID_REAL_DEVICE_ACCESS_2026-11-17.md) · [Startprüfplan](PERF_ANDROID03_REAL_DEVICE_CHECKLIST.md)

## Freigabestand aller 19 Folgezeilen · Fortsetzung vom 25.11.2026

Der Gesamtstand beträgt **6/6 Kernbereiche und 13/29 Folgepakete**. [SW342 auf Main `513c2a41`](https://github.com/joke0071/foliolab-open/commit/513c2a41e9a82d9c175c35a7cbee580be4951638) ist **LIVE_ACCEPTED**. FIN-E2E01 und Buchungsverwaltung sind vollständig im jeweiligen Zeilenumfang abgenommen. [SW343 auf Main `af3cdff0`](https://github.com/joke0071/foliolab-open/commit/af3cdff0b83ea9b0c406e0204efd3d9e32896165) ist der aktuell produktiv abgenommene Stand. TRUST01 hat eine Teilabnahme für Grafiken und Lizenz. SW345 ist auf Main `9d7df163` integriert. Die Main-, Pages- und Live-Gates laufen.

| Ursprünglich offene Zeile | Umfang aus dieser Fortsetzung | Verbleibender Freigabepunkt |
| --- | --- | --- |
| UI-Refresh · #300 | SW340 korrigiert den vorwärts gerichteten Fokusübergang. Drei Bereiche, echte Firefox-Vergrößerung, WebKit, sichtbarer Fokus, Entwurf und gleichbleibende IndexedDB bestätigt. | **Abgenommen** im dokumentierten Zeilenumfang. [SW340 Live](https://github.com/joke0071/foliolab-open/actions/runs/45620573232/job/139241875358). |
| Speicher und Recovery · #44/#254 | HTTPS-Aktualisierung mit 10.000 Buchungen, Offline-Neustart und gesondert blockierter inkompatibler SW88-Schreibversuch belegt. | Beobachtete OS-Bereinigung und verschlüsselter Restore auf zweitem autorisierten Gerät. |
| AT05 · #129 | OeKB-Original, Flatex-Einzelabrechnung über 27,22 EUR und Anschaffungskostenkorrektur unabhängig berechnet. Automatische Zuordnung im gezielten Sonderereignistest gesperrt. Dokumentierende Jahresansicht, Journal und Restore im bisherigen Umfang belegt. | Jahresabrechnung desselben Depots, fallbezogene Fachprüfung und Nachweis einer automatischen Kostenbasiszuordnung. |
| Benchmark · #124 | 100 % VWCE/Xetra/EUR, Fünf-Tage-Stichprobe und unabhängige TWR-Rechnung mit Ein- und Auszahlung. FolioLab belässt Rendite bei fehlenden Ereignisbewertungen als unbekannt. | Vollständige adjustierte EUR-Reihe samt Anzeigerechten und gemeinsamer Vergleich auf belegten Bewertungstagen. |
| AT03 · #127 | Öffentlicher EUR-Kontostand mit unabhängig ausgewiesenem Anfangs- und Endsaldo, reguläre Importbestätigung und Vergleich der Zwischenstände. | Persönliche gebuchte Salden desselben tatsächlich genutzten Kontos und Zeitraums. |
| FLH05 · #174 | Kraken- und Flatex-Teilbelege, öffentlich dokumentiertes Order-/Ausführungsschema als weiterer Suchpfad. | Zusammengehörige echte Teilfüllungen mit Gebühren und Fremdwährung samt gesonderter gebuchter Nettoabrechnung. |
| FIN-E2E01 · #255 | EUR-Cashfall abgenommen. Die gezielte Rücknahme stellt auf SW342 386 Anteile und 39.303,64 EUR Kostenbasis wieder her und kehrt 39.038,06 EUR Netto-Cash exakt um. Gebühren, Steuern, realisiertes Ergebnis, Journal und externe Flows sind abgeglichen. | **Abgenommen** im nachgewiesenen Zeilenumfang. [Live-Fall und Standardgates](release-evidence/sw342-fund-sale-removal-2026-11-25.json). |
| Verwaltung · #165/#257 | Tatsächliche Verwaltungsoberfläche für erlaubten Cash-Abgang und geschützte Folgeabhängigkeit. Abbruch, Stale, Wiederimport, Undo und Restore für Cash geprüft. SW342 bestätigt die positive Einzelrücknahme, den geschützten Kontrollpunkt, Abbruch, veraltete Revision, Wiederimport, Sitzungs-Undo und frischen Restore in drei Browsern auf der Produktivdomain. | **Abgenommen** im nachgewiesenen Zeilenumfang. [Bedien- und Speichernachweis](release-evidence/sw342-fund-sale-removal-2026-11-25.json). |
| FLH03 · #148 | Öffentlicher Trade-Republic-Kontoauszug als generischer CSV-Fall. Sechs native CSV-Profile gegen veröffentlichte PDF-Abrechnungen verglichen. Persönlicher TR-Fall entfällt. | Passendes Paar aus nativem regionalem Export und Einzelabrechnung. Persönliche Bitpanda-Stichtagsbestätigung für Cash und BCI25-Einzelpositionen. |
| FLH03-18 · #159 | Vorhandener belegter SOL-Brückenfall bleibt maßgeblich. | Weitere Ledger-/Stakingposition mit unabhängiger Kontozuordnung und datiertem Endbestand. |
| Weitere Wallets · #119 | Öffentlicher Cosmos-Abgleich für frei, delegiert, Unbonding sowie ausstehenden und im Banksaldo abgegoltenen Reward. NEAR-Kontrollbestand bleibt über Übernahme, Wiederöffnung und Restore auf YoctoNEAR exakt. Der gepinnte 24-stellige Fall erreicht die gemeinsame Mengengrenze vor der Vorschau. | SW345 qualifiziert die historische Übernahme genau des öffentlichen ATOM-Rewards, den doppelzählungsfreien Wiederimport und verschlüsselten Restore. Main/Pages/Live für SW345, weitere belegte Cosmos-Ereignisse, die exakte Verarbeitung der NEAR-Beträge und private Kontozuordnung bleiben offen. |
| ETH-Cursor · #268 | Öffentlicher Seitenwechsel und Chain-Receipts bereits abgenommen. Verfügbare Privatbelege gezielt für den historischen Fall geprüft. | Ursprüngliche private Providerantwort mit Cursor und zugehörige Folgeantwort. |
| Barausgleich · #52 | Lorillard/Reynolds belegt Stückrest, Barausgleich, Gegenwert und gesamte historische Anschaffungskosten. Kombinierte Buchungen bleiben mit identischem Datenstand gesperrt. | Vollständiger tatsächlicher Stückrest-Ausgleich mit Auszahlungswährung, FX, Gebühren und zugeordneter Steuerbasis. |
| CI-Effizienz · #229/#430 | Identische Appbytes im Paarvergleich, lokale Gegenproben und Ubuntu-Paare in beiden Reihenfolgen. | Reproduzierbarer Gesamtgewinn außerhalb der Streuung im regulären Releasepfad. #430 bleibt zurückgestellt. |
| TRUST01 · #298 | Vier Kolbendateien samt ISC-Notice auf SW341 produktiv abgenommen. SW343 ergänzt 23 Funktionszeichen, sieben Anlageklassenzeichen und 19 statische SVG-Vorkommen mit belegter ISC-Rechtekette. Die Notice bleibt offline verfügbar. [Baum, Inventar und Live-Prüfbeleg](release-evidence/sw343-licensed-ui-inventory-2026-11-25.json). | Wirksamer HTTP-Framingschutz auf autorisierter Origin und native Safari-/VoiceOver-/ITP-Probe. |
| Startperformance · #177/#256 | 10k-Fixture und zugängliche Gerätetestwege geprüft. | Physisches Android-Projektgerät für fünf Kalt-, Warm- und Offline-Starts pro Vergleichsstand. |
| UI-SENTIMENT01 · #405 | CMC-CORS und die CNN-Einbettungsgrenze auf produktiver Origin geprüft. Separate Fixture-Prüfung für Anzeige und Cache liegt vor. | Autorisierter CMC-Abruf und offizieller CNN-Datenweg samt Anzeigeerlaubnis. |
| FLH04 · #160/#427 | Draft und veröffentlichten Reviewauftrag auf neuesten Antworten geprüft. | Unabhängiges Kryptografie-/Architekturreview und konkrete Sicherheitsfreigabe. Danach autorisierter Zwei-Geräte-Test. Enrollment und Remote-Write sind gesperrt. |
| Produktmaster · #149 | Fertige interne Textvorschau am ausgelieferten Umfang eingeordnet. | Öffentliche Bewerbung bleibt getrennt zurückgestellt. |
