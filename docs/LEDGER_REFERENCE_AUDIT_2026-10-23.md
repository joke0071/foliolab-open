# FolioLab Open – Fachlicher Finanzjournal-Audit (23.10.2026)

**Ausgangsstand:** `4f7c29d8` (v68).  
**Audit-Pull-Request:** #50 (`audit/2026-10-23-ledger-reference`).  
**Prüfansatz:** unabhängig formulierte, deterministische finanzielle Referenzfälle für fixe 18-Dezimal-Integer-Rechnung; Regressionstests und bestehende CI-Gates.

## Befunde und Korrekturen

| ID | Priorität | Fehlerbild | Korrektur |
|---|---|---|---|
| FIN-01 | P2 | Proportionale Kostenbasis-Verteilung rundete zuerst den Anteil `Menge/Bestand` und dann die Multiplikation. Damit ergab `300 × 2/3` nicht zwingend exakt 200, obwohl der Endwert exakt repräsentierbar ist | Direktes `(Betrag × Teilmenge) / Gesamtmenge` mit BigInt und **einer** abschließenden 18-Dezimal-Rundung bei Verkäufen, Transfers, Swaps und Mergers |
| FIN-02 | P2 | Splits berechneten erst eine gerundete Quote und multiplizierten dann Stückzahl bzw. dividierten den Preis. Ein 3:2-Split mit anschließendem 2:3-Reverse-Split konnte dabei fiktive Kleinmengen erzeugen | Stückzahl und Kehrwert des Kurses getrennt direkt aus Zähler und Nenner berechnen, mit nur einer abschließenden Rundung |
| FIN-03 | P2 | Beim späteren Verkauf wurden bereits realisierte Gewinne aus dem JavaScript-Anzeigewert statt aus `realizedPnLExact` akkumuliert. Kleinste Beträge konnten verloren gehen | Für die Fortschreibung das bestehende `realizedPnLExact` als primäre Quelle nutzen |
| FIN-04 | P2 | Aktiensplits waren technisch auch auf reinen Guthabenpositionen buchbar | Geldkonten-Splits vor der Mutation ausdrücklich ablehnen; Fehlschlag bleibt atomar |

## Unabhängige Referenzszenarien

Der Test `tests/ledger-reference-arithmetic.test.mjs` enthält:

1. Verkauf von zwei aus drei Anteilen mit 300 EUR Kostenbasis → exakt 100 EUR verbleibende Basis, realisierter Gewinn 0 EUR
2. Depottransfer von 2/3 → 200 EUR Basis am Ziel, 100 EUR an der Quelle, keine künstliche Einzahlung
3. Swap von 2/3 des Ursprungstokens in sieben Zieltoken → dieselbe Basisverteilung ohne erfundenen realisierten Gewinn
4. 3:2-Split und nachfolgender 2:3-Reverse-Split → identische ursprüngliche Menge, Kurs, Gesamtkostenbasis und Portfoliowert
5. 1:3-Reverse-Split von 12 Anteilen → exakt 4 Anteile; korrespondierender Kurs verdreifacht
6. Split eines Geldkontos → Ablehnung ohne Änderungen an Modell oder Journal
7. Bereits realisierter Gewinn inklusive eines 18-Dezimal-Kleinstbetrags oberhalb der Number-Anzeigepräzision bleibt über zwei Verkäufe vollständig erhalten
8. Kauf in USD mit Referenzkurs 0,8 EUR/USD und 1,60 EUR Gebühren → dokumentierter USD-Kassenabgang, exakte EUR-Buchungssätze, keine erfundenen externen Cashflows

**Erste verifizierte Unit-Ergebnisse:** 303/303 bestanden, 0 Fehler auf Audit-Branch vor Dokumentation. Weitere Änderungen und die endgültige Veröffentlichung erfordern neue Checks für den exakten Branch-Head.

## Fachliche Grenzen

- Bruchteile, die nicht innerhalb von 18 Dezimalstellen repräsentierbar sind (z. B. echte Drittel), benötigen weiterhin eine einmalige, definierte Rundung. Bei institutioneller Verbuchung können Bruchstück-Restbestände/Barabfindungen eigene Geschäftsvorfälle erfordern.
- Der **Börsenkurs des Zielassets** bei Swap/Fusion und die **steuerliche Einordnung** einer Umwandlung werden nicht aus der übertragenen Kostenbasis hergeleitet. Das System erfindet weder neue Kurse noch einen steuerlichen Gewinn.
- Bestehende historische Journale werden **nicht rückwirkend neu berechnet**. Die Korrektur schützt neu ausgeführte Buchungen. Eine rückwirkende Migration würde Original-Belege und unabhängige Fachfreigabe erfordern.
- Der Test ist keine rechtlich verbindliche steuerliche Berechnung nach österreichischem Recht und kein formaler ISO/IEC-25010-Nachweis.
- Größere Fremdwährungseffekte, mehrfach gestaffelte Verkäufe, Währungswechsel und Corporate Actions mit Baranteil brauchen weitere Sollfälle.

## Release-Gates

- Auf aktuellem `main` basierter Branch; Service-Worker-Cache-Version bei produktiven JS-Änderungen erhöhen.
- Node- und Syntaxprüfung, Chromium-Browser inklusive Ledger/Backup, Firefox, WebKit, Accessibility sowie Wallet-Live-Probes vollständig erfolgreich.
- Produktion erst nach erfolgreichem Merge und bestandenem GitHub-Pages-HTTP-Livecheck.
