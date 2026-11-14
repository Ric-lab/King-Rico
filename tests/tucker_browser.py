from helpers.daily_reward import collect_daily
from playwright.sync_api import sync_playwright
import os
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 for mode,width,empty in [('no-preference',390,False),('reduce',320,False),('empty',390,True)]:
  ctx=b.new_context(viewport={'width':width,'height':844},reduced_motion='reduce' if mode=='reduce' else 'no-preference');page=ctx.new_page();errors=[];missing=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  page.goto(BASE+'/circus?demo=tucker');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  assert page.evaluate('KingRicoCloud.uid')=='park-preview'
  if empty:
   page.evaluate('''async()=>{const key='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(key)),p=s.records.find(([k])=>k==='players/preview')[1];p.peaches=0;p.peachBank={count:0,units:0};localStorage.setItem(key,JSON.stringify(s));await KingRicoPark.call({action:'state'});}''')
  expected=0 if empty else 3
  assert page.evaluate('__fc.state.peaches')==expected
  before=page.evaluate('KingRicoCloud.player.balance');page.locator('[data-spin-btn]').click()
  page.wait_for_function('__fc._cloudSpin?.outcome?.tucker');stolen=page.evaluate('__fc._cloudSpin.outcome.tucker.stolen')
  scene=page.locator('.park-tucker-scene');scene.wait_for(timeout=15000)
  page.wait_for_function('document.querySelector(".park-tucker-scene")?.dataset.phase==="perched"');page.wait_for_timeout(520)
  assert page.locator('[data-park-tucker="true"]').count()==3
  assert page.locator('.park-tucker-scene ellipse').count()==3
  assert page.locator('.park-basket').evaluate('e=>getComputedStyle(e).visibility')=='visible'
  assert page.evaluate('__fc.state.peaches')==expected and page.evaluate('KingRicoCloud.player.peaches')==max(0,expected-stolen)
  bird=page.locator('.park-tucker-bird').bounding_box();basket=page.locator('.park-basket').bounding_box()
  assert abs(bird['x']+bird['width']*.49-(basket['x']+basket['width']*.5))<1.5
  assert abs(bird['y']+bird['height']*.945-(basket['y']+basket['height']*.12))<1.5
  page.screenshot(path=f'work/preview-tucker-perched-{mode}.png')
  page.wait_for_function('document.querySelector(".park-tucker-scene")?.dataset.phase==="flying"');page.wait_for_timeout(500)
  assert page.locator('.park-basket').evaluate('e=>getComputedStyle(e).visibility')=='hidden'
  assert page.locator('.park-tucker-carried-basket').count()==1
  wing=page.locator('.tucker-wing-left');a=wing.evaluate('e=>getComputedStyle(e).transform');page.wait_for_timeout(70)
  if mode=='no-preference':assert wing.evaluate('e=>getComputedStyle(e).transform')!=a
  page.screenshot(path=f'work/preview-tucker-flying-{mode}.png')
  page.wait_for_function('document.querySelector(".park-tucker-scene")?.dataset.phase==="empty"')
  assert page.locator('.park-basket').evaluate('e=>getComputedStyle(e).visibility')=='hidden'
  assert page.get_by_role('dialog',name='Tucker levou roletas',exact=True).count()==0
  page.screenshot(path=f'work/preview-tucker-empty-{mode}.png')
  dialog=page.get_by_role('dialog',name='Tucker levou roletas',exact=True);dialog.wait_for()
  assert dialog.locator('.park-tony-total').inner_text()==str(page.evaluate('__fc._cloudSpin.outcome.tucker.stolen'))
  assert page.evaluate('KingRicoCloud.player.balance')==before-10
  page.screenshot(path=f'work/preview-tucker-result-{mode}.png')
  dialog.get_by_role('button',name='CONTINUAR',exact=True).click();scene.wait_for(state='detached')
  assert page.locator('.park-basket').evaluate('e=>getComputedStyle(e).visibility')=='visible'
  assert page.evaluate('__fc.state.peaches')==max(0,expected-stolen)
  page.screenshot(path=f'work/preview-tucker-returned-{mode}.png')
  page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  assert page.evaluate('KingRicoCloud.player.peaches')==max(0,expected-stolen)
  assert page.locator('.park-tucker-scene').count()==0
  assert not errors and not missing,(errors,missing)
  ctx.close()
 b.close()
print('Tucker: face trinca, red line, perched feet, wing motion, basket departure, empty pause, modal and restored count passed')
