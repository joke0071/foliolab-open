# HIST-VIS01 · abgegrenzte Vorbereitung · 19.11.2026

[Maßgeblicher Nutzer-Nachtrag](https://github.com/joke0071/foliolab-open/issues/149#issuecomment-6562288898). Main `b4b40df6` enthält `#historyBasis` mit `auto`, `observed` und `partial`. `historicalWealthView()` trennt belegte Rekonstruktion, Kontrollpunkte und Teilportfolio. `portfolioProjection` belegt die Zukunftsszenarien als eigenen, schreibfreien Ablauf. Aktuell gibt es keinen Modellverlauf mit konstantem heutigem Bestand.

## Kleinster vollständiger Schnitt nach den laufenden Releases

Im Vermögensverlauf bleiben die drei bestehenden Datenbasen verfügbar. Der zusätzliche **Modellverlauf · heutiger Bestand** ist bewusst wählbar und dauerhaft als Modellansicht gekennzeichnet. Das vorhandene Zeitraum-Menü bleibt der Einstieg. Zeitraum und Datenbasis erhalten eigene Gruppen. In der Übersicht gilt die vorhandene belegte Darstellung. Die bestehende Auswahl bleibt im Browser erreichbar, bevor sie durch das kompakte Menü ersetzt wird.

Der Modellpfad verwendet ausschließlich bereits verfügbare, kompatible Tageskurs- und FX-Belege. Heute gehaltene Stückzahlen werden je Datum konstant angesetzt. Enthaltene Guthaben werden als heutiger Nominalbestand ohne Zinsentwicklung erklärt. Fremdwährungsbestände brauchen jeweils belegten historischen FX. Pro Datum müssen alle im Modell enthaltenen, wirtschaftlich eindeutigen Positionen bewertbar sein. Fehlende Werte erzeugen eine Lücke. Vor nicht vergleichbaren Splits oder Umwandlungen bleibt der betroffene Abschnitt ausgeschlossen. Ausgeschlossene oder doppelt repräsentierte Wallet-Positionen verlangen einen eindeutigen Wirtschaftsbezug. Der Marktwertverlust durch eine fehlende Komponente darf nicht als Kurvenabfall erscheinen.

Die neue Berechnung bleibt ein separater Anzeigeweg. Journal, Datensatz, Stichtage, Rendite, Kapitalvergleich, Backup und die Zukunftssimulation behalten ihre eigenen Eingaben. Die Vorprüfung identifiziert das vorhandene Preis-/FX-Validierungsstück in `historical-position-value.js` zur Wiederverwendung. Ein separater Testfall prüft den Modellablauf auf unveränderten IndexedDB-Rohbytes und Revision.

## Prüffälle und weitere Pakete

- Unabhängige EUR-Werte mit ETF, Krypto, heutigem Guthaben, Fehlkurs, fehlendem GBP-/USD-FX, Split, Wallet-Repräsentation und dünner Abdeckung. Zwei kompatible Punkte als Mindestbasis. Zeitlich nicht belastbare Abschnitte sichtbar getrennt.
- Alle vier Datenbasen in der Verlaufsansicht, einschließlich leerer oder nicht berechenbarer Auswahl. Diagramm/Kalender/Fokus/Tastatur/Touch, 320–1440 px, drei Engines und Offline-Reload. Regulärer exakter Main-/Deploy-/Livepfad.
- Auto/Linie/Punkte bleibt eine separate visuelle Auswahl. Begrenzt geschätzte Segmente im Automatikmodus brauchen einen eigenen sichtbaren Herkunfts- und Lückenvertrag mit vorab geprüften Cashflow-, Split- und FX-Fällen. In diesen ersten Modellpfad kommt keine Interpolation.
- Keine Umsetzung oder Produktabnahme durch diesen Review. Pilot #358 und der vorbereitete Positionskurs-Schnitt stehen zuerst in der Releasefolge.
