# PR341 · Merge empfohlen · 15.11.2026

Entscheidung ausschließlich zu Head `61b56ac50a2e87796db0aad0027675ae3fd5c142`, Tree `2644817dfb558da9668ec0a55bd7e6092cd80324`. Main bleibt `a53856e385ef1d9fd65d8710618244e80b8341e7`; v317 DEPLOYED / LIVE_BLOCKED, letzter vollständig akzeptierter Release v316.

## Ursache und kleinste Korrektur

Beide historischen CI-Läufe 43721020747 und 43721020733 hatten genau denselben einzelnen Fehler: Der Quelltextvertrag entfernte ältere zugelassene Ergänzungen, aber nicht die zwei beabsichtigten Asset-Diagnosedeltas aus PR341. Vorher isoliert reproduziert: 5 PASS / 1 FAIL. Kein geschütztes Assertion-, Frist- oder Verhaltensprüfungsbyte war im PR geändert.

| Änderung nach bisheriger Normalisierung | Byteoffset im normalisierten PR (ab 0) | Mainbytes | PRbytes |
| --- | ---: | ---: | ---: |
| Einfügung `assetResponses:[],` | 1990 | 0 | 18 |
| Assetabruf: `const r=await c.request.get(url.href);` wird durch den exakten Beobachtungsblock mit URL, Zeit, Status, Headern, begrenztem Fehlerbody und Netzwerkfehler ersetzt | 4408 | 38 | 339 |

Die vollständigen alten/neuen Bytes stehen in [normalized-difference.json](release-evidence/pr341-hash-contract-2026-11-15/normalized-difference.json). Main normalisiert: 13.897 Bytes / SHA256 `f5fa53b9d3272b2ea0f16f38e9730b25288d906383d115864e7732c92965a7c3`; ursprünglicher PR normalisiert: 14.216 Bytes / `816aaf74c3f13a1d8881b4846f61772ac7917a696c3317cfff6d31e92cea4b4b`. Exakte Rücknahme allein dieser zwei Deltas ergibt bytegleich Main.

Korrektur gegenüber bisherigem PR-Head1787fe4 ausschließlich in `tests/live-startup-diagnostics.test.mjs`: zwei exakt einmal erforderliche Ersetzungen im Vertragstest; historischer Referenzhash unverändert. Keine Produkt-, Workflow-, Beobachtungs- oder Fachteständerung durch die Korrektur. Fehlende/duplizierte Diagnosebytes werden verworfen. Negative Assertionproben HTTP200→503 und erwarteter Assethash→Selbstvergleich scheitern ausdrücklich am historischen Hash: [negative-probes.json](release-evidence/pr341-hash-contract-2026-11-15/negative-probes.json).

## Qualifikation des finalen Heads

Vor Push: korrigierter Test plus unmittelbar betroffene Workflow-/Plan-Verträge 22 PASS / 0 FAIL / 0 SKIP; Syntax und Diffprüfung PASS. Lokaler Node24.22.1; optionaler statischer Namensprüfer mangels TypeScript5.8.3 BLOCKED, kein Ersatz-/Freigabenachweis. Runtime-/CI-Pflichtprüfungen vollständig bestanden.

- [Regulärer PR-Lauf43730257666](https://github.com/joke0071/foliolab-open/actions/runs/43730257666): SUCCESS, Plan, UI-Vertragscanary, Chromium und alle drei Firefox-/WebKit-Shards SUCCESS; 1.483 Units / 0 Fehler / 0 Skips.
- [Wallet43730257671](https://github.com/joke0071/foliolab-open/actions/runs/43730257671): SUCCESS, 1.483 Tests / 0 Fehler / 0 Skips.
- Ausführungsmerge `80ebfeb1119ed2ba2bc2779a2888dadce1c16cd6` hat exakt denselben Tree wie der freizugebende PR-Head. Deploy/Live im PR erwartungsgemäß SKIPPED; keine Main-/Produktionsabnahme daraus.
- Bestehende QA43720723312 übernommen: relevante Diagnose-/Live-/Fixture-/Kraken-Dateien bytegleich zum finalen Kandidaten. Erfolgreiche Installation, kontrollierter503 samt unverändertem20s-Abbruch/Trace und sieben Krakenfälle PASS; 0 Instrumentierungsfehler. Keine erneute isolierte QA nötig.
- Originale vollständig gesichert: 219.985.920 Bytes, SHA256 `e0a60ec6227a62998ff32659c15b86aa4c99c47017a1c9100cb777884781e18e`; exakt dateiversionsgepinnt bytegleich rückgelesen, 33 Manifestdateien geprüft, 8 ZIPs zu 2.447 Dateien tatsächlich restauriert. 258 JSON-Berichte; einzige explizite FAIL-Datei ist der absichtlich ausgelöste QA503-Fixturefehler, dessen Diagnostikprüfung PASS ist. Kein CI-Bericht mit explizitem FAIL. [Readback/Restore](release-evidence/pr341-hash-contract-2026-11-15/readback-restore.json).

## Aussagegrenze und nächste Freigabe

Die beiden historischen Produktionsursachen bleiben UNKNOWN: HTTP503 bei wallet-visibility.js sowie nicht aktive SW-Installation im Kraken-Fixture. Erfolgreiche Gegenproben und synthetischer503 erklären sie nicht. Chromium-CDP pausiert neue Worker bis Network.enable und beeinflusst Timing; Firefox/WebKit liefern Kontext-/Dokumentbeobachtung ohne vollständigen direkten Worker-CDP-Nachweis.

Einzige benötigte Freigabe: Merge genau dieses PR-Heads einschließlich des daraus entstehenden Main-Heads, regulären Deployments und eines vollständigen Produktionsabnahmelaufs mit der geprüften Diagnostik. Erst dessen vollständiger Erfolg erlaubt LIVE_ACCEPTED. Keine Merge-/Main-/Deploymentaktion ausgeführt oder vorab als freigegeben behandelt.

5.000 Positionen für1.0 bleiben entschieden; 10.000 Buchungen und10.000 Stichtage behalten ihre Nachweise. K3-Großmengen,44px,A09,Grafikherkunft waren kein Gegenstand dieses Schnitts. Unveränderte Vorgänger-/Originalketten: [Checkpoint vor Abschluss](https://github.com/joke0071/foliolab-open/blob/06723631b2ed6035e3531f61743acfbf27f2b4b8/docs/WORK_RESTPAKETE_CHECKPOINT.md).
