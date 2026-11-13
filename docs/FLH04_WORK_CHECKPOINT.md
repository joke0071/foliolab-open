# FLH04 — lokaler Implementierungscheckpoint

## STOPPED / HANDOVER_READY / LOCAL_FRAME_VERIFIER_IMPLEMENTED / RELEASE_BLOCKED · work-68bf48c25eec-20261113

Eigene alleinige serielle HND01-Zuständigkeit und sämtliche eigenen Schreibaktivitäten enden mit dem Abschluss und gepinnten Readback dieser Fortsetzung; kein Hintergrundbetrieb und keine Nachfolgerübernahme behauptet. Vorgänger work-b5ddfe1c-20261113 STOPPED/HANDOVER_READY; ältere work-pr333-Ausführung weiterhin NICHT technisch als beendet nachgewiesen.

### Umgesetzter Schnitt

- Frame-/Schlüsseltrennungsvertrag **vor Kryptocode** in Commit c5c2f32e0725e354c774adcaa5a54131f6d8f6ad / Tree01e50493507c2bd0ac4b3b44b66728d649871b44 gespeichert und gepinnt exakt rückgelesen. Portfolio-/Epochbindung, verschlüsselter vollständiger Descriptor, HKDF-Kontext/AAD, feste Byteformate/Limits, Replay/Nonce/Rotation/Recovery und atomare spätere Outboxgrenze konkret festgelegt.
- src/sync-frame-verifier.js: eigenständiger WebCrypto-HKDF/AES-GCM-Decoder für eine **lokal vertraute** Portfolio-/Epoch-/CryptoKey-Bindung, keine Remote-Schlüsselauswahl. AEAD vor fatal UTF8/striktem Inhalt/Descriptor/bytegenauem Payloadhash. Unveränderlicher privat registrierter flüchtiger Verifierbeleg; JSON/Boolverified nicht ausreichend. Kein Encoder/Password-KDF/Key-Wrapping/Enrollment/Key-Erzeugung.
- src/sync-outbox-attempt.js: ausschließlich flüchtige lokale Versuchserfassung und Publikationsklassifikation mit vollständig erwartetem Descriptor/Portfolio/Epoche/Erfassungs-CAS und exaktem verschlüsseltem Frame. HTTP-Erfolg bleibt uncertain. Nur identischer authentisierter äußerer Frame bestätigt. Anderer gültiger Cipher desselben Descriptors blockiert. Bestätigung erfasst ausschließlich alten CAS, neuere lokale Änderungen bleiben ausstehend.
- src/sync-revisions.js exportiert nur seinen bestehenden Descriptorvalidator zur Wiederverwendung; bisherige Graph-/Konflikt-/CAS-Semantik unverändert. Bestehender reiner Graphplaner bleibt separat vor Apply erforderlich; erfolgreiche Entschlüsselung allein autorisiert nichts.
- Keine App-/SW-/IDB-/Cloud-/Workflow-/Backup-/Vaultintegration, keine Transportwahl/Remote-CAS-Zusage. Keine Finanzpayloadnormalisierung oder Credentialübernahme. Symmetrischer Gruppenschlüssel authentisiert keinen einzelnen Writer; Herkunft/Entropie des CryptoKey muss zukünftiger Enrollment-/Vaultadapter nachweisen.

### Tatsächliche Prüfung

Node24.22.1 (weiterhin abweichend von CI22/Wallet20): **19 neue Tests** in tests/sync-frame-verifier.test.mjs PASS. Unabhängiger Node/OpenSSL-HKDF/AES-GCM-Encoder, SHA256-Oracle; kein Produktionsencoder aus dem Test. Feste Testschlüssel/Salts/Nonces ausschließlich synthetisch. Negative Portfolio/Epoche/Secret/Backup-AAD/KDF-Kontext/Salt/Nonce/Cipher/Tag/Parent/Generation/Writer/Digest/Unicode/UTF8/BOM/Hüllen-/Größen-/Proof-/Outbox-/Retryfälle; authentisierte Replay-/Geschwister-/Equivokationsfälle durch echten Decoder und vorhandenen Planer kombiniert.

Finale serielle lokale Auswahl mit --test-concurrency=1: **63 PASS /0 FAIL /0 SKIP /0 CANCELLED** =19 neue+21 Revisions+6 Integritäts+17 bestehende Storage-/Importtests. Syntax aller4Syncmodule und neuer Testdatei PASS. 74 unveränderte lokale Eingaben gegen gepinnten Gitbaum535c865b... bestätigt; 5 bewusst geänderte/neue Dateien im damaligen lokalen Prüfsatz, anschließend dieser Checkpoint ergänzt. Beim Eingangsabgleich war lokale alte Kopie von backup-limits.js verkürzt; **vor jeder Testausführung** aus gepinntem Repository ersetzt und Blob9c293419fe0fc3540e9c6686abce2f3c2c7e52f5 exakt bestätigt. Keine Behauptung einer auf der verkürzten Kopie ausgeführten qualifizierten Prüfung.

Keine neue Browser-/echte Sync-IDB-/OAuth-/Zweigeräte-/Recovery-/FullCI-/Produktionsabnahme. Kein unabhängiges Kryptoreview; Standardsprimitive und Units sind kein fertiges E2EE-Protokoll oder Key-Lifecycle-Nachweis. Frame-Envelope limitierter als Backup, keine bestehenden Limits erhöht. Flüchtiger Outboxschnitt ist ausdrücklich **keine dauerhafte/absturzsichere Outbox**.

### Nächster unabhängiger Schritt und offene Gates

Zuerst den konkreten aktuellen Decoder-/Frame-/Outboxentwurf gezielt prüfen, bevor Encoder oder Key-Lifecycle anschließen. Anschließend bestehende lokale Identity-/IDB-Verträge begrenzt lesen und einen atomaren **persistenten Outbox-/Ankervertrag** vor Implementierung festlegen: Snapshot/Descriptor/Parent/Portfolio/Epoche/Erfassungs-CAS/exakter Frame/Versuchszustand; Crash vor/nach Commit, neuer lokaler Save während Upload, Quota, konkurrierende Tabs, Reverify nach Neustart. Gegen tatsächlichen IDB-CAS integrieren nur mit ausführbaren gerichteten Tests; zurückgestellten Browserblocker nicht erneut starten. Nicht als kleine LocalStorage-Queue umgehen.

Rest: vertrauenswürdiges Enrollment/zufällige Identitäten und Sync-Epochenschlüssel/Passwortumhüllung, Allowlist des Credential-freien Snapshotumfangs und Finanz-/History-/Journal-/UNKNOWN-/Dedupevalidierung, geprüfter Encoder und dauerhafte Nonce-/Keybudgets, Rotation/Recovery-Übergangsformat, dauerhafte Outbox/IDB-Anker-/Applyatomizität, authentisierte Graphadapter, Transport/RemoteConcurrency, explizite Konfliktauflösung und UI. Rotationsvollzug bewusst blockiert, kein stiller Epochenwechsel; historische Schlüssel nur später separat history-only. Neues Gerät ohne vertrauenswürdigen Anker bleibt Enrollment/Recovery.

Alle internen Pflicht-/externen OAuth-/Operator-/Origin-/Scope-/RemoteConcurrency-/Pagination-/DelayedVisibility-/Quota-/Zweigeräte-/Recovery-/Browser/IDB/Mehrtab/PWA/Axe-/Release-/Sicherungs-/Readback-/Restoregates bleiben offen. N-DRIVE BLOCKED_EXTERNAL und FLH04 NICHT DONE. Main a27cde2f802c26bfec41190911d88bd1d7d8e325 / Run43332355188 FAILURE/PARKED/RELEASE_BLOCKED. Kein PR/CI/Freeze/Merge/Deploy und kein Chromium-/Umgebungsaudit. Produktiver Sync braucht konkrete Freigabe am vollständig reviewbaren Kandidaten.

### Unveränderte Schutzstände

Draft161 0d980c2f43f28fd06ef9a7403b2144b6099fbc74; PR157 08714cc602110bae479083b3d38fa1adc9be280c; PR332 71dfb05d5dae6a7e5d7c3979120462e0862fe7e2 weiterhin CSV44pxBLOCKED; UI-R4 60c1ab098449151b475563c9fc822b9a5e9a9152. Checkpointref niemals vollständig nach Main mergen. Keine Workflowänderung, kein zweiter Writer/Agent/Automation/finaleCI. Original-/Oracle-/Readback-/Restoreketten erhalten.

RootV155/406425600Bytes/SHA256749f072638409f4643fa9ed0763c4ceaa18bb89fa2557585624953f47722e234;
FAILCompanionV0/12748800Bytes/SHA256459e5236c9f3d41d16c00bb5cdc5920929044608c19435cc8e64188e78777169;
MainOriginalCompanionV0/212408320Bytes/SHA256af642a587b6e93bf71394430c15a74e1855faf56638beabf34893cd6ba3b490c.
Nur Metadaten bestätigt, keine privaten Transfers/Restore/Uploads/neue Sicherung. Root allein unvollständig; bisherige Originalketten unverändert.

## Unveränderte Vorgängerhistorie

# FLH04 — lokaler Implementierungscheckpoint

## STOPPED / HANDOVER_READY / PURE_MODEL_IMPLEMENTED / RELEASE_BLOCKED · work-b5ddfe1c-20261113

Nutzerauftrag 13.11.2026 setzt unabhängige FLH04-Implementierung auf eigenem Branch ausdrücklich fort. Chromium-/Unix-Socketblocker zurückgestellt: kein Browserstart/Umgebungsaudit wiederholt. Mainbasis a27cde2f802c26bfec41190911d88bd1d7d8e325, Branch `feature/flh04-revisions-20261113-b5ddfe1c`. Geschützter Draft161 HEAD0d980c2f43f28fd06ef9a7403b2144b6099fbc74 unverändert; die beiden bestehenden Entwurfsdateien sind hier als Fortsetzung übernommen, nicht auf Draft161 geändert.

Eigene alleinige HND01-Zuständigkeit und sämtliche eigenen Schreibaktivitäten enden mit diesem gepinnten Abschluss. Kein Hintergrundbetrieb, keine Nachfolgerübernahme behauptet.

### Tatsächlich implementiert

- Bestehender Architekturvertrag knapp um Identitäten, monotone Elternrevisionen, lokale CAS-/Ankerbindung, Offline-/Recovery-/Crypto-/Transportgrenzen und testbare Sollfälle ergänzt.
- `src/sync-revisions.js`: reiner Planer einer authentisiert übergebenen Descriptorunion; erwartete Portfolio-/Head-/IDB-Identität, unveränderliche Revisionsidentität, bounded iterative Graphprüfung, kein LWW/Automerge/Rollback. Vollständiger lokaler Descriptor schützt gegen Remote-Widerspruch auch ohne Duplikat in der Liste.
- Anschließender unabhängiger lokaler Schritt ebenfalls umgesetzt: Nachfolgerbau für bereits lokal bestätigte Offline-Snapshots und Publikationsabgleich bei Teilupload/Antwortverlust/Retry/Readback. Keine dauerhafte Outbox, kein Verschlüsselungs-/Netzwerk-/IDB-Code und keine App-/SW-Einbindung.
- Weiterer unabhängiger Schritt nach erstem Commit d175f0707645b7f0c6ff872fc43623405e69ddec: `sync-payload-integrity.js` mit SHA256 über exakte UTF8-Plaintextbytes, Größen-/Unicodegrenzen und Prüffunktion. Kein JSON-Rewrite und keine Finanz-/Auth-/Decryptprüfung. 6 neue Units PASS/0FAIL/0SKIP mit unabhängiger Node-SHA256-Oracle; Decimal-/UNKNOWN-/Journal-/ID-Manipulationen, Unicode und Limits geprüft.
- Bestehender lokaler Speicher-/Backup-/Vault-/Drive-/Importcode unverändert. Quellabgleich bestätigt: keine bestehende Sync-Revisions-/Konflikteinheit auf Main; vorhandener CAS ist nur lokal.

### Ausgeführt und belegt

Node24.22.1 (abweichend von CI22/Wallet20): `node --test tests/sync-revisions.test.mjs` **21 PASS,0 FAIL,0 SKIP**; bestehende `portfolio-storage.test.mjs,p0-local-storage.test.mjs,p0-import-conflicts.test.mjs` **17 PASS,0 FAIL,0 SKIP**. Syntaxprüfung beider neuen Module PASS. Zusammen27 neue und17 bestehende Tests bestanden; keine Full-CI. 69 verwendete originale Paket-/Quell-/Testdateien exakt gegen gepinnte Gitblobs geprüft. Keine Behauptung echter IDB-Transaktionen aus Node-LocalStorage-Tests.
Während der Implementierung vollständige lokale Descriptorbindung ergänzt; zwei bisherige reine Graph-Negativfälle hatten danach vorrangig identity-collision statt ihrer erwarteten Graphursache. Fixtures wurden ausdrücklich ohne akzeptierten lokalen Head geprüft, um Zyklus/Generation isoliert weiter abzudecken; zusätzlicher lokaler Equivokationstest bleibt erhalten. Final alle21 bestanden, keine Schutzlockerung.

### Weiter offen / nächster Schritt

Implementierung REST: authentisierter Sync-Envelopetyp samt Protokoll-/Schlüssel-/Nonce-/Replay-/Recoveryvertrag und Verifier, Identitätserzeugung/-persistenz, dauerhafte atomare Outbox/Ankerbindung, Snapshot-/Applyvalidierung mit echtem IDB-CAS, Remoteprotokoll/Transport, explizite Konfliktauflösung und UI. `payloadDigest` wird separat bytegenau per SHA256 geprüft; im Graphmodell bleibt er authentisiert anzuliefern. SHA256 ist weder Authentisierung noch Finanzmodellvalidierung. `observationComplete` besagt nur abgeschlossene konkrete Beobachtung, keine globale Cloudvollständigkeit.

Begrenzter Folgeschritt bereits erledigt: Backup-V2/Vault und opt-in-Vollbackup erneut nur auf konkrete Wiederverwendung geprüft; fester Backup-AAD und fehlende Syncidentitäts-/Replaybindung verhindern direktes Umwidmen zum Syncencoder, API-Konfiguration bleibt ausgeschlossen. Genau nächster unabhängiger Schritt: authentisierten Sync-Frame/Schlüsseltrennung und positive/negative Portfolio-/Parent-/Epoche-/Replayfälle vor Kryptocode spezifizieren; den neuen Bytecommitmentprüfer erst hinter einem echten Verifier anschließen. Kein blindes Wiederverwenden des Backup-AAD, kein neuer Transportentscheid aus diesem Modell. Danach erst passenden lokalen Verifier/Outbox-Schnitt implementieren. Vor Cloud-/IDB-Integration benötigen Authentisierung, fehlende-Anker-/Absturz-/CAS-/Finanz-/Historyinvarianten tatsächliche Belege; keine Bool-verified-Freigabe.

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

