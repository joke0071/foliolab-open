# K6 – Fokus beim Seitenwechsel · 11.11.2026

Owner: main-40aba94dd4bd-20261111. Ausgang: v305/Main9ab3653fc508fa35fe0f20ecf56a14004f837d3e.

## Anforderung und begrenzter Fachschnitt

Bei Aktivierung einer Aktion innerhalb einer Seite, die zu einer anderen Seite führt (z. B. Übersicht → Gesamtverlauf), liegt der Tastaturfokus nach dem Wechsel auf der neuen Seitenüberschrift. Der bisherige Router blendet die Quellseite aus, setzt den Fokus dabei aber nicht neu. Fokus in der dauerhaft sichtbaren Hauptnavigation und reine Aktualisierung derselben Seite bleiben erhalten. Keine neue Navigation oder Finanz-/Speicherlogik.

Betroffen: src/app.js (nur go), sw.js (Cache306), drei gezielte Testdateien und dieses Prüfdokument. Risiko: begrenzte gemeinsame UI-Routeränderung; deshalb unveränderte vollständige Pflicht-CI/Main-/Produktionsgates.

## Prüfkriterien und lokale Gegenprobe

- Tatsächliche go-Funktion aus app.js ausgeführt, DOM-Grenze isoliert: v305 scheitert an neuer Zielüberschrift und sicherem Fallback (2 FAIL), vorhandene Navigations-/Same-Page-Kontrollen PASS. Dies ist ein Quellcode-Repro, kein echter Browser-PASS.
- Korrigierter Kandidat: 3/3 gerichtete Tests PASS, einschließlich während render entfernter Quellaktion, Same-Page und persistenter Navigation.
- Vollständige lokale Suite: 1356 Tests/0 Fehler/0 Skips; Syntaxprüfung PASS. Der erste unvollständige lokale Download hatte sieben fehlende unveränderte Dokument-Fixtures; nach gezieltem Nachladen vollständig grün. Keine Produktkorrektur an Finanz-/Testoracles.
- Neuer echter Browservertrag in bestehende ui300BrowserContract eingebunden: Chromium/Firefox/WebKit sowohl Pflicht-PR/Main als auch bestehende tatsächliche Produktionssuite. 320/390/768/1440px, echter Enter/Tab, neue Überschrift, sichtbarer Folgefokus, aria-current und unveränderte vollständige kanonische Bytes/Revision. Keine Workflow-/Gateauswahl geändert.
- Lokale Browserausführung nicht möglich: Standard-Playwright-Browser fehlen; vorhandenes Chromium scheitert am Host-socket-Verbot vor Appstart. Kein PASS oder tatsächlicher 320px-Layoutbeleg aus dieser Umgebung. Browser-/Reflowabnahme vor Integration ausdrücklich durch bestehende CI erforderlich.

## Unveränderte Grenzen

v305 bleibt bis vollständigem qualifiziertem Release letzter LIVE_ACCEPTED. Externe Android-/TalkBack-/Safari-/Systemschrift-/OAuth- und private Original-/Ownershipgrenzen bleiben offen. Alle Finanz-, UNKNOWN-FX-, Decimal-, Journal-, CAS-/Mehrtab-, Identitäts-, Main-/Produktions-/Backup-/Restoregates erhalten. Keine universelle A11y- oder 1.0-Abnahme.

Die aktuelle ausdrückliche Nutzerentscheidung beendet nur die separate QA-Agenten-/Webhookpflicht. Eigene Tests und unabhängige maschinelle Nachweise bleiben erforderlich; historische EFF03-Pilotbelege unverändert.
