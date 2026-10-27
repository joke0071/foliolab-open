# Buchungsverwaltung #165 — Phase 1, read-only Grundlage

Basis: v187/main ab5c4aa9edcb44597975daf9684d5701f46a1cf1, vollständig live abgenommen. Nur ein aktiver funktionaler Strang: feature/booking-management-foundation. D157 bleibt geparkt; Sync161 bleibt separater Draft.

## Implementiert

src/booking-management.js ist noch nicht in die Oberfläche importiert. Es verwendet bookingHistoryRows, ledgerQuantityAudit und die bestehende stabile ID-Auswahl aus position-selection.js. Filter- und globale Auswahl einschließlich ausdrücklicher Bestätigung, Pagination-unabhängige Mengen und verdeckte Auswahl sind wiederverwendet. Keine zweite persistente Auswahlverwaltung.

Die Lesevorschau unterscheidet vorhandene Importherkunft (auch nach manueller Ownership), wirtschaftliche Verknüpfung, technischen Abgleich, Walletbezug, manuelle und unbekannte Herkunft. Kategorien können gemeinsam auftreten. Fehlende/mehrdeutige IDs werden abgewiesen; ein Journal-/Bestandswiderspruch bleibt sichtbar. Diese Prüfung ist noch kein vollständiger wirtschaftlicher Referenzgraph. Jede approvedActions-Liste bleibt leer, writeEnabled bleibt false. Keine Commit-, Lösch-, Korrektur- oder Undo-API, kein Journalposting-DELETE.

SW188 ist nur Kandidat wegen des neuen ausgelieferten Moduls und der vorhandenen CI-Cache-Revisionsregel; kein v188-Release freigegeben. Die aktuelle Produktoberfläche und Finanzdaten bleiben unberührt.

## Noch offen, nicht als erledigt melden

1. Vollständige belegte Zulässigkeitsmatrix und Auswirkungen auf Cashflows, Bestände, Anschaffungskosten, Historien und Referenzen. Keine manuelle Herkunft allein als wirtschaftliche Freigabe verwenden.
2. Für tatsächlich zulässige Fälle bestehenden Transaktionsvertrag verwenden, genaue Vorabbilder und atomaren CAS-Commit integrieren; Vorschauabbruch/Undo und Mehrtab-/Quota-/post-put-Abbruch prüfen. Historien nicht über heutige Bestände rückwirkend replayen.
3. Erst danach Auswahl-/Korrektur-/Rücknahmeoberfläche und vollständige Drei-Engine-/Mobile-/Axe-/Finance-/Import-/Restore-/Offline-Abnahme.
4. Eigene konkrete Produktionsentscheidung nach vollständig reviewbarem PR. Keine Freigabe aus v187 ableiten.

Fünf neue lokale Unit-Tests decken Identität/verdeckte Auswahl, Nullmutationen, Importownership+Transfer, ungültige/stale IDs und Journal-/Wallet-/Technikstatus ab. Finalen Gesamt- und Remote-CI-Status separat prüfen. Phase 1 ist keine fertige Buchungsverwaltung.

CI-Optimierung bleibt ausdrücklich letzter separater Schritt. Baseline wurde im v187-Abschlusskommentar von PR172 gesichert; noch keine Optimierung/Zeiteinsparung implementiert.
