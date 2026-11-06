**Mein Urteil: 3:1 EUR ist fachlich ein sinnvoller enger Ausbau, sollte aber nicht der unmittelbar nächste Entwicklungsschritt sein.** Drei grundlegende Befunde bei Quellenidentität und Walletpflege haben Vorrang. Eine neue Finanzengine oder eine pauschale Neuarchitektur ist dafür nicht erforderlich.

Geprüft wurde Main `652e80bcb31aec13c85a0457332bdf53cf98a521`, Tree `ee506c874fa9578f1daf3387da24b299bba5103e`, anhand des tatsächlichen Codes, der verlangten Unterlagen, der bestehenden Tests und Releasebelege. Der bestehende [Mainlauf 42191012639](https://github.com/joke0071/foliolab-open/actions/runs/42191012639) ist erfolgreich; **v289 bleibt LIVE_ACCEPTED**.

Alle Zugriffe waren lesend über das GitHub-Plugin. Ich habe keine Tests ausgeführt und keine erneute Produktionsabnahme vorgenommen. Die folgenden Fehler sind durch den Codepfad belegbar; ihre beschriebenen Repros sind zur Ausführung durch den Owner bestimmt. Private Originaldateien wurden nicht erneut eingesehen. Ihre Regression wurde anhand der vorhandenen redigierten Nachweise berücksichtigt.

**Priorisierte Befunde**

| Schwere | Anzahl | Einordnung |
|---|---:|---|
| Kritisch | 0 | Kein kritischer Fehler im untersuchten Umfang nachgewiesen |
| Hoch | 3 | Doppelte native Importwirkung, blockierte Walletaktualisierung, doppelte Walletbewertung |
| Mittel | 3 | Walletnormalisierung, Bewertungsqualität, allgemeine Restorevalidierung |
| Niedrig | 1 | Wartbarkeit der eng miteinander verbundenen Importmodule |

**H1 – Dieselbe native Flatex-Bankquelle kann über ein anderes FolioLab-Depot erneut importiert werden.**  
*Codebelegter Fehler; hohe Priorität.*

Die native Quellenidentität enthält bereits den Bankquellbereich. Die Wiedererkennung verwendet zusätzlich das frei gewählte FolioLab-Konto:

- [`importSourceKey()`](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/import-identity.js#L14) bildet den Schlüssel aus `sourceId`, `accountId` und `externalId`.
- [`reviewNativeFlatexBindings()`](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/flatex-native-ui.js#L10) sucht vorhandene Quellen nur unter dem aktuell zugeordneten Konto.
- [`previewCSV()`](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/csv-import.js#L90) enthält für diesen Fall keinen kontenübergreifenden nativen Identitätskonflikt.

**Repro:** `nativeProjectionFixture()` unverändert importieren. Danach beim selben Anbieter ein zweites leeres Depot mit derselben ISIN anlegen. Dieselben unveränderten Dokumente diesem zweiten Depot aktuell bestätigt zuordnen und erneut im Modus `append` prüfen. Der zweite Kontoschlüssel findet die vorhandene Bankquelle nicht; die Stückhistorie kann nochmals wirtschaftlich wirksam werden.

Der neue 2:1-Pfad besitzt stärkere, kontenübergreifende Quellenprüfungen. Der Befund betrifft den angrenzenden nativen Stückimport.

**Minimale Lösung:** Für native Quellen eine bereits verwendete Kombination `sourceId + externalId` unabhängig vom lokalen Zielkonto erkennen. Eine andere Kontozuordnung muss einen Konflikt auslösen. Unterschiedliche echte Bankreferenzen mit gleichen Beträgen weiterhin getrennt erhalten. Den allgemeinen CSV-Schlüssel nicht pauschal ändern.

**H2 – Die globale Aktualisierung kann geänderte Walletbestände wegen eines alten Eröffnungsbestands vollständig zurückweisen.**  
*Codebelegter Fehler; hohe Priorität.*

[`captureOpenings()`](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/transactions.js#L71) erfasst beim Buchen Eröffnungsbestände für alle Positionen. Die globale Aktualisierung verändert Walletmengen anschließend [direkt in `refreshAll()`](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/app.js#L2147). Der folgende Speicherweg prüft über `safeImport()` erneut Eröffnung plus Journal gegen die aktuelle Menge.

**Repro:** Wallet mit Menge 1 und eine manuelle Cashposition anlegen. Eine Cashbuchung ausführen; dadurch entsteht auch für die Wallet ein Eröffnungsbestand 1. Danach liefert die globale Walletaktualisierung Menge 2. Ohne passenden Abgleich bleibt die Eröffnung bei 1. Die Speicherung scheitert am Mengenvergleich und lädt den gespeicherten Stand zurück.

Für den speziellen UH02-Rescan existiert bereits ein [geschützter Abgleich im bestehenden Helfer](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/wallet-scan-update.js#L27), einschließlich eines Tests. Die globale Aktualisierung verwendet diesen Weg nicht.

**Minimale Lösung:** Beide Aktualisierungswege über denselben geprüften Helfer führen. Ausschließlich einen undatierten beobachteten Walletbestand ohne mengenwirksames Journal nachführen. Datierte Eröffnungen und echte Mengenjournale weiterhin schützen.

Der CAS-/Journalsschutz funktioniert hier: Ein widersprüchlicher Zustand wird nicht gespeichert. Fehlerhaft ist der zulässige Aktualisierungsweg.

**H3 – Dieselbe Wallet kann unter mehreren lokalen Konten mehrfach zum Vermögen beitragen.**  
*Codebelegter Fehler; hohe Priorität.*

Die Suche nach einer bereits gespeicherten Wallet ist im [Walletimport](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/app.js#L1243) auf `accountId === accountId` begrenzt. Unter einem zweiten Konto entsteht deshalb eine neue, standardmäßig angerechnete Position. [`totalExactEUR()`](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/model.js#L118) summiert beide.

**Repro:** Dieselbe EVM-Adresse mit demselben Asset einmal unter Walletkonto A und erneut unter Walletkonto B speichern. Beide Positionen auf `included` belassen. Derselbe beobachtete Blockchainbestand wird zweimal bewertet. Gleiche Assetmetadaten verhindern diese doppelte wirtschaftliche Anrechnung nicht.

**Minimale Lösung:** Beim Speichern dieselbe konkrete Walletidentität auch kontenübergreifend suchen. Eine zweite Darstellung muss ausdrücklich als bereits repräsentierte Ansicht behandelt oder gesperrt werden. Vorhandene Positionen mit Historien nicht automatisch zusammenführen. Native Coins, Stake-Accounts und Liquid-Staking-Token weiterhin nach ihrer tatsächlichen Identität unterscheiden.

**M1 – Walletadressen und Tokenkennungen werden teilweise unabhängig vom Netzwerk kleingeschrieben.**  
*Codebelegter Identitätsfehler; mittlere Priorität.*

[`assetKey()`](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/assets.js#L12) normalisiert Wallet-Contracts generell mit `lower()`. Der Walletimport vergleicht zusätzlich Adresse und Contract generell ohne Beachtung der Groß-/Kleinschreibung.

Das passt zu EVM-Adressen, aber nicht zu case-sensitiven Base58-Kennungen wie Solana-Adressen und SPL-Mints.

**Repro:** Zwei synthetische SPL-Positionen verwenden, deren gültige Kennungen sich ausschließlich in der Groß-/Kleinschreibung unterscheiden. `assetKey()` erzeugt denselben Schlüssel; die Importvergleichslogik kann sie ebenfalls gleichsetzen.

**Minimale Lösung:** Eine kleine netzwerkspezifische Normalisierung verwenden: EVM normalisieren, case-sensitive Kennungen exakt erhalten. Kein neues Assetmodell erforderlich.

**M2 – Ein undatierter automatischer Kurs kann einen als `observed` akzeptierten Renditeendpunkt erzeugen.**  
*Codebelegter Qualitätswiderspruch; mittlere Priorität.*

Die globale Aktualisierung speichert Tokenpreise ausdrücklich mit `quoteQuality='provider-undated'` und `quoteAsOf=null`. [`priceQuality()`](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/quote-quality.js#L13) kennzeichnet solche Kurse als ungeklärt.

[`snapshot()`](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/model.js#L126) berücksichtigt diese fehlende Datierung jedoch nicht ausreichend. Bei positivem Preis und leerem `priceStatus` kann der Stichtag `observed` werden. Die [Renditefunktionen](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/performance.js#L73) akzeptieren diesen Status.

**Repro:** Bestätigter manueller Startwert 100; heutiger Wert 110 aus einem automatisch geladenen undatierten Tokenpreis; keine Geldflüsse oder sonstigen Sperren. Der Endpunkt kann als `observed` gelten und eine Rendite ermöglichen, obwohl der Prüfbereich die Kursdatierung beanstandet.

Das beweist keinen falschen konkreten Anbieterpreis. Es belegt unterschiedliche Vertrauensregeln für denselben Wert.

**Minimale Lösung:** Die vorhandene Kursqualitätslogik bei automatisch erzeugten Stichtagen wiederverwenden und relevante FX-Nachweise berücksichtigen. Explizit bestätigte manuelle Gesamtbewertungen weiter erlauben. Besonders vor einer neuen „Gewinn/Verlust“-Anzeige aus #300 klären.

**M3 – Die allgemeine Restorevalidierung ist schwächer als die spezialisierten Finanzverträge.**  
*Codebelegte Validierungslücke; mittlere Priorität. Keine bestehende Datenkorruption nachgewiesen.*

[`safeImport()`](https://github.com/joke0071/foliolab-open/blob/652e80bcb31aec13c85a0457332bdf53cf98a521/src/model.js#L234) prüft bei einer allgemeinen Buchungs-/Journalverknüpfung insbesondere Typ und Positionsbezug. Die Gleichheit des Buchungsdatums mit dem Journaldatum wird dort nicht verlangt. Allgemeine Journalsequenzen werden außerdem nicht durchgehend auf gültige, eindeutige Reihenfolge geprüft.

**Repro:** Im modernen manuellen Kaufbeispiel aus `tests/backup-references.test.mjs` ausschließlich das Buchungsdatum ändern, das Journaldatum erhalten und `safeImport()` aufrufen. Die bestehenden allgemeinen Verknüpfungsprüfungen weisen diesen Datumswiderspruch nicht zurück. Buchungsansicht und journalbasierte Historie können dadurch unterschiedliche Tage verwenden.

**Minimale Lösung:** Die Konsistenz moderner, ausdrücklich journalisierter Buchungen gezielt prüfen und passende Negativtests ergänzen. Den vorhandenen Import älterer Buchungen ohne Journalverknüpfung erhalten. Keine rückwirkende Neuerzeugung alter Journale.

**L1 – Die Importmodule sind zunehmend eng miteinander verbunden.**  
*Verbesserungsvorschlag; niedrige Priorität.*

`transactions`, `model`, `csv-import`, Nettoplaner und Reconciliation importieren sich teilweise gegenseitig. Der Nettoplaner enthält inzwischen Quellenrekonstruktion, Validierung, Ergänzung, Backfill, Rücknahme und Mehrfachausführungen.

Das ist kein nachgewiesener Laufzeitfehler und kein Anlass für einen großen Umbau. Beim nächsten tatsächlich benötigten Ausbau sollten kleine gemeinsame interne Prüfhilfen doppelte Logik begrenzen. **Den genau zweigliedrigen Beleg Version 2 dabei unverändert erhalten.**

**Was die bestehende Architektur bereits trägt**

| Prüfbereich | Ergebnis |
|---|---|
| Identität und Überlappung | Exakte Payloadkonflikte und unterschiedliche Bankreferenzen werden im engen Nettopfad sinnvoll unterschieden. H1 betrifft einen angrenzenden Pfad. |
| Teilfüllungen und gemeinsamer Cashbeleg | 2:1 bindet genau drei Mitglieder; zwei Assetwirkungen und ein Cashposting. Weitere N:M-Fälle bleiben gesperrt. |
| Kosten, Gebühren, Steuern und FX | Decimalarithmetik und getrennte ungeklärte Differenz sind passend. Keine pauschale Kostenverteilung. Generische USD-Tests beweisen keine native Flatex-FX-Unterstützung. |
| Historische Bestände und Referenzen | Die neuen 2:1-Sperren für Referenzen, geschützte Kosten und unklare Chronologie sind konservativ und nachvollziehbar. |
| Journal, IndexedDB und CAS | Ein kanonischer Commit innerhalb einer IDB-Transaktion; veraltete Revisionen und Abbrüche werden geschützt. Keine zweite Speicherengine nötig. |
| Undo, Wiederimport und Restore | Die vorhandenen Belege decken den synthetischen 2:1-Ablauf einschließlich Quota, Abbruch nach `put`, Zweittab, Offline und verschlüsseltem Fresh-Restore ab. Sitzungs-Undo bleibt von dauerhafter Gruppenrücknahme zu unterscheiden. |
| Wallets und Staking | Mehrere Scannergrenzen werden ausdrücklich benannt. Fehlende Ledger-Anzeige und fehlende Stakes bleiben UNKNOWN. H2/H3 betreffen trotzdem wichtige Alltagspfade. |
| Kursversorgung und Rendite | Listing-/Währungsbindung und konservative Renditesperren sind vorhanden. M2 betrifft die Verbindung zwischen Kursqualität und Bewertungsstatus. |
| Komplexität | Die vorhandenen Kerne weiterverwenden; keine allgemeine Neuarchitektur empfohlen. |

Die **81 Originalgruppen sind bestehende Regressionen**, keine Realabnahme der neuen 2:1-Funktion. Ein echter 2:1-Originalfall fehlt weiterhin. Auch die 18 neuen Grenzfälle belegen korrektes Sperren zusätzlicher Konstellationen, keine bereits vorhandene 3:1-Fähigkeit.

**Welche P1-Arbeiten müssen vor #300 erledigt sein?**

| Aufgabe | Einordnung gegenüber UI-REFRESH01 |
|---|---|
| H1: doppelte native Quellenwirkung verhindern | Vor weiterer Importerweiterung und bevorzugt vor dem nächsten Produktpaket beheben |
| H2: Walletaktualisierung mit dem Journalvertrag verbinden | Vor dem nächsten Alltagsrelease beheben |
| H3: konkrete Walletdubletten erkennen | Vor neuen Aussagen über zuverlässige Gesamtwerte beheben |
| M2: belastbare Bewertungs-/Gewinnanzeige | Voraussetzung für die entsprechende neue Kennzahl in #300 |
| Bestehende Speicher-, Fehler-, Prüfbereichs- und Fokuswege erhalten | Unmittelbarer Integrationsvertrag von #300 |
| Vollständiges N:M und native FX | Kein allgemeines Vorabgate für kosmetische UI-Arbeit |
| Gesamte Staking-, Migrations- und Steuerabdeckung | Kann später folgen, solange Grenzen und Sperren erhalten bleiben |
| Dauerhafte 2:1-Gruppenrücknahme | Sinnvoller späterer Fachschnitt; keine Voraussetzung für Icons und Navigation |
| Drive-Synchronisierung, CSP-Härtung, umfassende CI-Optimierung | Eigenständige Folgepakete |
| Echte Android-/iOS-Nachweise | Erforderlich für entsprechende Gerätebehauptungen; fehlende Hardwareabnahme ausdrücklich offen halten |

Für #300 gilt insbesondere der aktuelle Nachtrag: kompakter Gesamtwert am Verlauf, „Gewinn“ nur bei belegter Berechnung, sonst passend bezeichnete Veränderung oder Nichtverfügbarkeit; dazu ein kompakter Zugang zum bestehenden Prüfbereich. Daraus sollte keine neue Berechnungs- oder Prüfengine entstehen.

**Empfohlene nächste fünf Entwicklungsschritte**

1. **Native Quellenbindung schließen:** H1 mit Wiederimport unter geändertem Zielkonto absichern; echte unterschiedliche Ausführungen erhalten.
2. **Walletaktualisierung vereinheitlichen:** H2 im globalen Refresh und Rescan beheben, einschließlich unveränderter Journale, fehlgeschlagener Speicherung und Reload.
3. **Walletidentität absichern:** H3 und M1 mit netzwerkspezifischem Vergleich und ausdrücklicher Behandlung zusätzlicher Darstellungen lösen.
4. **Bewertungs- und Restoregrenzen nachziehen:** M2 und die kleinen modernen Konsistenzprüfungen aus M3 getrennt und gezielt bearbeiten.
5. **Ein begrenztes #300-Paket liefern:** Navigation, Icons, Auswahl und kompakte Darstellung auf den bestehenden Finanzzuständen aufbauen. Die umfangreichere Sekundärnavigation weiterhin erst anhand ihres konkreten Nutzens entscheiden.

**Urteil zu 3:1 EUR:** Nach den grundlegenden Korrekturen kann UH05 damit fortfahren. Als unmittelbar nächster Schnitt bietet es gegenüber den gefundenen Alltagspfaden weniger Nutzen. Außerdem löst eine dritte Ausführung weder die bestehenden historischen Referenzgrenzen noch die fehlende reale 2:1-Evidenz.

Bei einer späteren Umsetzung genügen der vorhandene Kern, eine ausdrücklich versionierte vollständige Vier-Mitglieder-Gruppe, unabhängige Decimal-Sollwerte und die bestehende atomare Import-/Undo-/Restorekette. Kein beliebiges N freigeben und Version 2 nicht stillschweigend umdeuten.

**Kompakte Übergabe an Owner `414503ed33c6`**

> Unabhängiger lesender Review auf festem v289-Main abgeschlossen. v289 bleibt LIVE_ACCEPTED; keine erneute Abnahme. Drei hohe codebelegte Befunde zuerst reproduzieren: native Bankquelle unter zweitem lokalen Depot erneut wirksam; globaler Walletrefresh widerspricht festgehaltenem Eröffnungsbestand; identische Wallet unter mehreren Konten doppelt bewertet. Mittlere Befunde: netzwerkunspezifische Kleinschreibung, undatierte automatische Kurse als akzeptierte Renditeendpunkte, allgemeine Restorekonsistenz. Der enge 2:1-Kern zeigt im geprüften Umfang keinen neuen Blocker. 3:1 EUR fachlich möglich, aber hinter den grundlegenden Korrekturen. Vollständige FX-/Staking-/Hardwareabdeckung muss einen begrenzten UI-Refresh nicht pauschal blockieren. Sämtliche vorhandenen Schutzverträge und Belege erhalten.

**Keine Änderungen, Kommentare, Commits, CI-Starts oder Sicherungsänderungen vorgenommen. Die alleinige Verantwortung bleibt bei `414503ed33c6`.**