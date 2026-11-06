# UH05 – begrenzter 3:1-EUR-Vertrag vor Implementierung

Stand: v291 LIVE_ACCEPTED, Main `6b020461aec68b6281dbc00e32c953dc6cec14cb`, Tree `6cc86610f633d4e93665d7f53c40282144c9df28`. Nur synthetische Diagnose, Vertrag und unabhängiger Sollwertaufbau; **keine Produktimplementierung, kein 3:1-PASS, kein neuer PR/Release**.

## Ziel und konkrete Grenze

Drei eigenständig bankreferenzierte EUR-Ausführungen einer nativen Flatex-Order und genau ein belegter EUR-Cashbeleg werden gemeinsam geprüft, mit drei Assetwirkungen und genau einer Cashwirkung atomar übernommen und als vollständige Gruppe wiedererkannt. Der bestehende Version2-Beleg bleibt strikt zweigliedrig. Für genau drei Ausführungen einen eigenen **netSettlement Version3**-Beleg und Version3-Quellpayload definieren; keine beliebige-N-Freigabe und keine Änderung des allgemeinen CSV-Identitätsschlüssels. Bisherige v1/v2-Belege bleiben bytegleich lesbar.

Vollständige sortierte Mitgliedermenge: genau drei unterschiedliche native Bankidentitäten mit jeweiligem Payloaddigest und allen Originalvorkommen; dazu genau ein Konto-Cashbeleg. Bindung an native Quellkonten, bestätigte lokale Depot-/Kontozuordnung, Provider, Order, ISIN, Richtung, Buchtag und Valuta. Gleiche Mengen/Preise sind mit verschiedenen belegten Bankidentitäten zulässig. Gleiche Bankidentität mit geänderter Payload sperrt; wiederholter identischer Export ergänzt höchstens Belegvorkommen. Fehlendes Mitglied, vier Ausführungen, mehrere Cashbelege, FX, fremde Zuordnung und unklarer Quellenumfang bleiben gesperrt. V3-Gruppen-ID zusätzlich an Version und vollständige Mitgliedermenge binden; bestehende V2-IDs nicht verändern.

## Finanz-, Journal- und Persistenzinvarianten

- Vier Buchungen / vier Journale / neun Postings: je Ausführung Asset+Clearing, einmal Cash+Clearing+ungeklärte Gruppendifferenz. Keine externe Einzahlung/Entnahme für den internen Depot-/Cashvorgang.
- Menge, Einzelpreis und Brutto je Ausführung exakt aus Quelle; keine Durchschnittspreise. Gruppendifferenz `Cash + Richtung × Bruttosumme`; ausgeglichenes Gegenposting bleibt separat ungeklärt. Gebühren, Steuern, Kostenbasis und Gewinn bleiben unbekannt, auch bei Differenz0.
- Vollständige Quellen-/Mitglieder-/Payload-/Journal-/Sequenzprüfung bei jeder Modellvalidierung und Restore. Cashjournal zuletzt; kein verwaistes oder doppelt verwendetes Mitglied. Kein wirtschaftlicher Teiledit oder Teilrücknahme über bestehende Verwaltung.
- Fehlende oder unklare datierte Anfangsbestände, bestehende Referenzen, Kostenbasis und widersprüchliche/gleichdatierte Historie weiter sperren. Keine Rückrechnung eines historischen Anfangs aus heutigen Beständen. Alter v291-Leser muss V3 tatsächlich ablehnen.
- Gemeinsame Freigabe/Backup, genau eine kanonische CAS-Revision; Quota-/post-put-Abbruch und echter Zweittabkonflikt erhalten vollständige alte Bytes/Revision. Auswahl-/Zuordnungsänderungen widerrufen alle Freigaben. Vollständiges Sitzungs-Undo, Wiederimport beider Dateireihenfolgen, verschlüsseltes v5-Fresh-Restore und Offline-Reload in drei Engines nachweisen.

## Ausführbare unabhängige Grundlage

1. Historischen v289-Repro und Beleg unverändert erhalten. `UH05_V291_NM_BOUNDARY_2026-11-06.mjs` ist eine ausdrücklich an Main v291 gebundene Kopie: dieselben18 Diagnosefälle und Nullfreigabe.
2. `python3 docs/repros/UH05_THREE_FILL_ORACLE_2026-11-06.py`: zehn unabhängige Decimal-Sollfälle (Kauf/Verkauf, gleiche/ungleiche und gebrochene Mengen, verschiedene Preise, positive/negative/Null-Gruppendifferenz), vier Mitglieder und alle neun Postings. Kein Produktionsimport und keine Gebührenverteilung. Selbstprüfung der Journalbilanzen belegt nur den Oracleaufbau.
3. `node docs/repros/UH05_THREE_FILL_BASELINE_2026-11-06.mjs`: alle zehn Fälle in beiden Dateireihenfolgen auf unverändertem v291 müssen ohne Quell-/Modellmutation blockiert bleiben. Dies ist der Vorher-Nachweis für die spätere Implementierung.
4. Vor Integration die Sollwerte mit tatsächlichen neuen Buchungen/Journals/kanonischen IDB-Bytes vergleichen, Mutationsnegative für alle vier Mitglieder/Proofversion/Quellkonten/Payloads und Wiederimport über anderes lokales Konto ergänzen. Beide Dialekte Depot12/Konto10 und Depot13/Konto8 gezielt einschließen, ohne Kontoidentität zu verallgemeinern.

## Nächster Implementierungsschnitt und Pflichtgates

Bestehenden Nettoplaner und dessen Validatoren gezielt um Version3 erweitern; UI des gemeinsamen Imports zeigt ausdrücklich drei Ausführungen/einen Cashbeleg und keine Einzelcash-/Kostenzuweisung. Betroffene Pfade: `flatex-net-settlement.js`, gemeinsamer Flatex-Import/-Anzeige und Testfixtures; Modell-/Journal-/Restore-/Ownershipprüfungen entlang der tatsächlichen Abhängigkeiten erhalten. Keine zweite Engine, Migration oder neue Infrastruktur.

Vor Produktbranch den aktuellen Main/Tree/Owner/Actions/Checkpoint frisch prüfen. Eigenen Main-basierten Produktbranch erst für vollständigen Kandidaten; keine Produktdateien des historischen Checkpointbranches übernehmen. Lokale gerichtete Negativ-/Oracletests zuerst, dann vollständige Units/Syntax, unveränderte81-Originalgruppen und Pflicht-CI samt drei Engines. Bestehende Browserkette um genau3:1 erweitern und alle Assertions auf vier Mitglieder/neun Postings/Einmalcash unabhängig belegen. Versions- und SW-Bump nur am tatsächlichen Kandidaten, eingefrorene CI nicht durch Dokumentationspushes duplizieren. Erst vollständige Integration/Deployment/Pages/TLS/SW/tatsächliche Produktion als neuen Release akzeptieren.

Weitere N:M/FX/Referenz/Wallet/Stakingfälle, sämtliche UI300-Nachträge, QUALITY298, CI229 und Android-Performance bleiben offen. Die81Originalgruppen sind kein privater3:1-Originalnachweis. Kein Vollhistorien-, Eigentums- oder Hardwareclaim. EFF01/HND01 und sämtliche Finanz-/Identitäts-/Journal-/CAS-/Backup-/Restore-Verträge unverändert.
