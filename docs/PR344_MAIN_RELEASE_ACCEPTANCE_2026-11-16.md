# PR344 / SW v319 · LIVE_ACCEPTED · 16.11.2026

PR344 ist ausschließlich am ausdrücklich freigegebenen Head `fe2e6791762c96590e3cb781f6cff1c4ae99730b` headgebunden gemergt. Tatsächlicher Main `7bb7b5a1f6124d933343590973310815df1d1653`, Tree `b775686abb60cd8d2e74af7ec601f3a8da8a5c2b`; Parents exakt qualifizierte Basis `8c53cbfd77be9a37cce31cc4df8396e9f2f06ede` plus freigegebener Head. Unmittelbar vorher Head, Basis, Tree, Pflichtchecks, Reviews und offene Reviewthreads frisch geprüft. Keine neue Produktänderung nach Freeze.

[Regulärer Main-/Release-Lauf 43814956980](https://github.com/joke0071/foliolab-open/actions/runs/43814956980): Main, alle drei Cross-Shards und Deployment in Versuch1 erfolgreich. Nach gesichertem und eingegrenztem HTTP429-Erstfehler genau ein gezielter Livejob-Retry. **Livejob133135769207 / Versuch2 vollständig SUCCESS** in Chromium, Firefox und WebKit. Gültige Main-/Cross-/Deploygates wurden weiterverwendet. [Maschinenbeleg](release-evidence/pr344-main-live-accepted-2026-11-16.json).

## Fachliche und technische Nachweise

| Bereich | Tatsächlich geprüft |
| --- | --- |
| Main | 1.493 Tests, 0 Fehler/Skips/Abbrüche; Syntax und alle regulären Browsergates erfolgreich |
| Bestehende Mainberichte | 261 JSON, 646 explizite Sollprüfungen und 8 gesonderte Ergebnisschemata |
| Neuer FX-Schnitt im Main | 3 JSON, 24 native normale Refresh-/Web-Lock-/IndexedDB-/Reopenfälle; 8 je Engine |
| Bestehende Liveberichte | 196 JSON, 254 explizite Sollprüfungen und 26 gesonderte Ergebnisschemata |
| Neuer FX-Schnitt live | Weitere Ausführung derselben 24 Fälle mit tatsächlichen ausgelieferten Produktbytes; feste synthetische Kursantworten/Uhr |
| Auslieferung | 154 Pages-Dateien gegen qualifizierten Tree; 155 Live-Assethashvergleiche einschließlich SWv319; 142 tatsächlich geladene Assets geprüft; keine TLS-Proxy-Ausnahme im regulären Live-Gate |
| Kern-/Restore-/Offlinewege | 6 Live-Coregruppen, 18 Axe-Scans, echte UI-Exporte und verschlüsselter FreshRestore, Wiederöffnung und Offline-/IndexedDB-Wege; bestehende Finanz-/Herkunfts-/UNKNOWN-Verträge erhalten |
| CSV-Messung | 15 Main-Ziele bei unverändert 44px; echte Detailerneuerung und 43px-/hidden-/missing-Gegenfälle in drei Engines |
| Worker-Diagnostik | 211 Originaldateien: Chromium71, Firefox70, WebKit70; alle Browser geschlossen; 71 direkte Chromium-Captures bereit; 0 Flags vor browserClosing |
| Eigene Sichtprüfung | Tatsächliche erfolgreiche Core-Bilder320/390/1440 aus Versuch1 vor späterem Recoveryfehler und Bitpanda-Dialog390 aus Versuch2; keine neue begrenzte Layoutauffälligkeit. Keine unabhängige Fremdprüfung behauptet. |

FX: Antworten älter als sieben UTC-Tage werden vor einer Positions-/Erfolgsänderung abgewiesen. Vorhandener Kurs samt Datum und UNKNOWN bleiben erhalten, auch wenn im selben Refresh ein anderer gültiger GBP-Kurs tatsächlich gespeichert wird. Vollständiger nativer Record und Scheduler stimmen nach Wiederöffnung; Journal/Flüsse bleiben unverändert. Tages-, Wochenend- und Sieben-Tage-Grenzfälle bleiben gültig. Historischer/numerischer Legacyleser und gespeicherte Altdaten werden nicht migriert.

## Erstfehler und genau ein begründeter Retry

[Unveränderte Originaldiagnose](PR344_LIVE_HTTP429_DIAGNOSIS_2026-11-16.md): Der erste Livejob133132830196 scheiterte beim Recovery-Reload nach65 Modulantworten HTTP429/Varnish innerhalb59ms; Retry-After0, Dokument200, SW anschließend aktiviert. Keine vollständige Live-Abnahme dieses Fehlversuchs. Präzise Limiterkonfiguration und auslösende Anfragequelle bleiben UNKNOWN.

Originale wurden zuerst gesichert und analysiert. Drei aktuelle Einzelabrufe lieferten wieder200; das unveränderte Recovery-/Plain-Skript bestand lokal den ursprünglichen Reload, verschlüsselten Download, FreshRestore und unveränderte IDB-/Revisionswerte. Diese Diagnosegegenprobe nutzte einen anderen Proxy-/Edgeweg mit expliziter TLS-Ausnahme und ersetzt kein reguläres Gate. Darauf genau ein gezielter Livejob-Retry, keine Frist-/Assertionlockerung oder Produktänderung. Der vollständige reguläre Chromium-Schritt einschließlich Recovery und anschließend Firefox/WebKit bestanden.

Ein Sonic-`Runtime.runIfWaitingForDebugger timeout` trat4988ms nach browserClosing und4955ms nach browserClosed auf. Originalflag und zeitliche Zuordnung erhalten; kein Flag vor browserClosing. Historische503-/SW-Ursachen werden daraus nicht nachträglich erklärt.

## Dauerhafte Originale und tatsächlicher Restore

| Paket | Pin und unabhängige Verifikation |
| --- | --- |
| [Versuch1: Main/Deployment und erster Livefehler](https://chatgpt.com/library?file_id=libfile_fde3_f-06b86ae5222c8191bd4c8ec2edd41e38_54e45e8130348191808d9aaa710cf372&account_id=personal) | Version0;230328320Bytes; SHA256 `fc142d7c46117c048a4c5f8c5369cadd32f759fdaf01c9c6c2f372ea09ecde1f`; Pin `file_0000000043dc8212a6eb83580cd369b0`;62Manifestdateien,8ZIPs; bytegleich zurückgelesen,2479Originaldateien+154Pages-Dateien tatsächlich restauriert |
| [Versuch2: vollständige neue Live-Originale](https://chatgpt.com/library?file_id=libfile_fde3_f-f2f9a53248388191a95ba7ccd65869bb_54e45e8130348191808d9aaa710cf372&account_id=personal) | Version0;153538560Bytes; SHA256 `58cec67841a49e3f239e1b5f0d669f2a870d09f3ec1cc532d95f383e385c3777`; Pin `file_0000000057e081f5af3160e847bd6c3c`;44Manifestdateien,1neuesZIP; bytegleich zurückgelesen,1883Originaldateien tatsächlich restauriert |

Alle ZIP-Größen/API-Digests/CRCs und erwarteten Berichtsstrukturen geprüft. [Separate Restorequittungen samt vollständigen komprimierten Dateimanifesten](https://chatgpt.com/library?file_id=libfile_fde3_f-e0c647c216208191ba86894279420246_54e45e8130348191808d9aaa710cf372&account_id=personal), Version0,306795Bytes, SHA256 `590dffb23cb7b673a0514a858ec64907f12607343e5f9df66b2b735981877598`. Keine zirkulären Archiv-Selbsthashes. PR344-Qualifikation und PR343-Live-Abnahme bleiben separat unverändert gültig.

Der tatsächliche Livejob in Versuch2 dauerte2989s; aktive Umsetzungs-/Auswertungszeit und Workverbrauch UNKNOWN. Eine gezielte Live-Wiederholung nach Primärdiagnose, keine Main-/Cross-/Deploymentwiederholung und keine Produktkorrektur nach Freeze.

## Verbleibende 1.0-Pflichten und nächste Aktion

[Restübersicht](FOLIOLAB_1_0_REMAINING_2026-11-15.md) mit kanonischer Matrix abgeglichen: Dieser Frankfurter-Teilschnitt ist DONE; K2 insgesamt bleibt PARTIAL. Kein weiterer konkret belegter interner Pflichtcoderest gefunden. Unabhängige historische Bestände/Ownership und echte ETH-Originalcursorfolge fehlen weiterhin; D-ETH260 ist bereits DONE.

Nächster konkreter Einstieg: Jochen benennt **ein isoliertes Testprofil** auf Windows Chrome, Windows Edge oder Android Chrome/PWA. Darin online öffnen; Soll: leeres Testportfolio und bedienbare Navigation, SWv319 soweit sichtbar, andernfalls UNKNOWN. Bestehendes10k-Operatorpaket mit Soll1000EUR anschließend unverändert verwenden. Ein Plattformfall kann einzeln beginnen; Gerätewechsel benötigt später zwei Endpunkte. Private Anfrage unter gleicher Identität auf Version1 fortgeschrieben; private Stichtage/Identitäten bleiben außerhalb GitHub.

Keine physische Windows-/Android-, echte Frankfurter-/OAuth-, historische Finanz- oder globale1.0-Abnahme. Safari/TalkBack bleiben DEFERRED_USER; bestehende EFF03-/Finanz-/UNKNOWN-/IDB-/CAS-/Backup-/Restore-/Offline-/PWA-Verträge erhalten.
