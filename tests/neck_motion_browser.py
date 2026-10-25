"""Regression for a continuous coat, contact-before-fall and swallowing presentation."""
import uuid
from new_games_browser import forced_pop


def check_neck_motion(browser, login, restored, observer):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
    context.add_init_script(observer)
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:5000/neck');login(page,'knock-'+uuid.uuid4().hex[:8])
    page.wait_for_function("window.__fn?.state.sideReady&&document.querySelectorAll('[data-neck-spot]').length>0")
    uid=page.evaluate('KingRicoCloud.uid')
    # Layout fixture only: no operation or change to the real emulated wallet.
    page.evaluate('__fn.setState({busy:true,reach:3,floor:3,round:true,roundBet:10})');page.wait_for_timeout(650)
    assert page.locator('.fn-neck image,[data-neck-straight]').count()==0
    assert page.locator('[data-neck-spot]').count()>8
    material=page.locator('[data-neck-spot="3:0"]')
    before=material.evaluate('el=>{const b=el.getBBox();return {width:b.width,height:b.height}}')
    page.screenshot(path='/tmp/neck-continuous-straight.png')
    page.evaluate('__fn.setState({reach:4,floor:4})');page.wait_for_timeout(650)
    after=material.evaluate('el=>{const b=el.getBBox();return {width:b.width,height:b.height}}')
    assert abs(before['width']-after['width'])<.2 and abs(before['height']-after['height'])<.2,(before,after)
    page.evaluate('__fn.setState({reach:33,floor:33})');page.wait_for_timeout(650)
    assert 8<page.locator('[data-neck-spot]').count()<100
    page.screenshot(path='/tmp/neck-continuous-top.png')
    assert page.evaluate('KingRicoCloud.player.balance')==1000
    page.screenshot(path='/tmp/neck-fixed-ribbon.png')
    page.evaluate('()=>{__fn.setState({busy:false});__fn._cloudDeferred=KingRicoCloud.player;__fn.applyCloudPlayer()}');page.wait_for_timeout(600)
    bar=page.locator('.kr-round-controls')

    def contact_before_drop(k):
        forced_pop(page,False)
        bar.get_by_role('button',name='JOGAR' if k==1 else 'SUBIR',exact=True).click()
        page.wait_for_function('__fn.state.lean>.98&&__fn.state.busy')
        assert page.evaluate('k=>__fn.state.fr[k]!=="fall"',k),'Apple fell before contact'
        mouth=page.locator('[data-mouth-anchor]').bounding_box()
        fruit=page.locator(f'[data-neck-fruit="{k}"]').bounding_box()
        assert abs(mouth['x']+mouth['width']/2-fruit['x']-fruit['width']/2)<9,(mouth,fruit)
        assert abs(mouth['y']+mouth['height']/2-fruit['y']-fruit['height']/2)<11,(mouth,fruit)
        page.screenshot(path='/tmp/neck-knock-contact-'+str(k)+'.png')
        page.wait_for_function('k=>__fn.state.fr[k]==="fall"',arg=k)
        page.wait_for_timeout(220)
        moved=page.locator(f'[data-neck-fruit="{k}"]').bounding_box()
        assert moved['y']+moved['height']/2>fruit['y']+fruit['height']/2+10,(fruit,moved)
        assert page.evaluate('KingRicoCloud.player.neckRound') is None
        page.screenshot(path='/tmp/neck-knock-falling-'+str(k)+'.png')

    contact_before_drop(1)
    assert page.evaluate('KingRicoCloud.player.balance')==990
    # Reload during the fall: the confirmed loss must not debit or draw again.
    page.reload();restored(page,uid);page.wait_for_function('__fn.state.balance===990&&!__fn.state.busy')
    # Freeze a presentation-only mid-swallow frame; no balance/operation is created.
    page.evaluate("__fn.setState({busy:true,reach:1,floor:0,round:true,roundBet:10,lean:1,biteFloor:1,fr:{1:'bite'}})")
    page.wait_for_selector('.fn-mouth-food')
    page.evaluate("()=>{const a=document.querySelector('.fn-mouth-food').getAnimations()[0];a.pause();a.currentTime=150;}")
    page.wait_for_timeout(550)
    dimensions=page.evaluate("()=>({front:Number.parseFloat(getComputedStyle(document.querySelector('.fn-head-front')).height),side:Number.parseFloat(getComputedStyle(document.querySelector('.fn-head-side')).height),scale:new DOMMatrix(getComputedStyle(document.querySelector('.fn-head')).transform).a,food:new DOMMatrix(getComputedStyle(document.querySelector('.fn-mouth-food')).transform).m41})")
    assert dimensions['side']/dimensions['front']<=1.05,dimensions
    assert abs(dimensions['scale']-1)<.01 and dimensions['food']< -10,dimensions
    for prize in page.locator('.fn-prize').all():
        rect=prize.bounding_box();assert rect['x']>=0 and rect['x']+rect['width']<=390
    page.screenshot(path='/tmp/neck-swallow-midpoint.png')
    assert page.evaluate('KingRicoCloud.player.balance')==990
    page.evaluate('()=>{__fn.setState({busy:false});__fn._cloudDeferred=KingRicoCloud.player;__fn.applyCloudPlayer()}');page.wait_for_timeout(600)
    for floor in range(1,7):
        forced_pop(page,True)
        bar.get_by_role('button',name='JOGAR' if floor==1 else 'SUBIR',exact=True).click()
        page.wait_for_function('n=>__fn.state.biteFloor===n',arg=floor)
        assert page.locator('.fn-mouth-food').count()==1
        page.wait_for_function('n=>__fn.state.floor===n&&!__fn.state.busy',arg=floor)
    assert page.evaluate('KingRicoCloud.player.neckRound.savedUnits')==1550
    contact_before_drop(7)
    assert page.evaluate('KingRicoCloud.player.balance')==995.5
    page.reload();restored(page,uid);page.wait_for_function('__fn.state.balance===995.5&&!__fn.state.busy')
    assert not errors,errors
    context.close()
    return {'neck_motion':'passed','continuous_coat':True,'spots_do_not_stretch':True,'contact_before_fall':True,'reload_during_fall':True,'protected_prize_once':True}
