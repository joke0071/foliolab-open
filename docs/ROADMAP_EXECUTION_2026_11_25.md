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


## Offene Abnahmekriterien und vorbereitete Arbeit

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
