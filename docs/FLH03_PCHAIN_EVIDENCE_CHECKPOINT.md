# v194 LIVE_ACCEPTED · begrenzter P-Chain-UTXO-Nachweis abgeschlossen · 28.10.2026

[PR183](https://github.com/joke0071/foliolab-open/pull/183) DONE im ausdrücklich begrenzten Vorbereitungsumfang: unabhängiger reinlesender UTXO7/22-Decoder mit Encoding/Prüfsumme/Codec/Owner-/Größen-/uint64-/Zeitsperrenvertrag. Kein aktiver P-Chain-Scanner, keine Bestands-/Finanz-/Modell-/Storage-/Backupintegration und keine zweite Historienengine. FLH03-09 insgesamt weiter PARTIAL.

Release/main `b2d578999bb10be1f8b57d4c7523ba05dd864db1`, Tree `2dc7ff445ef081d4e753119ff14c97301afa1a79` exakt finalerPR/lokaler/getesteterMergebaum. PR40663063298+Wallet40663063311 und vollständiger [Main/Pages/Live40664337654](https://github.com/joke0071/foliolab-open/actions/runs/40664337654) SUCCESS;783/783Units/0Fail/0Skip+Syntax+Chromium/beideFirefox-WebKit-Pflichtshards. Bisherige30Cross-Kommandos/Engines/Pins/Gates unverändert, eine zusätzlicheSuite ausdrücklich abgesichert.

TatsächlicheProduktion:110exakteDateivergleiche/SW194,6Kerngruppen/18Axe einschließlich vollständigerplain/frischemEncryptedRestore/echtemOfflinecommitReload. Neuer Modul-/WebCrypto-/synthetischerUTXO-Gate in Chromium/Firefox/WebKit gegenProduktionsdomain PASS: exakterRohbetrag9007199254740993, Prüfsummen/Codecnegative, deklarierteOwner-/Sperrenbedingungen, exakteIDB-/Settings-Nullmutation. Kein Wallet-/Originalsaldo alsgetestetbehauptet. ProduktionsZIP12806057283 vorExtraktionSHA256 `daea645edb7a18cea6d34ab7be992eaa319f3d41ea7822f42a35a63d0ad7830f` bestätigt; drei vorhandeneKernbilder320/390/1440 tatsächlichangesehen,PASS, keine neueUI. [Maschinenbeleg](release-evidence/pchain-evidence-v194-release.json).

**Folge gemäß bestehendemRang5:** Sonic10-Zustands-/Generationsvertrag, vorhandenenScanner/FLH02 wiederverwenden. NurlesendeVorarbeit jetzt zusätzlichbelegt: aktuelleERC1967-SFC-Implementierung anexplizitemBlock und derenöffentlicherRPC-LaufzeitcodeSHA256 stimmenmit Sourcify-verifiziertemRuntime überein; tatsächlicheverifizierteQuelle4.0.5, nichtneuererRepoStand4.0.6/Package4.0.4. [BegrenzterPrimärbeleg](release-evidence/sonic-deployment-source-2026-10-28.json). Keine fremdenUNLICENSED-Quellenkopiert, keineWallet-/Event-/FinanzabnahmeoderhistorischeUpgradeabdeckung behauptet. WeiterePChain-Adress-/globalIdentitäts-/konsistenteUTXO-Staking-/C↔P-/Fee-/Sollwertgates bleiben offen; keinepauschaleexterneBlockade ausführbarerVertragsarbeit.

Rang4 vorhandene07/16-Eingänge statusbezogenabgeglichen; vollständigeBroker02–05/07 regionalOriginale/Anfang-End/Cashreferenzen weiterhinextern, frühereLedger-/Bittr-Schemaaudits vorhanden undnichtwiederholt. Gesamtauftrag/#149/#165 weiterPARTIAL. RealeHardware/OAuth/Original-/Fachgates offen, FLH05-A/PERF01 weitererstnachVorgängern. [LesendeCI-Laufzeitstichprobe](ci/interim-runtime-observations-v194.json): Regressionen überwiegenInstallation, keine zusätzlicheZwischenoptimierung/Abdeckungskürzung; keineApp-Startmessung.

---

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

`lockState` klassifiziert ausschließlich die beobachteten Zeitsperren. Es beweist weder eine noch unverbrauchte Ausgabe, akzeptierte Chainherkunft, Atomic-Importabschluss noch Verfügbarkeit eines Guthabens. Das Modul wird nicht vom bestehenden Scanner/Modell/Finanzpfad importiert.

## Offene Abschlussgates

Nach Implementierung unabhängige Referenz-/Negativtests, drei Browser-Engines/WebCrypto, vollständige unveränderte Finance-/IDB-/Backup-/Restore-/Offline-CI; geprüfter Mergebaum und tatsächliche Produktionsbytes/Bilder bei Veröffentlichung. Dieser Vertrag allein ist noch kein PASS.

Implementierter Kandidat: `src/pchain-evidence.js`, ausschließlich unabhängig geschriebener begrenzter Decoder/Zeitsperren-/deklarierterOwnervergleich; keine bestehende Finanz-/Modell-/Storage-/Backup-/Scannerdatei geändert. Lokal783/783Units,0Fail/0Skip und Syntax PASS;15neue UTXO-Referenz-/Negativtests einschließlich unabhängig mit Python berechneter fester Prüfsumme, jedes beschädigten Bytes/jeder Trunkierungsgrenze, voller uint64-/1024Owner-Grenzen und klarer Multisig-Teilabdeckung. Tatsächlicher Chromium-Modul-/WebCrypto-/Nullmutationsgate PASS. Firefox/WebKit, vollständige neue GitHub-CI und Live-Abnahme PENDING, SW194 nur Kandidat.

Lokaler Erstlauf780/781: historische CI-Policy erwartete exakt30Kommandos und lehnte die neue zusätzlicheSuite korrekt ab. Historisches30Kommandos-Manifest unverändert erhalten; neue31.Kommandopflicht und zusätzliche Negativtests separat ergänzt. Alle alten Kommandos/Engines/Shards/Assertions unverändert, keine CI-Optimierung oder Gatekürzung. Erster lokaler Browseraufruf traf einen in einer getrennten Ausführungs-Netzwerkumgebung gestarteten Server nicht (Connection refused); mit Server und Browser im selben Prozesskontext bestanden. Kein Produktfix und kein unbelegter Firefox/WebKit-PASS daraus.

Der neue Browsergate läuft zusätzlich im bestehenden Chromium-/Cross2-/tatsächlichen Drei-Engine-Livepfad; nur vier neue Workflow-Kommandos, alle bisherigen Kommandos/Pins/Berechtigungen/Trigger unverändert. Öffentlicher Origin-Capability-Beleg: `release-evidence/protocol-origin-capability-2026-10-28.json`, ausdrücklich keine Bestandsabnahme.

09 bleibt insgesamt PARTIAL: adressbezogener Codec/Identitätsnachweis, vollständige eindeutige UTXO-/Stakingabdeckung, konsistente Zustandsanker, C↔P-Export/Import/Fees und unabhängige Sollreferenzen sind vor aktivem Adapter/Bestandsübernahme separat erforderlich. Kein C-Chain-Wallet in P-Chain-Adresse umdeuten, keine prognostizierten Rewards oder automatischen Ausgleichsbuchungen. Sonic10 folgt separat im selben sequenziellen Masterauftrag; keine parallele Implementierung.
