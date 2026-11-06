# UH05 – genau zwei EUR-Ausführungen, ein Cashbeleg

Der bestehende Nettoplaner bietet zusätzlich genau zwei eigenständige, bankreferenzierte EUR-Ausführungen derselben Order und genau einen EUR-Cashbeleg an. Die alte dokumentarische Orderdiagnose bleibt `multiple-depot-review`; nur der engere Nettoplaner qualifiziert die vollständige 2:1-Gruppe. Keine allgemeine N:M- oder FX-Freigabe.

Quelle/Depot/Konto, Order, ISIN, Richtung, exakter Buchtag und Valuta müssen übereinstimmen. Beide Ausführungen müssen denselben Depotquellbereich haben; beide eigenen Konten sind aktuell ausdrücklich zu bestätigen. Fehlende, widersprüchliche, stornierte oder zusätzliche Gegenbelege sperren die Gruppe. Gleiche Beträge verschiedener Bankidentitäten bleiben zwei Ausführungen. Identische Exportvorkommen werden vor der Gruppierung nur nach gleicher Identität und exakter Payload zusammengeführt; weitere Originalvorkommen können anschließend als reine Evidenzerweiterung ergänzt werden.

## Bestehender Transaktions- und Journalkern

Die Gruppe erhält einen versionierten `netSettlement`-Beleg Version 2 und drei Mitglieder: zwei eigenständige Kauf-/Verkaufsbuchungen und eine gemeinsame Geldbewegung. Alle drei werden über `executeTransaction` im abgetrennten Entwurf erzeugt. Die Ausführungen behalten jeweils Menge, Kurs, Bruttowert und Quellidentität. Ihre bestehenden Asset-/Clearingpostings werden erhalten. Die gemeinsame Geldbewegung enthält genau ein Cashposting, die Verrechnung des gesamten Bruttowerts und eine ausdrücklich ungeklärte Gruppendifferenz. Sie ist kein externer Kapitalfluss. Es gibt keine Verteilung von Nettocash, Gebühren, Steuern oder Kostenbasis auf Ausführungen. Gerundete Produkte unterhalb der bestehenden Decimalpräzision werden abgewiesen.

Die vorhandene v5-/Backupvalidierung verlangt alle drei Mitglieder und prüft ihre Quellen, Felder, Journalpostings und unveränderte Importherkunft erneut. Ältere Nettovalidatoren lehnen Belegversion 2 ab. Bereits vorhandene Teilmengen, ungeschützte Fremdbuchungen, gleiche oder spätere Historien, geschützte Kosten und bestehende Referenzstände werden nicht überschrieben. Chronologisch spätere vollständige Gruppen können an eine unveränderte frühere Nettokette angehängt werden. Historischer Endbestandsersatz, datierte Rückwärtsrekonstruktion, nachträgliche Cashergänzung und dauerhafte wirtschaftliche Gruppenrücknahme sind für diese neue Belegversion gesperrt; vollständiges Sitzungs-Undo und geprüfter verschlüsselter Restore bleiben verfügbar.

## Gemeinsamer Import

Vorhandener Importmodus „EUR-Paare mit belegtem Anfangsbestand“, Auswahl der vollständigen Gruppe, beide Quellzuordnungen, datierter unabhängig belegter Anfang und ausdrückliche Gesamtabnahme. Vorschau zeigt zwei Ausführungen sowie den einen gemeinsamen Cashbeleg getrennt. Quellen-/Auswahländerung verwirft Freigaben. Bestehende gemeinsame Speicherung führt genau einen CAS-Commit aus. Keine zweite Import- oder Finanzengine und kein einzelner Teilspeicherschritt.

## Nachweise und Grenzen

Historische 18-Fall-Diagnose auf v288 unverändert wiederverwendet; Kandidatenrepro `docs/repros/UH05_TWO_FILL_BOUNDARY_2026-11-06.mjs` ändert ausschließlich den neuen 2:1-Erwartungswert. Zusätzliche Integer-/unabhängige Python-Decimal-Kontrollen, Negativtests, Mitgliedermanipulation, gleiche echte Ausführungen, Dokumentüberlappung, Replay und Backup/Restore.

Der reale gemeinsame Browserablauf prüft einen CAS, Quota und Abbruch nach `put`, exaktes Undo, Wiederimport, Offline-Reload, verschlüsselten Restore im frischen Profil, echten Zweittab-Konflikt, fünf Mobilbreiten, Axe und keine externen Providerrequests. Bestehende private 1:1-Originalregressionen bleiben erhalten. Die zwölf gesicherten Originaldateien enthalten beide technischen Formatkombinationen (12/10 und 13/8 Spalten), jedoch keinen freigabefähigen 2:1-Fall. Die 2:1-Fachnachweise sind ausdrücklich synthetisch; weder Authentizität/Vollständigkeit einer privaten Historie noch offizielle Exportversionen oder extraETF-Herkunft sind daraus bewiesen.

UH04/UH05 insgesamt bleiben PARTIAL; FX, weitere N:M-, historische Referenz-, Wallet- und Stakingabdeckung folgen separat. Fehlendes bleibt UNKNOWN, niemals Null. UI300 mit allen Nachträgen, QUALITY298, CI229 und Android-Performance unverändert erhalten.
