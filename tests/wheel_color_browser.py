"""Restored saved results must retain the selected sector's color through flight."""
from helpers.daily_reward import collect_daily
from playwright.sync_api import sync_playwright
import os
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178');os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 for index,color,mode in [(0,'#8e24ff','no-preference'),(8,'#ffdf22','reduce'),(12,'#f52364','reduce')]:
  ctx=b.new_context(viewport={'width':390,'height':844},reduced_motion=mode);page=ctx.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/circus');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  page.evaluate('''index=>{const key='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(key)),pockets=[10,1,2,1,3,2,1,5,2,1,3,2,1],multiplier=pockets[index],id=crypto.randomUUID();s.park.spins=10;s.park.wheel={id,roundId:id,prizeVersion:3,baseUnits:1000,pockets,result:{index,multiplier,winUnits:1000*multiplier,extraUnits:1000*(multiplier-1)}};localStorage.setItem(key,JSON.stringify(s));}''',index)
  page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  page.locator('.park-wheel-machine.is-won').wait_for(timeout=15000)
  assert page.locator('.park-wheel-machine').evaluate('e=>getComputedStyle(e).getPropertyValue("--park-result-color").trim()')==color
  rgb=page.evaluate('color=>{const e=document.createElement("i");e.style.color=color;document.body.append(e);const c=getComputedStyle(e).color;e.remove();return c}',color)
  assert page.locator('.park-wheel-hub').evaluate('e=>getComputedStyle(e,"::before").backgroundColor')==rgb
  page.wait_for_timeout(1100 if mode=='no-preference' else 100)
  page.screenshot(path=f'work/preview-wheel-color-{index}-center.png')
  disc=page.locator('.park-flying-bonus-disc');disc.wait_for(timeout=12000)
  assert disc.evaluate('e=>getComputedStyle(e).getPropertyValue("--park-result-color").trim()')==color
  assert disc.evaluate('e=>getComputedStyle(e,"::before").backgroundColor')==rgb
  page.screenshot(path=f'work/preview-wheel-color-{index}-flight.png')
  assert not errors,errors
  ctx.close()
 b.close()
print('Winner color stays identical in takeover and flight: violet, yellow, pink; normal and reduced motion')
