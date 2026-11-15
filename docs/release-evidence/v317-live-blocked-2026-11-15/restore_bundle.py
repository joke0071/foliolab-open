import pathlib,json,hashlib,tarfile,zipfile,sys,io,gzip,base64
root=pathlib.Path('release317');identity=json.loads((root/'package-identity.json').read_text());p=pathlib.Path(sys.argv[1]);b=p.read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest()
assert len(b)==identity['bytes'] and sha(b)==identity['sha256']
assert b==pathlib.Path(identity['file_name']).read_bytes()
dest=root/'independent-pinned-restore';dest.mkdir(exist_ok=False)
with tarfile.open(fileobj=io.BytesIO(b)) as t:t.extractall(dest,filter='data')
manifest=json.loads((dest/'MANIFEST.json').read_text())
for e in manifest:
 q=dest/e['path'];d=q.read_bytes();assert len(d)==e['bytes'] and sha(d)==e['sha256']
assert {str(q.relative_to(dest)) for q in dest.rglob('*') if q.is_file()}=={e['path'] for e in manifest}|{'MANIFEST.json'}
records=[];zip_counts=[]
def restore_zip(q,out,label):
 with zipfile.ZipFile(q) as z:
  assert z.testzip() is None
  for info in z.infolist():
   n=pathlib.PurePosixPath(info.filename);assert not n.is_absolute() and '..' not in n.parts and '\\' not in str(n)
   assert (info.external_attr>>16)&0o170000 != 0o120000
  z.extractall(out)
  count=0
  for info in z.infolist():
   if info.is_dir():continue
   q2=out/info.filename;d=q2.read_bytes();assert d==z.read(info.filename);count+=1
   records.append(dict(path=str(q2.relative_to(dest)),bytes=len(d),sha256=sha(d),original=label))
  zip_counts.append(dict(original=label,files=count))
  for info in z.infolist():
   if info.filename.endswith('.zip'):
    restore_zip(out/info.filename,out/(info.filename+'.restored'),label+'!'+info.filename)
   if info.filename.endswith('.tar'):
    target=out/(info.filename+'.restored');target.mkdir(exist_ok=True)
    with tarfile.open(out/info.filename) as t:
     t.extractall(target,filter='data')
     for ti in t.getmembers():
      if not ti.isfile():continue
      d=(target/ti.name).read_bytes();assert d==t.extractfile(ti).read()
      records.append(dict(path=str((target/ti.name).relative_to(dest)),bytes=len(d),sha256=sha(d),original=label+'!'+info.filename))
original_zips=sorted(dest.glob('artifacts/*.zip'))+sorted(dest.glob('*-original.zip'))
assert len(original_zips)==identity['originalZipCount'],(len(original_zips),identity)
for q in original_zips:restore_zip(q,dest/'restored-originals'/q.stem,str(q.relative_to(dest)))
full=json.dumps(records,indent=2).encode();gz=gzip.compress(full,mtime=0)
(root/'full-restore-manifest.json.gz.b64').write_text(base64.b64encode(gz).decode()+'\n')
result=dict(result='PASS',package=identity,pinnedReadbackByteEqual='release317-library-readback' in p.parts,manifestFilesVerified=len(manifest),originalZipCount=len(original_zips),zipRestores=zip_counts,restoredOriginalAndNestedFiles=len(records),fullRestoreManifest=dict(bytes=len(full),sha256=sha(full),gzipBytes=len(gz),gzipSha256=sha(gz)),productionAcceptance=False)
(root/'bundle-readback-restore.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
