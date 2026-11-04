# UH04 – vorhandenes natives Stückbein sicher um belegtes Nettocash ergänzen

Vorbereitung während des unveränderten v280-Mainlaufs; **noch keine Implementierung, kein neuer Produktstrang und keine Freigabe**. v280 erst vollständig produktiv abnehmen. [Bisheriger Paarvertrag auf Main](UH04_NET_SETTLEMENT.md), [Original-Aufgabenkarte](UH04_NET_SETTLEMENT_TASKCARD_2026-11-04.md).

## Nutzerziel und kleinster Umfang

Eine bereits über den nativen Stückpfad übernommene, unveränderte Depot12-Kaufbuchung soll mit ihrem eindeutigen originalen Konto10-Bein zu einer vollständigen EUR-Wirtschaftsgruppe ergänzt werden: dieselbe Stückwirkung genau einmal, ausschließlich der belegte zusätzliche Nettocash, Kosten/Steuern weiterhin unbekannt. Kein weiterer Vorschauparser. Zunächst genau ein einfacher Kauf ohne weitere abhängige Vorgänge; keine Verkäufe, FX, Depot13/Konto8 oder N:M bündeln.

Ein vorhandener Original-Kauf wurde privat über den bestehenden Stückimport in einem ausdrücklich kontrollierten Modell bis verschlüsselungsfähigem v5-Restore reproduziert. Quellenbeleg unverändert; dieselben Originalbeine werden anschließend erwartungsgemäß vom derzeitigen Ergänzungs-Guard abgewiesen. Private Repro/Sollwertlocator: delta-8e88691c253e/qualify-single-leg-readiness.mjs und single-leg-readiness.json. Das ist keine Aussage über den aktuellen Nutzerbestand, keine Produktabnahme und keine neue historische Saldenfreigabe.

## Vor der Implementierung festzulegender gemeinsamer Vertrag

- Nur exakt dieselbe bestehende native Depotidentität samt Bankreferenz und vollständigem Payload. Aktuelle getrennte eigene Depot-/Kontozuordnung beim selben Anbieter, gleiches EUR-Wertpapier, Buch-/Valutadatum und eindeutige 1:1-Order. Keine fremden/manuell veränderten/importgemischten Belege; Gebühren-/Steuer-/Kosten- oder Transferangaben bleiben geschützt.
- Keine zweite Wertpapierbuchung und keine neue Stückwirkung. Bestehende Buchungs-/Journalidentität sowie alte Originale müssen dauerhaft nachvollziehbar erhalten werden. Aktuell erlauben `previewCSV/importCSV` nur eng begrenzte Belegerweiterungen; `booking-management-audit` erlaubt importierte Belege nur im bereits bewiesenen EUR-Cash-Rücknahmefall. **Diese Guards nicht allgemein lockern.** Eine eigene streng validierte Ergänzungs-/Audittransition im vorhandenen Transaktions-/Quellenkern einschließlich exakter Alt-/Neu-Bindung vorab spezifizieren. Kein bloßes Überschreiben oder zweiter Finanzkern.
- Exakter Nettocash und ungeklärte Verrechnung gemäß bestehendem Paarvertrag, keine Gebühren-/Steuerannahme, keine bekannte Kostenbasis oder externer Kapitalfluss. Bestehende Stückmenge unverändert; gesamten Journal-/Bestandsabgleich prüfen. Ein heutiger Cashendbestand ist kein historischer Anfangsbestand: datierten belegten Cashanfang vor dem Vorgang ausdrücklich bestätigen und unverändert sichern; sonst sperren.
- Andere/spätere abhängige Buchungen und betroffene Referenzstände bleiben Sperren. Aktuelle Baseline, eigener Kontosnapshot, Auswahlgeneration und SHA-/Quellenidentität bestimmen die Zustimmung. Geänderte Quellen oder veraltete Zustimmung benötigen neuen Plan.
- Alte und neue Quellen/Audit müssen im bestehenden v5-Backup-/Restore-/Rücknahmepfad streng validiert werden. Die vollständig gebildete Wirtschaftsgruppe erhält dauerhaften Rücknahme-/Wiederimportsperrschutz. Rücknahme der gesamten Wirtschaftsgruppe ausdrücklich von einer etwaigen bloßen Rücknahme der Ergänzung unterscheiden; keine unbewiesene Wiederherstellung alter Quellenautorität.

## Fünf Abnahmekriterien / sicherer Releasepunkt

1. Originalfall mit unabhängigem bestehendem CSV-/Decimal-Oracle: unveränderte Stückmenge und alte Quellen-/Journalbelege, belegter Cashdelta exakt einmal, unbekannte Kosten, kein externer Kapitalfluss. Kontrollierte Eröffnungen klar kennzeichnen.
2. Falscher Payload/Bank-TA/Order/Wallet- oder Kontobezug, manuelle Änderung, bekannte Kosten, Mehrbeine, Referenzen, fehlender Cashanfang und Abhängigkeiten sperren ohne Teilwirkung.
3. Tatsächlicher vorhandener Dialog: ausdrückliche Ergänzungsvorschau → Backup/Zustimmung → ein atomarer Commit → Reload/Offline/Wiederimport → vollständige Gruppenrücknahme und dauerhafte Wiederimportsperre. Keine stille Auto-Ergänzung durch gewöhnlichen Wiederimport.
4. Verschlüsseltes v5-Restore im frischen Profil samt streng validiertem Alt-/Neu-Audit, Quota/post-put-Abbruch/echter Zweittab-CAS und Quellen-/Modellwechsel prüfen.
5. Ein eingefrorener enger Kandidat, unveränderte Pflicht-CI/Main-/Deployment-/Produktionsgates in drei Engines, mobile Ansichten und reguläre HTTPS-Assetidentität. Erst danach diesen Fall freigeben; UH04 bleibt für weitere Dialekte/Mehrbeine/Sonderereignisse/historische Endbelege partiell.

Danach nächste belegbare UH04-Reste priorisieren und UH05 auf tatsächlich akzeptierte Import-/Dubletten-/Rücknahme-/Restoreverträge stützen. LINK bleibt unabhängig WAITING_FOR_EXTERNAL_CAPTURE; Ergebnis am konfliktfreien Integrationspunkt aufnehmen. Keine erneuten Originalanforderungen und keine Diagnoserotation als Produktabschluss.
