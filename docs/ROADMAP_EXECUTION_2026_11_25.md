# FolioLab Open · Checkpoint vom 27.11.2026

## Verbindliche Designregeln für FolioLab

**Gestaltungsziel vom 27.11.2026.** Übersicht, Verlauf, Positionen, Buchungen und Mehr sollen sich in Optik und Bedienung möglichst eng an aktuellen Google-Apps orientieren. Der Google-Gradient-Stil prägt die FolioLab-Marke und die Bereichsakzente. Für Navigation, Listen, Formulare und Dialoge gilt Material 3 Expressive. Die Regeln gelten auch für neue und überarbeitete Ansichten. [Gestaltungskandidat SW350](https://github.com/joke0071/foliolab-open/pull/445)

### Visuelle Referenzen und ihre Anwendung

| Gesichtete Referenz | Was FolioLab daraus übernimmt |
| --- | --- |
| [Googles Workspace-Icons](https://workspaceupdates.googleblog.com/2026/05/introducing-fresh-visual-identity-for-Google-Workspace-app-icons.html) und [Google-App-Icons vom November 2026](https://blog.google/products-and-platforms/products/messages/updated-icons-messages-phone-contacts/) | Klare Silhouetten und weiche Farbübergänge. Das FolioLab-App-Symbol trägt den mehrfarbigen Verlauf. Die Reiter erhalten unterscheidbare Farbfamilien. Für hervorgehobene Bereichssymbole leitet sich der Verlauf aus ihrer jeweiligen Farbfamilie ab. |
| [Gmail-Einstellungen auf Android, Screenshot vom November 2026](https://www.androidauthority.com/wp-content/uploads/2026/11/New-Gmail-settings-page-redesign-2.jpg) | Farbige Kategoriesymbole, linksbündige Titel und kurze Erläuterungen gliedern eine ruhige, gerundete Liste. Diese Anordnung gilt als Vorbild für „Mehr“. Der kleine Stift zum Bearbeiten zeigt, wie sich eine lokale Aktion optisch unterordnet. |
| [Google Drive auf Android, Screenshot der Listenansicht](https://9to5google.com/wp-content/uploads/sites/4/2026/01/Google-Drive-container-1.jpg?quality=82&strip=all) | Eine gemeinsame Fläche fasst die Liste zusammen. Der aktive Navigationspunkt hat eine getönte Kapsel. Das Plus zum Anlegen hebt sich von den wiederkehrenden Zeilenmenüs ab. Das ist das Vorbild für Positionen und Buchungen. |
| [Google Finance auf Android, offizielle App-Screenshots](https://play.google.com/store/apps/details?id=com.google.android.apps.finance) | In der Kursansicht stehen Betrag und Veränderung über dem Diagramm. Die Datenlinie ist kräftig, die Füllung zurückhaltend und die Zeichenfläche ruhig. Übersicht und Verlauf räumen Zahlen und Einheiten denselben Vorrang ein. |

### Komponenten und Bedienung

- **Farbrollen.** Bereichsakzente aus SW350 durch Navigation, Unterreiter und zugehörige Dialoge führen. Anlageklassen haben eine eigene, feste Zuordnung über Balkensegment, Legende, Positionsliste und Kursdetail hinweg. Gewinn und Verlust sind zusätzlich an Vorzeichen oder Richtung erkennbar. Farbwerte, Verläufe, Abstände und Radien zentral definieren.
- **Icons und Schaltflächen.** Gleiche Aktionen verwenden überall dasselbe Symbol, dieselbe optische Größe und Strichstärke. Die wichtigste Aktion erhält eine gefüllte Schaltfläche, eine nachgeordnete Aktion eine dezente Tönung oder Textform. Wiederkehrende Zeilenaktionen stehen als einfache Icons. Eine farbige Hinterlegung kennzeichnet eine festgelegte Rolle oder Auswahl. Hover, Tastaturfokus, gedrückter und deaktivierter Zustand bleiben unterscheidbar. [Google zu Schaltflächen](https://developer.android.com/develop/ui/compose/components/button)
- **Typografie und Daten.** Die lokal verfügbare Roboto folgt einer gemeinsamen Skala für Hauptbetrag, Seitentitel, Abschnittstitel, Fließtext und Beschriftung. Für jede Rolle sind Größe, Gewicht und Zeilenhöhe festgelegt. Vergleichbare Beträge stehen mit ausgerichteten Ziffern untereinander. Lange Eurobeträge und deutsche Beschriftungen müssen mobil und bei 200 % Zoom lesbar bleiben. In der Übersicht stehen die Werte als Text beim horizontalen Anteilsbalken. Der Kolben kennzeichnet die App im Kopfbereich. [Material-Typografie](https://m3.material.io/styles/typography/applying-type)
- **Navigation und Eingaben.** Hauptreiter, Unterreiter und Zeitraumwähler zeigen die aktive Auswahl eindeutig. Direktlink, Zurück und Vorwärts stellen die passende Ansicht samt Auswahl her. Dialoge führen den Fokus beim Schließen zum Auslöser zurück. Touch-Ziele erhalten auf Mobilgeräten möglichst 48 × 48 CSS-Pixel, auch bei kleinen sichtbaren Symbolen. [Google zu Touch-Zielen auf Android](https://developer.android.com/develop/ui/compose/accessibility/api-defaults)

### UI-Entscheidungen vom 28.11.2026

**Geltung.** Diese Ziele betreffen die nächste Umsetzung in der App. Die interaktive Layoutstudie mit Beispieldaten veranschaulicht Scrollverhalten, Gruppierung und Klassenfarben. Für Vertragslogik, Datenzustände, Unterseiten und Dialoge gilt das Verhalten des Produkts.

| Bereich | Gemeinsame Fläche | Frei stehende Elemente |
| --- | --- | --- |
| Übersicht | Je eine Karte für Vermögensverlauf, Verteilung nach Anlageklasse und Kontenliste | Kopf mit Gesamtwert, Veränderung, Bezugszeitraum und Datenstatus |
| Verlauf | Zeitraumwahl, Kurve und Bezugseinheit gehören zusammen. Stichtage bilden eine eigene Liste. | Seitentitel und Unterseitennavigation |
| Positionen | Eine Liste je dargestellter Gruppe, in der Standardansicht je Anlageklasse. Innerhalb der Gruppe nur Zeilentrenner. | Seitentitel, Suche, seitenweite Filter und Aktionen |
| Buchungen | Chronologisch sortierte Zeilen teilen sich einen Rahmen je Monat und Jahr. Andere Sortierungen erhalten Gruppen passend zur Sortierung. | Monatsüberschriften, Suche, seitenweite Filter und Aktionen |
| Mehr | Eine gemeinsame Fläche je Aufgabengruppe der bestehenden Unterseite. Geöffnete Details stehen unter der zugehörigen Zeile. | Unterseitennavigation und Abschnittstitel |

- **Flächen.** Eine feine neutrale Außenkontur und ein gemeinsamer Eckenradius je Karte. Zwischen gleichartigen Zeilen reichen dünne Trennlinien. Gliederung über Abstand. Eigene Konturen für Eingabefelder, Tastaturfokus und Dialoge bleiben funktional begründet.
- **Farbe.** Der Verlauf des aktiven Symbols und eine getönte Auswahlfläche kennzeichnen den Bereich. Form, Text und programmatisch erkennbare Auswahl ergänzen die Farbe. Die Klassenfarben aus `styles.css` gelten konsistent für Balken, Legende und Positionskennzeichnung. Kursänderungen zeigen zusätzlich Vorzeichen. Aktionssymbole tragen dieselbe Bedeutung in Liste und Detailansicht.
- **Mobiles Scrollen.** Portfolio-Kopf und Kennzahlen scrollen aus dem Bild. Anschließend bleibt eine Hauptmenüleiste am oberen sicheren Bildschirmrand. Beim Wechsel im kompakten Zustand beginnt der neue Inhalt unter der sichtbaren Leiste. Kleine Gegenbewegungen klappen den Kopf nicht auf. Vorhandene Unterseiten, Statuszugänge, Beta-Hinweis, aktiver Filter und Entwürfe bleiben erreichbar. Geräte-Zurück, Direktlink und Tastaturfokus behalten ihre Funktion. Auf dem Desktop bleibt die Seitenleiste der primäre Einstieg.
- **Anteilsbalken.** In der Übersicht ersetzt ein gestapelter horizontaler Balken den Ring. Segmentbreiten folgen dem ungerundeten Anteil an den bewerteten positiven Anlagen. Die stabile Klassenreihenfolge und die Legende mit Name, Eurobetrag und Prozentwert gelten auch bei sehr kleinen Anteilen. Verbindlichkeiten und Nettovermögen bleiben getrennt ausgewiesen. Fehlende Bewertungen als Teilsumme kennzeichnen, bei ausschließlich unbekannten oder fehlenden positiven Werten einen erklärenden Text zeigen. Auswahl, Detailwert und Rückkehr zur Gesamtansicht bleiben auch über ausreichend große beschriftete Ziele in der Legende erreichbar. Kleine Segmente benötigen keine eigenen Tabstopps.
- **Kennzahlen und Eingaben.** Die Veränderung nennt den zur Kurve gewählten Zeitraum und den Einfluss von Geldflüssen. Beim Scrollen, Filtern oder Öffnen von Details dürfen keine Portfolioänderungen entstehen. Für neue oder überarbeitete mobile Hauptaktionen, Filter und Zeitraumwähler 48 × 48 CSS-Pixel anstreben. Bestehende kompakte 44-Pixel-Aktionen zusammen mit ihren Regressionstests auf Überlappung und Platzbedarf prüfen.

**Befund auf SW362.** Der lokale Browserlauf auf [Main 94cb8320](https://github.com/joke0071/foliolab-open/commit/94cb83206ea2125b087f2ee387e0e359e90bd4ed) nutzte synthetische Konten, Positionen, Buchungen und Stichtage. Bei 320, 390, 768 und 1440 CSS-Pixeln waren alle fünf Bereiche erreichbar und der aktive Hauptreiter trug jeweils `aria-current="page"`. Bei den 20 Bereichswechseln blieb der gespeicherte Portfoliodatensatz einschließlich Revision gleich. In diesen Ansichten wurde kein horizontaler Überlauf der Gesamtseite festgestellt. Bei 390 Pixeln erreichte Tab aus „Mehr“ die Unterseite „Anbieter und Konten“. Escape aus „Konto hinzufügen“ stellte den Fokus auf „+ Konto“ zurück. Die mobile Hauptnavigation saß unten. Verlauf und Anlageklassenmodul hatten 0 px Außenkontur, die sichtbaren Listenpanels in Positionen, Buchungen und Mehr 1 px. „Anlage“, „CSV-Import“ und „Buchung“ maßen jeweils 44 × 44 px.

**Abnahme des nächsten App-Stands.** Zusätzlich zu den Breiten und dem 200-%-Durchgang unten gezielt in beide Richtungen scrollen und im kompakten Zustand den Bereich wechseln. Mit Tastatur, Touch und Android-Zurück Datum, Filter, Unterseite und Dialog-Rückkehr prüfen. Kein verdeckter Fokus, keine doppelten feststehenden Hauptmenüs. Für den Balken vollständiges, leeres und teilweise bewertetes Portfolio sowie Verbindlichkeiten und einen Anteil unter 0,1 % prüfen. Summen, Bewertungshinweise und Lesereihenfolge mit SW362 vergleichen. Diese Umsetzung und ihre Produktivabnahme sind offen.

### Designabnahme

1. Alle fünf Hauptbereiche nacheinander bei 320, 390, 768 und 1440 CSS-Pixeln durchgehen. Übersicht und Verlauf mit befülltem Portfolio prüfen, anschließend Position öffnen, Buchung bearbeiten und Einstellungen aufrufen. Dabei auch Unterreiter, Zeitraumwähler, Dialoge und leere Listen ansehen.
2. Die Ansichten nebeneinander mit den Referenzbildern vergleichen. Für denselben Vorgang müssen Symbol, Hintergrund, Beschriftung und Bedienung übereinstimmen. Bereichswechsel, Klassenfarben und Wertänderungen müssen sich auf Anhieb unterscheiden lassen. Beim Anteilsbalken müssen Klassenname, Eurobetrag und Prozentwert auch auf dem kleinsten Bildschirm vollständig lesbar sein.
3. Die Kernwege per Touch und Tastatur bedienen und bei 200 % Zoom wiederholen. Abweichungen an der gemeinsam verwendeten Komponente korrigieren und alle betroffenen Ansichten erneut prüfen. Die visuelle Abnahme erfolgt am umgesetzten Stand.

## Delta ab `fb034d07` · 28.11.2026

**6/6 Kernbereiche und 18/29 Folgepakete.** Cloudflare Pages liefert vom Produktionszweig `main` nach `https://foliolab.pages.dev/`. [Strukturierter Prüfbeleg](release-evidence/sw348-followup-execution-2026-11-27.json)

**Auslieferung.** [#457](https://github.com/joke0071/foliolab-open/pull/457) ist nach grüner Pflicht- und Wallet-CI integriert. Cloudflare meldete für den Main-Commit `bca54d0a` das Deployment `202c84e9`. Einstieg und `sw.js` leiteten auf beiden Hosts mit HTTP 302 zur jeweils passenden Access-Anmeldung. Im vorhandenen Browser erschien das E-Mail-PIN-Formular. Die angemeldete App blieb in dieser Sitzung unbeobachtet. Die frühere Subdomain lieferte NXDOMAIN und die frühere GitHub-Pages-Adresse HTTP 404. [Cloudflare-Check](https://github.com/joke0071/foliolab-open/runs/140966358753) · [Access-Prüfung auf Main](https://github.com/joke0071/foliolab-open/actions/runs/46140881649/job/140969842531)

**Beta-Einstieg.** In Firefox maß Playwright bei 390 CSS-Pixeln die Höhe der Prüfzeile mit 43,999969482421875 Pixeln. Das DOM meldete genau 44. Die Prüfung nutzt jetzt die DOM-Abmessung mit derselben Mindestgröße. Unter Wrangler Pages wurde außerdem ein gescheiterter Offline-Neustart bei vollständig installiertem Cache reproduziert. `/index.html` führt per HTTP 308 auf `/`. SW362 verwendet bei umgeleiteter Index-Antwort die direkt gespeicherte Startseite. Der Update-Test bestätigt den Offlinebestand und die Revision in Chromium, Firefox und WebKit. Die Pflichtprüfungen von [#456](https://github.com/joke0071/foliolab-open/pull/456) sind auf `dd4cf75c` grün. [Fehlerprotokoll](https://github.com/joke0071/foliolab-open/actions/runs/46133920723/job/140944970290) · [Korrigierter Lauf](https://github.com/joke0071/foliolab-open/actions/runs/46141692680)

**#298.** Der konfigurierte Build kopiert die App nach `_site/`. Der [SW363-Kandidat](https://github.com/joke0071/foliolab-open/commit/7013f0518dcf810b80f06218e6e9f59c1bf4a45d) hinterlegt dort die auszuliefernden Framing-Header. Auf lokalen Wrangler-Pages-Origins war SW362 einbettbar. SW363 sperrte die fremde Origin beim Erstbesuch und nach dem Update. Die Offline-Antwort trug beide Schutzheader. Chromium, Firefox und Linux-WebKit bestanden. Der Chromium-Paketlauf bestätigte zusätzlich 165 Datei-Hashes, 22 Axe-Prüfungen und den verschlüsselten Restore. Für die Live-Funktionsprüfung fehlt eine angemeldete Produktionssitzung. Für ITP fehlt ein persistentes natives Safari-Profil mit tatsächlichen Nutzungstagen.

**Neue Projekteingänge.** Im geprüften Delta gab es keinen nutzbaren physischen Android-Geräteplatz, keinen unabhängigen Befund zum Review-Head `84ef0b37` und keinen neu zuordenbaren Finanz- oder Cursor-Originalbeleg. Das Xetra-Tagesverzeichnis zum Ersthandelstag lieferte HTTP 403. Der offizielle Delayed-Data-Dienst endet jeweils um Mitternacht des folgenden Geschäftstags. Die elf konkreten nächsten Eingänge stehen unter `executionDelta.cloudflare20261128.nextInputByPackage` im JSON. [Review](https://github.com/joke0071/foliolab-open/pull/427) · [Datenregister](https://registry.opendata.aws/deutsche-boerse-pds/) · [Xetra-Dateidienst](https://www.mds.deutsche-boerse.com/mds-en/real-time-data/Delayed-data)

## Delta ab `5bb8db3b` · 27.11.2026

**SW348 auf [Main `4e3e4a25`](https://github.com/joke0071/foliolab-open/commit/4e3e4a256ce0d81946ed6907b965d1f30aac33fe) produktiv bestätigt. 6/6 Kernbereiche, 18 → 18 von 29 Folgepaketen.** Die drei ausgelieferten Einstiegsdateien stimmen bytegenau mit Main überein. Beim Einstieg gab es sechs offene PRs und keinen aktiven Actions-Lauf. [Strukturierter Prüfbeleg](release-evidence/sw348-followup-execution-2026-11-27.json).

**#159 · Ausschüttung am Portfolio-Stichtag.** Epoche 1061 begann bei finalisiertem Slot 458352000 mit Blockhöhe 436387262 und 551 Reward-Partitionen. Die lokale SipHash-1-3-Rechnung ordnet das zuvor über die Ledger-Delegation belegte Stake-Konto Partition 449 zu. Alle 2.037 Staking-Einträge im ersten Ausschüttungsblock ergeben in derselben Rechnung Partition 0. Für Partition 449 ergibt die Liste produzierter Blöcke Slot **458352450**, Blockhöhe **436387712**, am 18.10.2026 um **07:31:04 UTC**. Der Vorgänger hat dieselbe RPC-Zeitsekunde. Der lokale Abgleich findet genau einen positiven `Staking`-Reward und seinen Nachsaldo. Der lokale Adressabgleich der 380 bzw. 913 Transaktionen im Vorgänger- und Ausschüttungsblock ergibt null Treffer für beide Konten. Die beiden Randzustände sind damit auf Blockebene belegt. [Solana-Blockantwort](https://solana.com/developers/docs/rpc/http/getblock) · [Partitionierte Rewards](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0118-partitioned-epoch-reward-distribution.md).

| Angenommene Zeitzone im Original | Vor Gutschrift | Ab Gutschrift |
| --- | --- | --- |
| Europe/Vienna | 458194430–458352449 | 458352450–458592880 |
| UTC | 458227565–458352449 | 458352450–458626069 |

Die Originalnotiz nennt ein Stake-Konto und führt aktive sowie auszahlbare Teilbeträge auf. Der hinterlegte Solana-Wallet-Eintrag stimmt lokal mit dem Gebührenzahler der belegten Delegation überein. Die Positionsmenge liegt über beiden unmittelbaren Einzelkontoständen. Zwei bytegleiche Hauptkopien mit je acht Stichtagssicherungen sowie ein weiterer Export mit vier Stichtagssicherungen führen die Tagesangabe fort. Der früheste enthaltene manuelle Stichtagssnapshot führt dieselben Mengen mit `createdAt` am 18.10. um 19:42:00 UTC. Dieser Zeitstempel gehört zum Snapshot. Die Messzeit der beiden Bestände und ihre Lage zur Gutschrift bleiben offen. Nächster entscheidender Eingang ist ein Originalbeleg, der die Portfolio-Ablesung einem finalisierten Slot oder eindeutig einer Seite der Gutschrift zuordnet. Für die Freigabe folgen der freie Wallet-Saldo, die Stake-Lamports und die historische Delegation am selben zugeordneten Slot.

**#174 · Kraken-Order und flatex-Kontoumsätze.** Beim lokalen Inhaltsabgleich der freigegebenen Originale und Archive wurde kein nativer Trades-Export mit `ordertxid`, `txid`, `pair` und `ledgers` zur belegten USD→EUR-Gruppe gefunden. Der Saldenabgleich bestätigt ihre drei Buchungsbeine einschließlich `FEE`. Ein vorhandener autorisierter Kraken-Trades-Abruf ist unbelegt. Im flatex-AT-Gegenversuch lieferten 862 gebuchte Kontoumsätze und 2.676 Depotzeilen in den ausgewiesenen Betrags-, Kurs- und Buchungsfeldern keine Order mit expliziter Fremdwährung und zuordenbaren Mehrfachausführungen. Nächster Eingang ist der native Trades-Export zur Ledgergruppe oder ein zusammengehöriger FX-Order- und Cash-Beleg. [Kraken Trades History](https://docs.kraken.com/api-reference/account-data/get-trades-history) · [Kraken Trades-Exportfelder](https://support.kraken.com/articles/360001184886-how-to-interpret-trades-history-fields).

**#148 · Österreichischer Trade-Republic-Fall.** Sechs öffentliche App-CSV-Fixtures aus dem Portfolio-Performance-Repository und der zusätzliche CSV aus #6149 enthalten weder die ISIN noch die Menge oder Ausführungsreferenz aus #6103. Der Nachweis braucht den App-CSV genau zu dieser Abrechnung. [Österreichische Abrechnung #6103](https://github.com/portfolio-performance/portfolio/issues/6103) · [CSV #6149](https://github.com/portfolio-performance/portfolio/pull/6149).

**#405 · Integrierte Indexanzeige.** Die CMC-Lizenz für registrierte Pläne deckt die integrierte Anzeige für Endnutzer im eigenen Produkt mit Attribution ab. Eine beim Pages-Build erzeugte integrierte Anzeige ist damit ein konkreter Pfad. Eine Bestätigung des kostenlosen Basic-Kontos liegt vor. CoinMarketCap führt den aktuellen Fear-&-Greed-Wert im Basic-Tarif. Für den konkreten Projektabruf fehlt eine bereits authentifizierte Sitzung oder ein belegter serverseitiger Zugriff. Die offizielle CNN-Indexseite liefert live `frame-ancestors` ohne FolioLab-Origin. Für CNN bleibt ein offiziell freigegebener Feed oder Embed erforderlich. [CMC-Tarife](https://coinmarketcap.com/api/pricing/) · [CMC-Endpunkt](https://coinmarketcap.com/api/documentation/pro-api-reference/global-metrics) · [CMC-Nutzungsbedingungen](https://pro.coinmarketcap.com/user-agreement-commercial/) · [CNN-Index](https://edition.cnn.com/markets/fear-and-greed) · [CNN Content Sales](https://commercial.cnn.com/our-solutions/content-sales/).

## Delta ab `88f5fc83` · 27.11.2026

**SW348 auf [Main `4e3e4a25`](https://github.com/joke0071/foliolab-open/commit/4e3e4a256ce0d81946ed6907b965d1f30aac33fe) produktiv bestätigt. 6/6 Kernbereiche, 18 → 18 von 29 Folgepaketen.** `/`, `/index.html` und `/sw.js` stimmen bytegleich mit Main überein. Sechs offene PRs, null laufende, eingereihte oder wartende Actions-Läufe beim Einstieg. Keine Produktänderung. [Strukturierter Prüfbeleg](release-evidence/sw348-followup-execution-2026-11-27.json).

**#159 · Zeitpräzision des Portfolio-Originals.** Zwei bytegleiche Kopien der autorisierten Portfolio-Sicherung bestätigen beim lokalen Abgleich beide SOL-Zeilen des Bestandsabgleichs. Die freie und die native Stake-Position tragen `position.date` mit dem Kalendertag **18.10.2026**. Acht Stichtagssicherungen führen dieselben SOL-Mengen und das Positionsdatum fort. Erstellzeit der jeweiligen Stichtagssicherung, letzter Kursrefresh und Exportzeit sind gesonderte UTC-Zeitstempel. Die Positionsdaten enthalten weder Ablesezeit noch Zeitzone noch Slot. Unter Europe/Vienna umfasst der Kalendertag die finalisierten Slots 458194430 bis 458592880. Unter UTC umfasst der Kalendertag die finalisierten Slots 458227565 bis 458626069. Die beiden Fenster sind wegen der ungeklärten Zeitzone bedingt. [Solana-Blockzeit](https://solana.com/docs/rpc/http/getblocktime) · [Finalisierter Block](https://solana.com/developers/docs/rpc/http/getblock).

Ein historischer Bestand für beide Konten wurde vor einem Download auf Abdeckung und Zugänglichkeit geprüft. Der Oktober-2026-Accountindex von solarchive und sein Transaktionsindex zum Stichtag lieferten HTTP 404. Die GCS-Warehouse-Listen verlangen ein abrechenbares Projekt, Pipe verlangt einen Schlüssel. Der [Old-Faithful-Blockbestand](https://docs.old-faithful.net/usage/rpc-server) deckt Block- und Transaktionsdaten ab. Für ein Replay fehlt ein zugänglicher belegter Ausgangszustand mit lückenloser Abdeckung aller Änderungen bis zum Zielslot. Der im Replay-Projekt dokumentierte Beispielstand benötigt 63 GB komprimierten Snapshot und 838,6 GB Ledger. Alchemy bietet historische Kontodaten im bezahlten Tarif. Ein direkter exakter Stichtagsabruf bei Trawl ist kostenpflichtig. Private Adressen, Signaturen und Stake-Kennungen wurden ausschließlich lokal verarbeitet. [Snapshot-Katalog](https://solarchive.org/#download-data) · [Replay-Beispiel](https://github.com/andreisilviudragnea/solana-replay-history) · [Pipe](https://pipe.network/solana/services/history-api) · [Trawl](https://trawl.run/faq).

**#174 · Gebuchtes USD→EUR-Original.** Die Kategorisierung nach Handelsreferenzen im autorisierten Ledger-Export ergab genau eine native direkte FX-Gruppe. Die Gruppe hat drei verschiedene Ledger-IDs mit gemeinsamer Buchungssekunde in UTC. Eine USD-Belastung und eine EUR-Gutschrift bestimmen die beobachtete Richtung und implizite Rate. Die dritte Buchung weist bei einem Bruttobetrag von null eine positive Gebühr im separaten Ledger-Asset `FEE` aus. Die Nettoänderung je Asset entspricht exakt der Differenz zum vorherigen gebuchten Saldo. Eine separate Valuta ist im Export nicht enthalten. Für die Gegenrichtung EUR→USD gab es keine direkte Referenzgruppe. Die gepaarten öffentlichen Testexporte enthalten keine EUR/USD-Gruppe. Der native Trades-Export zur Originalgruppe fehlt. Order, mehrere Ausführungen und bestätigter Ausführungskurs bleiben bis zur Zuordnung über `ordertxid`, Trade-ID und Ledger-IDs offen. [Kraken Trades](https://support.kraken.com/articles/360001184886-how-to-interpret-trades-history-fields) · [Kraken Ledger](https://support.kraken.com/articles/360001169383-how-to-interpret-ledger-history-fields) · [Öffentliche Testexporte](https://github.com/dcdpr/taxcount/tree/17ff30ea85497e91b01b3112da101ad81d67d0a4/references/kraken-tests).

| Paket | Delta | Kleinster nächster Eingang |
| --- | --- | --- |
| [#159](https://github.com/joke0071/foliolab-open/issues/159) | Portfolio-Original und Derivat exakt zugeordnet. Datumspräzision und Slotfenster qualifiziert. Historischer Kontozustand bleibt offen. [Snapshot-Katalog](https://solarchive.org/#download-data) · [Replay](https://github.com/andreisilviudragnea/solana-replay-history) | Freier Wallet-Saldo, Lamports des individuellen Stake-Kontos und historische StakeStateV2-Delegation am selben finalisierten Slot des fachlichen Stichtags. Bei weiter offenem Zeitpunkt den unveränderten Zustand über das belegte Tagesfenster nachweisen oder einen zeitlich zugeordneten Originalbeleg verwenden. Danach den regulären Import einschließlich Gebühr, Reward, Wiederimport, Rücknahme und verschlüsseltem Restore prüfen. |
| [#174](https://github.com/joke0071/foliolab-open/issues/174) | Ein nativer USD→EUR-Ledgerfall mit separater Gebühr und drei exakt abgeglichenen Saldenänderungen. EUR→USD fehlt im geprüften Originalbestand. Die Order- und Fill-Ebene bleibt offen. [Kraken Trades](https://support.kraken.com/articles/360001184886-how-to-interpret-trades-history-fields) · [Kraken Ledger](https://support.kraken.com/articles/360001169383-how-to-interpret-ledger-history-fields) | Nativer Trades-Export zur identifizierten Kraken-Ledgergruppe mit separaten Ausführungs-IDs derselben Order und vollständigem Ledger-ID-Abgleich. Alternativ ein zusammengehöriges natives FX-Order-/Cash-Paar. Danach beide Dateireihenfolgen, Wiederimport, Rücknahme und verschlüsselten Restore prüfen. |
| [#148](https://github.com/joke0071/foliolab-open/issues/148) | Die Timeline zu #6103 verweist auf einen PDF-Fix. Die zugehörigen Dateien und ein weiterer öffentlicher Vorgang desselben Melders lieferten keinen passenden nativen App-CSV. Die vorhandenen Bitpanda-Archive enthalten einen Gesamtnachweis und die Ledger-Auswertung ohne den unabhängigen Cash-Saldo und ohne Nachweis aller Index-Einzelmengen. [Österreichische Abrechnung](https://github.com/portfolio-performance/portfolio/issues/6103) · [PDF-Fix](https://github.com/portfolio-performance/portfolio/pull/6008) | Nativer App-CSV zur österreichischen Einzelabrechnung aus #6103. Für Bitpanda separat unabhängiger Cash-Saldo und BCI25-Einzelmengen zum selben Stichtag. |
| [#129](https://github.com/joke0071/foliolab-open/issues/129) | Öffentliches flatex-AT-Jahresbeispiel und Original-Dokumenttypen geprüft. Der Erläuterungsartikel veröffentlicht keinen zuordenbaren Detailbeleg desselben Depots. [Jahresreport](https://www.broker-test.at/news/steuerreporting-flatex-oesterreich/) · [flatex-Dokumenttypen](https://www.flatex.at/service/faqs/detail/steuern/allgemein-zu-steuern/welche-steuerdokumente-werden-ausgegeben/) | Jahresreport und zugehörige Einzel-, Quartals- oder Erträgnisaufstellung desselben Depots und Steuerjahrs. Dazu fallbezogene unabhängige Fachprüfung der Kostenbasis. |
| [#177/#256](https://github.com/joke0071/foliolab-open/issues/256) | In der verfügbaren Linux- und Chrome-Umgebung ist kein zugängliches physisches Android-Gerät vorhanden. | Reservierbarer physischer Android-Geräteplatz für Standalone-PWA, kontrolliertes Prozessende und nachweislich netzlosen Neustart mit der 10.000er-Fixture. |
| [#44/#254](https://github.com/joke0071/foliolab-open/issues/254) | Derselbe fehlende physische Geräteplatz. Kein beobachtetes OS-Ereignis im Delta. | Physisches Gerät mit beobachteter OS-Speicherbereinigung und getrenntes physisches Android-Zielgerät für den Restore aus der übertragenen verschlüsselten Datei. |
| [#298](https://github.com/joke0071/foliolab-open/issues/298) | Kein persistentes natives Safari-Profil sichtbar. Live-HTML liefert weiterhin keinen CSP- oder X-Frame-Options-Antwortheader. DNS führt über helloly zu GitHub Pages. | Persistentes natives Safari-Profil über reale Nutzungstage für ITP. Separat autorisierter HTTP-Auslieferungsweg für Antwortheader auf exakt foliolab.unperfekt.at. |
| [#124](https://github.com/joke0071/foliolab-open/issues/124) | Der im AWS-Datenregister dokumentierte Xetra-S3-Bucket liefert anonym sowohl beim Listing für den Ersthandelstag als auch beim Abruf der geprüften historischen Objekte HTTP 403. Das Register nennt die nichtkommerzielle Lizenz. [AWS-Datenregister](https://registry.opendata.aws/deutsche-boerse-pds/) | Rechtlich abgedeckte Reihe für IE00BK5BQT80 auf Xetra in EUR ab 25.07.2019 einschließlich Kapitalmaßnahmen oder lizenzierte Teilreihen mit ausreichend belegter Überlappung. |
| [#405](https://github.com/joke0071/foliolab-open/issues/405) | CMC dokumentiert integrierte Produktnutzung und temporären Cache. Die Bedingungen gewähren keine eigenständige Datendistribution. Für die geplante separat abrufbare Pages-Datei ist kein konkret anwendbares Recht nachgewiesen. Kein autorisierter Projekt-Key oder freigegebener CNN-Datenweg hinzugekommen. [CMC-Bedingungen](https://pro.coinmarketcap.com/user-agreement-commercial/) · [CNN Content Sales](https://commercial.cnn.com/our-solutions/content-sales/) | Autorisierter CMC-Projektabruf und belegter Anzeigeumfang für den konkreten Pages-Auslieferungsweg. Separat ein offiziell freigegebener CNN-Feed oder Embed mit passendem Anzeigeumfang. |
| [#268](https://github.com/joke0071/foliolab-open/issues/268) | Im Delta seit dem Übergabekommit kein neuer autorisierter privater Eingang. Die archivierte öffentliche Prüfung bleibt erledigt. | Zusammengehöriger erster Provider-Rohbody, Originalcursor und unveränderte Folgeantwort des Privatfalls. |
| [#160/#427](https://github.com/joke0071/foliolab-open/pull/427) | Der Draft hat den erwarteten Head, null Reviews und Threads sowie keine angeforderten Reviewer. Enrollment und Remote-Write bleiben gesperrt. | Unabhängiger Reviewbefund zum Head 84ef0b3746d48f24a7b130ecce80c6409f579463. Nach Sicherheitsfreigabe autorisierte OAuth-Origin, Testkonto und zwei geeignete Geräte für Schreiben, unabhängigen Readback, Konflikt und Widerruf. |

## Delta ab `74c68fd6` · 27.11.2026

**SW348 auf [Main `4e3e4a25`](https://github.com/joke0071/foliolab-open/commit/4e3e4a256ce0d81946ed6907b965d1f30aac33fe) produktiv bestätigt. 6/6 Kernbereiche und 18 → 18 von 29 Folgepaketen.** `/`, `/index.html` und `/sw.js` sind bytegleich mit Main. Sechs offene PRs und null laufende, eingereihte oder wartende Actions-Läufe. Der letzte abgeschlossene Lauf ist der erfolgreiche [AVD-Startvergleich](https://github.com/joke0071/foliolab-open/actions/runs/45947703618). [Strukturierter Delta-Beleg](release-evidence/sw348-followup-execution-2026-11-27.json).

**#159 · Original-Teilnachweis für eine SOL-Delegation.** Der native Export enthält 17 Staking-Vorgänge mit Zeit, Transaktionsreferenz, Betrag und Gebührenfeld. Ein Fenster mit 71 finalisierten Slots wurde anhand der dokumentierten Sekunde auf zwei Blöcke eingegrenzt. Der lokale Referenzabgleich ergab genau einen Treffer. Die erfolgreiche Transaktion eröffnete das individuelle Stake-Konto, initialisierte es und delegierte. Die Delegationsautorität stimmt mit der Ledger-Wallet überein. Die freien und gebundenen Vorher-/Nachher-Salden sind unabhängig im Block belegt. Der freie Abgang abzüglich Netzwerkgebühr entspricht exakt der Einzahlung ins Stake-Konto. Im Ledger-CSV entsprach `Operation Amount` bei allen sechs Delegationen der Gebühr. Für den Treffer stimmt diese zusätzlich mit der Netzwerkgebühr überein. [Solana-Blockformat](https://solana.com/docs/rpc/http/getblock) · [LedgerHQ zur Wertesemantik](https://github.com/LedgerHQ/ledger-live/blob/63fab1fa6e64cdf76d9b05ee77d45dd78875b12c/libs/coin-modules/coin-solana/src/logic/listOperations.ts#L591-L597).

Für die erste Folgeepoche ergab der vollständig zugeordnete Ausschüttungspartitionsblock keinen Eintrag für dieses Stake-Konto. Für die zweite Folgeepoche enthält er einen positiven Staking-Reward samt Nachsaldo. Ein weiterer Rewards-Block vor dem späteren Portfolio-Stichtag enthält ebenfalls einen positiven Reward und Nachsaldo für dasselbe Stake-Konto. Die Partition wurde lokal aus öffentlichem Blockhash und Partitionszahl bestimmt und anhand der übrigen Rewards im selben Block überprüft. Die RPC-Anfragen enthielten ausschließlich öffentliche Slot- und Bereichsparameter. [Solana-Rewardspezifikation](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0118-partitioned-epoch-reward-distribution.md) · [Referenzimplementierung des Partitionierers](https://docs.rs/solana-epoch-rewards-hasher/latest/src/solana_epoch_rewards_hasher/lib.rs.html).

Im normalen CSV-Dialog von SW348 zeigte der Originalexport 357 Quellzeilen. Die Übernahme war gesperrt. Öffnen und Abbruch ließen den vollständigen IndexedDB-Datensatz einschließlich Revision unverändert. Der Chromium-Test lief über Loopback und erfasste keine externen Anfragen. 27 lokale Ledger-, Kraken- und gemeinsame Importtests bestanden. Für die Paketabnahme fehlen am späteren Portfolio-Stichtag der unabhängige freie Wallet-Saldo und der belegte Stake-Kontostand mit historischem Delegationszustand im selben Slot. Danach folgt der reguläre Produktpfad für finanzielle Verbuchung, Wiederimport, Rücknahme und Restore.

| Paket | Ergebnis und nächster entscheidender Eingang |
| --- | --- |
| [#174](https://github.com/joke0071/foliolab-open/issues/174) | Der ausgelieferte gemeinsame Import erkennt DEGIRO nicht. Im unterstützten flatex-AT-Pfad ergaben die beiden vorhandenen Originalexporte 401 erkannte Depotorders mit jeweils einem EUR-Kontobeleg. Keine enthielt Fremdwährung oder mehrere separat identifizierte Ausführungen. Der vorhandene Kraken-Ledgerexport enthält 219 EUR-/USD-Handelsbeine. Ein zusammengehöriger Trades-Export fehlt und SW348 erkennt diesen Exporttyp noch nicht im gemeinsamen Import. Nächster Eingang ist ein natives Order-/Cash-Paar mit dokumentierter FX-Teilfüllung, separaten Ausführungsschlüsseln, Valuta, Gebühren und gebuchtem Netto. [Kraken-Quellschlüssel](https://support.kraken.com/articles/360001184886-how-to-interpret-trades-history-fields). |
| [#177/#256](https://github.com/joke0071/foliolab-open/issues/256) | Kein geeigneter Geräteplatz in den verfügbaren Projektressourcen oder neuen Projekteingängen sichtbar. Linux-Sitzung ohne ADB und USB-Gerätebus. Nächster Eingang ist ein reservierbares physisches Android-Gerät mit PWA-Installation sowie Prozess- und Netzsteuerung. |
| [#44/#254](https://github.com/joke0071/foliolab-open/issues/254) | Für Recovery ist derselbe Platz mit beobachtbarer OS-Speicherbereinigung und zusätzlich ein physisch separates Android-Zielgerät für den verschlüsselten Restore erforderlich. |
| [#298](https://github.com/joke0071/foliolab-open/issues/298) | Kein persistentes natives Safari-Profil in den verfügbaren Sitzungen. Die Produktion liefert weiterhin keinen CSP- oder X-Frame-Options-Antwortheader. CNAME verweist auf GitHub Pages, autoritatives DNS auf helloly. Die nächste ITP-Entscheidung benötigt ein persistentes natives Safari-Profil über reale Nutzungstage. Der Header-Teil benötigt einen autorisierten HTTP-Auslieferungsweg auf exakt dieser Origin. |
| [#148](https://github.com/joke0071/foliolab-open/issues/148) | Eine neue öffentliche Einzelabrechnung nennt ausdrücklich Trade Republic Branch Austria. Der native App-CSV zum selben Vorgang fehlt im Issue und dessen Kommentar. Für den separaten Bitpanda-Fall fehlen weiterhin unabhängiger Cash-Saldo und BCI25-Einzelmengen zum selben Stichtag. [Österreichische Abrechnung](https://github.com/portfolio-performance/portfolio/issues/6103). |
| [#129](https://github.com/joke0071/foliolab-open/issues/129) | Der veröffentlichte flatex-Jahresreport und die verlinkte Übersicht liefern keinen zugeordneten Einzel- oder Quartalsbeleg desselben Depots. Nächster Eingang ist dieser zusammengehörige Satz für ein Steuerjahr mit belegbarer Kostenbasis. Die unabhängige Fachprüfung des konkreten Falls folgt separat. [Jahresreport](https://www.broker-test.at/news/steuerreporting-flatex-oesterreich/) · [Reportübersicht](https://www.broker-test.at/news/steuerreports-31-maerz/) · [flatex-Dokumenttypen](https://www.flatex.at/service/faqs/detail/steuern/allgemein-zu-steuern/welche-steuerdokumente-werden-ausgegeben/). |
| [#124](https://github.com/joke0071/foliolab-open/issues/124) | Xetra bestätigt den Ersthandel von IE00BK5BQT80 am 25.07.2019. Das AWS-Register nennt nichtkommerzielle Anzeigerechte für den eingestellten Datensatz. Die offizielle Repository-Verlinkung liefert 404. Drei erreichbare Projektkopien enthielten keine passenden VWCE-Handelsdateien. Benötigt ist eine rechtlich abgedeckte Xetra-/EUR-Reihe ab Ersthandel mit Kapitalmaßnahmen oder ein Archiv und eine zulässige Anschlussquelle mit belegter Überlappung. [Börsenmitteilung](https://www.cashmarket.deutsche-boerse.com/resource/blob/1591188/a542df1ae2684b5c12f554f0295aabe0/data/Introduction_notice.pdf) · [Datenregister](https://registry.opendata.aws/deutsche-boerse-pds/). |
| [#405](https://github.com/joke0071/foliolab-open/issues/405) | CMC nennt integrierte Produktnutzung im Basic-Tarif und dokumentiert periodisches Caching. Ein autorisierter Projektzugang und die Erlaubnis für die konkret geplante öffentlich erreichbare Pages-Datei waren nicht nachweisbar. Separat war kein offiziell freigegebener CNN-Feed oder Embed mit dem benötigten Anzeigeumfang verfügbar. [CMC-Tarif](https://coinmarketcap.com/api/pricing/) · [Caching](https://coinmarketcap.com/api/documentation/guides/best-practices) · [CNN-Lizenzierung](https://commercial.cnn.com/our-solutions/content-sales/). |
| [#268](https://github.com/joke0071/foliolab-open/issues/268) | Seit dem Checkpoint kein einschlägiger neuer autorisierter Eingang in Drive, Library oder Mail. Benötigt werden der unveränderte erste Rohbody mit Originalcursor und die zugehörige originale Folgeantwort, gegebenenfalls gemeinsam in einem HAR. |
| [#160/#427](https://github.com/joke0071/foliolab-open/pull/427) | Draft-Head `84ef0b37` hat keine Reviews, Threads, Gesprächskommentare oder angeforderten Reviewer. Nächster Eingang ist der unabhängige Befund zum exakten Commit. Für die spätere Live-Abnahme werden die autorisierte OAuth-Origin, ein Testkonto und zwei geeignete Geräte für Schreiben, Readback, Konflikt und Widerruf benötigt. |

## Delta ab `ee0c0027` · 27.11.2026

**SW348 auf [Main `4e3e4a25`](https://github.com/joke0071/foliolab-open/commit/4e3e4a256ce0d81946ed6907b965d1f30aac33fe) produktiv bestätigt. 6/6 Kernbereiche und 18 → 18 von 29 Folgepaketen.** `/`, `/index.html` und `/sw.js` wurden erneut byteweise mit dem Commit verglichen. Sechs offene PRs (`#430`, `#429`, `#427`, `#350`, `#348`, `#161`) und keine laufenden, eingereihten oder wartenden Jobs. Der jüngste abgeschlossene Lauf war der erfolgreiche [AVD-Startvergleich](https://github.com/joke0071/foliolab-open/actions/runs/45947703618). [Maschinenlesbarer Delta-Beleg](release-evidence/sw348-followup-execution-2026-11-27.json).

| Paket | Beobachtung seit dem Einstieg | Kleinster fehlender Eingang |
| --- | --- | --- |
| #174 · Broker-FX | Über [Importer-PR #5998](https://github.com/portfolio-performance/portfolio/pull/5998) und [#6116](https://github.com/portfolio-performance/portfolio/pull/6116) zur [Originalspur im Forum](https://forum.portfolio-performance.info/t/pdf-import-von-flatex/1752/400). Der Anhang bestätigt einen gemeinsamen Orderstamm, die Ausführungssuffixe 1/2, 272/28 Stück und je 1.545,15/161,59 EUR. Die Abrechnung kündigt die Kontobuchung zum Valutatag an. Keine entsprechende gebuchte Bewegung in den geprüften Folgediskussionen und Belegen. Durchgesehen wurden 929 öffentliche Beiträge über flatex DE, flatex AT, Consorsbank und Trade Republic sowie 34 Dokumentanhänge. Die verlinkte [Consors-Ergänzung](https://github.com/portfolio-performance/portfolio/pull/6037) behandelt eine USD-Dividende. | Gebuchte EUR-Kontobewegung zur selben Order. Für die Vollabnahme zusammengehörige native Belege im unterstützten FolioLab-Profil. |
| #298 · Safari | Produktion liefert weiterhin weder CSP-Antwortheader noch X-Frame-Options. Die Subdomain zeigt per CNAME auf GitHub Pages. GitHub-Standardrunner haben ein Limit von sechs Stunden je Job und starten je Job frisch. Der [native VoiceOver-Nachweis](https://github.com/joke0071/foliolab-open/actions/runs/45946083164/artifacts/15174233578) bleibt gültig. [Runner-Grenzen](https://docs.github.com/en/actions/reference/limits) · [Runner-Lebensdauer](https://docs.github.com/en/actions/concepts/runners/github-hosted-runners). | Autorisierter Auslieferungsweg mit HTTP-Headern auf der Produktiv-Origin. Separat ein natives, persistentes Safari-Profil für den realen ITP-Zeitraum. |
| #177/#256 · Android-Start | Android Device Streaming erfordert Berechtigungen auf einem Firebase-Projekt. AWS dokumentiert physische Geräte, Remote-ADB und einmalig 1.000 Testminuten. In den verfügbaren Projektzugängen war kein buchbarer Platz für die Messung vorhanden. [Firebase](https://developer.android.com/studio/run/android-device-streaming) · [AWS Remote Access](https://docs.aws.amazon.com/devicefarm/latest/developerguide/remote-access.html) · [Testkontingent](https://aws.amazon.com/device-farm/pricing/). | Physischer Android-Geräteplatz mit PWA-Installation und Steuerung von Prozessende und Offlinebetrieb. |
| #44/#254 · Android-Recovery | Die Transfer- und Restore-Prüfung bestand im [AVD-Teilbeleg](https://github.com/joke0071/foliolab-open/actions/runs/45944970160/artifacts/15174901169). Der Gesamtlauf endete mit Fehler. Der separate abschließende Startvergleich war erfolgreich. Die physischen Zugangswege sind dieselben wie für den Start. | Erstes physisches Android-Gerät für Recovery mit beobachtbarer OS-Speicherbereinigung und separates physisches Zielgerät für den verschlüsselten Restore. |
| #148 · Regionalimporte | In 61 zugänglichen Beiträgen des [TR-Importer-Threads](https://forum.portfolio-performance.info/t/import-trade-republic-csv-transaktionsexport/39126/52) ist der CSV-Export der einzige Dokumentanhang. Die folgenden Beiträge erläutern Differenzen und den Importer-Fix. [PR #6149](https://github.com/portfolio-performance/portfolio/pull/6149) enthält CSV und Implementierung ohne Einzelabrechnung. Kein neuer passender Bitpanda-Archiveingang. | Regionale Einzelabrechnung zum selben CSV-Vorgang. Separat unabhängiger Bitpanda-Cash-Saldo und BCI25-Einzelmengen zum selben Stichtag. |
| #159 · Ledger-Staking | Der autorisierte Archivabgleich seit dem Checkpoint ergab keinen neuen zuordenbaren Eingang. | Individuelles Stake-Konto mit Transaktionsreferenz und unabhängigen Vorher-/Nachher-Salden zur vorhandenen Ledger-Delegation samt Gebühren und Rewards. |
| #129 · AT-Steuern | Die [Originalspur #5242](https://github.com/portfolio-performance/portfolio/issues/5242) hat keinen späteren zugeordneten Jahresreport. [flatex AT](https://www.flatex.at/service/faqs/detail/steuern/allgemein-zu-steuern/welche-steuerdokumente-werden-ausgegeben/) unterscheidet jährliches Steuerreporting und detaillierte Erträgnisaufstellung. | Jahresreport und Einzel- oder Quartalsbelege desselben Depots und Steuerjahrs plus unabhängige Fachprüfung des konkreten Falls. |
| #268 · ETH-Cursor | Delta der autorisierten Archive ohne neuen einschlägigen Eingang. Der öffentliche Seitenwechsel ist abgenommen. | Rohe erste Providerantwort und die zugehörige originale Folgeseite des Privatfalls. |
| #124 · VWCE | Die [Twelve-Data-Bedingungen](https://twelvedata.com/terms) knüpfen externe Anzeige und Weitergabe an Tarif, Rechte und Börsenbedingungen. Kein öffentliches Anzeigerecht für die geforderte Gratisreihe belegt. | Öffentlich anzeigbare, kapitalmaßnahmenbereinigte VWCE/Xetra/EUR-Reihe ab Ersthandel. |
| #405 · Fear & Greed | Offizielles CMC Keyless lieferte im serverseitigen Abruf HTTP 200, einen numerischen Wert und Aktualisierung um 06:53:10 UTC. Die Anfrage mit FolioLab-Origin lieferte HTTP 429. CMC verweist für Produktion auf einen registrierten API-Plan. Die offizielle CNN-Lizenzseite führt Content-Partnerschaften. Ein freier Originalfeed mit Anzeigerecht ist weiter unbelegt. [CMC-Tarife](https://coinmarketcap.com/api/pricing/) · [CNN Content Sales](https://commercial.cnn.com/our-solutions/content-sales/). | Autorisierter CMC-Basic-Zugang samt serverseitigem Produktpfad. Separat offizieller CNN-Feed samt öffentlichem Anzeigerecht. |
| #160/#427 · Drive | Der [Reviewauftrag](https://github.com/joke0071/foliolab-open/pull/427) steht auf `84ef0b37`, ohne eingereichte Reviews, Threads, Gesprächskommentare oder angeforderte Reviewer. | Unabhängige Sicherheitsfreigabe für diesen Commit. Anschließend freigegebene OAuth-Origin, Testkonto und zwei geeignete Geräte für Schreiben, unabhängigen Readback, Konflikt und Widerruf. |

Bei unveränderter Produktversion sind der öffentliche Cosmos- und ETH-Abgleich, die native VoiceOver-Prüfung, die 30 AVD-Starts und der virtuelle Zwei-Geräte-Restore erledigt. Die genannten Foren und Anhänge liefern erst mit einer neuen Ergänzung oder einem unabhängig zugeordneten Beleg einen weiteren Prüfauftrag.

## Ausführung am 27.11.2026

**SW348 auf [Main `4e3e4a25`](https://github.com/joke0071/foliolab-open/commit/4e3e4a256ce0d81946ed6907b965d1f30aac33fe) produktiv bestätigt. 6/6 Kernbereiche und 18 → 18 von 29 Folgepaketen.** Startseite, `/index.html` und Service Worker stimmen bytegleich mit Main überein. [Messwerte und Rohbelege](release-evidence/sw348-followup-execution-2026-11-27.json).

| Paket | Ausgeführt und beobachtet | Kleinster fehlender Eingang |
| --- | --- | --- |
| [#174](https://github.com/joke0071/foliolab-open/issues/174) · Broker-FX | Der Consorsbank-USD-Sparplan liefert nur Abrechnungsdaten. In 581 Portfolio-Performance-Fixtures der vier geprüften Brokergruppen lag ein besserer [flatex-DE-Kandidat](https://github.com/portfolio-performance/portfolio/commit/0f640515583efc158549c90bf931d698a8c99b52) vor. Zwei USD-Fills derselben Order über 272 und 28 Stück. FX-Richtung, Gebühren, Steuererstattungen und die ausgewiesenen EUR-Endbeträge von 1.545,15 und 161,59 wurden anhand der Zeilen unabhängig nachgerechnet. Der im selben Commit veröffentlichte Kontoauszug stammt aus einem anderen Fall. | Nativer Ausführungsexport und gebuchte Nettobewegung derselben Order im unterstützten Profil. Für Consorsbank fehlt der passende Fill-Export. |
| [#298](https://github.com/joke0071/foliolab-open/issues/298) · Safari, Header, ITP | **Safari-/VoiceOver-Teilprüfung bestanden.** Die tatsächliche Ansage und der Fokusweg wurden in Safari 27.2 auf macOS 15.8.2 mit dem lokal beobachteten SW348 festgehalten. Die Kontrolle, „link Direkt zum Inhalt“, das Fokusziel `#mainContent` sowie die Ansagen „Übersicht“, „Positionen“ und „Buchungen“ stehen im [Originalprotokoll](https://github.com/joke0071/foliolab-open/actions/runs/45946083164/artifacts/15174233578). Separater Live-Test bestätigte HTTP 200 ohne CSP-Antwortheader und X-Frame-Options sowie die FolioLab-Übersicht in einem fremden Chromium-Frame. CNAME zeigt auf GitHub Pages. Der autoritative DNS-Anbieter helloly zeigte seine Anmeldung. | Autorisierter headerfähiger Auslieferungsweg für die Produktivdomain. Für ITP ein persistentes natives Safari-Profil für den realen Zeitablauf. |
| [#177/#256](https://github.com/joke0071/foliolab-open/issues/256) · Android-Start | SW321 und SW348 bestanden auf **demselben Android-14-AVD mit Chrome 113.0.5672.136** je fünf Kaltstarts, Warmstarts und netzlose Starts im Chrome-Tab. Bis zur ersten bestätigten Aktion lagen die Mediane bei **13,01 → 8,31 s** kalt, **4,60 → 4,44 s** warm und **8,69 → 8,65 s** offline. Alle 30 Starts behielten denselben Finanzbestand mit 10.000 Buchungen, 10.000 Journalen und 1.000 EUR. Der Warmstart benutzte pro Stand denselben aktiven Tab. Offline waren Flugmodus aktiv, WLAN und mobile Daten aus sowie der jeweilige Testserver und der zugehörige ADB-Tunnel abgestellt. [Rohwerte, Streuung und Gerätekonfiguration](https://github.com/joke0071/foliolab-open/actions/runs/45947703618/artifacts/15175303794). | Autorisiertes physisches Android-Gerät für PWA-Installation, Prozessende und nachweislich netzlose Starts. Samsung listet Geräte, der Zugriff über RDB setzt eine authentifizierte Reservierung voraus. |
| [#44/#254](https://github.com/joke0071/foliolab-open/issues/254) · Recovery | **Virtueller Zwei-Geräte-Fall bestanden.** SW348 exportierte über die Anwendungsoberfläche. Ein frisches AVD erhielt nur die verschlüsselte Datei und stellte sie über Android DocumentsUI wieder her. 10.000 Buchungen und Journale, 1.000 EUR, erwarteter leerer Wallet-Verlauf und identischer kanonischer Bestand. Zielrevision 1 → 2 und nach Prozessneustart unverändert 2. [CI-Job und Originalartefakt](https://github.com/joke0071/foliolab-open/actions/runs/45944970160/artifacts/15174901169). | Autorisiertes physisches Gerät mit beobachtbarer OS-Speicherbereinigung und ein separates physisches Zielgerät. |
| [#148](https://github.com/joke0071/foliolab-open/issues/148) · Regionalimporte | [TR-Originalexport aus dem Importer-Fall](https://forum.portfolio-performance.info/t/import-trade-republic-csv-transaktionsexport/39126/52) mit 111 Zeilen. Der angehängte Screenshot zeigt die Vorschau des Fremdimporters. Eine separat veröffentlichte Abrechnung einer anderen Person hat abweichende Stückzahl und Auszahlung. Der normale Live-Dialog von SW348 klassifizierte 0 bereit und 111 zu prüfen. Die Übernahme war gesperrt. Separat ergab der neue Eingangsabgleich keinen Bitpanda-Stichtagsbeleg. | Regional zugeordnete TR-Einzelabrechnung und CSV desselben Vorgangs. Für Bitpanda ein unabhängiger Cash-Saldo und BCI25-Einzelmengen zum selben Stichtag. |
| [#159](https://github.com/joke0071/foliolab-open/issues/159) · Ledger-Staking | Der [lokale Abgleich der zwei Originalexporte](#ledger-stake-abgleich-nach-der-live-freigabe) bleibt gültig. Der native Ledger-CSV-Writer wurde auf die verfügbaren Identitätsfelder geprüft. Der neue Archivabgleich lieferte keine passende Kettenantwort. | Individuelle Stake-Kennung mit unabhängigen Kettensalden vor und nach derselben datierten Delegation, verknüpft mit dem vorhandenen Ledger-Export. |
| [#129](https://github.com/joke0071/foliolab-open/issues/129) · AT-Steuern | Das [flatex-AT-Importer-Issue](https://github.com/portfolio-performance/portfolio/issues/5242) liefert Einzelvorgänge und Steuerreferenzen für Dezember 2025. Zum öffentlich gezeigten Jahresreport ist keine Depotzuordnung und kein zusammengehöriger Satz belegt. | Jahresreport und Einzel- oder Quartalsbelege desselben Depots und Steuerjahrs plus unabhängige fallbezogene Fachprüfung der Kostenbasis. |
| [#268](https://github.com/joke0071/foliolab-open/issues/268) · ETH-Cursor | Öffentlicher Seitenwechsel produktiv abgenommen. Die seit dem Checkpoint neu verfügbaren Projektdateien enthielten kein historisches privates Antwortpaar. | Rohe erste Providerantwort mit ursprünglichem Cursor und die unveränderte zugehörige Folgeseite. |
| [#124](https://github.com/joke0071/foliolab-open/issues/124) · VWCE | Xetra-Unterlagen bestätigen VWCE / IE00BK5BQT80. [onvista](https://www.onvista.de/nutzungsbedingungen) begrenzt die Nutzung des CSV-Angebots auf eigene Zwecke. Über diesen Weg fehlt eine öffentliche Anzeigefreigabe. | Vollständige, kapitalmaßnahmenbereinigte VWCE/Xetra/EUR-Reihe ab Ersthandel einschließlich öffentlichem Anzeigerecht. |
| [#405](https://github.com/joke0071/foliolab-open/issues/405) · Fear & Greed | CMC dokumentiert die Produktintegration unter dem registrierten kostenlosen Basic-Plan. Der Keyless-Abruf lieferte HTTP 429. CNN nennt Lizenzpartnerschaften und ein offizieller Feed für FolioLab war nicht auffindbar. | Autorisierter CMC-Basic-Zugang für die serverseitige Integration und offiziell freigegebener CNN-Originalfeed samt Anzeigerecht. |
| [#160/#427](https://github.com/joke0071/foliolab-open/pull/427) · Drive-Gerätewechsel | Draft-Head `84ef0b37`. Keine Reviews, Threads, Gesprächskommentare oder angeforderten Reviewer. | Unabhängiges Sicherheitsreview auf dem konkreten Commit. Danach autorisierte OAuth-Origin, Testkonto und zwei geeignete Geräte für Commit, Readback, Konflikt und Widerruf. |

Die freien GitHub-Standardrunner lieferten die neuen Safari- und Android-Belege. Wiederholungen der öffentlichen Cosmos-/ETH-Prüfung, des virtuellen Android-Datei-Restores, des gepaarten AVD-Vergleichs und der genannten Quellenabgleiche sind erst bei einem geänderten Produktstand beziehungsweise einem neuen passenden Eingang erforderlich.

## Aktueller Einstieg

| Bereich | Verifizierter Stand |
| --- | --- |
| Main und Livefreigabe | **SW348 auf [Main `4e3e4a25`](https://github.com/joke0071/foliolab-open/commit/4e3e4a256ce0d81946ed6907b965d1f30aac33fe) LIVE_ACCEPTED**, [PR #443](https://github.com/joke0071/foliolab-open/pull/443), Tree `9af3806a`. [Vollständiger Live-Beleg](release-evidence/sw348-pr443-live-verified-2026-11-26.json). |
| Prüfbeleg | 1.546 Node-Tests, sechs Main-Integrationsjobs, 161 dateigleich geprüfte Pages-Dateien und 162 bytegleiche Live-Antworten. Der [öffentliche Cosmos-Viererfall](release-evidence/sw348-cosmos-four-live-2026-11-26.json) bestand in Chromium, Firefox und WebKit. |
| Paketstand | **6/6 Kernbereiche, 18/29 Folgepakete, elf offen.** Neu abgenommen ist die öffentliche Wallet-Zeile #119. Der private Portfolioabgleich hat einen eigenen Belegumfang. |
| Letzter Lauf | [Main-CI und Pages](https://github.com/joke0071/foliolab-open/actions/runs/45842736002) bestanden. Der reguläre Live-Job endete bei HTTP 429 am NEAR-Modul. Die [verifizierte Fortsetzung](https://github.com/joke0071/foliolab-open/actions/runs/45852139278/job/140020961381) schloss die ausstehenden Prüfungen auf demselben Main ab. |
| Nächster ausführbarer Auftrag | Die [Übernahmeprüfung](#übernahmeprüfung-nach-f51c391b--26112026) dokumentiert die elf konkreten Eingänge. Der öffentliche Cosmos-Fall ist produktiv abgeschlossen. |
| Arbeitsgrundlage | [SW345-Navigation und Cosmos](release-evidence/sw345-cosmos-history-release-2026-11-25.json) · [SW346-EUR-Stückrest](release-evidence/sw346-live-verified-2026-11-25.json) · [interne Produktvorschau](release-evidence/internal-preview-technical-acceptance-2026-11-26.json). |


## Übernahmeprüfung nach `f51c391b` · 26.11.2026

`main` stand vor dieser Dokumentationsänderung unverändert auf `4e3e4a256ce0d81946ed6907b965d1f30aac33fe`, der Arbeitszweig auf `f51c391b60bfa30e0a1c0ce18642c372a08864ba`. [PR #443](https://github.com/joke0071/foliolab-open/pull/443) bleibt der letzte produktiv abgenommene Stand. GitHub bestätigt Pages und den erfolgreichen [Live-Fortsetzungsjob](https://github.com/joke0071/foliolab-open/actions/runs/45852139278/job/140020961381). Die aktuelle Produktion lieferte `index.html` und `sw.js` mit HTTP 200 bytegleich zu Main. Worker `foliolab-open-v348`. [Releasebeleg](release-evidence/sw348-pr443-live-verified-2026-11-26.json). **Vorher und nachher 6/6 Kernbereiche und 18/29 Folgepakete.** Die sechs offenen PRs enthielten keinen neuen Releasekandidaten.

| Paket | Beobachtung aus der Übernahme | Voraussetzung für die nächste Abnahme |
| --- | --- | --- |
| #174 · Broker-FX | Die bekannten Consorsbank-Nettoabrechnungen bleiben der beste Ansatz. Das [zusätzliche öffentliche IBKR-Beispiel](https://github.com/portfolio-performance/portfolio/issues/4136) enthält eine einzelne FX-Ausführung mit `netCash=0` und ohne separate Nettobuchung. | Nativer Fill-Export derselben Consorsbank-Order oder gleichwertiges Originalpaar mit Teilfüllungen, gemeinsamer Order-ID, FX-Richtung, Gebühren und gebuchtem Netto. |
| #148 · Regionalimporte | [CSV-Fixture](https://github.com/blastik/trade-republic-importer-addon/blob/44aa70d26b1f02a7454db48e90ee0de85ec06d16/src/__fixtures__/tr-sample.csv) ohne Einzelabrechnung, [kombinierte Demo-CSV](https://github.com/dagap/trade-republic-pnl-ledger/blob/689d50d881799a8ac4226188cc5aad4954d95c87/data/demo.csv) und [fiktive Beispieldatenbank](https://github.com/ChriSch1/trfolio/blob/5e0167d17372f0b9205d07d729e1deb39df7c021/README.md). Die Projektordner enthalten keine neuen Bitpanda-Belege. | Regionaler TR-Originalexport und Einzelabrechnung desselben Vorgangs. Für Bitpanda unabhängiger Cash-Saldo und BCI25-Einzelmengen am selben Stichtag. |
| #129 · Steuerabgleich | [flatex AT](https://www.flatex.at/service/faqs/detail/steuern/allgemein-zu-steuern/welche-steuerdokumente-werden-ausgegeben/) bestätigt die optionale detaillierte Erträgnisaufstellung. In den verfügbaren Eingängen liegt kein zusammengehöriger Satz zum Jahresbeleg oder zum belegten Einzelereignis vor. | Jahresreport und zugehörige Einzelereignisse desselben Depots und Steuerjahrs sowie unabhängige Prüfung der fallbezogenen Kostenbasis. |
| #159 · Ledger/Staking | Die beiden bekannten Drive-Ordner enthalten dieselben Originalexporte und verschlüsselten Backups. Es ist keine neuere Fassung des privaten Fortsetzungsarchivs oder passende neue Datei auffindbar. | Datiertes natives Ledger-Original mit Stake-ID und unabhängigen Vorher-/Nachher-Salden derselben Delegation. |
| #268 · ETH-Cursor | Die Suche nach neuen Projektdateien und historischen Blockscout-/Cursor-Originalen ergab kein Seitenpaar. Der öffentliche Adapterbeleg aus SW348 gilt weiter. | Rohe erste Providerantwort mit Cursor und unveränderte zugehörige Folgeseite des historischen Falls. |
| #44/#254 · Recovery | Die [Runner-Einstellungen](https://github.com/joke0071/foliolab-open/settings/actions/runners) zeigen keinen eigenen Runner. Die angemeldete Firebase-Konsole bietet nur Projekteinrichtung und Demos. BrowserStack Live antwortet mit HTTP 403. | Autorisierter physischer Android-Platz mit beobachtbarem OS-Ereignis und physisch separates Gerät für den verschlüsselten Restore. |
| #177/#256 · Android-Startzeit | Dieselbe Zugangsprüfung. Die 10.000-Buchungen-Fixture bleibt verfügbar. | Ein physisches Android-Projektgerät mit Prozess- und Netzsteuerung für je fünf Kalt-, Warm- und Offline-Starts pro Vergleichsstand. |
| #298 · TRUST01 | [Pages](https://github.com/joke0071/foliolab-open/settings/pages) führt die Produktionsdomain. Die aktuelle HTML-Antwort enthält weder CSP noch X-Frame-Options. Cloudflare zeigt die Anmeldung. BrowserStack Live liefert keinen zugänglichen Safari-Platz. | Für die FolioLab-Origin autorisierte headerfähige Auslieferung und ein nativer Safari-/VoiceOver-Platz mit persistentem Profil für den ITP-Zeitfall. |
| #124 · Benchmark | Der [alte Xetra-Public-Data-Bestand](https://registry.opendata.aws/deutsche-boerse-pds/) ist eingestellt. Der öffentliche Bucket-Listenabruf antwortete mit HTTP 403 `AccessDenied`. [Twelve Data](https://support.twelvedata.com/en/articles/12682324-end-of-day-eod-pricing-market-data) verlangt für externe Weitergabe eine Zusatzfreigabe oder Vereinbarung. | Tatsächlich abrufbare, vollständige und kapitalmaßnahmenbereinigte VWCE/Xetra/EUR-Reihe ab Ersthandel mit dokumentiertem öffentlichem Anzeigerecht. |
| #405 · Sentiment | Der [offizielle CMC-Keyless-Endpunkt](https://coinmarketcap.com/api/documentation/pro-api-reference/global-metrics/) antwortete mit HTTP 429 und Provider-Code 1022. [CNN Content Sales](https://commercial.cnn.com/our-solutions/content-sales/) bietet Lizenzpartnerschaften, aber über diesen Weg liegt kein zugelassener Feed für das Projekt vor. | Autorisierter serverseitiger CMC-Zugang und anwendbare Nutzungsrechte. Freigegebener CNN-Originalfeed mit öffentlichem Anzeigerecht. |
| #160/#427 · Drive | [Draft #427](https://github.com/joke0071/foliolab-open/pull/427) steht auf `84ef0b3746d48f24a7b130ecce80c6409f579463`. Keine Reviews, Threads, Gesprächskommentare oder angeforderten Reviewer. Die administrative Kollaboratorenliste erfordert erneute GitHub-Bestätigung. | Benannter unabhängiger Prüfer und dokumentierte Sicherheitsfreigabe für den geprüften Stand. Danach autorisierte OAuth-Origin, Testkonto und zwei Geräte für Commit, unabhängigen Readback, Konflikt und Widerruf. |


### Fortsetzung ab `86a93873` · 26.11.2026

- **GitHub und Produktion.** Main `4e3e4a25` und der Arbeitszweig entsprachen vor diesem Eintrag der Übergabe. Die Actions-Abfrage zeigte null laufende und null wartende Läufe. [#427](https://github.com/joke0071/foliolab-open/pull/427) bleibt auf `84ef0b37` ohne eingereichtes Review, angeforderte Reviewer, Review-Thread oder Gesprächskommentar. Startseite und Worker waren beim erneuten Produktivabruf bytegleich mit SW348. **6/6 Kernbereiche und 18/29 Folgepakete vor und nach der Prüfung.**
- **#174.** Drei weitere DEGIRO-CSV-Beispiele geprüft. [Das 14-zeilige Beispiel](https://github.com/wirrike/degiro-portfolio/blob/f9fe58d9db5415b013ba552a1ff0a72428f4d8c1/examples/transactions.csv) enthält zwei GBX-Teilfüllungen mit gemeinsamer Order-ID und je 1,20 EUR ausgewiesenem Netto. Die [Quelldokumentation](https://github.com/wirrike/degiro-portfolio/blob/f9fe58d9db5415b013ba552a1ff0a72428f4d8c1/README.md) bezeichnet die Daten als künstlich. Ein separates gebuchtes Cash-Original fehlt. In den weiteren Dateien mit fünf und zwölf Zeilen wurde kein wiederholter nichtleerer Orderschlüssel gefunden.
- **#129.** Die [Diskussion zum veröffentlichten flatex-Jahresreport](https://www.broker-test.at/news/steuerreporting-flatex-oesterreich/) verweist zusätzlich auf quartalsweise Sammelreports. Im veröffentlichten Beispiel fehlt der zum Jahresreport gehörige Satz. Autorisierte quartalsweise Originale können den Abgleich beschleunigen, wenn sie dieselben Einzelereignisse desselben Depots und Steuerjahrs ausweisen.
- **#44/#254 und #177/#256.** Die zusätzliche Suche in Google Cloud Resource Manager endete in dieser Sitzung mit HTTP 403 vor der Projektliste. Die GitHub-Projektansicht zeigt weiterhin keinen eigenen Runner. Es wurde kein Android-Gerätelauf gestartet.
- **Weitere Eingänge.** In den geprüften Projektquellen und Nachrichten seit dem vorigen Checkpoint erschien kein neuer Originalbeleg oder dokumentierter Datenzugang. DNS zeigt für die Produktionsdomain weiterhin `joke0071.github.io`. Die tabellierten Voraussetzungen gelten weiter.

## Gemeinsame Belege und historische Ausgangslage

| Gemeinsam nutzbarer Eingang | Paket / auslösende Änderung | Arbeit bei verfügbarem Eingang |
| --- | --- | --- |
| Gerätezeit | Startperformance, Recovery, TRUST01, später FLH04 | Bereits autorisierte Sitzung anhand von Gerät, Offlinebetrieb, Persistenz und Zweitgerät prüfen. Geeignete Fälle in derselben Sitzung mit der vorhandenen Fixture vorbereiten. Vergleichsläufe für Performance isolieren. FLH04 benötigt zusätzlich sein unabhängiges Review und die konkrete Sicherheitsfreigabe. |
| Neue, passende Brokerunterlage | FLH05, FLH03, AT03, AT05, Barausgleich | Vor Parser- oder Browserarbeit Anbieter, Zeitraum, Geschäft und unabhängiges Soll zuordnen. Nur passende Teilfüllung plus Nettoabrechnung, Export plus Einzelabrechnung, Originalsaldenpaar, Jahresbeleg desselben Depots oder individuell zugeordneten Stückrest prüfen. Vorhandene negative Suchen erst bei neuer Quelle wieder aufnehmen. |
| Erlaubte Datenquelle | VWCE und UI-SENTIMENT01 | Nutzbaren Datenzugang und dokumentierte Anzeigerechte je Quelle zuerst prüfen. Vorhandene Vergleichsrechnung, Darstellung und Cachetests wiederverwenden. |
| Originalantwort, Kontozuordnung oder veränderter technischer Vertrag | ETH-Cursor, FLH03-18, weitere Wallets | Historischen Cursor bzw. privaten Besitz nur mit passendem Original zuordnen. Die 24-stellige NEAR-Referenz erst mit einem durchgängigen Präzisionsentwurf erneut produktseitig qualifizieren. |
| Messbare Änderung am kritischen CI-Pfad oder neuer Veröffentlichungsauftrag | CI-Effizienz, Produktmaster | #430 bei einem neuen Kandidaten oder aussagekräftigeren Vergleich wieder aufnehmen. Die interne Vorschau ist fertig. Öffentliche Bewerbung bleibt zurückgestellt. |

**Wiedereinstieg:** Beim Wechsel von Aufgabe oder Sitzung nur Änderungen seit dem letzten belegten Stand prüfen. Den Arbeitsplan im vorhandenen Paketeintrag um Ergebnis, Beleglink und den nächsten ausführbaren Schritt bzw. konkreten Wiedereinstiegsauslöser ergänzen. Ein fehlender Zugang parkt die betroffene Arbeit. Alle unabhängigen Arbeiten gehen weiter. Maß für den Fortschritt sind vollständig abgenommene Zeilen und die Zeit bis zur Live-Abnahme eines konkreten Kandidaten.

Main `8de635271c341d7462d4d33e5f268089c26da6d0`, Tree
`d80ec391347b9586e28b73389d193edec866bab3`. **SW339 LIVE_ACCEPTED**,
**6/6 Kernbereiche und 10/29 Folgepakete abgenommen**.
Der [Mainlauf](https://github.com/joke0071/foliolab-open/actions/runs/45481111315)
zu [#428](https://github.com/joke0071/foliolab-open/pull/428) bestand Pflicht-CI,
Pages und den zuvor noch laufenden
[Livejob](https://github.com/joke0071/foliolab-open/actions/runs/45481111315/job/138770447941)
einschließlich Chromium, Firefox und WebKit. Direkter erneuter Abruf von
`/`, `/index.html` und `/sw.js` stimmt bytegenau mit Main überein.
SHA-256 für beide HTML-Pfade
`50fb8992d48d0f00255f660b92ae4d14a840bc2ee23ba555ff404555774d80d3`,
für `sw.js`
`439e0851ea4e04e34807443015048a97ae281de3f36c2c6ea4e22057b640ff7a`.

## Freigabewege ab 25.11.2026

Die Entwicklungsleitung beschafft und prüft die Nachweise. Neue Kontoauszüge, Wallet-Adressen, Gerätesitzungen oder Abnahmeprotokolle vom Anwender sind kein Arbeitsschritt. Ausgangspunkt ist Checkpoint `19be0555` mit SW339, **6/6 Kernbereichen und 10/29 abgenommenen Folgepaketen**. Die folgenden Wege sind Arbeitsaufträge. Jeder Paketstatus folgt dem tatsächlich erreichten Prüfergebnis.

### Reihenfolge für die nächste Übernahme

1. **Mit vorhandenen Belegen beginnen.** Die fünf abgeschlossenen Originalkernfälle, den Bitpanda-Quartalsabgleich, die Kraken-Order-/Ledger-Zuordnung und die vorhandenen Restore-Originale einmal nach Anbieter, Zeitraum, Ereignis und unabhängiger Sollgröße abgleichen. Im privaten Arbeitsbereich pro Lücke festhalten, welcher Beleg sie abdeckt oder warum er ausscheidet. Dadurch kann ein einziger geeigneter Fall AT03, FLH05, FIN-E2E01 und Verwaltung speisen. [Kernfälle](FOLIOLAB_1_0_ORIGINAL_CORE_2026-11-18.md) · [Anbietermatrix](FLH03_PROVIDER_MATRIX.md)
2. **Unabhängige Arbeit vorziehen.** Die drei Produktentscheidungen unten als Arbeitsvorgaben verwenden. Bestehende CI-Läufe auswerten, die Alt-PWA aufbauen und die Verfügbarkeit von Projektgeräten sowie einer unabhängigen Reviewstelle prüfen. Fehlt ein Zugang, mit der nächsten ausführbaren Zeile weiterarbeiten. Ein erneuter Versuch lohnt sich bei einem neuen Beleg, Zugang, Anbieterstand oder Produktkandidaten.
3. **Abnahme buchen.** Je Zeile Quelle mit Version/Stichtag, unabhängiges Soll, Ist, Abweichung, geprüften Umfang und verbleibende Lücke im bestehenden Paketcheckpoint erfassen. Öffentlich genügen anonymisierte Ergebnisse und Verweise auf freigegebene Artefakte. Persönliche Originale, Adressen, Cursor und Zugangsdaten bleiben privat. Softwareänderungen durchlaufen die bestehenden Integrations-, Wallet-, Main-, Pages- und Live-Gates im geltenden Umfang. Der Zähler steigt erst bei vollständiger Zeilenabnahme. Ein bestandener generischer Test, eine zurückgestellte Funktion und ein nachgewiesener persönlicher Fall haben jeweils einen eigenen Status.

### Produktentscheidungen ohne Rückfrage

| Paket | Arbeitsentscheidung | Abnahme und Reichweite |
| --- | --- | --- |
| UI-Refresh · #300 | Die bestehende Gliederung in „Mehr“ als Standard wählen. Drei Sprunglinks nur dann erproben, wenn mindestens einer der drei Zielbereiche bei Tastatur- oder Mobilbedienung nachweisbar schwer erreichbar ist. | Alle drei Bereiche bei 320 px, 200 % Zoom und per Tastatur erreichen, Fokus und Zurückweg sowie Erhalt ungespeicherter Eingaben prüfen. Bei bestandenem Test Variante und Befund im UI-Checkpoint dokumentieren. |
| Benchmark/Roadmap · #124 | Für den ersten nachvollziehbaren Vergleich 100 % VWCE, Xetra, EUR als beschriftete ETF-Referenz ansetzen. Dies ist eine Produktvorgabe für den Pilotvergleich. | Nutzbare historische EUR-Reihe, Datenrechte und Behandlung von Ausschüttungen/Kapitalmaßnahmen belegen. Auf gemeinsamen Bewertungstagen mit identischem Startwert die zeitgewichtete Portfoliorendite gegen eine unabhängig geprüfte Referenzrechnung stellen. Datenlücken sichtbar lassen. Bei fehlender Reihenqualität bleibt nur dieser Vergleich aus. |
| Produktmaster · #149 | Die fachlich abgenommene App und die öffentliche Bewerbung getrennt führen. Die bestehende Entscheidung für den privaten Webauftritt respektieren. Eine Vorschau mit synthetischen Daten intern vorbereiten. | Texte und Screens gegen ausgelieferte Funktionen prüfen, private Inhalte ausschließen und Vorschau intern abnehmen. Veröffentlichung auf der Website bleibt eine gesonderte, zurückgestellte Aktion. Die übrigen Pakete können veröffentlicht werden, soweit ihre eigenen Gates erfüllt sind. |

### Originalbelege, Finanzfunktionen und Wallets

Ein veröffentlichter Musterfall kommt in Betracht, wenn Herkunft, Verwendung, Region, Schema und sämtliche erforderlichen Felder nachvollziehbar sind. Vor dem Import die Erwartungen aus einer zweiten Quelle oder der belegten Abrechnung festhalten. Synthetische Grenzfälle ergänzen die Regression. Ein Wert aus demselben Parser oder eine Rückrechnung aus denselben Umsätzen liefert keinen unabhängigen Originalwert.

| Paket | Wie die Entwicklung den Eingang beschafft | Entscheidung anhand des Ergebnisses |
| --- | --- | --- |
| AT03 · #127 | Vorhandene Umsatzexports, Abrechnungen und datierte **gebuchte** Salden paaren. Zwei aufeinanderfolgende Abschlüsse oder Buchungszeilen mit explizitem laufendem Saldo können die Grenzen desselben Kontos, derselben Währung und Periode liefern. Für einen generischen Kontrollfall auch selbst einen passenden freigegebenen Anbieter-Musterfall suchen. | Beide Originalsalden separat ablesen und alle Bewegungen einschließlich Transfers dazwischen abstimmen. Verfügbarer Betrag, doppelte Anzeige desselben Saldos oder Bitpanda-Gesamtportfoliowert reichen dafür nicht. Den persönlichen Zeitraum nur mit seinem eigenen Saldenpaar abschließen. |
| FLH05 · #174 | In der vorhandenen Kraken-Order-/Ledger-Korrespondenz eine weitere zusammengehörige Gruppe mit Teilfüllungen, Gebühren, Fremdwährung und einem separat ausgewiesenen Nettobetrag suchen. Alternativ dokumentierten Anbieter-Testexport mit Orderabrechnung desselben Falls verwenden. | Ausführungen über ihre Quell-IDs verbinden, FX-Richtung, Gebührenwährung und Netto exakt prüfen. Reihenfolge vertauschen, erneut importieren, zurücknehmen und wiederherstellen. Nur das geprüfte Anbieterprofil und Ereignismuster freigeben. |
| FIN-E2E01 · #255 | Aus dem qualifizierten Originalfall die Herkunft, Gegenposition, Cash, Kostenbasis und Journalwerte **vor** dem Test festschreiben. Mit der vorhandenen FIN-E2E-Strecke eine zusätzliche konkret erlaubte Rücknahme prüfen. | Nach Import, Rücknahme, Undo und Restore exakt gegen die Sollzustände vergleichen, einschließlich externer Flows und Historie. Abbruch und veraltete Revision müssen den vollständigen Vorzustand erhalten. Nur belegte Rücknahmeklassen erlauben. |
| Verwaltung/Buchungsmutationen · #165/#257 | Den gleichen Beleg über die tatsächliche Verwaltungsoberfläche auswählen. Erlaubte Buchung und einen geschützten Gegenfall mit Folgeabhängigkeit gegenüberstellen. | Korrektur, Abbruch, Sperrgrund, Gegenbuchung, Journal, Kosten und Flows prüfen. Wiederimport darf die zurückgenommene Identität nicht wiederbeleben. Eigenes UI-Ergebnis mit Verweis auf den FIN-E2E-Beleg erfassen. |
| FLH03 · #148 | Bitpanda-Quartalsauszug, späteren Cashbeleg und vorhandene Transaktionsexporte nach unabhängigen Cash- und BCI25-Komponentenzeilen zum Stichtag prüfen. Für den generischen TR-Import gezielt einen freigegebenen Export im unterstützten Regionalformat mit separater Abrechnung suchen. Öffentliche PDF-Textbeispiele können Feldbedeutungen belegen, ein CSV-Profil benötigt einen passenden Export. | Cash und jede BCI25-Komponente nach Datum, Asset und Menge abgleichen. Öffentliche Indexgewichte erlauben Methodenprüfungen, persönliche Anteile benötigen datierte Stückzahlen. Persönlicher TR-Fall bleibt `NOT_APPLICABLE`. Generische TR-Abnahme erfolgt separat je belegtem Format. |
| FLH03-18 · #159 | Bereits zugeordnete Ledger-Exporte nach einer weiteren Stake-Position mit datierter Delegation und Endbestand durchsuchen. Für den allgemeinen Adapter ist ein dokumentiertes Projekt-Testkonto mit Export und separat lesbarem Kettenbestand ein eigener Prüffall. | Konto-/Wallet-Zuordnung unabhängig belegen, am gleichen finalisierten Block bzw. Stichtag verfügbare und gebundene Menge abstimmen. Transfer, Reward und interne Verschiebung gegen Doppelzählung prüfen. Eine persönliche Zuordnung bleibt an ihren Beleg gebunden. |
| Weitere Wallet-Abdeckung · #119 | Pro zusätzlichem Netzwerk einen dokumentierten Projekt- oder öffentlichen Referenzfall mit festem Block, Zeit und Finalität wählen. Historische Protokoll-/Node-Abfrage und unabhängigen Explorerbeleg sichern. | Bestand, Stake, Unbonding und Rewards gemäß Adapterumfang separat prüfen. Bei Lücken Teilabdeckung ausweisen. Eine öffentliche Beispieladresse belegt Netzwerkverhalten. Für einen Eigentumsnachweis braucht es die Kontozuordnung des konkreten Falls. |
| ETH-HISTORY-CURSOR01 · #268 | Vom [abgenommenen öffentlichen Fall](release-evidence/sw321-eth-cursor-public-2026-11-16.json) ausgehen. Vorhandene private Artefakte gezielt auf das ursprüngliche Antwortpaar prüfen. Für die allgemeine Fehlerklasse eine neue öffentliche Mehrseitenfolge inklusive unverändertem Folgetoken, Antwort und Blockbezug aufzeichnen. | Seitenfolge, eindeutige Events und Abschluss gegen unabhängige Chain-Daten prüfen. Ungültiger, zyklischer oder unterbrochener Cursor muss einen ehrlichen Teilstatus ergeben. Den persönlichen Vorfall nur bei auffindbarem Originalpaar als reproduziert kennzeichnen. |
| AT05 · #129 | Vorhandene Jahresabrechnungen oder einen freigegebenen österreichischen Musterfall mit unabhängiger Fachlösung nach ISIN, Jahr, Stückzahl und steuerlichem Ereignis der passenden OeKB-Meldung zuordnen. Eine bereits veröffentlichte fachliche Gegenprüfung muss genau diesen Sachverhalt und Rechenweg abdecken. [OeKB-Steuerdaten](https://www.oekb.at/kapitalmarkt-services/unser-datenangebot/fonds/steuerdaten.html) | Ausgewiesene Jahreswerte und Export mit Brokerabrechnung und unabhängiger Fachprüfung abstimmen. Fehlende Zuordnung als unbekannt führen. Ohne passenden Fall bleibt die belegte Buchungsübersicht nutzbar und die zusätzliche Steuerqualifikation offen. |
| Barausgleich · #52 | Ein veröffentlichtes Emittentenereignis mit einer freigegebenen Brokerabrechnung desselben Ereignisses verbinden. Bezugsverhältnis, Stückbruchteil, Abrechnungstag, Geldbetrag, Währung, FX, Kosten und ausgewiesene Steuerbasis erfassen. | Aktien- und Cashbuchungen gemeinsam abstimmen, einschließlich Rundung, atomarer Ablehnung und Restore. Fehlende Steuerbasis als unbekannt führen. Eine reine Corporate-Action-Mitteilung belegt keine individuelle Nettoauszahlung. |

### Infrastruktur, Anbieter und Freigaben

| Paket | Ausführbarer Weg | Freigabekriterium und Ausweichweg |
| --- | --- | --- |
| CI-Effizienz · #229 / PR #430 | Bei den nächsten fachlich erforderlichen regulären Läufen seriellen und parallelen Kandidaten paarweise mit gleicher App, Runnerklasse, Browsern, Shards und Prüfumfang messen. Den gesamten lokalen Pflichtpfad unter gleichen Bedingungen paaren und CPU-/Speicherauslastung sowie die Zeit außerhalb P1A in Shard 2 erfassen. Vorhandene Läufe als Baseline verwenden. | Zeit bis zum letzten Pflichtjob und bis zur Live-Abnahme, Wiederanläufe, geprüfte Fälle und Artefakte vergleichen. Übernahme erst bei wiederholtem Gesamtgewinn außerhalb der beobachteten Streuung und gleicher Abdeckung. Sonst seriellen Ablauf beibehalten und den Versuch mit Messwerten abschließen. |
| Startperformance · #177/#256 | Vorhandene 10k-Fixture anhand ihres Hashs übernehmen. Ein bereits autorisiertes physisches Android-Projektgerät nutzen. Als Alternative zu den früher blockierten Lab-Einstiegen ein verfügbares Projektkontingent für [Android Device Streaming](https://developer.android.com/studio/run/android-device-streaming) auf Installation, Prozessende und Offlinebetrieb prüfen. | Auf demselben Modell mit gleicher Chrome-/PWA-Version je fünf Kalt-, Warm- und Offline-Starts pro Vergleichsstand. Einzelwerte, Median, Streuung, erste sichere Interaktion und Finanzgleichheit dokumentieren. Verhindert das Labor einen Messmodus, nur die durchgeführten Modi buchen. |
| Speicher/Migration/Recovery · #44/#254 | Historische App und Service Worker aus dem vorgesehenen Release auf einer kontrollierten HTTPS-Origin installieren, vorhandenen 10k-Bestand über die alte UI anlegen und dann auf derselben Origin aktualisieren. Alten Tab offen halten. Für Zweitgeräte-Restore zwei getrennte, autorisierte Laborgeräte und den vorhandenen verschlüsselten Export nutzen. | Version, Schlüssel-/Installationsidentität, Revision, Journal, Historie und Kontostände vor/nach Update, Abbruch und Restore vergleichen. Inkompatibler Writer bleibt gesperrt. Profil-Neustart, echte Gerätewiederherstellung und beobachtete OS-Eviction jeweils separat protokollieren. |
| TRUST01 · #298 | Herkunftsinventar des ausgelieferten Builds verwenden. Für ungeklärte Grafiken eine eigenständig erstellte oder ausdrücklich passend lizenzierte Ersatzquelle samt reproduzierbarem PNG-Export vorbereiten. Natives Safari/VoiceOver und ITP auf geeignetem Projektgerät prüfen. HTTP-Frame-Schutz auf einem autorisierten Auslieferungsweg mit effektiven Antwortheadern erproben. [Grafikinventar](K6_TRUST_GRAPHIC_PROVENANCE_V316_2026-11-15.md) | Rechtekette für alle ausgelieferten Ersatzassets und deren Referenzen nachweisen. Native Fokus-/Ansagefolge und tatsächliches ITP-Verhalten mit persistenter Sitzung samt Wiederöffnung belegen. Einen wirksamen Frame-Schutz erst nach Headerprüfung und blockiertem Fremd-Framing der tatsächlich ausgelieferten Origin buchen. |
| UI-SENTIMENT01 · #405 | Krypto und Aktien einzeln behandeln. Für CMC vorhandenen autorisierten Projektzugang und zugelassenen serverseitigen Abruf einschließlich Anzeigerechten prüfen. Der dokumentierte Keyless-Endpunkt eignet sich für die Evaluation, der Produktionsbrowser scheiterte bereits an CORS. Für CNN einen offiziell erlaubten Feed oder eine freigegebene Einbettung mit passendem Anzeigeumfang prüfen. [Bisheriger Quellenversuch](release-evidence/sentiment-sources-2026-11-20.json) · [CMC-Dokumentation](https://coinmarketcap.com/api/documentation/pro-api-reference/keyless-public-api/) | Freigabe je Originalindex nach belegten Rechten und echtem Abruf aus dem Produktpfad mit Quelle, Stand, Cache und Ausfalltest. Ohne Zugang bleibt der betroffene Zahlenwert deaktiviert. Ein Quellenlink kann die Originalseite erschließen. Die vollständige Zwei-Index-Abnahme setzt beide Quellen voraus. |
| Drive/FLH04 · #160 / PR #427 | Den [Reviewauftrag auf `84ef0b37`](https://github.com/joke0071/foliolab-open/blob/84ef0b3746d48f24a7b130ecce80c6409f579463/docs/FLH04_AUTHORITY_CONTINUATION_REVIEW.md) mit vollständiger Kette, Grenzen 128/129/130, Neustart, Widerruf und Konflikten über einen bereits verfügbaren unabhängigen Kryptoreview-Pfad prüfen lassen. Befunde am Kandidaten nachtesten. Danach den isolierten Verifier qualifizieren. Erst bei vorhandener Projekt-OAuth-Origin, Testkonto, zwei autorisierten realen Geräten und erforderlicher konkreter Sicherheitsfreigabe den produktionsnahen Schreibtest planen. | Aktuelle Schreibberechtigung, bestätigter Write, unabhängiger Readback auf Gerät B, Konflikt ohne Datenverlust und wirksamer Widerruf müssen belegt sein. Fehlt Review, Autorisierung oder konkrete Freigabe, bleiben Enrollment und Remote-Write gesperrt. Lokaler Betrieb und bereits abgenommene Backups können weiter ausgeliefert werden. |

**Fortschreibung.** Für jeden Versuch Datum, Kandidat, Ergebnis und nächsten technisch erreichbaren Schritt eintragen. Wo eine externe Voraussetzung fehlt, den konkret betroffenen Funktionsumfang benennen und den nächsten unabhängigen Auftrag ziehen. Vergleichsfälle können allgemeine Produktfunktionen qualifizieren. Ein historischer privater Originalfall, eine Anbietererlaubnis oder eine unabhängige Sicherheitsfreigabe bleiben als solche erkennbar.

## FLH04

Draft [#427](https://github.com/joke0071/foliolab-open/pull/427), Head
`84ef0b3746d48f24a7b130ecce80c6409f579463`, Tree
`638ec5dc0f4977c8fc4ac08c923c669b8819dfa2`. Vorprüfung und Fixture-Verifier
arbeiten jetzt mit derselben lokalen Kopie der Segmentstrings. Das Modell
prüft Bezeichner und Writerlisten einschließlich der vertraglichen Grenze
von 64 Mitgliedern. Drei Regressionstests prüfen stabile Eingaben,
ungültige Verifier-Rückgaben und ungültige Startparameter. **1.732/1.732
Node-Tests lokal**, davon 18 Ablaufmodelltests. Der
[Reviewauftrag](https://github.com/joke0071/foliolab-open/blob/84ef0b3746d48f24a7b130ecce80c6409f579463/docs/FLH04_AUTHORITY_CONTINUATION_REVIEW.md)
enthält konkrete Fragen und erwartete Belege. Die Signaturprüfung ist
simuliert. Enrollment und Remote-Write bleiben gesperrt.
Der [isolierte CI-Lauf](https://github.com/joke0071/foliolab-open/actions/runs/45559424391)
bestand 1.732/1.732 Node-Tests und die bestehenden Outbox-, Recovery- und
Speicherprüfungen in Chromium, Firefox und WebKit. Der geprüfte gemeinsame
Stand `31d586319b708b122aea53e12d586d27bdaddd92` ist baumgleich mit dem Draft-Head.

## CI-Effizienz

Zeitmessung aus GitHub Actions ab `run_started_at` bis zum letzten
Pflichtjob vor Deployment. Jeweils erste Ausführung. Angaben gerundet
auf Sekunden, Zeiten außerhalb P1A aus Schrittzeit minus P1A-Bericht.

| Messgröße | [#428 PR seriell](https://github.com/joke0071/foliolab-open/actions/runs/45477599208) | [Main seriell](https://github.com/joke0071/foliolab-open/actions/runs/45481111315) | [#430 PR parallel](https://github.com/joke0071/foliolab-open/actions/runs/45481395180) |
| --- | ---: | ---: | ---: |
| Start bis Ende Pflichtstrecke | 19:06 | 26:34 | 21:11 |
| Letzter Pflichtjob | test | cross-engine (2) | cross-engine (2) |
| Start letzter Pflichtjob ab Run-Start | 0:42 | 0:13 | 0:21 |
| Chromium-Browserschritt | 17:33 | 17:02 | 16:41 |
| Chromium außerhalb P1A | 16:44 | 16:15 | 16:16 |
| Firefox/WebKit-Browserschritt, Shard 2 | 17:14 | 25:23 | 19:56 |
| Firefox/WebKit außerhalb P1A, Shard 2 | 15:46 | 22:55 | 18:37 |
| Shard 1 gesamte Jobzeit | 10:06 | 10:38 | 10:19 |
| Shard 2 gesamte Jobzeit | 17:58 | 26:21 | 20:50 |
| Shard 3 gesamte Jobzeit | 12:55 | 14:05 | 12:51 |

#428 und Main haben denselben Tree. Die serielle Spanne bis zum letzten
Pflichtjob beträgt 7:28. #430 liegt 2:05 über der PR-Referenz und 5:23
unter der Push-Referenz. Beide Änderungen überschreiten die gemessene
P1A-Differenz deutlich. GitHub meldet für die Shards `ubuntu-24.04`.
Die regulären Läufe enthalten keine vergleichbare CPU-/Speicherauslastung.
Aus getrennten Runnern und verschiedenen Events folgt kein kausaler
Gesamtvergleich.

Der [kontrollierte ABBA-Test aus #429](https://github.com/joke0071/foliolab-open/actions/runs/45480145717)
belegt 42–46 % Medianersparnis für P1A bei gleicher Fall- und Screenshotzahl.
Die Prüfung von #430 zeigt unveränderte fachliche Assertions in P1A,
getrennte Browserprofile, aggregierte Fehler als fehlgeschlagenen Lauf
und exakt zwei lokale Aktivierungen. Live läuft seriell. Die
[Wallet-CI](https://github.com/joke0071/foliolab-open/actions/runs/45481395351)
war nach 0:59 abgeschlossen und lag außerhalb des kritischen Pfads.
**#430 bleibt zurückgestellt.** Ein weiterer einzelner Kandidatenlauf
würde die zeitliche Streuung der Referenzen nicht auflösen. Nächster
aussagekräftiger Versuch wäre ein gepaarter Vergleich des ganzen lokalen
Pflichtpfads bei gleichen Runner-Bedingungen, mit gleicher Testliste,
Node-/Browser-Versionen und gesonderter Ressourcenmessung.

Der Mainlauf brauchte **68:22** bis Live-Abschluss. Im Livejob entfielen
11:10 auf Chromium und 28:24 auf Firefox/WebKit. Die Browserinstallation
lag bei 0:07 bzw. 1:14. Für weitere Releasebeschleunigung haben Messungen
innerhalb des Firefox-/WebKit-Liveblocks und außerhalb P1A in Shard 2
Vorrang vor Änderungen an Browserinstallation oder Wallet-CI. Für einen
Eingriff in die Live-Reihenfolge fehlt derzeit ein qualifizierter
Vergleich der gesamten Abnahme.

In den Shard-2-Logs umfasst der Import von `browser-reference-management.mjs`
auch Referenzentfernung und P1A. Direkt vor dem ersten P1A-Aufruf betrug die
Zeitspanne vom Importbeginn bis zum WebKit-Abschluss der
Referenzentfernung auf #430 68 s gegenüber 84 s auf Main und 56 s auf
#428. Der größte Teil der Schwankung außerhalb P1A liegt damit außerhalb
dieser zusammengefassten Referenzstrecke. Für einen gepaarten Vergleich
sollten die Zeitmarken der übrigen Browserprüfgruppen aus denselben
Joblogs mit ausgewertet werden.


## Ausgangsbefund vor Festlegung der Freigabewege

Die folgenden Zeilen dokumentieren die offenen Kriterien zum Übergabezeitpunkt. Für ihre Bearbeitung und die drei Produktentscheidungen gilt der Arbeitsplan oben.

Abgleich mit der [Roadmap](KONSOLIDIERTE_ROADMAP.md) auf Checkpoint
`74987389`. Die vorhandenen Teilnachweise sind für die bezeichneten Fälle
weiter verwendbar.

| Paket | Ausgeführt oder für die Abnahme verwendbar | Benötigter Eingang und nächster Schritt |
| --- | --- | --- |
| Drive / FLH04 | Modell und Reviewauftrag oben. Lokale Outbox-/Recovery-Belege vorhanden. | Unabhängiges Kryptografie-/Architekturreview, qualifizierter Aktualitätsnachweis, autorisierte Origin mit OAuth-Testkonto und zwei isolierte Geräte. Danach Wire- und Signaturbelege, bestätigter Write und unabhängiger Readback. |
| CI-Effizienz | Pflichtzeiten einschließlich Warte- und P1A-Anteilen ausgewertet. | Gepaarter Vergleich unter gleichen Runner-Bedingungen, sobald ein regulärer Vergleich die Schwankung außerhalb P1A einordnen kann. |
| TRUST01 | CSP-Vertrag auf Main lokal 7/7. HTTPS-Readback lieferte weder CSP-Header noch X-Frame-Options. Statische Meta-CSP und Live-Belege vorhanden. | Qualifizierter Host für HTTP-Frame-Schutz, natives Safari/VoiceOver mit beobachtetem ITP-Speicherverhalten, Originalzeichnung und Primärbeleg zur Rechtekette. |
| FIN-E2E01 | Synthetische Rücknahme-/Bestandsbelege und produktive Fixes vorhanden. | Konkretes Original der Rücknahme mit unabhängig ausgewiesenem Journal-, Kosten- und Cash-Sollwert. |
| FLH03 | Synthetische Bitpanda-Prüfung in Windows Chrome und Edge in [#350](https://github.com/joke0071/foliolab-open/pull/350). | Bitpanda-Stichtagswert und BCI25-Einzelaufstellung, separat generisches Trade-Republic-Original. |
| AT03 | Vorhandener unabhängiger Abgleichpfad für Cash-Salden. | Gebuchter Anfangs- und Endsaldo für dieselbe Periode und dasselbe Konto. |
| FLH05 | Import- und Wiederimportverträge wiederverwendbar. | Originalzeilen derselben Teilfüllung mit FX und Gebühren, unabhängig gebuchter Nettosollwert. |
| Verwaltung / Buchungsmutationen | Produktive Verwaltungs- und Mutationstests vorhanden. | Originalbuchung samt Gegenposition und erwartete Journal-, Kosten- und Flow-Werte. |
| ETH-HISTORY-CURSOR01 | Produktiver WETH-Teilnachweis auf SW329. | Privater Originalcursor mit zugehöriger Provider-Folgeantwort. |
| FLH03-18 | Ledger-/Staking-Importpfad und Vergleichsverfahren vorhanden. | Zusätzliche konkrete Ledger-/Stakingposition mit eigener Kontozuordnung und datiertem Endbestand. |
| Weitere Wallet-Abdeckung | Bestehende öffentliche und synthetische Wallet-Belege wiederverwendbar. | Datierter eigener Bestand mit Menge und nachvollziehbarer Finalität. |
| AT05 | Bestehender dokumentierender AT-Teilumfang. | Brokerjahresabrechnung, zugehörige OeKB-Daten und unabhängige fachliche Prüfung. |
| Barausgleich | Erwartete Belegfelder sind dokumentiert. | Abrechnung mit Bruchteil, Kosten, Auszahlungswährung und Steuerbasis. |
| UI-SENTIMENT01 | Darstellung und Offline-Cache in drei Browserengines mit Fixtures qualifiziert. | Zugelassener CMC-Abrufweg samt FolioLab-Zugang und CNN-Feed mit Anzeigerechten. |
| Speicher / Migration / Recovery | Lokale Datei-Restore-Abnahme sowie separater nativer Windows-Teilbeleg aus [#348](https://github.com/joke0071/foliolab-open/pull/348). | Repräsentative Altinstallation mit Testbestand und zweites autorisiertes Gerät für den geräteübergreifenden Fall. |
| Startperformance | [Android-Messprotokoll](PERF_ANDROID03_REAL_DEVICE_CHECKLIST.md) und gemischte synthetische Fixture vorhanden. | Benanntes physisches Android-Gerät mit Messzugriff, fünf Kalt-, Warm- und Offline-Starts mit demselben Bestand. |
| UI-Refresh | Mobile Navigation abgenommen, die drei Rubriken existieren. | Soll „Mehr“ Sprunglinks bekommen? Empfehlung: bestehende Gliederung. Bei Freigabe der Links Fokus, Zurück-Navigation, Entwurfserhalt und Datengleichheit prüfen. |
| Benchmark / Roadmap | Vorhandene Projektion und unabhängige Renditeprüfungen wiederverwenden. | Welche Reihe, Währung und Gewichtung gelten? Empfehlung für den ersten Vergleich: eine qualifizierte EUR-Gesamtrenditeserie mit 100 % Gewicht, sofern die Datenquelle freigegeben ist. Alternativ einen gewichteten Korb oder eine andere Basiswährung festlegen. Danach Überlappung und Renditen extern gegenprüfen. |
| Produktmaster | Release-Abnahme und bereits ausgelieferte Detailumfänge sind dokumentiert. | Öffentlichen Produktauftritt inklusive Umfang freigeben oder zurückstellen. Empfehlung: erst nach ausdrücklicher Freigabe des konkreten Auftritts veröffentlichen. |

Soweit dieselbe Brokerperiode passt, Finanzoriginale als ein Belegpaket
mit gebuchten Salden, relevanten Transaktionen und separat ermittelten
Sollwerten vorbereiten. Originale und Zugangsdaten ausschließlich im
dafür autorisierten Testkontext verarbeiten. Gerätezugänge lassen sich
für die jeweils passenden Recovery-, FLH04-, TRUST01- und
Performanceprüfungen koordinieren.

## PR-Entscheidungen

- **#428 integriert und live bestätigt.**
- **#427 Draft, Modell erweitert, lokale Tests und isolierte Pflicht-CI grün.** Unabhängiger Review
  und externe Abnahme bleiben offen.
- **#429 Messreferenz.** Der Versuchsworkflow gehört auf den isolierten Zweig.
- **#430 zurückgestellt.** Die Voraussetzung eines reproduzierbaren
  Vorteils im Pflichtpfad ist offen.
- **#348 und #350 Referenz für abgegrenzte Windows-QA.** Die QA-Zweige sind
  keine Produktintegration.
- **#161 historische FLH04-Designreferenz.** Die aktuelle Arbeit folgt
  dem isolierten FLH04-Zweig und dem Reviewstand aus #427.

## Durchführung der Freigabewege · 25.11.2026

Kandidat **SW339**, Main `8de635271c341d7462d4d33e5f268089c26da6d0`,
Tree `d80ec391347b9586e28b73389d193edec866bab3`. Der veröffentlichte
Service Worker stimmt beim erneuten Abruf bytegleich mit Main überein.
Die Heads von #427 und #430 entsprechen den zuvor geprüften Ständen.
Keine Produktdatei geändert.

### Broker und Originalbezüge

Die fünf [abgenommenen Kernfälle](FOLIOLAB_1_0_ORIGINAL_CORE_2026-11-18.md)
wurden gegen die offene Anforderung verglichen. Flatex und Bittr behalten
ihre bereits belegte Import- bzw. Rücknahmereichweite, Kraken den
Spotabgleich, Bitpanda den POL-Einzelfall und Ledger Live den zugeordneten
SOL-Eingang. Keiner dieser abgegrenzten Nachweise enthält die zusätzlich
gesuchte Kombination aus einem neuen Originalereignis, Teilfüllung und
separat gebuchtem Netto. Der separat abgelegte Kraken-Ledgerexport und die Kopie im Spotbeleg sind bytegleich. Die archivierte unabhängige Decimal-Quittung bestätigt 13/13 Spotmengen. Die verschachtelte private Projektfortsetzung und die zusätzlichen Restore-Quittungen wurden nach einschlägigen Artefakten eingeordnet. Dabei wurde kein zweiter Kraken-Orderexport für den Fall gefunden. Private Quellen bleiben außerhalb von GitHub.

| Paket | Fall und erwarteter Nachweis | Ist, Reichweite und nächste Voraussetzung |
| --- | --- | --- |
| Kraken / FLH05 | Ausführungs-ID je Teilfüllung, gemeinsame Order-ID, getrennte Gebührenwährung, FX-Richtung und separat ausgewiesenes Netto derselben Ausführung. | Abgeglichen wurden 1.499 Ledgerzeilen mit 229 Trade-Referenzgruppen und der separat exportierte Spot-Stichtag. Alle 229 Gruppen haben je drei Ledgerzeilen. Ledger-ID, gemeinsame Ausführungsreferenz, EUR-/USD-Werte, Gebührenfelder und laufende Ledger-Salden sind vorhanden. Der konkrete Export enthält keine `ordertxid`. Der eigenständige Spotexport enthält Assetmengen und USD-Bewertungen zum Stichtag, keine Netto-Orderabrechnung. USD-Bewertungen und aus Bewegungen errechnete Nettowerte ersetzen keinen separat gebuchten Nettobetrag. Das öffentliche [Kraken-Exportfeldschema](https://support.kraken.com/articles/360001184886-how-to-interpret-trades-history-fields) bestätigt die Trennung von Ausführungs- und Order-ID. Das [Kraken-Illustrationsbeispiel](https://support.kraken.com/gb/articles/115000302707-differences-between-ledger-and-trades-history) erklärt die Gebührenfelder an einem EUR-Einzelfill. Für FLH05 fehlt weiterhin eine zweite Quelle, die dieselbe Fremdwährungs-Teilfüllung samt Netto belegt. |
| FIN-E2E01 und Verwaltung / Buchungsmutationen | Eine zusätzliche Rücknahmeklasse mit vorab unabhängigen Sollwerten für Gegenposition, Journal, Kostenbasis, Flows und wiederhergestellten Bestand. | Die Kernfälle und Kraken-Belege ergeben keinen neuen Fall mit diesen Sollwerten. Bestehende Freigaben bleiben gültig. Für einen neuen Import-, Rücknahme-, Undo- und Restore-Lauf zuerst das passende Originalpaar und den Sollzustand festschreiben. |
| AT03 | Gebuchter Anfangs- und Endsaldo desselben Kontos, derselben Währung und derselben Periode. | Der Kraken-Spotexport liefert einen unabhängigen Endstichtag. Die frühere Öffnung ist bei den betroffenen EUR- und BTC-Strömen aus Ledgerbewegungen abgeleitet. Die Flatex-Ansichten wiederholen denselben gebuchten Saldo. Der Bitpanda-Nachtrag deckt einen anderen Stichtag ab. Der unabhängige Kraken-Spotabgleich bleibt gültig. Für die Zusatzfreigabe fehlt eine zweite belegte Periodengrenze desselben Kontos. |
| FLH03 / Bitpanda und Trade Republic | Eigenständiger Cash-Bestand und datierte Stückzahlen der einzelnen BCI25-Komponenten für den PDF-Quartalsstichtag. Für TR passender regionaler Export plus separate Abrechnung. | Quartalsauszug, späterer Nachtrag und vorhandener Trade-CSV geprüft. Die BCI25-Zuordnung im Quartalsauszug weist keine separat abgestimmten Stückzahlen je Komponente aus. Der spätere Cash-Beleg deckt den Quartalsstichtag nicht ab. Die abgenommene POL-Reward bleibt der belegte Originalumfang. Das [österreichische TR-Hilfezentrum](https://support.traderepublic.com/de-at/267-Wie-erhalte-ich-einen-Depotauszug-und-meine-Jahressteuerbescheinigung) beschreibt den PDF-Kontoauszug. Ein veröffentlichter, passender CSV-Export mit der separaten Abrechnung derselben Buchung wurde dabei nicht belegt. Persönlicher TR-Bezug bleibt `NOT_APPLICABLE`. |

### Neue Prüfresultate auf SW339

[Maschinenlesbarer Prüfnachweis](release-evidence/sw339-roadmap-followups-2026-11-25.json).

| Paket / Prüfpfad | Erwartet | Tatsächlich erreicht und verbleibende Grenze |
| --- | --- | --- |
| UI-Refresh · „Mehr“ | Alle drei Bereiche auf schmalem Layout per Tastatur erreichen. Fokus sichtbar zwischen festen Leisten, Rückweg nutzbar und Entwurf nach abgelehntem Verwerfen erhalten. | Chromium 141.0.7390.37 mit Tab und Firefox 142.0.1 mit Umschalt+Tab erreichten die drei primären Bedienelemente bei 320 px sowie bei 640 px mit CSS-Vergrößerung 200 %. Kein horizontaler Dokumentüberlauf. Der Anbieterentwurf blieb nach abgelehntem Escape erhalten. Nach bestätigtem Verwerfen ging der Fokus zum Auslöser. „Übersicht“ und erneutes „Mehr“ funktionierten mit Tastatur, vollständiger IndexedDB-Datensatz blieb gleich. Vorwärtsnavigation ab letzter mobiler Navigationstaste erreichte im Firefox-Headless-Versuch den Inhalt nicht. Der Rückwärtsweg funktionierte. System-/Browserzoom wurde nicht positiv bestätigt und WebKit konnte wegen fehlender GTK-/Medienbibliotheken in dieser Umgebung nicht starten. Drei Bereiche beibehalten. Freigabe für den gemessenen Teilumfang, vollständige Zeile noch offen. |
| Speicher / Migration / Recovery | Historische App installieren, 10.000 Buchungen über alte UI wiederherstellen, auf derselben HTTPS-Origin mit offenem Alt-Tab aktualisieren und exakte Daten nach frischem Prozess offline wiederlesen. | Chromium 141.0.7390.37, SW321 `e272297ab1ba855a2922c1faa4010b83c558a796` → SW339. Die [synthetische Projektfixture](perf-evidence/2026-11-01/android03-v251/seed-10000.json.gz) hat SHA-256 `963bbc09f00bb1354e496f3ed0dddb4dcaebde34666d2ad6aba394bcfa6baea2`. Nach Restore in der alten UI waren 19 Positionen, 10.000 Buchungen und 1.825 Stichtage geladen. Der SW wechselte auf Cache v339, die alte Dokumentinstanz war beim Wechsel noch offen. Im neuen Tab und nach vollständigem Prozessende bei Offline-Start stimmten der vollständige gelesene IndexedDB-Datensatz und die angezeigte Summe exakt mit SW321 überein. Damit ist der lokale 10k-HTTPS-Wechsel für diesen Versionspfad belegt. Ein inkompatibler Writer, OS-Eviction und ein zweites physisches Gerät sind davon unabhängig. |
| Benchmark / Roadmap · 100 % VWCE | ISIN, MIC, Währung und Ausschüttungsbehandlung prüfen. Kurzer Reihenabgleich, gleicher Startwert, unabhängige Renditeberechnung und ehrliches Verhalten bei Datenlücken. | [Vanguard](https://fund-docs.vanguard.com/FTSE_All-World_UCITS_ETF_USD_Accumulating_9679_EU_INT_EN.pdf?tipo-di-prodotto=fondo-comuni) bestätigt IE00BK5BQT80, Deutsche Börse, VWCE, EUR und thesaurierende Anteilklasse. [Morningstar](https://www.morningstar.com/etfs/xetr/vwce/historical-data), [Yahoo Finance](https://uk.finance.yahoo.com/quote/VWCE.DE/history/) und [Twelve Data](https://twelvedata.com/markets/762896/etf/xetr/vwce/historical-data) zeigen übereinstimmende Xetra-Schlusskurse für fünf Handelstage vom 9. bis 13.11.2026. Unabhängige Decimal-Rechnung ab Startwert 100 ergab **101,45741250**. Der Produkt-TWR eines synthetischen Portfolios auf gemeinsamen Start-/Endtagen ergab beim erwarteten **+3,5 %** denselben Wert bis auf Gleitkommarundung. Bei fehlender Endbewertung oder eingelegtem externen Cashflow gab die bestehende Produktfunktion vertragsgemäß `null` aus. Damit sind Instrumentidentität, Kurzstichprobe und Vergleichsrechnung belegt. Eine vollständige kapitalmaßnahmenbereinigte Historie, Rechte für den konkret genutzten Serienfeed und der Vergleich bei externen Flows bleiben offen. Die [Börsenbedingungen](https://console.marketplace.deutsche-boerse.com/assets/GTC_Marketplace.pdf) binden historische Datenlizenzen an das jeweilige Paket und den vereinbarten Umfang. Sichtbare Kursseiten sind keine FolioLab-Lizenz. |

### Weitere Freigabegrenzen

- **FLH04.** Der [isolierte grüne Reviewstand](https://github.com/joke0071/foliolab-open/pull/427),
  sein Reviewauftrag und die getrennten Abnahmebedingungen bleiben maßgeblich.
  Die verfügbare Projektspur enthält bisher keine unabhängige Freigabe,
  autorisierte OAuth-Sitzung oder bestätigte Zwei-Geräte-Schreibabnahme.
- **CI-Effizienz.** Der vorhandene #430-Kandidat bleibt auf seinem
  Messstand. Es gab in diesem Durchlauf keinen fachlich erforderlichen
  Produkt-PR mit regulärer Pflichtstrecke. Das nächste Paar muss denselben
  vollständigen Pflichtpfad auf gleicher Runnerklasse messen.
- **Startperformance und TRUST01.** Das lokale Linux-Profil liefert den
  isolierten Migrationsbefund. Es liegt kein verwendbarer physischer
  Android- oder nativer Safari-/VoiceOver-/ITP-Zugang für die verbleibenden
  Fälle vor. Der separate Rechte- und Headerumfang aus dem
  [TRUST-Inventar](K6_TRUST_GRAPHIC_PROVENANCE_V316_2026-11-15.md) bleibt offen.
- **ETH-HISTORY-CURSOR01.** Neue allgemeine Zwei-Seiten-Probe am öffentlichen
  [USDC-Vertrag auf Ethereum](https://eth.blockscout.com/address/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48).
  Erwartet waren unveränderte Weitergabe der beiden Providerfelder
  `index` und `block_number`, keine Überschneidung und ein fortschreitender
  Blockbereich. Der SW339-Validator akzeptierte beide Tokens. Blockscout
  lieferte 50 + 50 eindeutige Log-Identitäten ohne Überschneidung. Die
  beiden Randlogs am Seitenwechsel wurden über Routescan anhand Blockhash,
  Blocknummer, Log-Index und Tokenvertrag in den On-chain-Receipts bestätigt.
  Antwort-SHA-256 `caa51612afba792d8b8109da173730e1af869311bce08b9d82d12f75df29626f`
  und `8206adfb03b680f5a29d224c83161b868c35291f7fd86c7679766ef8263044df`.
  Letzte Blocknummern je Seite 26.349.235 und 26.218.104. Der höchste
  enthaltene Block 26.487.387 liegt vor dem unabhängig per Routescan
  gelesenen finalisierten Block 26.491.356. Die 22
  ETH-History-Tests auf SW339 bestanden, einschließlich unterbrochener,
  zyklischer und ungültiger Cursor. Dieser Teilnachweis belegt den
  allgemeinen Übergang zwischen zwei Seiten. Der private ursprüngliche
  Cursor mit Antwortpaar bleibt offen.
- **FLH03-18 und weitere Wallets.** Der zugeordnete SOL-Brückenfall
  bleibt gültig. Für eine private Erweiterung fehlt eine weitere
  datierte Position mit belegter Kontozuordnung und unabhängig gelesenem
  Endbestand. Zusätzliche Netzwerke brauchen jeweils einen benannten
  finalisierten Prüffall.
- **AT05 und Barausgleich.** Nur eine zum Ereignis passende
  Brokerabrechnung mit separater Referenzrechnung kann die Zusatzfreigabe
  tragen. Für AT05 gehört die unabhängige Fachprüfung dazu. Ein
  Emittentenereignis allein liefert keine individuelle Steuerbasis.
- **UI-SENTIMENT01.** Vorhandene Fixture-Abnahme für Darstellung und Cache
  bleibt gültig. Für CMC und CNN fehlt weiterhin der zugelassene
  Produktabruf mit belegtem Anzeigeumfang.
- **Produktmaster.** Öffentlicher Auftritt laut Arbeitsentscheidung
  zurückgestellt. Die vorhandene 1.0-Produktabnahme gilt für ihren
  dokumentierten Appumfang. Eine interne Textvorschau mit synthetischem
  Portfolio, CSV-Vorschau, Verlauf und Backup wurde privat abgelegt. Die
  Aussagen sind am SW339-Funktionsumfang und der 1.0-Abnahme gespiegelt.
  Eine visuelle Freigabe und Veröffentlichung bleiben zurückgestellt.

**Stand der Zeilenabnahme: 6/6 Kernbereiche und 10/29 Folgepakete.**
Die neuen Ergebnisse buchen Teilumfänge. Die ausstehenden Kriterien der
betroffenen Zeilen bleiben erhalten.

### Nachtrag · Flatex-Originalfelder und öffentlicher AT05-Abrechnungsfall

- **AT03 und FLH05.** Die zwei vorhandenen Flatex-Original-CSV-Dialekte
  wurden separat eingelesen. Der Kontoexport enthält Betrag, Währung und
  Transaktionsreferenz. Gebuchte Anfangs-/Endsalden oder laufende
  Salden stehen nicht in den Originalspalten. Der Depotexport enthält
  Stückzahl, Kurs und Transaktionsreferenz. Die ZIP-Belege ergänzen
  CSV-Varianten, aber keine separate Abrechnung mit je Teilfüllung
  belegter FX-Richtung und gebuchtem Netto. Daher bleibt die konkrete
  Salden- bzw. Ausführungslücke bestehen.
- **AT05 Teilabnahme für gebuchte Steuer.** Der veröffentlichte
  [Flatex-Fall zum Fonds IE00BNG8L278](https://www.broker-test.at/steuern/fondsthesaurierung/)
  verknüpft eine Brokerabrechnung mit der OeKB-Jahresmeldung vom
  17.01.2022 und einer getrennten Erläuterung. Vor dem Produkttest aus
  dem veröffentlichten KESt-Abzugswert je Anteil, Stückzahl und
  Abrechnungs-FX mit Python Decimal **27,22 EUR** berechnet. Die
  Anschaffungskostenkorrektur ergab als separate Gegenrechnung
  **4,7465 EUR je Anteil** aus dem angegebenen Einstandswert und der
  veröffentlichten Korrekturrate. Der Produktversuch auf SW339 buchte
  den vorab festgelegten Steuerbetrag in ein synthetisches EUR-Konto.
  Ist: genau ein Journalvorgang, Cash **72,78 EUR** ausgehend von 100 EUR,
  Jahresansicht und Jahressumme **−27,22 EUR**, identischer Bericht nach
  portablem Backup/Restore. Der belegte Umfang ist die Wiedergabe
  einer vorgegebenen gebuchten Steuer. Die
  [historische OeKB-Meldung](https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=IE00BNG8L278)
  lieferte im Abruf keine lesbaren Primärdaten. Jahresabrechnung,
  unabhängige OeKB-Primärzusammenführung und automatischer
  Anschaffungskostenabgleich bleiben für die vollständige Zeile offen.
- **Barausgleich.** Die fünf Vertragsregressionen für Kapitalmaßnahmen
  und Fremdwährung auf SW339 bestanden. Positiv übergebener
  Barausgleich wird bei Split, Swap und Fusion atomar abgelehnt.
  Der geforderte Abrechnungsfall für eine automatische Zuordnung bleibt
  ohne belegte Nettoauszahlung samt Steuerbasis offen.

## Fortsetzung ab Checkpoint `c6a5578` · 25.11.2026

Vor der Arbeit abgeglichen: Main `8de63527`, Arbeitszweig
`feature/flh05-import-foundation` auf `c6a5578`, Draft #427 auf
`84ef0b37`, #430 auf `5c2d7aca`. Die vier Stände waren seit dem
Checkpoint unverändert. Für #427 lagen keine eingereichten Reviews oder
Reviewthreads vor.

### UI-Refresh · „Mehr“

- **Soll und Ausgangsbefund.** Bei sichtbarem Firefox 142.0.1 und
  585 × 770 CSS-Pixeln stand der Fokus auf der letzten mobilen Taste
  „Mehr“. Nach `Enter → Tab` zeigte der X11-Mitschnitt den Fokus auf
  „Firefox View“ in der Browserleiste. Im Dokument blieb „Mehr“ als
  letzter aktiver Knoten gespeichert.
  [SW339 im sichtbaren Firefox](release-evidence/sw340-firefox-focus/sw339-after-tab.png).
- **Korrektur und Gegenprobe.** [SW340, PR #431](https://github.com/joke0071/foliolab-open/pull/431)
  setzt die feste Mobilnavigation im DOM zwischen Kopfzeile und Hauptinhalt.
  Auf dem [Kandidaten d20f202a](https://github.com/joke0071/foliolab-open/commit/d20f202a104fbf2a90c5c0c03f5c2f7c9671f5ca)
  geht der Fokus nach derselben Tastenfolge an „App installieren“, bei
  ausgeblendeter Installation an „+ Konto“. Umschalt+Tab führt zurück
  zu „Mehr“. Die bestehende Pflichtprüfung enthält den Übergang bei
  320 und 390 px. Syntax und 1.533 Node-Tests lokal bestanden.
  [SW340 im sichtbaren Firefox](release-evidence/sw340-firefox-focus/sw340-after-tab.png).
- **Drei Rubriken.** Firefox mit OS-Tastatur bei 450 CSS-Pixeln und bei
  echtem Browserzoom 200 % bestand Vorwärts- und Rückweg. Der Browserzoom
  wurde mit sechs Vergrößerungsschritten von 100 % auf 200 % gesetzt:
  640 → 320 CSS-Pixel, DPR 1 → 2 und CSS-Zoom 1. Chromium 141 und WebKit
  26 bestanden bei 320 px und separat bei CSS-Zoom 200 % auf 640 px.
  Alle drei primären Bedienelemente zeigten sichtbaren Fokus zwischen den
  Leisten. Abgelehntes Verwerfen erhielt den Entwurf, bestätigtes
  Verwerfen stellte den Fokus zum Auslöser wieder her. „Übersicht“ und
  erneut „Mehr“ funktionierten per Tastatur. Der vollständige gelesene
  IndexedDB-Datensatz war vor und nach jedem Fall identisch.
- **Abnahme.** Die drei bestehenden Rubriken sind als Standard bestätigt.
  [Integration](https://github.com/joke0071/foliolab-open/actions/runs/45617054520),
  [Wallet-CI](https://github.com/joke0071/foliolab-open/actions/runs/45617054505)
  sowie Main, Pages und der [Drei-Engine-Live-Wiederanlauf](https://github.com/joke0071/foliolab-open/actions/runs/45620573232/job/139241875358)
  bestanden auf baumgleichem Produktstand. Die UI-Refresh-Zeile ist
  abgenommen. Der bestehende CSS-Nachweis auf SW339 bleibt separat erhalten.
  [Messwerte](release-evidence/sw340-roadmap-ui-at05-2026-11-25.json).

### AT05 · OeKB-Original und zugehörige Flatex-Abrechnung

Im [öffentlichen OeKB-Portal](https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=IE00BNG8L278)
wurde über die Meldungsnavigation die finale Jahresmeldung **343333** vom
**17.01.2022** für **IE00BNG8L278** geöffnet. Die Originaltabellen in USD
je Anteil lieferten 0,0197 ausschüttungsgleichen Ertrag, 0,0018 anrechenbare
Quellensteuer, 0,0036 im Steuerabzug erhobene KESt (Position 12) und 0,0171
Anschaffungskostenkorrektur (16.4). Der USD-Quellensteuerbetrag ist in
Position 12.4 bereits als Abzug erfasst.

Das unabhängig festgelegte Soll aus der [Flatex-Abrechnung und dem
Depotumsatz](https://www.broker-test.at/steuern/fondsthesaurierung/) war
27,22 EUR Steuer, 112,88 USD steuerpflichtiger Ertrag und 4,7465 EUR
korrigierter Einstand je Anteil. Mit 8.622,7 Anteilen und 1,14030 USD/EUR
ergab Decimal aus dem Original alle drei Werte. Der Zuwachs je Anteil
beträgt 0,01499605367 EUR. Der Listenpunkt im Artikel zeigt für den
ausschüttungsgleichen Ertrag abweichend 0,197 USD, während OeKB und
Fließtext 0,0197 USD ausweisen. Die Buchung und der Restore waren bereits
auf SW339 bestätigt. Damit ist der Bezug zwischen Originalmeldung,
Einzelabrechnung und Einstandskorrektur hergestellt. Die
Brokerjahresabrechnung, die unabhängige Fachabnahme derselben
Jahreszusammenführung und der automatische Produktabgleich der
Anschaffungskosten bleiben offen.
[Originalfeld-Codes und Prüfsummen](release-evidence/sw340-roadmap-ui-at05-2026-11-25.json).

**Zeilenabnahme zu diesem Stand: 6/6 Kernbereiche, 10/29 Folgepakete.**

### Speicher und Recovery · inkompatibler SW88-Writer

Der historische [SW88-Stand 58c8aab6](https://github.com/joke0071/foliolab-open/commit/58c8aab6ce93d605cae6e4f2dd8cb7f7bf8d3128)
und SW339 liefen auf getrennten Pfaden derselben isolierten HTTPS-Origin
in Chromium 141. Der alte Tab legte vor dem Cutover erfolgreich einen
synthetischen Anbieter über die Oberfläche an. Dieser Tab blieb
durchgehend offen. SW339 stellte ausdrücklich auf IndexedDB um und
spielte die vorhandene 10k-Fixture über die Backup-Oberfläche ein.

Unabhängiges Soll nach dem erneuten Speicherversuch aus dem
localStorage-Modus: Revision 2, 10.000 Buchungen und 10.000
Journalvorgänge unverändert, einschließlich aller IndexedDB-Stores
mit ihren Schlüsseln und der eingefrorenen localStorage-Kopie.
Die alte UI wies die Änderung mit einem Hinweis auf den anderen Tab
zurück. Ein zusätzlicher direkter Aufruf des unveränderten historischen
Speicheradapters wies sie mit „IndexedDB ist in einem anderen Tab
aktiv“ zurück. Soll und Ist stimmen vollständig überein.
Der Altwriter-Teil ist für diesen Cutover belegt. Beobachtete
OS-Speicherbereinigung und Wiederherstellung auf einem zweiten
autorisierten physischen Gerät bleiben separat offen.
[Prüfnachweis](release-evidence/sw339-incompatible-writer-2026-11-25.json).

### Benchmark · unabhängiger Ein- und Auszahlungsfall

Der [PortfolioAnalyst-Referenzfall von Interactive Brokers](https://www.interactivebrokers.com/images/common/Statements/MWR-TWR_white_paper.pdf)
auf Seite 3 enthält eine Auszahlung von 225.000 USD und eine Einzahlung
von 81.500 USD jeweils am Tagesbeginn sowie fünf Vor- und Endwerte.
Das veröffentlichte Soll ist 0,14 %. Die unabhängige Verknüpfung mit
ganzzahligen Cent-Brüchen ergibt **0,139931612453 %**. FolioLabs
`twr`-Funktion liefert bei denselben bereits flowbereinigten
Teilperiodengrenzen **0,139931612453 %**. Auf Portfolioebene liefert SW339
mit Tagesstichtagen und externem Ab- bzw. Zufluss vertragsgemäß `null`.
Der Snapshot-Vertrag enthält keine belegte Bewertungsgrenze unmittelbar
vor und nach dem Flow. Das gilt einzeln für Einzahlung und Auszahlung.
[Prüfnachweis](release-evidence/sw339-ibkr-twr-flow-2026-11-25.json).

Für VWCE sind [Instrument, Notierungsdatum und Anteilsklasse](https://global.vanguard.com/private-anleger/anlageprodukte/etf/aktien/9679/ftse-all-world-ucits-etf-usd-accumulating)
bestätigt. EODHD beschreibt eine split- und ausschüttungsbereinigte
Schlusskursreihe sowie eine gesonderte Lizenz für externe
Darstellung. Twelve Data dokumentiert Xetra-Such- und EOD-Abdeckung,
externen Anzeigeumfang nach Vertrag und zusätzliche Börsenfreigaben.
Die öffentlichen Yahoo-Finance-Datenangaben schließen Weitergabe aus.
Die Xetra-Open-Data-Reihe ist laut Anbieter eingestellt und für
nichtkommerzielle Zwecke lizenziert. Diese Wege qualifizieren derzeit
keine vollständige kapitalmaßnahmenbereinigte EUR-Reihe für die
konkrete FolioLab-Anzeige. Die fünftägige Stichprobe bleibt der belegte
Marktdatenumfang. Für die Zeilenabnahme fehlen die nutzbare lizenzierte
Reihe und ein belegter Produktpfad für Bewertungen an Flow-Grenzen.
[EODHD-Methodik](https://eodhd.com/help/methodology) ·
[EODHD-Lizenz](https://eodhd.com/help/commercial) ·
[Twelve Data](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage) ·
[Yahoo](https://uk.help.yahoo.com/kb/SLN2352.html) ·
[Open Data](https://registry.opendata.aws/deutsche-boerse-pds/).

### Broker und Buchungsverwaltung · gebuchte Salden und EUR-Abgänge

Der in der Portfolio-Performance-Testsammlung veröffentlichte,
anonymisierte [Trade-Republic-Kontoauszug 24](https://github.com/portfolio-performance/portfolio/blob/024294dd4a7f58aa6b9417126a3f56cb1cc622ab/name.abuchen.portfolio.tests/src/name/abuchen/portfolio/datatransfer/pdf/traderepublic/Kontoauszug24.txt)
weist einen gebuchten EUR-Anfangssaldo von 10.361,85 und einen
gebuchten Endsaldo von 7.324,06 für dasselbe Konto aus. Die drei
gebuchten Abgänge vom 29.–31.12.2024 betragen 18,94, 3.000,00 und
18,85 EUR. Unabhängige Cent-Rechnung und im Dokument ausgewiesene
Zwischensalden stimmen auf allen drei Stufen überein. Der Beleg wurde
für den Test manuell in das generische FolioLab-CSV-Schema übertragen.
Veröffentlicht werden nur Prüfwerte und Quellverweis.

- **AT03.** Auf SW339 in Chromium stimmen beide Anker im
  Kontostandsdialog. Die CSV-Vorschau blieb schreibfrei. Der reguläre
  Import speicherte drei Journale mit gleichem Gegenbetrag für das
  externe Clearing und drei externe Flüsse. Der entstandene
  Stichtagsbezug sperrt die isolierte Rücknahme. Abgebrochenes
  Import-Undo ließ den ganzen Datensatz gleich, bestätigtes Undo
  stellte den exakten Stand vor Import wieder her. Der generische
  EUR-Abgleich ist belegt. Persönliche Konto- und Periodenabnahme
  benötigt weiterhin ihr direkt ausgewiesenes Saldenpaar.
- **FIN-E2E01.** Die bestehende Importfunktion wurde zusätzlich in
  einem isolierten Bestand ohne spätere Beobachtung verwendet. Soll
  bei Wegfall des letzten EUR-Abgangs: 7.342,91 EUR, zwei Flüsse und
  die Journal-Gegenposition der zurückgenommenen Buchung im
  Änderungsbeleg. Alle Werte stimmten. Ein konkurrierender Tab speicherte während der
  geöffneten Rücknahmevorschau eine neue Revision. Der veraltete
  Submit wurde abgelehnt und ließ den vollständigen gewinnenden
  IndexedDB-Datensatz exakt gleich. Undo und frischer portabler
  Restore stellten die bestätigten Portfolio-Bytes wieder her.
  Abgedeckt ist der belegte EUR-Geldabgang. Eine neue Rücknahme mit
  unabhängig prüfbarer Wertpapierkostenbasis bleibt offen.
- **Verwaltung.** Dieselbe EUR-Buchung war im isolierten Bestand über
  die reguläre Verwaltungsoberfläche auswählbar. Abbruch erhielt
  Revision und Bytes. Die bestätigte Einzelrücknahme schrieb genau
  eine Revision. Der Import derselben Identität blieb gesperrt. Die
  bestehende Sperre mit späterem Kontrollpunkt war sowohl nach
  regulärem Import als auch mit separat gesetztem Abschlussstichtag
  wirksam. Umfang: Abbruch, EUR-Rücknahme, Schutz mit Kontrollpunkt,
  genaues Undo und Wiederimportsperre. Die wertpapierbezogene
  Verwaltung mit unabhängig belegter Kostenbasis bleibt offen.
- **FLH05.** Die neue Belegart zeigt EUR-Kontoabgänge. Eine nach
  gemeinsamer Order-ID belegte Fremdwährungs-Teilfüllung samt separater
  Nettoabrechnung wurde damit nicht qualifiziert.
- **FLH03.** In derselben öffentlichen Testsammlung liegen sechs
  native [Trade-Republic-CSV-Fälle](https://github.com/portfolio-performance/portfolio/tree/024294dd4a7f58aa6b9417126a3f56cb1cc622ab/name.abuchen.portfolio.tests/src/name/abuchen/portfolio/datatransfer/traderepublic)
  mit Handels-/Cashkategorie, Originalwährung und Transaktions-ID.
  Für den generischen Regionalfall bleibt die Zuordnung derselben
  CSV-Transaktion zur separaten Abrechnung offen. Die drei
  Kontoauszugsabgänge belegen den manuellen generischen CSV-Pfad.
  Der persönliche TR-Fall bleibt `NOT_APPLICABLE`.

[Prüfnachweis](release-evidence/sw339-at03-public-statement-2026-11-25.json).

### Weitere Wallet-Abdeckung · NEAR-Präzisionsgrenze

SW339 fragte über den realen Produktadapter bei FastNear jeweils den
finalisierten Kontostand von `aurora` und `figment.poolv1.near` ab.
Der zweite öffentliche NEAR-RPC lieferte dieselben Beträge und
Sperrbestände an den identischen Blockhashes. Soll war die exakte
Dezimaldarstellung der YoctoNEAR-Beträge. Beide Konten enthalten
Beträge, die mehr als 18 Nachkommastellen benötigen. SW339 wies beide
mit der ausdrücklich ausgewiesenen Präzisionsgrenze zurück. Für die
betroffenen Daten gab es keine importierbare Position. Der Befund
bleibt eine Produktgrenze bis zu einer exakt nachweisbaren Behandlung
dieser Präzision im bestehenden Mengen- und Journalvertrag.
Externe Delegationen, Rewards und privates Eigentum sind eigene Kriterien.
[NEAR-RPC-Referenz](https://docs.fastnear.com/rpc/account/view-account) ·
[Blockreferenzen und Prüfnachweis](release-evidence/sw339-near-final-precision-2026-11-25.json).

### Weitere Originalanforderungen

- **ETH-Cursor und FLH04.** Der aktuelle private Restnachweis bestätigt
  die öffentliche Mehrseitenabnahme und dokumentiert das weiterhin
  fehlende private ursprüngliche Antwortpaar. #427 hat weiterhin
  keinen unabhängigen Review. Enrollment und Remote-Write bleiben
  bis zur konkreten Sicherheitsfreigabe und autorisierten
  Zwei-Geräte-Abnahme gesperrt.
- **Barausgleich.** Der [Citigroup-Emittentenfall](https://www.citigroup.com/rcs/citigpa/akpublic/storage/public/tap_tax_basis.pdf?ieNocache=165)
  enthält Stückbruchteile, Beispielauszahlungen und zugeordnete
  US-Steuerbasis. Er eignet sich als Rechenvergleich, enthält
  jedoch keine unabhängige tatsächliche Brokerabrechnung desselben
  Vorgangs mit Kosten und Auszahlungs-FX. Für die Produktfreigabe
  bleibt diese Kombination erforderlich.
- **Geräte und Vorschau.** Der bereits autorisierte Geräteumfang
  liefert weiterhin kein verfügbares physisches Android-Projektgerät
  mit Messzugriff und keine native Safari-/VoiceOver-/ITP-Sitzung.
  Android Device Streaming verlangt einen autorisierten
  [Firebase-/Cloud-Projektzugang](https://developer.android.com/studio/run/android-device-streaming).
  Die interne Produktvorschau ist fertig. Öffentliche Bewerbung bleibt
  gemäß Arbeitsentscheidung zurückgestellt.

### Weitere Wallet-Abdeckung · Cosmos Hub

Am finalisierten Block **34.042.495** von `cosmoshub-4` bestätigten
Cosmos Directory, PublicNode und Polkachu denselben Blockhash und
dieselbe Antwort für das öffentliche Selbstdelegationskonto des
Validators Kraken03. Jeder Kontoreadback bestätigte die angeforderte
Blockhöhe. Das vorab aus den Rohbeträgen berechnete Soll war
**9,995 ATOM frei, 1 ATOM delegiert, 0 ATOM in Unbonding**. Der echte
SW339-Adapter lieferte die ersten beiden Positionen einzeln, keinen
Unbonding-Eintrag und den Hinweis auf unvollständige Reward- und
Assetabdeckung. Geprüft ist dieser öffentliche Zustand. Private
Zuordnung, ein positiver Unbonding-Fall und Rewards bleiben offen.
[Cosmos-Staking-Referenz](https://github.com/cosmos/cosmos-sdk/blob/main/x/staking/README.md) ·
[Block und Prüfnachweis](release-evidence/sw339-cosmos-final-balance-2026-11-25.json).

**TRUST01.** Der erneute HTTP-Readback der ausgelieferten Origin
bestätigt weiterhin Antwortstatus 200 ohne HTTP-CSP- und
X-Frame-Options-Header. Der vorhandene Meta-CSP-Beleg und das getrennte
PNG-Reproduktionsprotokoll behalten ihren Umfang. Für die ausstehende
Teilabnahme fehlen ein autorisierter Auslieferungspfad mit wirksamen
HTTP-Headern, natives Safari/VoiceOver/ITP und der Primärnachweis zur
ursprünglichen Zeichnung.

### SW340 · auf Main integriert

[PR #431](https://github.com/joke0071/foliolab-open/pull/431) bestand
die Pflichtintegration einschließlich aller drei Browser-Shards
und den separaten Wallet-Lauf. Der gemeinsame Prüfstamm
`dda5be4ca1d49c6e40712a9c11114408adf2adbd` und der integrierte Main
`7adbf028ff407df2c48f5c8e2e788ed10e8573f0` haben denselben Tree
`09ce84403c8d79be0b077ad33d5ae7fa8e7568a2`. Der [Main-, Pages- und
Live-Lauf 45620573232](https://github.com/joke0071/foliolab-open/actions/runs/45620573232)
läuft. Gezählt sind weiterhin 10/29 Folgepakete.

### Cosmos Hub · positiver Unbonding-Fall

Für die erfolgreiche öffentliche Undelegation im Block **34.042.462**
bestätigt das Ereignis `unbond` **3.487.930 uATOM**. Der
Transaktionsauftrag enthält 3.487.931 uATOM. Im nachfolgenden
finalisierten Block bestätigten alle drei Knoten den Ereignisbetrag
als aktuellen Unbonding-Bestand. FolioLab lieferte **3,48793 ATOM
in Freigabe**, separat von **6,984256 ATOM** Bankguthaben und ohne
verbleibende Delegation. Damit ist auch eine positive Unbonding-Menge
im öffentlichen Adapterpfad belegt. Rewards und die private
Kontozuordnung bleiben offen.
[Prüfnachweis](release-evidence/sw339-cosmos-final-unbonding-2026-11-25.json).

### TRUST01 · lizenzierter Kolbenersatz für die Prüfung

Für die offene ursprüngliche Kolbenzeichnung liegt ein Ersatzkandidat
auf Basis des [Lucide-Kolbens](https://lucide.dev/icons/flask-conical)
aus dem gepinnten [Upstream `f12b0de1`](https://github.com/lucide-icons/lucide/tree/f12b0de177fbc2a6795e99be065887e72b237123)
vor. Das unveränderte Upstream-SVG und sein vollständiger Lizenzhinweis
liegen bei. Die lokale Ableitung verwendet die bestehende Farbpalette
und exportiert transparente PNGs in 192 und 512 px und ein opakes
maskierbares PNG in 512 px. Zwei unabhängige Renderläufe in Chromium
141 verglichen die drei PNGs bytegenau. Der Kantenradius des
Vordergrunds der maskierbaren Fassung lag bei **132,21 px** innerhalb
der 204,8-px-Sicherheitszone. Die Kandidatendateien liegen auf dem
Arbeitszweig als Beleg. Die weiteren Grafikgruppen, native
Safari-/VoiceOver-Prüfung und HTTP-Framingschutz bleiben offen.
[Quelle, Lizenz und Ausgabeprüfung](release-evidence/trust-flask-candidate-2026-11-25/verification.json) ·
[Reproduktion](release-evidence/trust-flask-candidate-2026-11-25/reproduce.mjs).

### Broker-Nachtrag · CSV-Referenzsuche und gemischte Fusion

- **FLH03.** Die sechs regionalen Trade-Republic-CSV-Fixtures
  enthalten zusammen 363 Zeilen. Der Abgleich mit den 249
  anonymisierten Trade-Republic-PDF-Textfällen derselben gepinnten
  Testsammlung ergab drei Kandidaten mit gleicher ISIN und Datum
  im jeweiligen Dokument. Bei keinem stimmte der gebuchte Betrag
  überein. Der untersuchte Wertpapierkorpus liefert damit kein
  belastbares Paar aus Originalexport und unabhängiger
  Einzelabrechnung. Die generische CSV-Abnahme des Kontoauszugs
  bleibt separat belegt.
- **Barausgleich.** Die anonymisierte Trade-Republic-Abrechnung
  zur Slack/Salesforce-Fusion enthält 10 Slack-Aktien, 0,776
  gutgeschriebene Salesforce-Aktien und den fixen Bargeldanteil
  der Fusion. Der [SEC-Emittentenbeleg](https://www.sec.gov/Archives/edgar/data/1764925/000119312520307607/d86251d425.htm)
  bestätigt 0,0776 Aktien und 26,79 USD je Slack-Aktie. Daraus
  ergeben sich 267,90 USD. Mit Broker-FX und ausgewiesenen
  Abzügen ergeben sich exakt 163,68 EUR gebuchter Nettozufluss.
  Die Abrechnung weist dabei die vollständigen 0,776 Aktien aus
  und keinen zusätzlich abgegoltenen Stückrest. SW339 wies die
  automatische Übernahme des kombinierten Geldvorgangs atomar ab.
  Wertpapier- und Cashbestand einschließlich Journal blieben
  unverändert. Für die Zeilenabnahme bleibt ein tatsächlicher
  Stückrest-Ausgleich samt ausgewiesener Steuerbasis offen.
  [Prüfnachweis](release-evidence/sw339-slack-merger-boundary-2026-11-25.json).

### CI-Effizienz · Pflichtpfad paaren

Der erste serielle Versuch führte die vorhandenen Chromium-, drei
Cross-Engine- und Wallet-Pflichtjobs auf demselben lokalen Rechner aus.
Installierte Versionen: Chromium 141, Firefox 157, WebKit 27.2,
Node 22.23.5 bzw. 20.20.2. Neun logische CPUs waren zugänglich.
Wallet und Shard 1 bestanden. Nach 27:00 endete der letzte Job.
Chromium und Shard 3 hatten zuvor wegen des zunächst fehlenden
Axe-Dateipfads am geteilten Fixture-Server abgebrochen. Der Pfad
wurde für die Folgeläufe korrigiert.

Shard 2 brach mit einem WebKit-Axe-Befund in der Buchungsliste ab.
Der isolierte Nachlauf reproduzierte den Befund bei 412 und 430 px
mit dem Debian-WebKit und mit dem Ubuntu-WebKit-Build auf demselben
lokalen Host. Die Schaltfläche besitzt 77 × 44 px. In der beobachteten
Scrollposition sind durch die Kopfzeile nur 15,7 px Höhe frei
anklickbar. Das ist ein eigener Befund außerhalb des geprüften
„Mehr“-Übergangs. Die fehlgeschlagene Pflichtstrecke liefert keine
vergleichbare Gesamtzeit.
[Lokaler Mess- und Geometriebeleg](release-evidence/sw339-local-ci-baseline-diagnostic-2026-11-25.json).

Für den vollständigen Vergleich läuft eine [isolierte Ubuntu-Matrix](https://github.com/joke0071/foliolab-open/actions/runs/45623781167).
Jeder Browser-Pflichtjob und Wallet laufen innerhalb eines
Runnerjobs einmal seriell/parallel und in einem zweiten Runnerjob
in umgekehrter Reihenfolge. Beide Varianten verwenden
die unveränderten Appbytes und die jeweiligen Original-Prüfkommandos.
Die Messung erfasst Liste, Ausstiegsstatus, Dauer, CPU und Speicher
je Job. Für die modellierte Dauer des gleichzeitig gestarteten
Pflichtpfads zählt je Reihenfolge der längste Pflichtjob.
Diese Messung ist von der tatsächlichen GitHub-Laufdauer mit
Installation, Zuteilung, Pages und Live getrennt.
[#430](https://github.com/joke0071/foliolab-open/pull/430) bleibt bis
zum reproduzierbaren, vollständigen Gewinn zurückgestellt.

### SW340 · veröffentlicht und Zielprüfung auf der Produktivseite

Die Pflichtjobs auf Main und Pages sind grün. Der Originalbeleg
`15026602135` bestand SHA-256 und ZIP-CRC und enthält **1.533/1.533
erfolgreiche Node-Tests**. Das erneut aus GitHub
gelesene Pages-Original `15024890193` bestand SHA-256 und ZIP-CRC.
Alle **159 Paketdateien** waren bytegleich mit Main. Auf
`https://foliolab.unperfekt.at/` wurden `/`, `/index.html` und `/sw.js`
erneut abgerufen. Alle drei Antworten waren bytegleich mit Main
`7adbf028`. Der echte Browserzoom in sichtbarem Firefox bestand auf
dieser ausgelieferten Origin ebenfalls. Bei 200 % und 320 CSS-Pixeln
blieben alle drei Ziele per Tab und Umschalt+Tab erreichbar. Entwurf,
Fokus-Rückweg und Gleichheit des vollständigen IndexedDB-Datensatzes
bestanden. Ein weiterer sichtbarer Produktionslauf mit Firefox 157
bestand dieselben OS-Tasten, 640 → 320 CSS-Pixel bei DPR 2 und
CSS-Zoom 1. WebKit 27.2 bestand auf dem lokalen SW340-Stand
bei 320 px und in der separaten CSS-Vergrößerung bei 200 %.
Separat wurde die in der lokalen Buchungsliste beim
Scrollen teilweise verdeckte Bearbeiten-Taste auf SW340 per
Tastatur geprüft. Der tatsächliche Fokus brachte die gesamte
44-px-Treffhöhe unter die Kopfzeile.

Der erste [Livejob](https://github.com/joke0071/foliolab-open/actions/runs/45620573232/job/139239730947)
bestand 11 Kerngruppen, 22 Axe-Scans und 160 Dateiübereinstimmungen.
Die gesonderte PWA-Ladeprüfung erreichte nach simuliertem verzögertem
Modulstart in Zeile 37:19 das 30-Sekunden-Limit. Der zurückgelesene
Live-Beleg `15026562830` zeigt den ersten Wartepunkt unmittelbar
nach dem Freigeben der App-Anfrage vor dem Reload. Ein konkreter
HTTP-Fehler ist für diesen Versuch nicht ausgewiesen. Der
[gezielte Wiederanlauf desselben Livejobs](https://github.com/joke0071/foliolab-open/actions/runs/45620573232/job/139241875358)
verwendete denselben Main-SHA und dieselben Prüfungen. Der Wiederanlauf
bestand vollständig in Chromium, Firefox und WebKit. **SW340 ist auf
`7adbf028` LIVE_ACCEPTED.** Der ZIP-Rückabruf `15031490573` bestand
SHA-256 und CRC für alle **1.947 Einträge**. Der Lauf bestätigt **160**
bytegleiche Produktivpfade, **11** Kerngruppen und **22** Axe-Scans.
Die Loader-, UI-, Finanz- und Restore-Prüfungen liefen im regulären
Pfad. Der direkte Abruf von `/`, `/index.html` und `/sw.js` war auch
nach dem Live-Abschluss bytegleich mit Main.
[Produktivnachweis](release-evidence/sw340-published-focus-2026-11-25.json).

### Barausgleich · gebuchter Vodafone-Stückrest

Im [Vodafone-Emittentenbeleg](https://www.vodafone.com/news/newsroom/corporate-and-financial/vz-shares-and-ratio-announcement)
gilt das Verhältnis sechs neue zu elf alten Aktien. Für die im
[veröffentlichten Tatbestand, Rn. 9](https://nrwe.justiz.nrw.de/pdfdownload/downloadEntscheidung.php?entscheidung=%2Fnrwe%2Ffgs%2Fmuenster%2Fj2018%2F9_K_2117_16_E_Urteil_20180228.html)
genannten 709.933 Altaktien ergibt das 387.236 ganze Aktien und
den exakten Rest 2/11. Die dort dokumentierte Depotbank buchte
387.236 Aktien und schrieb für den gerundeten Rest von 0,1818 Aktien
**0,48 EUR** gut. Damit liegt zusätzlich zur Slack-Fusion ein
tatsächlich gebuchter Stückrest vor.

SW340 wies Split und Geldanteil gemeinsam ab. Vollständiges Modell
und wieder eingelesene Sicherung stimmten mit dem Vorzustand
überein. Der reine Split ohne Ausgleich ergab erwartungsgemäß
387.236,181818181818181818 Aktien und keinen Cashzufluss. Dieser
Pfad bildet die konkrete Brokerabrechnung daher nicht ab.
Die im Tatbestand genannten Anschaffungskosten gehören zu den
separat zugeteilten Verizon-Aktien. Für den Vodafone-Stückrest
fehlt weiterhin die Abrechnung mit zugeordneter historischer
Steuerbasis, Kosten und Auszahlungs-FX. Der
[Revisionsentscheid](https://www.bundesfinanzhof.de/en/entscheidungen/entscheidungen-online/decision-detail/STRE202110192/)
hob das erste Urteil auf und dient hier zur Einordnung des
Verfahrensstands.
[Prüfnachweis](release-evidence/sw340-vodafone-fractional-reference-2026-11-25.json).

### UI-SENTIMENT01 · Originalquellen auf SW340

CoinMarketCap lieferte am offiziellen Keyless-Endpunkt HTTP 200,
einen numerischen Wert und einen Aktualisierungszeitpunkt. Chromium
verweigerte von der aktuellen FolioLab-Origin aus den Abruf. Das
fehlende `Access-Control-Allow-Origin` ist im Browserprotokoll und
im separaten HTTP-Abruf belegt. Der
[CMC-Leitfaden](https://coinmarketcap.com/api/resources/coinmarketcap-keyless-public-api-guide-developers-guide/)
verweist für den Produktionseinsatz auf die authentifizierte API.

Ein gewöhnlicher Abruf der CNN-Indexseite erreichte die öffentliche
internationale Seite. Deren Antwort enthielt eine
`frame-ancestors`-Liste ohne FolioLab. Ein unabhängiger Frame-Versuch
erhielt eine abweichende Browserantwort ohne diesen Header.
Auf SW340 selbst meldete Chromium beim Einbettungsversuch zuverlässig
eine Verletzung von `frame-src`. Damit ist die öffentlich erreichbare
Indexseite kein qualifizierter Produktabruf. Offen bleiben der offiziell
erlaubte Feed für die kompakte Aktienanzeige und der für FolioLab
zugelassene CMC-Abruf samt dokumentiertem Anzeigeumfang. Beide
Originalwerte wurden in der App nicht aktiviert.
[CNN-Lizenzweg](https://commercial.cnn.com/contact-us/) ·
[Prüfnachweis](release-evidence/sw340-sentiment-source-gates-2026-11-25.json).

### AT05 · getrennte Jahres- und Fachbelege

Die [flatex-Dokumentation](https://www.flatex.at/service/faqs/detail/steuern/allgemein-zu-steuern/welche-steuerdokumente-werden-ausgegeben/)
bezeichnet die detaillierte Gesamtaufstellung der steuerlichen
Wertpapierumsätze als Erträgnisaufstellung. Das [BMF](https://findok.bmf.gv.at/findok/iwg/83/83598/83598.1.pdf#page=150)
unterscheidet die bis einschließlich 2024 relevanten Vorgaben von
dem ab 2025 geltenden Steuerreporting. Für 2022 wäre eine
Jahresbescheinigung oder Erträgnisaufstellung desselben Depots der
nächste Beleg. Die veröffentlichte Einzelabrechnung und die OeKB-Meldung
tragen den Einzelfall. Der [unabhängige PwC-Fachleitfaden](https://www.oegsw.at/static/content/e2/e6/e21/e6158/e7723/download/ger/2025-10%20Veranlagung%20Fondsertr%C3%A4ge.pdf?checksum=446c84ad28ac3767e9508eaf1fba1f6bfcd3f9c7)
bestätigt in den allgemeinen Hinweisen Meldewährung, Stückzahl am
Zuflussstichtag und gesondert gemeldete Anschaffungskostenkorrektur.
Er prüft keine Jahresergebnisse des konkreten Depots. Diese
Jahresabrechnung und die fallbezogene unabhängige Jahresprüfung
sind weiterhin gesonderte offene Kriterien.

### CI-Effizienz · vollständiger lokaler Kandidatenversuch

Für #430 liefen Chromium, drei Cross-Engine-Shards und Wallet auf
demselben Debian-Host mit identischen Browser- und Node-Versionen wie
die serielle Referenz. Wallet und die Shards 1 und 3 bestanden.
Chromium brach im Dialog-Bildvergleich mit Pixeldifferenzen und
abweichenden Wallet-Dialogmaßen ab. Shard 2 reproduzierte im
WebKit-Lauf denselben Befund an der teilweise verdeckten
Bearbeiten-Taste in der Buchungsliste. Ende des letzten Jobs
nach **30:03**, ohne Wiederanlauf. Der Lauf ist wegen der
fehlgeschlagenen Gates kein Geschwindigkeitsbeleg. Erfasst sind
Jobzeiten, Ressourcen und Hashes der per Job geplanten Prüfkommandos.
[Lokaler Vergleich](release-evidence/sw339-local-ci-baseline-diagnostic-2026-11-25.json).

### FLH05 · separate IBKR-Order- und Cash-Belege

Der [offizielle Flex-CSV-Musterreport](https://www.interactivebrokers.com/docs/web-api/api-reference/get-statement)
zeigt drei AAPL-Ausführungen mit derselben Order-ID. Aus Stückzahl
und Ausführungspreis ergeben sich **200 Stück zu insgesamt
61.991,20 USD brutto**. Gebühren, Umrechnung und der separat gebuchte
Nettobetrag sind im Beispiel nicht ausgewiesen. Die
[Trades-Spezifikation](https://www.ibkrguides.com/reportingreference/reportguide/tradesfq.htm)
definiert Net Cash als Rechenfeld derselben Trades. Der getrennte
[Statement of Funds](https://ibkrguides.com/reportingreference/reportguide/statement%20of%20fundsfq.htm)
wäre der geeignete Cash-Sollbeleg mit tatsächlich gebuchtem Betrag,
Währung und Trade-ID. In den beiden zusätzlich gepinnten
öffentlichen Flex-Testsammlungen fand sich keine passende Gruppe
mit mehreren Ausführungen und zugehöriger Cash-Ledger-Zeile.
Das Providerbeispiel qualifiziert die Mehrfachausführung als
Belegart. Der vollständige FLH05-Test benötigt weiterhin die
separate Nettoabrechnung derselben Gebühren-/FX-Gruppe.
[Quellen- und Prüfliste](release-evidence/ibkr-order-and-net-cash-source-search-2026-11-25.json).

### Cosmos Hub · positive ausstehende Rewards

Drei unabhängige Endpunkte lieferten auf Block **34.043.049** dieselbe
finalisierte Blockidentität und denselben ausstehenden
Reward von **0,032072533799423334 ATOM** im öffentlichen Kraken03-
Selbstdelegationskonto. Die tatsächlichen Bank- und Stakebestände
waren **9,995 ATOM** frei und **1 ATOM** delegiert. SW340 zeigte
exakt diese beiden Mengen, führte keinen noch ungezahlten Reward
als Besitz und meldete die fehlende vollständige Reward-Abdeckung.
Der positive öffentliche Fall belegt die Abgrenzung gegen
Doppelzählung. Import und Abgleich tatsächlich ausgezahlter Rewards
sowie private Kontozuordnung bleiben gesondert.
[Block und Prüfnachweis](release-evidence/sw340-cosmos-unclaimed-reward-2026-11-25.json).

### Barausgleich · Lorillard/Reynolds mit Anschaffungskosten

Der [SEC-Emittentenbeleg](https://www.sec.gov/Archives/edgar/data/1275283/000119312515221972/d941569d8k.htm)
bestätigt je Lorillard-Aktie 0,2909 Reynolds-Aktien und 50,50 USD.
Aus 2.000 Aktien folgen exakt 581 ganze neue Aktien, 0,8 als
Stückrest und 101.000 USD fester Bargeldanteil. Der
[Bundesfinanzhof VIII R 44/18](https://www.bundesfinanzhof.de/de/entscheidung/entscheidungen-online/detail/STRE202210151/)
gibt für denselben Fall die Bankwerte getrennt wieder. 89.801,73 EUR
Barzuzahlung, 49,29 EUR Spitzenausgleich und 35.796,54 EUR Wert
der eingebuchten Aktien ergeben 125.647,56 EUR. Nach den im
Revisionsentscheid ausgewiesenen Anschaffungskosten beider Lose von
insgesamt 78.034,13 EUR stimmen **47.613,43 EUR** mit dem deutschen
Entscheidungssoll überein.

SW340 wies die automatische Fusion sowohl mit dem Stückrest
als auch mit beiden Geldkomponenten zusammen ab. Gegenpositionen,
volle Kostenbasis, Journal und wieder eingelesene Sicherung blieben
in beiden Versuchen exakt gleich. Qualifiziert sind der historische
Gesamtfall und die atomare Abweisung. Für eine eigene Buchung des
Stückrests fehlen der separate Auszahlungs-FX, die gesonderten
Abwicklungskosten und eine ausgewiesene Einzelzuordnung der
Anschaffungskosten. Die deutsche Fallentscheidung liefert keine
österreichische Regel.
[Rechen- und Produktbeleg](release-evidence/sw340-lorillard-merger-court-reference-2026-11-25.json).

### CI-Effizienz · Entscheidung nach beiden vollständigen Paaren

Alle zehn [Ubuntu-Paare](https://github.com/joke0071/foliolab-open/actions/runs/45623781167)
bestanden ohne Jobwiederanlauf. Pro Job waren die ausgeführten
Prüfkommandos gleich. Der Kandidat enthielt zusätzlich den vorgesehenen
Node-Vertrag für Parallelität (1.534 statt 1.533 Tests). Die P1A-Phasen
hatten je Engine in beiden Varianten jeweils zwölf Initialisierungen,
42 responsive Prüfungen und 42 Screenshot-Ausgaben. Alle zehn
Originalartefakte wurden über SHA-256 und ZIP-CRC geprüft. Die
Prüflisten, Browserstände, CPU-/Speicherwerte sowie die Dauer
innerhalb und außerhalb P1A sind festgehalten.

| Reihenfolge | Letzter modellierter Pflichtjob | Seriell | Parallel | Gewinn |
| --- | --- | ---: | ---: | ---: |
| Seriell → parallel | Chromium einschließlich Node und Syntax | 22:49,24 | 22:16,70 | 32,54 s |
| Parallel → seriell | Firefox/WebKit, Shard 2 | 26:54,72 | 25:48,12 | 66,60 s |

Die zwei seriellen Referenzen liegen **4:05,48** auseinander.
Der modellierte Zeitgewinn liegt in beiden Paaren innerhalb dieser
beobachteten Streuung. Erfasst ist die längste Laufzeit der parallel
gestarteten Pflichtjobs auf Loopback. Installation, Runnerzuteilung,
Pages und Live liegen außerhalb dieses Paarvergleichs. Die korrigierte
lokale serielle Probe endete nach 32:06 und reproduzierte die
Chromium-Bildabweichungen sowie den WebKit-Befund aus dem lokalen
Parallelversuch. Beide Debian-Läufe liefern wegen dieser Pflichtfehler
keine belastbare Laufzeitdifferenz. **#430 bleibt zurückgestellt.**
Für die Freigabe fehlt ein Gesamtgewinn außerhalb der Streuung,
einschließlich des regulären Releasepfads.
[Prüflisten, Messdaten und geprüfte Originale](release-evidence/ci-430-full-local-path-pairs-2026-11-25.json).

### SW340 · NEAR-Mengengrenze im normalen Wallet-Pfad

Getesteter Produktstand [Main `7adbf028`](https://github.com/joke0071/foliolab-open/commit/7adbf028ff407df2c48f5c8e2e788ed10e8573f0). FastNear und NEAR RPC lieferten bei erneutem Abruf desselben finalisierten Blocks 226.157.919 bytegleiche Antwortkörper. Das unabhängige Soll lautet **145768498431409676817125837316 YoctoNEAR** bzw. **145768,498431409676817125837316 NEAR**. Auf dem 18-stelligen Raster bleiben **837316 YoctoNEAR** außerhalb der Darstellbarkeit.

Chromium 141, Firefox 157 und WebKit 27.2 führten die Wallet-Oberfläche mit den gepinnten RPC-Bytes über isolierten Transport aus. Zwei bekannte, darstellbare Kontrollmengen erschienen als **2,5 NEAR frei** und **1,25 NEAR gesperrt**. Nach Übernahme, Wiederöffnung, lokalem Backup und Restore in einem frischen Browserprofil ergab die Rückrechnung exakt die beiden atomaren Ausgangsmengen. Der öffentliche Aurora-Fall zeigte vor der Vorschau die Präzisionsmeldung, erzeugte keine Ergebniszeile und ließ die Übernahme gesperrt. Inhalt und Revision des IndexedDB-Datensatzes blieben exakt gleich.

Die erste Grenze ist [`atomicDecimal()` → `units()`](https://github.com/joke0071/foliolab-open/blob/7adbf028ff407df2c48f5c8e2e788ed10e8573f0/src/decimal.js#L59). Derselbe Wert wurde gesondert von Positionserstellung, Restore des Eröffnungsbestands, Journal-Mengenprüfung und Backup-Restore abgelehnt. Validator, Wallet-Metadatum `decimals: 24` und Positionstext allein ändern den Mengenvertrag nicht. Ein exakter Import braucht eine durchgängige Repräsentation samt Rechenregeln für Position, Eröffnungsmenge, Journal-Deltas und Restore-Kompatibilität. Die sichere Ablehnung bleibt aktiv. Belegt sind der bisherige Weg und die Vertragsgrenze. Der positive 24-stellige Import, Rewards-Abdeckung und private Kontozuordnung bleiben offen.

[Maschinenbeleg](release-evidence/sw340-near-precision-roundtrip-2026-11-25.json) · [Reproduktion](release-evidence/sw340-near-precision-roundtrip-2026-11-25.mjs).

### SW340 · Fondsverkauf mit unabhängiger Kostenbasis und Gegenbuchung

Im [BFH-Urteil VIII R 22/23](https://www.bundesfinanzhof.de/de/entscheidung/entscheidungen-online/detail/STRE202610013/) gehören die 386 Fondsanteile, die 39.303,64 EUR historischen Anschaffungskosten, der Verkauf für 39.819,76 EUR, die Provision von 69,90 EUR und die tatsächliche Bankauszahlung von 39.038,06 EUR zu demselben Geschäft. Aus 674,70 EUR Steuer und 37,10 EUR Zuschlag folgen 711,80 EUR gesamter Abzug. Die unabhängig ermittelten Sollwerte waren vor dem Import fixiert. Der Buchungstag 31.12.2018 und der auf null gesetzte Cash-Anfang sind Testparameter. Die Quelle nennt das Verkaufsjahr und den Cash-Zugang, jedoch keinen konkreten Verkaufstag oder Kontosaldo.

Auf [SW340](https://github.com/joke0071/foliolab-open/commit/7adbf028ff407df2c48f5c8e2e788ed10e8573f0) ergaben der allgemeine CSV-Import und das Journal **386 Stück Abgang**, **39.038,06 EUR Cash-Zugang** und Kostenbasis null nach vollständigem Verkauf. Das Journal buchte Provision und Steuer einzeln und erzeugte keinen externen Kapitalfluss. 446,22 EUR Ergebnis vor Steuer entsprechen dem Urteil. Das Ergebnis im FolioLab-Ledger nach den erfassten Abzügen beträgt −265,58 EUR. Abgebrochener Undo ließ selbst die Revision gleich. Der Import-Undo stellte den kompletten vorherigen Datensatz bytegleich wieder her. Wiederimport, Backup, frischer Restore und Wiederöffnung reproduzierten den bestätigten Zustand.

Die einzelne Rücknahme über die Buchungsverwaltung blieb gesperrt. Die Oberfläche nennt importierte Herkunft, Begrenzung auf qualifizierte EUR-Geldbuchungen, Kostenverknüpfung und späteren Kontrollpunkt. Der Prüfversuch änderte keine Bytes und keine Revision. Der Referenzfall und die reguläre Import-/Undo-/Restore-Kette sind damit auf Chromium, Firefox und WebKit belegt. Für die Zeilen FIN-E2E01 und Verwaltung bleibt die gezielte wertpapierbezogene Rücknahme mit vollständigem Gegenbuchungs- und Kontrollpunktvertrag offen.

[Maschinenbeleg](release-evidence/sw340-fund-disposal-roundtrip-2026-11-25.json) · [Reproduktion](release-evidence/sw340-fund-disposal-roundtrip-2026-11-25.mjs).

### AT05 · Produktgrenze der automatischen Einstandszuordnung

Der unabhängige Sollwert aus OeKB-Feld 10289 und der Flatex-Abrechnung ist eine Erhöhung um rund **0,01499605 EUR je Anteil**. Die gezielte Prüfung mit dem Instrument, den 8.622,7 Anteilen und einer synthetischen Transkription im Flatex-CSV-Schema erreicht auf SW340 die Klassifikation `accumulation`. Der Produktadapter hält die Zeile als `event-review`; die Übernahme bleibt gesperrt und die gesetzte Kontroll-Kostenbasis bleibt exakt gleich. Die synthetische Transkription prüft die Produktgrenze. Jahresabrechnung desselben Depots, unabhängiger Jahresfachbeleg und positive automatische Zuordnung sind weiter offen. Die öffentliche [Einzelabrechnung](https://www.broker-test.at/steuern/fondsthesaurierung/) und [flatex-Dokumentation](https://www.flatex.at/service/faqs/detail/steuern/allgemein-zu-steuern/welche-steuerdokumente-werden-ausgegeben/) belegen unterschiedliche Umfänge.

[Prüfnachweis](release-evidence/sw340-at05-cost-basis-boundary-2026-11-25.json).

### TRUST01 · Auslieferungsabgleich und SW341

HTML und alle vier Kolbendateien wurden von der produktiven SW340-Origin zurückgelesen und stimmen bytegleich mit Main überein. Alle 20 Inline-SVGs stimmen einzeln mit den gepinnten v316-Fragmenten überein. `format.js` und die sieben Positionszeichen sind bytegleich zu v316. Die Herkunftsbelege der ursprünglichen Funktionszeichen, Inline-Zeichen einschließlich Kalender und Anlageklassenzeichen bleiben jeweils offen. Loader und Diagramme verwenden lokale Geometrie. Auch die seit v316 geänderte Portfolio-Projektion zeichnet berechnete Linien.

Im Kandidaten [SW341](https://github.com/joke0071/foliolab-open/commit/c33aefacdd2d3f46f72c74b080219bb314703845) deckt der vorbereitete Ersatz jedes der vier Manifest-Assets ab. Upstream-SVG und ISC-Lizenz stimmen mit Lucide 0.468.0 überein. Die Lizenz wird neben den Icons ausgeliefert und mit der PWA gecacht. Lokal bestanden Syntax, 1.533 Node-Tests und Chromium-Loading/PWA. Nach einem Offline-Reload waren alle vier Icon-Dateien und die Lizenz bytegenau abrufbar. [PR #432](https://github.com/joke0071/foliolab-open/pull/432) bestand die [Pflichtintegration](https://github.com/joke0071/foliolab-open/actions/runs/45649013303) und das [Wallet-Gate](https://github.com/joke0071/foliolab-open/actions/runs/45649013359). Der geprüfte Merge-Stand und [Main `162d76ae`](https://github.com/joke0071/foliolab-open/commit/162d76aeba6a441d761cac1132e964516a867b3e) sind baumgleich. Im lokalen Wechsel SW340 → SW341 hielt Chromium einen zuvor in der Oberfläche gespeicherten Datensatz nach Aktualisierung und Offline-Neuladen byte- und revisionsgleich. Die SW340-HTTP-Antwort hatte weder CSP- noch X-Frame-Options-Header. Die vier Kolbendateien und der Lizenztext sind auf der Produktivdomain bytegenau bestätigt. Das Pages-Original `15041691232` bestand SHA-256- und ZIP-CRC-Prüfung, alle 160 Dateien stimmen mit Main überein. [Main und Pages](https://github.com/joke0071/foliolab-open/actions/runs/45651922252) sind grün. Der [Live-Abnahmelauf](https://github.com/joke0071/foliolab-open/actions/runs/45651922252/job/139349885940) bestand im ersten Versuch in Chromium, Firefox und WebKit. Das Live-Original `15046896303` bestand SHA-256- und ZIP-CRC-Prüfung. Es enthält 161 bytegleiche URL-Antworten, elf Funktionsgruppen und 22 Axe-Prüfungen sowie die drei Loading-/PWA-Berichte. **SW341 ist LIVE_ACCEPTED.** Die Teilabnahme betrifft die vier veröffentlichten Kolbendateien und die ISC-Lizenz samt Offline-Cache. Native Safari/VoiceOver/ITP und wirksamer HTTP-Framingschutz bleiben eigene Kriterien.

[Inventar, Datei- und Lizenzhashes](release-evidence/sw340-trust-inventory-sw341-2026-11-25.json) · [Pages, Origin-Readback und Live-Abnahme](release-evidence/sw341-pages-and-origin-2026-11-25.json).

### Cosmos Hub · ausgezahlter Reward und Gebührengegenprobe

Drei CometBFT-Endpunkte lieferten dieselbe erfolgreiche Transaktion `F0F894B8…B9569D` auf Block **34.044.337**. Zwei separate Block- und Ergebnisabrufe bestätigten die Transaktionsbytes am selben Index und den Zahlungsevent. Drei REST-Endpunkte bestätigten die Bankbestände vor und nach dem Block über den jeweiligen Höhenheader. Das unabhängige Soll in µATOM ist **281.159 + 536.836 − 6.823 = 811.172**. Bankeingang und `withdraw_rewards` bestätigen denselben Reward. Der Wallet-Adapter auf SW340 gab **0,811172 ATOM frei** und die zwei Delegationsbestände getrennt aus. Der abgegoltene Reward erschien nur im freien Bestand und erzeugte keine zusätzliche Position oder Einnahmebuchung. Damit ist die Berücksichtigung im Bestand belegt. Ein historischer Reward-/Gebührenimport und die private Zuordnung bleiben offen.

[Positionen, Blockidentität und Antwortprüfsummen](release-evidence/sw340-cosmos-paid-reward-2026-11-25.json).

### Weitere Freigabewege · zusätzliche Quellenprüfung

- **FLH05.** Die öffentlichen [IBKR-Activity-Beispiele](https://www.interactivebrokers.eu/images/common/Statements/sample_html_individual.htm) für Individual, Introducing Broker und Prime enthalten Ausführungslisten und Cash-Übersichten. Das separate Cash-Ledger mit Trade-/Order-Bezug fehlt. Im gepinnten [ibflex-Quellstand](https://github.com/csingley/ibflex/tree/9cfc26c574b10ddebd1b31acffeb02caf4ff5b4e) gehört die in der README ausgewiesene WMIH-Teilausführung zu einem anderen Trade als die Cash-Ledger-Testzeile. Die Quellen tragen keinen gemeinsamen Fall. Der fehlende Nachweis bleibt die separate Nettoabrechnung derselben Gebühren-/FX-/Teilausführungsgruppe.
- **Barausgleich.** Der [SEC-Fusionsvertrag, § 2.02(f)](https://www.sec.gov/Archives/edgar/data/1275283/000119312514423543/d803939ds4a.htm) bestätigt für denselben Lorillard/Reynolds-Stückrest einen Fünf-Tage-VWAP als USD-Berechnungsbasis. Das [Clearing-Memo #36892](https://www.miaxglobal.com/sites/default/files/alert-files/LO_Merger_36892.pdf) dokumentiert die getrennte Abwicklung. Belegt sind die Preisformel und die getrennte Ausgleichskomponente. Für die konkreten 49,29 EUR fehlen weiterhin der tatsächlich angewandte Auszahlungs-FX, separate Kosten und der diesem Bruchteil zugeordnete Einstand.
- **VWCE.** [Deutsche Börse](https://live.deutsche-boerse.com/en/etf/vanguard-ftse-all-world-ucits-etf-usd-accumulating/price-history/historical-prices-and-volumes) führt das exakte Instrument und bietet eine historische Ansicht mit Anpassungsoptionen. [Twelve Data](https://support.twelvedata.com/en/articles/12682324-end-of-day-eod-pricing-market-data) nennt einen vollständigen historischen EOD-Datenumfang und abgestufte Ausgaberechte. Die konkreten Vertragsrechte für FolioLab liegen nicht vor. [Yahoo](https://help.yahoo.com/kb/SLN2310.html) untersagt die Weiterverteilung. Der [eingestellte Xetra Public Data Set](https://registry.opendata.aws/deutsche-boerse-pds/) gab beim dokumentierten anonymen S3-Zugriff für drei Datumsprefixe `403 AccessDenied` zurück. Die Fünf-Tage-Probe bleibt erhalten. Kein weiterer qualifizierter Serienvergleich.
- **FLH03/FLH03-18.** Der [Portfolio-Performance-Thread](https://forum.portfolio-performance.info/t/import-trade-republic-csv-transaktionsexport/39126) enthält Transaktionsexportbeispiele und einzelne Zeilen, aber keine separat daneben belegte Abrechnung desselben regionalen Geschäfts. Öffentliche [SOL-Treuhandberichte](https://www.sec.gov/Archives/edgar/data/1896677/000189667726000020/gsol-20260930.htm) belegen datierte Gesamtbestände beziehungsweise die Staking-Tätigkeit. Eine unabhängige Zuordnung der exakt gleichen Ledger-/Stakingposition bleibt erforderlich.
- **Recovery und Startperformance.** Der autorisierte Umfang aus der Android-Gerätecheckliste und der Windows-Abnahme wurde erneut geprüft. Der verfügbare Linux-Executor hat keinen physischen Android-/ADB-Testendpunkt und keine native Safari-/VoiceOver-Sitzung. Der [Firebase-Weg](https://developer.android.com/studio/run/android-device-streaming) erfordert eine eingerichtete, autorisierte physische Projektsitzung. Die ausstehenden Restore-, Eviction- und Startmessungen wurden daher separat offen gehalten.
- **FLH04, ETH-Cursor und CI.** #427 weist weiterhin null eingereichte Reviews und null Reviewthreads aus. Der veröffentlichte Prüfauftrag trägt noch keine externe Freigabe. Beim historischen ETH-Cursor zählt weiterhin das ursprüngliche Antwortpaar. Der Stand von #430 enthält keine neue Änderung für einen weiteren aussagekräftigen gepaarten Lauf. Die serielle Pflichtstrecke bleibt in SW341 aktiv.
- **UI-SENTIMENT01, AT03 und Produktmaster.** Die [CMC-Dokumentation](https://coinmarketcap.com/api/documentation/pro-api-reference/keyless-public-api/) bestätigt den bereits geprüften öffentlichen Endpunkt. Der FolioLab-Origin- und CNN-Anzeigepfad bleibt offen. Für AT03 liegt der öffentliche EUR-Saldovergleich vor. Für die private Zeile fehlt weiterhin der passende persönliche Kontozeitraum. Die interne Produktvorschau ist fertig und die öffentliche Bewerbung bleibt zurückgestellt.

### Übernahme · SW342-Kandidat und Nachweise vom 25.11.2026

Der Direktabgleich beim Einstieg bestätigte Main `162d76ae` und den Arbeitsplanzweig `9cabe0c2` unverändert. Der unabhängige Origin-Abruf glich alle 160 erwarteten Cache-Pfade einschließlich Service Worker bytegenau ab. Der Arbeitsplanzweig enthält die Live-Nachweise getrennt vom Produktzweig. Maßgeblich ist die Paketmatrix am Ende.

**FIN-E2E01 · unabhängiges Soll vor dem Test.** Die Centrechnung zu [BFH VIII R 22/23](https://www.bundesfinanzhof.de/de/entscheidung/entscheidungen-online/detail/STRE202610013/) ergibt für die Rücknahme +386 Anteile, +39.303,64 EUR Einstand, −39.038,06 EUR Verrechnung und die Entfernung des Verkaufsbeitrags von −265,58 EUR. Die über diesen Verkauf gebuchten 69,90 EUR Provision und 711,80 EUR Steuern einschließlich Zuschlag entfallen. Das aktive Verkaufsjournal mit vier Posten entfällt und ein neutraler Nachweis erhält die Originale. Der Verkauf erzeugt keinen externen Kapitalfluss. Ein gesonderter Fluss von +25,51 EUR gehört zur unabhängigen Testbuchung. Der 31.12.2018, der Cash-Anfangssaldo von null, die lokalen Referenzen und der unabhängige Bestand sind Testparameter. [Vorab-Soll](release-evidence/sw342-fund-sale-soll-2026-11-25.txt)

**FIN-E2E01 · Ist.** Chromium, Firefox und WebKit erreichten alle Sollwerte. Im isolierten Portfolio erzeugt der reguläre CSV-Import mangels EUR-Kurs einer unabhängigen USD-Position keinen vollständigen Kontrollpunkt. Die separat gebuchte Einzahlung, ihr Journal und ihr externer Kapitalfluss blieben erhalten. Eine Wiederimportvorschau vor und nach frischem Backup-Restore konnte die Quelle nicht erneut anlegen. [Produktcommit](https://github.com/joke0071/foliolab-open/commit/9ff78374d8dcff659fb16284bddab3c49f2595a2) · [Ergebnis je Browser](release-evidence/sw342-fund-sale-removal-2026-11-25.json)

**Verwaltung · Ist.** Die Auswahl im regulären Verwaltungsdialog, Prüfung und bestätigte Rücknahme erhöhten die Revision genau einmal. Abbruch, veraltete Bestätigung und Gegenfall hinterließen die jeweils aktuellen Bytes und die Revision unverändert. Beim Kontrollfall besitzt derselbe Verkauf einen späteren aktuellen Vollstichtag aus dem regulären CSV-Import. Beide Verwaltungszugänge sperrten ihn. Auch ein ausgelöstes Formularereignis konnte die Schreibsperre nicht umgehen. Der Node-Test prüft separat fehlende Herkunft, abweichende Kosten, fehlenden Eröffnungseinstand, einen späteren Cash-Abgang und einen Kontrollpunkt. Der frühere Fall auf SW340 bleibt als zusätzlicher Gegenbeleg erhalten. Das Sitzungs-Undo stellte nach der Einzelrücknahme die Bytes vor der Löschung in allen drei Browsern mit genau einer neuen Revision wieder her. [Undo-Beleg](release-evidence/sw342-fund-sale-management-undo-2026-11-25.json) · [Browser-Reproduktion](https://github.com/joke0071/foliolab-open/blob/9ff78374d8dcff659fb16284bddab3c49f2595a2/tests/browser-fund-sale-removal.mjs) · [Schreibprüfung](https://github.com/joke0071/foliolab-open/blob/9ff78374d8dcff659fb16284bddab3c49f2595a2/tests/fund-sale-removal.test.mjs)

Der geprüfte Umfang ist die Einzelrücknahme eines generisch importierten EUR-Fondsverkaufs beim vollständigen Abgang des dokumentierten Eröffnungsbestands. Konto und Gebühren-/Steuerposten müssen mit Quelle und Journal übereinstimmen. Nachgelagerte Verrechnungsvorgänge, weitere Fondsbuchungen und Stichtage ab Verkaufsdatum sperren die Rücknahme. Die Pflichtintegration auf Merge-Stand `0e00f845` und das Wallet-Gate sind grün. Die geprüften Originalartefakte `15052892567` und `15051557320` enthalten den Fall mit Chromium, Firefox und WebKit. Prüfsummen und ZIP-CRC sind im Fallbeleg aufgenommen. [Main `513c2a41`](https://github.com/joke0071/foliolab-open/commit/513c2a41e9a82d9c175c35a7cbee580be4951638) hat denselben Baum. [Main und Pages](https://github.com/joke0071/foliolab-open/actions/runs/45678926971) sind grün. ZIP-CRC und alle 160 Dateien des Pages-Originals `15053785609` stimmen mit Main überein. Die Produktivdomain liefert den passenden Worker und die geänderten Runtime-Dateien bytegenau. Der isolierte funktionale Live-Fall inklusive Sitzungs-Undo bestand in Chromium, Firefox und WebKit auf der Produktivdomain. Beim ersten unabhängigen Firefox-Durchlauf mit deaktiviertem Browsercache lieferte die Origin zeitweise HTTP 429. Die Wiederholung mit Browsercache bestand. Der [reguläre Live-Abnahmelauf](https://github.com/joke0071/foliolab-open/actions/runs/45678926971/job/139449020283) bestand im ersten Versuch. Das Original `15059760445` bestand ZIP-CRC und SHA-256-Prüfung. Seine 161 Origin-Antworten sind mit Main abgeglichen. Elf Funktionsgruppen, 22 Axe-Prüfungen und die Loading/PWA-Berichte der drei Browser sind grün. **SW342 ist LIVE_ACCEPTED.** Die wirtschaftliche Zeile und die Verwaltungszeile sind im Umfang der Paketmatrix jeweils abgenommen. [PR #433](https://github.com/joke0071/foliolab-open/pull/433) · [Pflichtintegration](https://github.com/joke0071/foliolab-open/actions/runs/45674710469) · [Wallet](https://github.com/joke0071/foliolab-open/actions/runs/45674710545)

### Cosmos · Ereignis, Gebühr und Wiederholung

Die drei gepinnten RPC-Antworten lieferten dieselben Transaktionsbytes. Der Hash stimmt mit dem Transaktionsschlüssel überein. Zwei Blockbelege verknüpfen Index 0 und das erfolgreiche Ergebnis mit Block 34.044.337. Der Auszahlungsereignisindex 11 und die Kontogutschrift bei Index 8 bezeichnen denselben Reward von **0,536836 ATOM**. Die gesamte Kontobelastung von **0,006823 ATOM** besteht laut Ergebnis getrennt aus **0,002599 ATOM Gebühr** und **0,004224 ATOM Tip**. Andere Transaktionen und Blockereignisse liefern keine weitere Kontobewegung in diesem Block.

Drei getrennte Bankzustandsquellen bestätigen **0,281159 + 0,536836 − 0,006823 = 0,811172 ATOM**. Der bestehende Read-only-Replay reduziert einen doppelt übergebenen Beleg auf zwei stabile Ereignisse und stimmt den Endsaldo auf das µATOM ab. Wird der bereits erhöhte Banksaldo als Anfang eingesetzt, meldet der Abgleich exakt **+0,530013 ATOM** Differenz. Das qualifiziert den öffentlichen Ereignis- und Saldenbeleg. Die Finanzübernahme bleibt offen. Der Session-Reader akzeptiert aktuell nur BTC, ETH und SOL und der Buchungsschreiber weist automatisierte Walletpositionen ab. Für die nächste Implementierung fehlen eine persistente Cosmos-Ereignisbindung an die bestätigte Walletposition und ein Schreib-/Restore-Vertrag, der Position und Saldo unverändert lässt, wenn der gescannte Bestand dieselbe Transaktion bereits enthält. [Maschinenbeleg](release-evidence/sw341-cosmos-reward-replay-2026-11-25.json) · [Reproduktion](release-evidence/sw341-cosmos-reward-replay-2026-11-25.mjs)

Der Browserabruf von der Produktivdomain bestätigte den Archivweg: Über `abci_query` lieferten Polkachu und Cosmos Directory im Browser beide festgeschriebenen Höhen mit Betrag und Höhe im Antwortkörper. Die REST-Route von Cosmos Directory lieferte Zahlen, exponierte den historischen Höhenheader aber nicht für Browser-JavaScript. PublicNode hatte die abgefragten historischen Zustände inzwischen bereinigt. Ein separater Konsolenabruf über Cosmos Directory sah die Elternhöhe zeitweise ebenfalls nicht. Ein Adapter muss die Höhe aus der Antwort prüfen und fehlende Quellen sichtbar ablehnen. Die bisherigen Versorgungsausfälle belegen keinen fehlenden Kontoumsatz. [Browser- und Transportbeleg](release-evidence/sw341-cosmos-archive-access-2026-11-25.json)

Die parallel integrierte Fortsetzung [#436 / SW345](https://github.com/joke0071/foliolab-open/pull/436) übernimmt genau den archivierten öffentlichen Reward als Wallet-Historie der bestätigten freien ATOM-Position. Soll bleiben **811.172 µATOM** Bankbestand, genau ein Reward über **536.836 µATOM** und eine Belastung über **6.823 µATOM** aus Gebühr und Tip. Der getestete Kandidat ist baumgleich mit [Main `9d7df163`](https://github.com/joke0071/foliolab-open/commit/9d7df163e27d48011887a5c117d6d823c7d22e11). Die Pflichtintegration bestätigt in Chromium, Firefox und WebKit eine einmalige Übernahme, die identische Revision beim Wiederimport, den bestätigten Saldo nach erneutem Wallet-Scan und den verschlüsselten Restore in ein frisches Profil. Die Wallet-Historie ergänzt genau den belegten Block. Der reguläre CSV-Schreibweg für gescannte Wallets bleibt gesperrt. Der gezielte Node-Test und der lokale Chromium-Fall auf dem exakten Main-Checkout bestätigen die Grenzen erneut. Main und Pages sind grün. Die 161 Dateien des geprüften Pages-Originals `15065010544` und die geänderten Runtime-Dateien auf der Produktivdomain stimmen bytegenau mit Main überein. Der [reguläre Live-Abnahmelauf](https://github.com/joke0071/foliolab-open/actions/runs/45703846358/job/139530649509) bestätigt in allen drei Browsern den einmaligen historischen Reward, den unveränderten freien Bestand beim Wiederimport und erneuten Scan sowie den verschlüsselten Restore. Das Live-Original `15068307209` enthält 162 exakt zum Release passende Produktionspfade, elf Kernprüfgruppen, 22 Axe-Scans, Ladeprüfungen und Navigation in drei Browsern. Das heruntergeladene Archiv wurde auf CRC und SHA-256 geprüft. **SW345 ist LIVE_ACCEPTED.** [Produkt- und Prüfbeleg](release-evidence/sw345-cosmos-history-release-2026-11-25.json) · [Main, Pages und Live](https://github.com/joke0071/foliolab-open/actions/runs/45703846358)

SW345 enthält zusätzlich den aus dem SW343-Befund abgeleiteten offenen Kursquellen-Status aus [#435](https://github.com/joke0071/foliolab-open/pull/435). Bei nachgeliefertem Detail-Toggle übernimmt der neu gerenderte Bereich den zuvor geöffneten Zustand. Die Browserprüfung misst das 44-px-Ziel nach dem tatsächlichen Austausch und ohne erneutes Öffnen.

### TRUST01 · lizenzierte UI-Grafiken auf SW343

Aus dem gepinnten ISC-Archiv `lucide-static@0.468.0` wurden **23 Funktionszeichen, sieben Anlageklassenzeichen und 19 statische SVG-Vorkommen** ersetzt. Die Inventarzeile des Ladezeichens beschreibt lokale Kreisgeometrie. Kurslinien, Allokationsdiagramme und Projektion verwenden aus Daten berechnete Geometrie. Die bereits ausgelieferte ISC-Notice ist zum Paket bytegleich. Im lokalen Chromium blieb sie mit HTML und beiden Symbolmodulen auch offline exakt verfügbar. Alle zugeordneten Symbolfragmente stimmen mit den archivierten Upstream-Assets überein. Syntax, 1.534 Node-Tests und Chromium-Loading/PWA sind grün. Beim lokalen Wechsel von SW342 auf SW343 blieb ein über die reguläre Oberfläche gespeicherter Datensatz beim Update und anschließendem Offline-Neuladen byte- und revisionsgleich. Die Pflichtintegration von [PR #434](https://github.com/joke0071/foliolab-open/pull/434) startet vom baumgleichen Kandidaten auf Main `513c2a41`. Das [Wallet-Gate](https://github.com/joke0071/foliolab-open/actions/runs/45679059263) ist grün. [Pflichtintegration](https://github.com/joke0071/foliolab-open/actions/runs/45679059500) ist ebenfalls grün. Der zugrunde liegende Merge-Stand `681d814e` ist baumgleich mit dem Kandidaten. Nach der SW342-Live-Abnahme ist SW343 auf [Main `af3cdff0`](https://github.com/joke0071/foliolab-open/commit/af3cdff0b83ea9b0c406e0204efd3d9e32896165) baumgleich integriert. [Main und Pages](https://github.com/joke0071/foliolab-open/actions/runs/45691776339) sind grün. ZIP-CRC und alle 160 Dateien im Pages-Original `15058508200` stimmen mit Main überein. Auf der Produktivdomain stimmen HTML, beide Grafikmodule, Service Worker und ISC-Notice bytegenau überein. Der Live-Abruf auf SW343 liefert weiterhin weder HTTP-CSP noch X-Frame-Options. Der [erste reguläre SW343-Live-Lauf](https://github.com/joke0071/foliolab-open/actions/runs/45691776339/job/139493614412) erreichte 161 bytegleiche Antworten und bestand die Core-Prüfung. Die Chromium-Navigationsprobe brach bei 430 px ab, nachdem der Kurs-CSV-Button verborgen blieb. Der identische unveränderte Test bestand lokal dreimal je Produktstand auf SW342 und SW343 und anschließend auf der veröffentlichten SW343-Origin. Beide Stände reproduzieren beim Detail-`toggle` denselben DOM-Austausch mit neuem 44-px-Ziel. Der [gezielte Wiederanlauf](https://github.com/joke0071/foliolab-open/actions/runs/45691776339/job/139499107248) verwendet dieselben Gates und denselben Produktstand. Der Live-Wiederanlauf bestand vollständig in Chromium, Firefox und WebKit, einschließlich Navigation. Das Original `15064720633` bestand ZIP-CRC und SHA-256-Prüfung. Es enthält 161 bytegenaue Origin-Antworten, elf Funktionsgruppen und 22 Axe-Prüfungen. **SW343 ist LIVE_ACCEPTED.** Für TRUST01 sind damit die Rechtekette und die Offline-Notice aller inventarisierten Grafiken abgenommen. Wirksamer HTTP-Framingschutz und natives Safari/VoiceOver/ITP bleiben offen. Die verifizierten Main-Originale `15061295679` und `15059707400` enthalten außerdem den unverändert exakten Fondsfall in allen drei Browsern auf SW343. Auf der Produktivdomain liefert SW341 weder einen HTTP-CSP-Header noch X-Frame-Options. Eine Origin mit Headerkontrolle und ein natives Safari-/VoiceOver-/ITP-Protokoll bleiben eigene Kriterien. [Kandidat](https://github.com/joke0071/foliolab-open/commit/09fe66ea387faec55a3eea3bd120a74e6909d3c2) · [Zuordnung und Prüfsummen](release-evidence/sw343-licensed-ui-inventory-2026-11-25.json)

### AT05, FLH05, VWCE und Geräte · Stand der Restkriterien

- **AT05.** Die Klassifikation `accumulation` läuft aus dem Text des Flatex-Umsatzes in `event-review`. Die native Handelsprojektion setzt eine unstornierte Kauf- oder Verkaufsorder voraus. Der öffentliche Fall lässt **IE00BNG8L278**, OeKB-Jahresmeldung **343333**, **8.622,7** Anteile und **0,0171 USD pro Anteil** als Erhöhungsbetrag abgleichen. Die unabhängige Decimal-Rechnung ergibt 129,306471981 EUR Gesamterhöhung. Die Differenz der auf vier Nachkommastellen ausgewiesenen Brokerpreise ergäbe 129,34050 EUR. Für einen automatischen exakten Einstand sind daher Originalfeld, FX und exakter Positionsbezug erforderlich. Damit ein Sonderereignis den Einstand automatisch ändern kann, fehlen ein natives Depot- und Ereignispaar mit stichtagsbezogenem Anteilbestand und eine belegte Zuordnung genau zu dieser Position. Die vorhandene Klassifikation hält den Einstand geschützt. Jahresbeleg und unabhängige Prüfung derselben Jahreszusammenführung bleiben eigene Kriterien. [Flatex-Abrechnung](https://www.broker-test.at/steuern/fondsthesaurierung/) · [Bisheriger Produktbeleg](release-evidence/sw340-at05-cost-basis-boundary-2026-11-25.json)
- **FLH05.** Das zusätzliche öffentliche IBKR-Mehrkontenmuster enthält Handelszeilen, Ausführungs- und Provisionshinweise sowie Cash-Übersichten. Für zugehörige separate Cash-Zeilen fand sich kein gemeinsamer Order-/Trade-Schlüssel für dieselben Fremdwährungs-Teilfüllungen. Eine für den Settlement-Zeitpunkt ausgewiesene Summe ist noch kein einzelnes Netto mit dieser Identität. Die dokumentierte Order-ID aus der Trade Confirmation bleibt als Suchschlüssel erhalten. [IBKR-Mehrkontenmuster](https://www.interactivebrokers.com/download/statements/Friends_and_Family_consolidated.pdf) · [Trade Confirmation](https://www.interactivebrokers.com/support/faq/content/create-trade-confirmation-flex-query-35784625)
- **VWCE.** Deutsche Börse bestätigt das Instrument und die Anpassungsoptionen. Xetra nennt einen eigenen Anbieterweg für historische Börsendaten. Twelve Data weist volle EOD-Historie aus und knüpft Drittanzeige an den Tarif und gegebenenfalls an die Börsenzulassung. Für FolioLab fehlen weiterhin eine abrufbare vollständige Xetra-EUR-Reihe und der dokumentierte Anzeigeumfang. Der bisherige Fünf-Tage-Abgleich bleibt der belegte Umfang. [Instrument und Anpassungen](https://live.deutsche-boerse.com/en/etf/vanguard-ftse-all-world-ucits-etf-usd-accumulating/price-history/historical-prices-and-volumes) · [Xetra-Marktdaten](https://www.eurexgroup.com/xetra-en/trading/market-quality/market-data) · [EOD-Nutzung](https://support.twelvedata.com/en/articles/12682324-end-of-day-eod-pricing-market-data)
- **FLH03.** Der öffentliche Trade-Republic-Downloader führt Dokumentpfade je Transaktion, erzeugt den CSV-Datensatz aber selbst aus Webdaten. Die neue alternative Parser-Fixture ist ausdrücklich synthetisch. Beides ergibt kein Paar aus nativem Regionalexport und Originalabrechnung desselben Geschäfts. Der Bitpanda-Stichtag bleibt davon unabhängig. [Downloader-Format](https://github.com/dhojayev/traderepublic-portfolio-downloader) · [CSV-Fixture](https://github.com/aritzmmartinez/libtraderepublic)
- **FLH03-18.** Die unabhängige Moore-Bescheinigung für Luno bestätigt Zugriff und Aggregation der Solana-Stake-Konten. Beim veröffentlichten Bericht sind die exakten Einzelbestände ausgespart. Für einen zusätzlichen FolioLab-Fall fehlen damit weiterhin separat nachprüfbar dieselbe Ledger-/Stake-Position, ihre Zuordnung und ihr datierter Betrag. [Bescheinigung, Staked SOL](https://discover.luno.com/wp-content/uploads/2025/07/LunoPoR_May2025.pdf)
- **FLH04 und #430.** Der Review-Entwurf #427 steht auf `84ef0b37` und hat keine Diskussion oder Review-Einreichung. #430 steht weiterhin auf `5c2d7aca`. Maßgeblich bleiben die externe Sicherheitsfreigabe beziehungsweise ein aussagekräftiger neuer Gesamtvergleich. [FLH04](https://github.com/joke0071/foliolab-open/pull/427) · [CI-Kandidat](https://github.com/joke0071/foliolab-open/pull/430)
- **Geräte.** Der verfügbare Linux-Testlauf hat weder ADB noch einen USB-Gerätepfad. Die vorhandene Projekt-Zugangsakte weist keine freigeschaltete physische Sitzung aus. Der 10.000-Buchungen-Datenbestand und die bestehenden Geräteprotokolle sind verfügbar. Physische Restore-, Eviction- und Startmessungen sowie natives Safari mit VoiceOver/ITP bleiben offen. [Zugangsakte](ANDROID_REAL_DEVICE_ACCESS_2026-11-17.md) · [Startprüfplan](PERF_ANDROID03_REAL_DEVICE_CHECKLIST.md)

## Belege aus dieser Fortsetzung

**Barausgleich.** Die veröffentlichte Erste-Bank-Abrechnung nennt 0,609 EUROAPI-Aktien, 15,537607 EUR Stückkurs, 9,46 EUR Kurswert, 0,51 EUR Steuer und 8,95 EUR Valuta am 01.07.2022. Der Anschaffungskurs von 12,4990418 EUR und der ausgewiesene Gewinn von 1,85 EUR stimmen bei Cent-Rundung mit 7,61 EUR Einstand überein. Die Jahreskosten von 0,26 EUR gehören nicht zu dieser Transaktion. Im regulären Verkauf auf SW345 erzeugte der aus dem angezeigten Kurs berechnete Wert 8,952402663 EUR Cash. Der vorhandene Journalpfad erreichte mit dem expliziten Brokerbrutto exakt 8,95 EUR. Der SW346-Kandidat macht diesen Abgleich beim manuellen Verkauf des eingebuchten EUR-Aktienbruchteils zugänglich. Chromium, Firefox und WebKit bestätigten Ablehnung von 8,96 EUR ohne Schreibvorgang, eine Revision für die korrekte Gutschrift, Restbestand null, 1,34 EUR Ergebnis nach Steuer, null externe Flows und den verschlüsselten Restore in ein frisches Profil. Anschaffung des Mutterbestands und ursprüngliche Zuteilung sind im EUROAPI-Beleg nicht ausgewiesen. [Originalbeitrag](https://forum.portfolio-performance.info/t/15433/28) · [Prüfbeleg](release-evidence/sw346-settlement-preflight-2026-11-25.json).

**VWCE/Xetra/EUR.** Das frühere Deutsche-Börse-Public-Data-Set führt eine nichtkommerzielle Anzeigelizenz im Register, ist abgekündigt und wies den unsigned Bucket-Abruf auf beiden S3-Hosts ab. Die offizielle verzögerte Xetra-Quelle stellt Minutenmeldungen bis Mitternacht des nächsten Geschäftstags bereit. Der historische Marketplace beschreibt eine Bestellung mit konkretem Nutzungsumfang. Für keinen der geprüften Wege liegen eine vollständige kapitalmaßnahmenbereinigte Xetra-EUR-Reihe und die passenden Anzeigerechte gemeinsam vor. [Quellen und Abrufprüfung](release-evidence/vwce-xetra-archive-rights-2026-11-25.json).

**Kenvue-Stückrest in Fremdwährung.** Die veröffentlichte ING-Abrechnung weist 0,0648 Kenvue-Aktien, 1,36 USD Kurswert bei 1,089718 USD je EUR und 1,25 EUR Valuta aus. Aus dem ausgewiesenen Verlust von 0,13 EUR folgt ein Einstand von 1,38 EUR auf Centebene. Die ursprünglichen ING-Ein- und Ausbuchungen zeigen am 25.08.2023 unter derselben Order und Depotkennung den Tausch von zwei Johnson-&-Johnson-Aktien in 16,0648 Kenvue-Anteile. Das Verhältnis 1 zu 8,0324 entspricht der Emittentenmitteilung. Die spätere Verkaufsabrechnung weist eine andere Depotkennung aus. Im exakten SW346-Baum schreibt der allgemeine USD-Verkauf aus Stückkurs und FX rechnerisch 1,248953729313455408 EUR. Die beiden EUR-Vertragspfade weisen die exakte Nettoeingabe für die USD-Position ab, jeweils bei bytegleichem Eingangsmodell. Der Fall belegt die Abrechnungsrundung und die heutige Währungsgrenze. Depotkontinuität und direkter Anschaffungsnachweis fehlen. [Quellen, Soll und Modellgrenze](release-evidence/sw346-kenvue-fx-boundary-2026-11-25.json) · [Modelltest](release-evidence/sw346-kenvue-fx-boundary-2026-11-25.mjs).

**SW347-Kandidat für die USD-Abrechnung.** Aus dem ursprünglichen Meldebericht zu den zwei ING-Umtauschbelegen lassen sich die zwei abgegangenen Johnson-&-Johnson-Aktien und die 16,0648 zugeteilten Kenvue-Aktien über dieselbe Auftragsnummer und das Verhältnis 1:8,0324 verbinden. Die getrennte Stückrestabrechnung weist 1,36 USD Kurswert und 1,25 EUR Gutschrift aus. Auf dem gemeinsamen Produktkandidaten c3d6204f schreiben beide EUR-Buchungsbeine exakt 1,25 EUR und das realisierte Ergebnis beträgt −0,13 EUR. Eine falsche Nettogutschrift lässt Daten und Revision gleich. Die gedruckte FX-Richtung und der native Kurswert stehen auch im wiederhergestellten Datensatz. Die durchgehende Depotidentität zwischen Zuteilung und Auszahlung bleibt offen. [Umtauschbelege](https://github.com/portfolio-performance/portfolio/issues/3712) · [Verkaufsbeleg](https://github.com/portfolio-performance/portfolio/issues/3711) · [Prüfbericht](release-evidence/sw347-usd-fractional-settlement-2026-11-25.json).

**Weitere Referenz zur Kapitalmaßnahme.** Die Commerzbank-Zusammenlegung 10:1 und die Übernahme der Depotbankenprovision sind vom Emittenten bestätigt. Ein Onvista-Dokument bildet 55 Altaktien, 5,5 Teilrechte und fünf ganze neue Aktien ab. Ein zweites Dokument enthält den Verkauf von 0,5 Teilrechten derselben ISIN für 5,41 EUR sowie eine getrennte Steuergutschrift von 3,05 EUR. Die Depotkennungen der veröffentlichten Dokumente weichen voneinander ab. Sie tragen zwei Teilprüfungen, ein identischer Depotverlauf ist nicht belegt. [Belege und Revision](release-evidence/sw346-settlement-preflight-2026-11-25.json).

**FLH05.** Zwei Consorsbank-Abrechnungen derselben Order weisen 200 und 1.500 Stück aus. 141,09 JPY je EUR, die JPY-Handelsplatzgebühr und die EUR-Provisionen ergeben unabhängig die ausgewiesenen Belastungen von 7.352,45 EUR und 54.356,26 EUR. Die Abrechnungen liefern das unabhängige Netto für jede Ausführung. Der passende native Ausführungsexport mit denselben Quellschlüsseln fehlt. [Quellen, Berechnung und Restkriterium](release-evidence/flh05-consors-partial-fills-2026-11-25.json).

**Weitere Wallets.** Öffentliche Blockabrufe von zwei Betreibern bestätigen in Cosmos-Hub-Block 34.048.131 vier Rewards mit eigenen Ereignisindizes. Zwei unabhängige Archivbetreiber bestätigen 2,529318 ATOM am Elternblock und 4,972381 ATOM nach dem Block. Die Summe der vier Gutschriften beträgt 2,459070 ATOM. Die gemeinsame Belastung von 0,016007 ATOM besteht aus 0,008887 ATOM Protokollgebühr und 0,007120 ATOM Trinkgeld. Der Modellkern auf `9d7df163` erhält die drei betragsgleichen Rewards anhand der Ereignisindizes getrennt, verarbeitet Wiederholungen einmal und sperrt widersprüchliche Duplikate. Damit ist die öffentliche Mehrfachauszahlung als Modellreferenz abgeglichen. Die bestätigte Positionsbindung und produktive Übernahme für diesen Block bleiben offen. [Block, Gebühren und Archivsalden](release-evidence/cosmos-four-rewards-block-34048131.json) · [Reproduzierbarer Modelltest](release-evidence/cosmos-four-rewards-block-34048131.mjs).

**Native NEAR-Präzision.** Auf dem SW347-Kandidaten c3d6204f erreicht der belegte Aurora-Bestand von 145768498431409676817125837316 YoctoNEAR den normalen Wallet-Scan, erneuten Scan, Wiederöffnung und verschlüsselten Restore in allen drei Testbrowsern. Die vorderen 18 und die letzten sechs Nachkommastellen bleiben zusammen in der Position gespeichert. Ein Unterschied von einem Yocto im Eröffnungsbestand wird erkannt. Die Kontrollrechnung umfasst freie und gesperrte Mengen des öffentlichen Figment-Kontos sowie eine EUR-Buchung im selben Portfolio. [PR #438](https://github.com/joke0071/foliolab-open/pull/438) · [Beleg](release-evidence/sw347-near-native-precision-2026-11-25.json).

**Wallet-Scan auf archiviertem Banksaldo.** Auf SW345 bestätigte die normale Scan- und Speicheroberfläche den archivierten freien Bestand von 4,972381 ATOM in drei neuen Testprofilen. Wiederöffnung erhielt Menge und Konto. Der Test übersetzt die vorhandene Bankantwort in die REST-Darstellung. Er enthält keinen unabhängigen zweiten Positionsbeleg. Weitere Endpunkte waren lokal gesperrt. [Scanbeleg](release-evidence/cosmos-four-rewards-archived-bank-ui-2026-11-25.json).

**10.000 Buchungen und Offline-Update.** Beim Wechsel von SW345 auf den exakten SW346-Kandidaten und beim anschließenden Offlinestart blieben der serialisierte Datenbankinhalt und Revision 2 in Chromium, Firefox und WebKit gleich. Der Datensatz enthält 10.000 Buchungen, 10.000 Journaleinträge, 4.615 externe Flows und 1.825 Snapshots. [Prüfbeleg](release-evidence/sw346-10000-offline-upgrade-2026-11-25.json).

**CI-Effizienz.** Vier lokale A/B-Paare (acht Läufe) verglichen den bisherigen Testserver mit HTTP/1.1, TCP_NODELAY und höherem Backlog. Die Median-Differenz von 0,265 Sekunden lag innerhalb der Ausgangsstreuung von 0,881 Sekunden. Der reguläre CI-Pfad bleibt unverändert. [Einzelmessungen](release-evidence/ci-http-keepalive-paired-2026-11-25.json).

**FLH05-Produktprobe.** Der generische Import der manuell übertragenen zwei Consorsbank-Ausführungen ergab in beiden Reihenfolgen 1.700 Aktien, keine neue Zeile beim Wiederimport und einen erfolgreichen Restore. Ausgehend von 100.000 EUR beträgt der exakte Cashbestand 38.291,29143596286397073 EUR, das unabhängige Soll 38.291,29 EUR. Der Vergleich belegt eine Abweichung unter einem Cent im berechneten Import. [Abrechnung und Ergebnis](release-evidence/flh05-consors-partial-fills-2026-11-25.json).

**NEAR-Gegenprobe am SW347-Kandidaten.** Auf `c3d6204f` erhält der bestehende EUR-Journalpfad trotz parallel vorliegender 24-stelliger Walletmenge die exakte EUR-Einzahlung und den vollständigen NEAR-Eröffnungsbestand. Ein archiviertes v4-Backup stellt beides wieder her. Der alte SW346-Leser und ein absichtlich überpräziser EUR-Journalposten weisen die jeweiligen Eingaben bei unveränderter Quelle ab. Die NEAR-Mengenverarbeitung betrifft gelesene Bestände und deren Abgleich mit dem Journal. Reguläre Buchungspostings bleiben an ihren eigenen 18-Stellen-Vertrag gebunden. [Produktkandidat](https://github.com/joke0071/foliolab-open/pull/438) · [Prüfbeleg](release-evidence/sw347-near-native-precision-2026-11-25.json).

**Historischer ETH-Cursor.** Die vorhandene private Projektfortsetzung wurde über 26 verschachtelte TAR-Ebenen und 18 enthaltene ZIP-Archive gezielt nach dem damaligen Anbieterformat durchsucht. Die 34 Treffer verweisen auf Übergaben, Issues oder Testdaten. Keiner der geprüften Texte enthält beide ursprünglichen Providerantworten. Die öffentliche Mehrseitenabnahme bleibt gültig. [Prüfumfang und Restkriterium](release-evidence/eth-historical-cursor-archive-scope-2026-11-25.json).

**Native Safari- und Speicherprobe.** Auf einem unabhängigen macOS-Projektrunner stellte die normale Safari-App 27.2 unter macOS 15.8.2 die verschlüsselte Sicherung aus Linux-Chromium über den FolioLab-Dateiimport wieder her. Der Sollhash über acht Finanz- und Historienfelder stimmt überein, einschließlich 22,34 EUR, einer Buchung, einem Journal, einem externen Flow, einem Stichtag und einer Wallet-Sitzung. Nach beobachtetem Safari-Prozessende und Neustart blieben die Datenbankbytes und Revision 2 gleich. Ein natives Enter-Ereignis brachte den Fokus vom Sprunglink in den Hauptinhalt. Beim Wechsel von direktem Aufruf zu einer Einbettung unter dem zweiten lokalen Host wechselte `hasStorageAccess` von wahr auf falsch. Der eingebettete Kontrollabruf sah weder den Direktmarker noch das Portfolio, anschließend war der direkte Bestand vollständig. Die ersten beiden Läufe dokumentieren getrennt den WebDriver-Timeout und eine von der PWA übernommene Prüfnavigation. Die erfolgreiche Probe trennt die Beobachterseite vom Worker-Geltungsbereich. Die Zeitgrenze einer automatischen Löschung und der Versuch auf einem physischen Zweitgerät bleiben offen. Die VoiceOver-App startete, macOS meldete den Dienst weiterhin als deaktiviert. [VoiceOver-Gegenprobe](https://github.com/joke0071/foliolab-open/actions/runs/45717847834/job/139568412934) · [Lauf und Original](https://github.com/joke0071/foliolab-open/actions/runs/45717337706/job/139566651548) · [Prüfbericht](release-evidence/sw347-native-safari-cross-host-2026-11-25.json).

**FLH05-Produktprobe.** Der generische Import der manuell übertragenen zwei Consorsbank-Ausführungen ergab in beiden Reihenfolgen 1.700 Aktien, keine neue Zeile beim Wiederimport und einen erfolgreichen Restore. Ausgehend von 100.000 EUR beträgt der exakte Cashbestand 38.291,29143596286397073 EUR, das unabhängige Soll 38.291,29 EUR. Der Vergleich belegt eine Abweichung unter einem Cent im berechneten Import. [Abrechnung und Ergebnis](release-evidence/flh05-consors-partial-fills-2026-11-25.json). Das öffentliche Beispiel der IBKR-Flex-Dokumentation enthält drei AAPL-Ausführungen einer Order mit 200 Stück und 61.991,20 USD gerechnetem Brutto. Eine separate gebuchte Nettoabrechnung sowie Daten zu FX und Gebühren fehlen im Report. Auch die prüfbaren öffentlichen Flex-Testdateien enthalten kein solches zusammengehöriges Paar. [Bericht und Fixture-Suche](release-evidence/flh05-ibkr-public-execution-sources-2026-11-25.json).

**SW347 Pflichtintegration.** Kandidat `c3d6204f` und getesteter Merge `2b9e3bc0` enthalten denselben Baum `e87fab0a`. Die Pflichtintegration im ersten Versuch bestätigte 1.540 Node-Tests und alle Browserjobs. Die originalen Chromium-, Firefox- und WebKit-Protokolle zeigen die NEAR-Menge, den USD- und EUR-Stückrest sowie den Cosmos-Reward. Wallet-CI ist grün. Nach der SW346-Abnahme wurde #438 als `5feb4da4` mit exakt demselben Baum integriert. [Main-Releasepfad](https://github.com/joke0071/foliolab-open/actions/runs/45722582039). [Integration](https://github.com/joke0071/foliolab-open/actions/runs/45715151865) · [Wallet](https://github.com/joke0071/foliolab-open/actions/runs/45715151887) · [Prüfbeleg](release-evidence/sw347-integration-verified-2026-11-25.json).

**AT05-Jahresbeleg.** Neben der 2022er Flatex-Einzelabrechnung ist ein öffentliches Beispiel für den Steuerreport zum Steuerjahr 2025 verfügbar. Es zeigt die Jahresaggregate des neuen Reportformats. Der Herausgeber verweist zur Herleitung aus einzelnen Depotpositionen auf die jeweiligen Abrechnungen. Das Format und das Einzelereignis sind jeweils belegt. Die Jahre und die Ereignisdetails erlauben keine Abstimmung dieses Jahressaldos mit dem OeKB-Fall. Der nächste Wiedereinstieg ist ein zusammengehöriges Jahresaggregat mit denselben, unabhängig abgeglichenen Ereignissen und einer belegten Positionszuordnung. [Verordnung](https://ris.bka.gv.at/Dokumente/BgblAuth/BGBLA_2024_II_213/BGBLA_2024_II_213.html) · [Öffentliches Jahresbeispiel](https://www.broker-test.at/news/steuerreporting-flatex-oesterreich/) · [OeKB-Einzelereignis](https://www.broker-test.at/steuern/fondsthesaurierung/).

**Migrationsprobe SW346 → SW347.** Alle drei Browser wechselten unter derselben isolierten Origin mit `Cache-Control: max-age=600` vom veröffentlichten Baum `61d67d0d` auf den Kandidatenbaum `e87fab0a`. Die bestehende NEAR-Position mit 2,5 NEAR, die EUR-Buchung und ihre Cashflow-Historie blieben beim Update byte- und revisionsgleich. Erst ein erneuter bestätigter Wallet-Scan erhöhte die Revision einmal und ersetzte Bestand und den zugehörigen undatierten Eröffnungsbestand in derselben Position durch exakt 145768,498431409676817125837316 NEAR. Danach bestätigte ein Offline-Neustart in allen drei Engines die gespeicherten Bytes. Die abgeschlossene Probe bestätigte einen aktivierten Service Worker nach dem Update und nach dem Offline-Neustart in allen drei Engines. [Maschinenbeleg](release-evidence/sw347-near-transition-2026-11-25.json) · [Browser-Reproduktion](release-evidence/sw347-near-transition-2026-11-25.mjs) · [Reproduktionsserver](release-evidence/sw347-near-transition-2026-11-25-server.py).

**SW346 Live-Abnahme.** Pflicht-CI, Pages und der reguläre Livejob sind im Versuch 1 grün. Die 161 Dateien des Pages-Originals `15069101401` und alle 162 Live-Antworten des Originals `15073140970` sind gegen `61d67d0d` geprüft. ZIP-CRC, SHA-256, elf Kernprüfungen und 22 Axe-Scans sind bestätigt. In Chromium, Firefox und WebKit wurde die echte EUR-Stückrestabrechnung mit 8,95 EUR Nettogutschrift, 1,34 EUR Ergebnis nach Steuer, null Reststück, geschützter Abweisung der abweichenden Eingabe und verschlüsseltem Restore abgenommen. Der Cosmos-Fall aus SW345 wurde im selben Livejob erneut mit 0,811172 ATOM bestätigt. **SW346 ist LIVE_ACCEPTED.** [Livejob](https://github.com/joke0071/foliolab-open/actions/runs/45713556664/job/139565401753) · [Originalarchiv](https://github.com/joke0071/foliolab-open/actions/runs/45713556664/artifacts/15073140970) · [Prüfsummen und Fallbeleg](release-evidence/sw346-live-verified-2026-11-25.json).

**SW347, erster Produktivversuch.** GitHub Pages lieferte beim Start des Firefox-NEAR-Tests für `GET /` HTTP 429 mit `Retry-After: 0`. Die Ursprungsseite von FolioLab wurde nicht ausgeliefert. Das Warten auf die IndexedDB-Bereitschaft endete nach 30 Sekunden vor dem ersten Scan. Zuvor bestanden beide Stückrestabrechnungen und Cosmos in allen drei Browsern sowie NEAR in Chromium. Das Originalarchiv mit 135.043.968 Byte wurde vollständig gesichert und gegen SHA-256 und ZIP-CRC geprüft. Ausschließlich der fehlgeschlagene Livejob wurde als Versuch 2 gestartet. [Fehlversuch](https://github.com/joke0071/foliolab-open/actions/runs/45722582039/job/139594077281) · [Netzwerkbeleg](release-evidence/sw347-live-attempt-1-http429-2026-11-26.json) · [Gezielte Wiederholung](https://github.com/joke0071/foliolab-open/actions/runs/45722582039/job/139609896147).

Auf einem frischen autorisierten Projektrunner bestand derselbe unveränderte NEAR-Test gegen die Produktivdomain in Firefox und WebKit einschließlich erneutem Scan, Wiederöffnung und verschlüsseltem Restore. Die veröffentlichte Workerdatei stimmt mit Main überein. [Gezielter Produktivnachweis](https://github.com/joke0071/foliolab-open/actions/runs/45730263755/job/139610232808).

**SW347, zweiter Produktivversuch und Testkorrektur.** Auch der gezielte zweite Job erhielt bei der Startseitennavigation in Firefox HTTP 429 vor der ersten Anwendungsausführung. Der Teststart aus #439 wartet ausschließlich bei einer nachgewiesenen 429-Dokumentantwort. Ein kontrollierter Aufruf mit derselben Antwort und `Retry-After: 0` lieferte in Chromium, Firefox und WebKit nach mindestens zehn Sekunden die Anwendung aus. Der vollständige NEAR-Fall einschließlich Restore bestand anschließend in allen drei Engines. Längere Serverfristen und anhaltende Limits werden gesondert geprüft. [Zweiter Fehlversuch](release-evidence/sw347-live-attempt-2-http429-2026-11-26.json) · [Lokale Qualifikation](release-evidence/sw347-http429-readiness-qualification-2026-11-26.json) · [PR #439](https://github.com/joke0071/foliolab-open/pull/439).

**SW347 auf Main `9803a2c8`.** Der erste reguläre Liveversuch auf diesem Stand brach im Chromium-FX-Start ab. Die Hauptnavigation lieferte die Anwendung, der Abruf von `/src/flatex-review-export.js` erhielt HTTP 503 und `Retry-After: 0`. Das Original `15085695238` und das unveränderte Fehlerprotokoll dokumentieren den Abbruch. Nur der Livejob wurde wiederholt. Das Pages-Original `15083568731` sowie alle 161 darin enthaltenen Dateien sind im unabhängigen Abgleich grün. [Versuch 1](https://github.com/joke0071/foliolab-open/actions/runs/45746989122/job/139675244765) · [Originalarchiv](https://github.com/joke0071/foliolab-open/actions/runs/45746989122/artifacts/15085695238) · [Pages-Abgleich](https://github.com/joke0071/foliolab-open/actions/runs/45748215099/job/139669354022) · [Versuch 2](https://github.com/joke0071/foliolab-open/actions/runs/45746989122/job/139676569131).

**SW347 · reguläre Abnahme durch GitHub Pages blockiert.** Der isoliert wiederholte [Livejob](https://github.com/joke0071/foliolab-open/actions/runs/45746989122/job/139676569131) bestätigt Chromium und die bisher erreichten Firefox-/WebKit-Fälle, darunter Cosmos und die getrennten EUR- und USD-Stückreste. Beim NEAR-Start beantwortete die Produktiv-Origin alle vier Firefox-Hauptabrufe mit HTTP 429. Drei Warteintervalle von 10, 30 und 65 Sekunden änderten das Ergebnis nicht. Der unabhängige Abgleich des originalen ZIPs `15087465440` bestätigt CRC, SHA-256, vier gedrosselte Dokumentabrufe und die 162 bytegleichen früheren Kernantworten. Das Original liegt zusätzlich byteidentisch im 30-Tage-Beleg. Der Livejob bleibt formal rot. Die vollständige Fortsetzung auf dem produktgleichen SW347-Stand `ed0a1d9f` und ihr separat geprüfter Archivbeleg bestätigen NEAR, Cosmos und die beiden Stückrestfälle in Chromium, Firefox und WebKit. SW346 bleibt regulär produktiv abgenommen. [Reguläres Original](https://github.com/joke0071/foliolab-open/actions/runs/45746989122/artifacts/15087465440) · [Unabhängige Originalprüfung](https://github.com/joke0071/foliolab-open/actions/runs/45754638057/job/139690275291) · [Gesicherte Kopie](https://github.com/joke0071/foliolab-open/actions/runs/45754638057/artifacts/15087127309) · [Maschinenbeleg](release-evidence/sw347-main-persistent-page-throttling-2026-11-26.json).

## Quellenabgleich am 26. November

**Stand seit `b5953971`.** Main steht auf `9803a2c8`. Der zuletzt abgeschlossene Freigabenachweis ist [Lauf 45755720147](https://github.com/joke0071/foliolab-open/actions/runs/45755720147). Die Abfrage seit dem Checkpoint ergab keinen neuen Lauf oder aktualisierten PR. [#430](https://github.com/joke0071/foliolab-open/pull/430) wartet auf einen aussagekräftigen Vergleich des gesamten Pflichtpfads, [#427](https://github.com/joke0071/foliolab-open/pull/427) auf das unabhängige Review. Die abgefragten Reviews und Issue-Kommentare zu #427 waren leer.

**#119 · Öffentlicher Viererfall.** Die [native KJNodes-Transaktionsantwort](https://cosmoshub.api.kjnodes.com/cosmos/tx/v1beta1/txs/A4D60F019289A8AA924B55FB34971CC55FC4A51402E8743291161D6276790D7E) bestätigt Höhe 34048131, den erwarteten Transaktionshash und `code=0`. SHA-256 des HTTP-Antwortkörpers: `158299370a3de28ddb8f07dcf3217e70a9dca140bc75a71f2ddabfd28e3b2770`. Dieselbe Transaktion enthält für jede Nachricht genau den geprüften Eingang für die [öffentliche Adresse](release-evidence/cosmos-four-rewards-block-34048131.json). Verglichen wurden `withdraw_rewards.delegator`, `coin_received.receiver`, `msg_index` und `amount` an folgenden nullbasierten Stellen von `tx_response.events`.

| Nachricht | Eingang | Reward | Betrag (µATOM) |
| ---: | ---: | ---: | ---: |
| 0 | 8 | 11 | 614783 |
| 1 | 14 | 17 | 614783 |
| 2 | 20 | 23 | 614783 |
| 3 | 26 | 29 | 614721 |

`fee_pay` an Index 34 weist 8887 µATOM aus, `tip_pay` an Index 35 weitere 7120. Das unabhängige Soll ergibt 2529318 + 2459070 − 8887 − 7120 = **4972381 µATOM**. Die KJNodes-Antwort belegt die Zuordnung zum Kettenkonto. Für die Produktzuordnung fehlt ein unabhängig gespeicherter Beleg, der die konkrete freie ATOM-Position (`position.id`, `position.accountId`, `wallet.chain`, `wallet.address`, natives Asset) identifiziert. Der [frühere UI-Scan](release-evidence/cosmos-four-rewards-archived-bank-ui-2026-11-25.json) erhielt seinen Betrag aus dem bekannten Banksnapshot. Im geprüften Projektarchiv (96 ZIP-Einträge), im Arbeitszweig, in den gezielten Projektdateisuchen und in den Diskussionen zu #119 und #436 fand sich kein zusätzlicher Positionsdatensatz. Der Viererfall bleibt für Kontoeingänge, Salden und Modellverhalten qualifiziert. Er erhielt keine Produktfreigabe. Ein privater Besitznachweis ist ein separates Kriterium. Auf dem Main-Checkout bestanden alle vier vorhandenen Node-Regressionen in `cosmos-reward-evidence.test.mjs` und `near-quantity-precision.test.mjs`.

**FLH05 · Belegpaar vor Import.** Der [Ursprungscommit der Consorsbank-Belege](https://github.com/portfolio-performance/portfolio/commit/cab3ec76931e05adb49c849302119accec47a9f5) enthält zwei Abrechnungstexte sowie Java-Code und Tests. Für `238336487.001` und `.002` sind zusammen 61.708,71 EUR Belastung belegt. Ein nativer Ausführungsexport dieser Order fehlt im Commit und im geprüften Projektarchiv. Ein weiterer [DEGIRO-Beispielsatz](https://github.com/sciqnt/sq-degiro/tree/c845021e8c8c9acfeb2fa5cfd34977159480e2ef/tests/fixtures) hat für die zwei Fremdwährungsgeschäfte keine zugehörige Zeile im separaten `account.csv`. Die drei gemeinsamen EUR-Beispielorders enthalten jeweils eine Ausführung. Für diese Quellen wurde kein Import- oder Browsertest gestartet.

**Geräte und Auslieferung.** In der Projektsitzung waren weder ADB noch ein USB-Gerätebus verfügbar. Der [Produktivabruf](https://foliolab.unperfekt.at/) lieferte HTTP 200 und dieselben HTML-Bytes wie Main (SHA-256 `48ae17df3f0ea22e990923568df8140c1f92cbe5b70d775a52f5c0e933d2f67a`). In dieser Antwort fehlten die HTTP-Header `Content-Security-Policy` und `X-Frame-Options`.

## Delta ab faa91ef1

**Ausgangsprüfung.** Main `9803a2c8`, SW347 LIVE_ACCEPTED, 6/6 Kernbereiche und 16/29 Folgepakete. Die sechs offenen PRs #430, #429, #427, #350, #348 und #161 hatten keine neueren Heads oder eingereichten Reviews. Die Issue-Abfrage seit dem Commitzeitpunkt 06:15:25 UTC war leer. Vor Beginn der Messarbeit war 45755720147 der letzte gelistete Lauf.

**CI-Effizienz · Vorprüfung und Soll.** Aus den Originalprotokollen der sechs bereits erfassten Integrationsläufe wurden die Zeitstempel von `BROWSER_GATE_START ui-quality import ./browser-navigation-installation.mjs` bis zur letzten bestandenen Meldung `UI presentation,5pages/5widths/Axe` sowie die drei P1A-Zeiten je Lauf gelesen. Bei festen übrigen Jobzeiten, Starts und unveränderter Ausführung außerhalb des gemessenen P1A-Abschnitts hätte selbst dessen vollständiger Wegfall den Gesamtpfad um höchstens 61–152 Sekunden verkürzt. Die beobachtete Spanne der sechs vollständigen Pflichtpfade betrug 417 Sekunden. Damit bleibt #430 zurückgestellt.

| Actions-Versuch 1 | Pflichtpfad (s) | UI-Quality Chromium / Firefox + WebKit (s) | Modell mit zwei zusätzlichen isolierten Jobs (s) |
| --- | ---: | ---: | ---: |
| [45715151865](https://github.com/joke0071/foliolab-open/actions/runs/45715151865/attempts/1) | 1649 | 269 / 867 | 988 |
| [45734783074](https://github.com/joke0071/foliolab-open/actions/runs/45734783074/attempts/1) | 1308 | 246 / 638 | 896 |
| [45744441510](https://github.com/joke0071/foliolab-open/actions/runs/45744441510/attempts/1) | 1382 | 301 / 552 | 1081 |
| [45722582039](https://github.com/joke0071/foliolab-open/actions/runs/45722582039/attempts/1) | 1410 | 244 / 694 | 934 |
| [45737311400](https://github.com/joke0071/foliolab-open/actions/runs/45737311400/attempts/1) | 1245 | 240 / 632 | 914 |
| [45746989122](https://github.com/joke0071/foliolab-open/actions/runs/45746989122/attempts/1) | 1662 | 235 / 857 | 1052 |

Das Modell setzt bei den ausgelagerten Prüfungen die Nebenzeiten ihres bisherigen Jobs an und übernimmt die beobachteten Endzeiten der übrigen Jobs. Freie Runnerkapazität, Queue, Transport der Nachweise und veränderte Ressourcenkonkurrenz sind in dieser Rechnung unbestätigt. **Prüfauftrag vor Änderung:** dieselben Browserkommandos und Engine-Bindungen genau einmal, vollständige Assertions, separat gesicherte Originalberichte und die vier C5-Vorschaubilder. App, Worker und Live-Reihenfolge sind gleich zu halten. Primärmaß ist die Zeit vom Start bis zum letzten Pflichtjob einschließlich Warteschlangen und Sicherung, zusätzlich Runnerzeit und Wiederholungen erfassen. Die Reihenfolgen B/A und A/B werden auf dieselben Anwendungsbytes und Browser-Versionen gepinnt. Vor der Auswertung gilt: beide B-Endzeiten müssen unter beiden A-Endzeiten liegen und der Vorteil in beiden Paaren muss die Differenz der gepaarten A-Referenzen übersteigen. Zusätzlich werden die Ergebnisse gegenüber der historischen Spannweite von 417 Sekunden und dem schnellsten historischen Pflichtlauf (1.245 Sekunden) ausgewiesen. Vergleich und Entscheidung umfassen Runnerzeit, Warteschlangen, Vollständigkeit der Belege, reguläre PR-Prüfungen, Pages und Live-Abnahme.

**FLH05.** Im [zusätzlichen DEGIRO-Beispielsatz](https://github.com/ish-cs/degiro-tracker/tree/75321ff00a6f8627da9f96700aef2a27f1fd85e3/fixtures) gibt es acht Ausführungszeilen mit acht verschiedenen Schlusskennungen. Die als Order-ID beschriftete Spalte ist bei allen acht leer. Die zwei USD-Ausführungen tragen unterschiedliche Kennungen. Im [zweiten Beispielsatz](https://github.com/riprekt/Degiro-dashboard/tree/a0142cac4dd5c354169671d5fbd7016877fb1efe/test/fixtures) fehlt die Order-ID in der Kontodatei. Beide Sätze liefern keine dokumentierte gebuchte FX-Teilfüllungsgruppe. Die Consorsbank-Zuordnung und das Restkriterium bleiben bestehen.

**Gerätezugang.** In den [Runner-Einstellungen des Projekts](https://github.com/joke0071/foliolab-open/settings/actions/runners) war kein selbst gehosteter Runner registriert. Die lokale Projektsitzung hatte weder einen USB-Gerätebus noch einen ADB-Endpunkt. Ein physisches Gerät mit Zugriff auf die Prüfdaten ist damit weiterhin offen.

**FLH05 · Quellschlüssel und Geldbeine.** 15 weitere öffentlich abgelegte DEGIRO-Beispieldateien wurden nach wiederholtem Orderschlüssel ausgewertet. Vier enthielten einen mehrfach vorkommenden Schlüssel. Zwei betrafen EUR-Ausführungen. Bei [LaVega](https://github.com/Elmata2/LaVega/tree/59fafe043c000629fc5f9699da29848747ec27b6/packages/core/src/parsers/__fixtures__/degiro/en) haben die beiden USD-Ausführungen dieselbe Order-ID, diese ID fehlt im englischen und niederländischen Kontobeleg. Die [CAD-Teilfüllung](https://github.com/glichfalls/treasury/blob/59e18524f8abf5626db2a75750e80e6280c44438/tests/Fixtures/degiro_small.csv) zeigt zwei Ausführungen zu 8,65 CAD. Die Suche nach ihrer Kennung führte zum Importtest und dieser Fixture. Eine separate Geldkontoabrechnung derselben Order fehlt.

Der [Kraken-Testexport mit gehashten Bezeichnern](https://github.com/dcdpr/taxcount/commit/2db9186881ab5b35b9abcdaa6207444c1ae692a5) enthält für Order `53e0de-fac68-f5721d` zwei identifizierbare BTC-Verkäufe zum Preis von 38.512,20 USD je BTC. Die [separaten Ledgerzeilen](https://github.com/dcdpr/taxcount/blob/17ff30ea85497e91b01b3112da101ad81d67d0a4/references/kraken-tests/ledgers.csv#L93-L96) weisen 331,4857 und 770,2440 USD Gutschrift sowie 0,00001033 und 0,000024 BTC Gebühr aus. Das bestätigt 1.101,7297 USD Gutschrift und die Gebührenwährung der [beiden Ausführungen](https://github.com/dcdpr/taxcount/blob/17ff30ea85497e91b01b3112da101ad81d67d0a4/references/kraken-tests/trades.csv#L35-L36). Der BTC-Verkaufspreis liefert keinen separaten Umrechnungskurs von der Handels- in die Abrechnungswährung; die Geldbuchung lautet bereits auf USD. Die fünf mehrfach ausgeführten BTC/EUR-Zeilen im selben Export sind als Margin-Schließungen gekennzeichnet. Restkriterium für die FX-Abnahme ist die Abrechnung mit fallbezogenem Währungswechsel.

**FLH05 · Swissquote und Trading 212.** Die [Swissquote-Datei mit 21 Buchungen](https://github.com/dickwolff/Export-To-Ghostfolio/blob/9e35bd602f054f563b8c728bcb36dc5eb2bbcaa5/samples/swissquote-export.csv) enthält die KROP-Käufe von 250 und 600 Stück unter Order `113884899` und die WDSC-Verkäufe von 367 und 6 Stück unter Order `106824458`. Kosten und Nettobeträge stehen je Wertpapierorder in derselben Währung. Die Forex-Paare haben eigene Orderschlüssel `114723639` und `113882551`. Für die zwei Wertpapierorders ergab die gezielte Suche keinen separaten Netto-FX-Beleg. Die [Trading-212-Datei mit 13 Buchungen](https://github.com/dickwolff/Export-To-Ghostfolio/blob/9e35bd602f054f563b8c728bcb36dc5eb2bbcaa5/samples/trading212-export.csv) hat keine wiederholte ausgefüllte ID. Die [LibreFolio-Beispiele](https://github.com/librefolio/LibreFolio/tree/942eb23f77534e17eced8922b573317911f8c3df/backend/app/services/brim_providers/sample_reports) sind je Anbieter bytegleich mit diesen beiden Dateien (SHA-256 `361a9f731e4e905c77bf7b097dbb2cfaec92a190f2afc1484200c93bf0405c85` und `7099abfd8c15689257f1172ad06b59f5cfeb69686811bdde4b168d26a21e581b`). Weiterarbeit mit einer unabhängig gebuchten Abrechnung derselben FX-Teilfüllungsorder.

**FLH03-18 · Ledger-Datei.** Das [öffentliche Ledger-Live-Testnet-Beispiel](https://github.com/dcdpr/taxcount/tree/17ff30ea85497e91b01b3112da101ad81d67d0a4/references/ledgerlive-testnet-wallets) enthält zwölf Zeilen. Laut Quell-README wurden die Vorgänge aus dem Electrum-Test übernommen. FolioLab SW347 erkannte das Format und wies die Datei im nativen Parser wegen der fehlenden Spalte `Status` ab. Der Fall liefert weder eine neue unabhängig exportierte Stake-Position noch ihren datierten Endbestand.

## Delta ab 66d3a38c

**#442 · Übernahme.** Beide Messungen verwenden SW347 auf `9803a2c8`. Der gemeinsame PR-Prüfbaum ist `638e875e` (Head `1b6404fc`). [Integration](https://github.com/joke0071/foliolab-open/actions/runs/45769694049) und [Wallet-CI](https://github.com/joke0071/foliolab-open/actions/runs/45769694024) sind im ersten Versuch grün. Die 169 verschiedenen lokalen Browserkommandos (168 Aufrufe von `browser-*.mjs` und die Chromium-Prüfung `live-probes.mjs`) einschließlich Engine-Bindungen kommen in beiden Reihenfolgen und im PR je einmal vor. Git-Objekte der ausgelieferten App, Worker, UI-Tests und die produktive Prüfreihenfolge stimmen überein. B1 1.156 s und A1 1.677 s ergeben 521 s Ersparnis. A2 dauerte 1.770 s, B2 1.122 s. Die Differenz der A-Referenzen beträgt 93 s. Start jeweils ab Einstellung des Planjobs in die Queue.

**FLH05 · neuer DEGIRO-Kontobeleg.** Im [französischen anonymisierten Anbieterbeispiel](https://github.com/vroonhof/opensteuerauszug/tree/4633aab493e90a0f13e6701e8aa2d85cf77e4bab/tests/samples/import/degiro/fr) liegen Kontobuchungen und Portfolio vor. Von 295 Kontobuchungen hat keine einen Wert in der Spalte `Order Id`. Ein separater Ausführungsexport fehlt. Der Fall liefert keinen Eingang für die FX-Importqualifikation. Der Consorsbank-Fall bleibt auf die zwei Nettoabrechnungen beschränkt.

**FLH05 · mehrteilige CHF-Ausführung.** In [libdegiro](https://github.com/nyg/libdegiro/tree/991def7e097ec423763c04d3da416404a266d610/test/fixtures) haben unter anderem ein CHF-Kauf über 37 und 7 Stück und ein CHF-Verkauf über 21 und 4 Stück jeweils denselben Orderschlüssel sowie eine separate EUR-Gebühr. Die Suche nach beiden Orderschlüsseln lieferte jeweils dieselben beiden Sprachvarianten. Laut [Quelldokumentation](https://github.com/nyg/libdegiro/blob/991def7e097ec423763c04d3da416404a266d610/README.md#test-fixture) sind sämtliche Mengen, Daten und Orderschlüssel synthetisch. Die englische Datei verwendet dieselben Zeilen mit übersetztem Header. Als unabhängige Ausführungs-/Nettoabrechnung für FLH05 scheiden beide aus. Die Suche zu diesen Schlüsseln ist abgeschlossen.

**FLH03 · regionaler Export.** Der [Downloader-Beispielexport](https://github.com/dhojayev/traderepublic-portfolio-downloader/tree/b10c7ac563faccee5da962772129a12610c4ed0f/assets) führt 17 Transaktionen, darunter 15 Zeilen mit PDF-Pfad. Der Commit enthält keine der referenzierten PDF-Dateien. Die CSV stammt vom Downloader. Das [Beispiel mit nativem Header](https://github.com/aritzmmartinez/libtraderepublic/tree/65fe780c11f23c2fe4525fe2de7ef4b57b02eff1/test/fixtures) ist gemäß Quell-README synthetisch. Offen bleibt das Originalpaar aus nativem regionalem Export und Einzelabrechnung desselben Geschäfts. Die persönliche Cash-/BCI25-Bestätigung bleibt separat.

**FLH03-18 · LedgerHQ-Referenz.** Der [Solana-Integrationstest des Herstellers](https://github.com/LedgerHQ/ledger-live/blob/abd6d022b6acd8ccd5a4f431ea29e5bab14f0b9e/libs/coin-modules/coin-solana/src/logic/tests/getStakes.integ.test.ts) nennt eine Adresse und prüft Typ, möglichen Status und nichtnegative Menge jedes zurückgegebenen Stake-Kontos. Auch eine leere Trefferliste erfüllt diese Schleife. Ein Betrag zu einem finalisierten Stichtag und ein unabhängig exportierter Datensatz fehlen. Die [benachbarte Suite mit exakten Mengen](https://github.com/LedgerHQ/ledger-live/blob/abd6d022b6acd8ccd5a4f431ea29e5bab14f0b9e/libs/coin-modules/coin-solana/src/logic/tests/getStakes.test.ts) erstellt ihre RPC-Antwort selbst. Der bereits belegte SOL-Brückenfall bleibt der abgenommene Umfang.

**#442 · Merge und vollständiger Paarvergleich.** [Jobzeiten und Originalarchive](release-evidence/sw347-ci-ui-quality-paired-2026-11-26.json). Gemessen ab tatsächlichem Start des Planjobs ergab B/A 19:13 gegenüber 27:55, A/B 29:27 gegenüber 18:40 Minuten. Die Gewinne von 522 und 647 Sekunden übersteigen die 92 Sekunden Streuung der gepaarten Kontrollen und die 417 Sekunden der historischen Reihe. Ab Einstellung des Planjobs in die Queue dauerten B1/A1/A2/B2 1.156/1.677/1.770/1.122 Sekunden. Ersparnis 521 und 648 s, A-Abstand 93 s. B1 und B2 liegen so 89 bzw. 123 s unter dem historischen Bestwert 1.245 s. Bei dessen historischer Messbasis ab Planjobstart sind es 92 und 125 s. Die Queue-, Upload- und Endzeitstempel aller 28 Paarjobs sowie 37 SHA-256-/CRC-geprüfte Originalarchive von beiden Paaren und PR sind im selben Nachweis ergänzt. Alle zehn vollständigen UI-Aufrufe haben dieselben 24 Modulstarts und 24 PASS-Marken. Alle vier C5-PNGs sind in den fünf Chromium-Originalen byteidentisch. Aufsummierte Runnerzeit änderte sich um +525 und −140 Sekunden. Im ersten Paar stimmen 2.316 unterschiedliche feste Dateipfade, 51 Speicherdiagnosen und die vollständigen UI-Berichte aller drei Engines überein. Auch das zweite Paar bestätigt pro Engine dieselben 66 Scans. PR-Integration 16:46, Wallet 1:01, gemeinsamer Merge-Commit `638e875e`, Tree `31b21414`. Main `74e7a942` hat denselben Tree. Paketfreigabe nach Abschluss des [Mainlaufs](https://github.com/joke0071/foliolab-open/actions/runs/45775837478).

## Fortsetzung von #442 auf Main `74e7a942`

**Original und Laufgrenze.** Das [Original von Versuch 2](https://github.com/joke0071/foliolab-open/actions/runs/45775837478/artifacts/15098179885) wurde erneut heruntergeladen und dauerhaft gesichert. 134.725.777 Bytes, SHA-256 `32e336f03c5051ffacd90755219bd3e7e6ecf7770b18e60883aecbe1feaf76c4`, vollständige ZIP-CRC-Prüfung bestanden. Chromium schloss alle im Release-Workflow vorgesehenen Live-Aufrufe ab. Im Firefox-/WebKit-Schritt bestanden die 14 Aufrufe vor UI-Quality sowie die ersten 23 verschachtelten UI-Module in der [dokumentierten Reihenfolge](release-evidence/sw347-ci-442-live-attempt2-2026-11-26.json). Firefox erreichte beim 24. Modul (NEAR) wegen HTTP 429 die erste fachliche Prüfung nicht. WebKit erreichte diesen Modulstart nicht. Ab dort fehlen für beide Engines NEAR, der Hauptteil von UI-Quality, Recovery, Finanz-E2E und Transfers. Die [Fortsetzung](https://github.com/joke0071/foliolab-open/actions/runs/45783680786/job/139785038146) hat die Originalgrenze, Pages und die Browserinstallation bestätigt.

**FLH05.** Für die [weitere Consorsbank-Testsammlung](https://github.com/pawel491/portfolio-performance-tests/tree/b3a767b5b01960ef2835d48607fc302ff28f1f91/name.abuchen.portfolio.tests/src/name/abuchen/portfolio/datatransfer/pdf/consorsbank) wurden beide Dokumente von Order 238336487 mit den [Originalbelegen](release-evidence/flh05-consors-partial-fills-2026-11-25.json) verglichen. Beide sind bytegleich (1.962 und 1.943 Bytes). Die separate Suche nach beiden Ausführungskennungen und den beiden Swissquote-Orders ergab keinen passenden Ausführungsexport oder unabhängigen FX-Nettobeleg. Der Wiedereinstieg setzt die Zuordnung desselben Geschäfts voraus. Die Parserqualifikation bleibt offen.

**Weitere Wallets.** Der öffentliche Cosmos-Block und die Quelladresse lassen sich keiner unabhängig gespeicherten konkreten FolioLab-Position in den geprüften Unterlagen zuordnen. Wiedereinstieg mit position.id, Kontobindung, nativem Asset, Chain und Adresse für genau diese Position. Danach vier Ereignisse einschließlich dreier betragsgleicher Rewards, 4,972381 ATOM, Wiederimport, Scan und frischen verschlüsselten Restore prüfen. [Blockbeleg](release-evidence/cosmos-four-rewards-block-34048131.json).

**Produktivabnahme #442.** Die [Fortsetzung](https://github.com/joke0071/foliolab-open/actions/runs/45783680786) schloss auf `74e7a942` ab dem ersten ausstehenden Modul ab. NEAR, die volle UI-Hauptsuite, Recovery, Finanz-E2E und Transfers bestanden für Firefox/WebKit. Die erneute HTTP-Prüfung bestätigte 162 Pfade. Bei der unabhängigen Prüfung der heruntergeladenen ZIPs wurden die 35 bereits fertigen Produktionsberichte bytegenau und die 23 zuvor bestandenen Modulabschnitte in Reihenfolge bestätigt. Zusammen mit dem 24. Modul sind alle geplanten Prüfungen vollständig. [Live-Abnahme](release-evidence/sw347-ci-442-live-verified-2026-11-26.json). **17/29 Folgepakete, 12 offen.**

**#119 · Prüfung nach der CI-Abnahme.** Im neuen [Abnahmearchiv von `74e7a942`](https://github.com/joke0071/foliolab-open/actions/runs/45783680786/artifacts/15098959376) bestätigen die drei produktiven Browserprotokolle den Einzelreward aus Block 34.044.337. Im kombinierten Berichtsarchiv enthielten die JSON-, JSONL-, CSV-, Text- und Logdateien weder die Höhe 34.048.131 noch den erwarteten Transaktionshash oder den exakten Endbetrag 4,972381 ATOM als Dezimalzeichenfolge. Es liegt darin kein identifizierter Positionsbeleg für den Viererfall vor. Geprüfter Umfang bleibt der Einzelreward. Wiedereinstieg: unabhängig gespeicherte freie ATOM-Position mit `position.id`, `position.accountId`, `wallet.chain`, `wallet.address` und nativem `uatom` zum Viererfall. Danach reguläre Übernahme, Wiederimport, Scan, Wiederöffnung, frischer verschlüsselter Restore und beide atomaren Negativfälle. #427 hatte zum selben Abgleich weiterhin kein eingereichtes Review.

### Ledger-Stake-Abgleich nach der Live-Freigabe

Auf Main `74e7a942` sind zwei vorhandene native Ledger-Exporte und historische Projektportfolios lokal gegengeprüft. Die Kontokennung der SOL-Delegationen stimmt mit der früher separat gespeicherten Wallet-Konfiguration und der freien SOL-Position des migrierten Portfolios überein. Zwei ältere Sicherungen führen dieselbe datierte freie und gebundene Menge. Ihre Staking-Notiz weist ein Stake-Konto aus. Ihnen fehlt dessen individuelle Kettenkennung. Der historische Abgleich vom 26.10. übernimmt seine Bestände aus diesem Portfolio und der damaligen Nutzerbestätigung. Die überlappenden Exporte führen dieselben 17 Staking-Beobachtungen mit identischen dokumentarischen Identitäten.

In einem frischen Chromium 141.0.7390.37 auf Loopback wurde das migrierte Originalportfolio über die reguläre Backup-Dateiauswahl wiederhergestellt. Der CSV-Dialog erkannte beide Originaldateien, ließ die explizite Zuordnung zur freien SOL-Wallet zu und zeigte nach vollständigem Aufklappen 354 bzw. 357 Zeilen. Je Datei erschienen sechs Delegationen, fünf Undelegationen und sechs Auszahlungen. Die finanzielle Übernahme blieb gesperrt. Nach Zuordnung und Abbruch blieb der vollständige IndexedDB-Datensatz einschließlich Revision bytegleich. Die Sitzung verwendete ausschließlich lokale Anfragen. Auf demselben Checkout bestanden die 30 zugehörigen Ledger-/Staking-Regressionen. [Produktkontrakt](https://github.com/joke0071/foliolab-open/blob/74e7a94274ba5191864ffde33b357d90b1940ec4/src/ledger-live.js).

**Entscheidung #159.** Der Kontobezug, der datierte angezeigte Bestand und die Vorschau sind bestätigt. Offen bleibt die unabhängige Zuordnung einer konkreten Delegation zu diesem Stake-Konto samt freiem und gebundenem Endbestand am gleichen Stichtag. Die gesichteten privaten Bestandsunterlagen und der lokale Archivkatalog lieferten dafür keinen separaten Kettenbeleg. Wiedereinstieg mit einer bereits archivierten Transaktions-/Kontodatenantwort, die diese Zuordnung und Salden prüfbar macht. Der Vergleich von interner Verschiebung, Gebühr und Reward folgt auf dieser Grundlage. Paketstand 17/29.

## Übernahme ab `be90bee2` · 26.11.2026

| Bereich | Entscheidung und Beleg |
| --- | --- |
| Main und Livefreigabe | [`74e7a942`](https://github.com/joke0071/foliolab-open/commit/74e7a94274ba5191864ffde33b357d90b1940ec4), Tree `31b21414`, SW347 LIVE_ACCEPTED. Der aktuelle HTML-Abruf lieferte HTTP 200 mit SHA-256 `48ae17df3f0ea22e990923568df8140c1f92cbe5b70d775a52f5c0e933d2f67a`, bytegleich mit Main. |
| Läufe | Die übernommene [Live-Fortsetzung](https://github.com/joke0071/foliolab-open/actions/runs/45783680786/job/139785038146) ist vollständig SUCCESS. Der [reguläre Main-Lauf](https://github.com/joke0071/foliolab-open/actions/runs/45775837478) bleibt FAILURE. Der [parallele Ansatz](https://github.com/joke0071/foliolab-open/actions/runs/45783680300) ist CANCELLED und durch die erfolgreiche Fortsetzung erledigt. Bei Übernahme waren die Actions-Abfragen für laufende und eingereihte Läufe leer. |
| Eingänge | Main und Arbeitszweig entsprachen den übergebenen SHAs. Die Issue-Abfrage seit dem Checkpoint lieferte keine Änderungen. Die sechs offenen PRs enthielten keinen neuen Abnahmekandidaten. [#427](https://github.com/joke0071/foliolab-open/pull/427) hatte weder eingereichtes Review noch Review-Thread oder Gesprächskommentar. |
| Paketstand | **6/6 Kernbereiche, 17/29 Folgepakete, 12 offen.** Die nachstehenden Quellenabgleiche lieferten keinen Eingang, der eine vollständige Abnahme auslöst. |

**#119 · Gespeicherte Cosmos-Position.** Dies ist der kürzeste belegbare Wiedereinstieg. Eine bereits gespeicherte Positionszuordnung würde den vorhandenen Produktprüfpfad für den Viererfall öffnen. Der unabhängige [Block- und Saldenbeleg](release-evidence/cosmos-four-rewards-block-34048131.json) trägt die vier Ereignisse und das Soll von 4,972381 ATOM. Im gezielten lokalen Abgleich von 28 lesbaren Dateien beziehungsweise Archivinhalten aus den vorhandenen Wallet-Unterlagen, davon acht JSON-Dokumente, fehlte die öffentliche Adresse des Viererfalls. Das ursprüngliche [Live-Archiv](https://github.com/joke0071/foliolab-open/actions/runs/45783680786/artifacts/15098959376) bestätigt den Einzelreward. Wiedereinstieg mit einer unabhängig gespeicherten freien ATOM-Position für die Adresse des Viererfalls, einschließlich Positions- und Konto-ID, Chain und nativem Asset. Danach genau vier Rewards an 11, 17, 23 und 29, Unterscheidbarkeit der drei gleichen Beträge, 4,972381 ATOM, Wiederimport, erneuten Scan und frischen verschlüsselten Restore im regulären Produktpfad prüfen.

**#159 · Archivierte Stake-Zuordnung.** Der lokale Abgleich derselben Unterlagen mit den sechs Delegationsreferenzen lieferte drei Texttreffer und keine passende archivierte Transaktionsantwort mit Vor- und Nachsalden. Zwei separate Facharchive enthalten zusammen 17 Einträge und hatten keine so benannte Konto- oder Transaktionsantwort. Die [auf SW347 lokal geprüfte Ledger-Vorschau](#ledger-stake-abgleich-nach-der-live-freigabe) bleibt als Nachweis für Kontozuordnung, 17 Vorgänge je Originalexport und unveränderte Revision maßgeblich. Wiedereinstieg mit archivierter Zuordnung der konkreten Delegation zum individuellen Stake-Konto sowie freiem und gebundenem Saldo am selben Stichtag. Die externe RPC-Abfrage mit privater Kennung war zuvor durch die automatische Freigabeprüfung abgelehnt worden. Dieser Abgleich blieb lokal.

**#174 · Weitere öffentliche Flex-Beispiele.** Die [21 XML-Fixtures von ib-flex auf Commit `a433988c`](https://github.com/clifton/ib-flex/tree/a433988cfed08847e8bd3b264b35a2d90d87e45d/tests/fixtures) wurden gegen das Soll aus getrenntem Ausführungs- und FX-Nettobeleg geprüft. In 20 gültigen Dokumenten stehen 41 Ausführungszeilen, davon vier mit Orderschlüssel, ohne wiederholten Orderschlüssel je Konto und Dokument. Dazu kommen eine Bestätigungszeile und 41 Cash-/FX-Zeilen. Das 21. Dokument weist ungültiges XML auf und lieferte keinen qualifizierten Originalbeleg. Die geprüften Zeilen ergeben kein Schlüssel-, Gebühren- und FX-Netto-Paar für eine Teilfüllung. Für die [Consorsbank-Nettobelastung von 61.708,71 EUR](release-evidence/flh05-consors-partial-fills-2026-11-25.json) fehlt weiterhin der native Ausführungsexport derselben Order. Bei den [belegten Swissquote-Teilfüllungen](#delta-ab-faa91ef1) fehlt die unabhängige zugeordnete FX-Nettoabrechnung. Nach Qualifikation folgen beide Importreihenfolgen, Wiederimport, Rücknahme und Restore.

**Auslieferung und Quellen.** Die aktuelle [Produktionsantwort](https://foliolab.unperfekt.at/) enthält weder einen HTTP-CSP- noch einen X-Frame-Options-Header. ADB und USB-Gerätebus waren in der Projektsitzung nicht verfügbar. #298, #254 und #256 bleiben an die in der Matrix benannten Auslieferungs- und Gerätenachweise gebunden. [Yahoo Finance](https://finance.yahoo.com/quote/VWCE.DE/history/) weist für VWCE Xetra/EUR und adjustierte Schlusskurse aus. Die öffentlich sichtbare Tabelle liefert keinen Freigabebeleg für die vollständige Reihe zur Anzeige in FolioLab. [CMC dokumentiert den Keyless-Abruf für Sentiment-Prototypen](https://coinmarketcap.com/api/keyless/) und [separate Nutzungsbedingungen je Tarif](https://coinmarketcap.com/api/pricing/). Der [Produktivnachweis für CORS und CNN](release-evidence/sw340-sentiment-source-gates-2026-11-25.json) bleibt maßgeblich. Die übrigen Wiedereinstiege und verifizierten Ergebnisse stehen in der Matrix.

## Fortsetzung ab `1d015738` · 26.11.2026

| Bereich | Stand |
| --- | --- |
| Main und Livefreigabe | [`74e7a942`](https://github.com/joke0071/foliolab-open/commit/74e7a94274ba5191864ffde33b357d90b1940ec4), Tree `31b21414`, SW347 LIVE_ACCEPTED. Letzter abgeschlossener Nachweis ist die [Live-Fortsetzung 45783680786](https://github.com/joke0071/foliolab-open/actions/runs/45783680786). |
| Lauf und Eingänge | Die Actions-Abfragen für laufend, eingereiht, wartend, ausstehend und angefordert ergaben je null Treffer. Main und Arbeitszweig entsprachen bei Aufnahme den bekannten Referenzen. [#427](https://github.com/joke0071/foliolab-open/pull/427) enthält weiterhin kein eingereichtes Review und keinen neuen Gesprächskommentar. |
| Paketstand | **6/6 Kernbereiche, 17/29 Folgepakete, 12 offen.** Für #124 wurden eine weitere Originalquelle und die Renditerechnung auf gemeinsamen Tagen geprüft. Der lokale Vergleich und die 18 zugehörigen Regressionen sind abgeschlossen. |

**#124 · VWCE-Kurse direkt von der Börse und Vergleich auf gemeinsamen Tagen.** Soll sind eine für den Vergleichszeitraum vollständige adjustierte Xetra/EUR-Reihe, dokumentierte Anzeigerechte und ein Abgleich auf gemeinsamen Bewertungstagen. Auf der [Deutsche-Börse-Kurshistorie für IE00BK5BQT80](https://live.deutsche-boerse.com/en/etf/vanguard-ftse-all-world-ucits-etf-usd-accumulating/price-history/historical-prices-and-volumes) wurden Xetra und alle drei Adjustierungen (Splits, Dividenden, Bezugsrechte) gewählt. Der Browser zeigte die Schlusskurse vom 19., 20., 23., 24. und 25.11.2026. Die gezielte Abfrage für 02.–06.03.2020 über den Kalender lieferte nach Abschluss keine Preistabelle. Zwei separat geprüfte Objektpfade des [eingestellten Xetra-Public-Data-Archivs](https://registry.opendata.aws/deutsche-boerse-pds/) für den 13.12.2019 und 03.03.2020 (Stundenobjekt XETR16) antworteten auf HEAD mit HTTP 403.

**Soll/Ist der Rechnungsprobe.** Die unabhängige Referenz verwendet auf denselben fünf Tagen EUR-Cent und rationale Zahlen. Die ETF-Reihe startet bei 100. Das Modellportfolio hält zehn ETF-Anteile und startet mit 300 EUR Cash. Nach der Bewertung am 20.11. fließen 400 EUR zu und am 24.11. nach der Bewertung 100 EUR ab. Die FolioLab-Renditefunktion für Zeiträume mit expliziten Vor-/Nachbewertungen und der Produktpfad für die zahlungsflussfreie ETF-Reihe stimmen auf `74e7a942` jeweils mit der unabhängigen Referenz bis auf weniger als `1e-12` überein. Der derzeitige Portfolio-Pfad liefert bei Tagesendständen mit Zahlungsfluss ohne getrennte Ereignisbewertung wie vorgesehen keinen TWR-Wert. Bei fehlendem Startwert bleibt er ebenfalls unbekannt. Die vorhandenen 18 Node-Regressionen für Performance und Marktdaten bestanden. [Renditefunktionen auf dem geprüften Main](https://github.com/joke0071/foliolab-open/blob/74e7a94274ba5191864ffde33b357d90b1940ec4/src/performance.js).

**Entscheidung #124.** Die Stichprobe und der rechnerische Abgleich sind qualifiziert. Die [Börsenbedingungen für historische Downloads](https://live.deutsche-boerse.com/en/disclaimer-en) behandeln das Angebot von Mehrwertdiensten an Dritte gesondert. Ein Nachweis zur Verwendung der Reihe in der öffentlichen FolioLab-Ansicht sowie die vollständige Reihe für den angestrebten Zeitraum fehlen. Bei verfügbarem, passend lizenziertem Verlauf die Abdeckung der gemeinsamen Bewertungstage prüfen, die Stichprobe erweitern und den Produktvergleich nur mit belegten Portfolio-Bewertungen freigeben. [Adjustierung laut Börse](https://live.deutsche-boerse.com/en/adjusted-prices).

**#298 · Auslieferungsweg.** Die öffentliche DNS-Abfrage bestätigt den CNAME von `foliolab.unperfekt.at` auf `joke0071.github.io`. Die Nameserver der Hauptdomain gehören zu Helloly. Die DNS-Zone belegt damit keine headerfähige Auslieferung für die Subdomain. Der Wiedereinstieg setzt einen autorisierten Auslieferungspfad mit konfigurierbaren HTTP-Antwortheadern voraus. Danach Framing-Verhalten auf der tatsächlichen Origin sowie den ausstehenden nativen Safari-/VoiceOver-Nachweis prüfen. [CNAME-Abfrage](https://dns.google/resolve?name=foliolab.unperfekt.at&type=CNAME) · [NS-Abfrage](https://dns.google/resolve?name=unperfekt.at&type=NS).

## Fortsetzung ab `33df7eda` · 26.11.2026

| Bereich | Geprüfter Stand |
| --- | --- |
| Main und Livefreigabe | [`74e7a942`](https://github.com/joke0071/foliolab-open/commit/74e7a94274ba5191864ffde33b357d90b1940ec4), Tree `31b21414`, SW347 LIVE_ACCEPTED. [Live-Fortsetzung 45783680786](https://github.com/joke0071/foliolab-open/actions/runs/45783680786). |
| Eingänge und Läufe | Main und der Arbeitszweig entsprachen dem Einstieg. Seit dem Checkpointzeitpunkt gab es keine aktualisierten Issues. Für [#427](https://github.com/joke0071/foliolab-open/pull/427) liegt weiterhin kein Review vor. Die Abfragen für eingereihte, laufende, wartende, ausstehende und angeforderte Läufe ergaben je null Treffer. |
| Paketstand | **6/6 Kernbereiche, 17/29 Folgepakete, 12 offen.** Der kontrollierte Chromium-HTTPS-Lauf zu TRUST01 ist abgeschlossen und liefert einen Nachweis für den Ausrollweg. |

**Projekteingänge.** In zwei vorhandenen Drive-Projektordnern sind drei verschlüsselte FolioLab-Sicherungen und sechs native Anbieterexporte verzeichnet. Darunter befindet sich ein Ledger-Wallet-Export mit 82.392 Bytes. Das Inventar enthält keinen separat ausgewiesenen ATOM-Positionsdatensatz, keine separate archivierte Solana-Konto-/Transaktionsantwort und keinen Originalexport bzw. Nettobeleg für die genannten Consorsbank-/Swissquote-Orders. Die Inhalte der verschlüsselten Sicherungen blieben ungeprüft. Die für #119, #159 und #174 dokumentierten Kriterien bleiben damit offen. Seit der letzten Fortsetzung wurde kein neuer einschlägiger Archiveingang gefunden.

**#298 · HTTPS-Framingschutz und Service-Worker-Wechsel.** Soll war eine funktionierende Auslieferung mit `Content-Security-Policy: frame-ancestors 'none'` und `X-Frame-Options: DENY` bei Erstaufruf, Worker-Wechsel und Offline-Start. Im isolierten Chromium 141.0.7390.37 wurden auf einer kontrollierten HTTPS-Origin die SW347-Anwendungsbytes mit beiden Antwortheadern ausgeliefert. Die HTML-SHA-256 entsprach Main und dem aktuellen Produktionsabruf (`48ae17df3f0ea22e990923568df8140c1f92cbe5b70d775a52f5c0e933d2f67a`). FolioLab startete normal. Das kontrollierte Framing über eine zweite lokale Origin wurde vor und nach der Cache-Aktualisierung durch die Richtlinie blockiert.

**Cache-Wechsel.** Bei gleicher Service-Worker-Revision nahm eine frische Sitzung die neue Antwortmetadaten-Kennung an, während der bestehende Worker beim Neuladen die alte Kennung weiterhin aus seinem Cache lieferte. Beide Schutzheader waren während dieses Kennungstests durchgängig vorhanden. Eine neue Cache-Revision im Testworker löste das reguläre automatische Neuladen aus. Die alte Cache-Generation wurde entfernt. Die neu ausgelieferten Header und die neue Kennung blieben auch beim anschließenden Offline-Start erhalten. Der erste Test las noch die alte Antwort. Der ausgewertete Lauf wartete auf die automatische Navigation und prüfte danach den aktiven Cache. [Worker auf dem geprüften Stand](https://github.com/joke0071/foliolab-open/blob/74e7a94274ba5191864ffde33b357d90b1940ec4/sw.js) · [HTTP-Framingrichtlinie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

**Entscheidung #298.** Der aktuelle Produktionsabruf liefert HTTP 200 und dieselben HTML-Bytes, weiterhin ohne einen der beiden Schutzheader. Bei verfügbarem autorisiertem Auslieferungsweg die Header mit einer neuen Service-Worker-Cache-Revision ausrollen. Dann frisches Profil, bestehende Installation nach tatsächlicher Aktivierung, Offline-Start und Fremd-Framing auf der ausgelieferten Origin prüfen. Die native Safari-/VoiceOver-Ansage und der ITP-Zeitfall bleiben eigene Nachweise. [Produktions-Origin](https://foliolab.unperfekt.at/).

## Wege zur Freigabe ohne Nutzermitwirkung · 26.11.2026

Main `74e7a942` und SW347 LIVE_ACCEPTED bleiben die geprüfte Basis. Letzte [Live-Fortsetzung 45783680786](https://github.com/joke0071/foliolab-open/actions/runs/45783680786). **6/6 Kernbereiche und 17/29 Folgepakete abgenommen, zwölf offen.**

### #119 · Unabhängig gespeicherte öffentliche Projektposition

Die [Bank-Originalantwort](https://cosmoshub.api.kjnodes.com/cosmos/bank/v1beta1/balances/cosmos1tyqmer8ul0l7msewx82wnhu9f0kswd79hxh6ee/by_denom?denom=uatom) wurde mit `x-cosmos-block-height: 34048131` angefordert. HTTP 200 und der identische Antwortheader bestätigten die Blockhöhe. Die Antwort führt `4972381 uatom` (SHA-256 `f1d97eda4be343f97ea319efd7e33f0fe20ced45e71e466203bce950c991717c`). Die [Transaktionsantwort](https://cosmoshub.api.kjnodes.com/cosmos/tx/v1beta1/txs/A4D60F019289A8AA924B55FB34971CC55FC4A51402E8743291161D6276790D7E) wurde separat gelesen. Sie bestätigt Erfolg und die vier Reward-Ereignisse an 11, 17, 23 und 29 (SHA-256 `158299370a3de28ddb8f07dcf3217e70a9dca140bc75a71f2ddabfd28e3b2770`).

Für jeden Browser wurde die neue öffentliche freie ATOM-Position zuerst per regulärem Scan in einem frischen SW347-Portfolio auf einer eigenen Origin angelegt. Als Scanantwort wurde ausschließlich der archivierte Banksaldo eingespielt. FolioLab erzeugte und speicherte Position, Kontobindung, Chain und native Assetidentität vor jeder Historienübernahme. Das dabei erzeugte verschlüsselte Backup wurde auf einer zweiten Origin in den [Kandidaten `8c61ce5a`](https://github.com/joke0071/foliolab-open/commit/8c61ce5a8ef500b94a98c97f244c52e0f0e5078c) zurückgespielt und inhaltlich exakt mit dem gespeicherten Ausgangsmodell verglichen.

In Chromium 141.0.7390.37, Firefox 142.0.1 und WebKit 27.2 zeigte der Kandidat vier unterscheidbare Rewards, einschließlich dreier gleich großer Beträge, und **4,972381 ATOM**. Die Gebühr und der Tip stehen als gemeinsame Gebühr von 16.007 µATOM in der Historie. Vorschau und Verwerfen erhielten die Revision. Die Übernahme schrieb genau eine Revision und erhielt die übrigen Finanzdaten. Wiederimport, erneuter Scan, Wiederöffnung und verschlüsselter Restore in ein frisches Profil bestanden. Der vollständige Node-Lauf ergab **1.546/1.546**. Für WebKit wurden die benötigten Bibliotheken aus dem signierten Debian-Archiv im isolierten Testverzeichnis bereitgestellt. Das archivierte verschlüsselte Testportfolio und die Prüfprotokolle aller drei Browser sind gesichert.

**Entscheidung.** Der Produktpfad für den öffentlichen Viererfall ist damit in drei Browsern prüfbar. Originale, Eingangsbackup und Wiederherstellungsbeleg liegen zusammen vor. Der Zweig `feature/cosmos-public-four-rewards` ist getrennt zur regulären PR-, Integrations-, Wallet-, Pages- und Live-Prüfung vorbereitet. Der Entwurf [PR #443](https://github.com/joke0071/foliolab-open/pull/443) prüft exakt den angegebenen Head. Abgeschlossene Läufe: [Public wallet live audit (informational)](https://github.com/joke0071/foliolab-open/actions/runs/45835050698) · [FolioLab Open – testen und veröffentlichen](https://github.com/joke0071/foliolab-open/actions/runs/45835050752) · [Wallet scan checks](https://github.com/joke0071/foliolab-open/actions/runs/45835050634). Der öffentliche Projektfall verwendet eigene Test-IDs. Die Zuordnung zu einer privaten oder früher vorhandenen Position bleibt eigenständig. Alle sechs Integrationsjobs, Wallet-CI und öffentlicher Wallet-Audit sind erfolgreich. Pages und Live-Abnahme wurden im PR gemäß Workflow nicht ausgeführt. Der Kandidat ist als Entwurf dokumentiert. Auf SW347 wurde der Import des neueren verschlüsselten Testbackups vor der Ersetzung abgewiesen, der vorhandene IndexedDB-Datensatz blieb einschließlich Revision exakt erhalten. Der öffentliche Freigabezähler folgt erst der Produktivabnahme.

### Reihenfolge und konkret verfügbare Wege

| Pakete | Weg ohne Unterlagen oder Geräte des Nutzers | Verbleibende Bedingung |
| --- | --- | --- |
| Weitere Wallets · #119 | Separaten Originalsaldo und Ereignisse sichern, öffentliche Position im alten Produkt speichern und den Kandidaten mit genau diesem Backup prüfen. Dieser Weg wurde für vier Cosmos-Rewards ausgeführt. | Reguläre Freigaben des Kandidaten. Der private Portfolioabgleich bleibt an seinen eigenen Beleg gebunden. |
| FLH05 · #174, FLH03 · #148, AT05 · #129 | Veröffentlichte Originalpaare als generische Referenzfälle zulassen. Zuerst Schlüssel-, Depot-, Zeitraum- und Nettobeziehung in den unabhängigen Originalen prüfen. #174 benötigt Ausführung und gebuchtes FX-Netto, #148 den regionalen Export und dieselbe Einzelabrechnung, #129 Jahresbeleg und zugehörige Einzelereignisse. | Ein qualifiziertes Originalpaar je Paket. Die persönlichen Bitpanda-Stichtagswerte bleiben an das persönliche Gegenstück gebunden. |
| Ledger/Staking · #159, ETH-Cursor · #268 | Für neue generische Produktfälle dokumentierte öffentliche oder projektinterne Referenzkonten und rohe Providerantworten sichern. Das historische private Originalpaar nur aus vorhandenen, autorisierten Projektarchiven wieder aufnehmen. | Die generische Prüfung kann vorgezogen werden. Individuelles Stake-Konto samt Salden bzw. das ursprüngliche private Cursorpaar bleiben je eigene Abnahmebelege. |
| Recovery · #44/#254, Android-Startperformance · #177/#256 | Einen autorisierten physischen Android-Laborlauf mit demselben 10.000-Buchungen-Testbestand für Wiederherstellung, Datenpersistenz und separate Startmessung nutzen. [Firebase Test Lab](https://firebase.google.com/docs/test-lab/usage-quotas-pricing) dokumentiert physische Geräte im Spark-Kontingent. [Android Device Streaming](https://developer.android.com/studio/run/android-device-streaming) ist eine ergänzende interaktive Variante. | Verfügbares Projekt, nutzbares Kontingent und tatsächlich beobachtbare Offline- und OS-Speicherfälle. [BrowserStack Automate](https://www.browserstack.com/docs/automate/selenium/simulate-network-conditions) dokumentiert Offline-Modi für reale Testgeräte als weitere bedingte Option. Die virtuelle GitHub-Runner-Strecke ist bereits eine eigene Teilabnahme. |
| TRUST01 · #298 | Den lokal bestätigten HTTP-Framingschutz auf bereits autorisierter headerfähiger Auslieferung mit neuer Worker-Cache-Revision übernehmen. [Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/headers/) dokumentiert eine mögliche statische Konfiguration. Safari-/VoiceOver- und ITP-Prüfung auf einem getrennten autorisierten Mac- oder Apple-Geräteplatz ausführen. [BrowserStack Live](https://www.browserstack.com/docs/live/accessibility-testing/screenreader-desktop) dokumentiert Safari mit aktivem VoiceOver. Tarif und Sitzungsdauer für den ITP-Zeitfall müssen zur Prüfung passen. | Bestehender Zugang zur relevanten Auslieferungs-Origin und geeigneter Geräteplatz. Hostwechsel und DNS-Änderung waren kein Teil dieses Testlaufs. |
| Benchmark · #124, Sentiment · #405 | Daten und Rechte an derselben Quelle prüfen, bevor eine öffentliche Anzeige aktiviert wird. #124 nutzt bis dahin die belegte Fünf-Tage-Referenz. Für #405 bleiben die Quellanzeige, der Cache und das Ausfallverhalten lokal testbar. | Vollständige lizenzierte VWCE/Xetra/EUR-Historie. Für CMC und CNN jeweils nutzbarer Produktzugang und Anzeigeerlaubnis. Für eine gesondert benannte Bitcoin-Variante erlauben die [API-Regeln von Alternative.me](https://alternative.me/crypto/fear-and-greed-index/) die Anzeige mit Quellenhinweis direkt am Wert. Der [öffentliche Abruf](https://api.alternative.me/fng/?limit=1) lieferte HTTP 200, JSON mit Wert und Zeitstempel sowie `Access-Control-Allow-Origin: *` für die FolioLab-Origin. Die ursprüngliche CMC-/CNN-Anforderung ist davon unabhängig. |
| Drive/FLH04 · #160/#427 | Den vorhandenen synthetischen Kandidaten über eine autorisierte unabhängige Reviewstrecke prüfen lassen. Geräte- und Remote-Readback mit synthetischen Daten vorbereiten. | Eingereichtes unabhängiges Review, Sicherheitsfreigabe, Projekt-OAuth-Origin und zwei autorisierte Geräte vor Enrollment und Remote-Write. |

## SW348 und externe Voraussetzungen

[PR #443](https://github.com/joke0071/foliolab-open/pull/443) wurde per Squash auf [Main `4e3e4a25`](https://github.com/joke0071/foliolab-open/commit/4e3e4a256ce0d81946ed6907b965d1f30aac33fe) integriert. Tree `9af3806a` entspricht dem geprüften Head `8c61ce5a`. Alle sechs Main-Integrationsjobs und [Pages](https://github.com/joke0071/foliolab-open/actions/runs/45842736002/job/139997776926) sind erfolgreich. Fünf ausgelieferte Dateien einschließlich Worker, Historienmodul und Browser-UI stimmen bytegleich mit Main überein.

**Öffentlicher Cosmos-Fall.** Das ursprünglich auf SW347 gespeicherte Portfolio aus `FolioLab_Cosmos_Referenz_34048131.zip` wurde auf der Produktions-Origin in Chromium 141, Firefox 142 und WebKit 27.2 importiert. Vier Rewards an 11, 17, 23 und 29 bleiben einzeln erhalten. Der unabhängig archivierte Schlusssaldo beträgt **4,972381 ATOM**. Vorschau und Verwerfen erhalten den Bestand. Die Übernahme erhöht die Revision einmal, der Wiederimport bewahrt sie. Erneuter Scan, Wiederöffnung und frischer verschlüsselter Wiederaufbau bestanden in allen drei Engines. [Browserbeleg und Dateihashes](release-evidence/sw348-cosmos-four-live-2026-11-26.json). Der reguläre Live-Job lief nach drei Wiederanläufen am ersten offenen NEAR-Modul in HTTP 429. Der [Wiederanlauf auf demselben Main](https://github.com/joke0071/foliolab-open/actions/runs/45852139278/job/140020961381) prüfte das Originalarchiv und 23 bestandene UI-Module, setzte bei NEAR fort und schloss UI, Recovery, Finanz-E2E und Transfers ab. Die Live-Nachprüfung bestätigte alle 162 Pfade. Die Job-ID im Metadatenfeld des Fortsetzungsarchivs ist im [verifizierten Releasebeleg](release-evidence/sw348-pr443-live-verified-2026-11-26.json) anhand des Original-Uploadlogs berichtigt.

| Paket | Versuch und beobachtetes Ergebnis | Konkreter Eingang für die Restabnahme |
| --- | --- | --- |
| [#174](https://github.com/joke0071/foliolab-open/issues/174) · FX-Teilfüllungen | Kraken-Export und Ledger-Testbeleg verknüpfen zwei Fills mit USD-Gutschrift. Handels- und Buchungswährung sind dort beide USD. Consorsbank liefert die zwei JPY/EUR-Nettowerte. Die IBKR-Dokumentation bestätigt getrennte Reports, liefert aber kein zusammengehöriges Originalpaar für diesen Fall. | Nativer Fill-Export zur bekannten Consorsbank-Order oder ein gleichwertiges Originalpaar mit gemeinsamer Order-ID, FX-Richtung, Gebühren und separat gebuchtem Netto. |
| [#148](https://github.com/joke0071/foliolab-open/issues/148) · Regionalimport | Die native CSV-Strecke und regionale Exportbeispiele sind verfügbar. Die veröffentlichte Downloader-Datei referenziert Einzelbelege, enthält sie jedoch nicht. In beiden Projektordnern sind keine gesonderten Bitpanda-Stichtagssalden ausgewiesen. | Regionaler Trade-Republic-Originalexport und Einzelabrechnung desselben Geschäfts. Für Bitpanda datierter Cash-Beleg und BCI25-Einzelmengen. |
| [#129](https://github.com/joke0071/foliolab-open/issues/129) · Steuerabgleich | Der veröffentlichte Flatex-Jahresreport 2025 enthält Jahresaggregate ohne die zugehörigen Einzelabrechnungen. Die bereits qualifizierte Einzelabrechnung von 2022 gehört zu einer anderen Periode. Die zugänglichen Projektordner enthalten Flatex-Buchungsexporte. | Jahresreport und passende Einzelereignisse desselben Depots und Jahres sowie fallbezogene unabhängige Fachprüfung der Einstandskorrektur. |
| [#159](https://github.com/joke0071/foliolab-open/issues/159) · Ledger-Stake | Der LedgerHQ-Mainnet-Testaccount lieferte am finalisierten Slot 474189201 null Stake-Konten. Ein dokumentierter Devnet-Testaccount lieferte dagegen einen positiven Staking-Reward in Epoche 1217. `getBlock` am Slot 526176001 und ein zweiter RPC bestätigten 1.268.034.935.584 Lamports und 38.984.892.095.298.991 Lamports Endsaldo. Die private Archivrecherche fand keine rohe SOL-Transaktionsantwort mit Vor- und Nachsalden. | Ledger-Original für das individuell zugeordnete Stake-Konto und unabhängige Salden zu derselben Delegation am passenden Stichtag. |
| [#268](https://github.com/joke0071/foliolab-open/issues/268) · ETH-Cursor | Blockscout lieferte für WETH zwei Originalseiten mit 100 eindeutigen Transaktionen. PublicNode-Receipts bestätigten beide Seitenrandereignisse. SW348 reichte den Cursor unverändert weiter, behielt ihn bei Abbruch und meldete bei ungültigem oder zyklischem Cursor Teilabdeckung. Die Suche im autorisierten Archiv fand keine ursprünglichen Private-Providerantworten. | Erste rohe Providerantwort mit privatem Cursor und die zugehörige originale Folgeseite. |
| [#44/#254](https://github.com/joke0071/foliolab-open/issues/254) · Recovery | Die 10.000er-Fixture stimmt mit dem referenzierten SHA-256 überein. GitHub zeigt keinen selbst gehosteten Runner. Der angemeldete Firebase-Zugang listet kein Projekt. Der Test-Lab-Katalogaufruf liefert 403. BrowserStack Live war in der Projektsitzung nicht verfügbar. | Autorisierter physischer Geräteplatz mit beobachtbarer OS-Eviction sowie physisches Zweitgerät für den verschlüsselten Restore. |
| [#177/#256](https://github.com/joke0071/foliolab-open/issues/256) · Startzeit | Dieselbe verifizierte 10.000er-Fixture ist bereit. Der Gerätezugang aus dem Recovery-Abgleich fehlt auch für die Startmessung. | Ein physisches Android-Projektgerät mit echter Prozess- und Netzsteuerung für je fünf Kalt-, Warm- und Offline-Starts pro Vergleichsstand. |
| [#298](https://github.com/joke0071/foliolab-open/issues/298) · TRUST01 | Produktiv-SW und Cache wurden in Chromium gelesen. Die HTML-Antwort enthält weder CSP noch X-Frame-Options. DNS zeigt auf GitHub Pages. Der Cloudflare-Zweig ist ein persönlicher Kursdaten-Worker, und das Dashboard verlangt Anmeldung. Der vorhandene native Safari-Runner-Beleg enthält keine aktive VoiceOver-Sitzung. | Autorisierte headerfähige Auslieferungs-Origin für den Rollout. Nativer Safari-/VoiceOver-Platz mit beobachtbarer Ansage und persistenter Sitzung für den separaten ITP-Zeitfall. |
| [#124](https://github.com/joke0071/foliolab-open/issues/124) · VWCE | Die Yahoo-Stichprobe VWCE.DE/Xetra/EUR lieferte 1.867 datierte Zeilen ab 29.07.2019. Die Börseneinführung war am 25.07.2019. Der 24.10.2025 und 06.03.2026 haben keinen adjustierten Schlusskurs im Abruf. Fünf gemeinsame Bewertungstage bestätigten den bisherigen Referenzwert 101,45741250 ab 100. Der Produkt-TWR weist fehlende Endbewertung und unbewerteten Cashflow zurück. Twelve Data und EODHD lieferten über die geprüften Demo-Zugänge 401 bzw. 403. [Xetra-Einführung](https://www.cashmarket.deutsche-boerse.com/resource/blob/1591188/a542df1ae2684b5c12f554f0295aabe0/data/Introduction_notice.pdf) · [Yahoo-Hinweise zur Weitergabe](https://help.yahoo.com/kb/SLN2352.html). | Vollständiger adjustierter VWCE/Xetra/EUR-Feed der zugelassenen Quelle einschließlich Anzeigerechten. |
| [#405](https://github.com/joke0071/foliolab-open/issues/405) · Sentiment | CMC Keyless lieferte 429, der authentifizierte Endpunkt ohne Projekt-Key 401. Der dokumentierte Basic-Tarif eröffnet einen Produktzugang. CNN lieferte HTML mit Framing-Restriktion und keinem freigegebenen Datenfeed. Alternative.me lieferte JSON und CORS als separate Bitcoin-Referenz. [CMC-Tarife und Rechte](https://coinmarketcap.com/api/pricing/) · [CNN Content Sales](https://commercial.cnn.com/our-solutions/content-sales/). | CMC-Projekt-Key mit autorisiertem serverseitigem Produktpfad. Offiziell freigegebener CNN-Datenweg einschließlich Anzeigerechten. |
| [#160/#427](https://github.com/joke0071/foliolab-open/pull/427) · Drive | Stand `84ef0b37` hat keine eingereichten Reviews, Threads oder Gesprächskommentare. Lokal bestanden die 18 Segmenttests und der native Chromium-Outbox-Test mit isoliertem synthetischem Bestand. Zweigerätefolge vorbereitet. Nach Freigabe zuerst mit A schreiben, den Beleg auf einem separaten B lesen, danach Konflikt und Widerruf prüfen. B prüft heruntergeladene Bytes, Revisions-/Dateikennung und Hash gegen den autorisierten Schreibbeleg von A. Konflikt und Widerruf werden mit vollständigem lokalem Vorher-Nachher-Abgleich wiederholt. | Benannter unabhängiger Prüfer und dokumentierter Reviewabschluss samt Sicherheitsfreigabe. Danach autorisierte OAuth-Origin, Testkonto und zwei Geräte für Write und unabhängig bestätigten Readback. |

## Paketmatrix der 19 ursprünglich offenen Zeilen

Sieben dieser 19 Zeilen sind im dokumentierten Umfang abgenommen. Zusammen mit den zehn zuvor abgeschlossenen Folgepaketen ergibt das 17/29. Die übrigen zwölf Zeilen nennen den jeweils fehlenden Nachweis.

| Paket | Soll | Ist | Beleg | Restkriterium |
| --- | --- | --- | --- | --- |
| UI-Refresh · #300 | Tastaturfokus und Zoom im dokumentierten Bedienumfang | SW340 korrigiert den vorwärts gerichteten Fokusübergang. Drei Bereiche, echte Firefox-Vergrößerung, WebKit, sichtbarer Fokus, Entwurf und gleichbleibende IndexedDB bestätigt. | [Projekt](https://github.com/joke0071/foliolab-open/issues/300) | **Abgenommen** im dokumentierten Zeilenumfang. [SW340 Live](https://github.com/joke0071/foliolab-open/actions/runs/45620573232/job/139241875358). |
| Speicher und Recovery · #44/#254 | OS-Eviction und Restore auf zweitem Gerät | HTTPS-Aktualisierung mit 10.000 Buchungen, Offline-Neustart und gesondert blockierter inkompatibler SW88-Schreibversuch belegt. 10.000 Buchungen im alten und neuen Worker sowie beim Offlinestart in drei Engines bei gleichen DB-Bytes und gleicher Revision. SW346→SW347 bewahrt denselben großen Datensatz offline. Zwei alte SW346-Leser melden einen Lesefehler für neu gespeicherte 24-stellige NEAR-Mengen. Beide erhalten DB-Bytes und Revision, SW347 öffnet den vollständigen Bestand erneut. Der passwortgeschützte Export aus Linux-Chromium ist auf einem unabhängigen macOS-Runner in der normalen Safari-App einschließlich Prozessneustart abgeglichen. | [Projekt](https://github.com/joke0071/foliolab-open/issues/254) · [SW346](release-evidence/sw346-10000-offline-upgrade-2026-11-25.json) · [Großbestand](release-evidence/sw347-10000-offline-upgrade-2026-11-25.json) · [Versionswechsel](release-evidence/sw347-near-legacy-reader-2026-11-25.json) · [Safari-Restore](release-evidence/sw347-native-safari-cross-host-2026-11-25.json) | Beobachtete OS-Bereinigung und Wiederherstellung auf dem vorgesehenen physischen Zweitgerät. [Gerätezugang](#delta-ab-faa91ef1). Danach OS-Bereinigung dokumentieren und den verschlüsselten Export auf dem physischen Zweitgerät mit der 10.000-Buchungen-Referenz abgleichen. |
| AT05 · #129 | Automatische Kostenbasiszuordnung und Jahresabgleich | OeKB-Original, Flatex-Einzelabrechnung über 27,22 EUR und Anschaffungskostenkorrektur unabhängig berechnet. Automatische Zuordnung im gezielten Sonderereignistest gesperrt. Dokumentierende Jahresansicht, Journal und Restore im bisherigen Umfang belegt. Das öffentliche Steuerreport-Beispiel 2025 und die Einzelabrechnung 2022 wurden getrennt geprüft. Ein Jahresaggregat mit zugehörigen Einzelereignissen desselben Depots fehlt. | [Projekt](https://github.com/joke0071/foliolab-open/issues/129) · [Prüfbeleg](release-evidence/sw340-at05-cost-basis-boundary-2026-11-25.json) | Jahresabrechnung desselben Depots, fallbezogene Fachprüfung und Nachweis einer automatischen Kostenbasiszuordnung. Bei Eingang Einzelereignisse und Jahreswerte desselben Depots fachlich zuordnen und die automatische Kostenbasis im Produkt mit unabhängigem Soll prüfen. |
| Benchmark · #124 | VWCE/Xetra/EUR gegen Portfolio-TWR auf gemeinsamen Bewertungstagen | 100 % VWCE/Xetra/EUR, Fünf-Tage-Stichprobe und unabhängige TWR-Rechnung mit Ein- und Auszahlung. FolioLab belässt Rendite bei fehlenden Ereignisbewertungen als unbekannt. | [Projekt](https://github.com/joke0071/foliolab-open/issues/124) · [Prüfbeleg](release-evidence/sw339-ibkr-twr-flow-2026-11-25.json) · [Xetra-Quellen und Rechte](release-evidence/vwce-xetra-archive-rights-2026-11-25.json) · [Börsenstichprobe und TWR](#fortsetzung-ab-1d015738--26112026) | Vollständige adjustierte EUR-Reihe samt Anzeigerechten und gemeinsamer Vergleich auf belegten Bewertungstagen. Bei Eingang die bekannten Zahlungsflüsse und Portfolio-TWR gegen diese Reihe auf identischen Bewertungstagen abgleichen. |
| AT03 · #127 | Persönlicher gebuchter EUR-Saldo und Kontotransfer | Öffentlicher EUR-Kontostand plus persönliches Kraken-EUR-Spot-Saldenpaar und 216 exakt abgeglichene Bewegungen. Getrennt qualifiziert: vier Originalbeine einer eigenen EUR-/USDC-Spot-/Earn-Umbuchung, Reimport und verschlüsselter Restore in drei Browsern. | [Projekt](https://github.com/joke0071/foliolab-open/issues/127) · [Salden und drei Browser](release-evidence/at03-kraken-booked-balances-2026-11-25.json) · [Prüfmethode](release-evidence/at03-kraken-booked-balances-2026-11-25.mjs) | **Abgenommen** im dokumentierten Zeilenumfang. |
| FLH05 · #174 | Gebuchte FX-Teilfüllungen mit Quellschlüsseln in der Importstrecke | Kraken-Split-Orders und Ledgerbeine abgeglichen. Consorsbank nennt nun Gebühren, Kursrichtung JPY je EUR sowie zwei einzelne EUR-Nettobelastungen derselben Order. | [Projekt](https://github.com/joke0071/foliolab-open/issues/174) · [Prüfbeleg](release-evidence/flh05-consors-partial-fills-2026-11-25.json) · [Suche nach gepaarten Originalen](#quellenabgleich-am-26-november) · [IBKR und Flex](release-evidence/flh05-ibkr-public-execution-sources-2026-11-25.json) | [Weitere DEGIRO-, Kraken-, Swissquote- und Trading-212-Beispiele geprüft](#delta-ab-faa91ef1). [Zusätzlicher französischer Kontobeleg](#delta-ab-66d3a38c) ohne Orderschlüssel. Nativer Ausführungsexport derselben Gruppe. Zuordnung, Reihenfolge, Wiederimport, Rücknahme und Restore auf diesem Profil. [Zusätzlicher Flex-Quellencheck](#übernahme-ab-be90bee2--26112026). |
| FIN-E2E01 · #255 | Wirtschaftliche Einzelrücknahme | EUR-Cashfall abgenommen. Die gezielte Rücknahme stellt auf SW342 386 Anteile und 39.303,64 EUR Kostenbasis wieder her und kehrt 39.038,06 EUR Netto-Cash exakt um. Gebühren, Steuern, realisiertes Ergebnis, Journal und externe Flows sind abgeglichen. | [Projekt](https://github.com/joke0071/foliolab-open/pull/433) · [Prüfbeleg](release-evidence/sw342-fund-sale-removal-2026-11-25.json) | **Abgenommen** im dokumentierten Zeilenumfang. |
| Verwaltung · #165/#257 | Verwaltung einer Einzelrücknahme | Tatsächliche Verwaltungsoberfläche für erlaubten Cash-Abgang und geschützte Folgeabhängigkeit. Abbruch, Stale, Wiederimport, Undo und Restore für Cash geprüft. SW342 bestätigt die positive Einzelrücknahme, den geschützten Kontrollpunkt, Abbruch, veraltete Revision, Wiederimport, Sitzungs-Undo und frischen Restore in drei Browsern auf der Produktivdomain. | [Projekt](https://github.com/joke0071/foliolab-open/pull/433) · [Prüfbeleg](release-evidence/sw342-fund-sale-management-undo-2026-11-25.json) | **Abgenommen** im dokumentierten Zeilenumfang. |
| FLH03 · #148 | Regionaler TR-Import und Bitpanda-Endbestand | Öffentlicher Trade-Republic-Kontoauszug als generischer CSV-Fall. Sechs native CSV-Profile gegen veröffentlichte PDF-Abrechnungen verglichen. Persönlicher TR-Fall entfällt. | [Projekt](https://github.com/joke0071/foliolab-open/issues/148) | [Neue Quellen zum regionalen Export](#delta-ab-66d3a38c) geprüft. Passendes Paar aus nativem regionalem Export und Einzelabrechnung. Persönliche Bitpanda-Stichtagsbestätigung für Cash und BCI25-Einzelpositionen. Regionales Originalpaar gemeinsam im Import qualifizieren und beim persönlichen Abgleich Cash sowie die BCI25-Einzelpositionen gegen den Stichtag abgleichen. |
| FLH03-18 · #159 | Weitere echte Ledger-/Stake-Position mit Kontozuordnung | Ein individueller Mainnet-Stake-Fall ist über die Ledger-Referenz mit Delegation, freien und gebundenen Vorher-/Nachher-Salden, Gebühr und Rewards verbunden. | [Projekt](https://github.com/joke0071/foliolab-open/issues/159) · [Neuer Ketten-Teilnachweis](#delta-ab-74c68fd6--27112026) | Für den späteren Portfolio-Stichtag fehlen freier Wallet-Saldo und Stake-Kontostand mit historischem Delegationszustand am selben Slot. Anschließend reguläre Produktprüfung für Verbuchung, Reimport, Rücknahme und Restore. |
| Weitere Wallets · #119 | Weitere belegte Wallet-Historien und native Genauigkeit | Der Einzelreward aus Block 34.044.337 ist auf SW345 produktiv bestätigt. SW347 bestätigte NEAR-Präzision mit 24 Nachkommastellen. SW348 bestätigte Block 34.048.131 mit vier getrennten Rewards, 4,972381 ATOM, Wiederimport mit gleicher Revision, Scan, Wiederöffnung und frischem verschlüsseltem Restore in drei Browsern. | [SW345](release-evidence/sw345-cosmos-history-release-2026-11-25.json) · [SW347 NEAR](release-evidence/sw347-near-native-precision-2026-11-25.json) · [SW348 Browserbeleg](release-evidence/sw348-cosmos-four-live-2026-11-26.json) · [SW348 Vollabnahme](release-evidence/sw348-pr443-live-verified-2026-11-26.json) | **Abgenommen** im öffentlichen Zeilenumfang. Der separate private Portfolioabgleich erwartet weiterhin die historische Kontozuordnung. |
| ETH-Cursor · #268 | Historisches Cursorpaar des Privatfalls | Öffentlicher Seitenwechsel und Chain-Receipts bereits abgenommen. Verfügbare Privatbelege gezielt für den historischen Fall geprüft. | [Projekt](https://github.com/joke0071/foliolab-open/issues/268) · [Prüfbeleg](release-evidence/sw321-eth-cursor-public-2026-11-16.json) · [Archivrecherche](release-evidence/eth-historical-cursor-archive-scope-2026-11-25.json) | Ursprüngliche private Providerantwort mit Cursor und zugehörige Folgeantwort. Beim Fund den ursprünglichen Seitenwechsel über den Dialog und die Fortsetzung mit dem Archivpaar wiederholen. |
| Barausgleich · #52 | Original-Settlement mit Bruchteil, Währung, Kosten und Steuerbasis. Aktien- und Cashjournal sowie atomare Abweisung. | EUROAPI-Stückrest vollständig abgerechnet. SW346 live bestätigt. Zwei Onvista-Teilbelege prüfen separat Zuteilung und Zahlung. Die separate ING-Abrechnung weist 1,36 USD bei 1,089718 USD je EUR und 1,25 EUR Netto aus. Der Produktpfad trifft den ausgewiesenen Verlust von 0,13 EUR. | [Projekt](https://github.com/joke0071/foliolab-open/pull/437) · [Prüfbeleg](release-evidence/sw346-settlement-preflight-2026-11-25.json) · [Live](release-evidence/sw346-live-verified-2026-11-25.json) · [USD-Stückrest](release-evidence/sw347-usd-fractional-settlement-2026-11-25.json) · [SW347 Live](release-evidence/sw347-live-verified-2026-11-26.json) | **Abgenommen** für die separate EUR- und USD-Stückrestabrechnung in drei Produktivbrowsern. Für eine durchgängige Zuteilung und Veräußerung im selben Depot bleibt das übergeordnete Issue #52 offen. |
| CI-Effizienz · #229/#430 | Wiederholbar schnellerer vollständiger Pflichtpfad, einschließlich Queue, Sicherung, Browserbindungen, Berichten und C5-Bildern. | B/A 1.156/1.677 s, A/B 1.770/1.122 s. Beide Gewinne (521/648 s) übersteigen den A-Abstand (93 s) und 417 s historische Spannweite. Im regulären Mainlauf betrug der Pflichtpfad 864 s ab Einstellung des Planjobs. Pages und vollständige Live-Abnahme auf demselben Main bestanden. | [Messung und Abdeckung](release-evidence/sw347-ci-ui-quality-paired-2026-11-26.json) · [Live-Abnahme](release-evidence/sw347-ci-442-live-verified-2026-11-26.json) · [#442](https://github.com/joke0071/foliolab-open/pull/442) | **Abgenommen** für die zwei vollständigen lokalen UI-Qualitätsprüfungen als getrennte Pflichtjobs. #430 bleibt zurückgestellt. |
| TRUST01 · #298 | Grafiklizenzen, HTTP-Framingschutz, natives Safari/VoiceOver/ITP | [Produktivantwort vom 26.11.](#quellenabgleich-am-26-november) erneut auf Antwortheader geprüft. Vier Kolbendateien samt ISC-Notice auf SW341 produktiv abgenommen. Übrige inventarisierte Zeichen in SW343 durch verifizierte ISC-Grafiken ersetzt. Pages und Produktions-Readback sind grün. Natives Safari 27.2 bestätigt Sprunglink, Prozessneustart und getrennten Speicherzugriff bei hostübergreifender Einbettung. Der Standardkurzbefehl und der direkte Start der VoiceOver-App wurden auf getrennten Runnern geprüft. macOS meldete jeweils keine aktive VoiceOver-Sitzung. Eine Ansage wurde nicht bestätigt. | [Projekt](https://github.com/joke0071/foliolab-open/issues/298) · [Prüfbeleg](release-evidence/sw343-live-verified-2026-11-25.json) · [Safari-Protokoll](release-evidence/sw347-native-safari-cross-host-2026-11-25.json) · [Produktive DNS-Zuordnung](#fortsetzung-ab-1d015738--26112026) · [HTTPS- und Worker-Prüfung](#fortsetzung-ab-33df7eda--26112026) | Wirksamer HTTP-Framingschutz auf autorisierter Auslieferungs-Origin und bestätigte VoiceOver-Ansagefolge. Das Verhalten bei einer zeitgesteuerten Löschung ist separat offen. Beim Ausrollen Cache-Revision erneuern. Danach Antwortheader beim Erst-, Aktualisierungs- und Offline-Start sowie Fremd-Framing auf der ausgelieferten Origin sowie die native Fokus-/Ansagefolge in Safari erfassen. |
| Startperformance · #177/#256 | Physische Startmessung mit 10.000 Buchungen | 10k-Fixture und zugängliche Gerätetestwege geprüft. | [Projekt](https://github.com/joke0071/foliolab-open/issues/256) | Physisches Android-Projektgerät für fünf Kalt-, Warm- und Offline-Starts pro Vergleichsstand. [Projekt-Runnerbestand geprüft](#delta-ab-faa91ef1). Sobald erreichbar, die vorhandene 10.000-Buchungen-Fixture für die vorgesehenen Vergleichsläufe verwenden. |
| UI-SENTIMENT01 · #405 | Zulässiger Abruf und Anzeige von CMC und CNN | CMC-CORS und die CNN-Einbettungsgrenze auf produktiver Origin geprüft. Separate Fixture-Prüfung für Anzeige und Cache liegt vor. | [Projekt](https://github.com/joke0071/foliolab-open/issues/405) · [Prüfbeleg](release-evidence/sw340-sentiment-source-gates-2026-11-25.json) | Autorisierter CMC-Abruf und offizieller CNN-Datenweg samt Anzeigeerlaubnis. Nach Datenzugang beide Originalindizes mit Quelle, Datenstand, Cache und Ausfallverhalten im Produktpfad prüfen. |
| FLH04 · #160/#427 | Unabhängige Sicherheitsfreigabe und Zweigeräteabnahme | Draft und veröffentlichten Reviewauftrag auf neuesten Antworten geprüft. | [Projekt](https://github.com/joke0071/foliolab-open/pull/427) | Unabhängiges Kryptografie-/Architekturreview und konkrete Sicherheitsfreigabe. Danach autorisierter Zwei-Geräte-Test. Enrollment und Remote-Write sind gesperrt. Nach Review und Freigabe auf der autorisierten OAuth-Origin mit zwei isolierten Geräten prüfen und bestätigten Schreibvorgang samt unabhängigem Readback nachweisen. |
| Produktmaster · #149 | Interne Produktvorschau und gesonderte Veröffentlichungsentscheidung | Interne Textfassung und vier privat archivierte Mobilansichten liegen vor. Vier separat gesichtete SW346-Originalbilder bestätigen Positionsverwaltung, datierten Verlauf, Importvorschau und lokalen verschlüsselten Download. Die Beispiele sind als synthetisch eingeordnet. | [Technische Bild- und Textabnahme](release-evidence/internal-preview-technical-acceptance-2026-11-26.json) · [SW346-Originalprüfung](https://github.com/joke0071/foliolab-open/actions/runs/45748125084) | **Abgenommen** für die interne Vorschau. Die öffentliche Bewerbung bleibt gemäß der gesonderten Produktentscheidung zurückgestellt. |
