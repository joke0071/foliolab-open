# UH04: nativer Flatex-Depotexport mit 13 Spalten

Begrenzter Formatschnitt. UH04 bleibt offen; insbesondere gemeinsame Depot-/Kontowirtschaftsgruppen, unbekannte Kostenaufteilungen, weitere Dialekte und historische Endbestände sind hier nicht freigegeben.

Der bisher durch den generischen Blankheader-Schutz abgewiesene Depotexport wird anhand seines vollständigen, positionsgenauen Headers als eigener nativer Dialekt erkannt. UTF-8/Windows-1252, Quellfelder, Leerüberschriften, Bankreferenz, Orderreferenz, Buchtage, Valuta, Nominal, Betrag, Kurs und Devisenkurs bleiben erhalten. Deutsche Zahlen werden innerhalb des bestehenden 18-stelligen Dezimalvertrags exakt gelesen; unbekannte Werte bleiben unbekannt. Der generische CSV-Headerguard bleibt unverändert.

Dieser Dialekt enthält keine Depotkennung. Weder Dateiname, Wertpapierkennung, Bankreferenz noch Order ersetzen diesen Eigentums-/Quellkontext. Deshalb werden keine native Quellenidentität und keine Buchungsfreigabe erzeugt. Auch die gemeinsame Auswahl mit einem Depot12-Export überträgt dessen Depotkennung nicht. Keine Ergänzung zu bestehenden Buchungen, keine Deduplizierung zwischen Dialekten, keine Mengen-, Cash-, Gebühren-, Steuer- oder Bestandswirkung. Betrag und Devisenkurs werden als Quellangaben angezeigt; sie belegen keine Nettoabrechnung oder vollständige Kostenbasis.

Im gemeinsamen Dialog sind die Originalfelder und die fehlende Depotkennung sichtbar. Zuordnung, Simulation und Übernahme bleiben bei ungeklärtem Quellkontext gesperrt. Wenn eine sonst zulässige Simulation an Quellzeilen scheitert, nennt die Ergebnisansicht Datei, Zeile und Klärungsschritt; maximal 20 Hinweise werden gleichzeitig angezeigt. Kein stilles Überspringen oder Teilcommit.

Validierung: synthetische Header-/Encoding-/Präzisions-/Unknown-/Identitäts-/Mischstapel-/HTML-/Sperrtests sowie privater feldweiser Abgleich der vorhandenen Originaldatei gegen einen unabhängigen Python-CSV/Decimal/Datum-Oracle. Die bestehenden nativen UI- und Commitbrowserprüfungen werden zusätzlich verbindlich in Chromium sowie Firefox/WebKit ausgeführt; bestehende Gates bleiben erhalten. Lokale Ergebnisstände und endgültige CI-/Produktionsabnahme separat dokumentieren.

Nächster wirtschaftlicher UH04-Schnitt bleibt die belegte EUR-Depot-/Kontogruppe im bestehenden Journal. Ein belegter Nettocashbetrag mit weiterhin unbekanntem Kosten-/Steuersplit benötigt einen ausdrücklich geprüften gemeinsamen Postingvertrag. Weder `costsVerified=true` noch Nullkosten aus rechnerischer Gleichheit ableiten.
