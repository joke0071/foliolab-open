# Fachliches Code-Review PR336 · 14.11.2026

Prüfgegenstand: Main a27cde2f802c26bfec41190911d88bd1d7d8e325 → ursprünglicher PR-Head f36da5e8023d10b1ddb1f8a458200743e0f34da6; anschließend minimaler Korrekturhead 6399c771d984f55f8abee813f8a7a6e8c584ecf1 (Tree8e2d1c5f956a1729f2de9b89f24e07510e801b35).
PR https://github.com/joke0071/foliolab-open/pull/336.
Serielles internes Agentenreview; keine unabhängige menschliche oder kryptografische Freigabe.

## Behobener Befund: strukturierter exakter Restorekurs wurde finanziell wirksam

Priorität hoch; reproduzierbarer Fehler im ursprünglichen Head, im Korrekturhead behoben.
Stelle: src/model.js:103–114, Eingang safeImport:201, tatsächlicher Drivecallback src/app.js:2564–2597.
Auslöser: gültige Position mit quantity2/price100, aber priceExact:[123.45].
Ursache: der ergänzte Typguard erfasste nur price. units(priceExact) wandelte ein einwertiges Array per String in einen Dezimalwert um.
Nutzerwirkung: tatsächlicher restoreData-Callback übernahm und speicherte price100/priceExact123.45; exakte Bewertung246.9 statt200. Reproduktion mit realem Modell/Callback und synthetischem Saveadapter, kein neu behaupteter nativer IDB-Test.
Vorhandene restore-price-types-Tests löschten priceExact und prüften ausschließlich price. Neuer Regressionstest am alten Head fehlgeschlagen (5PASS/1FAIL, Missing expected exception).
Korrektur: eine skalare Typprüfung für vorhandenes priceExact; zwei Regressionstests in tests/restore-price-types.test.mjs:49/60. 24 ungültige Version-/Typkombinationen prüfen Ablehnung vor Rückfallsicherungsangebot, Modellwechsel oder Save sowie unveränderte Eingabe. Gegenprobe bewahrt skalare exakte Kurse und bestehende numerische Legacy-Abweichungen.
Eine autorisierte Branchkorrektur verbraucht; kein weiterer Produktpush, kein SW-Bump, kein Testlockern.

## Weitere fachliche Bewertung des Diffs

| Frage | Verfolgter Pfad und Beurteilung |
|---|---|
| Kurse und FX | Alpha-Rohschlusskurse werden vor Cacheübernahme typgeprüft. fetchSecurityQuote/priceNumber prüft zusätzlich die 18-stellige Speicherung; der alternative Workerpfad prüft p.close bereits als endliche primitive Zahl, Marketstack prüft den Rohdatentyp. CoinGecko-Coin-/Tokenpreise werden anhand angefragter IDs gefiltert; Paprika und DefiLlama prüfen Rohpreise/Metadaten. referenceRate verwendet bestehenden positionFX-Wertebereich; current, compatibility, einzelne historische und gebündelte FX sowie Paprika-USD-Konversion wurden gelesen. Aufrufer refreshSources, Legacy-Kurskorrektur, Token-Discovery, historischer Buchungs-FX und Historienübernahme verwenden diese geprüften Quellen. Kein weiterer belegter Pfad für Überschreiben durch ungültige Antworten oder UNKNOWN→bekannt aus ungültigen Daten gefunden. |
| Buchungen | references dekodiert JSON-Werte und Schlüssel rekursiv, schließt unlesbare Unicodecodierungen und Prüflimitüberschreitung aus. previewBookingChange prüft vor Kandidatenmutation; prepareBookingChange ruft dieselbe volle Prüfung nach Bestätigung erneut auf. UI ruft assertCurrent und prüft erwartetes Modell, Storage übernimmt CAS. Unbekannte/leer/strukturierte Gebühren/Steuern erlauben keine wirtschaftliche Änderung; Notizänderungen bewahren sie und zeigen unbekannt. Zulässige unabhängige Rücknahme und exaktes Undo bleiben belegt (120→100, A/B-Matrix und Tests). Archivieren ist eine reine Sichtbarkeitsmutation; Undo erfordert unveränderten exakten Receiptzustand. |
| Restore | safeImport läuft vor Rückfallsicherungsangebot und Modellwechsel. save markiert committed erst nach bestätigtem PortfolioStorage.save; IDB-Revision wird erst nach tx.oncomplete aktualisiert. Vor Commitabbruch Fehler/Reload, kein Erfolg/keine Passwortadoption; nach bestätigtem Commit lösen Render-/Statusfehler keinen Modellrollback aus. Header/mobile Status unterscheiden gespeichert/Anzeige prüfen. Drive trennt Portfoliocommit, Einstellungsnachbereitung, Passwortübernahme und Abschlussanzeige; restoreCommitted erst nach aufgelöstem Save/Recovery. Partieller Passwortfehler behauptet keine vollständige Passwortübernahme und rät nicht zum erneuten Portfolioimport. created:false erfindet keinen Backupzeitpunkt. Recovery-Gesamtabnahme bleibt K4 PARTIAL; kein vollständiger Crash-/Quota-/OAuth-/Kryptobeleg aus diesem Review abgeleitet. |
| PWA | Im ursprünglichen Head war das komplette Delta zur Produktbasis8f9ed1ce ausschließlich CACHEv311→v313. Nach der autorisierten Reviewkorrektur kommen exakt Modellguard und Regressionstests hinzu. v312 bleibt reserviert; Installationslogik, Assetliste, Fetchverhalten, Workflows, Manifest und Styles bleiben unverändert. Alte Updatebelege gelten für f36da5e8. Der neue automatische Integrationslauf am Merge3c7206dac7133282240fe5007816e7b558724256 hat exakt denselben Tree wie6399c771 und führt die vorhandene echte SW/IDB-Updateprüfung für diesen Stand aus; Die neuen Updatebelege für Chromium/Firefox/WebKit sind PASS; alle154Asset-Hashes einschließlich des korrigierten model.js entsprechen den Quellen. Drei Nachupdatebilder wurden tatsächlich angesehen. |

Kein weiterer bestätigter Fehler im geprüften Produktdelta. Keine zusätzliche offene fachliche Frage aus diesem Review abgeleitet.
Bekannte externe Abnahmegrenzen bleiben ausdrücklich getrennt: reale Geräte/Windows/Edge/Android, echtes OAuth/Drive/Decrypt/Passwortübernahme und CR4/CR5-unabhängiges Kryptoreview; FLH04 NOT DONE/K4 PARTIAL. Informativer Audit ist kein allgemeiner Providerverfügbarkeitsnachweis. Historischer Mainlauf43332355188 bleibt separat und ungeklärt.

## Validierung des korrigierten Heads und Empfehlung

- Automatisch gestartete PR-Läufe, jeweils Versuch1/Head6399c771: Integration43575921072SUCCESS, Wallet43575921060SUCCESS, informativerWalletaudit43575921079SUCCESS. 1455/1455Node-Tests/0FAIL/0SKIP in Integration und Wallet; SyntaxPASS; Chromium und alle3Firefox/WebKit-CrossjobsSUCCESS. FAST/deploy/live-acceptanceSKIPPED.
- Tatsächlich geprüfter Merge3c7206dac7133282240fe5007816e7b558724256: Tree8e2d1c5f956a1729f2de9b89f24e07510e801b35 identisch zu Head6399c771. Keine Wiederholung eines unveränderten alten Laufs, keine Reruns/Dispatches/Diagnosetrigger.
- Lokale Zielprüfung67/67/SyntaxPASS an146gepinnten Produktquellen; Erstbefund5PASS/1FAIL und tatsächlicher Restorecallback-Beleg bleiben erhalten. Ein fehlendes unverändertes lokales Testfixture wurde ergänzt; der erste Setupfehler bleibt erhalten.
- Alte305Node-/29nativeFallbelege bleiben an Produkt8f9ed1ce gebunden, alte PR-CI/Originale an f36da5e8; keine Umdeutung zu neuen nativen29Fällen. Der frühere43567167015 bleibtFAILURE28PASS/1fehlendeFaultinjektion.
- Neue6OriginalZIPs/7exaktePluginJoblogtexte, Metadaten, Reports/Bilder und Quellinputs werden im separaten Originalpaket erhalten. Sicherungs- und Rückleseergebnis: siehe [Review-Ergebniszuordnung](product-pr336-review-result-2026-11-14.json).

**Empfehlung für exakt6399c771d984f55f8abee813f8a7a6e8c584ecf1:** Nach der vorgeschriebenen unabhängigen Freigabe fachlich zum Merge empfehlen. Kein verbleibender mergehindernder Codebefund im geprüften Umfang. Dieses interne Review liefert keine unabhängige Freigabe und keine Gesamtfreigabe für K4/FLH04/Kryptografie, reale Geräte oder Produktion.
Nächster Entscheidungsschritt: Jochen prüft die vorgeschriebene unabhängige Freigabe und entscheidet separat über den Merge genau dieses Heads. Kein Merge/Auto-Merge/Mainpush/Deployment/Release/LIVE_ACCEPTED ausgeführt oder daraus autorisiert.
