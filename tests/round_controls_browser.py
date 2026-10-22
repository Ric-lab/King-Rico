"""Real start/climb/collect controls, shared wallet and reload against emulators."""
import uuid
from new_games_browser import forced_pop
BASE='http://127.0.0.1:5000'

def check_round_controls(browser,login,restored,claim_gift,observer):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    context.add_init_script(observer)
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/Home.dc.html');login(page,'round-controls-'+uuid.uuid4().hex[:12]);claim_gift(page)
    page.wait_for_function('KingRicoCloud.player.balance===1050');uid=page.evaluate('KingRicoCloud.uid')
    for game,hook,field,step,prize in [('Neck','__fn','neckRound','floor',12),('Flying Clown','__flying','flyingRound','step',15)]:
        page.goto(BASE+'/Fortune%20'+game.replace(' ','%20')+'.dc.html');restored(page,uid)
        bar=page.locator('.kr-round-controls');bar.wait_for()
        assert bar.get_attribute('data-round-phase')=='bet'
        assert bar.get_by_role('button').count()==3
        before=page.evaluate('KingRicoCloud.player.balance')
        bar.get_by_role('button',name='Diminuir aposta',exact=True).tap()
        bar.get_by_role('button',name='Aumentar aposta',exact=True).tap()
        assert page.evaluate('KingRicoCloud.player.balance')==before
        forced_pop(page);bar.get_by_role('button',name='JOGAR',exact=True).dblclick()
        page.wait_for_function('(x)=>KingRicoCloud.player[x.field]?.[x.step]===1&&!window[x.hook].state.busy',arg={'field':field,'step':step,'hook':hook},timeout=20000)
        assert page.evaluate('KingRicoCloud.player.balance')==before-10
        assert bar.get_attribute('data-round-phase')=='playing'
        assert bar.get_by_role('button').count()==2
        assert bar.get_by_role('button',name='Diminuir aposta',exact=True).count()==0
        page.screenshot(path='/tmp/round-controls-real-'+game.replace(' ','-')+'.png')
        page.reload();restored(page,uid)
        page.wait_for_function('(hook)=>window[hook]&&!window[hook].state.busy',arg=hook)
        assert bar.get_attribute('data-round-phase')=='playing'
        assert page.evaluate('KingRicoCloud.player.balance')==before-10
        forced_pop(page);bar.get_by_role('button',name='SUBIR',exact=True).tap()
        page.wait_for_function('(x)=>KingRicoCloud.player[x.field]?.[x.step]===2&&!window[x.hook].state.busy',arg={'field':field,'step':step,'hook':hook},timeout=20000)
        assert page.evaluate('KingRicoCloud.player.balance')==before-10
        bar.get_by_role('button',name='Pegar',exact=False).tap()
        page.wait_for_function('(x)=>!KingRicoCloud.player[x.field]&&KingRicoCloud.player.balance===x.balance',arg={'field':field,'balance':before-10+prize},timeout=20000)
        if game=='Flying Clown':page.get_by_text('VOCÊ GANHOU!',exact=True).tap()
        page.wait_for_selector('.kr-round-controls[data-round-phase="bet"]',timeout=10000)
        page.reload();restored(page,uid)
        assert page.evaluate('KingRicoCloud.player.balance')==before-10+prize
        assert bar.get_attribute('data-round-phase')=='bet'
    assert not errors,errors
    context.close()
    return {'same_two_action_controls':True,'bet_only_before_start':True,'start_debits_once':True,
        'climb_keeps_bet':True,'collect_and_reload_keep_wallet':True,'active_round_restores_controls':True}
