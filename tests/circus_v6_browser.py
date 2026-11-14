"""V6: archive redirects, six cash symbols, actual cedar collection, Tony/Tucker defenses and Ray stealing cedars."""
from helpers.daily_reward import collect_daily
from helpers.circus import draws_for_grid
from playwright.sync_api import sync_playwright
import os,json
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];missing=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
 def ready():
  page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
 page.goto(BASE+'/circus?demo=off');ready()
 assert page.evaluate('KingRicoCloud.slotVersion')==6
 assert page.locator('.kr-hud-park').count()==0
 page.locator('.park-pocket').click();page.get_by_role('dialog',name='Trevos de proteção').wait_for();page.get_by_role('button',name='ENTENDI').click()
 assert page.locator('.park-meter-goal .park-goal-cloud').count()==2
 assert page.locator('.park-basket [data-wheels]').inner_text()=='0/5'
 page.evaluate('KingRicoPreviewPicker()')
 picker=page.locator('#kr-preview-picker')
 picker.wait_for()
 picker_text=picker.inner_text()
 for label in ['Trevo','Good Luck (barra cheia)','Roleta (5 guardadas)']:
  assert label in picker_text,picker_text
 assert 'Cedro' not in picker_text and 'Happeach' not in picker_text,picker_text
 picker.get_by_role('button',name='FECHAR').click()
 page.evaluate('''values=>{const fetch=window.fetch;window.fetch=async(u,o)=>{const d=o?.body&&JSON.parse(o.body);if(d?.action!=='spin'||!values)return fetch(u,o);const q=values;values=null;const random=Math.random;let i=0;Math.random=()=>q[i++]??.99;try{return await fetch(u,o)}finally{Math.random=random}}}''',draws_for_grid([5,5,5,0,2,6,7,8,10]))
 page.locator('[data-spin-btn]').click()
 page.wait_for_function('__fc._parkMotionLog?.some(x=>x.type==="tickets:done")',timeout=20000)
 assert page.evaluate('KingRicoPark.state.cedros')==1
 assert page.locator('[data-tickets]').inner_text()=='1/5'
 page.screenshot(path='work/preview-cedar-collected.png')
 for kind,draw in [('tony',0),('tucker',.51)]:  # trevo NÃO defende o Ray (dono, 13/11)
  page.evaluate('''()=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.park.cedros=2;s.park.economyV6={version:1,rounds:0,wageredUnits:0,paidUnits:1000000,tigerUnits:0};const p=s.records.find(([k])=>k==='players/preview')[1];p.peaches=3;p.peachBank={count:3,units:3000};localStorage.setItem(k,JSON.stringify(s));}''')
  page.reload();ready()
  page.evaluate('''r=>{const fetch=window.fetch;window.fetch=async(u,o)=>{const d=o?.body&&JSON.parse(o.body);if(d?.action!=='spin')return fetch(u,o);const random=Math.random;Math.random=()=>r;try{return await fetch(u,o)}finally{Math.random=random}}}''',draw)
  before=page.evaluate('KingRicoCloud.player.balance');page.locator('[data-spin-btn]').click()
  page.locator('.park-defense-scene').wait_for(timeout=15000)
  assert 'Trevo da sorte te protegeu!' in page.locator('.park-defense-scene').inner_text()
  assert page.evaluate('__fc._cloudSpin.outcome.defense.against')==kind
  assert page.evaluate('KingRicoCloud.player.balance')==before-10
  assert page.evaluate('KingRicoCloud.player.peaches')==3
  page.screenshot(path='work/preview-cedar-defense-'+kind+'.png')
  page.locator('.park-defense-scene').wait_for(state='detached')
  assert page.locator('[data-tickets]').inner_text()=='1/5'
 # Ray: sem defesa; leva 1 a 2 dos 2 trevos guardados
 page.evaluate('''()=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.park.cedros=2;s.park.economyV6={version:1,rounds:0,wageredUnits:0,paidUnits:1000000,tigerUnits:0};localStorage.setItem(k,JSON.stringify(s));}''')
 page.reload();ready()
 page.evaluate('''r=>{const fetch=window.fetch;window.fetch=async(u,o)=>{const d=o?.body&&JSON.parse(o.body);if(d?.action!=='spin')return fetch(u,o);const random=Math.random;Math.random=()=>r;try{return await fetch(u,o)}finally{Math.random=random}}}''',.54)
 page.locator('[data-spin-btn]').click()
 page.wait_for_function('__fc._cloudSpin?.outcome?.ray',timeout=15000)
 ray=page.evaluate('__fc._cloudSpin.outcome')
 assert not ray.get('defense') and ray['ray']['before']==2 and 1<=ray['ray']['stolen']<=2,ray
 assert page.evaluate('KingRicoPark.state.cedros')==2-ray['ray']['stolen']
 page.screenshot(path='work/preview-ray-steals-cedars.png')
 for route in ['park','fingo','flying-clown','bounce']:  # penalty voltou: o controle abre esse jogo
  page.goto(BASE+'/'+route);ready();assert 'Fortune%20Circus.dc.html' in page.url
  assert page.locator('[data-ticket],.kr-hud-park').count()==0
 page.goto(BASE+'/circus?demo=cedar');ready()
 previous=page.evaluate('KingRicoPark.state.cedros||0');page.locator('[data-spin-btn]').click()
 page.wait_for_function('__fc._parkMotionLog?.some(x=>x.type==="tickets:done")',timeout=20000)
 assert page.evaluate('KingRicoPark.state.cedros')==min(5,previous+1)
 page.screenshot(path='work/preview-circus-v6.png')
 assert not errors and not missing,(errors,missing)
 print(json.dumps({'cloverCollection':True,'defense':['tony','tucker'],'rayStealsClovers':True,'archivedRoutes':True,'errors':errors,'missing':missing}))
 b.close()
