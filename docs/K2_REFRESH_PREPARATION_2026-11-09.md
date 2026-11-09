# K2-KURSE – Frequenzauswahl vorbereitet, 09.11.2026

Stand: ausschließlich lesende Abgrenzung nach erfolgreicher UI-R3-Integration, kein zweiter Produktbranch oder CI-Lauf. Owner `c43b5e91f20a`. Quelle: [Nutzerauftrag #266](https://github.com/joke0071/foliolab-open/issues/266#issuecomment-6562391647). Keine bereits akzeptierte Kursquelle erneut entwickeln.

Nächster Schnitt ersetzt die30-Minuten-Checkbox durch ein natives Select „Automatische Aktualisierung“: Nur manuell, Täglich (Standard), Alle6Stunden, Alle30Minuten. Ein kurzer Hilfetext erklärt die fällige Aktualisierung beim Öffnen; häufige Intervalle erhalten einen dezenten Quotenhinweis. Kein Hintergrundjob und kein zusätzlicher Dialog.

Legacy `false` wird `off`, `true`/fehlend wird `daily`. Eine kanonische validierte Frequenz muss durch lokale/IndexedDB-Einstellungen und ausdrücklich eingeschlossene verschlüsselte Konfiguration bedeutungsgleich transportiert werden. Andere API-/RPC-Einstellungen und Finanzdaten bleiben erhalten. Lesen allein darf keine neue Speicherrevision erzeugen; Quota-/CAS-Fehler stellen die gespeicherte Auswahl sichtbar wieder her. Kein divergenter Boolean plus unabhängiger Frequenzschalter.

Versuch und erfolgreich gespeichertes Update sind zu trennen. Kein ganztägiger Erfolgstimestamp bei Offline, Fehler, Teilabruf, fehlender Quelle oder gescheitertem Save. Wiederholungen brauchen begrenzten Backoff und Mehrtab-Schutz; bestehende Provider-/Instrument-Caches, Tages-/Monatsbudgets und RPC-/429-Sperren bleiben maßgeblich. Teilabrufe dürfen erfolgreiche kostenpflichtige Anfragen nicht verdoppeln. Manuelle Aktualisierung bleibt unabhängig von der Frequenz verfügbar.

Abnahme: alte true/false/fehlende Vorgaben, alle vier Werte und ungültige Konfiguration, Backup/Restore/Neustart, exakte Zeitgrenze/Zeitsprung, Offline/402/429/Netzverlust/Teilabruf/Savefehler, gleichzeitige Tabs und begrenzter Retry, manueller Weg, Wallet mit/ohne Quote, drei Browserengines,320–430/768/1440px,Tastatur/Fokus/Axe/Touch. Bestehende Finanz-/IDB-/Backup-/PWA-Gates bleiben Pflicht. Kein externer Quotenverbrauch zur reinen Layoutprüfung.

K1 bleibt unabhängig PARTIAL; fehlende Originalanker werden nicht erfunden. Der Datenschutz-Audit läuft parallel lesend. Entwicklungs- und lokale Prüfarbeit sind zulässig; die öffentliche Veröffentlichung bleibt an die erforderlichen Release-Gates gebunden.
