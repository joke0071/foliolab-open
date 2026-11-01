# #266 – echte Anbieterprüfung 01.11.2026

Ausschließlich öffentliche Instrumentmetadaten/Marktdaten und redigierte Fehler; keine Nutzerbestände, Originalbackupinhalte, Adressen, Zugangsdaten oder privaten Dateiverweise. Private Konfiguration nur isoliert im Prozessspeicher entschlüsselt, kein Restore/Portfolioimport.

## FMP und Twelve Data

Autorisierte echte Nutzerzugänge. Direkte Quote-Anfragen für VWCE, XDEM, XDEQ und 5MVL. FMP stable/quote mit bestätigtem SYMBOL.DE: jeweils HTTP402, Anbietertext: Special Endpoint / symbol not available under current subscription. Twelve /quote symbol=SYMBOL&mic_code=XETR: jeweils HTTP404, Anbietertext ausdrücklich Grow or Venture plan required. Zusätzlich Twelve /time_series für VWCE, interval=1day, adjust=none, outputsize=1: dieselbe Tarif-404. Kein falscher Key oder falscher Ticker aus diesen Antworten abgeleitet. Node-Kontrollen liefern ACAO *. Browser-fetch von https://foliolab.unperfekt.at kann Fehlerbody tatsächlich lesen. Keine nutzlosen alternativen vierfachen EOD-Abfragen nach eindeutigem Tarifbeleg.

## Alpha Vantage: positiver technischer Nachweis

Eigener kostenloser Nutzerschlüssel wurde privat bereitgestellt; wird nicht in Repository/CI gespeichert. SYMBOL_SEARCH lieferte für alle vier jeweils einen ETF mit Region XETRA, EUR, eindeutigem Namen und Ticker SYMBOL.DEX. Frankfurt-Symbole *.FRK und GBX/London nicht verwenden. API liefert keine ISIN; Bindung muss deshalb vor Übernahme über kuratierte ISIN+ETF+Symbol+EUR+XETR-Referenz und passenden Suchtreffer erfolgen.

| Ticker | ISIN | AV-Ticker | Rohschlusskurs EUR | Handelstag |
| --- | --- | --- | --- | --- |
| VWCE | IE00BK5BQT80 | VWCE.DEX | 168.9000 | 2026-10-30 |
| XDEM | IE00BL25JP72 | XDEM.DEX | 81.8200 | 2026-10-30 |
| XDEQ | IE00BL25JL35 | XDEQ.DEX | 82.0100 | 2026-10-30 |
| 5MVL | IE00BG0SKF03 | 5MVL.DEX | 84.2800 | 2026-10-30 |

TIME_SERIES_DAILY mit outputsize=compact, ungeadjustete 4. close. Meta Data Symbol jeweils exakt *.DEX / Last Refreshed 2026-10-30. Alle vier tatsächlichen Tagesreihen auch durch Browser-fetch von Produktionsorigin gelesen; kein Worker/Proxy-Datenanbieter. GLOBAL_QUOTE VWCE.DEX bestätigt denselben Kurs/Handelstag. Provider-Metadatum Time Zone=US/Eastern ist keine Xetra-Zeitzonenbestätigung; Tagesstrings ohne künstliche Zeitumrechnung behandeln. Suchantwort XETRA/EUR und offizielle DEX-Dokumentation tragen Handelsplatznachweis.

**Grenzen:** Tests im isolierten Chromium mit blockiertem Service Worker und leerem Kontext, keine Produktiv-IDB verändert. Hostnetz benötigt seinen Prüfproxy; Browser-Zertifikatsprüfung nur für diesen Zusatztest wegen Host-CA deaktiviert, daher kein unabhängiger TLS-/Android-Gerätenachweis. Die CORS-Sicherheitsprüfung blieb aktiv. Kein Mock/route/no-cors. Node-HTTPS-Kontrollen separat mit regulärer TLS-Prüfung. Origin-Quelle ist echte Produktion, Produktintegration noch nicht implementiert/abgenommen.

Kostenloser Zugang: 25 Anfragen/Tag laut offizieller Supportseite; echte HTTP200 Information meldet zusätzlich 1 request per second. Kurze Burstversuche wurden abgelehnt; erfolgreiche Folgeversuche mit Abstand. Insgesamt 14 autorisierte AV-Abfragen dieser Etappe (einschließlich vier Limitantworten), keine weiteren Realabfragen nötig. Implementierung: seriell mit Abstand nach Antwort, Suchbeleg cachen, Tagesreihe für Quote und History gemeinsam verwenden, lokale Börsentags-/Budgetgrenze, Information/Note als Limitfehler behandeln; keine Endlosschleifen/Still-Upgrades. Speicherung von Kurscache/Budget nur IDB, niemals zentraler oder eingebauter Nutzerschlüssel. Ein Browserbudget kann andere Geräte/Anwendungen desselben Keys nicht kennen.

## Tokenpreise

Separate echte CoinGecko-token_price/ethereum-Kontrolle mit öffentlichem stETH-Kontrakt und Nutzerzugang im Browser: Timeout. Das beweist weder Keyfehler noch konkrete CORS-/Tarifursache. Kein erfolgreicher Tokenpreis behauptet, keine Bestände geändert. Weitere Eingrenzung erforderlich.

## Quellen

- https://www.alphavantage.co/documentation/ (SYMBOL_SEARCH, TIME_SERIES_DAILY raw, GLOBAL_QUOTE; Beispiel XETRA MBG.DEX)
- https://www.alphavantage.co/support/ (25/day)
- https://www.alphavantage.co/terms_of_service/ (persönliche private Nutzung; kein gemeinsamer Key/Weiterverteilungsdienst)

Nächster serieller Schritt: PR#270 vollständig sicher abschließen; dann AV als zusätzliches BYO-Key-Direktangebot integrieren, FMP/Twelve-Sperr-/Tarifdiagnostik verbessern, optionalen EODHD-Worker erhalten. Keine Finanz-/IDB-/Backup-/Offline-Gates auslassen.

## Abschließende Token-Kontrolle

Nach dem ersten Timeout derselbe öffentliche stETH-token_price-Aufruf sowohl per regulärem Node-HTTPS (ACAO*) als auch durch Chromium-fetch auf Produktionsorigin jeweils mit und ohne Nutzer-Demo-Key HTTP200, positiver EUR-Kurs. Kein Produktivportfolio gelesen oder geändert. Für diesen Kontrollfall ist damit kein dauerhafter Key-/Tarif-/CORS-Fehler reproduziert. Die Ursache des früheren Android-Fehlers bleibt ungeklärt; nicht als behoben oder als falscher Zugang deklarieren. Keine weiteren Schlüsseltests oder automatische unsichere Proxy-Fallbacks daraus ableiten.
