# FLH04 – begrenzter C1-Korrekturkandidat · 13.11.2026

Status: PREPARED / NATIVE_NOT_RUN / PRODUCT_NOT_RELEASED.
Alleiniger Writer work-366da675bef5-20261113. Grundlage ist
f73535847f26476da3ea100f0410f391496dafd7, Tree511c047a067f1c04690378232d698cd204f495c0;
native Ausgangsmessung auf b18c6fcb09b22616355355df5efb483503141e69,
Tree2527bebb55b3209a59c90c66627192a751ce1fa1.
Kein neuer Quellgesamtcheck, keine Browser-/Actionsausführung.

## 1. Beobachtung und begrenzte Fehlerzuordnung

Original Run43485655271/Versuch1 FAILURE, Job132093270291, Testexit1.
Vier Gruppen PASS; C1-MARKERS und C1-NO-REVERT FAIL/AssertionError.
OriginalZIP57855Bytes, SHA256
8b830f6b2a1786032e148b12e6a6608d5050cd7f1a924f1687d2dd2a2a0fb3ec,
alle16Manifestdateien erneut exakt geprüft. ZIP unverändert erhalten.
[Erste Auswertung](release-evidence/flh04-c1-native-43485655271-attempt1.json).

Der alte Catch verwarf Assertionnachricht, genaue Stelle und Soll/Ist.
Daher sind die folgenden Stellen MÖGLICHE erste Fehler; keine davon wird
nachträglich als beobachtete Fehlerstelle ausgegeben. Auch Fehler während
Operand-/Einrichtungsoperationen bleiben bei fehlender Lokalisierung offen.

| Gruppe / neue stabile Kennung | Alte Quellzeile auf b18c6fcb | Assertion und betroffener Pfad |
| --- | --- | --- |
| beide: UPGRADE.01 | 60 | Testeigener Schemawechsel meldet committed/version2; kein Produktcutover. |
| beide: UPGRADE.02 | 61 | Alter geschlossener Handle behält version1. |
| MARKERS.A.01 | 150 | Gespeicherter Portfolio-/Outboxstand unverändert nach initialize. |
| MARKERS.A.02 | 151 | Vorhandener anchor-proof unverändert; keine neue Kryptofunktion. |
| MARKERS.A.03 | 152 | initialize darf keine Legacyquelle wählen. |
| NO-REVERT.A.01 | 170 | Gespeicherter Record darf vor Ablehnung nicht verändert werden. |
| NO-REVERT.A.02 | 171 | Legacykopie/Intent/Marker dürfen nicht verändert werden. |
| NO-REVERT.A.03 | 172 | Interner revert muss ablehnen. |

Die vollständige Kennung enthält C1- vor dem Gruppennamen, etwa
C1-MARKERS.A.03 oder C1-NO-REVERT.UPGRADE.01.

QUELLABLEITUNG: Browseradapterblobc383901ffe000b82f3a97c1f08460748dbe228eb
initialize38–43 wählt bei fehlendem MODE_KEY vorhandene Legacybytes ohne
vorherige native Quellenprüfung; revertLocked223ff schreibt Legacyziel,
Intent und Tombstone ohne v2-Schranke. Bei ansonsten normalem Ablauf passen
diese Pfade zu MARKERS.A.03 bzw. NO-REVERT.A.01.
Das ist eine gerichtete Ableitung, keine nachgelieferte Laufzeitbeobachtung.
Automatischer Intentabschluss im alten initialize ist zusätzlich betroffen.

## 2. Diagnostik ohne sensible Inhalte

Alle38 ursprünglichen Assertion-Ausdrücke inklusive await-Präfixen und
Reihenfolge exakt erhalten;34 Aufrufstellen innerhalb der sechs Gruppen
synchron markiert, ohne neue await-Lücken einzubauen. Zwei gemeinsame
Upgradeassertions werden von fünf Gruppen benutzt; deren Pläne enthalten
jeweils eigene Gruppenkennungen. Vier Originassertions bleiben unverändert.
Original tests/browser-sync-outbox.mjs vollständig bytegleich.

Jede erreichte Assertion erhält Kennung, Dateianker und tatsächliche
Assertionzeile. Ein Fehler enthält nur einen erlaubten Fehlertyp,
kleine synthetische Zahlen/Booleans/erlaubte Statuswörter oder Typangaben;
bei Objekten nur erlaubte Namen abweichender Felder. Keine Fehlernachricht,
Originalstack, Keys, Credentials, vollständigen Portfolioinhalte,
Fingerprints oder Preimagedigests. Fehlende Details werden nicht erfunden.
Fehler zwischen Assertions erhalten GROUP.OPERATION; Operandfehler sind
als assertion-or-operand gekennzeichnet, nicht als bewiesener Vergleichsfehler.

Spätere Planzeilen bleiben ausdrücklich NOT_REACHED. PASS setzt voraus,
dass sämtliche geplanten Assertions der Gruppe abgeschlossen sind.
Alle sechs Gruppen laufen weiter seriell in eigenen Contexts; jeder FAIL
führt unverändert zum abschließenden AggregateError und Exit ungleich0.
Reportversion2 erweitert nur das Diagnoseformat, keinen Snapshotvertrag.

## 3. Produktdelta und genaue Grenze

Nur src/browser-portfolio-storage.js wird unter src geändert.
Private native Quellenprobe öffnet dieselbe DB OHNE angeforderte Version.
Jedes upgradeneeded wird abgebrochen; nur oldVersion0 plus tatsächliches
AbortError wird als fehlende DB behandelt. Fehler, blocked, unbekannte
native Version oder fehlender records-Store blockieren sicher.
Verspäteter Erfolg nach blocked schließt den Handle, ohne Fachoperation.

Vor Legacyquelle/Normaloperation oder internem Rückwechsel liegt ein gemeinsamer
privater Pfad: vorhandener lokaler Lock, dann native Quellenverbindung.
Native Version2 und unbekannte Versionen werden für diese ungeprüften
Normalpfade blockiert; kein v2-Startup, Enrollment oder produktiver Cutover
wird eingeführt. Ein fehlender/falscher alter Marker ermächtigt nicht zur
Legacyübernahme. MODE_KEY bleibt unverändert das historische v1-Format;
keine neue beschreibbare v2-Autoritätsmarke wird eingeführt.

Erfasst: initialize, initializeNew, reload, assertCurrent, save,
migrate/migrateLocked, removeAll/removeAllLocked und revert/revertLocked.
Auch direkte Locked-Einstiege erwerben dieselbe Reihenfolge.
Keine freie neue Callback-/Unlock-/Key-API; private Callbacks werden ausschließlich
durch geschlossene Adapteroperationen erzeugt. Bestehende withLocalLock-API
ist damit NICHT als gelöste K1-/Writergrenze qualifiziert.

Ein beobachteter v1-Handle bleibt über den endlichen privaten Vorgang offen,
einschließlich await-/Fehlercleanup und Markerwrites. Ein regulärer nativer
Versionswechsel muss bis zu seinem Abschluss warten. Keine IDB-Transaktion
wird offengehalten; kein Crypto-/Netzwerkawait, Keepalive, Lease oder Steal.
Initialisierung verwendet den schon geöffneten v1-Handle, damit kein zweiter
Open hinter einem wartenden Upgrade mit dem gehaltenen Handle zyklisch wartet.
Lock kommt vor Quellenprobe; kein gegenläufiges Warten auf denselben Lock.
Bei beobachtetem versionchange wird im finally geschlossen; ein bereits
gefeuertes Ereignis wird nicht durch nachträgliches Handlerwechseln verloren.
Erzwungener Verbindungsverlust blockiert weitere geprüfte Schreibabschnitte.

V1-Operationen und ihr ursprünglicher Fach-CAS/Raw-/Intentinhalt bleiben bestehen.
Die wirklich leere Neuinstallation benutzt weiterhin den bestehenden expliziten
v1-Neuanlagepfad. Eine fehlende aktive IDB-Linie wird nicht dabei neu erzeugt.
Ein ursprünglicher Legacybestand ohne IDB-/Cutoverbezug bleibt der bestehende
separate Legacy-v1-Fall; daraus folgt kein Nachweis gegen vollständigen
externen DB-/Markerverlust. Historische Herkunft nach Verlust aller Merkmale,
abweichende Worker/Assets und fremde Opener bleiben W1/W3/W4-/Recoverypflichten.
Die Quellenprobe ist ausdrücklich kein rückwirkender Voll-P-/ABA-Beweis.

Originaldownload liest die tatsächliche v1/v2-Linie über frische Verbindung,
ohne fehlende DB zu erzeugen. Nach erfolgreichem Read bleibt der bestehende
explizite Recoveryzugang erhalten; bei wartendem versionchange wird die
Verbindung geschlossen, ohne daraus einen Restore auszulösen.
recoverFromBackup ist im gesamten Funktionskörper BYTEGLEICH erhalten.
Seine bisherigen CAS-/Modus-/Backupbindungen werden weder gelockert noch als
vollständige private Full-P-/Keyslotbindung ausgegeben. Insbesondere bleibt
ein Restore bei fehlendem Modusmarker UND vorhandener Legacykopie blockiert.
Download alleine ist kein Recoveryabschluss. Normales Restore portiert
keine Writer-/Geräte-/Autoritätsidentität; bestehende prepared-locked-Keys
werden durch diese Korrektur nicht angerührt.

Primärgrundlage, am13.11. erneut gezielt gelesen:
https://www.w3.org/TR/2026/WD-IndexedDB-3-20261030/ §4.3/5.1/5.2.
Die Standardableitung ersetzt den ausstehenden nativen Konkurrenznachweis nicht.

## 4. Tatsächliche Prüfung und Vorbereitungsbefunde

Node24.22.1: sechs geänderte/neue JS/mjs-Dateien node --check, Exit0.
node --test tests/flh04-c1-source-guard.test.mjs tests/flh04-c1-diagnostics.test.mjs:
21 Tests,21PASS,0FAIL,0Skips. Keine historischen Zahlen addiert.

15 Adaptertests evaluieren den tatsächlichen Adapterkörper mit drei ausdrücklich
ersetzten Abhängigkeitsimports; IDB-Ereignisse, Modell und Atomicfunktionen sind
Testdoubles. Sechs Diagnostiktests benutzen echte Nodeassertions und prüfen
Kennungen, NOT_REACHED, Datenminimierung und strengen Abschluss.
Dies sind gezielte Kontrollfluss-/Diagnostikregressionen, KEINE native IDB-,
Finanzmodell-, Kryptografie-, Worker-, Geräte- oder Produktvollabnahme.
Unveränderte vollständige Modellabhängigkeiten wurden nicht erneut inventarisiert.

Vor Freeze gefunden/korrigiert: mechanisch ergänzte Schreibchecks benötigten
Blockklammern; Instrumentierung musste das ursprüngliche await bei rejects
erhalten; Quellenhandle-/Open- und Lockreihenfolge gegen Deadlock nachgebessert.
Eine lokale Zwischenprüfung hatte18/19PASS: der neue Recovery-Test verlangte
fälschlich Restore trotz fehlendem Marker bei vorhandener Legacykopie.
Seine Voraussetzung auf vorhandenen zulässigen Modus korrigiert; Produktschranke
nicht gelockert. Finale21/21PASS nach allen Änderungen.
Keine dieser Vorbereitungsfassungen wurde nativ ausgeführt oder veröffentlicht.

[Maschinenbeleg und finaler Testlog](release-evidence/flh04-c1-correction-local-2026-11-13.json).
C1_NATIVE_NOT_RUN bleibt für diesen Kandidaten verbindlich.

## 5. Vorgeschlagene einmalige native Fortsetzung

Separater Kontrollcommit ändert nur den bestehenden Diagnoseworkflow,
bindet seinen exakten Parent/Tree als Source und prüft sämtliche hier betroffenen
Code-/Testblobs vor dem einzigen Harnessaufruf. Konkreter Commit/Branchname
und Approval stehen im zentralen Checkpoint nach vollständigem Readback.

Ein Job, Versuch1, ubuntu-24.04/Node22.23.4/PW1.56.1/Chromium,
max25Minuten; ein unveränderter Basisharnessaufruf samt sechs C1-Gruppen,
max360Sekunden plus15Sekunden Killnachlauf.
ENGINE=chromium, FLH04_VERSION2_CANDIDATE=1,
BASE_URL=http://127.0.0.1:4173. Nur synthetische isolierte Contexts.
Echter FAIL bleibt FAILURE; NOT_REACHED wird explizit ausgewiesen.
Quell-/Workflow-/Laufbeleg, Eingangsdateien, Installations-/HTTP-/Testlogs,
Originalreport, Soll/Ist-Diagnostik, Exitcodes und SHA256-Manifest werden
auch bei Fehler hochgeladen, Retention7Tage. Keine automatische Wiederholung.

Kein neuer Branch, Browser, Actionslauf oder Retry durch diese Vorbereitung.
Freigabe nur für den fertigen gepinnten Ausführungskandidaten anfordern.
Der alte Branch und Run43485655271/Versuch1 bleiben unverändert/verbrauchterVersuch.

## 6. Offene Gates

FLH04 NOT DONE; Outbox INTERN UNQUALIFIZIERT;
N-DRIVE BLOCKED_EXTERNAL mit internem UND externem Rest.
A1applyAuthorized=false, A2Storage.confirm gesperrt;
remoteAnchor/acknowledgedLocalRevision=null.
Format1-prepared-locked niemals adoptieren/hochstufen/überschreiben/löschen.
Snapshot1/3500000UTF8/100000Werte/Tiefe16 unverändert.
Kein vollständiger Schlüssel-/Writer-/ABAmechanismus, keine Migration oder aktiveSync,
keine realeQuota/Prozesscrash-/Produktionsfreigabe.
Kryptopaketfd3fce4bb3038e525c78e9a5bdc9bc81f4dab15b/
Kandidat17a5a190d472f1f07b3508e6f35194371fe95eb2 bleibt unverändert
EXTERNAL_REVIEW_PENDING; CR4/CR5offen. Neues Adapterdelta ist zusätzlicher
Impactgegenstand, kein pauschal in dieses Paket eingeschlossenes Review.
Alle USD-/ETH-/CSV-/Management-/UH02-/History-/Purchase-/Undo-/Oracle-/
Originalketten erhalten. Zentralbranch niemals vollständig nach Main mergen.
