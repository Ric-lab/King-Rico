from helpers.daily_reward import collect_daily
"""Actual Circus animation for loose tickets and a committed vertical coin win."""
import os,json
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];missing=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
 page.goto(BASE+'/circus');page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")')
 assert page.evaluate('KingRicoCloud.uid')=='park-preview'
 collect_daily(page)
 page.evaluate('''()=>{
  const fetch=window.fetch;
  window.fetch=async(u,o)=>{
   const d=o?.body&&JSON.parse(o.body);if(d?.action!=='spin'||!window.columnDraws)return fetch(u,o);
   const values=window.columnDraws;window.columnDraws=null;let i=0;const random=Math.random;
   Math.random=()=>values[i++]??.99;
   try{return await fetch(u,o);}finally{Math.random=random;}
  };
 }''')
 balance=page.evaluate('KingRicoCloud.player.balance');tickets=page.evaluate('KingRicoCloud.park.tickets')
 weights=[3,30,20,8,12,5,4,3,2,2.4];total=sum(weights)
 def draws(grid,loose):
  values=[.99] # V4 exclusive Tony draw: skip it in ordinary/ticket scenarios.
  for symbol in grid:values.extend([.99,(sum(weights[:symbol])+weights[symbol]/2)/total])
  return values+[.99,loose,0,0]
 for count,loose in [(1,.1),(2,.4)]:
  page.wait_for_function('!__fc.cloudBusy()&&!__fc._parkMeterBusy&&!__fc.state.balPending')
  before=page.evaluate('KingRicoCloud.park.spins')
  page.evaluate('values=>{window.columnDraws=values;__fc._parkMotionLog=[]}',draws(list(range(9)),loose))
  page.get_by_role('button',name='Girar',exact=True).click()
  page.wait_for_function('n=>KingRicoCloud.park.spins===n+1',arg=before)
  page.wait_for_function('!__fc.state.spinning')
  assert page.evaluate('__fc._cloudSpin.outcome.grid.filter(x=>x===10).length')==count
  assert page.locator('[data-sym][data-park-ticket="true"]').count()==count
  assert page.evaluate('__fc._cloudSpin.outcome.ticketAward')==0
  assert page.evaluate('KingRicoCloud.park.tickets')==tickets
  assert not page.evaluate('__fc._parkMotionLog.some(x=>x.type==="tickets:start")')
  page.screenshot(path=f'work/preview-loose-tickets-{count}.png')
 page.wait_for_function('!__fc.cloudBusy()&&!__fc._parkMeterBusy&&!__fc.state.balPending')
 before=page.evaluate('KingRicoCloud.park.spins')
 page.evaluate('values=>{window.columnDraws=values}',draws([1,2,3,1,4,5,1,6,7],.99))
 page.get_by_role('button',name='Girar',exact=True).click()
 page.wait_for_function('n=>KingRicoCloud.park.spins===n+1',arg=before)
 page.wait_for_function('!__fc.state.spinning&&__fc.state.winLines.includes(5)')
 marker=page.locator('[data-payline="5"]');marker.wait_for()
 m=marker.bounding_box();symbol=page.locator('[data-sym="3"]').bounding_box()
 assert abs(m['x']+m['width']/2-symbol['x']-symbol['width']/2)<3,(m,symbol)
 assert page.evaluate('__fc._cloudSpin.outcome.res.win')==6
 page.screenshot(path='work/preview-column-prize.png')
 assert page.evaluate('KingRicoCloud.player.balance')==balance-30+6
 page.wait_for_function('!__fc.cloudBusy()&&!__fc.state.balPending&&!__fc._cfRun')
 assert page.evaluate('__fc.payoutSymbols().map(s=>s.pay)')==[4,.6,1,2.5,1.6,5,8,15,20,50]
 before_high=page.evaluate('KingRicoCloud.player.balance')
 page.evaluate("values=>{window.columnDraws=values;window.unexpectedFlight=false;new MutationObserver(records=>{for(const r of records)for(const e of r.addedNodes)if(e.classList?.contains('park-bigwin-flight'))window.unexpectedFlight=true;}).observe(document.body,{childList:true});__fc.setState({betIdx:9});}",draws([7,7,7,0,1,2,3,4,5],.99))
 page.get_by_role('button',name='Girar',exact=True).click()
 page.wait_for_function('KingRicoCloud.park.spins===4&&!__fc.state.spinning')
 page.wait_for_function('!__fc.cloudBusy()&&!__fc.state.balPending&&!__fc._cfRun',timeout=20000)
 assert page.evaluate('__fc._cloudSpin.outcome.res.win')==15000
 assert page.evaluate('KingRicoCloud.player.balance')==before_high-1000+15000
 assert not page.evaluate('unexpectedFlight'),'A large absolute amount below 20x must not trigger the flight'
 page.screenshot(path='work/preview-high-stake-no-bigwin.png')
 assert not errors and not missing,(errors,missing)
 print(json.dumps({'looseTickets':[1,2],'noFalseTicketCredit':True,'columnWin':6,'alignedMarker':True,'wallet':True,'errors':errors,'missing':missing}),flush=True)
 b.close()
