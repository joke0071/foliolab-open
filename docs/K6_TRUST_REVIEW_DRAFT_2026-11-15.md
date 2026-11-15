# Reviewvorlage · K6-TRUST Drive-Restorehinweis

**Status: REVIEW_PREPARED / TARGETED_QA_PASS. Kein PR erstellt, kein Merge/Deployment freigegeben.**

Titel: `fix(copy): keine unbelegte Passwortübernahme nach Drive-Restore zusagen`

Head: `2a773073f2887e8701ee893eee2e8619ab980be8`, Branch `fix/k6-trust-backup-copy-2026-11-15`.
Base: `ff60c73e53c973ecb86393be5b4e31b55f352601` (v315).

## Problem und Wirkung

Ist auf dem Ziel bereits ein Backup-Passwort eingerichtet, behält FolioLab diesen Vault beim Import einer fremden Sicherung. Tritt nach bestätigtem Portfolioimport ein Fehler in der Abschlussanzeige auf, meldet v315 trotzdem „Portfolio und Backup-Passwort übernommen“. Künftig bestätigt die Meldung ausschließlich „Portfolio wiederhergestellt“. Der erneute Vollimport wird weiterhin ausdrücklich abgeraten. Keine Änderung an Passwort-/Storage-/Restorelogik.

Ein Laufzeittext in src/drive-backup.js; gezielte vorhandene Node-Regression und neuer separat ausführbarer UI-Fall. Kein Produktworkflow geändert. [Vollständige Auswertung](K6_TRUST_COPY_REVIEW_2026-11-15.md).

## Validierung

[QA43685258218/1](https://github.com/joke0071/foliolab-open/actions/runs/43685258218):57/57gezielte Node-Tests; native UI reproduziert v315 und bestätigt Kandidat. Echter UI-Export/-Restore, Crypto/IDB, genau ein Commit, vorhandener Vault unverändert, neues Backup verlangt weiterhin Zielpasswort, Record/Vault nach Reload identisch. Definierter Abschlussanzeigefehler; OAuth/HTTP synthetisch, SW blockiert, LinuxChromium141. Keine Geräte-/OAuth-/Releaseabnahme.

## Review-/Integrationsgrenze

[Exakter Diff](https://github.com/joke0071/foliolab-open/compare/ff60c73e53c973ecb86393be5b4e31b55f352601...2a773073f2887e8701ee893eee2e8619ab980be8) ist unverändert eingefroren und rückgelesen. Vor tatsächlicher Integration nach gesonderter Freigabe Main-Deltas prüfen, reguläre PWA-Cachefortschreibung vornehmen und erforderliche unveränderte PR-/Wallet-/Main-/Release-/Live-/Sicherungs-/Readback-/Restoregates erfüllen. Kein neues allgemeines CI aus dieser Reviewvorbereitung; gezielter QA-Workflow ausschließlich auf separater QA-Ref und nicht Teil des Produktdiffs. K6-TRUST bleibt VERIFY, A09 OPERATOR_INPUT_PENDING.
