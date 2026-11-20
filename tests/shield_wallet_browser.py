"""V7 shield dock: actual account stock, readable phones and full-size long balances."""
from helpers.daily_reward import collect_daily
from playwright.sync_api import sync_playwright
import json,os
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,height in [(320,740),(375,812),(390,844),(412,915)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/circus?demo=off');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  page.evaluate('''()=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.park.cedros=3;localStorage.setItem(k,JSON.stringify(s));}''')
  page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  wallet=page.locator('.park-shield-wallet');wallet.wait_for()
  assert wallet.locator('[data-tickets]').inner_text()=='3/5'
  assert wallet.locator('img').evaluate("n=>n.complete&&n.naturalWidth>0&&n.src.includes('shield-defense-green-crown-v1.webp')")
  box=wallet.bounding_box();balance=page.locator('.kr-hud-balance').bounding_box()
  assert box['y']>=balance['y']+balance['height']+3,(box,balance)
  assert abs(box['x']-balance['x'])<5,(box,balance)
  assert box['width']>=75 and box['height']>=43.9,box
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  wallet.click();page.get_by_role('dialog',name='Escudos de defesa',exact=True).wait_for()
  page.get_by_role('button',name='ENTENDI',exact=True).click()
  page.screenshot(path=f'work/shield-wallet-{width}.png')
  # Long balance never shrinks the digits or collides with the shields.
  font=page.locator('[data-kr-wallet-value]').evaluate('n=>getComputedStyle(n).fontSize')
  page.evaluate('''()=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.records.find(([k])=>k==='players/preview')[1].balanceUnits=10000000065;localStorage.setItem(k,JSON.stringify(s));}''')
  page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  page.wait_for_function('KingRicoCloud.player.balance>=100000000.65')
  assert page.locator('[data-kr-wallet-value]').evaluate('n=>getComputedStyle(n).fontSize')==font
  assert wallet.locator('[data-tickets]').inner_text()=='3/5'
  assert not errors,errors
  print(json.dumps({'width':width,'stock':3,'layout':box,'longBalance':True,'errors':errors}),flush=True)
  page.close()
 b.close()
