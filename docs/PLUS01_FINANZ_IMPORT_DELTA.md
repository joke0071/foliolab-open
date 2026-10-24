# PLUS01 — Finanz- und Import-Delta

Start: `98b35c155a847a9216f3843f755dd5f509953090` (main, 24.10.2026). Baseline: 436 Node-Tests bestanden; vorhandene CI [40108182449](https://github.com/joke0071/foliolab-open/actions/runs/40108182449) grün. PLUS-Priorisierung und PLUS01 sowie WP01/02/04/05 vollständig gelesen. Kein neuer Audit der bereits funktionierenden UI; keine Storage-Änderung.

## Reproduzierbare Befunde und Korrekturen

| Priorität | Reproduktion am Ausgangsstand | Korrektur / Nachweis |
|---|---|---|
| P0 | XIRR mit -100/+350/-350/+100 liefert eine von mehreren Wurzeln; gleichzeitige Gegenbuchungen liefern eine beliebige Rendite | Tagesnetting, konservativer Eindeutigkeitsnachweis; p0-performance-boundaries |
| P0 | Unbekannter externer Cashflow (null) zwischen 100 und 110 wird zu 0 und ergibt ca. 10 % Rendite | Unbekannte Beträge vor Vorzeichen-/Zahlenumwandlung ablehnen; TWR/XIRR verweigern Kennzahl |
| P1 | Fehlende Dietz-Flows werden zu 0, Überläufe nicht abgelehnt | Explizite Flow-Eingaben, finite Ergebnisse; unabhängige Referenzen |
| P0 | Gleiche externe ID mit geändertem Betrag wird als neue Buchung eingefügt | Quelle/Konto/externe ID; geänderte Nutzdaten oder manuelle Korrektur führen zu Konflikt |
| P0 | Gleiche Buchung ohne ID in einer anderen Datei wird still übersprungen | SHA-256 der normalisierten Datei plus Originalzeile; Quell-/Dateiidentität statt Betrags-Deduplizierung |
| P0 | CSV ohne historische Kurse nutzt heutigen Positionskurs; fehlende Nebenkosten können bestätigte Kostenbasis erzeugen | Historischer Kurs erforderlich; fehlende Kosten bleiben null. Ohne belegte Gebühren/Steuern keine reale Cash-Verrechnung oder Überschreibung bestätigter Basis |
| P1 | Commit prüft hauptsächlich Anzahl/Version, nicht vollständige Bestandskonsistenz | Backup-Validierung, Journal-Reconciliation und unveränderte bestehende Buchungen vor Übernahme |

## Enger Lösungsumfang

Die vorhandene Journal-, Vorschau- und Speicherengine bleibt bestehen. Optionale versionierte `booking.importSource` ergänzt Quelle, lokales Konto, externe ID, Nutzdaten, Datei-/Zeilenidentität und einen Vergleichsstand der importierten Buchung/Journaleinträge. Legacy-Daten erhalten keine erfundene Herkunft. Verdächtige Legacy-Treffer bleiben Prüfkonflikte; sie werden nicht still verworfen oder überschrieben. Eine nicht erneut ausgewählte Cash-Verknüpfung kann beim Wiederimport die frühere bestätigte Zuordnung nicht löschen. Explizite Änderungen bleiben Konflikte.

Flatex verwendet die Original-TA-Referenz statt der aus Inhalten berechneten ID als starke Identität. Depotumsätze sind weiterhin kein Beleg vollständiger Gebühren/Steuern; die vorhandene Beta und Quarantäne von Kontoumsätzen bleiben erhalten. Bei allgemeinen CSV-Dateien sind Kosten erst mit expliziten Werten in Gebühren- und Steuerspalte belegt (auch 0). Fehlen sie, sind nur Stückzahlbuchungen ohne Cash-Verrechnung und ohne Verlust bereits bestätigter Kostenbasis erlaubt. Importierte unbekannte Kosten werden als null gespeichert. Die bestehenden Tests für echte Cash-Verrechnung enthalten jetzt explizite Nullsteuern/-gebühren; ihre Bestands-, Journal- und Wiederimportassertions wurden nicht abgeschwächt.

SHA-256 bleibt synchron, damit die vorhandene Preview-API nicht umgebaut wird; unabhängige Node-crypto-Vergleiche prüfen Padding, Unicode und große Eingaben. Die vollständige Datei wird weder gespeichert noch hochgeladen. Keine neue Abhängigkeit, keine AGPL-Übernahme, keine Datenmigration, kein Backend.

## Tests und Grenzen

Lokaler Node-Gesamtlauf: 456 bestanden, 0 fehlgeschlagen; `npm run check` bestanden (vor finaler CI). Neue Referenzen: mehrere XIRR-Wurzeln, Tagesnetting, null-Cashflow, Überlauf, unbekannte Kosten, gleicher/anderer Import, zwei identische Zeilen, zwei Konten, manuelle Korrektur, widersprüchliche ID, Backup-Roundtrip, stale Preview, Fehlerzeile und Journal-Manipulation.

`browser-p0-import.mjs` ergänzt die vorhandene CI: IDB-Quota und Transaktionsabbruch lassen den gespeicherten Stand unverändert, bei zwei konkurrierenden Importen gewinnt exakt eine Revision; Wiederanlauf und Backup/Restore bleiben idempotent. Bestehende Flatex-, Mobile-, A11y-, PWA-, Chromium-, Firefox- und WebKit-Gates bleiben unverändert verpflichtend. Lokale Browserinstallation war zeitweise durch fehlende Binaries/Downloadfehler blockiert; nur tatsächlich erfolgreiche lokale oder CI-Läufe gelten als Nachweis. Finale SHA-/CI-Nachweise stehen im PR.

## Abgrenzung und Integration

PRs #103–#106 enthalten ältere, teilweise überlappende Vorarbeit. PLUS01 nutzt gezielt deren Finanz-/Herkunftskorrekturen auf aktuellem main; die alten Finanz-/Import-PRs nicht zusätzlich blind mergen. Kein PR wurde automatisch geschlossen. #110 (Backup-Passwort) bleibt separat und muss nach Integration erneut auf Konflikte geprüft werden.

Issue #44 / PLUS02: gleichzeitige localStorage-Schreibvorgänge sind weiterhin nicht atomar. PLUS01 ändert die Speicherung nicht. IndexedDB-CAS ist vorhanden und wird für konkurrierende Importe geprüft. Der separate Storage-PR #105 ist eine überprüfbare Vorarbeit für PLUS02, kein bereits integrierter Fix. Android-Realgerät nicht geprüft. PLUS02 soll diese vorhandene Arbeit gegen den dann aktuellen main prüfen, ohne Neuimplementierung.

Nicht-konventionelle XIRR-Reihen mit mehreren Vorzeichenwechseln bleiben konservativ unbekannt, auch wenn einzelne Reihen nur eine reale Wurzel hätten. Unklare Importkonflikte bleiben gesperrt oder müssen bewusst übersprungen werden; kein automatisches heuristisches Matching. Reale Flatex-Steuer-/Abrechnungsbelege sind nicht Teil dieses Auftrags und werden für PLUS03/04 benötigt.

Kein Merge in main, kein Deployment. Freigabe und anschließender Integrationstest bleiben erforderlich.
