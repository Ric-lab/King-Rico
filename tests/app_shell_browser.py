"""Install controls, clean Hosting routes and saved identity in the real browser."""
import uuid

BASE='http://127.0.0.1:5000'

def check_app_shell(browser,login,restore,claim_gift,login_observer):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    context.add_init_script(login_observer)
    page=context.new_page();errors=[];failed=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('response',lambda response:failed.append([response.status,response.url]) if response.status>=400 and not response.url.endswith('/favicon.ico') else None)
    page.goto(BASE+'/');page.wait_for_url('**/circus')
    login(page,'install-'+uuid.uuid4().hex[:10]);claim_gift(page)
    uid=page.evaluate('KingRicoCloud.uid');balance=page.evaluate('KingRicoCloud.player.balance')
    assert page.title()=='Fortune Circus'
    assert page.locator('link[rel="apple-touch-icon"]').get_attribute('href')=='/assets/app/apple-touch-icon.png'
    manifest=page.evaluate('async()=>await (await fetch(document.querySelector("link[rel=manifest]").href)).json()')
    assert manifest['name']=='Fortune Circus' and manifest['display']=='standalone'
    assert manifest['start_url']=='/circus?source=app'
    for icon in manifest['icons']:
        assert page.evaluate('''async icon=>{const image=new Image();image.src=icon.src;await image.decode();return image.naturalWidth+'x'+image.naturalHeight===icon.sizes;}''',icon)
    session=context.new_cdp_session(page)
    install_errors=session.send('Page.getInstallabilityErrors')['installabilityErrors']
    assert all(error['errorId']=='in-incognito' for error in install_errors),install_errors
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.get_by_role('button',name='Tela cheia',exact=True).click()
    page.wait_for_function('!!document.fullscreenElement')
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.get_by_role('button',name='Sair da tela cheia',exact=True).click()
    page.wait_for_function('!document.fullscreenElement')
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.get_by_role('button',name='Instalar no celular',exact=True).click()
    page.locator('.kr-menu-app-help').filter(has_text='Adicionar à tela inicial').wait_for()
    # A browser-provided install prompt is exercised without installing into the test VM.
    page.evaluate('''()=>{const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{window.installPromptCalls=(window.installPromptCalls||0)+1};event.userChoice=Promise.resolve({outcome:'accepted'});dispatchEvent(event);}''')
    page.get_by_role('button',name='Instalar no celular',exact=True).click()
    page.locator('.kr-menu-app-help').filter(has_text='Depois de instalar').wait_for()
    assert page.evaluate('window.installPromptCalls')==1
    page.get_by_role('button',name='Fechar menu',exact=True).click()
    # Every public Home link must use the rewrite, load its actual game and keep the wallet.
    routes=[('/circus?from=home','circus','__fc'),('/wheel','wheel','__fw'),('/neck','neck','__fn'),('/fingo','fingo','__fg'),('/penalty','penalty','__pen'),('/clown','clown','__clown'),('/flying-clown','flying','__flying'),('/33','twentyOne','KingRico21')]
    for path,game,global_name in routes:
        page.goto(BASE+'/home');restore(page,uid)
        target=path.split('?')[0]
        page.locator('a[href^="'+target+'"]' if target=='/circus' else 'a[href="'+target+'"]').click()
        page.wait_for_url('**'+path);restore(page,uid)
        page.wait_for_function('name=>!!window[name]',arg=global_name,timeout=25000)
        assert page.locator('meta[name="king-rico-game"]').get_attribute('content')==game
        assert page.evaluate('KingRicoCloud.player.balance')==balance
    page.reload();restore(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==balance
    # Old shared links still work and share the exact same account.
    page.goto(BASE+'/Fortune%20Wheel.dc.html');restore(page,uid)
    page.wait_for_function('!!window.__fw')
    page.get_by_role('link',name='Voltar para o início',exact=True).click()
    page.wait_for_url('**/home');restore(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==balance
    page.screenshot(path='/tmp/king-rico-install-home.png')
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.screenshot(path='/tmp/king-rico-install-menu.png')
    # Permission rejection stays usable; unsupported iPhones get the Safari instructions.
    page.evaluate('()=>{document.documentElement.requestFullscreen=async()=>{throw new Error("Permission rejected") }}')
    page.get_by_role('button',name='Tela cheia',exact=True).click()
    page.locator('.kr-menu-app-help').filter(has_text='Não foi possível abrir em tela cheia').wait_for()
    page.evaluate('''()=>{Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true});Object.defineProperty(navigator,'userAgent',{value:'iPhone',configurable:true});}''')
    page.get_by_role('button',name='Tela cheia',exact=True).click()
    page.locator('.kr-menu-app-help').filter(has_text='No Safari').wait_for()
    page.get_by_role('button',name='Fechar menu',exact=True).click()
    page.evaluate('async()=>{await navigator.serviceWorker.ready}')
    page.wait_for_function('!!navigator.serviceWorker.controller')
    # Offline navigation cannot fall back to a cached, playable wallet.
    context.set_offline(True)
    page.goto(BASE+'/wheel',wait_until='domcontentloaded')
    page.get_by_role('button',name='Tentar novamente',exact=True).wait_for()
    assert page.get_by_text('Conecte-se à internet',exact=False).is_visible()
    context.set_offline(False)
    page.get_by_role('button',name='Tentar novamente',exact=True).click()
    restore(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==balance
    assert not errors,errors
    assert not [failure for failure in failed if failure!=[503,BASE+'/wheel']],failed
    context.close()
    return {'clean_routes':8,'fullscreen_enter_exit':'native Chromium passed','install_prompt':'browser-event fixture passed','icon_and_name':'passed','same_google_identity_and_wallet':True,'legacy_links':True,'console_errors':errors}
