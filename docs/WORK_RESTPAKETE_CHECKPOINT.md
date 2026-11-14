# HND01 · ACTIVE · K4 vollständiger Originverlust

Writer k4-full-origin-e4b79f541e28 übernimmt ausschließlich die Voraussetzungsklärung für automatische Eviction einschließlich localStorage und bei schlüssigem Pfad den gezielten Fachtest. Vorgänger c2dbb23b9707bc3ec5b689f36ddd8284789af87c STOPPED/HANDOVER_READY, Übernahme mit exakt diesem expected SHA.

Produkt v315 LIVE_ACCEPTED / Main ff60c73e53c973ecb86393be5b4e31b55f352601 unverändert. Bestehende [Pooldruck-](K4_STORAGE_EVICTION_2026-11-14.md) und [reale ext4-Druckbelege](K4_FILESYSTEM_EVICTION_2026-11-14.md) weiterverwenden, kein bloßes tieferes Füllen und kein erneuter Chromium-Teiltest. K4 insgesamt PARTIAL. Keine Produktänderung/Deployment.

Vorabgleich: keine queued/in_progress Actions, keine offene K4-PR; PR332/161/157 getrennte Themen. Main und HND-Head entsprechen Nutzerübergabe. Versionspassende Quellen werden vor CI geprüft; Playwright1.56.1 beschreibt Chromium141.0.7390.37/Firefox142.0.1/WebKit26.0. Markerloses v315-Soll anhand initialize/initializeNew gelesen: vollständig verlorene Daten liefern kein zwingend überlebendes Recovery-Signal. Quellenbeleg und vorhandene Laufbeobachtung getrennt von echter Geräte-/Produktabnahme führen.
