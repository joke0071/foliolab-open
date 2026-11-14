# HND01 · ACTIVE · K4 Datenträgerknappheit

Writer k4-disk-e4b79f541e28 übernimmt den gezielten QA-Auftrag für echte Knappheit auf isoliertem Profil-Dateisystem. Vorgänger08329bc532e354376d9273c7fafa301c5662395b STOPPED/HANDOVER_READY. Übernahme mit genau diesem expected SHA. Produkt v315 / Main ff60c73e53c973ecb86393be5b4e31b55f352601 unverändert. Release, SIGKILL und Quota-Pool-Fall nicht erneut abnehmen.

Vorabgleich: keine queued/in_progress Actions, keine offene K4-PR; offene PR332/161/157 gehören getrennten Themen. Bestehenden Runner09e28eb8616ee8f28cb0174d4c1f96b52139833b samt Fixture/Browserzählern/UI verwenden. Nur Druckquelle und Messung ändern. Logs/Belege außerhalb des begrenzten QA-Dateisystems. Keine Hostfüllung, Produktänderung oder Deployment. K4 bleibt PARTIAL.

Vor CI wird die isolierte ext4-Loopback-Partition (256MiB fest begrenzt), Pfad-/Geräteprüfung, echter Schreib-/Freiplatz-Vortest, Druckziel/Abbruchgrenze und Beobachtungsfenster dokumentiert. Bei fehlender mount/loop-Fähigkeit kein Fachtest. [Vorige vollständige Abgabe](https://github.com/joke0071/foliolab-open/blob/08329bc532e354376d9273c7fafa301c5662395b/docs/WORK_RESTPAKETE_CHECKPOINT.md).
