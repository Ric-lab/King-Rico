"""Saved 0–5 dice: face, visual loss, no extra charge, cancellation and animation fallback."""
from helpers.daily_reward import collect_daily
from playwright.sync_api import sync_playwright
import os,json
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178');os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--enable-unsafe-swiftshader'])
 smoke=os.environ.get('KING_RICO_DICE_SMOKE')=='1'
 story=os.environ.get('KING_RICO_DICE_STORY')=='1'
 for mode in (['no-preference'] if smoke or story else ['no-preference','reduce']):
  for kind in ([os.environ.get('KING_RICO_DICE_KIND','tony')] if smoke else ['tony','tucker','ray']):
   ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,reduced_motion=mode)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script('''window.dicePhases=[];new MutationObserver(rs=>{for(const r of rs){if(r.target.classList?.contains('park-villain-dice'))dicePhases.push(r.target.dataset.phase);for(const n of r.addedNodes||[])if(n.classList?.contains('park-villain-dice'))dicePhases.push(n.dataset.phase);for(const n of r.removedNodes||[])if(n.classList?.contains('park-villain-dice'))dicePhases.push('closed');}}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-phase']});''')
   page.goto(BASE+'/circus?demo='+('off' if smoke else kind));page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
   if smoke:
    page.evaluate('KingRicoPreviewPicker()');page.get_by_role('button',name='Dado do '+{'tony':'Tony','tucker':'Tucker','ray':'Ray'}[kind],exact=True).click()
   if kind=='ray':
    page.evaluate('''()=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.park.cedros=4;localStorage.setItem(k,JSON.stringify(s));}''')
    page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
   if smoke and kind=='ray':
    page.evaluate('KingRicoPreviewPicker()');page.get_by_role('button',name='Dado do Ray',exact=True).click()
   page.wait_for_function('!__fc.cloudBusy()')
   if kind=='tucker':
    page.evaluate('''()=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.park.cedros=0;const p=s.records.find(([k])=>k==='players/preview')[1];p.peaches=4;p.peachBank={count:4,units:4000};localStorage.setItem(k,JSON.stringify(s));}''')
    page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
    if smoke:
     page.evaluate('KingRicoPreviewPicker()');page.get_by_role('button',name='Dado do Tucker',exact=True).click()
   stock_before=page.evaluate("({shields:KingRicoPark.state.cedros||0,wheels:KingRicoCloud.player.peaches})")
   page.locator('[data-spin-btn]').click()
   die=page.locator('.park-villain-dice')
   try:die.wait_for(timeout=15000)
   except Exception:
    print(json.dumps({'errors':errors,'state':page.evaluate('({hint:__fc.state.hint,spinning:__fc.state.spinning,busy:__fc.cloudBusy(),outcome:__fc._cloudSpin?.outcome,hold:__fc._parkVillainHold})')}),flush=True)
    page.screenshot(path='work/preview-dice-integration-error.png');raise
   page.wait_for_function('document.querySelector(".park-villain-dice")?.dataset.phase==="ready"')
   assert die.get_attribute('data-renderer')=='three'
   assert die.locator('.park-dice-tray').get_attribute('data-mark')==kind
   ready_position=json.loads(die.locator('.park-dice-tray').get_attribute('data-ready-position'))
   assert ready_position[1]<-.5,ready_position # Lower phone grip, not center of table.
   if kind=='tony':assert abs(page.evaluate('__fc.balance()')-page.evaluate('__fc._cloudSpin.balanceDebited'))<.001
   else:
    counter=page.locator('.park-key-count-'+('shield' if kind=='ray' else 'wheel')+' b')
    assert counter.inner_text()==str(stock_before['shields' if kind=='ray' else 'wheels'])+'/5'
   page.wait_for_timeout(500)
   assert die.get_attribute('data-phase')=='ready','Must wait for the player, never throw automatically'
   tray=die.locator('.park-dice-tray');box=tray.bounding_box()
   page.screenshot(path=f'work/preview-die-ready-{kind}-{mode}.png')
   grip_y=box['y']+box['height']*(1-ready_position[1])/2
   page.mouse.move(box['x']+box['width']*.5,grip_y);page.mouse.down()
   page.mouse.move(box['x']+box['width']*.65,grip_y-box['height']*.2,steps=10);page.mouse.up()
   page.wait_for_function('document.querySelector(".park-villain-dice")?.dataset.phase==="rolling"')
   assert tray.get_attribute('data-launch')
   page.wait_for_timeout(650);page.screenshot(path=f'work/preview-die-throw-{kind}-{mode}.png')
   page.wait_for_function('document.querySelector(".park-villain-dice")?.dataset.phase==="result"')
   receipt=page.evaluate('__fc._cloudSpin');event=receipt['outcome'][kind];value=event['dice']['value']
   assert die.get_attribute('data-value')==str(value)
   assert json.loads(tray.get_attribute('data-face-labels'))==event.get('dice',{}).get('faces',list(range(6)))
   assert float(die.locator('.park-dice-tray').get_attribute('data-rest-flatness'))>.8
   assert die.locator('.park-dice-tray').get_attribute('data-face')==str(value), {'saved':value,'shown':die.locator('.park-dice-tray').get_attribute('data-face'),'errors':errors,'renderer':die.get_attribute('data-renderer')}
   page.wait_for_timeout(400);page.screenshot(path=f'work/preview-die-{kind}-{mode}.png')
   balance=page.evaluate('KingRicoCloud.player.balance')
   dialog=page.get_by_role('dialog',name={'tony':'Tony roubou moedas','tucker':'Tucker levou roletas','ray':'Ray e os escudos'}[kind],exact=True)
   dialog.wait_for(timeout=16000)
   assert page.locator('.park-villain-dice').count()==0
   phases=page.evaluate('dicePhases');assert all(x in phases for x in ['entering','ready','rolling','result','returning','closed']),phases
   if kind!='tony':
    expected=(receipt['park']['cedros'] if kind=='ray' else receipt['player']['peaches'])
    assert page.locator('.park-key-count-'+('shield' if kind=='ray' else 'wheel')+' b').inner_text()==str(expected)+'/5'
   dialog.get_by_role('button',name='CONTINUAR').click()
   page.wait_for_function('!__fc.cloudBusy()');assert page.evaluate('KingRicoCloud.player.balance')==balance
   if kind=='tony':assert abs(balance-(receipt['balanceDebited']-event['stolenUnits']/100))<.001
   assert not errors,errors
   ctx.close()
 if smoke or story:
  b.close();print('Three.js villain story: PASS');raise SystemExit(0)
 # Exercise all six faces with keyboard/button launch, plus WebGL failure and abort.
 ctx=b.new_context(viewport={'width':320,'height':740});page=ctx.new_page()
 page.goto(BASE+'/circus?demo=off');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
 page.evaluate('''async()=>{window.dieModule=await import('/ui/park/villain-dice.js');window.dieStart=value=>{
  window.dieAbort=new AbortController();window.dieDone=false;window.dieModule.playVillainDie(__fc,{dice:{version:1,value},stolenUnits:value*100},'tony',dieAbort.signal).then(()=>window.dieDone=true);
 }}''')
 before=page.evaluate('KingRicoCloud.player.balance')
 for value in range(6):
  page.evaluate('(v)=>dieStart(v)',value)
  page.wait_for_function('document.querySelector(".park-villain-dice")?.dataset.phase==="ready"')
  page.get_by_role('button',name='JOGAR DADO',exact=True).press('Enter')
  page.wait_for_function('document.querySelector(".park-villain-dice")?.dataset.phase==="result"')
  assert page.locator('.park-villain-dice').get_attribute('data-value')==str(value)
  assert page.locator('.park-dice-tray').get_attribute('data-face')==str(value)
  page.wait_for_function('dieDone')
 page.evaluate('dieStart(3);dieAbort.abort()');page.wait_for_function('dieDone');assert page.locator('.park-villain-dice').count()==0
 page.evaluate("window.OriginalGL=window.WebGLRenderingContext;window.OriginalGL2=window.WebGL2RenderingContext;window.WebGLRenderingContext=undefined;window.WebGL2RenderingContext=undefined")
 # Explicit context failure exercises the fallback without touching finances.
 page.evaluate("window.originalGetContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type.includes('webgl'))return null;return originalGetContext.call(this,type,...args)};dieStart(0)")
 page.get_by_role('button',name='REVELAR RESULTADO',exact=True).click()
 page.wait_for_function('dieDone');assert page.evaluate('KingRicoCloud.player.balance')==before
 b.close()
print(json.dumps({'actors':3,'motionModes':2,'faces':[0,1,2,3,4,5],'swipePhysics':True,'waitsForGesture':True,'noAdditionalDebit':True,'webglFallback':True,'abort':True}))
