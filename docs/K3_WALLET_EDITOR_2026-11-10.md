# K3 – bestehende Wallet-Netzwerke beim Bearbeiten erhalten

Basis v303/Main73a17662e53d4b4d88125a85879e5fcae112596e. Owner e595fcc6d453 allein ACTIVE.

## Reproduzierte Kernlücke

Eine vorhandene, vom Modell unterstützte Solana-Stakingposition verwendet wallet.chain=sol-stake. Die Netzwerkauswahl im normalen Positionseditor enthält nur btc/btc-hd/xrp/xrp-token/evm/erc20/sol/spl. Keine Option passt, daher wählt der native Browser-Select implizit btc. Beim Speichern einer bloßen Namensänderung entsteht dadurch eine BTC-Wallet statt der ursprünglichen Solana-Stakeverknüpfung, sofern die synthetische Adresse beide Formate erfüllt; sonst scheitert der normale Edit an der BTC-Adressprüfung. Ebenfalls fehlend: sonic-stake/cosmos/cosmos-stake/cosmos-unbonding/hedera/near/near-locked.

Repro tatsächlich ausgeführt: exakte Main-posForm, native Chromium-DOM/FormData und reale createPosition/validateWallet. Ausgang sol-stake → Formularbtc → validierterKandidatbtc. Nur synthetische Daten; keine dauerhafte Portfoliomutation/echte Wallet/Netzwerkanfrage. Noch keine vollständige App-Speicherkettenabnahme aus diesem isolierten Repro abgeleitet.

## Begrenzte Taskkarte

Ziel: vorhandene vom Modell unterstützte Walletkennung beim normalen Bearbeiten erhalten. Keine neue Scanner-/Finanz-/Stakingengine, keine neue manuelle Wallet-Erkennung und keine Freigabe unbekannter Chains. Die bisher angebotenen manuellen Netzwerke bleiben unverändert; ein bereits vorhandenes ergänzendes Netzwerk wird als ausdrücklich bestehende Verknüpfung korrekt ausgewählt angeboten. Adress-/Contract-/Chain-ID-/Dezimal-/Bestands-/Journalidentität bleiben bei reiner Namens-/Notizänderung erhalten.

Abnahme: native FormData behält alle acht zuvor fehlenden Kennungen; echte Rename/Reload-Kette mit Solana-Staking bleibt identisch außer beabsichtigtemText/Snapshot; bestehende Standardwallet-Eingabe unverändert; Abbrechen/Quota/CAS und keine unbekannte Chainfreigabe; Units/Syntax/relevanteBrowser einschließlich verpflichtender finalerCI/Main/Produktion vor Release. K2-Drei-Hilfenkandidat kann im gleichen begrenzten Bedienungspaket mitgeführt werden.

Geplante Dateien: src/app.js (nur Formoptionen), ergänzende kleine Quellen-/Browserregressionen in bestehenden Suiten, sw.js/Assetversion wie Pflichtvertrag; drei vorbereitete Kurshilfen. Noch keine CI/PR/Main-/Releasebehauptung. Neue bestätigte Kernlücke nicht durch kosmetische Freigabe umgehen.
