"""A committed x20 spin boards the pilot and reveals its existing win, exactly once."""
import os,json
from playwright.sync_api import sync_playwright
from helpers.daily_reward import collect_daily
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,mode,fail in [(390,'no-preference',False),(320,'reduce',False),(430,'no-preference',True)]:
  context=b.new_context(viewport={'width':width,'height':844},reduced_motion=mode)
  page=context.new_page();errors=[];missing=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  page.add_init_script('''window.boardingPoses=[];new MutationObserver(records=>{for(const r of records){const e=r.target;if(e.classList?.contains('park-bigwin-jumper')&&e.dataset.pose&&boardingPoses.at(-1)!==e.dataset.pose)boardingPoses.push(e.dataset.pose);}}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-pose']});''')
  page.goto(BASE+'/circus?demo=bigwin');page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")');collect_daily(page)
  assert page.evaluate('KingRicoCloud.uid')=='park-preview'
  initial=page.evaluate('KingRicoCloud.player.balance')
  page.evaluate('''()=>{const fetch=window.fetch;window.flightRequests=[];window.fetch=(u,o)=>{const d=o?.body&&JSON.parse(o.body);if(d)flightRequests.push(d.action);return fetch(u,o);};}''')
  page.get_by_role('button',name='Girar',exact=True).click()
  flight=page.get_by_role('region',name='Voo do grande prêmio',exact=True);flight.wait_for()
  assert page.locator('[data-bigwin-modal]').evaluate('e=>getComputedStyle(e).visibility')=='hidden'
  assert flight.get_by_role('button').count()==0
  assert page.evaluate('KingRicoCloud.player.balance')==initial+190
  if fail:
   page.evaluate('document.querySelector(".park-bigwin-plane>img").dispatchEvent(new Event("error"))')
  else:
   page.wait_for_function('document.querySelector(".park-bigwin-flight")?.dataset.phase==="boarding"')
   page.wait_for_timeout(380)
   assert flight.locator('.park-bigwin-jumper').is_visible()
   page.screenshot(path=f'work/preview-bigwin-boarding-{width}.png')
   page.wait_for_function('document.querySelector(".park-bigwin-flight")?.dataset.phase==="climbing"')
   assert flight.locator('.park-bigwin-pilot').is_visible()
   assert page.evaluate('boardingPoses.filter(p=>p!=="departure")')==['crouch2','cheerRise','cheer','cheerFall','land'],page.evaluate('boardingPoses')
   def sample():return page.evaluate('''()=>{const e=document.querySelector('.park-bigwin-plane'),r=e.getBoundingClientRect();return {x:r.x,y:r.y,multiple:document.querySelector('[data-flight-multiple]').textContent};}''')
   first=sample();page.wait_for_timeout(1200);second=sample();assert second['x']>first['x'] and second['y']<first['y'],[first,second]
   assert second['multiple']!=first['multiple']
   page.screenshot(path=f'work/preview-bigwin-climbing-{width}.png')
   page.wait_for_function('document.querySelector(".park-bigwin-flight")?.dataset.phase==="result"')
   assert flight.locator('[data-flight-multiple]').inner_text()=='×20'
   assert flight.locator('[data-flight-amount]').inner_text()=='+200,00'
   page.screenshot(path=f'work/preview-bigwin-result-{width}.png')
  flight.wait_for(state='detached',timeout=18000)
  page.wait_for_function('!__fc._cfRun&&!__fc.cloudBusy()',timeout=15000)
  page.wait_for_function('document.querySelector("[data-kr-wallet-value]").textContent===KingRicoCloud.player.balance.toLocaleString("pt-BR",{maximumFractionDigits:2})')
  assert page.evaluate('KingRicoCloud.player.balance')==initial+190
  assert page.evaluate('KingRicoCloud.park.spins')==1
  assert page.evaluate('flightRequests.filter(a=>a!=="settings")')==['spin']
  assert not page.locator('.park-circus-stage').evaluate('e=>!!e.closest("[inert]")')
  assert page.locator('.park-mascot [data-k=body]').evaluate('e=>getComputedStyle(e).visibility')=='visible'
  assert not errors and not missing,{'errors':errors,'missing':missing}
  print(json.dumps({'width':width,'motion':mode,'imageFailure':fail,'pilotBoards':not fail,'x20Confirmed':True,'oneSpinOnly':True,'wallet':True,'errors':errors,'missing':missing}),flush=True)
  context.close()
 b.close()
