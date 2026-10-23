## PWA-Revision v88 — 2026-10-23

- Abbruchfester Rückwechsel von IndexedDB zu localStorage: Ein minimaler, schlüsselfreier Rückwechsel-Marker ermöglicht das Wiederherstellen der zuletzt bestätigten lokalen Kopie, wenn der Browser nach dem atomaren IndexedDB-Lösch-Commit, aber vor dem Entfernen des Modusmarkers abstürzt.
- Automatische Fortsetzung nur bei passender Speicherrevision und unveränderter lokaler Kopie; sonst kein stillschweigender Datenwechsel. Vollständiges Löschen kann nicht durch einen älteren Rückwechsel-Marker rückgängig gemacht werden.
- Ein bereits geöffnetes älteres localStorage-Tab mit aktuellem Anwendungscode wird nach der Aktivierung von IndexedDB am Speichern gehindert.
- Zusätzliche Chromium-Browserregression; keine automatische Migration und keine Änderung von Renditen oder Buchungen.

## PWA-Revision v86 — 2026-10-23

- Sicherheitskorrektur für den optionalen IndexedDB-Wechsel: bereits vor dem Start veraltete lokale Portfolio- und Einstellungsversionen werden zuverlässig erkannt und dürfen nicht migriert werden.
- Neue Browserregressionen für abweichende Ursprungsdaten, unterbrochenen Cutover vor Speicherung des Modusmarkers, simulierte Quota-Fehler und gleichzeitige Backup-Imports.
- Bestehende Portfolios bleiben standardmäßig auf localStorage; keine automatische Migration und keine Änderung der Finanzberechnungen.

## PWA-Revision v85 — 2026-10-23

- Optionaler, ausdrücklich bestätigter Wechsel zu transaktionaler IndexedDB mit lokalem Backup und rückgängig machbarem Cutover.
- Asynchrone Speicherpfade warten vor Erfolgsmeldungen auf Transaktionsabschluss, einschließlich CSV/Backup-Import.
- API-Schlüssel bleiben lokal in IndexedDB; Download-Backups bleiben ohne Zugangsdaten.

## PWA-Revision v84 — 2026-10-23

- Sicherere, bislang nicht aktivierte IndexedDB-Speicher-Engine: beschädigte Portfolios werden weder akzeptiert noch unbemerkt überschrieben.
- Browserübergreifende Regression für parallele Transaktionen, Tab-Neustarts und beschädigte Datensätze.
- Keine Änderung der produktiven localStorage-Quelle; vollständiger Cutover ist weiterhin offen (#44).

## PWA-Revision v82 — 2026-10-23

- Read-only EODHD-Verbindungsdiagnose auf Knopfdruck für bis zu vier tatsächlich vorhandene Wertpapiernotierungen (direkt oder über eigenen Worker). Keine weiteren Versuche nach globalen Netzwerk-, Zugangs- oder Ratenlimitfehlern.
- Kursqualität nach Quellnachweis und Datierung gekennzeichnet; historische Stichtagswerte, undatierte und ungeprüfte Kurse werden nicht als aktuelle Börsenkurse dargestellt.
- Browser- und Unit-Regression ohne echten API-Schlüssel; Portfolio, Journal und Stichtage bleiben unangetastet.

## PWA-Revision v76 — 2026-10-23

- EODHD-Netzwerkfehler werden gezielt über den zweiten offiziell dokumentierten EODHD-HTTPS-Host abgefangen. Kein stiller Wechsel bei Authentifizierungs-, Tarif- oder Ratenlimitfehlern; vorhandene Kurse bleiben bei Ausfall erhalten.
- Alle API-Schlüssel in „Mehr“ lassen sich per barrierearm beschriftetem Auge-Symbol anzeigen und wieder maskieren. Die Solana-RPC-Adresse wird wegen möglicher eingebetteter API-Tokens ebenfalls standardmäßig verborgen.
- Externe Anbieterlinks zu Binplorer und Helius aus „Mehr“ entfernt; sachliche Einrichtungshinweise bleiben bestehen.
- Tests für EODHD-Host-Fallback, Schutz von API-Zugangsdaten, Link-Entfernung und responsive Darstellung ergänzt.

## PWA-Revision v75 — 2026-10-23

- Erste, bewusst noch nicht aktivierte IndexedDB-Speicherkomponente: transaktionale Revisionen und Mehr-Tab-Konfliktschutz per atomarem Compare-and-Swap.
- Revisions-Tombstones verhindern das Wiederherstellen gelöschter Portfolios durch veraltete Tabs.
- Opt-in-Migrationsschnittstelle für alte v1/v2/v3-Portfolioformate ohne automatische Übertragung; API-Keys bleiben aus der neuen Kopie ausgeschlossen.
- Browser-Regression für parallele Schreibvorgänge, fehlgeschlagene Transaktionen, Wiederherstellung und Offline-Modulcache.
- Aktiver Speichertyp bleibt unverändert `localStorage`. Weitere Schritte und offene Risiken in `docs/INDEXEDDB_STAGED_MIGRATION_2026-10-23.md`.

## 1.3.3 — 2026-10-22

- Entfernt alle vier fest hinterlegten Beispiel-ETFs aus der sichtbaren Anlage-Suche.
- Treffer kommen aus ausdrücklich importierten CSV/TXT-Verzeichnissen oder bewusst ausgelöster externer Suche.
- Bei noch leerem Katalog klare Importanleitung; die manuelle Eingabe bleibt möglich.
- Interne verifizierte Alt-Backup-Zuordnung bleibt ohne sichtbare Vorauswahl erhalten.
- Browser-Test für die leere ETF-Suche und Treffer nach Xetra-CSV-Import.

## 1.3.2 — 2026-10-22

- Vollständige Originaldatenquellen erneut verifiziert und von unvollständigen Oberflächen-Exporten abgegrenzt.
- Xetra-Schemafelder MIC Code und Settlement Currency korrekt eingelesen, ohne Settlement Currency als Kurswährung auszugeben.
- Nasdaq-Listed und Other-Listed mit direkten HTTPS-Downloads, Marktzuteilung und Quelldatum.
- PWA meldet Updates ohne automatische Neuladung offener Eingabeformulare.
- Tatsächlich noch nicht umgesetzten automatischen Wertpapier-Grundkatalog transparent dokumentiert.

## 1.3.1 — 2026-10-22

- Entfernt den irreführenden prominent platzierten OeKB-Meldefonds-CSV-Import aus dem Anlage-Assistenten; die OeKB bleibt für die Einzelabfrage relevant.
- Verlegt die Xetra-Downloadhilfe und den lokalen CSV/TXT-Katalogimport in ein dezentes, standardmäßig geschlossenes Details-Element unter der Suche.
- Vorhandene lokal importierte Fondsdaten und die breiten Katalogfunktionen bleiben erhalten. Browser-Tests für versteckten und geöffneten Zustand ergänzt.

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
