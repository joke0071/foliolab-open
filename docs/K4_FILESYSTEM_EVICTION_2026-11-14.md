# K4 · reale Knappheit auf Profil-Dateisystem · PASS

**Ereignisfrage: PASS. Produktfrage: PASS. K4 insgesamt PARTIAL.** Ein gezielter Lauf, keine Wiederholung/Produktänderung/Deployment. v315/Main `ff60c73e53c973ecb86393be5b4e31b55f352601` unverändert. Release-, SIGKILL- und vorheriger Quota-Pool-Nachweis gelten weiter.

## Identität, Scope und Wiederverwendung

[Lauf43644024194](https://github.com/joke0071/foliolab-open/actions/runs/43644024194), Versuch1, Job132597673803, Ubuntu24.04.5 / Chromium141.0.7390.37 / Playwright1.56.1. QA-Ref `qa/k4-filesystem-e4b79f541e28`, Head `c69b499d701b5fd20d08202b40979990fca407fa`, Tree `146fb59854256d86c3fbe13b295d935b428e96a8`.

Vorlage [Quota-Pool-Fall](K4_STORAGE_EVICTION_2026-11-14.md), QA43641987091/Head09e28eb8616ee8f28cb0174d4c1f96b52139833b. Fixture, quota-internals-Beobachtung, Schichtenleser und vollständiger Core-/UI-Prüfblock unverändert wiederverwendet; vor CI abschnittsweise Bytegleichheit geprüft. Einziges Fachdelta: echte Fülldatei auf begrenztem ext4 statt Quota-Override; dafür Isolation, Freiplatzmessung, konkreter Bucket-ID-Abgleich und zusätzliches Schichteninventar nach anfänglichem UI-Start. Gegen Main nur drei QA-Dateien hinzugefügt, keine Runtime-/Test-/SW-Änderung.

[Vor CI gespeicherter Ereignis-/Sicherheitsvertrag](https://github.com/joke0071/foliolab-open/blob/7296d76fa8dab69328de53436fdd8512a9cb2616/docs/K4_FILESYSTEM_EVICTION_2026-11-14.md). [Tatsächlicher Runner](https://github.com/joke0071/foliolab-open/blob/c69b499d701b5fd20d08202b40979990fca407fa/.qa/k4-eviction.cjs), [Dateisystemsetup](https://github.com/joke0071/foliolab-open/blob/c69b499d701b5fd20d08202b40979990fca407fa/.qa/k4-setup-disk.py).

## 1. Reale Datenträgerknappheit und Eviction belegt

Isoliertes ext4 auf `/dev/loop0` (7:0), maximal256MiB große vorab allokierte Bilddatei. Tatsächliche Dateisystemkapazität234594304 Bytes. findmnt und st_dev bestätigen Profil `/home/runner/work/_temp/k4-disk-volume/profile` und Druckdatei `/home/runner/work/_temp/k4-disk-volume/pressure/pressure.bin` auf demselben Loopdevice; Belege/Logs liegen auf separatem Hostdevice2049 statt1792. Host hatte vor Bildallokation90168217600 Bytes verfügbar. Keine Druckschreibvorgänge auf Hostpfaden; die Bilddatei bleibt auf256MiB begrenzt. Das Volume wurde nach Belegsicherung regulär ausgehängt.

Echte4MiB-Vorprüfung mit write+fsync: verfügbarer Platz229195776→225001472 Bytes, exakt4194304 Bytes Rückgang. Danach noch ausreichend Platz für Fixture und bestätigte Revision7/confirmedActive=true, vollständige raw-/Settingsbytes, Synthetic ETF/Menge2/Preis100EUR/Wert200EUR, ältere synthetische lokale Kopie und Modusmarker. Origin durchgehend `http://127.0.0.1:41791`; Server läuft durch, Profil bleibt identisch.

Chromium verwendet Standardquota. Beide tatsächlichen Browserkommandozeilen sind aufgezeichnet, ohne StorageQuotaSettings-/unlimited-/Origin-Quota-Override. Gemessener temporärer Pool durchgehend187675443 Bytes (80% der Dateisystemkapazität), Nutzung nur rund5,2MB; somit keine künstliche Poolverknappung. Browser und unabhängiges statfs messen dieselbe Kapazität und denselben verfügbaren Platz.

| Zeitpunkt/Phase (MEZ, 14.11.2026) | Verfügbarer Platz, Bytes | Ziel-Bucket / Browserbefund |
| --- | ---: | --- |
| 22:40:39.715 · bestätigter Ausgangsstand | 212357120 | Bucket1, _default, konkrete Origin; Record7 vorhanden |
| 22:40:40.722 · nach echten Druckschreibvorgängen | 19382272 | Druckdatei197132288 Bytes; keine Datenlöschung |
| 22:45:39.984 · letzte Probe vor Eviction | 14635008 | Bucket1 vorhanden, Nutzung5204149 Bytes; Evictorstatistik noch leer |
| 22:45:45.407 · Ereignisprobe | 20242432 | Bucketliste leer, Nutzung0;1 evicted-buckets,1 eviction-rounds,0 Fehler,0 skipped |

Minimum14635008 Bytes = rund13,96MiB bzw.6,24% verfügbar. Vorab festgelegt: Druckziel8%, Abbruch unter6% =14075658 Bytes. Grenze nicht unterschritten; kein ENOSPC-/Schreibfehler als Beweis benutzt. 84 Dateisystemmessungen einschließlich4MiB-Vortest, Füllverlauf und Browserbeobachtung. Maximal75 Browserstichproben mit5s Pause; tatsächliches Ereignis nach rund5min, innerhalb des vorgesehenen Fensters.

Die Fülldatei bleibt während Ereignis und Wiederöffnung unverändert groß. Gleichzeitig steigt verfügbarer Platz um5607424 Bytes, der Browser meldet seine Eviction und die konkret erfasste Ziel-Bucket-ID verschwindet. Kein manuelles IDB-/CDP-Löschen, Profilreset oder SimulateStoragePressure. Das ist realer Platzmangel auf dem Profil-Dateisystem und browserveranlasste Eviction.

## 2. Tatsächlicher Verlust und Appreaktion korrekt

Unmittelbar danach neutrale Probe derselben Origin im selben Profil, vor App-Initialisierung: **IndexedDB leer, Cache leer, OPFS leer**. localStorage enthält weiterhin `foliolab-open-storage-mode=idb-v1`, ältere `foliolab-open-v1`-Kopie und Sentinel. Damit gilt derselbe Teilverlustzweig wie im Vorlauf; vollständiger Originverlust wird nicht unterstellt.

Echter PortfolioStorage-Start lehnt die Übernahme ab: „Aktiver IndexedDB-Speicher nicht gefunden. Bitte eine Sicherung wiederherstellen.“ Anschließend normaler Appstart bis appStartup.hidden. Sichtbare UI und Originalaufnahme after.png geprüft:

- „Gespeicherter Datenstand nicht lesbar. Änderungen sind gesperrt.“
- „Speicher nicht verfügbar. Keine Änderungen gespeichert.“; Sidebar ebenfalls Speicher nicht verfügbar.
- Weder Synthetic ETF noch STALE MUST NOT RETURN werden als Bestand übernommen. Keine globale sichtbare Behauptung „Portfolio lokal gespeichert“.
- Nach Appstart bleiben die lokalen Altbytes exakt gleich und der kanonische records-Store leer. Neue leere DB-Strukturen/Appcache sind keine Wiederherstellung eines Portfolios.

**Fachtest PASS für den tatsächlich vorgefundenen Zustand. Keine reproduzierte Produktabweichung.** Backup-Restore nach diesem Ereignis sowie Verlust eines zuvor befüllten Vault-Schlüssels wurden nicht neu abgenommen.

## Originale, Sicherung und HND01

[Originalartefakt14132859907](https://github.com/joke0071/foliolab-open/actions/runs/43644024194/artifacts/14132859907):195366 Bytes, SHA256 `35a3e7cb9c0b3f4da7c0e813fe23f3eda3bde5aaa5d25929090726e8e6a6235c`, ZIP-CRC PASS,17 Originaldateien. Dazu vollständiges Jobprotokoll, unabhängige Auswertung, exakter QA-Dateiabgleich und Hashmanifest.

[Belegarchiv](https://chatgpt.com/library?file_id=libfile_fde3_f-79cba1d363ec81918673238addd32528_54e45e8130348191808d9aaa710cf372&account_id=personal): FolioLab_K4_Filesystem_Eviction_2026-11-14.tar.gz,216692 Bytes,SHA256 `ef11b5d12c11253f9c8e4cae1f9550191463a3005f2d024a9ccda37e2f35384e`. Version0 anhand exakter Dateiidentität gepinnt rückgelesen, alle6 Archivmitglieder sowie alle17 Originaldateien tatsächlich restauriert/hashgeprüft; ZIP-CRC erneut PASS. Die Profilpartition und die Druckdatei sind nicht Teil des Belegarchivs.

Writer k4-disk-e4b79f541e28 übernimmt mit expected08329bc532e354376d9273c7fafa301c5662395b am Claim `a11d451446bade60e754ec52e5d4910ddc6782c2`. Letzter Abgleich Main unverändert, keine laufenden/queued Actions, kein anderer K4-Writer. Abschlussdokumentation und Writerabgabe mit expected `7296d76fa8dab69328de53436fdd8512a9cb2616`.

## Aussagegrenze und nächster ausführbarer Schritt

Belegt ist **Linux-Chromium mit normaler Quota und tatsächlich knappem verfügbarem Platz auf einem isolierten ext4-Loopback-Dateisystem**. Keine Behauptung einer physisch vollen Hostplatte oder einer Android-/Safari-/Windows-Geräteabnahme. localStorage überlebte; vollständiger Originverlust und verlorene befüllte Vaultschlüssel bleiben eigenständige Fälle. K4 insgesamt PARTIAL, v315-/SIGKILL-Abnahmen unverändert.

Nächster ausführbarer Schritt: Voraussetzungen für browserseitigen vollständigen Originverlust einschließlich localStorage auf einem isolierten QA-Profil klären. Vor einem solchen Lauf tatsächlichen Verlustmechanismus/Beobachtung festlegen und das markerlose Soll aus dem Vertrag verwenden. Manuelles Löschen bleibt Simulation; kein erneuter identischer Linux-Teiltest und kein Produktpatch aus diesem PASS.

**STOPPED / HANDOVER_READY.** Writer vollständig abgegeben; vor weiterer Mutation aktuellen expected SHA lesen und HND01 übernehmen.
