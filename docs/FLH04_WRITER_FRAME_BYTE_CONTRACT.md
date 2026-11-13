# FLH04 — individuelle Writerhülle, Bytekandidat 1

13.11.2026 · work-5e7228746eee-20261113. Ausgang FLH04
7ed0bbe09af03f52603b4e8e9ca8fedfada1d2cf /
Tree 6ef292b10caa2956791f0fe157137b31a3da2d00.
**REVIEW_REQUIRED / NOT_IMPLEMENTED / NOT_AUTHORIZED.**

Ergänzt [Ausstellervertrag Abschnitt 5](FLH04_ENROLLMENT_ISSUER_CONTRACT.md)
und [Autoritätsbytekandidat](FLH04_SYNC_WRAP_AUTHORITY_BYTE_CONTRACT.md).
Nur Vorcodevertrag; kein Signatur-/Encoder-/Aussteller-/Umhüllungs-/Entsperrcode.
Gruppenframe v1 und bestehende Verifier-/Outbox-APIs unverändert.
Unabhängiges Kryptoreview am exakten gemeinsamen Kandidaten vor Kryptocode.
Die ursprünglichen Wrapperparameter werden hier weder geändert noch freigegeben.

## 1. Geschlossene Entscheidung und verbleibende Grenzen

Eine neue **äußere Writerhülle Version 2** bindet genau einen vollständigen
unveränderten Gruppenframe v1 an einen individuell autorisierten Writer W.
Die Signatur wird über Header UND exakte verschlüsselte Framebytes gebildet.
Damit liegt kein Zirkel zwischen Signatur und verschlüsseltem Framedigest vor:
Gruppenframe fertigstellen → Writer-TBS bilden → signieren → Hülle bilden.
Der entschlüsselte vollständige Descriptor einschließlich Parent und exaktem
Snapshot liegt bereits unter dessen AEAD; erst alle Prüfungen zusammen dürfen
einen neuen individuellen Verifierbeleg ergeben.

Die Signatur wird nicht über ein bloßes payloadDigest, deviceId, einen frei
reserialisierten Descriptor oder eine Receipt gelegt. Kenntnis von E/Passwort
oder eine gültige Autoritäts-Signatur ersetzt die separate W-Signatur nicht.
A darf nicht als W auftreten. Keine Geräteattestation oder Nichtabstreitbarkeit
behaupten; Annahmen zu vertrauenswürdigem Realm/Host und vollständigem Klon
aus dem Autoritätsvertrag bleiben unverändert.

Dieser Entwurf schließt weder aktuelle Autoritätsfrische noch Enrollment,
Keyslot-CAS, Persistenz oder Rotation. Ohne qualifizierten aktuellen
Autoritätszustand bleiben Send/Apply gesperrt. Alte Frames können historisch
gültig sein, ohne aktuell autorisiert zu sein.

## 2. Bytes und Größen vor jedem Cryptoaufruf

C(domain; fields) ist EXAKT die FLSY/U16BE(1)/Domain-/Feldanzahl-/U32BE-
Längengrammatik aus Abschnitt 2 des Autoritätsbytevertrags. Die 1 darin ist
die Containergrammatikversion; die Writerhülle trägt separat Version 2.
B16/H32/U8, kanonische P256-SPKI91, Fingerprint und ECDSA-P256/SHA256
mit signature64=r||s und zulässigen beiden s-Varianten gelten unverändert.
Kein DER-/JWK-/JSON-/Base64-Fallback, Vorhashen vor subtle.sign oder
eigene Low-S-Arithmetik.

WriterHeader = C(`writer-frame-header`; folgende 8 Felder):

| Nr. | Feld | Exakte Bytes |
| --- | --- | --- |
| 1 | writerEnvelopeVersion | U8(2) |
| 2 | signatureAlgorithm | U8(1), ECDSA-P256/SHA256 |
| 3 | portfolioId | B16 |
| 4 | epochId | B16 |
| 5 | rootAuthorityFingerprint | H32 |
| 6 | authorityStateId | H32 |
| 7 | memberId | B16 |
| 8 | writerFingerprint | H32 |

WriterTBS = C(`writer-frame-tbs`; WriterHeader, GroupFrameBytes).
SignedWriterFrame = C(`signed-writer-frame`; WriterHeader, GroupFrameBytes,
signature64). Signatur exakt über WriterTBS, niemals über dessen vorab
berechneten Hash. Der TBS enthält keine Signatur.

GroupFrameBytes sind die exakten ASCII/UTF8-Bytes des bestehenden kanonischen
v1-Frames, ohne BOM/Restbytes/Zeilenende. Keine Verschlüsselung/Normalisierung
beim Wrap oder Retry. Lokale Referenz:
WriterObjectId = SHA256(C(`writer-frame-id`; WriterTBS)).
Diese ID und SHA256 der vollständigen SignedWriterFrame-Bytes sind nur lokale
Belege, keine Dateinamen, Remote-Suchindizes oder Frischebeweise. Die zwei
unterschiedlichen Digests werden niemals verwechselt.

Harte gemeinsame Obergrenze: **15.000.000 Bytes für die gesamte Writerhülle**,
einschließlich Header/Signatur/Längen; kein Erhöhen bestehender Framelimits.
Header ist exakt 207 Bytes; die äußere Hülle hat 312 Bytes Overhead gegenüber
GroupFrameBytes. Daher GroupFrameBytes höchstens 14.999.688 Bytes UND alle
bisherigen v1-Limits, insbesondere Ciphertext höchstens 7.400.000 Bytes.
Vor Allokation/Hash/Signatur/Decrypt jede Länge gegen verbleibende Bytes und
das Gesamtbudget prüfen. Restbytes/unbekannte Domain/Feldanzahl/Version,
Überlauf, abgeschnittenes Feld oder falsche feste Länge: gesamte Eingabe Reject.

Die Writerhülle ist ein Binärobjekt; kein hexverdoppelnder neuer Texttransport.
Ein späterer Transportadapter muss diese exakten Bytes verlustfrei übertragen.
Bis zu dessen Qualifikation kein Upload. Höchstens ein Frame pro
Verifieraufruf; Graph max.2048 Knoten und bisherige Outbox128Einträge/
30MillionenFramezeichen bleiben zusätzliche, keine ersetzten Grenzen.
Ein nativer Speicher-/Ressourcenvertrag für Binärhüllen in der Outbox ist
noch offen; diese Spezifikation ändert kein bestehendes Speicherschema.

## 3. Autorisierung und vollständige Prüfreihenfolge

1. Gesamte äußere Hülle strikt begrenzen/parsen; abgetrennte immutable
   Bytekopien vor Await. Header muss mit lokal gepinntem Portfolio, Root und
   ausdrücklich gewählter aktiver oder history-only Epoche übereinstimmen.
   Kein Schlüssel-/Rootwechsel durch Remoteheader.
2. authorityStateId gegen vollständige signierte Kette zum gepinnten Root
   prüfen: keine fehlenden Vorgänger, Forks, Rollbacks oder ungeprüften
   Selfsigned-Roots. State hat dieselbe aktive Epoche. Exakt eine MemberRow
   mit memberId und writerFingerprint, role1; Fingerprint aus ihrer SPKI
   erneut berechnen. Autorität und Writer nach bestehender Rollentrennung.
   SPKI/Key kommt aus geprüftem Zustand, nicht aus der Framehülle.
3. WriterTBS aus EXAKTEM Header und EXAKTEN GroupFrameBytes bilden und
   signature64 mit diesem W nachprüfen. Struktur-/Rollen-/Bindungsfehler
   blockieren vor teurem Decrypt. Keine alternative W-/A-/E-/Suite-Suche.
4. Gruppenframe im lokalen Portfolio-/Epochenkontext vollständig nach dem
   unveränderten v1-Vertrag prüfen: kanonische äußere/innere Arrays,
   HKDF/AEAD, UTF8, vollständiger siebenfeldriger Descriptor und exakter
   Snapshot-SHA256. Ein alter Gruppenreceipt allein ist kein neuer
   individueller Receipt.
5. Die B16 portfolioId/epochId haben im v1-Kontext ausschließlich ihre
   lowercase32-Hexdarstellung. Descriptor.portfolioId stimmt damit exakt
   überein; Descriptor.deviceId exakt mit lowercase32-Hex der geprüften
   MemberRow.deviceId. Keine Normalisierung/Trunkierung fremder IDs.
   Revision-/Parent-ID und Generation bleiben exakt nach Descriptorformat1;
   kein neuer Decimal-/Zähler-/Descriptorformatwechsel.
6. Snapshot-Allowlist/Finanz-/Journal-/UNKNOWN-FX-/Historyvalidierung und
   vollständige individuelle Parentgraphprüfung nach Abschnitt4. Eine
   gültige Signatur macht unsupported v5/Belege/History nicht zulässig.
7. Ein späterer privater neuer Verifier darf erst danach eine flüchtige,
   nicht serialisierbare Capability ausstellen. Sie bindet exakte äußere
   Bytes, WriterObjectId/Transportdigest, Descriptor, plain, State/Member/W,
   Portfolio/Epoche und historischen/aktuellen Prüfmodus. Keine öffentliche
   Receipt-Mint-/verified:true-API und kein Ableiten aktueller Rechte aus
   history-only. Das ist Sollvertrag, keine implementierte API.

Header legt keine globale Frische fest. Ein kompletter abgefragter Graph oder
gültiger State mit hoher Nummer beweist nicht, dass der Server keinen neueren
Widerruf versteckt. Aktueller Herkunfts-/Frischeadapter weiterhin unqualifiziert.
Alle Stufen fail closed, kein partieller Verifierbeleg oder Finanzschreibzugriff.

## 4. Parent, Identität, Widerruf und Wiederholung

Jeder Knoten der vollständigen beobachteten Elternhülle braucht selbst die
individuelle Prüfung dieses Vertrags oder einen separat qualifizierten,
lokal gepinnten historischen Vertrauensanker. Eine reine Gruppenrevision
wird nie still zum individuell autorisierten Vorfahren.

ParentId benennt den exakt eindeutig geprüften Vorgängerknoten im selben
Portfolio. Parent null ausschließlich Generation1; sonst Generation exakt
Parent+1 nach bestehendem BigInt-Vertrag. Fehlender Parent/Zyklus/mehrere
Wurzeln/fremdes Portfolio: blockiert oder vorhandener Konfliktstatus;
keine automatische Rootwahl. Parent.deviceId darf bei einem anderen
autorisierten Writer liegen; kein Zwang zur Einwriterkette.
Gleiche Revisions-ID mit unterschiedlichem Descriptor, Writerkontext oder
GroupFrameBytes ist **Identitätskonflikt**, auch bei zwei gültigen Signaturen.
Beide Originale erhalten; kein Gewinner nach Zeit/Generation/Fingerprint.
Gleicher vollständiger WriterTBS mit anderer gültiger ECDSA-Signatur ist
semantisch dasselbe Objekt, aber andere Transportbytes.

Ein Commit erzeugt genau einen gespeicherten sendbaren Byteversuch. Retry
sendet exakt diese äußeren Bytes. Neu signieren oder neu verschlüsseln gilt
nicht als Retry/Bestätigung des bisherigen Versuchs. Der bisherige interne
Outboxvertrag akzeptiert für dieselbe Revisions-ID keinen veränderten Frame;
dieser Kandidat erweitert das nicht. Signaturalternativen sind kein Grund,
einen exakten Remote-Readbackvergleich zu lockern.

Neu eintreffende Revision unter altem Mitgliedschaftsstate darf keinen
Widerruf umgehen. Ohne separat qualifizierten Nachweis aktueller Autorisierung
kein neuer aktiver Send/Apply. Bereits lokal verbindlich akzeptierte Historie
bleibt erhalten; Signatur/Uhrzeit allein beweist nicht, dass eine bislang
unbekannte Revision vor Widerruf entstand. Autoritätsforks blockieren auch
bei gleicher Memberliste. Offline-Finanzarbeit bleibt lokal möglich; alte
Outboxoriginale bleiben gesperrt, keine stille Aktualisierung von State/Key/CAS.

Epochenübergreifende Parentübergänge sind in diesem Kandidaten NICHT
aktiviert: qualifizierter gemeinsamer Rotations-/Outbox-/Graphvertrag fehlt.
Historische andere Epochen nur explizit history-only, keine automatische
Reaktivierung. Normales Backup/Restore portiert keine A-/W-/Syncidentität.

## 5. Sichtbare Metadaten und Kompatibilität

Der unverschlüsselte Header offenbart opake Portfolio-/Epoch-/Root-/State-/
Member-/Writerkennungen und damit Verknüpfbarkeit. GroupFrameBytes zeigen
wie bisher Salt/Nonce/Cipherlänge. Descriptor, Snapshot und payloadDigest
bleiben im v1-Ciphertext; sie werden NICHT als zusätzliche klare
Signaturfelder oder Remote-Namen veröffentlicht. Headerprivacy und
Verknüpfbarkeit sind ausdrücklich Gegenstand des unabhängigen Reviews,
keine bereits akzeptierte Produkteigenschaft.

Writerhülle2 ist ein ausdrücklich neuer Typ. Der bestehende v1-Decoder
bleibt unverändert Gruppenauthentisierungsprototyp. Seine Ergebnisse,
gespeicherte Format1-Outboxen und prepared-locked-Anker werden weder
adoptiert noch hochgestuft. Kein Fallback bei fehlender/ungültiger
Writerhülle, keine Migration/zweiteDB/DBVersionsänderung. Ein zukünftiger
Adapter muss neue Receipt-/Storagebindung separat qualifizieren; nicht
die alte Verifierfunktion mit optionalem verified-Flag erweitern.

## 6. Review und notwendige Gegenproben vor Implementierung

Gemeinsamer unabhängiger Reviewauftrag: exakter Wrapper-/Autoritätskandidat
und dieser Writerkandidat, Domain-/Versions-/Längen-/Keyrollenbindung,
ciphertext-signierende Komposition, Parent-/Identitäts- und Malleabilitäts-
regeln, Metadatenprivacy, Widerruf/Frische, Zustandsforks/Rotation, Grenzen
und Fehlpfade. Quellenprüfung/Vektoren desselben Owners sind kein Ersatz.
KDF-/Workfactor-/Unicode-/Entropie-/EinmalKEK-/Keyslotgates des bestehenden
Reviews bleiben vollständig offen. Kein eigener Review-PASS.

| Pflichtgegenprobe | Soll, noch NICHT kryptografisch ausgeführt |
| --- | --- |
| Jedes Headerfeld/Framebyte/Signaturbyte ändern; falsche Domain/Version/Länge/Restbytes | Gesamte Eingabe blockiert; kein Receipt/Storage |
| E/Passwortinhaber mit gefälschter deviceId; Signatur durch A oder anderen W | Writerprüfung scheitert; Gruppen-AEAD-PASS genügt nicht |
| Gültige W-Signatur mit fremdem Portfolio/Epoche/State/Member/SPKI | Bindung scheitert, keine Root-/Keysuche |
| Gleicher TBS mit gültiger s-Alternative; falsche oder fehlende Signatur | Gleiche semantische ID bzw. Reject; exakte Transportidentität getrennt |
| Header-/Memberdevice stimmt nicht mit entschlüsseltem Descriptor überein | Reject, obwohl einzelne primitive Prüfungen bestehen könnten |
| Parent nur gruppengeprüft/fehlend/geforkt; gleiche ID mit anderem Frame/Writer | Kein autorisierter Nachfolger, Originale erhalten |
| Veralteter State/Widerruf/Server verbirgt aktuellen Zustand | Keine aktuelle Send-/Applyfreigabe aus historischer Signatur |
| Exakte Wiederholung, Neuverschlüsselung oder neue Signatur nach Antwortverlust | Nur gespeicherte exakte Bytes bestätigen denselben Versuch |
| Unsupported Snapshot/UNKNOWN-FX/Journalfehler bei korrekter Signatur | Gesamte Payload blockiert, keine Reparatur/Teilübernahme |
| Bytes/Keys/State/Portfolio/Outbox ändern während Cryptoawait; Abort/Quota/Reopen | Späterer Adapter fail closed; keine behauptete Key-CAS-Lösung |

[Öffentliche Kodierungsvektoren](FLH04_WRITER_FRAME_BYTE_VECTORS.json) sind
bewusst Dummyframes ohne gültige AEAD oder Signaturen. Nur C-Kodierung und
SHA256, kein Import-/Krypto-/Browser-/Sicherheits-PASS. Tatsächliche Prüfung
und exakter Commit werden im Fach-/zentralen Checkpoint nachgeführt.

API-Referenz am13.11.2026 geöffnet: [W3C WebCrypto](https://www.w3.org/TR/webcrypto/),
ECDSA sign/verify. Sie beschreibt die Primitive, bestätigt diesen eigenen
Protokollentwurf nicht. Keine neue Parametereignung daraus ableiten.

A1/A2 bleiben: planApply.applyAuthorized=false; Storage.confirm gesperrt;
remoteAnchor=acknowledgedLocalRevision=null. Snapshot weiterhin begrenzter
v3/v4-Kern 3.500.000UTF8Bytes/100.000Strukturwerte/Tiefe16.
CryptoKeytausch zwischen Challenge/Commit UNGELÖST; keine Entsperrung.
Outbox INTERN UNQUALIFIZIERT / FLH04 NICHT DONE / N-DRIVE BLOCKED_EXTERNAL
mit Code-/internem/externalem Abnahmerest. Mainreleasegate unverändert.


## Tatsächlich ausgeführte Kodierungsprüfung · 13.11.2026

Sechs öffentliche synthetische Werte durch getrennte temporäre Python- und
Nodeprogramme exakt rekonstruiert (Länge/Bytes/SHA256). Drei Strukturformen
Header/TBS/äußere Hülle akzeptiert,19 gezielte Grammatik-/Längen-/Versions-/
Enumfehler abgewiesen. Neun Header-/Frameänderungen ändern die TBS-Hashbytes;
Änderung der Dummysignatur verändert den Transportdigest bei unverändertem
WriterObjectId. Das ist ausschließlich Kodierung/ungekeyter SHA256, KEIN
Signaturmanipulations- oder Malleabilitäts-PASS. Beide Programme vom selben
Owner, kein unabhängiges Review. Node24.22.1; kein Appimport/Netz/Storage/
Browser/IDB/KDF/AEAD/sign/verify, keine alten Tests wiederholt/addiert.
Die erste lokale Prosaabschätzung von Header/Overhead wurde vor Commit anhand
der rekonstruierten Bytewerte auf207/312/14999688 berichtigt; kein Testgate
oder Größenbudget gelockert. Alle veröffentlichten Vektoren enthalten
bewusst ungültige Dummycipher-/Signaturbytes.
