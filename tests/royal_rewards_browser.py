"""Real match-3 swaps, persisted 10x reward, quit, wheel help and removed spells."""
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
 page.get_by_role('button',name='Suas roletas',exact=True).click()
 help=page.get_by_role('dialog',name='Suas roletas',exact=True)
 assert '5 roletas' in help.inner_text() and 'roleta bônus' in help.inner_text()
 page.screenshot(path='work/preview-wheel-counter-help.png');help.get_by_role('button',name='ENTENDI').click()
 assert page.locator('#kr-cedro-count,#kr-cedro-dots').count()==0
 page.evaluate('KingRicoPreviewPicker()')
 assert 'CEDROS SEMPRE CHEIOS' not in page.locator('#kr-preview-picker').inner_text()
 page.locator('#kr-preview-picker').get_by_role('button',name='FECHAR',exact=True).click()
 # Fixture is only presentation setup: award still goes through the real shared model.
 def seed():
  page.evaluate('''()=>{const k='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(k));s.park.royal={id:crypto.randomUUID(),betUnits:1000,won:true,moves:15,endAt:14};s.park.economyV6={version:1,rounds:1,wageredUnits:1000,paidUnits:0,tigerUnits:0};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('kingRico.preview.cedros','3');localStorage.setItem('kingRico.preview.cedrosFull','1');}''')
  page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  page.get_by_role('dialog',name='Royal Rico',exact=True).wait_for()
 seed();before=page.evaluate('KingRicoCloud.player.balance')
 assert page.locator('#kr-cedro-count,#kr-cedro-dots').count()==0
 page.screenshot(path='work/preview-royal-10x.png')
 # Changing the displayed stake cannot change the reserved 10-coin stake.
 page.evaluate('__fc.setState({bet:1000})')
 find_move=r'''()=>{const n=7,g=Array.from({length:n},()=>Array(n));for(const e of document.querySelectorAll('.tr-p')){const m=e.style.transform.match(/translate\(([-\d.]+)%,\s*([-\d.]+)%\)/);if(!m)continue;const c=Math.round(+m[1]/100),r=Math.round(+m[2]/100);if(r<0||r>=n||c<0||c>=n)return null;g[r][c]=e.querySelector('i').style.backgroundImage;}const match=()=>{for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(c<5&&g[r][c]===g[r][c+1]&&g[r][c]===g[r][c+2]||r<5&&g[r][c]===g[r+1][c]&&g[r][c]===g[r+2][c])return true;return false;};for(let r=0;r<n;r++)for(let c=0;c<n;c++)for(const [dr,dc]of[[1,0],[0,1]]){const R=r+dr,C=c+dc;if(R>=n||C>=n)continue;[g[r][c],g[R][C]]=[g[R][C],g[r][c]];const ok=match();[g[r][c],g[R][C]]=[g[R][C],g[r][c]];if(ok)return[r,c,R,C];}return null;}'''
 for _ in range(17):
  if page.locator('.tr-end').count():break
  move=page.evaluate(find_move);assert move is not None,'Playable board must have a match'
  r,c,R,C=move;box=page.locator('.tr-board').bounding_box();cell=box['width']/7
  page.mouse.move(box['x']+(c+.5)*cell,box['y']+(r+.5)*cell);page.mouse.down()
  page.mouse.move(box['x']+(C+.5)*cell,box['y']+(R+.5)*cell,steps=5);page.mouse.up()
  page.wait_for_function('document.querySelector(".tr-board")?.getAttribute("aria-busy")==="false"||document.querySelector(".tr-end")')
  if page.locator('.tr-fill').evaluate('(e)=>e.style.width')=='100%':
   page.locator('.tr-end').wait_for();break
  page.wait_for_timeout(100)
 end=page.locator('.tr-end');end.wait_for()
 assert '+100 MOEDAS' in end.inner_text(),end.inner_text()
 assert page.evaluate('KingRicoCloud.player.balance')==before+100
 assert page.evaluate('KingRicoPark.state.royal') is None
 page.screenshot(path='work/preview-royal-paid.png')
 end.get_by_role('button',name='OK',exact=True).click();page.wait_for_function('!__fc._royalPlaying')
 page.wait_for_function('(v)=>Math.abs(__fc.balance()-v)<.001',arg=before+100)
 # Quit a pending winning round: no reward, no hidden scepter stock or spell.
 seed();before=page.evaluate('KingRicoCloud.player.balance')
 page.get_by_role('button',name='Fechar e voltar',exact=True).click()
 page.wait_for_function('!document.querySelector("#kr-controller-game")')
 assert page.evaluate('KingRicoCloud.player.balance')==before
 assert page.evaluate('KingRicoPark.state.royal') is None
 assert not errors,errors
 b.close()
print('Royal 10x, real swaps, quit, persisted bet and wheel help: PASS')
