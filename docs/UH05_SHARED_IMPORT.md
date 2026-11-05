# UH05 – gemeinsamer Originalimport

Basis: Main `588d3d3900477e4b3591917634b4f718d3465b0d`, v286 LIVE_ACCEPTED. Kandidat v287, noch keine Releaseabnahme.

## Nutzbarer Schnitt

Im bestehenden CSV-Dialog „Mehrere Anbieter gemeinsam prüfen“ wählen und bis zu 20 native Originaldateien von Flatex AT, Bittr, Kraken, Bitpanda und Ledger Live auswählen. Die Anbieterzuordnung erfolgt über die vorhandenen Formate, nicht über Dateinamen. Zusammen maximal 5.000 Quellzeilen und je Datei 2 MB. Nicht unterstützte oder fehlerhafte Dateien sperren die gesamte Auswahl.

Konten, Wallet und Quellbereiche explizit zuordnen. Kraken-/Bitpanda-Prüfoberflächen und die bestehenden Flatex-Planer bleiben maßgeblich. Bittr und Ledger-BTC-Beobachtungen werden im bestehenden gemeinsamen Bitcoin-Plan zusammengeführt; keine zusätzliche Bestandswirkung über gescannte Walletbestände. Andere Ledger-Bereiche müssen ausdrücklich offen bleiben. Fehlende Wallets oder Staking-Anzeigen sind kein Nullbestand.

Die abschließende Vorschau enthält Anbietergruppen, bereits vorhandene Quellen, ausdrücklich offene Teilmengen, Brutto/Nettocash/Differenz, Gebührenhinweise und gemeinsame Mengenänderungen. Interne Transfers benötigen weiterhin die bestehenden Gegenbelege. Nicht belegbare Transfers, N:M-, FX- und Sonderfälle erhalten keine automatische Verbuchung. Unbekannte Kosten und Steuern bleiben unbekannt.

## Speicher- und Freigabegrenze

`shared-import.js` komponiert nur vorhandene Vorschau-/Bestätigungskerne auf einem getrennten Entwurf: gemeinsames Bitcoin, Kraken, Bitpanda, Flatex. Keine zweite Matching-, Finanz- oder Journalengine. Die Reihenfolge ist fest; Dateireihenfolge ändert die wirtschaftliche Projektion nicht. Konflikte gemeinsamer Positionen werden von den bestehenden Kernen blockiert, nicht umgangen.

Genau ein aktueller Ausgangsstand, ein vollständig validierter Entwurf und ein bestehender `PortfolioStorage.save`/IndexedDB-CAS-Commit nach explizitem Backup und Gesamtzustimmung. Die Vorschau bindet Ausgangsbytes, Quellen, Auswahl und vollständigen Entwurf; Bestätigung validiert diese Bindung sowie vollständiges Backup/Importmodell und Journal erneut. Sie verwendet den geprüften Entwurf, statt zufällige interne Buchungskennungen und Erfassungszeiten durch eine zweite Planung zu erzeugen. Ein Speicherfehler lädt den kanonischen Stand wieder; kein Teilimport.

Datei-/Zuordnungs-/Mengenauswahländerungen widerrufen Gesamtvorschau, Backup und Zustimmung sowie andere Anbieterfreigaben. Providerfreigaben allein speichern nichts. Wiederimport ohne neue Wirkung erzeugt keinen Commit. Sitzungs-Undo stellt den exakten früheren Zustand wieder her, einschließlich Entfernen optionaler Felder, die erst der Import hinzugefügt hatte. Dauerhafte wirtschaftliche Einzelrücknahmen behalten ihre vorhandenen separaten Prüfabläufe und Tombstones.

## Lokale Nachweise und offene Integration

- 1.214 Unit-Tests, keine Fehler/Skips. Gemeinsamer nativer Kern: 120 Dateireihenfolgen, Überlappungen, doppelte Dateien, Restore, Wiederimport und exaktes Undo. Die ursprüngliche unveränderte UH05-Kernprüfung mit 120 Quellreihenfolgen/600 Restore-Schritten/600 Wiederimporten zusätzlich wiederverwendet.
- Tatsächliche gemeinsame Chromium-UI: beide Dateireihenfolgen, ein CAS-Revisionsschritt, unabhängige Mengen-/Cash-/Gebührensollwerte, Freigabereset, exaktes Undo, Quota, Abbruch nach `put`, echter Zweittab am CAS-Übergang, Offline-Reload, verschlüsseltes v5-Backup und UI-Restore im frischen Profil; 320/360/390/412/430 px und Axe.
- Vorhandene private Originale und unabhängige CSV-/Python-Decimal-Oracles wiederverwendet: zehn Flatex-Dateien/507 Zeilen/24 Paare im gemeinsamen Kern und in tatsächlicher gemeinsamer Chromium-UI mit vier weiteren synthetischen Quellen. Kontrollierte Quellenkennungen und Anfangs-/Endbestände; keine historische Eigentums-/Saldoabnahme. Keine Originale, privaten Kennungen oder Bilder veröffentlicht.
- Bestehende Bitpanda-/Kraken-LINK-/SOL-/große Flatex-Auswahlketten lokal in Chromium regressionsgeprüft. Keine neuen Chainabfragen. Keine lokale Firefox-/WebKit- oder Android-Hardwareabnahme behauptet.

Neue Pflichtkette `tests/browser-shared-import.mjs` hängt am vorhandenen Browserentry `browser-flatex-net-selection.mjs`; damit werden bestehende Chromium-, Firefox-/WebKit- und Produktionsaufrufe unverändert erweitert. Workflowbytes und Gates bleiben unverändert. Reguläre Integrations-CI, Artefaktqualifikation, geschützter Merge, Main/Deployment/TLS und tatsächliche Produktionsabnahme stehen vor LIVE_ACCEPTED noch aus. v286 nicht erneut abnehmen.

UH04/UH05 insgesamt PARTIAL. Inkrementelle Endbestandsrekonstruktion bereits journalisierter Bereiche bleibt nach diesem Release der nächste Fachschnitt. Alle EFF01-/HND01-/Finanz-/Quellen-/Journal-/v5-/IDB-/CAS-/Backup-/Restore-/Offline-/Datenschutzverträge und die vorhandenen Aufgaben UI300/QUALITY298/CI229 gelten weiter.
