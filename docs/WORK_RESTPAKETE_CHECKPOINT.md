# HND01 · ACTIVE · PR #341 RELEASE_AUTHORIZED

Writer: `v317-release-ab4d8e6f6672`, alleiniger HND01-Writer. Jochen autorisierte am 15.11.2026 die geordnete Übernahme von `v317-hash-contract-e14f2dfb9b8b` sowie Merge ausschließlich PR #341 Head `61b56ac50a2e87796db0aad0027675ae3fd5c142`, entstehenden Main-Head, reguläres Deployment und vollständige Live-Abnahme. Einstieg/expectedSHA: `3dac897b1de6ec40a7225dc4538f691d0b9c2f6e`; letzte Checkpointaktivität 16:03:54Z. Refs, vier offene PRs, Reviews/Kommentare und letzte Actions abgeglichen: keine laufenden Jobs und keine konkurrierende Schreibaktivität beobachtet. Spätere PRs bleiben separat freigabepflichtig.

## Entscheidung und Produktstand

**Merge empfohlen ausschließlich für Head `61b56ac50a2e87796db0aad0027675ae3fd5c142` von PR #341.**

- Branch: `fix/v317-live-worker-diagnostics`; Tree: `2644817dfb558da9668ec0a55bd7e6092cd80324`.
- PR offen und mergeable; keine Reviews, Kommentare oder offenen Review-Threads.
- GitHubs Ausführungsmerge `80ebfeb1119ed2ba2bc2779a2888dadce1c16cd6` hat exakt denselben Tree.
- Main und deployed bleiben `a53856e385ef1d9fd65d8710618244e80b8341e7`.
- v317 DEPLOYED / LIVE_BLOCKED; letzter vollständig akzeptierter Release v316.
- Merge, neuer Main-Head und Deployment ausdrücklich freigegeben; noch nicht ausgeführt.

[Abschlussbericht](PR341_HASH_CONTRACT_REVIEW_2026-11-15.md) · [Maschinenentscheidung](release-evidence/pr341-hash-contract-2026-11-15/decision.json)

## Hashfehler und gezielte Korrektur

Die historischen Läufe 43721020747 und 43721020733 scheiterten ausschließlich am selben Quelltextvertrag. Nach dessen bisheriger Normalisierung blieben genau zwei beabsichtigte Diagnoseänderungen: `assetResponses:[],` (+18 Bytes) und die Abrufbeobachtung (38 → 339 Bytes; +301 Bytes). Zusammen +319 Bytes; keine bestehende Assertion oder Frist geändert.

[Exakte alte/neue Bytes, Offsets und Hashes](release-evidence/pr341-hash-contract-2026-11-15/normalized-difference.json). Der korrigierte Vertragstest fordert diese Änderungen jeweils exakt einmal und rechnet sie zurück. Der historische Referenzhash `f5fa53b9d3272b2ea0f16f38e9730b25288d906383d115864e7732c92965a7c3` bleibt unverändert. Vier Negativmutationen werden erkannt, darunter HTTP 200 → 503 und ein manipulierter Assethashvergleich.

Vor Push: 22 gerichtete Tests bestanden, 0 Fehler/Skips; Syntax und Diffprüfung bestanden. Gegenüber dem bisherigen PR-Head wurde nur `tests/live-startup-diagnostics.test.mjs` geändert. Kein unveränderter CI-Retry.

## Finale Qualifikation und Originalsicherung

- Regulärer PR-Lauf **43730257666 SUCCESS**: Plan, UI-Vertragscanary, Chromium und alle drei Cross-Engine-Shards. 1.483 Unit-Tests, 0 Fehler/Skips.
- Wallet-Lauf **43730257671 SUCCESS**: 1.483 Tests, 0 Fehler/Skips.
- Deployment und Live-Abnahme im PR erwartungsgemäß SKIPPED; daraus folgt keine Produktionsabnahme.
- QA **43720723312** unverändert übernommen: Erfolg, kontrollierter 503 mit erhaltenem Trace und unverändertem 20-Sekunden-Abbruch sowie sieben Kraken-Fälle bestanden; 0 Instrumentierungsfehler. Relevante Diagnose-, Live-, Fixture- und Kraken-Dateien sind bytegleich.
- Originalpaket: `FolioLab_PR341_Originalbelege_2026-11-15.tar`, **219.985.920 Bytes**, SHA256 `e0a60ec6227a62998ff32659c15b86aa4c99c47017a1c9100cb777884781e18e`.
- Exakter Versionspin: `file_00000000009881f5abe2749e77723438`, Version 0. Dauerhafte Identität: `libfile_fde3_f-71ae80e82ed08191bed1ebf118239d5c_54e45e8130348191808d9aaa710cf372`.
- Gepinnt bytegleich rückgelesen; 33 Manifestdateien geprüft; acht Original-ZIPs einschließlich verschachteltem Trace tatsächlich zu **2.447 Dateien restauriert**. Vollständiges Inhaltsmanifest bestätigt. [Readback-/Restorebericht](release-evidence/pr341-hash-contract-2026-11-15/readback-restore.json).
- 258 JSON-Berichte. Die einzige explizite FAIL-Datei gehört zum absichtlich ausgelösten 503-Fixturefall aus der bestandenen Diagnose-QA. Kein CI-Bericht weist ein explizites FAIL aus. Ältere Originalketten bleiben erhalten.

## Aussagegrenze und nächste Aktion

Die historischen Ursachen des HTTP 503 bei `wallet-visibility.js` und der fehlgeschlagenen SW-Installation im Kraken-Fixture bleiben **UNKNOWN**. Kein Ursachenfix belegt. Chromium-CDP beeinflusst das Timing; Firefox/WebKit liefern Kontext- und Dokumentbeobachtung ohne vollständigen direkten Worker-CDP-Nachweis.

**Nächste Aktion:** Unmittelbar vor Merge Head, Basis, Merge-Tree, Pflichtchecks und Reviews frisch bestätigen; Merge an freigegebenen Head binden. Tatsächlichen Main-SHA und regulären Main-/Deployment-/Live-Lauf verfolgen. Erst vollständiger Produktionsnachweis erlaubt LIVE_ACCEPTED. Bei Fehlern zuerst Originale sichern und gezielt unterscheiden; historische Ursachen bleiben UNKNOWN. Anschließend K3-Archivhinweis abschließen, verbleibenden K3-Rest separat abgleichen und kleinsten autorisierten Roadmapschnitt bis zum qualifizierten PR bearbeiten. 5.000 Positionen für 1.0 sind entschieden; Nachweise für 10.000 Buchungen und 10.000 Stichtage gelten weiter. K3-Großmengen, 44-px-Diagnose, A09 und Grafikherkunft lagen außerhalb dieses PR-Auftrags. Der Abschluss des K3-Archivhinweises bleibt an die vollständige Produktionsabnahme gebunden.

Vollständige Vorgängerstände mit unveränderten Originalketten und Schutzverträgen: [gepinntes Vorgängercheckpoint](https://github.com/joke0071/foliolab-open/blob/06723631b2ed6035e3531f61743acfbf27f2b4b8/docs/WORK_RESTPAKETE_CHECKPOINT.md). Historischer Einstieg: `678d9fa304bde2864d03d47c8db78e56169201da`; lokaler Repro-/Negativbelegpin: `24e0f2ff9856de48ac20279eedcc93ac6ec0f09e`.
