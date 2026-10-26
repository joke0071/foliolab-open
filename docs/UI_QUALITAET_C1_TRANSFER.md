# C1: Transfer-Auswahlzustände, ohne neue Finanzmutation

Basis: tatsächlicher v181/mainb61d1c1-Abschluss. Ein neuer Feature-Strang, kein paralleler UI-Neubau. Betroffene Quelle: src/transfer-matching-ui.js; bestehende transactions.js-Preview/Bestätigung/Undo und PortfolioStorage-CAS bleiben unverändert.

Reproduktion aus Code: refresh findet keinen offenen cash-withdraw, baut dennoch den vollständigen Dialog mit Eingängen, Referenz, Consent und deaktivierter Bestätigung. Nach Auswahl eines Ausgangs kann weiterhin die Gegenbewegung fehlen. Cash-Matching unterstützt ausschließlich belegte eigene Geldkonto-Ein-/Ausgänge, keine Wallet-/Assettransfers und keinen unbelegten FX-Ausgleich; diese fachlichen Grenzen werden nicht gelockert.

Kleinster Schnitt:
- Kein offener Geldkonto-Ausgang: kompakte Erklärung, vorhandenen passenden Anlage-/Buchungseinstieg anbieten, keine unnutzbaren Formfelder/Bestätigung.
- Ausgang vorhanden, noch nicht gewählt: nur sinnvolle Auswahl und Anleitung.
- Ausgang gewählt, keine passende Gegenbewegung: Ursache/Konto/Währung/7-Tage-Grenze nennen, Beleg-/Consent-/Commitfelder ausblenden.
- Tatsächliche Kandidaten: bisherige bewusste Auswahl/Preview/Reference/Consent/Bestätigung verwenden; gleicher Betrag ist kein Beweis. Bereits zugeordnete Gruppen und sicheres Undo erhalten.
- Neue Einstiegsaktion schließt zuerst Transferdialog, öffnet erst dann bestehenden Assistenten/Buchungsdialog; Escape/Fokus und laufende Speichersperre erhalten.

Abnahme: leeres Portfolio, Cash ohne Buchungen, nur Assets/Wallets, bereits zugeordnete Gruppen, fehlender/andererKonto-/Währungs-/Datums-Gegenposten, valide Einzel-/Split-Auswahl; Nullmutationen bei Vorschau/Abbruch, passende Aktion/kein verschachtelterModalzustand,5Breiten/kleineHöhe/Axe/Keyboard/Fokus/gerenderteBilder in Chromium/Firefox/WebKit. Unveränderte Transfer-CAS/Undo/Restore-Regressionssuite zusätzlich ausführen. Keine Veröffentlichung ohne eigene finale grüne Gates; neueBuchungsfinanzmutationen/Sync bleiben ausdrücklich ausgeschlossen.

Status dieses Vertragscheckpoints: noch keine C1-Implementierung oder Test-/Releaseabnahme.
