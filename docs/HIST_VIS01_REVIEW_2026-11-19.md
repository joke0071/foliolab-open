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

## Vorbereiteter SW325-Schnitt

[Entwurf](https://github.com/joke0071/foliolab-open/commit/d9d7fc6c76e8d00f6d32bbe9566068f7ff2eac98), Git-Baum `01abb4019fe689e09519790a58db34a533d600b8`. Die drei bestehenden Datenbasen bleiben erreichbar. Das vorhandene Mehr-Disclosure enthält die Datenbasis sowie die separate visuelle Auswahl Auto/Linie/Punkte. Der opt-in Modellverlauf speichert ausschließlich seine UI-Auswahl für die jeweilige Website im Browser. Die Übersicht bleibt auf der bestehenden belegten Datenbasis. Vergleichbare, vollständig belegte Tagespreise plus gebundener EUR-FX sind Voraussetzung. Heutige Cashbeträge sind im Modell nominal ohne Zinserträge fest. Keine Linie über belegfreie Zwischenräume oder Kapitalmaßnahmen; bei fehlender Belegdeckung bleibt das Modell explizit nicht verfügbar.

Gezielte unabhängige Rechentests für Cash, EUR-FX, fehlende Werte, Konflikte, Split und Wallet-Doppelrepräsentation. Chromium, Firefox und WebKit bestanden das getrennte Modell und den regulären FLH02-Altvertrag, einschließlich vier Breiten, Schließen/Fokus, echter Service-Worker-Kontrolle, Offline-Reload und bytegleichem IndexedDB-Rohdatensatz. Ebenfalls reguläre Zeitraumregression in allen drei Engines. Auf dem gleichen Produktbaum bestand die lokale integrierte Vorschau 158 exakte Pfade, 10 Kernblöcke und 21 Axe-Prüfungen. Kein GitHub-PR, Mainmerge oder Produktivlauf für SW325 gestartet. Die grafischen Schätzsegmente sind ein eigenständiger Folgeschnitt unten.

## Vorbereiteter SW326-Schnitt für grafische Schätzsegmente

[Entwurf](https://github.com/joke0071/foliolab-open/commit/0bf4d2de755a26e43cf580bdceebb82c454a8ffc), Git-Baum `f3ebf28584a32218c40c5c054ccb8537f6eb0d50`. Im Modus Automatisch lässt sich eine gesonderte grafische Schätzung bewusst einblenden, wenn genau ein fehlender Schlusskurstag zwischen zwei vollständig belegten EUR-Tagen liegt. Nachweisbare Originale, Bestände, Quellen und Mengen müssen übereinstimmen. Buchungen, Geldflüsse, Kapitalmaßnahmen, beobachtete Stichtage am fehlenden Tag, Fremdwährungs- und Walletpositionen schließen den Schätzzweig aus. Das unabhängige Soll beträgt 32/38/44 EUR mit zwei realen Ankern. Der mittlere Wert wird nur im Chart als Schätzwert ausgegeben, gestrichelt oder als hohler Punkt mit eigener Kennzeichnung und Tastaturwert-Text. Die belegte Linie bleibt am fehlenden Tag unterbrochen.

Drei lokale Browser-Engines mit tatsächlichem Worker, Offline-Reload, Tastatur und exakter IndexedDB-Gleichheit, gezielte Negativfälle und dieselbe lokale integrierte Probe mit 159 Pfaden, 11 Kernblöcken und 22 Axe-Prüfungen bestanden. Eine breitere Schätzung etwa bei längerem Ausfall, Fremdwährung oder Cashflow braucht einen eigenen belegten Vertrag. SW326 bleibt vorbereitet und wartet auf die produktive Abnahme von SW325.
