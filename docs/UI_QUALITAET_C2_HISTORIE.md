# UI C2: Historienhinweise und Datumsdarstellung

Basis ist tatsächlich live abgenommenes v182/main85f5899. Genau ein aktiver UI-Strang.

Sourcebefund: In booking-history-ui.js enthält bei weniger als zwei Samples der Fallback bereits „Teilweise verfügbar“, anschließend wird dieselbe Meldung allgemein noch einmal ergänzt. Diagrammachse/Tooltip verwenden ISO, benachbarte Tabelle DD.MM.YYYY. C2 entfernt ausschließlich die doppelte Einleitung, erhält projection.reason und den expliziten Lückenhinweis; ein gemeinsamer lokaler Darstellungsformatter vereinheitlicht Chart und Tabelle.

Keine Änderung an historischen Beständen, Preisen, EUR-Faktoren, Segmenten, Finanzberechnungen, Speicherung, Journal oder Importidentitäten. Die bereits bestehende shared Chartengine verbindet belegte Folgetage und unterbricht echte Lücken. Kein neuer Berechnungspfad und keine künstlichen Werte. Ein einzelner belegter Punkt erfindet weiterhin keinen Trend.

Zusätzliche tatsächliche Browserprüfung ist Pflicht: normal3 Tage/1M+2L, getrennte Tage/2M+0L, ein/kein Kurs mit unbekannter Bewertung statt0, konkrete fehlende Preisursache, genau ein Teilhinweis, Datum gleich Tabelle; exakter Record vor/nach Ansichten unverändert. Bestehende B1-/C1-, alle relevanten Finanz-/Restore-/Offline-/CAS-Regressionen in allen3 Engines erhalten. Livejob gegen Produktionsdomain muss nach Deployment inklusive 105 Assets/SW183 und gezielten UI-Zuständen tatsächlich grün sein; zwei feste synthetische Historienbilder konkret ansehen. Kein Erfolg vor dem tatsächlichen Nachweis.

Work-Ausführungsumgebung derzeit unavailable; Quelländerung über GitHub gesichert, CI maßgeblich. Kandidat SW183, noch keine Releasebehauptung. Gesamt-UI und ursprünglicher Android-Punktbefund bleiben differenziert offen; Hardware/Systemschrift/OAuth separat. #165 Finanzmutationen und #160/#161 Sync nicht Teil dieses Releases.
