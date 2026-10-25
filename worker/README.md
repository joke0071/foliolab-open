# Cloudflare Worker für optionale Wertpapiersuche und EODHD-Kurse

Der vorbereitete Worker kann FolioLab Open mit öffentlichen **Wertpapier-Stammdaten** von OpenFIGI v3 verbinden und **optional historische EODHD-Schlusskurse** abrufen. Der EODHD-API-Schlüssel bleibt dabei ausschließlich als Secret im eigenen Cloudflare-Konto. Der Worker erhält keine Depotbestände oder Wallet-Adressen. Die Einrichtung ist nur für Nutzer gedacht, die eine zusätzliche Onlinesuche möchten. **Der Worker wird nicht automatisch veröffentlicht.** Ohne ihn funktionieren weiterhin lokale Suche, manuelle Anlage und CSV-Import.

## Einrichten in fünf Schritten

1. [Cloudflare-Konto](https://dash.cloudflare.com/sign-up) anlegen oder anmelden. Auf einem vertrauenswürdigen Computer [Node.js](https://nodejs.org/) ab Version 20 installieren.
2. Das [FolioLab Open Repository](https://github.com/joke0071/foliolab-open) herunterladen bzw. klonen und ein Terminal im heruntergeladenen Projektordner öffnen.
3. Den Worker in **deinem eigenen** Cloudflare-Konto veröffentlichen:

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Wrangler kann bei der ersten Verwendung zur Installation und Autorisierung auffordern. `worker/wrangler.toml` legt Namen und Einstiegsdatei fest.

4. Die HTTPS-URL aus der Ausgabe kopieren (Beispiel: `https://foliolab-open-instruments.DEIN-SUBDOMAIN.workers.dev`). **Hinweis:** Ein direkter Test von `/api/instruments/search` in der Browser-Adresszeile kann absichtlich mit `403` antworten, weil dabei der erforderliche `Origin`-Header fehlt. Prüfe den Dienst nach dem Speichern der Basisadresse aus FolioLab heraus oder über den CORS-Live-Test des GitHub-Workflows. Ein leeres Suchergebnis ist kein Zeichen dafür, dass der Dienst kaputt ist.
5. In FolioLab Open **Mehr → Datenquellen & Aktualisierung → Erweiterte Wertpapiersuche** öffnen. Nur die **HTTPS-Basisadresse**, ohne `/api/...`, ohne Abfrageparameter und ohne Zugangsdaten, einfügen und auf **Suchdienst speichern** tippen. Anschließend im Anlage-Assistenten nach Name oder ISIN suchen. Ergebnisse auf tatsächliche Börse, Ticker und Währung prüfen.

**Wichtig:** `https://dein-worker.workers.dev` ist nur ein Platzhalter, keine öffentlich erreichbare FolioLab-API. GitHub Pages stellt diesen Worker nicht bereit; ein Worker wird separat bei Cloudflare betrieben. Wenn du keinen Worker betreiben möchtest, kannst du das Feld leer lassen.

## Optional: Eigener EODHD-Kursdienst (native Diagramme)

Direkte EODHD-Abfragen von GitHub Pages können durch Browser-CORS blockiert werden. Der selbst betriebene Worker ruft die fest definierte EODHD-API serverseitig ab. Dieser Kursdienst ist unabhängig von der OpenFIGI-Suche: Du kannst nur die Suche, nur Kursdaten oder beides verwenden. **Es gibt keinen für alle Nutzer bereitgestellten Proxy und keinen gemeinsamen EODHD-Schlüssel.**

1. Den oben beschriebenen Worker in deinem **eigenen Cloudflare-Konto** bereitstellen. Verwende dafür das aktuelle `worker/src/index.js` und `worker/src/market.js`.
2. Deinen **eigenen EODHD-API-Schlüssel** als Worker-Secret setzen. Im Projektverzeichnis `worker` ausführen:

   ```bash
   npx wrangler secret put EODHD_TOKEN
   ```

   Den Schlüssel in der geschützten Eingabeaufforderung eingeben. Er gehört **nicht** in den Code, nicht in `wrangler.toml` und nicht auf GitHub.
3. Einen unabhängigen, ausreichend langen Zugriffs-Token erzeugen, z. B. mit `openssl rand -hex 32`. Diesen Wert sicher aufbewahren und als zweites Worker-Secret hinterlegen:

   ```bash
   npx wrangler secret put MARKET_ACCESS_TOKEN
   npx wrangler deploy
   ```

   Beim `secret put` genau den soeben erzeugten Zugriffsschlüssel eingeben. Die normale EODHD-API-Kennung ist **nicht** der Zugriffsschlüssel.
4. In FolioLab Open **Mehr → Datenquellen & Aktualisierung → Eigener EODHD-Kursdienst** öffnen. Dort die HTTPS-Basisadresse deines Workers (ohne Pfad, z. B. `https://foliolab-open-instruments.DEINE-SUBDOMAIN.workers.dev`) und genau denselben `MARKET_ACCESS_TOKEN` eingeben und speichern. Falls du schon einen OpenFIGI-Worker betreibst, kannst du **denselben aktuellen Worker** mit den ergänzten Secrets verwenden.
5. Im Portfolio unter **Positionen** den echten Börsencode (z. B. `VWCE.XETRA`, Handelsplatz Xetra, MIC `XETR`, EUR) bestätigen und **Aktualisieren** drücken. In der Übersicht erscheint der native Kursverlauf, sobald dein Worker gültige historische Schlusskurse liefert.

**Ohne Worker** bleiben direkte EODHD-/FMP-/Twelve-Data-Anbindungen und CSV-Kursimporte verfügbar. Ein Worker behebt CORS, aber nicht einen ungültigen EODHD-Schlüssel, einen unzureichenden Tarif oder eine falsche Börsenkennung. Es gibt keine automatische Cloudflare-Veröffentlichung durch das FolioLab-Open-Repository.

### EODHD-Sicherheit

- Nur `POST /api/market/eodhd` ist erlaubt, mit einem `Authorization: Bearer`-Token. Ein bloßer CORS-Origin-Check wäre **kein** ausreichender Zugriffsschutz.
- **Keine offene Proxy-URL:** Der Worker ruft ausschließlich `https://eodhd.com/api/eod/` mit validiertem Börsensymbol und engem Datumskorridor auf. Der Browser sendet nur Börsensymbol und angefragte Tage, **keine** Stückzahlen, Depot- oder Wallet-Daten und keinen EODHD-Schlüssel.
- Der EODHD-Schlüssel bleibt als Cloudflare Secret serverseitig; der Worker-Zugriffsschlüssel wird lokal im Browser gespeichert und ausschließlich an den **explizit gewählten** Worker übertragen. Er wird nicht in Backups exportiert, nicht in URLs eingebettet und nicht an OpenFIGI weitergegeben. Verwende nur deinen eigenen, vertrauenswürdigen Worker.
- Antworten enthalten keine Zugangsdaten. Keine Kursanfragen zwischenspeichern, wenn dadurch fremde Nutzer Zugriff erhalten könnten. Endpunkte sind `no-store`; Kursabdeckung und API-Limits richten sich nach deinem EODHD-Tarif.
- Bei Verlust oder öffentlicher Weitergabe eines Schlüssels diesen bei Cloudflare bzw. EODHD erneuern.

## Alternative: kontrolliertes GitHub-Actions-Deployment

Für eine reproduzierbare Veröffentlichung ohne lokales Terminal gibt es einen **manuell auslösbaren** Cloudflare-Workflow mit Syntax-/Unit-Tests und Live-CORS-Gate. Er benötigt die Repository-Secrets `CLOUDFLARE_ACCOUNT_ID` und `CLOUDFLARE_API_TOKEN`, veröffentlicht nicht automatisch auf jedem Commit und verändert die GitHub-Pages-PWA nicht. Die EODHD-Secrets gehören weiterhin ausschließlich in Cloudflare. Siehe [vollständige Anleitung](../docs/CLOUDFLARE_WORKER_DEPLOYMENT.md).

## Technik und Sicherheit

- `GET /api/instruments/search?q=world%20etf` → OpenFIGI `POST /v3/search`
- `GET /api/instruments/resolve?isin=IE00BK5BQT80` → OpenFIGI `POST /v3/mapping`
- `POST /api/market/eodhd` → autorisierter EODHD-Schlusskursabruf vom eigenen Worker
- Versioniertes JSON mit `status`, `source` und `results`. OpenFIGI-Treffer können ISIN, Währung oder Notierungsdetails offenlassen; eine automatische sichere Zuordnung ist nicht garantiert.
- Die Stammdatensuche übermittelt nur Suchbegriff bzw. ISIN an OpenFIGI. Für den optionalen Marktdienst gehen ausschließlich Börsensymbol und Datumsbereich an EODHD; der EODHD-Schlüssel bleibt als eigenes Worker-Secret geschützt.
- CORS ist auf `https://joke0071.github.io` und konfigurierte vertrauenswürdige Origins beschränkt; der Worker akzeptiert kein frei übergebenes Ziel für Proxy-Aufrufe.
- Ohne OpenFIGI-Zugangsschlüssel galten zum Implementierungszeitpunkt Limits von 5 Such- und 25 Mapping-Anfragen pro 60 Sekunden. Der Edge-Cache ist kein globaler Rate-Limiter; Upstream-Fehler 429 bleiben sichtbar.
- Es existiert kein automatisches Worker-Deployment per GitHub Actions; Live-Antworten, CORS und Nutzungsrechte sind vor einem öffentlichen Betrieb zu verifizieren.

Tests aus dem Repository-Hauptverzeichnis:

```bash
node --test worker/tests/*.test.mjs
```

OpenFIGI-Dokumentation: https://www.openfigi.com/api/documentation
