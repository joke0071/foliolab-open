# K6-TRUST · Speicher-, Backup- und Restorehinweise · 15.11.2026

**Befund:** Die normalen Export-/Restorehinweise und der markerlose Start von v315 sind im geprüften Umfang zutreffend. Eine falsche Passwortübernahmeaussage im Drive-Fehlerhinweis ist gezielt reproduziert. Kleinste Textkorrektur auf separatem Branch **gezielt bestanden, zum Review vorbereitet**, nicht gemergt oder ausgeliefert. K6-TRUST insgesamt VERIFY; K4 PARTIAL.

Basis Main `ff60c73e53c973ecb86393be5b4e31b55f352601`, v315 LIVE_ACCEPTED; zu Beginn und Ende unverändert. Aktuelle Texte aus diesem Main, dessen tatsächliche Auslieferung durch vorhandene [v315-Live-Abnahme](https://github.com/joke0071/foliolab-open/actions/runs/43630597942/job/132564684392) identitätsgebunden belegt ist. Kein neuer Live-/Gerätebeleg aus dem folgenden QA-Lauf.

## Welche Texte erscheinen in welchem Zustand?

| UI-Pfad / Zustand | v315-Wortlaut | Verhalten und Bewertung |
| --- | --- | --- |
| Mehr → Deine Daten → JSON exportieren, `#plainBackupHint` | „Der JSON-Export ist unverschlüsselt und enthält Portfolio, Buchungen und Stichtage, aber keine bestätigten Wallet-Historien oder persönlichen Einstellungen und API-Zugangsdaten.“ | `backup(model)` entfernt Wallet-Historie und ersetzt Einstellungen durch Defaults. Positionen, Buchungen, Journal, Stichtage und weitere Portfoliofelder bleiben im Format. **Zutreffend.** Der Nutzer sieht den Hinweis direkt bei beiden Dateiaktionen. |
| Mehr → Backup-Passwort → Zusätzliche Daten sichern | „Portfolio, Buchungen und historische Stichtage werden standardmäßig gesichert.“ Auswahl: „Bestätigte Wallet-Historien einschließen“, „Einstellungen und API-Zugangsdaten einschließen“. | `fullBackupPayload/createCompleteBackup` berücksichtigt die zwei unabhängigen Checkboxen nur für künftige verschlüsselte Exporte/Drive-Backups. Konfiguration enthält erlaubte Einstellungen/API-/RPC-Zugänge sowie portable Drive-Präferenzen, keine Tokens/Ordner-/Geräteschlüssel. **Zutreffend.** |
| Backup-Passwort → Was wird gesichert? (nach Aufklappen) | „Google-Zugriffstokens und Geräteschlüssel werden nie übertragen.“ / „Ohne dein Passwort kannst du eine verschlüsselte Sicherung nicht wiederherstellen. Nach einer Passwortänderung benötigen frühere Sicherungen weiterhin das alte Passwort.“ | Portables Paket enthält keine Vault-CryptoKeys/Tokens; Passwort entschlüsselt den verpackten Datenkey. Ein neuer Vault kann nach erfolgreichem Restore angelegt werden, ein vorhandener bleibt unverändert. Kein Versprechen dauerhafter lokaler Passwortverfügbarkeit. **Zutreffend.** |
| Datei wählen → vor bestätigtem Restore | „Backup mit 1 Positionen und 1 Anbietern wiederherstellen? Der aktuelle Datenbestand wird ersetzt.“ | Erst Größen-/Entschlüsselungs-/Format-/Referenzprüfung, dann diese Bestätigung, danach Commit. Keine Ergänzung/kein automatischer Merge. **Zutreffend.** Zahlen stammen aus geprüfter Datei, nicht Dateiname. |
| Verschlüsselte Datei oder Drive enthält optionale Konfiguration → zusätzliche Bestätigung vor Commit | „Sollen diese Einstellungen und Schlüssel auf diesem Gerät wiederhergestellt werden? Vorhandene Einstellungen werden ersetzt.“ Zusätzlich Ausschluss entfernter FMP-/Twelve-Data-/direkter EODHD-Schlüssel. | Konfigurationsübernahme erfordert eigene Zustimmung. Bei Ablehnung bleiben im normalen Restore die aktuellen lokalen Einstellungen, bei nicht lesbarem Recoverybestand werden Defaults verwendet. **Zutreffend**, keine Behauptung einer vollständigen Kopie aller Browserpräferenzen. |
| Mehr → Google Drive Backup → Backups verwalten → Wiederherstellen | „Dieses Backup mit 1 Positionen und 0 Stichtagen wiederherstellen? Deine aktuellen lokalen Daten werden ersetzt.“ / „Wenn auf diesem Gerät bereits Daten vorhanden sind, wird vor der Wiederherstellung eine lokale Rückfallsicherung angeboten.“ | Bestätigung vor `restoreData`; bei bestehendem Portfolio vorher Dateiangebot, bei leerem Ziel keine unnötige Rückfallsicherung. Danach ggf. eigene Einstellungsbestätigung. **Zutreffend.** Bestehende v315-/PR337-Belege wiederverwendet. |
| Start: Modusmarker erhalten, kanonischer Record fehlt/nicht lesbar | „Speicher nicht verfügbar“; „Gespeicherter Datenstand nicht lesbar. Änderungen sind gesperrt. Zuerst Originaldaten sichern, dann ein geprüftes Backup wiederherstellen.“ | Kein Rückfall auf alte lokale Kopie; kontrollierte Recovery mit Originalexport. Passt zu beiden Chromium-Evictionbelegen. **Zutreffend.** |
| Start: sämtliche lokalen Portfoliosignale einschließlich Modusmarker und Vault verschwunden | „Willkommen bei FolioLab“; unter Positionen „Noch keine Positionen. Füge eine Anlage hinzu oder importiere vorhandene Daten.“ / „Transaktionale IndexedDB aktiv“ | Kein erkennbares früheres Portfolio: neuer leerer Record Revision1, kein Altbestand/Passwort. Firefox-Evictionlauf43645973137 belegt genau diesen Nutzdatenverlust und Appstart; SW-Registrierung blieb erhalten und beweist keinen früheren Portfolioinhalt. **Zutreffend**, keine zusätzliche Recoverymeldung allein wegen extern bekannter Vergangenheit. |
| Mehr → Lokale Daten sicher aufbewahren | „Browserdaten löschen, privater Modus oder automatische Speicherbereinigung können sie entfernen.“ / „Sichere regelmäßig eine Backup-Datei außerhalb des Browsers und prüfe, ob sie vollständig heruntergeladen wurde.“ | Beschreibt Verlustmöglichkeit und externe Sicherung, keine Garantie für Warnung, Erhalt oder automatische Wiederherstellung. **Zutreffend.** Kein neuer Safari-/ITP-Nachweis im Auftrag. |

Quellen am Produktstand: [index.html](https://github.com/joke0071/foliolab-open/blob/ff60c73e53c973ecb86393be5b4e31b55f352601/index.html#L62), [Dateirestore](https://github.com/joke0071/foliolab-open/blob/ff60c73e53c973ecb86393be5b4e31b55f352601/src/app.js#L2481), [Recoveryanzeige](https://github.com/joke0071/foliolab-open/blob/ff60c73e53c973ecb86393be5b4e31b55f352601/src/app.js#L2837), [Speicherinitialisierung](https://github.com/joke0071/foliolab-open/blob/ff60c73e53c973ecb86393be5b4e31b55f352601/src/browser-portfolio-storage.js), [Format](https://github.com/joke0071/foliolab-open/blob/ff60c73e53c973ecb86393be5b4e31b55f352601/src/complete-backup.js), [Vaultübernahme](https://github.com/joke0071/foliolab-open/blob/ff60c73e53c973ecb86393be5b4e31b55f352601/src/backup-vault.js).

## Entscheidungsrelevante Abweichung und kleinste Korrektur

**UI-Pfad:** Mehr → Google Drive Backup → Backups verwalten → Wiederherstellen. Voraussetzung: Zielgerät hat bereits ein anderes Backup-Passwort; Portfolioimport bestätigt, anschließend Fehler beim Anzeigen des Erfolgsstatus.

**Aktuell:** „Portfolio und Backup-Passwort übernommen. Abschlussanzeige fehlgeschlagen: … Portfolio nicht erneut importieren.“

Ein Nutzer kann daraus schließen, dass künftig sein Passwort aus der importierten Sicherung gilt. Tatsächlich gibt `adoptBackupPassword` bei vorhandenem Vault `false` zurück und lässt dessen Key/Wrap bestehen. Der Appadapter ignoriert dieses Rückgabeergebnis; die Drive-Schicht wertet den fehlerfreien Abschluss als Übernahme. Ein nachfolgender Anzeigefehler erzeugt dann die falsche Aussage. Kein nachgewiesener Datenverlust oder Kryptofehler: betroffen ist die sichtbare Rückmeldung.

**Korrigiert:** „Portfolio wiederhergestellt. Abschlussanzeige fehlgeschlagen: … Portfolio nicht erneut importieren.“

Nur der nachweislich bestätigte Portfolioimport wird zugesagt. Warnung vor erneutem Import und genauer Anzeigefehler bleiben bestehen. **Eine einzige Laufzeit-Textzeile geändert**, keine Vault-/Restore-/Storage-/Finanz-/SW-Logik.

[Vergleich Main → Reviewkandidat](https://github.com/joke0071/foliolab-open/compare/ff60c73e53c973ecb86393be5b4e31b55f352601...2a773073f2887e8701ee893eee2e8619ab980be8); Branch `fix/k6-trust-backup-copy-2026-11-15`, Head `2a773073f2887e8701ee893eee2e8619ab980be8`. Zusätzlich bestehende gezielte Node-Regression angepasst/erweitert und separat ausführbaren Browserfall ergänzt. [Reviewvorlage und offene Integrationsgates](K6_TRUST_REVIEW_DRAFT_2026-11-15.md).

## Tatsächliche gezielte Prüfung

[QA43685258218/1](https://github.com/joke0071/foliolab-open/actions/runs/43685258218), Job132724291169 **SUCCESS**. QA-Head `352cb441127446f31e0f367b242a9d7ef9eb7223`: Reviewkandidat plus ausschließlich isolierter QA-Workflow; produktive Workflows unverändert. Ubuntu24.04, Chromium141.0.7390.37, Playwright1.56.1, Node22.23.4. Lokal Browserstart ENVIRONMENT_BLOCKED (`socket(): Operation not permitted`); keine Produktursache daraus.

57 gezielte bestehende Drive-/Vault-Tests PASS,0FAIL/0SKIP, Syntax PASS. Native UI: synthetische Fixture über regulären Dateiimport, Backup-Passwort über UI einrichten, Klartext-/verschlüsselten UI-Download erzeugen, Drive-Verbindung/Datei über kontrollierte HTTP-/OAuth-Antworten, tatsächlicher Wiederherstellen-Button und native Bestätigungsdialoge. Crypto und IndexedDB nicht ersetzt.

v315-Baseline ausschließlich für die unveränderte Main-Datei `src/drive-backup.js` ausgeliefert; alle anderen Laufzeitbytes zum Kandidaten identisch. Kontrolliert genau **einen** Fehler beim ersten Erfolgsstatus nach tatsächlichem Commit auslösen: kein zusätzlich erfundener Dialog, kein Quota-/Storage-/Kryptofehler. Gleicher Ablauf gegen Baseline und Kandidat:
- Baseline zeigt falsche Übernahmeaussage; Kandidat zeigt korrigierten Text.
- Zielrevision jeweils1→2: genau ein Commit; importierte Positionen exakt gleich dem Ausgangssoll.
- Vorhandener Vault-Key/Wrap bleibt exakt unverändert und unterscheidet sich vom importierten.
- Neues reguläres UI-Backup entschlüsselt mit Zielpasswort; Quellpasswort wird abgewiesen.
- Nach Reload bleiben Record und Vault unverändert;0Pageerrors.

**Aussagegrenze:** definierter, künstlich ausgelöster Abschlussanzeigefehler; keine Behauptung eines spontan aufgetretenen Browserfehlers. Mock-Drive/OAuth, SW blockiert, Linux-Browserkontexte; keine Windows-/Android-/echte OAuth-/neue Eviction-/Produktionsabnahme. Normale Restore-/Evictionbelege aus v315/PR337 werden weiterhin verwendet, nicht als neu ausgeführt ausgegeben.

Alle drei synthetischen UI-Aufnahmen direkt visuell geprüft: [Export](release-evidence/k6-trust-2026-11-15/originals/export-source.png), [v315-Fehlerhinweis](release-evidence/k6-trust-2026-11-15/originals/v315-restore-status.png), [Kandidat](release-evidence/k6-trust-2026-11-15/originals/candidate-restore-status.png). Originalreport enthält zusätzlich die tatsächlich abgefragten Bestätigungen: [native Originalauswertung](release-evidence/k6-trust-2026-11-15/originals/report.json).

## Sicherung, Status und nächster 1.0-Schritt

[Belegindex/Integrität](release-evidence/k6-trust-copy-2026-11-15.json). Originalartefakt14149754641:1013700Bytes,SHA256 `bf2baa27cccbf786117fab960f6770b34986184667421d97ed5022302ab9e74b`, ZIP-CRC PASS. Sämtliche11Originalmitglieder unverändert einzeln im Repository gesichert; Manifest erhält deren Größen/SHA256 und ursprüngliche ZIP-Identität. Kein privates Portfolio, Account oder Schlüssel verwendet.

**Nächster offener 1.0-Punkt:** Review und gesondert freizugebende Integration dieses K6-Hinweises; danach normale erforderliche Integrations-/Release-/Livegates. Reviewkandidat ist gezielt bestanden, noch kein produktiver Teilabschluss des korrigierten Hinweises. Vor Integration PWA-Cacheversion regulär fortschreiben; vorhandene SW-/Workflowbytes wurden für diesen Review nicht geändert. Kein PR-/Main-/Produktions-PASS behauptet.

A09 bleibt **OPERATOR_INPUT_PENDING** bis ein geeigneter isolierter Windows-/Android-Endpunkt bestätigt ist; keine erneute Geräteanfrage. Offene [WebKit-Gesamtquota-Voraussetzung](K4_WHOLE_ORIGIN_2026-11-14.md) erhalten und nicht vorgezogen. [Vorherige Backup-/Plattformzuordnung](K4_BACKUP_PLATFORM_REVIEW_2026-11-14.md) und alle v315-/SIGKILL-/Evictionbelege gültig.
