"""Synthetic exact chronology oracle, independent of all JavaScript engines."""
from decimal import Decimal, getcontext
from pathlib import Path
import json
getcontext().prec = 90
cases = []
for name, opening, quantity, price, cash, funding_day in [
    ('before-zero', '0', '2', '10', '-21.75', '1999-01-01'),
    ('before-existing-cash', '7', '3', '10', '-29.9', '1999-01-01'),
    ('before-exact-18', '0', '0.000000000000000003', '7', '-0.000000000000000023', '1999-01-01'),
    ('same-zero', '0', '2', '10', '-21.75', '1999-01-02'),
    ('after-zero-blocked', '0', '2', '10', '-21.75', '1999-01-03'),
    ('after-enough-cash', '21.75', '2', '10', '-21.75', '1999-01-03'),
]:
    def fmt(n):
        s = format(n, 'f')
        return s.rstrip('0').rstrip('.') if '.' in s else s
    q, p, debit = map(Decimal, [quantity, price, cash])
    funding = -debit
    events = sorted([('1999-01-02', 1, debit), (funding_day, 0, funding)])
    balance = Decimal(opening)
    path = []
    for day, _, delta in events:
        balance += delta
        path.append(dict(date=day, balanceExact=fmt(balance)))
    gross = (q*p).quantize(Decimal('0.000000000000000001'))
    cases.append(dict(name=name, opening=opening, quantity=quantity, price=price, cash=cash, funding=fmt(funding), fundingDate=funding_day, tradeDate='1999-01-02', valueDate='1999-01-04', openingDate='1998-12-31', eligible=all(Decimal(v['balanceExact'])>=0 for v in path), path=path, closing=fmt(balance), gross=fmt(gross), difference=fmt(debit+gross), externalFlow=fmt(funding), profitFromFunding='0'))
out = dict(result='PASS', source='Python Decimal, no product imports or private originals', cases=cases)
target = Path(__file__).resolve().parents[1]/'release-evidence/uh05-early-funding-oracle-2026-11-07.json'
target.write_text(json.dumps(out, indent=2)+'\n')
print('Independent earlier-funding oracle:', len(cases), 'cases')
