> **Fortschreibung nach v283 LIVE_ACCEPTED:** Der nachfolgend beschriebene Produktschnitt ist durch PR299 im bestehenden UH03/v5-Kern integriert und tatsächlich produktiv in drei Engines abgenommen. [Abschlussbeleg](release-evidence/v283-pr299-live-acceptance.json), Produktvertrag `docs/UH03_LINK_LOCAL_BRIDGE.md` in Main. Die folgenden Formulierungen „noch erforderlich“/„bis zur Integration gesperrt“ sind der erhaltene historische Auftrag. Kein erneutes LINK-WAITING, keine RPC-POSTs/Nutzer-Pythonaufgaben/Originalneuanforderungen; übrige UH04→UH05-Arbeit bleibt offen.

# UH03 LINK – Finalitätsanker vorhanden, Produktbindung als nächster Schnitt

Aktueller Nachtrag 04.11.2026, Owner d9ff57914dab. Dieser Nachtrag ersetzt nur die frühere externe Finalitätswarteaufgabe; bestehende fachliche Schutzverträge bleiben erhalten. Aktuellen Release/Owner stets dem Checkpoint entnehmen.

## Beleglage

Die 15 unabhängigen Originalprüfungen der ausdrücklich autorisierten Blockscout-V2-GETs bleiben erhalten. Nach gesonderter Nutzerfreigabe wurde der passende Beacon-Slot regulär bei ChainSafe/Lodestar über `/eth/v2/beacon/blocks/{slot}` abgefragt: HTTP200, finalized exakt true, execution_optimistic exakt false. Slot, Execution-Blockhash, Blocknummer und Zeitstempel stimmen exakt mit dem gesicherten kanonischen Blockscout-Ausführungsblock überein. Mainnet-Genesiszeit und ValidatorsRoot wurden vorher kennungsfrei mit HTTP200 geprüft. Rohantworten, Header, vollständige URL/GET, Beginn/EndeUTC und SHA256 sind privat gesichert. Keine Redirects/keine Retries. Der davor ausdrücklich autorisierte PublicNode-GET lieferte403/Cloudflare1010; dessen echte Ablehnung ist ebenfalls erhalten.

**Die externe Finalitätslücke ist geschlossen.** Keine weiteren identischen RPC-POSTs, keine erneute Nutzer-Pythonaufgabe, keine Kennungs-/Originaldatei-Neuanforderung. Kein künstliches RPC-Receipt: Belegtyp bleibt ausdrücklich Blockscout-V2-Explorer-Ausführung plus Beacon-V2-Finalitätsbeleg. Das ist Providervertrauen, keine unabhängige Konsens- oder Receipt-Root-Authentifizierung.

## Noch erforderlicher Produktschnitt

LINK bleibt bis zur tatsächlichen Produktintegration gesperrt. Die separate vorbereitete Aufgabe `private/delta-8e88691c253e/link-access/NEXT_PRODUCT_BINDING.md` und der ursprüngliche UH03-Vertrag gelten. Vorhandenen Kraken-Import-/Journal-/v5-/Rücknahmekern verwenden; native ETH/BTC/SOL-Grenzen nicht pauschal aufweichen. Konkreter LINK-Contract, Chain1,18Decimals, nativer Loglocator, Rohmenge, Empfängerwallet, akzeptierter Historyevent und aktuelle Kraken-Quellgruppe/Baseline werden exakt gebunden. Statische LINK-Metadaten sind kein historisches eth_call. Den vollständigen Historyscanner mit dessen vorhandenen eth_call-/Metadatengates unverändert erhalten.

1. Einen ausdrücklich getaggten begrenzten Belegvertrag für Blockscout-Ausführung und Beacon-Finalität im bestehenden UH03-Kern ergänzen. Originalpayload-Hashes, Quelle und Grenzen erhalten. Neues JSON braucht neue Prüfung/Zustimmung; keine versteckte Sitzungsvollmacht. Browserablauf mit expliziter geprüfter lokaler Belegeingabe oder regulärem autorisiertem Abruf gestalten; keine private Rohantwort in öffentliche Tests/Artefakte übernehmen.
2. Aktuell akzeptierte History/own-wallet und vollständigen Kraken-/Ledger-Gegenbeleg qualifizieren. Fehlende akzeptierte History nicht durch Diagnosefixture ersetzen; nötigenfalls begrenzte explizite Teilhistory im bestehenden Historypfad, keine erfundene Gesamtdeckung/Eröffnung.
3. Kraken-Hauptbetrag und eigene separate Börsengebühr einmal abbuchen; bereits gezählten eigenen Eingang unverändert lassen. Gas bleibt beim Transaktionssender, nie zusätzlicher Empfängerabgang/Ertrag/Kauf. Ganze Quellgruppe einschließlich dauerhafter Wiederimportsperre zurücknehmbar.
4. Synthetische Negativfälle für Finalitätsflags/Slot/Executionhash/Nummer/Zeit, veränderte Rohpayloads, Chain/Contract/Decimals/Locator, Reorg/fehlgeschlagene Ausführung, Walletscope/History/Quellgruppe/Baseline, Gebührzahler, CAS/Quota/post-put-Abbruch ergänzen. Vorhandene 15 Originalprüfungen,29 Explorer-Negativfälle und22 Capture-Negativfälle gezielt wiederverwenden; kein Gesamt-PASS daraus ableiten.
5. Vorschau → expliziter atomarer Commit → Reload/Offline/Replay → frisches verschlüsseltes v5-UI-Restore → persistente Gruppenrücknahme in Chromium/Firefox/WebKit und320–430px. Danach reguläre eingefrorene Pflicht-CI/Main/Deploy/Live; erst dann LINK-Produktfreigabe. Kein pauschales UH03/ERC20/UH04/UH05 DONE.

## Privater Wiedereinstieg

Sicherung libfile_42e6c0236610819189e0ba522c74ecfd, zuletzt Version18 mit214Hashes. `delta-d9ff57914dab/beacon-chainsafe/` enthält Blockantwort/Capture/Headers/Qualifikation, `beacon-chainsafe-discovery/` den Mainnet-Genesisbeleg, `beacon-discovery/slot-local.json` die lokale Slotableitung. Blockscout-Ausführungsbelege und15Prüfungen unter `delta-f5b53dbf4bae/blockscout-authorized/`. Vor Verwendung Archividentität und alle Hashes prüfen; aktuellste Version dem Checkpoint entnehmen. Keine privaten Kennungen oder Rohpayloads veröffentlichen.

Solange die laufende Flatex-Integration nicht regulär abgeschlossen ist, keine zweite Produktimplementierung/PR/CI starten. Belege sind nun vollständig verfügbar, die Implementierung bleibt der nächste serielle Schnitt.
