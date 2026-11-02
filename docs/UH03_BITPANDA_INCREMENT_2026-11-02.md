# UH03 – begrenzter wirtschaftlicher Bitpanda-Schnitt

Status: lokal geprüft, noch kein Release/LIVE_ACCEPTED. UH03 insgesamt bleibt offen.

Ziel: bereits erkannte native Bitpanda-CSV nach ausdrücklich bestätigter Quellprodukt-/Kontozuordnung, tatsächlicher Kontobewegung, Gebührenkonvention und unabhängig belegten Endbeständen atomar im bestehenden Journal übernehmen. Bestehender WIP f93f166 wird fortgesetzt; keine zweite Finanzengine. Datenformat v5 und Installationsidentität unverändert.

## Freigabegrenze

EUR-Kryptokäufe und -verkäufe, explizite Rewards und ausdrücklich externe Ein-/Ausgänge. Der CSV-Marktpreis wird nie zum Ausführungsbetrag erklärt. Die Richtung bezieht sich beim Handel auf das Fiatbein. Ausgewiesene Gebühren benötigen je Vorgang die Bestätigung „enthalten“ oder „zusätzlich“. Fehlende Gebühren und Steuern bleiben unbekannt. Nichtnull-Steuern, andere Gebührenassets, Staking-Hauptbeträge und nicht geklärte interne Gegenbereiche bleiben gesperrt.

Bitpanda liefert in diesem Export keine laufenden Salden. Anfangsbestände und Endbestände müssen deshalb gesondert geprüft sein. Das Programm vergleicht die eingegebenen Kontrollmengen exakt, kann ihre unabhängige Herkunft aber nicht selbst bestätigen. Aus derselben Mengenannahme berechnete Testwerte sind keine unabhängigen Endbestandsbelege. Kostenbasis und realisierte Ergebnisse bleiben unbekannt; bestehende bestätigte Werte und fremde Buchungen werden geschützt. Keine Gesamtfreigabe der privaten Bitpanda-Historie aus isolierten Beispielen ableiten.

## Entscheidung und Speicherung

Die Vorschau zeigt die tatsächliche Mengen-/EUR-Kontowirkung vor und nach den gewählten neuen Vorgängen. Ein unbekannter oder widersprüchlicher ausgewählter Vorgang oder ein unpassender Endbestand blockiert den gesamten Commit. Eine Teilmenge verlangt ausdrückliche Auswahl und Bestätigung der offenbleibenden Restvorgänge. Alle betroffenen Endbestände werden erneut geprüft. Ein Unterschied von 10^-18 wird nicht weggerundet.

Starke Quell-ID, Quellfeldhash, bestätigte Bindings, Gebührenentscheidung und Buchungseigentum schützen Wiederimport und Nutzerkorrekturen. Der gemeinsame CSV-Dialog führt genau einen vorhandenen IDB-/CAS-Commit aus. Quelle allein, Simulation und Paginierung schreiben nichts. Reload, Wiederimport, Sitzungs-Undo, verschlüsseltes Restore, Quota, Mehrtabkonflikt und Offline-PWA-Neustart bleiben Pflicht.

## Lokale Prüfung

- 1.117 Units ohne Fehler oder Skips; Syntax/Diffcheck PASS.
- Chromium 153 mit Playwright 1.56.1: tatsächlicher gemeinsamer Importdialog, 75-zeilige paginierte Auswahl mit erhaltener Abwahl, reine Vorschau, exakte Bestandswirkung, ein CAS-Commit, bestehendes geschütztes v5, Reload/Wiederimport, exaktes Sitzungs-Undo, verschlüsseltes Restore, Quota/stale CAS und Offline-PWA-Neustart PASS.
- Sieben Breiten 320/360/390/412/430/768/1440 ohne Dialogüberlauf; Axe ohne Verstöße. Synthetische mobile Ansicht geprüft.
- Wiedergefundene unveränderte Originaldatei gegen gespeicherte Originalprojektion feldgenau abgeglichen. Unabhängiger Python-Decimal-Oracle prüft die Rechnung unter ausdrücklich vorgegebenen Gebührenkonventionen, Restore/Wiederimport und falsche Kontrollbestände. Diese erzeugten Test-Endbestände sind **keine** unabhängigen historischen Kontostände; keine vollständige wirtschaftliche Originalabnahme behauptet.
- Neue Browserkette in Chromium, beiden Cross-Engines und beiden Produktionspfaden verpflichtend ergänzt. Historische CI-Hashes und Manifeste bleiben unverändert; Entfernung, Dopplung und Engineabbau der Ergänzung werden durch Negativkontrollen abgelehnt.

Finale gehostete CI, Firefox/WebKit und tatsächliche Produktionsprüfung stehen noch aus. Vor LIVE_ACCEPTED sämtliche bestehenden Integrations-/Releasegates erhalten und den ausgelieferten Stand prüfen.

## Nächste Schritte

UH03 bleibt offen: unabhängig belegter vollständiger Bitpanda-Historien-/Endbestandsabgleich, historischer Kraken-Endbestandsabgleich, kombinierte BTC-/ETH/ERC20-/SOL/SPL-Gegenbelege mit nativen Locators, Gas-/Börsengebührenabgrenzung und quellenübergreifender Reihenfolgeunabhängigkeit; persistente selektive Quellen-/Buchungsrücknahme. Danach UH04 → UH05 gemäß gemeinsamem Importplan. Android-Hardwareprüfung gesondert offen.
