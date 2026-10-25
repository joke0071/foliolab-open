"""Independent AT02-B oracle: stdlib Fraction per calendar day, no app imports.
Run: python3 tests/reference/interest_reference.py > /tmp/interest-reference.json
Compare with tests/fixtures/interest-reference.json. No binary floating point.
"""
from datetime import date, timedelta
from fractions import Fraction
import json

cases = [
 ('constant','10000','EUR','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','2.5')],2),
 ('mid-month change','10000','EUR','2026-01-01','2026-02-01','ACT/365F',[('2026-01-01','2.5'),('2026-01-16','2')],2),
 ('year boundary','10000','EUR','2025-12-31','2026-01-02','ACT/365F',[('2025-12-31','2')],2),
 ('leap day fixed denominator','10000','EUR','2024-02-28','2024-03-01','ACT/365F',[('2024-02-28','2.5')],2),
 ('leap day 360','10000','EUR','2024-02-28','2024-03-01','ACT/360',[('2024-02-28','2.5')],2),
 ('whole leap year fixed','10000','EUR','2024-01-01','2025-01-01','ACT/365F',[('2024-01-01','2.5')],2),
 ('month 360','10000','EUR','2026-01-01','2026-02-01','ACT/360',[('2026-01-01','2.5')],2),
 ('month 365','10000','EUR','2026-01-01','2026-02-01','ACT/365F',[('2026-01-01','2.5')],2),
 ('zero rate','10000','EUR','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','0')],2),
 ('zero principal','0','EUR','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','2.5')],2),
 ('tiny principal','0.01','EUR','2026-01-01','2026-01-02','ACT/365F',[('2026-01-01','1')],2),
 ('large exact principal','123456789012345678901234567890.12','EUR','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','3.45')],2),
 ('USD no FX','10000','USD','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','2.5')],2),
 ('JPY zero digits','10001','JPY','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','2.5')],0),
 ('KWD three digits','1','KWD','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','0.5')],3),
 ('half cent away from zero','1','EUR','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','0.5')],2),
 ('below half cent','0.999999999999999999','EUR','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','0.5')],2),
 ('negative rate half cent','1','EUR','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','-0.5')],2),
 ('no intermediate rounding','1','EUR','2026-01-01','2027-01-01','ACT/365F',[('2026-01-01','0.5'),('2026-07-02','0.5')],2),
 ('change at exclusive end ignored','10000','EUR','2026-01-01','2026-01-02','ACT/365F',[('2026-01-01','2.5'),('2026-01-02','100')],2),
 ('change at inclusive start','10000','EUR','2026-01-02','2026-01-03','ACT/365F',[('2026-01-01','100'),('2026-01-02','0')],2),
]
rows=[]
for name,capital,currency,start,end,method,rates,digits in cases:
 start_day,end_day=date.fromisoformat(start),date.fromisoformat(end)
 basis=360 if method=='ACT/360' else 365
 value=Fraction(0);day=start_day
 while day<end_day:
  applicable=[r for d,r in rates if date.fromisoformat(d)<=day]
  if not applicable: raise ValueError('Missing rate')
  value+=Fraction(capital)*Fraction(applicable[-1])/100/basis
  day+=timedelta(days=1)
 scaled=abs(value)*10**digits
 rounded=scaled.numerator//scaled.denominator
 if 2*(scaled.numerator%scaled.denominator)>=scaled.denominator:rounded+=1
 text=str(rounded) if digits==0 else str(rounded//10**digits)+'.'+str(rounded%10**digits).zfill(digits)
 if value<0 and rounded:text='-'+text
 rows.append(dict(name=name,principal=capital,currency=currency,asOf=start,startDate=start,endDate=end,dayCount=method,
  rates=[dict(fromDate=d,annualRateExact=r,knownThrough=None) for d,r in rates],expectedDays=(end_day-start_day).days,expectedGrossExact=text,
  expectedRational=dict(numerator=str(value.numerator),denominator=str(value.denominator))))
print(json.dumps(rows,indent=2,ensure_ascii=False))
