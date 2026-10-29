# UI-MASTER28 – Kursoptionen und weitere UX-Korrekturen · 29.10.2026

Verbindlicher ergänzender Nutzerauftrag. Repository: https://github.com/joke0071/foliolab-open · Produktion: https://foliolab.unperfekt.at/ · zentraler Checkpoint docs/WORK_RESTPAKETE_CHECKPOINT.md auf feature/flh05-import-foundation. Bezug: konsolidierter UI-/UX-Gesamtauftrag vom 29.10.2026, UI-MASTER28, Issue #149 und vier zuletzt bereitgestellte Android-Screenshots.

## Entscheidung, Status und Kollisionsschutz

**TradingView vollständig aus der aktiven Anwendung entfernen.** Die frühere Anforderung „TradingView responsiv optimieren“ ist **SUPERSEDED BY USER**. Historische Git-/Releasebelege nicht verändern. Kein Ersatz durch ein anderes externes Widget.

Vier eindeutige Arbeitspunkte im bestehenden Master:

| ID | Umfang | Übernahmestatus |
| --- | --- | --- |
| UI-M28-K01 | TradingView entfernen und verbleibende Kursoptionen vereinfachen | OPEN / P2 |
| UI-M28-K02 | Längere Kryptokurszeiträume nur bei belegter Verfügbarkeit | OPEN / P2 |
| UI-M28-K03 | Kontodatenstand optisch und inhaltlich harmonisieren | OPEN / P2 |
| UI-M28-K04 | Technische Einrichtung und Datenschutz konsolidieren | OPEN / P2 |

Bestehenden Prozess weder unterbrechen noch neu starten oder umpriorisieren; keine parallele Implementierung/neue Roadmap. Aktive PRs, CI und Releases regulär beenden. Nachtrag am nächsten sicheren Checkpoint sichern; danach möglichst ein kleiner zusammenhängender UI-PR für diese vier Themen, sofern konfliktfrei. Vor jeder schreibenden Aktion aktuellen GitHub-Stand rekonstruieren; vor Implementierung main, Branches, offene PRs, CI-Jobs und Dateikollisionen prüfen. Bereits Erledigtes überspringen.

Bei Übernahme: PR200/SW213 LIVE_ACCEPTED; nächster laufender Schnitt ist kompakte Sperrgründe. Dieser Nachtrag unterbricht ihn nicht. Übrige P1-Arbeiten bleiben vor diesen P2-Themen priorisiert.

## UI-M28-K01 – TradingView entfernen

Ziel: native Kursdiagramme, nachvollziehbare Kursquellen, lokale Daten; keine externen Chartwidgets.

Prüfen und entfernen:

- src/position-detail-ui.js: Einbettung, „Öffentliches Diagramm laden“, externe TradingView-Links, Beschreibungen/Hinweise, Widgetcontainer/Platzhalter und unbenötigte Imports.
- src/app.js: openPublicTradingView(), zugehörige Klickaktionen, TradingView-Feld im Positionseditor und unbenötigte UI-/Importverweise.
- src/security-sources.js: TradingView-Bezeichner/Fallbackfunktionen auf tatsächliche Verwendung prüfen, Unbenötigtes entfernen. Fehlerhinweise auf native Quellen und CSV-Import abstimmen.
- styles.css: spezifische Container-/Iframe-/Mobile-Regeln bereinigen; gemeinsam genutzte Stile erhalten.
- index.html: TradingView aus CSP entfernen, soweit keine weitere aktive Abhängigkeit besteht. Google OAuth und andere Sicherheitsregeln unverändert.
- Tests, aktuelle Dokumentation, Hilfe, A11y-Beschriftungen, Einstellungen, Editor und Leerzustände: keine aktiven Verweise/Handler zurücklassen. Historische Nachweise erhalten.

Datenkompatibilität: Ältere Portfolios/Backups mit tradingViewSymbol bleiben sicher lesbar und ohne Datenverlust. Feld bei Bedarf als Legacy-Kompatibilität tolerieren, jedoch weder aktiv anbieten noch verwenden. Andere Börsenkürzel, ISIN, MIC, Handelsplätze, Kursquellen, Bewertungen und gespeicherte Kursverläufe unverändert.

### Verbleibende Kursoptionen vereinfachen

Nach Entfernung den tatsächlichen Inhalt von „Weitere Kursoptionen“ prüfen. Hauptfunktionen: CSV-Kursverlauf importieren, ersetzen und sicher entfernen. Bevorzugt dezente kompakte Aktion direkt in vorhandenen Positionsdetails; bei vorhandenem Import „CSV-Kursverlauf ersetzen“. Bestehende sichere Entfernen-Funktion erhalten. Kurzer Hilfetext, keine neue umrandete Karte, verschachtelten Akkordeons, redundanten Überschriften oder großen Leerflächen.

Nur wenn mehrere sinnvolle Funktionen bestehen, schlankes „Kursdaten verwalten“ behalten. Entscheidung nach tatsächlichem Inhalt. Native Charts, Zeiträume und Importlogik unverändert.

## UI-M28-K02 – Längere Kryptokurszeiträume

Befund: Bitcoin zeigt 7T,1M,3M,6M,1J. Längere Zeiträume erwünscht, sofern tatsächlich Daten verfügbar. Eine verlässliche kostenlose Begrenzung auf ein Jahr ist ausdrücklich akzeptabel.

availablePositionPeriods(), tatsächlich gespeicherte Historie und validierte CSV-Kursverläufe prüfen. Geeignete native Quellen auf nachweisbar längere Abdeckung prüfen; keine bloße Anbieterannahme. Bei belegter Abdeckung 3J,5J oder Max anbieten. Bei Platzmangel vorhandenes kompaktes Zeitraum-Mehr-Menü verwenden. Nicht verfügbare Optionen nicht funktionsfähig erscheinen lassen. Datenabdeckung nachvollziehbar anzeigen.

BTC,ETH,SOL und weitere unterstützte Kryptowährungen nach denselben Regeln. Keine künstlichen alten Kurse oder historischen Bewertungen aus heutigen Kursen. Keine verpflichtenden neuen Schlüssel, Dienste oder Abos. Kursentwicklung und persönliche Portfoliorendite klar unterscheiden.

## UI-M28-K03 – Kontodatenstand harmonisieren

Befund: Mehr → Anbieter und Konten → Flatex → Wertpapierdepot, „Datenstand · Wertpapierdepot“ unnötig umrandet; Abstand nach darüberliegender Trennlinie unharmonisch.

renderAccountEvidence(), .account-evidence, .advanced-apis und Anbieter-/Kontenverwaltung prüfen. Äußeren Zusatzrahmen und überflüssigen Hintergrund entfernen; harmonische Abstände nach vorhandener Linie. Überschrift/Aufklappsymbol konsistent ausrichten. Bestehende Akkordeongestaltung verwenden; keine doppelten Linien oder verschachtelten Karten.

Standard geschlossen/kompakt; technische Prüfwerte sinnvoll gruppieren, lange Aufstellungen strukturieren. Warnungen auffindbar; alle Daten und Prüfergebnisse erhalten. Unvollständigen Abgleich niemals als bestätigt darstellen. Singular korrigieren, etwa „1 Konto“ statt „1 Konto/Konten“.

## UI-M28-K04 – Technische Einrichtung und Datenschutz

Befund: doppelte teilweise redundante Cloudflare-Anleitungen und uneinheitliche Mischung aus Einrichtung, API und Datenschutz.

Drei klare Themen:

**A. Erweiterte Wertpapiersuche:** optionaler Suchdienst; Name/ISIN; Umfang ohne eigenen Worker; welche Informationen externe Suchanfragen übertragen.

**B. Optionaler EODHD-Kursdienst:** wann eigener Worker nützt; mögliche Grenzen direkter Browseranfragen; benötigte Zugangsdaten; welche Funktionen ohne Worker bleiben.

**C. Datenschutz und technische Hintergründe:** lokale Datenhaltung, externe Abfragen, Verarbeitung/Speicherung von API-Schlüsseln, Grenzen/Risiken externer Dienste.

Gemeinsame Cloudflare-Grundlagen einmal; Diensteunterschiede kurz; zentraler Link zur vorhandenen vollständigen Anleitung. Keine doppelten nummerierten Folgen oder wiederholten Datenschutztexte. Technikdetails standardmäßig geschlossen/nachrangig. Kurze Einleitungen, einheitliche Größen/Überschriften/Zeilenhöhen/Abstände/Listen/Hinweise, mobil lesbar; keine unnötigen Rahmen/Kartenverschachtelungen.

Worker bleibt optional, FolioLab grundsätzlich ohne eigenen Worker nutzbar. Direkt nicht unterstützte Funktionen nicht als garantiert darstellen. Ausschließlich Führung, Texte und Darstellung ändern; keinerlei Änderung an Endpunkten, Authentifizierung, Secrets, CORS, Übertragung, IndexedDB, Backup/Restore oder OAuth-Rechten.

## Unverändert erhalten

Native Wertpapier- und Kryptocharts; CSV-Historienimport; EODHD/FMP/TwelveData/CoinGecko/andere bestehende Quellen; historische EUR-FX; Börse/Ticker/MIC/ISIN; Datenbasissteuerung; Diagrammmodi Automatisch/Linie/Punkte; Zeitfilter; lokale Speicherung; Offline-PWA; sämtliche finanziellen Bewertungen.

Gesamter vorheriger UI-Vertrag bleibt gültig, insbesondere gemeinsame Positions-/Buchungs-/Referenzverwaltung, Bearbeiten-Text, kompakte Sperrgründe, sichere Löschlogik, Archiv-Dropdowns, Diagrammeinstellungen, mobile Zeiträume, Tooltips, Liquidität/Fälligkeiten, schlanke Header, Gebuchte Vorgänge und entfernte redundante Chartbeschriftungen. Nur TradingView-Optimierung ist ersetzt.

## Verbindliche Abnahme

TradingView: keine Widgets, sichtbaren Buttons/Links, Editorfelder, verwaisten Handler, unnötigen CSP-Freigaben, spezifischen CSS-Reste oder leeren Kursoptionsakkordeons. Alte Backups sicher lesbar; native Charts und CSV-Import funktionieren.

Krypto: lange Optionen nur bei nachgewiesenen Daten; ein Jahr bei begrenzter Quelle zulässig; keine erfundenen Kurse/Bewertungsänderungen; mobil kompakte Wahl.

Kontodatenstand: kein unnötiger Außenrahmen, passende Abstände, keine doppelten Karten; vollständige Informationen erreichbar.

Technik: keine doppelte Cloudflare-Anleitung, Suche/Kursdienst/Datenschutz klar, Optionalität korrekt, keine falschen Verbindungszusagen oder geänderten gespeicherten Geheimnisse.

Chromium/Firefox/WebKit,320/390/430/768/1440px,Tastatur/sichtbarerFokus,A11y/Kontrast,Offline/PWA und sämtliche Finanz-/Import-/CAS-/Backup-/Restoregates. Öffentliche Daten/Artefakte ausschließlich synthetisch. Neue Nachweise nur für tatsächlich geprüfte Zustände, keine Hardwareabnahme aus Emulation ableiten.

## Absicherung und Fortsetzung

Nach jeder abgeschlossenen Etappe und vor Limits: sichere Änderungen committen/pushen; Remote-SHA prüfen; zentralen Checkpoint separat committen/pushen; PR-/CI-/Releasebelege, DONE/PARTIAL/BLOCKED und exakte Fortsetzungsstelle sichern. Keine ungetesteten Änderungen veröffentlichen. Historischen Dokumentationsbranch niemals als alten Appcode nach main mergen. FLH05 und FLH-PROJ01 OPEN/PARKED, alle übrigen Masterpakete erhalten. Keine Doppelimplementierung und keine unbegrenzte neue Auditphase.
