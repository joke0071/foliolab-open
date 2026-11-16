# PR344 / SWv319 · Live-Versuch1: HTTP429-Diagnose · 16.11.2026

Main `7bb7b5a1f6124d933343590973310815df1d1653`, Tree `b775686abb60cd8d2e74af7ec601f3a8da8a5c2b`, exakter freigegebener Head `fe2e6791762c96590e3cb781f6cff1c4ae99730b`. [Regulärer Lauf43814956980/1](https://github.com/joke0071/foliolab-open/actions/runs/43814956980): Main/Cross/Deployment SUCCESS; Livejob133132830196 FAILURE, keine volle Live-Abnahme.

## Gesicherter Primärbefund

Recovery-Skript `tests/browser-recovery-backup-limits.mjs:36`: nach Reload wartet der Locator für Mehr20s vergeblich. Derselbe originale Worker-/Kontextmitschnitt enthält65Modulantworten HTTP429 innerhalb59ms, jeweils `Server: Varnish`, `Retry-After: 0`, `X-Cache: MISS`; zugehörige Requests enden ERR_ABORTED. Dokument selbst200; SW erreicht installiert/aktiviert. Damit ist die fehlende vollständige Appinitialisierung beim Reload durch die tatsächlich verweigerten Modulabrufe eingegrenzt. Konkrete Limiterkonfiguration, verantwortliche Ebene hinter Varnish und auslösende Anfragequelle bleiben UNKNOWN; keine Behauptung eines bewiesenen neuen Produktdefekts oder Erklärung historischer503-/SW-Fehler.

Vorher erfolgreich:155Live-Assethashes einschließlich ausgeliefertem SWv319,6Coregruppen/18AxeScans, Loading/PWA und8neue native Chromium-FX-/IDB-/Reopenfälle. Spätere Chromium-/alleLiveCrossfälle übersprungen, daher kein GesamtPASS. Main:1493Tests/0Fehler/Skips,264JSON insgesamt (261bestehende/646Assertions+8Sonderschemata,3FX-Berichte/24nativeFälle),15CSV-Ziele44px mit echten Negativkontrollen. Pages154Dateien exakt Tree.

## Abgegrenzte Gegenprobe und einmalige Wiederholung

Drei aktuelle Einzelproben (SW und zwei betroffene Module) liefern wieder200. Unverändertes Original-Recoveryskript auf exakt qualifiziertem Tree lokal gegen Produktion: ursprünglicher Reload, echter verschlüsselterDownload, IDB-/Revisionsgleichheit,7Breiten/Axe PASS; anschließend unveränderte Plain-Erweiterung mit tatsächlichem FreshRestore/20MB-Ablehnung PASS. Keine HTTP-/Instrumentierungsfehler. Andere lokale Proxy-/Edge-Strecke und explizite TLS-Proxy-Ausnahme: ausschließlich begrenzter Diagnosebeleg, kein Ersatz für reguläre GitHub-/Geräteabnahme.

Nach Sicherung/Analyse und beobachteter Erreichbarkeit genau einen gezielten Livejob-Retry vorgesehen. Gültige Main-/Cross-/Deploygates nicht neu starten. Falls gleicher Befund wiederkehrt: keine weitere unveränderte Wiederholung; Limiter-/Anfragelastursache mit Primärmaterial untersuchen. Keine Frist-/Assertionlockerung oder SW-Produktänderung aus diesem Befund.

## Dauerhafter Originalpin

[FolioLab_PR344_Main43814956980_Versuch1_Originalbelege_2026-11-16.tar](https://chatgpt.com/library?file_id=libfile_fde3_f-06b86ae5222c8191bd4c8ec2edd41e38_54e45e8130348191808d9aaa710cf372&account_id=personal), Version0,230328320Bytes, SHA256 `fc142d7c46117c048a4c5f8c5369cadd32f759fdaf01c9c6c2f372ea09ecde1f`, exakterPin `file_0000000043dc8212a6eb83580cd369b0`. Alle8CI-ZIPs mit API-Digest/Größe/CRC geprüft,62Manifestdateien. Unabhängig versiongepinnt bytegleich zurückgelesen,2479Originaldateien+154Pages-Dateien tatsächlich restauriert. Diagnose/Quellblobs/Originalheaders/Joblogs/Gegenprobe erhalten. Früheres PR344-Qualifikationspaket und PR343-Abnahme unverändert gültig.

## Ergebnis der vorgesehenen einmaligen Wiederholung

Livejob133135769207 / Versuch2 vollständig SUCCESS in Chromium, Firefox und WebKit; Originale separat gepinnt bytegleich rückgelesen und1883Dateien tatsächlich restauriert. [Vollständige Abnahme](PR344_MAIN_RELEASE_ACCEPTANCE_2026-11-16.md). Erster Fehlversuch und seine Ursache/Grenzen unverändert erhalten; kein weitererRetry oder Produktfix aus diesem Befund.
