"""Run independent preview browsers in pairs; keep every existing regression."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import subprocess
import sys

TESTS = [
    'daily_reward_browser.py', 'bigwin_flight_browser.py',
    'preview_motion_browser.py', 'circus_columns_browser.py',
    'park_preview_browser.py', 'park_repeat_browser.py',
]

def run(name):
    result = subprocess.run([sys.executable, 'tests/' + name], capture_output=True, text=True, timeout=480)
    Path('work').mkdir(exist_ok=True)
    Path('work/' + name + '.log').write_text(result.stdout + result.stderr)
    return name, result

failed = False
with ThreadPoolExecutor(max_workers=2) as pool:
    for future in as_completed([pool.submit(run, name) for name in TESTS]):
        try:
            name, result = future.result()
            print(f'{name}: ' + ('PASS' if result.returncode == 0 else 'FAIL'), flush=True)
            if result.returncode:
                failed = True
                print(result.stdout + result.stderr, flush=True)
        except Exception as error:
            failed = True
            print(str(error), flush=True)
sys.exit(1 if failed else 0)
