"""Run independent preview browsers in pairs; keep every existing regression."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import subprocess
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys

TESTS = [
    'daily_reward_browser.py', 'bigwin_flight_browser.py',
    'preview_motion_browser.py', 'circus_columns_browser.py',
    'park_preview_browser.py', 'park_repeat_browser.py', 'tony_browser.py', 'tucker_browser.py',
]

def run(name):
    result = subprocess.run([sys.executable, 'tests/' + name], capture_output=True, text=True, timeout=480)
    Path('work').mkdir(exist_ok=True)
    Path('work/' + name + '.log').write_text(result.stdout + result.stderr)
    return name, result

selected = sys.argv[1:] or TESTS
if set(selected) - set(TESTS):
    raise SystemExit('Unknown preview test')
server = None
if not os.environ.get('KING_RICO_TEST_URL'):
    class QuietHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory='dist', **kwargs)
        def log_message(self, *args):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
    os.environ['KING_RICO_TEST_URL'] = f'http://127.0.0.1:{server.server_port}'
    threading.Thread(target=server.serve_forever, daemon=True).start()
failed = False
with ThreadPoolExecutor(max_workers=2) as pool:
    for future in as_completed([pool.submit(run, name) for name in selected]):
        try:
            name, result = future.result()
            print(f'{name}: ' + ('PASS' if result.returncode == 0 else 'FAIL'), flush=True)
            if result.returncode:
                failed = True
                print(result.stdout + result.stderr, flush=True)
        except Exception as error:
            failed = True
            print(str(error), flush=True)
if server:
    server.shutdown()
sys.exit(1 if failed else 0)
