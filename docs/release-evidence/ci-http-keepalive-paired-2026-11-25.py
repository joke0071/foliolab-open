"""Paired trial of CI's current HTTP server against the same handler using HTTP/1.1."""
import contextlib,functools,http.server,json,os,pathlib,subprocess,sys,threading,time,hashlib,statistics,urllib.request
root=pathlib.Path(sys.argv[1]).resolve(); path=pathlib.Path(sys.argv[2])
suites=['tests/browser-cosmos-reward.mjs','tests/browser-fractional-settlement.mjs']
class PersistentHandler(http.server.SimpleHTTPRequestHandler):
 protocol_version='HTTP/1.1'
 disable_nagle_algorithm=True
class PersistentServer(http.server.ThreadingHTTPServer):
 request_queue_size=128
def run(v,k):
 server_type,handler=(http.server.ThreadingHTTPServer,http.server.SimpleHTTPRequestHandler) if v=='A' else (PersistentServer,PersistentHandler)
 srv=server_type(('127.0.0.1',4311),functools.partial(handler,directory=str(root)))
 threading.Thread(target=srv.serve_forever,daemon=True).start()
 try:
  with urllib.request.urlopen('http://127.0.0.1:4311/src/transactions.js') as r:
   assert hashlib.sha256(r.read()).digest()==hashlib.sha256((root/'src/transactions.js').read_bytes()).digest()
   protocol=r.version;last=r.headers['Last-Modified']
  req=urllib.request.Request('http://127.0.0.1:4311/src/transactions.js',headers={'If-Modified-Since':last})
  try:urllib.request.urlopen(req)
  except urllib.error.HTTPError as e:assert e.code==304
  else:raise AssertionError('conditional GET')
  result={'variant':v,'order':k,'protocol':protocol,'checks':[]}
  for suite in suites:
   start=time.monotonic()
   cmd=subprocess.run(['node',suite],cwd=root,env={**os.environ,'UI_QUALITY_BASE':'http://127.0.0.1:4311/','UI_QUALITY_ENGINES':'chromium'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=100)
   if cmd.returncode:raise RuntimeError(cmd.stdout[-1000:])
   result['checks'].append({'suite':suite,'seconds':round(time.monotonic()-start,3),'output':cmd.stdout.strip()})
  return result
 finally:srv.shutdown();srv.server_close()
out=[]
for k,v in enumerate('ABBABAAB',1):
 out.append(run(v,k));path.write_text(json.dumps(out,indent=2)+'\n')
