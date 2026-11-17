# PR354 · Main integriert · reguläre Liveabnahme durch initialen HTTP503 blockiert

**MERGED / MAIN_INTEGRATION_AND_DEPLOYMENT_SUCCESS / REGULAR_LIVE_FAILED.** Alleiniger HND01-Owner `hnd01-1point0-20261117-root-5c3182824c09`; frühere Owner abgelöst. Jochens Auftrag autorisiert den selbstständigen Merge nach exakter Headqualifikation. Keine weitere Mergeentscheidung offen, keine parallelen Agenten.

PR354 am exakt geprüften Head `aeea7d11d0169dde8355a7f317a16c1a62dab806` gemergt. Main **`e9130ad90874434a38bb329a7dafaa22e2163e1d`**, Tree `3fd78f746c08ab0fe0347ab30932a00309d7d008`, Parents alter Main494ed8f0 und qualifizierter Head. Tree gleich zum geprüften synthetischen Merge. Produktdateien, SW321 und Workflow unverändert. Frühere SW321-Produktabnahme gilt für diese unveränderten Produktbytes weiter; neuer vollständiger regulärer Live-PASS wird ausdrücklich nicht behauptet.

## Qualifikation und erhaltener Prüfvertrag

[Unveränderte fallweise FX-Zuordnung](https://github.com/joke0071/foliolab-open/blob/aeea7d11d0169dde8355a7f317a16c1a62dab806/docs/FX_VERIFIED_RELEASE_MATRIX_2026-11-17.md) und [gesicherte vorherige Qualifikation](PR354_FX_VERIFIED_RELEASE_QUALIFICATION_2026-11-17.md) übernommen. Alle acht Fälle bleiben in Chromium, Firefox und WebKit mit vollständigem ursprünglichem UI-Refresh-/Assertion-/Reopenblock erhalten. Dessen Bytegleichheit gegen Main494 wurde erneut mechanisch bestätigt; SHA256 fd6337feec2ab874e37a78821fc8466ade623fda08a37a13bda5ef2495e2337c.33 zusätzliche lokale Integritäts-/UNKNOWN-/FX-/Workflowtests PASS; vollständige grüne exakte PR-CI44041905697 und Wallet44041905817 frisch über GitHub bestätigt.

24Fachfälle auf155vollständig erfolgreich HTTP-/hashgeprüften veröffentlichten Dateien plus6unveränderte direkte Domainfälle sind der qualifizierte Prüfvertrag. Fehlender/fehlgeschlagener Corebeleg autorisiert keinen Replay und keinen Netzwerkfallback. SW ist wie zuvor im FX-Fachtest blockiert; echter Kaltstart, Aktivierung, Übernahme/Kontrolle, Offline-Reload und IDB-/Restoreerhalt bleiben im separaten unveränderten regulären Coregate. Windows-Diagnoselauf wird nur für tatsächlich beobachteten Reload **vor** SW-Übernahme verwendet.

## Tatsächlicher Mainlauf und Messwerte

[Main44048209546/Versuch1](https://github.com/joke0071/foliolab-open/actions/runs/44048209546) beendet **FAILURE**; kein weiterer Versuch gestartet.

| Phase | Gemessener Befund |
|---|---|
| Unit-/Integrationsgates |1511Units/0Fehler, Chromium und alle3Crossgruppen SUCCESS |
| test |1112s =18:32 |
| Cross1 |660s =11:00 |
| Cross2 / kritischer Integrationspfad |1497s =24:57 |
| Cross3 |784s =13:04 |
| Addierte Integrations-Runnerarbeit |4053s =67:33 |
| Deployment133931214832 |SUCCESS/19s;154Pages-Dateien exakt bytegleich zu Main |
| Live133931409548 |FAILURE/48s;155unabhängige HTTP-/SHA-Dateivergleiche PASS, danach Navigation nicht verfügbar |
| Coverageinventare |Alle4normalisierten Berichtsinventare gleich zum qualifizierten PR354; Rohmitglieder845/515/837/280 unverändert. Nur13stellige Capturezeit-Dateinamen normalisiert. |

Früherer PR354:1451s/24:11 kritischer Pfad und4208s/70:08 Runnerarbeit. Früherer PR349:1076s/17:56 und3658s/60:58. Main dieses Auftrags liegt46s über dem eigenen PR354,421s über PR349. Diese getrennten Läufe belegen **keine CI-Beschleunigung und keine kausale Laufzeitregression**. Keine erneute Vollausführung nur für Zeitmessung.

| FX-Verkehrsvergleich | Aussagegrenze |
|---|---|
| Bereits qualifizierte6direkte Domainfälle |2568Produktionsanfragen; alle200/hashgleich; maximale beobachtete Spitze535Starts/s |
| Vollständige unveränderte Originalmatrix |Lokal gemessene Requeststruktur10272; historische erfolgreiche Chromiumfälle bestätigen426Abrufe/Fall. Keine neue erfolgreiche10272-Request-Produktionsbaseline. |
| Nutzen |Bei gleicher Requeststruktur7704/75%weniger FX-Produktionsabrufe. Alle24Fachfälle erhalten;18wiederholte CDN-Kaltstartstichproben entfallen. Keine belegte Spitzensenkung oder Hostingheilung. |
| Neuer regulärer Livejob |FX **NOT_REACHED**, daher0FX-Anfragen. Kein neuer erfolgreicher FX-Produktionsvergleich behauptet. |
| Neuer initialer Coreversuch |126Browserkontext-Anfragen +155unabhängige Hashanfragen =281beobachtete Produktionsanfragen; kombinierte gleitende1-s-Spitze155Starts. Anderer Umfang als FX, daher kein Reduktionsbeweis. |

52.541s früher gemessenes Replay-plus-Domain-Teilbudget ist keine gepaarte Produktions-Gesamtdauermessung. Der neue Lauf erreicht diesen Abschnitt nicht. Messungen und strukturelle Hochrechnung bleiben getrennt.

## Neuer initialer Auslieferungsfehler

Am **17.11.2026 10:02:30.205MEZ /09:02:30.205UTC** erhält der erste App-Modulgraph `/src/csv-import.js` als Scriptantwort **HTTP503**, `content-type:text/html`, ServerVarnish, Edge`cache-dfw-kdfw8210118-DFW`, Fastly-Request-ID`0c54eff5fbb6677a105ddd7159c292072747880f`; anschließend `net::ERR_ABORTED`. Die App meldet fehlgeschlagenen Start; beide Navigationsbereiche haben0Buttons, noch keine echte SW-Kontrolle. Der strenge bestehende erste More-Klick läuft in30sTimeout.

Die503-Antwort liegt **879ms vor erster unabhängiger Hashanfrage** und vor jeglicher FX-Ausführung. Danach155unabhängige Hashabrufe erfolgreich; diese spätere erfolgreiche Auslieferung repariert den bereits gescheiterten initialen Modulgraph nicht. Kein unberechtigter Fehlerfreiheitsbeweis aus `errors:[]`: die tatsächlichen Netzwerk-/Startdiagnosen enthalten den oben belegten Fehler.0Axe-Scans; nachgelagerte SW-/Offline-/Restore-/FX-/Cross-Livegates nicht erreicht.

Reguläre vorhandene Workerdiagnostik markiert ihren eigenen Timing-Einfluss; keine allgemeine Alltagszuverlässigkeit daraus ableiten. Interne Ursache UNKNOWN. Dies ist ein neuer503 an anderem Modul, kein Beweis derselben Ursache wie beim historischen market.js503 und kein429. Die frühere genaue429-Regel und der historische503-Ursprung bleiben getrennt offen. Support#5016095-Schließung ohne technischen Befund wurde bereits im vorherigen Checkpoint dokumentiert; keine weitere Antwort wird abgewartet.

Keine pauschale Retryfolge, kein Sleep, keine Assertion-/Engine-/Fristlockerung, keine Produktkorrektur ohne reproduzierten Produktdefekt. Die FX-Verkehrsänderung wird nicht als Behebung dieses vorherigen Transportfehlers ausgegeben. Historische fehlgeschlagene Originalläufe bleiben unverändert FAIL.

## Restliste und genau ein nächster Beitrag

Aktuelle private Restbelegliste **Version3**, Bitpanda-Nachtrag **Version0 zum31.03.2026** und aktuelle öffentliche Abnahmeverträge gelesen. Kein Privatportfolio importiert/geändert und keine privaten Finanzoriginale/Einzelmengen in GitHub oder CI.

| Pflicht | Ergebnis dieses Abgleichs |
|---|---|
| Windows/Kraken |Bereits akzeptierter Windows-K4/K6-Teilumfang und unabhängiger Kraken-Spotanker bleiben DONE; nicht wiederholen. Echte OS-Systemschrift/physischer Touch bleiben außerhalb des belegten Umfangs. |
| Android |Kein zugängliches adb/USB-/physisches Remote-Testgerät. Installation/App-Symbol, Offline-Kaltstart, Datei-Restore/Wiederöffnung und A01–A10 bleiben extern offen; Update/Quota brauchen zusätzliche echte Bedingungen. |
| Bitpanda31.03.2026 |Historische Centbewertung plausibel; keine automatische Doppelzählung im geprüften nativen UI-Pfad. Persönliche BCI25-Komponentenzuordnung und unabhängiger Cashanker weiterhin unbestätigt. Kein weiterer Gesamtexport oder erneute Komponentenanforderung zur erledigten Produktfrage. |
| ETH |Öffentliche transactions/token-transfers-Cursorpaare und technischer D-ETH260-Abschluss übernommen. Betroffene private erste Originalantwort mit Endpunkttyp/next_page_params und tatsächliche Folgeantwort fehlen weiterhin. Öffentliche Gegenprobe ersetzt sie nicht. |
| Interner Folgeschritt |Kein weiterer unabhängig intern ausführbarer1.0-Pflichtpunkt aus diesen konkreten Beleggrenzen identifiziert. Kein erfundener Codierauftrag. Komfort/Autosync/Safari/TalkBack nach1.0/deferred gemäß Nutzerumfang. |

**Genau eine nächste Nutzerhandlung:** Ein autorisiertes fernbedienbares **physisches Android-Gerät mit leerem isoliertem Testprofil ohne Privatportfolio bereitstellen**. Damit werden Installation/App-Symbolstart, Offline-Kaltstart und Datei-Restore/Wiederöffnung prüfbar. Kein Kauf und kein Privatprofilzugriff erfolgt. Keine gleichzeitige weitere Finanz-/Supportanforderung. Kein globaler1.0-Abschluss.

## Originale und gespeicherte Rückleseprüfung

[Originalpaket](https://chatgpt.com/library?file_id=libfile_fde3_f-6e44ed2f00f88191b3a20dfd04ae088b_54e45e8130348191808d9aaa710cf372&account_id=personal), Version0, Pin`file_00000000c9088210a2b0dbe7ae639d5d`:224147208Bytes, SHA256`b2945c52f58edc0cba598d37d5525ab233adcfa73b39c2e65213e1c1b123a009`.8unveränderte Original-ZIPs/2509ZIP-Mitglieder,38Manifestdateien, vollständige API-Identitäten/Originale/Logs/Diagnose/Pages-/Coverage-/Verkehrsauswertung. Tatsächlich gespeicherte Kopie separat materialisiert; Archivhash, alle38Längen/Hashes sowie alle8inneren ZIP-CRCs/2509Mitglieder PASS. Der Archivschnitt liegt vor dieser späteren Rücklesequittung; [Maschinenbeleg](release-evidence/pr354-main-result-2026-11-17.json) hält sie separat fest.
