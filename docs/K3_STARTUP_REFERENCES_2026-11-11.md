# K3 / UI-R1 – Stichtagsnotizen und verzögerter Start · 11.11.2026

Basis v308 LIVE_ACCEPTED, Main `0be4c7f07a60e1d17ce5a5691261a52810701329`, Tree `f8de9bb981a350b87215f8ac7c70ac268d749ea7`. Alleiniger Owner `main-a845c64598ab-20261111`. Auftrag gemäß bestehendem Wochenplan/Nutzerbefunden; kein Herkunfts-/Datenformat-/Identitätswechsel.

## Vollständiger Nutzerablauf

Im vorhandenen Verwaltungsmodus erhalten sämtliche Stichtage den vorhandenen Bearbeitungsdialog. Eindeutig manuelle Referenzwerte behalten bestätigungspflichtige Datum-/Betragskorrekturen. Automatische, migrierte, ungeklärte und widersprüchliche Originale erlauben ausschließlich Notizänderungen. Datum/Betrag bleiben readonly UND bei programmatisch veränderten Formwerten im Domainvertrag gesperrt. Herkunft, Bewertungsqualität, Aufschlüsselungen, Kurstermine, Journal, Bestände, Renditestart und bestehende Revisionen bleiben erhalten. Vorige Notiz/Quelle/Qualität werden über die bestehende Revisionsstruktur erhalten. Keine neue Datenform, Migration oder Neuberechnung. Abbruch einer manuellen Korrekturbestätigung lässt Formular und Entwurf offen (explizites vorhandenes false-Ergebnis des Dialogvertrags).

Startwächter unterscheidet reine Verzögerung von tatsächlichem Modul-/Laufzeitfehler. Nach zwölf Sekunden weiterhin animiert, mit vorhandener Hilfe und unverändert einem Initialisierungspfad/Späterfolg. Tatsächlicher Fehler stoppt die Animation; spätere Timeoutmeldung überschreibt Fehler nicht. Reduced Motion bleibt unverändert statisch.

## Vor Freeze

- Lokale vollständige Suite **1385 Tests / 0 Fehler / 0 Skips**, Syntax sämtlicher src/worker sowie geänderter Browserdateien PASS.
- Bestehende 26 Domainprüfungen Referenzen/Portfolioedit bestanden. Neuer Notizvertrag gegen aktuellen Baselinecode: erwarteter Fehler bei geschützter Notiz, 21 alte Fälle PASS. Kandidat einschließlich vier Quellklassen, TWR/XIRR/Beobachtungen/Journal und Klartext-/verschlüsseltem Roundtrip PASS.
- Vier ausgeführte Startwächter-Gegenproben: Baseline 1 PASS/3 erwartete Fehler, Kandidat 4 PASS. Beobachteter Codepfad ist ein Browser-/Source-Repro, **kein tatsächlicher Android-Repro**.
- Native bestehende Drei-Engine-Suiten erweitert: geschützte Felder/programmatischer Bypass, Notizrevision, Abbrechen/ungültige Werte/echter IDB-put-Fehler/Entwurferhalt; bestehende CAS-/Startanker-/Offline-/FreshRestore-Verträge erhalten. Drei echte Animationsframes auch nach Timeout, echter Fehler stoppt; Reduced Motion bleibt.
- Lokaler Browserstart wegen fehlendem Chromium-Binary blockiert; kein lokaler Browser-PASS. Native finale PR-/Main-/Produktionsgates sind vollständig erforderlich.

## Pflichtabnahme

Exakter eingefrorener SHA/Tree, unveränderte Full-CI/Wallet, alle Berichte/Originale, drei Engines, Sichtprüfung neuer und geänderter Ansichten, Herkunfts-/Decimal-/UNKNOWN-/CAS-/IDB-/PWA-/Offlinegates; immutable Sicherung/gepinntes Readback/tatsächlicher Restore vor Integration, danach Main/Deployment/echte Produktion und Abschlussbackup. Keine Wiederholung von PR329/v308, keine zusätzliche CI nur zur Messung.

Tatsächliches Android mit Bewegungseinstellung, kurzer/langer Ladezeit, Fehler und Späterfolg bleibt ausdrücklich extern offen. Kein physisches Gerät verfügbar; aus drei Browserengines folgt keine Hardwareabnahme. Navigation/Installation/Dashboard folgt als eigenes zusammenhängendes Paket; CI-B-WIP bleibt erhalten. Workflow und zurückgestellte Optionen unverändert.

## Korrektur nach erster nativer CI

Erster Kandidat9c19de226357de67fc3d4327d02d148041d92fc1/Run43038133160 nicht akzeptiert: Chromium erreichte den neuen Korrekturabbruchtest; Wechsel des Dialoglisteners während des Events konnte dasselbe bereits behandelte Dialogereignis doppelt akzeptieren. Genau ein permanenter Handler mit expliziter einmaliger Dismiss-Entscheidung ersetzt den Listenerwechsel; der Test wartet auf den abgeschlossenen Editor-Submit. Produktcode unverändert. Alle drei Cross-Jobs scheiterten separat vor den Tests an DNS-Auflösung von archive.ubuntu.com und dem bestehenden8-Minuten-Installationslimit. Fehleroriginale/Logs erhalten. Keine Workflow-, Timeout-, Engine- oder Gateabschwächung; neue vollständige Pflicht-CI am korrigierten SHA, kein identischer Retry des alten Laufs. Bei erneutem Infrastrukturfehler nicht blind wiederholen.

Zweiter Kandidataf7673336a08a7da79e45eb2c551d0cc271d4593/Run43040242297: neue tatsächliche IDB-Referenzsuite in Chromium vollständig PASS (Notizrevision, manipulierte Feldwerte, Abbruch, Quota, CAS, Offline, Klartext-/verschlüsselter Restore,5Breiten/Axe). Späterer alter Legacy-UI-Vertrag browser-position-details erwartete noch0Bearbeitungsbuttons für beobachtete Originale und brach ab. Erwartung auf sichtbaren Notizeditor mit explizit readonly Datum/Betrag, bearbeitbarer Notiz und bytegleichem Abbruch angepasst; bestehende manuelle Korrektur-/Originalschutzprüfungen erhalten. Gesamte Tests nach weiteren gleichartigen Erwartungen durchsucht. Produktcode unverändert. Drei Cross-Jobs erneut vor Tests an demselben DNS-/Installationsfehler gescheitert. Kein dritter blinder Lauf: diese zweite Testkorrektur zunächst als unveränderlichen WIP-Commit sichern, PR-Branch nicht bewegen; vollständige neue native Qualifikation nach behobener Infrastruktur erforderlich.
