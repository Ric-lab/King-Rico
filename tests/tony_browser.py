from helpers.daily_reward import collect_daily
import os,json
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 for mode in ['no-preference','reduce']:
  ctx=b.new_context(viewport={'width':390,'height':844},reduced_motion=mode)
  page=ctx.new_page();errors=[];missing=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  page.goto(BASE+'/circus?demo=tony');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  page.evaluate('''()=>{window.tonyQA=[];const ss=__fc.setState.bind(__fc);__fc.setState=(s,...a)=>{if(__fc._tonyPlaying&&s&&typeof s==='object'&&'balance'in s)tonyQA.push({at:performance.now(),balance:s.balance});return ss(s,...a)};window.soundQA=[];const burst=__fc.burst.bind(__fc);__fc.burst=(...a)=>{if(__fc._tonyPlaying)soundQA.push(performance.now());return burst(...a)};}''')
  before=page.evaluate('KingRicoCloud.player.balance');page.locator('[data-spin-btn]').click()
  page.locator('.park-tony-scene').wait_for(timeout=15000)
  page.wait_for_function('document.querySelector(".park-tony-scene")?.dataset.hit==="1"')
  page.wait_for_timeout(400)
  assert page.locator('[data-park-tony="true"]').count()==3
  assert page.locator('.park-tony-lines ellipse').count()==3
  assert page.locator('.kr-hud-balance.is-tony-hit').count()==1
  assert page.evaluate('getComputedStyle(document.querySelector("[data-park-tony=true]")).backgroundImage.includes("assets/tony/head.webp")')
  page.screenshot(path=f'work/preview-tony-hit-{mode}.png')
  page.get_by_role('dialog',name='Tony roubou moedas',exact=True).wait_for(timeout=10000)
  receipt=page.evaluate('__fc._cloudSpin');event=receipt['outcome']['tony'];end=receipt['balanceDebited']-event['stolenUnits']/100
  assert receipt['outcome']['winUnits']==0 and receipt['outcome']['ticketAward']==0
  assert page.evaluate('KingRicoCloud.player.balance')==end
  hits=page.evaluate('tonyQA');assert len(hits)==3,hits
  for i,h in enumerate(hits):
   assert abs(h['balance']-(receipt['balanceDebited']-sum(event['hits'][:i+1])/100))<.001
   if i:assert h['at']-hits[i-1]['at']>=1400
  assert len(page.evaluate('soundQA'))==3
  page.screenshot(path=f'work/preview-tony-result-{mode}.png')
  page.get_by_role('button',name='CONTINUAR',exact=True).click();assert page.locator('.park-tony-scene').count()==0
  assert page.evaluate('__fc.balance()')==end
  # Replay the committed request via the same local endpoint; no second charge.
  replay=page.evaluate('''async()=>{const saved=JSON.parse(localStorage.getItem('kingRico.parque.mobile-preview.v1'));const [id,op]=saved.once.find(([id,o])=>o.result.outcome?.tony);const r=await fetch('/api/play',{method:'POST',body:JSON.stringify({...JSON.parse(op.fingerprint),requestId:id})});return r.json()}''')
  assert replay['replayed'] and replay['player']['balance']==end
  # New view observes the committed balance, not a partially presented balance.
  page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  assert page.locator('.park-tony-scene').count()==0
  assert page.evaluate('KingRicoCloud.player.balance')==end+50
  # Interrupt between pats; the authoritative debit has already committed once.
  if mode=='reduce':
   page.evaluate('''()=>{const animate=Element.prototype.animate;Element.prototype.animate=function(...args){if(this.classList.contains('park-tony-claws')||this.classList.contains('park-tony-loss'))throw Error('Simulated animation failure');return animate.apply(this,args)}}''')
  page.locator('[data-spin-btn]').click()
  page.wait_for_function('document.querySelector(".park-tony-scene")?.dataset.hit==="1"',timeout=15000)
  committed=page.evaluate('KingRicoCloud.player.balance')
  assert page.evaluate('__fc.balance()')>committed
  page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  assert page.evaluate('KingRicoCloud.player.balance')==committed+50
  assert page.locator('.park-tony-scene').count()==0
  assert not errors and not missing,(errors,missing)
  ctx.close()
 b.close()
print('Tony: three separated impacts, red line, exact cents, result, replay and reload passed')
