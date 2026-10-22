"""Production-shaped Clown/Bounce integration with real pointers and emulator accounts."""
import re
import uuid
BASE='http://127.0.0.1:5000'
def check_clown_bounce(browser,login,restored,check_menu,claim_gift,observer):
    context=browser.new_context(viewport={'width':453,'height':802},timezone_id='America/Sao_Paulo')
    context.add_init_script(observer)
    page=context.new_page();errors=[];bad=[];external=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=400 and not r.url.endswith('/favicon.ico') else None)
    page.on('request',lambda r:external.append(r.url) if 'unpkg.com' in r.url else None)
    page.add_init_script("localStorage.setItem('fortuneCircus.slot.v3',JSON.stringify({balance:9876543}));")
    page.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded');login(page,'clown-'+uuid.uuid4().hex[:12])
    page.evaluate('KingRicoCloud.settings({sfxLvl:0,vibLvl:1})');page.wait_for_function('KingRicoCloud.player.settings.sfxLvl===0 && KingRicoCloud.player.settings.vibLvl===1')
    uid=page.evaluate('KingRicoCloud.uid');assert page.evaluate('KingRicoCloud.player.balance')==1000
    claim_gift(page);page.wait_for_function('KingRicoCloud.player.balance===1050')
    page.get_by_role('link',name='Jogar Fortune Clown',exact=True).click()
    def ready():
        page.wait_for_function('window.__clown && window.ClownBall?.texs && window.KingRicoCloud?.player',timeout=30000)
        restored(page,uid)
        page.wait_for_function('document.querySelectorAll("[data-clown-marker]").length===10 && [...document.querySelectorAll("[data-clown-marker]")].every(img=>img.complete && img.naturalWidth>0)',timeout=20000)
    ready();check_menu(page,'Fortune Clown',False);page.screenshot(path='/tmp/king-rico-clown-ready.png')
    def swipe(x,y):
        page.wait_for_function('!__clown.state.busy && !__clown._request')
        points=page.evaluate('''([x,y])=>{const r=__clown.stageRef.current.getBoundingClientRect(),s=r.width/453,p=__clown.facePoint({x,y});return {a:[r.x+226*s,r.y+670*s],b:[r.x+p.x*s,r.y+p.y*s]};}''',[x,y])
        page.mouse.move(*points['a']);page.mouse.down();page.mouse.move(*points['b'],steps=8);page.mouse.up()
    # v5 no longer guarantees the first hit. Force only this test's first draw.
    page.evaluate('''()=>{const original=crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1){
        crypto.getRandomValues=original;a[0]=0;return a;}return original(a);};}''')
    swipe(226.5,442)
    page.wait_for_function('KingRicoCloud.player.clownRound?.used===1')
    assert page.evaluate('KingRicoCloud.player.balance')==1040
    assert page.evaluate('KingRicoCloud.player.clownRound.sumUnits')==150
    # Simulate a response lost after the first committed throw.
    page.evaluate('''()=>{const r=KingRicoCloud.player.clownRound;localStorage.setItem(`kingRico.pending.${KingRicoCloud.uid}`,JSON.stringify({action:'clown',game:'clown',bet:10,roundId:r.id,requestId:r.id,used:0,selected:0}));}''')
    page.reload(wait_until='domcontentloaded');ready()
    assert page.evaluate('__clown.state.left')==9
    assert page.evaluate('__clown.state.sum')==1.5
    assert page.evaluate('KingRicoCloud.player.balance')==1040
    for used in range(1,10):
        swipe(226,190)
        if used<9:
            try:page.wait_for_function('(n)=>KingRicoCloud.player.clownRound?.used===n',arg=used+1,timeout=12000)
            except Exception:
                print('Clown throw failed',used,page.evaluate('({state:__clown.state,drag:__clown.drag,notice:document.querySelector("[data-cloud-notice]")?.textContent})'),errors,flush=True)
                raise
    page.wait_for_function('!!__clown.state.win',timeout=20000)
    assert page.evaluate('KingRicoCloud.player.balance')==1041.5
    assert page.evaluate('__clown.state.win.w')==1.5
    page.get_by_text('OK',exact=True).dblclick()
    page.reload(wait_until='domcontentloaded');ready()
    assert page.evaluate('__clown.state.balance')==1041.5
    page.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded');restored(page,uid)
    # Bounce is parked; its existing round is still reachable by its direct URL.
    page.goto(BASE+'/Fortune%20Bounce.dc.html',wait_until='domcontentloaded')
    page.wait_for_function('window.Bounce3D && window.__bounce && KingRicoCloud.player',timeout=30000);restored(page,uid)
    check_menu(page,'Fortune Bounce',False)
    assert page.evaluate('__bounce.state.balance')==1041.5
    scene=page.locator('bounce-3d');box=scene.bounding_box()
    page.mouse.click(box['x']+box['width']/2,box['y']+box['height']*.7)
    page.wait_for_function('KingRicoCloud.player.bounceRound && KingRicoCloud.player.balance===1031.5',timeout=20000)
    page.wait_for_function('KingRicoCloud.player.bounceRound?.n>=1',timeout=20000)
    saved=page.evaluate('KingRicoCloud.player.bounceRound.n')
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.Bounce3D?.state==="resume" && window.__bounce?.state.active',timeout=30000);restored(page,uid)
    assert page.evaluate('__bounce.state.n')==saved
    assert page.evaluate('__bounce.state.balance')==1031.5
    # Physical fall must settle the existing round, without another debit.
    page.evaluate('Bounce3D.fall()')
    page.wait_for_function('!KingRicoCloud.player.bounceRound',timeout=20000)
    assert page.evaluate('KingRicoCloud.player.balance')==1031.5
    page.goto(BASE+'/Fortune%20Neck.dc.html',wait_until='domcontentloaded');restored(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==1031.5
    assert not errors,errors
    assert not bad,bad
    assert not external,external
    context.close()
    return {'clown_real_swipe_and_prize':True,'clown_pending_recovery':True,'clown_ten_balls_and_single_payout':True,'bounce_actual_start_and_checkpoint_restore':True,'bounce_fall_persists':True,'all_games_share_identity_wallet_and_menu':True,'three_served_locally':True}
