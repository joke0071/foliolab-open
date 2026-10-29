# FLH03 – Native Flatex-Betragsprüfung vor Code · 29.10.2026

Basis main2b6ec815/v203 LIVE_ACCEPTED, PR193 gemergt. Native Format-/Order-/Identitäts-/Kontobindungsarbeit fertig, nicht neu implementieren. Reiner Folgeschritt der bestehenden wirtschaftlichen Qualifizierung; keine Finanzübernahme oder neue Importengine. Zwei Etappen: belegte Lücke/Vertrag, danach geprüfte reine Grundlage; UI und kontrollierter Release separat.

## Ist und belegte Lücke
auditFlatexSettlementAmounts prüft bereits Legacy-Brutto gegen Kontobewegung mit vorhandener Decimalengine und ohne Gebührenzuweisung. Native Dokumente sind dagegen kein prepared.sourceTrades/cashItems; auditFlatexSettlementAmounts liefert damit keine native Gegenüberstellung. inspectNativeFlatexOrderLinks liefert bewusst keine Beträge. Aktueller privater Drive-Metadatenstand unverändert; vorherige unabhängige Order-Sollprüfung wiederverwenden. Neue private Prüfung betrifft zusätzlich exakte Betragsarithmetik, nicht erneut Parser implementieren.

## Kleinster reiner Schnitt
auditNativeFlatexSettlementAmounts(documents,{maxDays=7}) im vorhandenen flatex-settlement-audit.js. Direkte gefrorene Parserdokumente; vorhandenen inspectNativeFlatexOrderLinks und inspectNativeFlatexSourceIdentities wiederverwenden, keine Gruppen-/Identitätsheuristik kopieren. Grenzen1–20Dateien/1–5000Zeilen und maxDays0–30 erben. Keine Portfolio-/Kontobindung oder Eigentum aus Quellen ableiten; dies bleibt dokumentarische Rechenprüfung.

Alle Lokatoren/Quellen/unassigned und jede Ordergruppe erhalten. Nur possible-single mit beiden candidate-source-Evidenzen, exakter Einheit Stk., deklarierten identischen Währungen, positivem Kaufnominal/negativem Verkaufsnominal, positivem Kurs und passender Cashrichtung numerisch vergleichen. Keine Prozent-/Nennwert-/FX-Annahme. Für reine Größenrechnung Verkaufsnominalbetrag verwenden; keine Buchungsmenge erzeugen. Fehlende Seite, Mehrfachbeine/Teilausführungen, Konflikt/Overlap/Storno, unsichere Quelle/Einheit/Richtung/Währung bleiben review, numeric fields null. Bestätigung in Kontodialog kann keine fachliche Sperre aufheben.

Vorhandene Brutto-/Cash-/Differenzarithmetik in eine interne gemeinsame Funktion ziehen, Legacy-Verhalten samt bestehenden Tests unverändert. Native Rechnung darf keine Rundung verstecken: Produkt quantity*rate nur bei exakter Darstellbarkeit innerhalb18Nachkommastellen; sonst precision review statt gerundeter Gleichheit. Native Währung ist deklarierte Quellwährung, kein EUR-Default/Wechselkurs. grossExact ist positiver Stückzahlbetrag*Preis; differenceExact = cash - (buy ? -gross : gross), beliebige Differenz ausschließlich ungeklärt. Selbst0 beweist weder Kostenfreiheit, Kostenbasis noch Vollständigkeit.

Ausgabe deeply immutable, ready=false/writeEnabled=false/costsVerified=false; keine Finanz-DTOs, Commit-/Speicher-/Import-/Backupänderung, keine Gebühren/Steuern/externen Cashflows/Eröffnungen/Kostenbasis. Keine neue Datei im Produktmodulgraph, bestehendes Modul bereits im SW-Cache; SW204 zunächst unveröffentlichter Kandidat. Keine aktive UI-/Kontobindungserweiterung in diesem Schnitt.

## Nachweise
Öffentliche synthetische Units: Kauf/Verkauf/exakte Vorzeichen, Null- und ungeklärte Differenz beider Richtungen, kleine/große Dezimalwerte, Produktpräzisionsverlust ohne gerundete Gleichheit, fremde gleiche/ungleiche Währungen ohne FX, Einheiten/Quellissues, alle bisherigen Gruppensperren, getrennte Bank-/Order-/Scope-IDs, Mehrdateien/Reihenfolge, bounds/immutability/all rows; unveränderte Legacy-Regression.
Privater separater Python-csv/Decimal-Vergleich gegen die wirklichen Rohspalten und exakten Ordertuples, danach Produkthelper gegen unabhängige Resultate prüfen. Keine privaten Zeilen/Kennungen/Werte/Zeiträume/Fingerprints in Repo/CI/Artefakte.
Browser über vorhandenen UI-Quality-Einstieg Chromium/Firefox/WebKit: direkte Parserdokumente, exakte synthetische Kontrollwerte, Guards und unabhängige Werte, echte SW-Offlineneuladung/Modulimport, exakter IDB-Record/Revision/Settings unverändert, keine externen Requests. Volle unveränderte Pflicht-CI/Wallet/Quell-/Artefaktabnahme. Kein visueller UI-PASS ohne UIänderung, kein Merge/Deployment vor dokumentierter begrenzter Abnahme.

Keine privaten Produktivdatenänderungen. Source-/Betrags-PASS beweist keine vollständige Historie/Bestands-/Cashflow-/Kosten-/TWR-/XIRR-Freigabe. Zielstart01.01.2022/keine Fiktionen, UI-MASTER28/DELETE-MASTER28, FLH04/P0/P1/PERF/sonstige Abhängigkeiten erhalten. FLH05 nicht vorziehen, PROJ01 Backlog. Gesamtmaster PARTIAL.

