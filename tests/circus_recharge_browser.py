"""Purple/gold rewarded video: readable, reachable, cancel safe and one 1000 credit."""
from helpers.daily_reward import collect_daily
from playwright.sync_api import sync_playwright
import os,json
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178');os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/circus?demo=off');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
 page.wait_for_function('!__fc.cloudBusy()');before=page.evaluate('KingRicoCloud.player.balance')
 def open_ad():
  ad=page.get_by_role('button',name='Ver anúncio e ganhar 1000 moedas',exact=True)
  wallet=page.locator('.kr-hud-balance');ab=ad.bounding_box();wb=wallet.bounding_box()
  assert ab and wb and abs(ab['x']-wb['x'])<6 and ab['y']>=wb['y']+wb['height'],(ab,wb)
  assert ab['width']>90 and ab['height']>=44,(ab,'Large accessible target')
  assert '+1.000' in ad.inner_text() and '30s' in ad.inner_text()
  page.screenshot(path='work/preview-circus-reward-button.png')
  ad.click()
  page.get_by_role('dialog',name='Simulação de anúncio de 30 segundos',exact=True).wait_for()
 open_ad();page.get_by_role('button',name='Fechar anúncio sem ganhar moedas',exact=True).click()
 assert page.evaluate('KingRicoCloud.player.balance')==before
 open_ad();page.screenshot(path='work/preview-circus-recharge-ad.png')
 gift=page.get_by_role('dialog',name='Você ganhou 1.000 moedas',exact=True);gift.wait_for(timeout=40000)
 assert page.evaluate('KingRicoCloud.player.balance')==before+1000
 assert abs(page.evaluate('__fc.shownBalance()')-before)<.001,'Hold the visible total for the flight'
 gift.get_by_role('button',name='OK',exact=True).click()
 page.wait_for_function('!__fc._circusRecharge&&!__fc.cloudBusy()')
 page.wait_for_function('document.querySelector("[data-kr-wallet-value]").textContent===KingRicoCloud.player.balance.toLocaleString("pt-BR",{maximumFractionDigits:2})')
 assert page.evaluate('KingRicoCloud.player.balance')==before+1000
 page.screenshot(path='work/preview-circus-recharge-collected.png')
 assert not errors,errors
 print(json.dumps({'refillFlow':True,'cancelNoCredit':True,'oneCreditAfter30s':True,'flightThenWallet':True}))
 b.close()
