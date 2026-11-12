"""The archived park cannot hide the existing 30s refill: access it from Circus menu."""
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
  page.locator('.kr-menu-button').click();page.get_by_role('button',name='+1.000 moedas · Ver anúncio de 30s',exact=True).click()
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
 print(json.dumps({'circusMenu':True,'cancelNoCredit':True,'oneCreditAfter30s':True,'flightThenWallet':True}))
 b.close()
