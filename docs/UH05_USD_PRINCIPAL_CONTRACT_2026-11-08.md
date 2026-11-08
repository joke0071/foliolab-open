# UH05: einzelner nativer USD-Hauptbetrag zwischen Spot und Earn

Status: **Einzelfachvertrag und Charakterisierung gesichert; Produktpatch noch nicht freigegeben.** Unverändertes Main `dc017c6807be85b9e1ce95dd422cf88ae221d0ef`, Tree `887661b67172255deff9e461cb390a0d96f49f1b`, v298 LIVE_ACCEPTED. Owner `8cb2927f295c`. Keine neue Produktimplementierung, Migration oder Releaseabnahme. UH05 bleibt PARTIAL.

## Genau ein belegter Rollenfall

Aus der erhaltenen privaten Raw-CSV-/Decimal100-Inventur wurde genau eine vollständige native Referenz mit zwei USD-Fiatzeilen ausgewählt: Hauptbetrag vom eigenen Spot-Bereich in den eigenen Earn-Bereich, gleiche Zeit, identische native Währung, entgegengesetzte exakt gleiche Hauptbeträge und ausdrücklich belegte Nullgebühren. Es ist keine FX-Ausführung und kein Ertrag. Die vollständige Referenz im Gesamtexport, sämtliche Quellfelder und beide nativen Vor-/Nachbestände wurden unabhängig erneut geprüft. Keine Auswahl nur eines USD-Teils aus einer größeren Referenz.

Originalreferenz, Zeilenkennungen, Zeit und persönliche Beträge bleiben ausschließlich privat. Der private Einstieg und die vollständigen Prüfrezept-/Sollwertdateien stehen im neuesten Checkpoint und im Fortsetzungs-STATE. Die bedingten Quellenanfänge belegen Rechenbedingungen, keine tatsächliche Nutzeranfangsfreigabe.

## Verbindlicher monetärer Vertrag

| Bereich | Erforderliches Ergebnis für diesen Fall |
| --- | --- |
| Herkunft und Mitgliedschaft | Unveränderte Quellbytes/-hashes, native Referenz und exakte vollständige Zeilenmenge; keine Änderung bestehender Quellenidentitätsschlüssel. Jede Feldänderung, Überschneidung, Duplikation oder Teilmenge bleibt Konflikt. Zeilenreihenfolge allein ändert die Wirkung nicht. |
| Rollen | Zwei ausdrücklich bestätigte eigene Kontobereiche: Spot als Ausgang, Earn als Eingang. Beide native USD-Fiat-Cashpositionen, getrennte Konten beim passenden Anbieter. Keine Umdeutung gleichnamiger EUR-Kryptopositionen, keine automatische Kontozusammenführung. |
| Native Mengen | Je Stream exakt `nach = vor + Hauptbetrag - Gebühr` mit unabhängigen Decimal100-Sollwerten. USD-Abgang und USD-Zugang gleichen sich exakt aus. Native Menge nicht aus gerundetem EUR-Wert zurückrechnen. |
| Gebühren und Steuern | Nullgebühr gilt hier ausschließlich, weil beide Originalgebühren ausdrücklich null sind. Fehlend/leer/UNKNOWN oder ungleich null fällt aus diesem Vertrag. Keine erfundene Steuerinformation oder Null-Steuerfreigabe. |
| EUR-Werte | Historischer EUR-Wechselkurs und aktueller EUR-Wechselkurs sind getrennte Nachweise. Fehlen sie, bleiben die jeweiligen Brutto-EUR-Werte UNKNOWN. Aktueller Kurs, Default1 und USD-Bewertungsspalten der Quelle sind kein historischer EUR-Nachweis. |
| Journal | Native Gegenbewegungen und bewiesene Neutralität je USD-Stream erhalten. Der monetäre Nettoeffekt des internen Hauptbetrags ist exakt null; daraus folgt kein bekannter Brutto-EUR-Transferwert. Ein technischer Nullbetrag darf UNKNOWN nicht verdecken. |
| Kostenbasis und Ergebnis | Keine neue Kostenbasis oder Realisierung durch die Umbuchung. Unbelegte Basis bleibt UNKNOWN; eine vorhandene belegte Basis wäre separat auf Erhalt und Eigentumsanteil zu prüfen. Der hier gewählte Fall erteilt dafür keine neue Freigabe. |
| Externe Flüsse | Kein externer Geldfluss, keine Einzahlung/Auszahlung, kein Ertrag. Nicht als zwei externe Geldbewegungen oder Reward simulieren. |
| Aktuelle Bewertung | Nichtnull-USD-Bestand ohne aktuellen EUR-Kurs erhält keine vollständige EUR-Gesamtsumme. Bekannte Teilsumme und Bewertungsabdeckung müssen sichtbar getrennt sein. Ein tatsächlich belegter Nullbestand darf exakt EUR0 sein. |
| Historie | Mengen nur ab zulässiger datierter Eröffnung und vollständigem Journal darstellen. Undatierte nichtnull-Quellenanfänge nicht rückextrapolieren. Nichtnull-Menge ohne datierten historischen FX bleibt monetär UNKNOWN. Keine heutige Bewertung in historische Daten schreiben. |
| Atomarität | Vollständige Gruppe gemeinsam übernehmen oder vollständig zurückweisen. Bei Ablehnung Quelle, Modellbytes, Journal, Revision und Persistenz unverändert. Keine Teilwirkung neben einer gesperrten Auswahl. |
| Replay und Rücknahme | Bestehende vollständige Origin-/Payload-/Mitgliedschafts-/Zuordnungs-/Ownership-/Journalprüfungen erhalten; Altgruppen-Replay ohne neue Wirkung, Undo und dokumentarische Rücknahme bleiben verbindlich. |
| Backup/Restore | Native Mengen, Rollen, Belege, Basis-UNKNOWN und monetäre UNKNOWN-Semantik müssen in vollständigem v5-Backup und verschlüsseltem FreshRestore erhalten bleiben. Keine automatische Reparatur historischer Altpositionen oder Schema-Migration. |

## Tatsächlich ausgeführte Prüfung am unveränderten Kern

Die abgetrennte Charakterisierung umfasst **15 Prüfgruppen**. Die unabhängige synthetische Vertragsmatrix umfasst **17 Fälle** einschließlich vollständiger/vertauschter Reihenfolge und fehlender, überlappender, duplizierter oder manipulierter Mitgliedschaft, fremder Referenz, falscher Währung/Walletrolle, Reward-Verwechslung, fehlender/unbekannter/nichtnull Gebühr und USD-Teilmenge einer größeren Quellreferenz. Diese Matrix ist eine lesende Spezifikationsprüfung, keine neue Importimplementierung.

Ein vollständig erfundener Kontrollfall mit separat erfundenem historischem und aktuellem FX durchläuft den bestehenden `transfer`-Kern: exakte native 18-Dezimal-Mengen, ausgeglichenes Journal, keine externen Flüsse, unverändert unbekannte Basis, historische Mengen und explizit fehlende historische EUR-Werte. Klar datierte synthetische FX-Fixtures zeigen separat den bewerteten Kontrollpfad; sie sind keine realen Kursbelege. Plain-v5-Backup und verschlüsseltes vollständiges Backup wurden tatsächlich wieder eingelesen; verschlüsseltes Restore zusätzlich in einem frischen Node-Prozess. Der rechtmäßige v5-Testzustand verwendet die bereits bestehende leere `flatexNetRemovals`-Sammlung, keine erfundene Abrechnung.

Zusätzlich **15 vorhandene Transaktions-/Backup-Tests ohne Fehler oder Skips**. Alle 71 für diese Charakterisierung bezogenen Main-Dateien wurden exakt gegen Gitblobhashes geprüft. Keine tatsächliche Nutzer-Datenbank, kein kanonischer IndexedDB-Datensatz, kein CAS-Schreibzugriff, keine CI, Browser- oder Produktionsabnahme für eine neue Umsetzung.

## Vier konkrete Grenzen vor einem Produktpatch

1. **Historischer FX-Nachweis:** `executeTransaction` verlangt für USD einen numerischen historischen FX, akzeptiert technisch aber auch eine Zahl ohne Quellen-/Datumsnachweis. Die künftige Importzulassung muss einen passenden unabhängigen Nachweis prüfen und darf aktuelle/default Werte nicht einsetzen.
2. **Aktuelle UNKNOWN-Bewertung:** `createPosition` setzt fehlenden/null FX auf den historischen Standard1; die aktuelle Aggregatdarstellung erkennt fehlende Preise, aber fehlenden Cash-FX dadurch nicht als unbekannten Gesamtwert. Die bestehende automatische Snapshotprüfung markiert solche Werte zwar PARTIAL; die numerischen Leser bleiben dennoch numerisch. Das ist eine charakterisierte bestehende Grenze, keine neue Regression.
3. **UNKNOWN bei Restore:** Null-FX wird im bestehenden v5-`safeImport/createPosition` wieder zu1. Ein einzelner neuer Positionswert oder eine gelockerte Zulassung würde deshalb keinen verlustfreien UNKNOWN-Vertrag ergeben.
4. **UNKNOWN im Journal:** Interne USD-`transfer`-Buchungen ohne historischen FX werden korrekt abgewiesen; Journalpostings verlangen `amountBookEURExact`. Nullable Brutto-EUR-Werte sind auf diesem Weg nicht repräsentiert. Ein ausgeglichener Nullersatz wäre keine vollständige monetäre Lösung.

**Deshalb ist die Produktzulassung dieses Originalfalls weiterhin gesperrt.** Weder `position()` noch der v298-Fiatguard werden gelockert. Es wird kein fremdes Fiat unterstützt behauptet und keine historische FX-/EUR-Kostenbasis erfunden.

## Genau nächster serieller Schritt

Für denselben Fall zuerst die kleinste mit den bestehenden Verträgen vereinbare explizite UNKNOWN-Darstellung über Position, Buchung/Journal, aktuelle Aggregat-/Snapshotleser und v5-Restore festlegen und im abgetrennten Modell gemeinsam nachweisen. Dabei bestehende Altportfolios unverändert behandeln und keine neue Finanzengine, Migration oder automatische Reparatur einführen. Vor einer pauschalen Aussage über fehlende reale Kursbelege gezielt die bereits erhaltenen einschlägigen Privatpakete prüfen. Dieser Befund betrifft die technische Repräsentation und ist keine globale Belegmangelaussage.

Erst danach darf ein begrenzter Produktkandidat entstehen; dafür bleiben vollständige gemeinsame Import-/Nichtmutations-/Legacy-/Undo-/Rücknahme-, Quota-/Post-put-, echter Zweitab-CAS-, Offline- und verschlüsselter FreshRestore-Ablauf sowie Chromium/Firefox/WebKit mit bestehenden Axe-/Releasegates zwingend. Diese neuen Produktprüfungen sind noch nicht erfolgt.

DKB außerhalb; fehlende Wallet-/Stakingwerte UNKNOWN; alle zehn UI300-Nachträge, QUALITY298, CI229, Android/PWA und gesamte Roadmap erhalten. GitHub ausschließlich Plugin; keine CI duplizieren/abbrechen; Checkpointbranch niemals vollständig nach Main mergen.
