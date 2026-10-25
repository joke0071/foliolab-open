# IndexedDB-only – Phase A (#44)

Basis: main `01a681960c0823010efe7e3599eb1d8512383673` / v150.
Branch: `feature/indexeddb-only-phase-a`. Status: WIP, keine Produktivfreigabe.
PRs #133/#134 bleiben unverändert; spätere Integration muss deren Stand berücksichtigen.

## Vertrag

- Neue Installationen ohne Portfolio und Modusmarker verwenden den vorhandenen IndexedDB-CAS-Speicher. Bei Fehlern kein stiller localStorage-Fallback.
- Vorhandene v1/v2/v3-Portfolios bleiben bis Download-Sicherung und ausdrücklicher Bestätigung kanonisch in localStorage. Die bestehende Rückwechsel-/Recovery-Kompatibilität bleibt erhalten.
- Der finale Modusmarker bestimmt genau einen kanonischen Speicher. Eine Legacy-Kopie ist ausschließlich eingefrorenes Rückfallmaterial; keine Spiegel-Schreibvorgänge.
- Migration prüft Originalbytes vor und nach dem IDB-Commit sowie den vollständigen zurückgelesenen Portfolio-/Einstellungsinhalt vor dem Cutover.
- Migrationssicherung enthält alle Finanzdaten einschließlich Wallet-Historie. Freiwillige Einstellungen/API-Schlüssel dürfen ausschließlich über die bestehende verschlüsselte Vollbackup-Engine heruntergeladen werden. OAuth-Tokens und Vault-Schlüssel werden nie exportiert.
- CAS, Tombstones, atomare Transaktionen, explizite beschädigte-Record-Recovery und Rückwechsel bleiben bestehen. Keine zweite Speicherengine, keine neue Datenbankschema-Version.

## Schritte und Wiederaufnahme

1. Startup für Neuinstallation + vollständige Migrationsverifikation; gezielte Unit-/Browser-Referenztests.
2. Vorgeschalteter vollständiger Backup-Download + unverwechselbare Nutzerbestätigung, Abbruch-/Fehlerpfade.
3. Legacy-Fixtures explizit vor App-Startup bereitstellen; vorhandene Assertions erhalten. Vollständige Unit-/Storage-/Backup-/Migration-/Mehrtab-Browserregression und Cross-Engine-CI ausführen.
4. PR/#44 mit tatsächlichen Tests, SHA und Restgates abschließen. Kein Merge/Deployment.

Bei Wiederaufnahme zuerst letzten PR-/Issue-Checkpoint und Remote-SHA lesen. Keine Gesamtanalyse wiederholen. Nicht ausgeführte Tests und Hardware-/Drive-/Eviction-Nachweise bleiben offen.

## Checkpoint 2/3 – Implementierung

- Neuinstallationskern: `0456a8f57e19cc016cfab802b5c8bd47bf8cfdd4`; IDB-CAS ohne lokalen Portfolio-Mirror, verifizierter Neustart/identischer Marker-Retry, fail-closed bei Quota/unavailable/fremdem Restrecord/manipuliertem Rücklesen.
- Migration: vollständiger Snapshotvergleich vor Cutover; vorgeschalteter Download enthält stets Wallet-Historie. Konfiguration ist weiterhin freiwillig und nur verschlüsselt exportierbar. Bestätigung nennt ausdrücklich die nicht technisch nachprüfbare Speicherung des Downloads.
- Read-only `assertCurrent()` schützt den Sicherungs-/Migrationssnapshot; dieser Guard existiert unabhängig auch im parallelen #133. Bei späterer Integration nur eine identische Methode behalten, keine anderen #133-Änderungen vorwegnehmen.
- Bestehende Browser-Suites mit localStorage-Erwartungen bekommen eine explizite Legacy-Installation VOR App-Start (`legacy-browser-fixture.mjs`); keine Schutzassertions/Schwellwerte entfernt. Reine IDB-Controller-Tests starten auf neutraler HTML-Origin. Der neue Neuinstallationstest verwendet diese Legacy-Fixture nicht und prüft auch echte App-Saves.
- Tatsächlich bisher bestanden: 555 Unit-Tests, Syntax, Chromium CAS/Quota/Neustart; bestehende Atomic-/Migration-Resilience-/Crash-/konkurrierende Import-/Cutover-/Corrupt-Recovery-/P0-/Mehrtab-/Settings-Backup-/Corrupt-Restore-Suites. Neue vollständige Migration-UI-Abnahme und vollständige CI noch in Arbeit.
- Testbefund korrigiert: Neutral-Origin-Umstellung beim konkurrierenden Import muss nach dem Seeding zur tatsächlichen App navigieren. Ein zunächst fehlender Snapshot-Guard im neuen UI-Pfad wurde durch den vorhandenen read-only Guard ergänzt und Cutover erneut erfolgreich geprüft.

## Checkpoint 4 – Referenzabnahme vor finaler CI

- `npm run check` und `npm test`: **557/557**, kein Fail/Skip. Zwei neue Unit-Gates: Neuinstallation bei fehlendem IndexedDB ohne lokalen Schreib-Fallback; unbekannter Modusmarker ohne Umschreiben.
- Chromium: neuer realer Neuinstallations-UI-Save/Reload ohne localStorage-Portfolio; beide vollständigen Migrationspfade (Klartext ohne Secrets / freiwillige Konfiguration verschlüsselt) einschließlich tatsächlichem Dateiinhalt, Download-Abbruch, fehlendem Backup-Passwort, UI-Restore, Journal/Snapshots/Wallet-Historie/Metadaten/Settings/Schlüssel, 320–1440 px und Axe bestanden.
- v1/v2/v3-Übernahme erhält optionale Schlüssel. Manipuliertes IDB-Rücklesen (Portfolio und Settings) sowie während Commit veränderte Legacy-Quelle verhindern den Cutover. Ein abweichender IDB-Restrecord wird bei Retry nicht überschrieben.
- Vollständige lokale Chromium-Suite: 79 Skripte ausgeführt, 76 zunächst grün. Die drei Fehler (Legacy-Ausgangslage für Quota-A11y, doppelter Testimport, Zeitpunkt der neuen Retry-Assertion) wurden korrigiert und alle drei gezielt erneut grün ausgeführt. 20 Pixelreferenzen unverändert bestanden. Der anschließende exakte Gesamtstand muss vollständig in CI bestehen; frühere rote Läufe sind keine Abnahme.
- Erster PR-CI-Lauf `40178455511` rot wegen Legacy-Fixture-/Testintegration; keine Produktivfreigabe. Vollständige Wiederholung einschließlich Firefox/WebKit folgt auf diesem Commit.

## Checkpoint 5 – Recovery ohne Marker und vollständige Historienfortsetzung

Stand `7b7a96d` bestand die vollständige CI `40178770450`: 557 Unit-Tests, vollständiges Chromium, Firefox/WebKit und Wallet-Checks; Deployment übersprungen.

Anschließender gezielter Befund: Ein beschädigter/unbestätigter IDB-Record ohne Modusmarker wurde korrekt gesperrt, ließ sich aber nicht durch die vorhandene UI sichern/wiederherstellen. Der Originaldownload darf jetzt die IDB-Verbindung explizit erneut öffnen. Gewöhnliche Saves prüfen weiterhin den kanonischen Modusmarker. Ausschließlich die bestehende, bestätigte Recovery mit Originalrecord-CAS und vollständigem Rücklesevergleich darf danach den Marker setzen. Keine automatische Adoption.

Neue Chromium-Abnahme für diesen Fall: Originaldownload samt synthetischem Key, verweigerter normaler Save, bestätigter Backup-Restore, Revision 7→8, kein lokaler Portfolio-Mirror bestanden. Bestehende Recovery-/Cutover-/Crash-/Import-/Neuinstallationsregressionen erneut bestanden.

Die Migrationssicherung trägt die vollständige validierte Wallet-Historie im normalen v3-Datenpayload. Dadurch bleiben auch sichere `re-fetch-needed`-Checkpoints erhalten; die separate portable Historienprojektion darf diesen Migrationssnapshot nicht ersetzen. Klartext- und verschlüsselte Datei einschließlich tatsächlichem UI-Restore mit akzeptierten Sessions UND ausstehenden Checkpoints erneut byteinhaltlich/fachlich geprüft. Keine Änderungen an der Backupengine oder dem Format. Typwidrige gespeicherte Settings werden separat fail-closed getestet.

Nach diesem Commit vollständige CI erneut ausführen. Bis zu deren Erfolg WIP; kein Merge/Deployment. Reale Geräte/Drive/Eviction bleiben getrennte manuelle Gates in #44.
