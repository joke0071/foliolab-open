# K2 – Kursaktualisierungsfrequenz, Arbeitsstand10.11.2026

Owner7b9e47799d13, Basisv302/Main179d424aef1f6f35c3f6f72600e4bbe885ef329c. Fachvertrag: K2_REFRESH_PREPARATION_2026-11-09.md; bestehender Nutzerauftrag#266. Genau ein Produktstrang, noch kein Produkt-PR/CI/Release.

## Fachlicher Schnitt
Native Auswahl off/daily/6h/30m; täglich Standard, Legacyfalse→off,true/fehlend→daily. Eine kanonische Einstellung autoRefresh, kein unabhängiger Boolean. Lokales/IDB-Lesen normalisiert nur im Speicher, keine neue Revision. Opt-in verschlüsselte Konfiguration transportiert Frequenz; ungültige Einstellungen werden abgewiesen. Sichtbare Auswahl bei Savefehler wiederherstellen.

Bestehenden Aktualisierungspfad verwenden. WebLock schützt manuelle und automatische Gesamtabfrage; automatische Aufrufe nur beim Öffnen. Lokale disposable Versuchsdaten außerhalb des Finanzrecords: Versuch vor Abruf, Erfolg erst nach vollständig erfolgreicher kanonischer Speicherung. Teil-Erfolge erst nach Save vormerken; bei Wiederholung bereits erfolgreiche Quellen innerhalb des Intervalls überspringen. Begrenzter5–30MinutenBackoff bei Fehlern, Providerbudgets/Caches/429-Sperren unverändert. Manueller Abruf unabhängig vom Intervall. Rückwärtssprung der Uhr konservativ mit begrenzter Wiederaufnahme; beschädigter Versuchsstand blockiert Automatik bis manuellem Abruf. Keine Hintergrundjobs.

## Tatsächliche lokale Arbeit
Produktänderungen lokal vorhanden;1353Units/0Fehler/0Skips und Syntax PASS, einschließlich8neuer Frequenztests. Noch keine Browser-/CI-/Produktionsfreigabe. Browservertrag mit Legacy-/IDB-/Quota-/Mehrtab-/Teilabruf-/Fehler-/Responsive-/Axe-Fällen in Arbeit, in bestehenden ETF-Source-Gate eingebunden; kein neuer Workflow. System-Chromium konnte wegen Host-Socketbeschränkung nicht starten; das ist kein Produktbefund. PinnedPlaywright1.56.1 und Axe4.10.3 beschafft; aktuelle Browserprüfung läuft mit synthetischen Antworten.

## Private Sicherung
V129 und tatsächlich vorhandenesv302-Abschlussarchiv vollständig selbst erneut gehasht und alle28339/28448Manifestpfade/0Fehler geprüft; alleV129Payloads erhalten. Original-ZIPs/Logs/Oracles unverändert verfügbar. Neuer einmaliger autorisierter versionsgeschützter Speicherauftrag mit expected_current_version129 schlug bei prepare_uploads fehl, kein erfolgreicher neuer Speicherstand bestätigt; kein blinderRetry/kein Wechsel auf direkten Schreibweg. Dauerhaft bestätigt weiterhinV129. Kein allgemeines Auditgate eingeführt.

## Nächste Aktion
Browservertrag gezielt fertigprüfen; vor PR Kandidat sauber einfrieren, Originalfehler erhalten. Offenen Sicherungsschritt vor Veröffentlichung klären; keine leere/unvollständige Ersatzsicherung. Danach reguläre Kandidaten-/Wallet-/Main-/Deployment-/Live-Gates unverändert. Nach einem LIVE_ACCEPTED oder größerem abgeschlossenen Paket reguläre HND01-R-Abgabe, keine neue Roadmap.
