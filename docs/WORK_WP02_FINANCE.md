# WP02 — financial invariants

Base: a42effbcb344a4322d4ae7dcb75df7b13683b62f (WP01, PR #103).

Existing transactions.js remains the only journal engine. Trades move positions and settlement cash; internal transfers preserve aggregate wealth and are not external flows. Deposits/withdrawals cross the portfolio boundary. Valuations measure wealth; corrections are not proven performance. Unresolved settlement / unvalued corrections block portfolio performance. Unknown basis stays null.

Existing independent references: ledger-reference-arithmetic (2/3 basis allocation, 1-wei profit, USD fee settlement), ledger-multistep-fx-corporate, transactions, capital-flows and backup tests. No journal algorithm change was required by these references.

Reproduced defects (red tests before correction): XIRR could select one of three roots, equal same-day flows yielded an arbitrary rate, missing amounts became zero, invalid dates normalized, Dietz omitted flows defaulted to zero. Overflow was not rejected.

XIRR now nets same-day flows and requires exactly one sign change to prove uniqueness. Non-conventional flows are conservatively unavailable even if a unique root might exist; no arbitrary guess. Calendar and amount checks precede conversion. Same-day-only netting is not annualized. TWR and Dietz reject non-finite results; Dietz requires explicit complete flow inputs. Existing 365.25-day convention is unchanged.

Independent reference: -100,+350,-350,+100 on equally spaced yearly dates has roots near -50%, 0%, +100%; unavailable is the only safe single-value result. Negative endpoint reference uses (80/100)^(365.25/365)-1.

No schema change; existing backup/restore regression remains mandatory. Missing Android evidence remains the WP01 manual gate.
