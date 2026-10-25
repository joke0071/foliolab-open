# FolioLab Open – Cloudflare Worker bereitstellen (25.10.2026)

**Stand:** GitHub Pages bleibt der Host der PWA. Der separat betriebene Cloudflare Worker ist optional. Es existiert bereits **ein Worker** mit zwei voneinander unabhängigen Diensten: öffentliche OpenFIGI-Metadatensuche und ein nur mit Bearer-Token verwendbarer EODHD-Kursdienst. Es ist **kein** zweiter Worker, keine Cloudflare Pages-Migration und kein gemeinsamer öffentlicher EODHD-Schlüssel nötig.

## Einmalige Einrichtung im eigenen Cloudflare-Konto

1. Cloudflare anmelden und die **Account ID** des gewünschten Accounts ermitteln.
2. Ein auf diesen Account begrenztes **API-Token für „Edit Cloudflare Workers“** erstellen (nur erforderliche Rechte).
3. Im GitHub-Repository unter **Settings → Secrets and variables → Actions** zwei Repository-Secrets anlegen:
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API-Token
4. Optional und empfohlen unter **Settings → Environments** die Umgebung `cloudflare-worker-production` anlegen und bei Bedarf eine manuelle Freigabe festlegen. Repository- oder Environment-Secrets sind nur auf der jeweils konfigurierten Ebene verfügbar.
5. Nach Integration dieser GitHub-Action unter **Actions → Cloudflare Worker – Test und manuelles Deployment → Run workflow** den Branch `main` auswählen und starten. Der Workflow prüft Syntax und Worker-Unit-Tests, veröffentlicht dann `worker/wrangler.toml` mit `cloudflare/wrangler-action@v4` und testet live HTTPS und CORS. Er läuft **nicht** automatisch auf jedem `main`-Push. Nur der Workflow auf `main` darf deployen.
6. Die echte Basisadresse der Worker-Aktion aus dem Job Summary kopieren. Keine Beispiel-/Platzhalter-URL benutzen.

**Wichtig:** Der GitHub-Workflow enthält keinerlei echten Tokenwert. Zugangsdaten weder committen noch in Issues, Pull Requests oder Chats einfügen. Die oben genannten GitHub-Secrets autorisieren nur das Deployment; sie sind **nicht** die API-Schlüssel des Marktdienstes.

## EODHD optional aktivieren

Im Cloudflare-Dashboard beim Worker unter **Settings → Variables and Secrets** zwei Typ-**Secret**-Einträge hinzufügen:

- `EODHD_TOKEN`: eigener gültiger EODHD-API-Schlüssel, niemals im Client
- `MARKET_ACCESS_TOKEN`: **separates** zufälliges Geheimnis mit mindestens 24 erlaubten Zeichen (`[A-Za-z0-9_-]`), etwa erzeugt mit `openssl rand -hex 32`

Änderungen in Cloudflare veröffentlichen. Alternativ können diese Werte mit `wrangler secret put` gesetzt werden; der Befehl erzeugt dabei selbst eine neue Worker-Version und veröffentlicht sie. Keines der beiden Secrets muss in GitHub hinterlegt werden; weitere Worker-Code-Deployments erhalten bestehende Cloudflare-Secrets normalerweise. EODHD-Verbrauch und Tariflimits bleiben Eigentümerverantwortung.

## Verbindung in FolioLab Open

- **OpenFIGI:** Mehr → Datenquellen & Aktualisierung → Erweiterte Wertpapiersuche → HTTPS-Basisadresse des eigenen Workers hinterlegen. Kein EODHD-Token notwendig.
- **EODHD-Kurse:** Mehr → Datenquellen & Aktualisierung → Eigener EODHD-Kursdienst → dieselbe HTTPS-Basisadresse **und** den Wert von `MARKET_ACCESS_TOKEN` hinterlegen.
- Anschließend testweise nach einem Instrument suchen bzw. einen vorhandenen bestätigten Xetra-Börsencode aktualisieren. Kein Portfolioinhalt wird an die OpenFIGI-Suche übertragen.

**Aufruf aus der Browser-Adresszeile:** `/api/instruments/search` liefert oft **403**, weil der Browser beim direkten Navigieren keinen `Origin`-Header sendet. Das ist beabsichtigt. Die Action testet den tatsächlichen Browser-CORS-Vertrag mit `Origin: https://joke0071.github.io` und eine blockierte fremde Origin. Alternativ testet die PWA nach dem Speichern der Basisadresse. Der Worker ist kein allgemeiner Forward-Proxy.

## Grenzen und Sicherheit

- Die OpenFIGI-Suche ist **kein geheimer Endpunkt**: CORS schützt nur lesende Browserkontexte; Nicht-Browser-Clients können den Header selbst setzen. Bei öffentlichem Einsatz OpenFIGI-Quoten und Cloudflare-Nutzung beachten. Edge-Cache ist kein globales Ratelimit.
- EODHD verlangt unabhängig von CORS den gesonderten `MARKET_ACCESS_TOKEN`; die Antwort wird nicht global gecacht. Keine Kurse an alle App-Nutzer durch einen gemeinsamen EODHD-Schlüssel veröffentlichen.
- Der Worker akzeptiert keine freien Proxy-Ziel-URLs und überträgt weder Konten noch Bestände oder Wallet-Adressen.
- Weitere Frontend-Origins nur bewusst über `ALLOWED_ORIGINS` freigeben (kommagetrennt; keine Wildcard). `https://joke0071.github.io` ist bereits eingebaut.
- Neue UI-Defaults für alle Nutzer sind **nicht** Teil dieser Einrichtung: jeder Nutzer kann weiterhin eigene Datenquellen wählen.
- GitHub-Secret-Werte und Cloudflare-Secret-Werte werden durch diesen Workflow nicht gelesen, protokolliert oder angelegt. Das Cloudflare-Konto muss einmalig vom Eigentümer autorisiert werden.

## Manuelle Alternative ohne GitHub Actions

```bash
git clone https://github.com/joke0071/foliolab-open.git
cd foliolab-open/worker
npx wrangler login
npx wrangler deploy
npx wrangler secret put EODHD_TOKEN
npx wrangler secret put MARKET_ACCESS_TOKEN
```

Dieser Weg ist für eine einmalige Veröffentlichung ebenfalls möglich. **Nicht** gleichzeitig ein weiteres, anders benanntes Worker-Projekt anlegen, wenn bereits das Projekt `foliolab-open-instruments` verwendet wird.

Referenz: [Worker-Einrichtung](../worker/README.md), [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [Cloudflare Worker-Secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
