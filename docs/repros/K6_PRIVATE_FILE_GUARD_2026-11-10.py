import json, subprocess
from pathlib import Path

paths = json.loads(Path('tracked-paths.json').read_text())
blocked = ['account.csv', 'imports/ledger.csv', 'nested/flatex.tsv', 'depot.xlsx', 'originals/statement.json', 'private/data.json', 'nested/backups/data.json', 'exports/state.json', 'backup.json', 'FolioLab-Backup-2026.json', 'FolioLab_BACKUP.json', 'restore.json.enc', 'state.encrypted.json', 'a.zip', 'nested/a.tar.xz', 'a.tar.gz', 'a.tgz', 'a.7z', 'a.rar', 'a.bz2', 'a.db', 'a.sqlite', 'a.sqlite3', 'a.bak', '.env', '.env.local', 'key.pem', 'node_modules/a.js', 'local.xls', 'local.ods']
allowed = ['tests/fixtures/flh03/january.csv', 'tests/fixtures/flh03/overlap.csv', 'docs/perf-evidence/2026-10-31/render-v238/fixture.json.gz', 'tests/fixtures/new-synthetic.mjs', 'src/complete-backup.js', 'docs/release-evidence/new.json', 'README.md', 'index.html', 'icons/icon-192.png']
def ignored(items):
    p = subprocess.run(['git', 'check-ignore', '--no-index', '--stdin'], input='\n'.join(items)+'\n', text=True, capture_output=True)
    assert p.returncode in (0, 1), p.stderr
    return set(p.stdout.splitlines())
assert ignored(blocked) == set(blocked), sorted(set(blocked) - ignored(blocked))
assert not ignored(allowed), sorted(ignored(allowed))
assert not ignored(paths), sorted(ignored(paths))
candidate = Path('.gitignore').read_text()
baseline = candidate.split('\n# Private exports')[0]
try:
    Path('.gitignore').write_text(baseline)
    exposed = set(blocked) - ignored(blocked)
    assert {'account.csv', 'nested/a.tar.xz', 'backup.json', 'private/data.json'} <= exposed
finally:
    Path('.gitignore').write_text(candidate)
print(json.dumps({'blockedCases': len(blocked), 'allowedCases': len(allowed), 'currentMainPaths': len(paths), 'newlyIgnoredTrackedPaths': 0, 'baselineNegativeControlExposedCases': len(exposed), 'status': 'PASS'}))
