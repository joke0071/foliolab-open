# FLH04: Quellenverbindung unter Konkurrenz · 13.11.2026

PREPARED / NATIVE_NOT_RUN / PRODUCT_RELEASE_BLOCKED.
Alleiniger Writer: work-781cbfc52ec6-20261113. Kein Zusatzagent, keine Automation.
Arbeitsbasis: 097aff8a06838a02df14927dc2b7a80ec627eea8,
Tree 38e04ddb8c6a04a6c4ec15b9456296e8c719d318, ausschließlich auf
feature/flh04-revisions-20261113-b5ddfe1c. Quellen-/Kontrollcommit und
Readback stehen nach Freeze im zentralen Checkpoint; keine Ausführung erfolgt.

## Umfang und unveränderte Nachweise

Nur §11 und A01/A05/A11/A12/A15–A19 des vorhandenen Lifecyclevertrags.
Keine Vertragsänderung und keine neue W1-/K1-Gesamtanalyse.
Der native C1-Beleg Run43490101461/1 bleibt SUCCESS in seinem dokumentierten
Umfang; Run43485655271/1 bleibt FAILURE, genaue alte Fehlerassertion UNKNOWN.
Beide Triggerbranches/Originalartefakte bleiben unverändert. Keine Wiederholung.

Der komplette C1-Helper bleibt Blob d87ab642d1ba409814af517c2b28ad50fd924b0c.
Alle 38 ursprünglichen Ausdrücke bleiben einschließlich await/Reihenfolge erhalten.
Entfernen der neuen Lifecycle-Opt-in-Blöcke ergibt exakt den bisherigen
Basisharness Blob f5d6bcab636ff8b9cf5d4b62514dcb98acb2475c, inklusive C1-Opt-in.
Die bestehende Recoveryfunktion ist bytegleich (SHA256
309dab4d9921e66f9860a79018cd16ededfe1ba5573eae5be6e887a2ba295836).
Die gemeinsame Diagnostik erhält einen optionalen erlaubten Quelldateipfad;
das bisherige C1-Defaultverhalten und seine sechs Tests bleiben erhalten.

## Konkreter Produktgegenablauf und gezielte Korrektur

Vorher: Controller besitzt Handle H mit idle-onversionchange=>close.
Eine neue Operation hält zusätzlich Quellenhandle G. Nach dem ersten nativen
Read-Complete wartet ihre bestehende Promisefortsetzung. Seite B fordert v2 an:
H schließt, G hält das Upgrade auf. Bei Fortsetzung verwendet revertLocked
weiter this.db=H; der Tombstonecommit versucht eine Transaktion auf dem bereits
geschlossenen Handle. Die erlaubte endliche v1-Operation kann nicht fortsetzen.
Betroffen: §11.1/11.2 und A12/A15/A17/A18. Kein nativer Repro behauptet.

Jetzt: Ein vorhandenes aktives IDB-Controllerhandle wird vor der Fachoperation
durch das geprüfte gehaltene v1-Quellenhandle ersetzt; das alte Handle schließt.
Revision/CAS bleiben erhalten. Cleanup/finally und v2-Ablehnung bleiben bestehen.
Keine neue Callback-/Key-/Unlock-API, kein zweiter Lock oder IDB-Keepalive.
Der lokale Gegenfall scheitert mit originalem Adapter an closed=true und
besteht mit der Korrektur. Das ist ein expliziter IDB-/Modell-/Atomic-Testdouble,
kein nativer Fehlernachweis. Das neue src-Delta ist eigener Reviewimpact;
es wird nicht als durch das alte Kryptoreviewpaket abgedeckt ausgegeben.

## Native Proben und explizite Instrumentierung

Bestehender tests/browser-sync-outbox.mjs, unabhängiges Opt-in
FLH04_SOURCE_LIFECYCLE=1. C1-Opt-in darf dabei nicht gesetzt sein.
Ein Basisharnessaufruf, danach 13 neue begrenzte Gruppen in frischen Contexts
mit je zwei Seiten. Keine neue Suite/Runnerplattform, kein Produktimport von Tests.

tests/flh04-source-lifecycle-harness.mjs verändert keine Produktdatei oder
Importbindung. Es beobachtet echte open/versionchange/complete/abort-Ereignisse
und verzögert genau einen readonly-oncomplete-CALLBACK nach dem bereits
eingetretenen nativen complete-EVENT. Die Produktpromise bleibt an ihrem echten
await offen. Es bleibt keine Transaktion künstlich aktiv. Das ist eine offen
instrumentierte Ereigniszustellung, kein Beweis für unverändertes Scheduling
oder beliebige Unterbrechung jedes synchronen Produktabschnitts.

Seite B ruft tatsächlich indexedDB.open(DB,2) auf. Vor Freigabe verlangt OVERLAP:
erste Operation unsettled, genau ein Quellenopen, Quellen-versionchange beobachtet,
zweiter Request begonnen und nativ blocked, kein upgradeneeded/Ergebnis.
Erst dann gibt der Harness den ersten Callback frei. RELEASE verlangt
versionchange nach Barriereneintritt, Freigabe danach, Close nach Freigabe und
Operationsabschluss nach Close, keine Markeraktion nach letztem Quellenclose.
Nach Erfolg/Fehler muss das wartende Upgrade erfolgreich auf2 abschließen.
Die bei upgradeneeded beobachteten Marker müssen dem fertigen Markerzustand
entsprechen. Kein Timer ist Korrektheitsoracle; vorhandene 30s-Waits und die
360s-Prozessgrenze dienen allein dem Abbruch. Kein Fristoverride.

Alle echten Produktoperationen benutzen native IDB, unveränderte Finanzmodelle,
CAS und Ankerfunktion. Nur Schema-only1→2 ist Testfixture, kein Produktcutover.
Storageaktionen werden ohne Werte protokolliert. Reguläres close ist ein
Close-Aufruf, kein forced-close. READ-ERROR und CLOSE-EVENT sind ausdrücklich
synthetische Ereignis-/Callbackinjektionen; MARKER-FAIL ist ein synthetischer
QuotaExceededError, keine reale Quota. PROBE-BLOCKED injiziert blocked am echten
Open vor dessen nativer später Successzustellung; PROBE-ERROR injiziert einen
synchronen SecurityError. Beide sind keine native Reproduktion dieser Fehler.

## Fallzuordnung und exakte Assertions

Gemeinsamer Prüfstand: echtes synthetisches v1-Portfolio mit Settings, Revision,
syncEnrollmentRequired und unverändertem prepared-locked-Anker; Outbox ist hier
ausdrücklich null. PERSISTED vergleicht vollständige Portfolio-/Outboxobjekte,
außer dem bei erlaubten Writes variablen, separat plausibilisierten updatedAt.
Raw/Settings werden exakt verglichen. ANCHOR vergleicht den bestehenden privaten
Keykohärenzproof; weder Material noch Proof werden ausgegeben. REOPEN liest über
eine neue Verbindung aus Seite A; PERSISTED liest unabhängig aus Seite B.

| Fall / Bereich | Produktpfad; Vertragsbezug | Erzwungene Folge und Ergebnis | Genaue Assertion; Grenze |
| --- | --- | --- | --- |
| L1-REVERT / A | revert→revertLocked; A12/A15/A17 | readonly complete halten→Upgrade blocked→Freigabe→Tombstone/Markercleanup→Upgrade | OVERLAP/RELEASE; RESULT fulfilled; Revision+1/raw=null/settings=null/deleted=true, restliche Felder/Outbox erhalten; Legacy exakt Modell, Modus/Intent gelöscht; ANCHOR/REOPEN/V2-BLOCK. Nur instrumentierte Readgrenze. |
| L2-MARKER-FAIL / A | direkter revertLocked; A15/A16 | gleiche Überlappung, Modus-remove nach committed Tombstone wirft | RESULT rejected; Tombstone bleibt tatsächlich committed; Modus und exakter passender Intent bleiben erhalten; Upgrade läuft weiter, Anker/Reopen erhalten. Keine reale Quota/Crashbehauptung. |
| L3-INITIALIZE / B | initialize→read→retireCredentials; A12/A17/A18 | gehaltenes Quellenhandle→Upgrade blocked→Initialisierung beendet | OVERLAP verlangt sourceCount=1; RESULT fulfilled, kompletter Stand/Marker/Anker gleich; Upgrade/Reopen erfolgreich. Kein zweiter Open/Deadlock im geprüften Pfad. |
| L4-READ-ERROR / B | initialize read-Abbruchfortsetzung; A17/A18 | echte Readcompletion halten→Upgrade blocked→synthetische Fehlerzustellung | RESULT rejected; kein readwrite/Markerwrite nach Fehler; vollständiger Stand gleich, Close und Upgrade erfolgreich. Kein nativer Abort dieses Reads. |
| L5-CLOSE-EVENT / B | initialize/source.check; A17 | gleiche Überlappung→reguläres close plus synthetisches close-Event | RESULT rejected, keine Retirement-/Markerwrites, vollständiger Stand/Anker gleich; Upgrade/Reopen erfolgreich. Echter forced-close bleibt OFFEN. |
| L6-INTENT / C | initialize automatischer passender Tombstoneintent; A15/A16 | vorhandener Tombstone+exakter Legacyfingerprint→Readbarriere→Upgrade blocked→zulässiger Nachlauf | RESULT fulfilled; Portfolio/Settings/Revision/Outbox bleiben gleich; Legacyoriginal bytegleich, Modus+Intent entfernt; Upgrade/Anker/Reopen. Kein alter fremder Worker. |
| L7-MIGRATE / C | direkter migrateLocked; A12/A15/A18 | zulässige identische v1-Quelle→Readbarriere→Upgrade blocked→Adoption+Marker→Upgrade | RESULT fulfilled, Revision+1, raw/settings/Outbox/Anker erhalten, Legacyoriginal unverändert, Modus idb-v1. Ein echter zulässiger v1-Direkteinstieg. |
| L8-V2-LOCKED / C | migrateLocked/removeAllLocked/revertLocked/initialize; A05/A15 | natives Testupgrade fertig→alle vier tatsächlichen Einstiege | REJECT alle vier; UNCHANGED kompletter Portfolio-/Outbox-/Legacy-/Intent-/Modusendstand; ANCHOR/REOPEN. Keine globale zwischenzeitliche ABA-Aussage. |
| L9-V1-REMOVE / C | direkter removeAllLocked→unverifiedBackup→recoverFromBackup; A12/A16/A19 | zulässiges v1-Löschen→echter Originalzugriff→explizite Recovery | RESULT/PERSISTED voller Tombstone; ORIGINAL exakt; RECOVERY raw/settings exakt, Revision+1, Outbox/Anker erhalten. Separater Positivfall, keine Überlappungsbehauptung. |
| L10-V2-INTENT / C | initialize automatischer passender Intent; A05/A15 | echter Tombstone/passender Intent→v2-Testupgrade→initialize | REJECT; UNCHANGED vollständiger Portfolio-/Outbox-/Legacy-/Markerstand; ANCHOR/REOPEN. V1-Erlaubnis ist keine v2-Rückwechselautorität. |
| L11-PROBE-ERROR / B | inspectPortfolioSource→initialize | SecurityError injiziert→Ablehnung→Upgrade | REJECT; NO-WRITES vergleicht Legacyendstände; UPGRADE fulfilled; PRESERVED vollständiger Portfoliostand aus frischer Verbindung. Fehlerursache injiziert. |
| L11-PROBE-BLOCKED / B | inspectPortfolioSource→blocked→late success | blocked injiziert→Ablehnung→native late success muss close→Upgrade | gleiche vier Assertions; offenes Leak würde Upgrade verhindern. Kein nativer source-open-blocked-Beleg. |
| L12-V2-RECOVERY / B | initialize-Ablehnung→unverifiedBackup→recoverFromBackup; A16/A19/§11.3 | v2 beobachtet→Normalstart blockiert→echter Originalzugriff→bestehende explizite Recovery | REJECT/ORIGINAL exakt; RECOVERY raw/settings/Revision/Enrollment/Outbox exakt, ANCHOR/REOPEN erhalten. Kein synthetisches Handleattachment; trotzdem keine Full-P-/Keyslot-/Recoverygesamtfreigabe. |

13 Gruppen / 81 geplante Assertionzeilen, KEINE gemessenen nativen PASS.
PASS verlangt alle geplanten Zeilen; jeder Fehler bleibt FAIL/AggregateError.
Nicht erreichte Zeilen bleiben NOT_REACHED. Dateipfad, Zeile, stabile Fallkennung,
native Ereignisnamen, synthetische Kennungen und begrenzte Soll-/Istwerte werden
ausgegeben. Keine raw-Werte, Settingsinhalte, Credentials, Keys oder Stacks.

## Tatsächlich erlaubte lokale Prüfung

Node24.22.1: sieben Syntaxchecks Exit0; 30 gezielte Node-Tests PASS,
0FAIL/0SKIP/0CANCELLED. Davon 16 Adapterkontrollflusstests mit ausdrücklich
ersetzten IDB-/Modell-/Atomicabhängigkeiten, sechs bestehende Diagnostiktests
und acht Harness-/Oracle-/Integritätsregressionen mit Node-Promises/EventTargets.
Kein Browser, keine native IDB-Ausführung, keine Finanzmodell-/Kryptoabnahme.
Negativkontrolle mit originalem Adapter: genau neuer Handlefall FAIL/Exit1
(geschlossenes Handle true statt erwartet false). Danach finale Tests grün.
Zwischenprüfungen nicht zu historischen Zahlen addieren.

## Genau ein vorgeschlagener Ausführungsweg

Ein separater Kontrollcommit ändert ausschließlich den vorhandenen
.github/workflows/live-initialization-diagnostics.yml. Er ersetzt dessen
verbrauchte C1-Jobdefinition durch den exakt begrenzten Lifecyclejob; beide
anderen Jobs bleiben strukturell unverändert. Alte Triggerbranches bleiben
auf ihren eigenen alten Workflow-/Commitbytes unverändert erhalten.

Exakter neuer Trigger (noch NICHT angelegt):
test/flh04-source-lifecycle-781cbfc52ec6-20261113 am gepinnten Kontrollcommit.
Nur create/branch/exakterRef/run_attempt==1. Keine Wiederanlage, kein Retry,
kein alternativer Trigger bei fehlendem Run; zuerst ausschließlich lesen.
Ein Job, ein Harnessaufruf inklusive unveränderter Basis, nur Chromium,
Ubuntu24.04/Node22.23.4/PW1.56.1/zugehörige ChromiumHeadlessShell
(erwartete bisherige Version141.0.7390.37, tatsächliche Version protokollieren).
25Minuten Jobgrenze, 360Sekunden Harness plus15Sekunden Killnachlauf.
ENGINE=chromium, FLH04_SOURCE_LIFECYCLE=1, C1-Opt-in ungesetzt,
BASE_URL=http://127.0.0.1:4173. Nur synthetische Contexts, kein Produktionsorigin.

Kontrollparent/Quelltree/Codeblobs vor dem einzigen Aufruf verifizieren;
keine Teständerung im Job. Artefakt uploadifalways/retention7Tage:
Source-/Workflow-/Treebeleg, Eingangsdateien, Node/PW/Engine soweit erreicht,
Installations-/HTTP-/Testlogs, Exitcodes, Originalreport mit Ereignisfolgen/
Assertiondiagnostik, summary und vollständiges SHA256-Manifest.
Kein gültiger Report bedeutet NOT_REACHED_OR_NO_VALID_REPORT, niemals PASS.
Nach einer separat freigegebenen Ausführung OriginalZIP samt Manifest über
bestehenden Weg dauerhaft sichern und exakt prüfen; kein Rootvollbackup.
Vor Ausführung sind keine Ergebnisartefakte oder Sicherungen davon vorhanden.

## Offene Grenzen und unveränderte Gates

Native forced-close, Prozesscrash und reale Quota bleiben ausdrücklich offen.
Native Quellenprobe-blocked/error bleiben offen; ihre Injektionen sind separat.
Outboxkonkurrenz hier nur bei null, keine neue Full-P-/Keyslot-/ABA-/Worker-/
Asset-/Altwriter-/Recovery-/Produktstartupabnahme. Kein v2-Cutoverprodukt.
FLH04 NOT DONE / Outbox INTERN UNQUALIFIZIERT /
N-DRIVE BLOCKED_EXTERNAL mit internem UND externem Rest.
A1false/A2gesperrt/remoteAnchor+acknowledgedLocalRevisionnull.
Format1-prepared-locked weder adoptieren/hochstufen/überschreiben/löschen.
P/R/S/D/CAS/Raw-/Retry/oncomplete-/Snapshot-/Originalverträge erhalten.
USD-/ETH-/CSV-/Management-/UH02-/History-/Purchase-/Undo-/Oracleketten unverändert.
Kryptopaket fd3fce4bb3038e525c78e9a5bdc9bc81f4dab15b,
Reviewkandidat17a5a190d472f1f07b3508e6f35194371fe95eb2:
EXTERNAL_REVIEW_PENDING, CR4/CR5offen; keine Selbstfreigabe/Kryptocodeänderung.
Kein Retry/FullCI/Merge/Deploy/Release/SW-Bump/LIVE_ACCEPTED.

Am tatsächlichen Sitzungsende nach vollständigem gepinntem Readback:
STOPPED / HANDOVER_READY ausschließlich wegen fertigem Vorbereitungspaket und
fehlender konkreter nativer Ausführungsfreigabe. Kein Hintergrundbetrieb.
