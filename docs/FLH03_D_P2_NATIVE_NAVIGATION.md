# D / P2 — begrenzter nativer Navigationsschutz

Basis: tatsächlich akzeptiertes v179/main5397ca7. Nach separat gesichertem konsolidiertem Audit #156 ist dies der einzige aktive funktionale Strang. Der Nutzer hat den begrenzten D-Schritt nach eigenen vollständigen Gates einschließlich Merge/Deployment/Live ausdrücklich freigegeben.

## Produktvertrag

Bestehende interne Abbrechen-/Verwerfen-/Escape-/Fokus-/Speicherregeln bleiben erhalten. Nur solange ein gemeinsamer Editor oder Anlage-Assistent offen und nach dessen bestehendem Dirty-Prädikat geändert ist, wird ein temporärer beforeunload-Listener registriert. Vor jedem Ereignis liest er das aktuelle Prädikat erneut. Nach Schließen/Speichern wird er entfernt; saubere Formulare benötigen keine Warnung. Damit werden auch die bestehende CSV-Vorschau und dynamische Formularänderungen einschließlich geklickter Presets über denselben Guard erfasst. Keine Finanz-, CAS-, IndexedDB-, Recovery- oder Backupoperation wird verändert.

Native Browserwarnungen sind eine zusätzliche Hilfe, keine garantierte Datenrettung. Browser entscheiden über Anzeige, User-Aktivierung, Text und Unterdrückung, insbesondere auf Mobile und bei Cross-Origin-Navigation. Geschlossene PWA, Betriebssystemabbruch und Browserprozessverlust können keine solche Warnung garantieren. Keine History-Trap, kein erzwungenes Zurückspringen, keine sensible Entwurfspersistenz.

Die ursprüngliche universelle Cross-Origin-Back-Garantie wurde vom Nutzer ausdrücklich aus dem Pflichtumfang entfernt. Dies ist eine Produktentscheidung und **kein nachträglich bestandener Test**. Die strengen Tests und Linux/macOS-WebKit-Fehlnachweise bleiben unverändert im geschlossenen ungemergten #151/6611a425. Es gibt keinen stillen Ersatz seiner Assertions und keine weitere identische Diagnose ohne neue Hypothese.

## Neue unverfälschte Abnahme

`dialog-navigation-guard.test.mjs` prüft den Listener-Lebenszyklus gegen ein unabhängiges EventTarget und das aktuelle Dirty-Prädikat; kein Ersatz für echte Browserwarnungen. `browser-dialog-native-navigation.mjs` verlangt ausdrücklich tatsächliche beforeunload-Dialoge bei nativen Reloads in jeder geprüften Engine: Ablehnen bewahrt Formular/Eingaben und exakte IDB-Daten, Bestätigen verlässt das Dokument ohne Entwurfsschreibvorgang. Anbieter, Anlage-Assistent und vorbereitete CSV-Vorschau werden separat geprüft, einschließlich internem Escape/Verwerfen/Fokus, sauberen Formularen und erfolgreichem Save ohne Warnung. Sechs Breiten und kleine Höhe, vollständiges Axe ohne Ausnahmen. Bestehende gespeicherte Reload-/Back-/Forward-Regressionsprüfungen bleiben erhalten.

Es wird kein nicht unterstützter Cross-Origin-Warnfall als erfolgreich etikettiert. Der neue klar benannte Pflichtvertrag ist unabhängig von der historischen strengeren Diagnose. Alle bisherigen CI-Gates bleiben und der neue Test wird zusätzlich in Chromium sowie Firefox/WebKit ausgeführt. Native Safari/physische Android-Tastatur/Assistenztechnik und echtes OAuth bleiben externe Nachweise #44.

Status: Implementierung und Testvertrag erstellt; tatsächliche Testergebnisse, finaler HEAD/CI und Live-Abnahme folgen im Checkpoint. Noch kein v180-Merge/Deployment oder bestandener Test behauptet.
