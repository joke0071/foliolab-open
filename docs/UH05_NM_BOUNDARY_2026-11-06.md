# UH05 – N:M- und Teilfüllungsgrenzen nach v288

Basis: v288 LIVE_ACCEPTED, Main `cef91b3a8b2baa0c9598178a4fa486877283df45`, Tree `6951d60948282c5aa2d9c9f8144a6bb5d5acfefd`. Keine neue Produktimplementierung, kein Kandidat/PR, keine CI oder erneute v287-/v288-Abnahme.

## Tatsächlich reproduziert

18 reine Kernfälle über bestehende Parser, Ordergruppen und `inspectFlatexNetPairs`, jeweils ursprüngliche und umgekehrte Dokumentreihenfolge. Alle Quellvorkommen bleiben erhalten, Eingangsdokumente unverändert. Synthetische Quellen, keine private Original-N:M-Abnahme und keine neue UI-/Produktionsabnahme.

| Quellgruppe | Bestehende Grenze | Netto-Paare |
| --- | --- | --- |
| 1 Ausführung / 1 EUR-Cashbein | `possible-single` | 1 |
| 1 Ausführung / 2 Cashbeine | `multiple-cash-review` | 0 |
| 2 Ausführungen / 1 Cashbein | `multiple-depot-review` | 0 |
| 2 Ausführungen / 2 Cashbeine | `multiple-depot-review` | 0 |
| Betragsgleiche, eigenständig referenzierte Teilfüllungen | `multiple-depot-review`; keine Deduplizierung verschiedener Ausführungen | 0 |
| N:M mit durchgehend USD | Ordergruppe bleibt Review; kein EUR-Nettopfad | 0 |
| USD-Ausführungen / EUR-Cashbeine | `source-review`; keine Kursableitung | 0 |
| Identischer wiederholter Export | dokumentarischer Overlap; bestehende exakte Identitäts-/Payload-Deduplizierung | 1 |
| Gleiche Bankidentität, geänderte Quellpayload | `conflict` | 0 |

Unabhängige kleine Integerkontrolle: 1+2=3 Stück, Kurs 10 EUR, Brutto 30 EUR; Cashbeine -11 und -21 EUR, Summe -32 EUR; Differenz -2 EUR bleibt ungeklärt. Daraus keine Gebühren, Steuern, Wechselkurse oder Kostenbasen je Teilfüllung ableiten. Diese Kontrolle ist keine Freigabe einer Summen- oder Verteilungsengine.

Ausführen auf exaktem Main von der Repositorywurzel: `node docs/repros/UH05_NM_BOUNDARY_2026-11-06.mjs`. Der Repro schreibt seinen synthetischen JSON-Bericht neben sich. Der gesicherte Bericht steht unter `docs/release-evidence/uh05-nm-boundary-2026-11-06.json`.

## Nächster enger Fachschnitt

1. Bestehende Quellidentitäts-, Ordergruppen-, Betrag-, CSV-, Transaktions- und Journalkerne erweitern; keine zweite Engine. Zuerst belegte gleichwährungsfähige EUR-Ordergruppe mit mehreren eigenständigen Ausführungsreferenzen und einem Cashbeleg fachlich modellieren. 2:1 ist der engere Einstieg, nicht pauschal beliebiges N:M freigeben.
2. Vollständige Mitgliedermenge ausdrücklich binden: Quelle/Konto/Depot, Order, ISIN, Richtung, Buchtag/Valuta, eindeutige Bankidentitäten und unveränderte Payloads. Wiederholter Export ist ein Vorkommen, keine zusätzliche Teilfüllung. Widerspruch, Storno, Eigentums-/Chronologielücke oder fehlendes Gegenbein sperrt die vollständige Gruppe. Bestehende 1:1-Guards nicht pauschal lockern.
3. Jede Ausführung und ihre Bestandseffekte genau einmal erhalten; gemeinsames Cash genau einmal. Ungeklärte Gruppendifferenz getrennt und unbekannt lassen. Keine proportionale Kosten-/Gebühren-/Steueraufteilung ohne unabhängigen Beleg. Referenzen und bestehende Journale einschließlich IDs/Sequenzen/Zeitstempeln unverändert schützen. Anfangsbestände nicht rückwärts erfinden.
4. Ein unabhängiger Integer-/Decimal-Gruppenoracle muss neue und bereits importierte Teilmengen, gleiche Mengen verschiedener IDs, Exportüberlappung, Replay, Restore, vorhandene Referenzstände und Rücknahme prüfen. Gemeinsame UI muss gesamte Gruppe, offene Restbeine, Freigabereset, Backup, einen CAS, Quota/post-put, echten Zweittab, exaktes Undo und Offline/Fresh-Restore tragen. Keine Preview-only-Endstation als fertigen Import deklarieren.
5. FX anschließend als eigener belegter Wirtschaftsvorgang: deklarierte Quellwährungen und reale historische FX-/EUR-Settlementbelege. Bestehender generischer FIN-E2E01-USD-Teilfüllungs-/FX-PASS beweist keine native Flatex-N:M-Unterstützung.
6. Wallet-/Staking- und historische Referenzlücken bleiben PARTIAL/UNKNOWN. Fehlende Ledger-Live-Anzeige niemals als Nullbestand oder Vollständigkeitsnachweis deuten. Bereits gesicherte Originale und Oracles wiederverwenden; keine unnötigen Chainabfragen/Originalanforderungen.

Die Exporterherkunft eines synthetischen 12/10-Fixtures ist kein Originalnachweis. Die Nutzervermutung zu extraETF versus direktem Flatex-Export nicht ohne tatsächliche Header-/Quellenbelege als geklärt ausgeben. Formate technisch unterscheiden, Provenienz gesondert belegen.

## Unveränderte Folgeaufträge

UI-REFRESH01 #300 bleibt offen und nach UH04/UH05 priorisiert. Issue und alle zehn aktuellen Kommentare frisch gelesen: einschließlich appweiter Outline-Iconvertrag, redundanter Miniüberschriften und optionalem Kleinstbestands-Anzeigefilter. QUALITY298, CI229, Android-Performance und übrige Produktaufgaben bleiben erhalten. Keine UI-Umsetzung in diesem Schnitt. EFF01/HND01, sämtliche Finanz-/v5-/Quellen-/Journal-/IDB-/CAS-/Backup-/Restore-/Offline-/Datenschutzverträge gelten. GitHub ausschließlich Plugin; Checkpointbranch niemals vollständig nach Main.
