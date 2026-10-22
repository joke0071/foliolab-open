# FolioLab Open – Audit der Instrumentendatenquellen

Geprüft am 22. Oktober 2026. Ziel war eine große, ohne Nutzerregistrierung direkt durchsuchbare Wertpapierdatenbank. **Dieses Ziel ist noch nicht vollständig umgesetzt.** Die PWA liefert nur wenige lokale ETF-Referenzen, eine CoinGecko-Suche und den Import externer Wertpapierdateien durch den Nutzer. Ein lizenzrechtlich abgesicherter zentral aktualisierter Wertpapiergrundkatalog wurde nicht veröffentlicht.

## Verifizierte Möglichkeiten für vollständige Dateien

| Quelle | Volldatensatz | FolioLab-Status |
| --- | --- | --- |
| Xetra | Ja, offizielle T7 (Xetra) Alle handelbaren Instrumente CSV | Lokaler Import; kein zentraler Spiegel. Die Downloadseite verlinkt die Datei. |
| Nasdaq Trader | Ja, nasdaqlisted.txt und otherlisted.txt über HTTPS | Lokaler Import; US-Symbolverzeichnisse enthalten meist keine ISIN. |
| ESMA FIRDS | Ja, Full- und Delta-Referenzdateien, XML/ZIP | Vollständige Originaldateien werden noch nicht direkt eingelesen; Register-CSV-Export ist kein vollständiger Instrumentenexport. |
| OpenFIGI | Kostenlose Mapping-/Such-API, kein einfacher vollständiger CSV-Download bestätigt | Optionale Suche mit Worker, kein zwingend vorhandener Public Worker. |
| OeKB | Kein allgemein zugänglicher vollständiger Fonds-CSV-Gesamtexport nachgewiesen; elektronische Datenlieferung gegen Entgelt | Nur Einzelprüfung sinnvoll; kein vermeintlicher Sammel-Download im Wizard. |
| CoinGecko | Ja, vollständiger Coin-ID-Namenskatalog über /coins/list | Im Wizard integriert; kein automatischer, serverseitiger Rohdaten-Spiegel. |
| CoinPaprika | Ja, /v1/coins | Nicht integriert; Verteilungslizenz müsste gesondert geklärt werden. |

## Offizielle Download- und Nachweisseiten

- Xetra: https://www.cashmarket.deutsche-boerse.com/cash-de/Handel/Handelbare-Werte-Xetra/Downloads/xetra-downloads — dort T7 (Xetra) Alle handelbaren Instrumente auswählen, nicht die Static Instrument Reference Data.
- Nasdaq-Listed direkt: https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt
- Other-Listed direkt: https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt
- ESMA Full-/Delta-Dateien: https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_firds_files
- ESMA Registers-Reuse-Bedingungen: https://registers.esma.europa.eu/publication/legalNoticePage
- OeKB Steuerdaten: https://www.oekb.at/kapitalmarkt-services/unser-datenangebot/fonds/steuerdaten
- OpenFIGI API: https://www.openfigi.com/api/documentation
- CoinGecko: https://docs.coingecko.com/reference/coins-list

## Nutzungsrechte und technische Grenzen

Ein öffentlich abrufbarer Download berechtigt nicht automatisch zur Weiterverteilung auf GitHub Pages. Auch ein periodischer Download im Endgerät ersetzt keine Rechteklärung. Für ESMA Registers gibt es eine ausdrückliche bedingte Wiederverwendung (Quellenangabe, Veränderungen kennzeichnen, Drittanbieterrechte beachten). Für einen zentral wiederveröffentlichten Xetra- oder OeKB-Rohdatenbestand ist keine generelle Freigabe nachgewiesen.

ISIN bezeichnet das Wertpapier; Ticker, Börsen-MIC und tatsächliche Handelswährung gehören zur Notierung. Xetra-Dateien können Settlement Currency enthalten: Diese Abwicklungswährung ist nicht automatisch die Währung eines aktuellen Börsenkurses. Stammdaten liefern keine Kurswerte oder Depotbestände.

**Tests:** Der automatische Browser-Test verwendet synthetische Xetra-/Nasdaq-Daten. Die Unterstützung einer vollständig heruntergeladenen echten Xetra-Datei wurde noch nicht Ende-zu-Ende bestätigt. Parser-Tests decken jedoch die aus offizieller Referenzdokumentation bekannten T7-Spalten für MIC und Settlement Currency ab.

## Noch offen

1. Auf Basis nachweislich wiederverwendbarer Daten (zuerst ESMA nach Aufbau eines XML-/ZIP-ETL) einen kuratierten, periodisch gepflegten und versionierten Grundkatalog bereitstellen.
2. Den Datenkatalog nach identischer ISIN und separaten MIC-/Ticker-/Währungseinträgen zusammenführen.
3. Automatisch nutzbare internationale On-Demand-Suche ohne private API-Schlüssel prüfen, mit Limits und Datenschutz.
