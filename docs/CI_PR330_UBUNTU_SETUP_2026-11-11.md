# PR330 – begrenzter Ubuntu-Setup-Kandidat · 11.11.2026

Status: PREPARED_LOCAL_PASS / SPECIFIC_WORKFLOW_APPROVAL_PENDING. Kein neuer CI-Lauf, keine Integration/Produktion, keine Infrastrukturfreigabe aus lokalen Simulationen.

## Grundlage
v308 ist LIVE_ACCEPTED, Main0be4c7f07a60e1d17ce5a5691261a52810701329. PR330 bleibt auf af7673336a08a7da79e45eb2c551d0cc271d4593 blockiert. Dieser WIP baut auf der vorbereiteten Legacy-Testkorrektur28bfce08407612257a09b177a23c9975e7e061f2 auf; Produktcode bleibt identisch. Vorbereiteter CI-B466be00 wird nicht aufgenommen oder verändert.

Cross-Job130589905308 im bestehenden Run43040242297 wurde frisch gelesen: Ubuntu-Archive-Paketabrufe stocken, Installation nach8Minuten abgebrochen; Schrittstatus und zwei weitere Cross-Fehler bestätigt. Beide früheren Kandidaten/elfOriginalarchive sind bereits in V145 erhalten. Keine neue Kopie/Neuabnahme behauptet.

## Konkrete Änderung
Die beiden vorhandenen Ubuntu-Mirrorblöcke (Integration und Produktion) wählen vor Änderung beider Systemdateien erreichbare HTTPS-InRelease-Endpunkte. Feste Hostliste: archive.ubuntu.com/us.archive.ubuntu.com für noble, security.ubuntu.com/archive.ubuntu.com/us.archive.ubuntu.com für noble-security. Pro Versuch connect3s/max8s/keineRetries; höchstens2+3Versuche, insgesamt maximal40s zusätzlich innerhalb desselben bestehenden8Minuten-Budgets. Kein IP-Pinning, fremder Resolver, beliebiger Mirror, HTTP, Zertifikatsbypass oder Redirect-Following.

Der neue Helper schreibt keine Systemdateien; er gibt genau die gewählte HTTPS-URL aus. Erst wenn alle benötigten Auswahlen erfolgreich sind, schreibt der bestehende Workflow die Mirrorlisten. Komplettausfall/HTML/ungültige Eingabe => Fehler, keine durch Netzwerkfehler teilweise umgestellten Listen. Die Headerprobe ist KEINE kryptografische Signaturprüfung; unverändertes APT/Playwright --with-deps übernimmt weiterhin die eigentliche Signatur-/Abhängigkeitsprüfung.

Alle Testaufrufe, Shards, Engines, Pins, Caches, Gates, Artefakte,8/55-Minutenlimits und Deploymentbedingungen bleiben erhalten. Kein Shard-Balancing und keine Testselektion. Die bestehende Vertragsprüfung normalisiert ausschließlich die zwei exakten neuen Setupblöcke zurück auf die versiegelten alten Bytes; sämtliche historischen Hashkonstanten unverändert. Ein neuer Node-Test ruft die sechs isolierten Python-Netzwerksimulationen auf, damit sie mit npm test laufen.

## Tatsächliche lokale Nachweise
- 22 Node-Vertragsprüfungen PASS/0Fehler/0Skips, einschließlich sechs Python-Netzwerksimulationen.
- Fälle: primärerServer, DNS-Ausfall→regionalerServer, Security-Pocket/Fallback, alleServerfehler ohneURL, HTML-Ablehnung, ungültigeParameter ohneNetzwerk.
- 18Workflow-Shellblöcke bash-n PASS; Helper bash-n PASS.
- Vorbereitete Legacy-Browserdatei node--check PASS. Diff ausschließlich sichtbarer Notizeditor/readonlyDatum+Betrag/bytegleicherAbbruch; keine Produktcodeänderung.
- Lokaler Übertragungsfehler (eine zusätzliche Endnewline im Workflow) wurde vom unveränderten Live-Hash erkannt und vor dem letzten vollständigen22Test-PASS entfernt. Keine Hashneuberechnung.
- KEIN tatsächlicher GitHub-Runner-/Mirror-/Browser-/Android-PASS. Ursache kann über einen einzelnenHost hinausgehen; alleHostfehler führen ehrlich zuFAIL.

## Freigabe und nächste ausführbare Aktion
Die durch aktuellen Nutzerauftrag ausdrücklich erhaltene konkrete Workflowfreigabegrenze gilt; siehe [#229](https://github.com/joke0071/foliolab-open/issues/229#issuecomment-6616123951). Benötigt wird ausschließlich die Freigabe dieses konkreten Setup-Kandidaten zur Qualifikation und – erst nach allen Pflichtgates – Integration. Keine erneute allgemeine HND01-/Produktfreigabe.

Nach Freigabe: Main/Checkpoint/PR/Reviews UND Kommentare/Actions/private Sicherung erneut abgleichen; PR330 von erwartetemaf767333 geschützt auf den vorbereiteten Commit fortschreiben. Vollständige PR-/Wallet-CI am neuenSHA/Tree einschließlich echtem Ubuntu-Setup und dreiEngines; alle Originale zugeordnet prüfen, visuell/fachlich qualifizieren, gebündelt unveränderlich privat sichern/gepinnt rücklesen/erforderlichen Restore. Erst dann expectedHEAD-Merge; Main/Deploy/tatsächlicheDrei-EngineProduktion und Releasebackup separat. Bei erneutemNetzwerkfehler keine blinde Wiederholung, keine Limit-/Gateabschwächung.

Neue Quellen sind unveränderlich auf diesem WIP-Commit gesichert; keine neue private Archivmutation dieser Vorbereitung. V145 bleibt letzter verifizierter privaterStand. PR330/Main bleiben unverändert. Danach Navigation/Installation/Dashboard gemäß Wochenplan; tatsächlichesAndroid und OAuth/Zweigeräte/Sync externoffen.
