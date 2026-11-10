"""Scratch gesture, accessible collection, retries, reload and saved daily credit."""
import os,json
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,mode in [(390,'no-preference'),(320,'reduce'),(430,'no-preference')]:
  context=b.new_context(viewport={'width':width,'height':844},reduced_motion=mode,has_touch=True,is_mobile=True)
  page=context.new_page();errors=[];missing=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  page.goto(BASE+'/circus')
  gift=page.get_by_role('dialog',name='Presente do dia',exact=True);gift.wait_for()
  assert page.evaluate('KingRicoCloud.uid')=='park-preview'
  before=page.evaluate('KingRicoCloud.player.balance')
  assert gift.locator('canvas:visible').count()==9
  assert gift.locator('[data-prize=true]').count()==3 and gift.locator('[data-prize=false]').count()==6
  assert page.locator('[data-spin-btn]').evaluate('e=>!!e.closest("[inert]")')
  assert gift.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  page.screenshot(path=f'work/preview-daily-covered-{width}.png')
  def scratch_cell(cell,touch=False):
   r=cell.bounding_box()
   points=[]
   for row in [.22,.5,.78]:
    points.extend([(r['x']+r['width']*.15,r['y']+r['height']*row),(r['x']+r['width']*.85,r['y']+r['height']*row)])
   if touch:
    session=context.new_cdp_session(page)
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':points[0][0],'y':points[0][1]}]})
    for x,y in points:session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y}]})
    session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});session.detach()
   else:
    page.mouse.move(*points[0]);page.mouse.down()
    for x,y in points:page.mouse.move(x,y,steps=6)
    page.mouse.up()
  if width in [390,430]:
   scratch_cell(gift.locator('[data-prize=false]').first,touch=width==430)
   assert gift.locator('.park-daily-cell.is-revealed').count()==1
   assert gift.locator('canvas:visible').count()==8
   assert page.evaluate('KingRicoCloud.player.balance')==before
   if width==390:
    page.reload();gift.wait_for();assert gift.locator('canvas:visible').count()==9
   for n in range(3):
    scratch_cell(gift.locator('[data-prize=true]').nth(n),touch=width==430)
    if n<2:
     assert gift.get_by_role('status').inner_text()==f'{n+1} de 3 prêmios encontrados'
     assert gift.get_by_role('button',name='REVELAR',exact=True).is_visible()
   gift.get_by_role('button',name='PEGAR MOEDAS',exact=True).wait_for()
  else:
   # Same reward without requiring a gesture, including keyboard-only input.
   page.keyboard.press('Tab');page.keyboard.press('Enter')
  gift.get_by_role('button',name='PEGAR MOEDAS',exact=True).wait_for()
  page.wait_for_function('document.querySelector(".park-daily")?.dataset.phase==="prize"')
  assert not gift.locator('.park-daily-grid').is_visible()
  assert gift.locator('.park-daily-summary').is_visible()
  assert gift.locator('canvas:visible').count()==0
  assert gift.locator('.park-daily-x').count()==6
  assert gift.locator('[data-prize=true] strong').all_text_contents()==['50']*3
  assert gift.locator('.park-daily-x').first.evaluate('e=>getComputedStyle(e).color')=='rgb(207, 48, 57)'
  assert page.evaluate('KingRicoCloud.player.balance')==before
  assert gift.get_by_role('status').inner_text()=='Você ganhou 50 moedas'
  page.screenshot(path=f'work/preview-daily-revealed-{width}.png')
  page.evaluate('''()=>{
   const c=KingRicoCloud,bonus=c.bonus;c.__dailyCalls=0;c.__dailyFail=true;
   c.bonus=async()=>{c.__dailyCalls++;if(c.__dailyFail){c.__dailyFail=false;throw Error('Offline de teste');}
    const r=await bonus();await new Promise(r=>setTimeout(r,500));return r;};
  }''')
  take=gift.get_by_role('button',name='PEGAR MOEDAS',exact=True);take.click()
  page.wait_for_function('document.querySelector(".park-daily-status").textContent.includes("tentar de novo")')
  assert page.evaluate('KingRicoCloud.player.balance')==before
  if width==430:
   page.evaluate('''()=>{const original=Element.prototype.animate;Element.prototype.animate=function(...args){if(this.classList.contains('kr-wallet-coin'))throw Error('Animation unavailable');return original.apply(this,args);};}''')
  take.click()
  page.wait_for_function('(n)=>KingRicoCloud.player.balance===n+50',arg=before)
  assert gift.is_visible() and gift.locator('button').is_disabled()
  assert page.locator('[data-kr-wallet-value]').first.inner_text()==f'{before:,.0f}'.replace(',','.')
  gift.wait_for(state='detached')
  page.wait_for_function('document.querySelector("[data-kr-wallet-value]").textContent===KingRicoCloud.player.balance.toLocaleString("pt-BR",{maximumFractionDigits:2})')
  assert page.evaluate('KingRicoCloud.__dailyCalls')==2
  assert page.evaluate('async()=>(await KingRicoCloud.bonus()).amount')==0
  page.reload();page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")');page.wait_for_timeout(300)
  gift.wait_for();assert gift.locator('canvas:visible').count()==9
  assert page.evaluate('KingRicoCloud.player.balance')==before+50
  gift.get_by_role('button',name='REVELAR',exact=True).click()
  gift.get_by_role('button',name='PEGAR MOEDAS',exact=True).click();gift.wait_for(state='detached')
  assert page.evaluate('KingRicoCloud.player.balance')==before+100
  page.goto(BASE+'/park');page.wait_for_function('KingRicoCloud.player&&!document.querySelector("#kr-boot-screen")');page.wait_for_timeout(250)
  gift.wait_for();assert gift.locator('canvas:visible').count()==9
  assert page.evaluate('KingRicoCloud.player.balance')==before+100
  assert not errors and not missing,{'errors':errors,'missing':missing}
  print(json.dumps({'width':width,'motion':mode,'nineCells':True,'sixRedXs':True,'threeEqualPrizes':True,'scratch':True,'savedDailyCredit':True,'retry':True,'walletHold':True,'repeatOnEveryPreviewOpening':True,'noDoubleCreditWithinVisit':True,'errors':errors,'missing':missing}),flush=True)
  context.close()
 b.close()
