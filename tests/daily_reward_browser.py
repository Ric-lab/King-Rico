"""Scratch gesture, accessible collection, retries, reload and saved daily credit."""
import os,json
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,mode in [(390,'no-preference'),(320,'reduce'),(430,'no-preference')]:
  context=b.new_context(viewport={'width':width,'height':844},reduced_motion=mode,has_touch=True,is_mobile=True)
  page=context.new_page();errors=[];missing=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  page.goto(BASE+'/circus')
  gift=page.get_by_role('dialog',name='Presente do dia',exact=True);gift.wait_for()
  assert page.evaluate('KingRicoCloud.uid')=='park-preview'
  before=page.evaluate('KingRicoCloud.player.balance')
  assert gift.locator('canvas').is_visible()
  assert page.locator('[data-spin-btn]').evaluate('e=>!!e.closest("[inert]")')
  assert gift.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  page.screenshot(path=f'work/preview-daily-covered-{width}.png')
  if width==390:
   canvas=gift.locator('canvas');r=canvas.bounding_box()
   page.mouse.move(r['x']+15,r['y']+15);page.mouse.down();page.mouse.move(r['x']+35,r['y']+15,steps=3);page.mouse.up()
   assert canvas.is_visible() and page.evaluate('KingRicoCloud.player.balance')==before
   page.reload();gift.wait_for();assert gift.locator('canvas').is_visible()
   r=gift.locator('canvas').bounding_box()
   page.mouse.move(r['x']+8,r['y']+8);page.mouse.down()
   for row in range(5):
    y=r['y']+12+row*r['height']/5
    page.mouse.move(r['x']+8,y,steps=2);page.mouse.move(r['x']+r['width']-8,y,steps=12)
   page.mouse.up()
   gift.get_by_role('button',name='PEGAR MOEDAS',exact=True).wait_for()
  else:
   # Same reward without requiring a gesture, including keyboard-only input.
   page.keyboard.press('Tab');page.keyboard.press('Enter')
  assert page.evaluate('KingRicoCloud.player.balance')==before
  assert gift.get_by_role('status').inner_text()=='Você ganhou 50 moedas'
  page.screenshot(path=f'work/preview-daily-revealed-{width}.png')
  page.evaluate('''()=>{
   const c=KingRicoCloud,bonus=c.bonus;c.__dailyCalls=0;c.__dailyFail=true;
   c.bonus=async()=>{c.__dailyCalls++;if(c.__dailyFail){c.__dailyFail=false;throw Error('Offline de teste');}
    const r=await bonus();await new Promise(r=>setTimeout(r,500));return r;};
  }''')
  take=gift.get_by_role('button',name='PEGAR MOEDAS',exact=True);take.click()
  page.wait_for_function('document.querySelector(".park-daily-status").textContent.includes("tentar de novo")')
  assert page.evaluate('KingRicoCloud.player.balance')==before
  if width==430:
   page.evaluate('''()=>{const original=Element.prototype.animate;Element.prototype.animate=function(...args){if(this.classList.contains('kr-wallet-coin'))throw Error('Animation unavailable');return original.apply(this,args);};}''')
  take.click()
  page.wait_for_function('(n)=>KingRicoCloud.player.balance===n+50',arg=before)
  assert gift.is_visible() and gift.locator('button').is_disabled()
  assert page.locator('[data-kr-wallet-value]').first.inner_text()==f'{before:,.0f}'.replace(',','.')
  gift.wait_for(state='detached')
  page.wait_for_function('document.querySelector("[data-kr-wallet-value]").textContent===KingRicoCloud.player.balance.toLocaleString("pt-BR",{maximumFractionDigits:2})')
  assert page.evaluate('KingRicoCloud.__dailyCalls')==2
  assert page.evaluate('async()=>(await KingRicoCloud.bonus()).amount')==0
  page.reload();page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")');page.wait_for_timeout(300)
  assert gift.count()==0 and page.evaluate('KingRicoCloud.player.balance')==before+50
  page.goto(BASE+'/park');page.wait_for_function('KingRicoCloud.player&&!document.querySelector("#kr-boot-screen")');page.wait_for_timeout(250)
  assert gift.count()==0
  assert not errors and not missing,{'errors':errors,'missing':missing}
  print(json.dumps({'width':width,'motion':mode,'scratch':True,'savedDailyCredit':True,'retry':True,'walletHold':True,'noRepeatOnReloadOrPark':True,'errors':errors,'missing':missing}),flush=True)
  context.close()
 b.close()
