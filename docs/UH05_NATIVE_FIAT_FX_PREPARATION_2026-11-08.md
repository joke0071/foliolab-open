# UH05: native Fiat- und FX-Rollen nach v298

Status: fachliche Vorbereitung auf unverändertem v298 Main. Keine neue Finanzimplementierung, Migration oder Importfreigabe. UH05 bleibt PARTIAL. v298 ist LIVE_ACCEPTED und wird nicht erneut abgenommen.

## Geprüfter Ausgangspunkt

Main `dc017c6807be85b9e1ce95dd422cf88ae221d0ef`, Tree `887661b67172255deff9e461cb390a0d96f49f1b`, SW `foliolab-open-v298`. Der v298-Fiat-Zulassungsschutz und seine Altgruppen-Replay-/Undo-/Rücknahmeverträge bleiben bindend. Die vorhandene private Raw-CSV-/Decimal100-Prüfung wurde auf frisch über das Plugin bezogenen und gegen den Main-Tree geprüften Modulen ausgeführt. Die bekannten Originalfälle bleiben gesperrt und mutieren weder Quelle noch abgetrenntes Modell. Die zusätzliche vollständige Inventur aller nativen Fremdwährungsfiat-Referenzen desselben Kraken-Originalexports ist privat gesichert. Das Ergebnis gilt für diesen belegten Quellumfang, nicht als Zahl sämtlicher offener UH05-Fälle oder real importierbarer Nutzerbuchungen.

## Ereignisrollen getrennt behandeln

| Belegte Rollenform | Nachweis aus vollständiger nativer Referenz | Vor einem künftigen Import zusätzlich zu klären |
| --- | --- | --- |
| Kryptohandel gegen fremdes Fiat | Zwei Hauptbeine und alle Gebührenbeine, native Asset-/Walletrollen und exakte Mengen | Historische EUR-Bewertung, Kostenbasis und Cashabrechnung dürfen nicht aus dem Fremdwährungsbetrag oder aktuellem Kurs erfunden werden |
| Reiner Fiat-Währungswechsel | Zwei verschiedene native Fiatwährungen und sämtliche Gebührenbeine innerhalb derselben Referenz | Expliziter Vertrag für beide Cashwährungen, Journalbewertung, externe Flüsse und unbekannte Gebührenwerte |
| Interne Spot-/Earn-Umbuchung | Je Währung genau ein gleich großer Gegenposten in den erklärten eigenen Walletbereichen, vollständige Referenz und gleicher Zeitpunkt | Jede Währung separat erhalten; eine mehrwährungsfähige Hauptbetragsumbuchung ist kein FX-Handel und kein Ertrag |
| Fremdwährungsfiat-Ausgang | Native Auszahlungsmenge und Gebühr | Eigene Gegenpartei oder ausdrücklich bestätigter externer Bereich; keine Zuordnung über Betrag/Zeit |
| Fremdwährungsfiat-Ertrag | Native Ertragsmenge und Rolle | Historischer EUR-Wert und steuerliche Behandlung bleiben bis zu eigenständigen Belegen unbekannt |

Eine Gruppe wird nicht passend gemacht, indem Gebührenzeilen, ein zweites Währungsbein oder ein Walletbereich ausgelassen werden. Native Fremdwährungsfiat-Rollen werden weder Krypto noch Stablecoin. Bestehende EUR-basierte Mengenpositionen werden nicht umgedeutet oder automatisch zusammengeführt.

## Exakter Mengen- und Bewertungsvertrag

1. Herkunft umfasst unveränderte Quellbytes/Hash, native Zeilenkennung, vollständige Referenzmitgliedschaft, sämtliche Felder, Zeit und native Währungs-/Walletrollen. Überschneidung, Reihenfolge, geänderte Payloads und unvollständige Gruppen behalten die vorhandenen Identitäts- und Konfliktregeln. Keine allgemeine Änderung des Quellenidentitätsschlüssels.
2. Unabhängige Sollwerte entstehen aus Raw-CSV und Decimal100, ohne Aufruf von Importer-Arithmetik. Je Zeile gilt der vorhandene Quellenvertrag: bedingter Vorbestand = Nachbestand - Hauptbetrag + Gebühr, Mengendelta = Hauptbetrag - Gebühr. Mengen unterschiedlicher Währungen werden nie addiert oder gegeneinander als Geldwert ausgeglichen. Quellenanfänge sind Rechenbedingungen, keine reale Nutzeranfangsfreigabe.
3. Fiat-Cash benötigt eine ausdrücklich bestätigte passende native Währung und einen passenden Kontobereich. Spot und Earn bleiben getrennt. Ein gleichnamiges EUR-Kryptoobjekt und ein stiller Modellstandardkurs 1 sind keine Währungsbelege. Unbekannte aktuelle oder historische FX-Werte bleiben UNKNOWN, einschließlich Summen-/Abdeckungsdarstellung.
4. Ein belegtes EUR-/Fremdwährungs-Hauptbetragspaar darf als exaktes Verhältnis dieser einen Ausführung dokumentiert werden. Es beweist keinen Kurs für andere Referenzen, Zeitpunkte, Erträge, Gebühreneinheiten oder einen aktuellen Portfoliowert. Native Hauptbeträge bleiben maßgeblich; kein Rundungsrest wird als Gebühr oder Gewinn erfunden.
5. Ein internes Gebührenasset bleibt als exakte Menge in seinem eigenen Stream erhalten. Fehlende EUR-Bewertung wird weder Null noch ein nachträglich angenommener Fiatbetrag. Fehlende Steuern oder Kostenbasis bleiben ungeprüft.
6. Interne Hauptbeträge erzeugen keinen Ertrag, externen Zufluss oder neue Kostenbasis. Ein Währungswechsel innerhalb eigener Bereiche ist nicht mit zwei als extern gebuchten Ein-/Auszahlungen zu simulieren. Vollständige native Gruppen werden atomar übernommen oder vollständig abgewiesen.
7. Gespeicherte Altgruppen behalten die eng begrenzte intern abgeleitete Rekonstruktion und sämtliche Origin-/Payload-/Mitgliedschafts-/Zuordnungs-/Ownership-/Journalprüfungen. Keine Migrations- oder Reparaturausnahme, keine neue Wirkung durch Replay. Undo und dokumentarische Rücknahme bleiben geschützt.

## Technische Grenze des aktuellen Main

Der Kraken-Importer lässt manuelle EUR-Positionen zu und erzeugt dafür EUR-basierte Aktionen. Einfach die Fiat-Zulassungsprüfung oder `position()` zu lockern reicht nicht. Der bestehende interne `transfer` verlangt dieselbe Währung und dasselbe Asset; `swap` lehnt Cashpositionen ab. Geldbuchungen verwenden belegte historische FX-Werte und EUR-Journalbeträge. Diese Eigenschaften werden hier dokumentiert und bleiben unverändert.

Vor einem Produktpatch muss deshalb ein einzelner gewählter Rollenfall nachweisen, wie exakte native Mengen und bekannte bzw. unbekannte EUR-Werte durch bestehende Transaktionen, Journal, Bewertung, Historie, Kostenbasis, externe Flüsse und vollständiges v5-Backup/Restore getragen werden. Keine neue Finanzengine oder pauschale FX-Freigabe. Eine reale Mengenbeobachtung allein beweist noch keine vollständige monetäre Buchung. Dieser Vorbereitungsschritt erklärt keinen globalen Belegmangel; der exakte Referenzabgleich anderer Original-CSV ist nur eine begrenzte Suche und ersetzt keine weiteren vorhandenen Gegenbelege.

## Vorbedingungen für einen späteren Produktkandidaten

Zuerst den kleinsten belegten Rollenfall und seine vollständige monetäre Behandlung auswählen und prüfen. Die exakten privaten Sollwerte und tatsächliche Feldbedeutung sind die fachliche Grundlage. Öffentliche Fixtures enthalten ausschließlich erfundene Kennungen, Zeitpunkte und Beträge mit denselben Rollenformen. Originaldaten werden nicht veröffentlicht.

Erforderliche Prüfungen betreffen vollständige und veränderte Mitgliedschaft, Überschneidung und Umkehrung, falsche native Währung/Position/Walletrolle, unbekannten historischen FX-/Gebührenwert, gemischte gültige und gesperrte Auswahl ohne Teilcommit, exakte Bestände und Nichtmutation. Dazu kommen erhaltene Legacy-Replay-/Undo-/Rücknahmewege, Quota-/Post-put-Rollback, echter Zweitab-CAS, Offline-Reload, verschlüsseltes Backup und Restore sowie die gemeinsame Oberfläche in Chromium/Firefox/WebKit mit unverändertem Axe-Umfang. Diese Prüfungen sind Anforderungen an einen späteren Kandidaten und wurden für keine neue FX-Implementierung behauptet.

DKB bleibt außerhalb; externe Finanzierung ist kein Gewinn. Fehlende Wallets/Staking bleiben UNKNOWN. Alle zehn UI300-Nachträge, QUALITY298, CI229, echte Android-/PWA-Gerätetests und die gesamte übrige Roadmap bleiben erhalten. GitHub nur Plugin; keine CI duplizieren/abbrechen; Checkpointbranch niemals vollständig nach Main mergen.
