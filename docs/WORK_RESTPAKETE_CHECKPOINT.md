# HND01 · ACTIVE · K4 Storage-Eviction · 14.11.2026

Writer k4-eviction-e4b79f541e28 übernimmt ausschließlich die Voraussetzungsklärung und bei schlüssigem Ereignisnachweis den gezielten Storage-Eviction-Fachtest. Vorgänger 5fad6b5c5436e078e0363fdb3b2c888217ead871 STOPPED / HANDOVER_READY; Übernahme per expected-SHA-geschütztem Ref-Update.

Produktbasis v315 LIVE_ACCEPTED / Main ff60c73e53c973ecb86393be5b4e31b55f352601 unverändert. Release und Linux-Chromium-SIGKILL nicht erneut abnehmen. Vorabgleich: kein queued/in_progress Actions-Lauf, keine offene K4-PR; PR332 gehört zur getrennten CI-Balancierung. Vorhandene K4-QA-Refs bleiben unverändert. Release-Sicherung und abgeschlossene Belege wie im [Vorgängercheckpoint](https://github.com/joke0071/foliolab-open/blob/5fad6b5c5436e078e0363fdb3b2c888217ead871/docs/WORK_RESTPAKETE_CHECKPOINT.md).

Vor CI: Druck, browserveranlasste Ziel-Origin-Eviction und tatsächlichen Schichtenverlust getrennt belegen. QuotaExceededError kein Evictionbeweis; manuelle Löschung nur Simulation. Keine Produktänderung, kein Deployment, kein Merge des Checkpointbranches. K4 insgesamt PARTIAL.
