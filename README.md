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
- **Wallet hinzufügen** in Positionen: öffentliche Adresse eingeben, Netzwerk wählen, entdeckte Guthaben prüfen und mehrere Coins ohne API-Key übernehmen. Unterstützt Bitcoin-Einzeladressen und Bitcoin-HD-Account-Keys (xpub/ypub/zpub), Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche C-Chain (inklusive BENQI sAVAX), Sonic Mainnet (S, ausgewählte ERC-20 und SFC-Delegationen) sowie Solana (SOL, SPL, Token-2022 und native Stake-Accounts). EVM nutzt öffentliche Explorer bzw. offizielle read-only RPCs; Solana den konfigurierten RPC (ohne Schlüssel). Endpunkte sind nicht garantiert jederzeit erreichbar.
- Tägliche Fremdwährungskurse ohne API-Schlüssel über Frankfurter; optionale ETF-/Aktienkurse über **Twelve Data** mit dem Schlüssel des Nutzers. Ohne Key funktioniert die manuelle Kurspflege. Ein Ticker kann von Börse zu Börse unterschiedlich sein; falls nötig das korrekte Symbol samt Börsen-Suffix eintragen.
- Optionaler automatischer Kurs- und Wallet-Abruf beim Öffnen (maximal alle 30 Minuten, in „Mehr“ abschaltbar).
- Responsive Darstellung und PWA. Export/Import als JSON **ohne API-Schlüssel**. Optional: AES-GCM-verschlüsselte Google-Drive-Backups mit eigener OAuth-Client-ID je Nutzer.

## Staking-Scanner: 50 Asset-Einträge (Stand Oktober 2026)

Unter **Positionen → Wallet hinzufügen → Staking-Asset** bietet FolioLab Open einen transparenten Katalog zu den 50 gelieferten Coin-/Netzwerk-Kombinationen. Die Auswahl eines Assets ist nur eine Orientierungshilfe und **keine** Bestätigung, dass sämtliche Stakes oder Rewards erkannt wurden. Bei nicht unterstützten Netzwerken wird automatisches Scannen deaktiviert; die Anlage kann manuell erfasst werden.

- **Bisherige unterstützte Netze:** Ethereum/EVM, Solana-SPL und eigene Stake-Accounts, Sonic SFC und ausgewählte ERC-20-Liquid-Staking-Tokens, Avalanche C-Chain inklusive BENQI sAVAX. EVM/ERC-20-Inventare liefern Tokenbestände, aber keinen Beweis für Protokoll-Staking, Vault-Anteile oder staked Validator-Balances.
- **Cosmos Hub (ATOM):** freies ATOM (Bank), aktive Delegationen und Unbonding getrennt über das öffentliche Cosmos-SDK-LCD `rest.cosmos.directory/cosmoshub`. Unerhobene Rewards, Interchain-Accounts oder andere Cosmos-Netzwerke werden **nicht** pauschal mitgescannt. Validator-Identitäten bleiben im Positionsbezug; Paginierungsfehler werden nicht als verifizierter Nullbestand übernommen.
- **Hedera (HBAR):** HBAR-Kontosaldo aus dem öffentlichen Mirror Node. HBAR bleibt auch bei aktiviertem Staking Teil desselben verfügbaren Kontos; es gibt **keine zusätzliche Staking-Position**. Ausstehende Rewards werden nicht als bereits verfügbare HBAR gezählt.
- **NEAR:** Kontoguthaben und die direkt gesperrte `locked`-Menge via `view_account`. NEAR in fremden Staking-Pool-Verträgen kann aus der reinen Account-Abfrage nicht vollständig erkannt werden; der Scan bleibt deshalb ausdrücklich teilweise.
- **BNB Smart Chain:** nur freier BNB-Native-Saldo über read-only `eth_getBalance`, keine implizite automatische Erkennung von Validator-Staking, Beacon-Chain-Positionen, BEP-20-Inventaren oder DeFi.
- **Explizite Grenzen:** Validator-ETH auf der Ethereum Consensus Layer ist nicht der EVM-Walletsaldo. Primäres AVAX-Staking liegt auf der Avalanche P-Chain und **nicht** der C-Chain. Sui JSON-RPC über Foundation-Fullnodes wurde 2026 abgeschaltet; es wird ohne geprüften gRPC/GraphQL-Anbieter nichts vorgetäuscht. Fantom FTM, EOS/Vaulta A und Maker MKR/SKY verlangen migrationsbewusste Bestandszuordnung.
- **Schutz gegen Doppelzählung:** protokollinterne Stake-Accounts und separate Liquid-Staking-Token werden nicht automatisch miteinander verrechnet, denn dazu wäre der wirtschaftliche Zusammenhang jedes Vertrags nachzuweisen. Für doppelt repräsentierte Werte bietet FolioLab die bewusste wirtschaftliche Zuordnung unter „Erweitert“.

Alle Adapter fragen **nur öffentliche Adressen** ab. Sie signieren keine Transaktionen und verlangen keine privaten Schlüssel. Fehlende CORS-Freigaben, 429/403, Seitenlimits oder abweichende API-Rohdaten werden als Fehler/Teilscan signalisiert. Nur positiv belegte Mengen werden übernommen; bei Aktualisierungsfehlern bleiben die vorhandenen Werte erhalten.

## Wallet-MVP: Rocket Pool, BNB BEP-20 und Solana-RPC (Oktober 2026)

- **rETH:** Ethereum-Rocket-Pool-Token `0xae78736Cd615f374D3085123A210448E74Fc6393` ist anhand **Chain-ID 1 und offiziellem Contract** im sicheren Sichtbarkeitsfilter freigegeben, auch ohne aktuellen Kurs. Ein fremder Token mit Symbol rETH wird nicht automatisch freigegeben. Wie bei anderen Ethereum-Tokens ist die Erfassung vom Explorer abhängig.
- **BNB Smart Chain:** Natives BNB wird direkt per Public RPC gelesen. BEP-20-Contracts werden über [Binplorer](https://binplorer.com/) als Kandidaten gefunden und ihr aktueller `balanceOf` und `decimals` anschließend via Ethereum-kompatiblem `eth_call` auf BSC verifiziert. Zusätzlich werden vier dokumentierte Haupt-Contracts (WBNB, Binance-Peg USDT, USDC und BTCB) auch bei ausgefallenem Indexer direkt abgefragt. Die kostenlose Binplorer-Kennung `freekey` hat strikte Limitierungen und ist nur für Tests/Entwicklergebrauch gedacht; unter „Mehr“ können Nutzer einen eigenen Schlüssel hinterlegen. Keine Nutzer-/Betreiber-Schlüssel sind im Quellcode hinterlegt. Quelle/Attribution: Powered by Binplorer.
- **Solana:** Für den voreingestellten öffentlichen RPC `solana-rpc.publicnode.com` steht bei Fehlern und unvollständigen Antworten `api.mainnet.solana.com` als zweiter öffentlicher Anbieter bereit, inklusive Tokenkonten, Stake-Account-Lookups und regelmäßiger Bestandsaktualisierung. Wird vom Nutzer bewusst eine eigene RPC-Adresse angegeben, erfolgt **kein** ungefragtes Weiterleiten zu anderen Providern. Alle öffentlichen RPCs können die teure `getProgramAccounts`-Abfrage blockieren; dann bleibt das Staking ein Teilscan und bestehende Positionen werden nicht auf null gesetzt.
- **Transparenz:** BEP-20-Indexer sind nicht garantiert vollständig (80 geprüfte Kandidaten pro Scan), Spam-Token bleiben ausgeblendet und Staking-/DeFi-Verträge erfordern ggf. gesonderte Erkennung. Kein Seed, keine Transaktionen, keine API-Schlüssel im JSON-Backup. Portfoliodaten werden weiterhin nur lokal gespeichert.

### Live-Praxisaudit – verfügbare öffentliche Wallet-Endpunkte (22. Oktober 2026)

Die **Browser-Live-Proben** unter `tests/browser-wallet-live-audit.mjs` und `tests/browser-solana-provider-matrix.mjs` verwenden ausschließlich öffentlich bekannte Adressen. Der CI-Workflow `wallet-live-audit.yml` protokolliert HTTP-Status, Latenz, CORS-Zugänglichkeit und Antwortschemas. Er ist als externe Verfügbarkeitsmessung **informativ**, keine Garantie oder bestandsverändernde Quelle.

Ein reproduzierbarer Live-Befund: Ethereum Blockscout beantwortete eine einzelne Kontostandsanfrage, aber eine umfangreiche ERC-20-Tokenliste überschritt im Browser acht Sekunden. Deshalb wird die Tokenliste einmal mit begrenzter Wartezeit geprüft und bei Ausfall eine **auf drei offizielle Ethereum-Liquid-Staking-Contracts begrenzte** on-chain-Abfrage ausgeführt (stETH, rETH, wstETH). Auch der native ETH-Kontostand und die spätere Aktualisierung bereits importierter Ethereum-ERC-20-Positionen haben einen HTTPS-JSON-RPC-Fallback. Ein Token-Explorer-Ausfall bleibt ein Teilscan, **niemals** ein Nachweis, dass keine weiteren Token vorhanden sind.

Für Solana-Stake-Accounts benötigen öffentliche RPCs oft eine kostenpflichtige oder persönliche Indexberechtigung; `getProgramAccounts` kann mit HTTP 403 blockiert sein. Nach einem Fehlschlag wird kein Nullbestand geschrieben. Für echten produktiven Stake-Scan empfiehlt sich ein vom Nutzer selbst konfigurierter, zu `getProgramAccounts` berechtigter RPC unter **Mehr**. Private RPC-URLs werden nicht an andere RPCs weitergeleitet.

### Solana-Staking für Nicht-Techniker einrichten

Der öffentliche Standard-RPC liefert häufig freie SOL, unterstützt aber nicht zwingend die Suche nach nativen Stake-Accounts. Im Menü **Mehr → Blockchain und Hinweise → Solana-Staking einrichten (optional)** gibt es deshalb eine kurze, verständliche Einrichtungshilfe mit Beispiel **Helius** ([Helius-Dashboard](https://dashboard.helius.dev/)): Konto anlegen, vollständige **Solana-Mainnet-HTTPS-RPC-URL** aus dem Anbieter-Dashboard kopieren und im Feld „Eigene Solana-RPC-Adresse“ einfügen. Ein eigener API-Schlüssel darf Bestandteil der URL sein; er bleibt auf diesem Gerät in lokalen Einstellungen und wird nicht im Backup exportiert.

Anschließend prüft **„Verbindung & Staking prüfen“** ohne Nutzer-Walletdaten mit der öffentlichen Solana-Systemadresse zwei read-only Methoden: `getBalance` (Netzwerk erreichbar) und `getProgramAccounts` für das native Stake-Programm (erforderliche Indexberechtigung). Die Rückmeldung unterscheidet: vollständig erfolgreich, RPC erreichbar aber Staking-Abfrage blockiert, RPC nicht erreichbar. Der Test bestätigt die *Methode*, nicht das Vorliegen eigener Stakes oder die Vollständigkeit späterer Wallet-Scans.

Die URL einschließlich enthaltenem Anbieter-Schlüssel ist ein Zugangstoken und sollte nicht weitergegeben werden; der Browser speichert diese Konfiguration lokal im Klartext. Niemals Seed-Phrase oder private Wallet-Schlüssel einfügen. Ein selbst konfigurierter RPC wird nicht ungefragt an öffentliche Fallback-Provider weitergeleitet.

## Einheitliche Backup-Verschlüsselung und Google Drive (freiwillig)

Lokale und Google-Drive-Backups verwenden **dasselbe vom Nutzer gewählte Backup-Passwort**. Die Integration benötigt weder einen FolioLab-Server noch eine vom Betreiber bereitgestellte OAuth-App.

### Verschlüsselung einrichten

Unter **Mehr → Deine Daten → Backup-Verschlüsselung** ein Passwort mit mindestens zehn Zeichen eingeben und bestätigen. Danach sind lokale verschlüsselte Backups und – bei eigener Google-Anmeldung – Drive-Backups verfügbar.

Die Anwendung erzeugt einen zufälligen 256-Bit-Datenschlüssel, schützt eine Kopie mit einem über **PBKDF2-HMAC-SHA-256 (310.000 Iterationen)** vom Passwort abgeleiteten Schlüssel und verschlüsselt damit jede Sicherung mit **AES-256-GCM**. Jede neue Datei enthält die passwortgeschützte Kopie des Datenschlüssels, nicht das Passwort. Auf diesem Gerät liegt zusätzlich ein **nicht exportierbarer CryptoKey** in IndexedDB, damit FolioLab während der Nutzung ohne erneute Passworteingabe sichern kann. Auf einem neuen Gerät genügt das Passwort zum Entschlüsseln. Dies schützt Dateien auf Google Drive, aber nicht gegen manipuliertes JavaScript oder unberechtigten Zugriff auf das offene Gerät.

Ein vergessenes Passwort macht die Sicherungsdateien auf anderen Geräten unlesbar, sofern das Passwort nicht sicher verwahrt ist. Bei einer Passwortänderung bleiben ältere Backups an ihr bisheriges Passwort gebunden; FolioLab ändert oder löscht sie nicht automatisch. Ohne eingerichtetes Passwort bleibt der unverschlüsselte lokale JSON-Export möglich.

### Persönlichen Google-Drive-OAuth-Zugang einrichten

1. In der [Google Cloud Console](https://console.cloud.google.com/apis/credentials) ein eigenes Projekt erstellen, **Google Drive API** aktivieren und den OAuth-Zustimmungsdialog konfigurieren. Bei Testmodus das eigene Google-Konto als Testnutzer hinzufügen.
2. Einen OAuth-Client vom Typ **Webanwendung** erstellen und die tatsächliche FolioLab-Origin als **autorisierte JavaScript-Quelle** eintragen (bei GitHub Pages z. B. `https://joke0071.github.io`, ohne Unterpfad).
3. Die öffentliche Client-ID (`…apps.googleusercontent.com`) unter **Mehr → Deine Daten → Google Drive Backup** einfügen und Google verbinden. **Kein API-Key, Client-Secret oder Refresh-Token** erforderlich. Die OAuth-Client-ID verbleibt in den lokalen Einstellungen, der kurzlebige Access-Token nur im Arbeitsspeicher.
4. Optionalen FolioLab-Ordner auswählen/erstellen, manuell sichern oder einen automatischen Rhythmus wählen. Standard sind drei Versionen; einstellbar sind 1–30.

Die Google-Berechtigung `drive.file` ist auf von dieser OAuth-App angelegte bzw. für sie freigegebene Dateien beschränkt. Eine freie Navigation durch alle fremden Drive-Ordner ist nicht möglich. Uploads erfolgen direkt aus dem Browser an Google; der FolioLab-Betreiber erhält weder Zugangsdaten noch Portfolio-Dateien. **Automatische Sicherungen laufen nur bei geöffneter App und gültiger Google-Autorisierung.**

### Wiederherstellung und ältere Backupformate

- Neu: Lokale Dateien und Google-Drive-Dateien im Format `foliolab-open-encrypted-v2` erfordern **nur das gemeinsame Passwort**. FolioLab validiert den Inhalt vor dem Import und bietet vor dem Überschreiben eine lokale Rollback-Kopie an.
- Bestehende lokal verschlüsselte Sicherungen im Format `foliolab-open-encrypted-v1` bleiben mit ihrem damaligen Passwort über den Dateiimport lesbar.
- Bestehende Google-Drive-Sicherungen im Format `foliolab-drive-encrypted-v1` bleiben mit dem alten `FLBK1-`-Schlüssel oder bei vorhandenem lokalen Legacy-Schlüssel wiederherstellbar. Neue Backups benötigen keinen separaten FLBK1-Schlüssel mehr.
- Bei erfolgreicher Wiederherstellung auf einem neuen Browser kann FolioLab den passwortgeschützten Datenschlüssel für weitere Backups übernehmen. Ein bereits eingerichteter anderer Datenschlüssel wird nicht ungefragt überschrieben.

**Wichtig:** Automatische Backups sind kein Echtzeit-Synchronisationssystem. OAuth-Ablauf, Offline-Nutzung, Speicherlimits und geschlossene Browser können geplante Sicherungen verhindern. Der Nutzer bleibt für die sichere Verwahrung seines Backup-Passworts verantwortlich.

## Datenschutz und Sicherheitsmodell

Das Portfolio wird ausschließlich in `localStorage` gespeichert (unverschlüsselt, gerätegebunden). Für jedes Gerät / Browserprofil gibt es einen eigenen Datensatz. Keine zentrale Nutzerverwaltung, keine Serverdatenbank, keine Tracker. API-Schlüssel werden lokal, **nicht verschlüsselt** gespeichert und über HTTPS an die jeweiligen Dienste gesendet, wenn deren Funktionen benutzt werden. Eine Website und ihre Skripte sind keine Hochsicherheitsumgebung: nur eigene, ggf. eingeschränkte API-Schlüssel verwenden. Im Backup sind keine API-Schlüssel enthalten. Es werden keine privaten Wallet-Schlüssel oder Seed-Phrases angefordert.

**Beachten:** Blockchain-Abfragen übertragen die beobachtete öffentliche Adresse an Blockstream, öffentliche Explorer, Sonic-/Avalanche-RPCs, ggf. Etherscan oder den konfigurierten Solana-RPC. Öffentliche Endpunkte können ratelimitiert, gesperrt oder durch CORS-Probleme nicht erreichbar sein. Es gibt keinen eingebauten zentralen Proxy. Eigene Solana-RPC-Adressen können in „Mehr“ konfiguriert werden. Browser können Schlüssel bei API-Calls im Netzwerkdialog sichtbar machen, insbesondere bei Query-Parametern. Für produktive Nutzung prüfen, ob der jeweilige Datenanbieter Client-Aufrufe erlaubt und ob Lizenz-/Nutzungsbedingungen zur Veröffentlichung passen.

Die bisherige private Foliolab-App wird **nicht** eingebunden und dieses Repository enthält keinerlei Bestand, Konto-, persönliche oder Anbieter-Voreinstellungen.

## Nicht unterstützt / bewusst anders

- Kein Broker-, Depot- oder Bankenlogin; keine automatisierten Handelsaktionen.
- Kein KI-/Screenshotimport oder OpenAI-Aufruf.
- Kein zentral von FolioLab verwaltetes Cloudkonto und kein serverseitiges Hosting von Portfoliodaten. Google-Drive-Backups sind freiwillig und erfordern eine eigene OAuth-Client-ID jedes Nutzers.
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
- Wallet-Unterstützung: Bitcoin-Einzeladresse, EVM via bestehendem Blockscout (ETH/Base/Arbitrum/Optimism/Polygon), Avalanche C-Chain über Explorer und RPC-Fallback für BENQI sAVAX, Sonic (Chain 146) über read-only RPC, native XRP via xrplcluster.com, SOL / Stake-Accounts über konfigurierbaren Solana-RPC. Tokeninventare sind je nach API *best effort*. Weitere Netze einschließlich BNB Smart Chain, Cardano, Cosmos, TON, Sui und Aptos sind explizit **manuell**, nicht scheinbar automatisch.
- Staking: Solana-Stake-Accounts mit bestätigter Withdrawal Authority, aktive Sonic-SFC-Validator-Delegationen (Scanlimit 256 IDs) sowie bekannte Liquid-Staking-Tokens wie BENQI sAVAX und Beets stS werden getrennt erkannt und bewertet. Ausstehende Sonic-Auszahlungen, fremde DeFi-Vaults, Pool-Token und nicht identifizierbare komplexe Staking-Positionen bleiben bewusst außerhalb der vollständigen automatischen Erkennung. Solana-Provider können getProgramAccounts blockieren: dann ist der Scan ausdrücklich unvollständig und der vorhandene Bestand wird nicht zu null überschrieben. Nutzer müssen wirtschaftliche Doppelzählungen selbst kontrollieren.
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

### Ausklappbare Positionen und Einzelverläufe

Unter **Übersicht → Anbieter → Konto → Position** lassen sich einzelne Positionen aufklappen. Angezeigt werden Bestand, Einzelkurs, EUR-Wert, bekannter Einstandswert und Kontoanteil sowie ein Zeitraumfilter (7 Tage / 1 Monat / 3 Monate / 1 Jahr). **Krypto-Marktkurse** werden ausschließlich nach Nutzerinteraktion aus CoinGecko geladen; **Wertpapier-Marktdaten** erfordern einen eigenen Twelve-Data-Schlüssel sowie einen eindeutig geprüften Ticker, Handelsplatz und Kurswährung. Es werden keine geheimen Standard-API-Schlüssel mitgeliefert. Drittanbieter können den Datenabruf blockieren oder begrenzen.

Foliolab speichert ab dieser Version beim **aktuellen** Portfolio-Stichtag zusätzlich die exakt berechneten Werte der Einzelpositionen lokal. Vergangene Gesamtstichtage ohne Positionshistorie werden **nicht künstlich in Einzelpositionen aufgeteilt**. Wenn mindestens zwei echte Einzelpositionsstichtage vorhanden sind, steht auch eine lokale Wertentwicklung als Rückfallanzeige bereit. Diese enthält mögliche Ein-/Auszahlungen und Bestandsänderungen und ist **keine bereinigte persönliche Rendite**. Marktdatenkurven zeigen dagegen den Marktpreis je Einheit, nicht den persönlichen Depotwert. Sämtliche Detaildiagramme werden erst beim Aufklappen angefordert; Wallet-Schlüssel werden nicht für Markthistorie an den Kursanbieter übertragen.

### ETF-/Aktien-Kursverläufe ohne API-Schlüssel (CSV)

In **Übersicht → Anbieter → Konto → Position → CSV-Kursverlauf importieren** kannst du eine *echte* historische Schlusskursreihe lokal einlesen. Unterstützte Dateiformate: UTF-8-CSV mit Semikolon, Komma oder Tab und mindestens den Spalten **Datum/Date** und **Schlusskurs/Close**. Beispiele:

```csv
Datum;Schlusskurs;Währung;ISIN
2026-10-19;85,32;EUR;IE00BG0SKF03
2026-10-20;86,19;EUR;IE00BG0SKF03
```

Oder `Date,Open,High,Low,Close,Adj Close,Volume`. Bevor die Kurse importiert werden, musst du bestätigen, dass CSV-Daten **genau zur gewählten Börsennotierung und Handelswährung** gehören. Wenn in der CSV Ticker, ISIN oder Währung stehen, werden sie gegen die Position geprüft. Doppelte widersprüchliche Daten, ungültige Kurse und zukünftige Daten werden abgewiesen. Maximal 1,5 MB und 1.600 Kurstage je Datei. Der Import ist *keine unabhängige Kursprüfung* und ändert niemals die aktuelle Positionsmenge, den letzten Kurs oder Buchungen. Kein Upload: Die Daten werden ausschließlich im Browser gespeichert und zusammen mit dem normalen Backup exportiert. Optionales Entfernen ist im Positionsdetail möglich.

Ein `xpub` oder andere Wallet-Daten werden beim historischen CSV-Import nicht übertragen. Wenn kein geeigneter Datenexport und kein bestätigter API-Zugang vorliegt, zeigt die App ausdrücklich **keine künstliche Kurskurve**. Bei europäisch notierten ETFs ist die kostenlose Twelve-Data-Stufe nicht uneingeschränkt verfügbar.

### Historische Kryptowährungskurse (Stand Oktober 2026)

Ein CoinGecko-**aktueller** Kurs ist unabhängig vom API-Endpunkt **/market_chart** für Diagramme. Um das öffentliche Ratenlimit nicht unnötig zu erreichen, verwendet Foliolab Open beim Aufklappen eine gemeinsame 365-Tage-Zeitreihe und filtert die vier Zeiträume 7T / 1M / 3M / 1J lokal, statt jeden Zeitraum neu zu laden. Gleichzeitig angeforderte Diagramme werden mit Abstand abgefragt; bei API-Fehlern wird **kein künstlicher Kursverlauf** angezeigt. Ein Link zur offiziellen CoinGecko-Coinseite ermöglicht den Vergleich außerhalb der App. Optional kann jeder Nutzer einen persönlichen kostenlosen Demo-API-Schlüssel unter **Mehr → Erweiterte Einstellungen** eintragen (nur lokal gespeichert); öffentliche Endpunkte können trotzdem wegen Netzsperren/CORS ausfallen. Das Marktdatum ist entscheidend: Antworten mit mehr als sieben Tage alten CoinGecko-Zeitstempeln gelten nicht als frisch und überschreiben keine vorhandenen Preise.

**Sonic (S)** muss bei CoinGecko als **sonic-3** zugeordnet sein. Ältere, ähnlich benannte Coins (z.B. API-ID `sonic`) dürfen nicht mit Sonic Mainnet verwechselt werden. Die App ändert vorhandene Coin-Zuordnungen nicht automatisch.

### Wertpapier-Kurse: öffentliches Diagramm und optionale Kurs-APIs

**Ohne API-Schlüssel:** ETF-/Aktienpositionen mit bestätigtem Handelsplatz (z. B. `Xetra` / `XETR`) zeigen in der aufgeklappten Position eine Schaltfläche für einen **öffentlichen TradingView-Symbol-Overview-Chart**. TradingView wird erst nach explizitem Klick geladen (Drittanbieter erhält dann Browser-Verbindungsdaten). Das Widget enthält historische Kurse, liefert aber keine frei extrahierbare Kurs-API und ändert **keine** Portfoliowerte.

**Eigene Schlüssel** werden unter **Mehr → Erweiterte Einstellungen** für **EODHD, FMP, Twelve Data** gespeichert; mit *Automatisch* werden bestätigte Quellen der Reihe nach versucht (EODHD, FMP, Twelve Data). Der EODHD-Abruf nutzt echte EOD-Kurse der Börsennotierung `SYMBOL.EXCHANGE` (z. B. `VWCE.XETRA`) inklusive Datum. FMP benötigt ein **ausdrücklich bestätigtes eigenes Börsenkürzel** (z. B. `VWCE.DE`) und einen zugeordneten Handelsplatz. Twelve Data prüft Ticker, Kurswährung und Börsen-MIC wie bisher. Unter **Position bearbeiten → Externe Börsenkürzel** können die individuellen Codes hinterlegt werden. Nur gültige positive, nicht mehr als acht Tage alte und hinreichend zugeordnete Kursantworten dürfen den gespeicherten Preis ersetzen. Quelle, Datum und Art der Verifikation werden protokolliert. Fehlende CORS-Berechtigungen oder Premium-Tariflimits sind keine Anwendungsfehler und werden angezeigt; keine künstlichen Börsenkurse oder kurswirksames TradingView-Scraping.

**Sicherheitsgrenze:** Einige Anbieter liefern in ihren EOD-Antworten keine Währung/ISIN. Solche Daten sind nur als **vom Nutzer bestätigte Börsennotierung** gekennzeichnet, nicht als unabhängig vollständig verifizierte Handelsplatzdaten. Um Fehlzuordnungen zu vermeiden, wird FMP nur genutzt, wenn dessen Börsenkürzel ausdrücklich eingetragen ist; EODHD nutzt einen unterstützten Börsencode bzw. ebenfalls eine explizite Angabe. Die Datenquelle kann je nach Börse und Tarif nicht verfügbar sein. API-Schlüssel bleiben im lokalen Browser und werden im Backup ausgeschlossen.

### Kursquellen und ETF-Import – Ergänzung Oktober 2026

**Bekannte ETF-Referenznotierungen:** Nur bei einer eindeutigen Kombination aus Name, Ticker, EUR und gegebenenfalls ISIN und bestehendem Handelsplatz ergänzt der Backup-Import eine verifizierte Xetra-Referenznotierung. Derzeit: 5MVL / IE00BG0SKF03, VWCE / IE00BK5BQT80, XDEM / IE00BL25JP72 und XDEQ / IE00BL25JL35. Das ist **nicht** die behauptete Flatex-Ausführungsbörse. Bestehende abweichende Handelsplätze oder ISINs werden nicht verändert. Kursbeträge, Bestände, Eröffnungsbestände, Buchungen und Stichtage bleiben bei der Ergänzung gleich.

**Wertpapiere:** Der vergrößerte öffentliche TradingView Advanced Chart wird erst nach einem Klick verbunden und dient ausschließlich der Ansicht. Für automatisch bewertete Portfoliowerte bleiben bestätigte Nutzer-API-Schlüssel und Tarife erforderlich. Automatischer Kursanbieter ist unverändert EODHD → FMP → Twelve Data, sofern für die konkrete Notierung konfiguriert, verfügbar und berechtigt; bei nicht bestätigten Kursen wird nicht automatisch auf eine andere Börse ausgewichen.

**Krypto:** Bei ausgefallenen CoinGecko-Euro-Kursen ist CoinPaprika für eine kleine, fest hinterlegte Liste eindeutig zugeordneter Coins ein Fallback. Kein Raten von IDs aus Symbolen. Für historische Kurse wird bei CoinGecko-Fehler eine CoinPaprika-USD-Tagesreihe versucht, deren Punkte nur mit tatsächlich datierten Frankfurter-USD/EUR-Referenzkursen als EUR-Diagramm angezeigt werden. Fehlt die Umrechnung oder verweigert die API den Abruf, bleibt das Diagramm leer – keine fiktive historische Reihe. Die öffentliche CoinPaprika-API ist laut Anbieter für persönliche Nutzung vorgesehen, ihr eigenes Aufrufkontingent und ihre Lizenz bleiben maßgeblich. Erforderliche Attribution erfolgt über den Anbieterlink. Optional wird DefiLlama für einen EVM-DeFi-Token mit ausdrücklich hinterlegtem ERC20-Contract, passender Chain und hinreichender Kursqualität als aktuelle USD-Quelle verwendet; die Umrechnung erfolgt über den datierten Frankfurter-Referenzkurs. **Ohne identifizierbares Token oder verifizierte EUR-Umrechnung bleibt der vorhandene Preis unverändert.** Keine privaten Wallet-Adressen oder API-Schlüssel werden für diese Fallbacks übertragen; nur Coin-IDs bzw. öffentliche Token-Contracts werden abgefragt.

Die externen Anbieter können frei verfügbare Daten, CORS, Lizenzbedingungen oder Endpunkte ändern. Die App bleibt ohne eigenen Backend-Proxy und ohne eingebaute Geheimschlüssel.


### Universelle Wertpapiersuche und sichere Börsenzuordnung

Unter **Position bearbeiten → Wertpapier finden und Börse zuordnen** kann jeder Nutzer mit eigenem API-Schlüssel von **EODHD** (ISIN, Name, Ticker), **FMP** (ISIN, Name oder Symbol) oder **Twelve Data** (Name/Ticker; ISIN abhängig vom Tarif) suchen. Die App fragt bei Bedarf EODHD, dann FMP und schließlich Twelve Data ab, bis verwertbare Treffer vorliegen; sie ist **nicht auf die vier Beispiel-ETFs beschränkt**. Die offline Vierer-Liste bleibt lediglich ein Sicherheitsfallback für ältere, eindeutig identifizierte Backups.

Jeder Treffer beschreibt eine **konkrete Börsennotierung** mit Ticker, Börse, MIC soweit bekannt und Kurswährung. Ergebnisse ohne verifizierte ISIN werden als unbestätigt markiert. Der Nutzer bestätigt seine Auswahl. Abweichende bekannte ISINs oder eine andere Kurswährung bei einer bereits bewerteten Position blockieren die automatische Übernahme. Nur Kennungen werden geändert, keine Stückzahlen, Preise, Cashflows oder historischen Vermögenswerte. Nach einer geänderten Notierung wird der vorhandene Kurs zur Prüfung gekennzeichnet, statt als neuer Livekurs zu gelten.

Bei Backups mit unbekannten Wertpapieren zeigt der Reiter **Positionen** die Schaltfläche **Zuordnungen prüfen** mit der Zahl unvollständiger Identitäten. Ein Klick startet die Suche für die nächste Position, sobald ein persönlicher API-Schlüssel hinterlegt ist. Ohne Schlüssel bleibt manuelle Erfassung möglich. Der Import löst keine unbestätigten Massenabfragen aus; ISIN identifiziert ein Wertpapier und nicht seinen Börsenhandelsplatz. API-Suchrechte und Kursabrufrechte können sich je nach Tarif unterscheiden.


### Schneller Anlage-Assistent (Anbieter, Konten und Wertpapiere)

Unter **Mehr → + Anbieter** zeigt die Anwendung schon beim Tippen, etwa „f“, offline Vorschläge wie **Flatex** inklusive eines **unverbindlichen** Anbietertyps wie Broker oder Bank. Nutzer können jederzeit eigene Namen und den Typ selbst festlegen. Die Liste ist eine lokale UX-Hilfe und **keine offizielle Zulassungs- oder Markenliste**; zur bloßen Namenseingabe findet keine Websuche und keine Datenübertragung statt.

Unter **Mehr → + Konto** werden je nach ausgewähltem Anbietertyp Vorschläge für Kontonamen und passenden Typ angeboten, beispielsweise bei Brokern Wertpapierdepot, bei Banken Giro-/Tagesgeldkonto und bei Wallet-Anbietern Krypto-Wallet. Ein selbst benanntes Konto bleibt möglich. Keine Kontonummern oder Zugangsdaten werden gesucht oder übernommen.

In **Position hinzufügen / bearbeiten** lassen sich bereits angelegte Anbieter und Konten mit kurzen Suchfeldern direkt filtern. Bei ETFs, Aktien oder Fonds erscheint die **universelle Wertpapiersuche vor den manuellen Eingabefeldern**. Nach ausdrücklicher Bestätigung einer Börsennotierung übernimmt Foliolab Bezeichnung, Ticker, ISIN (falls durch Quelle bestätigt), Börse, MIC und passende externe Börsensymbole. Stückzahlen, Kurse, Buchungen, Kostenbasis und Stichtage bleiben unverändert. Die Wertpapiersuche erfordert einen eigenen EODHD-, FMP- oder Twelve-Data-Schlüssel und die jeweilige Tarifberechtigung; ansonsten können Daten manuell eingegeben werden.


## UI- und Datenintegritätsverbesserungen (Entwicklungsstand Oktober 2026)

Diese Änderungen werden zunächst im Entwicklungsbranch geprüft und sind erst nach erfolgreicher Freigabe Bestandteil der veröffentlichten Version.

- **Anbieterauswahl:** Suchfilter ändern lediglich sichtbare Vorschläge. Weder Anbieter noch Konto werden ohne ausdrückliche Bestätigung durch den ersten Treffer ersetzt. Bei leerem Trefferfilter ist Speichern nicht möglich.
- **Startguthaben:** Optionaler Eröffnungsbestand bei der Kontoanlage wird in der gewählten Kontowährung erfasst. Für Fremdwährungen wird ein ausdrücklich eingegebener EUR-Umrechnungskurs verlangt. Der Eröffnungsbestand ist keine erfundene Kauftransaktion und kein automatisch gebuchter externer Geldfluss.
- **Bewertungswarnungen:** Ein Hinweis zu fehlenden, abgeleiteten oder veralteten Kursen führt direkt zu den betroffenen Positionen. Der Hinweis auf zuletzt gespeicherte Werte ist nicht mit einem aktuellen Börsenkurs gleichzusetzen.
- **Positionen:** Lokale Suche nach Name, ISIN, Symbol, Anbieter oder Konto und Sortierung nach Wert, Name, Anbieter, Anlageklasse oder Kursdatum. Suche und Sortierung verändern keine gespeicherten Positionen.
- **Buchungen:** Der Leerzustand bietet direkte Einstiege in die manuelle Buchung und den vorhandenen CSV-Import. Ohne ausreichende Transaktionshistorie wird keine verlässliche Rendite abgeleitet.
- **Backup-Anzeige:** Zeitpunkt des zuletzt angestoßenen Download-Exports wird als „für einen Download erstellt“ angezeigt, nicht als Garantie für dauerhaft gesicherte Dateien. Den tatsächlichen Download und sicheren Ablageort müssen Nutzer selbst kontrollieren.
- **Einstellungen und Dialoge:** Die Solana-RPC-Konfiguration liegt hinter einem aufklappbaren erweiterten Bereich. Dialoginhalt lässt sich unabhängig von Kopfzeile und Speichern/Abbrechen scrollen.
- **Legacy-Sonic:** Nur klar als native Sonic-Währung identifizierte Krypto-Positionen mit der bisherigen CoinGecko-ID `sonic` werden auf `sonic-3` normalisiert. Mehrdeutige Tokens bleiben unberührt; Bestandsmengen und historische Stichtage werden nicht rückwirkend umgeschrieben.

Weitere Prüfungen im Entwicklungsbranch:

```bash
npm test
npm run check
npm start
# In einer zweiten Konsole (mit installiertem Playwright):
node tests/browser-onboarding-suggestions.mjs
node tests/browser-account-opening.mjs
node tests/browser-valuation-drilldown.mjs
node tests/browser-settings-backup.mjs
node tests/browser-position-search.mjs
```

**Aktueller Stand:** Der dreistufige Anlage-Assistent ist als primäre Standarderfassung ergänzt; die frühere technische Maske bleibt für Spezialfälle über „Erweitert“ erreichbar. Der öffentliche OpenFIGI-Worker liegt weiterhin ausschließlich als separat getesteter Quellcode unter `/worker` und ist **nicht automatisch veröffentlicht**. Ist kein HTTPS-Worker-Endpunkt konfiguriert, funktionieren kuratierte lokale Treffer, bestehende persönliche Suchanbieter und die manuelle Erfassung unabhängig davon.


## Anlage-Assistent (Oktober 2026)

Unter **Positionen → Anlage hinzufügen** führt die Anwendung durch drei Schritte:

1. **Anlage finden:** Anlageklasse wählen, nach Name/ISIN/Ticker/Coin suchen oder vollständig manuell erfassen. Nur ausdrücklich ausgewählte Metadaten übernehmen. Lokal importierte CSV/TXT-Kataloge lassen sich ohne API-Key durchsuchen. Börsenkurse werden daraus nicht abgeleitet.
2. **Depot wählen:** Anbieter und Konto gezielt auswählen oder innerhalb des Assistenten neu anlegen. Namen und Typen sind frei editierbar. Bis zum finalen Speichern bleibt die Neuanlage vorläufig.
3. **Bestand erfassen:** „Aktueller Bestand“ erzeugt einen Anfangsbestand ohne erfundenen Kauf oder Cashflow. „Kauf erfassen“ nutzt das bestehende Transaktionsjournal, enthält den tatsächlichen Ausführungskurs und optional Gebühren. Ein Ausführungskurs ist **nicht automatisch ein aktueller Marktpreis**; ohne unabhängigen aktuellen Kurs wird die Bewertung als unvollständig dargestellt.

Der Assistent bewahrt Eingaben bei Zurücknavigation; nach dem Speichern stehen „Weitere Position hinzufügen“ und „Zum Portfolio“ bereit. Bereits vorhandene Positionen werden weiterhin im bestehenden Editor bearbeitet. Bei ungewöhnlichen Marktdatenschnittstellen stehen die technischen Felder dort zur Verfügung.

### Öffentliche Instrumentensuche (optional)

Für eine Community-Suche ohne persönlichen Marktdaten-API-Key kann ein unabhängig bereitgestellter Cloudflare Worker auf Basis von OpenFIGI v3 konfiguriert werden:

**Mehr → Automatische Aktualisierung → Erweiterte Einstellungen → Öffentlicher Instrumentensuchdienst**

Trage dort ausschließlich eine ausdrücklich vertrauenswürdige HTTPS-Basisadresse ein, beispielsweise die URL deines selbst bereitgestellten Workers. **Das Repository stellt keinen öffentlich erreichbaren, betriebsbereiten Worker zur Verfügung.** Bei leerer Adresse wird keine solche Verbindung hergestellt. Fehlende Treffer, Ratenlimits und Ausfälle führen nicht zum Verlust der manuellen Erfassung.

OpenFIGI liefert Stammdaten und mögliche Börsenzuordnungen, **keine aktuellen Kurse**. Fehlende Notierungswährungen müssen bewusst ausgewählt werden. Für automatisch aktualisierte Aktien- und ETF-Kurse sind weiterhin geeignete Quellen und gegebenenfalls persönliche Anbieter-Schlüssel erforderlich. Die Suche sendet nur den vom Nutzer eingegebenen öffentlichen Suchbegriff an den konfigurierten Dienst, keine Depotbestände, Kontoangaben oder Wallet-Schlüssel.

### Konten und Backup

Neue Konten können einen Eröffnungsstand in ihrer Kontowährung erhalten. Bei Fremdwährungen ist eine explizite EUR-Umrechnung erforderlich; das optionale Anfangsdatum dokumentiert nur den vorhandenen Bestand und erzeugt keinen rückdatierten Portfoliowert. Das Browser-Backup meldet den Zeitpunkt einer für den Download erstellten Datei. Es kann weder garantieren, dass der Download tatsächlich aufbewahrt wird, noch einen automatischen externen Schutz vor Browserlöschung bieten.

### Qualitätssicherung und Release

Lokal oder in GitHub Actions:

\`\`\`bash
npm test
npm run check
# Browserprüfung nach Installation der im Workflow fixierten Playwright-Version:
npm install --no-save playwright@1.56.1
npx playwright install chromium --only-shell
python3 -m http.server 4173
# In einer zweiten Konsole die Browser-Skripte aus .github/workflows/import.yml ausführen.
\`\`\`

Der Workflow testet die Kompatibilität von Backups, Wallets, Krypto-/ETF-Datenquellen, Buchungsjournal, UI und responsive Ansichten. Er veröffentlicht GitHub Pages erst nach einem erfolgreichen Testjob auf \`main\`. Der Worker wird nicht auf Pages ausgeliefert oder im Frontend vorinstalliert.

Rollback: Frühere \`main\`-Commits bleiben erhalten und können bei kritischen Fehlern gezielt per Revert-Commit wiederhergestellt werden. Alte lokale Datenbestände und Backups werden nicht aktiv migriert oder extern gespeichert, solange sie nicht geladen werden.


## Erweiterte Instrumentensuche und OeKB-Meldefonds (v1.2.0)

### Kryptowährungen
Im Assistenten **Anlage hinzufügen → Kryptowährung** werden die nach Marktkapitalisierung führenden **100 Coins** über den öffentlichen CoinGecko-Endpunkt \`/coins/markets\` geladen. Die Ranking-Reihenfolge ist eine aktuelle Anbieterinformation (kein fest verdrahteter Stand). Sobald eine Suche eingegeben wird, kann zusätzlich \`/coins/list\` nachgeladen werden: Der gesamte von CoinGecko unterstützte Coin-ID-Katalog wird ausschließlich im Speicher durchsucht, mit einer auf maximal 100 sichtbare Treffer begrenzten Ansicht. Die Auswahl eines Coins ist immer ausdrücklich erforderlich.

Diese Stammdaten sind **keine automatisch gespeicherten Kurse und Bestände**. Unterschiedliche Coins können dasselbe Symbol tragen; entscheidend ist die bewusst ausgewählte CoinGecko-ID. Bei Rate-Limits, CORS-Fehlern oder Offlinebetrieb bleiben die kuratierten Offline-Vorschläge und die manuelle Erfassung erhalten. Öffentliche Aufrufe unterliegen CoinGecko-Limits und werden je Session sparsam wiederverwendet; nach Freigabe der Antwort sind Name, Ticker und ID lokal sichtbar.

### Österreichische KESt-Meldefonds

Die [OeKB-Fondsabfrage](https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f) ist für die Prüfung einzelner Fonds verfügbar. Ein allgemein verfügbarer vollständiger CSV-Gesamtexport ist nicht gesichert. Deshalb zeigt der Anlage-Assistent **keinen vermeintlichen OeKB-Gesamtdownload oder OeKB-CSV-Importbutton** mehr. Zuvor lokal importierte Fondskataloge bleiben lesbar, sofern sie bereits im Browser gespeichert wurden. Daraus folgt keine aktuelle Bestätigung des steuerlichen Meldefonds-Status.

### Datenquellen
- **OeKB:** offizielle Fonds-Einzelabfrage zur steuerlichen Kontrolle; kein behaupteter Komplettdownload im Assistenten.
- **CoinGecko:** öffentlicher Top-100- und vollständiger ID-Katalog ohne verpflichtende persönliche API-Schlüssel, abhängig von Netzwerk und Limits.
- **Wertpapier-Suche:** nur ausdrücklich importierte Wertpapierverzeichnisse und Fondsdaten sowie bewusst angeforderte externe Suchergebnisse. Keine sichtbaren fest hinterlegten Beispiel-ETFs.
- **OpenFIGI/weitere Provider:** bleiben wie zuvor optional, abhängig von vorhandenen Worker- oder Nutzerzugängen.

Bei fehlendem Online-Katalog ist die manuelle Anlage weiterhin möglich. Der Service Worker speichert lediglich den statischen App-Code, niemals externe API-Antworten, personenbezogene Kontodaten oder aus dem OeKB-Portal gescrapte Daten.


## Große Wertpapierverzeichnisse – lokale Imports (v1.3.0)

Die sichtbare Suche enthält **keine** fest hinterlegten ETF-Beispieltreffer. Erst nach Import einer CSV/TXT-Datei wird der lokale Wertpapierkatalog gefüllt. Interne Legacy-Zuordnungen für alte Backups bleiben erhalten. Für umfangreiche Suchtreffer gibt es jetzt unter **Positionen → Anlage hinzufügen → ETF/Aktie/Fonds/Sonstiges** den unaufdringlichen, standardmäßig zugeklappten Bereich **„Wertpapierkatalog importieren (CSV/TXT)“** unter den Suchergebnissen. Darin liegen der Link zur Xetra-Downloadseite und **„CSV/TXT auswählen“**. Unterstützte Eingaben:

- **Deutsche Börse Xetra:** Offizielle Datei **T7 (Xetra) All tradable instruments** (CSV mit Zeilen \`Market: XETR\`, \`Date Last Update\`, Kopfzeile). Importiert ISIN, Instrumentbezeichnung, vorhandenes Börsenkürzel, Währung und nur eindeutig bezeichnete Instrumentklassen. Ausdrücklich im Dateiheader genannte MIC \`XETR\` wird übernommen. Bereits zur Löschung vorgemerkte und inaktive Werte bleiben außen vor. Die **Static Instrument Reference Data**-ZIP ist **nicht** die erwartete CSV und kann in diesem Dialog nicht gelesen werden.
- **Nasdaq Trader:** \`nasdaqlisted.txt\`, \`otherlisted.txt\`, \`nasdaqtraded.txt\` soweit deren erwartete Spalten vorhanden sind; Symbol, Name, explizites ETF-Merkmal, Test-Issue und ggf. Börsencode. Unterschiedliche Dateien ergänzen sich. Ein NASDAQ-Kürzel ist **keine ISIN**; ohne Währungsfeld wird **keine USD-Währung geschätzt**.
- **ESMA FIRDS:** Nur sinnvoll strukturierte, bereits **als CSV aufbereitete Teilmengen** mit erkennbaren Spalten \`ISIN\`, \`FullNm\`/Name, gegebenenfalls CFI, Währung und MIC. Die amtlichen vollständigen ESMA-FIRDS-XML-/ZIP-Veröffentlichungen werden derzeit **nicht direkt verarbeitet**, da dies einen gesonderten ETL-Prozess erfordert.
- **Eigene Tabellen:** UTF-8-/Windows-1252-CSV mit eindeutig benannten Namens- und Kennungsfeldern, Semikolon, Komma, Tab oder Pipe. Keine nicht bestätigten Werte erfinden.

Je Datei maximal 24 MB / 160.000 Zeilen. Die App verwendet IndexedDB nur auf dem Endgerät; eine erfolgreiche erneute Einspielung desselben Verzeichnisses ersetzt dessen alte Version, andere Quellen bleiben erhalten. Nichts wird in GitHub hochgeladen und keine Portfolio-Buchung durch den Import ausgelöst. Von großen Verzeichnissen werden **höchstens 100 passende Treffer gleichzeitig** angezeigt; das Suchfeld filtert weiterhin den gesamten lokal gespeicherten Datenbestand.

### Periodische Aktualisierung und Datenrechte

Die App **spiegelt keine Datenverzeichnisse zentral** und lädt sie **nicht ungefragt periodisch von Drittservern**. Nutzer können die Originaldatei von der jeweils offiziellen Website herunterladen und später über den Importbutton ersetzen. Bei Verzeichnissen ab 30 Tagen Alter erscheint eine klare Erinnerung im Suchdialog. Soweit die Datei ein eigenes Aktualitätsdatum enthält (beispielsweise Xetra), wird dieses statt des Importdatums verwendet. Für Einhaltung der jeweiligen Bezugs-/Nutzungsrechte ist die konkrete Herkunft maßgeblich – regelmäßiges Herunterladen allein erteilt **keine** Weiterveröffentlichungslizenz.

Offizielle Anlaufstellen und Rechtshinweise, geprüft am 22.10.2026:

- Xetra: https://www.cashmarket.deutsche-boerse.com/cash-de/Handel/Handelbare-Werte-Xetra/Downloads/xetra-downloads — öffentlich herunterladbare Dateien; **allgemeines Recht auf zentrale Weiterverteilung nicht nachgewiesen**.
- Nasdaq Symbol Directory: https://www.nasdaqtrader.com/trader.aspx?id=symboldirdefs — **verschiedene** Nutzungsregeln für Nasdaq-Listed-Ereignisdaten und Nasdaq Fund Network; keine pauschale Rehosting-Freigabe sämtlicher Daten.
- ESMA FIRDS: https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_firds_files ; Register-Rechtshinweis https://registers.esma.europa.eu/publication/legalNoticePage — Reproduktion mit Quellenkennzeichnung, korrekter Veränderungskennzeichnung und weiteren Bedingungen gestattet; Drittanbieterrechte gesondert beachten.
- OpenFIGI: https://www.openfigi.com/docs/terms-of-service — FIGI-Identifier Public Domain; ergänzende API unter https://www.openfigi.com/api/documentation; der bisherige optionale Worker ist nicht automatisch live verfügbar.
- OeKB: https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f — öffentliche Abfrage; Wiederveröffentlichung vollständiger Steuerdaten und automatische Datenlieferung nicht als freigegeben unterstellen.

Die Kataloge sind **Instrumentenstammdaten, keine Kurse, Depotbestände oder Steuerstatus-Bestätigungen**. ISIN bezeichnet ein Wertpapier; die notierungsbezogene Identifikation benötigt die konkrete Währung und Börsenzuordnung. Eine Auswahl übernimmt keine historische Performance und aktualisiert keine Position ohne abschließendes Speichern des Nutzers. Bei Fehlern kann weiterhin manuell erfasst werden.


Ein detaillierter, kritisch überprüfter Vergleich von Massen-Downloads, Datenrechten und noch offenen Funktionen ist unter [SOURCE_DATA.md](SOURCE_DATA.md) dokumentiert.
