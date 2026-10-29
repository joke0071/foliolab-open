# Native Flatex-Stückhistorie im bestehenden Dialog · 29.10.2026

Fortsetzung von PR195/631db637 auf unverändertem main3e9f4877/v204.
Kollisionsprüfung: nur PR195 und geparkte Drafts157/161 offen, letzte CI40838759139
und Wallet40838759176 erfolgreich; kein aktiver Lauf, frische saubere Arbeitskopie.
Zentraler Checkpoint remote ea2d100e hat Vorrang vor historischen Startangaben.

## Dieser Schnitt

Die bereits geprüfte prepareNativeFlatexPreview wird im bestehenden nativen
Importdialog ausschließlich als ausdrücklich ausgelöste lokale Simulation benutzt.
Kein zweiter Parser, keine neue Importengine oder Speicherung. Nutzer wählt ohne
Vorauswahl append (leere Positionen) oder backfill (beobachteten Endbestand erhalten).
Vor jeder Simulation aktuelle Konto-/Quellbestätigung und assertCurrent prüfen.
Alle nativen Dokumente zusammen prüfen; Cash-/Sonder-/Konfliktfälle blockieren den
ganzen Stapel. Keine Auswahl/Auslassung/Finanzoverrides anbieten.

Ergebnis zeigt gemeinsame neue/Dublettenanzahl und exakte Vorher-/Nachhermengen,
unbekannte Gebühren/Steuern/Kosten sowie fehlende vollständige Cashflow-/Renditebasis.
Keine Vollständigkeit oder wirtschaftliche Gesamtabnahme suggerieren. Sperrgrund
sichtbar und per bestehendem Statusbereich ankündigen. Escaping aller Quell-/Zieltexte.

Konto-/Bestätigungs-/Modus-/Datei-/Formatwechsel entfernt das Ergebnis sofort,
auch während asynchroner Frischeprüfung. Generation und Aktionszähler verwerfen
verspätete Ergebnisse nach Wechsel, Abbruch oder Dialogschließen. Veraltete Revision
entfernt Bestätigungen/Ergebnisse und sperrt weitere Simulation. Paging erhält nur
noch aktuelle Ergebnisse. Kein DTO als Autorisierung oder Vorschau für Submit nutzen.

Nativer Submitguard und submitBlocked bleiben unverändert, Importbutton deaktiviert.
Keine privaten Daten/Originale notwendig oder öffentlich gespeichert. SW206 ist ein
unveröffentlichter Kandidat; keine produktive Freigabe durch dieses Dokument.

## Nachweise

Gezielte Units für Ergebnis-/Modus-/Sperr-/Escapingdarstellung. Echter Dialogtest
mit synthetischen leeren und gehaltenen Positionen, append/backfill, kompletter
Cash-/Sonderstapelblockierung, fehlender Bestätigung, Ergebnisreset, verzögerter
assertCurrent-/Generation-/Abbruchprüfung, konkurrierendem IDB-Schreiber, erzwungenem
Submit, Offline-Neuladung, exakter IDB-/Revisions-/Settings-Nullmutation. 320/390/430/
768/1440px, Axe, Fokus, 44px und Screenshots. In bestehenden Drei-Engine-Einstieg
aufnehmen; unveränderte vollständige CI/Wallet-Gates vor Kandidatenabnahme.

Aktive Buchungsübernahme bleibt nächster getrennter Schnitt: konkreter Backup-/
Bestätigungs-/Baseline-/CAS-/Undo-/Kosten-/Bestandsschutzvertrag, Implementierung,
vollständige Prüfung und konkrete Releaseentscheidung vor Veröffentlichung.
UI-/DELETE-MASTER28, PERF01, FLH04 und übrige Roadmap erhalten; FLH05/PROJ01 geparkt.
