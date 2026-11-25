import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control',os.getenv('LOCAL_RELEASE_CACHE_CONTROL','max-age=600'))
        super().end_headers()

    def send_head(self):
        if 'If-Modified-Since' in self.headers:
            del self.headers['If-Modified-Since']
        return super().send_head()

port = int(sys.argv[1])
with ThreadingHTTPServer(('127.0.0.1',port),partial(Handler,directory=f'sw347-transition-serving-{port}')) as server:
    server.serve_forever()
