"""Read-only attribution scope audit of the pinned, restored v316 Pages payload."""
import argparse,hashlib,json,re,subprocess
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

root=Path(__file__).resolve().parent
args=argparse.ArgumentParser()
args.add_argument('--release-dir',type=Path,default=root.parent/'release316')
release=args.parse_args().release_dir.resolve()
site=release/'restored-v0/restored-site'
manifest=json.loads((release/'restored-v0/manifest.json').read_text())
git=json.loads((release/'product-tree.json').read_text())
baseline=json.loads((root/'source-evidence.json').read_text())['lastAudit']['baseline']
by_path={e['path']:e for e in git['tree'] if e['type']=='blob'}
sha=lambda b:hashlib.sha256(b).hexdigest()
files=[]
for item in manifest['pages']['files']:
    path=item['name'].removeprefix('./');raw=(site/path).read_bytes()
    assert len(raw)==item['bytes'] and sha(raw)==item['sha256']
    blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
    assert blob==by_path[path]['sha'],path
    files.append({'path':path,'bytes':len(raw),'sha256':sha(raw),'gitBlob':blob,'sinceLastAudit':'unchanged' if baseline.get(path)==blob else 'changed' if path in baseline else 'added'})
assert len(files)==154
js=[{'path':f['path'],'source':(site/f['path']).read_text()} for f in files if f['path'].endswith('.js')]
parser="""const {SourceTextModule}=require('node:vm');let text='';process.stdin.on('data',s=>text+=s);process.stdin.on('end',()=>{const result=JSON.parse(text).map(f=>({path:f.path,imports:[...new SourceTextModule(f.source,{identifier:f.path}).dependencySpecifiers]}));process.stdout.write(JSON.stringify(result));});"""
parsed=subprocess.run(['node','--experimental-vm-modules','-e',parser],input=json.dumps(js),text=True,capture_output=True,check=True)
modules=json.loads(parsed.stdout)
def resolve(caller,spec):
    assert spec.startswith('./') or spec.startswith('../'),(caller,spec)
    dest=(site/caller).parent/spec
    assert dest.resolve().is_relative_to(site.resolve()) and dest.is_file(),(caller,spec)
    return str(dest.resolve().relative_to(site.resolve()))
for m in modules:m['resolvedImports']=[resolve(m['path'],s) for s in m['imports']]
dynamic=[];workers=[];injection=[];execution=[]
for f in js:
    for m in re.finditer(r'\bimport\s*\(\s*([^)]*)\)',f['source']):
        arg=m[1].strip();literal=re.fullmatch(r"(['\"])(.+)\1",arg)
        assert literal,('non-literal dynamic import',f['path'],arg)
        dynamic.append({'path':f['path'],'specifier':literal[2],'resolved':resolve(f['path'],literal[2])})
    for m in re.finditer(r"new\s+Worker\s*\(new\s+URL\(\s*(['\"])([^'\"]+)\1",f['source']):workers.append({'path':f['path'],'specifier':m[2],'resolved':resolve(f['path'],m[2])})
    for m in re.finditer(r"createElement\(\s*(['\"])(script|link|iframe)\1\s*\)",f['source']):injection.append({'path':f['path'],'element':m[2],'line':f['source'].count('\n',0,m.start())+1})
    for m in re.finditer(r'\b(?:eval\s*\(|new\s+Function\s*\(|importScripts\s*\()',f['source']):execution.append({'path':f['path'],'line':f['source'].count('\n',0,m.start())+1,'token':m[0]})
class Entries(HTMLParser):
    def __init__(self):super().__init__();self.entries=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='script':self.entries.append({'tag':tag,'src':a.get('src'),'type':a.get('type','classic')})
        elif tag=='link':self.entries.append({'tag':tag,'href':a.get('href'),'rel':a.get('rel')})
html=Entries();html.feed((site/'index.html').read_text())
html_source=(site/'index.html').read_text()
inline_svg=[{'ordinal':i+1,'line':html_source.count('\n',0,m.start())+1,'sha256':sha(m[0].encode()),'openingTag':m[0].split('>')[0]+'>'} for i,m in enumerate(re.finditer(r'<svg\b[^>]*>.*?</svg>',html_source,re.S))]
css=(site/'styles.css').read_text()
fonts={'shippedFontFiles':[f['path'] for f in files if re.search(r'\.(woff2?|ttf|otf|eot)$',f['path'])], 'fontFaceRules':len(re.findall(r'@font-face\b',css,re.I)),'cssImports':re.findall(r'@import[^;]+;',css),'cssURLs':re.findall(r'url\([^)]*\)',css),'fontFamilies':sorted(set(re.findall(r'font-family\s*:\s*([^;}]+)',css)))}
assert not fonts['shippedFontFiles'] and not fonts['fontFaceRules'] and not fonts['cssImports'] and not fonts['cssURLs']
sw=(site/'sw.js').read_text();assets=json.loads(re.search(r'const ASSETS=(\[[^\n]+\]);',sw)[1].replace("'",'"'))
assert len(assets)==154 and all((site/('index.html' if a=='./' else a.removeprefix('./'))).is_file() for a in assets)
symbols=[]
for f in js:
    if '<svg' in f['source'] or '<path' in f['source']:symbols.append(f['path'])
result={'schema':1,'result':'INVENTORY_VERIFIED_PROVENANCE_OPEN','main':'82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69','tree':'11429de9e06d9d014875af624cb80bafafb38f20','physicalFiles':len(files),'javascriptFiles':len(js),'deltaCounts':dict(Counter(f['sinceLastAudit'] for f in files)),'files':files,'htmlEntryPoints':html.entries,'inlineSVGBlocks':inline_svg,'modules':modules,'dynamicImports':dynamic,'moduleWorkers':workers,'scriptLinkFrameCreation':injection,'additionalExecutionSinks':execution,'fonts':fonts,'precacheAliases':len(assets),'embeddedSVGModules':symbols,'distributedNoticeFiles':[f['path'] for f in files if re.search('licen[cs]e|notice|copying|third.party',f['path'],re.I)],'boundaries':['Module parsing without execution; static and literal dynamic dependency checks, no new network trace or CI.','No runtime package dependencies according to reused root/worker manifests; test dependencies excluded.','No author provenance inferred solely from absence of package imports, repository copyright, simple geometric matches or file history.','Provider/API response rights and real OAuth/provider branding verification remain separately bounded; no external datasets bundled.']}
(root/'runtime-inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ['result','physicalFiles','javascriptFiles','deltaCounts','htmlEntryPoints','dynamicImports','moduleWorkers','scriptLinkFrameCreation','additionalExecutionSinks','fonts','embeddedSVGModules','distributedNoticeFiles']},ensure_ascii=False))
