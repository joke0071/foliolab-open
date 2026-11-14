# K4 · localStorage einschließende Eviction · Nutzdatenverlust und markerloser Start belegt

**Firefox-Nutzdaten-Eviction einschließlich localStorage/Vault: PASS. Markerloser Appstart: PASS. Vollständiger Originverlust einschließlich sämtlicher beobachteter Metadaten: NICHT beobachtet, Service-Worker-Registrierung erhalten. K4 insgesamt PARTIAL.** Keine Produktabweichung im geprüften Appfall. Produkt v315 LIVE_ACCEPTED/Main `ff60c73e53c973ecb86393be5b4e31b55f352601` unverändert; keine Produktänderung/Deployment.

## Belegter Mechanismus und Versionsbezug

Vor CI wurde der [Quellen-/Ereignisvertrag](https://github.com/joke0071/foliolab-open/blob/09abbaa5bcb60d430194b274c73371f7cc88bab6/docs/K4_WHOLE_ORIGIN_2026-11-14.md) gespeichert. Die [Chromium-Quota-Pool-](K4_STORAGE_EVICTION_2026-11-14.md) und [ext4-Knappheitsbelege](K4_FILESYSTEM_EVICTION_2026-11-14.md) bleiben gültig: localStorage überlebt dort. Versionspassendes Chromium141-QuotaClientType enthält keinen LS-Client; deshalb kein erneuter tieferer Chromium-Fülllauf.

Firefox142.0.1 dagegen registriert LSNG als QuotaManager-Client. CanonicalQuotaObject::LockedMaybeUpdateSize überschreitet bei tatsächlichen Schreibvorgängen den globalen Pool, sammelt ungeschützte/inaktive LRU-Origins und ruft DeleteOriginDirectory auf. Diese Funktion entfernt das gemeinsame Originverzeichnis rekursiv, einschließlich ls/data.sqlite. LSNG ist standardmäßig aktiv; kein manuelles Browser-/IDB-/CDP-Löschen ist dafür nötig.

| Versionsquelle | Datei / entscheidender Vertrag | Gitblob |
| --- | --- | --- |
| Chromium 141.0.7390.37 | [storage/browser/quota/quota_client_type.h](https://github.com/chromium/chromium/blob/141.0.7390.37/storage/browser/quota/quota_client_type.h) | 8d44d792c41aeb5a066bbc02e6119567178e745c |
| Firefox 142.0.1 | [dom/quota/ActorsParent.cpp](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_142_0_1_RELEASE/dom/quota/ActorsParent.cpp) | a2d37469d1578daf80a5bcd932172b8d1bb45e87 |
| Firefox 142.0.1 | [dom/quota/CanonicalQuotaObject.cpp](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_142_0_1_RELEASE/dom/quota/CanonicalQuotaObject.cpp) | 55aa425656f9c125694a7038dd7d25fdadcf0841 |
| Firefox 142.0.1 | [dom/localstorage/ActorsParent.cpp](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_142_0_1_RELEASE/dom/localstorage/ActorsParent.cpp) | e8e9a0515fb3993d810559ce52b9b010dea39b62 |
| Firefox 142.0.1 | [dom/localstorage/LocalStorageCommon.cpp](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_142_0_1_RELEASE/dom/localstorage/LocalStorageCommon.cpp) | c248030edddd382738a3d107c676ef8c26e1679f |
| Firefox 142.0.1 | [modules/libpref/init/StaticPrefList.yaml](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_142_0_1_RELEASE/modules/libpref/init/StaticPrefList.yaml) | 08ff84fcced88c75ff798e8218c067fafca082f5 |

Playwright1.56.1 browsers.json ordnet Firefoxbuild1495 der Version142.0.1 zu. Der echte Lauf bestätigt Browserversion, application.ini und platform.ini142.0.1 / BuildID20251001122343. Das Playwright-UPSTREAM_CONFIG verweist noch auf361373160356d92cb5cd4d67783a3806c776ee78 (version.txt140.0.2); diese Inkonsistenz ist festgehalten. LSNG-/CanonicalQuotaObject-Blobs sind an dieser Basis und am142.0.1-Release-Tag identisch, relevante Registrierung/rekursive Originlöschung/Pref ebenfalls an beiden Ständen geprüft. bootstrap.diff ändert keine dom/quota-/dom/localstorage-Datei. Keine Behauptung eines vollständig reproduzierten, byteidentischen Herstellerbuilds. Ausschlaggebend ist der zusätzliche native Laufbeleg.

## Tatsächlicher Lauf und Ereignis

[QA43645973137](https://github.com/joke0071/foliolab-open/actions/runs/43645973137), Versuch1, Job132603709532. QA-Ref `qa/k4-whole-origin-e4b79f541e28`, Head `f285bb761c22a736e82f12a6334e73171fd1f4ae`, Tree `1f4d62930e0e552e03dcd215a71483f8c912cd2a`. Ubuntu24.04 / Firefox142.0.1 / Playwright1.56.1. Gegen Main nur QA-Runner und QA-Workflow hinzugefügt. [Runner](https://github.com/joke0071/foliolab-open/blob/f285bb761c22a736e82f12a6334e73171fd1f4ae/.qa/k4-whole-origin.cjs).

Dasselbe Profil `/home/runner/work/_temp/k4-whole-origin-firefox` und dieselbe Origin `http://127.0.0.1:33133` durchgehend. Neues Profil nur für anfängliche synthetische Einrichtung; nach Seeding kein Profilwechsel oder Reset. HTTP-Server bleibt offen.

Vorher außerhalb des Profils gesichert: bestätigte Portfolio-Revision7/confirmedActive, vollständige raw-/Settingsdaten (Synthetic ETF, Menge2, Preis100EUR), echte Vault-IDB mit synthetischem Passwort/nicht extrahierbarem CryptoKey, Modusmarker/ältere lokale Portfoliokopie/Sentinel, Cachepayload, OPFS-Datei sowie aktiver v315-ServiceWorker. Native Dateiinventare und Hashes umfassen insbesondere ls/data.sqlite. Persistenzanforderung nicht erteilt, persisted=false.

Druckquelle: explizit32MiB globaler Firefox-Pool über normalen Konfigurationspref `dom.quotaManager.temporaryStorage.fixedLimit=32768` (KiB). Keine Behauptung einer vollen physischen Festplatte oder Standardquotaabnahme. Zieltab und Browser wurden regulär geschlossen; dasselbe Profil für native Beobachtung neu geöffnet. Danach nur konkurrierende Loopback-Origin-Gruppen beschrieben, Target während Druckphase nicht geöffnet.

Vier erfolgreiche8MiB-Schreibvorgänge mit nicht komprimierbaren synthetischen Cachebytes werden jeweils mit8485187 Bytes Quotanutzung erfasst. Zusammen33940748 Bytes plus anfängliche Zielnutzung2962444 Bytes übersteigen den33554432-Byte-Pool. Fenster maximal120s/8 konkurrierende Origins; Hostfreiplatz blieb weit über der1GiB-Abbruchgrenze.

| Native Beobachtung,14.11.2026 (MEZ) | Befund |
| --- | --- |
| 23:03:18.846468 | Firefox-TID3530 löscht ls/data.sqlite per erfolgreichem unlink |
| 23:03:18.968528 | Derselbe Thread entfernt das gesamte Ziel-Originverzeichnis per erfolgreichem rmdir |
| 23:03:19.380 | Verzeichnis fehlt, neutrale Probe derselben Origin wird erst anschließend gestartet |

Strace-TID3530 gehört laut /proc/status zu Firefox-TGID3505; dessen tatsächlich aufgezeichnete Kommandozeile nennt Firefox1495 und dasselbe Profil. Tracer3502 und Node-Runner sind getrennte Prozesse. Original-native-fs-Spuren enthalten erfolgreiche Systemaufrufe, nicht nur eine erwartete Fehlermeldung oder QuotaExceededError. Kein Löschaufruf im QA-Runner. Für ptrace-Kompatibilität ist MOZ_DISABLE_CONTENT_SANDBOX=1 gesetzt; das ist eine QA-Grenze, keine Sicherheits-/Geräteabnahme.

## Verlustumfang vor erneuter Appinitialisierung

| Befüllter Bereich | Vorher | Neutrale Probe nach Ereignis |
| --- | --- | --- |
| Portfolio-IDB | Revision7, confirmedActive, Originalraw/Settings | Keine IDB-Datenbank |
| Backup-Vault-IDB | Konfigurierter synthetischer Schlüssel/Wrap, Passwort vorhanden | Keine IDB-Datenbank; später hasBackupPassword=false |
| localStorage | idb-v1-Modus, alte Kopie, Sentinel | Vollständig leer |
| Cache API | Testcache und v315-Appcache | Leer |
| OPFS | payload-Datei | Leer |
| Service-Worker-Registrierung | Aktiver /sw.js, Originscope | **Registrierung/aktiver /sw.js erhalten** |

Die Inventare wurden vor PortfolioStorage.initialize und vor normalem Appstart erfasst. OPFS-Lesen kann leere Metastrukturen anlegen; das verdeckt nicht das vorher nativ belegte Entfernen des ursprünglichen Verzeichnisses und seiner Inhalte. SessionStorage ist tabgebunden und wird nicht als druckbedingt gelöscht ausgegeben.

**Damit ist der vollständige Verlust aller befüllten Nutzdatenspeicher einschließlich localStorage und Vault belegt. Ein uneingeschränkt vollständiger Originverlust wird ausdrücklich nicht behauptet**, weil SW-Registrierung und zugehörige Browsermetadaten fortbestehen. Das entspricht dem maschinellen Status PAYLOAD_LOSS_AND_APP_PASS_SERVICEWORKER_RETAINED.

## Markerloser Fachtest: korrektes Appverhalten

v315 initialize()/initializeNew() entscheidet anhand Modusmarker, alter lokaler Kopie und kanonischem Record. Nach deren tatsächlichem Verschwinden existiert kein belastbares Appsignal für ein früher gespeichertes Portfolio. Eine SW-Registrierung belegt allein keinen früheren Portfoliobestand: Sie entsteht auch bei frischem leerem Appbesuch. Keine Recoverymeldung allein aufgrund extern gesicherter Testbelege als Soll erfinden.

Der echte Corestart initialisiert ein neues leeres IndexedDB-Modell mit Revision1. Normale UI danach: „Transaktionale IndexedDB aktiv“ und „Noch keine Positionen. Füge eine Anlage hinzu oder importiere vorhandene Daten.“ Keine alte Position, kein Sentinel, kein altes Passwort; neuer kanonischer Record weiterhin Revision1/leere Positionen. Keine stille Altbestandsübernahme, keine unzutreffende Behauptung, der frühere Bestand sei erhalten. after.png visuell geprüft. **Appfall PASS für den tatsächlich belegten markerlosen Nutzdatenverlust.** Kein Produktpatch aus fehlender Recoverymeldung ableiten; kein neuer Backup-Restore-/OAuth-PASS.

## Weiterer vollständiger Pfad: WebKit, aber verfügbare Linux-Ansteuerung fehlt

WebKit-Herstellerdokumentation [Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/) nennt originweise Verdrängung einschließlich localStorage, Cache, IDB, ServiceWorker und FileSystem. Zusätzlich den in Playwright1.56.1 gepinnten WebKit-Quellstand `db897909f7c31d9b38793374c66427b6a4cb3dd3` geprüft:

- NetworkStorageManager::allManagedTypes enthält ausdrücklich ServiceWorkerRegistrations neben LS/IDB/Cache/FileSystem.
- performEviction verwendet deleteData(allManagedTypes) für ungeschützte inaktive Origins.
- spaceGrantedForOrigin kehrt jedoch bei fehlendem m_totalQuotaRatio zurück. WebsiteDataStore::defaultTotalQuotaRatio ist außerhalb Cocoa nullopt.
- GLib WebKitWebsiteDataManager besitzt den **Construct-only**-Parameter total-storage-ratio, Standard -1 (kein Gesamtlimit). Die geprüfte MiniBrowser-/Playwright-Erzeugung setzt ihn nicht; der vorhandene Playwright-WebKit-Treiber/Bootstrap-Patch bietet keine Quota-Einstellung. WebKitNetworkSession fügt keine solche Einstellung hinzu.

[NetworkStorageManager.cpp](https://github.com/WebKit/WebKit/blob/db897909f7c31d9b38793374c66427b6a4cb3dd3/Source/WebKit/NetworkProcess/storage/NetworkStorageManager.cpp) · d11e2a87543c64c0c339620b219f05c71ded7302

[OriginStorageManager.cpp](https://github.com/WebKit/WebKit/blob/db897909f7c31d9b38793374c66427b6a4cb3dd3/Source/WebKit/NetworkProcess/storage/OriginStorageManager.cpp) · 2a3e6791c0b400084bb8a977a7a6e6b2765d4f14

[WebsiteDataStore.cpp](https://github.com/WebKit/WebKit/blob/db897909f7c31d9b38793374c66427b6a4cb3dd3/Source/WebKit/UIProcess/WebsiteData/WebsiteDataStore.cpp) · 606401f719eecd52737fc3f6f15a328f74f4f5d9

[WebKitWebsiteDataManager.cpp](https://github.com/WebKit/WebKit/blob/db897909f7c31d9b38793374c66427b6a4cb3dd3/Source/WebKit/UIProcess/API/glib/WebKitWebsiteDataManager.cpp) · 59da4baba9cc6084cb92d6dfb93ae338d149b7ce

[WebKitNetworkSession.cpp](https://github.com/WebKit/WebKit/blob/db897909f7c31d9b38793374c66427b6a4cb3dd3/Source/WebKit/UIProcess/API/glib/WebKitNetworkSession.cpp) · 4790dbbfb0c33391ee475f0fbf64395c0049b3e4

[main.c](https://github.com/WebKit/WebKit/blob/db897909f7c31d9b38793374c66427b6a4cb3dd3/Tools/MiniBrowser/gtk/main.c) · d3fbb968ee463f86c64fecb855b46c8634b4b72d

**Exakte Nachweislücke:** In der verfügbaren Linux-Playwright-Ansteuerung ist kein aktivierter/erreichbarer globaler Quota-Pfad belegt, der die SW-Metadaten mit verdrängt. Daraus folgt keine universelle Unfähigkeit von WebKit oder Safari. Ein bloß kleineres Volume/mehr Füllbytes würde den fehlenden Quota-Parameter nicht ersetzen; deshalb kein spekulativer WebKit-CI-Lauf.

**Kleinste ausführbare Voraussetzung:** einen zur gepinnten WebKit-Buildversion passenden QA-MiniBrowser/Testlauncher bereitstellen, der beim Erzeugen des persistenten WebsiteDataManagers einen positiven begrenzten total-storage-ratio setzt und dessen Wirksamkeit messbar ausgibt. Beispielscope: ausschließlich isoliertes QA-Profil, tatsächlich gesetzte Gesamtquota und native deleteData(allManagedTypes)-Beobachtung; danach vorhandene Fixture plus strikte SW/LS/IDB/Cache/OPFS-/Vault-Vorher-nachher-Prüfung verwenden. Alternativ echte verfügbare Cocoa-/Safari-Testumgebung mit nachweislich aktiver Gesamtquota. Kein manuelles clearData/Profilreset als Ersatz.

## Originale, Fehlversuch und Sicherung

Voriger Lauf43645760657 war **kein Ereignis-PASS**: Cache-Nullbytes komprimierten auf489667 Bytes je Origin. Acht solcher Schreibvorgänge plus Zielnutzung blieben deutlich unter32MiB; Origin blieb erhalten, App-Nach-Eviction-Test NOT_RUN. Beobachteter Aufbaufehler wurde ausschließlich durch nicht komprimierbare, tatsächlich quotawirksame Druckbytes korrigiert. Kein blindes Retry, keine Änderung am Produkt oder markerlosen Soll.

- [Original43645760657](https://github.com/joke0071/foliolab-open/actions/runs/43645760657/artifacts/14133806646):253311 Bytes,SHA2566d5ed515795592549817a1c776c49da7876f95c30a0f30e166f3869f9a040209,403 Dateien.
- [Original43645973137](https://github.com/joke0071/foliolab-open/actions/runs/43645973137/artifacts/14134416302):348189 Bytes,SHA2567609abe6eb6975a6ee28a5675cecaf19ea0a18d857cc6c07f0456e1066de9f89,338 Dateien.
- Beide OriginalZIPs mit GitHub-Größe/Digest und CRC geprüft, vollständige Joblogs/native Spuren/source-review/Zuordnung gesichert.
- [FolioLab_K4_Whole_Origin_2026-11-14.tar.gz](https://chatgpt.com/library?file_id=libfile_fde3_f-0166cbe62d9c8191b7e0ef97d41f1b83_54e45e8130348191808d9aaa710cf372&account_id=personal),544229 Bytes,SHA256 `4eabbc8b021f9a002c5206d8c2930a6287fd07ce5e8f0ed14ce47850659fb2ca`. Version0 an exakter Dateiidentität gepinnt rückgelesen:9 Archivmitglieder und741 Originaldateien tatsächlich restauriert/hashgeprüft, beide ZIP-CRCs erneut PASS.

## HND01-Abgabe

Claim `2f56309d1bf6477016930c7933115bc163626e5e` mit expected c2dbb23b9707bc3ec5b689f36ddd8284789af87c; Quellenvertrag vor CI09abbaa5bcb60d430194b274c73371f7cc88bab6. Letzter Abgleich: Main unverändert, keine queued/in_progress Actions. K4 PARTIAL. **Writer k4-full-origin-e4b79f541e28 STOPPED / HANDOVER_READY.** Vor nächster Mutation aktuelle expected SHA lesen und HND01 übernehmen; Checkpointbranch niemals vollständig nach Main.
