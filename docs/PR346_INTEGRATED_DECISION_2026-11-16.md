# Aktueller Status · historische Entscheidung ersetzt

Die frühere HOLD-Mergeentscheidung ist ersetzt: PR346 wurde am freigegebenen Head8092649f7037ca04192703ce08d2a6c1a6ad6d34 nach Main29f2a1c85a6b859c75c0811b3b478f745b12c8bf gemergt. Allokationsring und Filter sind produktiv abgenommen; SW321/Main e272297ab1ba855a2922c1faa4010b83c558a796 ist LIVE_ACCEPTED. Der folgende Text ist die unveränderte historische Entscheidungs-/Originalbelegbasis, keine neue Mergeanfrage. [Aktuelle Liveabnahme](SW321_LIVE_CLOSURE_2026-11-16.md). [Neue Teilabnahmen](SW321_WINDOWS_K6_BITPANDA_2026-11-16.md).

---

# PR346 · integrierter Head QUALIFIED · Mergeempfehlung HOLD

[PR346](https://github.com/joke0071/foliolab-open/pull/346) bleibt ungemergt. Jochen entscheidet über exakt `8092649f7037ca04192703ce08d2a6c1a6ad6d34`; Tree `09419f00ebbd942fbb843a82b4c224212a2b2fdf`; geprüfter tatsächlicher Main `112dc6d441fe79b0cf3086a5720b6d48910bf784`.

Merge-Eltern: bisheriger Ring6a9c4afd035dcebed940efa46cf5981f207d16ee und tatsächlicher Filter-Main112dc6d4. Ring-Produktblobs unverändert; beide CSS-Blöcke und UI-quality-Verträge erhalten. Synthetischer Mergeec2870098290ddbc5827eb5a65a6af63408c9f6c hat exakt denselben qualifizierten Tree und erwartete Eltern. SW319 → ausgelieferter Filter320 → vorgeschlagener Ring321.

[Reguläre CI43866839082](https://github.com/joke0071/foliolab-open/actions/runs/43866839082) und [Wallet43866839144](https://github.com/joke0071/foliolab-open/actions/runs/43866839144), jeweils Versuch1 dieses neuen Heads, SUCCESS.1505Tests/0Fehler/Skips, Syntax, Chromium und alle3Cross. Pflichtchecks SUCCESS; FAST/deploy/live korrekt nicht anwendbar. Frisch clean/mergeable,0Reviews/Inlinekommentare/offene Threads. Kein später geänderter Head dadurch freigegeben.

| Vertrag | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Bestehender Positionsfilter | PASS | PASS | PASS |
| Bestehender Konto-/Depotring | PASS | PASS | PASS |
| Integrierter1000EUR-Fall | PASS | PASS | PASS |

Ausgewählte1EUR-Cashposition mit echtem Deposit/Journal bei2EUR aus Liste verborgen. Ring40/30/29,9/0,1%, Gesamt1000EUR und Hauptallokation/Legende identisch. Aufheben stellt Auswahl wieder her. Vollständiger kanonischer Rawrecord, Revision, Settings, Mengen, nichtleeres Journal und Buchungen bytegleich. Dieser Fall ist jetzt regulär in PR/Main/live UI-quality eingebunden.

Bestehende Chromium-/WebKit-Belege als Vergleich erhalten; lokale integrierte Verträge ebenfalls PASS.1505lokale Units/0Fehler/Skips, Syntax/boundedTS5.8.3 PASS. Direkte320/390/1440Sichtprüfung ohne neue begrenzte Layoutauffälligkeit. Lokaler WebKit mit unverändertem offiziellen Binary und isolierten Debian13-Libraries ist keine physische Geräteabnahme.

**Technisch qualifiziert; Empfehlung vorerst HOLD**, weil FilterSW320 ausgeliefert ist, seine vollständige Live-Abnahme aber durch belegte wiederkehrende HTTP429/503 blockiert bleibt. [Filterblocker](PR345_SW320_RELEASE_BLOCKER_2026-11-16.md). Kein Ring-Merge/Deployment oder SW321-Livestand.

[FolioLab_PR346_8092649f_qualified_2026-11-16.tar](https://chatgpt.com/library?file_id=libfile_fde3_f-1041f69d9358819181919d40f5e52814_54e45e8130348191808d9aaa710cf372&account_id=personal), Version0;220692480Bytes; SHA256 `1f927d212b2d98091752f05b7e1db8c302935a5acc4c01abb989519d179714db`; Pin `file_00000000a7888212b7547548cc009df2`. Unabhängig bytegleich zurückgelesen;74gepackte Dateien geprüft,6OriginalZIPs mit API-Digest/CRC tatsächlich restauriert,2495ursprüngliche Manifesteinträge bytegleich. [Maschinenbeleg/Restorequittung](release-evidence/pr346-final-head-2026-11-16.json).

Manuelle Windows-/Android-/PWA-Prüfungen sowie private Bestands-/Ownership-/ETH-Originalpflichten bleiben offen/verschoben. Keine Eingabe dazu für diesen Auftrag angefordert; keine globale1.0-Freigabe.
