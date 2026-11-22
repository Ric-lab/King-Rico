"""Coin Master reference: stationary socket, rigid cap, complete quick taps and native auto."""
from helpers.daily_reward import collect_daily
from helpers.circus import draws_for_grid
from playwright.sync_api import sync_playwright
import os,json
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for mode in ['no-preference','reduce']:
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,reduced_motion=mode)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/circus?demo=off');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  assert page.locator('.park-spin-verb,.park-spin-sub').count()==0
  font=page.locator('.park-spin-label').first.evaluate('e=>({family:getComputedStyle(e).fontFamily,style:getComputedStyle(e).fontStyle})')
  assert 'Baloo 2' in font['family'] and font['style']=='normal',font
  assert page.locator('.park-spin-label').first.inner_text().replace('.','').isdigit()
  wager=page.locator('.park-spin-label').first.inner_text()
  bet_index=page.evaluate('__fc.state.betIdx')
  plus=page.get_by_role('button',name='Aumentar aposta',exact=True);key=plus.bounding_box();cap=plus.locator('.park-bet-key-face').bounding_box()
  page.mouse.move(key['x']+key['width']/2,key['y']+key['height']/2);page.mouse.down();page.wait_for_timeout(75)
  assert abs(plus.bounding_box()['y']-key['y'])<.2
  assert plus.locator('.park-bet-key-face').bounding_box()['y']>cap['y']+6
  page.screenshot(path=f'work/preview-king-key-down-{mode}.png')
  page.mouse.up()
  assert page.evaluate('__fc.state.betIdx')==bet_index+1
  assert page.locator('.park-spin-label').first.inner_text()!=wager
  page.get_by_role('button',name='Diminuir aposta',exact=True).click()
  assert page.locator('.park-spin-label').first.inner_text()==wager
  page.evaluate('''draws=>{
   const fetch=window.fetch;window.spinCalls=0;
   window.fetch=async(u,o)=>{const d=o?.body&&JSON.parse(o.body);if(d?.action!=='spin')return fetch(u,o);spinCalls++;const r=Math.random;let i=0;Math.random=()=>draws[i++]??.99;try{return await fetch(u,o);}finally{Math.random=r}};
   window.capGeometry=()=>{const b=document.querySelector('[data-spin-btn]'),s=b.getBoundingClientRect().width/277,r=n=>b.querySelector('.park-spin-'+n).getBoundingClientRect(),f=r('face'),e=r('edge'),g=r('rim'),l=r('label');return {front:(e.bottom-f.bottom)/s,rear:(f.top-e.top)/s,rim:[g.x,g.y,g.width,g.height],labelInside:l.left>=f.left-1&&l.right<=f.right+1&&l.top>=f.top-1&&l.bottom<=f.bottom+1}};
  }''',draws_for_grid([10,2,0,6,8,7,0,2,6]))
  rest=page.evaluate('capGeometry()');assert rest['front']>20,rest
  button=page.locator('[data-spin-btn]');box=button.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
  # A real, very short touchscreen tap must still reach the bottom pose.
  page.evaluate('''()=>{window.capSamples=[];const start=performance.now();const tick=()=>{capSamples.push({...capGeometry(),t:performance.now()-start});if(performance.now()-start<420)requestAnimationFrame(tick)};requestAnimationFrame(tick)}''')
  page.touchscreen.tap(x,y)
  page.wait_for_timeout(450)
  samples=page.evaluate('capSamples');down=min(samples,key=lambda v:v['front'])
  assert down['front']<5 and 30<down['rear']<55,(rest,down)
  assert all(max(abs(a-b) for a,b in zip(r['rim'],rest['rim']))<.2 for r in samples),samples
  assert all(r['labelInside'] for r in samples),samples
  assert abs(page.evaluate('capGeometry().front')-rest['front'])<.5
  assert page.evaluate('spinCalls')==1
  page.wait_for_function('!__fc.cloudBusy()&&!__fc.state.balPending',timeout=20000)
  # Holding still enables native auto; stopping it never creates an extra wager.
  page.mouse.move(x,y);page.mouse.down();page.wait_for_timeout(200)
  progress=page.locator('.park-spin-hold-line').evaluate('e=>parseFloat(getComputedStyle(e).strokeDashoffset)')
  assert 40<progress<90,progress
  page.wait_for_timeout(520)
  assert page.evaluate('__fc.state.auto')
  assert page.locator('.park-spin-hold-line').evaluate('e=>parseFloat(getComputedStyle(e).strokeDashoffset)')<1
  assert page.locator('.park-spin-hold-line').evaluate('e=>Number(getComputedStyle(e).opacity)')==1
  page.mouse.up()
  page.wait_for_function('spinCalls>=2',timeout=10000)  # the authorized first auto spin has started
  calls=page.evaluate('spinCalls');button.click()
  assert not page.evaluate('__fc.state.auto')
  assert page.locator('.park-spin-hold-line').evaluate('e=>Number(getComputedStyle(e).opacity)')==0
  page.wait_for_function('!__fc.cloudBusy()&&!__fc.state.balPending',timeout=20000)
  assert page.evaluate('spinCalls')==calls
  # Sliding off cancels the gesture and restores the cap without charging.
  page.mouse.move(x,y);page.mouse.down();page.wait_for_timeout(90)
  button.screenshot(path=f'work/preview-spin-mechanical-down-{mode}.png')
  page.mouse.move(1,120);page.mouse.up();page.wait_for_timeout(330)
  assert page.evaluate('spinCalls')==calls
  assert not page.locator('[data-spin-btn]').get_attribute('data-tactile-held')
  button.screenshot(path=f'work/preview-spin-mechanical-rest-{mode}.png')
  assert page.locator('.park-circus-scene').evaluate('e=>e.scrollLeft')==0
  assert page.locator('.park-circus-stage').bounding_box()['x']>=-1
  page.screenshot(path=f'work/preview-spin-mechanical-screen-{mode}.png')
  assert not errors,errors
  print(json.dumps({'mode':mode,'quickTap':True,'fixedRim':True,'frontBefore':rest['front'],'frontPressed':down['front'],'nativeAuto':True,'cancelWithoutWager':True,'errors':errors}),flush=True)
  ctx.close()
 b.close()
