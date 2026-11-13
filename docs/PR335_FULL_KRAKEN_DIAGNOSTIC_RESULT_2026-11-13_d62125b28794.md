# PR335 – einzelner autorisierter Full-Kraken-Diagnoselauf

13.11.2026 · work-d62125b28794-20261113 · **DIAGNOSTIC_PASS_ONLY / HISTORICAL_FAILURE_NOT_REPRODUCED / RELEASE_GATE_OPEN**.

## Ergebnis und Bedeutung

Der ausdrücklich im Chat mit „Ja“ freigegebene Einzelversuch wurde genau einmal aktiviert und ausgeführt. [Run43421311524](https://github.com/joke0071/foliolab-open/actions/runs/43421311524), Versuch1, Eventcreate, Job131871726863 SUCCESS. Neue Diagnosebranch test/pr335-full-kraken-d62125b28794 am exakten Kandidaten e9578124495709ef7550273f239840c96d4a1b1c / Treee17b95fddc8f87dfffa9288f2878785bd7f1979c. Nach Branchanlage alle3Dateien am exakten SHA erneut vollständig bytegleich gelesen. Kein zweiter Versuch/Retry, kein PR/Merge/Deployment. Beide historischen Diagnosejobs erwartungsgemäß SKIPPED; der einzige tatsächliche Diagnosejob lief von11:58:40bis11:59:54UTC (74s nach Jobmetadaten, keine abrechenbare Runner-/Creditangabe). Main unverändert a27cde2f802c26bfec41190911d88bd1d7d8e325 / Treee55ffa96f641345759eb3779b00de6187c8671b8.

Der vollständige unveränderte Kraken-Test bestand alle sieben Szenarien in Originalreihenfolge: link-bridge,solana-bridge,ethereum-bridge,bitcoin-bridge,distinct-fee,cross-reference,same-asset-fee. Dazu sieben Originalhelper-PASS mit initial-ready→before-reload→after-reload→assertions, jeweils aktivierter Worker https://foliolab.unperfekt.at/sw.js und tatsächlicher Controllerbindung. Keine Lockerung der20000ms oder Originalassertions, UH03_SCENARIOS blieb ungesetzt. HISTORY_ENGINES=chromium. Test-/Helperblobs5cd2025e30423997b5d99660a98e96cb22154b3f/7ee6568522425c1a4bcb7549d3be68abda96c09f unverändert.

**Historischer Fehler genauer lokalisiert:** Der Originaljob131591512462 aus Mainrun43332355188 wurde gezielt erneut als Log gelesen. Er enthält PASS für die ersten fünf Szenarien bis distinct-fee, anschließend STORAGE FIXTURE FAIL mit ausschließlich initial-ready und Timeout20000ms bei controlledStorageFixture before-reload, Testzeile132. Aus unveränderter Szenarioreihenfolge und den fünf expliziten PASS folgt die Zuordnung zum sechsten Szenario **cross-reference**; kein historisches cross-reference-/same-asset-fee-PASS. Der zuvor diskutierte einzelne Linkfrischkontext war somit kein äquivalenter Ersatz für den tatsächlichen Fehler. Der heute freigegebene vollständige Ablauf deckt den tatsächlichen sechsten Kontext mit ab und bestand ihn.

Das ist **keine Ursachenklärung oder Behebung**. Das Original enthält nicht die heutigen vollständigen Netzwerk-/Workerereignisse; fehlende historische Informationen lassen sich durch den neuen Erfolgsfall nicht rückwirkend erzeugen. Heute kein entsprechender Worker-/Fetch-/HTTPfehler. Instrumentierung kann Scheduling beeinflussen; ursprüngliche vorgeschaltete andere Main-Tests wurden nicht wiederholt. Runnerimage hat sich geändert. Kein transienter Netzfehler, cache.addAll-Abbruch oder Produktfehler aus dem Erfolg abgeleitet; Ursache weiterUNKNOWN. Mainrun43332355188 bleibtCOMPLETED/FAILURE. Dieser Lauf ist kein Main-/Release-/LIVE_ACCEPTED und rechtfertigt keinen blinden Full-CI-Retry.

## Tatsächliche Umgebung

| Merkmal | Originaljob | Neuer einzelner Diagnosejob |
| --- | --- | --- |
| Node |22.23.4|22.23.4|
| Playwright |1.56.1|1.56.1|
| Chromium Headless Shell |141.0.7390.37/build1194|141.0.7390.37; Installationslog1194|
| Ubuntu24.04-Image |20261101.360|20261111.370.1|
| axe-core/pngjs |4.10.3/7.0.0|4.10.3/7.0.0 laut gepinntem Installationsaufruf|

Ubuntuimagegleichheit ausdrücklich NICHT belegt. GewöhnlichesTLS, keine Zertifikatausnahme/Proxyumgehung. Lokaler AF_UNIX-Fehlstart nicht wiederholt; er erklärt den historischen GitHubfehler weiterhin nicht. Kein lokaler Browserstart oder neue Plattform.

## Belegqualifikation

- Vor Originaltest154öffentliche Appdateien unter allen sechs Wurzeln gegen gepinnten Checkout HTTP200/bytegleich; zu jeder Datei Gitblob und SHA256 im Original-NDJSON. Alle154asset-match-Einträge vorhanden.
- 7Browser,15nativeKontexte,15page-observer-ready und15context-observer-ready,15context-closed. Awaited CDP-/InitScriptbarrieren tatsächlich im unveränderten vollständigen Originalablauf verwendet, kein bloßer asynchroner Pageeventhandler. Keine allgemeine Popup-/Adapterqualifikation daraus.
- 22033vollständig lesbare NDJSONereignisse /4712861Bytes, unter16MiBBudget.10710Requests/10710Responses; keineHTTP>=400/Requestfailed/WorkerError/ObserverError-Einträge.7707nichtleereTLSdetails(TLS1.3),3003leereSecurityobjekte bei synthetischen/routeten Antworten; letztere kein separater Zertifikatsnachweis.
- Workerstatus-/Registrierungsereignisse und166Lifecycleereignisse vorhanden; Registeraufrufe65,Registrierungen65,updatefound8,statechange21,controllerchange7. Ein Prozessabschlussmarker code0,complete:true,observerFailed:false; Originaltestlog enthält die exakt sieben erwarteten Szenario-PASS in Reihenfolge. Alle sieben Originalhelperdateien mit vier vollständigen Stages und positiver controller/active/controlled-Verifikation gelesen.
- Artefakt14033932715 /2051924Bytes /SHA25635364486cb8e88edfb6474208060b928d01991704ab85351e8df295b7b1f3c92, Ablauf20.11.2026 11:59:51UTC. Genau einmal über das verbundene GitHubplugin geholt, Downloadsize/Digest/ZIP-CRC geprüft;37Einträge einschließlich OriginalPNG/JSON/Helperdateien erhalten. PNGs sind hier keine neue vollständige visuelle Releaseabnahme. Keine private Sitzung/Providercredentials oder Privatportfolios verwendet.
- Alte Main-/FAIL-/Oraclebelege vollständig erhalten; keine historischen PASS addiert oder fehlgeschlagene spätere Tests umetikettiert. Neue Nativeaussage beschränkt auf diesen vollständigen Krakenlauf mit Beobachter und diesen Tool-/Image-/Mainkontext.

## Dauerhafte neue Originalsicherung und begrenzter Restore

Genau ein neuer ergänzender Originalsatz, keine identische Rootvollsicherung:

FolioLab_PR335_full_Kraken_diagnostic_43421311524_originals_2026-11-13.tar · Version0 ·2181120Bytes ·SHA256**d42308aefa0aca571d14e066dad7817652f9ea89153ebdf6d652bf3c7c3d8812**.

Inhalt7Tarmitglieder: unverändertes OriginalZIP, Run-/Jobs-/Artifactmetadaten, vollständiger aktueller Joblog, lokale Qualifikation und Hashmanifest. Sechs Payloadhashes im Manifest. Neuen Satz gespeichert; danach per **konkreter zurückgegebener Dateiidentität/Version0** separat rückgelesen, Gesamtgröße/SHA256 identisch. Readbacktar in leeres Restoreverzeichnis tatsächlich ausgepackt, alle6Manifestpayloads nachGröße/SHA256 verglichen, inneresZIP37EinträgeCRCgeprüft und22033Ereignisse einschließlich154Assets/15Kontexten/code0-Abschluss aus den restaurierten Bytes erneut gelesen. Das ist nur ein tatsächlicher Restore dieses neuen Diagnosecompanion, kein privater Portfolio-/Rootrestore oder neue allgemeine Recoveryqualifikation.

Bisheriger RootV155/406425600Bytes sowie FAILCompanionV0/12748800Bytes und MainOriginalCompanionV0/212408320Bytes frisch NURmetadatenbestätigt und unverändert. Deren frühere Payload-/Readback-/Restorebelege nicht wiederholt. Rootallein bleibt unvollständig; neuer Companion ergänzt sämtliche bestehenden Original-/Oracle-/Restoreketten. Keine privaten Locators/IDs oder signierten TransferURLs öffentlich veröffentlicht.

## Abschluss und genau nächste offene Aktion

Frischer Schlussabgleich312Heads: nur eigeneCheckpointänderungen und genau die neu autorisierteDiagnosebranch. Main/FLH04/PR332/157/161/UI-R4 sowie Reviews/Inline-/Conversationkommentare unverändert.0IN_PROGRESS,nurhistorischeQueues43095194276/43095194257;KandidatgenaueinRun/Versuch1SUCCESS. Keine andere neueCI,keinMainrelease. Diese Dokumentation verändert keine Original-/Produkt-/Test-/Workflowbytes des Kandidaten.

Der konkrete Auftrag für einen Diagnoseversuch ist **verbraucht/abgeschlossen**. Keine automatische Wiederholung oder Freigabe eines weiteren Runner-/Workflowkandidaten daraus. Weitere Diagnose muss eine neue belegte Hypothese und einen konkreten reviewbaren Ausführungsdelta erhalten; keine unveränderte Full-CI allein wegen diesesPASS. Die bislang fehlenden historischen Worker-/Netzwerkdaten lassen sich nachträglich nicht herstellen. Bei weiterem Ausführungsvorschlag zuerst diese Evidenzgrenze und Nutzen/Budget bewerten; nächster Main-/Produktionslauf bleibt gesondert freigabe-/prüfpflichtig. Unabhängige sichere Produktarbeit darf weitergehen, betroffene Releasegates nicht umgehen.

FLH04/N-DRIVE weiterhin unverändert: exakter Reviewkandidat7ed0bbe09af03f52603b4e8e9ca8fedfada1d2cf/Tree6ef292b10caa2956791f0fe157137b31a3da2d00. UnabhängigesKryptoreview VOR Umhüllungscode und ungelöster CryptoKey-/Keyslottausch bleiben Gate. Keine Selbstfreigabe/Agentenreview/Aussteller-/Umhüllungs-/Signatur-/Entsperrimplementierung/aktiveSync. LetzterProduktcode10edebbf66cb021107cd1ae52b03bd82380c9e32/Tree5c43f4b41ac864d246b8adbe2ac3214e3d6b7559. format1prepared-locked,A1/A2/Snapshotgrenzen erhalten. OutboxINTERNUNQUALIFIZIERT/FLH04NICHTDONE/N-DRIVEBLOCKED_EXTERNALmitweiteremCode-/internemAbnahmerest.

STOPPED/HANDOVER_READY: Mit zentralem Schlusscommit eigeneSchreibaktivitäten beendet, kein Hintergrundbetrieb/aktiverNachfolger. Ältere work-pr333-Ausführung weiterhin NICHT technisch beendet nachgewiesen; keine fremde tatsächliche Schreibkollision beobachtet.

## Vollständiger kopierbarer Übergabeauftrag

```text
FOLIOLAB OPEN – FORTSETZUNG NACH EINZELNEM KRAKEN-DIAGNOSEPASS
Vorgänger work-d62125b28794-20261113:STOPPED/HANDOVER_READY.
Alle eigenen Schreibaktivitäten beendet,keinHintergrundbetrieb.
Repository https://github.com/joke0071/foliolab-open ; GitHub ausschließlich verbundenesPlugin.
KeineZusatzagenten/Parallelisierung/Automation/zweiterWriter/zweitefinaleCI.
Älterework-pr333-Ausführungweiterhinnichttechnischbeendetnachgewiesen.
Vor Übernahme frisch Owner/alleHeads/Main/Checkpoint/Arbeitsbranch/offenePRs/
Reviews/Inline-/Conversationkommentare/Actions und Sicherungsmetadaten abgleichen.
expectedSHA und vollständiges gepinntes Byte-Readback; niemals fremdeÄnderungen überschreiben.
ZentralenCheckpointbranch niemals vollständig nachMainmergen.

ZUERST aktueller zentralerCheckpointkopf, aktiverEffizienzplan, RoadmapN-DRIVE,
Wochenplan und dieses Ergebnisdokument. Aktuellen zentralenHEAD/Treefrischermitteln.
Ausgang00e84432b61c7438fb3d7d4cf98c197f9218571a;
Autorisierungs-/Übernahmecommitb7854de1a753e7e183e00e4662a7523764314e92.
KeineGesamtinventur oder Wiederimplementierung fertigerModule.

Maina27cde2f802c26bfec41190911d88bd1d7d8e325/Treee55ffa96f641345759eb3779b00de6187c8671b8.
Mainrun43332355188COMPLETED/FAILURE/UrsacheUNKNOWN/RELEASE_GATE_OPEN.
Originaljob131591512462:erste5KrakenSzenarienPASS,dannbefore-reload20000msTimeout
im6.Szenariocross-reference(Originalreihenfolgeund5PASSzugeordnet).
Keinehistorischecross-reference-/same-asset-feeAbnahmeausdemFAIL.

JochenhatgenaueinenkonkretenDiagnoseversuchfreigegeben; dieseristabgeschlossen.
Branchtest/pr335-full-kraken-d62125b28794=e9578124495709ef7550273f239840c96d4a1b1c,
Treee17b95fddc8f87dfffa9288f2878785bd7f1979c,ParentMain.
Run43421311524/Job131871726863/Versuch1/Eventcreate/SUCCESS,
11:58:40–11:59:54UTC(74sJobzeit),beidehistorischenDiagnosejobserwartetSKIPPED.
7unveränderteSzenarien+7HelperPASS,154AppdateienHTTP200/bytegleich,
7Browser/15Kontexte/15Pages,22033Ereignissevollständig/4712861Bytes,
0HTTP>=400/Fetch-/Worker-/Observerfehler,code0/complete/keinObserverfehler.
Node22.23.4/PW1.56.1/Chromium141.0.7390.37,Image20261111.370.1statt20261101.360.
UnveränderteOriginaltest-/Helperblobs5cd2025e30423997b5d99660a98e96cb22154b3f/
7ee6568522425c1a4bcb7549d3be68abda96c09f;UH03_SCENARIOSunset/HISTORY_ENGINESchromium.
20000ms/Assertions/ganzeSzenarioreihenfolge/Vorkontexteerhalten.
KeinPR/Mainmerge/Deployment/Retry/zweiterRunner,keineZertifikatausnahme.
DiagnosePASSnichtMain-/ReleasePASS;alteUrsacheweiterUNKNOWN/nichtreproduziert.
InstrumentationkannSchedulingändern;keinNachweisfürtransient/cache.addAllUrsache.
DieEINZELevorgangfreigabeistverbraucht. KeinweitererStart/Workflowdelta/Retryohne
neuekonkreteFreigabeundbegründeteHypothese;keinenunverändertenFullCIstarten.

Artifact14033932715/2051924Bytes/
SHA25635364486cb8e88edfb6474208060b928d01991704ab85351e8df295b7b1f3c92.
NeuerdauerhafterCompanionFolioLab_PR335_full_Kraken_diagnostic_43421311524_originals_2026-11-13.tar,
V0/2181120Bytes/SHA256d42308aefa0aca571d14e066dad7817652f9ea89153ebdf6d652bf3c7c3d8812.
Gepinntseparatrückgelesen,hashidentisch,tatsächlichinleeresVerzeichnisrestauriert:
7Tarmitglieder/6Manifestpayloadsidentisch,inneresZIP37EinträgeCRC,
22033EreignisseausReadbackrestauriert. NurDIESERDiagnosecompanionqualifiziert.
RootV155406425600Bytes/FAILCompanionV012748800Bytes/MainOriginalCompanionV0212408320Bytes
frischnurMetadaten;keineerneuteprivatePayloadprüfung/Root-/Portfoliorestore.
Rootalleinunvollständig,alleOriginal-/Oracle-/Companion-/Restorekettenbewahren.
KeinidentischesVollbackupwegenChatwechsel,keinepauschaleOriginallöschung.

FLH04branchfeature/flh04-revisions-20261113-b5ddfe1c:
7ed0bbe09af03f52603b4e8e9ca8fedfada1d2cf/Tree6ef292b10caa2956791f0fe157137b31a3da2d00.
LetzterProduktcode10edebbf66cb021107cd1ae52b03bd82380c9e32/Tree5c43f4b41ac864d246b8adbe2ac3214e3d6b7559.
KandidatenbytevertragREVIEW_REQUIRED/NOT_IMPLEMENTED/NOT_AUTHORIZED.
Ausstellervertrag1verlangtunabhängigesKryptoreviewVORUmhüllungscode.
KeineSelbstfreigabe/ZusatzagentenalsReviewersatz.KDF/Unicode/Domaintrennung/
Entropie/EinmalKEK/Klon/Ecommitment/HMAC/SPKI/ECDSA/Malleabilität/State-/Grantgraph/
Rollback/Widerruf/A-VerlustamEXAKTENKandidatenunabhängigreviewenlassen.
AlternativenativeKeypersistenz-/Keyslot-/Transaktionsbindunginbereitszulässiger
geeigneterUmgebung;bekanntenAF_UNIX→EPERMFehlstartnichtwiederholen.
CryptoKeytauschzwischenChallenge/Commitungelöst;Envelopebytes/LifecycleIDskeinKey-CAS.
KeineautorisierendenCommits/Entsperrung/aktiveSync;keineUmhüllungvorReview.
IndividuelleRevisionssignatur-/FramebytesseparatOFFEN;Gruppenframev1nichtumdeuten.
format1prepared-lockedAnkerunveränderterhalten;keinUpgrade/Adopt/Überschreiben/Löschen.
Portfolioautorität/Writergetrenntenon-extractableKeys;Passwort/EnichtAdministrator.
AutoritätsverlustohnequalifiziertenNachfolgerblockiertdieselbeAutorität.
A1alteFramesniemalsanneuerenCAS/planApply.applyAuthorized=false.
A2Storage.confirmgesperrt/remoteAnchor=acknowledgedLocalRevision=null.
Snapshotnurv3/v4Kern3.500.000UTF8Bytes/100.000Strukturwerte/Tiefe16;
Unbekannt/unsupportedblockiertGesamtpayload.KeinezweiteDB/DBVersionsänderung.
DetailliertevollständigeSchutzverträgevorbetroffenerArbeitlesen:
FLH04_WORK_CHECKPOINT,ENROLLMENT_ISSUER_CONTRACT,SYNC_WRAP_AUTHORITY_BYTE_CONTRACT/
VECTORS,SYNC_ARCHITECTURE,SNAPSHOT_CONTRACT/SNAPSHOT_ALLOWLIST_ONCE_2026-11-13.
VollständigevorherigeHND01-ÜbergabenimzentralenCheckpointbleibenerhalten.
OutboxINTERNUNQUALIFIZIERT/FLH04NICHTDONE/N-DRIVEBLOCKED_EXTERNALmitCode-/internemAbnahmerest.

GeschützteRefsPR33271dfb05d5dae6a7e5d7c3979120462e0862fe7e2/CSV44pxBLOCKED,
PR15708714cc602110bae479083b3d38fa1adc9be280c,
Draft1610d980c2f43f28fd06ef9a7403b2144b6099fbc74,
UI-R460c1ab098449151b475563c9fc822b9a5e9a9152samtReviews/Kommentarenunverändert.
Zuletzt312Heads/0IN_PROGRESS/nurhistorischeQueues43095194276/43095194257.
SeriellimautorisiertenUmfangweiterarbeiten;keinenReleaseblockerumgehen.
BeimEndeStand/SHAs/Gatessichern,eigeneSchreibaktivitätenbeenden,
STOPPED/HANDOVER_READYundvollständigenÜbergabeauftragbereitstellen.
```
