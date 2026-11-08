# UH05 – bounded native multi-asset Spot/Earn allocation

A Kraken native `earn / autoallocation` reference may contain several asset
pairs. This slice admits 2–12 complete principal transfers only when every
supplied member has the same nonempty native reference and exact timestamp.
For each declared asset there must be exactly one debit and one credit, the
same subclass, conserved exact quantity and an explicitly zero fee. All pairs
must share one direction between the observed `spot / main` and `earn / liquid`
wallet scopes. Only crypto/stable-coin subclasses and EUR fiat are admitted.
Foreign fiat, extra/missing legs, mixed directions/times/types, ambiguous
identities, fees and source conflicts stay blocked. Reference membership and
wallet semantics establish association; aggregate sums never establish it.

Each asset/wallet stream needs a current explicit manual-position binding.
Source and target use different accounts under the same chosen provider.
Fresh groups require checked historical opening quantities before the event;
source running-balance equations only anchor conditional tests, never authorize
actual user openings. Existing native row/reference/source identities remain
unchanged. Every original leg stays in the source payload; each asset pair
uses the existing `transfer` journal action. There is no reward, external flow,
fee valuation, FX rate, fabricated cost basis or inferred blockchain identity.
Known basis, manual journals, source changes and historical opening guards
retain their existing protections. Missing wallet/staking evidence stays UNKNOWN.

The existing shared CSV preview, individual provider approval, enclosing backup
and explicit confirmation produce one canonical IDB/CAS commit. Complete-group
Undo, replay, offline reload, encrypted fresh restore and terminal documentary
withdrawal reuse their current paths. A withdrawal keeps the full source and
persistent replay block; dependent later journals still prevent it. Replay of a
complete unchanged prior group does not require a new opening assertion.

No new stored field or journal type is introduced. Actual old v295 readers
were checked against the privately reproduced ordinary transfer journals;
restoration remains readable. The v295 importer cannot ingest these previously
unresolved groups. FundingV2 still requires v295+ exactly as before.

## Evidence and limits

A separate Python CSV/Decimal oracle binds the private original native
membership, wallet scopes, timestamps and before/after quantities. Reproductions
on exact v295 were blocked. Candidate tests cover the complete selected original
groups, reversed/overlapping files, zero source mutation, shared commit, replay,
restore, complete Undo and terminal withdrawal. All real source references,
amounts, identifiers and locators stay private. These are conditional tests,
not actual user portfolio/opening acceptance.

The public oracle and fixtures are entirely invented. Negative tests protect
membership, source/time/direction/subclass/fee/currency, assignments, opening
approval/date/balance, known costs, replay and incomplete journals. The common
UI browser gate adds this case through its existing serial import chain:
Chromium, Firefox and WebKit; opening/selection/binding approval revocation;
one CAS; quota/post-put zero mutation; Undo/recommit; offline replay; encrypted
fresh restore plus reload; real second-tab race; seven widths and Axe.
Mandatory regular integration, Main/deployment and actual production acceptance
must pass before a release is LIVE_ACCEPTED. This document is not that claim.

Order/cash N:M or partial-fill FX is still BLOCKED in the examined Flatex pair:
its 401 strict 1:1 groups cannot establish a new case. The other original
Kraken multi-asset foreign-fiat allocation remains blocked by the EUR-position
contract. Isolated conversions with different references/timestamps cannot be
paired by similar amounts. Bitpanda staking/transfer rows lack a proven full
counterpart contract, and independent opening/closing/reference/cost-basis
proofs remain required. No redundant original request or new chain request was
made. All remaining UH05, UI300 ten addenda, QUALITY298, CI229, Android/PWA,
wallet/staking and management work remain open under the existing priorities.
