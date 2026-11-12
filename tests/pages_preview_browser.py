"""Preview wallet and real assets at the GitHub Pages repository subpath; no Firebase."""
import os,json,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
from helpers.daily_reward import collect_daily
server=None
base=os.environ.get('KING_RICO_TEST_URL')
prefix=os.environ.get('KING_RICO_PREVIEW_BASE','/King-Rico').rstrip('/')
if not base:
 class Handler(SimpleHTTPRequestHandler):
  def __init__(self,*a,**kw):super().__init__(*a,directory='dist',**kw)
  def log_message(self,*a):pass
  def translate_path(self,value):
   if prefix:
    if not urlsplit(value).path.startswith(prefix+'/'):return str(Path('dist/__outside_preview_base__').resolve())
    value=value[len(prefix):]
   return super().translate_path(value)
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
 threading.Thread(target=server.serve_forever,daemon=True).start()
 base=f'http://127.0.0.1:{server.server_port}'+prefix
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];missing=[];escaped=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
 def request(r):
  u=urlsplit(r.url)
  if u.netloc==urlsplit(base).netloc and not u.path.startswith(prefix+'/'):escaped.append(r.url)
 page.on('request',request)
 page.goto(base+'/circus?demo=off');collect_daily(page)
 page.wait_for_function('window.__fc?._parkHook&&!__fc.cloudBusy()&&!__fc.state.balPending')
 assert page.evaluate('KingRicoCloud.uid')=='park-preview'
 assert page.evaluate('KING_RICO_FIREBASE.enabled')==False
 before=page.evaluate('KingRicoCloud.player.balance')
 page.locator('[data-spin-btn]').click()
 page.wait_for_function('__fc._cloudSpin?.outcome?.slotVersion===5')
 receipt=page.evaluate('__fc._cloudSpin');expected=round(before-10+receipt['outcome']['winUnits']/100-(receipt['outcome'].get('tony',{}).get('stolenUnits',0))/100,2)
 assert abs(page.evaluate('KingRicoCloud.player.balance')-expected)<.001
 replay=page.evaluate('''async()=>{const saved=JSON.parse(localStorage.getItem('kingRico.parque.mobile-preview.v1'));const [id,o]=saved.once.filter(([id,o])=>o.result.outcome?.slotVersion).at(-1);return (await fetch('/api/play',{method:'POST',body:JSON.stringify({...JSON.parse(o.fingerprint),requestId:id})})).json()}''')
 assert replay['replayed'] and abs(replay['player']['balance']-expected)<.001
 page.reload();page.wait_for_function('KingRicoCloud.player');assert abs(page.evaluate('KingRicoCloud.player.balance')-expected)<.001
 collect_daily(page)
 page.locator('.kr-hud-park').click();page.wait_for_url('**/Home.dc.html*');collect_daily(page)
 assert page.locator('.kr-hud-home').get_attribute('href')==prefix+'/circus'
 assert page.locator('[data-game]').count()==3
 page.screenshot(path='work/preview-pages-park.png')
 for route in ['penalty','flying-clown','bounce','fingo']:
  page.goto(base+'/'+route);collect_daily(page)
  page.wait_for_function('KingRicoCloud.player&&!document.querySelector("#kr-boot-screen")')
  assert page.evaluate('KingRicoCloud.uid')=='park-preview'
  if page.locator('.park-modal [data-ticket]').count():
   page.locator('.park-modal [data-ticket]').click()
   page.wait_for_function('!document.querySelector(".park-modal [data-ticket]")')
  assert urlsplit(page.locator('.kr-hud-home').evaluate('e=>e.href')).path.startswith(prefix+'/'),route
  page.wait_for_timeout(700)
 page.locator('.kr-hud-home').click();page.wait_for_url('**/Fortune%20Circus.dc.html*');collect_daily(page)
 assert not missing and not errors and not escaped,{'missing':missing,'errors':errors,'outsideBase':escaped}
 print(json.dumps({'base':base,'allRoutes':True,'walletSpinReplayReload':True,'firebaseDisabled':True,'errors':errors,'missing':missing,'outsideBase':escaped}),flush=True)
 b.close()
if server:server.shutdown()
