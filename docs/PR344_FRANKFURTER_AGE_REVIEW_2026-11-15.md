# PR344 · Frankfurter-Altersprüfung · QUALIFIED

**Mergeentscheidung offen für exakt Head `fe2e6791762c96590e3cb781f6cff1c4ae99730b`.** [PR344](https://github.com/joke0071/foliolab-open/pull/344), Basis `8c53cbfd77be9a37cce31cc4df8396e9f2f06ede`, Tree `b775686abb60cd8d2e74af7ec601f3a8da8a5c2b`. Getesteter Ausführungsmerge `8875345ae9776c11b0383f7df083308ddc01be47`, Parents exakt Basis+Head, derselbe Tree. Aktueller Main unverändert PR343 LIVE_ACCEPTED/SWv318. Der Kandidat enthält SWv319; er ist weder gemergt noch veröffentlicht.

## Problem und resultierendes Verhalten

Der normale aktuelle Refresh übernahm einen datierten Frankfurter-Kurs vom 03.01.2000 und speicherte einen neuen Erfolgszeitpunkt. [Ursprüngliche Save-Doppel-Reproduktion auf dem Checkpoint-Branch](https://github.com/joke0071/foliolab-open/blob/ca2656c4c4cf8f3cee3f95b683f88348c0cf5f65/docs/release-evidence/v318-2026-11-15/next-fx-baseline-repro.json). Die zusätzliche native Altcode-Gegenprobe in den Originalen bestätigt denselben Fehler über UI-Klick, Web Lock, echten IDB-Commit und Wiederöffnung: Bestand und UNKNOWN werden zu0.1/2000-01-03, Erfolg wird gespeichert.

Der aktuelle datierte Leser weist Antworten außerhalb von sieben UTC-Publikationstagen vor Rückgabe an den Refresh ab. Grundlage: bestehende Sieben-Tage-Kursqualität und taggenaue Frankfurter-Historienregel. Das Fenster erlaubt Wochenende/Feiertage; Tageskurse haben keinen Intraday-Zeitstempel. Die abweichende Achtmal24h-Toleranz des Wertpapiertransports wird nicht pauschal übertragen.

Nur sieben Dateien: kleiner Guard, notwendiger SW-Cachewechsel, feste Testuhren, nativer Test im bestehenden obligatorischen Quellen-Einstieg und Taskkarte. Keine Workflowänderung. Genau zwei ausgelieferte Dateien ändern sich (market.js,sw.js); weitere152 sind bytegleich mit dem abgenommenen Main. Historischer Abruf, numerische Legacy-Kompatibilitätsmethode und bereits gespeicherte Altdaten werden nicht migriert.

## Normale Refresh-/Persistenznachweise

Feste Uhr2026-11-15T18:00:00Z, ausschließlich reproduzierbare synthetische Antworten. Je acht Fälle in Chromium/Firefox/WebKit, insgesamt24 tatsächliche native Fälle:

| Fall | Antwortdatum | Tatsächlich geprüftes Ergebnis |
| --- | --- | --- |
| Veraltet mit gültigem Bestand | 2000-01-03 |0.9/2026-11-12 und alle Positionsfelder erhalten; vollständiger IDBRecord einschließlich Revision/Snapshot unverändert |
| Veraltet ohne gültigen Bestand | 2000-01-03 |fxRate=null/fxRateExact=UNKNOWN; vollständiger Record unverändert |
| Acht-Tage-Grenze | 2026-11-07 |Abgewiesen; Bestand erhalten |
| Tageskurs | 2026-11-15 |0.85 mit tatsächlichem Publikationsdatum und Erfolg gespeichert |
| Sonntag mit Freitagkurs | 2026-11-13 |0.85 mit Freitagdatum gespeichert |
| Sieben-Tage-Grenze | 2026-11-08 |Noch akzeptiert, Datum unverändert |
| Veraltet mit Bestand und gültigem GBP-Update | 2000-01-03 /2026-11-13 |USD vollständig erhalten, GBP1.1 tatsächlich gespeichert |
| Veraltet mit UNKNOWN und gültigem GBP-Update | 2000-01-03 /2026-11-13 |UNKNOWN auch nach tatsächlichem Speichern und Wiederöffnung erhalten |

Bei isolierter Ablehnung zeigt die UI0Datenupdates/1Abfrage prüfen, keine volle Erfolgsmeldung; lastSuccessAt=null und kein abgeschlossener USD-FX-Marker. Bei Mischfällen wird nur der tatsächlich gespeicherte GBP-Teil bestätigt, kein vollständiger Erfolg. Alle Fälle vergleichen nach erneutem Laden den vollständigen nativen Record und Schedulerzustand; Journal und externe Flüsse bleiben unverändert. Keine Save-Doppel als nativer Nachweis. SW sind in diesem Finanztest blockiert; bestehende separate PWA-/Offline-/Updategates bleiben unverändert aktiv.

## Reguläre Pflichtchecks und Review

[INTEGRATION43765440994/1](https://github.com/joke0071/foliolab-open/actions/runs/43765440994) und [Wallet43765441005/1](https://github.com/joke0071/foliolab-open/actions/runs/43765441005) SUCCESS. Planfull=true/BaseIsAncestor=true;1.493Node-Tests je erforderlichem Lauf,0Fehler/Skips, Syntax bestanden. Chromium und alle drei Cross-Shards erfolgreich. FAST/Deployment/Live im PR korrektSKIPPED. Keine Retries/Abbrüche/Doppelstarts.

264JSON-Berichte:261 bestehende Berichte mit646 expliziten Prüfungen und acht separat geprüften Sonder-/Metadatenschemata; drei neue native FX-Berichte mit24 Fällen unabhängig gegen feste Sollwerte geprüft. Alle15CSV-Ziele weiterhin44px und alte Negativkontrollen korrekt. Ergänzend lokaler nativer Harness unter unveränderter Live-Diagnostik:8Kontexte sauber geschlossen,0Instrumentierungsfehler, SW bewusst blockiert. Statische TypeScript5.8.3-Vorprüfung nur Namen/Syntax;27andere Typdiagnosen ausdrücklich kein vollständiger Typecheck.

Zusätzlicher bestehender informativer Public-Wallet-Lauf43765441020 SUCCESS als Ausführung:11/14öffentliche Erreichbarkeitsproben gültig,4/4Integrationsaufrufe meldenok; Solana-Providerlücken und drei fehlgeschlagene/unerwartete Proben sind in den Originalen erhalten. Das ist keine private ETH-Cursor-/Ownership- oder Frankfurter-Abnahme. Gemäß bestehendem Harness kein Deploymentgate aus Drittanbietererreichbarkeit ableiten.

Eigener vollständiger Sieben-Dateien-Serverdiffreview ohne Befund. Keine eingereichten Reviews, offenen Threads oder Kommentare; keine unabhängige Fremdprüfung behauptet. Geschützter Branchstatus konnte wegen bestehendem Integration403 nicht separat ausgelesen werden; tatsächliche Checkruns/Workflows/Reviews/Refs sind frisch geprüft, kein Bypass oder Merge ausgeführt.

## Originale und physischer Restore

[FolioLab_PR344_Frankfurter_Originalbelege_2026-11-15.tar](https://chatgpt.com/library?file_id=libfile_fde3_f-e93153b4af748191895e1db5335eb2b7_54e45e8130348191808d9aaa710cf372&account_id=personal), Version0;215920640Bytes/SHA256 `fd279f0ca7bee47f7304dfe44a98d1083776231c996f512d58b6227494ea4e7b`. Exakter Pin `file_000000003c4c81f5a39724174351cb27`. Sechs OriginalZIPs nach ID/API-Größe/Digest/CRC, Originaljoblogs, Source-/Tree-/Testmanifest, native Altcodegegenprobe und scoped lokale Zusatzbelege.

Unabhängig gepinnt bytegleich zurückgelesen, unterschiedliche Dateidentität;64Manifestdateien und2368Originaldateien tatsächlich restauriert und einzeln byte-/hashgeprüft. Vollständiger Restoremanifest534126Bytes/SHA256 `da58ca630cbc489a3ed0938709d1fdef1ccd1a6942b829bb469c9ef95967745e`; aus gepinnten Originalen reproduzierbar. [Maschinenbeleg](release-evidence/pr344-frankfurter-qualified-2026-11-15.json). Keine zirkuläre Archiv-Selbsthashbehauptung.

## Grenzen und nächste Entscheidung

Synthetische feste Antworten/Uhr, native Headless-Engines; keine echte Frankfurter-Tagesantwort oder physische Windows-/Android-Abnahme. Unabhängige historische Salden/Ownership, echte private ETH-Cursorfolge und Geräte-Restore bleiben offen. [Restübersicht](FOLIOLAB_1_0_REMAINING_2026-11-15.md); konkrete private Anfrage separat als FolioLab_Restnachweise_2026-11-15.txt gespeichert, vorhandene Originale/Operatorfixtures weiterverwenden.

**Empfehlung: Merge ausschließlich des oben genannten exakten Heads freigeben, einschließlich regulärem Mainlauf/Deployment/vollständiger Live-Abnahme.** Unmittelbar vor einem genehmigten Merge Head/Basis/Tree/Checks/Reviews erneut prüfen; neuer Head benötigt neue Entscheidung. PR343-Freigabe wird nicht auf diesen Folge-PR übertragen. Keine pauschale1.0-Abnahme.
