# Native Kursdiagramme – Quellen und verfügbare Zeiträume

Stand: 10.11.2026, abgeglichen mit v303. Aktueller Kurs, Marktkursverlauf und persönliche Wertentwicklung sind getrennte Aussagen. Ein erfolgreicher aktueller Kursabruf belegt keine vollständige Historie.

## Verfügbare Zeiträume

Positionsdiagramme bieten die Basiszeiträume `7 T · 1 M · 3 M · 6 M · 1 J`. Angezeigt wird nur die tatsächlich verfügbare Datenreihe innerhalb des gewählten Zeitraums; eine Auswahl von `1 J` garantiert kein vollständiges Jahr.

Für ETFs, Aktien und Fonds werden `3 J` und `5 J` zusätzlich angeboten, wenn eine passend konfigurierte eigene EODHD-Workerquelle zur Notierung verfügbar ist oder eine lokale validierte Kurshistorie mit mindestens zwei unterschiedlichen Datumswerten ungefähr fünf Jahre zurückreicht. Die Auswahl einer Workerquelle beweist weder Berechtigung noch erfolgreiche Lieferung. Alpha Vantage oder Marketstack allein schalten diese Langzeitoptionen nicht frei.

Bei Kryptoanlagen bleiben die externen freien Historienabrufe auf höchstens ein Jahr begrenzt. Eine ausreichend alte lokale Historie kann zusätzlich `3 J`/`5 J` ermöglichen; dadurch werden keine älteren API-Kurse angefordert oder ergänzt.

`Max` steht nur bei einer lokalen validierten Historie mit mindestens zwei Beobachtungen und einem Anfang vor mehr als einem Jahr zur Verfügung. Es zeigt die vorhandene lokale Datenreihe, nicht die unbekannte gesamte Vergangenheit einer API. Höchstens 6.500 datierte CSV-Beobachtungen je Position werden unterstützt. Lücken oder kurze Reihen werden nicht durch erfundene Kurse geschlossen.

Die Darstellung und Gruppierung der Zeitraum-Schaltflächen richtet sich nach Ansicht und Breite. Die gewählte Aktualisierungshäufigkeit unter „Mehr“ steuert keine dieser Diagrammoptionen.

## Aktive Quellen und Grenzen

| Quelle | Aktueller Kurs und Historie | Grenze |
| --- | --- | --- |
| Alpha Vantage | Tagesreihe mit eigenem Schlüssel; belegte Referenzen VWCE, XDEM, XDEQ und 5MVL in EUR auf Xetra | Kompakte Reihe mit höchstens 100 Handelstagen; keine Mehrjahreszusage. Suche, Diagnose und Kurse teilen das lokale Tagesbudget. |
| Marketstack | Tageskurse mit eigenem Schlüssel für die belegten EUR/Xetra-Referenzen | Der aktuelle Adapter fordert rund 330 Kalendertage an. Fehlende oder Null-Schlusskurse sperren die Historienübernahme; ein separat geprüfter jüngster Tageskurs kann trotzdem nutzbar sein. |
| Eigener EODHD-Worker | Optionaler eigener Kursdienst mit bestätigtem Börsensymbol und separatem Zugriffsschlüssel | Mehrjahresdaten nur, wenn der eigene Dienst und Tarif sie tatsächlich liefern. Bestehende privat betriebene Worker werden durch ein Repositoryupdate nicht automatisch aktualisiert. |
| CoinGecko / CoinPaprika | Externe Kryptohistorie höchstens ein Jahr | Aktuelle Kryptokurse beweisen keinen erfolgreichen Historienabruf. Fehler und fehlende historische EUR-Umrechnung bleiben sichtbar. |
| Lokale CSV | Tatsächliche, zur Position und Handelswährung passende Schlusskurse | Vom Nutzer geprüfte Daten, keine unabhängige Quellenbestätigung; kein Ändern von aktuellem Positionskurs, Mengen oder Buchungen. |

FMP, Twelve Data und direkte EODHD-Schlüssel sind keine aktiven Browser-Kursquellen. Historische Quellnamen und Notierungskennungen dürfen in gespeicherten Kursbelegen erhalten bleiben; sie aktivieren keinen entfernten Anbieter.

Die bestehende Quellenauswahl versucht im Modus „Automatisch“ passende konfigurierte Quellen in der Reihenfolge Alpha Vantage → Marketstack → eigener EODHD-Worker. Daten verschiedener Börsen oder Währungen werden nicht als Ersatz vermischt. Eine gescheiterte Mehrjahresabfrage macht aus einer kurzen Reihe keine vollständige Fünfjahreshistorie; maßgeblich bleiben die tatsächlich gelieferten Anfangs- und Endtage.

## Aktualisierung und Zugangsdaten

Unter **Mehr → Datenquellen & Aktualisierung** ist **Täglich** Standard. **Nur manuell**, **Alle 6 Stunden** und **Alle 30 Minuten** sind auswählbar. Fällige automatische Abrufe erfolgen beim Öffnen der App und bleiben von Anbieterbudgets, Erreichbarkeit und Fehlerpausen abhängig.

Eigene Zugänge sind optional. Ohne sie bleiben manuelle Kurspflege und lokale CSV nutzbar. Normale unverschlüsselte Portfolioexporte enthalten keine Zugangsdaten. Das vollständige verschlüsselte Backup kann unterstützte aktive Einstellungen nur nach ausdrücklicher Aktivierung der entsprechenden Option einschließen. Der EODHD-Anbieter-Schlüssel bleibt im eigenen Worker; FolioLab verwendet dessen separaten Zugriffsschlüssel.

[Einrichtung des optionalen Workers](../worker/README.md) · [Überblick und Datenquellen](../README.md)
