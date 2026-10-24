# FolioLab Open – Android/TalkBack: verbleibender manueller Gerätetest

**Status: EXTERN / NICHT DURCHGEFÜHRT.** Ein Headless-Chromium mit mobilem Viewport und axe-core kann Screenreader-Semantik, Tastaturfokus und Überläufe automatisiert prüfen. Er kann die tatsächliche TalkBack-Sprachausgabe, Android-Softwaretastatur und PWA-Geräteintegration aber **nicht** ersetzen.

## Gerät und Umgebung dokumentieren
- [ ] Gerät, Android-Version, Browser-/PWA-Version, TalkBack-Version
- [ ] Hoch- und Querformat, Standard- und große Schrift, Softwaretastatur aktiv
- [ ] Testen nur mit Demo-/Testdaten (keine privaten Wallet-Schlüssel, keine realen Finanzdaten)

## Manuelle Abnahme
- [ ] Anlage-Assistent öffnen: TalkBack erkennt Dialogtitel, Fokus beginnt an Überschrift und Tastatur öffnet nicht unerwartet
- [ ] Pflichtfeld leer speichern: TalkBack kündigt Fehlermeldung am richtigen Feld an, korrigierte Eingaben bleiben erhalten
- [ ] Anbieter-/Konto-Auswahl umstellen: Eigene Entwürfe bleiben erhalten und unklare Zuordnungen werden nicht vorgewählt
- [ ] DeFi-/Staking-Optionen erweitern: „Nicht anrechnen“ erfordert eine repräsentierende Position, widersprüchliche Verbindlichkeiten werden erklärt
- [ ] Wallet-Dialog: Netzwerkwechsel kündigt gelöschte öffentliche Adresse an; manuelle Staking-Arten werden korrekt als nicht scannbar angesagt
- [ ] CSV-Review: Zeilen zuordnen, auslassen und wieder einblenden; nur zusammenfassende Statusmeldung statt vollständiger Liste angesagt
- [ ] Jeden Dialog mit sichtbarer Softwaretastatur prüfen: Dialogtitel, Eingabefeld, Warnhinweise und Buttons bleiben erreichbar
- [ ] Abbrechen mit Änderungen: beide Verwerfoptionen prüfen, Fokus kehrt zum Auslöser zurück
- [ ] Testdaten bleiben beim Verwerfen unverändert

Bei Auffälligkeiten ein separates GitHub-Issue mit reproduzierbaren Schritten, Gerätename, Browser-/TalkBack-Version und anonymisiertem Screenshot anlegen.

**Freigabe:** Automatisierter Dialog-Audit separat abgeschlossen, Android-Hardware-Verifikation erst nach realem Gerätetest als bestanden markieren.
