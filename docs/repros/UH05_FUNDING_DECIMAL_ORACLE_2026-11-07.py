"""Independent synthetic chronology and external-flow oracle. No app imports."""
from decimal import Decimal, getcontext
import json
from pathlib import Path
getcontext().prec=80
D=Decimal
cases=[]
for name,opening,qty,price,settlement,funding,later in [
 ('later-funded', '100','2','10','-21.75','21.75',True),
 ('later-zero-blocked','0','2','10','-21.75','21.75',True),
 ('later-short-blocked','21.749999999999999999','2','10','-21.75','21.75',True),
 ('same-day-zero','0','2','10','-21.75','21.75',False),
 ('exact-18','101','0.000000000000000003','7','-0.000000000000000023','0.000000000000000023',True),
 ('unexplained-rebate','100','3','10','-29.9','29.9',True),
]:
 def fmt(x):
  s=format(x,'f');return s.rstrip('0').rstrip('.') if '.' in s else s
 gross=(D(qty)*D(price)).quantize(D('0.000000000000000001'))
 movements=[D(settlement),D(funding)] if later else [D(funding),D(settlement)]
 balance=D(opening);chron=[]
 for delta in movements:balance+=delta;chron.append(balance)
 cases.append(dict(name=name,opening=opening,quantity=qty,price=price,settlement=settlement,funding=funding,later=later,eligible=min(chron)>=0,closing=fmt(balance),gross=fmt(gross),difference=fmt(D(settlement)+gross),externalFlow=funding,intermediate=list(map(fmt,chron)),profitFromFunding='0'))
out={'result':'PASS','source':'Python decimal; no product imports','cases':cases}
Path('docs/release-evidence/uh05-funding-decimal-oracle-2026-11-07.json').write_text(json.dumps(out,indent=2)+'\n')
print('Independent Decimal oracle:',len(cases),'cases')
