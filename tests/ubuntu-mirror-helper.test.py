import os
from pathlib import Path
import subprocess
import tempfile
import unittest

HELPER = Path(__file__).resolve().parents[1] / 'tools/select-ubuntu-mirror.sh'

class MirrorSelection(unittest.TestCase):
    def run_helper(self, mode, success='', invalid='', codename='noble', missing_pocket=''):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            mock = root / 'curl'
            mock.write_text('''#!/usr/bin/env python3
import os,sys
from pathlib import Path
from urllib.parse import urlsplit
a=sys.argv[1:]; url=a[-1]
for flag,value in [('--proto','=https'),('--connect-timeout','10'),('--max-time','15'),('--retry','0')]:
 assert a[a.index(flag)+1]==value,(flag,a)
assert all(flag in a for flag in ['--fail','--silent','--show-error','--output'])
assert not any(flag in a for flag in ['--insecure','-k','--location','-L'])
assert url.startswith('https://')
with open(os.environ['CALLS'],'a') as f:f.write(url+'\\n')
target=urlsplit(url)
pocket=target.path.split('/')[-2]
if target.hostname in os.environ['SUCCESS'].split(',') and pocket != os.environ['MISSING_POCKET']:
 body='-----BEGIN PGP SIGNED MESSAGE-----\\nSuite: '+pocket+'\\n'
 Path(a[a.index('--output')+1]).write_text('HTML' if os.environ['INVALID'] else body)
 sys.exit(0)
sys.exit(6)
''')
            mock.chmod(0o755)
            calls = root / 'calls'
            env = dict(os.environ, PATH=str(root)+os.pathsep+os.environ['PATH'],
                       SUCCESS=success, INVALID=invalid, CALLS=str(calls), MISSING_POCKET=missing_pocket)
            result = subprocess.run(['bash', str(HELPER), mode, codename], env=env,
                                    text=True, capture_output=True, timeout=5)
            return result, calls.read_text().splitlines() if calls.exists() else []

    def test_reachable_archives_remain_available_in_preference_order(self):
        result,calls=self.run_helper('archive','archive.ubuntu.com,mirrors.edge.kernel.org')
        self.assertEqual(result.returncode,0)
        self.assertEqual(result.stdout,
                         'https://archive.ubuntu.com/ubuntu/\tpriority:1\n'
                         'https://mirrors.edge.kernel.org/ubuntu/\tpriority:2\n')
        self.assertIn('https://archive.ubuntu.com/ubuntu/dists/noble-updates/InRelease',calls)

    def test_archive_falls_back_to_regional_if_primary_and_independent_hosts_fail(self):
        result,calls=self.run_helper('archive','us.archive.ubuntu.com')
        self.assertEqual(result.returncode,0)
        self.assertEqual(result.stdout,'https://us.archive.ubuntu.com/ubuntu/\tpriority:3\n')
        self.assertCountEqual(calls,[
            'https://archive.ubuntu.com/ubuntu/dists/noble/InRelease',
            'https://mirrors.edge.kernel.org/ubuntu/dists/noble/InRelease',
            'https://us.archive.ubuntu.com/ubuntu/dists/noble/InRelease',
            'https://us.archive.ubuntu.com/ubuntu/dists/noble-updates/InRelease',
            'https://mirror.math.princeton.edu/pub/ubuntu/dists/noble/InRelease',
        ])

    def test_security_uses_security_pocket(self):
        result,calls=self.run_helper('security','us.archive.ubuntu.com')
        self.assertEqual(result.returncode,0)
        self.assertEqual(result.stdout,'https://us.archive.ubuntu.com/ubuntu/\tpriority:3\n')
        self.assertEqual(len(calls),5)
        self.assertTrue(all(url.endswith('/dists/noble-security/InRelease') for url in calls))

    def test_all_fail_without_selected_url(self):
        result,calls=self.run_helper('archive')
        self.assertEqual(result.returncode,1)
        self.assertEqual(result.stdout,'')
        self.assertEqual(len(calls),4)

    def test_only_adds_archives_with_updates_and_retains_an_independent_fallback(self):
        result,calls=self.run_helper('archive','archive.ubuntu.com',missing_pocket='noble-updates')
        self.assertEqual(result.returncode,1)
        self.assertEqual(result.stdout,'')
        self.assertIn('https://archive.ubuntu.com/ubuntu/dists/noble-updates/InRelease',calls)
        for mode,priority in [('archive',4),('security',5)]:
            result,_=self.run_helper(mode,'mirror.math.princeton.edu')
            self.assertEqual(result.returncode,0)
            self.assertEqual(result.stdout,f'https://mirror.math.princeton.edu/pub/ubuntu/\tpriority:{priority}\n')

    def test_html_is_not_an_inrelease(self):
        result,calls=self.run_helper('archive','archive.ubuntu.com','yes')
        self.assertEqual(result.returncode,1)
        self.assertEqual(result.stdout,'')

    def test_invalid_inputs_never_use_network(self):
        for mode,code in [('other','noble'),('archive','noble/../../')]:
            result,calls=self.run_helper(mode,codename=code)
            self.assertEqual(result.returncode,2)
            self.assertEqual(calls,[])

if __name__=='__main__':unittest.main()
