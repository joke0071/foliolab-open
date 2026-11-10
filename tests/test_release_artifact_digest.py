"""Adversarial evidence controls; no browser/product tests are replaced."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec=importlib.util.spec_from_file_location('digest',Path(__file__).parents[1]/'tools/summarize_release_artifacts.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class EvidenceControls(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        self.identity=dict(head='a'*40,tree='b'*40,run=1,attempt=1)
        self.manifest=dict(identity=self.identity,artifacts=[])
        self.write({'result':'PASS','errors':[],'expectedDenied':False})

    def write(self,value):
        report=json.dumps(value).encode()
        with zipfile.ZipFile(self.root/'one.zip','w',compression=zipfile.ZIP_STORED) as z:
            z.writestr('report.json',report)
            z.writestr('image.png',b'not decoded by this tool')
        raw=(self.root/'one.zip').read_bytes()
        self.manifest['artifacts']=[dict(self.identity,id=7,path='one.zip',bytes=len(raw),sha256=module.digest(raw),reports=[dict(path='report.json',sha256=module.digest(report),assertions=[dict(pointer='/result',equals='PASS',kind='outcome'),dict(pointer='/errors',equals=[])])])]

    def run_digest(self):
        return module.summarize(self.manifest,self.root)

    def test_clean_is_never_approval_and_ignores_unasserted_negative_fixture(self):
        r=self.run_digest()
        self.assertEqual(r['disposition'],'REVIEW_REQUIRED')
        self.assertFalse(r['releaseApproval'])
        self.assertEqual(r['counts']['reports'],1)

    def test_missing_report(self):
        self.manifest['artifacts'][0]['reports'][0]['path']='missing.json'
        self.assertIn('missing expected report',str(self.run_digest()['findings']))

    def test_wrong_digest_and_size(self):
        self.manifest['artifacts'][0]['sha256']='0'*64
        self.assertIn('ZIP digest/size mismatch',str(self.run_digest()['findings']))
        self.manifest['artifacts'][0]['sha256']=module.digest((self.root/'one.zip').read_bytes())
        self.manifest['artifacts'][0]['bytes']+=1
        self.assertIn('ZIP digest/size mismatch',str(self.run_digest()['findings']))

    def test_real_failure_and_error_list(self):
        for value in ({'result':'FAIL','errors':[]},{'result':'PASS','errors':['real failure']}):
            self.write(value)
            self.assertEqual(self.run_digest()['disposition'],'FINDINGS')

    def test_unknown_status_and_schema(self):
        self.write({'result':'UNRECOGNIZED','errors':[]})
        self.assertEqual(self.run_digest()['disposition'],'UNKNOWN')
        self.manifest['artifacts'][0]['reports'][0]['assertions']=[]
        self.assertIn('no reviewed outcome adapter',str(self.run_digest()['unknowns']))

    def test_wrong_run_and_empty_contract(self):
        self.manifest['artifacts'][0]['run']=2
        self.assertIn('identity mismatch',str(self.run_digest()['findings']))
        self.manifest['artifacts']=[]
        self.assertEqual(self.run_digest()['disposition'],'FINDINGS')

    def test_crc_corruption_even_if_outer_hash_is_updated(self):
        p=self.root/'one.zip'
        raw=p.read_bytes().replace(b'not decoded by this tool',b'not decoded by this toom')
        p.write_bytes(raw)
        self.manifest['artifacts'][0]['sha256']=module.digest(raw)
        self.assertIn('CRC',str(self.run_digest()['findings']))

    def test_report_digest_and_missing_pointer(self):
        report=self.manifest['artifacts'][0]['reports'][0]
        report['sha256']='0'*64
        report['assertions'][0]['pointer']='/missing'
        result=self.run_digest()
        self.assertIn('report digest mismatch',str(result['findings']))
        self.assertIn('missing/invalid expected field',str(result['findings']))

    def test_duplicate_zip_members_and_path_escape(self):
        self.manifest['artifacts'][0]['path']='../escape.zip'
        self.assertIn('outside ZIP directory',str(self.run_digest()['findings']))
        self.write({'result':'PASS','errors':[]})
        with zipfile.ZipFile(self.root/'one.zip','a') as z:z.writestr('../bad.json','{}')
        raw=(self.root/'one.zip').read_bytes()
        self.manifest['artifacts'][0].update(bytes=len(raw),sha256=module.digest(raw))
        self.assertIn('unsafe ZIP member',str(self.run_digest()['findings']))

    def test_no_original_mutation(self):
        before=(self.root/'one.zip').read_bytes()
        self.run_digest()
        self.assertEqual(before,(self.root/'one.zip').read_bytes())


if __name__=='__main__':unittest.main()
