from helpers.daily_reward import collect_daily
from playwright.sync_api import sync_playwright
import os
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178');os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 for count,width,mode in [(3,390,'no-preference'),(0,320,'reduce')]:
  ctx=b.new_context(viewport={'width':width,'height':844},reduced_motion=mode);page=ctx.new_page();errors=[];missing=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  page.goto(BASE+'/circus?demo=ray');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  assert page.evaluate('KingRicoCloud.uid')=='park-preview'
  if count==0:page.evaluate('''async()=>{const key='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(key));s.park.tickets=0;localStorage.setItem(key,JSON.stringify(s));await KingRicoPark.call({action:'state'});}''')
  before=page.evaluate('KingRicoCloud.player.balance');peaches=page.evaluate('KingRicoCloud.player.peaches');page.locator('[data-spin-btn]').click()
  scene=page.locator('.park-ray-scene');scene.wait_for(timeout=15000)
  page.wait_for_function('document.querySelector(".park-ray-scene")?.dataset.phase==="peeking"');page.wait_for_timeout(650)
  assert page.locator('[data-park-ray="true"]').count()==3
  assert page.locator('.park-ray-scene ellipse').count()==3
  page.screenshot(path=f'work/preview-ray-peeking-{count}.png')
  page.wait_for_function('document.querySelector(".park-ray-scene")?.dataset.phase==="grabbing"');page.wait_for_timeout(200)
  assert page.locator('[data-tickets]').inner_text()==str(max(0,count-1))
  assert page.evaluate('KingRicoPark.state.tickets')==max(0,count-1)
  page.screenshot(path=f'work/preview-ray-grab-{count}.png')
  page.wait_for_function('document.querySelector(".park-ray-scene")?.dataset.phase==="leaving"')
  x=page.locator('.park-ray-actor').bounding_box()['x'];page.wait_for_timeout(500)
  assert page.locator('.park-ray-actor').bounding_box()['x']<x-5,'Ray must leave toward the left'
  page.screenshot(path=f'work/preview-ray-leaving-{count}.png')
  dialog=page.get_by_role('dialog',name='Ray e os ingressos',exact=True);dialog.wait_for()
  assert dialog.locator('.park-tony-total').inner_text()==str(min(1,count))
  assert page.evaluate('KingRicoCloud.player.balance')==before-10
  assert page.evaluate('KingRicoCloud.player.peaches')==peaches
  page.screenshot(path=f'work/preview-ray-result-{count}.png')
  dialog.get_by_role('button',name='CONTINUAR',exact=True).click();scene.wait_for(state='detached')
  assert page.locator('[data-tickets]').inner_text()==str(max(0,count-1))
  page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  assert page.evaluate('KingRicoPark.state.tickets')==max(0,count-1)
  assert page.locator('.park-ray-scene').count()==0
  assert not errors and not missing,(errors,missing)
  ctx.close()
 b.close()
print('Ray: red trinca, peek, ticket contact, leftward escape, loss/zero, balance and reload passed')
