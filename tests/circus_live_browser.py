"""Published client with real emulated Auth/Firestore; no preview wallet/presets."""
from helpers.daily_reward import collect_daily
from playwright.sync_api import sync_playwright
import os,json,uuid
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:5000')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,reduced_motion='reduce')
 page=context.new_page();errors=[];missing=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:missing.append(r.url) if r.status>=400 and 'favicon' not in r.url else None)
 # Old local/test balances must never enter the shared wallet.
 page.add_init_script("localStorage.setItem('kingRico.parque.mobile-preview.v1',JSON.stringify({balance:999999,tickets:99}));")
 page.goto(BASE+'/circus?demo=tony')
 page.locator('[data-cloud-test-account]').fill('circus-live-'+uuid.uuid4().hex[:18])
 page.get_by_role('button',name='Entrar com conta de teste',exact=True).click()
 try:page.wait_for_function('window.__fc?._parkHook&&KingRicoCloud.player')
 except Exception:
  print(json.dumps({'errors':errors,'missing':missing,'state':page.evaluate('({fc:!!window.__fc,hook:window.__fc?._parkHook,cloud:!!window.KingRicoCloud,player:window.KingRicoCloud?.player,body:document.body.innerText.slice(-1200)})')}),flush=True)
  page.screenshot(path='work/circus-live-boot-error.png');raise
 assert page.evaluate('KingRicoCloud.player.balance')==1000
 collect_daily(page)
 page.wait_for_function('!KingRicoCloud.dailyRewardActive')
 assert page.evaluate('typeof KingRicoPreviewPicker')=='undefined'
 assert page.locator('#kr-preview-picker,[data-preview-preset]').count()==0
 page.locator('.kr-menu-button').click()
 assert 'Escolher próximos giros' not in page.locator('body').inner_text()
 assert 'Escudos cheios' not in page.locator('body').inner_text()
 # Close the real menu, preserving its sound and vibration preferences.
 page.keyboard.press('Escape')
 page.evaluate('''()=>{const native=KingRicoCloud.spin;KingRicoCloud.spin=async(...args)=>{const r=await native(...args);window.liveReceipt=r;return r;};}''')
 before=page.evaluate('KingRicoCloud.player.balance')
 page.locator('[data-spin-btn]').click()
 page.wait_for_function('window.liveReceipt',timeout=30000)
 r=page.evaluate('liveReceipt')
 assert r['outcome']['slotVersion']==6
 assert r['balanceBefore']==before
 expected=before-r['bet']+r['outcome']['winUnits']/100-r['outcome'].get('tony',{}).get('stolenUnits',0)/100
 assert abs(r['player']['balance']-expected)<.0001
 uid=page.evaluate('KingRicoCloud.uid')
 page.reload();page.wait_for_function('window.__fc?._parkHook&&KingRicoCloud.player&&!document.querySelector("#kr-boot-screen")')
 assert page.evaluate('KingRicoCloud.uid')==uid
 assert page.evaluate('KingRicoCloud.player.balance')==r['player']['balance']
 assert page.evaluate('KingRicoCloud.park.revision')==r['park']['revision']
 assert page.locator('.park-goal-bolt').count()==2
 assert page.locator('.park-goal-bolt').evaluate_all('a=>a.every(n=>n.complete&&n.naturalWidth>0)')
 assert page.evaluate('typeof __fc.testFill')=='undefined'
 page.screenshot(path='work/circus-live-wallet.png')
 assert not errors,errors
 assert not missing,missing
 print(json.dumps({'realEmulatedWallet':True,'balance':r['player']['balance'],'authPersists':True,'noTestControls':True,'missing':missing,'errors':errors}),flush=True)
 browser.close()
