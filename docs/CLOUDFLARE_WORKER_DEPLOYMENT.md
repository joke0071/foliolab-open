# FolioLab Open – eigener Cloudflare Worker für alle Nutzer

**Ziel:** Jeder Nutzer von FolioLab Open kann dieselbe öffentlich verfügbare Worker-Vorlage im **eigenen Cloudflare-Konto** bereitstellen. Weder der Betreiber des FolioLab-Open-Repositories noch andere Nutzer hosten einen zentralen Worker oder stellen gemeinsame Cloudflare- oder EODHD-Keys zur Verfügung.

**Quellcode:** [`worker/`](../worker/README.md) im bestehenden Repository. Die PWA bleibt unverändert auf GitHub Pages. Ein Cloudflare Worker ist **optional**; ohne ihn bleiben die lokale Suche, manuelle Erfassung, CSV-Importe und die bereits unterstützten Datenquellen verfügbar.

## 1. Einfachste Einrichtung: Deploy to Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/joke0071/foliolab-open/tree/main/worker)

1. Auf **Deploy to Cloudflare** klicken.
2. Im persönlichen Cloudflare-Konto anmelden (gegebenenfalls Konto erstellen) und den angezeigten GitHub-Import für das **eigene** Konto autorisieren.
3. Den Worker aus dem verlinkten Ordner `worker/` bereitstellen; Namen und Zielkonto selbst bestimmen. Der Ordner enthält die Konfiguration `wrangler.toml`, den Einstieg `src/index.js`, den geschützten EODHD-Endpunkt `src/market.js` und eigene Tests.
4. Nach dem Deployment die echte **HTTPS-Basisadresse** des eigenen Workers kopieren (z. B. `https://foliolab-open-instruments.DEINE-SUBDOMAIN.workers.dev`).
5. Die URL in **FolioLab Open → Mehr → Datenquellen & Aktualisierung → Erweiterte Wertpapiersuche** eintragen und **Suchdienst speichern** wählen.

**Achtung:** Das Cloudflare-Deploy-Button-Verfahren muss nach der Integration im tatsächlichen Cloudflare-Anmelde- und GitHub-Import-Flow einmal end-to-end geprüft werden. Der Link verwendet das offiziell dokumentierte Subdirectory-Format; er ist **kein** Nachweis für ein erfolgreiches Konto-Deployment. Bei Problemen den nachfolgenden lokalen Weg verwenden. Cloudflare übernimmt beim Button-Import nur den Unterordner als eigenständiges Worker-Projekt; die PWA wird dadurch nicht bei Cloudflare veröffentlicht.

## 2. Alternative: lokale Installation mit Wrangler

Auf einem vertrauenswürdigen Rechner mit Node.js >= 20:

```bash
git clone https://github.com/joke0071/foliolab-open.git
cd foliolab-open/worker
npx wrangler login
npx wrangler deploy
```

Es reicht ein eigener Cloudflare-Login; weder Administratorrechte für das FolioLab-GitHub-Repository noch ein Fork sind für diese Variante nötig. Wrangler gibt die echte `*.workers.dev`-Adresse aus. Ein weiteres Worker-Projekt nicht parallel erzeugen, wenn der Nutzer bereits eines mit diesem Namen betreibt.

## 3. Optional: EODHD-Schlusskurse mit eigener Lizenz

OpenFIGI kann **ohne** EODHD-Schlüssel betrieben werden. Für den EODHD-Kursdienst ist der persönliche EODHD-Zugang des Nutzers erforderlich.

Im **eigenen Cloudflare Worker** unter **Settings → Variables and Secrets** zwei Variablen vom Typ **Secret** setzen:

- `EODHD_TOKEN`: **persönlicher** EODHD-API-Schlüssel des Nutzers
- `MARKET_ACCESS_TOKEN`: **separater** zufälliger Zugriffsschlüssel; 24–128 Zeichen aus Buchstaben, Zahlen, `_` und `-`, z. B. `openssl rand -hex 32`

Alternativ aus `worker/`:

```bash
npx wrangler secret put EODHD_TOKEN
npx wrangler secret put MARKET_ACCESS_TOKEN
```

Diese Schlüssel **nicht** in GitHub einchecken, nicht in Issues posten und nicht an den FolioLab-Entwickler senden. Sie werden ausschließlich im Cloudflare-Konto des jeweiligen Nutzers hinterlegt. Nur den separat erzeugten `MARKET_ACCESS_TOKEN` zusätzlich lokal in FolioLab unter **Mehr → Datenquellen & Aktualisierung → Eigener EODHD-Kursdienst** eingeben, zusammen mit derselben Worker-Basisadresse.

Der Worker gibt EODHD-Daten ausschließlich über den authentifizierten `POST /api/market/eodhd`-Endpunkt aus. Die OpenFIGI-Abfrage benötigt diesen Token nicht. Für den EODHD-Zugriff gelten weiterhin Provider-Tarif, verfügbare Instrumente und API-Limits.

## 4. Verbindung prüfen

**Stammdatensuche:** In FolioLab im Anlage-Assistenten nach mindestens zwei Zeichen oder einer ISIN suchen. Treffer sollten nur Stammdaten enthalten; sie sind keine garantierte Notierungs-/Kurszuordnung.

**Marktdaten:** Einen bestätigten EODHD-Börsencode (z. B. `VWCE.XETRA`) nutzen und in FolioLab einen Kursabruf auslösen. Fehler können an ungültigem Schlüssel, Tarif, fehlender Notierung oder Netzwerkkonfiguration liegen.

**Direkter URL-Aufruf:** Das einfache Öffnen von `/api/instruments/search` in der Browser-Adressleiste kann absichtlich `403` liefern, weil dabei kein für FolioLab erlaubter `Origin`-Header gesendet wird. Der geeignete Funktionstest erfolgt aus der FolioLab-PWA. Die Stammdatensuche lässt ohne Abfrageparameter zusätzlich keine leeren Suchanfragen zu.

## Sicherheit und Datenschutz

- Es gibt **keinen zentralen FolioLab-Worker** und **keine zentralen GitHub-, Cloudflare- oder EODHD-Secrets**. Das Repository enthält nur quelloffene Vorlagen und Tests.
- Standardmäßig ist die Browser-Origin `https://joke0071.github.io` erlaubt. Nur bei einer eigenen FolioLab-Kopie muss ein abweichender vertrauenswürdiger Origin bewusst über `ALLOWED_ORIGINS` ergänzt werden.
- CORS ist **keine Authentifizierung**. Die OpenFIGI-Suchfunktion bleibt eine öffentliche Metadatenschnittstelle, deren Anfragen das private Cloudflare-Konto des Nutzers belasten können. Deren Quoten und Nutzung sollten kontrolliert werden.
- Der geschützte EODHD-Endpunkt verlangt hingegen zusätzlich den eigenen `MARKET_ACCESS_TOKEN`; kein offener Proxy und kein frei bestimmbares Upstream-Ziel.
- An OpenFIGI werden nur Suchbegriff/ISIN übertragen; an EODHD nur Börsensymbol und Zeitbereich, **keine** persönlichen Kontostände, Depotbestände oder Wallet-Adressen.
- Die beiden Dienste sind freiwillig; niemand muss einen Worker deployen, um FolioLab Open zu verwenden.
- Das FolioLab-Open-Repository führt **kein** Cloudflare-Deployment für Nutzer aus. Jeder entscheidet selbst, ob und wann er seine Worker-Version aktualisiert.

**Weitere Informationen:** [Worker-README](../worker/README.md) · [Cloudflare Deploy Buttons](https://developers.cloudflare.com/workers/platform/deploy-buttons/) · [Wrangler-Deployment](https://developers.cloudflare.com/workers/wrangler/commands/workers/) · [Cloudflare Secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
