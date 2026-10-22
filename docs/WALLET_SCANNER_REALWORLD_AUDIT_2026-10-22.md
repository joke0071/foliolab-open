# FolioLab Open – Live-Audit Walletscanner

**Datum:** 22. Oktober 2026  
**Build:** Pull Request #34  
**Testverfahren:** GitHub Actions, Chromium/Playwright, echte HTTPS-APIs aus dem Browser-Origin `127.0.0.1:4173`, unveränderliche und öffentlich bekannte Adressen. Keine privaten Zugangsdaten, keine Signaturen, keine Transaktionen, kein Benutzerportfolio.

## 1. Stichprobe – öffentliche API-Erreichbarkeit

Zwei Messdurchläufe. Erster Durchlauf: **11 von 14** Anfragen erfolgreich. Zweiter Durchlauf: **12 von 14** erfolgreich. Die Ergebnisse sind zeit- und netzwerkabhängige *Momentaufnahmen*, keine SLA-Aussage.

Zweiter Durchlauf:

| API | Ergebnis | Browser-Latenz |
|---|---|---:|
| Ethereum Blockscout – Kontostand | gültige Antwort | 335 ms |
| Ethereum Blockscout – Tokenliste | gültige Antwort nahe Timeout (andere Probe Timeout) | 7.988 ms |
| Avalanche C-Chain Explorer | gültig | 598 ms |
| Binance/Binplorer Tokeninventar | gültig | 951 ms |
| BNB native RPC | gültig | 300 ms |
| BNB `eth_call` Token-Decimals | gültig | 300 ms |
| Sonic native RPC | gültig | 850 ms |
| Solana PublicNode `getBalance` | gültig | 221 ms |
| Solana Labs RPC `getBalance` | **HTTP 403** | 179 ms |
| Solana PublicNode `getProgramAccounts` | **HTTP 403 / persönlicher Indexer-Token erforderlich** | 296 ms |
| Cosmos Hub LCD | gültig | 419 ms |
| Hedera Mirror Node | gültig | 218 ms |
| NEAR RPC | gültig | 250 ms |
| Rocket Pool rETH `decimals()` Ethereum RPC | gültig | 207 ms |

## 2. Solana-Staking RPC-Matrix

Sieben ohne eigenen Schlüssel getestete Endpunkte: PublicNode, Solana Labs (zwei URLs), dRPC, OnFinality, SubQuery und Ankr. **Nur PublicNode** beantwortete `getBalance` in diesem Browser-Lauf. **Keiner** beantwortete das notwendige `getProgramAccounts` für native Stake-Accounts. Gründe: HTTP 403, HTTP 429, gebührenpflichtiger Tarif, CORS/Netzwerkfehler.

**Konsequenz:** Für verlässlichen nativen Solana-Stake-Scan benötigt der Nutzer einen RPC-Anbieter, der `getProgramAccounts` für Stakes unterstützt. Der bereits bestehende eigene RPC-Eintrag unter „Mehr“ wird ausdrücklich in Oberfläche und Fehlertext erwähnt. Teilfehler überschreiben keine Bestände.

## 3. End-to-End-Walletscanner (keine Mock-Daten)

Die echten `discoverWallet`-Funktionen wurden in Playwright aus einer laufenden PWA gegen öffentlich bekannte, nicht private Adressen aufgerufen:

| Netzwerk | Positiv erfasste Positionen im Test | Laufzeit | Einordnung |
|---|---:|---:|---|
| Ethereum – bekannte öffentliche Wallet | 3 | 9.585 ms | Teilscan; Blockscout Tokeninventar stockte, begrenzter RPC-Fallback aktiv |
| BNB Smart Chain – bekannte öffentliche Wallet | 81 | 6.877 ms | Teilscan; >80 Indexer-Kandidaten, bewusstes Limit |
| Solana – Systemprogrammadresse (öffentlich, keine persönliche Wallet) | 1 | 4.422 ms | Teilscan; Token-/Staking-Endpunkte blockiert |
| Avalanche – öffentliche Burn-Adresse | 27 | 909 ms | Keine API-Teilfehlermeldung, aber keine Aussage zu P-Chain-Staking |

**Interpretation:** Vier Walletscans lieferten typ- und mengenmäßig plausible on-chain Werte, aber nicht alle relevanten Staking-Positionen. Dieser Test beweist keine übergreifende Portfolio-Vollständigkeit und verwendet nicht die Wallets des Nutzers.

## 4. Implementierte Stabilisierung

- Ethereum-/ERC-20-Explorer-Tokenliste erhält ein 8,5-Sekunden-Zeitlimit ohne automatische langwierige Retry-Schleife für diesen Endpunkt.
- Bei Blockscout-Ausfall fällt die Erfassung von Ethereum-Native-ETH, stETH, rETH und wstETH gezielt auf `ethereum-rpc.publicnode.com` zurück; die LST-Liste besteht aus fest verifizierten Contract-Adressen.
- Bereits importierte Ethereum-ERC-20-Positionen können bei Explorer-Ausfall über `balanceOf` aktualisiert werden.
- Keine Token-Discovery außerhalb der Whitelist als scheinbar vollständig ausgeben. Keine erfundenen Nullwerte bei API-Fehlern.
- Solana-Stake-Accounts benötigen einen eigenen indexfähigen RPC; dies wird vor und nach dem Scan erklärt.
- Zusätzliche Mock-/Fail-Closed-Tests für Ethereum-Ausfälle. Browser-/Offline-PWA-Testpipeline bleibt als Release-Gate aktiv.
- Öffentliche Endpunkte werden per informational GitHub Action auf Pull Requests mit Walletänderungen geprüft, ohne flüchtige Provider-Ausfälle als lokale Codefehler zu behandeln.

## 5. Offene Grenzen

1. Public-RPC-Staking auf Solana bleibt ohne indexberechtigten Zugang **nicht vollständig automatisierbar**.
2. Native AVAX P-Chain, Ethereum-Beacon-Validatoren, DeFi-Vaults und ausstehende Sonic-Abhebungen werden weiterhin nicht als vollständig automatisch scanbar versprochen.
3. Öffentliche Provider können ihre Tarife, CORS-, API- und Ratenlimitpolitik ändern.
4. Ein Browser-Check einer öffentlichen Adresse ersetzt keinen späteren Abgleich mit echten, vom Nutzer ausdrücklich bereitgestellten Wallets.

## 6. Reproduzierbarkeit

- `tests/browser-wallet-live-audit.mjs` – 14 API-/CORS-/Schema-Proben
- `tests/browser-solana-provider-matrix.mjs` – 7 Solana-Provider × 2 Methoden
- `tests/browser-wallet-live-integration.mjs` – 4 echte Walletscans
- `tests/ethereum-fallback.test.mjs` – lokaler deterministic Fail-Closed-/Onchain-Fallback-Test
- `.github/workflows/wallet-live-audit.yml` – optionaler Live-Audit-Workflow

**Messlauf:** [GitHub Actions](https://github.com/joke0071/foliolab-open/actions/runs/39857279692)
