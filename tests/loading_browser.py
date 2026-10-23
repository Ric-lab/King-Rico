"""Real loading screen before runtime download and during saved-wallet recovery."""
import uuid
from home_covers_browser import check_home_covers

BASE='http://127.0.0.1:5000'

def check_loading(browser,login,restore,claim_gift,login_observer):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    context.add_init_script(login_observer)
    page=context.new_page();errors=[];held=[];holding=[True]
    page.on('pageerror',lambda error:errors.append(str(error)))
    def hold_runtime(route):
        if holding[0]:held.append(route)
        else:route.continue_()
    page.route('**/runtime/react.js',hold_runtime)
    held_art=[]
    page.route('**/assets/brand/loading-king-rico.webp',lambda route:held_art.append(route))
    page.goto(BASE+'/home',wait_until='commit')
    page.locator('#kr-boot-screen').wait_for(state='visible')
    assert page.locator('.kr-boot-scene').evaluate('e=>getComputedStyle(e).backgroundImage.includes("data:image/webp;base64,")')
    page.screenshot(path='/tmp/king-rico-loading-preview.png')
    for route in held_art:route.continue_()
    page.wait_for_function('document.querySelector(".kr-boot-art").naturalWidth>0')
    assert not page.evaluate('!!window.React'),'Loading was only shown after the blocked runtime loaded'
    assert held,'The test did not delay the actual React download'
    page.screenshot(path='/tmp/king-rico-loading-new.png')
    holding[0]=False
    for route in held:route.continue_()
    login(page,'cover-review-'+uuid.uuid4().hex[:10])
    page.locator('#kr-boot-screen').wait_for(state='hidden')
    claim_gift(page);uid=page.evaluate('KingRicoCloud.uid');balance=page.evaluate('KingRicoCloud.player.balance')
    cover_result=check_home_covers(page)
    page.screenshot(path='/tmp/king-rico-covers-home-top.png')
    page.locator('.kr-home-scroll').evaluate('el=>el.scrollTop=el.scrollHeight')
    page.screenshot(path='/tmp/king-rico-covers-home-bottom.png')
    delayed=context.new_page();wallet_routes=[];wallet_holding=[True]
    delayed.on('pageerror',lambda error:errors.append(str(error)))
    def hold_wallet(route):
        if wallet_holding[0]:wallet_routes.append(route)
        else:route.continue_()
    delayed.route('http://127.0.0.1:8085/**',hold_wallet)
    delayed.goto(BASE+'/wheel',wait_until='domcontentloaded')
    delayed.locator('#kr-boot-screen').wait_for(state='visible')
    delayed.wait_for_function('window.KingRicoCloud?.uid')
    assert delayed.evaluate('KingRicoCloud.player') is None
    assert delayed.locator('[data-screen-label]').first.evaluate('el=>!!el.closest("[inert]")')
    assert not delayed.evaluate('window.__krLoginShown'),'Loading a saved wallet displayed another Google login'
    assert wallet_routes
    wallet_holding[0]=False
    for route in wallet_routes:route.continue_()
    restore(delayed,uid);delayed.locator('#kr-boot-screen').wait_for(state='hidden')
    assert delayed.evaluate('KingRicoCloud.player.balance')==balance
    # Failed decorative art must not prevent a confirmed account from playing.
    missing=context.new_page();missing.on('pageerror',lambda error:errors.append(str(error)))
    missing.route('**/assets/brand/loading-king-rico.webp',lambda route:route.abort())
    missing.goto(BASE+'/33');restore(missing,uid)
    missing.locator('#kr-boot-screen').wait_for(state='hidden')
    assert missing.evaluate('KingRicoCloud.player.balance')==balance
    assert not errors,errors
    context.close()
    # A stalled runtime offers a retry; virtual time avoids a 15-second real wait.
    stalled=browser.new_context(viewport={'width':390,'height':844})
    failure=stalled.new_page();failure.clock.install()
    stalled_runtime=[]
    failure.route('**/runtime/react.js',lambda route:stalled_runtime.append(route))
    failure.goto(BASE+'/home',wait_until='commit')
    failure.locator('#kr-boot-screen').wait_for(state='visible')
    failure.wait_for_function('document.querySelector(".kr-boot-retry") && document.readyState!=="loading"')
    failure.clock.fast_forward(16000)
    failure.get_by_role('button',name='Tentar novamente',exact=True).wait_for(state='visible')
    for route in stalled_runtime:route.abort()
    stalled.close()
    return {'early_loading_before_runtime':True,'inline_preview_before_full_image':True,**cover_result,'saved_wallet_blocks_until_ready':True,'same_identity_and_balance':True,'missing_art_does_not_block_game':True,'slow_runtime_retry':True,'console_errors':errors}
