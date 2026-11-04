# UH04 – begrenzte wirtschaftliche EUR-Paarübernahme

Einzelne ausdrücklich ausgewählte Depot12/Konto10-Gruppen übernehmen über die bestehende CSV-/Transaktionsengine genau einmal Stückzahl und belegten Nettocash. Beide getrennten Quellbereiche, Bankreferenzen, Originalfelder und überlappenden Exportvorkommen gehören zur selben dauerhaften Wirtschaftsgruppe. Die bisherige Stückübernahme bleibt unverändert verfügbar.

Voraussetzungen: unstornierte eindeutige 1:1-Order, EUR/Stück, gleiche Buch-/Valutatage, ausdrücklich bestätigte eigene getrennte Depot-/Kontozuordnung beim selben Anbieter und genau eine bestehende Position je ISIN/Geldkonto. Der erste Append braucht belegte Anfangsmengen mit bestätigtem Datum vor der Auswahl. Vorhandene Buchungen, Kosten/Ergebnisse, abweichende datierte Eröffnungen oder betroffene spätere Referenzstände bleiben geschützt. Keine historischen Eröffnungen aus heutigen Salden ableiten. Eine bestehende reine Stückbuchung wird nicht automatisch ergänzt. Unausgewählte Prüfgruppen bleiben sichtbar offen; kein stiller Teilcommit.

## Gemeinsamer Postingvertrag

Bruttoausführung und Kontonettobetrag bleiben getrennt exakt. Journal: Asset zum vorzeichenbehafteten Brutto, Cash mit exaktem Kontobetrag, ausgleichender `unresolved-net-amount` ohne Gebühren-/Steuer-/Ertragsrolle. Auch Differenz null bedeutet unbekannte Kosten. Gebühren/Steuern, Kostenbasis und realisiertes Ergebnis bleiben null; `costsVerified=false`. Status `unresolved-net-settlement` sperrt die davon betroffenen Renditefreigaben und erscheint im Prüfbereich. Es entsteht kein externer Kapitalfluss.

Die bestehenden Baseline-/IDB-/CAS-/Backup-/Restorepfade bleiben zuständig. Neue Herkunft einschließlich Originalfelder, Mengen/Beträge und Journalverknüpfung wird vor Speicherung und Restore streng validiert. Bestehendes v5 schützt aktive Gruppen und Rücknahmen; keine zweite Finanzengine. Bereits gespeicherte Stück-/Kontobelege und geänderte Payloads sind Konflikte. Gleiche überlappende Belege behalten sämtliche Vorkommen, wirken nur einmal; späterer Depot-only-Import kann den Cashbeleg nicht entfernen.

Weitere EUR-Paare können nach bereits übernommenen Paaren ergänzt werden. Für jede betroffene Position müssen alle vorhandenen Buchungen und Journalposten unveränderte, zeitlich frühere EUR-Wirtschaftsgruppen sein; ihr datierter Anfangsbestand und der exakte Journalabgleich müssen bestehen. Die neue Übernahme verändert diese Anfangsbestände und alten Buchungs-/Journalbelege nicht. Eine erneute Anfangsbestätigung ist für solche Positionen nicht erforderlich. Gleichdatierte oder rückdatierte Ergänzungen, manuelle/andere abhängige Buchungen, Bestandsabweichungen und betroffene Referenzstände ab dem neuen Vorgang bleiben gesperrt. Neu hinzukommende Positionen ohne Buchungen benötigen weiterhin den ausdrücklich bestätigten Anfangsbestand. Rücknahme einer älteren Gruppe bleibt bei späteren abhängigen Paaren gesperrt; die neueste Gruppe lässt sich über den bestehenden vollständigen Rücknahmepfad entfernen.

## Übernahme und Rücknahme

Im vorhandenen Importdialog Modus EUR-Paare auswählen, einzelne Gruppen ankreuzen, Anfangsbestand bestätigen, gemeinsame Simulation prüfen, Backup herunterladen und Übernahme bestätigen. Dateiauswahl, Modus, Gruppenauswahl, Bindung und Anfangsbestätigung invalidieren den Entwurf. Direkt vor Save: aktuelle Revision und frische Qualifizierung desselben Plans; ein atomarer Commit. Geänderte Baseline, Quota, post-put-Abbruch und tatsächlicher konkurrierender CAS benötigen neue Zustimmung.

Gespeicherte EUR-Paare lassen sich mit denselben Originalquellen im Rücknahmemodus als ganze Wirtschaftsgruppen zurücknehmen. Nachträgliche abhängige Buchungen sperren dies. Beide Originalquellen und Journal-/Buchungsbelege bleiben als dauerhafte Rücknahme erhalten; Wiederimport bleibt gesperrt. Das ist eine andere Operation als Quellenentfernung oder das bestehende sitzungslokale CSV-Undo.

## Nachweise und Grenzen

Synthetische unabhängige Sollwerte: Kauf2 Stück/Brutto20/Nettocash−21,75/ungeklärter Ausgleich1,75, Verkauf und Gleichheit mit unbekannten Kosten; Überlappung, Konflikt, Wiederimport, geänderte Herkunft, dauerhafte Rücknahme und Restore. Privater unabhängiger Python-CSV/Decimal-Oracle für81 echte Originalpaare gegen wirtschaftliche Übernahme/Restore/Replay/Rücknahme mit ausdrücklich kontrollierten synthetischen Eröffnungen. Keine Aussage über tatsächliche historische Anfangs-/Endsalden.

Neue vollständige Browserkette: tatsächliche Auswahl/Backup/Zustimmung/Commit, Quota/post-put-Abbruch, echte Zweittab-CAS-Kollision, Offline-Reload, frisches Profil mit verschlüsseltem v5-UI-Restore, Replay und dauerhafte Rücknahme; sieben Breiten/Axe. Pflichtgates additiv in Chromium/Firefox/WebKit sowie Main/Produktion; keine bestehende Gateauswahl reduziert. Lokale WebKit-Qualifizierung ist kein Hardware-/Android-/nativer-Safari-Nachweis. Finale CI-/Releasebelege separat.

UH04 bleibt insgesamt offen für Depot13-Kontext, Konto8, N:M/Teilfüllungen, FX, Sonderereignisse, vorhandene Einzelbeinergänzung und unabhängige historische Endbestände. LINK-Brücke weiterhin gesperrt; HTTP405/403 sind Transportfehler, kein Nachweis fehlender Chain-Receipts. UH03/UH04/UH05 und übrige Roadmap bleiben erhalten.
