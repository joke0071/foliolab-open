# AT03-A – aktueller Kontostandsvergleich

Master #124 · Paket #127 · Feature-PR #131 · Roadmap-PR #130.
Basis: `e29910e2cca75bc5578da3f063243179b0280ed9` (main/v148).

## Fachlicher Befund und kleiner Lösungsumfang

Mehrere Konten und Cashpositionen, exaktes Finanzjournal und ein Flatex-Depotmengenvergleich existieren. Ein allgemeiner nutzerbedienbarer Vergleich einer expliziten Cashposition mit dem aktuellen Bank-Kontostand fehlte. AT03-A ergänzt nur diesen Vergleich. Kein Brokerparser, kein historischer Saldo, kein automatischer Ausgleich oder Transfermatching.

Einstieg: Positionen → Guthabenposition → Kontostand prüfen. Anbieter, Konto, Position und Kontowährung bleiben sichtbar. Der Nutzer bestätigt ausdrücklich die aktuelle Referenz für genau diese Position. Alte Kontoauszüge dürfen nicht mit heutigen Guthaben verglichen werden. Keine Referenz wird als Bankbeleg gespeichert.

`cash-reconciliation.js` verwendet `decimal.js` und den vorhandenen `ledgerQuantityAudit()`. Differenz = Bankreferenz minus erfasste Nominalmenge, auch bei negativem Referenzsaldo. Kein heutiger FX für einen historischen EUR-Wert, keine Schätzung. Fehlende Referenz, falsche Konto-/Währungszuordnung, fehlender Eröffnungsbestand im Journal oder widersprüchliche Journalmengen blockieren den Vergleich.

Ohne Journalbewegungen heißt die Basis nur „erfasster Bestand“. Bei vorhandenem Journal wird dessen arithmetische Konsistenz mit dem Anfangsbestand geprüft; das bestätigt keine vollständige Bankhistorie. Die undatierte Eröffnung wird nicht zu einem historischen Beleg aufgewertet.

Die vorhandene Dialogfunktion erhält einen ausdrücklich rein lesenden Modus: Prüfen hält den Dialog offen, Schließen/Esc verwirft nur flüchtige Eingaben ohne Finanz-Entwurfsschutz. Normale Editorlabels, Speichern und Entwurfsschutz bleiben erhalten. Änderungen im anderen Tab invalidieren das sichtbare Ergebnis und blockieren veraltete Vergleiche bis zum Reload.

Es gibt keine Modell-/Storage-/Backupschemaänderung. Der Vergleich schreibt weder Journal noch Cashflows, Stichtage, Bestände oder Settings. Offene/verschlüsselte Backups bleiben unverändert. Der neue Modulpfad wird in den vorhandenen PWA-Cache aufgenommen; v149 ist ausschließlich vorgeschlagene Cacheversion dieses PRs, keine Veröffentlichung.

## Ausgeführte Referenzen und Regressionen

| Prüfung | Ergebnis am lokalen UI-Stand |
|---|---|
| Baseline main | 535 Node-Tests bestanden |
| Vollsuite inkl. sechs neuer Fachtests | 541 bestanden, 0 fehlgeschlagen/übersprungen |
| `npm run check`, `git diff --check` | bestanden |
| Neue Fachtests | zwei gleiche Anbieter/Konten, Null/negativ/18 Dezimalstellen, USD ohne EUR-Schätzung, Journalmismatch/fehlendes Opening, aktuelles Modell, Backup-Roundtrip und keinerlei Mutation bestanden |
| Chromium Prüfdialog | aktueller Bezug, Eingabefehler, Konto/FX/Exaktheit, 320/390/430/768/1440, Fokus/Esc, unverändertes Storage, Offline-Neuladen bestanden |
| Axe im Prüfdialog | 0 Verstöße gegen ausgeführte WCAG-Tags |
| Bestehende Browserregressionen | ledger, dialog-consistency, dialog-financial-choices, csv-review-a11y, p0-import, p0-storage, settings-backup, key-privacy bestanden |
| Allgemeine Accessibility | 11 Scans, 0 Verstöße |

Neue Browserprüfung ist in vorhandener Chromium- und Firefox/WebKit-CI integriert. Laufzeit ist begrenzt; offene Worker-Promises dürfen keinen Run endlos blockieren. Firefox verweigerte im ersten UI-CI-Versuch Navigation nach Playwrights `setOffline(true)` mit `NS_ERROR_OFFLINE`; der Test prüft nun stattdessen blockierte Netzwerkanfragen bei unveränderter Reload-/Funktionsassertion. Bestehende Offline-Tests werden nicht abgeschwächt. Finale Engine-/CI-Nachweise und geprüfter Ziel-SHA stehen im PR und Master-Issue; ein früher roter WIP-Checkpoint ist keine Abnahme.

## Restgates und Wiederaufnahme

AT03-B (bestätigte interne Transfervorschläge) und AT03-C (Realbeleg-gestützte Brokerregeln) bleiben offen. Keine freigegebenen Flatex/TR-/Steuerbelege dieses Laufs. Echte Drive-, Android-, Safari-, physische Eviction-/Crash- und große Archivdatenprüfungen bleiben AT06/#44, unabhängig von dieser lesenden Funktion.

Bei Unterbrechung #124 → #127 → #131 lesen, letzten Remote-Commit und CI prüfen, mit aktuellem main vergleichen. Nur offene Fehler/Abnahmeschritte fortsetzen; keine zweite Journal-/Reconciliationengine bauen. Kein Merge und kein Deployment.
