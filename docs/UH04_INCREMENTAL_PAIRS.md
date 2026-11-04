# UH04 – chronologisch weitere EUR-Paare

Ziel: Nach einem übernommenen EUR-Depot12/Konto10-Paar lassen sich spätere Paare im selben Assistenten ergänzen. Vorher sperrte jede vorhandene Buchung den weiteren Import. Der gemeinsame CSV-/Journal-/IDB-Pfad bleibt zuständig; keine Schemaänderung.

Umfang: ausschließlich unveränderte, bereits vollständig belegte EUR-Paargruppen mit datiertem Anfangsbestand, exaktem Journal-/Bestandsabgleich und neuen Vorgängen nach allen betroffenen vorhandenen Buchungen. Andere/manuelle Abhängigkeiten, gleicher oder früherer Buchtag, ungeklärte Eröffnungen, bestätigte Kosten/Ergebnisse und betroffene Referenzstände ab dem neuen Vorgang bleiben gesperrt. Keine Einzelbeinergänzung, FX-, Depot13-, Konto8- oder N:M-Freigabe.

Abnahme:

1. Kauf/Verkauf mit unabhängigem synthetischem Soll: erster Kauf 2 Stück/−21,75 EUR, späterer Kauf +1/−12,25 → 3 Stück/66 EUR; alternativ Verkauf −1/+11,75 → 1 Stück/90 EUR. Vorhandene Buchungen, Journalbelege und Anfangsbestände unverändert; Kosten unbekannt, kein externer Kapitalfluss.
2. Geänderte Baseline/Quelle, manuelle Abhängigkeiten, Bestandsabweichung, gleiche/frühere Tage und Referenzstände sperren ohne Teilwirkung. Bestehende Quota-/Abbruch-/CAS-Verträge erhalten.
3. Echter UI-Commit der späteren Gruppe, Offline-Reload, verschlüsselter v5-Restore im frischen Profil, Wiederimport ohne Doppelwirkung; Rücknahme der letzten Gruppe erhält die erste und sperrt Wiederimport.
4. Vorhandene Originalpaare chronologisch aufteilen und zwischen Commits wiederherstellen; feldweise und aggregiert gegen vorhandenen unabhängigen CSV-/Decimal-Oracle prüfen. Kontrollierte Eröffnungen bleiben ausdrücklich synthetisch.
5. Bestehende Integrations-/Main-/Produktionsgates unverändert, neuer SW-Cache v280. Kein LIVE_ACCEPTED vor vollständiger tatsächlicher Abnahme.

Risiko: Finanz-/Importpfad, daher vollständige Pflichtgates. Nächster sicherer Releasepunkt ist genau dieser begrenzte Ablauf. UH03/LINK bleibt wegen fehlender erfasster Finalitätsprovenienz gesperrt; UH04 insgesamt und UH05 bleiben offen.
