# Changelog

## 1.1.0 — 2026-10-22

- Drei-Schritt-Anlage-Assistent mit lokaler Stammdatensuche, manueller Anlage, kontobezogener Anbieter-Neuanlage und bewusst getrenntem Anfangsbestand versus Kaufjournal.
- Optionaler, separat getesteter öffentlicher OpenFIGI-v3-Metadatensuch-Worker (nicht standardmäßig deployed). Opt-in-URL; keine Preisquelle und kein verpflichtender API-Key.
- Sichere Anbieter-/Kontofilter, Währungskennzeichnung und explizite EUR-FX-Erfassung für neue Guthaben, optionales dokumentarisches Anfangsdatum.
- Klarere und interaktive Bewertungswarnungen, dezente Fehlergruppierung bei Marktdatenabrufen und erhaltener letzter gültiger Kurs.
- Lokale Positionssuche, sortierbare Anzeige, ausklappbare technische Positionsdetails, Buchungsfilter und bessere Leerzustände.
- Zeitraumfilter im Vermögensdiagramm, kompaktere Anbieter-/Kontoverwaltung, mobile Dialogverbesserungen und nachvollziehbarer Backup-Exportzeitpunkt.
- Vorsichtige Legacy-Sonic-Korrektur mit idempotenter Migration ohne Änderung historischer Bestands- und Transaktionswerte.
- Erweiterte Node-/Playwright-/Worker-Tests, CI-Gates und PWA-Cache-Versionierung.

Keine verpflichtenden neuen externen Server, Benutzerkonten oder zentral gespeicherten Portfoliodaten. Die frühere technische Bearbeitung bleibt als erweiterte Erfassung erhalten.
