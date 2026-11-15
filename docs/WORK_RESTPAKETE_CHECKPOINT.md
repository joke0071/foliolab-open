# HND01 · ACTIVE · freigegebener v317-Release

Writer k3-emergency-9142fbd8f0d0. Jochen akzeptiert am15.11.2026 den dokumentierten, nicht reproduzierten44px-Befund ausdrücklich als offenen Diagnosepunkt und genehmigt Merge von PR340 ausschließlich am Head f03cc26182d40fa3f10fd88a133c725be925cef0, geprüfter Produkt-Tree b70a02558a89158f80420b2c895bbcb2c18ab7c7, Main-Basis82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69, Checkpointb9be8f607b4af35c672b5eadfa09a9da43388afd, sowie reguläres Deploymentv317. Aktueller frischer Abgleich: Owner/Main/PR-Head/Tree/Reviews/Kommentare/Actions unverändert; vollständige PR-/Walletchecks SUCCESS. Keine konkurrierende Schreibaktivität erkennbar. Die bisherige Ursachenklärungssperre ist durch diese konkrete Nutzerentscheidung als Mergeblocker aufgehoben, nicht als Diagnose geschlossen. >=44 und Messdiagnostik bleiben aktiv.

Nächste Aktion: SHA-gebundener Merge, tatsächlichen Merge-Tree prüfen, vorhandenen Main-/Deploy-/Live-Lauf bis Ergebnis begleiten. Bei erneutem44px-Fail Originalgeometrie sichern und vor weiterem Versuch untersuchen. Neue Releaseoriginale dauerhaft/gepinnt/Restore sichern; erst danach Archivhinweis-K3-Teilpunkt schließen, Roadmap/Checkpoint aktualisieren und Writer geordnet abgeben. A09/Grafikherkunft und historische10000Positionsforderung bleiben getrennt.

---

## Historischer Prüfstand vor Freigabe

# HND01 · TEST_BLOCKED · K3 / PR340 · 15.11.2026

Alleiniger Writer: k3-emergency-9142fbd8f0d0. Autorisierte Notfallübernahme von k3-decision-e4b79f541e28 mit expected115d0f939147a9422ff568cdec7ec25dba3aa5dd; Vorgänger SUPERSEDED, kein technischer Prozessstopp behauptet. Übergang bf39962907c561d95398746d46c65f027a8c7f67. [Vorheriger ausführlicher Stand](https://github.com/joke0071/foliolab-open/blob/45d49f54bc5ba73f207061d0e205d9d17bee78d2/docs/WORK_RESTPAKETE_CHECKPOINT.md) bleibt unverändert erhalten. Keine konkurrierenden Writes/Reviews/Kommentare im abschließenden Abgleich.

## Entscheidung: konkreter Blocker

[PR340](https://github.com/joke0071/foliolab-open/pull/340), fix/k3-booking-archive-limit-2026-11-15; finaler Head f03cc26182d40fa3f10fd88a133c725be925cef0, Tree b70a02558a89158f80420b2c895bbcb2c18ab7c7. Main unverändert82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69 / Tree11429de9e06d9d014875af624cb80bafafb38f20 / v316 LIVE_ACCEPTED. Merge und Deployment bleiben Jochens separater Freigabe vorbehalten; beides nicht ausgeführt.

Reguläre PR-CI [43710456361/1](https://github.com/joke0071/foliolab-open/actions/runs/43710456361) SUCCESS: Chromium, alle3Firefox-/WebKit-Jobs sowie1481Units/0Fehler/0Skips. [Wallet43710456329](https://github.com/joke0071/foliolab-open/actions/runs/43710456329) SUCCESS. Tatsächlich geprüfter GitHub-Merge-Checkout d3aca28984845920cbaa12761272c51cf3ee6bbc hat exakt denselben Tree wie der finale Head und die Eltern Main82ce/f03cc261. Deploy/live-acceptance erwartungsgemäß SKIPPED beim PR-Ereignis, keine Produktionsfreigabe daraus.

**Ursache des ursprünglichen44px-Fehlers weiterhin UNKNOWN.** Original43706353644/1 FAILURE auf d7d3a1dcabe5bcfc17e4a235ddb265309f23e4bb bleibt erhalten; Assertion bei430px hatte keinen gemessenen Pixelwert/Fehler-Screenshot. Bestehende Vorlage00968bc5 aus PR332 nur gelesen, PR332 unverändert. Diagnose43709327470/1 mit identischem Chromium-Vorläuferblock SUCCESS, Fehler nicht reproduziert. Gezielter Paarvergleich43710297660/1: Main und PR jeweils50Messungen über10Zyklen×5Breiten, alle100Zielrechtecke44px; beide passenden Buttons durchgehend44px. Regulärer finaler PR-Lauf:15Messungen/3Engines×5Breiten ebenfalls exakt44px. Bei430px Chromium: x34,y1709.03125,width199.609375,height44; verbundener nav-etf-Button, min-height44px, kein Transform, tatsächlicher Viewport430×900.

Zusätzlicher PR-Commit f03cc261 verändert ausschließlich begrenzte Messdiagnostik im bestehenden Navigations-Test: identisches .position-csv-import.first()-Element, ursprüngliches Rechteck zuerst erfasst, >=44-Prädikat unverändert; anschließend Identität/Viewport/Styles/Ancestors/alleMatches. Bei Fehler vollständiger Screenshot. Keine Toleranz, zusätzliche Wartezeit, Frist- oder Produktgeometrieänderung. Erfolgreiche Diagnosen und neue CI belegen keine Ursache und keinen Fehlerfix; deshalb keine Merge-Empfehlung unter dem ausdrücklichen Ursachenklärungsauftrag.

[Entscheidungs-/Prüfbeleg](release-evidence/pr340-44px-2026-11-15/decision.json). Neue Archivgrenzen-Erklärung intern23Checks je Engine PASS; erklärt bestehende5000Buchungen-Grenze, kein Limit-/Finanz-/Speicherumbau. Produktassets bleiben die ursprünglichen PR-App-Copybytes mit Cachev317.

## K3-Fachabschluss und Rest

- 18Auswahl-/Einzelzeilenfälle/507Checks: Original43704954048 mit15PASS/3Datums-Harnessfehlern plus gezielte43705260426 mit3PASS; kein grüner18er-Einzellauf erfunden. Vorhandene47Dateien-Restorekette weiterverwendet.
- 9Großmengenfälle/120Checks aus43705457585:13ZIP-Teile gepinnt40c410b21a82cd8383d7eab9eff1804a39507d7f bytegleich,25Dateien tatsächlich restauriert;9Baselinerecords unabhängig nachgehasht.5000Positionen/10000Buchungen/10000Stichtage und0Writes bei reiner UI.
- 3exakte Betragsfälle/99Checks aus43705912741:2Teile dauerhaft032856dad03657625a1f3492e7d2c8c1a4d9f471, gepinnt bytegleich,13Dateien tatsächlich restauriert. Nur archivierte p001:2→3.000000000001,208→209.000000000001EUR; Revision+1/1Commit/regulärerSnapshot, alle geschützten IDs/Felder unverändert.
- [K3-Restmatrix](K3_ARCHIVED_UNKNOWN_NOTES_V316_2026-11-15.md) aktualisiert; kanonische Roadmap fortgeschrieben. Gesamt-K3 PARTIAL.5000Positions-Formatgrenze gegenüber historischer10000er-Zeile ausdrücklich offen; kein Universallöschen. A09 und Grafikherkunft bleiben geparkt, keine neue Geräte-/Quellenanfrage.

## Sicherung abgeschlossen

Privates Originalpaket FolioLab_K3_PR340_Originalbelege_2026-11-15.tar:443176960Bytes, SHA2560e49fbbd66cd596829277296e5c2df1576c05d84f2ff3cd4296dba9a35247098. Feste Dateiidentität/Version0 gepinnt zurückgelesen, tatsächlich bytegleich. Daraus2TARs und15ZIPs vollständig restauriert:4911ZIP-Dateien,4970Manifestdateien verifiziert. Alle älteren privaten Originalketten bleiben unverändert. [Restorebeleg/Manifestbindung](release-evidence/pr340-44px-2026-11-15/readback-restore.json).

Finale6CI-Archive:261JSON/2095PNG, vollständige erwartete Pfade und Digest/Größe/CRC geprüft. Vorhandener Verdichter:601explizite Assertions,0FINDINGS,53UNKNOWN wegen fehlender Adapter.53Originalstrukturen getrennt eingeordnet:45kontrollierteStorage-Fixtures,3synthetischeIDB-Metadatentraces ohne eigenständigen Ergebnisstatus,2Provider-Retirement-Ergebnisse,3Touch-/Long-Press-Beobachtungen. Kein automatischer PASS aus UNKNOWN. Relevante aktuelle Chromium-Desktopansicht visuell geprüft; ursprüngliche3Engine-/Mobileansichten bei identischen Produktbytes wiederverwendet, keine vollständige PNG-Sichtprüfung behauptet.

## Wiederaufnahmebedingung

Alle gestarteten Jobs sind abgeschlossen. Kein weiterer unveränderter Wiederholungslauf. Für eine kausale Korrektur fehlt eine tatsächlich fehlgeschlagene exakte Rechteck-/Element-/Ancestor-Beobachtung; diese wird bei erneutem regulärem Auftreten durch den neuen Test bewahrt. Alternativ erst bei neuer belegter Kausalhypothese einen entsprechend geänderten Versuch ausführen. Aktuelle115Messungen und erfolgreiche CI nicht nachträglich zur Erklärung des alten Fehlers umdeuten. Keine spekulative CSS-/Timingkorrektur, keine Hintergrundfortsetzung oder Merge-/Deploymentzusage.
