# FolioLab Open – UX-Arbeitsauftrag „Mehr“ (24.10.2026)

## Rolle und Ziel
Arbeite als Senior UX/UI Designer, Accessibility Engineer, Vanilla-JS-Frontend-Entwickler und QA Engineer. Vereinfache die Formulare in **Mehr** gezielt anhand der bisherigen konsistenten Backup-UI, ohne APIs, Backend, Geschäftslogik oder gespeicherte Daten umzubauen. Repository: `joke0071/foliolab-open`. Keine Rückfragen.

## Verbindliche Leitplanken
1. **Progressive Disclosure:** Standardansicht jedes Panels: eine kurze Erklärung, 1–2 relevante Eingaben, eine klare Hauptaktion und bei Bedarf ein knapper Status. Lange Setup-Schritte, Datenschutzdetails und seltene Aktionen in semantische, initial geschlossene `details/summary`-Elemente verschieben.
2. Die vorhandenen Formulare `#apiSettings`, Eingabe-`name`s, `form="apiSettings"`, IDs und Eventhandler **unverändert weiterverwenden**. Keine Dummy-Buttons, keine neue Speicherung, keine API-Schlüssel im HTML/Logs, kein unbeabsichtigtes Abschalten optionaler Zugänge.
3. **Erweiterte Wertpapiersuche:** Worker-Adresse + „Suchdienst speichern“ direkt sichtbar; Einrichtung und Übertragung/Datenschutz in einem Unterbereich „Einrichtung & Datenschutz“.
4. **Eigener EODHD-Kursdienst:** Worker-Adresse und Worker-Zugriffsschlüssel + „Kursdienst speichern“ sichtbar; Setup-Schritte, CORS-Grund und Token-Unterscheidung in „Einrichtung & Sicherheit“. Hinweise: EODHD-Key ausschließlich Cloudflare Secret `EODHD_TOKEN`, separater `MARKET_ACCESS_TOKEN`, keine Geheimnisse in der URL.
5. **Blockchain-Verbindungen:** Etherscan-/Binplorer-Key und Speichern sichtbar; Solana-Staking-RPC weiter optional einklappbar; kurze verständliche Erklärung, weitere Netzwerk-/Sicherheitsdetails in „Netzwerke & Hinweise“. Bestehende Auge-Steuerung und RPC-Tests erhalten.
6. **Gespeicherte Kurswerte prüfen:** Knapp erklären, „Kursdaten lokal prüfen“ und echten Status anzeigen; lange Korrekturregeln in „Korrektur & Sicherheit“. Keine automatische Korrektur, Datenversendung oder Entfernung der Ergebnisse.
7. **Datenschutz & Hinweise:** Kurze Abschnitte „Lokale Daten“, „Externe Anfragen“ und „Wichtige Hinweise“; keine falsche pauschale Aussage, dass Backups keine API-Schlüssel enthalten. Nur verschlüsselte Backups können nach expliziter Opt-in-Option Einstellungen/APIs enthalten; unverschlüsselte JSON-Exporte niemals.
8. **Darüber hinaus:** Andere Quelleneinstellungen prüfen und nur belegte Textwände straffen; nichts aus einem bereits verständlichen Formular verschlimmbessern. Konsistente Labels, Sprechweise, Statusmeldungen und Hilfelinks.
9. Accessibility: Semantische `details/summary`, Tastaturnavigation, Fokus, Labels und `aria-live` unverändert; kein horizontaler Overflow ab 320 px, lange URLs umbrechen; keine doppelte ID/fehlenden Controls. Farben/Design innerhalb vorhandener Tokens.
10. Keine Releases ohne Tests: `npm test`, `npm run check`, Browser-Smoke/Responsive/A11y sowie Firefox und WebKit, echten CI-Status prüfen. Fixes in kleinen Commits, Merge erst nach Grün; anschließend Deployment und Live-Stand getrennt verifizieren.

## Abnahmekriterien
- Alle genannten Eingaben und Aktionen funktionieren identisch wie vorher.
- Keine langen nicht angeforderten Setup-/Risikoabsätze direkt über Formularfeldern.
- Responsive 320 / 390 / 430 / 768 / 1024 px, kein Overflow.
- Sicherheitsinformationen vorhanden und korrekt, jedoch nach Bedarf abrufbar.
- GitHub PR mit Testnachweis; main- und Live-Status klar getrennt kommunizieren.
