## Beschlossene v2-Regel und C1-Vorbereitung · 13.11.2026

**V2_NO_LEGACY_RETURN_AUTHORIZED / C1_PROBE_PREPARED / PRODUCT_NOT_READY.**
Die konkrete v2-Kompatibilitätsentscheidung aus§10.7 ist jetzt ausdrücklich
erteilt. Alte Wartefragen darunter sind historisch und nicht erneut zu stellen.
Verbindliche Ergänzung und begrenzter Kandidatenentscheid in§11:
keine interne/versteckte/automatische v2-Rückmigration nachLocalStorage,
v1/Originale erhalten; gebundeneRecovery mit gespeichertemReadback und
ohneWriter-/Geräte-/Autoritätsportierung. C1 als optionaler Harness-Prüfkandidat
vorbereitet, nicht ausgeführt; keine vollständige Produkt-/Writerqualifikation.

---

## Ergebnis der W1/W2-Fortsetzung · 13.11.2026

**A_NOT_CANDIDATE_READY / DECISION_REQUIRED_V2_LEGACY_HANDOFF.**
Konkrete historischeOpener-/Versionzuordnung und Ereignisfolgen in§10 ergänzt.
Die Richtungsgenehmigung fürA bleibtgültig. Die technischeRückmigration ausv2
in dieselbe alteLocalStoragelinie ist durch normalen altenLegacy-save R1
nicht geschützt. NeueKompatibilitätsentscheidung in§10.7 notwendig;
keinCodeauftrag anJochen. KeineMigration/aktiveSync/Implementierung ausgeführt.

---

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

## 10. W1/W2: gezielter Quellabschluss und konkrete Kandidatenentscheidung · 13.11.2026

**A_NOT_CANDIDATE_READY / DECISION_REQUIRED_V2_LEGACY_HANDOFF.**
Ergebnis der ausdrücklich beauftragten W1/W2-Fortsetzung.
Kein bloßer weiterer allgemeiner Untersuchungsauftrag: Der unten bezeichnete
Rückwechselgegenfall verhindert unter dem bisherigen Erhaltungsvertrag einen
vollständigen A-Kandidaten. Die konkrete benötigte Kompatibilitätsentscheidung
steht in§10.7. Keine Migration/aktiveSync oder Implementierung autorisiert.

### 10.1 W1 — konkrete alte Öffnungspfade statt abstraktem beliebigem DBzugriff

Gezielt die13Änderungsstände des Browseradapters in der FLH04-Ancestry gelesen;
zu JEDEM Commit Einstieg von atomic-storage und sw.js gelesen.
Cachekennung aus sw.js ist eine Quellversionskennung, KEIN neuer Produktions-/
Auslieferungsbeleg und kein Beweis eines tatsächlich noch laufenden Altclients.

Alle13Adapterstände importieren openPortfolioDB aus ihrem selben relativen
atomic-storage-Modul; kein hier gefundener Adapteropener öffnet versionslos.
Die Spalte „Aufrufe“ nennt die konkreten Zeilen dieses Adapterblobs.
Die letzte Spalte nennt open-/onversionchange-Zeile im passend gepinnten
atomic-storage-Einstieg desselben Commits, NICHT Zeilen eines anderen Builds.

| Quellkennung | Commit / Adapterquelle | Adapterblob | Passender Atomicblob | Openeraufrufe | open/close-Zeile |
| --- | --- | --- | --- | --- | --- |
| v311 | [5a6a9e286c](https://github.com/joke0071/foliolab-open/blob/5a6a9e286c9a7d826dce2323348f8756eb175ada/src/browser-portfolio-storage.js) | c383901ffe000b82f3a97c1f08460748dbe228eb | 998cd78b5d92bc15fdba1a63945f0d77855285f9 | 45,83,155,179 | 24/37 |
| v311 | [5e08f4d085](https://github.com/joke0071/foliolab-open/blob/5e08f4d085a8f5cb646122eedcefed19b859e7e0/src/browser-portfolio-storage.js) | 87f83614bcd29f081372e531c4d13ebcc0bc172b | 9ee73c646d97f05eca072c22d13a1ba745b07f4d | 45,83,154,189 | 24/37 |
| v311 | [c7e8dbefbf](https://github.com/joke0071/foliolab-open/blob/c7e8dbefbfd3a2f6a5f648991c24f8b25a93c662/src/browser-portfolio-storage.js) | 8bbc2838134cff7a0435c233fae6a514ad68d565 | dc5256df06c2b667d00b4131972f9d0aad4830c4 | 45,83,153,187 | 24/37 |
| v303 | [c9b9a47f28](https://github.com/joke0071/foliolab-open/blob/c9b9a47f285dda11b65a6ecf815094992997e616/src/browser-portfolio-storage.js) | 59ca3068fc38820d4b7e31d10b26ebdf6ed326a4 | 485703e05390176cc02a8b1502e1ec3ef4b1adf8 | 45,83,152,186 | 14/27 |
| v263 | [10103d6253](https://github.com/joke0071/foliolab-open/blob/10103d6253ff544b383099c6a631035f67be7025/src/browser-portfolio-storage.js) | f9be5fe41e861ede12f66960dae59d582510d098 | 294861aca7b65fffd423b26f50c176a04659340f | 45,83,152,186 | 13/26 |
| v156 | [488e08347b](https://github.com/joke0071/foliolab-open/blob/488e08347b61242bac74bee23a4de40b556f0aef/src/browser-portfolio-storage.js) | 5bf77ffe12e481cd3aee9dcd260e8ff080e345cd | e79d2133293e9b999f7767281c7a3d42febb5bc8 | 46,83,152,186 | 12/25 |
| v156 | [08863b392e](https://github.com/joke0071/foliolab-open/blob/08863b392eabe4171328efa1e05f6ff7dca67983/src/browser-portfolio-storage.js) | 89836abf8e0f184b42d9389dbfee47b75ad6251a | e79d2133293e9b999f7767281c7a3d42febb5bc8 | 46,83,151 | 12/25 |
| v156 | [0456a8f57e](https://github.com/joke0071/foliolab-open/blob/0456a8f57e19cc016cfab802b5c8bd47bf8cfdd4/src/browser-portfolio-storage.js) | 0084be41e9916828c0d93f3cd8c3549554d5e236 | e79d2133293e9b999f7767281c7a3d42febb5bc8 | 46,83,140 | 12/25 |
| v142 | [add26a3646](https://github.com/joke0071/foliolab-open/blob/add26a3646e31b931f293cbd0932cc9b235037f9/src/browser-portfolio-storage.js) | 9dc8cd10b388c7f9e1758e3f3d858eb84c8205ab | 012fbab4b980b4354d3dbc7a2b6519592df4d8de | 44,108 | 13/26 |
| v136 | [2bc3502dcb](https://github.com/joke0071/foliolab-open/blob/2bc3502dcbd1e0671084427b3e599fe9f3029804/src/browser-portfolio-storage.js) | 7f66cfbc7a1caf6c050bb199bce1e7ee4460ad9f | 5ec7beb9022d2442cc3cc6bea6a44f06867b5488 | 44,108 | 13/26 |
| v88 | [58c8aab6ce](https://github.com/joke0071/foliolab-open/blob/58c8aab6ce93d605cae6e4f2dd8cb7f7bf8d3128/src/browser-portfolio-storage.js) | a169b18d1a42a58d46ee31f5c6296fc70ca3cb34 | 32a40df944afb7996a59c6f53c45c065b47b4c02 | 44,97 | 13/26 |
| v86 | [f606524233](https://github.com/joke0071/foliolab-open/blob/f60652423319d3aae442f46c63ba3c8b3dcf0395/src/browser-portfolio-storage.js) | 401146233027ba9362b29a09e0d2b36a1c8c043e | 32a40df944afb7996a59c6f53c45c065b47b4c02 | 37,69 | 13/26 |
| v85 | [dd2da3dead](https://github.com/joke0071/foliolab-open/blob/dd2da3dead0b8b341608388629c6672d63800dfe/src/browser-portfolio-storage.js) | 14498a0651b189f9ac9cf292bc28f24d269d4958 | 32a40df944afb7996a59c6f53c45c065b47b4c02 | 28,54 | 13/26 |

Nicht aus Commitmessage die Cacheversion erraten:
58c8aab6 nennt im Titel v87, seine gepinnten sw.js-Bytes nennen v88.
Das erklärt die Bezeichnung v88 in dieser Zuordnung.
Mehrere unterschiedliche v156-/v311-Quellstände bleiben einzeln zugeordnet;
Versionslabel alleine ist keine Byteidentität.

Für JEDE Tabellenzeile gilt am gelesenen Atomic-Einstieg:
PORTFOLIO_DB_VERSION=1; factory.open(PORTFOLIO_DB,PORTFOLIO_DB_VERSION);
onversionchange setzt db.close. Daraus folgen getrennte Ausgänge:

| Situation | Quellen-/APIableitung | Noch offener Laufzeitnachweis |
| --- | --- | --- |
| Bereits offene v1-Verbindung, keine laufende Transaktion | Closehandler fordert Schließen; erfolgreicher2-Upgrade wartet auf tatsächlichen Verbindungsabschluss. | Echte alte Seite/Worker und Eventzustellung. |
| Bereits offene v1-Verbindung mit laufender Transaktion | close-pending verhindert neue Transaktionen, bereits gestartete Transaktionen müssen enden, bevor der Upgrade fortfahren kann. | Nativer konkurrierender Commit/Abort und echte Fehlergrenzen. |
| Nicht reagierender/suspendierter Kontext oder fremder Handle | Kein erfolgreicher Cutover, solange eine Verbindung offen bleibt. | BLOCKED ohne Timeout/Übernahme; keine Lebendigkeitsaussage aus Head/Heartbeat. |
| Alter Adapter öffnet nach gespeichertem2 erneut | Explizite1-Anforderung scheitert mitVersionError; startup setzt IDB-Modus vor dem Openawait und hat an dieser Stelle keinen stillen Legacycatch. | Native Wiederöffnung und reale Appfehlerführung. |
| Recovery/Neuanlage/Migration benutzen vorhandenen Handle | Kein zusätzlicher Factoryopener; neue Transaktion auf close-pending/geschlossenemHandle darf nicht starten. Schon vor close gestarteter IDBteil endet vor Upgrade. | Je konkreter Recovery-/Transaktionsgrenze testen. |
| Neuer Originaldownloadopener | Ab488e083 im Adapter explizit über openPortfolioDB; alteV1-Wiederöffnung wird ebenfalls nicht umgangen. | Originaldownloadfehler/keinNeuaufbau in neuerv2-Steuerung. |
| Reine Legacyseite im bereits lokalen Modus | Kann gar KEINE IDBverbindung besitzen und deshalb die Versionsgrenze weder blockieren noch empfangen. | Entscheidend für§10.5; nicht als willkürlicher DBwriter erfinden. |

Aktueller v311/FLH04-Stand4745dc00:
src/browser-portfolio-storage.js c383901ffe000b82f3a97c1f08460748dbe228eb;
atomic-storage aus vorhandenen gepinnten Belegen b8bc22967d451150801cd8ac1fd847a768c37ca2.
Der letzte Tabellenstand ist dessen unveränderter Browseradapter.
Aktueller Historyworker/SW hat laut erhaltenem156Dateienbeleg keinen direkten
Portfoliowriter. Diesen Scan NICHT wiederholt.

Grenzen von W1:
Das ist die konkrete Zuordnung dieser historischen Adapterfamilie und des
aktuellen Quellpfads; KEIN Beweis aller jemals ausgelieferten Assetmischungen,
privaten Supportskripte, unbekannten Worker oder vorhandenen Browserprozesse.
Deren Versionen/Öffnungspfade bleiben unzugeordnet, sofern kein konkreter Beleg
vorliegt. Ein unterstützter versionsloser/höherer Opener wäre weiterhin ein
BLOCKER. Ein beliebiger technisch möglicher Zugriff wird nicht ohne
Produkt-/Supportbezug als tatsächlich unterstützter Pfad behauptet.

### 10.2 Tatsächlicher Supportvertrag für Rückwechsel — notwendige Präzisierung

Frisch an4745dc00 gelesen:
docs/INDEXEDDB_ONLY_PHASE_B.md,
Blob819cd9699c4ce48225f857b39b31d0390fa77eb4.
Der Phase-B-Vertrag entfernt nur die normale Speicherwahl/Rückwechsel-UI.
Er erhält ausdrücklich revertLocked/REVERT_INTENT_KEY und technische
Rückfall-/Altintentkompatibilität bis zu eigenen Crash-/Alttab-/Hardwarebelegen.

Pinnbarer historischer Umsetzungspunkt:
Commitc422dbd8e532127f738b24e07a9e5092fd865d84, sw.js-Cachekennungv160.
Sein Diff entfernt revertFromIDB-Button/Handler; browser-idb-cutover prüft
stattdessen den absichtlich erhaltenen technischen Controlleraufruf samt
unveränderten Daten-/Tombstone-/Revisionsassertions.
Keine neue Abnahme aus diesem historischen Commit.

Zusätzliche konkrete Appbelege:
- dd2da3dead0b8b341608388629c6672d63800dfe/v85:
  app.js Blob4ea0699ea39db1c64ffc85b16b43e06a22db3d78,
  initialize Zeile38, migrate Zeile1039, UIrevert Zeile1050.
- 58c8aab6ce93d605cae6e4f2dd8cb7f7bf8d3128/v88:
  app.js Blobc3b9a3421e44249c1d75e502823afd9abc9ca166,
  UIrevert Zeile1050 ebenfalls vorhanden.
- 4745dc0088279f755ff49c3329094ad369f3af7a:
  app.js Blob0c2335a0132d333b693196feb14b21f277e33c2f,
  kein .revert-Aufruf im aktuellen Appcode; migrate Zeile2666,
  recoverFromBackup Zeilen2502/2567, save Zeile128, removeAll Zeile2599.

Korrektur zu§5/§5.1:
Technischer Rückwechsel ist eine erhaltene Kompatibilitätsfunktion, kein
aktueller normaler UIbutton und nicht automatisch ein neuer v2-Nutzerablauf.
Er ist dennoch durch den bestehenden Vertrag geschützt. Ihn aufv2 ungeprüft
zu sperren wäre eine ausdrücklich zu entscheidende Vertragsänderung.
Versteckte UI beweist weder Wirkungslosigkeit noch sichere technische Entfernbarkeit.

### 10.3 W2 — Ereignisfolgen der vorhandenen Markerpfade

Alle Abläufe sind gezielte Quellen-/APIableitungen, keine nativen Repros.
A15/A16/A20 bleiben die bestehenden zugehörigen Gegenfallklassen.

M1 — neuerer kooperativer migrate/recover/revert/removeAll:
Der Adapter ab2bc3502/v136 hat für viele äußere Fachoperationen denselben
Locknamen foliolab-portfolio-write. Ein neuer Cutover, der diesen Lock vor
seinem ersten Capture hält, wartet einen solchen bereits laufenden äußeren
Callback einschließlich synchronem Markerabschluss ab.
Dessen geschlossener Callback schützt NUR die tatsächlich darunter laufenden
Pfade; fehlende Teilnahme wird nicht nachträglich angenommen.
Abhängige Unteroperationen dürfen denselben nicht reentranten Lock nicht
erneut erwerben. GegenfallA18 bleibt Pflicht.

M2 — initialize mit altem passenden Tombstone-/Rückwechselintent:
1. Alter Kontext liest über vorhandene v1-Verbindung den Tombstone.
2. onversionchange kann die Verbindung close-pending setzen.
3. Nach abgeschlossenem IDBread prüft der alte JS-Nachlauf Intent/Legacykopie.
4. Er entfernt MODE_KEY/REVERT_INTENT_KEY und setzt sich auf lokalenModus,
   ohne neuen IDBcommit und ohne äußeren withLocalLock.
Quellstellen an58c8aab6/v88: Adapter44/45 und51–67, Marker61/62.
Aktueller Adapter: read46, Marker62/63, Close64.

Der native Verbindungsabschluss allein liefert keine allgemeine Aussage,
dass der JS-/LocalStorage-Nachlauf beendet ist. Ob genau eine gewünschte
plattformübergreifende Interleavung erreichbar ist, ist nativ noch zu prüfen;
kein fester Task-/Mikrotask-Zeitablauf als belegt ausgeben.

Folge für einen korrigierten neuen v2-Client:
Legacy-Marker dürfen dort für sich KEINE kanonische Quellenwahl, Neuanlage,
Autoritätsübernahme oder Rückkehr zumLegacyportfolio auslösen.
Die alte Markerentfernung wäre dann nicht verhindert, sondern hinsichtlich
der kanonischen v2-Linie wirkungslos. Auf unerwartete Markeränderung darf der
Client konservativ blockieren, aber keine andere Datenfassung adoptieren.
Eine bloße spätere „Marker wieder gleich“-Prüfung ersetzt diese Quellenregel nicht.

M3 — alte nichtkooperative Rückwechsel und Fehlerkompensation:
Anv85/v86/v88 besitzen migrate/revert noch keinen äußeren WebLock.
v85revert Zeilen102–122:
Read/CASprüfung → lokalesSTORE_KEY schreiben → IDBTombstonecommit →
MODE_KEYentfernen; bei Commitfehler kann die lokaleKopie bedingt zurückgesetzt werden.
v88revert Zeilen151–183 ergänzt Intent, löscht ihn bei Fehler aber teils
ohne Bindung an einen späteren fremden aktuellenIntent.
Ein neuer Lockname oder ein privater v2-Intent stoppt diese alten
LocalStorage-Anweisungen nicht. IDBschreibteile sind durch die Versionsgrenze
abgegrenzt; deren reine lokale Vor-/Nach-/Kompensationsschritte sind es nicht.

M4 — initializeNew/Recovery-/Migrationsmarker:
Im aktuellen Adapter liegen initializeNew/migrate/recoverFromBackup samt
Markerabschluss unter dem äußeren Lock; Rücklesetransaktionen benutzen die
v1-Verbindung. Bereits wartende v1-Opener können vor oder hinter dem Upgrade
in der nativen Queue liegen; entweder arbeiten sie noch aufv1 und müssen
abgeschlossen werden oder scheitern an der gespeicherten2.
Das ist keine Freigabe für blockierte Requests, später ungeprüft zu upgraden.
Der CANCEL_REQUESTED-Vertrag undA03/A04 bleiben unverändert.

M5 — tatsächlich unterstützte v1-Rückwechselkompatibilität:
Der bestehende Ablauf erhält lokaleOriginale, schreibt Kopie/Intent, committet
den exaktenTombstone und schaltet Marker zuletzt. Ein passender alterIntent
kann beimStart fertiggestellt werden. BestehendeOriginal-/CAS-/Fingerprint-/
Abbruch-/Readbackregeln bleiben unverändert.
Daraus KEINE neue sicherev2-Rückwechselabnahme ableiten:
alte Hinweise verlangten bereits das Schließen andererTabs, ohne dieses
für nichtkooperative Legacykontexte technisch nachzuweisen.

### 10.4 Quellenbeleg für einen echten alten Writer OHNE IDBzugriff

Anv85/dd2da3dead undv86/f6065242:
src/model.js Blobd61fdb1a5c20095232070a9f1771b55f2958ca84,
persist Zeilen266–274.
Nach Versionsprüfung liest persist STORE_KEY, vergleicht optional mit dem in
observedStorage gemerkten String, serialisiert und führt storage.setItem aus.
Kein WebLock, keine IDBtransaktion, keine Modusmarkersperre in diesemBlob.
Der normale Adapterlegacy-save ruft persist auf, v85Zeile41/42.
Das ist kein erfundener freier putKey-/DBzugriff.

Anv88/58c8aab6:
src/model.js Blobc7f61d2af5c4755e6ce5dea02cf6acc13cce8b07,
persist abZeile266, Modusprüfung vor dem lokalenStringvergleich.
MODE_KEY=idb-v1 blockiert diesen späteren Legacywriter, solange die Prüfung
diesen Wert tatsächlich sieht. Prüfung, Stringvergleich und setItem sind
jedoch keine gemeinsam atomare Schreiboperation; ein bereits bestandener
Check ist keine übertragbare Sperre.
Der v88-Adapter hat weiterhin keinen gemeinsamen WebLock.
Abv136 ist der normale Adapterlegacy-save zusätzlich kooperativ gesperrt;
das ändert keinen bereits laufenden alten v85/v88-Code.

Diese Quellen beweisen die Fachpfade und fehlenden Schranken.
Sie beweisen NICHT, dass heute einv85/v88-Tab tatsächlich läuft oder durch
eine aktuelle Supportentscheidung weiterhin lauffähig sein muss.
Unter den bisher ausdrücklich eingeschlossenen normalen Alt-Kontexten darf
diese Familie aber nicht ohne neue Entscheidung still ausgeklammert werden.

### 10.5 Präziser Gegenfall R1 gegen einen v2-Rückwechsel in denselben alten STORE_KEY

T sei ein gültiger alter kanonischer PortfolioString.
Ein alter LegacytabL hat T geladen; observedStorage enthältT und sein
Adapter arbeitet weiterhin im lokalenModus. Er besitzt KEINE IDBverbindung.
Dies entspricht der belegten v85/v86-Altkompatibilität.

1. NeuerControllerN führt den freigegeben gedachten1→2-Übergang durch.
   Alle tatsächlich offenen v1-IDBverbindungen sind beendet; L war keine davon.
2. N beginnt einen legitim gedachten technischen v2-Rückwechsel.
   Die Zielkopie istT; ein lokal unverändertes Portfolio ist hierfür zulässig.
   N kann einen neuen gebundenen IDBIntent/Tombstone und seinen WebLock besitzen.
3. L beginnt einen normalen save mit einem bearbeiteten ModellO.
   Sein persist liestSTORE_KEY=T und besteht den vorhandenen Vergleich.
4. N beendet alle seine eigenen Kopie-/Intent-/Readback-/Markerprüfungen und
   erklärt die LocalStoragekopie für kanonisch bzw. den Rückwechsel erfolgreich.
5. L führt anschließend seinen bereits vorbereiteten setItem(STORE_KEY,O) aus.
   Er prüft weder einen v2-Intent noch dessen Lock. Der neue Rückwechsel kann
   diesen Schreibvorgang weder verhindern noch rückwirkend sicher abweisen.

Interleavung zwischen unterschiedlichen Agenten ist als Gegenablauf zu prüfen;
kein behaupteter tatsächlicher nativer Repro. Keine CryptoKey-/P-ABAanalyse
wiederholt: Dies ist die konkrete neue Grenze der KANONISCHEN Rückwechsellinie.
Die IDBversion bleibt2; ihre erfolgreiche Umstellung ist kein Gegenargument.

Ein abschließendes Readback ist kein Schutz gegen Schritt5 nach dem Readback.
„AndereTabs schließen“/Heartbeat/DBhandlezählung beweist bei L ohneHandle
keine technische Beendigung.
Ein andererIntentrecord im bestehendenIDB bindet nurN.
Sofortiges spätes Blockieren des neuenClients verhindert nicht die bereits
erfolgteMutation der kanonischenZielkopie durchL.

R1 benötigt keinen feindlichen Code, keine frei erfundene DBtransaktion und
keinen VersionslosenOpener; nur den belegten normalen altenLegacy-save.
Eine nativeAusführung bleibt ausstehend; die API-/Quellschranke ist aber bereits
offen, weshalb ein bloßer spätererBrowser-PASS A nicht alsgeschlossen rechtfertigt.

Fürv88 ist zusätzlich zu prüfen, wann dessen Moduscheck bestanden wurde.
Nach einem bewusst abgeschlossenen Rückwechsel ist MODE_KEY gerade nicht mehr
idb-v1. Danach können zwei nichtgemeinsam gesperrte Legacywriter ebenfalls
zwischen Read/Compare/Write konkurrieren. Nicht jede v88-Ausführung wird als
unbedingt erfolgreich behauptet; die konkreten Guards bleiben erhalten.

### 10.6 Was ein neuer zulässiger Rückwechsel erfüllen müsste

Der im bisherigenEntwurf vorgeschlagene neue persistenteIntent ist notwendig
für die eigene Crash-/Antwortverlustzuordnung, aber fürR1 NICHT hinreichend.
Diesen Punkt korrigiert dieser Nachtrag ausdrücklich.

Ein kompletter neuerRückwechsel bräuchte gemeinsam:
a) vollständigen Lifecyclelock über Capture/Kopie/gebundenenTombstone/
   Sourceentscheidung und Fehlernachläufe;
b) exakten dauerhaft verifizierbaren Übergangsbezug anOriginalCAS, ohneKeys/
   Autoritätsportierung und ohne fiktivenRollback nachCommit;
c) eine Zielschreibgrenze, an der ALLE tatsächlich unterstütztenWriter zwingend
   teilnehmen oder deren Schreibzugriff tatsächlich beendet ist;
d) Reopen-/LostResponse-/Reimport-/Neuanlagevertrag ohneVersionsdowngrade.
a/b/d alleine schließen c nicht.

Für den gemeinsamen altenLocalStorage-STORE_KEY ist c am vorliegendenStand
gegenR1 NICHT erfüllt. Ein sicher zulässiger neuer kanonischerRückwechsel in
genau diese Linie kann deshalb hier nicht behauptet oder implementiert werden.
Das ist das klare negative Ergebnis, kein Auftrag anJochen, einenMechanismus
zu erfinden. Der bisherigev1-Pfad bleibt erhalten, samt seinen historischen
begrenzten Nachweisen und offenenAlt-/Crash-/Hardwaregates.

A15 wird umM1–M4/R1 präzisiert, A16 umden unzureichenden eigenenIntent/Readback,
A20 umden nichtautorisiertenVersions-/Quellenreset.
Keine bestehendenAssertions/Testfälle entfernen oder deren Erfolg erfinden.
Kein vollständiger A-Prüf-/Implementierungskandidat eingefroren.

### 10.7 Entscheidung und eng begrenzter Vorschlag

**Vorliegender A-Vertrag noch NICHT ausreichend für einen vollständigen
begrenzten Implementierungskandidaten, solange er sichere v2-Rückmigration
in dieselbe von normalen Altclients beschreibbareLocalStoragelinie verlangt.**
GenauerGegenfallR1 und der ausdrückliche Phase-B-Erhaltungsvertrag sind benannt.
W1 ist für die erfassteQuellfamilie zugeordnet, weitergehendeAuslieferungs-/
Supportzuordnung und nativeLäufe bleibenOFFEN.

Empfehlung für genau eine zusätzlich nötige Entscheidung:
Für eine künftig ausdrücklich bestätigteVersion2-Linie KEINE technische
kanonischeRückmigration mehr in die alteLocalStoragelinie zulassen.
V2 bleibtkanonischIDB; Recovery überOriginaldownload und ausdrücklich
gebundenenBackup-Restore in dieselbe/neue separat autorisierteIDBlinie,
ohneWriter-/Autoritätsportierung oderVersionsdowngrade.
AlteModusmarker allein verleihenV2 keineQuellen-/Initialisierungsberechtigung.

Das verändert fürv2 gezielt den bisher erhaltenen technischen
Rückfall-Kompatibilitätsvertrag. Es entfernt keineNormalUIaktion (die ist
bereits seitv160entfernt) und löscht KEINEN v1-Pfad/Altintent/Originalbestand.
Für bereits bestätigtesv2 müsste der neueController technische revert-Anfragen
vorJEDEM Zielwrite sicher ablehnen und den vorhandenenOriginal-/Backupweg anbieten.
Eine v1-Instanz ohne beschlossenenCutover behält ihre bisherigen Funktionen.
Keine globaleAltversionsstilllegung oder bewieseneTabbeendigung daraus ableiten.

Zustimmung würde nur erlauben, GENAU diesev2-Kompatibilitätsgrenze in den
Vertragsentwurf zu übernehmen und dann einen entsprechenden begrenzten
Prüf-/Implementierungskandidaten vollständig reviewbar vorzubereiten.
Sie wäre KEINE Migration-/aktiveSync-/Ausführungs-/Reviewfreigabe.
Bei Ablehnung bleibt A für diesenUmfang geparkt; andereArchitekturen werden
nicht automatisch freigegeben oder in eine neue allgemeineSerie umgedeutet.

### 10.8 Trennung der Nachweisarten und tatsächlicher Schlussstand

QUELLE:
13historische vollständigeAdapter, zugehörige gepinnteAtomic-Einstiege/
Cachekennungen;3konkreteAppstände;alteModel-persist-Blobs;aktuellePhaseA/B-/
Stagingverträge. HistorischeQuellkennung ≠ Auslieferung ≠ laufenderAltprozess.

ARGUMENT:
IDBversionsgrenze aufv1-Handles/Reopen;M1–M5 undR1; insuffizienter
eigenerIntent/Endvergleich; erforderlicheZielwritergrenze.
Kein universellerUnmöglichkeitsbeweis für jede denkbareArchitektur.

NATIV:
Keine neueBrowser-/IDB-/Versionswechsel-/Crash-/Quota-/Recovery-/CIprüfung.
N0/N1, vorhandenesKryptoreviewpaket und sämtlicheProduktgates unverändert.
Keine historischenZahlenaddition, keine neuenTests oder Workflows.

Primärgrundlage für die begrenzte APIableitung frisch am13.11.2026:
https://www.w3.org/TR/2026/WD-IndexedDB-3-20261030/ §5.1/5.2
https://html.spec.whatwg.org/multipage/webstorage.html §12.1/12.2
IDBversions-/Verbindungsregeln sind keineSchranke für einen getrennten alten
LocalStoragewriter. Die eigeneGegenfolge bleibt ausstehende nativeGegenprobe.

Nur erforderlicherDelta-Nachtrag imbestehendenEntwurf; kein156Dateienscan,
keine neueLock-/ABA-/Gesamtarchitekturserie.
Schreibarbeit nachSicherung beenden,keinHintergrundbetrieb.

## 11. Beschlossene v2-Kompatibilitätsgrenze und begrenzter Prüfkandidat C1 · 13.11.2026

**V2_NO_LEGACY_RETURN_AUTHORIZED / BOUNDED_PROBE_CANDIDATE_PREPARED /
PRODUCT_IMPLEMENTATION_NOT_READY / NATIVE_NOT_RUN.**

Jochen hat ausdrücklich beschlossen:
Eine erfolgreich bestätigte v2-Linie bleibt kanonisch in IndexedDB.
Technische Rückmigration in die bisherige LocalStoragelinie entfällt für diese
Linie, auch intern, versteckt und automatisch. Bestehende v1-Linien und
Originalbestände bleiben unberührt. Diese Zustimmung erlaubt Vertrag und
Kandidatenvorbereitung, keine Migration/aktiveSync/reviewgesperrte Implementierung
oder zusätzliche CI-/Runnerausführung.

Damit ist die Entscheidung aus§10.7 ERTEILT. Die alten dortigen Wartefragen
sind historisch; nicht erneut stellen. R1 ist für eine regelkonform implementierte
v2-Linie durch das Verbot seines Zielübergangs aus dem zulässigen v2-Ablauf
entfernt. Kein nachgewiesener allgemeiner Writerabschluss folgt daraus.
Die v1-Risiken, technischen Altpfade und Originale werden weder gelöscht
noch als neu abgenommen oder verändert ausgegeben.

### 11.1 Verbindliche Quellenwahl

Für vorhandene native DBversion2 gilt eine konservative Schutzregel:
nie aus alten Modus-/Rückwechselmarkern eine LocalStorageadoption oder neue
kanonische Legacyquelle ableiten. Eine noch nicht fertig qualifizierte,
unklare oder nur schema-committed v2-Linie bleibt blockiert/lesend gesichert;
sie darf NICHT auf LocalStorage ausweichen. Bloße nativeVersion2 verleiht
keine Enrollment-/Writer-/Send-/Applyrechte oder Schreibqualifikation.

Das betrifft initialize/reload/save, implizite Neuanlage, Restore/Recovery,
Rückwechselintents, Modusreparaturen und alle internen/Supporteinstiege.
Ein fehlender alter MODE_KEY, belegtesnull/undefined, ein alterIntent oder eine
scheinbar gültige Legacykopie darf diesen Schutz nicht umgehen.
Die Entscheidung muss an den tatsächlichen DB-/Linienzustand gebunden sein,
nicht an Callerflags, einen übernommenen this.mode-Wert oder einen frei
rekonstruierbaren Marker. Ein geschlossenes/altesHandle ist kein Nachweis,
dass die aktuelle nativeDB noch dieselbe Version hat.

Ein Quellenprobe-/Readpfad darf keine fehlendeDB erzeugen oder upgraden;
unerwartetes upgradeneeded abortieren. Fehlende/unbekannteLinie mit vorhandenen
Originalen bleibt ein Verlust-/Recoveryfall. Wirklich neue leere Installation
und v1-Legacyübernahme bleiben ihre bisherigen getrennten Verträge; keine
automatische Version2-Neuanlage oder pauschale Altbestandsbereinigung.

Alte LocalStoragewriter können weiter ihre alteKopie verändern. Gegen eine
korrekt geschützte v2-Linie ist das keine P-/Quellenmutation, weil diese Kopie
dort keine kanonische Eingabe oder automatische Wiederherstellungsautorität hat.
Nicht mit der Behauptung verwechseln, der neueClient könne jeden Altwriter
technisch beenden. Die normalen tatsächlichen altenIDBwriter und unbekannten
versionslosen/Worker-/Assetpfade bleiben W1/W3/W4-Pflichten.

### 11.2 Interner Rückwechsel: vor JEDEM Write abweisen

Jede Rückwechselanforderung für eine bestätigte oder geschützte v2-Linie
muss sicher abgewiesen werden, bevor sie irgendeine dieser Aktionen ausführt:
- STORE_KEY kopieren/überschreiben oder eine neue Portfoliomirrorkopie erzeugen;
- REVERT_INTENT_KEY/MODE_KEY setzen, entfernen oder reparieren;
- Portfolio aufTombstone setzen oder Outbox/Lifecycle/Keys verändern;
- einen lokalenModus setzen oder späteren automatischen Rückfall vormerken.

Das gilt für die erhaltenen revert/revertLocked-Funktionen, alte
Initializer-Nachläufe und künftige Support-/Recoveryadapter. Eine UIblende oder
Ablehnung erst NACH Tombstonecommit genügt ausdrücklich nicht.
Ein gespeicherter alterIntent ist keine Zustimmung zum v2-Rückwechsel.
Ein neuer v2-Client darf so einenIntent nicht zur Legacyquellenwahl vollenden.

Für eine v1-Linie ohne autorisierten Cutover bleiben die bestehenden Funktionen,
Originalbytes, Intents und Sicherheitsgrenzen erhalten. Diese Entscheidung ist
keine globale Entfernung alter API-/Test-/Recoveryfunktionen.
Keine Bereinigung aus fremdemLinienzustand oder Versionslabel ableiten.

### 11.3 Sichere v2-Recovery — verpflichtender vollständiger Ablauf

R0 ORIGINALERHALT:
Unklare/beschädigte Originalrecords und vorhandene Outbox-/Anker-/Keybestände
zunächst erhalten; keine automatische Reparatur/Neuanlage/Normalisierung.
Vorhandenen Originaldownload verwenden, soweit unabhängig sicher lesbar.
Kein neuer Export von Writerprivatkeys, Geräte- oder Autoritätsidentität.
Ein heruntergeladenes Portfoliooriginal ist kein portabler vollständiger
Installation-/Writerklon; Credentials/Originalbytes nicht in Logs/Remote geben.
Die tatsächliche Downloadablage bleibt vom Browser nicht beweisbar.
Download allein qualifiziert weder Restore noch Recovery.

R1 BACKUPAUSWAHL:
Konkretes bewusst ausgewähltes Backup über bestehende Import-/Finanz-/
Versions-/vollständigeBackupvalidierung prüfen. Bestehende Legacyoriginale
nicht automatisch als dieses Backup auswählen. Keine zweite Finanzengine,
keine verkürzte Quellpayload oder Lockerung der Undo-/Original-/CASverträge.
Erlaubte Konfigurationsübernahme behält ihren bestehenden getrennten Opt-in;
sie verleiht keine Sync-/Writer-/Geräte-/Autoritätsrechte.

R2 GEBUNDENER VERSUCH:
Nach Prüfung von Nutzerauswahl und zulässiger lokaler Quelle den geschlossenen
Lifecycle für die tatsächliche v2-Linie erwerben. Vollständiges Original-P
samt Presence/CAS/raw/settings/Sperre/Outbox/Lifecycle/Keyslots erfassen.
Den konkreten geprüften Restoreinhalt und Zweck an diesen Versuch binden.
Bei jeder relevanten Änderung den ganzenVersuch verwerfen; ein altesBackup
oder ein Caller-expected-Objekt ersetzt diese privateBindung nicht.
Die noch fehlende komplette Writer-/Keyslotdurchsetzung bleibt Voraussetzung,
nicht durch diese Recoverybeschreibung gelöst.

R3 EIN COMMIT:
Nur den erlaubten bestehenden Portfolio-/Recovery-CAS-Pfad in records benutzen.
Originalzustand in derselben readwrite-Transaktion prüfen; bestehende
Outboxinvalidierung/Fence-/Tombstoneregeln erhalten. Kein Crypto-/Netzwerkawait
in IDB; keine zweiteDB oder LocalStoragequeue.
Backupdaten dürfen keine lokalen Writer-/Geräte-/Autoritäts-/Schlüsselidentitäten
ersetzen, aktivieren oder neu ausstellen. Bereits lokal vorhandenes
format1-prepared-locked bleibt unverändert gesperrt.
Ein erlaubter Finanzrestore ist kein Adoption-/Entsperr-/Enrollmentereignis.

R4 FEHLER/ABBRUCH:
Vor dem Commit: tatsächlichenAbort und unveränderten gespeichertenStand prüfen.
Nach dem Commit: der gespeicherteStand ist maßgeblich, kein fiktivesRollback.
Ein Marker-/Darstellungs-/Downloadfehler darf keine Legacyquelle aktivieren.
Unbekannter Ausgang bleibt UNKNOWN, bis er gebunden geklärt werden kann;
kein automatischer zweiterRestore und keine neueRevision als blinderRetry.

R5 READBACK/REOPEN:
Nach oncomplete tatsächlichen Portfolio-/Revision-/Settings-/Sperr-/Outbox-/
Identitäts-/Keyzustand neu lesen und den erlaubten Ergebniszustand verifizieren.
Eine normale Rückgabe alleine genügt nicht. Separate Verbindung/Seite und
später Reopen gehören zu den nativen Nachweisen.
Nach Antwortverlust kann Readback den Datenzustand zeigen, ohne dadurch schon
die eindeutige Operationsherkunft zu beweisen. Fehlt diese Zuordnung unter
Konkurrenz, nicht willkürlich den letztenWrite der eigenenOperation zuschreiben;
weiter blockieren/gezielt explizit recovern.
Keine flüchtigen Zustimmung-/Verifierfähigkeiten nach Reload rekonstruieren.

R6 KEINE RECHTEPORTIERUNG:
Normales Restore bleibt auf den bisher erlaubten Finanz-/Konfigurationsumfang
begrenzt. Kein Writer-, Geräte-, Autoritäts- oder Installationsbezug aus einem
Backup darf lokal neueRechte auslösen. BestehendeOutbox/Keys sind kein zu
importierendesBackupfeld. Fehlende/gelöschte lokaleIdentität ist eigenes
gesperrtes Enrollment-/Recoverythema mit unabhängigen Review-/Nativgates.

### 11.4 Kandidatenentscheidung mit ehrlicher Grenze

**A trägt jetzt einen vollständigen BEGRENZTEN nativen Prüfkandidaten C1
für die Versions-/Quellen-/Rückwechsel-/Restoreannahmen unten.**
C1 ist als Code im vorhandenen Harness vorbereitet, NICHT gestartet.
Er macht bestehende Produktlücken sichtbar und ist KEINE implementierte
Version2-Produktengine.

**A trägt weiterhin KEINEN vollständigen freigabefähigen
Produkt-/Keyslot-/Syncimplementierungskandidaten.**
Offen bleiben vollständige unterstützte Writer-/Worker-/Asset-/Supportzuordnung,
kanonischer v2-Startup-/APIumbau, vollständige P-/Key-/Verifierbindung,
qualifizierter Lebenszyklus und native sowie unabhängigeReviewgates.
Die entfallene LocalStorage-Rückmigration darf diese Pflichten nicht scheinbar
schließen. Keine neue allgemeine Architekturrichtungsentscheidung nötig.

Die nächste zulässige Produktvorbereitung müsste die erkannten direkten
Startup-/Revertlücken UND die volle betroffene Aufrufkette gemeinsam schließen.
Kein isolierter guard patch oder bestandenerPrototyp als gesamterA-Abschluss.
Reviewgesperrter Schlüssel-/Autoritätscode wird dafür nicht vorgezogen.

### 11.5 C1 — vollständiger reviewbarer Prüfumfang

Dateien:
- tests/browser-sync-outbox.mjs: nur zwei opt-in-Blöcke ergänzt.
  Entfernt man diese beiden Blöcke, entstehen exakt die bisherigen
  Originalbytes mit Blob88529dbbc1748e48c0f1c9c973fe4c0e03550691.
  Alle bestehenden Assertions und Standardausführung erhalten.
- tests/flh04-version2-candidate-probes.mjs: neue test-only-Proben.
  Kein neuer Runner/Workflow, kein Import durch Produktcode.

Aktivierung ausschließlich:
ENGINE=chromium, FLH04_VERSION2_CANDIDATE=1,
BASE_URL=http://127.0.0.1:4173,
node tests/browser-sync-outbox.mjs.

Ohne Opt-in ist der vorhandene Ablauf unverändert. Ungültiger Opt-in-Wert oder
andereEngine blockiert vor Browserstart. Die Erweiterung lässt nur lokalen
HTTPorigin localhost/127.0.0.1 und /tests/storage-origin.html zu.
Jede Probe erhält einen frischen BrowserContext mit zweiSeiten.
Keine Nutzer- oder ProduktionsDB, keine produktiven Remotezugriffe.

Der Schemawechsel ist ein ausdrücklich TESTEIGENER Prototyp auf den synthetischen
DBs, mit alten echten v1-Handles, oldVersion1/newVersion2-Prüfung,
Abort bei Cancel und OHNE Record-/Store-/Indexwrites oder Cryptoawait in IDB.
Seine Testinstrumentierung (window.v2CandidateProbe) ist KEINE sichere
Produktcapability, kein Enrollmentcontroller und keine neue ProduktionsAPI.

| Probe | Bestehender Fallbezug | Tatsächlich vorgesehene Aussage / Grenze |
| --- | --- | --- |
| C1-CANCEL | A03/A11 | Alter v1-Handle blockiert; cancel vor verspätetem upgradeneeded; tatsächlicherAbort, v1-Reopen und Original-/Keykohärenz. Keine allgemeineProzess-/Abbruchvollabnahme. |
| C1-VERSION-FENCE | A05/A11 | Schema-only1→2, Originalportfolio/Anker erhalten, alter expliziterv1-Reopen VersionError. AktiveLangtransaktion/alleAltbuilds nicht dadurch abgenommen. |
| C1-MARKERS | A15, beschlosseneQuellenregel | AlteLocalStoragekopie/Marker nachUpgrade; aktueller tatsächlicher PortfolioStorage.initialize darf keineLegacyquelle wählen. AktuellerCode wird aus Quellen als lückenhaft erwartet; kein PASS behauptet. |
| C1-NO-REVERT | A15/A16, v2-Verbot | Tatsächlicher interner PortfolioStorage.revert muss vor Record-/Kopie-/Intent-/Markerwrite ablehnen. AktuellerCode wird aus Quellen als lückenhaft erwartet. Fehler/Mutation ist FAIL, kein expected-fail-PASS. |
| C1-RESTORE-CAS | A12/A16 | Aktueller vorhandener finanzieller Recoverypfad am explizit synthetisch angehängten v2-Handle: staleOriginal verweigern, erlaubtenRestore tatsächlich über zweiteSeite zurücklesen, Sperre/Outbox und lokaleAnkerkohärenz erhalten. Kein qualifizierter v2-Startup-/FullP-/Enrollmentnachweis. |
| C1-RESTORE-FAULT-REPLY | A16/A19 | InjizierterPutfehler vorCommit erhält gespeichertenStand; injizierterAntwortverlust NACH abgeschlossenerAPI wird über tatsächlichenStand aus zweiterSeite geklärt, ohneLegacyspiegel und Identitätsänderung. Kein echterCrash/Transportausfall/realeQuota. |

Die Recoveryproben benutzen bestehende model-/atomic-storage-/PortfolioStorage-
Fachfunktionen. Das explizite Anhängen des Testhandles an einen Controller ist
nur Harnessinstrumentierung und darf NICHT als vorhandener Produktstartpfad
ausgegeben werden. Der bestehende anchor-proof wird wiederverwendet; keine
neuen Signatur-/KDF-/Wrapalgorithmen implementiert.

Alle Fälle laufen bei Ausführung seriell in getrennten frischenContexts.
FAIL bleibt FAIL; Ergebnisse werden gesammelt und einFehler beendet den
Gesamtkandidaten mit AggregateError. Kein Skip/automatischerRetry/Erwartungslockerung.
Der Report nennt Node/PW/tatsächlicheEngineversion, Fallstatus und expliziteGrenzen,
keine Finanz-/Credential-/Preimagedigests.
Die nachUpgrade gesetzten Legacydaten sind gezielte synthetische Altwriter-
Fixtures, KEIN neu eingeführter Produktmirror.

### 11.6 Tatsächliche lokale Prüfung und Ausführungsschranke

Beide finalen mjs-Dateien mit node --check geprüft: Exit0.
Nach der letzten reinen Reportmetadatenänderung die geänderteHelperdatei
nochmals Syntax geprüft: Exit0.
Kein Import-/Browser-/IDB-/Migrations-/Recovery-/CItest dadurch ausgeführt.
Die zwei opt-in-Blöcke wurden textuell entfernt und der resultierende Harness
exakt gegen seine vollständig gepinnten Originalbytes verglichen: gleich.
Gitblob-/Byteprüfungen der gespeicherten Kandidatdateien sind Integritätsnachweise,
kein nativePASS. Keine historischenTestzahlen addiert.

Die zwei erwarteten Produktlücken sind QUELLERWARTUNGEN, keine gemessenen
Testergebnisse. C1 nicht bloß starten, um bekannte Lücken ohne geänderte
Voraussetzung erneut rot zu sehen. Jede spätere Ausführung verlangt einen
konkreten freigegebenen exaktenKandidaten und zulässigenHost/Job.
Keine zusätzliche CI-/Runnerausführung oder Workflowänderung in diesem Auftrag.

Vorhandener möglicher Hosttyp aus dem früheren Nachweis:
Ubuntu24.04/Node22.23.4/PW1.56.1/Chromium141.0.7390.37.
BeendeterRun43421311524 ist kein wiederverwendbarer Hostzugang oder neuerC1-Beleg.
Die schon vorbereiteten regulären Localhost-/Harnessbefehle bleiben der Weg;
fürC1 zusätzlich ausschließlich den genanntenOpt-in setzen.
Originalharness zuerst innerhalb DIESER einen Ausführung; kein separater
Statistik-/Retry-/Full-CIzyklus aus der Kandidatenvorbereitung.

W1/W3/W4 und unbekannteRuntimepfade bleiben intern zu schließen.
N0-/C1-/N1-Ausführung und unabhängigerPrüfer/Zugang/Budget sind getrennt
von der jetzt erteilten v2-Kompatibilitätsentscheidung.
Kryptopaketfd3fce4b/Kandidat17a5a190/Tree44ff9c4d bleibt unverändert;
neuer Vertrag/C1 sind ungeprüfter Delta-/Impactgegenstand, kein Paketneubau
oder Selbst-/KIabschluss fürCR4/CR5.
A1/A2/format1/P/R/S/D/CAS/Raw-/Retry-/oncomplete-/Budget-/Originalschutz unverändert.
