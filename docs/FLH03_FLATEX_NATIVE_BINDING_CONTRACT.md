# FLH03 – Native Kontobindung und reinlesendes Staging vor Code

Basis PR193/feature/flh03-flatex-native-identity f42bc8ec, main4e9a4a7/v202 LIVE_ACCEPTED.
Identitätsgrundlage vollständig geprüft. Bestehender Fach-/Identitätsvertrag bleibt.
Zwei Folgeetappen: geprüfte UI-Integration, danach kontrollierter Release/Liveabnahme.
Keine neue Roadmap, kein neuer Branch/PR oder wirtschaftlicher Importkern.

## Lokale explizite Zuordnung

Native Identitäts-/Orderhelfer einmal je erfolgreichem Dateistapel auf direkte Parserdokumente anwenden. Im vorhandenen CSV-Dialog eingeklappte „Kontozuordnung“ ergänzen. Je eindeutiger Seite/Quellkontext explizit bestehendes Portfolio-Konto wählen und separat „Zuordnung für diese Vorschau bestätigen“. Niemals Dateiname, Gegenpartei, ähnliche Nummer, einziges Konto oder Orderbeziehung automatisch zuordnen.

Depotchoices über vorhandenes flatexCustodyAccounts (Flatex-Anbieter/Wertpapierdepot). Für Kontokontexte vorhandene checking/savings/securities/other-Konten eines Flatex-Anbieters, keine Wallet-/Exchange-Konten. Dies ist nur logische Portfolio-Kontozuordnung, keine Cashposition-/EUR-/Eigentums-/Settlementfreigabe. Bestehender separater EUR-Cashprüfvertrag unverändert.

Fehlende/unsichere Quellkontexte nicht bindbar; alle Quellen erhalten. Keine automatischen Konto-/Provider-/Positionsanlagen. Keine Bestätigung ohne gültige Auswahl. Bestätigung an unveränderte Konto-/Anbieterdaten binden; Auswahlwechsel löscht Bestätigung. Datei-/Moduswechsel/Abbruch/Escape/Neuöffnen setzt alle Zuordnungen zurück. Kontobindung nur im Dialogspeicher, niemals localStorage/IndexedDB/Backup persistieren.

Vor jeder Auswahl/Bestätigung vorhandenes portfolioStore.assertCurrent verwenden; LoadFailure/anderer Tab/stale Revision blockiert Zuordnungen und zeigt kurzen Grund. Keine CASrevision übernehmen oder andere Änderungen überschreiben. Nach asynchronem Freshnesscheck Generation/aktiven Dialog nochmals prüfen. Quellen bleiben bei stale lesbar, keine falsche Bestätigung.

## Reinlesende Stagingprüfung

Vorhandene native Quelle-/Order-/Zeilenanzeige und Guards erhalten. Kontextliste initial20, explizites20er-Nachladen mit Fokus und Erhalt geöffneter Bereiche; bestehende Quell50er-/Order20er-Paginierung unverändert. Status in bestehenden Quellendetails, kein drittes separates großes Zeilen-/Aktionspanel.

Kleine pure Review-/Markupfunktionen im bestehenden flatex-native-ui.js, keine neuen persistierten Daten-/Journalmodelle. Kein previewCSV mit aus Originalen erfundenen Finanz-DTOs. Quelle bleibt ungeprüft/überlappend/konfliktbehaftet gemäß bestehendem Identitätshelfer; eine Kontobestätigung hebt diese Sperren nie auf.

Nur bei gültiger bestätigter Bindung exakten vorhandenen importSourceKey aus Namespace/Portfolio-Konto/Bank-ID verwenden. Gleiche Quellidentität: mehrere Buchungen/ungültiger vorhandener Nachweis = Prüffall; abweichender payloadDigest = Quellkonflikt; sourceUnmodified/bookingOwnership schützt manuelle Änderungen; gleicher Nachweis und unveränderte Eigentümerschaft bedeutet ausschließlich „Quellnachweis vorhanden“, nicht automatisch Dublette oder geprüfte Buchungswirkung. Unbekannte Finanzprojektion/Bestände/Kosten/Cashflows bleiben ausdrücklich ungeprüft.

Vorhandene nichtnative Buchungen im zugeordneten Konto nur als noch nicht abgeglichene Altherkunft kenntlich machen; kein Fuzzy-Matching, kein automatischer Legacy-Crosswalk/Import/Skip/Overwrite. Kontokontexte bleiben getrennt, keine providerübergreifende Order-/Cashfreigabe. Vorhandene Ordergruppen bleiben mögliche dokumentarische Beziehungen.

Alle Reviewausgaben immutable, ready=false/writeEnabled=false. Keine Betrags-/Kosten-/Gebühren-/Steuer-/TWR-/XIRR-/Bestandsrechnung. Keine Commit-, Undo-, Speicher- oder Importfunktion. Deaktiviertes „Nur Vorschau“, submitBlocked und separater erzwungener Submitguard immer erhalten. Keine privaten Produktivdatenänderungen.

## Abnahme / Release

Synthetische Units: keine Autozuordnung/einziges Konto, zulässige Choices/fehlende Provider, getrennte Scopes/Seiten, Bestätigung/Kontoänderung/fehlende Konten, Raw-Konflikt/Overlap/fehlende IDs, vorhandener/abweichender/mehrfacher Nachweis, manuelle Korrektur/ungültige Herkunft, Altherkunft ohne Autoabgleich, Immutability/Bounds/Escaping/kein Finanzmapping.

Browser im bestehenden CI-Einstieg Chromium/Firefox/WebKit: echte Dateiinputs, natürliche Select-/Checkboxinteraktion, Bestätigung/Reset/Datei-/Modus-/Dialog-/Kontowechsel, Quellstatus/Reviewgründe,20er-Kontextpaging/Fokus,5Breiten320/390/430/768/1440/Axe/44px/lange Texte, erzwungener Submit/Cancel/Escape/Neuöffnen, verzögerte Dateilesung/Freshnessgeneration, echter zweiter IndexedDB-Writer und unveränderte Revision/Records/Settings durch diesen Dialog, echter Offline-Reload und read-only Zuordnung. Nur synthetische Datensätze und Bilder. Neue Bilder tatsächlich ansehen.

Volle aktuelle Pflicht-CI/Wallet/Quell-/Artefaktabnahme ohne Pin-/Workflow-/Assertionlockerung. SW203 bleibt Kandidat bis kontrolliertem Merge; danach komplette Main-/Pages-/tatsächliche Produktionsabnahme mit exakten Assetbytes/Restore/Offline/3Engine-Berichten/Bildern und dauerhaftem Checkpoint. Keine neue kritische Finanzmutation, vorhandene Masterfreigabe für reinlesenden Release ausreichend.

Original-Replay/eigentliche wirtschaftliche Nativeintegration und vollständige historische Abnahme bleiben separat offen. Historischer Start01.01.2022, keine fiktiven Eröffnungen/Kosten/Cashflows. UI-MASTER28/DELETE-MASTER28/FLH04 und bestehende Roadmap erhalten; PERF/FLH05/PROJ01 nicht vorziehen. Gesamtmaster PARTIAL.
