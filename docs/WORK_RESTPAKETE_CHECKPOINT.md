# HND01 · STOPPED / HANDOVER_READY · K4 reale Dateisystemknappheit

**Eviction unter realer Datenträgerknappheit PASS; anschließende Appreaktion PASS. K4 insgesamt PARTIAL.** Writer k4-disk-e4b79f541e28 abgegeben.

[Ergebnis, Belege, Aussagegrenze und nächster Schritt](K4_FILESYSTEM_EVICTION_2026-11-14.md). [QA43644024194](https://github.com/joke0071/foliolab-open/actions/runs/43644024194), Head c69b499d701b5fd20d08202b40979990fca407fa. Ein gezielter Lauf, Vorlage43641987091 wiederverwendet; keine Produktänderung/Deployment.

Isoliertes256MiB-ext4-Loopback für Profil und Druckdatei, Logs/Belege außerhalb. Reale4MiB-Schreibprobe senkt verfügbaren Platz exakt4MiB. Revision7/confirmedActive=true und Ziel-Bucket1 bestätigt. Standardquota187675443 Bytes, keine Overrides. Minimum14635008 Bytes verfügbar (6,24%), oberhalb vorab festgelegter6%-Abbruchgrenze14075658 Bytes. Browser1 Eviction/1 Runde/0 Fehler, Ziel-Bucket verschwunden, Nutzung5204149→0 Bytes, freier Platz steigt. Host-Dateisystem nicht gefüllt; Testvolume regulär ausgehängt.

Vor Appstart IDB/Cache/OPFS leer; localStorage mit Modusmarker/staler Kopie überlebt. FolioLab zeigt Recovery/Änderungen gesperrt/Speicher nicht verfügbar, übernimmt keine alten Daten; kanonischer Record bleibt leer. UI-Aufnahme und unabhängiger Nachvergleich geprüft.

Produkt v315 LIVE_ACCEPTED/Main ff60c73e53c973ecb86393be5b4e31b55f352601 unverändert. [Vorheriger Quota-Pool-Nachweis](K4_STORAGE_EVICTION_2026-11-14.md) und [Release-/SIGKILL-Abnahme](https://github.com/joke0071/foliolab-open/blob/5fad6b5c5436e078e0363fdb3b2c888217ead871/docs/WORK_RESTPAKETE_CHECKPOINT.md) weiter gültig; nicht wiederholen.

OriginalZIP195366 Bytes/GitHub-SHA/CRC geprüft,17 Originaldateien und vollständiges Joblog gesichert. Archiv FolioLab_K4_Filesystem_Eviction_2026-11-14.tar.gz,216692 Bytes,SHA256ef11b5d12c11253f9c8e4cae1f9550191463a3005f2d024a9ccda37e2f35384e. Version0 gepinnt rückgelesen;6 Archivmitglieder und17 Originaldateien restauriert/hashgeprüft. Archividentität libfile_fde3_f-79cba1d363ec81918673238addd32528_54e45e8130348191808d9aaa710cf372.

Aussagegrenze: echtes knappes Profil-Dateisystem auf Linux-CI, keine physische Android-/Safari-/Windows-Abnahme, kein vollständiger Origin-/befüllter Vaultverlust und kein erneuter Backup-/OAuth-PASS. Nächster ausführbarer Schritt: tatsächliche Voraussetzungen und Beobachtung für vollständigen browserseitigen Originverlust einschließlich localStorage klären; markerloses Soll erhalten, manuelles Löschen nur Simulation.

Claima11d451446bade60e754ec52e5d4910ddc6782c2 mit expected08329bc532e354376d9273c7fafa301c5662395b; [Plan vor CI](https://github.com/joke0071/foliolab-open/blob/7296d76fa8dab69328de53436fdd8512a9cb2616/docs/K4_FILESYSTEM_EVICTION_2026-11-14.md). Letzter Abgleich Main unverändert, keine queued/in_progress Actions. Vor weiterer Mutation aktuelle erwartete Branch-SHA lesen und HND01 übernehmen; Checkpointbranch niemals vollständig nach Main mergen.
