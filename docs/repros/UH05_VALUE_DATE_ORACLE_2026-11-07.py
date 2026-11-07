"""Invented next-calendar-day funding; independent Decimal/book-date paths."""
from decimal import Decimal, getcontext
from pathlib import Path
import json
getcontext().prec = 90
def exact(n):
    s = format(n, 'f')
    return s.rstrip('0').rstrip('.') if '.' in s else s
cases = []
for name, opening, quantity, price, cash, trade, funding in [
    ('later-exact-liquidity', '21.75', '2', '10', '-21.75', '1999-01-02', '1999-01-05'),
    ('later-short-by-atto', '21.749999999999999999', '2', '10', '-21.75', '1999-01-02', '1999-01-05'),
    ('later-zero', '0', '2', '10', '-21.75', '1999-01-02', '1999-01-05'),
    ('same-day-zero', '0', '2', '10', '-21.75', '1999-01-05', '1999-01-05'),
    ('precision', '0.123456789012345679', '0.000000000000000001', '123456789012345678', '-0.123456789012345679', '1999-01-02', '1999-01-05'),
    ('zero-difference', '20', '2', '10', '-20', '1999-01-02', '1999-01-05'),
    ('positive-difference', '19', '2', '10', '-19', '1999-01-02', '1999-01-05'),
]:
    o,q,p,c = map(Decimal, [opening,quantity,price,cash])
    credit = -c
    balance=o; path=[]; eligible=True
    for date,_,kind,delta in sorted([(trade,1,'trade',c),(funding,0,'funding',credit)]):
        balance += delta; eligible &= balance >= 0
        path.append(dict(date=date,kind=kind,deltaExact=exact(delta),balanceExact=exact(balance)))
    cases.append(dict(name=name,opening=opening,quantity=quantity,price=price,cash=cash,funding=exact(credit),gross=exact(q*p),difference=exact(c+q*p),tradeDate=trade,fundingDate=funding,tradeValueDate='1999-01-04',fundingValueDate='1999-01-05',openingDate='1999-01-01',closing=exact(balance),eligible=eligible,path=path))
result=dict(origin='Invented values only; Python Decimal independent of application',cases=cases)
Path('docs/release-evidence/uh05-value-date-oracle-2026-11-07.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(cases=len(cases),eligible=sum(c['eligible'] for c in cases))))
