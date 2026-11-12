# FLH04 — Architekturvorbereitung, keine aktivierte Synchronisierung

Issue #160; Ausgangspunkt v179/main23af6d5. Ziel ist dasselbe Portfolio auf Android und Desktop bei vollständig lokalem Offlinebetrieb. IndexedDB bleibt kanonisch. Drive enthält ausschließlich vom Client verschlüsselte Daten, keine zentrale FolioLab-Portfoliodatenbank, Pflichtworker oder zentralen API-Secrets. Dieser Vertrag ist ein Prüfentwurf vor Code, kein bestandener Sicherheits-/API-Nachweis.

## Vorhandene Komponenten und Grenzen

`PortfolioStorage.save()` nutzt den bestehenden lokalen atomaren Revisionsvergleich; `assertCurrent()` übernimmt keine fremde Revision für stale Writes. Diese Regeln bleiben auch beim späteren Sync-Commit erforderlich. Ein gültiger Remote-Snapshot darf keinen inzwischen geänderten lokalen Stand überschreiben.

`drive-backup.js` verwendet den Google-JavaScript-Tokenclient mit eigener gespeicherter Client-ID und sitzungsgebundenem Token. Im geprüften Code wird kein gemeinsamer öffentlicher Produktclient ausgeliefert. Bestehende eigene Konfigurationen bleiben erhalten; aus Quellcode wird nichts über reale private Nutzerkonfigurationen behauptet. OAuth-Tokens aus ChatGPT Work werden niemals in die Produktapp übernommen.

`complete-backup.js` definiert vollständige Portfolio-/Historydaten und ausdrücklich optionale Einstellungen. `backup-vault.js` besitzt den aktuellen verschlüsselten V2-Passwortvertrag: AES-GCM, zufälliger Nonce, zufälliger Datenschlüssel, passwortgeschützte Umhüllung und gerätelokal nicht extrahierbarer Schlüssel. `encryptWithBackupPassword()` liefert bereits serialisierten Envelope-Text. Die Kenntnis dieser Schnittstelle ist keine Bestätigung, dass alle Backupfunktionen unverändert als Synckryptografie geeignet sind. Offene Exporte bleiben geheimnisfrei, Einstellungen/Keys nur nach ausdrücklicher Wahl verschlüsselt. Synchronisierung darf nicht beiläufig Provider-Secrets auf ein zweites Gerät kopieren.

## Aktuelle offizielle Quellen — 26.10.2026 geprüft

- [Google appDataFolder](https://developers.google.com/workspace/drive/api/guides/appdata): appgebundener unsichtbarer Bereich; erforderlicher Scope `drive.appdata`; Daten können vom Nutzer gelöscht werden. Dateien dort sind nicht teilbar und nicht zwischen Spaces verschiebbar. Daher ist dies kein automatischer kontenübergreifender Freigabemechanismus und kein unabhängiger Backupersatz.
- [Drive-Scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth): `drive.appdata` ist als non-sensitive aufgeführt. Das beweist keine bereits konfigurierte/veröffentlichte FolioLab-OAuth-App und ersetzt keine anwendbaren Betreiber-/Google-Anforderungen.
- [JavaScript-Tokenmodell](https://developers.google.com/identity/oauth2/web/guides/use-token-model): Client-ID/Scopes und Nutzerzustimmung, kurzlebige Access Tokens; erneute Anforderung nach Ablauf erfolgt nutzergetrieben. Bestehende eigene Client-ID bewahren; keine zentrale Client-Secret-Verteilung. Kein Versprechen einer autorisierungslosen geschlossenen PWA.
- [Drive v3 files.update](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/update): die gelesene Methodenreferenz liefert hier keinen nachgewiesenen Remote-CAS-Vertrag. Kein Schluss „If-Match funktioniert garantiert“, nur weil ein SDK/Header ähnlich heißt. Tatsächliche Token-/Origin-/API-Berechtigungen wurden nicht ausgeführt.

Die Quellen wurden als aktuelle Primärdokumente gelesen. Keine Nutzerdaten an diese Dokumentationsseiten übertragen; keine fremden Codebeispiele kopiert. Eine öffentliche Client-ID ist allein keine produktiv eingerichtete OAuth-App. Betreiber muss Projekt, autorisierte produktive Origin, Consent-/Anbieterangaben und erforderliche Veröffentlichungs-/Verifikationsschritte tatsächlich bereitstellen. Private bestehende OAuth-Konfiguration kann je Projekt einen anderen appgebundenen Datenbereich besitzen; vor Datenübernahme prüfen, keine Daten still verschieben.

## Verbindliche Invarianten

1. Lokales Portfolio bleibt offline nutzbar; Sync-Ausfall ändert keine bestätigten Mengen, Journal-, Preis-, History- oder Importdaten.
2. Portfolioidentität und Geräteidentität sind ausdrücklich, zufällig erzeugt und nicht aus Name, Konto, Adresse oder Google-E-Mail abgeleitet. Neue Geräte übernehmen ein Portfolio erst nach erfolgreicher Entschlüsselung, Modellvalidierung und ausdrücklicher Auswahl.
3. Jede Revision hat eine authentisierte Identität, Elternbeziehungen und definierten Datenumfang. Anbieter-Dateiname/Zeitstempel ist kein Echtheits- oder Vollständigkeitsnachweis. Replay/Rollback, falsches Portfolio, kaputte/zu große Daten und unbekannte Versionen blockieren, statt lokale Daten zu ersetzen.
4. Jeder lokale Apply erfolgt über bestehende Model-/History-/Importvalidierung und den normalen IDB-CAS bei unverändertem lokalen Preimage. Ursprünglicher Stand und vorhandene Rettungs-/Backupwege bleiben erhalten; kein Cloud-Replace-All ohne Vorschau.
5. Parallelgeräte dürfen keine Änderung vernichten. Ein Remote-Head braucht nachgewiesene konditionale Schreibsemantik oder einen tatsächlich konfliktfesten append-only Vertrag. Lokaler CAS allein löst keine Remote-Rennen.
6. Kein unkontrolliertes Last Write Wins. Änderungen am selben wirtschaftlichen Ereignis oder an gemeinsamen Referenzen sind Konflikte, nicht automatisch unabhängige JSON-Felder. Keine Addition doppelt importierter Trades oder Wallet-Eingänge.
7. Automerge ausschließlich nachweislich unabhängiger Änderungen unter vollständigen Finanz-/Referenzinvarianten. Sonst verständlicher expliziter Vergleich und sichere Entscheidung. Providerzeit, aktuelle Tageswerte oder „neueres Gerät“ sind keine automatische Gewinnerregel.
8. Zugang nur im aktiven autorisierten Appkontext; Token nicht dauerhaft als portable Backupdatei behandeln. Schlüssel/Passwort nicht unverschlüsselt persistieren; Abmeldung stoppt Abfragen. Keine geschlossene-PWA-Hintergrundgarantie.

## Zu prüfende Transportalternativen

**Konditionaler Remote-Head:** Nur nach echtem Nachweis, dass zwei konkurrierende Updates desselben Vorgängerstands nicht beide unbemerkt erfolgreich sein können. Veraltetes Update muss scheitern und vollständige Revisionen müssen wiederauffindbar bleiben. Keine Annahme aus einem bloßen Dateiversionszähler. Origin-CORS, tatsächliche Header und Fehlerfälle mit isolierten synthetischen Daten prüfen.

**Append-only Revisionen:** Mögliche Alternative ohne überschreibbaren einzigen Gewinner. Geräte schreiben unveränderliche verschlüsselte Objekte mit authentisierten Elternbeziehungen; Geschwisterrevisionen bleiben erhalten und werden als Konflikt bzw. bewiesen unabhängige Änderung behandelt. Dies ist ein Entwurf, kein fertig bewiesenes Drive-Protokoll. Vollständiges paginiertes Finden, Upload-Idempotenz, Abbruch/Timeout nach tatsächlich erfolgreichem Upload, fehlende Eltern, verzögerte Sichtbarkeit, konkurrierende neue Wurzeln, doppelte Objekte, Quota und sichere Aufbewahrung/Garbage-Collection müssen nachgewiesen werden. Ohne solche Nachweise weder „synchron“ noch globale Aktualität behaupten. Löschung/Aufräumen eigener Revisionen wäre ein eigener kritischer Schritt, nicht im ersten Transport-MVP verstecken.

Jede äußere Metadatenstruktur auf das Minimum begrenzen. Keine Wallets, Kontonamen, Instrumente, Belegzeilen oder Secrets in Dateinamen, URLs oder unverschlüsselten Fehlerlogs. Alle fachlich relevanten Identitäts-/Eltern-/Konfliktdaten müssen gegen Manipulation authentisiert sein; nicht ungeprüft auf Drive-Metadaten vertrauen.

## Kryptografie- und Recoverygate vor Implementierung

Bestehende Backupkryptografie für Eignung prüfen: Datenumfang/Protokolltrennung, zufällige Nonces und Wiederverwendungsgrenzen, Authentisierung aller Revisions-/Portfolio-/Elternangaben, KDF-/Wrap-Validierung, Replay-/Rollbackstrategie und Dateigrößenlimits. Kein neues unspezifiziertes Eigenkryptoprotokoll. Ein separater Sync-Envelopetyp darf nicht irrtümlich als vollständiges Portfolio-Backup importiert werden.

Automatisches Entschlüsseln bei aktiver App darf keine dauerhafte Speicherung des Nutzerpassworts erfordern. Bestehender lokaler Vault-/Schlüssel-ID-Vertrag, neues Gerät, falsches Passwort, Passwortrotation, Verlust eines Geräts und unterschiedliche bestehende Backuppasswörter sind separat zu prüfen. Ein Cloudobjekt allein darf keinen funktionierenden lokalen Vault heimlich ersetzen. Vollständige verschlüsselte lokale Backups bleiben unabhängig von Drive verfügbar. Remote-Löschung oder widerrufenes OAuth ist keine Aufforderung, das lokale Portfolio zu löschen.

## Benutzerablauf und Abnahme

Später dezent unter „Mehr → Deine Daten“: Sync aktivieren, Google autorisieren, vorhandenes Backup-Passwort verwenden/einrichten, zweites Gerät verbinden und Portfolio sicher übernehmen. Klare Zustände: aus, nicht verbunden, lokale Änderungen ausstehend, Abgleich läuft, Stand geprüft, Konflikt, offline, Berechtigung abgelaufen, Wiederherstellung nötig. Keine künstliche Fortschritts-/Vollständigkeitszahl.

Vor UI/Release: unabhängige Referenzfälle für Revision/Eltern/Replay/Portfolioidentität, konkurrierende Geräte/Offlineänderungen/Automerge versus Konflikt, falsches Passwort/Nonce/AAD/Manipulation/Rotation, unvollständigen Upload und Remote-Löschung. Echte lokale CAS-/Mehrtab-/Quota-/Abbruch-/Restorepfade, Import/Dedupe/Undo und Finanzhistory nach Zusammenführung unverändert. Chromium/Firefox/WebKit, Mobile/Desktop/Axe; echtes OAuth mit Betreiberclient und Neugerät separat. Erst vollständig reviewbarer eigener PR und konkrete erforderliche Nutzerentscheidung, dann Veröffentlichung. Aktuell ist keine dieser neuen Syncfunktionen aktiviert oder als abgenommen bezeichnet.
