# UH03 – erster wirtschaftlicher Kraken-Schnitt

Status: Integrationskandidat, **UH03 insgesamt offen**, keine Produktionsabnahme.

Nutzerziel: native Kraken-Ledgergruppen nach bestätigter Kontozuordnung und exaktem Saldenabgleich mit einer Bestätigung tatsächlich im vorhandenen Buchungsjournal übernehmen. Keine zweite Finanzengine. Der gemeinsame Importplan bleibt maßgeblich; danach UH04 → UH05.

## Begrenzter Umfang

- Vollständige Referenzgruppen statt angenommener Zweizeilen-Trades; separate Gebührenbeine in ihrem Asset erhalten. Exakte wiederholte Ledger-IDs als zusätzliche Dateivorkommen behalten, abweichende Originalfelder als Konflikt sperren.
- EUR-Handel, belegte zweiassetige Swaps, gleiche Hauptbetragtransfers, explizite Rewards und ausdrücklich als extern bestätigte Ein-/Ausgänge über `executeTransaction`. Keine Wallet-/Chain-Zuordnung aus Beträgen, Tickern oder Zeitnähe.
- Aktueller Bestand muss dem Quellsaldo vor der ersten neuen Gruppe entsprechen. Vorhandene zeitlich passende Anfangsbestände müssen ausdrücklich bestätigt werden; heutige Endbestände werden nicht historisch aufaddiert. Bestätigte Kostenbasis/Ergebnisse und fremde/manuelle Buchungen bleiben geschützt.
- Native Ausführungssummen bleiben exakt, auch wenn der daraus angezeigte Stückpreis eine nicht endliche Dezimalzahl ist. Unbewertete Kryptogebühren sind echte Mengenabgänge mit unbekanntem EUR-Wert, keine Null-Euro-Ausgabe. Fehlende Steuerinformationen bleiben unbekannt.
- Vollständige Auswahl oder ausdrücklich gewählte, erneut saldengeprüfte Teilmenge; kein stiller Teilcommit. Vorschau schreibt nichts. Bestehender IDB-/CAS-Commit, Sitzung-Undo, Reload, Wiederimport, verschlüsselter Restore und v5 bleiben erhalten.
- Bitpanda: eng begrenzte Korrektur der tatsächlich vorhandenen Schreibweisen `transfer(stake)` / `transfer(unstake)` einschließlich fehlendem Tax-Feld. **Noch keine Bitpanda-Buchungsfreigabe.**

## Abnahmekriterien und Ergebnis

1. Synthetischer EUR-Handel mit zusätzlichem BTC-Gebührenbein: exakte Fiat-/Asset-/Gebührenmengen, kein zusätzlicher externer Kapitalfluss; ursprüngliches Modell unverändert bis Bestätigung.
2. Starke Quellenidentitäten, wiederholte/überlappende Dateien, geänderte Quelle, manuelle Korrektur, unvollständige Gruppe und veraltete Baseline: keine stille Doppelbuchung.
3. Tatsächlicher gemeinsamer CSV-Dialog → ein CAS-Commit → Reload/Wiederimport → vollständige Sitzung-Rücknahme → verschlüsselter Restore → Offline-PWA-Neustart; bereits vorhandenes geschütztes v5 erhalten.
4. 320/360/390/412/430/768/1440 px ohne Dialogüberlauf und Axe ohne Verstöße; Quota- und Mehrtab-Konflikt lassen gespeicherte Daten unverändert.
5. Private Originalgruppen gegen unabhängigen Python-Decimal-Oracle abgeglichen. Kein vollständiger Original-Historien-/Cross-Chain-/Gesamt-UH03-Nachweis daraus abgeleitet.

Lokale Nachweise: siehe [Vorprüfung](release-evidence/v268-uh03-kraken-preflight.json). Finale gehostete Chromium-/Firefox-/WebKit-, Integrations-, Main- und echte Produktionsprüfungen sind Pflicht vor LIVE_ACCEPTED. Bestehende CI-Baselines bleiben unverändert; zusätzliche Kraken-Kommandos sind exakt einmal je Pflichtpfad verankert, mit Negativkontrollen für Entfernung/Dopplung/Engineabbau.

## Verbindlich offen

Vollständiger Bitpanda-Wirtschaftsimport; historische Kraken-Endbestandsrekonstruktion; unbekannte/mehrdeutige Sondergruppen und Ausführungsreihenfolgen; kombinierte BTC-/ETH/ERC20-/SOL/SPL-Gegenbelege einschließlich nativer Locators, Gas-/Börsengebührenabgrenzung und quellenübergreifender Reihenfolgeunabhängigkeit; persistente selektive Quellen-/Buchungsrücknahme über die bestehende Sitzung-Rücknahme hinaus. Keine UH03-Fertigmeldung und kein Vorziehen von UH04/UH05. Android-Hardwareabnahme nicht behauptet.
