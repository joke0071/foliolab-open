# PR343 · CSV-Messung am aktuellen DOM · QUALIFIED

Der Navigationstest maß gelegentlich eine durch den realen Details-Handler bereits ersetzte Schaltfläche. Die alte Referenz war disconnected und0px, der aktuelle Button44px. PR343 wählt und misst das aktuelle Ziel in demselben synchronen Browsercallback. Die Mindesthöhe bleibt44px. Echte43px, unsichtbare und fehlende Ziele werden weiterhin abgewiesen. Keine Wiederholungs-, Wartezeit- oder Toleranzerhöhung.

## Exakter Entscheidungsstand

- [PR343](https://github.com/joke0071/foliolab-open/pull/343), offen und mergeable; **Head `109813179bad4da7990688361dcbc2ed20a3ca0a`**.
- Basis `127019cf71304981c0c7f1a446f4dee8bc27404d`; Tree `359e369dd4de3095e27f21cd5de2b0fa5d359950`.
- Getesteter GitHub-Ausführungsmerge `84d2c4fe5aaf88d10d76fe82764683643b6ac644`, Parents exakt Basis+Head, Tree exakt identisch. Unmittelbar vor Qualifikation Refs/Head/Basis/Tree erneut geprüft.
- Genau zwei Dateien: Navigationstest und Taskkarte. Alle154 ausgelieferten Dateien bytegleich mit v318, keine Workflow-/Produkt-/SW-Änderung. Kein SW-Bump erforderlich.
- **Separate Mergeentscheidung erforderlich.** Die Freigabe für PR342 deckt diesen Folge-PR nicht ab. Kein Merge oder Deployment ausgeführt.

## Tatsächlich bestandene Prüfungen

[Reguläre CI43754583225/1](https://github.com/joke0071/foliolab-open/actions/runs/43754583225) und [Wallet-CI43754583215/1](https://github.com/joke0071/foliolab-open/actions/runs/43754583215) SUCCESS. INTEGRATION/full=true; Chromium und alle drei tatsächlichen Firefox-/WebKit-Shards erfolgreich. FAST, Deployment und Live im PR korrekt SKIPPED. Kein Retry.

1492 Node-Tests,0Fehler,0Skips; Syntax bestanden.261 JSON-Berichte gegen den bisherigen vollständigen Berichtspfadvertrag und646 explizite Assertions geprüft,0Befunde; acht nicht einheitliche/Metadatenberichte separat ausgewertet. Alle wiederholten datierten Storage-Fixture-Berichte einzeln gezählt, nicht durch normalisierte Dateinamen zusammengefasst.15 aktuelle Zielmessungen über drei Engines/fünf Breiten exakt44px, verbunden und sichtbar.

Alle drei Engines belegen die tatsächliche App-Detailerneuerung: vorher44px/verbunden, alte Referenz danach0px/abgelöst, Ersatz44px/verbunden. Dieselbe Messfunktion besteht44px als Positivkontrolle und lehnt43px,display:none,visibility:hidden sowie fehlendes Ziel ab. Die vollständigen nativen IDBRecord-Gleichheitsprüfungen bleiben aktiv und bestehen.

Lokal ebenfalls1492Tests und finale native Chromium-/Syntax-/Diffprüfung bestanden. Statische TypeScript5.8.3-Vorprüfung ist auf Namen/Syntax begrenzt;31andere Typdiagnosen wurden nicht als vollständiger Typecheck ausgegeben. Eigener vollständiger Zwei-Dateien-Review: keine Befunde; keine unabhängige Fremdprüfung behauptet. Keine eingereichten Reviews/offenen Threads.

## Originale und tatsächlicher Restore

[FolioLab_PR343_CSV_Messung_Originalbelege_2026-11-15.tar](https://chatgpt.com/library?file_id=libfile_fde3_f-b5b304aa895c81919d1a896f2b09bb20_54e45e8130348191808d9aaa710cf372&account_id=personal), Version0,212572160Bytes, SHA256 `593f5ccd2f2eba8135bafe577270b3bec65fa7746b0641fc04f0b46b24182509`.

Exakter Pin `file_00000000191081f581e34bd8d7c23165`. Unabhängig bytegleich zurückgelesen, verschiedene Inodes;39 Manifestdateien überprüft und sechs originale CI-ZIPs mit2362 Originaldateien physisch extrahiert und einzeln byte-/hashgeprüft. Vollständiger Restoremanifest494872Bytes/SHA256 `c0dd300ebe820c60bb5fe60fc58b6fda41a80c0e01ad324c1907fd7855f5118a`. [Maschinenbeleg](release-evidence/pr343-qualified-2026-11-15.json), [Restorequittung](release-evidence/pr343-2026-11-15/pinned-restore.json), [vollständiger Manifest](release-evidence/pr343-2026-11-15/full-restore-manifest.json.gz.b64).

## Grenzen und verbleibender Umfang

Headless Desktop-Engines und synthetische Portfolios; keine echte Android-/Windows-/Installations- oder TalkBack-Abnahme. Dieser Integrationlauf enthält keine Worker-JSONL-Diagnose und liefert deshalb keine neue Produktions-CDP-Closureaussage. Historische503-/SW-Ursachen bleibenUNKNOWN. v318 bleibt separat vollständigLIVE_ACCEPTED.

[Verbleibende1.0-Pflichten](FOLIOLAB_1_0_REMAINING_2026-11-15.md) aus kanonischer Roadmap, Checkpoint und erneut31offenenIssues unverändert; dieser Testpunkt ist bis Merge und anschließendem regulärem Release **QUALIFIED, nicht globalDONE**. K2-Frankfurter-Kursaltersrest ist konkret reproduziert und bleibt nächster interner Pflichtschnitt. A09/Gerätebelege weiterhin Pflicht, Grafikherkunft ohne bestätigten Pflichtblocker; geparkte Punkte nicht pauschal geschlossen.
