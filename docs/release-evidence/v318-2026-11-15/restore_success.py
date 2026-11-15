import pathlib,json,hashlib,tarfile,zipfile,gzip,base64
r=pathlib.Path(__file__).parent
sha=lambda b:hashlib.sha256(b).hexdigest()
i=json.loads((r/'package-identity.json').read_text());pin=json.loads((r/'successful-library-pin.json').read_text())
p=r/'successful-readback'/i['file_name'];original=r.parent/i['file_name'];raw=p.read_bytes()
assert len(raw)==i['bytes']and sha(raw)==i['sha256']and raw==original.read_bytes()
assert p.stat().st_ino!=original.stat().st_ino
out=r/'successful-independent-restore';out.mkdir(exist_ok=False)
with tarfile.open(p)as t:t.extractall(out,filter='data')
m=json.loads((out/'MANIFEST.json').read_text())
assert {str(p.relative_to(out))for p in out.rglob('*')if p.is_file()}=={x['path']for x in m}|{'MANIFEST.json'}
for x in m:
 b=(out/x['path']).read_bytes();assert len(b)==x['bytes']and sha(b)==x['sha256']
records=[];counts=[]
for q in sorted((out/'artifacts').glob('*.zip')):
 with zipfile.ZipFile(q)as z:
  assert z.testzip()is None
  for x in z.infolist():
   n=pathlib.PurePosixPath(x.filename);assert not n.is_absolute()and'..'not in n.parts and'\\'not in x.filename
   assert (x.external_attr>>16)&0o170000!=0o120000
  dest=out/'restored-originals'/q.stem;z.extractall(dest);n=0
  for x in z.infolist():
   if x.is_dir():continue
   f=dest/x.filename;b=f.read_bytes();assert b==z.read(x.filename);n+=1
   records.append({'path':str(f.relative_to(out)),'bytes':len(b),'sha256':sha(b),'originalZIP':q.name})
  counts.append({'zip':q.name,'files':n})
assert len(counts)==i['originalZipCount']==8
site=out/'restored-originals/pages/site';site.mkdir()
with tarfile.open(out/'restored-originals/pages/artifact.tar')as t:
 assert all(x.isfile()or x.isdir()for x in t.getmembers());t.extractall(site,filter='data')
 expected={x['path']:x for x in json.loads((out/'expected-pages-assets.json').read_text())['files']}
 actual={str(f.relative_to(site)):f for f in site.rglob('*')if f.is_file()};assert set(actual)==set(expected)
 for path,f in actual.items():
  b=f.read_bytes();assert len(b)==expected[path]['bytes']and sha(b)==expected[path]['sha256']
  records.append({'path':str(f.relative_to(out)),'bytes':len(b),'sha256':sha(b),'originalZIP':'pages.zip!artifact.tar','gitBlob':expected[path]['gitBlob']})
full=json.dumps(records,indent=2).encode();compressed=gzip.compress(full,mtime=0)
(r/'successful-full-restore-manifest.json.gz.b64').write_text(base64.b64encode(compressed).decode()+'\n')
result={'result':'PASS','package':i,'file_id':pin['file_id'],'library_file_id':pin['library_file_id'],'pinnedVersion':pin['current_version_number'],'independentReadbackByteEqual':True,'distinctFileIdentity':True,'manifestFiles':len(m),'originalZIPs':len(counts),'physicallyRestoredOriginalFiles':sum(x['files']for x in counts),'physicallyRestoredPagesFiles':len(actual),'zipCounts':counts,'fullRestoreManifest':{'bytes':len(full),'sha256':sha(full),'gzipBytes':len(compressed),'gzipSha256':sha(compressed)},'scope':'Evidence archive and deployed files physically restored. Actual portfolio plain/encrypted UI FreshRestore is independently proven in live/report.json. No circular archive self-hash.'}
(r/'successful-pinned-restore.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
