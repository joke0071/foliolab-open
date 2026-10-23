# FolioLab Open – Mehrstufige Währungs- und Kapitalmaßnahmenprüfung

**Datum:** 23.10.2026  
**Ausgangsstand:** `7072430980e24b32f9c47acbaa0e81a830ee83d9` (v69)  
**Arbeitszweig:** `audit/2026-10-23-fx-corporate-actions`

## Ziel

Risikobasierte technische und fachliche Referenzprüfung komplexerer Transaktionsketten: mehrere Teilverkäufe mit Gebühren und Steuern, mehrere historische EUR/USD-Umrechnungen sowie Abgrenzung *bargeldloser* Corporate Actions von Umwandlungen mit Geldfluss.

Keine automatische Steuerberechnung, keine Änderung vorhandener historischer Buchungen, keine Änderung der Speicherstruktur.

## Fachliche Referenzwerte

### EUR: gewichtete historische Kostenbasis nach drei Buchungen

- Start: 7 Wertpapiere, 700 EUR Basis, 3.000 EUR Guthaben.
- Kauf 3 × 90 EUR, 3 EUR Gebühren → 10 Anteile, 973 EUR Basis, 2.727 EUR Guthaben.
- Verkauf 4 × 110 EUR, 2 EUR Gebühren und 1 EUR Steuer → 6 Anteile, 583,80 EUR Basis, 47,80 EUR kumulierter Gewinn, 3.164 EUR Guthaben.
- Verkauf 2 × 95 EUR, 1 EUR Gebühr → **4 Anteile, 389,20 EUR Basis, 42,20 EUR kumulierter Gewinn, 3.353 EUR Guthaben**.
- Keine Einzahlung/Auszahlung erfunden; Journal und Bestände bleiben miteinander vereinbar.

### USD: unterschiedliche historische Wechselkurse

- Start: 3 Anteile, 255 EUR Basis; USD-Guthaben 2.000; Bewertungsreferenz 0,85 EUR/USD.
- Kauf 1 × 100 USD bei 0,8 EUR/USD, 1,60 EUR Gebühr → 4 Anteile, 336,60 EUR Basis; USD-Guthaben 1.898.
- Verkauf 2 × 110 USD bei 0,9 EUR/USD, 1 EUR Gebühr und 0,80 EUR Steuer → 2 Anteile, 168,30 EUR Basis, 27,90 EUR kumulierter Gewinn; USD-Guthaben 2.116.
- Verkauf 1 × 120 USD bei 0,95 EUR/USD, 0,50 EUR Gebühr → **1 Anteil, 84,15 EUR Basis, 57,25 EUR kumulierter Gewinn, USD-Guthaben 2.235,473684210526315789** (18-Dezimal-Abrechnung).
- Der jeweils eingegebene historische Handelswechselkurs bestimmt den konkreten Transaktionsbetrag; er ersetzt nicht automatisch den **aktuellen** Bewertungswechselkurs des USD-Geldkontos.

## Nachgewiesene Risiken und Schutzmaßnahmen

| ID | Risiko | Umsetzung |
|---|---|---|
| FIN-05 | `swap`/`merger` könnte eine Geldposition als Quelle oder Ziel zulassen, aber mit **monetären Nullbuchungen** arbeiten. Damit entstünde eine Geldänderung ohne nachvollziehbaren Geldfluss | Bargeldpositionen als Quelle oder Ziel bargeldloser Umwandlung ablehnen. Bei Geldfluss separate Kauf-/Verkaufs-/Geldbuchungen anhand der Brokerabrechnung vorsehen |
| FIN-06 | Reverse Split kann einen Bestand unterhalb der kleinsten unterstützten 18-Dezimal-Einheit auf **0** runden und dessen Kostenbasis erhalten | Nicht darstellbare Null-Rundung eines bestehenden Bestands ausdrücklich ablehnen; Brokerabrechnung/Barabfindung prüfen |
| FIN-07 | Gemischte Split-/Umtauschvorgänge mit explizit mitgelieferter `cashInLieuEUR`-Komponente könnten als rein bargeldlose Buchung behandelt werden | Eine positive zusätzliche Barabfindung wird nicht stillschweigend ignoriert, sondern abgewiesen. Dialoghinweise erklären die derzeit fehlende automatische Erfassung des Barausgleichs |

## Technische Tests

`tests/ledger-multistep-fx-corporate.test.mjs` enthält getrennte Sollwerte und prüft:

- EUR-Buchungsserie samt Gebühren, Steuern, verbleibender gewichteter Basis, Gewinn und Cash
- Drei verschiedene historische USD/EUR-Handelswechselkurse, USD-Kassenbewegungen und ausgeglichene EUR-Journalbuchungen
- Backup-Roundtrip ohne Verlust der exakten EUR-/USD-Werte
- Abweisung von Cash-Ziel und Cash-Quelle bei Swap und Fusion ohne Modellmutation
- Abweisung nicht unterstützter positiver Barausgleichsfelder
- Schutz vor auf null gerundeten extrem kleinen Reverse-Split-Beständen

**Noch keine vollständige steuerliche oder buchhalterische Abbildung einer Barabfindung.** Die bisherige Funktion erfasst ausschließlich reine Bestandsumwandlungen und -splits. Der echte Geldanteil muss zunächst anhand der Brokerabrechnung und geltenden Besteuerungs-/Bewertungsregeln gesondert erfasst werden. Eine unvollständige automatisierte Erfassung wäre fachlich riskanter als die transparente Einschränkung.

## Releasebedingungen

- Node-Prüfungen einschließlich der neuen Referenzfälle und bestehender 303 Tests
- Chromium-Browser-Teststrecke, Firefox/WebKit, Accessibility und Offline-PWA-Prüfungen
- Kein Merge ohne grüne CI auf dem exakt überprüften Branch-Head
- Nach Merge GitHub Pages sowie über HTTP ausgelieferte Startseite/Cache-Version bestätigen
