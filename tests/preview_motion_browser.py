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
  page.add_init_script('''window.motionQA=[];const animate=Element.prototype.animate;Element.prototype.animate=function(k,o){motionQA.push({cls:this.className,duration:o.duration});return animate.call(this,k,o)};''')
  def ready():
   page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")')
   assert page.evaluate('KingRicoCloud.uid')=='park-preview','Only the fictitious preview wallet is allowed'
   assert page.locator('script[src*="ui/park/client.js"]').count()==0,'Duplicate native UI controller'
  page.goto(BASE+'/circus');ready()
  if mode=='no-preference':
   audio=page.evaluate('''async()=>{
    const fc=__fc,ac=fc.ac,out=fc.out,gate=fc.gate;
    async function render(current,muted=false){
     const context=new OfflineAudioContext(1,22050,44100);
     fc.ac=()=>context;fc.out=()=>context.destination;fc.gate=()=>!muted;
     try{if(current)fc.sfxTicket(0);else fc.bell(1830,.18,.085);
      const buffer=await context.startRendering(),data=buffer.getChannelData(0);
      return {rms:Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length),peak:data.reduce((max,v)=>Math.max(max,Math.abs(v)),0)};
     }finally{fc.ac=ac;fc.out=out;fc.gate=gate;}
    }
    return {previous:await render(false),current:await render(true),muted:await render(true,true)};
   }''')
   assert audio['current']['rms']>audio['previous']['rms']*2,audio
   assert audio['current']['peak']<1 and audio['muted']['peak']==0,audio
  ticket_line=3 if mode=='no-preference' else 4
  ticket_cells=[0,4,8] if ticket_line==3 else [2,4,6]
  page.evaluate('''row=>{
   const fc=__fc,chime=fc.sfxTicket.bind(fc);window.ticketSounds=[];
   fc.sfxTicket=(i)=>{if(fc._parkTicketsPlaying)ticketSounds.push({count:fc._parkVisibleTickets,shown:document.querySelector('[data-tickets]').textContent});return chime(i);};
   const fetch=window.fetch;window.fetch=async(u,o)=>{const data=o?.body&&JSON.parse(o.body);if(data?.action!=='spin')return fetch(u,o);const random=Math.random;let draw=0;Math.random=()=>++draw===20?(row+.5)/5:.1;try{return await fetch(u,o);}finally{Math.random=random;}};
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
  assert [x['count'] for x in first['sounds']]==[before+1,before+2,before+3],first
  assert [int(x['shown']) for x in first['sounds']]==[before+1,before+2,before+3],first
  assert sum(x['cls']=='park-meter-fill' for x in first['anims'])==2,first
  page.evaluate('''()=>{const key='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(key));s.park.spins=9;localStorage.setItem(key,JSON.stringify(s));}''')
  page.reload();ready();page.get_by_role('button',name='Girar',exact=True).click()
  dialog=page.get_by_role('dialog',name='Roleta multiplicadora',exact=True);dialog.wait_for(timeout=30000)
  page.wait_for_timeout(1600);assert dialog.count()==1
  page.get_by_role('button',name='GIRAR ROLETA',exact=True).click()
  page.wait_for_timeout(150)
  a=page.locator('.park-wheel').evaluate('e=>getComputedStyle(e).transform')
  page.wait_for_timeout(150)
  z=page.locator('.park-wheel').evaluate('e=>getComputedStyle(e).transform');assert a!=z,(mode,a,z)
  page.screenshot(path='work/preview-wheel-'+mode+'.png')
  page.get_by_role('button',name='APLICAR',exact=False).wait_for(timeout=12000)
  assert page.evaluate('KingRicoCloud.park.wheel.result.multiplier')>=1
  assert not errors,errors
  assert not missing,missing
  print(json.dumps({'motion':mode,'singleCharge':True,'tickets':3,'ticketCells':ticket_cells,'arrivalSounds':len(first['sounds']),'wheelRotates':True,'errors':errors,'missing':missing}),flush=True)
  context.close()
 b.close()
