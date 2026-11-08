from helpers.daily_reward import collect_daily
"""Native Bounce input, saved entry and round recovery on emulated accounts."""
import os,uuid,json
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:5000')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];missing=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:missing.append(r.url) if r.status>=400 and 'favicon' not in r.url else None)
 page.goto(BASE+'/bounce')
 page.locator('[data-cloud-test-account]').fill('bounce-park-'+uuid.uuid4().hex[:20])
 page.get_by_role('button',name='Entrar com conta de teste',exact=True).click()
 try:
  page.wait_for_function('window.__bounce&&window.Bounce3D&&window.KingRicoCloud?.player&&!document.querySelector("#kr-boot-screen")')
 except Exception:
  print(page.evaluate('({actor:!!window.__bounce,renderer:!!window.Bounce3D,cloud:!!window.KingRicoCloud?.player,text:document.body.innerText.slice(-1800),err:window.__bErr})'),errors,missing,flush=True)
  page.screenshot(path='work/bounce-native-error.png');raise
 assert page.evaluate('KingRicoCloud.uid')!='park-preview'
 collect_daily(page)
 page.get_by_role('button',name='JOGAR POR 25 MOEDAS',exact=True).click()
 page.locator('.park-modal').wait_for(state='detached')
 assert page.evaluate('KingRicoCloud.player.balance')==1050
 # Freeze only the renderer clock so the native pointer start and saved round can
 # be inspected before an autonomous landing/fall. Wallet and hooks stay real.
 page.evaluate('Bounce3D.update=()=>{}')
 page.mouse.click(195,550)
 page.wait_for_function('KingRicoCloud.player.bounceRound&&__bounce.state.active')
 round_id=page.evaluate('KingRicoCloud.player.bounceRound.id')
 assert page.evaluate('KingRicoCloud.player.balance')==1025
 page.reload();page.wait_for_function('window.__bounce&&window.Bounce3D&&window.KingRicoCloud?.player&&!document.querySelector("#kr-boot-screen")')
 page.evaluate('Bounce3D.update=()=>{}')
 assert page.locator('.park-modal').count()==0
 assert page.evaluate('KingRicoCloud.player.bounceRound.id')==round_id
 assert page.evaluate('KingRicoCloud.player.balance')==1025
 result=page.evaluate('''async()=>{
  const c=KingRicoCloud,r=c.player.bounceRound,sleep=()=>new Promise(r=>setTimeout(r,350));
  await sleep();await c.bounce('land',25,r.id,0,false);await sleep();
  const paid=await c.bounce('collect',25,r.id,1,false);
  await sleep();await c.bounce('start',25,crypto.randomUUID(),0,false);
  return {win:paid.outcome.winUnits/100,balance:c.player.balance,round:!!c.player.bounceRound};
 }''')
 assert result=={'win':26.25,'balance':1026.25,'round':True},result
 assert page.locator('.park-modal').count()==0
 page.wait_for_function('document.querySelector("[data-hud-tickets]").textContent==="0"')
 page.screenshot(path='work/preview-bounce-native.png')
 page.get_by_role('link',name='Abrir parque',exact=True).click()
 page.wait_for_function('typeof document.querySelector(".park-home-menu")?.onclick==="function"')
 collect_daily(page)
 assert page.locator('[data-game="clown"]').count()==0
 assert page.locator('.park-card-coming').count()==3
 page.locator('[data-game="bounce"]').click();page.wait_for_function('window.__bounce&&KingRicoCloud.player?.bounceRound&&!document.querySelector("#kr-boot-screen")')
 assert page.locator('.park-modal').count()==0
 assert not errors and not missing,(errors,missing)
 print(json.dumps({'nativeBounceInput':True,'recovery':True,'coinEntryOnce':True,'automaticNextRound':True,'catalog':True,'errors':errors,'missing':missing}),flush=True)
 b.close()
