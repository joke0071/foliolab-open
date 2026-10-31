# REL-RECOVERY01: wiederherstellbare verschlüsselte Exporte

Kleine erste Etappe zu #254; Ausgangsbasis v249, Main `3a406db624cb20a457d4886aca31e1ee4eaefe93`. Owner: Work /root. Der Gesamtauftrag bleibt PARTIAL; diese Etappe ist keine vollständige Update-/Crash-/Android-Abnahme.

## Belegte Lücke und Entscheidung

Der v1-Writer hatte keine Größenprüfung, sein Reader akzeptiert höchstens 6.000.000 Base64-Zeichen im Datenfeld. Der v2-Writer prüfte ausschließlich 10.000.000 JS-Textzeichen; sein Reader akzeptiert höchstens 15.000.000 entschlüsselte Ciphertext-Bytes einschließlich 16-Byte-GCM-Tag. Drive begrenzt die gesamte verschlüsselte JSON-Datei auf 15.000.000 Zeichen, der lokale Dateiimport auf 20.000.000 Bytes. UTF-8, Base64 und JSON-Hülle können diese Readergrenzen trotz kleinerer Zeichenanzahl überschreiten. Die v247-Stressmessung außerhalb der verschlüsselten Backupgrenzen ist im zentralen Checkpoint bereits ausdrücklich getrennt dokumentiert.

| Pfad | Bestehende Grenze | Verhalten dieser Etappe |
| --- | --- | --- |
| v1-Datenfeld | 6.000.000 Base64-Zeichen | Vor AES/PBKDF2 anhand UTF-8 + 16-Byte-Tag + gepaddetem Base64 prüfen |
| v2-Klartext | 10.000.000 JS-Zeichen | Erhalten |
| v2-Ciphertext | 15.000.000 Bytes | Erhalten; bereits vor Verschlüsselung prüfen |
| Drive-Datei | 15.000.000 Zeichen | Erhalten; neue gemeinsame v2-Exporte inklusive tatsächlicher JSON-Hülle dagegen prüfen |
| Lokaler Dateiimport | 20.000.000 Bytes | Erhalten |

Keine Sicherheitsgrenze wird erhöht. Neue v2-Exporte müssen in beide bestehenden Dateireader passen. Bereits vorhandene größere lokale v2-Dateien werden weiterhin ausschließlich nach den bisherigen lokalen Reader-/Ciphertextgrenzen behandelt; der neue Exportguard wird nicht auf ihre Entschlüsselung angewandt. Keine Beschneidung von Beständen, Journal, Importidentitäten, Historien oder Einstellungen. Keine Änderung von KDF/AES/AAD, Schlüssellängen, Verschlüsselungsformaten, Schema, CAS oder Undo. Alte externe Writer lassen sich durch diese neue Exportprüfung nicht rückwirkend reparieren.

Die gemeinsame Prüfung liegt in `src/backup-limits.js` und ist im Offline-Precache enthalten. v1/v2-Writer verwenden exakt die vorab geprüften UTF-8-Bytes. Der v2-Writer misst die tatsächliche Hülle mit leerem Datenfeld, fester frischer IV und demselben Erstellzeitpunkt. Ablehnung erfolgt vor AES, Download, Drive-Upload, Aufbewahrungsbereinigung und Backup-Erfolgsmeldung. Die Meldung benennt Grenze und Erhalt vorhandener Daten/Sicherungen. Kein stiller unverschlüsselter Ersatzexport.

## Nachweise und noch offene Abnahme

- Unit: exakte inklusive Grenzen und +1, Unicode/Surrogate, unabhängige Buffer-UTF-8-/Base64-Rechnung, v1/v2-Roundtrip, vorhandener Vault und frühere Sicherung nach Ablehnung weiter verwendbar.
- Browser: isolierte synthetische neue IDB-Installation; v1/v2-Übergröße abgelehnt; UTF-8-Roundtrip; echter verschlüsselter UI-Download nach Ablehnung; zu große Restoredatei vor JSON/Bestätigung abgewiesen; originale Portfolio-Bytes und Revision unverändert, auch nach Reload. 320/360/390/412/430/768/1440 px und Axe.
- Diese zusätzliche Suite ist in Chromium, Firefox und WebKit verpflichtend in Kandidaten-CI und tatsächlicher Produktionsabnahme eingebunden. Alle historischen CI-Kommandos bleiben über ihre unveränderten Hashes/Manifeste geschützt. Live-Job erhält 25 statt 20 Minuten Laufzeitreserve; keine Prüfung entfällt.
- Tatsächliche Ergebnisse/HEAD/CI/Merge/Deployment erst nach Abschluss im zentralen Checkpoint dokumentieren. Noch kein LIVE_ACCEPTED allein durch dieses Dokument.

Weiter offen: vollständige historische Reader-/Writer-Kompatibilitätsmatrix, alle alten Tabs/Updateunterbrechungen, gezielte erweiterte Restore-/Quota-/Crashketten, Hardware-Android/OS-Eviction, Safari/TalkBack und echtes Drive-OAuth. Bereits vorhandene v249-/v247-Nachweise wiederverwenden und die übrigen Teilaufträge #255/#256 sequenziell fortsetzen.

## v251: tatsächliche UTF-8-Dateigröße der Hülle

Zusätzlicher nachgewiesener Randfall: Ein gültiges vollständiges synthetisches Backup mit unbekannten großen Unicode-Feldern im Wrap wird vom bisherigen Reader und der echten geräteübergreifenden Vault-Adoption akzeptiert. Nach erneutem Export passen 12.001.191 JS-Zeichen in die Drive-Zeichengrenze, während 24.001.191 UTF-8-Bytes die lokale 20-MB-Dateigrenze überschreiten. Regulär konfigurierte Wraps enthalten diese Zusatzfelder nicht. Repro/Ergebnis dauerhaft im zentralen Checkpoint-Branch: `docs/release-evidence/v250-envelope-utf8-repro.*`.

Die Folgekorrektur prüft vor AES zusätzlich die UTF-8-Bytes der tatsächlichen JSON-Hülle plus das ASCII-Base64-Datenfeld gegen die unveränderten 20.000.000 Dateibytes. Keine Leselimits werden erhöht oder reduziert. Vorhandene alte Dateien bleiben unter ihren bisherigen jeweiligen Readergrenzen lesbar. Kein Abschneiden unbekannter Metadaten, kein Schlüssel-/Schema-/Finanz-/CAS-Vertragswechsel. Exakte inklusive 20-MB-Grenze/+1, tatsächliche Adoption, unveränderte Quelle/Vault und alte Entschlüsselung werden geprüft. Die bestehende Browser-/Produktionssuite prüft den Unicode-Hüllenfall zusätzlich in allen drei Engines.
