# AT02-A – optionale Festgeldfälligkeiten und Liquidität

Issue #126 · Master #124 · Draft-PR #132. Basis `e29910e2cca75bc5578da3f063243179b0280ed9` / v148. Eigenständiger Branch `feature/at02-a-deposit-maturity`; keine Änderungen aus #131 übernommen, kein Merge/Deployment.

## Fachvertrag

Das bestehende Konto erhält ausschließlich optionales `cashTerms` mit eigener Metadatenversion 1: Verfügbarkeit (`free`, `bound`, `unknown`), Festgeldkennzeichnung, optionaler Vertragsbeginn und Fälligkeit, unbestätigter/ausgezahlter/wiederangelegter Vertragsausgang, tatsächliches Datum, Belegverweis und optionale neue Fälligkeit nach Wiederanlage.

Keine neue Portfolio-Schemaversion und keine Migration. Konten ohne Metadaten bleiben unverändert und gelten in der neuen Übersicht als nicht bestätigt. `createAccount()` validiert die optionale Struktur bei Erfassung und Restore. Ungültige Datums-/Statuskombinationen oder unbekannte Metadatenversionen werden zurückgewiesen; kein stilles Verwerfen neuer Informationen.

| Eingabe / Datum | Angezeigter Status |
|---|---|
| Keine Metadaten | Nicht bestätigt |
| Normales Guthaben | Ausdrücklich vom Nutzer angegebene Verfügbarkeit |
| Festgeld vor Vertragsbeginn | Nicht bestätigt |
| Laufendes Festgeld | Gebunden nur bei ausdrücklicher Angabe; sonst nicht bestätigt |
| Fälligkeit heute oder früher, Ausgang unbestätigt | Nicht bestätigt; Auszahlung/Wiederanlage prüfen |
| Fälligkeit fehlt | Kein Datum erfinden; ausdrücklich angegebene Bindung bleibt gebunden, Datum fehlt sichtbar |
| Auszahlung laut Beleg bestätigt | Verfügbarkeit weiterhin ausdrücklich auswählen; Bestätigung allein macht Guthaben nicht frei |
| Wiederanlage bestätigt | Gebunden nur bei ausdrücklicher Angabe; tatsächliches Wiederanlagedatum und neue Fälligkeit berücksichtigen |
| Wiederanlage ohne neue Fälligkeit | Bindung kann bestätigt sein, fehlende neue Fälligkeit wird angezeigt |
| Neue Fälligkeit erreicht | Erneut nicht bestätigt; keine automatische Auszahlung |

Auszahlung/Wiederanlage benötigt Datum und textlichen Belegverweis; neue oder geänderte Bestätigungen benötigen eine ausdrückliche Beleg-Checkbox. Tatsächliche Vorgänge in der Zukunft sind im Formular ausgeschlossen. Bei Betrachtung eines früheren Stichtags wird eine erst später erfolgte Bestätigung nicht rückprojiziert. Belegreferenzen sind Nutzerdokumentation, keine unabhängige Prüfung oder automatische Dateiauswertung. Es gibt keinen Belegupload.

Die Metadaten halten den aktuellen Vertragsausgang fest, keine vollständige Vertrags-/Buchungshistorie. Bei Wiederanlage bleiben ursprünglicher Beginn/Fälligkeit und der neue Fälligkeitstermin unterscheidbar. Tatsächliche Geldbewegungen müssen unabhängig im bestehenden Journal korrekt erfasst werden.

## Bedienung

Bestehender Kontodialog → eingeklappter Bereich „Liquidität und Festgeld · optional“. Alte Konten erhalten keine neuen Pflichtfelder. Bestehende Kontokarten und Kontenverwaltung zeigen Statushinweise für ergänzte Konten. In „Meine Konten“ ergänzt eine standardmäßig eingeklappte Übersicht Liquidität und Fälligkeiten, mit direkten Bearbeitungsaktionen, fälligen Terminen zuerst und weiteren Konten bei größerem Umfang ebenfalls eingeklappt. Kein neuer Hauptreiter.

Die Übersicht zählt Konten nach Status und zeigt vorhandene Guthaben ausschließlich nominal in ihrer Kontowährung. Kein zusätzlicher EUR-Gesamtwert, keine FX-Schätzung, keine doppelte Vermögenssummierung. Unterschiedliche oder nicht eindeutig zuordenbare Guthaben bleiben als Betrag unbekannt. Das bestehende Portfoliovermögen wird nicht neu interpretiert. Bereits vorhandene Kontowährungen außerhalb der Standardauswahl (z. B. PLN) bleiben beim Bearbeiten auswählbar und erhalten; keine stillschweigende Änderung auf EUR.

## Sicherheit und Kompatibilität

- Keine Änderung von Positionen, Kontoständen, Journal, Cashflows, Stichtagen, Rendite oder Kostenbasis durch Metadatenpflege.
- Keine Zinsprognose, Steuerrechnung, Bankanbindung, automatische Auszahlung/Wiederanlage oder Transfermatching.
- Bestehende Speicher-/Web-Locks-/IndexedDB-/Backupwege unverändert; vor Mutation vollständige Eingabevalidierung, Erfolg erst nach gespeichertem Commit.
- V1/V2/V3-Portfolios und Backups ohne Metadaten weiterhin lesbar. Offene sowie verschlüsselte vollständige Backups behalten optionale Kontometadaten. Neue Backups mit Metadaten mit dieser oder neuerer App-Version wiederherstellen; ältere App-Versionen kennen diese Zusatzinformationen nicht.
- Keine neuen Secrets/Netzwerkpfade. Belegverweise gehören zu den lokal gespeicherten Kontodaten und deshalb auch zum bestehenden Backupumfang; keine Zugangsdaten dort eintragen.
- PWA-Cache v150 ist vorgeschlagen, kein Release. Bei späterer Integration mit anderen offenen PWA-PRs Cacheversion und Assetliste erneut gegen main prüfen.

## Tests / Nachweise

Baseline main: 535 Tests. Neuer lokaler Gesamtstand: 549 Node-Tests bestanden. Vierzehn neue Fach-/Darstellungsreferenzen: mehrere Konten desselben Anbieters, fehlende Fälligkeit, vor/am/nach Fälligkeit, Schaltjahr/Datumsgrenzen, unbestätigte Auszahlung, bestätigte Wiederanlage, nominale Fremdwährung ohne FX, alte Portfolios, verschlüsselter Restore, unveränderte Finanzdaten und HTML-Escaping.

Neue Browserprüfung `browser-cash-terms.mjs`: Konto bearbeiten, Bindung erfassen, überfälligen Status prüfen, Wiederanlage/Belegbestätigung und Auszahlung erfassen, mehrere Konten, Fremdwährung, unveränderte Positionen/Journal/Cashflows/Stichtage, Axe, 320/390/430/768/1440 und Kontokarten, verschlüsselter vollständiger Backup-Roundtrip, tatsächlicher Ausfall eines eigenen Testservers mit vollständigem Offline-Neustart und konkurrierender Zweittab-Änderung. In vorhandene Chromium-/Firefox-/WebKit-CI integriert. Finale SHA-/CI-Nachweise stehen im PR und Issue; WIP-Checkpoints sind keine Abnahme.

Erster Chromium-Axe-Lauf fand einen Kontrastfehler in einem neuen Hilfstext; gezielt innerhalb der optionalen Sektion korrigiert und gleiche Assertion erneut geprüft. Keine bestehenden Assertions abgeschwächt. Der bestehende Pixeltest meldete die beabsichtigte zusätzliche eingeklappte Sektion im Kontodialog: zwei Desktop-/Tablet-Referenzen jetzt 640×732 statt 640×658. Ausschließlich diese zwei Bilder wurden anhand des unveränderlichen Actions-Artefakts 12589111187 aus Run 40168505825 visuell geprüft und als neue Sollreferenz übernommen. Alle anderen 18 Referenzen, exakte Größenprüfung und Pixelgrenzen bleiben unverändert; keine automatische Baseline-Regeneration aus einem Testlauf.

## Wiederaufnahme und Grenzen

Vor Fortsetzung #126 → #132 → letzten Remote-Commit/CI lesen und main vergleichen. Nur offene A-Abnahme oder konkret fehlgeschlagene Tests bearbeiten, keine erneute Roadmap oder AT03-A-Kopie. AT02-B (variable Zinssätze/Zinsprognosen), AT03-B/C und Steuer-/Bank-/Blockchainfunktionen bleiben außerhalb dieses Pakets. Echte Drive-/Android-/Safari-/Crash-/Eviction-Abnahmen bleiben eigenständige manuelle Gates in #44. Kein Merge/Deployment.
