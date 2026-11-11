import os
from pathlib import Path
import subprocess
import tempfile
import unittest

HELPER = Path(__file__).resolve().parents[1] / 'tools/select-ubuntu-mirror.sh'

class MirrorSelection(unittest.TestCase):
    def run_helper(self, mode, success='', invalid='', codename='noble'):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            mock = root / 'curl'
            mock.write_text('''#!/usr/bin/env python3
import os,sys
from pathlib import Path
a=sys.argv[1:]; url=a[-1]
with open(os.environ['CALLS'],'a') as f:f.write(url+'\\n')
if os.environ['SUCCESS'] and os.environ['SUCCESS'] in url:
 Path(a[a.index('--output')+1]).write_text('HTML' if os.environ['INVALID'] else '-----BEGIN PGP SIGNED MESSAGE-----\\n')
 sys.exit(0)
sys.exit(6)
''')
            mock.chmod(0o755)
            calls = root / 'calls'
            env = dict(os.environ, PATH=str(root)+os.pathsep+os.environ['PATH'],
                       SUCCESS=success, INVALID=invalid, CALLS=str(calls))
            result = subprocess.run(['bash', str(HELPER), mode, codename], env=env,
                                    text=True, capture_output=True, timeout=5)
            return result, calls.read_text().splitlines() if calls.exists() else []

    def test_primary(self):
        result,calls=self.run_helper('archive','archive.ubuntu.com')
        self.assertEqual(result.returncode,0)
        self.assertEqual(result.stdout,'https://archive.ubuntu.com/ubuntu/\n')
        self.assertEqual(len(calls),1)

    def test_dns_failure_selects_regional(self):
        result,calls=self.run_helper('archive','us.archive.ubuntu.com')
        self.assertEqual(result.returncode,0)
        self.assertEqual(result.stdout,'https://us.archive.ubuntu.com/ubuntu/\n')
        self.assertEqual(len(calls),2)

    def test_security_uses_security_pocket(self):
        result,calls=self.run_helper('security','us.archive.ubuntu.com')
        self.assertEqual(result.returncode,0)
        self.assertEqual(len(calls),3)
        self.assertTrue(all(url.endswith('/dists/noble-security/InRelease') for url in calls))

    def test_all_fail_without_selected_url(self):
        result,calls=self.run_helper('archive')
        self.assertEqual(result.returncode,1)
        self.assertEqual(result.stdout,'')
        self.assertEqual(len(calls),2)

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
