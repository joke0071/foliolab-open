"""Independent synthetic funding/settlement illustration; no import capability claim."""
from decimal import Decimal, getcontext
import json
from pathlib import Path
getcontext().prec=90
cases=[]
for quantity,price,settlement,funding in [('6','10','-63','63'),('1.25','8','-10.75','10.75'),('3','20','-60','60')]:
    q,p,s,f=map(Decimal,(quantity,price,settlement,funding))
    gross=q*p; difference=s+gross; cash=s+f
    # Independent balanced economic roles, retaining every actual cash movement.
    trade=[gross,-gross]
    settlementJournal=[s,gross,-difference]
    fundingJournal=[f,-f]
    assert sum(trade)==sum(settlementJournal)==sum(fundingJournal)==0
    assert cash==0 and gross>0 and q>0
    # Portfolio inflow depends on whether a second tracked account exists.
    outside={'portfolioFlow':str(f),'counterAccountCash':None}
    inside={'portfolioFlow':'0','counterAccountCash':str(-f)}
    assert f+Decimal(inside['counterAccountCash'])==0
    cases.append({'quantity':str(q),'unitPrice':str(p),'gross':str(gross),'settlementCash':str(s),'fundingCash':str(f),'brokerCashNet':str(cash),'unallocatedTradeDifference':str(difference),'fees':None,'taxes':None,'costBasis':None,'outsidePortfolioIllustration':outside,'trackedOwnAccountIllustration':inside,'selectedRole':None,'result':'PASS'})
report={'scope':'Synthetic independent Decimal role illustration only; no production import/IDB/portfolio mutation','result':'PASS','cases':cases,'rule':'Zero broker cash net does not mean zero trade cost or zero portfolio inflow. Do not choose between outside-portfolio funding and tracked own-account transfer without an explicit evidenced boundary.'}
dest=Path(__file__).resolve().parent.parent/'release-evidence'/'uh05-funding-role-oracle-2026-11-06.json';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'result':'PASS','syntheticCases':len(cases),'selectedOwnershipOrFlowRole':None}))
