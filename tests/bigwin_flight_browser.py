from helpers.circus import PAYS,br_money
"""A committed tiered spin boards the pilot and reveals its existing win, exactly once."""
import os,json,math
from playwright.sync_api import sync_playwright
from helpers.daily_reward import collect_daily
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,mode,fail,space in [(390,'no-preference',False,False),(320,'reduce',False,False),(430,'no-preference',True,False),(390,'no-preference',False,True)]:
  context=b.new_context(viewport={'width':width,'height':844},reduced_motion=mode)
  page=context.new_page();errors=[];missing=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  page.add_init_script('''window.boardingPoses=[];new MutationObserver(records=>{for(const r of records){const e=r.target;if(e.classList?.contains('park-bigwin-jumper')&&e.dataset.pose&&boardingPoses.at(-1)!==e.dataset.pose)boardingPoses.push(e.dataset.pose);}}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-pose']});''')
  page.goto(BASE+('/circus?demo=spacewin' if space else '/circus?demo=bigwin'));page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")');collect_daily(page)
  assert page.evaluate('KingRicoCloud.uid')=='park-preview'
  initial=page.evaluate('KingRicoCloud.player.balance');prize=round(10*80*PAYS[3] if space else 10*PAYS[8],2);suffix=str(width)+('-space' if space else '')
  page.evaluate('''()=>{const fetch=window.fetch;window.flightRequests=[];window.fetch=(u,o)=>{const d=o?.body&&JSON.parse(o.body);if(d)flightRequests.push(d.action);return fetch(u,o);};}''')
  page.get_by_role('button',name='Girar',exact=True).click()
  flight=page.get_by_role('region',name='Voo do grande prêmio',exact=True);flight.wait_for()
  assert page.locator('[data-bigwin-modal]').evaluate('e=>getComputedStyle(e).visibility')=='hidden'
  assert flight.get_by_role('button').count()==0
  assert flight.locator('[data-flight-multiple]').count()==0
  assert page.evaluate('KingRicoCloud.player.balance')==initial-10+prize
  if fail:
   page.evaluate('document.querySelector(".park-bigwin-plane>img").dispatchEvent(new Event("error"))')
  else:
   page.wait_for_function('document.querySelector(".park-bigwin-flight")?.dataset.phase==="boarding"')
   page.wait_for_timeout(380)
   assert flight.locator('.park-bigwin-jumper').is_visible()
   page.screenshot(path=f'work/preview-bigwin-boarding-{suffix}.png')
   page.wait_for_function('document.querySelector(".park-bigwin-flight")?.dataset.phase==="climbing"')
   climb_started=page.evaluate('performance.now()')
   page.evaluate("""()=>{window.flightBackgroundFrames=[];const start=performance.now();function sample(){const e=document.querySelector('.park-bigwin-flight');if(!e||e.dataset.phase==='returning')return;const sky=e.querySelector('.park-bigwin-sky'),space=e.querySelector('.park-flight-space');flightBackgroundFrames.push({elapsed:performance.now()-start,sky:Number(getComputedStyle(sky).opacity),scene:Number(getComputedStyle(e).opacity),space:Number(getComputedStyle(space).opacity)});requestAnimationFrame(sample);}sample();}""")
   assert flight.locator('.park-bigwin-sky').evaluate('e=>getComputedStyle(e).maskImage')=='none'

   assert page.locator('.park-mascot').evaluate('e=>getComputedStyle(e).visibility')=='hidden','The old colored cloud must leave with the mascot'
   assert flight.locator('.park-bigwin-pilot').is_visible()
   assert flight.locator('.park-bigwin-pilot').evaluate('e=>parseFloat(getComputedStyle(e).width)/parseFloat(getComputedStyle(e.parentElement).width)')>.4
   assert flight.locator('.park-bigwin-pilot').get_attribute('data-pose')=='pilotSide'
   assert len(page.evaluate('boardingPoses'))>=9,'Celebration must continue before boarding'
   assert page.evaluate('boardingPoses.filter(p=>p!=="departure").slice(-5)')==['crouch2','cheerRise','cheer','cheerFall','pilotSide'],page.evaluate('boardingPoses')
   def sample():return page.evaluate('''()=>{const e=document.querySelector('.park-bigwin-plane'),r=e.getBoundingClientRect(),m=new DOMMatrix(getComputedStyle(e).transform);return {x:r.x,y:r.y,amount:document.querySelector('[data-flight-amount]').textContent,width:r.width,scale:Math.hypot(m.a,m.b),angle:Math.atan2(m.b,m.a)*180/Math.PI};}''')
   first=sample();page.wait_for_timeout(1200)
   scenery=flight.evaluate("""e=>{const s=getComputedStyle(e);return {far:parseFloat(s.getPropertyValue('--flight-cloud-y')),near:parseFloat(s.getPropertyValue('--flight-near-y')),atlas:getComputedStyle(e.querySelector('.park-bigwin-sky')).backgroundImage};}""")
   assert scenery['near']>scenery['far']>0 and 'flight-scenery-atlas.webp' in scenery['atlas'],scenery
   second=sample();assert second['y']<first['y'],[first,second]
   assert second['amount']!=first['amount']
   assert second['scale']<first['scale'],'The plane must recede as it climbs'
   assert second['angle']<-30,'The nose must point upwards'
   if mode!='reduce':
    alignment=flight.evaluate('''e=>{const plane=e.querySelector('.park-bigwin-plane'),s=getComputedStyle(plane),m=new DOMMatrix(s.transform),o=s.transformOrigin.split(' ').map(parseFloat),path=e.querySelector('.park-flight-trail-line'),end=path.getPointAtLength(path.getTotalLength());return Math.hypot(end.x-(m.e+o[0]),end.y-(m.f+o[1]));}''')
    assert alignment<1,'The curve must meet the middle of the airplane'
   halo=flight.locator('[data-flight-amount]').evaluate('''e=>{const s=getComputedStyle(e,'::before');return {width:parseFloat(s.width),height:parseFloat(s.height),animation:s.animationName};}''')
   assert abs(halo['width']-halo['height'])<1 and halo['width']>200
   assert halo['animation']==('none' if mode=='reduce' else 'parkFlightHalo')
   rotor=flight.locator('.park-propeller-rotor:not(.park-propeller-ghost)')
   assert rotor.count()==1
   assert 'plane-body-mask.svg' in flight.locator('.park-bigwin-plane>img').first.evaluate('e=>getComputedStyle(e).maskImage')
   if mode=='reduce':
    assert rotor.evaluate('e=>getComputedStyle(e).animationName')=='none'
   else:
    spin=rotor.evaluate('e=>{const a=e.getAnimations()[0];a.pause();a.currentTime=0;return {state:a.playState,duration:a.effect.getTiming().duration,transform:getComputedStyle(e).transform};}')
    assert spin['duration']==110
    if width==390 and not space:
     page.screenshot(path='work/preview-propeller-open.png')
    turn=rotor.evaluate('e=>{const a=e.getAnimations()[0];a.currentTime=27.5;return getComputedStyle(e).transform;}')
    assert turn!=spin['transform'],'Propeller blades must rotate independently of the airframe'
    if width==390 and not space:
     page.screenshot(path='work/preview-propeller-turn.png')
    rotor.evaluate('e=>e.getAnimations()[0].play()')
   page.screenshot(path=f'work/preview-bigwin-climbing-{suffix}.png')
   page.wait_for_function('document.querySelector(".park-bigwin-flight")?.dataset.phase==="result"')
   assert page.evaluate('performance.now()')-climb_started>(4300 if mode=='reduce' else 6500),'The flight must have time to breathe'
   composition=flight.evaluate('''e=>{const r=e.querySelector('.park-bigwin-plane').getBoundingClientRect(),a=e.querySelector('[data-flight-amount]'),m=e.querySelector('.park-bigwin-score>span'),v=a.getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth,amountSize:parseFloat(getComputedStyle(a).fontSize),multipleSize:parseFloat(getComputedStyle(m).fontSize),valueLeft:v.left,valueRight:v.right};}''')
   assert composition['left']>=0 and composition['right']<=width,composition
   assert composition['amountSize']>composition['multipleSize'] and composition['valueLeft']>=0 and composition['valueRight']<=width,composition
   assert flight.locator('.park-bigwin-plane').bounding_box()['width']<first['width']*.6
   assert flight.locator('[data-flight-amount]').inner_text()==('+'+br_money(prize))
   altitude=max(0,min(1,math.log(max(5,prize/10)/5,20)))
   assert flight.get_attribute('data-altitude')==('space' if altitude>.72 else 'stratosphere' if altitude>.3 else 'sky')
   assert float(flight.evaluate('e=>getComputedStyle(e).getPropertyValue("--flight-space")'))>(.99 if space else 0)

   frames=page.evaluate('flightBackgroundFrames.filter(f=>f.elapsed>1400)')
   assert len(frames)>10 and all(f['sky']>.999 and f['scene']>.999 for f in frames),'Background must remain opaque while counting'
   assert all(b['space']>=a['space']-.001 for a,b in zip(frames,frames[1:])),'Space must fade in continuously without reverting to sky'
   assert flight.locator('.park-propeller-rotor').first.evaluate('e=>!getComputedStyle(e).transform.startsWith("matrix3d")')
   page.screenshot(path=f'work/preview-bigwin-result-{suffix}.png')
  flight.wait_for(state='detached',timeout=18000)
  page.wait_for_function('!__fc._cfRun&&!__fc.cloudBusy()',timeout=15000)
  page.wait_for_function('document.querySelector("[data-kr-wallet-value]").textContent===KingRicoCloud.player.balance.toLocaleString("pt-BR",{maximumFractionDigits:2})')
  assert page.evaluate('KingRicoCloud.player.balance')==initial-10+prize
  assert page.evaluate('KingRicoCloud.park.spins')==1
  assert page.evaluate('flightRequests.filter(a=>a!=="settings")')==['spin']
  assert not page.locator('.park-circus-stage').evaluate('e=>!!e.closest("[inert]")')
  assert page.locator('.park-mascot').evaluate('e=>getComputedStyle(e).visibility')=='visible'
  assert page.locator('.park-mascot [data-k=body]').evaluate('e=>getComputedStyle(e).visibility')=='visible'
  assert not errors and not missing,{'errors':errors,'missing':missing}
  print(json.dumps({'width':width,'motion':mode,'imageFailure':fail,'pilotBoards':not fail,'multiple':200 if space else 20,'altitude':'space' if space else 'stratosphere','largerPilot':True,'oneSpinOnly':True,'wallet':True,'errors':errors,'missing':missing}),flush=True)
  context.close()
 b.close()
