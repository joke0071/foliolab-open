"""Verify the supplied Actions Pages or Live archive against its exact product tree."""
import hashlib
import io
import json
import re
import subprocess
import sys
import tarfile
import zipfile
from urllib.parse import parse_qs, urljoin, urlsplit
from pathlib import Path

kind, archive, checkout, sha, version, artifact, expected_digest = sys.argv[1:]
digest = lambda data: hashlib.sha256(data).hexdigest()
git = lambda *args: subprocess.check_output(['git', '-C', checkout, *args])
assert git('rev-parse', sha).decode().strip() == sha
cache = 'foliolab-open-v' + version
sw = git('show', f'{sha}:sw.js').decode()
assert re.search(r"^const CACHE='([^']+)';", sw).group(1) == cache
expected_assets = json.loads(re.search(r"^const ASSETS=(\[.*\]);$", sw, re.M).group(1).replace("'", '"'))
path_for = lambda path: 'index.html' if path == './' else path.removeprefix('./')
archive = Path(archive)
archive_digest = digest(archive.read_bytes())
assert archive_digest == expected_digest.removeprefix('sha256:')
result = {'sha': sha, 'cache': cache, 'artifactId': int(artifact), 'zipCRC': 'PASS', 'archiveSHA256': archive_digest}

with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    if kind == 'pages':
        files = {path_for(p) for p in expected_assets} | {'sw.js', 'LICENSE'}
        with tarfile.open(fileobj=io.BytesIO(z.read('artifact.tar'))) as tar:
            members = [m for m in tar.getmembers() if m.isfile()]
            assert {m.name.removeprefix('./') for m in members} == files
            assert len(members) == len(files)
            for member in members:
                assert tar.extractfile(member).read() == git('show', f'{sha}:{member.name.removeprefix("./")}')
        result['exactFiles'] = len(files)
    elif kind == 'live':
        core_bytes = z.read('live/report.json')
        core = json.loads(core_bytes)
        assert core['result'] == 'PASS' and core['sha'] == sha and core['cache'] == cache
        assert core['base'] == 'https://foliolab.unperfekt.at/' and not core.get('proxyCertificateException')
        assert core['errors'] == []
        expected = set(expected_assets) | {'./sw.js', './LICENSE'}
        assert {item['path'] for item in core['assetHashes']} == expected
        assert len(core['assetHashes']) == len(core['assetResponses']) == len(expected)
        for item in core['assetHashes']:
            p = path_for(item['path'])
            assert digest(git('show', f'{sha}:{p}')) == item['sha256'], p
        assert all(r['status'] == 200 for r in core['assetResponses'])
        assert {r['path'] for r in core['assetResponses']} == expected
        for r in core['assetResponses']:
            observed = urlsplit(r['url'])
            assert observed._replace(query='', fragment='').geturl() == urljoin(core['base'], r['path'])
            assert parse_qs(observed.query).get('release-check') == [sha]
        assert len(set(core['checks'])) == len(core['checks']) == 11
        assert len(core['scans']) == 22 and all(x['violations'] == 0 for x in core['scans'])
        engines = ('chromium', 'firefox', 'webkit')
        loading = {e: json.loads(z.read(f'loading-pwa/{e}.json'))['result'] for e in engines}
        assert all(v == 'PASS' for v in loading.values())
        navigation = {e: json.loads(z.read(f'navigation-installation/{e}.json')) for e in engines}
        assert all(record['result'] == 'PASS' for record in navigation.values())
        finance = [json.loads(z.read(f'fin-e2e/{e}.json')) for e in engines]
        assert all(d['base'] == core['base'] for d in finance)
        for engine, report in zip(engines, finance):
            assert any(run['engine'] == engine and run['status'] == 'PASS' for run in report['engines'])
        if int(version) >= 346:
            chromium_log = z.read('production-ui-chromium.log').decode()
            cross_log = z.read('production-ui-cross.log').decode()
            for engine in engines:
                log_for_engine = chromium_log if engine == 'chromium' else cross_log
                marker = 'FRACTIONAL_SETTLEMENT_PASS ' + engine + ' 0.609 shares, 9.46 gross, 0.51 tax, 8.95 net, 1.34 realized, fresh restore'
                assert marker in log_for_engine
            result['settlement'] = {'engines': list(engines), 'shares': '0.609', 'grossEUR': '9.46', 'taxEUR': '0.51', 'netEUR': '8.95', 'postTaxResultEUR': '1.34', 'freshRestore': True}
        if int(version) >= 347:
            for engine in engines:
                output = chromium_log if engine == 'chromium' else cross_log
                assert ('NEAR_PRECISION_PASS ' + engine + ' 145768498431409676817125837316 yoctoNEAR, rescan, reopen and fresh encrypted restore') in output
                assert ('USD_FRACTIONAL_SETTLEMENT_PASS ' + engine + ' 0.0648 shares, 1.36 USD, 1.089718 USD per EUR, 1.25 EUR net, -0.13 realized, fresh restore') in output
            result['nativeNEAR'] = {'engines': list(engines), 'yoctoNEAR': '145768498431409676817125837316', 'height': 226157919}
            result['usdSettlement'] = {'engines': list(engines), 'quantity': '0.0648', 'USD': '1.36', 'USDperEUR': '1.089718', 'netEUR': '1.25', 'realizedEUR': '-0.13'}
        if int(version) >= 344:
            assert all(n['csvMeasurementLifecycle']['currentAfterRender']['open'] is True and
                       n['csvMeasurementLifecycle']['currentAfterRender']['height'] >= 44 for n in navigation.values())
        if int(version) >= 345:
            log = z.read('production-ui-chromium.log').decode() + z.read('production-ui-cross.log').decode()
            assert all(f'COSMOS_REWARD_PASS {e} 34044337 0.811172 ATOM' in log for e in engines)
            result['cosmos'] = {'result': 'PASS', 'engines': list(engines), 'height': '34044337', 'quantityExact': '0.811172'}
        result.update(origin=core['base'], exactResponses=len(expected), coreGroups=len(core['checks']), axeScans=len(core['scans']),
                      verifiedCoreReportSHA256=digest(core_bytes), loading=loading, navigation={e:n['result'] for e,n in navigation.items()})
    else:
        raise ValueError(kind)

print(json.dumps(result, indent=2))
