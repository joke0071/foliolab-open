# K2-KURSE · Zugangsdaten an der Requestgrenze

## Umfang und Abnahmekriterium

Roadmap: K2-KURSE / #266 und bestehender SEC-03-Vertrag aus dem Datenschutz-Teilaudit. Ausgangsbasis ist der vollständig akzeptierte PR341-Main `0d1638cb2034805dace789e3072fbb7bcda8d52c`, Tree `2644817dfb558da9668ec0a55bd7e6092cd80324`. [v317-Releaseabschluss und Originalpins](https://github.com/joke0071/foliolab-open/blob/44587fe71a82957b18dad1f7edcdfa4d041c2d6c/docs/V317_RELEASE_ACCEPTANCE_2026-11-15.md). Dieser Folgeschnitt benötigt seine eigene reguläre PR-Qualifikation und spätere Mergeentscheidung.

Bei einem Netzwerkfehler darf ein konfigurierter API-/Bearer-Schlüssel weder vollständig noch durch die 180-Zeichen-Kürzung teilweise in die angezeigte Fehlermeldung gelangen. Cache und laufende Anfragen müssen unterschiedliche Zugangsdaten in allen unterstützten Headerformen trennen. Harmlose kurze Diagnosen, begrenzte Retries, Retry-After, Quellfallback und erfolgreiche Antworten bleiben nutzbar.

Abnahme: konkrete Gegenfälle am unveränderten Ausgangscode reproduzieren, danach denselben Vertrag erfolgreich prüfen; bestehende Datenschutz-/Quellen-/Cache-/Retrytests erhalten. Zusätzlich tatsächlicher Chromium-Gegencheck mit unverändertem vollständigem IndexedDB-Portfoliorecord. Anschließend reguläre PR- und Wallet-CI. Merge, Main und Deployment benötigen eine separate Entscheidung von Jochen.

## Reproduzierter Befund

- Die bisherige Diagnose kürzt vor der Prüfung auf 180 Zeichen. Bei 170 harmlosen Zeichen plus synthetischem Schlüssel wird nur dessen Präfix sichtbar; die vollständige Schlüsselprüfung greift nicht mehr. Auch der tatsächlich verwendete Verbraucher `cryptoPrices` reicht dieses Präfix weiter.
- Beim aktuellen Worker-Header `authorization: Bearer <Token>` wird eine Fehlermeldung mit nur `<Token>` nicht erkannt.
- `Object.entries` erfasst native `Headers` nicht und interpretiert Header-Paarlisten nicht als Headernamen/-werte. Zwei native `Headers` mit unterschiedlichen Zugangsdaten teilen dadurch denselben Cacheeintrag; die zweite Anfrage erhält die erste Antwort.

Alle Belege nutzen ausschließlich synthetische Schlüssel und Fetcher. Kein tatsächlicher Abfluss von Nutzerzugängen behauptet.

## Begrenzte Korrektur

Vollständige Diagnose vor der Kürzung prüfen; sensible Headerwerte und den Tokenanteil von Bearer/Basic erkennen. Headerformen über die native `Headers`-Semantik kanonisieren und dieselben Einträge für Diagnose und Cacheidentität verwenden. Die tatsächlich gesendeten Header werden aus diesem Snapshot erzeugt; eine spätere Mutation des übergebenen Objekts kann keine wartende Anfrage unter einer abweichenden Identität ausführen. Ungültige Header liefern eine feste Meldung ohne ihren Inhalt.

Keine neue Provideranfrage, Persistenz, Datenmigration oder Finanzmutation. Retries, Fristen und TLS-Regeln bleiben unverändert. Für die geänderte ausgelieferte Datei wird die bestehende Cacheversion auf v318 erhöht; ASSETS und Workerlogik bleiben bytegleich. Der Kandidat umfasst genau vier Dateien: Request-Cache, neun Regressionen, diese Taskkarte und die erforderliche Cacheversion.

## Lokale Nachweise

Alle neun neuen Regressionen scheiterten am unveränderten Main. Nach der Korrektur bestehen diese neun Regressionen und 29 bestehende gezielte Tests: **38 PASS, 0 Fehler/Skips**, Node 24.22.1. Eine zusätzliche ungültige Headerfixture wurde vor Freeze berichtigt: ein abschließender Zeilenumbruch wird von nativen Headers korrekt getrimmt; erst ein eingebetteter Zeilenumbruch ist ungültig. Keine Assertion oder Produktfrist gelockert.

Chromium 141.0.7390.37 mit vorhandenem Playwright 1.62.1: sechs vollständige/gekürzte Fehlertexte über Objekt, Headers und Paarliste schlüsselfrei; zwei unterschiedliche Zugangsdaten erzeugen zwei getrennte Antworten; vollständiger nativer Portfoliorecord einschließlich Revision exakt unverändert. Erstes Setup erreichte den lokalen Server nicht; erfolgreiche Probe startet Server und Browser im selben Prozesskontext. Kein Produktfehler oder zusätzlicher CI-Retry daraus abgeleitet.

Kein Realprovider-, Windows-/Android-, Produktions- oder vollständiger Datenschutz-Auditnachweis. Die geparkten A09-/Grafikherkunftsfragen werden nicht geöffnet. Status und endgültige Originalpins stehen im aktuellen HND01-Checkpoint.
