"""Regression for the opaque yellow outline and contact-before-fall presentation."""
import uuid
from new_games_browser import forced_pop


def check_neck_motion(browser, login, restored, observer):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
    context.add_init_script(observer)
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:5000/neck');login(page,'knock-'+uuid.uuid4().hex[:8])
    page.wait_for_function('window.__fn?.state.sideReady&&document.querySelector(".fn-neck canvas")?.hidden===false')
    uid=page.evaluate('KingRicoCloud.uid')
    # Layout fixture only: no operation or change to the real emulated wallet.
    page.evaluate('__fn.setState({busy:true,reach:3,floor:3,round:true,roundBet:10})');page.wait_for_timeout(650)
    samples=page.evaluate('''()=>{const c=document.querySelector('.fn-neck canvas'),d=c.width/250,x=c.getContext('2d');
      return [2,7,53,59].map(n=>x.getImageData(Math.round(n*d),Math.round(70*d),1,1).data[3]);}''')
    assert samples[0]==0 and samples[3]==0 and samples[1]>240 and samples[2]>240,samples
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
        fruit=page.locator('img[src="assets/neck/branch-v2.webp"]').nth(k-1).locator('..').locator('div[style*="left: 260px"]').bounding_box()
        assert abs(mouth['x']+mouth['width']/2-fruit['x']-fruit['width']/2)<9,(mouth,fruit)
        assert abs(mouth['y']+mouth['height']/2-fruit['y']-fruit['height']/2)<11,(mouth,fruit)
        page.screenshot(path='/tmp/neck-knock-contact-'+str(k)+'.png')
        page.wait_for_function('k=>__fn.state.fr[k]==="fall"',arg=k)
        page.wait_for_timeout(220)
        moved=page.locator('img[src="assets/neck/branch-v2.webp"]').nth(k-1).locator('..').locator('div[style*="left: 260px"]').bounding_box()
        assert moved['y']+moved['height']/2>fruit['y']+fruit['height']/2+10,(fruit,moved)
        assert page.evaluate('KingRicoCloud.player.neckRound') is None
        page.screenshot(path='/tmp/neck-knock-falling-'+str(k)+'.png')

    contact_before_drop(1)
    assert page.evaluate('KingRicoCloud.player.balance')==990
    # Reload during the fall: the confirmed loss must not debit or draw again.
    page.reload();restored(page,uid);page.wait_for_function('__fn.state.balance===990&&!__fn.state.busy')
    for floor in range(1,7):
        forced_pop(page,True)
        bar.get_by_role('button',name='JOGAR' if floor==1 else 'SUBIR',exact=True).click()
        page.wait_for_function('n=>__fn.state.floor===n&&!__fn.state.busy',arg=floor)
    assert page.evaluate('KingRicoCloud.player.neckRound.savedUnits')==1550
    contact_before_drop(7)
    assert page.evaluate('KingRicoCloud.player.balance')==995.5
    page.reload();restored(page,uid);page.wait_for_function('__fn.state.balance===995.5&&!__fn.state.busy')
    assert not errors,errors
    context.close()
    return {'neck_motion':'passed','textured_width':True,'contact_before_fall':True,'reload_during_fall':True,'protected_prize_once':True}
