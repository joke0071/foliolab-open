# v317 · DEPLOYED / LIVE_BLOCKED · 15.11.2026

**Entscheidung: konkreter Blocker.** v317 ist regulär veröffentlicht, aber der vollständige Produktionsnachweis fehlt. Letzter vollständig akzeptierter Release bleibt v316; es wurde kein Rollback ausgeführt.

## Freigabe und tatsächlicher Merge

Jochen hat den bislang nicht reproduzierten 44-px-Befund ausdrücklich als offenen Diagnosepunkt akzeptiert und PR #340 ausschließlich am Head `f03cc26182d40fa3f10fd88a133c725be925cef0` freigegeben. Frischer Owner-/Main-/Head-/Pflichtcheckabgleich entsprach der Grundlage. Merge mit expected_head_sha-Bindung ausgeführt.

- [PR #340](https://github.com/joke0071/foliolab-open/pull/340), tatsächlicher Merge/Main `a53856e385ef1d9fd65d8710618244e80b8341e7`.
- Eltern: geprüfte Basis `82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69` und freigegebener PR-Head.
- Tatsächlicher Tree `b70a02558a89158f80420b2c895bbcb2c18ab7c7` ist exakt der freigegebene Tree.
- [Regulärer Main-Lauf 43713836553](https://github.com/joke0071/foliolab-open/actions/runs/43713836553): Plan, Chromium, alle drei Cross-Engine-Jobs und Deployment erfolgreich. 1.481 Unit-Tests, keine Fehler oder Skips. Alle 154 Pages-Dateien unabhängig gegen die Gitblobs des freigegebenen Trees geprüft.
- Sechs Main-Originalarchive: 261 JSON-Berichte, 2.095 PNGs, 644 explizite Feldprüfungen, keine Findings. Acht Berichte ohne generisches Ergebnisfeld separat als IDB-Metadaten, Provider-Boolesche Nachweise und Touch-/Long-Press-Strukturen eingeordnet; kein automatischer PASS aus unbekannten Schemata.
- Alle 15 Main-Höhenmessungen sind exakt 44 px. Kein erneuter 44-px-Fehler. Anforderung >=44 und Messdiagnostik bleiben aktiv; die alte Ursache bleibt UNKNOWN.

## Tatsächliche Live-Fehler und begrenzte Diagnose

| Beleg | Tatsächlicher Befund | Aussagegrenze |
| --- | --- | --- |
| Versuch 1, Job 132819643122, Artefakt 14162991942 | Am 15.11. um 13:00:24 UTC lieferte wallet-visibility.js beim 8-fach parallelen Bytecheck HTTP 503 statt 200. 151 Hashes waren bestätigt. | Original enthält keine Header oder Antwortbytes dieser 503-Antwort. Exakte Server-/Edgeursache UNKNOWN. |
| Gerichtete HTTP-Diagnose 43717059117 | Identischer Ubuntu-/Node-/Chromium-Kontext, normale TLS-Prüfung, 155 Assets und drei Kontrollen: HTTP 200, exakte Hashes, keine Request-Retries; normaler Modulimport und IDB-Start erfolgreich. | Belegt veränderte aktuelle Verfügbarkeit, erklärt den alten 503 nicht rückwirkend. Danach wurde genau ein regulärer Live-Versuch begründet gestartet. |
| Versuch 2, Job 132821674164, Artefakt 14161949855 | Core-Produktion PASS: alle 155 Quellhashes stimmen, normale TLS-Prüfung, sechs Kernchecks und 18 Axe-Scans. Später scheitert browser-kraken-import.mjs:132 in controlledStorageFixture:46 am unveränderten 20-s-Prädikat. SW anfangs installing, danach kein installing/waiting/active/controller. | Installation wurde nicht aktiv; keine bloß langsame Installation behauptet. Originaltrace enthält keine Worker-Netzwerkantworten. Exakter Installationsgrund UNKNOWN. Nachfolgende Produktionsprüfungen fehlen. |
| Frische Installationsdiagnose 43718173048 | Acht Installationen erfüllen das unveränderte Prädikat. | BrowserContext-Beobachter erfassten keine Worker-Requests; diese Diagnose erklärt die Fehlerursache nicht. |
| Diagnose 43718612109 | CDP-Harness scheitert vor dem eigentlichen Test: Browser-Autoattach erfordert flatten-Protokoll. | Reiner Diagnoseaufbaufehler, Original erhalten; gezielt korrigiert. Kein weiterer Produktionsfehlversuch daraus abgeleitet. |
| Vollständige Kraken-Gegenprobe 43718697865 | Unverändertes Testskript mit sieben Szenarien PASS. Direkter Worker-CDP-Mitschnitt: 1.233 Requests, 1.109 Antworten sämtlich HTTP 200, keine Instrumentierungsfehler. | Beobachtung verändert Timing. Kein ursprünglicher Installationsfehler reproduziert, kein kausaler Fix. targetCrashed-Ereignisse bei erfolgreich beendeten Kontexten im Original erhalten und nicht als ursprüngliche Ursache ausgegeben. |

Der zweite reguläre Versuch verwendet unveränderten Main, identische Produktbytes, Assertions, Fristen und TLS-Prüfung; die bereits erfolgreichen Main-/Deploymentjobs wurden anhand ihrer ursprünglichen Zeitstempel wiederverwendet, nicht erneut ausgeführt. Kein weiteres Deployment und kein dritter unveränderter regulärer Versuch. Keine Fehlversuche als grüne Gesamtabnahme zusammengezogen.

Die Diagnoserefs ändern ausschließlich Test-/Workflowdateien, niemals Produktcode oder Main. Korrigierter Kraken-Diagnosehead `5c81298deeff9f5a2a6f93fdd399f5a99a2fdbeb`; direkter Produktvorfahr Main a538. Alte Diagnosequelle und Protokollfehler bleiben im Paket erhalten.

## Belege und Wiederherstellung

[Maschinenentscheidung](release-evidence/v317-live-blocked-2026-11-15/decision.json), [Paketidentität](release-evidence/v317-live-blocked-2026-11-15/package-identity.json), [gepinntes Rücklesen und tatsächlicher Restore](release-evidence/v317-live-blocked-2026-11-15/readback-restore.json). Vollständige neue Originalkette separat gesichert: 13 ursprüngliche ZIPs einschließlich beider Live-Fehler, aller Main-Jobs, Pages-Payload und sämtlicher Diagnosen. Alte PR-/K3-Ketten unverändert weiterverwendet.

Der erste Paketindex enthielt irrtümlich einen veralteten Selbsteintrag; beim unabhängigen Rücklesen erkannt. Alle Originalarchive waren bytegleich. Korrigierte Paketversion ersetzt nur den Index; ausschließlich deren gepinntes Rücklesen/Restore wird als gültiger Sicherungsnachweis verwendet. Erste Version nicht als qualifiziert ausgegeben.

## K3 und nächste Entscheidung

Gesamt-K3 **PARTIAL**. Der verständliche Hinweis zur bestehenden 5.000-Buchungen-Archivsperre ist gemergt und in Main mit 23 Prüfungen je Engine belegt. Der Teilpunkt wird gemäß Auftrag erst nach vollständiger Produktionsabnahme geschlossen und bleibt deshalb offen. Die bereits belegten 18 Auswahlfälle, neun Großmengenfälle und drei exakten Betragsänderungen auf v316 samt gepinnten 25-/13-Dateien-Restores bleiben gültig.

Nächste konkrete Entscheidung vor einem weiteren Releaseversuch: dauerhafte Worker-Netzwerk-/Installationsdiagnostik im regulären Live-Fehlerpfad als eigenen, prüfbaren Teständerungs-Head integrieren oder eine neue belegte Auslieferungs-/Installationsursache bearbeiten. Ein neuer Main-Head braucht eine eigene Merge-Entscheidung; keine pauschale Wiederholungsserie und keine Fristlockerung. Ohne neuen kausalen Befund kann dieser Release nicht als LIVE_ACCEPTED gelten.

Nach erfolgreicher Produktionsabnahme bleibt die historische 10.000-Positionsforderung gegenüber der unterstützten 5.000-Positions-Formatgrenze eine eigene Scope-Entscheidung. A09 und Grafikherkunft bleiben geparkt. Keine neue Geräte-/Quellenanfrage aus diesem Abschluss.

Qualifizierte Paketversion 1: 230522880 Bytes, SHA256 `96516a7a8ff526bfc63c07c7762fecc6627a9da22a6758c6ee1b4b78dddcf609`. Unabhängig exakt versiongepinnt bytegleich zurückgelesen, alle 70 Manifestdateien geprüft, alle 13 Original-ZIPs samt verschachteltem Trace und Pages-Tar tatsächlich restauriert: 2.721 Dateien. Vollmanifest SHA256 `d65aea29b52a9714d219c909962a9691f6d745b2c44abe088abff0b758c7ead5`; gzip/base64-Fassung im Belegverzeichnis. Dies ist Sicherungsintegrität, keine Produktionsfreigabe.
