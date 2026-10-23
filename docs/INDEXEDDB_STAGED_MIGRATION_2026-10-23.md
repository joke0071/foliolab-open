# Issue #44 — IndexedDB storage foundation (staged, NOT live storage)

Status: **transactional IndexedDB module implemented and browser-tested**, but NOT enabled as the source of truth in FolioLab Open. The production app still reads/writes its existing `localStorage` key `foliolab-open-v1` synchronously. Do not close #44 or claim its full acceptance criteria are met.

## Existing risk and architecture

`src/model.js` exposes synchronous `load()` and `persist()`. The app relies on synchronous saves in editor callbacks, CSV/backup imports, wallet scanning, settings updates, snapshot creation, bulk price updates, and delete-all. Replacing them with asynchronous IDB writes without refactoring these callers creates falsely successful save notifications, unsaved draft state, and possible lost writes.

The new `src/atomic-storage.js` is intentionally opt-in and never called at application startup. It provides:

- One IDB database `foliolab-open-portfolio`, version 1, object store `records`, key `portfolio`.
- Revisioned read and compare-and-swap writes inside **one readwrite transaction**. Same-origin concurrent writers serialize across contexts without relying on `storage` events or Web Locks availability.
- A revisioned deletion **tombstone**, preventing a stale tab from recreating a just-deleted portfolio by using expected revision 0/null.
- Validation and canonical v3 JSON snapshot building before writes; secret/API-key fields and private RPC URLs are excluded from the IDB copy.
- Explicit `stageLegacyPortfolio()` accepting v1/v2/v3 backups via `safeImport()`, preserving original legacy bytes in `localStorage` and reporting whether they changed during staging. **No automatic cutover** or legacy cleanup.

## Test evidence to collect

`tests/browser-atomic-storage.mjs` is added to the Chromium CI job. It covers separate same-origin pages racing from the same revision, exactly one commit, stale rejection, tombstone protection, invalid JSON, a simulated `QuotaExceededError` during `put()`, and key-free v1/v2/v3 staging with byte-identical legacy preservation. These are controlled browser tests, not evidence for process crashes or device storage eviction. The failed quota write uses fault injection, not a measured capacity limit.

## Remaining gate before a production cutover

1. Define the **single canonical store** on app startup and migrate every synchronous save/restore/reset path to await commit completion. Disable duplicate submits and prevent rendering misleading success before commit. Ensure incomplete writes cannot leak into later saves.
2. Introduce an explicit, consented migration UX with a user-downloadable original backup. Keep the previous `localStorage` source untouched until the new IDB data is loaded and verified; do not move user-entered keys. Handle simultaneous legacy writes during migration; abort adoption on divergence.
3. Recover from IDB `blocked`, unavailable/private mode, corrupt record, `versionchange`, transaction abort, quota errors, and shutdown mid-upgrade. Do not silently switch stores or revive deleted portfolios. Preserve rollback/recovery UX.
4. Expand reference tests for **v1/v2/v3** migration, backup restore, simultaneous imports, restart and last-tab-close, upgrade interrupts and transaction errors. Add Firefox/WebKit and constrained mobile browser tests.
5. Only after these pass and the fallback/rollback design is reviewed: activate IDB, revise the user-facing storage instructions, and close #44.

## Privacy and accounting

The database holds only sanitized portfolio data, strictly local to the device and origin. The legacy copy (which may contain locally configured API credentials) is left untouched by staging. Nothing is uploaded to GitHub, a server, or a third-party storage provider. No changes to financial transactions, tax classifications, or v1/v2/v3 backup meaning.

## Nachtrag zu v84

- Aus bestehenden IndexedDB-Records gelesene Portfolio-JSON wird vor Verwendung und vor jedem konkurrierenden Überschreiben fachlich validiert. Beschädigte Records werden weder still geleert noch durch eine vermeintlich erfolgreiche Bearbeitung ersetzt.
- Firefox- und WebKit-Browserregression: konkurrierende readwrite-Transaktionen, genau ein erfolgreicher Commit, Schließen sämtlicher Tabs und erneutes Öffnen sowie explizit beschädigte Records und verweigerte Folge-Schreibvorgänge.
- **Keine Produktivmigration:** Sync-`localStorage` bleibt die Quelle der produktiven App. Vollständige UI-Umstellung und die in dieser Datei genannten Release-Gates sind weiterhin offen (#44).

## v85: explizite Opt-in-Migration

Der bisherige Speicher bleibt der Standard für bestehende Installationen. Unter **Mehr → Deine Daten → Speicherarchitektur** kann nach bestätigtem Download-Backup der Wechsel zu IndexedDB aktiviert werden. Die lokale Originalkopie bleibt bis zu einer bewussten Rückmigration erhalten. Die neue Speichersteuerung nutzt revisionsgebundene IndexedDB-Transaktionen für jeden Portfolio-Speichervorgang. Userkonfigurierte Zugangsdaten werden nur nach Zustimmung lokal und unverschlüsselt in IndexedDB gehalten; Export-Backups enthalten keine API-Schlüssel. Historische Werte werden nicht neu berechnet.

Vor Wechsel und Rückwechsel müssen andere Tabs geschlossen werden. Bereits geöffnete veraltete FolioLab-Versionen könnten weiterhin die alte lokale Kopie verändern; dieser Risiko-Hinweis ist Teil der Zustimmung. Nach Speicher-Eviction bleibt ein Download-Backup erforderlich. Version v3 des Portfolioformats bleibt unverändert.

## v86: Restabsicherung (Regressionen, kein automatischer Wechsel)

Die Vorabprüfung vergleicht nun das **zuletzt tatsächlich gespeicherte** lokale Portfolio einschließlich erlaubter Einstellungen mit dem aktuell gehaltenen Model, **bevor** ein IndexedDB-Schreibvorgang möglich ist. Ein bereits beim Öffnen eines zweiten Tabs entstandener Konflikt darf nicht mehr durch die spätere Migration verdeckt werden. Der Vergleich während des Staging bleibt bestehen. Browser-Regressionen prüfen außerdem den Crash-ähnlichen Abbruch nach IDB-Commit, aber vor dem Markerwechsel, den sicheren erneuten Versuch mit identischem Portfolio, simulierten Quota-Abbruch und parallele Backup-Imports, von denen höchstens einer committen darf.

Ein synthetischer Browserfehler ersetzt keinen realen Geräte-/OS-Absturz, keinen manuellen Screenreader-Test und keine Prüfung physischer Storage-Eviction. Issue #44 bleibt bis zur gesonderten Abnahme dieser Faktoren offen.

## v87: Rückwechsel nach unterbrochenem Browser-Lebenszyklus

Ein ausdrücklich gestarteter Rückwechsel schreibt zuerst das vollständige lokale Portfolio, danach einen kompakten `foliolab-open-idb-revert-intent`-Marker mit vorgesehener Tombstone-Revision und Prüfsumme (ohne API-Schlüssel oder Portfolio-Inhalt), und löscht erst danach den kanonischen IndexedDB-Datensatz transaktional. Das Entfernen des aktiven Modusmarkers ist die abschließende Umstellung. Falls der Prozess genau dazwischen unterbrochen wird, akzeptiert der nächste Start **nur** die bestätigte lokale Kopie, deren Prüfsumme zur genauen tombstone-Revision passt; bei Abweichung stoppt die App geschlossen statt still Daten zu ersetzen. Ein regulärer „Alles löschen“-Vorgang beseitigt einen älteren Intent vor dem Commit, sodass gelöschte Daten nicht wieder auferstehen. Eine `persist`-Sperre verhindert, dass ein Tab mit aktuellem Legacy-Code nach erfolgter Migration weiter das stillgelegte `localStorage`-Portfolio verändert.

Hinweis: Die Prüfsumme sichert nur die unbeabsichtigte Veränderung lokal gespeicherter Daten ab, nicht gegen einen böswilligen Angreifer auf demselben Gerät. Ein automatisierter Browser-Abbruch ersetzt keine realen Geräteabstürze.
