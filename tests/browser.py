"""Real Auth/Firestore emulator browser workflow; never uses production accounts."""
import json
import time
import uuid
from tempfile import TemporaryDirectory
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
    page.wait_for_function('document.querySelector("[data-cloud-google]")?.disabled === false',timeout=20000)
    assert page.locator('[data-cloud-login] button:visible').count()==1,'Login must have one primary action'
    assert not page.locator('[data-cloud-consent]').is_checked(),'Analytics must remain optional'
    page.locator('[data-cloud-test-account]').fill(account)
    page.locator('[data-cloud-preferences] summary').click()
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

def check_menu(page, screen, paytable):
    trigger=page.get_by_role('button',name='Abrir menu',exact=True)
    trigger.wait_for(state='visible')
    assert trigger.count()==1, 'The embedded Home must not duplicate the menu button'
    trigger.click()
    menu=page.get_by_role('dialog',name='Menu — '+screen,exact=True)
    menu.wait_for(state='visible')
    assert menu.get_by_role('button',name='Tabela de pagamentos',exact=True).count()==int(paytable)
    for label,value in [('Efeitos sonoros','OFF'),('Vibração','50%')]:
        group=menu.get_by_role('group',name=label,exact=True)
        assert group.get_by_role('button').count()==3
        assert group.get_by_role('button',name=value,exact=True).get_attribute('aria-pressed')=='true'
    assert menu.get_by_role('button',name='Sair da conta',exact=True).count()==1
    assert menu.get_by_role('button',name='Dados de uso: ligados',exact=True).count()==1
    geometry=menu.bounding_box(); viewport=page.viewport_size
    assert geometry['x']>=15 and geometry['y']>=0
    assert geometry['x']+geometry['width']<=viewport['width']-15
    assert geometry['y']+geometry['height']<=viewport['height']-15
    assert menu.evaluate('(el)=>el.scrollWidth<=el.clientWidth+1'), 'Menu overflows horizontally'
    appearance=menu.evaluate('''el=>{
      const s=getComputedStyle(el),b=getComputedStyle(document.querySelector('.kr-menu-button'));
      return {font:s.fontFamily,background:s.backgroundImage,border:s.border,radius:s.borderRadius,
              buttonBackground:b.backgroundImage,buttonPosition:b.backgroundPosition,buttonRadius:b.borderRadius};
    }''')
    page.screenshot(path='/tmp/king-rico-menu-'+screen.lower().replace(' ','-')+'.png')
    if paytable:
        menu.get_by_role('button',name='Tabela de pagamentos',exact=True).click()
        menu.wait_for(state='hidden')
        page.get_by_text('TABELA DE PAGAMENTOS',exact=True).wait_for(state='visible')
        page.get_by_text('FECHAR',exact=True).click()
        menu.wait_for(state='visible')
    page.keyboard.press('Escape')
    menu.wait_for(state='hidden')
    assert trigger.evaluate('(el)=>document.activeElement===el'), 'Closing menu must restore keyboard focus'
    return appearance

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
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    menu=page.get_by_role('dialog',name='Menu — Home',exact=True)
    menu.get_by_role('group',name='Efeitos sonoros',exact=True).get_by_role('button',name='OFF',exact=True).click()
    menu.get_by_role('group',name='Vibração',exact=True).get_by_role('button',name='50%',exact=True).click()
    page.wait_for_function('window.KingRicoCloud.player.settings.sfxLvl===0 && window.KingRicoCloud.player.settings.vibLvl===1')
    menu.get_by_role('button',name='Dados de uso: ligados',exact=True).click()
    menu.get_by_role('button',name='Dados de uso: desligados',exact=True).wait_for(state='visible')
    menu.get_by_role('button',name='Dados de uso: desligados',exact=True).click()
    menu.get_by_role('button',name='Dados de uso: ligados',exact=True).wait_for(state='visible')
    menu.get_by_role('button',name='Fechar menu',exact=True).click()
    common_menu=check_menu(page,'Home',False)
    for width,height in [(375,667),(1280,900)]:
        page.set_viewport_size({'width':width,'height':height})
        assert check_menu(page,'Home',False)==common_menu
    page.set_viewport_size({'width':453,'height':802})
    page.get_by_role('link',name='Jogar Fortune Circus',exact=True).click()
    page.wait_for_function('window.__fc && window.__fc.state.ready && !window.__fc.state.homeOpen')
    assert check_menu(page,'Fortune Circus',True)==common_menu
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
    assert check_menu(page,'Fortune Wheel',True)==common_menu
    page.get_by_role('button',name='Apostar em Girafa',exact=True).click()
    swipe(page)
    page.wait_for_function('window.__fw.state.spinning',timeout=10000)
    page.wait_for_function('!window.__fw.state.spinning',timeout=15000)
    after=page.evaluate('window.KingRicoCloud.player.balance')
    expected=page.evaluate('window.__fw._cloudSpin.player.balance')
    assert after==expected
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud.player !== null',timeout=20000)
    assert page.evaluate('window.KingRicoCloud.player.balance')==after
    page.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud.player !== null',timeout=20000)
    page.get_by_role('link',name='Jogar Fortune Neck',exact=True).click()
    page.wait_for_function('window.KingRicoCloud?.player && window.__fn',timeout=20000)
    assert page.evaluate('window.KingRicoCloud.player.balance')==after
    assert check_menu(page,'Fortune Neck',True)==common_menu
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.get_by_text('Tabela de pagamentos',exact=True).click()
    page.get_by_text('Na primeira subida, há 20% de chance de falhar.',exact=False).wait_for(state='visible')
    page.get_by_text('FECHAR',exact=True).click()
    page.get_by_role('button',name='Fechar menu',exact=True).click()
    # Deterministic emulator-only outcomes exercise a resumable successful
    # round. Production continues using the untouched Web Crypto generator.
    page.evaluate('''() => {
      const original=crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues=array => array instanceof Uint32Array && array.length===1
        ? (array[0]=2147483648,array) : original(array);
    }''')
    bet=page.evaluate('window.__fn.bet()')
    page.get_by_role('button',name='JOGAR',exact=True).click()
    page.wait_for_function('window.KingRicoCloud.player.neckRound?.floor===1 && !window.__fn.state.busy',timeout=20000)
    assert page.evaluate('window.KingRicoCloud.player.balance')==after-bet
    page.get_by_role('button',name='SUBIR',exact=True).click()
    page.wait_for_function('window.KingRicoCloud.player.neckRound?.floor===2 && !window.__fn.state.busy',timeout=20000)
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud?.player?.neckRound?.floor===2 && window.__fn?.state.floor===2',timeout=20000)
    assert page.evaluate('window.KingRicoCloud.player.balance')==after-bet
    device=context.new_page()
    device.goto(BASE+'/Fortune%20Neck.dc.html',wait_until='domcontentloaded')
    device.wait_for_function('window.KingRicoCloud?.player?.neckRound?.floor===2 && window.__fn?.state.floor===2',timeout=20000)
    device.get_by_role('button',name='Pegar o prêmio',exact=True).click()
    device.wait_for_function('window.KingRicoCloud.player && window.KingRicoCloud.player.neckRound===null',timeout=20000)
    page.wait_for_function('window.KingRicoCloud.player && window.KingRicoCloud.player.neckRound===null',timeout=20000)
    final=page.evaluate('window.KingRicoCloud.player.balance')
    assert round(final,2)==round(after-bet+round(bet*1.2,1),2)
    assert device.evaluate('window.KingRicoCloud.player.balance')==final
    device.close()
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud?.player && window.__fn',timeout=20000)
    assert page.evaluate('window.KingRicoCloud.player.balance')==final
    assert page.evaluate('window.__fn.state.round') is False
    # Reload after the first-step loss commits, before its animation finishes.
    # Leaving the page must not refund the stake or produce another outcome.
    page.evaluate('''() => {
      const original=crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues=array => array instanceof Uint32Array && array.length===1
        ? (array[0]=4252017623,array) : original(array);
    }''')
    page.get_by_role('button',name='JOGAR',exact=True).click()
    page.wait_for_function('(balance)=>window.KingRicoCloud.player.balance===balance && window.KingRicoCloud.player.neckRound===null',arg=round(final-bet,2),timeout=20000)
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud?.player && window.__fn',timeout=20000)
    assert round(page.evaluate('window.KingRicoCloud.player.balance'),2)==round(final-bet,2),'Reload refunded a missed first step'
    assert page.evaluate('window.__fn.state.round') is False
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.get_by_role('button',name='Sair da conta',exact=True).click()
    page.locator('[data-cloud-login]').wait_for(state='visible')
    login(page,account+'-other')
    assert page.evaluate('window.KingRicoCloud.player.balance')==1000,'Account balances leaked'
    assert not errors,errors
    assert not http_errors,http_errors
    assert page.evaluate('window.KingRicoCloud.player.neckRound') is None
    assert page.evaluate('window.__fn.state.balance')==1000
    # Close the browser process, then open the same regular browser profile.
    # Returning players must get their existing Google identity and wallet
    # without another click or a new starting balance.
    with TemporaryDirectory(prefix='king-rico-remembered-login-') as profile:
        saved=p.chromium.launch_persistent_context(profile,executable_path='/usr/bin/chromium',headless=True,
            viewport={'width':453,'height':802},timezone_id='America/Sao_Paulo')
        remembered=saved.pages[0]
        remembered.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded')
        login(remembered,account+'-remembered')
        uid=remembered.evaluate('window.KingRicoCloud.uid')
        remembered.get_by_role('button',name='PEGAR MOEDAS',exact=True).click()
        remembered.wait_for_function('window.KingRicoCloud.player.balance===1050')
        saved.close()
        reopened=p.chromium.launch_persistent_context(profile,executable_path='/usr/bin/chromium',headless=True,
            viewport={'width':453,'height':802},timezone_id='America/Sao_Paulo')
        returned=reopened.pages[0]
        returned.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded')
        returned.wait_for_function('window.KingRicoCloud?.player && window.KingRicoCloud.uid',timeout=20000)
        returned.locator('[data-cloud-login]').wait_for(state='hidden',timeout=20000)
        assert returned.evaluate('window.KingRicoCloud.uid')==uid,'A reopened browser created another identity'
        assert returned.evaluate('window.KingRicoCloud.player.balance')==1050,'A reopened browser lost the wallet'
        reopened.close()
    print(json.dumps({'browser':'passed','google_identity':'emulated','games':['circus','wheel','neck'],
                      'legacy_backup':True,'reload':True,'neck_round_resume':True,'cross_tab_collection':True,
                      'account_isolation':True,'browser_restart_keeps_login_and_wallet':True,
                      'one_primary_login_button':True,'neck_loss_reload_preserves_debit':True,
                      'neck_first_step_odds_disclosed':True,'shared_menu_on_all_screens':True,
                      'menu_fits_mobile_and_desktop':True,'home_settings_follow_player':True,
                      'menu_analytics_updates_immediately':True}))
    browser.close()
