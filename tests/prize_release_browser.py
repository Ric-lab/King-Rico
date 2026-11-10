from helpers.circus import PAYS,br_money
"""Daily scratch and real financial spin against local Auth/Firestore only."""
import os,json,uuid
from playwright.sync_api import sync_playwright
from helpers.daily_reward import collect_daily
BASE='http://127.0.0.1:5000'
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];missing=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:missing.append(r.url) if r.status>=400 and 'favicon' not in r.url else None)
 page.goto(BASE+'/circus')
 assert page.evaluate('KING_RICO_FIREBASE.emulators&&KING_RICO_FIREBASE.firebase.projectId==="demo-king-rico"')
 page.locator('[data-cloud-test-account]').fill('prize-release-'+uuid.uuid4().hex[:18])
 page.get_by_role('button',name='Entrar com conta de teste',exact=True).click()
 page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")&&KingRicoCloud.player')
 assert page.evaluate('KingRicoCloud.uid')!='park-preview'
 collect_daily(page)
 assert page.evaluate('KingRicoCloud.player.balance')==1050
 page.reload();page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")&&KingRicoCloud.player');page.wait_for_timeout(250)
 assert page.get_by_role('dialog',name='Presente do dia',exact=True).count()==0
 # Only the engine's scalar Uint32 draw is seeded. SDK/auth randomness remains
 # native; the actual click, store transaction, Rules and saved receipt all run.
 page.evaluate('''()=>{
  const weights=[3,30,20,8,12,5,4,3,2,2.4],total=weights.reduce((a,b)=>a+b,0),grid=[8,8,8,0,1,2,3,4,5];
  const draws=[.99,...grid.flatMap(s=>[.99,(weights.slice(0,s).reduce((a,b)=>a+b,0)+weights[s]/2)/total]).concat([.99])];
  const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1&&draws.length){a[0]=Math.floor(draws.shift()*2**32);return a;}return original(a);};
 }''')
 expected_balance=round(1050-10+10*PAYS[8],2)
 page.get_by_role('button',name='Girar',exact=True).click()
 flight=page.get_by_role('region',name='Voo do grande prêmio',exact=True);flight.wait_for(timeout=30000)
 assert page.evaluate('KingRicoCloud.player.balance')==expected_balance
 assert page.evaluate('__fc._cloudSpin.outcome.slotVersion||1')==4
 page.wait_for_function('document.querySelector(".park-bigwin-flight")?.dataset.phase==="result"',timeout=20000)
 assert flight.locator('[data-flight-amount]').inner_text()=='+'+br_money(10*PAYS[8])
 assert flight.locator('.park-bigwin-pilot').get_attribute('data-pose')=='pilotSide'
 page.screenshot(path='work/release-bigwin-native.png')
 flight.wait_for(state='detached');page.wait_for_function('!__fc._cfRun&&!__fc.cloudBusy()')
 page.wait_for_function('value=>document.querySelector("[data-kr-wallet-value]").textContent===value.toLocaleString("pt-BR",{maximumFractionDigits:2})',arg=expected_balance)
 page.reload();page.wait_for_function('KingRicoCloud.player&&!document.querySelector("#kr-boot-screen")')
 assert page.evaluate('KingRicoCloud.player.balance')==expected_balance
 assert page.get_by_role('dialog',name='Presente do dia',exact=True).count()==0
 # Current catalog only; archived routes intentionally return 404.
 page.goto(BASE+'/park');page.wait_for_function('KingRicoCloud.player&&!document.querySelector("#kr-boot-screen")')
 assert page.locator('[data-game]').count()==3 and page.locator('.park-card-coming').count()==3
 for route,hook in [('penalty','__pen'),('flying-clown','__flying'),('bounce','__bounce'),('fingo','__fg')]:
  page.goto(BASE+'/'+route);page.wait_for_function('hook=>window[hook]&&KingRicoCloud.player&&!document.querySelector("#kr-boot-screen")',arg=hook)
  entry=page.get_by_role('button',name='JOGAR POR 25 MOEDAS',exact=True)
  entry.wait_for();entry.click();page.locator('.park-modal').wait_for(state='detached')
  assert page.evaluate('KingRicoCloud.player.balance')==expected_balance
  page.get_by_role('button',name='Abrir menu',exact=True).click();page.locator('.kr-menu-dialog').wait_for();page.keyboard.press('Escape')
 assert not errors and not missing,{'errors':errors,'missing':missing}
 print(json.dumps({'realEmulatedWallet':True,'dailyOnce':True,'savedSpin':True,'eightLinesV4':True,'pilot':True,'reloadBalance':expected_balance,'currentCatalog':True,'errors':errors,'missing':missing}),flush=True)
 b.close()
