# K4 Storage-Eviction – Ereignisvertrag und Voraussetzungsklärung

Owner k4-eviction-e4b79f541e28, 14.11.2026. Produkt v315 / ff60c73e53c973ecb86393be5b4e31b55f352601; keine Produktänderung/Deployment. Einziger freigegebener Gegenstand: Storage-Eviction.

Gelesene Grundlagen: aktueller Checkpoint 5fad6b5, K4-Zeile der kanonischen Roadmap, #44 samt Kommentaren, #254 (REL-RECOVERY01), INDEXEDDB_ONLY_PHASE_A und INDEXEDDB_STAGED_MIGRATION. Sie fordern echte Ereignisse, keine als Hardwareabnahme ausgegebene Fault Injection, keine stille Altbestandsadoption und einen wahrheitsgemäßen Speicher-/Recoveryzustand. Release und SIGKILL bereits abgeschlossen.

## Vor dem CI-Start festgelegte Beobachtung

| Aussage | Erforderliche Beobachtung |
| --- | --- |
| Druck erzeugt | Erfolgreich bestätigte reale IDB-/Cache-/OPFS-Daten, Gesamtusage >1 MiB; beim Neustart im unveränderten Profil tatsächlich angewendeter Quota-Pool 1.048.576 Bytes aus quota-internals. Tatsächliche Dateisystemfüllung wird nicht behauptet. |
| Browser verdrängt Ziel-Origin | quota-internals meldet evicted-buckets >0 nach dem Neustart, zuvor dokumentierter Ziel-Bucket fehlt; anschließend fehlt unabhängig der vorher bestätigte kanonische Record Revision7. Keine manuelle Löschung oder SimulateStoragePressure. Andere Origin allein genügt nicht. |
| Verlustumfang | Vorher/nachher Inventar aller IDB-Datenbanken/Stores, localStorage/Modus/Legacy/Sentinel, SessionStorage, CacheStorage, OPFS, ServiceWorker und estimate/persisted. Nachher zuerst neutrale Probe derselben Origin, bevor Appcode neue Speicher anlegen kann. |

QuotaExceededError belegt weder Eviction noch deren Ziel. Fehlender Bucket allein ist ebenfalls unzureichend. Wenn der Beobachtungsvertrag nicht erfüllt ist, Fachtest NOT_RUN, Ergebnis fehlende technische Voraussetzung; kein PASS.

## Festes Soll vor Ereignis

Synthetisches kanonisches Portfolio: Revision7, Synthetic ETF, Menge2, Preis100 EUR, Wert200 EUR. Gesonderte ältere synthetische localStorage-Kopie heißt STALE MUST NOT RETURN (Menge1) und ist kein Rückfallziel. Alle Testdaten lokal isoliert, keine Nutzerwerte/Keys.

Marker überlebt, kanonischer Record fehlt: eindeutige Recovery/Speicherfehleranzeige, normale Übernahme blockiert, kein stiller Rückfall auf Legacy, keine Behauptung eines gespeicherten/aktiven Portfolios. Quota/SW/Portfoliostatus nicht vermischen.

Geht der gesamte Origin-Speicher verloren, kann die Anwendung das frühere Portfolio nicht aus einem lokalen Marker erkennen. Frische leere Initialisierung ist dann kein Fehlerbeweis; kein überlebender Marker als Soll. Weder alter kanonischer noch Legacy-Bestand darf still wiederhergestellt werden. Andere Teilverlustformen erhalten eigenen Befund, keinen pauschalen PASS.

## QA-Ausführung

Lokaler Browserstart bereits vor Probe an OS-Restriktion socket() EPERM in process_singleton_posix.cc:297 gescheitert; Log und Runner erhalten. Keine weitere lokale Startvariante/Umgehung. Vorhandener Ubuntu-24.04-GitHub-Runner hat den abgeschlossenen SIGKILL-Test ausgeführt und ist der verfügbare Fallback.

Isolierte QA-Ref von exaktem Main mit ausschließlich neuem QA-Runner/Workflow. Chromium/Playwright 1.56.1, persistentes Wegwerfprofil, feste Origin mit weiterlaufendem lokalen Server, kein privates Portfolio. Normale Poolkonfiguration zum bestätigten Seeding; Browser regulär schließen; dasselbe Profil mit reduziertem Pool starten. Die echte QuotaManager-Auswahl und Löschung wird beobachtet, nicht per CDP/IDB/Profilreset veranlasst. Poolverkleinerung ist kontrollierter QA-Druck, kein Nachweis real voller Festplatte oder physischer Android/Safari-Hardware.

Ein Lauf enthält Ereignisprüfung und nur nach erfolgreichem Nachweis den Fachtest. Bei technischen Fehlern konkrete fehlende Beobachtung sichern; keine Blindwiederholung. Fachtestfehler erst nach event.confirmed als Produktabweichung bewerten. Originalberichte/Protokolle behalten.

Primärquellen zur Methodik: Chromium quota_features.cc (StorageQuotaSettings/PoolSizeBytes), QuotaTemporaryStorageEvictor (0,7-Poolgrenze und evicted-buckets), quota_internals.mojom (GetStatistics/RetrieveBucketsTable/GetDiskAvailabilityAndTempPoolSize). SimulateStoragePressure erzeugt einen Callback/Benachrichtigung und ist ausdrücklich kein verwendeter Evictionbeweis.

https://chromium.googlesource.com/chromium/src/+/refs/heads/main/storage/browser/quota/quota_features.cc
https://chromium.googlesource.com/chromium/src/+/3d039375e365c2bd824049ffce76697c4a88b2ff/storage/browser/quota/quota_temporary_storage_evictor.cc
https://chromium.googlesource.com/chromium/src/+/refs/tags/144.0.7525.3/storage/browser/quota/quota_internals.mojom
