# FolioLab Open – Browser-Performance und Speicherquoten (23.10.2026)

## Reproduzierbarer Test

Die bestehende `tests/portfolio-scale.test.mjs` prüft auf Modellebene unter Node.js große Datensätze. Neu hinzugekommen ist `tests/browser-portfolio-scale.mjs`: Chromium/Playwright, GitHub Actions Ubuntu Runner, lokaler HTTP-Server, vollständig synthetische Daten, keine externen API-Schlüssel.

**Datensatz:** 1.000 ETF-Positionen bei einem Broker/Konto, 1.825 tägliche historische Stichtage (fünf Jahre), keine echten Nutzerdaten.

**Ergebnis des verifizierten Laufs:**

| Metrik | Messung |
|---|---:|
| Gespeicherte JSON-Daten | 1.726.844 UTF-8-Bytes |
| `localStorage`-Schreiben | 42 ms |
| Seite neu laden und Gesamtwert anzeigen | 273 ms |
| Positionsansicht öffnen | 132 ms |
| Nach einzelner Position filtern | 30 ms |
| Historie öffnen | 443 ms |
| Horizontaler Überlauf bei 320 px | 0 px |
| Bestands- und Stichtagsintegrität nach Aktionen | bestanden |

**Einschränkung:** Einzelmessungen eines geteilten CI-Runners sind *keine* Performance-SLAs und keine repräsentativen Messungen auf schwachen Smartphones. Der Test überprüft Stabilität, UI-Reaktion, Datenintegrität und liefert reproduzierbare Ausgangsmetriken, hat aber bewusst keine enge Millisekunden-Sperre.

## Tatsächlich beobachtete Browser-Speichergrenze

Nach dem Speichern des 1,73-MB-Portfolios wurde ein zeitweiser, klar abgegrenzter Quota-Test durchgeführt:

- **3 zusätzliche MiB** Testdaten konnten gespeichert werden.
- Beim nächsten MiB meldete Chromium **`QuotaExceededError`**.
- Alle temporären Testdaten wurden im Anschluss wieder entfernt.
- Das zuvor gespeicherte Portfolio blieb bytegenau **unverändert**.

Dies belegt die reale Quotengrenze *dieser* Testumgebung. Quoten anderer Browser, Betriebssysteme und Speicherkontexte können abweichen.

**Relevanter Größenhinweis:** Der vorhandene Node-Skalierungstest mit 5.000 Positionen und 5.000 Buchungen erzeugt rund **10.009.202 UTF-8-Bytes** JSON. Ein solcher Umfang kann im Browser-LocalStorage die erlaubte Speichermenge überschreiten, obwohl die fachliche Importvalidierung den Datensatz verarbeiten kann.

Bei fehlgeschlagenen Schreibvorgängen verhindert die bereits implementierte Storage-Recovery einen fälschlich als gespeichert dargestellten Datenstand. Das ist aber kein Ersatz für einen größeren transaktionalen Speicher.

## Technische Einordnung

- Die gemessene Performance des 1.000-Positionen-Datensatzes zeigt auf dem CI-Runner keine eindeutige Optimierungsnotwendigkeit.
- Das **reale Kapazitätslimit von `localStorage`** ist bei sehr großen Portfolios das wichtigere Skalierungsrisiko.
- Eine kontrollierte IndexedDB-Migration ist eine mögliche *spätere* Architekturmaßnahme, benötigt aber ein eigenes versioniertes, rückwärtskompatibles Migrationskonzept, Backups, Multi-Tab-Konflikttests und browserübergreifende Restore-Prüfungen.
- **Keine automatische Migration im Stabilitätsrelease:** Das Risiko einer unvorbereiteten Änderung des Speicherformats für bestehende Nutzer wäre höher als der aktuelle Nutzen.

## Release- und Testgrenzen

Der Chromium-Belastungstest ist jetzt Teil des regulären GitHub-Actions-Testlaufs. Die Firefox-/WebKit-Smokes prüfen weiterhin die Kernworkflows, enthalten aber aktuell keinen vollständigen 1.000-Positionen-Stresstest. Echte Android-/iOS-Geräte, CPU-Throttling und kontrollierte Speicherprofile sind weiterhin ausständig.
