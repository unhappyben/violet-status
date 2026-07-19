#!/usr/bin/env python3
"""Violet Status server: serves the static PWA and proxies POST /api/notify
to ntfy.sh, so the secret topic never reaches the client and the app works
even on networks that block ntfy.sh.

Secrets live in server-config.json (gitignored), next to this file:
  { "topic": "violet-status-xxxx", "token": "shared-secret-with-client" }

Run:  python3 server.py            (PORT env var, default 8787)
"""
import hmac
import json
import mimetypes
import os
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE = os.path.dirname(os.path.abspath(__file__))
NTFY_SERVER = 'https://ntfy.sh'

with open(os.path.join(BASE, 'server-config.json')) as f:
    SECRETS = json.load(f)

mimetypes.add_type('application/manifest+json', '.webmanifest')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE, **kwargs)

    def do_POST(self):
        if self.path != '/api/notify':
            self.send_error(404)
            return

        token = self.headers.get('X-Token', '')
        if not hmac.compare_digest(token, SECRETS['token']):
            self.send_error(403)
            return

        try:
            length = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > 4096:
            self.send_error(400)
            return

        try:
            data = json.loads(self.rfile.read(length))
            message = str(data.get('message', '')).strip()[:200]
        except (ValueError, AttributeError):
            message = ''
        if not message:
            self.send_error(400)
            return

        req = urllib.request.Request(
            NTFY_SERVER + '/' + SECRETS['topic'],
            data=message.encode('utf-8'),
            headers={'Title': 'Violet update', 'Priority': '4', 'Tags': 'baby'},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                ok = 200 <= res.status < 300
        except Exception:
            ok = False

        body = json.dumps({'ok': ok}).encode()
        self.send_response(200 if ok else 502)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8787'))
    print('violet-status serving on port %d' % port)
    ThreadingHTTPServer(('0.0.0.0', port), Handler).serve_forever()
