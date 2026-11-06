"""Independent synthetic 3:1 EUR oracle, before implementation; no product imports."""
from decimal import Decimal, localcontext
from pathlib import Path
import json

def text(value):
    return format(value, 'f').rstrip('0').rstrip('.') if '.' in format(value, 'f') else format(value, 'f')

specs = [
    ('unequal-integer', ['1', '2', '3'], ['10', '10', '10'], '3'),
    ('equal-distinct-identities', ['1', '1', '1'], ['10', '10', '10'], '2'),
    ('fractional-unequal-prices', ['0.125', '0.25', '0.5'], ['8', '12', '4'], '0.02'),
    ('zero-group-difference', ['1.25', '2.5', '0.25'], ['4', '8', '20'], '0'),
    ('positive-group-difference', ['0.125', '0.25', '0.5'], ['8', '12', '4'], '-0.02'),
]
cases = []
with localcontext() as ctx:
    ctx.prec = 80
    for name, quantities, prices, charge in specs:
        for direction in ('buy', 'sell'):
            sign = Decimal(1 if direction == 'buy' else -1)
            q = [Decimal(x) for x in quantities]
            gross = [a * Decimal(p) for a, p in zip(q, prices)]
            total_q, total_gross = sum(q), sum(gross)
            cash = -sign * total_gross - Decimal(charge)
            opening_asset, opening_cash = Decimal('20'), Decimal('1000')
            members = []
            for i, (quantity, price, amount) in enumerate(zip(q, prices, gross)):
                members.append({'role': f'fill-{i}', 'bankIdentity': f'SYN-THREE-FILL-{i}',
                    'quantityExact': text(quantity), 'unitPriceExact': price,
                    'grossExact': text(amount), 'cashAllocated': None,
                    'feeEUR': None, 'taxEUR': None, 'costBasisEUR': None,
                    'postings': [
                        {'role': 'asset', 'quantityDeltaExact': text(sign * quantity), 'amountBookEURExact': text(sign * amount)},
                        {'role': 'clearing', 'quantityDeltaExact': None, 'amountBookEURExact': text(-sign * amount)}]})
            difference = cash + sign * total_gross
            members.append({'role': 'cash', 'bankIdentity': 'SYN-THREE-CASH',
                'cashExact': text(cash), 'feeEUR': None, 'taxEUR': None,
                'postings': [
                    {'role': 'cash', 'quantityDeltaExact': text(cash), 'amountBookEURExact': text(cash)},
                    {'role': 'clearing', 'quantityDeltaExact': None, 'amountBookEURExact': text(sign * total_gross)},
                    {'role': 'unresolved-net-amount', 'quantityDeltaExact': None, 'amountBookEURExact': text(-difference)}]})
            assert all(sum(Decimal(p['amountBookEURExact']) for p in m['postings']) == 0 for m in members)
            assert sum(Decimal(p['amountBookEURExact']) for m in members for p in m['postings'] if p['role'] == 'clearing') == 0
            assert len(members) == 4 and sum(p['role'] == 'cash' for m in members for p in m['postings']) == 1
            cases.append({'name': name + '-' + direction, 'direction': direction,
                'opening': {'asset': text(opening_asset), 'cash': text(opening_cash), 'asOf': '1999-01-01'},
                'date': '1999-01-04', 'valueDate': '1999-01-06',
                'quantities': quantities, 'prices': prices,
                'quantityExact': text(total_q), 'grossExact': text(total_gross),
                'cashExact': text(cash), 'differenceExact': text(difference),
                'end': {'asset': text(opening_asset + sign * total_q), 'cash': text(opening_cash + cash)},
                'expectedBookings': 4, 'expectedJournals': 4, 'expectedPostings': 9,
                'expectedExternalFlows': 0, 'expectedCASRevisions': 1, 'members': members})

report = {'main': '6b020461aec68b6281dbc00e32c953dc6cec14cb',
    'tree': '6cc86610f633d4e93665d7f53c40282144c9df28',
    'scope': 'SYNTHETIC future expected values, not implemented capability or production/private-original acceptance',
    'oracle': 'Python Decimal precision80; no product arithmetic; every journal independently balanced',
    'cases': cases, 'result': 'ORACLE_SELF_CHECK_PASS / IMPLEMENTATION_PENDING'}
target = Path(__file__).resolve().parent.parent / 'release-evidence/uh05-three-fill-oracle-2026-11-06.json'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'cases': len(cases), 'result': report['result'], 'output': str(target)}))
