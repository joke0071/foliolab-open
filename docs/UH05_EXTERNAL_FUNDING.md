# UH05 – explicit external funding of a EUR purchase

The joint original-file import offers a separate **Sparplankauf mit externer Finanzierung** mode. Each selected group needs exactly one existing V1 EUR purchase/order-payment proof and one separately identified, positive native `Kauf ISIN order-reference` credit in the same bank scope. The amount must offset that payment, with the same original value date. Ambiguous, changed, cancelled, wrong-currency and multi-fill funding groups remain blocked. No blanket classification of historical credits and no external checking account creation.

Each group requires its own current external-role confirmation. The joint preview shows the external deposit and internal purchase separately, including their original booking dates and value dates. Selection, account, scope, mode and opening-date changes revoke confirmations and the final backup/commit approval. Native bank identity keys and the V1/V2/V3 settlement proofs are unchanged.

## Chronology decision

The ordinary transaction ledger and its nonnegative cash audit remain authoritative. Events are ordered by original booking date; for equal booking dates the confirmed credit precedes its purchase. A later credit cannot finance an earlier negative cash balance. Unjournaled positions require the existing explicit, independently evidenced dated-opening contract, strictly before the first purchase. Existing dated openings and reference observations are protected. No opening is inferred from a present balance or the size of the later credit, and no booking date is replaced by value date. A group without enough evidenced earlier cash is blocked. Synthetic test openings do not prove a user's actual historical opening.

## Durable membership and compatibility

The new V1 funding proof retains all three native sources and documentary occurrences beside the original V1 settlement proof. The existing CSV and transaction engines create two bookings, five balanced postings and one external cashflow. The purchase retains unknown fees, taxes and basis; its settlement difference stays unresolved. The funding is external capital, never income. The reserved `netAugmentation.version = 3` capability marker on the purchase causes the actual v292 reader to reject this new economic contract; old ordinary data remains readable. No new financial engine or storage path.

Backup/load/commit validates complete members, source scope, payload, ownership, original dates, exact amounts, journal roles and the unique external flow. Replay in either file order is idempotent; overlap only extends source occurrences. Remapping a native bank source cannot create another economic effect. Individual economic withdrawal is blocked; the existing complete session Undo/validated backup path remains available.

## Verification

Independent Python Decimal oracle: six chronology/precision/difference cases, both document orders. Targeted units cover roles/openings, source conflicts, hostile restore, overlap, incremental append, joint preview and full Undo. An isolated reconstruction of the exact v292 source actually rejects the new persisted contract and reads ordinary old data. Existing units and syntax remain required.

The native-settlement browser orchestrator includes the new joint-UI flow in its existing Chromium/Firefox/WebKit candidate and production runs. It checks explicit role and selection/account revocations, one CAS revision, quota and post-put rollback, actual Undo/replay, offline reload, encrypted fresh-profile UI restore, a real second-tab CAS race, seven widths and Axe. It uses invented fixtures only. Required CI is preserved; no gate reductions or workflow reruns are part of this change. Actual production acceptance is a separate release result after deployment, not implied by this document.
