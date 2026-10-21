"""Cross-runtime audit: Chromium ESM physics must match the Node/rules table."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--disable-dev-shm-usage'])
    page=browser.new_page();page.goto('http://127.0.0.1:5000/version.json')
    table=json.loads(Path('cloud/race-physics-winners.json').read_text())
    for layout,expected in enumerate(table):
        result=page.evaluate('''async layout=>{window.auditWorker??=new Worker('/games/race/physics-worker.js',{type:'module'});return await new Promise((resolve,reject)=>{auditWorker.onmessage=({data})=>data.error?reject(Error(data.error)):resolve({winner:data.recording.order[0],times:data.recording.times});auditWorker.onerror=reject;auditWorker.postMessage({id:layout,seed:layout*5});});}''',layout)
        assert result['winner']==expected,(layout,result,expected)
        print(json.dumps({'layout':layout,'winner':expected,'browser_matches_rules':True}),flush=True)
    browser.close()
