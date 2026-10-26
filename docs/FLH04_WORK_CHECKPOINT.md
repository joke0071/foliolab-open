# FLH04 — separater Sicherheits-/Architekturcheckpoint

Stand26.10.2026. Eigenes Issue [#160](https://github.com/joke0071/foliolab-open/issues/160), Branch `feature/flh04-sync-design` von main `23af6d5800b06b6d08a52bf730ecd685387af7dd`. Produktiv v179. Dieser Branch enthält ausschließlich Dokumentation, keine aktive Syncimplementierung, keine Schemaänderung, keinen Merge oder Deployment. Einziger aktiver funktionaler FLH03-Strang bleibt14/#158; D/#157 ist geparkt. Kein zweiter paralleler UI-/Speicherumbau.

## Tatsächlicher Stand

- OPEN: Portfolio-/Geräteidentität, revisioniertes Syncprotokoll, verschlüsselter Transport, Konfliktauflösung und UI sind nicht implementiert.
- DONE als vorbereitende Analyse: bestehende Drive-/Vollbackup-/Passwortkomponenten und aktuelle offizielle Google-Dokumente für appDataFolder, Scopes, JavaScript-Tokenmodell und files.update gelesen. Das ist kein erfolgreicher OAuth- oder Remote-CAS-Test.
- BLOCKED für automatische Produktion: gemeinsamer öffentlicher OAuth-Client/Betreiberkonfiguration, notwendige konkrete Google-Freigaben, echte Origin-/Konto-/Neugerätetests und Remote-Concurrency-Nachweis fehlen. Aus der Dokumentation der update-Methode wird keine ungeprüfte If-Match-/ETag-Garantie abgeleitet.
- Wiederverwendung: `drive-backup.js`, `complete-backup.js`, `backup-vault.js`, lokaler `PortfolioStorage`/IDB-CAS, Recovery. Aktuelles Backup ist kein fertig implementiertes Syncprotokoll.
- Keine funktionalen Tests dieses Dokumentationsbranches erforderlich/behauptet; keine Hardware-, reale OAuth-, CORS- oder kryptografische Vollabnahme.

## Reihenfolge / exakt nächste sichere Aktion

Zuerst FLH03-14/#158 final abnehmen und dessen konkrete Produktionsentscheidung klären; andere aktive Stränge nicht überschreiben. Vor späterem funktionalem FLH04-Start aktuellen main übernehmen und `FLH04_SYNC_ARCHITECTURE.md`, #160, #148, konsolidierte Roadmap und dieses Dokument lesen. Dann kleinsten reinen Revisions-/Konfliktvertrag mit unabhängigen Sollfällen spezifizieren und vor Transport/UI testen. Die append-only Alternative und jede Remote-Schreibvorbedingung benötigen reale API-Beweise; keine stillen LWW- oder „immer aktuell“-Versprechen.

Vor Freischalten: Schlüssel-/Nonce-/AAD-/Identity-/Replay-/Rollback-/Passwortrotationsreview, Offline-/Parallelgeräte-/Konflikt-/Automerge-/Backup-/Recovery-/IDB-CAS-Tests, alle3Engines/Mobile/Axe und echter OAuth-/Neugerätetest. Neue sicherheitskritische Migrationen bzw. produktiver Sync benötigen ihre konkrete Nutzerentscheidung auf Basis eines vollständig reviewbaren PRs. Die08-/D-Freigaben gelten hierfür nicht. Fehlende Betreiber-/Gerätenachweise dokumentieren, unabhängige FLH03-Pakete fortsetzen.
