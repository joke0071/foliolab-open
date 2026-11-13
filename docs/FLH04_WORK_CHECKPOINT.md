# FLH04 — lokaler Implementierungscheckpoint

## ACTIVE / PURE_MODEL_IMPLEMENTED / RELEASE_BLOCKED · work-b5ddfe1c-20261113

Nutzerauftrag 13.11.2026 setzt unabhängige FLH04-Implementierung auf eigenem Branch ausdrücklich fort. Chromium-/Unix-Socketblocker zurückgestellt: kein Browserstart/Umgebungsaudit wiederholt. Mainbasis a27cde2f802c26bfec41190911d88bd1d7d8e325, Branch `feature/flh04-revisions-20261113-b5ddfe1c`. Geschützter Draft161 HEAD0d980c2f43f28fd06ef9a7403b2144b6099fbc74 unverändert; die beiden bestehenden Entwurfsdateien sind hier als Fortsetzung übernommen, nicht auf Draft161 geändert.

### Tatsächlich implementiert

- Bestehender Architekturvertrag knapp um Identitäten, monotone Elternrevisionen, lokale CAS-/Ankerbindung, Offline-/Recovery-/Crypto-/Transportgrenzen und testbare Sollfälle ergänzt.
- `src/sync-revisions.js`: reiner Planer einer authentisiert übergebenen Descriptorunion; erwartete Portfolio-/Head-/IDB-Identität, unveränderliche Revisionsidentität, bounded iterative Graphprüfung, kein LWW/Automerge/Rollback. Vollständiger lokaler Descriptor schützt gegen Remote-Widerspruch auch ohne Duplikat in der Liste.
- Anschließender unabhängiger lokaler Schritt ebenfalls umgesetzt: Nachfolgerbau für bereits lokal bestätigte Offline-Snapshots und Publikationsabgleich bei Teilupload/Antwortverlust/Retry/Readback. Keine dauerhafte Outbox, kein Verschlüsselungs-/Netzwerk-/IDB-Code und keine App-/SW-Einbindung.
- Bestehender lokaler Speicher-/Backup-/Vault-/Drive-/Importcode unverändert. Quellabgleich bestätigt: keine bestehende Sync-Revisions-/Konflikteinheit auf Main; vorhandener CAS ist nur lokal.

### Ausgeführt und belegt

Node24.22.1 (abweichend von CI22/Wallet20): `node --test tests/sync-revisions.test.mjs` **21 PASS,0 FAIL,0 SKIP**; bestehende `portfolio-storage.test.mjs,p0-local-storage.test.mjs,p0-import-conflicts.test.mjs` **17 PASS,0 FAIL,0 SKIP**. Syntaxprüfung des neuen Moduls PASS. 69 verwendete originale Paket-/Quell-/Testdateien exakt gegen gepinnte Gitblobs geprüft. Keine Behauptung echter IDB-Transaktionen aus Node-LocalStorage-Tests.
Während der Implementierung vollständige lokale Descriptorbindung ergänzt; zwei bisherige reine Graph-Negativfälle hatten danach vorrangig identity-collision statt ihrer erwarteten Graphursache. Fixtures wurden ausdrücklich ohne akzeptierten lokalen Head geprüft, um Zyklus/Generation isoliert weiter abzudecken; zusätzlicher lokaler Equivokationstest bleibt erhalten. Final alle21 bestanden, keine Schutzlockerung.

### Weiter offen / nächster Schritt

Implementierung REST: authentisierter Sync-Envelopetyp samt Protokoll-/Schlüssel-/Nonce-/Replay-/Recoveryvertrag und Verifier, Identitätserzeugung/-persistenz, dauerhafte atomare Outbox/Ankerbindung, Snapshot-/Applyvalidierung mit echtem IDB-CAS, Remoteprotokoll/Transport, explizite Konfliktauflösung und UI. `payloadDigest` ist im Modell nur ein authentisiert anzulieferndes Commitment, keine implementierte Krypto- oder Inhaltsprüfung. `observationComplete` besagt nur abgeschlossene konkrete Beobachtung, keine globale Cloudvollständigkeit.

Genau nächster unabhängiger Schritt: bestehenden Sync-Envelope-/Payloadvalidierungsvertrag gegen unveränderten Backup-V2/Vault prüfen und begrenzte lokale Negativfälle vor Implementierung konkretisieren; kein blindes Wiederverwenden des Backup-AAD, kein neuer Transportentscheid aus diesem Modell. Danach erst passenden lokalen Verifier/Outbox-Schnitt implementieren. Vor Cloud-/IDB-Integration benötigen Authentisierung, fehlende-Anker-/Absturz-/CAS-/Finanz-/Historyinvarianten tatsächliche Belege; keine Bool-verified-Freigabe.

Externe/pflichtige Abnahmen REST: echte OAuth-/Operator-/Origin-/Scope-/RemoteConcurrency-/Pagination-/DelayedVisibility-/Quotafälle, zwei getrennte Geräte/Profile mit Offlinekonflikt, Neugerät/Rotation/Recovery, Browser/IDB/Mehrtab/Offline/PWA/Axe sowie vollständige PR-/Wallet-/Main-/Produktions-/Sicherungs-/Readback-/Restoregates. Konkrete Aktionen und Sollnachweise stehen kompakt im bestehenden Architekturvertrag. Keine realen Geräte-/Konto-/Kryptoprüfungen behauptet.

Mainrun43332355188 bleibt FAILURE/PARKED/RELEASE_BLOCKED, kein unveränderter Retry, keine finale CI/PR/Freeze/Merge/Deployment. FLH04 insgesamt nicht DONE, N-DRIVE bleibt BLOCKED_EXTERNAL mit erheblichem internem Implementierungsrest. UI-R4 HEAD60c1ab098449151b475563c9fc822b9a5e9a9152 unverändert separat erhalten. Kein Root-/Companionzugriff oder neue Sicherung/Restore: RootV155 und beide CompanionsV0 vor Übernahme per Metadaten bestätigt, alle Originalketten unverändert.

## Ursprünglicher Checkpoint · unverändert


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

