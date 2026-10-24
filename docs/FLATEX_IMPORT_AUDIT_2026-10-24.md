# FolioLab Open – Flatex-Import: Umsetzungs- und Sicherheitsstatus

Stand: 24. Oktober 2026. Entwicklungsbranch `feature/flatex-on-current-main`, PR #97.

## Architektur
- Lokale CSV-Verarbeitung über `src/flatex-import.js`; keine Broker-Anmeldung, keine externen Kontozugriffe und kein Versand privater Auszüge.
- Ein allgemeines Finanzjournal und die vorhandene CSV-Vorschau bleiben die einzigen Wege zur Buchungsübernahme; kein paralleles Flatex-Bestandsmodell.
- `flatex-reconciliation.js` vergleicht ISIN-Bestände ausschließlich innerhalb des explizit gewählten Flatex-Depots. Eine rechnerische Übereinstimmung ist kein Nachweis vollständiger Historie.
- `flatex-settlements.js` zeigt möglicherweise zusammengehörige Depot- und Kontoumsätze; es erzeugt ausdrücklich keine Geldbewegungen, Steuern oder Gebühren.
- `flatex-backfill.js` erlaubt in eng begrenzten Fällen die **atomare und ausdrücklich bestätigte** Ersetzung undatierter manueller Anfangsmengen durch eine historische Kauf-/Verkaufsfolge. Die beobachtete Stückzahl bleibt unverändert.
- `flatex-cost-basis.js` verhindert, dass eine isolierte Brutto-Ausführung als nachgewiesener steuerlicher Einstandswert oder realisierter Gewinn erscheint.

## Historische Rekonstruktion – Voraussetzungen
Der Backfill darf erst angeboten werden, wenn alle folgenden Bedingungen erfüllt sind:

1. Das Flatex-Wertpapierdepot wurde bewusst zugeordnet.
2. Alle betroffenen ISINs sind im gewählten Depot eindeutig identifiziert.
3. Die importierten Käufe und Verkäufe ergeben zum heutigen Stand **exakt** die bereits erfasste Stückzahl; an keiner chronologischen Stelle entsteht ein negativer Bestand.
4. Keine betroffene Position besitzt bereits einen Journalvorgang, eine bestehende Buchung, datierte Eröffnungskosten, nachgewiesene Kostenbasis oder realisierten Gewinn.
5. Die importierte Folge enthält weder unerklärte Kapitalmaßnahmen noch fehlerhafte, übersprungene oder mehrdeutige Depotzeilen.
6. Ältere verifizierte Stichtage dürfen keinen positiven Bestandswert zeigen, der der beabsichtigten Rekonstruktion widerspricht.
7. Die Simulation auf einer Modellkopie besteht den Journalmengen-Audit. Keine Originaldaten ändern sich vor dem Speichern.
8. Der Nutzer aktiviert die gesonderte Übernahmeoption ausdrücklich.
9. Das ursprüngliche Modell darf seit der Vorschau nicht verändert worden sein.

Nach der Übernahme verbleiben mangels vollständiger Flatex-Abrechnungen der Kostenbasis- und realisierte-P&L-Status ausdrücklich **unbekannt**. Die historischen Stückzahlen selbst sind damit lediglich **rechnerisch konsistent**, nicht brokerseitig vollständig bestätigt.

## CSV-Unterstützung (vorläufig)
- Erkannte bekannte Depot- und Kontoumsatzspalten aus Classic-/Next-Varianten, inklusive deutschem Dezimalformat.
- Nur klar identifizierte ORDER-Käufe und ORDER-Verkäufe als Journal-Kandidaten.
- Je Datei 2 MB, höchstens 20 Dateien und 5.000 Datenzeilen je Vorgang.
- Dublettenerkennung bei eindeutig überlieferten Referenzen. Gleich aussehende Vorgänge ohne eindeutige ID müssen geprüft werden.
- Nicht unterstützte Steuern, Kapitalmaßnahmen, Zinsen, Überträge und Kontoumsätze erscheinen ausdrücklich als offene Prüfpositionen, nicht als stillschweigende externe Cashflows.
- Fremdwährungsbuchungen verlangen ihren tatsächlichen historischen Umrechnungskurs.
- Mehrere Flatex-Depotnummern innerhalb einer Dateiauswahl sind noch kein sicher unterstützter Mehr-Depot-Import.

## Noch notwendige Arbeiten vor produktiver Freigabe
- Ausführliche Formatvalidierung mit **realen, anonymisierten** Flatex-Classic-/Next-Auszügen. Synthetische Daten reichen nicht für eine Vollfreigabe.
- Tatsächliche Zuordnung von Depotabrechnung und EUR-Verrechnungskonto unter eindeutigem Cash-Settlement, Kurswährung und Valutadatum, ohne Doppelzählung.
- Übernahme belegter Gebühren und Steuerabzüge sowie österreichischer Sonderfälle (KESt, Quellensteuer, ausschüttungsgleiche Erträge, fondsbedingte Anschaffungskostenanpassung).
- Robuste Behandlung von Splits, Ein-/Auslieferungen, Währungswechseln, Sparplänen und historischen Lücken.
- Breite Mehrdepot- und sehr-große-Import-Tests sowie Belastungs-/Performanceprofile auf Android.
- Fachlich vollständige Portfolio-Renditeberechnung nur mit geprüften Bewertungs- und externen Cashflowzeitpunkten.
- Vollständige erfolgreiche CI inklusive Chromium, Firefox, WebKit, PWA und Backup-Recovery auf dem **letzten** Commit nach jeder Integration mit verändertem `main`.

## Veröffentlichung
Dieser Stand bleibt ein Draft-PR. Tests beweisen keine steuerliche Korrektheit und keine reale Flatex-Formatabdeckung; daher kein Merge in `main` und keine Behauptung einer live veröffentlichten Flatex-Integration.

## Ergänzung: Kontoumsatzgruppen und prüfbare Quellen (Fortsetzungsrunde)

Die reine `flatex-cash-audit.js`-Auswertung bewahrt jede aus dem CSV
stammende Kontoreferenz als **eigene Gruppe** auf. Bei ausdrücklich
bestätigter EUR-Währung werden pro Gruppe nur die exakten Summen der
positiven und negativen CSV-Kontobeträge angezeigt.

Die Kontoreferenz muss **nicht** das eigene Flatex-Verrechnungskonto
sein: Felder wie `Zahlungspfl.` können einen Kontrahenten bezeichnen.
Eine automatische Zuordnung zu einer vorhandenen Kontoposition oder die
Umwandlung von Kontozeilen in externe Portfolio-Cashflows ist daher
ausgeschlossen. Nutzer erhalten stattdessen eine verständliche Diagnose
und erkennen fehlende Kontoreferenzen.

Der Importassistent kann wiederholt hochgeladene Depotauszüge auf die
ursprüngliche **Datei + Zeile** zurückführen, ohne die interne stabile
Buchungsidentität oder den allgemeinen CSV-Import zu verändern.

Neue synthetische Prüfungen in `tests/flatex-cash-audit.test.mjs`
und `tests/flatex-import.test.mjs` decken die strikte
Kontogruppierung, EUR-Bestätigung, fehlende Angaben und Mehrdatei-
Provenienz ab. Der mobile Browsertest prüft die sichtbaren Beträge und
die Herkunftsangaben.

**Fachliche Grenze:** Ein exakter Netto-Cashbetrag aus hochgeladenen
Kontoumsatzzeilen ist **weder** ein bewiesener Anfangs-/Endkontostand
**noch** eine externe Einzahlung in das Gesamtportfolio. Für eine
spätere automatische Kontobuchung sind bestätigte eigene Kontonummer,
Buchungs-/Valutadatum, sämtliche Zwischenbuchungen und ein gesicherter
Anfangssaldo erforderlich.

## Abnahmeumfang: Flatex-CSV-Beta und Nutzerkontrollen

Die Auslieferung des Flatex-CSV-Profils ist ausschließlich als **Beta mit
abgesicherter Vorschau** vorgesehen. Vor jeder Änderung des Finanzjournals
muss der Nutzer:
1. Die tatsächlich betroffene Flatex-Depotposition auswählen und
   erkannte Kauf-/Verkaufsvorgänge gegen die Originalbelege prüfen.
2. Einen lokal erzeugten **vollständigen FolioLab-Backup-JSON-Download**
   auslösen.
3. Die Beta- und Nichtübernahmehinweise ausdrücklich bestätigen.
4. Bei bestehenden Mengen die streng geprüfte historische
   Eröffnungsbestands-Ersetzung separat aktivieren, sofern zulässig.

Optional steht ein **lokal herunterladbarer CSV-Prüfbericht** bereit mit
Originaldatei, CSV-Zeilennummer, Konto-/Depotreferenz, Einträgen und offenen
Prüfhinweisen. Seine Inhalte werden auf Tabellenformel-Injektionen geprüft;
die Datei wird nicht an einen Anbieter übertragen.

Jede Position zeigt ausschließlich die ihr tatsächlich zugeordneten
Journalvorgänge in einer chronologischen Transaktionsliste. Gleiche ISINs in
anderen Depots werden strikt getrennt. Nicht belegte Dividendeneingänge auf
einem separaten Verrechnungskonto sind **keine** dieser Position nachgewiesenen
Erträge.

Die Beta **unterstützt nicht**: den automatischen vollständigen Import aller
Kontoumsätze; die Errechnung österreichischer Fondssteuern/KESt aus
Depotbewegungen; automatische Umdeutung der Brutto-/Netto-Differenz zu
Spesen oder Steuern; vollständige Corporate Actions; zuverlässige
Benchmarkrenditen ohne entsprechende Kurshistorien; automatische
Steuer-/ETF-Länder-Lookthrough-Auswertungen.

Solche Vorgänge bleiben ausdrücklich als unbestätigte Prüfpositionen
sichtbar. Ein sauberer Import wird nur für eindeutig zuordenbare
Wertpapierkäufe/-verkäufe angeboten. Für ältere Historien müssen bei Bedarf
mehrere Zeiträume aus Flatex Classic bzw. Next exportiert werden;
Unvollständigkeit ist kein Grund, fehlende Trades zu erfinden.

## Abschlusskriterien

- [x] Lokal, ohne Bankzugang oder API-Schlüssel
- [x] Depotzuordnung, Referenz-/Duplikatkontrolle, CSV-Prüfung
- [x] Strenger Mengenaudit, bestehende Kostenbasis/Snapshots geschützt
- [x] Klar begrenzte Cash-Vorschau ohne erfundene externen Flüsse
- [x] Backup-Download und ausdrückliche Beta-Bestätigung als Import-Gate
- [x] CSV-Prüfbericht und positionseigene Buchungsereignisse
- [ ] Reale anonymisierte Flatex-Belege einschließlich Gebühren und
      Kapitalmaßnahmen als unabhängige Integrationstest-Fixutres
- [ ] Fachliche Steuer- und Cashkonto-Automatisierung – **bewusst außerhalb
      des Beta-Umfangs**, keine falsche Vollständigkeitsbehauptung

Eine grüne CI bestätigt den definierten technischen Beta-Umfang, **nicht**
die steuerliche oder brokerseitige Vollständigkeit. Unvollständige Formate
werden mit nachvollziehbarem Hinweis zur manuellen Prüfung zurückgewiesen.
