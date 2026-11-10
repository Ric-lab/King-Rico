"""Actual production UI and wallet store with local Auth/Firestore only."""
import os,json,uuid
from urllib.request import Request,urlopen
from playwright.sync_api import sync_playwright
from helpers.daily_reward import collect_daily
BASE='http://127.0.0.1:5000'
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];missing=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:missing.append(r.url) if r.status>=400 and 'favicon' not in r.url else None)
 page.goto(BASE+'/circus')
 assert page.evaluate('KING_RICO_FIREBASE.emulators&&KING_RICO_FIREBASE.firebase.projectId==="demo-king-rico"')
 page.locator('[data-cloud-test-account]').fill('villains-release-'+uuid.uuid4().hex[:18]);page.get_by_role('button',name='Entrar com conta de teste',exact=True).click()
 page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")&&KingRicoCloud.player');collect_daily(page)
 assert page.evaluate('KingRicoCloud.slotVersion')==4
 assert 'circus-garden-lawn-v1.webp' in page.locator('.park-circus-ambient').evaluate('e=>getComputedStyle(e).backgroundImage')
 assert 'spin-rim-gold-contour-v1.svg' in page.locator('.park-spin-rim>img').get_attribute('src')
 uid=page.evaluate('KingRicoCloud.uid')
 # Admin data only in the explicitly asserted local emulator; never a real account.
 root='http://127.0.0.1:8085/v1/projects/demo-king-rico/databases/(default)/documents/players/'+uid
 def patch(url,fields):
  masks='&'.join('updateMask.fieldPaths='+k for k in fields)
  req=Request(url+'?'+masks,data=json.dumps({'fields':fields}).encode(),headers={'Authorization':'Bearer owner','Content-Type':'application/json'},method='PATCH')
  with urlopen(req) as r:assert r.status==200
 patch(root,{'peaches':{'integerValue':'3'},'peachBank':{'mapValue':{'fields':{'count':{'integerValue':'3'},'units':{'integerValue':'751'}}}}})
 patch(root+'/park/state',{'tickets':{'integerValue':'3'},'version':{'integerValue':'1'},'revision':{'integerValue':'0'},'spins':{'integerValue':'0'},'wheel':{'nullValue':None},'lastOperationId':{'nullValue':None},'passes':{'mapValue':{'fields':{}}}})
 page.wait_for_function('KingRicoCloud.player.peaches===3&&KingRicoCloud.park.tickets===3');page.reload()
 page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")&&KingRicoCloud.player')
 for kind,draw,label in [('tony',0,'Tony roubou moedas'),('tucker',.0625,'Tucker levou Happeach'),('ray',.0875,'Ray e os ingressos')]:
  page.wait_for_function('!__fc.cloudBusy()');before=page.evaluate('KingRicoCloud.player.balance')
  page.evaluate('''draw=>{const draws=[draw,.1],original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1&&draws.length){a[0]=Math.floor(draws.shift()*2**32);return a;}return original(a);};}''',draw)
  print('Testing '+kind,flush=True);page.locator('[data-spin-btn]').click();scene=page.locator('.park-'+kind+'-scene');scene.wait_for(timeout=30000)
  receipt=page.evaluate('__fc._cloudSpin');event=receipt['outcome'][kind];assert receipt['outcome']['slotVersion']==4
  assert page.locator('[data-park-'+kind+'="true"]').count()==3
  if kind=='tony':
   assert event['stolenUnits']==1500
   page.wait_for_function('document.querySelector(".park-tony-scene")?.dataset.hit==="1"')
  else:
   assert event['stolen']==1
   phase='flying' if kind=='tucker' else 'leaving'
   page.wait_for_function('(args)=>document.querySelector(".park-"+args[0]+"-scene")?.dataset.phase===args[1]',arg=[kind,phase]);page.wait_for_timeout(250)
   assert page.locator('.park-basket' if kind=='tucker' else '.park-circus-rails > .park-pocket').evaluate('e=>getComputedStyle(e).visibility')=='hidden'
  page.screenshot(path='work/release-'+kind+'-action.png')
  dialog=page.get_by_role('dialog',name=label,exact=True);dialog.wait_for(timeout=15000)
  page.screenshot(path='work/release-'+kind+'-result.png')
  dialog.get_by_role('button',name='CONTINUAR',exact=True).click();scene.wait_for(state='detached',timeout=5000)
  page.wait_for_function('!__fc.cloudBusy()');expected=before-10-(event['stolenUnits']/100 if kind=='tony' else 0)
  assert page.evaluate('KingRicoCloud.player.balance')==expected
  assert page.evaluate('KingRicoCloud.player.peaches')==(2 if kind in ['tucker','ray'] else 3)
  assert page.evaluate('KingRicoCloud.park.tickets')==(2 if kind=='ray' else 3)
  page.reload();page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")&&KingRicoCloud.player')
  assert page.evaluate('KingRicoCloud.player.balance')==expected
  assert page.locator('.park-tony-scene,.park-tucker-scene,.park-ray-scene').count()==0
 assert not errors and not missing,{'errors':errors,'missing':missing}
 print('Production v4: real emulated receipts, all three animations, new background/rim, resources and reload; no missing assets or JS errors')
 b.close()
