"""Invented native rows; independent Python Decimal quantity/flow oracle."""
from decimal import Decimal, getcontext
from pathlib import Path
import json
getcontext().prec=100
common=dict(refid='SYN-ALLOCATION-BATCH',time='1999-02-03 11:12:13',type='earn',subtype='autoallocation',aclass='currency',subclass='crypto',fee='0',amountusd='',feeusd='',balanceusd='',feecurrency='')
rows=[dict(common,txid='SYN-ALLOC-BTC-DEBIT',asset='BTC',wallet='spot / main',amount='-0.125000000000000001',balance='0.374999999999999999'),dict(common,txid='SYN-ALLOC-BTC-CREDIT',asset='BTC',wallet='earn / liquid',amount='0.125000000000000001',balance='0.145000000000000001'),dict(common,txid='SYN-ALLOC-ETH-DEBIT',asset='ETH',wallet='spot / main',amount='-2.5',balance='0.5'),dict(common,txid='SYN-ALLOC-ETH-CREDIT',asset='ETH',wallet='earn / liquid',amount='2.5',balance='2.75')]
def exact(v):
 s=format(v,'f');return s.rstrip('0').rstrip('.') if '.' in s else s
expected=[]
for r in rows:
 delta=Decimal(r['amount'])-Decimal(r['fee']);closing=Decimal(r['balance']);opening=closing-delta
 expected.append(dict(asset=r['asset'],wallet=r['wallet'],before=exact(opening),delta=exact(delta),after=exact(closing)))
for asset in ['BTC','ETH']:assert sum(Decimal(r['amount']) for r in rows if r['asset']==asset)==0
out=dict(status='SYNTHETIC_ONLY',rows=rows,expected=expected,bookings=2,postings=4,externalFlows=0,rewards=0,fees=0,actualUserOpenings=False)
Path(__file__).resolve().parents[1].joinpath('release-evidence/uh05-kraken-allocation-oracle.json').write_text(json.dumps(out,indent=2)+'\n')
print('PASS: exact 18-decimal quantities; two principal transfers, no flow/reward/fee')
