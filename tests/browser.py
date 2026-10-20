"""Real Auth/Firestore emulator browser workflow; never uses production accounts."""
import json
import re
import time
import uuid
from tempfile import TemporaryDirectory
from playwright.sync_api import sync_playwright
from login_ui import check_wallet_retry
from penalty_browser import check_penalty
from clown_browser import check_clown_bounce
from new_games_browser import check_new_games

BASE = 'http://127.0.0.1:5000'
LOGIN_OBSERVER = '''(() => {
  window.__krLoginShown=false;
  const check=()=>{
    const dialog=document.querySelector('[data-cloud-login]');
    if(dialog && !dialog.hidden && getComputedStyle(dialog).display!=='none') window.__krLoginShown=true;
  };
  new MutationObserver(check).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['style','hidden']});
})();'''

def restored_without_login(page, uid):
    page.wait_for_function('window.KingRicoCloud?.player && window.KingRicoCloud.uid',timeout=20000)
    page.evaluate('async()=>{await window.KingRicoCloud.ready}')
    assert page.evaluate('window.KingRicoCloud.uid')==uid, 'Navigation changed the account'
    assert not page.evaluate('window.__krLoginShown'), 'Restoring a saved session flashed the full login screen'
    assert page.locator('[data-cloud-login]:visible').count()==0
    assert page.locator('[data-cloud-loading]:visible').count()==0
    assert not page.locator('.kr-menu-button').first.evaluate("el=>!!el.closest('[inert]')"), 'Restored game remains blocked'

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
    assert page.evaluate('window.__krLoginShown === true'), 'Login observer did not record the required first login'
    assert page.locator('[data-cloud-login] button:visible').count()==1,'Login must have one primary action'
    assert not page.locator('[data-cloud-consent]').is_checked(),'Analytics must remain optional'
    page.locator('[data-cloud-test-account]').fill(account)
    page.locator('[data-cloud-preferences] summary').click()
    page.locator('[data-cloud-consent]').check()
    page.get_by_role('button',name='Entrar com conta de teste',exact=True).click()
    page.wait_for_function('window.KingRicoCloud.player && window.KingRicoCloud.uid',timeout=20000)
    page.evaluate('async()=>{await window.KingRicoCloud.ready}')
    page.locator('[data-cloud-login]').wait_for(state='hidden',timeout=20000)
    page.evaluate('window.__krLoginShown=false')

def claim_gift(page):
    canvas=page.locator('canvas[width="600"][height="600"]')
    canvas.wait_for(state='visible')
    box=canvas.bounding_box()
    # Start inside the rounded card; its clipped corner cannot receive a press.
    page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/38);page.mouse.down()
    for row in range(19):
        y=box['y']+box['height']*(row+.5)/19
        x=box['x']+(box['width']-2 if row%2==0 else 2)
        page.mouse.move(x,y,steps=6)
    page.mouse.up()
    page.get_by_role('button',name='PEGAR MOEDAS',exact=True).click()

def swipe(page):
    # A busy software GPU can make a physical swipe fall below the game's
    # minimum force. Retry only that rejected gesture, before any bet starts.
    for attempt in range(3):
        wheel=page.locator('div[style*="cursor: grab"]')
        box=wheel.bounding_box();assert box
        cx,cy=box['x']+box['width']/2,box['y']+box['height']/2
        r=box['width']*.38
        page.mouse.move(cx,cy-r);page.mouse.down()
        page.mouse.move(cx+r,cy,steps=5)
        page.mouse.move(cx,cy+r,steps=5)
        page.mouse.up()
        try:
            page.wait_for_function('window.__fw.state.spinning',timeout=1200)
            return
        except Exception:
            hint=page.evaluate('window.__fw.state.hint')
            if not hint.startswith('Mais forte'):
                raise
    raise AssertionError('Three physical swipes were rejected for insufficient force')

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
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage'])
    context=browser.new_context(viewport={'width':453,'height':802},timezone_id='America/Sao_Paulo')
    context.add_init_script(LOGIN_OBSERVER)
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
    account_uid=page.evaluate('window.KingRicoCloud.uid')
    assert page.evaluate('window.KingRicoCloud.player.balance')==1000, 'Local balance was imported'
    assert page.evaluate("JSON.parse(localStorage.getItem('kingRico.legacyBackup')).balance")==9876543
    claim_gift(page)
    page.wait_for_function('window.KingRicoCloud.player.balance===1050')
    # Delay the real Firestore connection during a saved-session restore.
    # The game stays visible, but a physical click cannot spend its old balance.
    delayed=context.new_page();held=[];holding=[True]
    def hold_wallet(route):
        if holding[0]: held.append(route)
        else: route.continue_()
    delayed.route('http://127.0.0.1:8085/**',hold_wallet)
    delayed.goto(BASE+'/Fortune%20Neck.dc.html',wait_until='domcontentloaded')
    delayed.wait_for_function('(uid)=>window.KingRicoCloud?.uid===uid',arg=account_uid,timeout=20000)
    delayed.locator('[data-cloud-loading]').wait_for(state='visible',timeout=20000)
    assert held, 'The test did not delay a real Firestore request'
    assert not delayed.evaluate('window.__krLoginShown'), 'Slow wallet recovery showed the login screen'
    delayed.get_by_role('button',name='JOGAR',exact=True).wait_for(state='visible')
    assert delayed.locator('[data-screen-label]').first.evaluate("el=>!!el.closest('[inert]')"), 'Unconfirmed wallet allows gameplay'
    assert delayed.locator('[data-cloud-retry]:visible').count()==0, 'Loading should not expose a retry button'
    box=delayed.get_by_role('button',name='JOGAR',exact=True).bounding_box()
    delayed.mouse.click(box['x']+box['width']/2,box['y']+box['height']/2)
    assert delayed.evaluate('window.KingRicoCloud.player') is None
    assert not delayed.evaluate('!!window.__fn._cloudRequest'), 'Loading accepted a wager'
    delayed.screenshot(path='/tmp/king-rico-silent-loading.png')
    holding[0]=False
    for route in held: route.continue_()
    restored_without_login(delayed,account_uid)
    delayed.unroute('http://127.0.0.1:8085/**',hold_wallet)
    assert delayed.evaluate('window.KingRicoCloud.player.balance')==1050
    delayed.close()
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
    page.locator('a[href^="Fortune Circus.dc.html"]').click()
    page.wait_for_function('window.__fc && window.__fc.state.ready && !window.__fc.state.homeOpen')
    restored_without_login(page,account_uid)
    assert check_menu(page,'Fortune Circus',True)==common_menu
    page.get_by_role('button',name='Girar',exact=True).click()
    page.wait_for_function('window.__fc.state.spinning')
    page.wait_for_function('!window.__fc.state.spinning',timeout=20000)
    page.wait_for_timeout(1300);settle(page)
    before=page.evaluate('window.KingRicoCloud.player.balance')
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud.player !== null',timeout=20000)
    restored_without_login(page,account_uid)
    assert page.evaluate('window.KingRicoCloud.player.balance')==before
    page.goto(BASE+'/Fortune%20Wheel.dc.html',wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud.player && window.__fw',timeout=20000)
    restored_without_login(page,account_uid)
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
    restored_without_login(page,account_uid)
    assert page.evaluate('window.KingRicoCloud.player.balance')==after
    page.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud.player !== null',timeout=20000)
    restored_without_login(page,account_uid)
    page.get_by_role('link',name='Jogar Fortune Neck',exact=True).click()
    page.wait_for_function('window.KingRicoCloud?.player && window.__fn',timeout=20000)
    restored_without_login(page,account_uid)
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
    restored_without_login(page,account_uid)
    assert page.evaluate('window.KingRicoCloud.player.balance')==after-bet
    device=context.new_page()
    device.goto(BASE+'/Fortune%20Neck.dc.html',wait_until='domcontentloaded')
    device.wait_for_function('window.KingRicoCloud?.player?.neckRound?.floor===2 && window.__fn?.state.floor===2',timeout=20000)
    restored_without_login(device,account_uid)
    device.get_by_role('button',name='Pegar o prêmio',exact=True).click()
    device.wait_for_function('window.KingRicoCloud.player && window.KingRicoCloud.player.neckRound===null',timeout=20000)
    page.wait_for_function('window.KingRicoCloud.player && window.KingRicoCloud.player.neckRound===null',timeout=20000)
    final=page.evaluate('window.KingRicoCloud.player.balance')
    assert round(final,2)==round(after-bet+round(bet*1.2,1),2)
    assert device.evaluate('window.KingRicoCloud.player.balance')==final
    device.close()
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.KingRicoCloud?.player && window.__fn',timeout=20000)
    restored_without_login(page,account_uid)
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
    restored_without_login(page,account_uid)
    assert round(page.evaluate('window.KingRicoCloud.player.balance'),2)==round(final-bet,2),'Reload refunded a missed first step'
    assert page.evaluate('window.__fn.state.round') is False
    # Enter Fingo through the published Home card with the same account/wallet.
    before_fingo=page.evaluate('window.KingRicoCloud.player.balance')
    page.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded')
    restored_without_login(page,account_uid)
    page.get_by_role('link',name='Jogar Fortune Fingo',exact=True).click()
    page.wait_for_function('window.__fg?.engine && window.KingRicoCloud?.player',timeout=20000)
    restored_without_login(page,account_uid)
    assert page.evaluate('window.__fg.state.balance')==before_fingo
    assert check_menu(page,'Fortune Fingo',True)==common_menu
    def fingo_wins(tab):
        tab.evaluate('''()=>{
          const original=crypto.getRandomValues.bind(crypto);
          crypto.getRandomValues=array=>array instanceof Uint32Array && array.length===1
            ? (array[0]=0,array) : original(array);
        }''')
    def fingo_drop(tab,column):
        canvas=tab.locator('canvas[width="906"][height="1168"]')
        # Wait for the rendered board to accept a drop after the rolling phase.
        tab.wait_for_function('''(column)=>{
          const c=document.querySelector('canvas[width="906"]');if(!c) return false;
          const r=c.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width*(column+.5)/5,r.y+20);
          return getComputedStyle(c).cursor==='pointer' && c.parentElement.contains(hit);
        }''',arg=column)
        box=canvas.bounding_box();assert box
        tab.mouse.click(box['x']+box['width']*(column+.5)/5,box['y']+20)
    def fingo_spin(tab):
        # The pulsing button continuously changes size, so press its center.
        button=tab.get_by_role('button',name=re.compile('^Girar,'))
        button.wait_for(state='visible')
        tab.wait_for_function('''()=>{
          const b=document.querySelector('[role="button"][aria-label^="Girar,"]');
          if(!b) return false;const r=b.getBoundingClientRect();
          return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
        }''')
        box=button.bounding_box();assert box
        tab.mouse.click(box['x']+box['width']/2,box['y']+box['height']/2)
    fingo_wins(page)
    page.get_by_role('button',name=re.compile('^Aposta ')).click()
    page.get_by_role('button',name='Diminuir aposta',exact=True).click()
    page.get_by_role('button',name='Diminuir aposta',exact=True).click()
    page.get_by_role('button',name='OK',exact=True).click()
    assert page.evaluate('window.__fg.state.betIdx')==1
    fingo_spin(page)
    page.wait_for_function('window.__fg.state.phase==="drop" && !!window.KingRicoCloud.player.fingoRound?.slots',timeout=20000)
    pending=page.evaluate('window.KingRicoCloud.player.fingoRound')
    assert round(page.evaluate('window.KingRicoCloud.player.balance'),2)==round(before_fingo-2.5,2)
    page.reload(wait_until='domcontentloaded')
    restored_without_login(page,account_uid)
    assert page.evaluate('window.KingRicoCloud.player.fingoRound')==pending,'Reload rerolled the golden pipes'
    page.wait_for_function('window.__fg?.state.phase==="drop" && window.__fg.engine',timeout=20000)
    fingo_wins(page);fingo_drop(page,0)
    page.wait_for_function('window.KingRicoCloud.player.fingoRound?.used===1 && window.__fg.state.phase==="falling"',timeout=20000)
    # The ball was committed already: reload cannot restore it or refund the bet.
    page.reload(wait_until='domcontentloaded');restored_without_login(page,account_uid)
    page.wait_for_function('window.__fg?.state.used===1 && window.__fg.state.phase==="spin"',timeout=20000)
    assert page.evaluate('window.__fg.state.tmarks')==[True,False,False,False,False]
    another=context.new_page();another.goto(BASE+'/Fortune%20Fingo.dc.html',wait_until='domcontentloaded')
    restored_without_login(another,account_uid);fingo_wins(another)
    another.wait_for_function('window.__fg?.state.used===1 && window.__fg.engine',timeout=20000)
    fingo_spin(another)
    another.wait_for_function('window.__fg.state.phase==="drop"',timeout=20000);fingo_drop(another,1)
    another.wait_for_function('window.__fg.state.used===2 && window.__fg.state.phase==="spin"',timeout=25000)
    page.wait_for_function('window.__fg.state.used===2 && window.__fg.state.phase==="spin"',timeout=20000)
    another.close();fingo_wins(page)
    for column in range(2,5):
        fingo_spin(page)
        page.wait_for_function('window.__fg.state.phase==="drop"',timeout=20000);fingo_drop(page,column)
        if column<4:
            page.wait_for_function('(used)=>window.__fg.state.used===used && window.__fg.state.phase==="spin"',arg=column+1,timeout=25000)
    page.wait_for_function('window.__fg.state.win?.title==="FINGO!"',timeout=25000)
    expected_fingo=round(before_fingo-2.5+62.5,2)
    assert round(page.evaluate('window.KingRicoCloud.player.balance'),2)==expected_fingo
    page.get_by_text('OK',exact=True).click()
    page.wait_for_function('!window.__fg.state.win && !window.__fg.state.active',timeout=20000)
    assert round(page.evaluate('window.__fg.state.balance'),2)==expected_fingo
    page.reload(wait_until='domcontentloaded');restored_without_login(page,account_uid)
    assert round(page.evaluate('window.KingRicoCloud.player.balance'),2)==expected_fingo
    assert page.evaluate('window.KingRicoCloud.player.fingoRound') is None
    page.goto(BASE+'/Fortune%20Neck.dc.html',wait_until='domcontentloaded')
    restored_without_login(page,account_uid)
    assert round(page.evaluate('window.KingRicoCloud.player.balance'),2)==expected_fingo
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
        saved.add_init_script(LOGIN_OBSERVER)
        remembered=saved.pages[0]
        remembered.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded')
        login(remembered,account+'-remembered')
        uid=remembered.evaluate('window.KingRicoCloud.uid')
        claim_gift(remembered)
        remembered.wait_for_function('window.KingRicoCloud.player.balance===1050')
        saved.close()
        reopened=p.chromium.launch_persistent_context(profile,executable_path='/usr/bin/chromium',headless=True,
            viewport={'width':453,'height':802},timezone_id='America/Sao_Paulo')
        reopened.add_init_script(LOGIN_OBSERVER)
        returned=reopened.pages[0]
        returned.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded')
        returned.wait_for_function('window.KingRicoCloud?.player && window.KingRicoCloud.uid',timeout=20000)
        restored_without_login(returned,uid)
        returned.locator('[data-cloud-login]').wait_for(state='hidden',timeout=20000)
        assert returned.evaluate('window.KingRicoCloud.uid')==uid,'A reopened browser created another identity'
        assert returned.evaluate('window.KingRicoCloud.player.balance')==1050,'A reopened browser lost the wallet'
        # Exhaust the real emulated wallet after its daily gift was claimed.
        # Deterministic losing Wheel operations avoid animation timing here;
        # the refill itself is exercised through the visible Circus button.
        returned.evaluate('''async()=>{
          const original=crypto.getRandomValues.bind(crypto);
          crypto.getRandomValues=array=>array instanceof Uint32Array && array.length===1
            ? (array[0]=4252017623,array) : original(array);
          await window.KingRicoCloud.spin('wheel',1000,0);
          await new Promise(resolve=>setTimeout(resolve,800));
          await window.KingRicoCloud.spin('wheel',50,0);
        }''')
        assert returned.evaluate('window.KingRicoCloud.player.balance')==0
        returned.goto(BASE+'/Fortune%20Circus.dc.html?from=home',wait_until='domcontentloaded')
        restored_without_login(returned,uid)
        refill=returned.get_by_role('button',name='Recarregar moedas',exact=True)
        refill.wait_for(state='visible')
        refill.dblclick()
        returned.wait_for_function('window.KingRicoCloud.player.balance===1000 && window.__fc.state.balance===1000',timeout=20000)
        returned.reload(wait_until='domcontentloaded')
        restored_without_login(returned,uid)
        assert returned.evaluate('window.KingRicoCloud.player.balance')==1000
        assert returned.evaluate('window.__fc.state.balance')==1000
        assert returned.evaluate('async()=>(await window.KingRicoCloud.bonus()).amount')==0,'Recharge reset the daily gift'
        returned.goto(BASE+'/Fortune%20Neck.dc.html',wait_until='domcontentloaded')
        restored_without_login(returned,uid)
        assert returned.evaluate('window.KingRicoCloud.player.balance')==1000
        reopened.close()
    check_wallet_retry(browser)
    penalty_result=check_penalty(browser,login,restored_without_login,check_menu,claim_gift,LOGIN_OBSERVER)
    print(json.dumps(penalty_result))
    print(json.dumps(check_clown_bounce(browser,login,restored_without_login,check_menu,claim_gift,LOGIN_OBSERVER)))
    print(json.dumps(check_new_games(browser,login,restored_without_login,claim_gift,LOGIN_OBSERVER)))
    print(json.dumps({'browser':'passed','google_identity':'emulated','games':['circus','wheel','neck','fingo'],
                      'legacy_backup':True,'reload':True,'neck_round_resume':True,'cross_tab_collection':True,
                      'account_isolation':True,'browser_restart_keeps_login_and_wallet':True,
                      'one_primary_login_button':True,'neck_loss_reload_preserves_debit':True,
                      'neck_first_step_odds_disclosed':True,'shared_menu_on_all_screens':True,
                      'menu_fits_mobile_and_desktop':True,'home_settings_follow_player':True,
                      'menu_analytics_updates_immediately':True,'navigation_never_shows_login_for_saved_session':True,
                      'browser_restart_never_shows_login_for_saved_session':True,
                      'slow_wallet_restore_keeps_game_visible_and_blocks_wagers':True,
                      'wallet_error_retry_without_google_prompt_ui_fixture':True,
                      'recharge_after_claimed_daily_gift':True,'recharge_survives_reload_and_game_change':True,
                      'scratch_gift_credits_cloud_wallet':True,'fingo_home_card_and_local_physics':True,
                      'fingo_pending_roll_and_used_balls_survive_reload':True,'fingo_resumes_on_another_tab':True,
                      'fingo_payout_commits_once_and_shares_wallet':True}))
    browser.close()
