"""Observe a synthetic Chromium export on a separate normal Safari installation."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Event, Thread
import json, os, platform, subprocess as sp, time

events={key:Event() for key in ('restore','reopen','focus')}
observations={}
report={'productHead':'c3d6204f6e18acbd58b4be4ecd78a1dfee59dd94','system':platform.mac_ver()[0],
        'image':os.environ.get('ImageVersion'),'driver':'normal Safari via LaunchServices',
        'source':'Linux Chromium genuine password-protected UI download; synthetic portfolio only'}
class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        size=int(self.headers.get('Content-Length','0'))
        if self.path!='/result' or not 0<size<=4096:
            self.send_error(400);return
        data=json.loads(self.rfile.read(size))
        if data.get('step') not in events:
            self.send_error(400);return
        stage=data['step']
        self.send_response(204);self.end_headers()
        if not events[stage].is_set():
            observations[stage]=data
            events[stage].set()
def run(args,timeout=10):
    try:
        v=sp.run(args,capture_output=True,text=True,timeout=timeout)
        return {'code':v.returncode,'text':(v.stdout+v.stderr).strip()[:350]}
    except (OSError,sp.TimeoutExpired) as ex:return {'code':None,'text':str(ex)[:350]}
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)
def page(stage):
    opener=run(['open','-a','Safari',base+'/tests/native-safari/cross-restore.html?step='+stage])
    if opener['code']!=0 or not events[stage].wait(65):raise RuntimeError(stage+' missing')
    data=observations[stage]
    if data.get('error'):raise RuntimeError(stage+' '+data['error'])
    return data
try:
    a=page('restore')
    assert a['revisionBefore']==1 and a['revision']==2 and a['dialogs']==['password','replace']
    report['processBefore']=run(['pgrep','-x','Safari'])
    run(['pkill','-TERM','-x','Safari'])
    for i in range(40):
        if run(['pgrep','-x','Safari'])['code']==1:break
        time.sleep(.25)
    else:raise RuntimeError('Safari did not exit')
    report['observedExit']=True
    b=page('reopen')
    report['processAfter']=run(['pgrep','-x','Safari'])
    for field in ('dataSHA256','rawSHA256','revision'):assert a[field]==b[field]
    assert b['cash']=='22.34' and b['journals']==b['bookings']==b['historySessions']==1
    report['crossHostRecovery']='PASS'
    report['keyboard']=run(['swift','tests/native-safari/press-return.swift'],timeout=35)
    if report['keyboard']['code']==0:events['focus'].wait(5)
    report['voiceOverLaunch']=run(['open','-a','/System/Library/CoreServices/VoiceOver.app'])
    time.sleep(2)
    report['actualVoiceOverPhrase']=run(['osascript','-e','tell application "VoiceOver" to get content of last phrase'],timeout=5)
except Exception as ex:report['error']=repr(ex)
finally:
    server.shutdown()
    report['observations']=observations
    out=Path('artifacts/native-safari/report.json');out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))
if report.get('crossHostRecovery')!='PASS':raise SystemExit(1)
