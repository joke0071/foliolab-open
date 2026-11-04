# UH03 LINK – konkret fehlende Originalbelege und vorbereiteter lokaler Abruf

Stand 04.11.2026, Owner 8e88691c253e. v279 bleibt LIVE_ACCEPTED; keine Wiederabnahme. Keine LINK-Produktfreigabe.

## A. RPC-Zugang

Die vorhandenen LlamaRPC-/dRPC-Transportbelege bleiben unverändert: kennungsfreie chainId-POSTs scheiterten mit HTTP405/HTML beziehungsweise HTTP403/Cloudflare1010. In dieser Fortsetzung wurden diese identischen Requests nicht wiederholt. Die Statuscodes beweisen weder eine fehlende Transaktion noch ein fehlendes Receipt.

Blockscout dokumentiert instanzbezogene POSTs an `/api/eth-rpc`, einschließlich `eth_chainId`, `eth_getTransactionReceipt` und Blockmethoden: https://docs.blockscout.com/devs/apis/rpc/eth-rpc . Unterstützung der konkreten Instanz darf daraus nicht abgeleitet werden. Ein neuer kennungsfreier POST an die bereits verwendete Ethereum-Instanz wurde mit tatsächlicher Anfrage, UTC-Zeit, Headern und Rohbody privat gesichert: HTTP403/Cloudflare1010; keine Weiterleitung verfolgt. Keine private Kennung gesendet. Eine ausdrückliche Freigabe für neue kennungsbezogene Blockscout-Endpunkte ist nicht belegt; vorhandene Explorerdateien ersetzen sie nicht. Kein neuer Anbieter, Schlüssel, Bezahldienst oder Zugriffsbypass.

## B. Finalität und kanonischer Block

Die private Sicherung Version10 einschließlich aller119 Hashes wurde bestätigt. Der gespeicherte höhere Head ist eine echte Rohantwort, aber seine erhaltene Zusammenfassung nennt lediglich `eth_getBlockByNumber`, ohne tatsächlich erfasste Parameter `["finalized",false]`. Die frühere Oracle-Bezeichnung „finalized head“ allein schließt diese Herkunftslücke nicht. Es wurde kein Header erfunden oder nachträglich als Original erzeugt.

Konkret fehlen ein erfasstes brauchbares Original-Receipt und ein tatsächlich als finalized erhobener Anker mit konsistentem kanonischem Transaktionsblock. Ein später erhobener Anker ist zulässig. Der vorbereitete lokale Ablauf sichert pro freigegebenem Anbieter chainId, Original-Receipt, finalized-Tag, vorhandene Transaktion, historischen Block inklusive Index/Inklusion, Anker nochmals nach Nummer, historischen Block nochmals, zweiten finalized-Tag und abschließende chainId. Derselbe Provider muss die Originaldaten widerspruchsfrei bestätigen; ein bloß höherer Head oder Bestätigungszähler genügt nicht. Normale TLS-Prüfung, keine Redirects, keine Retries, höchstens9 lesende Requests pro erreichbarem Anbieter. Bei falscher Chain geht keine private Kennung hinaus. Wenn das Receipt null bleibt, kann der tatsächlich gesicherte Finalitätsbeleg separat erhalten bleiben.

## C. Produktbindung bleibt offen

Der bestehende native Ethereum-Vertrag verlangt providerbelegte erfolgreiche Ausführung, kanonische Inklusion und Finalitätsanker, exakten akzeptierten Historyevent sowie aktuelle eigene Wallet, Quellgruppe und Baseline. Er authentifiziert weder Konsens noch Receipt-Root eigenständig. Diese zusätzlichen kryptografischen Nachweise werden deshalb nicht pauschal als neue Pflichtblocker eingeführt. Historisches eth_call wird nicht aus der statischen, ausdrücklich begrenzten LINK-Metadateninterpretation nachträglich verlangt. Eine teilweise Gesamt-History darf den exakt nachgewiesenen Event nicht automatisch entwerten; konkrete Reorg-/Konflikt-/Finalitätsfehler bleiben Sperren.

Die ERC20-Produktbindung ist weiterhin nicht implementiert. Sie braucht den genauen Contract und nativen Loglocator, Rohmenge, Empfängerwallet, aktuelle akzeptierte History, Kraken-Quellgruppe, Baseline und unveränderliche Rohpayload-Hashes. Börsengebühr und Sendergas bleiben getrennt; kein zweiter Empfängereintrag. Ein alternatives Explorerformat bleibt ein ausdrücklich eigener Belegtyp mit Herkunft/Grenzen und benötigt dieselben fachlichen Invarianten sowie vollständige Produktabnahme. Kein zusammengesetztes RPC-Receipt und keine Freigabe nur durch die bestehenden29 Negativkontrollen.

## Kleinste externe Aktion und Fortsetzung

Privates Paket **FolioLab_LINK_Belege_Lokal.zip** enthält einen vollständigen Python3-Standardbibliotheksablauf mit eingesetzten vorhandenen Kennungen und Anleitung. Nur die ausdrücklich freigegebenen Ziele `https://eth.llamarpc.com` und `https://eth.drpc.org`; Rohantworten/Parameter/Header/UTC-Zeiten/SHA256 bleiben lokal in einer geprüften Ergebnis-ZIP. Einmal lokal ausführen und die Ergebnis-ZIP im laufenden privaten Chat bereitstellen. Keine erneute Original-, Adress- oder Kennungsanforderung.

Offline geprüft: synthetische positive Belegkette,22 Finalitäts-/Receipt-Negativfälle, falsche Chain ohne Hashversand, Receiptfehler bei separat erfolgreicher Finalität, Endpunkt-/Methodensperre und JSON-Dubletten. Das ist eine Prüfung des Abrufablaufs, kein Original-/Produkt-/Releasebeleg.

Status **WAITING_FOR_EXTERNAL_CAPTURE** nur für diese LINK-Verknüpfung. Danach echte Payloads unabhängig qualifizieren, den begrenzten Produktpfad im vorhandenen Kern schließen und Vorschau/atomare Übernahme/Reload/Replay/Rücknahme/verschlüsseltes Restore/CAS/Abbruch/Dubletten sowie Pflicht-CI/Live prüfen. Unabhängige sichere UH04-Arbeit wird weitergeführt: PR295, HEAD2ba3604a891df5e46162a84559190831fff2554d, bestehende Pflicht-CI41824535130; noch kein v280-Livebeleg.
