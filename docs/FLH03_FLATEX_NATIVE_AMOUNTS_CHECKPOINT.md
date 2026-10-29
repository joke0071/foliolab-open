# Native Flatex-Betragsprüfung – Kandidatencheckpoint · 29.10.2026

Basis main2b6ec815/v203 LIVE_ACCEPTED. Maßgebliche aktuelle Übergabe immer docs/WORK_RESTPAKETE_CHECKPOINT.md auf feature/flh05-import-foundation; dieser Stand beschreibt vor PR-CI erstellte Kandidatenarbeit.

Einziger Funktionsbranch feature/flh03-flatex-native-amounts, Vertrag vor Code auf d91b4586 dauerhaft gesichert. Reiner auditNativeFlatexSettlementAmounts im vorhandenen Modul, bestehende Order-/Quellidentitätsgates und gemeinsam extrahierte Legacy-Rechenfunktion wiederverwendet. Nur eindeutige quellklare1:1-Stückbelege mit richtiger Nominalrichtung/gleichen deklarierten Währungen; nicht exakt darstellbare Produkte bleiben Review. Keine Gebühren-/Steuer-/FX-Annahme, keine Kontoeigentümerschaft/Finanz-DTOs/Journal-/Storage-/Backup-/UIintegration. Alle Quelllokatoren/Reviewgruppen erhalten, ready/writeEnabled/costsVerified false.

12 neue synthetische Unitfälle plus unveränderte Legacygates, vollständige lokale Unitläufe Node20/Node24 jeweils914PASS/0Fehler/Skip und Syntax PASS; aktuelle volle PR-/Wallet-/Drei-Engine-Abnahme vor abschließender Kennzeichnung prüfen. Lokaler Chromium-Runtime-/echter SW-Offline-/exakter IDB-/Revision-/Settings-Nullmutationsnachweis PASS, keine externen Requests. Keine UI-Darstellung geändert, kein neuer visueller PASS behauptet.

Private Originale separat außerhalb Git nur lesend: unabhängiger Python-csv/Decimal-Referenzvergleich gegen neuen Helfer PASS, alle Originalzeilen erhalten/unverändert. Keine Originalwerte/Zeilen/Referenzen/Zeitspannen/Fingerprints ins Repository/CI übernommen. Nicht als vollständiger Import-/Kosten-/Bestands-/Cashflow-/Performancebeleg ausgeben.

SW204 ausschließlich unveröffentlichter Kandidat, Produktion weiterhinv203. Kein Merge/Deployment in diesen zwei Etappen Vertrag + geprüfte Grundlage; spätere UI-/Releaseanbindung separat. Historienstart01.01.2022/keine Fiktionen, UI-MASTER28/DELETE-MASTER28 und ursprüngliche Roadmap/FLH04/P0/P1/PERF erhalten; FLH05 nicht vorziehen, PROJ01 Backlog. Gesamtmaster PARTIAL.

