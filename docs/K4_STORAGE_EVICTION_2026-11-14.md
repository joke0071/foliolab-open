# K4 Storage-Eviction · PASS für den belegten Linux-Chromium-Teilfall

**Ereignis und Fachtest PASS. K4 insgesamt PARTIAL.** Keine Produktabweichung im geprüften Fall. Produkt v315 LIVE_ACCEPTED / Main `ff60c73e53c973ecb86393be5b4e31b55f352601` unverändert. Keine Produktänderung, kein Merge, kein Deployment.

## Identität und Originalbelege

- [Abschließender Lauf 43641987091](https://github.com/joke0071/foliolab-open/actions/runs/43641987091), Versuch1, Job132591353973.
- QA-Ref `qa/k4-eviction-e4b79f541e28`, eingefrorener Head `09e28eb8616ee8f28cb0174d4c1f96b52139833b`, Tree `1b49379bfbb143df4c59f96c5a43a24ce6d5492a`. [Runner](https://github.com/joke0071/foliolab-open/blob/09e28eb8616ee8f28cb0174d4c1f96b52139833b/.qa/k4-eviction.cjs). Gegen exaktes Main ausschließlich QA-Runner und QA-Workflow hinzugefügt; Runtime/Tests/SW unverändert. Lauf prüft dies zusätzlich vor Browserstart.
- Ubuntu24.04.5, Playwright1.56.1, vollständiges Chromium141.0.7390.37. Origin `http://127.0.0.1:41421`, persistentes Profil `/home/runner/work/_temp/k4-eviction-profile` vor/nach Ereignis identisch; lokaler HTTP-Server bleibt durchgehend derselbe.
- [Originalartefakt](https://github.com/joke0071/foliolab-open/actions/runs/43641987091/artifacts/14132124578), 183460 Bytes, SHA256 `d22bb935fcd04f8fd01fcfe3cc8e52244558bd6f1f63e15014285689143d608e`, ZIP-CRC PASS, 13 Dateien. Maßgeblich sind report.json / appTest PASS und Einzelbelege, nicht allein der grüne Workflowstatus.

## Beobachtetes Ereignis

Vorher: kanonischer Record Revision7, confirmedActive=true, Synthetic ETF/Menge2/Preis100EUR/Wert200EUR, vollständige raw-/Settingsbytes dokumentiert. Ältere synthetische localStorage-Kopie STALE MUST NOT RETURN/Menge1 separat vorhanden. persisted=false. IDB-, localStorage-, SessionStorage-, Cache-, OPFS- und SW-Inventare erfasst; keine privaten Daten oder Schlüssel.

Browser regulär beendet und im selben Profil mit `--enable-features=StorageQuotaSettings:PoolSizeBytes/1048576` geöffnet. Tatsächlich gemessener Pool 1048576 Bytes; vorherige globale Quotanutzung 5241714 Bytes. Kein IDB-/CDP-Löschen, kein Profilreset und kein SimulateStoragePressure. Die Quelle enthält keine solchen Löschaufrufe.

Nach der nativen fünfminütigen Startverzögerung, am 14.11.2026 um 21:22:38.702 UTC (22:22:38 MEZ): errors-on-getting-usage-and-quota=0, eviction-rounds=1, evicted-buckets=1, skipped-eviction-rounds=0; der vorher dokumentierte einzige Ziel-Bucket fehlt, Quotanutzung0. Neutrale Probe derselben Origin **vor Appstart** bestätigt unabhängig: keine IndexedDB-Datenbanken, kein Cache und keine OPFS-Dateien. Modusmarker idb-v1, Sentinel und ältere localStorage-Kopie überleben.

Das ist tatsächlich browserveranlasste Bucket-Eviction unter kontrolliertem Quota-Pooldruck. Ein fehlgeschlagener Schreibvorgang oder QuotaExceededError wurde nicht zum Evictionbeweis umetikettiert.

## Fachtest und Bewertung

Soll aus #44/#254/K4 und dem vor CI gespeicherten Ereignisvertrag: Bei überlebendem IDB-Modusmarker, aber fehlendem kanonischem Record keine stille Legacy-Adoption und keine falsche Speichererfolgsmeldung; vorhandener Recovery-/Sperrzustand muss sichtbar sein. Für vollständigen Originverlust wurde ausdrücklich kein überlebender Marker vorausgesetzt.

Ist: echter PortfolioStorage-Start verweigert die Übernahme mit „Aktiver IndexedDB-Speicher nicht gefunden. Bitte eine Sicherung wiederherstellen.“ Die anschließend normal geöffnete App wird interaktiv und zeigt „Gespeicherter Datenstand nicht lesbar. Änderungen sind gesperrt.“ sowie „Speicher nicht verfügbar. Keine Änderungen gespeichert.“ Sichtbarer Sidebarstatus ebenfalls Speicher nicht verfügbar; weder alter noch kanonischer ETF wird als Bestand angezeigt. after.png visuell geprüft.

Nach Appstart bleiben die alten localStorage-Bytes exakt gleich; der kanonische records-Store ist weiterhin leer. Nur leere DB-Strukturen bzw. neuer Appcache/Worker werden angelegt, keine Portfolio-Wiederherstellung. Unabhängige Nachprüfung der Originaldateien bestätigt leere Records und keine globale „Portfolio lokal gespeichert“-Behauptung im sichtbaren Text.

**PASS ausschließlich für diesen beobachteten Teilverlust mit überlebendem localStorage.** Keine Abnahme physisch voller Festplatte, vollständiger Originlöschung, Android/Safari/Windows, verlorener zuvor befüllter Vault-Schlüssel oder Backup-Restore nach Eviction. SW-/Vault-Verlust ist aus vor dem UI erfassten leeren Schichten nicht abzuleiten. Bestehende Release-/SIGKILL-/Backupbelege bleiben eigenständig gültig.

## Aufbewahrung und frühere Läufe

Alle vier unveränderten Original-ZIPs, vier vollständige Joblogs, lokaler Startfehler und Zuordnungs-/Hashmanifest im [Belegarchiv](https://chatgpt.com/library?file_id=libfile_fde3_f-0c18c8ccbe108191a7325c94308df2d6_54e45e8130348191808d9aaa710cf372&account_id=personal). Datei FolioLab_K4_Storage_Eviction_2026-11-14.tar.gz, 615405 Bytes, SHA256 `35136e9287f055ff8e022488850a2f77cdbb6475f10e87e0033edfa6c9d402f0`. Version0 über exakte Dateiidentität gepinnt rückgelesen; alle12 Dateien tatsächlich restauriert und hashgeprüft, alle vier ZIPs erneut CRC-geprüft.

- 43641029575: Testaufbaufehler; Playwright-Headless-Shell ohne quota-internals. Kein Eviction-PASS.
- 43641149167: Pooldruck belegt, BigInt-Auslesefehler. Kein Eviction-/App-PASS.
- 43641311330: Ereignis bereits vollständig belegt; UI-Wartebedingung erwartete internen statt vorhandenen generischen Recoverytext. Automatisches report.status PRODUCT_DEVIATION ist nach Quellen-/Originalreview **kein nachgewiesener Produktfehler**; Appbeobachtung unvollständig. Originalbericht unverändert aufbewahrt.
- 43641987091: vollständiges Ereignis plus Kern-/UI-/Nachzustandsprüfung PASS. Keine Assertion zur Datenintegrität entfernt; die UI-Aufnahme erfolgt nach tatsächlichem appStartup.hidden und prüft den bestehenden generischen Recoveryvertrag. Kein blindes Retry.

## HND01 und nächster Schritt

Writer k4-eviction-e4b79f541e28 übernimmt mit expected SHA5fad6b5 am Claim69605c93a6fef0ae0c2dced4226e95fecf8e180c; [Ereignisvertrag vor CI](https://github.com/joke0071/foliolab-open/blob/754f4f0b26e3b93632364e62678c82755eb5f526/docs/K4_STORAGE_EVICTION_2026-11-14.md). Keine offenen K4-PRs/aktiven Vorgängerläufe beim Einstieg. Endabgleich Main unverändert, keine queued/in_progress Actions.

Nächster ausführbarer, gesonderter Restnachweis: denselben Ereignis-/Fachablauf auf einem isolierten begrenzten QA-Dateisystem mit **normaler** Quota-Konfiguration ausführen, freien Platz durch eine getrennte Fülldatei unter die reale Druckschwelle senken und dieselben Browserzähler/Bucket-/Schichtenbeobachtungen nutzen. Keine Privatprofile füllen. Das schließt die bisher ausdrücklich nicht geprüfte Datenträgerknappheit; reale Geräte und vollständiger Originverlust bleiben eigene Fälle. Keine Produktkorrektur aus diesem PASS ableiten.

**Writer STOPPED / HANDOVER_READY.** Vor weiterer Mutation aktuelle Checkpoint-SHA frisch lesen und HND01 übernehmen.
