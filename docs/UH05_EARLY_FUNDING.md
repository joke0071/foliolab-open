# UH05 – a separately booked funding credit before its purchase

The existing joint savings-plan funding mode now accepts the original credit
booking date before the associated purchase booking date. The documentary
contract is otherwise unchanged: one V1 EUR purchase and native order payment,
one separately identified positive credit, exact order/ISIN/account association,
exact offset and the same original value date. Credit dates after that value
date, multiple candidates, changed payloads, other currencies and conflicting
scopes remain blocked. Every selected group still requires its own current
external-role confirmation. The DKB checking account stays outside FolioLab.

## Original evidence and limits

The preserved historical exports were independently read row by row with Python
CSV/Decimal. Of 357 positive purchase credits, 300 have the documentary shape
above: 285 credits after the purchase, 10 on the same booking day and five
before it. The 57 different-value-date groups remain open. The exact v293
inspector offered 295 and excluded those five earlier credits. This is a
documentary classification, not a blanket external-flow assertion.

All five original earlier groups (15 source rows) were compared privately with
the current planner in both document orders. Controlled per-group external
roles and synthetic zero openings yield ten bookings, five external flows,
exact original dates and zero final cash. Replay, restore and full Undo pass.
These controlled openings do not evidence actual user opening balances or
constitute acceptance of a user portfolio import. Original amounts, references,
source identities and locators remain private. No original needs to be supplied
again for this documentary check.

## Earliest affected date

Cash movements are applied in their actual booking order. A credit before the
purchase is available on its own original date; a later credit still cannot
cover an earlier negative balance. For cash, the opening must predate the
earlier of the funding and purchase dates. For the security it must predate the
purchase. Selection order cannot weaken the opening bound.

An incremental append must begin strictly after existing affected journals.
Cash reference observations between an earlier credit and its purchase remain
protected. Restore validates the opening against the earlier cash event too.
Existing bookings, journal entries and openings are retained; known historical
cost bases remain protected by the unchanged eligibility checks. Nothing is
backdated, netted away or inferred from a later balance or an unexplained
settlement difference. Funding is capital, never income; the purchase is an
internal reallocation.

## Verification and compatibility

`repros/UH05_EARLY_FUNDING_ORACLE_2026-11-07.py` independently supplies six dated
Decimal paths, including zero cash, 18 decimal places and later-credit failures.
Sixteen new units check both document orders, exact intermediate cash and
external flows, openings, selection order, incremental preservation, references,
hostile restore and negative source/value-date/role cases. All previous funding
tests remain. The existing three-engine joint-UI gate now executes both earlier
and later financing, each with consent revocation, exactly one CAS commit,
quota/post-put rollback, full Undo/replay, offline reload, encrypted fresh-profile
restore, a real second-tab race and seven-width Axe checks. The earlier case
also rejects an opening dated on the credit day without any storage change.

No schema or native source identity key changes. The actual isolated v293
reader accepts ordinary v293 funding but rejects the newly allowed earlier
credit contract. Data using the extension therefore needs v294 or a later
compatible reader. A v293 downgrade is not a compatible reader for that data.
Integration, deployment and actual production acceptance are separate gates;
this document alone does not assert they passed.
