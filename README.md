# FolioLab Open

Eine eigenständige, **lokale Portfolio-Web-App** für ETFs, Aktien, Fonds, Konten und Kryptowährungen. Keine Anmeldung, kein Bankzugriff, kein Screenshot-Upload, keine integrierten API-Schlüssel.

## Starten

Node.js >=20 und Python >=3 genügen; npm-Pakete sind nicht erforderlich:

```bash
npm test
npm run check
npm start
```

Dann http://localhost:4173 öffnen. Für die Offline-PWA ist HTTPS erforderlich.

## Funktionen

- Anbieter frei erstellen und bearbeiten, mit mehreren separaten Konten pro Anbieter. Anbietervorschläge ohne Zwang oder automatisch angelegte Leer-Konten.
- Beliebige ETFs und weitere Anlagen anhand von Namen, Ticker oder ISIN erfassen. Positionen und Guthaben vollständig manuell bearbeiten.
- Manuelle Käufe, Verkäufe und Bestandszugänge buchen sowie Vermögensstände speichern.
- Krypto-Coins frei über die **CoinGecko-ID** erfassen; Katalogsuche über `/coins/list`. CoinGecko bietet limitierten schlüssellosen Zugriff, ein eigener Demo-Key ist optional.
- **Wallet hinzufügen** in Positionen: öffentliche Adresse eingeben, Netzwerk wählen, entdeckte Guthaben prüfen und mehrere Coins ohne API-Key übernehmen. Unterstützt Bitcoin-Einzeladressen und Bitcoin-HD-Account-Keys (xpub/ypub/zpub), Ethereum, Base, Arbitrum, Optimism, Polygon (native Coins und ERC-20) sowie Solana (SOL, SPL und Token-2022). EVM nutzt öffentliche Blockscout-Instanzen, Solana PublicNode RPC (ohne Schlüssel). Endpunkte sind nicht garantiert jederzeit erreichbar.
- Tägliche Fremdwährungskurse ohne API-Schlüssel über Frankfurter; optionale ETF-/Aktienkurse über **Twelve Data** mit dem Schlüssel des Nutzers. Ohne Key funktioniert die manuelle Kurspflege. Ein Ticker kann von Börse zu Börse unterschiedlich sein; falls nötig das korrekte Symbol samt Börsen-Suffix eintragen.
- Optionaler automatischer Kurs- und Wallet-Abruf beim Öffnen (maximal alle 30 Minuten, in „Mehr“ abschaltbar).
- Responsive Darstellung und PWA. Export/Import als JSON **ohne API-Schlüssel**.

## Datenschutz und Sicherheitsmodell

Das Portfolio wird ausschließlich in `localStorage` gespeichert (unverschlüsselt, gerätegebunden). Für jedes Gerät / Browserprofil gibt es einen eigenen Datensatz. Keine zentrale Nutzerverwaltung, keine Serverdatenbank, keine Tracker. API-Schlüssel werden lokal, **nicht verschlüsselt** gespeichert und über HTTPS an die jeweiligen Dienste gesendet, wenn deren Funktionen benutzt werden. Eine Website und ihre Skripte sind keine Hochsicherheitsumgebung: nur eigene, ggf. eingeschränkte API-Schlüssel verwenden. Im Backup sind keine API-Schlüssel enthalten. Es werden keine privaten Wallet-Schlüssel oder Seed-Phrases angefordert.

**Beachten:** Blockchain-Abfragen übertragen die beobachtete öffentliche Adresse an Blockstream, öffentliche Blockscout-Explorer, ggf. Etherscan oder den konfigurierten Solana-RPC. Öffentliche Endpunkte können ratelimitiert, gesperrt oder durch CORS-Probleme nicht erreichbar sein. Es gibt keinen eingebauten zentralen Proxy. Eigene Solana-RPC-Adressen können in „Mehr“ konfiguriert werden. Browser können Schlüssel bei API-Calls im Netzwerkdialog sichtbar machen, insbesondere bei Query-Parametern. Für produktive Nutzung prüfen, ob der jeweilige Datenanbieter Client-Aufrufe erlaubt und ob Lizenz-/Nutzungsbedingungen zur Veröffentlichung passen.

Die bisherige private Foliolab-App wird **nicht** eingebunden und dieses Repository enthält keinerlei Bestand, Konto-, persönliche oder Anbieter-Voreinstellungen.

## Nicht unterstützt / bewusst anders

- Kein Broker-, Depot- oder Bankenlogin; keine automatisierten Handelsaktionen.
- Kein KI-/Screenshotimport oder OpenAI-Aufruf.
- Kein Google Drive Backup, kein Cloudkonto, kein gemeinsames Hosting von Portfoliodaten.
- Bitcoin-HD-Watch-only ist auf **öffentliche Account-xpub/ypub/zpub** (BIP44/49/84) begrenzt; keine Seed-Phrases oder privaten Schlüssel. Keine Wallet-Erkennung für alle Blockchains. Der Import umfasst nur die angeführten Netze; unklare, seltene oder wertlose Token werden möglicherweise ohne Kurs übernommen. Solana-RPC liefert bei SPL-Token die Mint-Adresse, nicht zuverlässig die lesbare Coin-Bezeichnung. Token aus unbekannten Contracts müssen vom Nutzer geprüft werden.
- Kurse sind ohne eigene Anbieter-Schlüssel insbesondere für CoinGecko (im Rahmen des öffentlichen Kontingents) und unterstützte Wallets abrufbar. Der öffentliche Blockchain-Import kann durch Ratenlimits, CORS oder veränderte APIs scheitern; im Browser-Livebetrieb ist das je nach Dienst zu prüfen. Nicht unterstützte oder fehlerhafte API-Antworten werden angezeigt, ohne Bestände auf null zu überschreiben.
- Die Verlaufskurve ist ein Gesamtvermögensverlauf inklusive Mittelbewegungen, **keine** zeitgewichtete Performance.

## Deployment

Empfohlen: neues, eigenständiges GitHub-Repository und anschließend **GitHub Pages** oder **Cloudflare Pages** mit dem Repository-Root als statischem Webverzeichnis. Die App verwendet relative Pfade und läuft auch unter einem GitHub-Pages-Unterpfad.

Für eine Anbindung an `unperfekt.at` bietet sich eine Subdomain wie `foliolab.unperfekt.at` an, die über DNS auf das Pages-Deployment zeigt. Die bestehende Framer-Website muss dafür nicht umgebaut werden; von dort kann auf die App verlinkt werden. Eine DNS-Änderung und die Hosting-Einrichtung sind separate Schritte und müssen unter dem Domain-/Hosting-Account vorgenommen werden.

### Sicherheitskontrolle vor öffentlicher Freigabe

1. Ein **neues, leeres** Repository verwenden; niemals die Historie des privaten Projekts spiegeln.
2. Alle Dateien des neuen Pakets übernehmen, keine private `.env`, Analytics-, Cloudflare- oder Google-Konfigurationsdatei.
3. Prüfen, dass keine persönlichen Portfolio-Daten und keine eigenen API-Schlüssel im Repository sind.
4. `npm test` und `npm run check` ausführen und die PWA im Browser prüfen.
5. Auf HTTPS bereitstellen und Nutzungsbedingungen der verwendeten Kursdaten-APIs prüfen.

## Lizenz

Quellcode dieses eigenständigen Open-Source-Prototyps: MIT (siehe `LICENSE`). Drittanbieter-API-Daten bleiben ihren jeweiligen Nutzungsbedingungen unterworfen.

## Stand der Architekturmodernisierung

In Version 2: getrennte Anbieter/Konten, sichere Datenmigration mit lokaler Vorabkopie, Konto-Dialoge, kostenlose tägliche Wechselkurse. Noch nicht umfassend umgesetzt: schlüssellose Suche für europäische Wertpapiere, vollständige Transaktionskosten-/XIRR-/TWR-Berechnung, alle Blockchains, DeFi-Bewertung und verschlüsselte Sicherungen. Wallet-Import ist ein Bestandsabruf und keine steuerliche Transaktionshistorie.

**Live-Verifikation 21.10.2026:** Frankfurter (FX), Blockstream (BTC), Blockscout (Ethereum) und PublicNode (Solana-RPC `getBalance`) reagierten im echten Browser mit HTTP 200. Der zuvor verwendete Standard-Solana-RPC lieferte HTTP 403. OpenFIGI-Suche war aus dem Browser nicht erreichbar und ist daher nicht als Schlüssel-los-Feature eingebaut. Der Betrieb anderer Adressen und Tokenlisten ist abhängig von externen Dienstgrenzen.

**Solana-Hinweis:** Der überprüfte freie PublicNode-RPC ermöglicht aktuell SOL-Balances, blockierte im Browsertest jedoch `getTokenAccountsByOwner` (HTTP 403). Ein Scan kann deshalb *teilweise erfolgreich* sein. Für zuverlässige SPL-/Token-2022-Erkennung ist ggf. ein eigener geeigneter RPC erforderlich. Keine automatische Token-Abdeckung garantiert.

**EVM-Tokeninventar:** Der öffentliche Blockscout-Endpunkt für ERC-20-Tokens kann im Browser langsam oder nicht verfügbar sein. Native Salden sind unabhängig abfragbar. Bei Token-Timeout wird ein ausdrücklich markierter Teilerfolg angezeigt; eine leere Wallet wird dann nicht fälschlich bestätigt. Ohne Token-Abfrage dürfen Token-Bestände nicht als vollständig erkannt gelten.

## Portfoliojournal und Performance (Erweiterung Oktober 2026)

- Buchungstypen: Kauf, Verkauf, Einzahlung, Auszahlung, Ein-/Auslieferung, interner Transfer, Dividende, Zinsen, Staking-Reward, Airdrop, Gebühren, Steuern, Bestandszugang/-korrektur, Split/Reverse-Split, Swap, Fusion, Ticker- und ISIN-Wechsel, Delisting. Grundlage ist ein **lokales, unveränderlich protokolliertes Ereignis**, Buchungen werden nicht automatisch rückdatiert neu eingerechnet.
- **Externe** Ein- und Auszahlungen werden getrennt dokumentiert; **interne Transfers** bleiben externe Cashflows von null. Bei einem Transfer von Beständen wird ein dokumentierter Einstandswert proportional übertragen. Swaps und Rewards erzeugen keine erfundenen steuerlichen Gewinne.
- 18-stellige Fixed-Point-Mathematik für manuelle Mengen und Transaktionsberechnungen, danach gerundete Anzeige. Externe Blockchain- und Kurs-APIs können selbst nur Gleitkommazahlen liefern und ersetzen keine vollumfängliche dezimalgenaue steuerliche Abrechnung.
- Eine **XIRR**-Rendite wird erst nach bewusst festgelegtem Startpunkt, dokumentierten externen Cashflows und mindestens zwei passenden Bewertungen angezeigt. TWR ist nur bei Bewertungen an sämtlichen externen Flows exakt; die UI behauptet deshalb keine nicht belegte TWR. Der reguläre Vermögensverlauf enthält weiterhin Ein- und Auszahlungen.
- Wallet-Unterstützung: Bitcoin-Einzeladresse, EVM via bestehendem Blockscout (ETH/Base/Arbitrum/Optimism/Polygon), neu Avalanche C-Chain via cccscan.org, native XRP via xrplcluster.com, SOL via PublicNode. Tokeninventare sind je nach API *best effort*. Weitere Netze einschließlich BNB Smart Chain, Cardano, Cosmos, TON, Sui und Aptos sind explizit **manuell**, nicht scheinbar automatisch.
- Keine selbstständige Erkennung komplexer Staking-/DeFi-/Liquid-Staking-Positionen: diese können manuell einzeln abgebildet und Rewards als Buchungen dokumentiert werden. Nutzer müssen Doppelzählungen selbst vermeiden.
- Größere Portfolios werden im UI schrittweise angezeigt; CoinGecko-Abfragen werden gruppiert. API-Erreichbarkeit wird nicht garantiert. Es werden keine Betreiber-Keys eingebunden.


## Phase 1 – Versioniertes Finanzjournal (v3)

Die neue Journalstruktur verbindet Käufe/Verkäufe optional atomar mit einem manuell erfassten Verrechnungskonto (EUR oder Handelswährung). Buchungssätze sind auf EUR-Basis ausgeglichen; Gebühren/Steuern werden separat geführt. **Ohne zugeordnetes Geldkonto wird die Finanzierungsseite als ungeklärt dokumentiert**, keine externe Einzahlung angenommen. Überziehungen werden abgewiesen. Neue Buchungen dürfen nicht rückwirkend vor einer bereits journalgeführten Buchung derselben Position eingetragen werden – hierfür sind explizite Korrekturen bzw. eine vollständige Historienprüfung erforderlich.

v1/v2-Dateien werden mit unveränderten Altbuchungen und dokumentierten, **undatierten Eröffnungsbeständen** nach v3 übernommen; historische Käufe werden nicht erfunden oder nochmals angewendet. Das rohe v1/v2-LocalStorage bleibt vor der Migration unter `foliolab-open-v1-premigration-v1` bzw. `-v2` gesichert. Exakte Mengen, Kursstatus und Bewertungsmetadaten überleben Backup-Roundtrips. Für vergangene Stichtage muss ein historisch bekannter Gesamtwert ausdrücklich eingegeben werden; alte Stichtage bleiben als unbestätigte Legacy-Werte gekennzeichnet. Ein gleicher Tag kann bei Änderungen als Revision gespeichert werden.

**Grenzen:** Undatierte Anfangsbestände lassen historische Portfolio-Rekonstruktionen ohne zusätzliche Daten weiterhin nicht zu. Ein automatisch gekoppelter Kauf mit Verrechnungskonto erfordert dort vorhandenes Guthaben. Die kanonische Journalwährung ist für Phase 1 EUR; historische Handels-FX müssen Nutzer bei Fremdwährungstransaktionen angeben. Eine vollständige Replay-/Korrekturengine und automatische Rekonstruktion vorheriger historischer Bewertungszeiträume ist noch nicht vorhanden und wird nicht vorgetäuscht.


## Phase 2 – Zuverlässigere Kursdaten, Börsenidentität und Referenz-FX

Automatische Wertpapieraktualisierungen erfolgen nur für Positionen mit einem bestätigten Handelsplatz (oder MIC) **und** passender Kurswährung. Twelve Data /quote muss Ticker, Handelsplatz und – soweit konfiguriert – MIC bestätigen; eine zweifelhafte Zuordnung wird abgelehnt, der bisherige Kurs bleibt bestehen. Dasselbe Wertpapier (ISIN) kann mehrere getrennte Listing-IDs (Handelsplatz, Ticker, Handelswährung) besitzen. Das verändert keine Positions- oder Depotidentität.

Der In-Memory-API-Cache nutzt getrennte TTLs für Kurs-, FX-, Katalog- und Walletdaten, dedupliziert gleichzeitige Anfragen und begrenzt Parallelität, Retries sowie die Reaktion auf HTTP 429/Retry-After. API-Schlüssel und öffentliche Walletadressen werden **nicht** in einem persistenten Request-Cache gespeichert. Neue Kursmetadaten enthalten Quelle, Kursstand und Abrufzeitpunkt. Ein API-Fehler überschreibt weder Bestand noch Kurs. Weiterhin können alle Positionen manuell verwaltet werden.

Frankfurter liefert kostenlose EUR-Tagesreferenzkurse, auch historisch per Buchungsdatum; der tatsächlich abgerechnete FX des Brokers kann abweichen. Unter „Buchungen“ lässt sich die Referenz abrufen und vor dem Speichern anpassen. Bei nachträglich geänderten Beträgen sollten Datum und FX-Quelle kontrolliert werden.

XIRR bleibt nur bei ausreichend vollständigen Ein-/Auszahlungen und verwertbaren Anfangs-/Endwerten verfügbar. Die TWR wird **nur** für verifizierte, cashflowfreie Bewertungszeiträume berechnet; für echte Cashflow-Teilperioden fehlen gegenwärtig Pre-/Post-Flow-Bewertungen, sodass bewusst kein geschätzter TWR-Wert angezeigt wird. Nicht eindeutig einem Listing zuordenbare ETF-Kurse und kostenlose Datenquellen ohne nachgewiesene Browser-Kompatibilität werden nicht automatisch als sichere Alternative verwendet.


## Phase 3 – CSV, Wallet-Scan und wirtschaftliche Beziehungen

Unter **Buchungen** lassen sich CSV-Dateien lokal einlesen. Die Spalten werden frei zugeordnet, die Transaktionslogik validiert einen vollständigen Probelauf auf einer Modellkopie. Ungültige Zeilen sperren den gesamten Import; wiederholte Imports werden durch stabile Fingerprints erkannt. Bestandspositionen müssen vor dem Import zugeordnet werden; die App konstruiert weder unbekannte Wertpapiere noch historische Guthaben. Maximal 5.000 CSV-Zeilen / 2 MB.

Das XRP Ledger nutzt `account_lines`, einschließlich paginierter Antworten und einer Ledger-Referenz. Token sind nur anhand **Currency + Issuer** eindeutig. Positive Trust-Line-Assets werden als **unbewertet** vorgeschlagen und wegen Spam-/Gegenparteirisiken nicht automatisch vorausgewählt. Teilerfolge/Fehler werden markiert und nicht als beweisbarer Nullbestand interpretiert.

Bitcoin Watch-only unterstützt Account-xpub/ypub/zpub für BIP44-/49-/84-Adressen (öffentliche Ableitung ab Accountebene, nicht gehärtet) mit Empfangs- und Wechselgeldpfad und Gap-Limit 20. Die öffentliche HD-Wallet ist datenschutzsensibel: Ein Explorer kann die zusammengehörigen abgeleiteten Adressen miteinander verbinden. Unvollständige Scans werden abgebrochen; öffentliche Endpunkte können Rate Limits auslösen. Keine Seeds oder privaten Schlüssel eingeben.

Für DeFi kann eine Position bewusst als Collateral, Wrapped Asset, Vault, LP oder Liquid Staking eingeordnet werden. **Doppelte wirtschaftliche Vermögenswerte** können nur nach ausdrücklicher Zuordnung und Entscheidung zur Nichtanrechnung aus der Summe genommen werden. Verbindlichkeiten werden als Abzug berücksichtigt. Diese Zuordnung ist ein **manuelles Modell**, kein Versprechen vollständiger automatischer DeFi-Erkennung oder DeFi-Steuerrechnung.

EVM/ERC-20 und Solana sind weiterhin **Best-Effort**: Öffentliche RPCs können Tokeninventare blockieren oder auf Teildaten begrenzen. Ohne nachweislich vollständigen Scan wird keine Nullbilanz zugesichert. DefiLlama bleibt ein möglicher späterer Preis-Fallback, bis reale Browserprüfung und Vertragsidentität verifiziert sind.

## Audit-Stand vom 21.10.2026

Die v3-Backup-Wiederherstellung validiert neben dem ausgeglichenen Journal nun auch die rekonstruierbaren Positionsmengen. Veraltete CSV-Vorschauen und ältere Browser-Tabs werden vor gewöhnlichen Schreibzugriffen erkannt (kein vollständig atomarer Mehr-Tab-Lock). Gleichartige CSV-Zeilen innerhalb derselben Datei werden mit stabilen Vorkommensnummern erfasst; ohne externe Transaktions-ID bleibt die Zuordnung zwischen verschiedenen, unabhängigen Quelldateien prinzipiell mehrdeutig.

Wallet-Erkennung bewahrt präzise Blockchain-Mengen als Dezimalstrings. Unvollständige oder blockierte Explorer-/RPC-Abfragen gelten nicht als verifizierte Nullbestände. Bei Bitcoin-HD können öffentliche Explorer verknüpfte Adressen demselben Nutzer zuordnen; parallel erfasste Einzeladressen und HD-Wallets sind weiterhin auf wirtschaftliche Doppelzählung zu prüfen. DeFi-Zuordnungen erfordern bewusste Entscheidungen durch Nutzer.

Die automatisierten Tests decken u. a. Finanzjournal, Migrationen, CSV, BIP32-/Bitcoin-HD-Beispiele, XRP-Ledger, DeFi-Szenarien, API-Fehler, Browser-Interaktionen, XSS-Eingaben und responsive Viewports ab. Belastungstests nutzen 500, 2.000 und 5.000 Positionen mit jeweils 5.000 historischen Datensätzen. **Dies garantiert keine Android-Laufzeit oder Speicherbarkeit im Browser:** Ein Portfolio mit 5.000 Positionen kann eine Sicherung von mehreren Megabyte erzeugen, während der lokale Speicher je nach Browser begrenzt ist. Backup-Import unterstützt Dateien bis 20 MB; die tatsächliche Speicherquote kann darunter liegen. Regelmäßig heruntergeladene Backups sind erforderlich.

Kostenlose Blockchain-APIs können zeitweise unerreichbar sein. Insbesondere wurde ein SOL-Balance-Abruf über PublicNode bestätigt, aber SPL-Tokeninventar-Abfragen wurden in Browserproben durch den Dienst blockiert. Die App ist ein lokales Hilfsmittel, keine unabhängig zertifizierte Depot- oder Blockchain-Buchhaltung.

### Bitcoin-HD-Account-Keys (Ledger, xpub/ypub/zpub)

Ein `xpub` kann bei Ledger auch ein **Native-SegWit-Konto** (`bc1q…`, BIP84) repräsentieren. Das Präfix `xpub` allein bestimmt **nicht** den Adresstyp. Foliolab prüft im Modus **Automatisch** für xpubs zuerst Native SegWit, dann Nested SegWit (`3…`) und anschließend Legacy (`1…`). Sobald sich ein Transaktionsverlauf in einem Format nachweisen lässt, wird dieser Typ für die künftige Wallet-Abfrage gespeichert. Alternativ kann der Adresstyp explizit in den Positions- oder Import-Einstellungen gewählt werden.

Bei ungeklärter automatischer Zuordnung oder unterbrochenem Explorer-Abruf bleibt der bisherige BTC-Bestand **unverändert**, anstatt einen vermeintlich bestätigten Nullbestand zu übernehmen. **Taproot (`bc1p…`, BIP86)** wird bisher nicht unterstützt. Der Scanner prüft Empfangs- und Wechselgeldadressen bis zum Gap-Limit 20; ungewöhnlich große Lücken und zusätzliche Ledger-Konten benötigen gesonderte Konten oder einen manuellen Abgleich. Ein xpub ist öffentlich im kryptografischen Sinne, aber **sensibel für die Privatsphäre**: Jeder Besitzer kann zugehörige Adressen nachverfolgen. Den Schlüssel nicht in öffentlichen Issues posten.
