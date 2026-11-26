"""Controller trinca: 2 face-down cards pick the minigame; Bubble Rico aims, shoots, pays 10x once and quits clean."""
from helpers.daily_reward import collect_daily
from playwright.sync_api import sync_playwright
import os
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/circus?demo=off');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
 def seed(force):
  page.evaluate('''f=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.park.royal={id:crypto.randomUUID(),betUnits:1000,won:true,moves:12,endAt:4};s.park.economyV6={version:1,rounds:1,wageredUnits:1000,paidUnits:0,tigerUnits:0};localStorage.setItem(k,JSON.stringify(s));if(f)localStorage.setItem('kingRico.preview.forceGame',f);else localStorage.removeItem('kingRico.preview.forceGame');}''',force)
  page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
 # 1) Cards: choosing one opens exactly that game; the other is revealed too.
 seed(None)
 pick=page.get_by_role('dialog',name='Escolha um jogo',exact=True);pick.wait_for()
 page.screenshot(path='work/preview-game-pick.png')
 assert pick.get_by_role('button',name='Royal Rico',exact=True).count()==1 and pick.get_by_role('button',name='Bubble Rico',exact=True).count()==1
 game='bubble'
 pick.get_by_role('button',name='Bubble Rico',exact=True).click()
 page.wait_for_timeout(900);page.screenshot(path='work/preview-game-pick-open.png')
 name='Bubble Rico' if game=='bubble' else 'Royal Rico'
 page.get_by_role('dialog',name=name,exact=True).wait_for()
 assert page.locator('#kr-game-pick').count()==0
 before=page.evaluate('KingRicoCloud.player.balance')
 page.get_by_role('button',name='Fechar e voltar',exact=True).click()
 page.wait_for_function('!document.querySelector("#kr-controller-game")')
 assert page.evaluate('KingRicoCloud.player.balance')==before
 assert page.evaluate('KingRicoPark.state.royal') is None
 # 2) Bubble Rico: drag-aim + release shoots; planned win pays 10x exactly once.
 seed('bubble')
 page.get_by_role('dialog',name='Bubble Rico',exact=True).wait_for()
 before=page.evaluate('KingRicoCloud.player.balance')
 page.screenshot(path='work/preview-bubble-start.png')
 shots=0
 for i in range(14):
  if page.locator('#kr-controller-game .tr-end').count():break
  box=page.locator('#kr-controller-game .bb-board').bounding_box()
  x=box['x']+box['width']*(.3+.4*((i*37)%10)/10);y=box['y']+box['height']*.35
  page.mouse.move(box['x']+box['width']/2,box['y']+box['height']*.6);page.mouse.down()
  page.mouse.move(x,y,steps=4)
  if i==0:page.screenshot(path='work/preview-bubble-aim.png')
  page.mouse.up();shots+=1
  page.wait_for_function('document.querySelector("#kr-controller-game .bb-board")?.getAttribute("aria-busy")==="false"||document.querySelector("#kr-controller-game .tr-end")',timeout=8000)
  page.wait_for_timeout(150)
 end=page.locator('#kr-controller-game .tr-end');end.wait_for(timeout=10000)
 assert shots>=4,shots
 assert '+100 MOEDAS' in end.inner_text(),end.inner_text()
 assert page.evaluate('KingRicoCloud.player.balance')==before+100
 assert page.evaluate('KingRicoPark.state.royal') is None
 page.screenshot(path='work/preview-bubble-paid.png')
 end.get_by_role('button',name='OK',exact=True).click();page.wait_for_function('!__fc._royalPlaying')
 page.evaluate("localStorage.removeItem('kingRico.preview.forceGame')")
 assert not errors,errors
 b.close()
print('Game pick cards, Bubble Rico aim/shoot, 10x paid once and quit: PASS')
