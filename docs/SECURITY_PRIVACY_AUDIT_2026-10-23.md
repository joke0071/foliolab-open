# FolioLab Open – Security- und Datenschutz-Teilaudit

**Datum:** 23. Oktober 2026  
**Ausgangs-Commit:** `abdd337955e9df2e6ceade89147bebcc772f0b7c`  
**Audit-Branch:** `audit/2026-10-23-security-privacy`  
**Charakter:** Risikobasierte Quellcodeprüfung + Regressionstests, keine formale OWASP-ASVS-Zertifizierung und kein professioneller Penetrationstest.

## Bedrohungsmodell

Die PWA läuft lokal auf dem Gerät und verwaltet Portfolio-, Konto-, Wallet-Watch-only- und API-Zugangsdaten in der Browserumgebung. Die zentrale Gefahr ist der Zugriff von fremdem oder eingeschleustem JavaScript auf denselben Browser-Origin. Weitere Angriffsflächen sind externe Markt-/RPC-Fehlermeldungen, lokale Backup-Imports und optionale Metadatenanbieter.

**Keine** Seed-Phrases oder private Wallet-Schlüssel sind für die vorgesehenen Watch-only-Funktionen erforderlich. Die eingegebenen Anbieter-API-Schlüssel können unter `localStorage` unverschlüsselt im lokalen Browserprofil gespeichert werden. Das ist eine bestehende Produkteigenschaft und kein Schutz vor kompromittierten Geräten, Browsererweiterungen oder originprivilegiertem JavaScript.

## Befunde und Korrekturen

| ID | Priorität | Befund | Gegenmaßnahme |
|---|---|---|---|
| SEC-01 | **P1** | Optionaler TradingView-Chart lud beim Klick fremdes JavaScript in den selben JavaScript-Origin wie Portfolio und Schlüssel | Dynamischen Drittanbieterscript entfernt; externer Chart wird nur nach Nutzerklick als gesonderter **Cross-Origin-Iframe** eingebettet; Sandbox und `no-referrer`; externer Direktlink bleibt als Fallback |
| SEC-02 | **P1** | Bisherige CSP erlaubte `https://s3.tradingview.com` in `script-src` | `script-src 'self'` – keine externen Skripte mehr erlaubt. `frame-src` erlaubt isolierte TradingView-Einbindung |
| SEC-03 | P2 | Eine Datenanbieter-Fehlermeldung konnte eingegebene API-Schlüssel bzw. eine URL mit API-Schlüssel spiegeln | Keine unkontrollierten Upstream-JSON-Fehlermeldungen in UI; Netzwerkfehler werden auf sensible URLs/Tokens geprüft |
| SEC-04 | P2 | Der Solana-RPC-Service gab den konfigurierten RPC-Endpunkt inklusive optionaler Query-API-Schlüssel als `provider` zurück; RPC-Fehler konnten Anbieter-Text spiegeln | Provider-Attribution auf Hostname beschränkt; nur standardisierter JSON-RPC-Code in Fehlermeldungen |
| SEC-05 | P2 | Optionale externe Wertpapiermetadaten wurden per `...item` mit unbekannten Drittanbieterfeldern in den Anwendungskontext übernommen | Explizite Allowlist dokumentierter Felder mit Längenbeschränkungen; keine unkontrollierten Extras |
| SEC-06 | P3 | `frame-ancestors 'none'` stand in einer CSP-`meta`-Direktive, obwohl diese Direktive dort nicht wirksam ist | Ineffektive Direktive entfernt und Clickjacking-Schutz als offene HTTP-Header-Frage dokumentiert |

## Automatisierte Nachweise

`tests/security-privacy.test.mjs` prüft mit synthetischen Testgeheimnissen:

- Datenanbieter spiegelt eigenen API-Schlüssel im Antworttext: kein Geheimnis im Fehler
- Netzwerkfehler enthält vollständige geheime RPC-URL: kein Geheimnis im Fehler
- Solana-RPC liefert Erfolg: die resultierende Provider-Metadatenantwort enthält keinen Schlüssel
- Solana-RPC liefert einen Fehler, der die private URL enthält: kein Geheimnis in der angezeigten Fehlermeldung
- Externe Metadaten mit unbekannten Attributen oder scriptartigen Strings: unbekannte Felder werden nicht übernommen
- Unverschlüsseltes JSON-Backup: API-Schlüssel und eigene Solana-RPC-URL werden nicht exportiert
- CSP und Chart-Code: kein Drittanbieterscript im App-Origin; TradingView nur isoliert per Frame

Die bestehenden Chromium-Browserprüfungen für TradingView wurden auf **direktes Cross-Origin-Iframe** mit überprüfter Symbol- und Intervalleinstellung, Sandbox und ohne externes `<script>` umgestellt. Sie überprüfen außerdem Bestands- und Notierungsdatenintegrität in mehreren Viewports.

Die allgemeinen CI-Release-Gates (Unit-Tests, Syntax, Browser-Tests in Chromium, Firefox und WebKit, Accessibility-Smoke, GitHub-Pages-Deploy und HTTP-Live-Check) bleiben aktiv.

## Nachgewiesene und nicht nachgewiesene Sicherheit

Die frühere Script-Einbindung stellt eine **unnötige technische Zugriffsberechtigung** dar; es gibt **keinen Nachweis**, dass der Drittanbieter die API-Schlüssel oder Portfolioinhalte tatsächlich ausgelesen hat. Die Frame-Isolierung reduziert diese Angriffsmöglichkeit, nicht aber die normale Offenlegung des abgefragten Symbols und der Verbindungsmetadaten beim Chartabruf.

Externe Datenanbieter erhalten bei aktivem API-Abruf die für die Anfrage nötigen Instrumente bzw. öffentlichen Walletadressen. Das ist funktional bedingt und in der UI weiterhin transparent zu erläutern.

## Grenzen und Folgeaufgaben

1. **CSP HTTP-Header:** Eine über `meta` gesetzte Richtlinie kann `frame-ancestors` nicht durchsetzen. GitHub Pages erlaubt hier keine frei konfigurierbaren Response-Header. Für wirksamen Clickjacking-Schutz wäre ein Host mit konfigurierbaren Security-Headers nötig.
2. **`connect-src https:` ist weit:** Diese Vorgabe ermöglicht nutzerdefinierte HTTPS-RPC-Endpunkte und Marktanbieter. Im hypothetischen Fall einer eigenen App-XSS-Lücke bleibt ein Exfiltrationsrisiko; die Begrenzung auf `script-src 'self'` und konsequentes Escaping sind daher wichtig.
3. **Unverschlüsselte lokale API-Schlüssel:** Gegen kompromittierte Geräte/Extensions kein Schutz. Optionaler Verzicht auf persistente Schlüssel bzw. verschlüsselte lokale Schlüsselablage wäre ein eigenständiges UX-/Migrationsprojekt.
4. **Iframe-Widget:** Ein externer Chart kann bei CORS-/Embedding-/Anbieteränderungen unavailable sein; der manuelle TradingView-Link bleibt als Fallback. Ein strukturell getesteter Iframe ist kein Nachweis, dass TradingView jederzeit Marktdaten ausliefert.
5. **Vollständige Sicherheitsprüfung:** Formales OWASP-ASVS-Mapping, Browser-Extensions, DOM-XSS-Fuzzing, Supply-Chain-Prüfung und manueller Penetrationstest sind ausständig.

**Release-Regel:** Kein Merging oder produktiver Deploy, solange die gesamte CI für den letzten Commit nicht erfolgreich ist; Dokumentation und Ergebnisse müssen mit dem tatsächlichen Head-Commit übereinstimmen.
