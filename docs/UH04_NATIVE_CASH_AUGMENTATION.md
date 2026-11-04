# UH04 – Nettocash zur bestehenden nativen Stückhistorie ergänzen

Im eigenen Ergänzungsmodus kann ein vollständig ausgewählter Stapel unveränderter nativer EUR-Depot12-Käufe und -Verkäufe um die eindeutigen Konto10-Originale ergänzt werden. Die bereits gebuchten Stückwirkungen bleiben bytegleich. Nur belegter Nettocash kommt hinzu; die Brutto/Nettodifferenz bleibt ungeklärte Verrechnung. Gebühren, Steuern, Kosten und Ergebnis bleiben unbekannt. Kein externer Kapitalfluss.

Beide eigenen Kontozuordnungen, alle betroffenen Stückbuchungen und ein belegter Cashanfang vor dem Stapel werden ausdrücklich bestätigt. Für jedes berührte Wertpapier muss die vollständig ausgewählte native Historie zum unveränderten aktuellen Bestand mit dem unveränderten ursprünglichen Anfangsbestand passen. Ein nichtleerer Wertpapieranfang braucht ein bereits gespeichertes Belegdatum spätestens am bestätigten Cashanfang. Andere Buchungen/Journale, Referenzstände, Wallets, geschützte Kosten, veränderte Quellen, fehlende Anfangsbelege oder nur teilweise ausgewählte Historien sperren den Stapel. Ein positiver Endcash darf einen zwischenzeitlich negativen Cashstand nicht verdecken: geprüft wird nach Datum und ursprünglicher Journalsequenz. Keine heutigen Endsalden als historische Anfangsbestände ableiten.

## Alt-/Neu-Vertrag

Jede Buchung behält ihren bestehenden netAugmentation-Audit Version1 mit vollständiger ursprünglicher Buchung und Journal. Importidentität, IDs, Journalzeit und Sequenz bleiben erhalten. Der Assetposting bleibt bytegleich; Clearing wird durch belegten Cash und eine ungeklärte Gegenposition ersetzt. Der neue Quellpayload bindet den Audit per SHA256, die Herkunftsprüfung bindet Buchung einschließlich Audit und Journal. Keine Änderung der gespeicherten Auditversion oder des v5-Schemas.

Der CSV-Commit leitet den gesamten erlaubten Modellunterschied aus der aktuellen Baseline neu ab. Einzelfälle behalten ihren bestehenden Übergangsmarker Version1; ein Stapel verwendet einen flüchtigen Marker Version2 mit eindeutigen sortierten Gruppenkennungen. Dieser Marker ist kein gespeichertes Finanzschema. Anzahl und Gesamtdelta werden unabhängig kontrolliert. Gewöhnliche CSV-/Stück-/Paarimporte erhalten keine Änderungsberechtigung.

Rücknahme betrifft jede vollständige Wirtschaftsgruppe einschließlich Stück- und Cashwirkung. Abhängige spätere Gruppen müssen mit zurückgenommen werden; ursprüngliche und neue Quellen bleiben gegen Wiederimport gesperrt. Keine separate Rücknahme nur der Cashergänzung und keine automatische Wiederherstellung alter Quellenautorität.

## Abnahme

1. Unabhängiger CSV-/Decimal-Oracle und kontrollierte Originalhistorie: keine zweite Stückwirkung, exakter Cashdelta, alte Belege bytegleich, unbekannte Kosten und keine externen Flüsse.
2. Teilstapel, manipulierte Vorschauen/IDs/Anzahlen/Audits, Quellenkonflikte, Referenzen, Kosten, Abhängigkeiten und zwischenzeitliches Cashdefizit ohne Teilwirkung abweisen.
3. Tatsächlicher Dialog, Backup/Zustimmung, ein CAS-Commit, Quota/post-put-Abbruch, echter Zweittab-CAS, Offline/Reload/Wiederimport.
4. Frisches verschlüsseltes v5-UI-Restore und Gruppenrücknahme mit dauerhaftem Wiederimportsperrschutz; sieben Breiten und Axe.
5. Unveränderte Pflicht-CI/Main-/Deployment-/Produktionsgates in drei Engines und reguläre HTTPS-Assetidentität vor Freigabe.

UH04 bleibt für weitere Dialekte, FX, N:M-/Sonderereignisse und historische Endbelege partiell. LINK bleibt gesperrt.
