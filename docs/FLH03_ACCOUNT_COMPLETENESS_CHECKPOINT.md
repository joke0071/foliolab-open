# FLH03-16 / 07 — lesende Kontovollständigkeit

Basis main/v188 ca1fa8fd46b3060d10a13095400bc3d33b0f3c42. Nächster bestehender P1-Vorgänger laut konsolidierter Roadmap, vor FLH05-A. Einziger aktiver funktionaler Strang: feature/flh03-account-completeness. FLH05-Spezifikation gesichert auf feature/flh05-import-foundation/210763b8f95d965ff880e9fd4d02089b9d3750ab; A bleibt zurückgestellt. #157/#161 unverändert.

## Begrenzter Vertrag vor Implementierung

Unter vorhandenen Anbietern/Konten eine kompakte aufklappbare Prüfübersicht, kein Redesign. Nur vorhandene Qualitätsmeldungen, gespeicherte Eröffnungen, explizite Importquellen und bestätigte Transferzuordnungen zusammenführen. Konten-/Positions-IDs trennen gleiche Instrumente verschiedener Depots. Archivierte Bestände bleiben berücksichtigt. Keine zweite Bewertungs-/Historien-/Cashengine, keine neue Speicherung und keine neuen Finanzaktionen.

Konkrete Statusdimensionen: Positions-/Cashanzahl, Preis-/Historienprüfungen aus positionQualityReview, Eröffnungen ohne eigenes Datum, bekannte unvollständige Trade-Nebenkosten, nicht als interner Transfer zugeordnete Ein-/Auszahlungen. Letztere sind nicht automatisch Fehler oder interne Transfers. Importidentitäten als Herkunft, niemals als Vollständigkeitsbeweis. Ohne unabhängigen Anfang-/End-/Cashbeleg keine Aussage „vollständig abgeglichen“, kein Prozentwert, kein künstlicher Nullsaldo. Keine Rendite, Gebühren, Eröffnungen, historischen FX oder Anschaffungskosten berechnen/erfinden.

Vorhandene Kontopositionen-Aktion als konkreter Einstieg; bestehende Transferprüfung nur wenn Bewegungen vorliegen. Aufklappzustand bei renderSettings erhalten. Alle Texte und IDs HTML-escapen; keine Rohdiagnosen, Adressen oder Secrets darstellen.

## Abnahme

Gezielte fachliche Units: zwei Anbieter/Konten mit gleichem Instrument, Archive, Nullbestand, fehlende/undatierte Eröffnungen, mehrere Symptome je Position, unvollständige Kosten, Quellen-/Transfergrenzen, leeres Konto, manuelle Kurse, unverändertes Original, Reihenfolge und kein Credential-Leak. Bestehende gesamte Unit-/Syntaxgates. Im bestehenden Quality-Browsergate drei Engines,320/390/430/768/1440, echte Disclosure-/Kontodrilldown-Aktionen, Tastatur/Fokus,44px, Überlauf/Axe und exakter Portfolio-/Revisionsvergleich. Bestehende Finance/CAS/Backup/Offline-Gates erhalten; keine Workflowänderung nötig.

Kandidat SW189 ist keine Veröffentlichung. Noch kein PR-/CI-/Browser-/Live-PASS und keine konkrete neue Releasefreigabe behauptet. Vollständiger providerübergreifender Anfang-Endabgleich und reale Geräte/OAuth bleiben separate Gates. Nächster Schritt: Implementierung/gezielte Tests, sicherer Remote-Checkpoint und eigener reviewbarer PR.

## Erster Implementierungscheckpoint

Lokale741/741 Unit-Tests,0Fail/0Skip bestanden (sechs neue fachliche Referenzen einschließlich tatsächlichem CSV-ImportSource-Vertrag), vollständiger Syntaxcheck und diff-check bestanden. Keine Finanz-/Storage-/Backup-/Workflowdatei geändert. Bestehendes Drei-Engine-Qualitygate um geöffnete Kontoprüfung, fünf Breiten/Axe/44px/Kontodrilldown/Disclosurezustand/Tastatur und exakte Nullmutation erweitert. Neue Browsergates noch auszuführen; lokale Browserbinary fehlt, deshalb GitHub Actions maßgeblich. Bestehende erfolgreiche v188-Regressionsnachweise nicht als Abnahme des neuen Kandidaten ausgeben.

## Erster CI-Fehlnachweis — nicht abgenommen

CI40553064891 auf dd1e0f7: Wallet40553064753 SUCCESS, Crossjob122361695925 FAILED schon im vorhandenen UI07-Test. Neue Kontotransfer-Einstiege machten den bisherigen global eindeutigen Selektor [data-action=transfer-matching] mehrdeutig (strict mode). Keine Finanzabweichung nachgewiesen. Konto-Einstieg erhält eigenen UI-Aktionsnamen account-transfer-review, delegiert unverändert an dieselbe transferMatchingUI.open-Funktion. Bestehende Testassertion/Selector nicht abgeschwächt. Chromiumjob122361696443 läuft beim Diagnosezeitpunkt weiter und wird nicht abgebrochen; neuer Remote-Codecheckpoint erst nach seinem Abschluss.

Chromiumjob122361696443 inzwischen ebenfalls FAILED am identischen mehrdeutigen UI07-Selektor, nachdem bestehende Finanz-/Import-/History-/CAS-/Quota-/Recovery-/Backup-/Offline-Regressionssuiten tatsächlich bestanden hatten. Gesamtlauf bleibt FAILED, Deployment/Live übersprungen. Kein Job abgebrochen. Neuer vollständiger Lauf nach der gezielten Aktionsnamenkorrektur erforderlich.

## Zweiter CI-Fehlnachweis — neue Disclosure-Testbedienung

CI40553964596 /7e33c12: beide ursprünglichen UI07-Engines nun66Scans/0Findings PASS. Crossjob122364897858 scheitert im neuen Kontotest: clickDisclosed auf dem Summary öffnet dessen eigenes geschlossenes Details beim Reveal und schließt es durch den anschließenden Summary-Klick wieder. Gelesen wurde nur der Titel. Neuer Test öffnet zuerst ausschließlich die Vorfahren des Details-Containers (revealAction(details)) und klickt dessen Summary einmal; explizite Open-Assertion ergänzt, alle ursprünglichen Fach-/Nullmutationsassertionen erhalten. Screenshot bereits vor Axe für Diagnose sichern.

Separater Quelldiff-Review: bestehende Provider-CSS-Regeln erfassen auch verschachtelte Summary-Pfeile; neuer Kontopfeil erhält eigenen korrekten Closed/Open-Zustand. Konto-Untertexte hatten die helle Altfarbe #92a395; im neu geöffneten Prüfumfang vorhandene dunkle Hilfstextfarbe #4d6756 verwenden, keine globale Paletteänderung. Vollständige Browserabnahme weiterhin ausstehend. Laufender Chromiumjob wird nicht abgebrochen.
