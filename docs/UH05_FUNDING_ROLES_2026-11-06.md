# Aktueller Nachtrag 07.11.2026 – enger externer Finanzierungsablauf v293 LIVE_ACCEPTED

Der hier vorbereitete enge Finanzierungsvertrag ist mit PR312 produktiv umgesetzt und tatsächlich in Chromium/Firefox/WebKit abgenommen: Main65405435d79e2cd102f18aa7a0d1c2bff8ae3896, Tree10db823ab52976384b6be2febbb9e01412659c3e. [Vollständiger Livebeleg](release-evidence/v293-pr312-live-acceptance.json) / [Umsetzungs- und Chronologievertrag auf exaktem Main](https://github.com/joke0071/foliolab-open/blob/65405435d79e2cd102f18aa7a0d1c2bff8ae3896/docs/UH05_EXTERNAL_FUNDING.md).

Im gemeinsamen CSV-Import den Modus „Sparplankauf mit externer Finanzierung“ auswählen. Ein bestehender V1-EUR-Kauf samt Orderbelastung und eine eindeutig zugehörige positive Finanzierung erhalten einen separaten versionierten Rollen-/Mitglieder-/Quellenvertrag. Jede ausgewählte Gruppe erfordert eine eigene aktuelle externe Bestätigung; das Girokonto bleibt außerhalb. Der bestehende CSV-/Journal-/CAS-Kern erzeugt Kauf und Einzahlung, beide Cashbewegungen und genau einen externen Kapitalfluss. Keine zweite Finanzengine, keine Umdeutung der V1/V2/V3-Belege oder Bankidentitätsschlüssel, keine pauschale Rolle für357historische Gutschriften.

Originalbuchtag und Valuta bleiben getrennt. Eine spätere Finanzierung deckt keinen früheren negativen Cashbestand: unabhängig belegte datierte Anfangsbestände bleiben Pflicht und werden auch beim Restore geprüft. Keine erfundenen Eröffnungen oder Datumsverschiebungen. Differenzen/Kosten/Steuern bleiben ungeklärt. Bestehende Einzelbeine, widersprechende Referenzstände und nicht qualifizierte Historien bleiben geschützt; dies ist keine pauschale Backfill-/Vollhistorienfreigabe. Vollständiges Sitzungs-Undo, Wiederimport/Overlap, Rollen-/Kontowiderrufe, Quota/post-put, echter Zweittab, Offline und verschlüsselter FreshRestore sind auf Produktion in allen3EnginesPASS.

Alle vier Originalgruppen/zwölf Zeilen wurden privat mit dem neuen Kern in beiden Dateireihenfolgen gegen die vorhandenen unabhängigen Sollwerte geprüft. Nur kontrollierte synthetische Eröffnungen dienten der Codeprüfung; kein tatsächlicher Nutzeranfangs-/Portfolioimportbeleg. Originalquellen bleiben vollständig vorhanden und unverändert; nicht erneut anfordern. Die tatsächlichen v292-Leser lehnen den neuen gespeicherten Vertrag ab; gewöhnliche bisherige v3/v5-Daten bleiben lesbar. Aktuelle kompatible Implementierung für den neuen Vertrag ist v293. Alle übrigen Aufträge und Schutzverträge bleiben erhalten.

Die folgenden Abschnitte dokumentieren frühere Arbeitsstände und werden für den oben abgegrenzten Umsetzungsschnitt durch diesen Nachtrag übersteuert.

---

# UH05 – belegte Gutschrift und Orderbelastung getrennt erhalten

Basis: v292 LIVE_ACCEPTED, Main `2ca2e03ca1ba203f587f79444fdb43fc4ea62b36`, Tree `129c9cac1391f7a306087395c6fc42a01e8d0d4b`. Keine neue Produktfreigabe und keine erneute Releaseabnahme.

## Aktueller Nachtrag: vollständige native Quellen liegen vor

Der Nutzer hat die fehlenden nativen Depot- und Konto-CSVs geliefert. Die bisherigen Quellenlücken sind für die vier gezeigten Sparpläne geschlossen: vier Depotausführungen und acht getrennte Finanzierung-/Settlementkontobewegungen, alle Quellkurse und Quellenidentitäten vorhanden. Unabhängiger Python-Decimaloracle sowie unveränderter Main-Nettoplaner bestätigen alle vier Orderprüfbelege und jeweils fünf exakte Finanzwerte in beiden Dokumentreihenfolgen; IDs stabil, Quellen bytegleich. Keine erneute Originalanforderung.

Die vier Finanzierungsgutschriften sind damit für einen engen explizit extern bestätigten Finanzierungsfall belegt. Der bisherige Nettoplaner übernimmt sie noch nicht. Keine neue Produktfähigkeit oder Nutzerportfolioabnahme behaupten. Die unterschiedliche Buch-/Valutachronologie muss bei der Implementierung ausdrücklich mit dem bestehenden Eröffnungs-/Cash-/Journalvertrag vereinbar bleiben. Keine erfundenen Anfangsbestände oder stille Datumsverschiebung.

[Verbindliche vollständige Übergabe und nächster Umsetzungsschnitt](HANDOVER_5ee91c771f2c_2026-11-07.md). Die nachfolgenden früheren Quellenlücken sind historische Arbeitsstände und werden durch diesen Nachtrag übersteuert.

## Historischer Nachtrag: Finanzierungsrolle bestätigt, konkrete Originalzeilen fehlten

Der Nutzer bestätigt für den neu privat gezeigten Sparplanfall: Die Finanzierung wird per SEPA-Lastschrift vom eigenen Girokonto eingezogen. Dieses Konto liegt ausdrücklich außerhalb des verwalteten Portfolios und wird nicht in FolioLab angelegt. Die Flatex-Gutschrift ist damit ein externer Kapitalzufluss; der Wertpapierkauf bleibt eine interne Umschichtung. Einzahlung ist kein Gewinn und keine Rendite. Diese Erklärung gilt für den gezeigten Fall und ist keine pauschale Rollenfreigabe sämtlicher historischer Kauf-Gutschriften.

Die ersten Originalbilder wurden vollständig privat gesichtet. Zwei zusätzliche vollständiger sichtbare Konto-/Depotbilder erweitern den Befund: alle vier Gutschriften sind über ISIN und Orderreferenz ihren getrennten Cash-Settlementzeilen zugeordnet; drei haben zusätzlich passende Depotausführungen mit sichtbarer Menge und Depotbetrag. Die vierte Depotausführung liegt außerhalb des neuen Depotausschnitts. Ihre Cashbelastung wurde einen Tag früher gebucht als die übrigen sichtbaren Käufe; der benötigte Originalexportzeitraum muss diesen früheren Buchtag ausdrücklich einschließen. Exakte Ausführungskurse und vollständige native CSV-Payloads fehlen weiterhin. Eine sichtbare Depot-/Cashdifferenz bleibt ungeklärt, keine Gebühren-/Steuerzuordnung. Buchtag und Valuta werden getrennt erhalten.

Die vorhandenen größeren Depot-/Konto-CSVs enthalten den neuen Screenshotzeitraum nicht; auch die konkreten sichtbaren Orderreferenzen fehlen dort. Weitere erhaltene Dialektexporte wurden ebenfalls auf den Zeitraum geprüft. Daher ist die Finanzierungsrolle geklärt, die vollständige Importquelle für diesen konkreten Fall aber noch nicht vorhanden. Benötigt werden die nativen Flatex-Depot- und Kontoumsatzzeilen des privat dokumentierten Zeitraums, einschließlich aller Finanzierungs- und Ausführungszeilen. Ein weiterer Export des externen Girokontos ist dafür nicht nötig. Keine CSV aus Screenshotfragmenten konstruieren, keine Mengen/Kurse/Anfangsbestände ergänzen.

Bis zu diesen Quellen keine Produktimplementierung, CI oder Produktionsabnahme des neuen Falls. Die beiden Bilder und ihr privater Referenzabgleich werden erst in der nächsten Sicherung nachV73 ergänzt; keine rückwirkende V73-Aufnahme behaupten. Persönliche Daten, Originalbeträge, Identitäten, Bilder und Bildhashes verbleiben privat.

## Konkreter neuer Quellenbefund

Die vollständig bereitgestellten größeren Depot-/Kontoexporte wurden privat bytegesichert und unabhängig mit Python CSV/Decimal gelesen. Alle 401 belegten Orderpaare haben genau eine Ausführung und eine Order-Cashbuchung; Buchtag und Valuta stimmen jeweils überein. Der unveränderte Main-Nettoplaner bietet dieselben 401 Version1-Gruppen in beiden Dokumentreihenfolgen mit stabilen IDs an. Alle fünf exakten Mengen-/Preis-/Brutto-/Cash-/Differenzwerte je Paar stimmen mit dem unabhängigen Oracle überein. Quellen bleiben bytegleich; keine Modell-/Journal-/IDB-Übernahme oder Vollhistorienabnahme.

Zusätzlich enthalten die Kontodaten 357 positive Gutschriften mit Kauf-/ISIN-/Orderverweis, eigener Bankreferenz und befüllten Gegenbankfeldern. Jede hat genau eine passende Ausführung/Orderbelastung im selben nativen Kontobereich und gleicht deren Cashbetrag exakt aus. Die bestehenden Orderprüfbelege übernehmen diese Gutschriften nicht als zweites Settlementbein. Die frühere 500-Zeilen-Diagnose war nur ein Ausschnitt; ihr fehlender Mehrcashbefund darf nicht auf diese größeren Dateien verallgemeinert werden.

Der Befund belegt die getrennten Kontobewegungen und ihre Referenzen. Er beweist weder Kontoeigentum noch die Portfolioabgrenzung des Gegenkontos. Exporterprovenienz wird weiterhin nicht aus dem technischen 12/10-Schema abgeleitet. Private Beträge, ISINs, Bank-/Order-/Kontoidentitäten, Zeilen und Hashlocators verbleiben ausschließlich in der privaten Sicherung.

## Enger wirtschaftlicher Vertrag vor Implementierung

Ziel ist ein expliziter Finanzierungsvorgang neben dem bestehenden Order-Settlement; kein generisches Aufsummieren beliebiger Cashbeine. Mengen-/Bruttowirkung des Wertpapierkaufs, tatsächliche negative Settlementbewegung und tatsächliche positive Finanzierung bleiben getrennt. Bestehende V1/V2/V3-Prüfbelege und IDs nicht umdeuten. Eine Finanzierung darf höchstens einmal wirtschaftlich wirken; wiederholte Exporte ergänzen nur belegte Vorkommen. Gleiche Bankidentität mit geänderter Payload sperrt.

Synthetisches Beispiel: 6 Anteile zu10, Settlementcash−63 und Finanzierungscash+63 ergeben Broker-Cashnetto0, aber Brutto60 und weiterhin ungeklärte Differenz−3. Daraus folgt keine bestätigte Gebühr/Steuer/Kostenbasis. [Unabhängiger Decimaloracle](repros/UH05_FUNDING_ROLE_ORACLE_2026-11-06.py) und [tatsächlicher Bericht](release-evidence/uh05-funding-role-oracle-2026-11-06.json) halten beide möglichen Portfolioabgrenzungen getrennt; sie wählen keine davon automatisch aus.

| Noch zu belegende Portfolioabgrenzung | Erforderliche Wirkung |
| --- | --- |
| Gegenkonto außerhalb des erfassten Portfolios | Separater belegter Kapitalzufluss; Orderbelastung bleibt interner Kaufvorgang |
| Eigenes Gegenkonto ebenfalls im Portfolio | Tatsächlich belegtes Gegenbein und ausdrückliche Zuordnung; interner Transfer ohne externen Kapitalzufluss |
| Herkunft/Eigentum/Umfang ungeklärt | Keine automatisch erzeugte Transfer-/Kapitalflussklassifikation, keine Vollständigkeitsbehauptung |

Die Portfolioabgrenzung für den neuen gezeigten Sparplanfall ist durch die Nutzerbestätigung im Nachtrag geklärt. Für weitere historische Gruppen ist ihre jeweilige Rolle weiterhin konkret zu bestätigen; sie wird nicht pauschal von diesem Fall abgeleitet. Für einen späteren internen Transfer ist das tatsächliche Gegenbein wiederzuverwenden/zu belegen; gleicher Betrag/Ordertext allein genügt nicht. Datierte Anfangsbestände und vollständige Chronologie werden gesondert benötigt und niemals aus heutigen Endbeständen zurückgerechnet.

## Nächster ausführbarer Schritt und Gates

Nach Vorliegen der vollständigen Originalzeilen des neu bestätigten Falls einen eng versionierten Finanzierungsbeleg im bestehenden Import-/Journal-/CAS-Kern umsetzen. Die gemeinsame UI muss Rolle, alle Quellen, Konten, tatsächliche zwei Cashbewegungen und getrennte Orderwirkung vor der Übernahme anzeigen. Auswahl-/Kontowechsel widerruft sämtliche Freigaben. Ein atomarer CAS-Commit, Wiederimport beider Reihenfolgen/Overlap, negative Payload-/Scope-/Rollenfälle, Quota/post-put, echter Zweittab, vollständiges Undo, verschlüsseltes FreshRestore und Offline in drei Engines bleiben Pflicht; finale Integration/Deployment/tatsächliche Produktion erst am vollständigen Kandidaten.

Bis zur vollständigen Quellenzuordnung des konkreten Falls kein Produktbranch/PR/CI und keine unbelegte Finanzsemantik. Vorhandene 26 Grenzfälle, alle bisherigen Originale/Oracles/Schutzverträge und offenen UH05/UI300/QUALITY298/CI229/Android/Wallet-/Stakingaufträge erhalten. Fehlende Wallet-/Stakinganzeige bleibt UNKNOWN, niemals Null. GitHub ausschließlich Plugin; Checkpointbranch niemals vollständig nach Main.
