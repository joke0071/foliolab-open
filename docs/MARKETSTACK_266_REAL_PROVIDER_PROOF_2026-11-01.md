# Marketstack #266 — autorisierte reale Vier-ETF-Prüfung, 01.11.2026

Eigener privat bereitgestellter Nutzerkey, keine gemeinsamen Zugangsdaten. Reale Browser-fetch-Aufrufe mit aktivem CORS aus https://foliolab.unperfekt.at in isoliertem Dokument/eigenem Browserprofil. Lokaler Prüfproxy mit expliziter TLS-Zertifikatsausnahme; kein physischer Android- oder unabhängiger Browser-TLS-Nachweis. Keine privaten Bestände, Wallets oder Schlüssel in diesem Dokument. Vollständige Anbieterpayloads werden nicht veröffentlicht.

## Ergebnis

| Referenz-ISIN | Instrument | V2-Anbietersymbol | API-MIC | Preiswährung | EOD-Datum | Ergebnis |
|---|---|---|---|---|---|---|
| IE00BK5BQT80 | Vanguard FTSE All-World UCITS ETF USD Accumulation | VWCE.DE | XETR | EUR | 2026-10-30 | HTTP200, positiver Raw-close |
| IE00BL25JP72 | Xtrackers MSCI World Momentum UCITS ETF 1C | XDEM.DE | XETR | EUR | 2026-10-30 | HTTP200, positiver Raw-close |
| IE00BL25JL35 | Xtrackers MSCI World Quality UCITS ETF 1C | XDEQ.DE | XETR | EUR | 2026-10-30 | HTTP200, positiver Raw-close |
| IE00BG0SKF03 | iShares Edge MSCI EM Value Factor UCITS ETF USD | 5MVL.DE | XETR | EUR | 2026-10-30 | HTTP200, positiver Raw-close |

ISINs stammen aus der bestehenden kuratierten Referenzliste, nicht aus der Marketstack-Antwort. Anbieter-Discovery bestätigt jeweils exakten Fondsnamen, Symbol und MIC XETR; EOD-Antwort bestätigt erneut Namen/Symbol/XETR/price_currency EUR/Datum. Fondsname mit USD bezeichnet die Fonds-/Anteilsklassenbezeichnung, nicht die Kurswährung. Kein Frankfurt-/London-/USD-Ersatz. Der erfolgreiche Vier-Symbol-Aufruf war V2 /eod/latest mit symbols=VWCE.DE,XDEM.DE,XDEQ.DE,5MVL.DE und exchange=XETR. Pagination count/total=4. Raw-close ist vom separat vorhandenen adj_close zu unterscheiden. Zahlenwerte werden für öffentliche Evidenz bewusst nicht reproduziert.

## API-Unterschiede / Negativkontrollen

- V2 /tickerslist?search=<Ticker> liefert die benötigten Metadaten. V2 /tickers lieferte HTTP404 Route not found; daraus keine Nichtabdeckung ableiten.
- Unqualifizierte Symbole und alte *.XETRA-Symbole lieferten bei V2 HTTP422 no_valid_symbols_provided. V1-Discovery kennt VWCE.XETRA, V2 hingegen VWCE.DE. Keine blinde Suffixheuristik implementieren.
- Alle erfolgreichen JSON-Antworten waren browserseitig lesbar; kein Worker, no-cors oder Drittanbieterproxy zum Umgehen von CORS.
- Der bereitgestellte Zugang ist für den dokumentierten Vier-ETF-EOD-Aufruf tatsächlich berechtigt. Die konkrete Tarifbezeichnung und das verbleibende Kontingent wurden nicht im privaten Dashboard geprüft.

## Kontingent und Nutzungsumfang

Offizielle Preisübersicht https://marketstack.com/pricing/ nennt Free 100 Requests/Monat, EOD, ein Jahr Historie, HTTPS und nichtkommerzielle Nutzung. https://marketstack.com/faq zählt jeden angefragten Ticker als eine Einheit, auch bei Mehrsymbolabfragen; vier ETFs kosten daher vier Einheiten, nicht eine. Die FAQ enthält an anderer Stelle noch eine widersprüchliche 1000-Angabe; konservativ 100 verwenden und echte Kontolimits beachten. Keine kostenpflichtigen Upgrades/Overages auslösen. Die heutigen erfolgreichen Discoveryabfragen verbrauchen ebenfalls unbekannte kontoabhängige Einheiten; kein angeblich unberührtes Monatsbudget voraussetzen.

Geeigneter geplanter Einsatz: optionaler eigener Key für private nichtkommerzielle Portfolioansicht, direkt auf dem Endgerät, keine zentrale Schlüssel-/Datenverteilung. Kostenpflichtige kommerzielle/redistributive Rechte werden nicht unterstellt. Die verlinkte allgemeine APILayer-SaaS-Vereinbarung ist keine eindeutige zusätzliche Marketstack-Datenweitergabefreigabe. Öffentliche Appverfügbarkeit allein darf nicht als Shared-Key-/Redistributionsrecht behandelt werden. Integration auf persönliche lokale Nutzung begrenzen, keine Marktpreise in gemeinsamem öffentlichen Servercache oder CI-Realzugänge.

## Nächster serieller Implementierungsschritt

Positiver technischer Daten-/CORS-/Zugangsbeleg; noch kein produktiver Adapter oder LIVE_ACCEPTED. Bestehende bestätigte ISIN/EUR/XETR-Identität prüfen, Rohschlusskurse und echte Tagesdaten validieren, Monatsbudget atomar begrenzen, Quotes/Historie gemeinsam cachen und keine Wochenend-Doppelabfragen. Eigene Schlüssel über die vorhandene verschlüsselte lokale Konfiguration führen. Danach API-/Backup-Bereinigung einschließlich benötigter Suche/FX, IDB-Migration und Legacy-Restore ohne Wiederbelebung entfernter Schlüssel. Vor Implementierung aktiven Alpha-Pacing-Strang/Übergabe und Main prüfen; kein paralleler Integrationsbranch.
