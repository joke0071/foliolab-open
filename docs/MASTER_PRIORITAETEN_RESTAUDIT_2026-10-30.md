# FolioLab – verbindliche Prioritäten und Statuspflege

Aktualisierter Einstieg nach Vollständigkeitsabgleich am **02.11.2026**. Nur Dokumentation; keine Übernahme des aktiven Entwicklungsowners und keine neue Releasefreigabe.

Die frühere vollständige Priorisierung einschließlich aller Detailverträge ist **bytegleich** in [MASTER_PRIORITAETEN_HISTORIE_2026-11-02_0ed5406a.md](MASTER_PRIORITAETEN_HISTORIE_2026-11-02_0ed5406a.md) erhalten (Blob `0ed5406a06246d44c6f5a4976ca557fa79a0ccfa`). Keine dortigen Restaufträge werden durch Verkürzung dieses Einstiegs gelöscht. Neue explizite Nutzerentscheidungen und tatsächlich belegte Releases gehen historischen Zustandsmeldungen vor.

## Quellenrangfolge

1. Aktueller Main/CI/Produktionsnachweis und jüngster Owner-/Fortsetzungskopf in [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md).
2. Neueste ausdrückliche Nutzerentscheidungen in den zuständigen Issues und im [Vollständigkeitsbericht](ROADMAP_VOLLSTAENDIGKEIT_2026-11-02.md).
3. [Aktuelle konsolidierte Roadmap](KONSOLIDIERTE_ROADMAP.md), [gemeinsamer Importplan](IMPORT_HISTORY_UNIFIED_PLAN_2026-11-01.md) und unveränderte Detail-/Sicherheitsverträge.
4. Historische Statusabschnitte nur als Belege und Herkunft, nicht als aktuelle Owner-/Versionsangabe.

## Unveränderte operative Reihenfolge

| Rang | Nächste Arbeit | Grenze |
| --- | --- | --- |
| P0 | Bestätigte neue Finanz-/Daten-/Save-/Backup-/Updatefehler; aktuellen Release sicher abschließen. | v269 beim Audit deployed, laut gelesenem Checkpoint noch nicht LIVE_ACCEPTED. Bestehenden gezielten Live-Retry auswerten; keine zusätzliche CI starten/abbrechen. |
| Aktueller P1-Hauptpfad | **UH03 → UH04 → UH05**. | Vorhandene Originale/Oracles und bestehende Engine wiederverwenden. Historische Endbelege, Gebühren-/Reihenfolge-/Quellenabgleich, Flatex-E2E und Gesamtabnahme nicht durch Vorschau ersetzen. |
| Bestehende P1-Bedienung | #257 Long-Press/Erstauswahl, UI-ALLOC01, belegte Copy-/Verwaltungs-/Prüfbereich-/Historienreste, Android-Performance. | Am nächsten konfliktfreien Schnitt; kein zweiter Owner/Branch für dieselbe Arbeit, laufenden Import-/Releasepfad nicht verdrängen. |
| Kleine PWA-/UI-Nachträge | PWA-INSTALL02, UI-LOAD01 Reload-/Bewegungsabnahme, kontextabhängige Kurs-CSV-UI. | Basisfunktionen nicht neu bauen, keine künstlichen Wartezeiten, kein funktionsloses Installationssymbol. |
| Weitere aktive Master | FLH03/FLH05 einschließlich Trade Republic/weiterer Profile, DELETE-MASTER28, FLH04, HIST-VIS01, #254/#255/#256, Wallet-/Staking-/AT-Reste. | Abhängigkeiten und konkrete Nachweisgrenzen aus Roadmap erhalten. Backup ist kein Sync, Emulation keine Hardware, historische Bestandsbelege nicht erfinden. |
| Nachgelagerte Erweiterungen | FLH-PROJ01 aktiv/geplant; PORT-COMP01 nur Vorschlag mit offener Scoremethodik; NAM01/COPY01-Reste. | Keine alte PARKED-/Wochenend-/Credit-Sperre reaktivieren, keine neue Zusatzcredit-Buchung, keine eigenmächtige Umbenennung. |
| Infrastruktur | CI-OPT01-Reste und Übergabeeffizienz. | Messbarer Nutzwert, keine Abschwächung der Finanz-/v5-/CAS-/Backup-/Offline-/Browsergates. |

## Verbindlich korrigierte Statusfallen

- **PR #283 ist beim Audit bereits gemergt**; alter Kandidaten-/25-Minuten-Blockertext nicht als aktueller Stand wiederholen. Aktuellen Lauf immer frisch lesen.
- UI-LOAD01/PWA-FULL01-Grundumfang v267 ist nicht gleich Abnahme der späteren Installationssymbol-/Reload-/Wahrnehmbarkeitswünsche.
- #257-Grundverwaltung ist nicht gleich fertiger Long-Press. Neuester Nachtrag verlangt **Verwalten + sofortige Auswahl des gedrückten Eintrags**, nicht bloß Moduswechsel.
- Altanbieterbereinigung ist im Produktkern vorhanden. Offen sind unter anderem veraltete Nutzerhilfen; nicht alle historischen FMP/Twelve-Quellmetadaten löschen.
- Prozent-Ringe pro Depotposition sind **UI-ALLOC01**, nicht der noch unentschiedene Portfolio-Score **PORT-COMP01**.
- „Täglich“ nicht ungeprüft von einer Automatik-/Aktualisierungsauswahl in einen Diagrammvertrag umdeuten. „6×1“ nicht ohne Zielbereich-/Breakpointprüfung erzwingen.
- Der Fünf-Anbieter-Importplan streicht Trade Republic und übrige freigegebene FLH03/FLH05-Umfänge nicht.
- Erfasste Stichtage aus einer redundanten UI-Zeile entfernen bedeutet nicht, Daten/Stichtagsverwaltung oder XIRR/TWR eigenmächtig zu löschen.

Nur belegte, abgegrenzte Teilumfänge als abgenommen markieren. **Ein aktiver Entwicklungsowner; Checkpointbranch niemals vollständig nach Main mergen; v5 und Daten-/Installationsidentität unverändert schützen.**
