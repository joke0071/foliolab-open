# FLH04 — Sync-Umhüllungs- und Autoritätsbytevertrag, Kandidat 1

13.11.2026 · work-25790c57cd29-20261113. Gepinnte Basis: FLH04
30567f35359341cf2cf5ab64c2fbfc8a4441ff79 / Tree
a097996124a89b85169a15b0e32de37e47993ba1. Ergänzt den
[Ausstellervertrag](FLH04_ENROLLMENT_ISSUER_CONTRACT.md), insbesondere Abschnitt 7.

**REVIEW_REQUIRED / NOT_IMPLEMENTED / NOT_AUTHORIZED.** Geschlossener
Kandidatenbytevertrag für Epochenumhüllung und Portfolioautoritätszustände;
keine Kryptofreigabe, kein Aussteller, keine Entsperrung. Alle unten gewählten
Suiteparameter sind ein gemeinsam zu prüfender Entwurf, keine aus dem Backup
geerbte Freigabe. Kein Umhüllungs-/Signaturcode vor unabhängigem Kryptoreview.
Der vollständige individuelle Revisionssignatur-/Framevertrag bleibt separat
offen; dieses Dokument erlaubt weder Encoder noch Send noch Apply.

## 1. Rollen, Schutzbereich und bewusste Grenzen

| Material / Rolle | Entstehung und erlaubter Gebrauch |
| --- | --- |
| Epochensekret E | 32 neue Bytes aus Plattform-crypto.getRandomValues; ausschließlich Sync-Epochenwurzel, lokal HKDF/non-extractable/deriveKey. Kein Backup-DEK, Passwort, Writer- oder Administratorschlüssel. |
| Portfolioautorität A | Neues ECDSA-P256-Paar direkt non-extractable erzeugen; privat nur sign, öffentlich verify. Signiert Autoritätszustände und Wrapgrants; signiert keine Finanzrevisionen als Writer. Privater Key wird weder exportiert noch umhüllt oder aus Passwort/E abgeleitet. |
| Individueller Writer W | Separates neues ECDSA-P256-Paar, privat non-extractable/sign, öffentlich verify. Seine Mitgliedschaft ist eine explizite Zeile im von A signierten Zustand. Kein Mitglieder-/Wrapgrant-Ausstellungsrecht. |
| Passwort / KEK | Nur der unten definierte Epochenwrapper. Besitz/Entschlüsselung ist Lesematerial, keine A-/W-Autorität, Zustimmung oder Entsperrung. Passwort/KEK niemals persistieren. |
| Lokale Linie | Neue lokale 16-Byte-ID; bleibt lokale Ankerbindung und wird beim Beitritt neu erzeugt. Kein Übernehmen einer fremden Installation, lokalen Linie oder Writeridentität aus der Hülle. |

Vertrauensannahmen: vertrauenswürdige App/Host/Plattform-WebCrypto und
kanonischer lokaler Store. Kein Schutz gegen feindlichen Same-Realm-Code,
vollständigen byteidentischen DB-/Geräteklon, Passworterraten offline oder
Verbergen neuer Zustände durch den Server. Zufallsgeräte-ID ist keine
Hardwareattestation. Keine automatische Administration auf Neugeräten.

Kandidat 1 unterstützt **keinen portablen privaten Autoritätskey und keine
passwortbasierte Autoritätswiederherstellung**. Autoritätsverlust ohne bereits
qualifiziert signierten Nachfolger ist ein geschlossener Blockierfall, kein
impliziter Seed-/PKCS8-/Backupimport. Wiederherstellung derselben Autorität
durch portable Schlüssel wäre ein neuer Vertrag samt unabhängiger Prüfung.

## 2. Einheitliche, eindeutig parsebare Bytes

Alle Formate sind Binärbytes; kein JSON.stringify als Signatur-/AADformat.
Definition C(domain; f1,...,fn): ASCII `FLSY` (46 4c 53 59), U16BE(1),
U16BE(Domainbytelänge), exakte ASCII-Domainbytes, U16BE(n), danach für jedes
Feld in festgelegter Reihenfolge U32BE(Feldbytelänge) gefolgt von Feldbytes.
Die Domain enthält nur ASCII-Kleinbuchstaben/Ziffern/Bindestrich, 1–48 Bytes.
Kein NUL, Terminator, Padding oder optionales Feld. Jede Tabelle legt n und
alle Längen fest; falsches n/Länge, Restbytes oder unbekannte Version: Reject.

- B16: exakt 16 zufällige Bytes für IDs; keine Nutzernamen. Bei lokaler
  Erzeugung alle in dieser Operation neu erzeugten IDs auf Gleichheit prüfen;
  Kollision verwirft die ganze Operation, keine Teilübernahme. Fremde IDs
  niemals normalisieren. Hexdarstellung nur lokal, lowercase/32 Zeichen.
- H32: exakt 32 SHA256-Bytes; kein Hextext im Binärformat.
- U64: exakt acht Bytes unsigned big endian; Zähler 1..9007199254740991.
  Null ausschließlich an ausdrücklich definierten Sentinelstellen; Überlauf
  blockiert. Keine Zeitstempel oder remote Version als Frischebeweis.
- U8: exakt ein Byte; nur explizit erlaubte Enumwerte.
- Z32: exakt 32 Nullbytes als fehlender Vorgänger ausschließlich an Genesen.
- Öffentliche P256-Keys: exakt 91 SPKI-DER-Bytes, Prefix
  `3059301306072a8648ce3d020106082a8648ce3d03010703420004`, danach X und Y
  je 32 Bytes. Punkt-/Kurvengültigkeit durch Plattformimport prüfen, Export
  muss exakt dieselben 91 Bytes liefern. Keine JWK/komprimierten Punkte,
  DER-Alternativen oder Kurvenfallbacks.
- Keyfingerprint = SHA256(C(`key-fingerprint`; U8(1), SPKI91)), wobei 1
  ECDSA-P256/SHA256 bezeichnet. Rollen werden in den signierten Kontexten
  gebunden, nie allein aus dem Fingerprint abgeleitet.
- Signatur: Plattform-ECDSA/P256/SHA256 über exakte TBS-Bytes, 64 Bytes
  unsigned r||s, je 32 Bytes, 1 <= r,s < Kurvenordnung. Kein DER,
  Vorhashen der Eingabe durch den Aufrufer oder Algorithmusfallback.
  Beide gültigen s-Varianten werden akzeptiert; keine selbst erfundene
  Low-S-Arithmetik. Identität signierter Objekte ist ihr TBS-Commitment,
  nicht die möglicherweise unterschiedliche gültige Signatur.

Text kommt ausschließlich im lokalen Passwortinput vor. Keine frei
erweiterbaren Text-/JSON-/Metadatenfelder in den unten definierten Hüllen.
Unbekannte Felder/Algorithmen/Versionen sind kein Upgradehinweis zum Probieren.

## 3. Konkrete Suite und Ressourcenregeln — nur Reviewkandidat

| Parameter | Exakte Kandidatenregel |
| --- | --- |
| Suite | U8(1): PBKDF2-HMAC-SHA256 → HKDF-SHA256 → AES256-GCM; keine Suiteverhandlung/Fallbacks. |
| Passwort | Exakte UTF8-Bytes einer wohlgeformten Unicode-Skalarfolge; 16..256 Skalare und höchstens 1024 UTF8-Bytes. Ungepaarte Surrogate Reject. Kein trim/NFC/NFKC/Casefold/BOMentfernen. Sichtbar gleiche unterschiedliche Folgen bleiben unterschiedlich; Bestätigung vergleicht Bytes. Länge allein beweist keine Entropie. |
| Passwortsalt S | 32 neue zufällige Bytes je neuer Umhüllungsoperation; mit früheren lokalen Wrapsalts vergleichen, bei Wiederholung abbrechen. Keine portfoliofeste oder Backupsalt-Wiederverwendung. |
| PBKDF2 | Exakt 600000 Iterationen, SHA256, deriveBits(256); die temporären 32 Ergebnisbytes als HKDF/non-extractable/deriveKey importieren und im finally überschreiben. Kein deriveKey-Ziel HKDF mit unbestimmter Schlüssellänge. KDF-Aufruf erst nach vollständiger Byte-/Limitprüfung und expliziter lokaler Aktion; nie automatisch je Cloudobjekt. |
| HKDF | SHA256, salt = SHA256(C(`wrap-kdf-salt`; portfolioId, epochId, wrapId)); info = exakte unten definierte AAD-Bytes. Ausgabe AES-GCM256/non-extractable/encrypt+decrypt. PBKDF2-Zwischenergebnis nicht als Cipherkey oder anderweitig verwenden. |
| AEAD | AES256-GCM, exakt 12 frische Zufallsbytes IV, tagLength128; Plattformrückgabe Ciphertext||16-Byte-Tag, exakt 48 Bytes für E32. AAD vollständig nach Abschnitt 4. |
| Einmaligkeit | Genau EIN encrypt-Aufruf pro neu abgeleitetem KEK; kein Retryencrypt, keine zweite Nachricht/Probe unter demselben KEK, kein persistierter KEK oder fortsetzbarer Cipherzustand. Frisches wrapId/S/IV für neue Operation; bekannte lokale gleiche Wrap-IDs/Salts/IVs blockieren. Unveränderte Übertragung wiederholt vorhandene Envelopebytes, verschlüsselt nicht neu. |
| Budget | Maximal 65536 Bytes je Objekt; 64 Mitgliedszeilen je Autoritätszustand; max.128 Zustände und 128 Wrapgrants je ausdrücklich gestarteter Prüfoperation. Überschreitung blockiert die ganze Operation; kein Abschneiden. Höchstens ein aktiver KDF je Controller, kein automatischer Passwort-/Salt-/Suiteversuch. |

600000 ist eine explizite Kandidatenwahl, kein hier bewiesenes angemessenes
Workfactor-, Mobilperformance- oder Passwortsicherheitsniveau. Insbesondere
PBKDF2 ist nicht memory-hard. Review muss Algorithmuswahl, Bedrohungsmodell,
Gerätebudget und Parameter gemeinsam beurteilen. Falls ungeeignet: neuer
Kandidat/Suite mit neuen Vektoren; keine stille Anpassung oder Freigabe.
Der lokal bekannte Saltvergleich verhindert keine fremden/manipulierten oder
vollständig geklonten Wiederholungen. Der Einmal-KEK-Entwurf und die
Zufallsannahmen brauchen unabhängige Prüfung; kein globaler Noncebeweis.

## 4. Epochenwrapper und authentisierte Wrapberechtigung

AuthorityStateId ist der Hash eines bereits gegen einen unabhängig gepinnten
Root geprüften Autoritätszustands nach Abschnitt 5. Er ist kein aus der Hülle
selbst neu gewonnener Vertrauensanker. Rootfingerprint bleibt die initial
bestätigte Identität; aktuellerAuthorityfingerprint benennt den Aussteller.

AAD = C(`epoch-wrap-aad`; folgende 15 Felder in exakt dieser Reihenfolge):

| Nr. | Feld | Bytes / Bedeutung |
| --- | --- | --- |
| 1 | suite | U8(1) |
| 2 | role | U8(1), ausschließlich epoch-read-material |
| 3 | portfolioId | B16 |
| 4 | epochId | B16 |
| 5 | rootAuthorityFingerprint | H32 |
| 6 | currentAuthorityFingerprint | H32 |
| 7 | authorityStateId | H32 |
| 8 | wrapLineId | B16, eigenständige Folge für Passwortwechsel |
| 9 | wrapId | B16, neue Umhüllungsoperation |
| 10 | wrapVersion | U64, Genesis1, sonst Vorgänger+1 |
| 11 | previousEnvelopeId | H32, Genesis Z32 |
| 12 | creatorDeviceId | B16, nur Herkunft, keine Empfänger-/Writeridentität |
| 13 | passwordSalt | 32 Bytes S |
| 14 | iterations | U32BE(600000), exakt vier Bytes |
| 15 | iv | 12 Bytes |

EnvelopeBytes = C(`epoch-wrap`; AAD, ciphertext48).
EnvelopeId = SHA256(C(`envelope-id`; EnvelopeBytes)).
Plaintext ist ausschließlich E32, kein JSON/Keycontainer/Passwort/Privatkey.
EpochCommitment = SHA256(C(`epoch-commitment`; portfolioId, epochId, E32)).
E hat 256 Zufallsbits; dies ist ein Materialcommitment, kein Finanzpayloadhash
und kein Passwortverifier. Prüfung nach Entschlüsselung vor Import; seine
Offenlegung und Wörterbuch-/Kollisionseigenschaften sind Reviewgegenstand.

Ein Passwortinhaber kennt E und könnte eine eigene korrekte Hülle bauen.
Deshalb ist AEAD allein **keine autorisierte Wiederherstellungshülle**:
WrapGrantTBS = C(`wrap-grant`; portfolioId, epochId, rootFingerprint,
currentAuthorityFingerprint, authorityStateId, wrapLineId, wrapVersion,
previousEnvelopeId, envelopeId), mit Längen B16/B16/H32/H32/H32/B16/U64/H32/H32.
Signierter Grant = C(`signed-wrap-grant`; WrapGrantTBS, signature64).
GrantId = SHA256(C(`wrap-grant-id`; WrapGrantTBS)). Der Aussteller ist genau
die aktuelle geprüfte Portfolioautorität dieses Zustands, niemals W.

Wrapgrant und Hülle müssen in jedem Feld übereinstimmen. Grant vor KDF prüfen;
der Zustand muss die Epoche/Commitment als aktuell oder explizit history-only
führen. Kandidat1 führt nur eine aktive Epoche pro Zustand; vergangene Epochen
werden nur aus ihren verifizierten historischen Zuständen history-only gelesen.
Eine höhere Wrapversion ersetzt keinen bekannten Vorgänger-/Grantnachweis.
Gleiche Wraplinie+Version mit verschiedenen TBS/EnvelopeId = Konflikt; beide
Originale erhalten. Gleiches TBS mit anderer gültiger Signatur ist semantisch
dasselbe Objekt; falsche Signatur blockiert den gelieferten Datensatz.

Keine Zirkularität: Autoritätszustand enthält **keine** Envelope-/Grant-ID;
Envelope bindet den fertigen StateId, nach fertiger Envelope signiert A den
Grant. Atomarer lokaler Anker bindet anschließend alle drei exakten Bytesätze.
Eine fehlende Stufe ist ein unvollständiger gesperrter Zustand, kein Fallback.

## 5. Autoritätszustand, Mitgliedschaft und Schlüsselwechsel

MemberRow = C(`writer-member`; deviceId B16, writerSPKI91, writerFingerprint
H32, role U8(1), memberId B16). role1 bedeutet nur Writer dieser aktiven
Epoche. Fingerprint aus SPKI erneut berechnen. Mitgliederliste = U16BE(m)
gefolgt von je U32BE(Rowbytelänge)||Row; m=1..64, sortiert lexikografisch nach
den 32 Fingerprintbytes. Doppelte Fingerprints, deviceIds oder memberIds
blockieren. A und W müssen verschiedene öffentliche Keys haben; kein in der
geprüften Kette als A verwendeter Key darf W werden oder umgekehrt. Ein neuer
Zustand enthält die vollständige Liste, keine implizite Merge-/Patchsemantik.

StateTBS = C(`authority-state`; folgende 11 Felder):

| Nr. | Feld | Bytes |
| --- | --- | --- |
| 1 | algorithm | U8(1), ECDSA-P256/SHA256 |
| 2 | portfolioId | B16 |
| 3 | rootAuthorityFingerprint | H32 |
| 4 | stateVersion | U64 |
| 5 | previousStateId | H32, Genesis Z32 |
| 6 | operationId | B16 |
| 7 | transition | U8: 1 bootstrap, 2 membership, 3 authority-rotation, 4 epoch-rotation |
| 8 | currentAuthoritySPKI | 91 Bytes |
| 9 | activeEpochId | B16 |
| 10 | epochCommitment | H32 |
| 11 | members | oben definierte vollständige Liste |

StateId = SHA256(C(`authority-state-id`; StateTBS)).
SignedState = C(`signed-authority-state`; StateTBS, predecessorSignature,
currentSignature). Die Signaturfelder sind je 64 oder ausdrücklich 0 Bytes:

- Bootstrap: version1/Z32/transition1; rootFingerprint entspricht aktuellem
  Keyfingerprint; predecessorSignature leer, currentSignature64 vom neuen A.
  Vertrauen entsteht nur durch tatsächliches lokales Pinning dieses Roots,
  niemals allein durch diese Selbstsignatur oder Clouddatei.
- Membership: version=Vorgänger+1/transition2, gleicher A/Root/Epoche/Commitment;
  vollständige neue Mitgliederliste, predecessorSignature leer,
  currentSignature64 vom unveränderten A. Entfernen einer Mitgliedschaft
  widerruft künftiges Recht nach akzeptiertem Zustand, löscht keine Historie
  und entzieht nicht bereits bekanntes E. Aufnahme braucht frischen lokal
  bewiesenen Writerkey und unabhängigen Zustimmungs-/Beitrittsweg.
- Authority-rotation: transition3, Root/Epoche/Commitment/Mitglieder unverändert,
  neuer A; predecessorSignature64 von altem A und currentSignature64 von neuem
  A über dieselben StateTBS. Kein Rollenwechsel eines vorhandenen Writers.
- Epoch-rotation: transition4, A/Root unverändert, neue epochId und neues E32
  samt Commitment; vollständige bewusst bestätigte verbleibende Liste,
  predecessorSignature leer, currentSignature64 von A. Neue Grants/Hüllen
  binden exakt den neuen StateId. IDs unverändert übernommener Mitglieder
  bleiben identisch; neu aufgenommene Mitglieder erhalten frische IDs/Keys.

transition2 darf die Mitgliederliste auch identisch bestätigen (kein
Frischebeweis), verändert aber weder Epoche noch A. Andere Feldänderungen in
einer Transition blockieren. Kombinierte A-/E-/Mitgliederänderung erfordert
die definierten einzelnen verknüpften Zustände, keinen Mischtransitiontyp.
Jeder Vorgänger muss vollständig bis zum gepinnten Root geprüft vorliegen;
genau Portfolio/Root/version+1 prüfen. Geschwisterzustände sind ein Konflikt,
auch bei gleichen Mitgliedern. Kein LWW/Mehrheits-/Zeitstempelentscheid.

Lokal akzeptierter StateId und Wraplinienköpfe sind Rollbackfloors, nicht nur
höchste Zahlen. Historische Zustände erlauben historische Prüfung, niemals
Rücksetzen aktueller Rechte. Vollständigkeit/Frische gegen einen versteckenden
Server ist hier nicht gelöst: ohne separaten qualifizierten aktuellen
Autorisierungsnachweis bleiben Send/Apply gesperrt. Keine Aussagen über
individuell signierte Finanzrevisionen aus diesen Mitgliedschaftsbytes.

## 6. Weiterhin gesperrter Erzeugungsweg — Vertrag, noch kein Code

Nur für explizit ausgewählte neue Linie: lebender syncEnrollmentRequired:true
Portfolio-Record, Outbox UND Anker per count strikt abwesend. Vorhandener
format1/prepared-Anker, auch null/undefined, bleibt unverändert und blockiert.
Kein Upgrade, Austausch, Löschen, keyexport oder automatische Neuanlage.

1. Vollständigen Portfolio-/Presencepreimage atomar readonly lesen. Privater
   Enrollmentcontroller bindet wirkliche lokale Auswahl, Passwortbestätigung
   und Operation; keine öffentlichen Callerkeys/IDs/verified-/unlock-Flags.
2. Neue line/portfolio/epoch/device/member/operation/wrapLine/wrapId-B16 lokal
   erzeugen; A und W getrennt direkt non-extractable erzeugen. Öffentliche
   Keys kanonisch exportieren, Fingerprints bilden; frisches E32 erzeugen.
3. BootstrapStateTBS mit E-Commitment und lokalem Writer bauen, signieren und
   sofort öffentlich nachprüfen. Unabhängiges lokales Rootpinning ist eine
   spätere Zustimmungs-/UIabnahme, keine Wirkung dieses Selfchecks.
4. Aus ursprünglichem E32 den fertigen Wrapper nach Abschnitt 3/4 erzeugen;
   danach Grant bauen/signieren/nachprüfen; danach E32 lokal non-extractable
   als HKDF importieren. **Umhüllen VOR Roharraylöschung**, kein wrapKey des
   importierten HKDF-Key und keine extractable-Umstellung.
5. Alle temporären veränderbaren E-/Passwortbyte-/Zwischenmaterialpuffer in
   finally überschreiben, auch bei Signatur/KDF/Import/Commitfehlern. Passwort
   als JS-String und Plattformkopien sind nicht beweisbar löschbar; keine
   universelle Speicherlöschzusage. Keine Geheimnisse loggen/zurückgeben.
6. EIN records-readwrite-Commit vergleicht vollständiges Portfolio und count-
   Abwesenheit von Outbox/Anker erneut. Kein Cryptoawait darin. Nur neuen
   Anker schreiben, keinerlei Portfolio-/Sperren-/Outboxmutation; Ergebnis
   erst oncomplete, schlüssel-/digest-/finanz-/settingsfrei und ausdrücklich
   enrollmentAuthorized:false. Kein Appaufruf in diesem Kandidaten.

Neues gespeichertes Ankerformat wäre **format2/status prepared-locked** im
bestehenden records/sync-local-anchor-v1-Namespace, keine DB-/Store-/Versions-
änderung. Der historische Speicherkeyname ist kein Wireformatversprechen.
Geschlossenes Schema: format,status,lifecycle(1), lineId,portfolioId,epochId,
deviceId,operationId,localRevision,portfolioDigest, authorityPrivateKey,
authorityPublicKey,writerPrivateKey,writerPublicKey,epochKey, authorityStateBytes,
authorityStateId,epochEnvelopeBytes,epochEnvelopeId,wrapGrantBytes,wrapGrantId.
IDs/Hashes als exakte Uint8Arrays; Zähler sichere Integer; andere Felder Reject.
Keine raw/settings/Passwörter/KEKs/Rohgeheimnisse im Anker. Vollständiger lokaler
Portfolio-Preimage bleibt privat im Controller und sein Digest nur lokal.

Alle drei Bytesätze speichern exakte kanonische, frisch selbstgeprüfte Bytes;
IDs jeweils erneut aus Bytes berechnen. Envelope enthält kein lokales lineId
und keine wiederverwendbare Writeridentität. Kein öffentlicher Key-/Receipt-
Export-/Resume-/Unlockeintritt. Format2 wird hier nur spezifiziert, NICHT
implementiert; bestehender format1-Code bleibt unverändert.

## 7. Persistenz, Schlüssel-CAS und Antwortverlust

Vergleichbare Envelopebytes lösen **nur den Bytepreimagevergleich**, nicht
das CryptoKey-Race. Auf echten Page-Reopen A und W ausschließlich aus IDB
lesen; je frische 32-Byte-Challenge mit Kontext signieren und gegen gepinnte
SPKI prüfen. Challengebytes = C(`local-key-challenge`; role U8(1=A,2=W),
lineId,portfolioId,epochId,operationId,authorityStateId,epochEnvelopeId,nonce32).
Damit keine gespeicherte alte Signatur oder falsche Rolle wiederverwendbar.

E-Key-Kohärenz separat: nach expliziter Passwortaktion Envelope authentisiert
entschlüsseln/Commitment prüfen, temporär E als HKDF importieren; beide Keys
über HKDF-SHA256 mit salt=frischen32Challengebytes und info=C(`local-epoch-key`;
lineId,portfolioId,epochId,authorityStateId,epochEnvelopeId) zu temporärem
HMAC-SHA256 mit expliziter length256/non-extractable/sign ableiten. Beide
signieren exakt C(`local-epoch-challenge`; lineId,portfolioId,epochId,
operationId,authorityStateId,epochEnvelopeId,frische32Challengebytes);
beide vollständigen 32-Byte-Tags müssen
bytegleich sein. Kein Export des gespeicherten
Keys, keine Ableitung für Frame-/Wrapzwecke, keine Mitgliedschaft daraus.

Nach Cryptoawait alle bytevergleichbaren Anker-/Portfolio-/Outboxpreimages
atomar erneut prüfen; Uint8Arrays durch Länge+jedes Byte, nicht JSON oder
Objektidentität. **Der Austausch eines CryptoKeys zwischen Challenge und
Commit bleibt trotzdem ungelöst.** Es gibt keine Kryptoprüfung innerhalb der
IDB-Transaktion. Vor tatsächlicher Autorisierung braucht der Aussteller einen
separat reviewten exklusiven Schreiber-/Keyslot-Lifecyclevertrag und native
Keyslot-Racebelege. Neue Lifecycle-/Envelope-IDs allein sind kein Beweis,
dass ein anders gesetztes Keyobjekt nicht unter denselben Metadaten steht.
Dieser Entwurf gibt daher ausdrücklich keinen autorisierenden Commit frei.

Antwortverlust vor oncomplete: Ausgang anhand gespeicherter operationId und
exakter Bytes bestimmen; nicht blind neu erzeugen. Nach Commit: identische
persistierte Operation ist prepared-locked, kein erneuter Erzeugungserfolg,
keine automatische Entsperrung. Neue Seite benötigt neue Zustimmung und
frischen Keybesitznachweis. Same-CAS-Portfolioänderung, Restore, Outbox-/
Ankerpräsenzwechsel oder unbekannter Lifecycle: blockieren/Original erhalten.
Zwei Neuvorbereitungen höchstens ein Commit; Quota/Abort vor Commit vollständig
unverändert. Das ist ein Sollvertrag, kein durchgeführter nativer Beleg.

## 8. Passwortwechsel, Recovery und Rotation

| Vorgang | Verbindlicher Kandidatenpfad / sichere Grenze |
| --- | --- |
| Passwortwechsel | Alte Envelope+Grant+Kette gegen lokalen Floor prüfen; altes Passwort entschlüsselt E32, Commitment prüfen; neues Passwort erzeugt neue wrapId/S/IV/Version+1 mit previousEnvelopeId. Gleiche wrapLine/Portfolio/Epoche, fertiger neuer Grant von aktueller A. Kein nachträglicher HKDF-wrapKey. Ohne altes Passwort oder anderen qualifizierten E-Zugang blockiert; ein lokaler non-extractable-Key allein genügt nicht. |
| Passwortwechsel ohne A | Kann keinen gültigen neuen Grant ausstellen, daher blockiert. W oder Passwortbesitz ersetzt A nicht. Kein unsignierter Ersatzwrapper. |
| Alte Passwörter | Alte verschlüsselte Originale/Grants bleiben erhalten und können weiterhin E offenlegen. Passwortwechsel entzieht kein bereits bekanntes Geheimnis und ist keine Kompromissbehebung. Bei Kompromiss frische Epoche und sichere Neuverteilung erforderlich. |
| Beitritt / Writerverlust | Neue lokale Linie/device/member/W, unabhängig bestätigter Root/aktueller Zustand; aktuelle A autorisiert Aufnahme und ggf. Widerruf verlorener W-Mitgliedschaft. Passwort entschlüsselt nur E. Echter Bindungskanal/Zweigeräteablauf bleibt extern ungeprüft. Kein Writerprivatkeytransfer. |
| A-Schlüsselwechsel | Lebender alter A und frisch lokal bewiesener neuer A signieren Transition3; erst exakte Kette/Floors akzeptieren. Alter privater A bleibt bis qualifiziertem Commit/Antwortverlustabschluss lokal erhalten; kein automatisches Löschen. Kein Schlüsselwechsel allein aus neuer Selbstsignatur. |
| A-Verlust | Ohne bereits qualifizierte Nachfolgekette kein Fortführen derselben Autorität. Finanzbackup bleibt separat nutzbar; neue unverbundene Linie nur nach ausdrücklicher Entscheidung, alte Originale bewahren. Kein erfundener Rescue-/Seed-/Passwortpfad. |
| E-Kompromittierung / Rotation | Transition4 mit frischem E/epochId, neue Hüllen/Grants und bewusste verbleibende Mitglieder; alte Epochen history-only. Kein neues E unter einem widerrufenen Mitglied bekannten Passwort verteilen; neue Zugangsdaten/sicherer Übergabekanal nötig, sonst blockiert. Laufende Outbox/alte Frames erhalten und sperren, keine stille Umschlüsselung/Neubindung an neue CAS. Gesamter Mehrgeräte-/Outboxübergang muss vor Aktivierung separat qualifiziert werden. |
| Crash/Antwortverlust beim Wechsel | Vollständigen alten und neuen Operations-/State-/Envelopebezug atomar binden; nur exakten nachgewiesenen Commit wiedererkennen. Unbekannter Ausgang bleibt gesperrt. Eine höhere Nummer/HTTP200 ist kein Commitbeweis. Keine gespeicherte Zustimmung erneut nutzen. |
| Normales Backup/Restore | Bestehende Formate/APIs unverändert; keine A-/W-/E-/Anker-/Grantportierung hinzufügen. Restore invalidiert alte lokale Bindung, erhält Originalanker und Sperre. Lesbare Sync-Hülle ist kein normales Finanzbackup. |

Kein Public-Wirefeld verspricht globale Widerrufsfrische. Aktueller Serverstand
und konkurrierende Zustände benötigen den späteren authentisierten Graph-/
Remoteherkunftsvertrag. Fehlende oder geforkte Kette blockiert den gesamten
Vorgang, nicht nur einen problematischen Eintrag.

## 9. Review- und Abnahmeauftrag vor Code

Unabhängiges Kryptoreview muss den **exakten Commit dieses Kandidaten** und
seine Bytevektoren beurteilen: KDFwahl/Workfactor, Passwortkodierung,
Domaintrennung, Einmal-KEK/IV-Entropie-/Klonannahmen, E-Commitment, HMAC-
Kohärenzprobe, SPKI/ECDSAkodierung und Malleabilität, Grant-/Stategraph,
Rollback-/Widerrufsgrenzen, A-Verluststrategie und fehlende Keyslot-Racelösung.
Eigene Sourceprüfung oder zwei gleichlautende Vektorprogramme ersetzen das
nicht. Reviewbefunde als neue Kandidatenrevision erhalten, nicht still ändern.

Nach Freigabe zunächst nur Abschnitt6 als weiterhin gesperrte Neuvorbereitung,
ohne Appintegration oder Entsperrung; erforderliche Tests vor dem Code festlegen:

- Für jede feste Feldposition falsche Länge/Wert/Version, Restbytes,
  unbekannte Domains; Canonical-SPKI/Signaturfehler und cross-role/domain.
- Manipulation jedes AAD-/Grant-/Statefeldes; falsches Passwort, verändertes
  Ciphertext/Tag, andere Epoche/A/Portfolio/Vorgänger, falscher E-Commitment.
- Grant eines Writers/Passwortinhabers scheitert; unbekannter selbstsignierter
  Root bleibt unvertraut; gültige s-Alternative erzeugt keine zweite StateId.
- KDF erst nach Grenzen/Grantprüfung; keine automatischen Passwortversuche,
  wiederholte Zufallssalts/IDs/IVs mit injizierter RNG blockieren; Cipherfehler
  startet keinen encrypt-Retry; Rohpuffer auch auf Fehlerwegen überschrieben.
- Native IDB/Persistenz/Page-Reopen A/W/E, ausgetauschte Keys/gleiche
  Metadaten, je Cryptoawait vollständige Portfolio-/Anker-/Outboxraces;
  zwei Schreiber, Crash/Antwortverlust und echte Abort/Quota.
- Alte prepared-format1/null/undefined bleiben unverändert/gesperrt;
  Restore/Edit/Tombstone/Recovery sowie alle A1/A2-Sperren erhalten.
- Passwortwechsel/Rotation/Recovery und Zweigeräte-/Offlinekonfliktpfade
  gegen unabhängige Sollzustände, kein verlorenes Original/Writertransfer.

Keine App-/Browser-/Kryptotests in diesem Dokumentationsschnitt.
Die [festen Bytevektoren](FLH04_SYNC_WRAP_AUTHORITY_BYTE_VECTORS.json) prüfen
nur Kodierung und SHA256. Zwölf Werte durch getrennte temporäre Python- und
Node-Serializer bytegleich rekonstruiert: Keyfingerprints, E-Commitment,
Memberrow/-liste, StateTBS/-ID, AAD, Dummyenvelope/-ID und GrantTBS/-ID.
Manueller Grammatikanker C(x;)=464c535900010001780000. Ein begrenzter strikter
Parser akzeptiert die fünf Strukturen Row/State/AAD/Envelope/Grant und weist
zusätzliche/fehlende Bytes, falsche Domain/Feldanzahl/Feldlänge ab. Node24.22.1;
beide Programme vom selben Owner, KEIN unabhängiges Kryptoreview. Die bewusst
öffentlichen synthetischen E-Bytes und Dummycipherbytes sind keine nutzbaren
Schlüssel/AEADausgaben; es gibt keine Signaturen oder importierbare Hülle.
Keine AEAD-/KDF-/Signatur-/IDB-/Autoritäts-/Sicherheitsabnahme daraus. Keine
historischen Tests wiederholt/addiert, keine neue CI/Wallet-/Releaseabnahme.

Byteumfang/ungekeyter SHA256 der Strukturbytes (kein Signatur-Prehash):

| Struktur | Bytes | SHA256 |
| --- | ---: | --- |
| StateTBS | 519 | 79cafd25b7975c5ef4045f145e1a5a9f35f64be2990ae1c49d25db74b248eb0f |
| AAD | 350 | 70e9ac686e761ce2a7ed77da78aa0db64124c685c721928f9d6ae201dd2d72f5 |
| Dummyenvelope | 426 | 8d4a59b7cf529d3b0f891afff68c4e647641b82a3d49af8f6daa3223dcde1346 |
| GrantTBS | 272 | 62f86176d43dd94fcf7f29a7318acb00900b4348798543c896978be73a61a866 |

**Weiter offen:** unabhängiges Kryptoreview, vollständige Keyslot-Racelösung,
native Schlüssel-/UIzustimmung, individuelle Revisionssignaturbytes,
vollständige Snapshot/v5/History/Beleg-/FinanzApplyvalidierung, Encoder/Nonce-
Framebudget, Transport/Frische/Graph/KonfliktUI und alle internen/externen
Pflichtgates. A1/A2 unverändert: applyAuthorized=false, Storage.confirm
gesperrt, remoteAnchor/acknowledgedLocalRevision=null. Outbox INTERN
UNQUALIFIZIERT, FLH04 NICHT DONE, N-DRIVE BLOCKED_EXTERNAL mit internem Rest.
Mainrun43332355188 FAILURE/UrsacheUNKNOWN/RELEASE_GATE_OPEN unverändert.

## 10. Primärquellen und begrenzte Aussage

Am 13.11.2026 geöffnet: [W3C WebCrypto](https://www.w3.org/TR/webcrypto/)
(aktuell als Level2-Draft ausgeliefert), [RFC5869](https://www.rfc-editor.org/rfc/rfc5869),
[RFC8018](https://www.rfc-editor.org/rfc/rfc8018),
[NIST SP800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final).
Diese Quellen beschreiben die verwendeten Primitive/APIsemantik, bestätigen
weder diesen eigenen Protokollentwurf noch die Kandidatenparameter oder
reale Plattformpersistenz. Der eigenständige Backup-Leseabgleich bleibt
erledigt, seine Module unverändert; kein neues Wiederverwendungsreview.
