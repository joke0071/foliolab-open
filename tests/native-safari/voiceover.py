"""Observe real VoiceOver phrases on an isolated synthetic Safari page."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from threading import Thread,Event
import json,platform,subprocess as sp,time

labels={'skip':'Direkt zum Inhalt','positions':'Positionen','bookings':'Buchungen'}
events={k:Event() for k in labels}
focus={}
current=''
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        if path.startswith('/app/'):path=path[4:]
        return super().translate_path(path)
    def do_GET(self):
        if self.path!='/target':return super().do_GET()
        self.send_response(200);self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(current.encode())
    def do_POST(self):
        length=int(self.headers.get('Content-Length','0'))
        if self.path!='/observed' or not 0<length<1024:self.send_error(400);return
        data=json.loads(self.rfile.read(length));name=data['name']
        self.send_response(204);self.end_headers()
        if name in events:focus[name]=data;events[name].set()
def run(args,timeout=15):
    result=sp.run(args,timeout=timeout,capture_output=True,text=True)
    return result.stdout.strip()
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
Thread(target=server.serve_forever,daemon=True).start()
report={'productHead':'c3d6204f6e18acbd58b4be4ecd78a1dfee59dd94','system':platform.mac_ver()[0],'observations':[]}
key=lambda op:run(['/tmp/foliolab-voice-keys',op])
try:
    sp.run(['swiftc','tests/native-safari/voice-keys.swift','-o','/tmp/foliolab-voice-keys'],check=True,timeout=60)
    report['initial']=key('state')
    if report['initial']!='voiceOverEnabled=true':
        key('start');time.sleep(3)
        if key('state')!='voiceOverEnabled=true':key('welcome');time.sleep(3)
    report['active']=key('state')
    if report['active']!='voiceOverEnabled=true':raise RuntimeError('No active system VoiceOver session')
    run(['open','-a','Safari','http://127.0.0.1:'+str(server.server_port)+'/tests/native-safari/voiceover-focus.html'])
    for name,label in labels.items():
        current=name
        if not events[name].wait(35):raise RuntimeError('No native DOM focus for '+name)
        time.sleep(2)
        sample={'focus':focus[name],'spoken':None}
        for describe in (False,True):
            # This VM starts with synthetic content only. Clear the test clipboard before the documented copy-phrase command.
            sp.run(['pbcopy'],input=b'',check=True)
            if describe:key('describe');time.sleep(1.5)
            key('copy');time.sleep(.5)
            phrase=run(['pbpaste'])
            if label.casefold() in phrase.casefold():
                sample['spoken']=phrase[:180];break
            sample['otherPhrasePresent']=bool(phrase)
        report['observations'].append(sample)
    report['spokenSequence']='PASS' if all(o['spoken'] and o['focus']['focused'] for o in report['observations']) else 'NO_CONFIRMED_SEQUENCE'
except Exception as ex:report['error']=repr(ex)
finally:
    server.shutdown()
    p=Path('artifacts/native-safari/report.json');p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(p.read_text())
if report.get('spokenSequence')!='PASS':raise SystemExit(1)
