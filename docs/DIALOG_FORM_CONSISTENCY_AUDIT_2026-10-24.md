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

## Korrekturrunde 4: Mehrdeutige Wallet-Zuordnungen und Formulardatenverlust

- P1 behoben: Bei einer Konto-Neuanlage wird ein bereits benutzerdefinierter Name durch einen späteren Wechsel des Anbieters nicht mehr überschrieben. Bei einer bestehenden Konto-Bearbeitung bleiben Name/Typ bei Anbieterwechsel erhalten.
- P1 behoben: Die Wallet-Importmaske wählt bei mehreren verfügbaren Wallet-Anbietern oder mehreren Wallet-Konten **keinen ersten Datensatz** mehr automatisch. Sie fordert eine bewusste Zuordnung. Für einen einzigen gültigen Wallet-Anbieter/ein einziges Wallet-Konto bleibt die praktische Vorauswahl erhalten.
- P1 behoben: Bereits vor dem ersten Model-Mutieren werden Anbieter- und Wallet-Kontowahl beim Speichern validiert; unvollständige Zuordnungen blockieren den Speichern-Button auch nach erfolgreichem Scan.
- Das programmgesteuerte Übernehmen von Anbieter- und Kontovorschlägen markiert einen noch nicht gespeicherten Entwurf zuverlässig als geändert.
- A11y: Die umfangreiche Wallet-Ergebnisliste kündigt nicht mehr bis zu 150 Einträge über `aria-live` an; der kurze Scanstatus bleibt als `role=status` zugänglich.
- Dialog-Schließen, primäre/sekundäre Footer-Aktionen und native Aufklappfelder erhalten mindestens 44 px große Touch-Ziele, ohne native Ausklapp-Pfeile zu ersetzen.
- Browser-Test `browser-dialog-financial-choices.mjs` ergänzt mehrere Wallet-Anbieter und -Konten, expliziten Anbieterwechsel, erhaltene eigene Kontonamen, Fokus, Touch-Ziele, Abbruch ohne Persistenz und acht Viewports. Referenz-Screenshots umfassen künftig auch Wallet-Dialoge bei 390 und 1440 px.

Nicht vollständig nachgewiesen: automatische Erkennung sämtlicher externen Wallet-Anbieter im Offline-Fall, vollständige Datenzuordnungs-Regression für alle seltenen DeFi-/Staking-Zweige, echte TalkBack-/Android-Tastaturbedienung und pixelbasierte Screenshot-Baselines.

## Korrekturrunde 5 – CSV-Vorschau und übernommene Vorschläge

- Der CSV-Prüfbereich ist keine vollständig vorlesende Live-Region mehr: Nur Anzahl bereiter, doppelter, offener und übersprungener Zeilen wird für Screenreader als `role=status` bekanntgegeben.
- Mehrdeutige Zuordnungen und Skip-Checkboxen erhalten verständliche zeilenspezifische Bezeichnungen. Nach einer Neuberechnung kehrt der Tastaturfokus zu einer erhaltenen Checkbox zurück; ist die gerade bearbeitete Zeile erfolgreich zugeordnet und verschwindet, springt er auf die fokussierbare Überschrift der Prüfliste.
- Die Auswahl eines CoinGecko-Katalog-Treffers oder einer bestätigten Wertpapier-Börsennotierung wird auch dann als ungespeicherte Änderung erkannt, wenn der Browser kein natives `input`-Event auslöst. Ein anschließender Abbruch nutzt die bestehende Verwerfbestätigung.
- Zusätzlicher Chromium-Browser-Test `browser-csv-review-a11y.mjs` mit mehreren unklaren CSV-Zeilen, Nachzuordnung, Skip/Unskip, Fokus, Bestätigungsabbruch und unveränderten Portfoliodaten.
- Unverändert: all-or-nothing CSV-Transaktionssimulation, Dublettenlogik, manuelle Gegenkonto-Zuordnung, DeFi-Validierung und Rückverfolgbarkeit von Buchungen.

Offen bleiben reale Android-/TalkBack-Tests, vollständige Pixel-Regressionen und seltene DeFi-Zweige.

## Korrekturrunde 6 – DeFi- und Staking-Zuordnung

- Positionseditor und Anlage-Assistent verwenden eine gemeinsame reine Informationslogik für die wirtschaftliche Rolle, den Vermögenssummen-Modus und die Referenzposition.
- Bei `Nicht anrechnen` ist eine bewusst ausgewählte Referenz erforderlich; das Eingabefeld wird als erforderlich und mit `aria-required` ausgezeichnet. Eine fehlende Referenz wird im Assistenten direkt am Feld angezeigt, bevor die atomare Speicherung beginnt.
- `Als Verbindlichkeit abziehen` warnt, solange die wirtschaftliche Funktion nicht `Geliehene Assets / Verbindlichkeit` ist. Es erfolgen ausdrücklich **keine** automatischen Umbuchungen oder Auswahländerungen.
- Referenzen auf bereits ausgeschlossene oder als Verbindlichkeit gewertete Positionen erzeugen einen Hinweis zur wirtschaftlichen Prüfung, ohne bestehende Finanzdaten zu migrieren oder historische Backups zu entwerten.
- Ergänzte Unit-Tests und Browser-Regression: verpflichtende Referenz, Rolle/Modus-Widerspruch, expliziter Ablehnungsweg ohne Mutation, Fokus, Abbruch und mobile/desktop Viewports.
- Unverändert: `validateEconomicPosition`, `valueSign`, Portfoliobewertung, Transaktionen und Snapshot-/Backupformate.

Offen: manuelle TalkBack-/Android-Tastaturtests, Pixel-basierte visuelle Referenzregression und vollständige seltene Staking-Scanner-Varianten.

## Korrekturrunde 7 – Reichweite von Staking-Scans transparent machen

- Bisherige Beschriftung „Bestimmtes Staking-Asset prüfen“ suggerierte eine auf genau dieses Produkt gefilterte Abfrage. Das ist fachlich falsch: Der Netzwerkadapter liest alle vom Netzwerk unterstützten Wallet-Guthaben. Neue Beschriftung „Staking-Unterstützung prüfen (optional)“ erklärt die Grenze ausdrücklich.
- Der Staking-Auswahlliste ist die Status-/Hinweismeldung über `aria-describedby` zugeordnet. Für 50 Referenz-Assets werden je nach Capability weiterhin die allgemeinen Netzwerkscans angeboten oder bei nicht verfügbaren/Legacy-Scannern blockiert, mit Hinweis auf manuelle Erfassung.
- Bei automatischem Staking-Netzwerkwechsel wird das Löschen einer schon eingegebenen Wallet-Adresse jetzt deutlich angesagt. Ein **manueller** Netzwerkwechsel entfernt aus demselben Sicherheitsgrund eine alte Adresse und die vorherige Staking-Auswahl; auch dies wird angekündigt.
- Vor dem ersten Scan erzeugt eine bloße Änderung der Netzwerk-/Staking-Auswahl keine irreführende Meldung „bitte erneut suchen“.
- Neuer Browser-Regressionstest prüft alle 50 Catalog-Modi auf korrekte Scanfreigabe, unterstützten Netzwerkwechsel, manuelle/Legacy-Scanner, Fokus, Abbruch ohne Portfolioänderung, sieben Viewports und Status-Beschriftung.
- Das bestehende CI-Screenshot-Artefakt enthält zusätzlich die Zustände **manueller Scanner nicht verfügbar** und **teilweise unterstützter Netzwerk-Scan** bei 390 und 1440 Pixel.

Die Scannerlogik, Staking-Bewertung, Portfolio-Cashflows, lokale Datenpersistenz und API-Aufrufwege wurden **nicht verändert**. Pixelgenaue visuelle Baselines und reale Android-/TalkBack-Prüfungen bleiben offen.


## Abschluss – Automatisierter Dialog- und Formularaudit, 24.10.2026

**Status: AUTOMATISIERTER AUDIT ABGESCHLOSSEN** (vorbehaltlich grüner CI dieses Abschluss-Commits).
Abdeckungsumfang: Dialogdarstellung und Responsive (320–1440 px), Tastaturfokus,
Schließen/Verwerfen, Pflichtfeldfehler und `aria`-Hinweise, Anbieter-/Kontoidentität,
Wallet-/Staking-Auswahl, CSV-Prüfliste, DeFi-Rollen, kritische Screenreader-Regeln (axe-core),
Chromium sowie Firefox/WebKit, Persistenzintegrität beim Abbrechen.

**Visuelle Regression:** 20 genehmigte Screenshot-Zustände aus dem unveränderten CI-Artefakt
[Run 40078908906](https://github.com/joke0071/foliolab-open/actions/runs/40078908906)
werden mit den Bilddimensionen und mit je 256 ortsgebundenen RGB565-Farbpixeln
(`tests/dialog-visual-pixel-baselines.json`) verglichen. Ein Bild darf maximal 12
deutlich veränderte Samples (>42 RGB-Einheiten Kanaldifferenz) aufweisen. Das ist
eine **räumlich stichprobenbasierte Pixel-Regression**, keine pixelgenaue Vollbildgleichheit.
Die ursprünglichen PNGs bleiben als [GitHub Actions-Artefakt](https://github.com/joke0071/foliolab-open/actions/runs/40078908906/artifacts/12554173269)
nachvollziehbar, bis GitHub die Artefaktaufbewahrungsfrist erreicht. Baselines dürfen nur
nach bewusster visueller Freigabe neu erstellt werden und werden in CI niemals automatisch aktualisiert.

**Grenze:** Eine echte Android-TalkBack-, Android-PWA- und Software-Tastatur-Abnahme
ist ohne ein reales Gerät nicht nachgewiesen. Sie ist ausdrücklich als **externe,
offene Hardware-Verifikation** in `docs/DIALOG_AUDIT_ANDROID_TALKBACK_CHECKLIST.md`
dokumentiert und kein behaupteter automatischer Testerfolg.

Keine Änderungen an Portfolio-Finanzlogik, Wallet-Scanner, Kursquellen oder Backupformat
in der Abschlussrunde. Neue Feature-Vorschläge/Redesigns sind nicht Teil dieses Audits.

## UX-Nachtrag – Positionseditor vereinfachen

Der bestehende Positionseditor blieb nach dem technischen Audit funktional korrekt, war jedoch gegenüber dem Anlage-Assistenten visuell zu umfangreich. Er wird ohne Datenmigration übersichtlicher:
- Die Auswahllisten für **Anbieter** und **Konto/Depot** stehen direkt oben; die bisherigen Filter-Suchfelder bleiben unter `Anbieter oder Konto suchen` erreichbar.
- Direkt danach folgen **Anlageklasse, Name, Ticker, ISIN, Stückzahl, Kurs und Währung**. Das stellt bewertungsrelevante Daten in den Vordergrund.
- `Wertpapier suchen und zuordnen` ist ein standardmäßig geschlossener optionaler Bereich ohne irreführende Schritt-Nummer. Stammdatenvorschläge bleiben unverändert und überschreiben keine Stückzahlen oder Kurse.
- `Handelsplatz und technische Börsenkürzel` sowie `Öffentliche Wallet-Verknüpfung` sind getrennt aufklappbar; eine bereits aktiv verknüpfte Wallet wird beim Bearbeiten automatisch aufgeklappt. DeFi- und Einstandswertoptionen bleiben eigenständige Details-Bereiche.
- Die originalen Formular-Controls werden im DOM umsortiert, nicht dupliziert. Event-Handler, Feldnamen, Buchungs- und Bewertungscode sowie die Sicherheitsregeln bleiben unverändert.
- Neue Chromium-Regression testet Provider-Suche ohne ungewollte Neuzuordnung, Bestandsdaten, aufklappbare Optionen, Abbruch mit/ohne Bestätigung, Speichern, Typwechsel und acht Viewport-Breiten.
