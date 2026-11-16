"""Special-symbol presentation: gold clovers and sequential full-length wheel dances."""
from helpers.daily_reward import collect_daily
from helpers.circus import draws_for_grid
from playwright.sync_api import sync_playwright
import os,json
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
stage=os.environ.get('KING_RICO_SPECIAL_STAGE','all');os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];missing=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
 def ready(demo='off',reset=True):
  if reset:
   page.goto(BASE+'/circus?demo=off');page.evaluate('localStorage.clear()')
  page.goto(BASE+'/circus?demo='+demo);page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
 if stage in ['all','clover']:
  ready('cedar');page.locator('[data-spin-btn]').click()
  page.wait_for_function('__fc._parkCloverCelebrating&&__fc.state.winLines.length>0&&__fc.state.winDim',timeout=15000)
  page.wait_for_timeout(300);assert page.locator('[data-payline]').count()>0
  page.screenshot(path='work/special-clover-gold.png')
  page.wait_for_function('__fc._parkMotionLog?.some(x=>x.type==="tickets:done")',timeout=15000)
  assert page.locator('[data-tickets]').inner_text()=='1/5'
  print('clover gold/celebration/count PASS',flush=True)
 if stage in ['all','wheel']:
  ready()
  page.evaluate('''values=>{const fc=__fc,win=fc.sfxWin.bind(fc);window.cashJingles=0;fc.sfxWin=(...a)=>{cashJingles++;return win(...a)};const fetch=window.fetch;let pending=true;window.fetch=async(u,o)=>{const d=o?.body&&JSON.parse(o.body);if(!pending||d?.action!=='spin')return fetch(u,o);pending=false;const random=Math.random;let i=0;Math.random=()=>values[i++]??.99;try{return await fetch(u,o)}finally{Math.random=random}};}''',draws_for_grid([11,11,0,10,10,10,6,7,8]))
  page.locator('[data-spin-btn]').click()
  page.wait_for_function('__fc._wheelDanceLog?.length===2',timeout=20000)
  starts=page.evaluate('__fc._wheelDanceLog');assert starts[1]['start']-starts[0]['start']>=3200,starts
  assert page.evaluate('cashJingles')==0
  page.wait_for_function('document.querySelector("[data-wheels]").textContent==="2/5"',timeout=10000)
  print(json.dumps({'wheels':2,'spacing':starts[1]['start']-starts[0]['start'],'cashJingles':0}),flush=True)
  ready()
  page.evaluate("""values=>{const fetch=window.fetch;window.fetch=async(u,o)=>{if(o?.body&&JSON.parse(o.body).action==='spin'){const r=Math.random;let i=0;Math.random=()=>values[i++]??.99;try{return await fetch(u,o)}finally{Math.random=r}}return fetch(u,o)}}""",draws_for_grid([5,5,5,11,0,11,10,10,10]))
  page.locator('[data-spin-btn]').click()
  page.wait_for_function('__fc._parkMotionLog?.some(x=>x.type==="clover:celebrate")',timeout=20000)
  assert page.evaluate('performance.now()>=__fc._wheelAudioUntil')
  page.wait_for_function('__fc._parkMotionLog?.some(x=>x.type==="tickets:done")',timeout=20000)
  assert page.locator('[data-tickets]').inner_text()=='1/5'
  print('combined wheel/clover celebrations serialized PASS',flush=True)

 if stage in ['all','defense']:
  ready();page.evaluate("""()=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.park.cedros=1;s.park.economyV6={version:1,rounds:0,wageredUnits:0,paidUnits:1000000,tigerUnits:0};localStorage.setItem(k,JSON.stringify(s));}""")
  ready(reset=False)
  page.evaluate("""()=>{const fetch=window.fetch;window.fetch=async(u,o)=>{const d=o?.body&&JSON.parse(o.body);if(d?.action!=='spin')return fetch(u,o);const random=Math.random;Math.random=()=>0;try{return await fetch(u,o)}finally{Math.random=random}};}""")
  before=page.evaluate('KingRicoCloud.player.balance');page.locator('[data-spin-btn]').click()
  page.locator('.park-defense-scene[data-phase=warning]').wait_for(timeout=15000)
  assert page.locator('.park-defense-caption').count()==0
  assert page.evaluate('__fc.state.grid.filter(s=>s===12).length')==3
  page.wait_for_timeout(1050);page.screenshot(path='work/special-clover-defense-flight.png')
  page.locator('.park-defense-scene[data-phase=impact]').wait_for()
  page.wait_for_timeout(140)
  assert page.evaluate('__fc.state.grid.filter(s=>s===12).length')==2
  assert page.evaluate('KingRicoCloud.player.balance')==before-10+page.evaluate('__fc._cloudSpin.outcome.res.win')
  assert page.evaluate('__fc._cloudSpin.outcome.res.win')>0
  page.screenshot(path='work/special-clover-defense-replacement.png')
  page.locator('.park-defense-scene').wait_for(state='detached')
  assert page.evaluate('KingRicoPark.state.economyV6.rounds')==1
  assert page.locator('[data-tickets]').inner_text()=='0/5'
  assert page.locator('.park-tony-scene').count()==0
  print('clover defense: center replacement, real prize, one paid spin PASS',flush=True)
 if stage in ['all','scatter']:
  for demo,count in [('villain-one',1),('villain-pair',2)]:
   ready(demo);page.locator('[data-spin-btn]').click()
   page.wait_for_function('__fc._cloudSpin&&!__fc.state.spinning',timeout=15000)
   x=page.evaluate('__fc._cloudSpin.outcome')
   assert sum(12<=n<=14 for n in x['grid'])==count,x['grid']
   assert not x.get('tony') and not x.get('tucker') and not x.get('ray')
   page.screenshot(path='work/special-'+demo+'.png')
  print('villain singles/pairs without unbacked attacks PASS',flush=True)
 if stage in ['all','goodluck']:
  ready()
  page.evaluate("""()=>{window.baseSpinCalls=0;window.reelStarts=[];const r=__fc.reelsStart.bind(__fc);__fc.reelsStart=(...a)=>{reelStarts.push({feature:!!__fc.state.feature});return r(...a)};const fetch=window.fetch;window.fetch=(u,o)=>{const d=o?.body&&JSON.parse(o.body);if(d?.action==='spin')baseSpinCalls++;return fetch(u,o)};Math.random=()=>.99;KingRicoPreviewPicker();}""")
  page.locator('#kr-preview-picker').get_by_role('button',name='Good Luck (barra cheia)').click()
  page.locator('[data-spin-btn]').click()
  page.wait_for_function('__fc._parkMotionLog?.some(x=>x.type==="goodluck:entry")',timeout=15000)
  assert page.evaluate('reelStarts.length')==0
  assert page.locator('.park-goal-cloud').count()==0
  page.wait_for_function('__fc._goodLuckEnergyLog?.length>=1',timeout=15000)
  page.wait_for_timeout(80);assert page.locator('[data-spin-btn]').get_attribute('data-tactile-held')=='1'
  page.screenshot(path='work/special-goodluck-click.png')
  page.wait_for_function('__fc._goodLuckEnergyLog?.length===5',timeout=45000)
  energy=page.evaluate('__fc._goodLuckEnergyLog');assert [r['to'] for r in energy]==[8,6,4,2,0],energy
  assert len(set(r['color'] for r in energy))==5,energy
  assert page.locator('.park-goodluck-bolt').count()==0
  assert page.evaluate('reelStarts.every(r=>r.feature)&&baseSpinCalls===1')
  page.wait_for_function('!__fc.state.feature',timeout=20000)
  assert abs(page.evaluate('__fc.state.winAmount')-page.evaluate('__fc._cloudSpin.outcome.winUnits/100'))<.005
  print(json.dumps({'directGoodLuck':True,'charges':energy,'paidSpinCalls':1}),flush=True)
 if stage in ['all','free']:
  ready()
  page.evaluate("""()=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.park.cedros=5;localStorage.setItem(k,JSON.stringify(s));}""")
  ready(reset=False)
  page.evaluate("""queues=>{window.freeCalls=[];const fetch=window.fetch;window.fetch=async(u,o)=>{if(o?.body&&JSON.parse(o.body).action==='spin'){const old=Math.random;let values=queues.shift()||[],i=0;Math.random=()=>values[i++]??.99;try{const r=await fetch(u,o);freeCalls.push(await r.clone().json());return r;}finally{Math.random=old}}return fetch(u,o)}}""",[draws_for_grid([5,5,5,0,2,6,7,8,10]),draws_for_grid([10,10,10,0,2,6,7,8,10])])
  before=page.evaluate('KingRicoCloud.player.balance');page.locator('[data-spin-btn]').click()
  page.locator('.park-free-clover-flight').wait_for(timeout=15000)
  assert page.evaluate('freeCalls.length')==1,'Free request must wait for the clover to land'
  page.wait_for_timeout(500);page.screenshot(path='work/special-free-clover-flight.png')
  page.wait_for_function('freeCalls.length===2',timeout=25000)
  flight=page.evaluate('__fc._parkMotionLog.filter(x=>x.type.startsWith("free-clover:"))')
  assert [x['type'] for x in flight]==['free-clover:start','free-clover:impact']
  assert flight[1]['at']-flight[0]['at']>=900,flight
  assert page.locator('.park-free-spin-caption').count()==0
  calls=page.evaluate('freeCalls');assert calls[0]['outcome']['freeSpinAward'] and calls[1].get('outcome',{}).get('freeSpin'),calls
  assert calls[1]['balanceBefore']==calls[1]['balanceDebited']
  assert page.evaluate('KingRicoCloud.player.balance')==before-10+4
  assert page.evaluate('KingRicoPark.state.economyV6.wageredUnits')==1000
  page.wait_for_timeout(3500);assert page.evaluate('freeCalls.length')==2
  print('full clovers: automatic bet-locked spin without second debit PASS',flush=True)
 if stage in ['all','auto-flight']:
  page.add_init_script("""if(new URLSearchParams(location.search).has('directFreeTest')){const si=window.setInterval;window.setInterval=(f,t,...a)=>t===250?0:si(f,t,...a);}""")
  ready('off&directFreeTest=1')
  page.evaluate("""()=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.park.cloverFreeBetUnits=1000;s.park.cloverFreeSpinId=crypto.randomUUID();localStorage.setItem(k,JSON.stringify(s));}""")
  ready('off&directFreeTest=1',reset=False)
  page.evaluate('Math.random=()=>.99;__fc.doSpin()')
  page.wait_for_function('__fc._parkFreeCloverFlying||__fc._parkMotionLog?.some(x=>x.type==="free-clover:impact")',timeout=10000)
  page.wait_for_function('__fc._cloudSpin?.outcome?.freeSpin',timeout=15000)
  events=page.evaluate('__fc._parkMotionLog.filter(x=>x.type.startsWith("free-clover:"))')
  assert [e['type'] for e in events]==['free-clover:start','free-clover:impact'],events
  assert page.evaluate('KingRicoPark.state.economyV6.wageredUnits')==0
  print('automatic doSpin entry waits for the clover contact PASS',flush=True)
 if stage in ['all','preset']:
  ready('full-clover');page.locator('[data-spin-btn]').click()
  page.wait_for_function('__fc._cloudSpin?.outcome?.freeSpinAward',timeout=15000)
  page.evaluate('Math.random=()=>.99')
  page.wait_for_function('__fc._cloudSpin?.outcome?.freeSpin',timeout=15000)
  assert page.evaluate('KingRicoPark.state.economyV6.wageredUnits')==1000
  print('full-clover preview picker preset PASS',flush=True)
 if stage in ['all','highlights']:
  ready('ticket');page.locator('[data-spin-btn]').click()
  page.wait_for_function('!__fc.state.spinning&&__fc.state.winLines.includes(0)',timeout=15000)
  assert page.locator('[data-payline="0"]').count()==1
  page.wait_for_function('!__fc.cloudBusy()',timeout=20000)
  # Reproduce retained previous-win fields with a different, losing visible grid.
  page.evaluate('__fc.setState({grid:[0,2,6,7,8,10,2,6,0],winCells:[0,1,2],winLines:[0],winCalm:false,lineGone:false})')
  for n in range(3):
   page.wait_for_timeout(200)
   assert page.locator('.park-part-reel-top .park-win-fx,[data-payline="0"]').count()==0
   assert page.locator('.park-part-reel-top').evaluate_all('es=>es.every(e=>e.getAnimations({subtree:true}).length===0)')
  page.screenshot(path='work/special-no-false-first-row.png')
  page.evaluate('__fc.setState({grid:[10,10,10,0,2,6,7,8,0],winCells:[0,1,2],winLines:[0],winCalm:false,lineGone:false})')
  page.wait_for_function('document.querySelectorAll(".park-part-reel-top .park-win-fx").length===3')
  page.evaluate('__fc.setState({queued:true})')
  page.wait_for_function('document.querySelectorAll(".park-part-reel-top .park-win-fx").length===0')
  print('first-row highlight requires a matching paid/special line and stops on next spin PASS',flush=True)
 if stage in ['all','counters']:
  ready()
  for selector,number in [('.park-pocket','[data-tickets]'),('.park-basket','[data-wheels]')]:
   icon=page.locator(selector+' .park-ticket-wallet-art').bounding_box();count=page.locator(selector+' '+number).bounding_box()
   assert icon['y']+icon['height']+2<count['y'],(icon,count)
   assert abs(icon['x']+icon['width']/2-count['x']-count['width']/2)<2,(icon,count)
  page.screenshot(path='work/special-stacked-powerups.png')
  print('power-ups icon/quantity vertical with whitespace PASS',flush=True)
 assert not errors and not missing,(errors,missing)
 b.close()
