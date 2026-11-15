import pathlib,json,hashlib,zipfile,tarfile,shutil
root=pathlib.Path('release317'); stage=root/'package'
if stage.exists():shutil.rmtree(stage)
stage.mkdir()
sha=lambda b:hashlib.sha256(b).hexdigest()
rows=[]
for a in json.loads((root/'artifact-identities.json').read_text()):
 p=root/'artifacts'/f"v317-{a['id']}.zip"; b=p.read_bytes()
 assert len(b)==a['size_in_bytes'] and 'sha256:'+sha(b)==a['digest']
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  for n in z.namelist():
   assert not pathlib.PurePosixPath(n).is_absolute() and '..' not in pathlib.PurePosixPath(n).parts
   if n.endswith('.json'):json.loads(z.read(n))
  rows.append(dict(id=a['id'],bytes=len(b),sha256=sha(b),members=len(z.namelist()),json=sum(n.endswith('.json') for n in z.namelist()),png=sum(n.endswith('.png') for n in z.namelist())))
extra_zips=json.loads((root/'diagnostic-zip-identities.json').read_text())
for name,expected in extra_zips.items():
 p=root/name; assert sha(p.read_bytes())==expected
 with zipfile.ZipFile(p) as z:assert z.testzip() is None
(root/'original-integrity.json').write_text(json.dumps(rows,indent=2)+'\n')
# Preserve originals, contracts, logs, exact sources and bounded diagnoses. Exclude signed transfers and prior v316 archive.
files=list((root/'artifacts').glob('*.zip'))+list((root/'source').rglob('*'))
files += [p for p in root.iterdir() if p.is_file() and p.suffix in ['.json','.log','.mjs','.yml','.md'] and not p.name.startswith('download-batch') and p.name not in ['package-identity.json','library-upload-result.json','library-readback-transfer.json','bundle-readback-restore.json']]
files += [root/n for n in extra_zips]
for p in sorted(set(files)):
 if not p.is_file():continue
 dest=stage/p.relative_to(root);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
manifest=[dict(path=str(p.relative_to(stage)),bytes=p.stat().st_size,sha256=sha(p.read_bytes())) for p in sorted(stage.rglob('*')) if p.is_file()]
(stage/'MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
out=pathlib.Path('FolioLab_v317_Release_Blocker_Originalbelege_2026-11-15.tar')
with tarfile.open(out,'w') as t:
 for p in sorted(stage.rglob('*')):
  if p.is_file():t.add(p,arcname=str(p.relative_to(stage)),recursive=False)
identity=dict(file_name=out.name,bytes=out.stat().st_size,sha256=sha(out.read_bytes()),manifestFiles=len(manifest),originalZipCount=len(rows)+len(extra_zips),status='DEPLOYED_LIVE_BLOCKED')
(root/'package-identity.json').write_text(json.dumps(identity,indent=2)+'\n');print(json.dumps(identity));print(json.dumps(rows))
