# K4 · reale Knappheit auf begrenztem Profil-Dateisystem · Ereignisvertrag vor CI

Produkt v315/Main ff60c73e53c973ecb86393be5b4e31b55f352601. Writer k4-disk-e4b79f541e28, Claim a11d451446bade60e754ec52e5d4910ddc6782c2, erwarteter Vorgänger08329bc532e354376d9273c7fafa301c5662395b. K4 bleibt PARTIAL. Keine Produktänderung/Release-/SIGKILL-Wiederholung.

## Wiederverwendung und einziges Delta

Vorlage docs/K4_STORAGE_EVICTION_2026-11-14.md und QA43641987091/Head09e28eb8616ee8f28cb0174d4c1f96b52139833b. Fixture, Revision7, alte synthetische localStorage-Kopie, Bucket-/Browserbeobachtung, Schichtenleser, Core-/UI-Prüfung und 75 Beobachtungen im Abstand5s bleiben erhalten. Neuer Runner nur auf isolierter QA-Ref: reale Fülldatei statt StorageQuotaSettings-Flag; nötige Isolation/Messung und präzisere Bucket-ID-Zuordnung. Keine Quota-Overrides in tatsächlich gestarteter Browserkommandozeile. Neues pre-event-layers-Inventar ergänzt die Messung nach anfänglichem Appstart.

## Vorbedingungen und Sicherheit

256MiB große, vorab fest allokierte Loopback-Datei; ext4 mit0% reservierten Blöcken, nosuid/nodev. Host vor Allokation >1GiB frei. Fülldatei und Chromiumprofil liegen auf dieser Partition; Artefakte/Logs außerhalb. Host wird nicht gefüllt: einzige Druckschreibvorgänge erfolgen auf einem geprüften Descriptor des abweichenden Loopdevices. Die maximal256MiB große Bilddatei kann durch Druckschreiben nicht wachsen.

Setup protokolliert jede Fähigkeit/Fehlermeldung (sudo, fallocate, mkfs.ext4, loop-mount, chown). Bei fehlender Fähigkeit keine Fixture/Fachprüfung; TECHNICAL_PREREQUISITE_MISSING und exakter Befehl/Fehler. Nach mount: findmnt für beide Pfade muss identisches /dev/loop*-ext4, denselben Mountpunkt und abweichendes st_dev vom Belegordner liefern; gemeldete Kapazität200–256MiB.

Vor Fachtest reale4MiB schreiben+fsync. Gemeldeter freier Platz muss um mindestens4MiB sinken; danach weiterhin >50% frei. Vor Ereignis Revision7/confirmedActive, Record/Settings/Origin/Profil, konkreten Ziel-Bucket, Nutzung, Browserzähler und freien Platz erfassen. Quota-Pool muss weit über der tatsächlichen Bucketnutzung liegen; Browser muss dieselbe Dateisystemkapazität messen.

## Druck, Abbruch, Beobachtungsfenster

Nach bestätigtem Vorzustand Chromium regulär schließen; denselben lokalen Server weiterbetreiben. Ausschließlich geprüfte Druckdatei in Schritten bis8MiB mit echten Writes+fsync füllen, bis etwa8% des Dateisystems frei sind. Jeden Schritt mit UTC-Zeit, Dateigröße, total/free/available und Hostavailable protokollieren.

Abbruchgrenze6% freier Platz; jeder Schreibschritt muss darüber bleiben. Während Beobachtung unter6% sofort abbrechen. Kein weiterer Füllversuch/ENOSPC als Ereignisnachweis. Browser danach im selben Profil, derselben Origin und normaler Quota öffnen. Maximal75 Stichproben mit5s Pause, plus Browserlesezeit (gut6min; native erste Runde nach rund5min). Jobtimeout12min. Keine Uhr-/Evictor-/Quota-Manipulation.

## Ereignis und Soll

Nur zusammen schlüssig: tatsächlich gemessener Freiplatzrückgang auf <9% des isolierten Dateisystems, browsergemeldete evicted-buckets>0, vorab identifizierte Ziel-Bucket-ID/Origin fehlt und anschließende neutrale Originprobe bestätigt Verlust der vorherigen Revision7. Schreibfehler allein reicht nicht. Pool bleibt unverändert weit oberhalb der Nutzung.

Danach vor App-Schreibzugriffen dieselbe neutrale Probe für IDB, Cache, OPFS und localStorage. Bei überlebendem Modusmarker/staler lokaler Kopie exakt die vorhandene Recovery-/UI-Prüfung des Vorlaufs: keine stille Legacy-Adoption, fehlender kanonischer Record, Speicher nicht verfügbar/Änderungen gesperrt, kein behaupteter Speichererfolg. Vollständiger Originverlust darf keinen lokalen Marker voraussetzen.

Keine Eviction im Fenster: niedrigsten freien Platz, letzte Browserzähler und konkreten Bucket-/Recordzustand dokumentieren; Appreaktion nach Eviction NOT_RUN. Ereignisfrage und Produktfrage getrennt bewerten. Nach erfolgreicher Ereignisprüfung derselbe Auftrag enthält unveränderten Fachtest.

## Aussagegrenze

Ein echtes begrenztes ext4-Profil-Dateisystem auf einem Linux-CI-Runner, keine physische Android-/Safari-/Windows-Abnahme. Loopback bleibt eine isolierte virtuelle Partition; Hostvolume wird nicht unter Druck gesetzt. Vollständiger Origin-/befüllter Vaultverlust und Backup-/OAuth bleiben separate Fälle.

Primärquelle zur Einordnung von Pool-/Diskdruck: Chromium QuotaTemporaryStorageEvictor, https://chromium.googlesource.com/chromium/src/+/3d039375e365c2bd824049ffce76697c4a88b2ff/storage/browser/quota/quota_temporary_storage_evictor.cc . Maßgeblich bleiben reale Messungen dieses Builds, keine aus neuerem Quellstand abgeleiteten Erfolgsbehauptungen.
