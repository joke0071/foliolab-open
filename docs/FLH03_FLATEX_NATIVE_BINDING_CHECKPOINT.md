# Native Kontobindung/Staging: UI-Kandidat lokal geprüft · 28.10.2026

Bestehender PR193/feature/flh03-flatex-native-identity, geprüfte Identitätsgrundlage
f42bc8ecc8538ce30ecc6ca9f862df0c0e6a2162/Baum9ee00039. Main4e9a4a7/v202
LIVE_ACCEPTED unverändert. Vorabvertragcc5bf653f9b156af8a909531708550e3d30bcc1e
vor Code dauerhaft auf zentralem Dokumentationsbranch feature/flh05-import-foundation.
Keine neue parallele Entwicklung; ältere Format-/Order-/Identitätsarbeit erhalten.

Vorhandenen nativen Dialog minimal erweitert: eingeklappte Kontozuordnung pro
Seite/Quellkontext, explizites Konto + gesonderte Bestätigung, keine Autofüllung.
Bestehende Depotchoices wiederverwendet, Kontokontexte ohne EUR-/Cashpositionsannahme.
Gewähltes Konto vollständig umbrechend sichtbar, keine unlesbare Mobil-Auswahlangabe.
Zuordnungen nur im Dialogspeicher; Datei/Modus/Kontowechsel/Cancel/Escape/Neuöffnen
setzen zurück. Native Identitäts-/Orderhelfer einmal je Dateistapel gecacht.

Reinlesende Quellstatus in vorhandenen Quelldetails: vorhandener/abweichender Nachweis,
Manualschutz, rohe Overlap-/Konflikt-/fehlende-Quellengates. Bestehende importSourceKey/
Importherkunftvalidator/sourceUnmodified/bookingOwnership wiederverwendet, keine
Finanzprojektion oder automatische Dedupe/Legacy-Migration. Bestätigung ist keine
Wirtschafts-/Eigentumsfreigabe; immer ready=false/writeEnabled=false und Submitguard.

Vor Auswahl/Bestätigung vorhandenes assertCurrent; tatsächliche konkurrierende
IndexedDBrevision blockiert Bestätigung, kein Dialogsave. Generation/Dialog nach
asynchroner Prüfung nochmals geprüft. 20er-Kontextpaging/Fokus/Offenhaltung neben
unveränderter Source50er-/Order20er-Anzeige. Pending-Dateistatus vor Asyncprüfung
zurückgesetzt, damit vorige fertige Vorschau nicht als neue Auswahl erscheint.

10neue fokussierte synthetische Units PASS;902/902gesamte Units unter Node20/24,
0Fehler/Skip. Neue Chromium-UIprüfung PASS: natürliche Auswahl/Bestätigung, bestehender/
Manual-/Konfliktstatus, alle Resetfälle/Paginierungen/Fokus,5Breiten/Axe/44px/Escaping,
erzwungener Submit, verzögerte Freshnessgeneration, echter konkurrierender Writer,
Offline-Neuladung mit Zuordnung und exakter IDB-/Revisions-/Settings-Nullmutation
durch diesen Dialog. Bestehende native Chromium-UIprüfung ebenfalls vollständig PASS.
Neue lokale Kontrollbilder320/1440 und Manualstatus tatsächlich angesehen.

UI-Integration IN_PROGRESS bis aktuelle volle Pflicht-CI/Wallet/3Engine-/Quell-/
Artefakt-/Bildabnahme; kein Produktiv-PASS aus lokalem Test ableiten. SW203 noch
Kandidat, Produktion v202. Parser/Transaktionsengine/Storage-/Backupformat unverändert,
keine Pins/Workflows/Assertions abgeschwächt. Keine privaten Originale/Produktivdaten
geändert. UI-MASTER28/DELETE-MASTER28 und Roadmap erhalten, Gesamtmaster PARTIAL.

Exakt nächster Schritt konsistenten Kandidaten auf gleichem Branch/PR sichern,
volle aktuelle CI/Artefaktdigests/3Engine-Berichte/Bilder/Testmergebaum prüfen und
zentral sichern. Danach zweite Etappe kontrollierter Merge/Main/Pages/echte
Liveabnahme mit Bytehashes/Restore/Offline/Produktionsbildern. Wirtschaftliche native
Übernahme/Original-Replay/vollständige Historien-/Bestands-/Performanceabnahme offen.
