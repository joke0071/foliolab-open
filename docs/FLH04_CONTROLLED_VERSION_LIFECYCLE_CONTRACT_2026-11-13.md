# FLH04 — kontrollierter Versions-/Lebenszyklusübergang A · Vertragsentwurf

13.11.2026 · work-366da675bef5-20261113 · alleiniger Writer.
**DRAFT / DIRECTION_AUTHORIZED / NOT_IMPLEMENTED / NOT_QUALIFIED.**

Jochen hat die unmittelbar zuvor gestellte Frage mit „Ja“ beantwortet:
Alternative A als begrenzten Vertragsänderungsentwurf weiterführen — kontrollierter
Übergang auf Version2 derselben DB bei unverändertem Schutzziel und zwingendem
Stopp bei jedem unterstützten Bypass. Dies autorisiert ausschließlich diese
Ausarbeitung. Kein DB-/Produkt-/Test-/Workflow-/Kryptocode, keine Migration,
Installation, Browser-/CI-Ausführung oder Syncaktivierung.

Basis44531fc7f0e5fe3960412a9306150edf2b960210 /
Treeeb6f2169ba7e32e3be90d7bcb366890f97b72113.
[Entscheidungsgrundlage](FLH04_WRITER_BOUNDARY_DECISION_2026-11-13.md).
Ausstellervertrag§4 und Snapshot-/K1-Verträge bleiben im laufenden Produktstand
vollständig verbindlich. Nur der hier beschriebene spätere Versionswechsel
wird als Vertragsänderung vorgeschlagen; er ist noch nicht freigegeben.

## 1. Ziel und exakte Reichweite der Vertragsänderung

Unverändert: JEDE relevante P-Mutation über den gesamten Capture-/Cryptoawait-/
Commitzeitraum muss ausgeschlossen oder zwingend erkannt werden, einschließlich
Same-CAS-, Feldpräsenz-, Schlüsselmaterial- und Zwischen-ABAänderung.
P/R/S/D, Rawidentität, atomarer records-Commit, Retry/Parent/Original-CAS,
oncomplete, Antwortverlust und sämtliche A1/A2-/format1-Sperren bleiben Pflicht.

Vorgeschlagene Ausnahme von der heutigen Version1-Vorgabe:
EIN expliziter kontrollierter 1→2-Übergang in
foliolab-open-portfolio/records im bisherigen Storagebucket.
Keine zweite DB, kein Origin-/Bucketwechsel, kein stiller DBreset.
DBschema-/Protokollversion ist weder Finanzdatenversion noch Enrollment.
Snapshotversion1, Datenversions-/Import-/Undo-/Oracleverträge unverändert.

Der erste Übergang ändert ausschließlich die native DBversion.
Store-/Indexdefinitionen und ALLE vorhandenen records bleiben unangetastet:
kein put/add/delete/clear, kein serialisierendes Roundtrip, keine Umbenennung,
keine Schlüssel-/Autoritäts-/Outboxkonvertierung. Das schließt das Hinzufügen
eines vermeintlich harmlosen Freigabemarkers in diesem Übergang aus.
Eine später nötige neue Enrollment-/Lifecycleform ist separater Reviewgegenstand.

Unbekannte bestehende Formen/Slots oder beschädigte Datensätze verhindern
die Qualifikation des Übergangs. Sie werden erhalten und gezielt zur bestehenden
Original-/Recoverykette eingeordnet, nicht normalisiert/gelöscht.
format1-prepared-locked bleibt auch auf DBversion2 unverändert gesperrt.
Der Neulinienpfad bleibt bei vorhandenem format1 blockiert; keine parallele
Autoritätslinie oder Ersatzslots durch diesen Vertrag einführen.

## 2. Beweispflichten — nicht bloß Versionszahl erhöhen

A ist nur tragfähig, wenn ALLE folgenden Aussagen belegt sind:

| ID | Zu beweisende Aussage | Aktueller Status |
| --- | --- | --- |
| W1 | Alle tatsächlich unterstützten alten IDBopener öffnen exakt v1 oder haben einen gleichwertig abgeschlossenen Pfad. Worker/Recovery/Supportwerkzeuge und ausgelieferte Versionen eingeschlossen. | Modulgeschichte mit14Einstiegsschnitten belegt nur diesen einen Pfad; gesamter unterstützter Opener-/Buildabschluss OFFEN. |
| W2 | Nachläufe alter Kontexte können nach dem Übergang weder P noch seine kanonische Speicher-/Lifecyclezuordnung ungebunden ändern. | Neu ausdrücklich abgegrenzt: DBclose beendet keinen JS-Kontext; Modusmarker-/Rückwechselnachläufe gezielt zu qualifizieren, OFFEN. |
| W3 | Jeder neue unterstützte P-Writer und jede Schlüsselbenutzung unter Prüf-/Commitbindung nimmt zwingend am gesamten geschlossenen Lifecycle teil. | Aktueller Code erfüllt das nicht; konkrete neue API-/Aufrufverträge unten, NICHT implementiert. |
| W4 | Kein unterstützter versionsloser/höherer/recoverybedingter Direktopener kann die Grenze umgehen oder zurücksetzen. | OFFEN; ein gefundener unterstützter Bypass blockiert Freigabe, wird nicht als feindlich umetikettiert. |
| W5 | Cutover-/Abbruch-/Reopen-/Verlustablauf wahrt Originale und gibt keine Rechte frei. | In diesem Entwurf präzisiert; native Gegenproben OFFEN. |
| W6 | Alle jeweiligen nativen, unabhängigen Review-, Original-/Restore-, CI-/Releasegates am exakten Kandidaten erfüllt. | OFFEN; Richtungsgenehmigung ersetzt keines dieser Gates. |

Kein Schutz gegen beliebigen feindlichen Same-Realm-/Hostcode wird neu behauptet.
Normale unqualifizierte Konkurrenz bleibt ausdrücklich im Pflichtumfang.
Versionsloses open oder direktes open(name,2) kann technisch öffnen; Version2
ist kein natives ACL. Ein solcher tatsächlich unterstützter Pfad muss vorher
umgestellt/abgeschlossen werden, andernfalls bleibt A unbrauchbar.

## 3. Konkrete Zustände und Übergangsregeln

| Zustand | Zulässige Aktion / Ausgang |
| --- | --- |
| V1_CANONICAL | Bestehende lokale Produktpfade unverändert. Kein impliziter Upgradeversuch beim Start/Read/Save/Restore. |
| PREPARED | Exakter unterstützter Build-/Writervertrag, Original-/Restorekette und Nutzerablauf für alte Entwürfe vollständig qualifiziert. Noch keine DBänderung. |
| UPGRADE_REQUESTED | Eine private einmalige Steuerung fordert ausdrücklich DBversion2 an. Kein allgemeiner openLatest-/Versionsfallback. |
| BLOCKED_WAITING | Alte Verbindung offen. Kein Erfolg, keine neue Syncoperation; kein TTL/steal/DBdelete. Tatsächlich ausstehende DBverbindungen sind ausschlaggebend, nicht Tabzähler/Heartbeat. |
| CANCEL_REQUESTED | Versuch dauerhaft flüchtig widerrufen; ausstehender Request ist noch NICHT nachweislich beendet. Späteres upgradeneeded muss vor eigener Arbeit aborten. Kein stilles Weiterlaufen als freigegebener Versuch. |
| UPGRADING | Nur oldVersion1/newVersion2 und gültige private Freigabe dieses Versuchs. Keine Crypto-/Netzwerkawaits/Keepalive. Vorhandene records bleiben unverändert. Fehler/widerrufene Freigabe => Upgrade aborten. |
| SCHEMA_COMMITTED | Upgrade abgeschlossen; native Version2 ist gespeichert. Das ist ausschließlich Schemastatus, kein Enrollment/Unlock/Sync-PASS. |
| V2_COHORT_PENDING | Exakter Version2-Reopen und vollständiger lokaler Readback erfolgen unter neu erworbenem Lifecycle. Keine aus v1 übernommene flüchtige Capability. W1–W6 müssen für Nutzung erfüllt sein. |
| V2_QUALIFIED_LOCAL | Nur künftig separat freigegebene lokale Fachoperationen der qualifizierten Kohorte. A1/A2/format1 und alle noch offenen Syncgates bleiben gesperrt. |
| ABORTED | Native Upgradeabort-/Errorgrenze beobachtet; v1 bleibt bestehen, Daten unverändert. Kein fiktiver Downgrade erforderlich. |
| OUTCOME_UNKNOWN | Schema könnte bereits committed sein, Rückgabe fehlt. Ausschließlich nicht mutierend verifizieren; nicht blind v2 öffnen/neu anlegen oder erneut zustimmen lassen. |
| STORAGE_LOST_OR_UNSUPPORTED | Fehlende DB, unbekannte Version/Stores/P-Formen oder Verlust der Identitätskette. Kein automatisches Neuanlegen/Reset/Syncresume. Bestehende Recovery-/Originalpfade separat. |

PREPARED darf erst nach tatsächlicher Behandlung ungespeicherter Entwürfe erreicht
werden. Eine Schließen-Aufforderung verwirft keine Entwürfe automatisch.
Ein nicht schließender Alt-Tab/Worker kann den Übergang unbefristet blockieren.
Diese Verfügbarkeitsgrenze wird nicht durch ein Sicherheitsfallback kaschiert.

### 3.1 Blockierter Request und späteres Upgrade

Ein Promise-Reject oder ein Abbruchknopf beweist keine Beendigung des nativen
Openrequests. Der bisherige openPortfolioDB-Code merkt bei onblocked zwar einen
Fehler und schließt ein späteres Resultat, führt aber onupgradeneeded weiterhin
aus. Dieses Muster ist KEINE qualifizierte Steuerung des neuen Übergangs.

Pflicht für die spätere Implementierung:
- Der Controller behält die privaten Handler des ausstehenden Requests.
- Abbruch setzt unwiderruflich CANCEL_REQUESTED für genau diesen Versuch.
- Falls danach upgradeneeded eintritt, sofort transaction.abort; kein
  erfolgreicher Versionswechsel bloß weil ein anderer Tab später schließt.
- Liegt die Versionänderung schon hinter ihrer echten Commitgrenze, kann
  ein Abbruch sie nicht rückgängig machen: SCHEMA_COMMITTED/OUTCOME_UNKNOWN,
  Nutzung weiterhin sperren und gespeicherten Stand klären.
- Kein zweiter Upgrade-/Retryversuch, solange der erste native Ausgang ungeklärt ist.
- Der Lifecyclecallback wartet native Beendigung/Klärung ab; keine abgetrennte
  spätere Mutation und keine vorschnelle Lockfreigabe. Abbruch kann daher
  zunächst angefordert sein, ohne bereits vollständig abgeschlossen zu sein.
- Ein zukünftiger UX-/Abbruchvertrag darf diese Wartegrenze nicht als
  sofort erfolgten Rollback darstellen.

### 3.2 Fehlende/neuere DB und unklarer Ausgang

Der Pfad ist ausschließlich für eine EXISTIERENDE v1-DB.
Falls oldVersion0 eintritt, fehlt die erwartete Linie: Upgrade aborten,
keine Stores oder Portfolioinitialisierung in demselben Request erzeugen.
Version>2 blockiert ohne Downgrade/Neuanlage.
BereitsVersion2 ist kein erneuter 1→2-Erfolg, sondern ein gesonderter
Reopen-/Validierungspfad.

Die Klärung eines unbekannten Ausgangs darf nicht selbst ein Update auslösen.
Dazu ausschließlich nicht mutierende vorhandene Metadaten-/Versionsbeobachtung
und ein gegen unerwartetes upgradeneeded abortgeschützter Readpfad verwenden.
Eine versionslose Öffnung wäre in diesem eng privaten Diagnosepfad nur zulässig,
wenn ein unerwarteter Initialisierungsfall sofort abortiert, keine Writes möglich
sind und nie ein nutzbares DBhandle/Fähigkeit nach außen entsteht.
Das ist KEIN versionsloser Produktionswriter.
Fehlt hierfür ein qualifizierter Browserpfad, bleibt OUTCOME_UNKNOWN bestehen.
Kein bereits gespeicherter Versionswechsel wird durch Feldflag zurückgesetzt.

## 4. Konkrete neue Writergrenze nach dem Übergang

Vorgeschlagener konstanter Lockname:
**foliolab-portfolio-write**, im selben Storagebucket.
Er existiert bereits im lokalen Adapter. Keine neue Locknamensserie.
In der neuen Kohorte wird seine Reichweite auf ALLE P-Mutationen und
gebundenen Schlüsselprüfungen ausgedehnt; aktueller Besitz/Teilgebrauch beweist das nicht.

Nur private geschlossene Fachoperationen:
kein öffentliches withLocalLock(callback), keine frei aufrufbare putKey-/unlock-
API, callerKey, serialisierbare/rekonstruierbare Fähigkeiten oder ungebundenes
Version2-DBhandle. Ein APIumbau alleine ist keine native ACL; W1–W4 bleiben Pflicht.

Eine Operation:
1. Vor der ersten P-/Schlüssel-/kanonischen Quellen-Erfassung exklusiv erwerben.
2. Eingaben vor Await ablösen; P in einer kurzen readonly-Transaktion mit
   Count/Feldpräsenz/allen relevanten Records erfassen.
3. Private einmalige Operation an DBversion, qualifizierte Linien-/Lifecycleform,
   Original-CAS, exaktes P/R/S/D/Descriptor/Frame/Keykontext binden.
4. Cryptoarbeit ausschließlich zwischen kurzen IDBtransaktionen; sämtliche
   gebundenen Prüfungen innerhalb desselben Lifecyclecallbacks abwarten.
5. Vor/nach jedem Cryptoawait vollständige vorgeschriebene Prüfung.
   Unbekannter Slot/Status oder invalidierte Fähigkeit verwirft den ganzen Versuch.
6. Ein records-readwrite-Commit gegen vollständiges P, kein Send vor oncomplete.
   Geänderte Inputs/Parent/CAS blockieren; kein Callerreceipt als Ersatz.
7. Erst nach oncomplete/Abort oder gebundener Klärung freigeben. Nach Commit
   verlorene Rückmeldung nicht zu Abort/Neuverschlüsselung umdeuten.

Interne Unteroperationen erwerben den Lock NICHT erneut. Sie erhalten nur einen
privaten gültigen Ausführungskontext; außen nicht nachbaubar. Ein nicht reentranter
Lock würde bei verschachteltem Zugriff deadlocken. Kein Löser durch steal/Fallback.
Bestehende Legacyadapter dürfen nicht erst ihren Callbacklock halten und darin
unbemerkt denselben Lock erneut erwerben. Lockreihenfolge und Aufrufgraph vor Code
vollständig für den betroffenen Pfad festlegen; kein zweiter Lock-/DBzyklus.

Reine ungebundene UI-Leseansichten dürfen nur detached Readmodelle erhalten.
Sobald ein Read eine spätere Crypto-/Mutationserlaubnis tragen soll, gehört er
in den geschlossenen Operationszeitraum. Kein vorab erfasster Key/Verifierreceipt
aus einem anderen Lifecycle in den Commit einschleusen.

Fehlende WebLocks: diesen v2-Mutations-/Syncpfad blockieren.
Kein Versprechen, jede lokale Recoveryoperation könne dann unverändert schreiben.
Lesen/Originaldownload darf, soweit unabhängig qualifiziert, weiter möglich sein;
kein stilles Umschalten auf einen anderen kanonischen Speicher.

## 5. Zuordnung der tatsächlichen Fachpfade

Alle folgenden bestehenden Pfade bleiben unterstützt zu qualifizieren, nicht
nachträglich aus dem Modell entfernt. Die Spalte „v2-Pflicht“ ist Sollvertrag,
KEINE Behauptung einer vorhandenen Implementierung.

| Bestehender Pfad | Aktuelle Quelle / Wirkung | v2-Pflicht |
| --- | --- | --- |
| commitPortfolioRecord; stageLegacyPortfolio | Portfolio/CAS/raw/settings/updatedAt/Tombstone, teilweise Outboxinvalidierung; stageLegacy delegiert | Äußerer geschlossener Save-/Restore-/Delete-/Stagingvorgang; niemals Untercommit ohne gültigen internen Kontext. |
| retirePortfolioCredentials | Kann bei initialize/reload tatsächlich raw/settings und Revision ändern | Auch vermeintlicher Readstart ist Writer; vollständig serialisieren. Ein Noop darf keine Mutation verstecken. |
| restoreDamagedRecord | Explizite Recovery/Revision und Outboxinvalidierung | Kein „Recovery darf direkt“; Originalbezug/Readback/FehlernachCommit binden. |
| adoptPortfolioRecord | Portfolio und Sperre, ggf. Outboxinvalidierung | Gleiches Lifecycle; keine Wiederbelebung alter Autorität/Capabilities. |
| commitPortfolioSyncRecord | Outboxversion/Frames an Portfolio-/Outboxpreimages | Bestehender Rawguard bleibt; vollständiger P-/Keybezug ist zusätzlich noch umzusetzen/qualifizieren. |
| prepareLocalSyncAnchor / commitPrepared | Private Neuanlage von format1-prepared-locked nach Cryptoawaits | Keine v2-Aktivierung dieses Altformats. Bestehende Records erhalten; keine Promotion. Jede künftig erlaubte Neuanlage braucht eigenen geschlossenen Vertrag. |
| createSyncOutboxStorage recover/capture/begin/planApply | Aktuell externe verifyFrame-/Receiptparameter und Cryptoawaits vor Commit | Keine blinde Übernahme des bestehenden Adapters als v2fähige API. Verifier/Receipts müssen privat an selben Lifecycle gebunden werden. A1/A2 bleiben gesperrt. |
| PortfolioStorage initialize/reload/initializeNew | Öffnen, ggf. Credentialretirement/Adoption und Modusmarker | Read-/Write-Teile unterscheiden; Neuanlage ist NICHT dieser 1→2-Cutover. Keine Legacyfallbacks. |
| PortfolioStorage migrate/recoverFromBackup/removeAll/revert | IDBcommit plus LocalStorage-/Modus-/Rückwechselmarker, teils weitere Reads | Gesamte Fachoperation inklusive Nachläufen unter gemeinsamer Grenze; keine neue atomare Mehrspeichergarantie behaupten. |
| unverifiedBackup | Kann fehlendes Handle regulär erneut öffnen, ansonsten Originalread | V2-Opener strikt qualifizieren; ausschließlich Read, keine automatische Reparatur/Neuanlage. |
| this.db/openPortfolioDB/withLocalLock | Heute echter DBzugang bzw. freie Callbackoberfläche | V2-Produkt-API schließen und aktuelle Verbraucher umstellen; W1–W4 nicht durch private Felder ersetzen. |
| Aktueller Historyworker/SW | Vorhandener Quellbeleg ohne direkten Portfoliowriter | Kein neuer Sperrwriter zu erfinden. Tatsächliche alte/geplante Workerpfade und neue Releases separat zuordnen. |

### 5.1 LocalStorage-Nachläufe und kanonischer Speichermodus

Der bestehende Adapter benutzt MODE_KEY=foliolab-open-storage-mode mit Wert
idb-v1 sowie einen eigenen Rückwechselintent. Dieser Wert bezeichnet im
bestehenden Code den kanonischen Backendpfad. Er wird durch diesen Entwurf
NICHT in idb-v2 umbenannt, gelöscht oder zur Enrollmentfreigabe umgedeutet.

Belegte konkrete Nachläufe:
initializeNew/migrate/recoverFromBackup setzen den Modusmarker nach IDBcommit/
Readback; revert schreibt zunächst lokale Kopie/Intent, committet Tombstone und
entfernt danach den Modusmarker; removeAll bereinigt LocalStorage nach dem
Tombstonecommit. initialize kann einen exakt gebundenen alten Rückwechselintent
nach Tombstone vollenden. Das sind normale unterstützte Abläufe, keine Angriffe.

Die native Versionsgrenze allein beendet diese JS-Abläufe nicht.
Vor Freigabe gezielt je unterstütztem Altbuild beweisen, dass ein solcher Nachlauf
vor der relevanten Übergangsgrenze fertig ist ODER nach dem Übergang seine
Quelle/Absicht nicht ungebunden als kanonisch umschalten kann.
Dafür Await-/Callback-/Taskgrenzen und benötigte v1-Folgezugriffe konkret zuordnen.
Nicht pauschal „db.close beendet den Tab“ oder „alter Reopen scheitert also alles
sicher“ behaupten.

Ein konkret zu prüfender Altfall ist initialize nach einem Tombstone mit gültigem
Rückwechselintent: dieser IDB-Zweig besitzt derzeit keinen äußeren withLocalLock.
Nach dem Read entfernt er Modus-/Intentmarker, ohne einen weiteren IDBcommit.
Die onversionchange-Schließung alleine beweist daher noch nicht den Abschluss
dieses normalen JS-Nachlaufs. Anders als migrate/recoverFromBackup/removeAll/revert
darf dieser Pfad nicht nur wegen des bestehenden Locknamens als beteiligt gelten.
Das ist eine aus Quelle/API abgeleitete offene Racepflicht, KEIN nativer Repro.

Konkrete zusätzliche v2-Sollregel für den Entwurf:
Ein alter MODE_KEY-/REVERT_INTENT_KEY-Nachlauf allein darf eine qualifizierte
Version2-Linie niemals aus dem kanonischen IDBbetrieb herauslenken oder
initialisieren. Der neue kanonische Quellenentscheid muss an den qualifizierten
nativen Version2-/Portfolio-/Lifecyclezustand gebunden sein und alte v1-Marker
nur als Legacyhinweis behandeln. Version2 alleine verleiht keine Syncautorität.
Ein legitimer NEUER v2-Rückwechsel muss stattdessen eine im selben Lifecycle und
an exakten Portfolio-/Tombstone-CAS gebundene persistente Übergangsabsicht besitzen.
Deren konkrete Recordsform/Presence-/Wiederanlaufregeln sind vor Umsetzung
zusätzlich festzulegen; der bestehende lose LocalStoragemarker genügt nicht.
Dies ist keine Freigabe, jetzt einen Record anzulegen oder bestehende Marker zu
überschreiben. Die in§1 verlangte schema-only-Upgradephase bleibt recordschreibfrei.

Ein durch diesen Quellenentscheid verhinderter falscher Backendwechsel ist von
einer Mutation von P zu unterscheiden: der Altmarker ist kein Key-/P-ABA und
darf nicht in einen angeblich atomaren IDB+LocalStorage-CAS umgedeutet werden.
Normale Rückwechsel/Recovery bleiben erforderlich; ihre Sicherheit/Verfügbarkeit
darf nicht durch dauerhafte Streichung des unterstützten Ablaufs erkauft werden.
Wenn kein geschlossener neuer Quellen-/Rückwechselvertrag gelingt, bleibt W2
offen und der v2-Cutover gesperrt.

Für neue Version2-Pfade deckt der gemeinsame Lock die gesamte Speicherwechsel-
operation und Markerfolge ab. Ein IDBcommit und LocalStoragewrite bleiben trotzdem
zwei verschiedene Persistenzgrenzen; bestehende exakte Intent-/Tombstone-/
Original-/Readbackregeln bleiben erforderlich. Ein nachträglicher Markerfehler
rollt keinen IDBcommit zurück. Kanonischer Backendwechsel invalidiert den Versuch;
keine aktive Sync bei unklarer Quelle. Kein neues LocalStoragejournal von P/Keys.

## 6. Historische und künftige Versionen, Löschung, Reopen

W1/W2 werden durch eine gezielte Build-/Entry-/Nachlaufzuordnung geschlossen,
nicht durch erneutes Lesen aller154src-Dateien.
Vorhandenes156Dateienmanifest und14Einstiegsschnitte wiederverwenden.
Noch fehlend: tatsächlich unterstützte ausgelieferte Artefakte/Opener und
Recovery-/Supporttools einschließlich nicht über atomic-storage laufender Pfade.

Nach Cutover muss ein alter v1-Client sicher fehlschlagen, ohne Stalebackup/
LocalStorage automatisch als kanonisch zu wählen. Ein neuer Client darf nicht
auf v1 zurückfallen. Reopen erwirbt neu und liest/verifiziert neu; keine alte
WeakMap-/Key-/Zustimmungsfähigkeit wiederherstellen.
Künftige inkompatible Versionen benötigen neuen expliziten Übergangsvertrag.

DBdelete/Browserclear oder Versionsreset werden nicht durch einen frei
beschreibbaren Epochzähler geheilt. Verlust/Neuanlage ist eigener Zustand,
niemals vermeintlicher leerer Retry. Dieser Vertrag autorisiert kein Löschen,
keine neue Identität oder automatische Wiederaufnahme alter Writerrechte.
Vollständiger Host-/DBklon bleibt außerhalb der vorhandenen Sicherheitszusage.

## 7. Überprüfbare native Matrix im vorhandenen Harness — nicht ausgeführt

tests/browser-sync-outbox.mjs und tests/storage-origin.html bleiben der Testplatz.
Originalharness unverändert. N0-BASELINE aus der Entscheidungsvorlage bleibt ein
separater nicht gestarteter Altumfang. N1 bezeichnet erst den späteren neuen
exakt gepinnten Vertrags-/Harnesskandidaten, keine heutige Abnahme.

| Fall | Arrangement an echten IDB-/Browsergrenzen | Pflichtausgang |
| --- | --- | --- |
| A01 | Alter v1-Tab mit offener Transaktion; zweiter Kontext fordert2 an | Kein Capture/neuerWriter vor abgeschlossener Transaktion/Verbindung und Upgrade. |
| A02 | Alter v1-Worker hält Verbindung und ignoriert close | BLOCKED, kein Fallback/steal/Erfolg. |
| A03 | Blockiert, Nutzer fordert Abbruch, alter Tab schließt erst später | Kein verspätet erfolgreicher eigener Upgradeversuch; spätes upgradeneeded abortiert, tatsächlichen Zustand lesen. |
| A04 | Abbruch gegen schon erfolgten Versionscommit | Keinen Downgrade/Abort erfinden; SCHEMA_COMMITTED/UNKNOWN mit weiterhin gesperrter Nutzung. |
| A05 | Alter v1-Reopen nach abgeschlossenem2 | VersionError; kein Legacyfallback/neue leereDB. |
| A06 | Versionsloser oder höherer tatsächlich unterstützter Recoveryopener | Als Bypass erkannt => gesamte A-Freigabe BLOCKED, bis konkreter Pfad geschlossen. |
| A07 | Zwei konkurrierende Upgradecontroller, einer abgebrochen | Keine doppelte Steuerung; spätere2-Öffnung ist Reopen/Validierung, keine zweite Migration oder Capabilityübernahme. |
| A08 | Fehlende DB/oldVersion0; unbekannte höhere Version/Stores | Kein Neuanlegen/Normalisieren; Abort/blockiert. |
| A09 | Upgradeabort/Fehler vorCommit | Version/Store-/Recordbestand unverändert; kein Cryptoawait oder Storewrite im Upgrade. |
| A10 | Schema committed, Antwort verloren, Reopen | Tatsächliche Version und unveränderte Originalrecords prüfen; kein blindes erneutUpgrade/Enrollment. |
| A11 | Vorhandener format1-prepared-locked vor/nach2/Reopen | Keys/Attribute/Materialkohärenz erhalten, weiterhin gesperrt, keine Promotion/Ersetzung/Löschung. |
| A12 | Jeder tatsächliche Save/Settings/Retirement/Restore/Recovery/Delete/Adoption-/Outboxpfad an JEDER Cryptoawaitgrenze | Derselbe geschlossene Lifecycle; Konkurrenz wartet oder verwirft korrekt, kein ungebundener P-Writer. |
| A13 | Dauerhafter K0/K1-Tausch, Key-/Presence-/Zusatzslot-ABA | Unterstützter Writer kann Änderung nicht innerhalb des gehaltenen Lifecycle durchführen; ungebundener unterstützter Writer ist BLOCKER. |
| A14 | Bewusst direkter versionsloser/v2-put im Test | Native ACL NICHT behaupten. Technische Umgehbarkeit dokumentieren; wenn echter unterstützter Pfad, A ablehnen. Kein positiver Sicherheits-PASS aus Metadatenvergleich. |
| A15 | Alter migrate/recover/removeAll/revert-Nachlauf an jeder relevanten DB-/Marker-/Callbackgrenze | Keine ungebundene Änderung der kanonischen Zuordnung nach freigegebener Grenze. Unklarer Fall => W2 offen. |
| A16 | Neuer Speicherwechsel: IDBcommitted, Markerwrite scheitert/Antwort geht verloren | Exakter Intent-/Originalreadback; kein fiktives Datenrollback/Syncresume. |
| A17 | Close/versionchange während Crypto bzw. Commit | Fähigkeit entwerten; kein neuerCommit auf altemHandle. Bereits committed Zustand tatsächlich klären. |
| A18 | Verschachtelte interne Operation/Abbruch während Lockcallback | Keine erneute öffentliche Lockakquise/Deadlockumgehung, kein detached Commit, kein steal. |
| A19 | PageClose/Reopen zwei Seiten im SELBEN Context | Persistierte Version/P/Keys neu prüfen; keine Rekonstruktion alter flüchtiger Rechte. |
| A20 | DBverlust/Clear/Neuanlage und zukünftiger inkompatibler Build | Kein Versions-/Identitätsreset als Recovery; separater gesperrter Verlustpfad. |

Native Scheduling-/Callbackgrenzen deterministisch beobachten; keine bloße
zeitbasierte Pause als Nachweis des Gegners verwenden.
Version2-Testdaten ausschließlich synthetisch im frischen Context; niemals
Nutzer-DB oder Produktionsorigin migrieren.
Prozesscrash, realeQuota, Recovery, weitere Engines/Hardware bleiben eigene Gates.
Injizierter Fehler und PageReopen sind keine solchen Vollnachweise.

Ausführungszugang unverändert:
regulärer qualifizierter Host oder separat freigegebener einmaliger Job auf
vorhandenem Ubuntu24.04-Runnertyp. Historischer Run43421311524 ist kein Zugang
zu laufender Maschine und kein N0/N1-PASS. Kein Runner/Dispatch/Retry/yml geändert.
Für N1 erst Workflow-/Testdelta und exakten SHA/Tree vor Ausführungsentscheidung
konkret vorlegen. Der vorhandene Reviewkandidat wird dadurch nicht ersetzt.

## 8. Beweisstruktur, Reviewimpact und interne Folgearbeit

Bedingte Beweisstruktur, kein fertiger Sicherheitsbeweis:
- W1/W2: nach erfolgreicher Versionsgrenze keine unterstützte alte ungebundene
  P-/kanonische Zuordnungsänderung mehr.
- W3/W4: jede unterstützte neue relevante Operation nimmt vollständig teil.
- Dann kann während des exklusiven Lifecycles kein unterstützter Konkurrent P
  ändern; Keykohärenz/Autorität/FullP-CAS bleiben zusätzliche Pflichten.
- Fehlt eine Prämisse, ist das Ergebnis NICHT bewiesen. Version2 alleine genügt nicht.

Reviewpaketfd3fce4bb3038e525c78e9a5bdc9bc81f4dab15b bleibt unverändert.
Kandidat17a5a190d472f1f07b3508e6f35194371fe95eb2 /
Tree44ff9c4d60fb22b9519b4b0b344a91045f97f28e.
Diese neue ungeprüfte Vertragsdatei ist nachgelagerter Delta-/Impactgegenstand.
Vor Umsetzung müssten insbesondere Aussteller§4.3 (heutiges Versionsverbot),
§4.4 (Keyslotgrenze), Snapshot-K1-Geltung, KohortenAPI und CR4/CR5 ausdrücklich
gegen diesen NEUEN gepinnten Vertragsstand beurteilt werden.
Keine Änderung des alten Reviewgegenstands, kein Paketneubau/Selbstreview.
Prüferauswahl/Zugang/Budget und jede Ausführung bleiben separate Entscheidungen.

Nächster bereits autorisierter interner Arbeitsschritt innerhalb des Entwurfs:
gezielte W1/W2-Zuordnung der tatsächlichen Opener/ausgelieferten Buildpfade und
der oben konkret genannten Marker-/Rückwechselnachläufe, vorhandene Belege
wiederverwenden. Bei Gegenbefund diesen genauen Pfad behandeln, keinen Codeauftrag
an Jochen und keine erneute allgemeine Architekturzustimmung verlangen.
Ein neuer Implementierungskandidat darf erst nach geschlossenen W1–W5,
explizit freigegebenem Vertragsdelta und allen einschlägigen Reviewgates entstehen.
Nichts anlegen, bloß um N1 laufen lassen zu können.

## 9. Quellen und tatsächlich geleistete Prüfung

Frisch gepinnt an44531fc7 gelesen:
- src/atomic-storage.js b8bc22967d451150801cd8ac1fd847a768c37ca2
- src/browser-portfolio-storage.js c383901ffe000b82f3a97c1f08460748dbe228eb
- src/sync-local-anchor.js 815f2ac2ccd0e507bcf4dbefbaf6a07b5332afa4
- src/sync-outbox-storage.js e2f4341934f33f81f16fdb731d57d6bf0c40525e
- docs/FLH04_ENROLLMENT_ISSUER_CONTRACT.md 4e0c446e70a828cd0cfcf81b1600a556cd7c509a

Eigene neue Fachableitung: Abbruchzustände, Marker-/kanonische Quellen-Nachläufe
und kohortenweite API-/Aufrufpflichten. Kein erneut durchgeführter ABAbeweis
oder156Dateienscan, kein Testlauf/Browser-/CI-/Release-/Reviewabschluss.

APIbasis am13.11.2026 frisch gelesen:
https://www.w3.org/TR/2026/WD-IndexedDB-3-20261030/
§2.7.3/4/5.1/5.2/5.5/5.8;
https://www.w3.org/TR/2026/WD-web-locks-20261112/
§1/3/4/5.
Die vorgeschlagenen FolioLab-Regeln sind eigene Entwurfsentscheidungen,
keine Aussagen eines unabhängigen Prüfers und keine native Abnahme.

FLH04 NOT DONE; Outbox INTERN UNQUALIFIZIERT;
N-DRIVE BLOCKED_EXTERNAL mit internem UND externem Rest.
A1/A2/format1/P/R/S/D/CAS/Raw-/Retry-/oncomplete-/Budget-/Originalschutz erhalten.
