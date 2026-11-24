"""Wireframe v7: joined prize plaque, aligned cabinet and reachable spin on phones."""
import os,json
from playwright.sync_api import sync_playwright
from helpers.daily_reward import collect_daily
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for w,h in [(320,740),(390,844),(412,915)]:
  page=b.new_page(viewport={'width':w,'height':h});errors=[];missing=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  page.goto(BASE+'/circus?demo=ticket');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  def rect(s):return page.locator(s).first.bounding_box()
  prize=rect('.park-part-prize');value=rect('.park-prize-value')
  for key in ['x','y','width','height']:assert abs(prize[key]-value[key])<1,(prize,value)
  frame=rect('.park-reel-frame');spin=rect('[data-spin-btn]')
  scale=rect('.park-circus-stage')['width']/453
  prize_gap=(frame['y']-prize['y']-prize['height'])/scale
  button_gap=(spin['y']-frame['y']-frame['height'])/scale
  assert abs(prize_gap-11.75)<1,prize_gap  # half the original 23.5-unit gap
  assert abs(button_gap-15.62)<1,button_gap  # 70% of the original 22.32-unit gap
  assert .63*h<spin['y']<.70*h,(h,spin)
  assert spin['y']+spin['height']<.89*h,(h,spin)
  shells=page.locator('.park-reel-shell').all()
  for shell in shells:
   r=shell.bounding_box()
   assert r['x']>=frame['x']+2 and r['x']+r['width']<=frame['x']+frame['width']-2,(frame,r)
   assert r['y']>=frame['y'] and r['y']+r['height']<=frame['y']+frame['height']+1,(frame,r)
  # Both pulse states must follow each actual drum, through the same cabinet transform.
  page.evaluate('__fc.setState({goldGrid:true})')
  for i,shell in enumerate(shells):
   paper=shell.bounding_box();fx=rect('.park-reel-fx-column.park-reel-shell-'+str(i))
   for key in ['x','y','width','height']:assert abs(paper[key]-fx[key])<1,(paper,fx)
   for overlay in ['.park-grid-shade','.park-grid-gold']:
    mask=rect('.park-reel-fx-column.park-reel-shell-'+str(i)+' '+overlay)
    for key in ['x','y','width','height']:assert abs(mask[key]-paper[key])<1,(paper,mask)
  page.screenshot(path=f'work/preview-layout-gold-{w}.png')
  page.evaluate('__fc.setState({goldGrid:false})')
  assert not page.locator('.park-basket').is_visible()
  page.screenshot(path=f'work/preview-layout-idle-{w}.png')
  page.wait_for_function('!__fc.cloudBusy()&&!__fc.state.balPending')
  page.get_by_role('button',name='Abrir menu',exact=True).click()
  page.get_by_role('button',name='Tabela de pagamentos',exact=True).click()
  sheet=page.locator('[data-overlay="pays"]');sheet.wait_for();page.wait_for_timeout(250)
  assert sheet.locator('[data-pay-specials]').inner_text().strip()=='','Specials must have no captions'
  assert sheet.locator('.park-pay-wheel').get_attribute('aria-label')=='Roletas'
  assert 'wheel-symbol-v1.webp' in sheet.locator('.park-pay-wheel').evaluate('e=>getComputedStyle(e).maskImage')
  assert page.locator('.park-bet-step,.park-key-count').evaluate_all('ns=>ns.length===4&&ns.every(n=>getComputedStyle(n).visibility==="hidden")'),'Game controls must stay behind the payment sheet'
  page.screenshot(path=f'work/preview-paytable-clean-{w}.png')
  sheet.get_by_text('OK',exact=True).click()
  page.get_by_role('button',name='Fechar menu',exact=True).click()
  assert page.locator('.park-bet-step,.park-key-count').evaluate_all('ns=>ns.every(n=>getComputedStyle(n).visibility==="visible")')
  if w==390:
   page.locator('[data-spin-btn]').click()
   page.wait_for_function('__fc.state.displayWin>0&&!__fc.state.spinning',timeout=15000)
   text=rect('.park-prize-value>span')
   assert prize['x']<text['x'] and text['x']+text['width']<prize['x']+prize['width'],(prize,text)
   assert prize['y']<text['y'] and text['y']+text['height']<prize['y']+prize['height'],(prize,text)
   assert page.locator('[data-payline]').count()>0
   page.screenshot(path='work/preview-layout-win.png')
   page.wait_for_function('!__fc.cloudBusy()&&!__fc.state.balPending',timeout=20000)
  assert not errors and not missing,(errors,missing)
  print(json.dumps({'phone':[w,h],'joinedPrize':True,'alignedDrums':True,'spinTop':round(spin['y']),'errors':errors}),flush=True)
  page.close()
 b.close()
