"""One disposable macOS project runner, one loopback origin, synthetic data only."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Event, Thread
from urllib import request, error
import json, os, platform, subprocess, time

results = {}
events = {name:Event() for name in ('seed','reopen')}
report = {'productHead': 'c3d6204f6e18acbd58b4be4ecd78a1dfee59dd94',
          'system': platform.mac_ver()[0], 'image':os.getenv('ImageVersion'),
          'scope':'Fresh project VM. First-party ordinary Safari relaunch and native WebDriver UI tested independently.'}
def command(args, timeout=15):
    try:
        ret = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        return {'exit':ret.returncode, 'stdout':ret.stdout.strip()[:700], 'stderr':ret.stderr.strip()[:700]}
    except (OSError, subprocess.TimeoutExpired) as ex:
        return {'exit':None,'error':str(ex)[:700]}
class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        size = int(self.headers.get('Content-Length','0'))
        if self.path != '/result' or not 1 <= size <= 4096:
            self.send_error(400);return
        row = json.loads(self.rfile.read(size))
        if row.get('step') not in events:
            self.send_error(400);return
        results[row['step']] = row
        self.send_response(204);self.end_headers()
        events[row['step']].set()
server = ThreadingHTTPServer(('127.0.0.1',0),Handler)
Thread(target=server.serve_forever,daemon=True).start()
base = 'http://127.0.0.1:'+str(server.server_port)
def ordinary(step):
    result=command(['open','-a','Safari',base+'/tests/native-safari/session.html?step='+step])
    if result['exit']!=0 or not events[step].wait(40):
        raise RuntimeError('No ordinary Safari '+step+' report: '+json.dumps(result))
    return results[step]
def req(method, path, data=None):
    payload = None if data is None else json.dumps(data).encode()
    call=request.Request('http://127.0.0.1:4544'+path,data=payload,method=method,headers={'Content-Type':'application/json'})
    try:
        with request.urlopen(call,timeout=18) as reply:return json.load(reply).get('value')
    except error.HTTPError as ex:
        raise RuntimeError(ex.read().decode()[:800]) from ex

try:
    report['ordinarySeed']=first=ordinary('seed')
    report['processBefore']=command(['pgrep','-x','Safari'])
    if first.get('revision')!=2 or not first.get('marker'):raise RuntimeError('Unexpected fresh Safari record')
    command(['pkill','-TERM','-x','Safari'])
    for i in range(30):
        if command(['pgrep','-x','Safari'])['exit']==1:break
        time.sleep(.25)
    else:raise RuntimeError('Native Safari process did not exit')
    report['processExitObserved']=True
    report['ordinaryReopen']=second=ordinary('reopen')
    report['processAfter']=command(['pgrep','-x','Safari'])
    if not second.get('marker') or any(first[k]!=second[k] for k in ('hash','revision','browser')):raise RuntimeError('Different Safari record after relaunch')
    report['firstPartyRelaunch']='PASS'
except Exception as ex:report['firstPartyError']=str(ex)
driver=None
session=None
try:
    report['safariVersion']=command(['/usr/bin/safaridriver','--version'])
    report['driverEnable']=command(['sudo','-n','/usr/bin/safaridriver','--enable'])
    driver=subprocess.Popen(['/usr/bin/safaridriver','-p','4544'])
    for i in range(40):
        try:req('GET','/status');break
        except OSError:time.sleep(.25)
    info=req('POST','/session',{'capabilities':{'alwaysMatch':{'browserName':'Safari'}}})
    session='/session/'+info['sessionId']
    report['nativeBrowser']=info['capabilities'].get('browserVersion')
    req('POST',session+'/url',{'url':base+'/index.html'})
    def js(script):
        return req('POST',session+'/execute/sync',{'script':script,'args':[]})
    for i in range(60):
        if js("return document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv')"):break
        time.sleep(.25)
    else:raise RuntimeError('Actual product UI did not initialize')
    skip=req('POST',session+'/element',{'using':'css selector','value':'.skip-to-content'})
    ident=skip['element-6066-11e4-a52e-4f735466cecf']
    report['skipTarget']=js("const el=document.querySelector('.skip-to-content');el.focus();return [el.textContent,el.hash,document.activeElement===el];")
    req('POST',session+'/element/'+ident+'/value',{'text':'\ue007','value':['\ue007']})
    report['focusAfterEnter']=js("return {hash:location.hash,id:document.activeElement.id,heading:document.querySelector('h1').textContent};")
    if report['focusAfterEnter']['id']!='mainContent':raise RuntimeError('Focus did not enter main content')
    report['nativeSafariSkipLink']='PASS'
    voiceapp='/System/Library/CoreServices/VoiceOver.app'
    report['voiceOverLaunch']=command(['open','-a',voiceapp])
    time.sleep(2)
    phrases=[]
    for selector in ('.skip-to-content','#mainContent'):
        js('document.querySelector('+json.dumps(selector)+').focus();')
        time.sleep(1)
        phrases.append(command(['osascript','-e','tell application "VoiceOver" to get content of last phrase'],timeout=4))
        if phrases[-1]["exit"] != 0:break
    report['voiceOverPhraseProbe']=phrases
except Exception as ex:report['nativeUIError']=str(ex)
finally:
    if session:
        try:req('DELETE',session)
        except Exception:pass
    if driver is not None:driver.terminate()
    server.shutdown()
    path=Path('artifacts/native-safari/report.json');path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))
if report.get('firstPartyRelaunch')!='PASS' or report.get('nativeSafariSkipLink')!='PASS':raise SystemExit(1)
