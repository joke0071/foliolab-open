import pathlib,json,hashlib,tarfile,zipfile,sys,gzip,base64
archive=pathlib.Path(sys.argv[1]);original=pathlib.Path(sys.argv[2]);out=pathlib.Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=False)
sha=lambda b:hashlib.sha256(b).hexdigest()
assert archive.stat().st_ino!=original.stat().st_ino
assert archive.read_bytes()==original.read_bytes()
def safe(n):
 p=pathlib.PurePosixPath(n);assert not p.is_absolute()and'..'not in p.parts and'\\'not in n
with tarfile.open(archive)as t:
 for m in t.getmembers():safe(m.name);assert m.isfile()
 t.extractall(out,filter='data')
manifest=json.loads((out/'MANIFEST.json').read_text());restored=[]
for a in manifest:
 p=out/a['path'];b=p.read_bytes();assert len(b)==a['bytes']and sha(b)==a['sha256'];restored.append(a)
originals=[]
for p in sorted((out/'artifacts').glob('*.zip')):
 with zipfile.ZipFile(p)as z:
  assert z.testzip()is None;assert len(z.namelist())==len(set(z.namelist()))
  dest=out/'restored-originals'/p.stem
  for i in z.infolist():
   safe(i.filename);assert(i.external_attr>>16)&0o170000!=0o120000
   z.extract(i,dest)
   if i.is_dir():continue
   b=(dest/i.filename).read_bytes();assert b==z.read(i.filename)
   originals.append({'archive':p.name,'path':i.filename,'bytes':len(b),'sha256':sha(b)})
full={'manifestFiles':restored,'originalFiles':originals};raw=(json.dumps(full,indent=2)+'\n').encode();(out.parent/'full-restore-manifest.json.gz.b64').write_text(base64.b64encode(gzip.compress(raw,mtime=0)).decode()+'\n')
receipt={'result':'PINNED_BYTE_EQUAL_PHYSICAL_RESTORE_PASS','archive':archive.name,'bytes':archive.stat().st_size,'sha256':sha(archive.read_bytes()),'distinctInode':True,'manifestFiles':len(restored),'originalZips':len(list((out/'artifacts').glob('*.zip'))),'originalFiles':len(originals),'fullManifestBytes':len(raw),'fullManifestSHA256':sha(raw)}
(out.parent/'pinned-restore.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
