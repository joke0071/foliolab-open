# FolioLab Open – Flatex-Import: Umsetzungs- und Sicherheitsstatus

Stand: 24. Oktober 2026. Entwicklungsbranch `feature/flatex-on-current-main`, PR #89.

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
