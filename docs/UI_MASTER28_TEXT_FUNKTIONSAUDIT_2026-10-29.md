## Erster abgegrenzter Nachweis, keine Gesamt-DONE-Markierung

[Reproduzierbare reine Rendererproben](release-evidence/ui-text01-03-renderer-probes.json), synthetisch und ohne Netzwerk/Speicherung: UI-TEXT01 REPRODUCED/P1 OPEN (kanonisch fehlender Kurs, quality=missing, exaktes Kursfeld zeigt0,00 und Quelle Manuell); UI-TEXT02 REPRODUCED/OPEN (1096 verfügbar, aber kein entsprechender Button, auch im unterstützten Wertpapier-CSV-Kontrollfall). UI-TEXT03 ist als sichtbarer nicht unterstützter Krypto-CSV-Import derzeit NOT REPRODUCIBLE: bestehender Sicherheitsguard verbirgt die vorbereiteten Tools. Positivkontrolle zeigt den unterstützten Wertpapierimport. Guard bei TradingView-Entfernung/CSV-Vereinfachung erhalten; keine bloße Funktionsfreischaltung. Modell vollständig unverändert. Vollständige übrige Zustands-/Browserprüfung und Korrekturen bleiben offen.

---

# UI-MASTER28: Appweiter Text-, Erklärungs- und Funktionskonsistenz-Audit · 29.10.2026

**Status: OPEN / Delta-Audit im bestehenden UI-Master.** Der identisch zweimal übermittelte 16-teilige Auftrag wird einmal übernommen. Der vollständige „Mehr“-Vertrag bleibt bestehen. Keine neue Roadmap, parallele Implementierung, neue Architektur oder unbegrenzte Auditphase; laufenden Diagramm-Schnitt nicht unterbrechen oder erweitern.

## 1. Gesamtauftrag

Verbleibenden UI-Code aller Ansichten und Dialoge auf sprachliche, inhaltliche und funktionale Konsistenz prüfen: Erklärungen, Hilfetexte, Labels/Überschriften, Status/Fehler/Leerzustände, Sicherheitsdialoge, Tooltips, technische Hinweise, Datenqualität/Herkunft und Screenreadertexte. Wenige klare Sätze ohne technische Überfrachtung; fachliche Informationen und Finanzlogik erhalten.

## 2. Textprinzip und Längen

Kurz, präzise, verständlich, handlungsorientiert, einheitlich, zurückhaltend und sicher. Gleiche Funktion/Zustand erhält denselben Begriff. Risiken/Unsicherheiten nicht verschweigen. Orientierungswerte: Buttons2–4 Wörter, Labels2–5 Wörter, Status ein kurzer Satz, Hilfe1–2 Sätze, Leerzustand möglichst höchstens2 Sätze mit fehlender Voraussetzung und nächster Aktion. Fehler = Problem plus nächster sinnvoller Schritt; Sicherheitsbestätigung = konkrete Folge und eindeutige Zustimmung. Keine starren Limits, fachliche Notwendigkeit geht vor.

Normal erklären: Bedeutung und mögliche Handlung zuerst; keine lange technische Vorrede. Beispiel „Für die Renditeberechnung fehlen noch historische Werte oder Geldflüsse“ nur verwenden, soweit genau diese Daten fehlen; Details in Datenabdeckung.

## 3. Informationshierarchie

Ebene1: Name, relevanter Status, wichtigste Aktion und bei Bedarf ein kurzer Satz. Ebene2: notwendige Erklärung zu Änderung/Speicherung/Voraussetzungen/Grenzen/Fehlerbehebung. Ebene3: vollständige Quelle/Zeitstempel/Originalbelege/Journal-/Transaktionsreferenzen/Prüfdetails/Importherkunft/Revision/Sicherheit. Nachvollziehbarkeit vollständig erhalten, normale UI nicht dominieren lassen. Keine neuen drei- oder vierfachen Akkordeonketten, kein großes Hilfemenü für eine einfache Aktion.

## 4. Vollständiger Umfang

Übersicht: Vermögen, Vermögensänderung, Anlageklassen, Verlauf, Konten/Depots, Liquidität/Fälligkeiten, Qualität. Verlauf: Diagramme/Zeiträume/Basis/Abdeckung, Rendite/Geldflüsse, Referenzen/Kalender/Korrektur/Löschen. Positionen: Liste/Details, Kurse/Quellen/Qualität/Historie/Anschaffung, Wallets/Vorgänge/Archiv/Verwaltung. Buchungen: Liste/Verwaltung, Erträge/Abzüge/Transfers, Bewertungen/Einzelposten, Lösch-/Archivdialoge. Weitere Dialoge: Assistent, Editoren, Konto/Anbieter, Walletsuche/-historie, CSV/Broker, Backup/Restore und Sicherheitsbestätigungen. „Mehr“ bleibt vollständig in seinem vorhandenen Gesamtvertrag.

## 5. Konkrete IDs, vor Änderung reproduzieren

| ID | Verbindlicher Prüf- und Korrekturauftrag | Status |
| --- | --- | --- |
| UI-TEXT01 / P1 | Fehlender Kurs ist keine0. Fehlende/ungültige Werte als „–“ oder „Kurs nicht verfügbar“; echte0 nur mit tatsächlichem Beleg. Leere Quelle nicht automatisch „Manuell“. Nur Darstellung, gespeicherte Werte unverändert. | OPEN; Number(... )\|\|0 und Quellenfallback im Detailcode bestätigt, sichere Unterscheidung echter0 und fehlender Provenienz noch prüfen |
| UI-TEXT02 | availablePositionPeriods und Darstellung abgleichen;3J wird teilweise zugelassen und danach herausgefiltert. Längere Optionen nur mit echter Abdeckung; K02 wiederverwenden, keine Fakehistorie. | OPEN / bestehender Kursoptionenvertrag |
| UI-TEXT03 | Krypto-CSV-Markup gegen tatsächlich unterstützten Wertpapier-Importpfad und Berechtigungen prüfen. Nur erreichbare unterstützte Funktionen anbieten; keine bloße Freischaltung unvollständiger Pfade. | OPEN; vorbereitete Markups nicht ungeprüft als sichtbar behandeln |
| UI-TEXT04 | „Vermögensänderung“, Zusatz „Ein- und Auszahlungen enthalten · keine Rendite“, Zeitraum erhalten, fehlende Vergleichswerte konkret erklären. | OPEN / Darstellung ohne Berechnungsänderung |
| UI-TEXT05 | Kursqualitätsbegriffe mit quote-quality.js abgleichen. „Bestätigt“ ist keine unabhängige Garantie. Quelle/Datum/Alter und alle weiteren tatsächlich erforderlichen Bedingungen korrekt erklären. | OPEN / Sourcebedingungen unten dokumentiert |
| UI-TEXT06 | Normalansichten bevorzugt 25.10.2026 statt ISO: Buchungen, Positionsereignisse, Erträge/Abzüge, Referenzen, Wallets und Importe. Originalzeitstempel/UTC in technischen Nachweisen bewahren. | OPEN / keine Änderung kanonischer Daten oder erforderlicher ISO-Datumsfelder |
| UI-TEXT07 | Neutraler Buchungskicker „BUCHUNGEN“ statt „MANUELLE ERFASSUNG“ für gemischte Herkunft. Aktionen unverändert. | OPEN |
| UI-TEXT08 | Walletstatus aus echtem Zustand ableiten und kurz erklären. Teilbelegt, fehlende Diagrammpunkte, bloße Tabellenbegrenzung unterscheiden; UTC/Zeiträume/Quellen in Details. Unvollständiges nie pauschal bestätigen. | OPEN |
| UI-TEXT09 | Diagramm-ARIA passend zum Inhalt: Vermögensverlauf, Marktpreis je Einheit, historischer Positionswert/Bestand oder Wallet-Wert. Vorhandene Caller-Overrides prüfen. Kurz, Tastatur erhalten. | OPEN; gemeinsame Komponente hat generischen Vermögenslabel, nicht alle Aufrufer ungeprüft als falsch markieren |
| UI-TEXT10 | Singular/Plural und Begriffe: Konto/Position/Buchung; gespeichert/importiert/übernommen; erfasst/geprüft/bestätigt; archiviert/ausgeblendet; Kurs/Positionswert/Gesamtvermögen; Einstand/Kaufpreis; Vermögensänderung/Rendite. | OPEN / Überschneidung mit Mehr-Vertrag integrieren |

UI-TEXT05-Beispiel: „Bestätigt: Kursquelle und Datum sind nachvollziehbar. Der Kurs ist höchstens sieben Tage alt.“ Nur verwenden, wenn der konkrete Zustand dies wirklich erfüllt. Aktueller Sourceabgleich: positive Kursangabe, relevante nicht ausgeschlossene Position mit Bestand, kein abgeleiteter/sonstiger Prüfstatus, gültiges Datum, zulässiger Zukunftsbereich, höchstens 7 Tage Alter und nachgewiesene Herkunftskategorie sind Teil der tatsächlichen Klassifikation. Finanz-/Qualitätslogik durch Textarbeit nicht ändern.

## 6. Übersicht

Ohne lange Absätze verständlich. Kurze fachlich korrekte Hinweise etwa „Kurs fehlt“ oder „Historische Bewertung unvollständig“. Konkrete Ursachen/betroffene Positionen unter Prüfen/Datenabdeckung erhalten. Keine falsche Vollständigkeit. Vergleichszeitraum und Unterscheidung Vermögensänderung/Rendite bewahren.

## 7. Verlauf und Renditen

Erfasste Stichtage, rekonstruierte Positionen, Abdeckung, externe Geldflüsse, XIRR/TWR, Startvermögen und Referenzen verständlich erklären. XIRR: „Geldgewichtete Rendite: berücksichtigt auch, wann du Geld ein- oder ausgezahlt hast.“ TWR: „Zeitgewichtete Rendite: misst die Entwicklung unabhängig vom Zeitpunkt deiner Ein- und Auszahlungen.“ Gültigkeitsgrenzen und fehlende Daten korrekt erhalten. Datenbasis knapp erklären, keine unnötigen Texte unter Charts. Entfernung der redundanten sichtbaren „Erfasste Stichtage“-Beschriftungen bleibt verbindlich.

## 8. Positionen

Manuellen/automatischen/CSV-Kurs, historischen Positionswert und fehlenden Kurs unterscheiden. Einstand: „Bekannter Anschaffungswert deines aktuellen Bestands“, unbekannte Werte nicht schätzen. Wallet: „FolioLab liest öffentliche Wallet-Daten. Du gibst keine Transaktionen frei.“ Übertragung öffentlicher Adressen/xpub an externe Dienste weiterhin erklären. Kompakte gebuchte Vorgänge ohne wiederholte Techniktexte; Originalquelle, Datum, Menge, Gebühren und Zuordnungen bei Bedarf verfügbar.

## 9. Buchungen

Normal Datum/Art/Anlage oder Konto/Menge oder Betrag/wesentlichen Status. Details: Herkunft, ID, Journal, Gebühren/Steuern, Transferzuordnung/Nachweise. Erträgetext etwa „Erfasste Dividenden und Zinsen abzüglich dokumentierter Gebühren und Steuern“ nur, wenn die tatsächlichen erfassten Typen dazu passen. Bei fehlenden Beträgen „Einige Beträge fehlen. Der angezeigte Saldo ist unvollständig.“ Keine Steuerbescheinigung/Vollständigkeit versprechen;490/400-Regressionsfall erhalten.

Transfers: „Ordne Ein- und Auszahlungen zwischen deinen eigenen Konten einander zu.“ Zusatz „Nur belegte Bewegungen zuordnen. Gleiche Beträge allein reichen nicht aus.“ Details zu Gebühren/FX/Valuta erhalten.

## 10. CSV- und Brokerimporte

flatex AT, Bittr, Kraken, Bitpanda, Ledger Live und weitere wirklich unterstützte Formate. Prominent Anbieter, tatsächliche eingelesene/zugeordnete/ungeklärte Zahlen, Übernahmefähigkeit und nächster Schritt. Beispiele245/12 nur Beispiele, nie erfundene Laufzeitzahlen. Preview von Übernahme klar unterscheiden. Rohspalten/-daten, Referenzgruppen, Journal, Quellkontext, Gebühren-/Steuerbelege, Digests und Zeitstempel vollständig nachrangig zugänglich.

„Importiert“ ist nicht gleich „geprüft“ oder „endgültig übernommen“. Keine fehlenden Werte als0, keine ungeprüfte automatische Bestands-/Steuerübernahme. FLH03 beibehalten, FLH05 nicht aktivieren.

## 11. Fehler und Leerzustände

Problem plus nächster sinnvoller Schritt. Beispiele passend zur tatsächlichen Ursache: Kurs nicht verfügbar/Quelle prüfen; für Zeitraum fehlende Werte; bestätigter OAuth-Ablauf/erneut verbinden; unvollständiger Walletabruf/fortsetzen; Mehrtabänderung/neu laden; ungeklärte Vorgänge/Vorschau prüfen. Keine ungeprüfte CORS-/Netzwerk-/Tokenursache behaupten. Technische Diagnose/Originalfehler nachrangig erreichbar und weiterhin ohne Geheimnisoffenlegung.

## 12. Sicherheitsdialoge

Löschen von Buchungen/Positionen/Referenzen, Archiv, Importübernahme, Überschreiben/Restore und Alle Daten löschen: Aktion, tatsächliche Folgen, korrekte Anzahl, Undo-/Wiederherstellungsmöglichkeit und klare Bestätigung. Kurze Summary plus vollständiger aufklappbarer Nachweis möglich. CAS, Abhängigkeiten, Berechtigungen, Pflichtbackup, Revision, Undo und vollständige Rücknahmevorschau niemals reduzieren.

## 13. Automatische Absicherung

Mit vorhandenen Tests gezielt semantische Verträge prüfen: Begriffe/Plural, fehlend versus0, konsistente Zustände, aktuelle Verweise, keine Wiederholungen/abgeschnittenen Texte, verständliche Leerzustände und passende ARIA. Mobile 320–430px,200% Text, lange Namen, große Listen, offene Dialoge, Tastatur/Touch. Keine neue Abhängigkeit allein für Textprüfung und keine unnötigen Tests, die nur Copy-Wortlaut spiegeln.

## 14. Fachliche Grenzen

Keine Änderung an Finanzen/Kursbewertung/Historierekonstruktion, Gebühren/Steuern/Journal, DB/CAS/Mehrtab, Backup/Restore, Importberechtigungen oder Wallet/Staking. Echte funktionale Inkonsistenz getrennt dokumentieren und im passenden bestehenden Fachpaket beweisen. Keine ungeprüfte Freischaltung durch Textänderung.

## 15. Priorität und Qualität

P1: fehlend als0, falsche Herkunft/Bestätigung/Vollständigkeit/Sicherheits- oder Löschhinweise, sichtbare Funktion ohne sicheren Fachpfad. P2: verständliche kurze Hilfen, Begriffe/Status/Datum/Import/Leerzustände/ARIA. P3: redaktionelle Details/kleine Wiederholungen.

Jede Änderung muss kürzer, ohne Fachwissen verständlich, vollständig korrekt, passend zur Funktion und mit erkennbaren notwendigen Risiken/Unsicherheiten sein. Fachliche Genauigkeit hat Vorrang vor pauschaler Kürzung. Laufenden sicheren Diagramm-Schnitt nicht wegen dieses Nachtrags umpriorisieren; danach P1-Deltas am passenden vorhandenen UI-Schritt.

## 16. Integration und dauerhafte Sicherung

Vor Umsetzung aktuellen main, PRs, CI und bestehende Arbeiten abgleichen. Erledigtes überspringen; keine konkurrierenden Zweige an denselben Komponenten. Reine Texte sinnvoll bündeln, risikoreichere echte Funktionsänderungen getrennt absichern. Chromium/Firefox/WebKit und passende Finanz-/Import-/Backup-/Recoverygates erhalten. Sichere Etappen committen, über GitHub sichern, Remote-SHA prüfen, zentralen Checkpoint separat aktualisieren und DONE/PARTIAL/BLOCKED/exakte nächste Stelle festhalten. Keine Selbstfreigabe neuer sicherheitskritischer Releases. FLH05/FLH-PROJ01 OPEN/PARKED; historischen Dokumentationsbranch niemals als Appcode nach main mergen.

Gesamtstatus OPEN/PARTIAL. Diese Dokumentation ist keine Behauptung, dass der appweite Audit oder alle zehn Korrekturen bereits implementiert oder abgenommen sind.
