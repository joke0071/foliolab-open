# UH04 – ausdrückliche Cashergänzung zu einem nativen Kauf

Ein unveränderter einzelner nativer EUR-Depot12-Kauf kann im eigenen Modus „Bestehenden Stückkauf um Nettocash ergänzen“ mit seinem eindeutigen Konto10-Original ergänzt werden. Die bereits verbuchte Stückmenge wirkt genau einmal. Nur der originale Nettocash kommt hinzu; Brutto/Nettodifferenz bleibt ungeklärte Verrechnung, Gebühren, Steuern, Kosten und Ergebnis bleiben unbekannt. Kein externer Kapitalfluss.

Beide eigenen Kontozuordnungen, genau ein Paar und ein belegter Cashanfang vor dem Kauf müssen ausdrücklich bestätigt werden. Andere betroffene Buchungen/Journale, Referenzstände, Wallets, geschützte Kosten, veränderte Quellen, fehlende oder widersprüchliche Anfangsbestände und Verkäufe bleiben gesperrt. Gewöhnlicher Stück- oder Paarwiederimport erhält keine Änderungsberechtigung.

## Enger Alt-/Neu-Vertrag

`netAugmentation` enthält Version1 und vollständige ursprüngliche Buchung und Journal. Der Importkern validiert diese als unveränderten nativen reinen Kauf ohne Cashwirkung. Nur der eigene Ergänzungsplan darf die bestehenden IDs, Journalzeit und Sequenz weiterverwenden: der Assetposting bleibt bytegleich, das Clearing wird durch den belegten Cashposting und eine ungeklärte Gegenposition ersetzt. Das Original bleibt vollständig im Audit erhalten. Der neue Quellpayload bindet dieses Audit per SHA256, die bestehende Herkunftsprüfung bindet die neue Buchung einschließlich Audit und Journal.

Der CSV-Commit leitet für diesen ausdrücklich markierten Plan den gesamten erlaubten Modellunterschied erneut aus der aktuellen Baseline ab. Keine allgemeine Aufweichung von CSV-, importierten Änderungs- oder Managementauditguards. Die bestehende v5-Validierung prüft Alt-/Neu-Beziehung auch in Backup, Restore, aktiver Gruppe und dauerhafter Gruppenrücknahme. Kein neuer Finanzkern und keine Schema-Versionserhöhung.

Rücknahme betrifft ausdrücklich die ganze Wirtschaftsgruppe: Stückkauf und Cashwirkung werden zurückgenommen, sämtliche alten und neuen Quellen bleiben im vorhandenen Rücknahmebeleg gegen Wiederimport gesperrt. Es gibt keine separate Rücknahme nur der Ergänzung und keine automatische Wiederherstellung alter Quellenautorität.

## Abnahme

1. Unabhängiger vorhandener CSV-/Decimal-Oracle und kontrollierter Originalkauf: keine zweite Stückwirkung, exakter Cashdelta, vollständige alte Belege, unbekannte Kosten, keine externen Flüsse.
2. Manipulierte Vorschauen, Payloads, Bankreferenzen, Richtungen, Zustimmungen, Bindungen, Kosten, Abhängigkeiten und Referenzen ohne Teilwirkung abweisen.
3. Tatsächlicher Dialog einschließlich Backup/Zustimmung, genau einer CAS-Revision, Quota/post-put-Abbruch, echter Zweittabkonkurrenz, Offline/Reload und Wiederimport.
4. Frisches Profil mit verschlüsseltem v5-UI-Restore und vollständiger Gruppenrücknahme samt dauerhaftem Wiederimportsperrschutz; mobile Ansichten und Axe.
5. Unveränderte Pflicht-CI/Main-/Deployment-/Livegates in drei Engines und reguläre HTTPS-Assetidentität vor Produktfreigabe. Lokale Tests allein sind kein Releasebeleg.

UH04 bleibt für weitere Dialekte, Mehrbeine, Verkäufe, FX, Sonderereignisse und historische Endbelege partiell. LINK wird durch dieses Paket nicht freigegeben.
