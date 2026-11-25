# FolioLab Open · Checkpoint vom 25.11.2026

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
