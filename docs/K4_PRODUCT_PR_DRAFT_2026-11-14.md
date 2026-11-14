# K4 Produkt-PR337 – offen für Review, Pflichtchecks abgeschlossen

Datei- und Google-Drive-Restore weisen strukturierte oder boolesche Positionsmengen und Wechselkurse vor der Übernahme ab. Gültige Altbackups behalten exakte Dezimalpreise und lokalisierte Wechselkurse: 2 × 123.450000000000000005 EUR bleiben exakt 246.90000000000000001 EUR; 2 × 100 USD bei FX 0,9 ergeben 180 EUR. UNKNOWN erzeugt keine erfundene EUR-Summe. Bestehende Anzeige-/Exakt-Abweichungen bleiben prüfbar und unbewertet.

Gewinnt ein anderer Tab während des Restore, bleiben dessen Daten gespeichert und sichtbar. Nach bestätigter Portfolioübernahme beschreiben spätere Passwort-/Einstellungs-/Anzeigefehler die erfolgte Übernahme und warnen gegen erneuten Vollimport.

**Geprüfter Produkt-Head:** `dcdb094ac44e7d8ca597398d886a121c9bab23e5`, Tree `acd2a876c84055021c22263ac0f8aabdc5a6b4c2`. Base `57ba5fd04b3fc870be3b085c1994c79ff50297d7`, zwei Commits voraus/0 zurück, neun geänderte Dateien. Der getrennte QA-Runner gehört nicht zum Produktdiff.

### Nachweise

- Lokales Review: 125/125 gezielte Tests, 0 Fehler/Skips, Syntax aller Produkt-/Worker-JS-Dateien PASS. Enthalten sind v1–v5-Typgrenzen und gültige Nachbarn, Präzisions-/Komma-/Exponentpreise, UNKNOWN, exakte Mengen, Konflikte, Nachbereitungsfehler und Speicherung/Wiederöffnung. Keine vollständige CI aus dieser Teilmenge behauptet.
- [Neuer nativer Lauf 43603315041, Versuch 1](https://github.com/joke0071/foliolab-open/actions/runs/43603315041), Job 132472521327: **8/8 PASS auf exakt diesem Produkt-Head**, kein Korrekturlauf. Vier identische Datei-/Drive-Paare: exakter v2-Preis ohne priceExact; Komma-FX; widersprüchlicher Legacy-FX (Anzeige 0.9/Exakt 0.8 bleiben erhalten, EUR-null); UNKNOWN mit Menge 17.000000000000000005 und Preis 123.45 USD.
- Reale App-Dateieingabe und Drive-Button, reale Kryptografie und kanonische IndexedDB. Je Fall Revision8 und unveränderter gesamter Record nach Wiederöffnung im selben Kontext; je Paar gleiche Eingangsbytes, raw und Einstellungen. Sichtbarer ungespeicherter Einstellungsentwurf erhalten. Chromium156.0.8078.4, Playwright1.64.1, Node22.23.4 auf Ubuntu/headless. OAuth/HTTP simuliert, SW blockiert.
- Original-ZIP Größe/SHA256/CRC geprüft. Originalarchiv 3139259 Bytes/SHA256 `8ff905a648f39604a122054bfc82c24a73857e474048b83d49440c4c0098baf7`, Version0 gepinnt bytegleich rückgelesen; 212 Manifestdateien restauriert und hashgeprüft. [Ergebnis und Sollwerte](https://github.com/joke0071/foliolab-open/blob/7050ceb7eb3f7bbc1ad70bd7f8aa749200099bef/docs/release-evidence/k4-native8-2026-11-14.json).
- Vorherige 14 native PASS aus Run43588219909 bleiben ausschließlich Produkt5db3803509cfd0824dad5dd12532a1168c161e32 zugeordnet (valid/UNKNOWN/Typablehnung/CAS/Vault-/Meldungsfehler). Sie werden nicht auf diesen Head umetikettiert.

### Kompatibilität und Grenzen

Unterstützte Portfolio-/Verschlüsselungsformate bleiben erhalten; v5 benötigt gültige geschützte Metadaten. Datei unterstützt zusätzlich direktes unverschlüsseltes Portfolio-JSON, Drive weiterhin passwortverschlüsselte v2-Pakete. Unverschlüsselte vollständige Konfigurationspakete bleiben verboten. Keine Migration oder Änderung von Portfolio-/Installationsidentität.

Exakte Werte folgen dem bestehenden 18-Nachkommastellenvertrag; bereits in numerischen JSON-Werten verlorene Stellen werden nicht erfunden. Numerische Legacy-Anzeige-/Exakt-Abweichungen werden nicht automatisch repariert. Typ-/Dezimalablehnung erhält den alten Record; CAS-Verlust erhält den neueren Gewinner. Native Korrupt-Recovery, reale Windows-/Android-Profile, echtes OAuth, Prozessabbruch und Eviction bleiben eigenen Nachweisen zugeordnet. K4 insgesamt PARTIAL; K3/FLH04 getrennt.

CACHE **v313→v314** ist enthalten, weil geänderte ausgelieferte Module eine neue PWA-Cachekennung brauchen. Assetliste sowie Workerinstallations-/Fetchlogik bleiben unverändert.

### Reguläre PR-Checks und Reviewstatus

**Alle regulären PR-Checks sind abgeschlossen und erfolgreich, jeweils Versuch 1 am unveränderten Head dcdb094…:**

- [Integration 43603620780](https://github.com/joke0071/foliolab-open/actions/runs/43603620780): SUCCESS; plan=INTEGRATION; 1480/1480 Node-Tests, 0 Fehler/Skips, Syntax PASS; Chromium und alle drei Firefox/WebKit-Crossjobs SUCCESS.
- [Wallet scan checks 43603620791](https://github.com/joke0071/foliolab-open/actions/runs/43603620791): SUCCESS; ebenfalls 1480/1480 Node-Tests, 0 Fehler/Skips und Syntax PASS.
- Geprüfter synthetischer Merge `6702d40d63d862026b1779d1b2b93ff24014b0de`: Tree exakt `acd2a876c84055021c22263ac0f8aabdc5a6b4c2`, identisch zum Produkt-Head. Base/Main unverändert.
- PWA-v314-Berichte in Chromium, Firefox und WebKit PASS: reale Workerwechsel, genaue Cache-Assetbytes, kanonische IndexedDB und Offline-Wiederöffnung unter synthetischem Warmcache. Keine reale Geräteabnahme daraus abgeleitet.
- FAST, deploy und live-acceptance erwartungsgemäß SKIPPED. Informativer Walletaudit vom Dateidelta nicht ausgelöst. **0 Reruns, 0 Korrekturläufe, keine weiteren Produktänderungen.**
- Alle sechs neuen Original-ZIPs und sechs exakten Plugin-Joblogs gesichert; GitHub-Größe/Digest/ZIP-CRC PASS. Privates CI-Archiv 211415299 Bytes/SHA256 `e16008f67ed59fbf51a8a098fa8683027ce75986624aaf850a4d369c73f32972`, Version0 gepinnt bytegleich rückgelesen; 200 Manifestdateien restauriert und hashgeprüft. Native Originale bleiben separat wie oben gesichert.

PR bleibt ausdrücklich für Jochens Review offen. **Kein Merge, Auto-Merge oder Deployment autorisiert.** Keine zusätzliche Person oder unabhängige Freigabe wird hier als bereits erfolgt behauptet.

[Ausführliches fachliches Review](https://github.com/joke0071/foliolab-open/blob/6410d003650987b254799ee8c6cb5616f043f905/docs/K4_REVIEW_2026-11-14.md) (dessen damals offenes Achtfallgate ist durch den oben verlinkten neuen Nachweis geschlossen).
