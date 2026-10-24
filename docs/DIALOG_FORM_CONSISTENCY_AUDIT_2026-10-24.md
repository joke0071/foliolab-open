# Dialog- und Formular-Konsistenz – Korrekturrunde 1 (24.10.2026)

Basis: main 891900d (Service Worker v103). Ziel: gezielte, risikoarme Konsolidierung ohne Eingriff in Finanz-, Wallet- oder Backupberechnungen.

## Inventar (quellcodebasierte Prüfung)
- Allgemeiner Editor (`showDialog`): Anbieter, Konto, Position bearbeiten, öffentliche Wallet, CSV-Import, Buchung, Stichtag.
- Anlage-Assistent (`createAssetWizard`): Anbieter-/Kontowahl, Anlagenrecherche, manuelle Daten, Bestand/Kauf, Wallet-/DeFi-Optionen.
- Formulare auf „Mehr“: API-Schlüssel, Datenquellen, Solana RPC, Backup und lokale Speicherverwaltung.
- Weitere interaktive Bereiche: Suchfelder, Filter, Kalender, Aufklappbereiche, Bestätigungen, Importfehler.

## Nachgewiesene Abweichungen und Änderungen
- **P1** Anlage-Assistent wählte ohne erinnerte Zuordnung den ersten Anbieter und das erste Konto. Jetzt werden vorhandene Zuordnungen nur bei gültigem, ausdrücklich vorher verwendetem `lastAccountId` vorausgewählt. Bei leerem Portfolio bleibt „Neuen Anbieter anlegen“ der explizite Ausgangspunkt.
- **P1** Konto-Neuanlage bei mehreren Anbietern wählte zuvor den ersten. Jetzt erfordert sie eine bewusste Auswahl; bestehende Konto-Bearbeitung und expliziter Kontext bleiben erhalten.
- **P2** Editor zeigte pauschal „Speichern“. Jetzt folgen Aktionslabels dem Gegenstand („Anbieter speichern“, „Konto speichern“, „Buchung speichern“, „Buchungen importieren“ usw.).
- **P2 / Accessibility** Editor-Fehler wurden ausschließlich per Toast angezeigt. Jetzt erscheinen sie im offenen Dialog als `role=alert` und die Eingaben bleiben erhalten.
- **P2 / Accessibility** Der Editor räumte nach Escape seine Zustandsreferenz nicht auf und setzte den Fokus nicht zuverlässig auf den Auslöser zurück. Ein `close`-Handler führt beide Schritte aus.

## Fachlich notwendige Unterschiede
- Wallet-Import erfordert Scan-Ergebnisse; der Anlage-Assistent speichert nur nach gültiger Finanz-/Zuordnungsprüfung.
- Gebühren, Steuern, historische Devisenkurse und DeFi-Felder bleiben kontextabhängig, ihre Fachlogik bleibt unverändert.
- Ein einzelner Anbieter darf im Kontoeditor automatisch ausgewählt bleiben, da kein Konkurrenzkandidat existiert. Bei mehreren Anbietern ohne Auswahlhistorie erfolgt keine Zuordnung.

## Tests
`tests/browser-dialog-consistency.mjs` prüft eindeutige Speichertasten, fehlende automatische Mehrfachanbieter-Zuordnung, Rückgabe des Fokus beim Schließen, Abbruch ohne Persistenz sowie 320–1440 px. Bestehende Regressionen bleiben Bestandteil von `import.yml`.

Diese Runde ist **kein abgeschlossener Voll-Audit** aller dynamischen Felder oder manueller WCAG-2.2-AA-Nachweis. Weitere Arbeit: Buchungs-Erstauswahl bei mehreren Positionen, verworfene ungespeicherte Entwürfe, systematisches Wording-/Screenreader-Audit und vollständige visuelle Screenshots sämtlicher Dialoge.
