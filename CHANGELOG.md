## 1.3.0 — 2026-10-22

- Unterstützt lokale, große CSV/TXT-Wertpapierverzeichnisse (Xetra T7 All tradable instruments, Nasdaq-Trader-Symboldateien, kompatible ESMA-FIRDS-CSV-Auszüge und eigene Tabellen).
- Datenschutzfreundliche IndexedDB-Speicherung, gleichzeitige Verwendung mehrerer Datenquellen und differenzierte Treffer nach ISIN/MIC/Ticker/Währung.
- Importprüfung und Ausklammerung von inaktiven bzw. Testwerten; keine fingierte ISIN oder Kurswährung.
- Aktualitätswarnung ab 30 Tagen (bei Xetra nach Quell-Datum), erneuter Import ersetzt nur die betreffende Datei.
- Keine zweifelhafte zentrale Redistribution oder unautorisierter periodischer Drittserver-Download; direkte Bezugslinks mit transparenter Quellenangabe.
- Browser- und Unit-Tests für große Verzeichnisse, mobile Darstellung, Offline-Cache und Portfoliointegrität.

## 1.2.0 — 2026-10-22

- Live geladene CoinGecko-Top-100 mit korrekter ID, expliziter Auswahl und Ranking; auf Wunsch erweiterte Suche im gesamten öffentlichen CoinGecko-Katalog ohne verpflichtenden API-Key.
- Neuer lokaler CSV-Import für die von Nutzern bezogenen OeKB-Meldefondslisten mit ISIN-Deduplizierung, Suche und dokumentierter Quellen-/Aktualitätseinschränkung.
- Keine erfundenen Handelsplätze, Kurswährungen, Fondsstatus oder automatischen Kurswerte.
- Such- und Importdaten bleiben vom Portfolio getrennt; responsive UI, Tests und Offline-Fallback.

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
