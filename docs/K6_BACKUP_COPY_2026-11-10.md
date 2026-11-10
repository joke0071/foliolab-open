# K6 – Backupumfang und lokale Datenhaltbarkeit · EFF03-Pilot

## Reproduzierter Bedarf und begrenzter Produktumfang

Basis: Main `f7f990d24a3a1ba2a2e13c377b0b8c0216a45e43`, Tree `7c1d889aa759b4b6e3c7dd1cd3967466a926a31a`, v304. Im vorhandenen Bereich **Mehr → Deine Daten**:

1. Der Hinweis direkt am normalen JSON-Export nennt bisher nur fehlende API-Zugangsdaten. `backup(model)` schließt standardmäßig auch bestätigte Wallet-Historien aus und ersetzt persönliche Einstellungen durch Defaults. Die vorhandenen Zusatzoptionen gelten allein für verschlüsselte Backups. Der neue Hinweis macht Unverschlüsseltheit, Umfang und Zugang zu diesen Optionen sichtbar; Export-/Restorefunktionen bleiben unverändert.
2. Der bisherige Browser-Reset-Hinweis enthält keinen Safari-/ITP-Kontext. Er wird durch eine standardmäßig geschlossene native Hilfe „Lokale Daten sicher aufbewahren“ ersetzt: Backup außerhalb des Browsers prüfen, begrenzte Safari-Regel samt Home-Screen-Ausnahme, keine Haltbarkeitsgarantie und bestehende Installations-/Browserwechselgrenzen. Keine neue dauerhafte Warnkarte, Browsererkennung oder erzwungene Installation.

Nur `index.html`, erforderlicher Cachewechsel `sw.js` v304→v305 und dieses Prüfdokument. Alle `src/`-, Test-, Workflow-, Dependency-, Finanz-, Journal-, IndexedDB-/CAS-, Backup-/Restore- und Manifest-/Installationsidentitätsbytes bleiben unverändert. Es werden keine Daten migriert oder zusätzliche Netzabfragen eingebaut. Der Checkpointbranch wird niemals vollständig integriert.

## Quellen und Formulierung

- [WebKit Tracking Prevention](https://webkit.org/tracking-prevention/), Abschnitte „7-Day Cap on All Script-Writeable Storage“ und „Home Screen Web Application Domain Exempt From ITP“, geprüft 10.11.2026.
- [WebKit: Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/): Zählung nach Tagen tatsächlicher Safari-Nutzung ohne Interaktion, keine pauschale Kalenderfrist auf jedem Apple-Gerät.
- Bestehender Auftrag [#298 A](https://github.com/joke0071/foliolab-open/issues/298), kanonischer Scope K6-TRUST. Weder allgemeiner historischer Datenschutz-Audit noch CSP-/Lizenzvollprüfung sind Teil dieses Pakets.

## Eingefrorener QA-Vertrag

Die exakte HEAD-SHA steht am zugehörigen **QA_READY**-PR; sie gilt für den gesamten Kandidaten einschließlich dieses Dokuments. Eigenständige QA prüft ausschließlich diesen SHA und meldet redigierte Befunde/Acceptance dort. SHA-Wechsel erfordert neue Zuordnung. Hauptagent liest Reviews UND Kommentare vor Integration frisch.

| Prüffeld | Erwartung / Negativgrenze |
| --- | --- |
| Diff und Datenintegrität | Genau zwei Copy-Änderungen plus Cacheidentität/Dokumentation; keine Quellcode-, Finanz-, Datenformat-, CAS-, Restore-, Workflow- oder Installationsänderung |
| JSON-Umfang | UI nennt unverschlüsseltes Format, Portfolio/Buchungen/Stichtage und fehlende Wallet-Historien/persönliche Einstellungen/Zugänge; Zusatzoptionen für verschlüsselte Backups bleiben eindeutig |
| Safari | Safari-Nutzung ohne Interaktion und spezifische Home-Screen-Ausnahme; weder universelle Sieben-Kalendertage-Löschung noch dauerhafte Speichergarantie |
| Bedienung | Hilfe initial geschlossen, per Tastatur öffn-/schließbar, Fokus sichtbar; bestehende Export-/Passwort-/Restore-/Löschaktionen erhalten |
| Darstellung | 320/390/430/768/1024/1440px, geöffnet/geschlossen, 200% CSS-Text, Reduced Motion und gezielte Axe-Prüfung ohne neue Verstöße; Emulation bleibt von Systemschrift/TalkBack getrennt |
| Backup/Restore | Normaler Export mutiert kanonische Daten/Revision nicht; gültige FreshRestore-/Grenz-/UTF8-/Verschlüsselungsbelege und sichere ungültige Abweisung erhalten |
| Offline/Update | Bestehende vollständige PWA-/Cache-/IDB-/Altworker-Negativgates auf unveränderter Testsuite bestehen; gleiche Assetliste, nur neuer Cachewert |

## Lokale Vorprüfung und offene Grenzen

1.353 Unit-Tests, 0 Fehler/0 Skips; Syntaxprüfung bestanden. Chromium/Firefox: sechs Breiten geöffnet/geschlossen, Tastatur/Fokus, 200%-CSS-Schrift, je zwei gezielte Axe-Scans ohne Verstöße, Plain-Export/ungültige Abweisung ohne kanonische Mutation und tatsächliches SW-Offline-Neuladen bestanden. WebKit: dieselben Layout-/Tastatur-/Axe-/Exportprüfungen bis zur Offline-Navigation bestanden; die abschließende Offline-Navigation meldet lokal einen internen WebKit-Fehler und bleibt **OFFEN**, kein PASS daraus abgeleitet.

Bestehende Browserprüfungen: `browser-settings-backup.mjs` bestanden; `browser-plain-backup-limits.mjs` in Chromium/Firefox/WebKit bestanden (gültiger Legacy-Input, portabler Export, UI-FreshRestore, UTF8-Abweisung, unveränderte Bytes/Revision); `browser-pwa-update.mjs` Chromium/Firefox bestanden. Der WebKit-Fehler bei `browser-pwa-update.mjs:108` wurde mit den exakten unveränderten v304-`index.html`-/`sw.js`-Bytes und identischem übrigen Runtime-/Teststand reproduziert. WebKit-PWA-Offlineprüfung lokal noch nicht qualifiziert; unveränderte Pflicht-CI bleibt zwingend. Lokale Bibliotheksbereitstellung betrifft nur die isolierte Testumgebung, keine Repository-/Browserbinär-/Assertionänderung. Fehlgeschlagene Umgebungsstarts und Originalfehler bleiben erhalten.

Native Safari-/ITP-Abläufe, iOS/Android, TalkBack, echte Systemschrift und reales OAuth sind nicht durchgeführt; vorhandene externe Grenzen bleiben bestehen. WebKit-Automation ist keine native Safari-Abnahme. K6-TRUST insgesamt bleibt VERIFY. Kein QA_ACCEPTED, MERGE_READY oder LIVE_ACCEPTED durch dieses lokale Dokument.

## EFF03-Messgrenze

Erstes kleines, zusammenhängendes Zwei-Änderungen-Paket; keine zusätzliche CI nur zum Prozessvergleich. Lauf-/Job-/Reviewzeitpunkte und Korrekturen werden am Pilot-PR zugeordnet. Aktiver früherer Entwicklungs-/QA-/Dokumentationsverbrauch und Work-Credits sind UNKNOWN. Umgebungsaufwand gesondert halten; Wand-/Jobzeiten sind keine aktiven Arbeitsminuten. Tatsächliche Nutzenbewertung erst nach unabhängiger QA, Pflichtgates und gesichertem Releaseabschluss; keine Prozentersparnis behaupten.
