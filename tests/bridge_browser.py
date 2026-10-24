"""The experimental bridge uses real Auth/Firestore emulators and visible controls."""
import uuid

def check_bridge(browser,login,restored_without_login,login_observer):
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    context.add_init_script(login_observer)
    page=context.new_page();errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto('http://127.0.0.1:5000/bridge');login(page,'bridge-'+uuid.uuid4().hex[:8])
    page.wait_for_function('window.__bridge?.state.ready')
    uid=page.evaluate('KingRicoCloud.uid')
    def fixed_path():
        page.evaluate('''()=>{const native=crypto.getRandomValues.bind(crypto);
          crypto.getRandomValues=a=>a instanceof Uint32Array&&a.length===1?(a[0]=0,a):native(a);}''')
    def idle():
        page.wait_for_function('__bridge.state.round&&!__bridge.state.busy')
    def start():
        fixed_path();page.get_by_role('button',name='JOGAR',exact=True).click();idle()
    start()
    assert page.evaluate('__bridge.state.balance')==990
    assert page.evaluate('__bridge.state.round.safeSides')==[0]*6
    page.locator('[data-row="0"][data-side="0"]').dblclick();idle()
    page.wait_for_function('__bridge.state.viewStep===1')
    assert page.evaluate('__bridge.state.balance')==990
    path=page.evaluate('__bridge.state.round.safeSides')
    page.reload();restored_without_login(page,uid)
    page.wait_for_function('__bridge.state.round?.step===1')
    assert page.evaluate('__bridge.state.round.safeSides')==path
    page.get_by_role('button',name='Pegar 19 moedas',exact=True).click()
    page.get_by_role('dialog',name='PRÊMIO NA MÃO!').wait_for()
    page.wait_for_function('!__bridge.state.busy')
    assert page.evaluate('KingRicoCloud.player.balance')==1009
    page.get_by_role('button',name='JOGAR DE NOVO').click()
    start();page.locator('[data-row="0"][data-side="1"]').click()
    page.get_by_role('dialog',name='OPS! NA REDE!').wait_for()
    assert page.evaluate('KingRicoCloud.player.balance')==999
    page.reload();restored_without_login(page,uid)
    page.wait_for_function('__bridge.state.ready')
    assert page.evaluate('__bridge.state.balance')==999
    start()
    for step in range(6):
        page.locator(f'[data-row="{step}"][data-side="0"]').click()
        page.wait_for_function(f'!__bridge.state.busy&&(__bridge.state.round?.step==={step+1}||!!__bridge.state.result)')
    page.get_by_role('dialog',name='ATRAVESSOU!').wait_for()
    assert page.evaluate('KingRicoCloud.player.balance')==1589
    # Display failure cannot affect a persisted prize or the next reload.
    page.evaluate("()=>{Element.prototype.animate=()=>{throw Error('Animation unavailable')};}")
    page.get_by_role('button',name='JOGAR DE NOVO').click()
    start();page.locator('[data-row="0"][data-side="0"]').click();idle()
    page.wait_for_function('__bridge.state.round.step===1')
    page.get_by_role('button',name='Pegar 19 moedas',exact=True).click()
    page.get_by_role('dialog',name='PRÊMIO NA MÃO!').wait_for()
    assert page.evaluate('KingRicoCloud.player.balance')==1598
    page.goto('http://127.0.0.1:5000/neck');restored_without_login(page,uid)
    page.wait_for_function('window.__fn?.state.balance===1598')
    assert not errors,errors
    context.close()
    return {'bridge':'passed','saved_path':True,'reload':True,'single_collection':True,'six_jumps':True,'loss':True,'animation_failure':True,'shared_wallet':True}
