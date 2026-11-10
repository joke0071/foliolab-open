# K2-KURSE – begrenzter Quellen-/Hilfenabgleich, 10.11.2026

**DOC_CANDIDATE_VALIDATED; nicht in Main integriert, keine Releasefreigabe.**

## Taskkarte

Nutzerziel: Die drei vorhandenen Kurshilfen dürfen keine entfernten Anbieter-Zugänge empfehlen und müssen aktuellen Kurs, tatsächlich verfügbare Historie, Abrufhäufigkeit und den optionalen Zugangsdaten-Backupumfang korrekt unterscheiden. Risiko: reine Dokumentation. Kein neuer Adapter, keine Finanz-/Schema-/Speicher-/Credential-/Gateänderung; keine Anbieteranfrage mit Nutzerzugängen.

Abnahmekriterien: (1) alle drei Hilfen nennen nur aktive Zugänge als Einrichtungsmöglichkeit, (2) Quellenreihenfolge/Listing und Langzeitgrenzen stimmen mit Main überein, (3) täglich/aus/6h/30m korrekt und von Diagrammzeiträumen getrennt, (4) normaler Export und ausdrücklich vollständiges verschlüsseltes Backup unterschieden, (5) ausschließlich drei Markdown-Dateien verändert, vorhandene fachliche Gegenproben bestanden.

## Exakte Identität und Ergebnis

- Basis Main `73a17662e53d4b4d88125a85879e5fcae112596e`, Tree `160ba4767a04dc6a3d38b2d2058dbf529a2c7ff1`, v303 LIVE_ACCEPTED unverändert.
- Einziger begrenzter Kandidat `dd1bcecbd5255313e150257952fcb7aecccd3817`, Tree `759e8b5099c86ed39825c553cc5c7b5c27bbb40f`, Branch [docs/k2-source-help-e595fcc6d453](https://github.com/joke0071/foliolab-open/tree/docs/k2-source-help-e595fcc6d453).
- [Exakter Drei-Dateien-Vergleich](https://github.com/joke0071/foliolab-open/compare/73a17662e53d4b4d88125a85879e5fcae112596e...dd1bcecbd5255313e150257952fcb7aecccd3817). Rekursive nichtabgeschnittene Gitbäume bestätigen identischen gesamten übrigen Blobbestand. Kein Runtime-/Test-/Workflow-/SW-Diff.
- Noch keine PR/CI/Mainintegration/Deployment durch dieses Paket. Kein zusätzliches Vollrelease allein für diese drei Textkorrekturen begonnen. Kandidat für nächste fachlich passende gebündelte Integration erhalten; alle dann vorgeschriebenen Integrations-/Main-/Produktionsgates bleiben verbindlich.
- Die Checkpoint-README weicht historisch von Main ab. Deshalb Kandidat ausdrücklich aus Main aufgebaut; Checkpointbranch niemals als Ganzes integrieren.

## Reproduktion und Korrektur

| Hilfe | Reproduzierter Mainfehler | Kandidat |
| --- | --- | --- |
| README.md | Empfiehlt mehrfach Twelve/FMP/direktes EODHD, alte Suchreihenfolge und 30-Minuten-Automatik | Aktive Alpha-/Marketstack-/Workerpfade und lokale/Alpha-Suche; täglich als Standard; Historiendeckung separat; Credential-Backup präzisiert |
| worker/README.md | Behauptet entfernte Direktquellen als Alternative und kategorisch keinen Worker-Token im Backup | Aktive Alternativen; normaler Export ohne Token, ausdrücklich opt-in vollständiges verschlüsseltes Backup mit unterstützter Konfiguration |
| docs/EXTENDED_CHART_PERIODS_2026-10-24.md | Entfernte Anbieter als 5-Jahresquelle, veraltete Basisperioden und pauschale Coverage | Basisperioden inklusive6M;3J/5J nur konfigurierteWorker-/hinreichendalte lokaleHistorie; Alpha100Handelstage/Marketstack330Kalendertage, aktuelleQuote≠vollständigeHistorie |

Codezuordnung des unveränderten Main: `src/security-sources.js` (aktive Reihenfolge/Listing), `security-discovery.js` (lokal/Alpha; fehlende ISIN), `retired-providers.js` (entfernte Zugänge), `alpha-vantage.js`/`marketstack.js` (tatsächliche angefragte Historie), `position-history.js` (Perioden/Coverage), `refresh-frequency.js`/`index.html` (täglich/aus/6h/30m), `complete-backup.js` (opt-inportableSettings), `historical-csv.js` (lokale validierte Reihen).

## Validierung und Grenzen

Lokale Testumgebung: Node24.22.1. Keine Browser-/Paketinstallation benötigt.

79 ausgewählte Quell-/Test-/Dokumentdateien aus dem exakten Main geladen; lokale Byteidentität gegen Gitblob-SHAs vor der abschließenden Gegenprobe bestätigt. `git diff --check` PASS. Kein neuer Test, der nur Textimplementation spiegelt.

Bestehende `extended-chart-periods`, `retired-providers`, `refresh-frequency`, `security-sources` und `complete-backup`-Units: **27 Tests,27PASS,0FAIL,0SKIP**. [Originalausgabe](release-evidence/k2-source-help-local-tests-2026-11-10.txt). Das ist eine begrenzte Quellen-/Perioden-/Restoregegenprobe, kein Full-CI-/Browser-/Realprovider-/Geräte-/OAuth-PASS.

K2-KURSE insgesamt bleibt PARTIAL; dieser Hilfenrest bleibt bis Mainintegration offen. Historische Implementierungsbelege wie ALPHA_VANTAGE_266/ETF_QUOTE_266_BROWSER_RECOVERY sind keine aktuelle Einrichtungshilfe und wurden nicht nachträglich als neue Anbieterabnahme umgeschrieben. K1 fehlt weiterhin unabhängige historische Anfangs-/End-/Ownershipabdeckung; vorhandene Belegzuordnung erhalten. Android/TalkBack/Safari/OAuth bleiben extern.

## Genau nächste Aktion

Diesen exakten Drei-Dateien-Kandidaten ohne erneute Quellengrundanalyse für die nächste passende gebündelte Integration verwenden; bei geänderter Mainbasis Diff/Transitivität frisch prüfen. Keine PR/volleCI allein aus Gewohnheit für diesen Hilfenpatch. Danach K3/K6-Kernbedienungsrest gemäß kanonischerMatrix seriell und nur bei konkret reproduzierter Kernlücke öffnen. Keine neue EFF03-Ausweitung, kein exotischer Finanzsonderfall, keine Wiederabnahme von v303.
