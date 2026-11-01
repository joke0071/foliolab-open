# v261 – optionales Marketstack und einheitliche Secret-Eingaben

Basis: v260, Main `ca99237f8cbe40490d360dd0bd57f9df76dcf584`. Ein Integrationsstrang: `feature/marketstack-secret-inputs-266`, Owner Work/root b1399897b0ba.

## Verhalten

Alle vorhandenen Passwortfelder sowie der möglicherweise geheime Solana-RPC-Zugang verwenden dieselbe lokale Sichtbarkeitskomponente. Alpha Vantage und Marketstack sind eingeschlossen. Standard ist maskiert; rechts steht ein 44-Pixel-Auge mit Tastaturbedienung, `aria-controls`, `aria-pressed` und verständlicher Aktionsbeschriftung. Ein Pointer-Klick hält den Fokus eines gerade bearbeiteten Feldes, damit das Auge keinen vorhandenen Blur-/Autosave-Handler auslöst. Es schreibt weder Werte noch Formulardaten oder Speicher. Die vorhandenen Speicher-, Verschlüsselungs- und Restore-Verfahren bleiben bestehen.

Marketstack ist eine zusätzliche optionale Browserquelle mit eigenem Schlüssel. Automatische Zuordnung ist auf die vier tatsächlich geprüften Referenznotierungen VWCE, XDEM, XDEQ und 5MVL beschränkt: bestätigte ISIN, EUR und MIC XETR; V2-Symbole mit `.DE`. Antworten werden zusätzlich auf Symbol, Fondsidentität, Handelsplatz, Kurswährung, Datum, positive ungeadjustete Schlusskurse und vollständige Pagination geprüft. Abweichungen verändern keine vorhandenen Kurse. Die Quelle erzeugt keine wirtschaftlichen Buchungen.

Eine begrenzte Tagesreihe (330 Kalendertage innerhalb des Free-Historienfensters, höchstens 1.000 Zeilen) versorgt Tageskurs und Verlauf gemeinsam. Validierte öffentliche Daten werden in IndexedDB gespeichert, Zugangsdaten nur in der vorhandenen lokalen Konfiguration. Ein eigener Budget-Namensraum mit gehashtem Schlüssel reserviert atomar höchstens 100 Versuche je UTC-Monat; jede Notierung zählt einzeln. Mehrtabkonflikte, Providerlimits und fehlender Cache blockieren weitere Anfragen. Wochenende und Vorhandel verwenden vorhandene Schlusskurse; nach der konservativen EOD-Grenze 21 UTC darf die neue Schlusskursreihe abgerufen werden. Feiertage erzeugen keine erfundenen Handelstage. Die lokale Zählung kennt keine Nutzung desselben Schlüssels außerhalb dieser Browserdatenbank. Providerlimits bleiben maßgeblich.

Der neue Schlüssel folgt der vorhandenen optionalen Konfiguration: kein Schlüssel im normalen Finanz-JSON; nur ausdrücklich gewählte verschlüsselte Vollbackups enthalten ihn. Kein neues Backupformat, keine Änderung des Verschlüsselungsverfahrens.

## Reale Belege und Grenzen

Mit dem autorisierten privaten Nutzerschlüssel wurden am 01.11.2026 vier echte V2-XETR/EUR-Schlusskurse zum 30.10.2026 sowie Discovery und CORS geprüft. Zusätzlich lieferte die tatsächliche Einzelsymbol-URL `/v2/eod` mit dem neuen 330-Tage-Fenster für VWCE 224 vollständige, gültige Beobachtungen. Keine privaten Schlüssel oder Originalantworten werden veröffentlicht. Der ausführliche Beleg liegt separat auf dem Checkpoint-Branch in `docs/MARKETSTACK_266_REAL_PROVIDER_PROOF_2026-11-01.md`.

Der Free-Tarif wird konservativ mit 100 Einheiten/Monat und privater nichtkommerzieller Nutzung behandelt. Kein gemeinsames Providerkonto, keine Weiterverteilung, keine gekauften Upgrades. Echte Providerantworten sind kein Bestandteil öffentlicher CI. Echte Android-Hardware ist damit nicht abgenommen.

## Prüfungen und nächster Schritt

Lokale Unit-/Syntaxprüfung: 1.079 Tests, keine Fehler oder Skips. Neue Browserfälle prüfen synthetisch vier Kurse, Kurs-/Historiencache, Reload, Monatsgrenze, atomare Mehrtabreservierung, Secret-Werte/FormData/Events/IDB, Tastatur, Touch, sieben Breiten und Axe. Chromium und Firefox lokal erfolgreich; WebKit und alle bestehenden Finanz-/Backup-/Offline-/PWA-Gates sind verpflichtende Release-CI. LIVE_ACCEPTED folgt erst nach vollständiger Produktionsabnahme.

Die vollständige Ablösung und Entfernung von FMP-, Twelve-Data- und direkten EODHD-Schlüsseln ist die nächste verbindliche P1A-Etappe #266, noch nicht erledigt. Benötigte Suche und FX werden vorher gesichert; Migration, physische IDB-Konfiguration, neue Backups und Legacy-Restore werden gemeinsam bereinigt. Historische Kursbelege, Finanzdaten, eigene EODHD-Worker, CoinGecko, Wallet/RPC und Drive bleiben geschützt. Danach folgt der gemeinsame CSV-/Blockchain-Import gemäß UH01–UH05 vor neuen kosmetischen Paketen; #257 bleibt aktiv.
