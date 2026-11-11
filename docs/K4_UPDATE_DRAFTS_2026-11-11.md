## Implementierter Kandidat v307 · main-75ea9fa46556-20261111

Gemeinsames K4-Ergebnis: Formularentwürfe nach Fokusverlust bei automatischem Update erhalten; bewusstes Aktualisieren erst nach bestätigtem Verwerfen. Bestehende Formwerte werden unmittelbar mit den aktuellen gespeicherten Modelleinstellungen verglichen; keine zweite Schlüsselkopie oder Entwurfspersistenz. Semantisch gleiche HTTPS-Endpunkte bleiben sauber, ungültige neue Eingaben geschützt. Bestehende Busy-/Editor-/Dialog-/Fokusgrenzen bleiben erhalten.

| Abnahmekriterium | Prüfung | Phase / Stand |
| --- | --- | --- |
| Fokusverlust, alle vorhandenen Formularfelder, ungültige Endpunkte, fehlgeschlagenes Speichern | pwa-update-drafts.test.mjs; pwa-update-draft-browser-contract.mjs | Lokal10/10PASS; reale Browser noch CI-pending |
| Echte Workerübernahme erhält Entwurf; Cancel erhält Dokument, bestätigtes Verwerfen lädt neu; exakte Daten/Revision | pwa-update-draft-native-contract.mjs in bestehender browser-pwa-update.mjs | PR/Main je3Engines verpflichtend, noch pending |
| Ausgelieferte Handler, saubere/normalisierte/geleerte Felder, tatsächlicher fehlgeschlagener IDB-put | pwa-update-draft-browser-contract.mjs in bestehender UI300-Suite | PR/Main/echteProduktion je3Engines; Controllerereignis ausdrücklich synthetisch |
| Keine neuen Provideranfragen/Schlüsselwerte in Berichten | isolierter Browserkontext, Request-Gegenprobe, redigierte Berichte | Pflicht-CI/Produktion pending |
| Bisherige Warmcache/503/Aktivierungs-/Assets-/Offline-/Finanz-/Recovery-Verträge | bestehende unveränderte Pflichtsuiten | PR/Main/Produktion/Sicherung getrennte Nachweise |

Quellcode-Baseline:4PASS/6reproduzierteFehler; Kandidat10PASS/0Fehler/0Skips und SyntaxPASS. Lokaler nativerChromium-Start durchHostumgebung blockiert; keinBrowserPASS. Keine vollständige lokale Regression behauptet. PR-Kandidat erst nach kompletter SHA-gebundener Pflicht-CI qualifizieren. Main/Deploy/tatsächlicheProduktion und privateSicherung/Restore folgen separat. Rückfall: vorIntegration keine Mainänderung; beiFinding korrigieren/neuenKandidatenprüfen, gespeicherteDaten undInstallationsidentität erhalten. NativeAndroid/Safari/TalkBack/OAuth/OS-Absturzgrenzen bleiben extern. v306/V140 sind vollständig abgenommen.

---

# K4 – ungespeicherte Datenquellen bei PWA-Update · 11.11.2026

## Taskkarte / noch keine Implementierung

Owner main-40aba94dd4bd-20261111. Vorbefund am qualifizierten v306-Quellstand8a5c5c2d164b87831814be8fe0258356928d1abc. Erst nach vollständigem sicherem v306-Abschluss umsetzen; keine zweite Produktimplementierung während laufender Main-/Produktionsabnahme.

Nutzerziel: Ein noch nicht gespeicherter Datenquellen-Entwurf geht beim automatischen PWA-Neuladen nicht verloren, auch wenn der Fokus das Eingabefeld bereits verlassen hat. Explizites Aktualisieren darf ihn erst nach verständlicher Verwerfbestätigung aufgeben. Keine Garantie gegen Betriebssystem-/Browserabsturz oder manuelles erzwungenes Neuladen.

## Belegter Stand und Grenze

Die tatsächlich ausgeführte Funktion pwaUpdateShouldDefer prüft saving/busy/editor/offene Dialoge und aktuell fokussierte Eingabeelemente. Nach Fokuswechsel außerhalb eines Felds ergibt die isolierte Quellcode-Gegenprobe false; ein ungespeicherter apiSettings-Entwurf wird derzeit gar nicht geprüft. Der Controllerchange-Pfad kann dann location.reload aufrufen. Das ist ein gezielter Quellcode-/Vertragsbefund, noch keine echte native Worker-/Produktionsreproduktion und kein bestätigter Verlust gespeicherter Portfolio- oder Zugangsdaten.

Die vorhandenen echten PWA-Update-Tests sichern Warmcache/503/Controller/Assetbytes/IDB/Offline, enthalten aber bisher keinen ungespeicherten Datenquellenentwurf. Fertige Update-/Finanz-/Storagegates nicht ersetzen.

## Begrenzter Umsetzungsvorschlag

Im bestehenden app.js die tatsächlich angezeigten, zum API-Formular gehörenden Einstellungen mit den gespeicherten Modelsettings vergleichen. Vorhandene reine Endpointvalidierung für semantisch gleiche URL-Darstellung nutzen; ungültige neue Eingaben bleiben ein schützenswerter Entwurf. Keine zusätzliche Speicherung, globale Kopie von Zugangsdaten, Migration, neue Updateengine oder Änderung an Installationsidentität/Worker-Aktivierung.

Automatischen Controllerchange bei solchem Entwurf über das vorhandene Updatebanner verschieben. Bei bewusstem Klick auf Jetzt aktualisieren vor Verlust dieses Entwurfs bestätigen lassen; Cancel erhält alles. Vorhandene Busy-/Editor-/Dialoggrenzen erhalten. Erfolgreich gespeicherte normalisierte Einstellungen und explizit geleerte API-Schlüssel dürfen keine falsche neue Updateblockade erzeugen.

## Abnahmekriterien

1. Entwurf bleibt bei nativer Workerübernahme nach Fokusverlust erhalten; Banner statt Reload.
2. Cancel beim bewussten Update erhält Formularinhalt und Dokument; ausdrückliches Verwerfen erlaubt Reload.
3. Frisch geladene, erfolgreich gespeicherte/normalisierte und ausdrücklich geleerte Einstellungen bleiben als sauber erkennbar; bei fehlgeschlagenem Speichern Entwurf weiter schützen.
4. Alte Warmcache-/503-/Aktivierungs-/Asset-/IDB-/Offlineprüfungen unverändert in Chromium/Firefox/WebKit; neue native Fixture separat hinzufügen. Tatsächliche ausgelieferte Handler zusätzlich in vorhandener Produktions-UI-Suite mit ausdrücklich synthetischem Controllerchange prüfen, nicht als nativen Hardwarebeleg ausgeben.
5. Exakte kanonische Portfolio-/Einstellungsbytes und Revision bei Update/Cancel/Verwerfen unverändert; keine Anbieteranfragen durch den Test, keine Schlüsselwerte in Berichten.

Risikostufe: begrenzte gemeinsame Update-/Formularlogik mit sensitiven Eingabefeldern; alle Pflicht-CI/Main/echteProduktion/privatenBackup-/Restoregates erhalten. K4 insgesamt bleibt PARTIAL, echte Android/Safari/OAuth-/OS-Grenzen bleiben extern. Keine Komfortausweitung oder neue CI-Plattform.

