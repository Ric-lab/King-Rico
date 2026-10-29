"""Viewport-aligned HUD, last bet intent and essential art readiness."""
import uuid
from pathlib import Path

BASE='http://127.0.0.1:5000'

def check_ui_consistency(browser,login,restored,claim_gift,observer):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    context.add_init_script(observer);page=context.new_page();errors=[];missing=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:missing.append(r.url) if r.status==404 else None)
    page.goto(BASE+'/home');login(page,'ui-review-'+uuid.uuid4().hex[:10]);claim_gift(page);uid=page.evaluate('KingRicoCloud.uid')
    out=Path('/tmp/king-rico-ui-review');out.mkdir(exist_ok=True)
    routes=['home','circus?from=home','wheel','clown','penalty','neck','flying-clown','fingo','33']
    geometry={}
    for route in routes:
        page.goto(BASE+'/'+route,wait_until='domcontentloaded');restored(page,uid)
        page.wait_for_selector('#kr-boot-screen',state='hidden',timeout=30000)
        name=route.split('?')[0]
        for w,h in [(390,844),(360,640),(320,568)]:
            page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(300)
            page.wait_for_function('''() => {
              const m=[...document.querySelectorAll('.kr-menu-button')].filter(e=>e.getBoundingClientRect().width).at(-1),r=m.getBoundingClientRect();
              const s=Math.min(innerWidth/453,KingRicoViewport.height/802),x=innerWidth/2+(226.5-40.667)*s-22,y=60+34.5*s-22;
              return Math.abs(r.x-x)<1.2&&Math.abs(r.y-y)<1.2;
            }''',timeout=5000)
            values=page.evaluate('''()=>{
              const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}};
              const shown=e=>e.getBoundingClientRect().width&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]');
              return {menu:[...document.querySelectorAll('.kr-menu-button')].filter(shown).map(box),home:[...document.querySelectorAll('.kr-hud-home')].filter(shown).map(box),wallet:[...document.querySelectorAll('.kr-hud-balance,.kr-home-wallet')].filter(shown).map(box)};
            }''')
            geometry[name+':'+str(w)]=values
            menu=values['menu'][-1]
            assert menu['w']>=43.9 and menu['h']>=43.9,(name,w,values)
            if name=='home':geometry['reference:'+str(w)]=values
            else:
                ref=geometry['reference:'+str(w)]['menu'][-1]
                assert abs(menu['x']-ref['x'])<1.2 and abs(menu['y']-ref['y'])<1.2,(name,w,menu,ref)
                home=values['home'][-1];assert home['x']+home['w']<=menu['x']-2,(name,w,'touch regions overlap')
            page.screenshot(path=str(out/f'{name}-{w}.png'))
        page.set_viewport_size({'width':390,'height':844})
        if name=='home':
            page.locator('[data-home-scroll]').evaluate('el=>el.scrollTop=250')
            page.evaluate('()=>{const n=document.createElement("i");n.dataset.reviewProbe="";document.body.append(n);}')
            page.wait_for_timeout(150)
            assert page.locator('.kr-home-header .kr-menu-button').bounding_box()['y']<60,'Header became fixed after another render'
            page.locator('[data-review-probe]').evaluate('el=>el.remove()')
            page.locator('[data-home-scroll]').evaluate('el=>el.scrollTop=0')
    # Fast return to the saved bet, including a write already in flight.
    for route,hook,key in [('neck','__fn','neckBetIdx'),('wheel','__fw','wheelBetIdx'),('clown','__clown','clownBetIdx'),('flying-clown','__flying','flyingBetIdx'),('fingo','__fg','fingoBetIdx'),('33','KingRico21','twentyOneBetIdx')]:
        page.goto(BASE+'/'+route);restored(page,uid);page.wait_for_selector('#kr-boot-screen',state='hidden')
        page.evaluate('key=>KingRicoCloud.settings({[key]:3})',key);page.wait_for_timeout(600)
        page.get_by_role('button',name='Diminuir aposta',exact=True).tap()
        page.get_by_role('button',name='Aumentar aposta',exact=True).tap();page.wait_for_timeout(900)
        assert page.evaluate('key=>KingRicoCloud.player.settings[key]',key)==3,(route,'last bet lost')
        page.reload();restored(page,uid)
        assert page.evaluate('key=>KingRicoCloud.player.settings[key]',key)==3,(route,'reload changed bet')
    # Retaining critical art must retain the loading barrier, then release it.
    for route,asset in [('circus?from=home','symbols-v7.webp'),('wheel','wheel/gold-atlas.webp'),('clown','clown/clown.webp'),('penalty','penalty/jump.webp'),('neck','neck/g-body.webp'),('flying-clown','flying/b0.webp'),('33','symbols-v7.webp')]:
        tab=context.new_page();held=[];tab.route('**/assets/'+asset,lambda r:held.append(r))
        tab.goto(BASE+'/'+route,wait_until='domcontentloaded');restored(tab,uid);tab.wait_for_timeout(350)
        assert held,(route,'asset was not held')
        assert tab.locator('#kr-boot-screen').is_visible(),(route,'opened before its artwork')
        for r in held:r.continue_()
        tab.unroute('**/assets/'+asset);tab.wait_for_selector('#kr-boot-screen',state='hidden',timeout=30000);tab.close()
    failed=context.new_page();failed.route('**/assets/clown/clown.webp',lambda r:r.abort())
    failed.goto(BASE+'/clown',wait_until='domcontentloaded');restored(failed,uid)
    failed.get_by_role('button',name='Tentar novamente',exact=True).wait_for(state='visible')
    balance=failed.evaluate('KingRicoCloud.player.balance')
    failed.unroute('**/assets/clown/clown.webp')
    failed.get_by_role('button',name='Tentar novamente',exact=True).click()
    restored(failed,uid);failed.wait_for_selector('#kr-boot-screen',state='hidden')
    assert failed.evaluate('KingRicoCloud.player.balance')==balance,'Artwork retry created a bet'
    failed.close()
    assert not errors,errors;assert not missing,missing
    context.close()
    return {'hud_same_position_three_mobile_sizes':True,'header_targets_44px_without_overlap':True,'last_bet_survives_fast_adjustment_and_reload':True,'essential_art_barrier_all_seven_games':True,'errors':errors,'missing':missing,'geometry':geometry}
