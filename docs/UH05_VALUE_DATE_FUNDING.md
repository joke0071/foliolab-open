# UH05 – bounded next-day funding value date

The existing joint import offers a new persisted funding proof V2 for one
specific documentary pattern: the funding value date is exactly one calendar
day after the original purchase/order-payment value date; the funding is booked
on its own value date, on or after the purchase booking day. The separately
identified positive EUR credit must exactly offset the unique V1 purchase's
negative order payment, with the same native account scope, ISIN and order.
Both original value dates and both booking dates are retained. Other date
patterns, ambiguous credits, cancellation, source changes, currency/amount/scope
conflicts and multi-fill funding remain blocked.

This is a documentary association, not proof that later money was available
earlier. Each selected group still needs its own current external-role
confirmation. The DKB checking account stays outside the portfolio. The preview
shows the external credit and internal purchase, each with its own original
booking date and value date. No blanket historical role is assigned.

## Cash chronology and openings

The existing booking-date ledger remains authoritative. Events on different
days keep their dates. On the same booking day the explicitly confirmed credit
precedes the purchase under the existing daily chronology rule; no intraday
timestamps are inferred. Every intermediate cash balance must be nonnegative.
A later credit cannot cover an earlier shortfall. Independently evidenced
dated openings are required before the first affected event, never calculated
from a purchase, a funding credit or today's balance. References, old journals,
known cost bases and append boundaries keep their existing protections.

The original exports contain 57 cases with this pattern. All 57 independent
private Python CSV/Decimal oracles retain exact quantity, price, gross, cash,
unresolved difference and separate original dates. Mathematical test liquidity
and controlled role confirmations only support tests; they do not establish
actual user opening balances or actual historical external ownership.

## Persisted capability and compatibility

Funding V1 and its identifiers retain their exact prior contract. V2 stores
`chronology: next-day-value-date` and uses a separate version-bound funding ID.
Native source keys and V1/V2/V3 settlement identities are unchanged. Strict
reconstruction on load, commit and restore validates the complete proof.
The actual isolated v294 reader must reject the new variant; ordinary V1 data
must remain readable. Data using V2 therefore needs v295 or a later compatible
reader. Do not offer v294 as a reader for these new data.

No new finance or persistence engine: the common CSV/settlement/journal path
creates one purchase, one external deposit, five balanced postings and one
external cashflow. Unknown fees, taxes and cost bases remain unknown; the
unresolved settlement difference is not classified as a charge, profit or FX.
The existing baseline, single CAS commit, source ownership, complete Undo,
idempotent replay, encrypted backup/restore and offline paths remain in use.

## Required verification

The independent public Decimal fixture is entirely invented. It covers exact
and insufficient earlier liquidity, an 18-decimal shortfall, same-day funding,
precision and unresolved difference signs. Units protect strict proof/version
and original dates, negative date/reference/currency/source/role cases,
openings/references/costs, shared preview, replay, restore and full Undo.

The existing shared-UI browser gate retains earlier and later V1 cases and adds
V2. It checks both original value dates, the independent intermediate cash
path, confirmations and revocation, exactly one CAS revision, quota/post-put
abort, full Undo/reimport, offline reload, encrypted fresh-profile restore,
real second-tab conflict, seven widths and Axe in all three engines. Normal
integration and actual main/deployment/production gates remain mandatory.
This document alone is not a completed CI or production acceptance claim.

UH05 overall stays PARTIAL. N:M/partial fills, FX/additional cash roles,
historical references/cost basis, wallets/staking and cross-provider economic
reconciliation remain open; missing wallet or staking evidence is UNKNOWN.
