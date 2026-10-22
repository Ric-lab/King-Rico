"""Home daily gift, scroll and counted repeatable refills against real emulators."""
import uuid
import time
BASE='http://127.0.0.1:5000'

def check_ad_layout(page,refill,ad):
    refill.tap();ad.wait_for()
    for width,height in [(320,568),(390,844),(844,390)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(150)
        rect=ad.bounding_box();assert rect and rect['x']==0 and rect['y']==0
        assert abs(rect['width']-width)<1 and abs(rect['height']-height)<1
        assert ad.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
        close=ad.get_by_role('button',name='Fechar anúncio sem ganhar moedas',exact=True)
        assert close.is_visible();page.keyboard.press('Tab');assert close.evaluate('e=>e===document.activeElement')
        if width==844:page.screenshot(path='/tmp/king-rico-ad-landscape.png')
    page.keyboard.press('Escape');ad.wait_for(state='hidden')
    assert not page.locator('.kr-home').evaluate('e=>!!e.closest("[inert]")')
    page.set_viewport_size({'width':390,'height':844})

def check_home_rewards(browser,login,restored,claim_gift,observer):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    context.add_init_script(observer)
    context.add_init_script("""window.__giftFrames=0;const sample=()=>{const e=document.querySelector('.kr-home-gift-overlay');if(e&&e.getClientRects().length)__giftFrames++;requestAnimationFrame(sample)};requestAnimationFrame(sample);""")
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/Home.dc.html');login(page,'home-rewards-'+uuid.uuid4().hex[:12])
    gift=page.get_by_role('dialog',name='Presente do dia',exact=True);gift.wait_for()
    assert gift.locator('canvas').count()==0
    assert gift.locator('.kr-home-day').count()==7
    assert gift.locator('.kr-home-gift-amount').inner_text()=='+50'
    page.screenshot(path='/tmp/king-rico-daily-gift.png')
    claim_gift(page);page.wait_for_function('KingRicoCloud.player.balance===1050&&!localStorage.getItem(`kingRico.pending.${KingRicoCloud.uid}`)')
    uid=page.evaluate('KingRicoCloud.uid');bonus=page.evaluate('KingRicoCloud.player.bonus')
    refill=page.get_by_role('button',name='Recarregar 1.000 moedas',exact=True)
    ad=page.get_by_role('dialog',name='Simulação de anúncio de 30 segundos',exact=True)
    refill.tap();ad.wait_for()
    assert page.evaluate('KingRicoCloud.player.balance')==1050
    assert page.locator('.kr-home').evaluate('e=>!!e.closest("[inert]")')
    page.get_by_role('button',name='Fechar anúncio sem ganhar moedas',exact=True).tap();ad.wait_for(state='hidden')
    assert page.evaluate('KingRicoCloud.player.rechargeCount||0')==0
    for count in [1,2]:
        before=page.evaluate('KingRicoCloud.player.balance');started=time.monotonic()
        refill.tap();ad.wait_for()
        assert ad.get_by_role('timer').get_attribute('aria-label')=='30 segundos restantes'
        if count==1:
            page.wait_for_timeout(1200)
            assert page.evaluate('KingRicoCloud.player.balance')==before
            page.screenshot(path='/tmp/king-rico-ad-simulation.png')
        page.wait_for_function('(n)=>KingRicoCloud.player.rechargeCount===n&&KingRicoCloud.player.balance===1050+n*1000',arg=count,timeout=40000)
        assert time.monotonic()-started>=29.8
        ad.wait_for(state='hidden')
        assert page.evaluate('KingRicoCloud.player.bonus')==bonus
        refill.wait_for(state='visible');page.wait_for_function('!document.querySelector(".kr-home-recharge").disabled')
    assert page.evaluate('async()=>(await KingRicoCloud.bonus()).amount')==0
    page.reload();restored(page,uid);page.wait_for_timeout(500)
    assert page.evaluate('__giftFrames')==0
    assert page.evaluate('KingRicoCloud.player.balance')==3050
    assert page.evaluate('KingRicoCloud.player.rechargeCount')==2
    for width,height in [(320,568),(390,844),(844,390)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(300)
        scroll=page.locator('[data-home-scroll]');scroll.evaluate('e=>e.scrollTop=0')
        brand=page.locator('.kr-home-brand');wallet=page.locator('[role=status][aria-label^="Seu saldo"]').first
        before=brand.bounding_box();hud=wallet.bounding_box()
        scroll.evaluate('e=>e.scrollTop=250');page.wait_for_timeout(100)
        assert brand.bounding_box()['y']<before['y']-100
        assert abs(wallet.bounding_box()['y']-hud['y'])<1
        scroll.evaluate('e=>e.scrollTop=0')
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(300)
    page.screenshot(path='/tmp/king-rico-home-recharge.png')
    page.get_by_role('link',name='Jogar Fortune Wheel',exact=True).click();restored(page,uid)
    page.evaluate("""async()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>a instanceof Uint32Array&&a.length===1?(a[0]=4252017623,a):original(a);try{await KingRicoCloud.spin('wheel',1,0)}finally{crypto.getRandomValues=original}}""")
    assert page.evaluate('KingRicoCloud.player.balance')==3049
    page.get_by_role('link',name='Voltar para o início',exact=True).click();restored(page,uid);page.wait_for_timeout(500)
    assert page.evaluate('__giftFrames')==0
    assert page.evaluate('KingRicoCloud.player.rechargeCount')==2
    assert page.evaluate('KingRicoCloud.player.bonus')==bonus
    page.goto(BASE+'/Fortune%20Circus.dc.html');restored(page,uid)
    page.get_by_role('button',name='Recarregar 1.000 moedas',exact=True).wait_for()
    assert page.evaluate('__giftFrames')==0
    assert page.locator('.kr-home-scroll').evaluate('e=>getComputedStyle(e).overflowY')=='auto'
    embedded=page.get_by_role('button',name='Recarregar 1.000 moedas',exact=True)
    check_ad_layout(page,embedded,ad)
    embedded.tap();ad.wait_for();page.reload();restored(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==3049
    assert page.evaluate('KingRicoCloud.player.rechargeCount')==2
    assert ad.count()==0
    assert not errors,errors
    context.close()
    return {'daily_gift_without_scratch':True,'repeated_home_refill_and_counter':True,'count_survives_game_and_reload':True,
        'no_daily_gift_flash_on_return':True,'wordmark_and_bar_scroll':True,'embedded_home_styled':True,'30_second_interruption_before_credit':True,'cancel_without_reward':True,'embedded_fullscreen_and_reload_without_credit':True}
