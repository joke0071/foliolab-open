# UH05 – gesicherte Valutagrenze nach v294

## Stand und genaue Eingrenzung

v294 ist tatsächlich LIVE_ACCEPTED: Main13b6e2b5e7d10f250ea4c0b76bfa9a182b668db0/Treec1e1bd3290ecf687bf6c6aaac742ea9489529ee2. [Vollständige Abnahme](release-evidence/v294-pr314-live-acceptance.json). Nicht erneut abnehmen.

Der bestehende unabhängige Originalaudit umfasst357 positive Gutschriften,300 dokumentarische Kandidaten und57 offene Gruppen. Die57 wurden nun aus den unveränderten CSV-Originalzeilen erneut mit unabhängigem Python-Decimal-Code geprüft. Sämtliche vorhandenen exakten Mengen/Kurse/Brutto-/Cash-/Differenzwerte und Originalbuch-/Valutadaten stimmen mit dem bisherigen Oracle überein.

Alle57 offenen Gruppen scheitern genau an sameValueDate; ihre elf übrigen dokumentarischen Kriterien sind erfüllt. Es sind insgesamt zwölf Kriterien, nicht zwölf weitere. Der vorangegangene Arbeitskommentar mit „zwölf weiteren“ war ein Zählfehler; die zugrunde liegenden Originalbelege und Prüfungen waren unverändert korrekt.56 Finanzierungen sind nach dem Kauf gebucht, eine am selben Buchtag. Diese Eingrenzung beweist keine externe Eigentümerrolle.

Der exakte aktuelle v294-Inspektor wurde rein lesend gegen beide Original-Dateireihenfolgen ausgeführt: jeweils300 Angebote mit identischen IDs, sämtliche57 Valutagruppen weiterhin sicher ausgeschlossen, Quellobjekte unverändert. Keine Appänderung, kein Nutzerimport und kein neuer CI-Lauf.

## Reproduzierbare private Grundlage

Private Fortsetzung delta-14118750c7bb-r2/uh05-value-date-groundwork enthält:

- build_value_date_oracles.py: unabhängige erneute CSV-/Decimal-Prüfung mit Hashbindung an die beiden vorhandenen Originaldateien, ohne Produktimporte.
- value-date-oracles-private.json:57 einzelne exakte Sollfälle mit beiden Buch- und Valutadaten, Cashpfaden, Mengen, externem Fluss nur unter individuell bestätigter Rolle und weiterhin unbekannten Gebühren/Steuern/Kostenbasen.
- probe_current_inspector.mjs/current-inspector-private.json: tatsächlicher v294-Inspektor, beide Dateireihenfolgen,300 Angebote/57 Ausschlüsse, unveränderte Quellen.
- value-date-groundwork-private.json: private Aggregat-/Quell-/Gitbloblocators.

Die dort berechnete Mindestliquidität ist ausdrücklich nur eine mathematische Testvoraussetzung. Sie ist kein tatsächlicher Nutzeranfangsbestand und darf nicht als solcher übernommen werden. Keine Originalwerte/Identitäten/Referenzen oder Quellhashlocators auf GitHub übertragen.

## Aktueller Produktvertrag

src/flatex-net-settlement.js, fundingProof, fordert ausdrücklich row.dates.valueDate===settlement.valueDate. validateFlatexFundingProof rekonstruiert den vollständigen gespeicherten Beweis und vergleicht ihn strikt. Aktuell fundingProof.version1. Die Finanzierung besitzt bereits ihr eigenes valueDate-Feld neben settlement.valueDate; beide Originaldaten dürfen bei einer Erweiterung niemals angeglichen oder überschrieben werden.

Der vorhandene Journal-/Cashpfad richtet sich nach den Originalbuchtagen. Unterschiedliche Valuta sind eine gesonderte Beweis-/Readervertragsfrage und kein Anlass, Journalereignisse umzudatieren, Bestände zu erfinden oder negative Cashchronologie freizugeben. Allgemeine native Bank-/CSV-Identität, Quellenpayload, Vollständigkeit und Eigentumsschutz bleiben unverändert.


**Zusätzliche echte Produktgrenze:** fundingProof fordert außerdem row.dates.bookingDate<=settlement.valueDate. Bei allen57 Originalfällen liegt der Finanzierungsbuchtag nach der Order-Valuta; sie verletzen deshalb beide Produktbedingungen. Das alte Auditmerkmal fundingNotAfterValue vergleicht den Finanzierungsbuchtag mit der eigenen Finanzierungsvaluta und ist hier weiterhin erfüllt. Bei identischen Valuten waren diese beiden Vergleiche äquivalent; für die57 verschiedenen Valuten sind sie getrennt zu behandeln. Der neue private Oracle führt sharedValueDate und fundingBookNotAfterTradeValue ausdrücklich als zwei getrennte, jeweils57-mal falsche Produktguards. Eine bloße Lockerung der Valutagleichheit würde die57 deshalb weiterhin zurückweisen und klärt den fachlichen Vertrag nicht.

## Nächster begrenzter Umsetzungsschritt

Zuerst einen engen gespeicherten Vertrag für verschiedene Originalvaluten und Finanzierung nach der Order-Valuta mit den nun vorhandenen57 unabhängigen Sollfällen und synthetischen Negativfällen festlegen. Kein bloßes Entfernen des Vergleichs oder verändertes Datumsfeld im bestehenden V1-Vertrag.

Vollständige Quellen-/Referenz-/Währungs-/Mengen-/Rollensperren, Dubletten-/Overlap-/Payload-/Kontozuordnungsfälle und exakte Tagescash-/Bestands-/Flussoracles prüfen. Individuelle aktuelle externe Rolle und unabhängig belegte Anfangsbestände bleiben erforderlich. Bekannte Kostenbasen/Referenzen und bereits bestehende Historie behalten ihre Sperren; keine Differenz als Gebühr/Steuer/FX/Kostenbasis deuten.

Eine neue Vertragsvariante muss gewöhnliche alte Daten weiterhin lesen und durch den tatsächlichen alten v294-Reader sicher abgewiesen werden. Den bestehenden gemeinsamen Import-/Journal-/CAS-/Undo-/Restorepfad erweitern, keine zweite Finanzengine oder pauschale357-Rolle. Dann sinnvolle gezielte Units und reale Browser-/Finanz-/CAS-/Quota-/Undo-/Replay-/Offline-/verschlüsselteFreshRestore-/Mehrtabgates in allen drei Engines und reguläre Releasekette auf einem isolierten Main-basierten Kandidaten. Keine bestehende CI duplizieren/abbrechen; Checkpointbranch niemals vollständig nach Main.

DKB-Girokonto bleibt außerhalb. Alle weiteren N:M-/FX-/Referenz-/Kostenbasis-/Wallet-/Staking-/Buchungsaufträge und UI300 mit zehn Designnachträgen/QUALITY298/CI229/Android/PWA/Schutzverträge bleiben erhalten.
