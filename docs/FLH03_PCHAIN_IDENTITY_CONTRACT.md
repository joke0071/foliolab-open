# FLH03-09 – P-Chain-Adresse und kontextgebundene UTXO-Identität

Basis v197 LIVE_ACCEPTED, main `7b96a411925621f59021c36ad4d4a60a531c3a92`.
Einziger neuer Funktionsbranch: `feature/flh03-pchain-identity`.
Der Vertrag wird vor Implementierung separat auf GitHub gesichert.

## Zwei Etappen dieser Sitzung

| ID | Ergebnis / begrenzter Umfang | Abhängigkeit | Abnahme | Status |
| --- | --- | --- | --- | --- |
| P09-ID01 | Quellenprüfung und dieser ausdrückliche Adress-/Identitätsvertrag | vorhandener v194-UTXO-Decoder, v197-Basis | feste Primärquellen, klare Ablehnungen und Identitätsgrenzen; eigener Commit vor Code | DONE nach Sicherung |
| P09-ID02 | Reine Adressprüfung und UTXO-Beobachtungsidentität mit unabhängigen Negativ-/Browsertests | gesicherter ID01-Vertrag | gezielte Units, Syntax, vorhandene Pflicht-CI/3 Engines; keine Portfolio-/Settingsmutation | TODO |

Kein aktiver Scanner, RPC, Schlüsselimport/-ableitung, Walletbestand, Preis,
Journal, Migration oder Backupformat. Die Helfer werden nicht in App/Scanner
eingebunden. Bestehender `pchain-evidence.js`-Decoder und dessen Grenzen bleiben erhalten.

## Primärquellen und vorhandener Codec

Quellstand AvalancheGo `fdb2c1b9b02ef357b5867d5ababb6acc83837a01`, bereits
im Vorgänger als beobachtete Nodeversion dokumentiert; keine erneute Liveprobe und
keine Gleichheit beliebiger aktueller RPC-Nodes behauptet. Am 28.10.2026 gelesen:

- [Adressformat](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/utils/formatting/address/address.go)
  trennt Chainpräfix und Bech32-Payload; kein Bitcoin-SegWit-Versionswort.
- [Lokale Adressprüfung](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/vms/components/avax/addresses.go)
  bindet Chainauflösung, Netzwerk-HRP und 20-Byte-Owner an den Aufrufkontext.
- [Netzwerkwerte](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/utils/constants/network_ids.go):
  Mainnet 1 / avax, Fuji 5 / fuji, PlatformChainID ist die 32-Byte-Null-ID.
- [UTXO-Outpoint](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/vms/components/avax/utxo_id.go)
  besteht aus Transaktions-ID und uint32-Outputindex; kein Betrag/Datum als Ersatz.
- [RPC-Quellkontext](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/vms/platformvm/service.go):
  GetUTXOs unterscheidet lokale und aus einer anderen Chain importierbare Ausgaben.

`bitcoin-hd.js` besitzt nur einen internen Bitcoin-SegWit-Encoder mit festem HRP
und Versionswort. Diesen nicht umdeuten oder für Avalanche modifizieren.
Unabhängige kleine Bech32-Prüfung ohne neue Abhängigkeit; keine Fremdquellen kopieren.

## Strikter, absichtlich begrenzter Adressvertrag

`decodePchainAddress(address, {networkID})` akzeptiert nur kanonische Schreibweise
`P-avax1…` oder `P-fuji1…` und ausdrücklich als String übergebene Netzwerk-ID
`"1"` bzw. `"5"`. HRP muss zum Netzwerk passen. Bech32-Prüfsumme (Konstante1),
genau32 Datenwörter = 20Byte, keine Witnessversion oder Rest-/Paddingbits.
Keine Trimmung, Groß-/Mischschreibung, Bech32m, unpräfigierten Rohadressen,
X-/C-Adressen, 0x-EVM-Adressen, Aliase oder unbekannten Netzwerke still normalisieren.
Das ist eine bewusst kleinere Eingabemenge als die allgemeine Node-API.

Ergebnis unveränderlich: kanonische Adresse, Netzwerk-ID, rohe PlatformChainID,
rohe 20-Byte-Owner-ID als kleines Hex sowie ein versionierter, eindeutig
serialisierter Owner-Schlüssel aus Netzwerk/Chain/Owner. Eine Adresse ist nur
eine deklarierte Referenz; weder Schlüsselbesitz noch wirtschaftliches Eigentum,
Multisig-Schwellenabdeckung oder vollständige Walletabdeckung sind damit bewiesen.
Keine Umrechnung von C-Chain-EVM-Adressen in P-Adressen.

## Beobachtungsidentität, kein universeller Transaktionsbeweis

`pchainUTXOIdentity(utxo, {networkID, sourceChainId, destinationChainId})`
benötigt beide Chain-IDs ausdrücklich als kleine 64-stellige Hexstrings;
Ziel ist in diesem Inkrement ausschließlich die PlatformChainID.
Gleiche Quelle/Ziel bedeutet lokale P-Ausgabe; andere Quelle bedeutet Atomic-
Beobachtung am P-Ziel. Transaktions-ID stammt aus dem bestehenden Decoder
(32Byte-Hex), Outputindex ist eine sichere ganze Zahl im uint32-Bereich.

Ein versionierter Schlüssel serialisiert Netzwerk, Zielchain, Quellchain,
Transaktions-ID und Outputindex als festes Array. Kein Delimiter-Raten,
impliziter Mainnet-/P-Kontext, Betrag/Asset/Owner/Datum oder RPC-URL als Identität.
Gleicher Outpoint im gleichen Kontext hat denselben Schlüssel, auch bei mehreren
beobachteten Ownern oder verschiedenen Seiten. Andere Netzwerke, Quellen oder
Indizes kollidieren nicht. Objekt/Record bleiben unverändert.

Dies ist eine **kontextgebundene Beobachtungsidentität**, keine zusätzliche
globale wirtschaftliche Buchungsidentität. Lokale und Atomic-Beobachtungen
dürfen später nicht ungeprüft addiert werden. Export-/Importbeziehung, verbrauchte
Ausgaben, widersprüchliche Payloads derselben Identität, konsistente Zustandsanker,
Assetidentität, Fees und Eigentums-/Vollständigkeitsnachweise bleiben vor einer
Bestands- oder Importintegration offen. Keine Daten werden bereits dedupliziert.

## Prüfkriterien und Releasegrenze

Feste ausschließlich synthetische Adressen mit unabhängiger Referenzberechnung;
Checksum-Beschädigungen an jeder Stelle, falsches Netzwerk/Chain/Case/Format,
19/21Byte, zusätzliche Versions-/Datenwörter, Bech32m, unsichere Indizes,
fehlender Kontext, Grenzen0/uint32max, Schlüsseltrennung und gleiche Outpoints.
Vorhandene UTXO-Suite in Chromium/Firefox/WebKit um diese Helfer erweitern,
alle bisherigen Assertions erhalten; echte IDB-/Settings-Nullmutation.
Keine Workflowverkürzung oder doppelten vollständigen CI-Läufe.

Die reine Prüfung führt keine neue kritische Finanz-/Backup-/Storagefunktion ein.
Ein späterer aktiver P-Chain-Adapter braucht erst die übrigen Fachbelege und eine
eigene konkrete kritische Releasefreigabe. FLH03-09 insgesamt bleibt PARTIAL.
Nach zwei Etappen gesicherter Stopppunkt; FLH05/PERF/FLH-PROJ01 nicht vorziehen.
