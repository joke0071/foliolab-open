# Längere native Kursdiagramme – FolioLab Open (24.10.2026)

## Gültige Zeiträume

Die Basis-Auswahl für native Marktkursdiagramme bleibt `7 T · 1 M · 3 M · 1 J`. Diese Auswahl erscheint für CoinGecko/CoinPaprika ohne kostenpflichtige Datenzugänge unverändert. Freie CoinGecko-Demo-Historie und freie CoinPaprika-Tageshistorie reichen nur ungefähr ein Jahr.

`5 J` erscheint für ETFs/Aktien/Fonds, sofern (a) eine passende, vollständig zugeordnete Quelle EODHD, FMP oder Twelve Data konfiguriert ist oder (b) ein importierter und validierter CSV-Kursverlauf wenigstens ungefähr fünf Kalenderjahre abdeckt. Der Provider/Tarif muss die angeforderte Zeitspanne tatsächlich freigeben. Bei einem jüngeren ETF können weniger Beobachtungen vorliegen; FolioLab benennt deshalb den **tatsächlich gelieferten Anfangs- und Endtag**. Es ergänzt keine fiktiven Punkte.

`Max` erscheint nur bei bereits vorhandenen, validierten CSV-Kursen mit Beobachtungen, die älter als ein Jahr sind. Max bedeutet: alle tatsächlich importierten Daten, nicht die unbekannte gesamte Historie einer externen API. Selbst bei zusätzlich konfigurierten API-Quellen lädt Max ausschließlich die lokale CSV-Historie; dadurch wird keine vermeintlich vollständige API-Vergangenheit suggeriert. Bis zu 6.500 datierte CSV-Beobachtungen je Position können importiert werden.

Bei zwei zusätzlichen Zeiträumen zeigt Desktop alle sechs Zeiträume. Auf Smartphones bleiben vier direkte Schaltflächen und eine kompakte **Mehr**-Auswahl für `5 J`/`Max`. Wenn nur ein zusätzlicher Zeitraum existiert, erscheint dieser direkt als fünfte Auswahl.

## Quellen und Limits

- **CoinGecko Demo / CoinPaprika Free:** keine 5-Jahres-Option, unveränderte schlüssellose Datenlogik.
- **EODHD direkt / FMP:** bestehender API-Zugang und bestätigter Handelsplatz; echte 5-Jahres-Abfrage mit Datumsbegrenzung, keine künstliche Extrapolation.
- **Twelve Data:** 5-Jahres-Abfrage mit `start_date` und `end_date`, ohne historienverkürzendes `outputsize=500`. Das verfügbare Datenvolumen hängt von Notierung und Tarif ab.
- **Eigener EODHD-Worker:** Worker-Vorlage und Client sind auf ca. fünf Jahre beziehungsweise höchstens 1.800 bestätigte Schlusskurstage erweitert; bestehende selbst installierte ältere Worker müssen gesondert aktualisiert werden. Private Worker-Zugangsdaten verbleiben im Worker beziehungsweise lokal wie zuvor. Die Änderung im Repository aktualisiert keinen privat betriebenen Worker automatisch.
- **CSV:** Quelle wird weiterhin als nicht unabhängig geprüft kenntlich gemacht, zählt nicht zur Anlagerendite und verändert weder Bestände noch Buchungen.

Eine gescheiterte 5-Jahres-Abfrage macht aus 365 Tagen keine vermeintliche Fünfjahres-Historie. Fehler werden als solche angezeigt. Bei tatsächlich kurzen historischen Reihen zeigt das Diagramm nur den belegten Datumsbereich und erklärt das.
