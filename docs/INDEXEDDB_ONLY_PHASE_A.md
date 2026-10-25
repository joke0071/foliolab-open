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
