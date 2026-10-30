# Copilot-Übergabe UI-VISUAL01/02/03 · verbindlicher Master-Nachtrag · 30.10.2026

Status: COPILOT_DELIVERED / WORK_INTEGRATION_PENDING. Kein automatischer Merge und keine automatische Releasefreigabe. Laufenden fachlichen PR212 und dessen Release unverändert zuerst abschließen. Keine parallele Neuentwicklung der gelieferten visuellen Pakete.

## Gelieferte Drafts und tatsächlich verifizierte HEADs

| Paket | PR | HEAD | Status bei Übernahme |
| --- | --- | --- | --- |
| UI-VISUAL01 | #209 | 7b3e4d06d3b6e65f64d7cf8b20259edde7afe766 | Draft, nicht gemergt; Läufe41027815448/41027815370 action_required |
| UI-VISUAL02 | #213 | e0c4462a70eb4bb949f8833f938838233c8290db | Draft, nicht gemergt; Pflicht41027272499 failure, Wallet41027272389 success |
| UI-VISUAL03 | #214 | ca9a14c09f5cacb4e8e479d9b9797632d0e857f7 | Draft, nicht gemergt; Pflicht41028390404 läuft, Wallet41028390513 success |
| Früherer Positions-Zeitraumkandidat | #208 | 4c4e32bc5359b508c4f76464eac4aba8f4d9a4ed | Draft,10 Dateien, nicht leer; Inhaltsvergleich zwingend |

Aktuelle GitHub-Daten haben Vorrang; HEADs und Status vor jeder Integration frisch prüfen. #208 ist laut Übergabe als superseded bezeichnet, darf aber wegen eigener Positions-Zeitraumänderungen nicht ohne Vergleich verworfen werden. Screenshots und Nachweise erhalten.

## Vollständiger Lieferumfang laut Copilot/Nutzerübergabe

UI-VISUAL01/#209: kompakte mobile Zeitraumwahl, mindestens44×44px Touchziele; bei320/360 liegt auch1J im Mehr-Menü. Aktiver Menüzeitraum sichtbar; Tastatur/Escape/Accessibility-Markup ergänzt; Zeitraumlogik soll unverändert sein. Copilot nennt Chromium/Firefox/WebKit und Vorher-/Nachherbilder. Diese Claims durch tatsächliche Work-Integrationsprüfung verifizieren.

UI-VISUAL02/#213: gesamter Reiter Mehr mit sämtlichen geöffneten Akkordeons, Abständen, Schrift und Touchflächen vereinheitlicht. Backup-/Hilfetexte gekürzt, OAuth-Origin dynamisch. Laut Copilot Backup-/Drive-/Speicherlogik unverändert,959Units und Chromium-/Responsiveness-Prüfungen bestanden. Vollständigen bestehenden Vertrag docs/UI_MASTER28_MEHR_GESAMTUX_2026-10-29.md erhalten; Anbieter/Konten,Datenstand,Backups,Backup-Passwort,Zusatzoptionen,Drive,Kursanbieter,Blockchain,technischeEinrichtung,Datenschutz und alle Unterbereiche einschließen. Fachliche Textprüfung bei Work.

UI-VISUAL03/#214: Buchungslisten, Positionskarten und Positionsdetails kompakter; laut Copilot ausschließlichCSS undScreenshots, keine Daten-/Auswahl-/Buchungslogikänderung.959Units,relevanteChromium- und ausgewählteFirefox-/WebKit-Prüfungen genannt. LangeNamen, Auswahl-/Aktionsbuttons und sämtliche Details erhalten.

## Verbindliche Abnahme und Integration

1. Nach abgeschlossenem fachlichem Release alle vier Drafts auf aktuellem main vergleichen.
2. Überschneidungen in styles.css und app.js sowie CSS-Kaskadeneffekte prüfen; #208 gegebenenfalls mit #209 fachlich konsolidieren. Vorhandene Arbeit wiederverwenden.
3. Copilot-Nachbesserungen nach Möglichkeit Copilot selbst ausführen lassen. Keine visuelle Parallelentwicklung durch Work.
4. UI-VISUAL01 zuerst vollständig abnehmen, danach02, anschließend03. Kein automatisches Zusammenführen aller drei. Begründete Abhängigkeitsänderung dokumentieren und Dateikollisionen ausschließen.
5. Jede konkrete Integration benötigt eigene vollständige Regression und gültige ausdrückliche Nutzerfreigabe. Nach jedem Merge tatsächliches Deployment/Liveverhalten prüfen.
6. Service-Worker-Version/PWA-Cache erst im tatsächlichen Integrationskontext passend aktualisieren, keine konkurrierenden Versionssprünge in Drafts. Keine roten Pflichtgates ignorieren/abschwächen und keine erfolgreichen Einzeltests als grüne Gesamtpipeline ausgeben.

Vorliegende Befunde: #213 rote Pflichtpipeline einschließlichSW-Gate/Crossbrowser; #214 mindestensSW-Gatefehler, weitereErgebnisse prüfen; #209 action_required-Ursache klären. Laufende Jobs regulär beenden. Work behält Finanz-/Datenlogik,Sicherheit,fachlicheTexte,Code-/Konfliktreview,volleRegression,Merge,Deployment/Liveabnahme.

## Qualitätsvertrag

Tatsächliche44×44-Touchflächen auch320/360; aktive und deaktivierte Zeiträume; Tastatur/Escape/Fokus; Screenreader-Beschriftungen; geöffneteMehr-Akkordeons; sachlich richtigeBackup-/OAuth-Erklärungen undFehlermeldungen; kompakteBuchungslisten mitlangenNamen;Auswahl/Aktionsbuttons;keineverdecktenInhalte/Überläufe;keineÄnderung gespeicherterFinanzdaten. BestehendePWA/Offline/Backup/Restore/CAS-Gates erhalten.

**Copilot hat keine echte Android-Hardware und keinen Screenreader getestet.** Emulation/Markup/Axe nicht als Hardware- oderScreenreaderabnahme ausgeben. BestehendeAndroid-QA-Grenzen erhalten.

AlleübrigenP1/Masteranforderungen regulär fortsetzen. FLH05 undFLH-PROJ01 OPEN/PARKED. Keine neueRoadmap. ZentralenCheckpoint nachjederEtappe mitPR,HEAD,Tests,Integrationsstatus undexakterFortsetzung separatcommitten/pushen undRemoteSHAprüfen.
