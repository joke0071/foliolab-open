# Cloudflare Worker für die optionale Wertpapiersuche

Der vorbereitete Worker verbindet FolioLab Open mit öffentlichen **Wertpapier-Stammdaten** von OpenFIGI v3. Er liefert **keine Kurse** und erhält keine Depotbestände oder Wallet-Adressen. Die Einrichtung ist nur für Nutzer gedacht, die eine zusätzliche Onlinesuche möchten. **Der Worker wird nicht automatisch veröffentlicht.** Ohne ihn funktionieren weiterhin lokale Suche, manuelle Anlage und CSV-Import.

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

4. Die HTTPS-URL aus der Ausgabe kopieren (Beispiel: `https://foliolab-open-instruments.DEIN-SUBDOMAIN.workers.dev`). Über `https://DEINE-URL.workers.dev/api/instruments/search?q=world%20etf` prüfen, ob der Dienst eine JSON-Antwort liefert. Ein leeres Ergebnis ist kein Zeichen dafür, dass der Dienst kaputt ist.
5. In FolioLab Open **Mehr → Datenquellen & Aktualisierung → Erweiterte Wertpapiersuche** öffnen. Nur die **HTTPS-Basisadresse**, ohne `/api/...`, ohne Abfrageparameter und ohne Zugangsdaten, einfügen und auf **Suchdienst speichern** tippen. Anschließend im Anlage-Assistenten nach Name oder ISIN suchen. Ergebnisse auf tatsächliche Börse, Ticker und Währung prüfen.

**Wichtig:** `https://dein-worker.workers.dev` ist nur ein Platzhalter, keine öffentlich erreichbare FolioLab-API. GitHub Pages stellt diesen Worker nicht bereit; ein Worker wird separat bei Cloudflare betrieben. Wenn du keinen Worker betreiben möchtest, kannst du das Feld leer lassen.

## Technik und Sicherheit

- `GET /api/instruments/search?q=world%20etf` → OpenFIGI `POST /v3/search`
- `GET /api/instruments/resolve?isin=IE00BK5BQT80` → OpenFIGI `POST /v3/mapping`
- Versioniertes JSON mit `status`, `source` und `results`. OpenFIGI-Treffer können ISIN, Währung oder Notierungsdetails offenlassen; eine automatische sichere Zuordnung ist nicht garantiert.
- Nur der eingegebene Suchbegriff bzw. die ISIN wird an den konfigurierten Worker und OpenFIGI übertragen, keine Konten, API-Schlüssel, Positionen oder Wallet-Adressen.
- CORS ist auf `https://joke0071.github.io` und konfigurierte vertrauenswürdige Origins beschränkt; der Worker akzeptiert kein frei übergebenes Ziel für Proxy-Aufrufe.
- Ohne OpenFIGI-Zugangsschlüssel galten zum Implementierungszeitpunkt Limits von 5 Such- und 25 Mapping-Anfragen pro 60 Sekunden. Der Edge-Cache ist kein globaler Rate-Limiter; Upstream-Fehler 429 bleiben sichtbar.
- Es existiert kein automatisches Worker-Deployment per GitHub Actions; Live-Antworten, CORS und Nutzungsrechte sind vor einem öffentlichen Betrieb zu verifizieren.

Tests aus dem Repository-Hauptverzeichnis:

```bash
node --test worker/tests/*.test.mjs
```

OpenFIGI-Dokumentation: https://www.openfigi.com/api/documentation
