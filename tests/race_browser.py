"""Real race UI, Google-emulated identity, shared wallet and immutable replay."""
import json,uuid
BASE='http://127.0.0.1:5000'
def check_race(browser,login,restored,claim_gift,observer):
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    context.add_init_script(observer)
    context.add_init_script("const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>a instanceof Uint16Array&&a.length===1?(a[0]=21,a):original(a);")
    page=context.new_page();errors=[];missing=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:missing.append(r.url) if r.status==404 else None)
    page.goto(BASE+'/Home.dc.html');login(page,'race-browser-'+uuid.uuid4().hex[:10]);claim_gift(page);uid=page.evaluate('KingRicoCloud.uid')
    page.get_by_role('link',name='Jogar Fortune Race',exact=True).click();restored(page,uid);page.wait_for_function('!!window.KingRicoRace?.scene',timeout=60000)
    page.get_by_role('button',name='Bolinha 2: Happeach',exact=True).tap();assert page.locator('.choice[aria-pressed=true]').get_attribute('data-index')=='1'
    before=page.evaluate('KingRicoCloud.player.balance');page.locator('#start').tap();page.wait_for_function('KingRicoRace.scene.status().elapsed>5',timeout=90000)
    expected=before-10+38;assert page.evaluate('KingRicoCloud.player.balance')==expected
    assert page.locator('#balance').inner_text()=='1.040','Winning credit must wait for the arrival reveal'
    assert page.locator('.choice:not([disabled])').count()==0
    assert page.locator('.ball-label.selected').is_visible()
    page.get_by_role('button',name='Abrir menu').tap();page.get_by_role('dialog',name='Menu — Fortune Race').wait_for();paused=page.evaluate('KingRicoRace.scene.status().elapsed');page.wait_for_timeout(500);assert page.evaluate('KingRicoRace.scene.status().elapsed')==paused
    page.get_by_role('button',name='Fechar menu').tap();page.screenshot(path='/tmp/race-cloud-running.png')
    saved=page.evaluate('JSON.parse(localStorage.getItem(`kingRico.race.${KingRicoCloud.uid}`))');assert saved['elapsed']>=4
    page.reload();restored(page,uid);page.wait_for_function('!!window.KingRicoRace?.scene&&KingRicoRace.isBusy()',timeout=60000)
    assert page.evaluate('KingRicoCloud.player.balance')==expected
    assert page.evaluate('KingRicoRace.scene.status().seed')==21;assert page.evaluate('KingRicoRace.scene.status().elapsed')>=saved['elapsed']-.1
    page.wait_for_selector('#result-dialog[open]',timeout=120000);assert page.locator('#result-title').inner_text()=='A sua venceu!';assert page.evaluate('KingRicoRace.scene.status().order[0]')==1
    page.screenshot(path='/tmp/race-cloud-win.png')
    replay=page.evaluate('async id=>await KingRicoCloud.race(10,1,21,id)',saved['roundId']);assert replay['replayed'] is True;assert page.evaluate('KingRicoCloud.player.balance')==expected
    second=context.new_page();second.goto(BASE+'/Fortune%20Race.dc.html');restored(second,uid);second.wait_for_selector('#result-dialog[open]',timeout=60000);assert second.evaluate('KingRicoCloud.player.balance')==expected;second.close();page.bring_to_front()
    page.locator('#result-done').tap();page.wait_for_selector('#start:not([disabled])')
    page.get_by_role('button',name='Bolinha 4: Diamante',exact=True).tap();page.locator('#bet-down').tap();page.locator('#bet-down').tap();page.wait_for_function('KingRicoCloud.player.settings.raceBetIdx===1')
    page.locator('#start').tap();page.wait_for_function('KingRicoRace.scene.status().elapsed>3',timeout=60000);assert page.evaluate('KingRicoCloud.player.balance')==expected-2.5
    page.wait_for_selector('#result-dialog[open]',timeout=120000);assert page.locator('#result-title').inner_text()=='Happeach venceu';assert page.locator('#result-amount').inner_text()=='−2,5';assert page.evaluate('KingRicoRace.scene.status().order[0]')==1
    page.locator('#result-done').tap();page.set_viewport_size({'width':320,'height':568});page.wait_for_timeout(300);page.screenshot(path='/tmp/race-cloud-narrow.png');assert page.locator('#start').bounding_box()['width']>250
    page.get_by_role('button',name='Abrir menu').tap();page.get_by_role('dialog',name='Menu — Fortune Race').wait_for();page.get_by_role('button',name='Tabela de pagamentos').tap();page.get_by_role('dialog',name='Escolha e torça').wait_for();page.locator('#help-done').tap()
    page.get_by_role('link',name='Voltar para o início').tap();restored(page,uid);assert page.evaluate('KingRicoCloud.player.balance')==expected-2.5
    assert not errors,errors;assert not missing,missing
    context.close();return {'race_home':True,'selection_and_locked_bets':True,'win_3_8x_and_loss':True,'same_saved_seed_and_visible_winner':True,'menu_pauses':True,'reload_resumes_same_race':True,'same_request_and_two_tabs_credit_once':True,'shared_wallet_and_google_session':True,'narrow_mobile_and_help':True,'no_console_or_missing_assets':True}
