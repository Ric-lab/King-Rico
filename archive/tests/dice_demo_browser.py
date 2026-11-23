"""Standalone swipe demo, served under the actual Pages base, with no wallet calls."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import os,json
root=Path('prototypes/villain-dice-demo/dist').resolve();base='/King-Rico/dice-demo'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
 def do_GET(self):
  if self.path.startswith(base):self.path=self.path[len(base):] or '/'
  return super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--enable-unsafe-swiftshader'])
  page=b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);errors=[];requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
  page.goto(f'http://127.0.0.1:{server.server_port}{base}/')
  page.wait_for_function('document.querySelector(".park-villain-dice")?.dataset.phase==="ready"')
  assert page.locator('.park-villain-dice').get_attribute('data-renderer')=='three'
  tray=page.locator('.park-dice-tray');r=tray.bounding_box()
  page.mouse.move(r['x']+r['width']*.5,r['y']+r['height']*.8);page.mouse.down();page.mouse.move(r['x']+r['width']*.65,r['y']+r['height']*.2,steps=12);page.mouse.up()
  page.wait_for_function('document.querySelector(".park-villain-dice")?.dataset.phase==="rolling"');assert tray.get_attribute('data-launch')
  page.wait_for_function('document.querySelector(".park-villain-dice")?.dataset.phase==="result"')
  assert tray.get_attribute('data-face')=='3'
  Path('work').mkdir(exist_ok=True);page.screenshot(path='work/dice-demo-result.png')
  page.wait_for_function('document.querySelector("#result").textContent==="Resultado: 3"')
  assert not any('firestore' in u or '/api/' in u or 'firebase' in u for u in requests),requests
  assert not errors,errors
  b.close()
 print(json.dumps({'swipe':True,'three':True,'savedFace':3,'basePath':True,'noWalletOrApi':True}))
finally:server.shutdown();server.server_close()
