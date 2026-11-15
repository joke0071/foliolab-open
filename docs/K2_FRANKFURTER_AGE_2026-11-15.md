# K2 · Frankfurter: veraltete aktuelle Referenzkurse abweisen

Ausgangsbasis: Main `8c53cbfd77be9a37cce31cc4df8396e9f2f06ede` nach PR343. Dessen Produktbytes entsprechen v318. Die vorhandene Reproduktion in `docs/release-evidence/v318-2026-11-15/next-fx-baseline-repro.json` zeigt einen übernommenen Kurs vom 03.01.2000 im tatsächlichen Refreshhandler.

## Verhalten und Altersgrenze

`exchangeRateQuote()` prüfte bisher Währung, Zahlenwert, Kalenderdatum und Zukunft, aber kein Höchstalter. Der normale Refresh speicherte deshalb den alten Wert mit neuem `fxUpdatedAt`, Snapshot und erfolgreichem Aktualisierungsstatus.

Die bestehende Regel bewertet Kurse nach Anbieterzeit statt Abrufzeit: `coinQuoteFreshness()`/`priceQuality()` nennen sieben Tage; die taggenauen Frankfurter-Verträge `historicalExchangeRate()` und `historicalExchangeRates()` gestatten höchstens sieben Kalendertage Rückgriff. Daraus folgt für einen Tageskurs ohne Uhrzeit: Differenz zwischen aktuellem UTC-Kalendertag und tatsächlichem Publikationstag höchstens sieben Tage. Keine neue 24-Stunden-Grenze, die Wochenenden ausschließen würde; keine Übernahme der abweichenden achtmal24h-Toleranz des Wertpapiertransports.

Der aktuelle datierte Frankfurter-Leser lehnt größere Tagesabstände vor Rückgabe an jeden Aufrufer ab. Der vorhandene Refresh-Fehlerpfad erhält so Kurs, Datum und UNKNOWN ohne Produktänderung am Speicher-/Erfolgsmechanismus. Der historische Kursabruf bleibt historisch; die numerische Legacy-Kompatibilitätsmethode bleibt unverändert. Keine Migration und keine Änderung von Finanz-/Journal-/CAS-Verträgen. SW-Cache v319 ist für die geänderte Produktdatei erforderlich; PR343 selbst blieb v318.

## Reproduzierbare Nachweise

Feste Browserzeit `2026-11-15T18:00:00.000Z` (Sonntag), ausschließlich synthetische Konten/Antworten. `tests/browser-fx-age.mjs` wird über den bestehenden obligatorischen `browser-etf-source-recovery.mjs`-Einstieg in Chromium, Firefox und WebKit ausgeführt, einschließlich bestehender Live-Quellenprüfungen. Kein Workflow geändert. Normaler Klick auf `#refreshAll`, echte Web Locks, echtes IndexedDB, vollständiger Recordvergleich nach Reload. Service Worker in diesem Finanztest blockiert; separate bestehende SW-/Offline-/Update-/Releasegates bleiben unverändert.

| Fall | Festes Antwortdatum | Erwartung |
| --- | --- | --- |
| Alter Kurs mit Bestand | 2000-01-03 | `0.9`, Datum 2026-11-12 und alle Positionsfelder erhalten; gesamter IDBRecord einschließlich Revision/Snapshot unverändert |
| Alter Kurs ohne Bestand | 2000-01-03 | `fxRate=null`, `fxRateExact=UNKNOWN`; gesamter Record unverändert |
| Acht-Tage-Grenze | 2026-11-07 | Abweisung wie oben |
| Gültiger Tageskurs | 2026-11-15 | `0.85`, tatsächliches Datum und fester Abrufzeitpunkt gespeichert |
| Wochenende → Freitag | 2026-11-13 | `0.85` mit Freitagdatum gespeichert |
| Sieben-Tage-Grenze | 2026-11-08 | Noch akzeptiert, Datum unverändert |
| Alter USD-Kurs und anderer gültiger GBP-Kurs, je mit Bestand und UNKNOWN | 2000-01-03 / 2026-11-13 | USD vollständig erhalten, GBP `1.1` tatsächlich gespeichert, kein USD-Completionmarker und kein vollständiger Erfolgszeitpunkt |

Bei isolierter Ablehnung: UI `0 Datenupdates · 1 Abfragen prüfen`, keine „Portfolio aktualisiert.“-Meldung; `lastSuccessAt=null`, keine abgeschlossene FX-Teilaufgabe, Fehlversuch gespeichert. Bei Erfolg: tatsächlicher gespeicherter Kurs plus Erfolg/Completionmarker. In jedem Fall vollständige Gleichheit des nachher tatsächlich wieder geöffneten IDBRecords und des Schedulerzustands; Journal und externe Flüsse bleiben unverändert. Stageprotokoll vor jedem Fall und vor den kritischen Refresh-/Cleanup-Grenzen, damit Abbrüche lokalisierbar bleiben.

Zusätzlich Node-Grenzprüfung und tatsächlicher Refreshhandler mit UNKNOWN-Gegenfall. Fest datierte bestehende Referenzkurstests erhalten eine feste Uhr, damit weder Ablauf der Testdaten noch aktuelle Tageszeit die Aussage verändert. Bestehende Zahlen-/Währungs-/Kalender-/Zukunftsprüfungen bleiben erhalten.

Lokale Gegenprobe mit altem Main-Kursleser und demselben nativen UI-/IDB-Ablauf reproduziert den Fehler auch nach Wiederöffnung: Kurs `0.1`/2000-01-03 überschreibt Bestand und UNKNOWN, Erfolgszeitpunkt und Meldung werden gesetzt. Dies erweitert die alte Save-Doppel-Reproduktion um echte Persistenz; keine echte Provider- oder historische Finanzabnahme.

## Abschlussgrenze

Eigener PR; Merge erst nach separater Nutzerentscheidung über dessen exakten qualifizierten Head. Reguläre PR-/Wallet-Gates, Original-ZIPs und gesichertes bytegleiches Readback mit tatsächlichem Restore werden im zentralen Checkpoint/Qualifikationsbericht zugeordnet. Eigener vollständiger Diffreview, keine unabhängige Fremdprüfung behauptet. Synthetische Headless-Engines ersetzen weder Windows-/Android-Gerätebelege noch historische Salden/Ownership oder eine echte Providerantwort.
