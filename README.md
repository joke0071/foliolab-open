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
- **Wallet hinzufügen** in Positionen: öffentliche Adresse eingeben, Netzwerk wählen, entdeckte Guthaben prüfen und mehrere Coins ohne API-Key übernehmen. Unterstützt einzelne Bitcoin-Adressen, Ethereum, Base, Arbitrum, Optimism, Polygon (native Coins und ERC-20) sowie Solana (SOL, SPL und Token-2022). EVM nutzt öffentliche Blockscout-Instanzen, Solana PublicNode RPC (ohne Schlüssel). Endpunkte sind nicht garantiert jederzeit erreichbar.
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
- Kein Bitcoin-xpub-Scan (derzeit nur einzelne BTC-Adressen). Keine Wallet-Erkennung für alle Blockchains. Der Import umfasst nur die angeführten Netze; unklare, seltene oder wertlose Token werden möglicherweise ohne Kurs übernommen. Solana-RPC liefert bei SPL-Token die Mint-Adresse, nicht zuverlässig die lesbare Coin-Bezeichnung. Token aus unbekannten Contracts müssen vom Nutzer geprüft werden.
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
