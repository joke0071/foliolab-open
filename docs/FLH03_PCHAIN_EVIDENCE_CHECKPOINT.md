# FLH03-09 — begrenzter UTXO-Nachweisvertrag

Basis: v193/main `7dbb9c24acb7f20259942835c759b0bd093f229d`, vollständig live abgenommen. Einziger funktionaler Strang: `feature/flh03-pchain-evidence`. Bestehende FLH02-/Wallet-/Bewertungs-/Importengine bleibt maßgeblich. Dieses Inkrement aktiviert keinen P-Chain-Scanner und übernimmt keine Bestände.

## Vorgänger und Quellen

Rang4 der bestehenden Roadmap ist für vorhandene Eingänge statusbezogen abgeglichen: readonly16/v189 und Ledger-Preview18/v190 DONE; aktueller `account-evidence.js` verwendet weiterhin bestehende Qualitäts-/Eröffnungs-/Quellen-/Transferdaten, keine neue belegte Funktionslücke. Vollständiges07 und native02–05 benötigen regionale Originalexporte plus unabhängige Anfang-/End-/Cashreferenzen. Bereits erfolgte private Ledger-/Bittr-Schemaaudits nicht wiederholen. Keine neuen Original- oder Mehrjahres-Abnahmen behauptet.

Primärquellen, am28.10.2026 lesend geprüft:

- [Offizielle P-Chain-RPC-Referenz](https://build.avax.network/docs/rpcs/p-chain): `getBalance`/`getStake` veraltet; UTXO-Paginierung hat weder Eindeutigkeits- noch Konsistenzgarantie. Eine Adressreferenz beweist keine vollständige Eigentumszuordnung.
- Öffentlicher Node meldet `avalanchego/1.15.1`, Commit `fdb2c1b9b02ef357b5867d5ababb6acc83837a01`. Derselbe Versionsstand dient als feste Quellreferenz; aktuelles Repository-HEAD wird nicht als Deploymentgleichheit ausgegeben.
- [UTXO-Struktur](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/vms/components/avax/utxo.go), [Codec](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/vms/platformvm/platform/codec.go), [RPC-Encoding](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/utils/formatting/encoding.go), [Prüfsumme](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/utils/hashing/hashing.go), [Ownerbedingungen](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/vms/secp256k1fx/output_owners.go), [Sperrausgabe](https://github.com/ava-labs/avalanchego/blob/fdb2c1b9b02ef357b5867d5ababb6acc83837a01/vms/platformvm/stakeable/stakeable_lock.go).
- Lesender Chromium-Aufruf aus `https://foliolab.unperfekt.at` erreichte am28.10.2026 öffentliche Nodeversion und P-Chain-Höhe mit HTTP200. Prüfumgebung mit HTTPS-Inspektionsproxy/Zertifikatsausnahme, unveränderte Same-Origin-/CORS-Regeln und keine Interception. Kein allgemeines Transport-SLA, keine Wallet-/Saldenabnahme und keine Gleichheit sämtlicher Loadbalancer-Nodes bewiesen. Nur öffentliche Protokollmetadaten, keine echten Finanzdaten abgefragt.

Keine fremde Implementierung oder Originalfixtures übernehmen; ausschließlich unabhängig geschriebene Auswertung des beschriebenen Formats und rein synthetische Referenzen.

## Kleinster ausführbarer Vertrag

1. RPC-Encoding ausdrücklich angeben: `hex`/`hexc` enthalten vier Prüfsummenbytes (letzte vier SHA256-Bytes); `hexnc` ist ausdrücklich ohne Prüfsumme. Nie wegen eines Prüfsummenfehlers auf ungeprüfte Bytes zurückfallen.
2. Codec0, Big-Endian, vollständiges UTXO mit Transaktions-ID/Outputindex/Asset-ID. Unterstützt ausschließlich TransferOutput7 und eine StakeableLockOut22 mit innerem TransferOutput7. Unbekannte Version/Typ, verschachtelte/Nullsperre, Nullbetrag, falsche Ownerbedingungen, Duplikate/unsortierte Owner, unvollständige/zusätzliche Bytes und überschrittene Sicherheitsgrenzen führen zum Fehler statt Nullbestand.
3. Alle uint64-Beträge/Zeiten bleiben Dezimalstrings/BigInt. Rohbetrag ist ohne belegte Assetidentität kein AVAX-Wert. Kein Summen-, Reward-, Preis-, Import- oder Transaktionsmodell hinzufügen.
4. Optionale reine Prüfung gegen ausdrücklich deklarierte, bereits decodierte P-Chain-Owner-IDs und eine ausdrücklich gelieferte Chainzeit: innere Zeitsperre und äußere stakeable Sperre unterscheiden. Ein referenzierter Owner, Multisig-Teilabdeckung und frei spendbare Ausgabe sind kein exklusiver Besitznachweis. Selbst vollständige deklarierte Adressabdeckung beweist keine privaten Schlüssel oder reale wirtschaftliche Eigentümerschaft.
5. Roh-Outpoint ist noch keine globale Importidentität. Spätere Integration braucht Netzwerk/Chain/Atomic-Quell-/Zielkontext und belegte Transaktionsherkunft; identische Ausgaben und Seitenüberlappung nicht nach Betrag/Datum zusammenlegen. `getStake`-Ausgaben sind keine UTXO-Liste und beweisen allein weder Start/Ende noch aktive/pending Zustände.

Sicherheitsgrenzen des Inkrements ausdrücklich begrenzt: maximal64KiB codierte Binärdaten und1024Owner, kein Anspruch auf alle möglichen P-Chain-Ausgaben. Überschreitung ist nicht „leer“.

## Offene Abschlussgates

Nach Implementierung unabhängige Referenz-/Negativtests, drei Browser-Engines/WebCrypto, vollständige unveränderte Finance-/IDB-/Backup-/Restore-/Offline-CI; geprüfter Mergebaum und tatsächliche Produktionsbytes/Bilder bei Veröffentlichung. Dieser Vertrag allein ist noch kein PASS.

09 bleibt insgesamt PARTIAL: adressbezogener Codec/Identitätsnachweis, vollständige eindeutige UTXO-/Stakingabdeckung, konsistente Zustandsanker, C↔P-Export/Import/Fees und unabhängige Sollreferenzen sind vor aktivem Adapter/Bestandsübernahme separat erforderlich. Kein C-Chain-Wallet in P-Chain-Adresse umdeuten, keine prognostizierten Rewards oder automatischen Ausgleichsbuchungen. Sonic10 folgt separat im selben sequenziellen Masterauftrag; keine parallele Implementierung.
