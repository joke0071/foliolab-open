# #266 – direkte Alpha-Vantage-Tageskurse

Umfang: zusätzliche automatische/wählbare BYO-Key-Quelle für die vier nachgewiesenen EUR/XETR-ETFs VWCE/IE00BK5BQT80, XDEM/IE00BL25JP72, XDEQ/IE00BL25JL35, 5MVL/IE00BG0SKF03. Provider-Symbole *.DEX; keine Frankfurt-/London-/Währungsersetzung. Autorisierter echter SYMBOL_SEARCH-/TIME_SERIES_DAILY-/GLOBAL_QUOTE-Nachweis: [redigierter Anbieterbeleg](https://github.com/joke0071/foliolab-open/blob/feature/flh05-import-foundation/docs/ETF_266_REAL_PROVIDER_PROOF_2026-11-01.md). Keine Nutzerzugänge oder Originalportfolios im Repository.

Die API liefert hier keine ISIN. Deshalb nur die exakt kuratierten ISIN/Ticker/EUR/XETR-Referenzen verwenden; exaktes Antwortsymbol, Datum und Rohschlusskurs prüfen. TIME_SERIES_DAILY/compact verwendet ungeadjustete `4. close`, maximal 100 Handelstage. Kein Echtzeitversprechen und keine erfundene längere Historie. FMP/Twelve bleiben auswählbar; optionaler eigener EODHD-Worker bleibt erhalten.

Ein eigener Schlüssel wird unter Mehr → Kurse & API-Schlüssel lokal gespeichert. Kein eingebauter, geteilter oder automatisch aus privaten Testdaten übertragener Schlüssel. Er ist im gewöhnlichen Portfolioexport ausgeschlossen und nur in ausdrücklich eingeschlossener Konfiguration des vollständigen verschlüsselten Backups portabel. Entfernen der API-Schlüssel berücksichtigt das neue Feld.

## Limit- und Speichervertrag

- Geteilte Tagesreihe für Quote/History/Diagnose, deduplizierte laufende Abfragen und dauerhafter Tagescache in separater IndexedDB `foliolab-open-market-cache`. Keine Finanzdaten/Walletadressen/Zugangsdaten im Kurscache. Budgetkennungen enthalten ausschließlich SHA-256-Fingerprints, keine Keys oder vollständigen Request-URLs.
- Seriell, 2,5 Sekunden Abstand zwischen reservierten Requests; persistierte atomare Budgetreservierungen schützen auch mehrere Tabs. Höchstens 25 Versuche je UTC-Tag/Keyfingerprint auf diesem Browser. Fehlversuche verbrauchen ebenfalls Budget. Andere Geräte/Programme desselben Keys sind nicht messbar; echte Limitantworten bleiben maßgeblich.
- HTTP200 Information/Note ist ein Fehler, niemals ein Preis. Burstlimit führt zu kurzer Sperre; Tageslimit bis Tageswechsel. Kein automatisches kostenpflichtiges Upgrade, kein Full-History-Premiumendpoint, kein Worker für Alpha Vantage.
- IndexedDB für Budget/Cache muss verfügbar sein, sonst keine unkontrollierten AV-Anfragen. Vorhandene Portfoliokurse bleiben bei Limit, falscher Identität, altem Datum oder Netzfehler erhalten.
- Cachewerte werden in der Diagnose ausdrücklich als lokale Tageskurse bezeichnet; daraus folgt kein neuer Browser-/Key-/Verbindungsnachweis. Der kanonische Portfoliorecord und seine CAS-Revision bleiben bei Diagnose unverändert.
- Bestätigte FMP402 und Twelve404 mit ausdrücklichem Grow/Venture-Tariftext werden sicher klassifiziert und je Keyfingerprint/Listing/Operation bis zu 24h von automatischen Wiederholungen ausgenommen. Ein allgemeines404 wird nicht als Tarifproblem geraten. „Kursversorgung prüfen“ erlaubt bewussten erneuten Zugangstest nach Upgrade.
- Alle lokalen Daten löschen leert zusätzlich den wegwerfbaren Kurscache. Ein Cachefehler darf einen bereits gelöschten Finanzbestand nicht wieder im Modell behalten.

## Prüfung

Neue Unitprüfungen: vier eindeutige Zuordnungen und Widersprüche; Rohschlusskurse/Datum/fehlerhafte Payloads; Sanitierung; Cache/Dedupe/Neustart; Drosselung/25er-Budget/Tagwechsel; Limitantworten; bestätigte versus allgemeine404; manueller Recheck; sichere Backup-Konfiguration.

Die bestehende verpflichtende ETF-Browser-Suite importiert zusätzlich `browser-alpha-vantage.mjs`; keine historischen Gates ersetzt. Reale IndexedDB, synthetisches Netz: vier UI-Kursupdates/exakte Mengen, Quell-/Kursdatum, Quote+History mit vier statt acht Abfragen, Cache nach Reload, atomarer persistierter Budgetstopp ohne Preisänderung, Diagnose ohne Finanzwrites, persistierte FMP/Twelve-Sperre mit Recheck, sieben Breiten/Axe. Läuft damit in Chromium/Firefox/WebKit auf PR, Main und tatsächlicher Produktion. Synthetische Antworten sind kein echter Anbieterbeleg; dieser ist separat verlinkt.

Status: Kandidat v259, vollständige CI und tatsächliche Produktionsabnahme vor Release erforderlich. Kein physischer Android-/Safari-/unabhängiger Browser-TLS-Beleg behauptet.
