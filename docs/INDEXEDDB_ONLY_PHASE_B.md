# IndexedDB-only Phase B – Risikovertrag vor der Änderung

Basis: main `91f83909e6453de40ef7a4be21477eb7864e01e5` (FLH01/#137 integriert, v159). Baseline: 604/604 Tests, vollständige CI 40189609001 einschließlich Chromium/Firefox/WebKit. #135/Phase A nicht erneut entwickeln.

## Inventar und Entscheidung

| Pfad | Zweck | Phase B |
| --- | --- | --- |
| `initializeNew`, `save` im IDB-Modus | kanonischer IDB-CAS-Commit, kein Portfoliomirror | unverändert |
| MODE_KEY/idb-v1 | endgültiger Cutover-Marker; keine automatische Adoption | unverändert |
| `initialize`, `load` und v1/v2-Sicherung | Lesen/Normalisieren noch nicht bestätigter Altinstallation | erhalten |
| Legacy-`save`/Web Lock/Originalbytes | Konsistenz der noch nicht migrierten Altinstallation bis zur ausdrücklichen Übernahme | notwendige Übergangskompatibilität, nicht redundant; kein nachträglich wählbarer Normalmodus |
| `migrateLocked` | Originalbytes vor/nach Commit, Rücklesen inkl. Settings, Marker zuletzt | unverändert |
| `revertLocked` / REVERT_INTENT_KEY | technische Rückfall-Kompatibilität und Abschluss früher ausdrücklich gestarteter Rückwechsel | mangels realer Crash-/Alttab-/Hardware-Beweise erhalten, aus normaler UI unzugänglich |
| `unverifiedBackup` / `recoverFromBackup` | Originaldownload, verifizierter Recovery-CAS | unverändert |
| `removeAllLocked` | Tombstone vor Bereinigung; verhindert Wiederbelebung | unverändert |
| `model.persist` | bestehende Legacy-/Import-Test- und Kompatibilitätsroutine | nicht als redundant nachgewiesen; erhalten |
| `purgeLocalAppData`, premigration-v1/v2, Atomic-Staging-Leser | Reset, Schutzkopien und alte Migration | erhalten |
| Backup-Vault / complete-backup / Drive | Passwort, freiwillige geheime Konfiguration, Historien | unverändert |
| normale Speicherwahl + sichtbarer Rückwechselhandler | dauerhafte optionale Wahl zweier Modi | redundant; entfernen |

## Sicherheitsvertrag

Neuinstallationen und bestätigte Migrationen schreiben ausschließlich IDB. Bestehende Legacy-Daten werden nicht ohne Bestätigung migriert, eingefroren überschrieben oder automatisch gelöscht. Bis zur Migration bleibt die vorherige Legacy-Kompatibilität samt Web Locks/Freshness erhalten; dies ist keine Wahlmöglichkeit zwischen zwei regulären Modi. Der einmalige Übernahmebereich erscheint ausschließlich bei gesunder, noch nicht migrierter Installation; danach verschwindet er. Download, zwei Bestätigungen, Verschlüsselungsopt-in, vollständiger Finanz-/Settings-/Historienvergleich und Fehler-/Retry-Verhalten bleiben dieselben bereits geprüften Engines.

Die aus dem Produkt entfernte Rückwechselaktion bedeutet ausdrücklich **keine** Löschung technischer Recovery-Funktionen. Reale Android-/Safari-/Drive-/Crash-/Eviction-/Alttab-Gates #44 bleiben offen. Sie sind kein Gate für das Entfernen einer normalen UI-Wahl, wohl aber für die endgültige Entfernung der technischen Rückfall-Kompatibilität. Kein allgemeiner Storage-/Finanzrefactor und keine neue Backupengine.

## Testplan

Bestehende Neuinstallation, v1/v2/v3-Migration, Download/Abbruch/Geheimnisse, beschädigte/unmarkierte Records, Quota, CAS, Mehrtab, Tombstones, alte Rückwechselintents und Restore unverändert prüfen. Den entfallenen UI-Rückwechsel im Cutover-Test durch einen ausdrücklichen technischen Controller-Aufruf ersetzen; sämtliche Daten-/Revisions-/Secret-/Tombstone-Assertions erhalten. Neue UI-Assertions beweisen: keine normale Speicherwahl, kein Rückwechselbutton, nur einmalige Legacy-Übernahme, nach Cutover unsichtbar. Migration-Axe auf sichtbarem Datenbereich prüfen. Vollständige Unit/Syntax/Chromium/Firefox/WebKit-CI vor Merge.

Status: Risikovertrag erstellt; Implementierung und Abnahme folgen. Exakt nächster Schritt: begrenzte UI-Bereinigung, Regressionen, kleine Commits/Remote-Checkpoints; keine technischen Schutzpfade entfernen.
