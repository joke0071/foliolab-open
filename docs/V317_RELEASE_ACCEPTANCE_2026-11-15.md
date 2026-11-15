# v317 · vollständige Releaseabnahme · 15.11.2026

**LIVE_ACCEPTED**, Main `0d1638cb2034805dace789e3072fbb7bcda8d52c`, Tree `2644817dfb558da9668ec0a55bd7e6092cd80324`. PR #341 wurde ausschließlich am ausdrücklich freigegebenen Head `61b56ac50a2e87796db0aad0027675ae3fd5c142` headgebunden gemergt. Basis und geprüfter Merge-Tree waren unmittelbar vorher unverändert; Pflichtchecks grün, keine Reviews/Threads. [Maschinenbeleg](release-evidence/v317-live-accepted-2026-11-15.json).

[Regulärer Lauf43734167356/1](https://github.com/joke0071/foliolab-open/actions/runs/43734167356): Main/Chromium und drei Cross-Engine-Shards, Deployment132879585194 und vollständige Live-Abnahme132879689077 SUCCESS. 1.483Units,0Fehler/Skips. Kein Retry, Abbruch oder Doppelstart.

- Pages-Artefakt:154Dateien exakt zu den Main-Gitblobs. Produktion:155unabhängige Asset-/Alias-/SW-SHA256-Vergleiche,142tatsächlich geladene Assets, reguläres HTTPS/TLS ohne Zertifikatsausnahme.
- Kern:6vollständige Gruppen und18Axe-Scans; reale synthetische UI-Anlage/Bearbeitung/IDB/Reload, tatsächlicher normaler und verschlüsselter UI-Export→FreshRestore→Reload, exakte Buchungen, aktiver SW/Cachev317 und Offline-IDB-Speichern/Reload.
- Produktions-UI:66Scans und Transferansichten10Scans je Chromium/Firefox/WebKit. Native Cache-/Controllerbeobachtungen aller3Engines vorhanden. Fünf ausgewählte Original-Produktionsbilder tatsächlich angesehen, kein behaupteter Gesamtaudit aller Bilder; Vollseitenbilder enthalten Scroll-/Fokus-/Fixed-Header-Artefakte des bestehenden Tests.
- Archivlimit im regulären Main:23Checks je Engine; verständliche5000er-Aktionsgrenze, kleinere Teilmenge/Vorschau und0Writes bei Bedienung/Abbruch. Alle15Main-Zielhöhen exakt44px; Anforderung und Diagnose bleiben aktiv.

## Workerdiagnostik und Aussagegrenze

208Originalprotokolle:70Chromium,69Firefox,69WebKit. Alle Browser geschlossen und alle70Chromium-Captures initialisiert. **Zwei unverändert erhaltene instrumentationError-Flags**, beide erst nach browserClosing: P-Chain meldet einen ausstehenden runIfWaitingForDebugger-Timeout4994ms nach Closing und4963ms nach browserClosed; Sonic meldet7ms nach Closing eine nicht mehr vorhandene Session,1ms nach dem passenden Target.detachedFromTarget. Kein solches Flag vor Closing in den208Protokollen. Diese Ereignisfolge belegt die Abschlussgrenze; keine Aussage „0Instrumentierungsfehler insgesamt“ und kein nachträgliches Löschen/Umbenennen der Originalflags.

CDP beeinflusst Timing. Firefox/WebKit liefern Kontext-/Dokumentbeobachtungen, keinen vollständigen direkten Worker-CDP-Einblick. Die historischen Ursachen von HTTP503 bei wallet-visibility.js und der Kraken-SW-Installation bleiben **UNKNOWN**. Der erfolgreiche vollständige Lauf ist aktuelle Produktionsabnahme, kein bewiesener historischer Ursachenfix. Die Abschlussklassifikation kann beim nächsten tatsächlich nötigen Diagnostikpatch verbessert werden; kein zusätzlicher Lauf allein dafür.

## Dauerhafte Originale und tatsächlicher Restore

`FolioLab_v317_Main43734167356_Originalbelege_2026-11-15.tar`,365.086.720Bytes,SHA256 `471f9f2f26b0a6b02a1ba56078e906d4f9440377bfe2f944343f52b56b62bf30`. Exakter Version0-Pin `file_00000000033881f5bed4585a83691f26`, dauerhafte Identität `libfile_fde3_f-8da5b78b42cc8191a219fb27e84d8a42_54e45e8130348191808d9aaa710cf372`. Unabhängiger bytegleicher Readback mit anderer Dateiidentität;36Manifestdateien und8Original-ZIPs, daraus **4.237Originaldateien und154Pages-Dateien tatsächlich restauriert** und gegen vollständige Pfad-/Größen-/SHA256-Manifeste geprüft.427JSON-Berichte, kein expliziter top-level FAIL. Der Sicherungsabschluss ist externer Receipt ohne zirkulären Archiv-Selbsthash; tatsächlicher Portfolio-FreshRestore ist gesondert produktiv belegt.

Das gepinnte PR341-Originalpaket mit2.447Restaurierungen und alle älteren Ketten bleiben unverändert erhalten. Neue Nachweise ergänzen sie; keine privaten Finanzoriginale veröffentlicht.

## K3 getrennt abgeschlossen

Der begrenzte **Archivhinweis ist DONE**. Gesamt-K3 bleibt **PARTIAL**, weil A09 für tatsächliches Windows Chrome/Edge und Android Chrome/PWA geparkt/OPERATOR_INPUT_PENDING ist. Nach Abschluss dieses Releasegates wurde keine zusätzliche konkrete interne K3-Codelücke gefunden.18Auswahl-,9Großmengen- und3Betragsfälle behalten exakt ihren Geltungsbereich; keine universelle Finanzmutationserlaubnis.5.000Positionen reichen für1.0;10.000Buchungen/10.000Stichtage bleiben eigenständig gültig. A09/Grafikherkunft bleiben geparkt.
