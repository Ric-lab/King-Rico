"""Real Auth/Firestore emulator browser workflow; never uses production accounts."""
import json
import time
import uuid
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:5000'

def settle(page):
    deadline=time.monotonic()+90
    while time.monotonic()<deadline:
        state=page.evaluate('''() => {
          const g=window.__fc,s=g.state;
          return {prize:!!s.showWin,idle:!g.cloudBusy()&&!s.showWin&&!s.balPending};
        }''')
        if state['prize']:
            page.locator('div[role="button"][style*="z-index: 30"]').click()
        elif state['idle']:
            return
        page.wait_for_timeout(100)
    raise AssertionError('Slot round did not finish')

def login(page, account):
    page.locator('[data-cloud-test-account]').fill(account)
    page.locator('[data-cloud-consent]').check()
    page.get_by_role('button',name='Entrar com conta de teste',exact=True).click()
    page.wait_for_function('window.KingRicoCloud.player && window.KingRicoCloud.uid',timeout=20000)
    page.locator('[data-cloud-login]').wait_for(state='hidden',timeout=20000)

def swipe(page):
    wheel=page.locator('[data-screen-label="Fortune Wheel"] > div').nth(0)
    # The actual draggable element is the circular wheel with cursor: grab.
    wheel=page.locator('div[style*="cursor: grab"]')
    box=wheel.bounding_box();assert box
    cx,cy=box['x']+box['width']/2,box['y']+box['height']/2
    r=box['width']*.38
    page.mouse.move(cx,cy-r);page.mouse.down()
    page.mouse.move(cx+r,cy,steps=5)
    page.mouse.move(cx,cy+r,steps=5)
    page.mouse.up()

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    context=browser.new_context(viewport={'width':453,'height':802},timezone_id='America/Sao_Paulo')
    page=context.new_page();errors=[];http_errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('response',lambda response:http_errors.append([response.status,response.url])
            if response.status>=400 and not response.url.endswith('/favicon.ico') else None)
    account='browser-'+uuid.uuid4().hex[:12]
    page.add_init_script("localStorage.setItem('fortuneCircus.slot.v3',JSON.stringify({balance:9876543}));")
    # Firestore keeps a live connection; readiness is the loaded account/game,
    # not the absence of network requests.
    page.goto(BASE+'/',wait_until='domcontentloaded')
    login(page,account)
    assert page.evaluate('window.KingRicoCloud.player.balance')==1000, 'Local balance was imported'
    assert page.evaluate("JSON.parse(localStorage.getItem('kingRico.legacyBackup')).balance")==9876543
    page.get_by_role('button',name='PEGAR MOEDAS',exact=True).click()
    page.wait_for_function('window.KingRicoCloud.player.balance===1050')
    page.get_by_role('link',name='Jogar Fortune Circus',exact=True).click()
    page.wait_for_function('window.__fc && window.__fc.state.ready && !window.__fc.state.homeOpen')
    page.get_by_role('button',name='Girar',exact=True).click()
    page.wait_for_function('window.__fc.state.spinning')
    page.wait_for_function('!window.__fc.state.spinning',timeout=20000)
    page.wait_for_timeout(1300);settle(page)
    before=page.evaluate('window.KingRicoCloud.player.balance')
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud.player !== null',timeout=20000)
    assert page.evaluate('window.KingRicoCloud.player.balance')==before
    page.goto(BASE+'/Fortune%20Wheel.dc.html',wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud.player && window.__fw',timeout=20000)
    assert page.evaluate('window.KingRicoCloud.player.balance')==before
    page.get_by_role('button',name='Apostar em Zero',exact=True).click()
    swipe(page)
    page.wait_for_function('window.__fw.state.spinning',timeout=10000)
    page.wait_for_function('!window.__fw.state.spinning',timeout=15000)
    after=page.evaluate('window.KingRicoCloud.player.balance')
    expected=page.evaluate('window.__fw._cloudSpin.player.balance')
    assert after==expected
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud.player !== null',timeout=20000)
    assert page.evaluate('window.KingRicoCloud.player.balance')==after
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.get_by_role('button',name='Sair da conta',exact=True).click()
    page.locator('[data-cloud-login]').wait_for(state='visible')
    login(page,account+'-other')
    assert page.evaluate('window.KingRicoCloud.player.balance')==1000,'Account balances leaked'
    assert not errors,errors
    assert not http_errors,http_errors
    print(json.dumps({'browser':'passed','google_identity':'emulated','games':['circus','wheel'],
                      'legacy_backup':True,'reload':True,'account_isolation':True}))
    browser.close()
