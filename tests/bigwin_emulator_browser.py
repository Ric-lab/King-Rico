"""Space celebration with the real wallet/store and Google Auth emulators only."""
import os,sys,uuid,json
from playwright.sync_api import sync_playwright
from helpers.daily_reward import collect_daily
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:5000')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/circus');assert page.evaluate('!!window.KING_RICO_FIREBASE?.emulators'),'Never run financial QA against production'
 page.locator('[data-cloud-test-account]').fill('space-'+uuid.uuid4().hex[:24])
 page.get_by_role('button',name='Entrar com conta de teste',exact=True).click()
 try: page.wait_for_function('KingRicoCloud.player&&window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")',timeout=15000)
 except Exception:
  print(json.dumps({'errors':errors,'state':page.evaluate('({player:!!KingRicoCloud.player,fc:!!window.__fc,hook:!!window.__fc?._parkHook,auth:KingRicoCloud.lastAuthError||null,boot:!!document.querySelector("#kr-boot-screen")})')}),flush=True);raise
 collect_daily(page)
 before=page.evaluate('KingRicoCloud.player.balance')
 page.evaluate('''()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>a instanceof Uint32Array&&a.length===1?(a[0]=0xffffffff,a):original(a);window.flightStable=[];function watch(){const e=document.querySelector('.park-bigwin-flight');if(e&&e.dataset.phase==='climbing')flightStable.push({at:performance.now(),opacity:Number(getComputedStyle(e.querySelector('.park-bigwin-sky')).opacity)});requestAnimationFrame(watch);}watch();}''')
 page.get_by_role('button',name='Girar',exact=True).click()
 scene=page.get_by_role('region',name='Voo do grande prêmio',exact=True);scene.wait_for(timeout=20000)
 assert page.evaluate('__fc._cloudSpin.outcome.slotVersion')==3
 assert page.evaluate('KingRicoCloud.player.balance')==before-10+40000
 page.wait_for_function('document.querySelector(".park-bigwin-flight")?.dataset.phase==="result"',timeout=20000)
 assert scene.get_attribute('data-altitude')=='space'
 assert scene.locator('.park-bigwin-sky').evaluate('e=>getComputedStyle(e).maskImage')=='none'
 assert scene.locator('[data-flight-amount]').inner_text()=='+40.000,00'
 samples=page.evaluate('flightStable');start=samples[0]['at']
 assert all(s['opacity']>.999 for s in samples if s['at']>start+1400)
 page.screenshot(path='work/release-space-stable.png')
 scene.wait_for(state='detached',timeout=10000)
 page.wait_for_function('!__fc._cfRun&&!__fc.cloudBusy()')
 balance=page.evaluate('KingRicoCloud.player.balance');page.reload();page.wait_for_function('KingRicoCloud.player&&!document.querySelector("#kr-boot-screen")')
 assert page.evaluate('KingRicoCloud.player.balance')==balance
 assert not errors,errors
 print(json.dumps({'emulator':True,'profile':3,'committedWin':40000,'spaceBackgroundStable':True,'reloadNoDuplicateCredit':True,'errors':errors}))
 b.close()
