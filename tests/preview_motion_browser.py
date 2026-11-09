from helpers.daily_reward import collect_daily
"""Preview-only regressions: one UI controller, liquid, tickets and bonus wheel.
Run after npm run build:preview, against a static/Hosting server via KING_RICO_TEST_URL.
"""
import json,os,time
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 for mode in ['no-preference','reduce']:
  context=b.new_context(viewport={'width':390,'height':844},reduced_motion=mode)
  page=context.new_page();errors=[];missing=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  page.add_init_script('''window.wheelTiming={};new MutationObserver(records=>{for(const r of records){const e=r.target;if(e.classList?.contains('park-wheel-machine')&&e.classList.contains('is-won')&&!wheelTiming.resultAt)wheelTiming.resultAt=performance.now();if(e.dataset?.hoist==='panning-game'&&!wheelTiming.headerAt)wheelTiming.headerAt=performance.now();if(e.dataset?.hoist==='returning'&&!wheelTiming.returnAt)wheelTiming.returnAt=performance.now();}}).observe(document,{subtree:true,attributes:true,attributeFilter:['class','data-hoist']});''')
  page.add_init_script('''window.motionQA=[];const animate=Element.prototype.animate;Element.prototype.animate=function(k,o){motionQA.push({cls:this.className,duration:o.duration});return animate.call(this,k,o)};''')
  def ready():
   page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")')
   assert page.evaluate('KingRicoCloud.uid')=='park-preview','Only the fictitious preview wallet is allowed'
   assert page.locator('script[src*="ui/park/client.js"]').count()==0,'Duplicate native UI controller'
   collect_daily(page)
  page.goto(BASE+'/circus');ready()
  rim=page.locator('.park-spin-iridescence')
  assert rim.evaluate('e=>getComputedStyle(e).display')=='none','Spin must keep its gold rim, without iridescence'
  assert page.locator('.park-spin-rim>img').get_attribute('src').endswith('spin-rim-gold-contour-v1.svg')
  assert page.locator('.park-spin-face').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(100, 12, 36)'
  assert page.locator('.park-spin-label').first.evaluate('e=>getComputedStyle(e).color')=='rgb(244, 201, 81)'
  page.get_by_role('button',name='Girar',exact=True).screenshot(path='work/preview-spin-wine-rest-'+mode+'.png')
  spin_box=page.locator('[data-spin-btn]').bounding_box()
  page.mouse.move(spin_box['x']+spin_box['width']/2,spin_box['y']+spin_box['height']/2);page.mouse.down()
  pulse=page.locator('.park-spin-rim-pulse').evaluate('e=>({opacity:Number(getComputedStyle(e).opacity),color:getComputedStyle(e).backgroundColor})')
  assert pulse['opacity']>.95 and pulse['color']=='rgb(255, 223, 112)',pulse
  assert page.evaluate("(()=>{const e=document.querySelector('.park-spin-rim-pulse'),a=e.getAnimations()[0];__fc.lightsPulse();return e.getAnimations()[0]===a})()"),'Do not restart the rim on the later electric pulse'
  page.wait_for_timeout(90)
  page.get_by_role('button',name='Girar',exact=True).screenshot(path='work/preview-spin-wine-down-'+mode+'.png')
  page.mouse.move(1,120);page.mouse.up()
  page.evaluate("document.querySelector('.park-spin-rim-pulse').getAnimations()[0]?.finish();__fc._parkPulse=null")
  assert page.locator('.park-spin-rim-pulse').evaluate('e=>Number(getComputedStyle(e).opacity)')==0
  if os.environ.get('KING_RICO_PALETTE_ONLY'):
   assert not errors and not missing,(errors,missing)
   page.screenshot(path='work/preview-circus-screen-'+mode+'.png')
   context.close();continue
  if mode=='no-preference':
   audio=page.evaluate('''async()=>{
    const fc=__fc,ac=fc.ac,out=fc.out,gate=fc.gate;
    async function render(current,muted=false,index=0){
     const context=new OfflineAudioContext(1,66150,44100),voices=[],create=context.createOscillator.bind(context);
     context.createOscillator=()=>{const voice=create();voices.push(voice);return voice;};
     fc.ac=()=>context;fc.out=()=>context.destination;fc.gate=()=>!muted;
     try{if(current)fc.sfxTicket(index);else fc.bell(1830,.18,.085);
      const buffer=await context.startRendering(),data=buffer.getChannelData(0);
      return {attackRms:Math.sqrt(data.slice(441,2646).reduce((sum,v)=>sum+v*v,0)/2205),decayRms:Math.sqrt(data.slice(11025,13230).reduce((sum,v)=>sum+v*v,0)/2205),voices:voices.length,frequencies:voices.map(v=>v.frequency.value),tailRms:Math.sqrt(data.slice(22050,26460).reduce((sum,v)=>sum+v*v,0)/4410),rms:Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length),peak:data.reduce((max,v)=>Math.max(max,Math.abs(v)),0)};
     }finally{fc.ac=ac;fc.out=out;fc.gate=gate;}
    }
    return {previous:await render(false),current:await render(true),second:await render(true,false,1),third:await render(true,false,2),muted:await render(true,true)};
   }''')
   assert audio['current']['rms']>audio['previous']['rms']*2,audio
   assert audio['current']['peak']<1 and audio['muted']['peak']==0,audio
   assert audio['current']['voices']==1 and audio['muted']['voices']==0,audio
   assert audio['current']['tailRms']>.0003,audio
   for note,frequency in zip([audio['current'],audio['second'],audio['third']],[523.25,659.25,783.99]):
    assert note['voices']==1 and abs(note['frequencies'][0]-frequency)<.1 and note['tailRms']>.0003 and note['peak']<1,audio
    assert note['attackRms']>note['decayRms']*2,audio
  ticket_line=6 if mode=='no-preference' else 4
  ticket_cells=[1,4,7] if ticket_line==6 else [2,4,6]
  page.evaluate('''row=>{
   const fc=__fc,chime=fc.sfxTicket.bind(fc);window.ticketSounds=[];
   fc.sfxTicket=(i)=>{if(fc._parkTicketsPlaying){const node=document.querySelectorAll('.park-flying-ticket')[i],r=node.getBoundingClientRect(),target=document.querySelector('[data-tickets]').getBoundingClientRect();ticketSounds.push({at:performance.now(),count:fc._parkVisibleTickets,shown:document.querySelector('[data-tickets]').textContent,visibleFlights:[...document.querySelectorAll('.park-flying-ticket')].filter(n=>Number(getComputedStyle(n).opacity)>.1).length,opacity:Number(getComputedStyle(node).opacity),distance:Math.hypot(r.x+r.width/2-target.x-target.width/2,r.y+r.height/2-target.y-target.height/2)});}return chime(i);};
   // V4 samples the exclusive Tony event before the 18 ordinary symbol draws.
   const fetch=window.fetch;window.fetch=async(u,o)=>{const data=o?.body&&JSON.parse(o.body);if(data?.action!=='spin')return fetch(u,o);const random=Math.random;let draw=0;Math.random=()=>++draw===21?(row+.5)/8:.1;try{return await fetch(u,o);}finally{Math.random=random;}};
  }''',ticket_line)
  before=page.evaluate('KingRicoCloud.park.tickets')
  page.get_by_role('button',name='Girar',exact=True).click()
  page.wait_for_function('__fc._parkMotionLog?.some(x=>x.type==="charge:arrived")')
  page.screenshot(path='work/preview-liquid-'+mode+'.png')
  deadline=time.monotonic()+25
  while time.monotonic()<deadline:
   if page.evaluate('__fc._parkMotionLog?.some(x=>x.type==="tickets:done")'):break
   if page.evaluate('__fc.state.showWin'):page.evaluate('__fc.dismissWin()')
   page.wait_for_timeout(150)
  else:raise AssertionError(page.evaluate('({hint:__fc.state.hint,log:__fc._parkMotionLog})'))
  first=page.evaluate('({log:__fc._parkMotionLog,sounds:ticketSounds,anims:motionQA,tickets:__fc._parkVisibleTickets,spins:KingRicoCloud.park.spins})')
  assert sum(x['type']=='charge:done' for x in first['log'])==1,first
  assert sum(x['type']=='tickets:done' for x in first['log'])==1,first
  assert first['spins']==1 and first['tickets']==before+3,first
  assert page.evaluate('__fc._cloudSpin.outcome.grid.flatMap((v,i)=>v===10?[i]:[])')==ticket_cells
  assert page.locator('.park-reels [data-sym][data-park-ticket="true"]').evaluate_all('nodes=>nodes.map(n=>Number(n.dataset.sym))')==ticket_cells
  page.screenshot(path='work/preview-tickets-'+mode+'.png')
  assert not page.locator('.park-circus-rails').evaluate('e=>e.classList.contains("has-lit-goals")'),'Goal must not latch before red'
  assert [x['count'] for x in first['sounds']]==[before+1,before+2,before+3],first
  assert [int(x['shown']) for x in first['sounds']]==[before+1,before+2,before+3],first
  assert all(x['opacity']>.5 and x['distance']<3 and x['visibleFlights']==1 for x in first['sounds']),first
  arrivals=[x['at'] for x in first['sounds']]
  expected=620 if mode=='no-preference' else 400
  assert all(expected-65<b-a<expected+65 for a,b in zip(arrivals,arrivals[1:])),first
  assert sum(x['cls']=='park-meter-fill' for x in first['anims'])==2,first
  page.evaluate('''()=>{const key='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(key));s.park.spins=9;localStorage.setItem(key,JSON.stringify(s));}''')
  page.reload();ready();rest_y=page.locator('[data-spin-btn]').bounding_box()['y'];page.get_by_role('button',name='Girar',exact=True).click()
  dialog=page.get_by_role('region',name='Roleta multiplicadora',exact=True);dialog.wait_for(timeout=30000)
  if mode=='no-preference':
   page.wait_for_timeout(300)
   assert page.locator('.park-hoist-deck').get_attribute('data-hoist')=='rigging'
   page.screenshot(path='work/preview-ropes-arrival.png')
   goal=page.locator('.park-meter-goal').first
   assert goal.evaluate('e=>getComputedStyle(e).filter')=='brightness(1.22)'
   assert goal.evaluate('e=>getComputedStyle(e).animationIterationCount')=='infinite'
   page.wait_for_timeout(600)
   assert goal.evaluate('e=>getComputedStyle(e).filter')=='brightness(1.22)'
   page.wait_for_function('document.querySelector(".park-hoist-deck")?.dataset.hoist==="lifting"')
   page.wait_for_timeout(350);page.screenshot(path='work/preview-hoist-lifting.png')
  page.wait_for_function('document.querySelector(".park-hoist-deck")?.dataset.hoist==="wheel"',timeout=10000);assert dialog.count()==1
  assert page.locator('.park-modal').count()==0,'Bonus must use the real stage, not a modal'
  assert page.locator('.park-hoist-deck').get_attribute('data-hoist')=='wheel'
  assert page.locator('.park-reels').evaluate('e=>getComputedStyle(e).visibility')=='hidden'
  assert page.locator('.kr-hud-row').evaluate('e=>e.getBoundingClientRect().top')>=0
  if mode=='no-preference':
   # A pending bonus must rebuild the same scene after refresh.
   page.reload();ready();page.get_by_role('region',name='Roleta multiplicadora',exact=True).wait_for()
   page.wait_for_function('document.querySelector(".park-hoist-deck")?.dataset.hoist==="wheel"',timeout=10000)
  if mode=='no-preference':
   box=page.locator('.park-wheel-machine').bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2;r=box['width']*.32
   page.mouse.move(cx+r,cy);page.mouse.down();page.mouse.move(cx+r*.7,cy-r*.7,steps=5);page.mouse.move(cx,cy-r,steps=5);page.mouse.up()
  else:page.get_by_role('button',name='GIRAR ROLETA',exact=True).click()
  page.wait_for_timeout(150)
  a=page.locator('.park-wheel').evaluate('e=>getComputedStyle(e).transform')
  page.wait_for_timeout(150)
  z=page.locator('.park-wheel').evaluate('e=>getComputedStyle(e).transform');assert a!=z,(mode,a,z)
  page.screenshot(path='work/preview-wheel-'+mode+'.png')
  page.locator('.park-wheel-machine.is-won').wait_for(timeout=12000)
  assert page.locator('.park-wheel-wrap').evaluate('e=>e.clientWidth')==374
  hub=page.locator('.park-wheel-hub strong').bounding_box();hub_center=(hub['x']+hub['width']/2,hub['y']+hub['height']/2)
  if mode=='no-preference':assert page.locator('.park-wheel-hub strong').evaluate('e=>getComputedStyle(e).animationName')=='parkMultiplierBeat'
  assert page.evaluate('KingRicoCloud.park.wheel.result.multiplier')>=1
  assert page.get_by_role('button',name='APLICAR',exact=False).count()==0
  assert page.locator('[data-wheel-spin]').is_hidden()
  assert page.locator('.park-confetti').count()==0,'Removed bonus confetti must not return'
  page.screenshot(path='work/preview-wheel-result-'+mode+'.png')
  page.wait_for_function('window.wheelTiming.headerAt',timeout=10000)
  timing=page.evaluate('wheelTiming')
  assert timing['headerAt']-timing['resultAt']>=3500,timing
  cabinet=page.locator('[data-spin-btn]');x1=cabinet.evaluate('e=>e.getBoundingClientRect().left')
  page.wait_for_timeout(550 if mode=='no-preference' else 260)
  x2=cabinet.evaluate('e=>e.getBoundingClientRect().left')
  assert x2<x1-10,(mode,x1,x2,'Ready game must enter from the right')
  token=page.locator('.park-flying-multiplier').bounding_box()
  assert token and token['x']+token['width']/2>hub_center[0]+8,(token,hub_center,'Multiplier must travel right')
  assert page.locator('.park-reels').evaluate('e=>getComputedStyle(e).visibility')=='visible'
  page.screenshot(path='work/preview-game-from-right-'+mode+'.png')
  page.wait_for_function('!__fc._parkWheelVisible&&!__fc._parkCollecting&&!__fc.state.balPending',timeout=20000)
  page.wait_for_timeout(650)
  origin=page.evaluate('__fc._parkMotionLog.find(x=>x.type==="multiplier:start")')
  assert abs(origin['originX']-hub_center[0])<3 and abs(origin['originY']-hub_center[1])<3,origin
  assert page.locator('.park-flying-multiplier').count()==0
  assert page.locator('.park-hoist-rig,.park-wheel-scene,.park-hoisted-item').count()==0,'Cabinet must return before payout completes'
  assert not page.locator('[data-spin-btn]').evaluate('e=>e.inert')
  paint=page.locator('[data-spin-btn]').evaluate("""e=>({level:__fc._parkMeterLevel,colors:['face','edge','rear'].map(n=>getComputedStyle(e.querySelector('.park-spin-'+n)).backgroundColor)})""")
  assert paint['level']==0 and paint['colors']==['rgb(100, 12, 36)']*3,paint
  def geometry():
   return page.locator('[data-spin-btn]').evaluate("""e=>{const r=n=>e.querySelector('.park-spin-'+n).getBoundingClientRect();return {rear:r('face').top-r('rear').top,front:r('edge').bottom-r('face').bottom}}""")
  # The gold rim's inner top is 7/78 of the SVG height; rear must stay below it.
  clearance=page.locator('[data-spin-btn]').evaluate("e=>{const b=e.getBoundingClientRect(),r=e.querySelector('.park-spin-rear').getBoundingClientRect();return (r.top-b.top)/b.height-7/78}")
  assert clearance>0,clearance
  sides=page.locator('[data-spin-btn]').evaluate("""e=>{const b=e.getBoundingClientRect(),body=e.querySelector('.park-spin-edge').getBoundingClientRect(),face=e.querySelector('.park-spin-face').getBoundingClientRect(),scale=b.width/373;return {body:(body.left-b.left)/scale,lip:(face.left-body.left)/scale}}""")
  assert sides['body']<=8.1 and 1.8<sides['lip']<2.2,sides
  rest=geometry()
  assert rest['rear']<-2 and rest['front']>5 and 1.8<rest['front']/-rest['rear']<2.2,rest
  page.get_by_role('button',name='Girar',exact=True).screenshot(path='work/preview-spin-rest-'+mode+'.png')
  page.evaluate('__fc._spinTouchDown()');page.wait_for_timeout(480)
  down=geometry()
  assert abs(down['rear'])<.5 and abs(down['front'])<.5,down
  page.get_by_role('button',name='Girar',exact=True).screenshot(path='work/preview-spin-down-'+mode+'.png')
  page.evaluate('__fc._spinTouchUp()');page.wait_for_timeout(250)
  assert abs(geometry()['front']-rest['front'])<.5
  assert not errors,errors
  assert not missing,missing
  print(json.dumps({'motion':mode,'singleCharge':True,'tickets':3,'ticketCells':ticket_cells,'arrivalSounds':len(first['sounds']),'spacingMs':[round(b-a) for a,b in zip(arrivals,arrivals[1:])],'contactDistance':round(max(x['distance'] for x in first['sounds']),2),'wheelRotates':True,'errors':errors,'missing':missing}),flush=True)
  context.close()
 b.close()
