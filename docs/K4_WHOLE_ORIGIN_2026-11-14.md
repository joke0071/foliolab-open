# K4 · vollständiger Originverlust einschließlich localStorage · Prüfung vor CI

Writer k4-full-origin-e4b79f541e28, Claim2f56309d1bf6477016930c7933115bc163626e5e, Produkt v315/Main ff60c73e53c973ecb86393be5b4e31b55f352601. K4 PARTIAL; Produktcode/Deployment nicht beauftragt. Frühere Pooldruck-/ext4-Teilfälle unverändert wiederverwenden.

## Entscheidende Pfadfrage: Firefox statt weiterer Chromium-Füllung

Chromium141-QuotaClientType enthält FileSystem, IndexedDatabase, ServiceWorkerCache, ServiceWorker und BackgroundFetch, keinen localStorage-Client. Das stimmt mit beiden tatsächlichen Belegen überein: IDB/Cache/OPFS verdrängt, localStorage erhalten. Keine unbelegte universelle Behauptung über jeden Chromium-Löschpfad; weiterer gleicher Speicherknappheitslauf ist nicht gerechtfertigt.

Firefox142.0.1 hat den passenden **automatischen QuotaManager-Pfad für Nutzdaten einschließlich LSNG**:
1. CanonicalQuotaObject::LockedMaybeUpdateSize prüft globalen Speicherverbrauch gegen mTemporaryStorageLimit. Bei Überschreitung CollectOriginsForEviction, danach DeleteOriginDirectory für ausgewählte Originlocks.
2. CollectOriginsForEviction nimmt nichtpersistierte/inaktive Origins nach Alter; gesperrte/persistierte/Extension-Origins sind ausgeschlossen.
3. DeleteOriginDirectory entfernt das vollständige per-Origin-Verzeichnis rekursiv; OriginClearCompleted informiert Clients.
4. Clientregistrierung umfasst IDB, DOMCACHE, FILESYSTEM und LS bei NextGenLocalStorageEnabled. LS-QuotaClient::GetType liefert LS. LocalStorageCommon aktiviert LSNG standardmäßig (unsupported_legacy=false).
5. GetTemporaryStorageLimit erlaubt den expliziten Benutzerpref dom.quotaManager.temporaryStorage.fixedLimit in KiB. Ein begrenzter32MiB-Pool kann durch erfolgreiche Schreibvorgänge mehrerer anderer Origin-Gruppen überschritten werden. GroupLimit mindestens10MiB erlaubt je8MiB. Kein tieferes Absenken des freien Datenträgerplatzes.

WebKit-Herstellerdokumentation nennt ebenfalls originweise Eviction einschließlich localStorage/IDB/Cache/SW/FileSystem (https://webkit.org/blog/14403/updates-to-storage-policy/). Das ist ein weiterer Quellenhinweis, kein ausgeführter Safari-/WebKit-Beleg und nicht der gewählte Lauf.

## Versionsbezug und Grenzen der Quellenzuordnung

Playwright1.56.1 browsers.json nennt Firefoxbuild1495/142.0.1, Chromium141.0.7390.37 und WebKit26.0. Runtimeversion142.0.1 wird vor Fixture geprüft; application.ini/platform.ini werden gesichert.

Die im selben Playwright-Tag hinterlegte UPSTREAM_CONFIG nennt Basis361373160356d92cb5cd4d67783a3806c776ee78 (version.txt140.0.2). Diese Abweichung wird nicht verschwiegen: relevante LSNG-/CanonicalQuotaObject-Blobs sind identisch am142.0.1-Release-Tag und an dieser Basis; Registrierung/Originlöschung/Limitpref auch am Basisstand geprüft. bootstrap.diff verändert keine dom/quota-/dom/localstorage-Datei. Das ist versionspassende Quellprüfung plus zusätzlicher Basisabgleich, kein vollständiger reproduzierbarer Binärbuildbeweis. Der tatsächliche neue Lauf muss das Ereignis selbst belegen.

| Version | Datei | Gitblob |
| --- | --- | --- |
| Chromium 141.0.7390.37 | [storage/browser/quota/quota_client_type.h](https://github.com/chromium/chromium/blob/141.0.7390.37/storage/browser/quota/quota_client_type.h) | 8d44d792c41aeb5a066bbc02e6119567178e745c |
| Firefox 142.0.1 | [dom/quota/ActorsParent.cpp](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_142_0_1_RELEASE/dom/quota/ActorsParent.cpp) | a2d37469d1578daf80a5bcd932172b8d1bb45e87 |
| Firefox 142.0.1 | [dom/quota/CanonicalQuotaObject.cpp](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_142_0_1_RELEASE/dom/quota/CanonicalQuotaObject.cpp) | 55aa425656f9c125694a7038dd7d25fdadcf0841 |
| Firefox 142.0.1 | [dom/localstorage/ActorsParent.cpp](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_142_0_1_RELEASE/dom/localstorage/ActorsParent.cpp) | e8e9a0515fb3993d810559ce52b9b010dea39b62 |
| Firefox 142.0.1 | [dom/localstorage/LocalStorageCommon.cpp](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_142_0_1_RELEASE/dom/localstorage/LocalStorageCommon.cpp) | c248030edddd382738a3d107c676ef8c26e1679f |
| Firefox 142.0.1 | [modules/libpref/init/StaticPrefList.yaml](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_142_0_1_RELEASE/modules/libpref/init/StaticPrefList.yaml) | 08ff84fcced88c75ff798e8218c067fafca082f5 |

## Ausführung und Ereignisnachweis vorab festgelegt

Ein isolierter Linux-Ubuntu24.04-QA-Lauf auf neuer Ref mit unverändertem v315-Produktbaum, Playwright1.56.1 und installiertem Firefoxbuild1495. Ein neues synthetisches Ausgangsprofil wird **nur am Anfang** angelegt, danach dasselbe Profil und dieselbe Origin beibehalten. Fester Server bleibt durchgehend geöffnet.

Befüllt werden kanonische Portfolio-IDB/Revision7/confirmedActive samt Settings, echte Backup-Vault-IDB mit synthetischem Passwort/nicht extrahierbarem Schlüssel, ältere lokale Portfoliokopie, Modusmarker und Sentinel in localStorage, Cache2MiB, OPFS1MiB sowie regulärer v315-ServiceWorker/Appcache. Ausgangsrecord und Inventare außerhalb des Profils sichern. SessionStorage ist tabgebunden und wird nicht als druckbedingt verdrängt ausgegeben.

Firefox startet mit einzigem druckbezogenem Pref fixedLimit32768KiB, LSNG auf Standard. Vor Browserrestart per-Origin-Verzeichnis/inode/alle Dateien erfassen; ls/data.sqlite muss vorhanden sein. Targettab schließen, Browser regulär schließen; gleiches Profil erneut starten. Danach nur andere Loopback-Origin-Gruppen füllen: höchstens8 Origins ×8MiB Cachepayload, Gesamtfenster120s. Bei Hostavailable<1GiB abbrechen; kein Host-/Profilreset/Füllfile. Stale/Target-Origin während Druckphase nicht öffnen.

Browser beim Drucklauf unter strace -ff für unlink/unlinkat/rmdir/rename, Logdateien außerhalb des Profils. Thread-/Prozesszuordnung über /proc, Browserkommando und Trace-TID sichern. MOZ_LOG QuotaManager/LocalStorage ergänzend. Für die native Beobachtung ist MOZ_DISABLE_CONTENT_SANDBOX=1 als QA-Kompatibilitätsgrenze gesetzt; das ist keine Sicherheits-/Geräteabnahme.

Ereignis nur belegt bei: erfolgreiche konkurrierende Speicherwrites, vorher vorhandenes Targetverzeichnis fehlt, native erfolgreiche Browser-syscalls für ls/data.sqlite und das Target-Originverzeichnis, anschließend im selben Profil/Origin vor Appstart leere IDB/Cache/OPFS/localStorage-Inventare. Kein manueller Datenlöschaufruf im Runner; Schreibfehler allein reicht nicht. Tracingfähigkeit fehlt → Ereignis nicht als PASS ausgeben.

ServiceWorker-Registrierung zusätzlich erfassen. Bleibt sie oder ein anderer relevanter Speicherbereich erhalten, **keinen vollständigen Originverlust behaupten**. Ein belegter vollständiger Nutzdatenverlust einschließlich LS kann trotzdem mit begrenzter Aussagegrenze separat erfasst und das markerlose Appverhalten beobachtet werden.

## Markerloser Fachvertrag

v315 initialize() wählt ohne Modusmarker und ohne Legacy-Kopie initializeNew(). Ohne kanonischen Restrecord ist eine frische leere Revision1 erlaubt. Ein noch vorhandener confirmedActive-Record würde dagegen validiert und übernommen; abweichende unbestätigte Reste bleiben gesperrt. Daher darf das Soll nach wirklich verschwundenen Markern/alten Kopien/IDB/Vaultdaten keine frühere lokale Verlustkenntnis voraussetzen.

Nach nachgewiesenem Datenverlust: Kern initialisiert IndexedDB mit leerem Modell/Revision1, UI meldet aktive Speicherung dieses neuen leeren Modells, kein altes Portfolio/Sentinel/Passwort wird wiederhergestellt. Keine verpflichtende Recoverymeldung ohne erhaltenes belastbares Signal über früher gespeicherte Portfoliodaten. Tatsächlich erhaltene SW-Metadaten gesondert auf Aussagekraft beurteilen; allein eine Registrierung belegt keinen früheren Portfoliobestand.

Ereignisfrage und Appreaktion getrennt berichten; bei unbelegtem vollständigem Verlust keine Gesamtabnahme. K4 bleibt PARTIAL. Quellen/Originalberichte sichern und Writer abgeben.
