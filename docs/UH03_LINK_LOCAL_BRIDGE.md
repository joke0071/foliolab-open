# UH03 – Begrenzter lokaler LINK-Gegenbeleg

Ein konkreter LINK-Abgang auf Ethereum kann mit einer eigenen bestätigten Wallet-Historie, dem Kraken-Original und dem Ledger-Live-Original abgeglichen werden. Native BTC-/ETH-/SOL-Verträge bleiben erhalten. Kein allgemeiner ERC20- oder Gesamt-UH03-Abschluss.

## Nutzerablauf

1. Falls keine akzeptierte Historie für diese LINK-Position besteht: Wallet-Historie öffnen, das lokale LINK-Belegpaket auswählen, dessen Prüfung bestätigen, Teilhistory prüfen und ausdrücklich übernehmen. Es wird genau ein belegtes Ereignis ohne erfundenen Anfangsbestand übernommen. Bestände, Finanzbuchungen und Stichtage bleiben unverändert. Eine vorhandene Historie wird nicht ersetzt.
2. Im bestehenden Kraken-Import LINK-Abgang wählen. Eigene LINK-Wallet, Kraken-Referenz, vollständigen Chain-Hash und Zieladresse ausdrücklich zuordnen; Ledger-Original und dasselbe lokale Belegpaket auswählen. Nach Zustimmung prüfen, aktuelle Anfangsbestände/Restgruppen bestätigen und den geprüften Plan atomar übernehmen.
3. Reload, Wiederimport und portable v5-Sicherung behalten den getaggten Beleg. Die vorhandene vollständige Gruppenrücknahme nimmt Hauptbetrag und Börsengebühr gemeinsam zurück und hinterlässt eine dauerhafte Wiederimportsperre.

## Beleg und Grenzen

`foliolab-link-explorer-beacon-v1`, Chain1, enthält sieben lokale Rohantworten mit Capturemetadaten: Blockscout-V2-Transaktion, vollständige Transaktionslogs, Block nach Hash/Nummer und Transaktionsinklusion; ChainSafe-Beacon-V2-Block sowie Mainnet-Genesis. Jede Antwort wird bei Eingabe gegen ihren SHA256, Herkunft, GET/TLS/Status/Zeit und genaue Kennung geprüft. Keine Netzabfrage oder Sitzungsvollmacht entsteht dadurch. Neue Dateien und veränderte Zuordnungen erfordern neue Prüfung/Zustimmung.

Die Interpretation bleibt ausdrücklich **Blockscout-V2-Explorer-Ausführung plus Beacon-V2-Finalität**. `finalized` muss boolesch true, `execution_optimistic` boolesch false sein; Mainnet-Genesis, Slot, Executionhash, Blocknummer und Zeit müssen exakt passen. Providervertrauen, keine unabhängige Konsens-, Transaktions-Trie- oder Receipt-Root-Authentifizierung. Kein synthetisches RPC-Receipt.

Der Schnitt ist auf den bekannten LINK-Contract,18Dezimalstellen, einen direkten `transfer` und genau einen nativen Transferlog begrenzt. Statische Metadaten sind kein historisches `eth_call`. Der vollständige vorhandene Ethereum-Historyscanner einschließlich seiner Metadaten-/`eth_call`-Gates bleibt unverändert. Der Einzelbeleg zertifiziert keine Gesamtdeckung oder historischen Salden.

Der portable Journalbeleg enthält die geprüften kleinen Fakten, konkreten Belegtyp, Originalpayload-Hashes und Captureherkunft. Die Rohdaten bleiben in der lokalen Datei; Restore prüft die gebundene Projektion und behauptet keinen erneuten Rohdatenhash ohne Rohdaten. Die vorhandene Journal-Quellbindung umfasst diese Projektion. Der bestehende v5-ETH-Metadatenplatz dispatcht den expliziten LINK-Typ; alte native ETH-Validatoren akzeptieren ihn nicht als ETH.

Kraken-Hauptbetrag und separate Börsengebühr werden je einmal abgebucht; der bereits gezählte eigene Eingang bleibt unverändert. ETH-Gas bleibt beim fremden Sender. Ein leeres Ledger-Tokengebührenfeld bleibt unbekannt; es wird nicht als null oder LINK-Gas interpretiert. Kostenbasis und EUR-Gebührenbewertung bleiben soweit unbelegt unbekannt. Quellgruppe, akzeptiertes Historyereignis, Walletscope/Contract/Decimals, aktuelle Baseline und CAS bleiben Pflicht.

## Nachweise

Synthetische Rohpakete/Negativfälle in `tests/kraken-link-bridge.test.mjs`; bestehende native ETH-Tests erhalten. `tests/browser-kraken-import.mjs` führt den LINK-Schnitt im regulären Chromium-/Firefox-/WebKit- und tatsächlichen Produktionslauf aus: explizite Teilhistory, lokale Zustimmung, aktuelle Vorschau, Quota/post-put-Abbruch, CAS,320–430px/Axe, frisches verschlüsseltes v5-UI-Restore, Reload/Wiederimport, Offline-PWA und persistente Gruppenrücknahme. Private Originale bleiben außerhalb öffentlicher Tests/Artefakte. Produktfreigabe erst nach eingefrorener regulärer CI/Main/Deploy/Live-Abnahme.
