# Dialog- und Formular-Konsistenz – Korrekturrunde 1 (24.10.2026)

Basis: main 891900d (Service Worker v103). Ziel: gezielte, risikoarme Konsolidierung ohne Eingriff in Finanz-, Wallet- oder Backupberechnungen.

## Inventar (quellcodebasierte Prüfung)
- Allgemeiner Editor (`showDialog`): Anbieter, Konto, Position bearbeiten, öffentliche Wallet, CSV-Import, Buchung, Stichtag.
- Anlage-Assistent (`createAssetWizard`): Anbieter-/Kontowahl, Anlagenrecherche, manuelle Daten, Bestand/Kauf, Wallet-/DeFi-Optionen.
- Formulare auf „Mehr“: API-Schlüssel, Datenquellen, Solana RPC, Backup und lokale Speicherverwaltung.
- Weitere interaktive Bereiche: Suchfelder, Filter, Kalender, Aufklappbereiche, Bestätigungen, Importfehler.

## Nachgewiesene Abweichungen und Änderungen
- **P1** Anlage-Assistent wählte ohne erinnerte Zuordnung den ersten Anbieter und das erste Konto. Jetzt werden vorhandene Zuordnungen nur bei gültigem, ausdrücklich vorher verwendetem `lastAccountId` vorausgewählt. Bei leerem Portfolio bleibt „Neuen Anbieter anlegen“ der explizite Ausgangspunkt.
- **P0/P1** Buchungen wählen bei mehreren vorhandenen Positionen die Quellposition nicht länger willkürlich; Transfers, Swaps und Fusionen verlangen eine ausdrücklich gewählte Zielposition. Historische FX-Felder bleiben ohne gewählte Quellposition verborgen.
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

Diese Runde ist **kein abgeschlossener Voll-Audit** aller dynamischen Felder oder manueller WCAG-2.2-AA-Nachweis. Weitere Arbeit: verworfene ungespeicherte Entwürfe, systematisches Wording-/Screenreader-Audit und vollständige visuelle Screenshots sämtlicher Dialoge.

## Korrekturrunde 2: Entwurfsschutz und Sprachstandard

- Ein gemeinsamer `createDialogDiscardGuard` schützt Editor und Anlage-Assistent beim Abbrechen, Schließen und bei Escape; Ablehnen der Bestätigung behält Eingaben und Fokus im Dialog. Nach erfolgreich gespeichertem Zustand wird ohne zusätzliche Nachfrage geschlossen.
- Während eines asynchronen Speichervorgangs wird das Verlassen gesperrt; ein Speicherfehler lässt den Entwurf sichtbar.
- Begriffe wurden vereinheitlicht: Giro- oder Verrechnungskonto, Tagesgeld oder Festgeld, Konto oder Depot, Position gespeichert.
- Die neue Browserprüfung deckt Ablehnen/Akzeptieren des Verwerfens, Tastatur-Escape, Fokus und unveränderte persistierte Daten ab.
- `tests/browser-dialog-visual.mjs` erstellt reproduzierbare mobile und Desktop-Screenshots von Kontoeditor, Anlage-Assistent (auch erweitert) und Buchung. Die CI archiviert diese Bilder als Artifact; sie sind **Sichtprüfbelege**, keine pixelbasierten visuellen Regressionstests.

### UX-Wording-Glossar

| Konzept | Verbindlicher Begriff | Abgrenzung |
|---|---|---|
| Anlageklasse / Instrument | Anlage | ETF, Aktie, Fonds oder Kryptowährung |
| Konkreter Bestand | Position | Gehört genau einem Konto/Depot und Anbieter |
| Verwahrstelle | Anbieter | Bank, Broker oder Wallet-Anbieter |
| Untergliederung beim Anbieter | Konto oder Depot | Getrennte Einheiten, auch mehrere Konten beim selben Anbieter |
| Öffentliche Blockchain-Adresse | Wallet | Kein Zugriff auf geheime Schlüssel |
| Transaktion / Geldbewegung | Buchung | Kauf, Verkauf, Transfer, Einzahlung usw. |
| Historischer Portfoliowert | Stichtag | Keine implizite historische Rendite |
| Zusätzliche normale Angaben | Weitere Angaben | Im aktuellen Dialog aufklappen |
| Fachspezifische Konfiguration | Erweiterte Einstellungen | Nur wo für technisch anspruchsvolle Aufgaben nötig |
| Fehlgeschlagenes Speichern | Änderung nicht gespeichert | Im Dialog, Einträge erhalten; konkrete Abhilfe |
| Entwurf schließen | Eingaben verwerfen | Bestätigung nur nach Bearbeitungen |

Weitere offene Arbeit: vollständiges Wording-Screening aller dynamischen Fehlerpfade, manuelle Screenreader- und Android-Tastaturprüfung, pixelbasierte visuelle Regression mit freigegebenen Baselines und detaillierte Prüfung selten genutzter DeFi- und Backup-Varianten.

## Korrekturrunde 3: Eingabefehler und Mobil-/Tastaturergonomie

- Validierungsfehler des Anlage-Assistenten erhalten eindeutige Zuordnungen (`aria-invalid`, `aria-describedby`) und einen direkt beim Feld platzierten Hilfetext. Die globale Fehlerrückmeldung bleibt erhalten.
- Bei einem gezielten Speicherversuch gelangt der Fokus zum fehlerhaften Feld, bei einem allgemeinen Speicherproblem zur Dialogmeldung; gespeicherte Eingaben bleiben unangetastet.
- Ein neu geöffneter Editor und Anlage-Assistent fokussieren zunächst eine beschreibende Überschrift, nicht ein Eingabefeld. Das vermeidet unnötige initiale Software-Tastaturaktivierung.
- Nach dem kontextbedingten Neuaufbau einer Anlageklasse bleibt der Fokus nach Möglichkeit am bisherigen Bedienelement.
- Browser-Test `browser-dialog-a11y-mobile.mjs` ergänzt Eingabe-/Fehlerzustände, Touch-Emulation, verkleinerte Viewports (320×360 bis 1440×800), axe-basierte Dialogprüfung und einen simulierten Fehler der lokalen Speicherung.

**Prüfgrenzen:** Playwright-`isMobile`/Touch und reduzierte Viewporthöhe sind eine Browseremulation, **kein** Nachweis einer tatsächlich eingeblendeten Android-Tastatur oder einer realen TalkBack-Sitzung. Nach wie vor offen: händische Prüfung auf realen Android-Geräten, vollständige Screenreader-Navigation und fest referenzierte Pixelvergleichs-Baselines.
