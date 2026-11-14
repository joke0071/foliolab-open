# Vorbereiteter Produkt-PR – noch nicht eröffnet

**Titel:** Restore von Altbackups exakt erhalten und Übernahmefehler korrekt melden

**Base:** main / 57ba5fd04b3fc870be3b085c1994c79ff50297d7  
**Vorgesehener Head:** dcdb094ac44e7d8ca597398d886a121c9bab23e5  
**Tree:** acd2a876c84055021c22263ac0f8aabdc5a6b4c2  
**Produktbranch:** nicht angelegt. QA-Runner a77486eb… ist kein Bestandteil dieses Produktvergleichs.

## Beschreibung

Datei- und Google-Drive-Restore weisen strukturierte oder boolesche Positionsmengen und Wechselkurse vor der Übernahme ab. Gültige Altbackups behalten ihre exakten Dezimalpreise und lokalisierten Wechselkurse: Zwei Anteile zu123.450000000000000005EUR ergeben weiterhin exakt246.90000000000000001EUR; 2×100USD bei Komma-FX0,9 ergeben180EUR. Fehlendes FX bleibt UNKNOWN und erzeugt keine erfundene EUR-Bewertung. Bestehende Widersprüche zwischen numerischer Anzeige und Exaktwert bleiben prüfbar.

Gewinnt während der Wiederherstellung ein anderer Tab, bleiben dessen Daten gespeichert und sichtbar. Ist das Portfolio bereits übernommen, beschreiben spätere Passwort-/Einstellungs-/Anzeigefehler die erfolgte Übernahme und warnen vor einem erneuten Vollimport.

## Geprüfte Fälle

- Lokal125/125 gezielte Node-Tests,0Fehler/0Skips; Syntax aller Produkt-/Worker-JS-Dateien bestanden. Darunter Typablehnung und gültige Nachbarn v1–v5, alte Preisformen, exakte Mengen, UNKNOWN, Konflikt, Passwort-/Einstellungs-/Renderfehler, Speicher/Wiederöffnung, Verschlüsselung und Cache-Assetabdeckung. Keine vollständige CI behauptet.
- Zwei zuvor reproduzierte Restbefunde korrigiert: Preisrundung ohne priceExact und NaN/Abweisung bei Komma-FX. Jeweils reale registrierte App-Listener/Drive-Buttons und Produktionsstorage mit simuliertem Transport/DOM/IDB im lokalen Vertragstest. Gültiger Widerspruchsnachbar bleibt unbewertet.
- Bestehender nativer Chromiumlauf43588219909/1:14/14 in sieben Datei-/Drive-Paaren, gebunden an den vorherigen Produktstand5db3803509cfd0824dad5dd12532a1168c161e32. Echte App/Kryptografie/IDB, CAS-Tabs und Wiederöffnung; simuliertes OAuth/HTTP, SW blockiert. Kein neuerHead-Nachweis.
- **Offen vor Eröffnung:** vorbereitete native Nachprüfung auf exakt dcdb094…: precise-price, localized-fx, localized-fx-discrepancy und unknown je Datei/Drive; acht Fälle mit exakten gespeicherten Sollwerten und identischen Paarinputs. Noch nicht ausgeführt.

## Kompatibilität und Grenzen

Unterstützte Portfolioformate und bestehende Verschlüsselung bleiben erhalten; v5 setzt weiterhin gültige geschützte Metadaten voraus. Keine Migration, keine Änderung der Installations-/Portfolioidentität, keine neue Syncimplementierung. Datei unterstützt auch direktes unverschlüsseltes Portfolio-JSON; Drive-Restore weiterhin passwortverschlüsselte v2-Pakete. Unverschlüsselte vollständige Konfigurationspakete werden nicht freigegeben.

Exakte Werte folgen dem bestehenden18-Nachkommastellenvertrag. Bereits als JSON-Number gerundete Präzision wird nicht erfunden. Vorhandene numeric/exact-Abweichungen werden nicht automatisch korrigiert. Bei UNKNOWN gibt es keine vollständige EUR-Summe. Fehlerablehnung erhält den alten Record; Konflikte erhalten den neueren Gewinner. Die nativen Paare sind keine echten OAuth-/Windows-/Android-/OS-Abbruch-/Eviction-Nachweise.

CACHE v313→v314 ist enthalten, da geänderte ausgelieferte Module sonst im alten PWA-Cache bleiben und der reguläre Revisionscheck ablehnt. Nur die Cachekennung ändert sich; Assetliste und Workerlogik bleiben erhalten.

## Offene reguläre Gates

Nach bestandener gezielter nativer Nachprüfung und frischem Base-/Kollisionsabgleich: PR gegen aktuellen Main öffnen und alle regulären INTEGRATION-Checks am tatsächlichen Head/Mergetree abwarten. Erforderliche Workflowausführung: plan, kompletter test-Job (Unit/Syntax/Chromium einschließlich PWA/Storage/Finanzen), cross-engine1–3 Firefox/WebKit, Wallet scan checks/tests. Der informative Wallet-Liveaudit passt nicht zum aktuellen Dateidelta und wird dafür nicht eigens ausgelöst. FAST ist keine Qualifikation für dieses Delta.

Dieser Text ist ein reviewbarer Entwurf, keine Merge-/Releasefreigabe. Kein PR, Actionslauf, Merge oder Deployment wurde für ihn ausgelöst. Main/Live-Abnahme und Originalsicherung bleiben spätere getrennte Gates; K4 insgesamt PARTIAL, K3 und FLH04 getrennt.

Review und Sollwertmatrix: docs/K4_REVIEW_2026-11-14.md. Reproduktions-/Korrekturbelege: docs/release-evidence/k4-review-2026-11-14/.
