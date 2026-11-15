# K6 / Releasegate · CSV-Zielhöhe am aktuellen DOM

Basis ist der vollständig abgenommene v318-Main `127019cf71304981c0c7f1a446f4dee8bc27404d`, Tree `1d5a1f2db0d6e7d7fa39590deea44954868611b9`. [Releaseabschluss und Originalpins](https://github.com/joke0071/foliolab-open/blob/8708e0d6d3e32388869c06b927ed8138710d8424/docs/V318_RELEASE_ACCEPTANCE_2026-11-15.md). Bestehender K6-/44-px-Vertrag, kein neuer Roadmap-Scope und keine CI-Optimierungsserie.

## Tatsächlicher Fehler

Mainlauf43744866312/1, Chromiumjob132905874026: Bei430px war die durch Playwright zuvor aufgelöste CSV-Schaltfläche bereits disconnected; ihr Rechteck war0×0. Im selben synchronen Messcallback waren beide aktuellen Ziele sichtbar und exakt44px hoch. [Gesicherter Originalbefund und kontrollierte native Gegenprobe](https://github.com/joke0071/foliolab-open/blob/19b5c7967c789cbda7e13cf67aba411591819d6b/docs/V318_MAIN_FAILURE_2026-11-15.md). Der echte Aufklapp-Handler ersetzt den Detailmount und löst damit die alte Referenz ab. Der vollständige native IDBRecord blieb unverändert.

Der nach gesichertem Erstlauf und kausaler Diagnose einmal begründet wiederholte Mainjob sowie alle drei tatsächlichen Produktionsengines bestanden. Das ist keine testseitige Ursachenbehebung. Historische Fails ohne vergleichbare Messaufnahme bleiben UNKNOWN; aus diesem Beleg wird keine rückwirkende Ursache für PR332/PR340 oder HTTP503-/SW-Ausfälle abgeleitet.

## Enger Korrektur- und Abnahmevertrag

- Aktuelles erstes `.position-csv-import`-Ziel im selben synchronen Browsercallback auswählen und messen. Keine zuvor serialisierte Elementreferenz über diese Grenze tragen.
- Sichtbar, verbunden, positive Breite und unverändert mindestens44px Höhe verlangen. Fehlendes Ziel ist ein Fehler mit frischer Diagnose, niemals ein Ersatz-PASS.
- Vorhandene Rechteck-/Stil-/Vorfahren-/Viewportdiagnostik, fünf Breiten, Fehlerbild und Fristen erhalten. Kein Polling, Retry, Warten auf eine passende Höhe oder Toleranzwert.
- Bei430px den tatsächlichen App-Aufklapp-Handler kontrolliert auslösen: vorherige Referenz44px/verbunden, danach0px/abgelöst, aktueller Ersatz44px/verbunden. Die anschließende reguläre Messung muss den aktuellen Zielknoten erfassen; native Portfolio-Bytes und Revision bleiben exakt erhalten.
- Dieselbe Messfunktion an isolierten statischen Browserkontrollen prüfen: sichtbare44px akzeptiert, echte43px, `display:none`, `visibility:hidden` und fehlendes Ziel abgewiesen. Diese Kontrollen verändern keine Appdaten und sind keine Hardware-/Layoutabnahme ihrer künstlichen Oberfläche.
- Lebenszyklus- und Gegenkontrollergebnisse im vorhandenen enginegebundenen Ergebnisbericht festhalten. Keine neue Testsuite oder Workflowstufe.

Genau zwei Dateien: vorhandener Navigationstest und diese Taskkarte. Alle154ausgelieferten Dateien, Produkt-/Finanz-/Speicher-/Backup-/PWA-Logik und Workflowbytes bleiben unverändert. Deshalb kein SW-Bump und keine neue Produktfreigabe aus diesem Testpatch. Reguläre vollständige PR-/Walletgates und Originalpin-/Readback-/Restorevertrag gelten unverändert.

## Qualifikation und Freigabegrenze

Lokal tatsächlich geprüft: Node24.22.1, Playwright1.56.1 mit vorhandenem Chromium141.0.7390.37 unter Linux. Die unveränderte Node-Suite besteht mit1492PASS/0FAIL/0SKIP; Produkt-/MJS-Syntax und Diffprüfung bestanden. Der endgültige Navigationstest besteht nativ einschließlich vollständigem IDBRecord, fünf Zielhöhen44px, echter Detailerneuerung sowie allen vier Gegenkontrollen. Der Bericht misst ausdrücklich43px beim sichtbaren Gegenfall,0px bei `display:none` und44px bei `visibility:hidden`; alle bleiben verbunden und werden abgewiesen. Fehlendes Ziel ersetzt die vorherige Diagnose durch `target:null`.

Die explizit ausgewählte geänderte MJS-Datei besteht die statische Namens-/Syntaxvorprüfung mit TypeScript5.8.3.31sonstige Typdiagnosen liegen außerhalb dieses begrenzten Werkzeugs; kein vollständiger Typecheck-/Importauflösungs-/Realmbeweis behauptet. Die ergänzten Beobachtungsassertions wurden anschließend erneut nativ und statisch geprüft; keine Node-/Produktquelle war davon betroffen.

Der lokale Host ist keine Windows-/Android-/Firefox-/WebKit-/Produktionsabnahme. Appkontexte verwenden wie der bestehende Navigationstest blockierte Service Worker; Installationsereignisse bleiben synthetisch. Die erste Bereitschaftsprobe des lokalen HTTP-Servers lieferte vor dessen Start erwartbar ECONNREFUSED; der begrenzte Readiness-Loop erreichte den Server, der finale Browserlauf beendete erfolgreich. Kein Produktfehler oder CI-Retry daraus abgeleitet.

Anschließend bleiben vollständige reguläre PR-/Wallet-Qualifikation und eigener Review mit gesicherten Originalen erforderlich. Aktueller Stand und exakte SHAs ausschließlich im HND01-Checkpoint; lokale PASS nicht als abgeschlossene Integration oder Release ausgeben.

Jochen entscheidet über den später qualifizierten exakten PR-Head separat. Kein Merge, Main, Deployment oder LIVE_ACCEPTED dieses Kandidaten durch die v318-Freigabe autorisiert. Reale Windows-/Android- und Quellen-/Originalgegenproben bleiben getrennt offen.
