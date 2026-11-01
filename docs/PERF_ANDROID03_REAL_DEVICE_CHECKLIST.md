# Android03 – kurze reale Geräteabnahme

**Status: EXTERNAL / noch nicht durchgeführt.** Die automatisierte Baseline ist ausdrücklich EMULATED. Ein Desktop-Chromium mit CPU4x ersetzt weder Android-Prozessstart noch installierte PWA, Energiesparen, TalkBack oder längeren Hintergrundbetrieb.

## Vorbereitung

- Nur ein isoliertes Testprofil bzw. ein bereitgestelltes Testgerät ohne echtes Portfolio verwenden. Ein Backupimport ersetzt lokale Daten. Falls die Isolation fehlt, diesen Punkt offen lassen.
- Keine realen API-Schlüssel, Wallet-Adressen, Drive-Konten oder Finanzdaten eintragen.
- Vor dem synthetischen Import unter **Mehr → Datenquellen & Aktualisierung** die Option **„Kurse und Wallet-Bestände beim Öffnen aktualisieren“ ausschalten**. Ein normaler JSON-Import übernimmt absichtlich nicht einfach fremde Einstellungen. Die synthetischen Wallet-Kennungen sollen keine echten Scans auslösen.
- Gerät, Android-/Browser-/PWA-/TalkBack-Version, geprüfte App-/SW-Version soweit sichtbar, Akkustand, Energiesparen, Netzwerk und Schriftgröße notieren. Nicht sichtbare Angaben als offen führen.
- Synthetische Seeds und Ausgangswerte: [gesicherte Baseline](perf-evidence/2026-11-01/android03-v251/README.md). Die gzip-Dateien müssen vor dem Appimport wieder echte JSON-Dateien sein. Mit dem kleinen Fall beginnen, danach 3.000 und 10.000 Buchungen. Es handelt sich um 3 bzw. 19 Positionen; 100/1.000 Positionen sind damit noch nicht abgenommen.

## Messdurchlauf

Pro Szenario fünf Wiederholungen unter denselben Bedingungen. Rohwerte, Median und Minimum/Maximum aufschreiben. Stoppuhrschätzungen getrennt von Browser-/DevTools-Messungen benennen; keine falsche Millisekundengenauigkeit angeben.

| Szenario | Prüfen und erfassen |
| --- | --- |
| Kaltstart | Test-PWA/Testbrowser vollständig schließen und neu öffnen. Erster sinnvoller Inhalt, erste bedienbare Aktion und geprüfte Übersicht getrennt erfassen. OS-/Prozessstart gehört beim echten Gerät dazu. |
| Warmstart/Reload | App geöffnet lassen, neu laden; dieselben Messpunkte erfassen. |
| Navigation | Übersicht → Positionen → Buchungen → Verlauf → Mehr; Zeit bis zur sichtbaren, bedienbaren Seite und auffällige Hänger erfassen. |
| Lange Listen | Buchungen suchen/filtern, weitere Einträge laden, Verwalten/Fertig, Archivansicht und Details bedienen. Nur synthetische Daten, keine unbewiesenen Finanzänderungen erzwingen. |
| Offline | Erst vollständig online laden; dann offline neu öffnen, navigieren und eine harmlose Testnotiz speichern. Nach Reload müssen Zustand und Speicheranzeige stimmen. |
| Hintergrund | Nach 5 Minuten und nach längerer Unterbrechung zurückkehren, jeweils mit/ohne Energiesparen. Keine verschwundenen Daten, falschen Speicheranzeigen oder unerwarteten Änderungen. |
| Netzwechsel/Update | WLAN/Mobilfunk/Offline wechseln. Einen tatsächlichen angebotenen PWA-Updateablauf nur mit gesicherten Testentwürfen durchführen. Ohne neues Update bleibt dieser Prüfpunkt offen. |
| Ressourcen | Falls Geräte-Diagnostik verfügbar: Hauptthread-Hänger, Heap vor/nach wiederholten Wechseln sowie Anzahl/Menge der Anfragen erfassen. Ohne Messzugriff kein „kein Leak/keine Doppelabrufe“ behaupten. |
| Backup/Restore | Mit isolierten Testdaten tatsächliche Dateien herunterladen und in einem zweiten isolierten Testprofil wiederherstellen; Bestände und Historie vergleichen. Die 10k-Baseline überschritt die bisherigen verschlüsselten Formatgrenzen: eine klare sichere Ablehnung ist kein erfolgreicher verschlüsselter Restore. Kein automatischer Klartext-Ersatz. |

## Bedienbarkeit

Hoch-/Querformat, 320–430 px soweit am Gerät real erreichbar, große Systemschrift und sichtbare Softwaretastatur prüfen. Buttons, Überschriften, Zahlen und Fehlermeldungen müssen erreichbar bleiben. Für echte Sprachausgabe und Dialogfokus die [vorhandene TalkBack-Checkliste](DIALOG_AUDIT_ANDROID_TALKBACK_CHECKLIST.md) verwenden.

## Rückmeldung

Pro Punkt **PASS / FAIL / OPEN** mit Repro, fünf Rohwerten, Gerät/Version und Bedingungen. Nur anonymisierte Testbilder bzw. Messwerte weitergeben; keine persönlichen Backups oder Zugangsdaten. Ergebnisse nicht mit der CPU4x-Desktop-Baseline gleichsetzen. Vorher/Nachher nur mit demselben Gerät, Datenbestand, Netzwerk-/Energiezustand und vergleichbarer Methode bewerten.
