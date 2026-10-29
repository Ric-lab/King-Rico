"""Real pointer gestures and Auth/Firestore emulator transactions for Penalty."""
import re
import uuid

BASE='http://127.0.0.1:5000'

def check_penalty(browser,login,restored,check_menu,claim_gift,login_observer):
    context=browser.new_context(viewport={'width':453,'height':802},timezone_id='America/Sao_Paulo')
    context.add_init_script(login_observer)
    page=context.new_page();errors=[];bad_http=[];external=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('response',lambda response:bad_http.append([response.status,response.url])
        if response.status>=400 and not response.url.endswith('/favicon.ico') else None)
    page.on('request',lambda request:external.append(request.url) if 'unpkg.com' in request.url else None)
    page.add_init_script("localStorage.setItem('fortuneCircus.slot.v3',JSON.stringify({balance:9876543}));localStorage.setItem('fortuneCircus.penalty.v1',JSON.stringify({betIdx:9,step:4,roundBet:1000}));")
    page.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded')
    login(page,'penalty-browser-'+uuid.uuid4().hex[:12])
    uid=page.evaluate('window.KingRicoCloud.uid')
    assert page.evaluate('window.KingRicoCloud.player.balance')==1000,'Imported a local balance'
    claim_gift(page)
    page.wait_for_function('window.KingRicoCloud.player.balance===1050')
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    menu=page.get_by_role('dialog',name='Menu — Home',exact=True)
    menu.get_by_role('group',name='Efeitos sonoros',exact=True).get_by_role('button',name='OFF',exact=True).click()
    menu.get_by_role('group',name='Vibração',exact=True).get_by_role('button',name='50%',exact=True).click()
    page.wait_for_function('window.KingRicoCloud.player.settings.sfxLvl===0 && window.KingRicoCloud.player.settings.vibLvl===1')
    menu.get_by_role('button',name='Fechar menu',exact=True).click()
    common=check_menu(page,'Home',False)
    page.get_by_role('link',name=re.compile('Jogar Fortune Penalty')).click()
    def ready(tab):
        tab.wait_for_function('window.Pen3D?.state==="ready" && window.__pen && window.KingRicoCloud?.player')
        restored(tab,uid)
    ready(page)
    assert page.evaluate('window.__pen.state.balance')==1050,'Imported a local balance'
    assert page.evaluate('window.__pen.state.step')==0,'Imported a local round'
    assert [t.strip() for t in page.locator('[data-penalty-multiplier]').all_text_contents()]==['x1,5','x3','x5','x7','x10','x15','x20','x25','x50','x100']
    assert check_menu(page,'Fortune Pênalti',False)==common
    def outcome(tab,value):
        tab.evaluate('''value=>{
          const original=crypto.getRandomValues.bind(crypto);
          crypto.getRandomValues=array=>array instanceof Uint32Array && array.length===1
            ? (array[0]=value,array) : original(array);
        }''',value)
    def shoot(tab):
        tab.wait_for_function('window.Pen3D.state==="ready" && !window.__pen.busy()')
        points=tab.evaluate('''()=>{
          const c=window.Pen3D,r=c.getBoundingClientRect();
          const project=v=>{const p=v.clone().project(c.cam);return {x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2};};
          return {start:project(c.pos),end:project(new c.T.Vector3(c.kx>0?-3.2:3.2,2.7,0))};
        }''')
        tab.mouse.move(points['start']['x'],points['start']['y']);tab.mouse.down()
        tab.mouse.move(points['end']['x'],points['end']['y']);tab.mouse.up()
    outcome(page,0);shoot(page)
    page.wait_for_function('window.KingRicoCloud.player.penaltyRound?.step===1')
    assert page.evaluate('window.KingRicoCloud.player.balance')==1040
    # Recreate a response lost after commit. Startup must replay the same ID.
    page.evaluate('''()=>{const r=KingRicoCloud.player.penaltyRound;localStorage.setItem(`kingRico.pending.${KingRicoCloud.uid}`,
      JSON.stringify({action:'penalty',game:'penalty',move:'shoot',bet:10,roundId:r.id,requestId:r.id,step:0,quality:window.__pen._cloudShot.quality}));}''')
    page.reload(wait_until='domcontentloaded');ready(page)
    assert page.evaluate('window.__pen.state.step')==1
    assert page.evaluate('window.__pen.state.balance')==1040
    other=context.new_page();other.goto(BASE+'/Fortune%20Penalty.dc.html',wait_until='domcontentloaded');ready(other)
    collect=other.get_by_role('button',name='Pegar 15 moedas',exact=True);collect.dblclick()
    other.wait_for_function('window.KingRicoCloud.player.balance===1055 && !window.KingRicoCloud.player.penaltyRound')
    other.reload(wait_until='domcontentloaded');ready(other)
    assert other.evaluate('window.__pen.state.balance')==1055
    page.wait_for_function('window.__pen.state.balance===1055 && window.__pen.state.step===0');other.close()
    outcome(page,0);shoot(page)
    page.wait_for_function('window.__pen.state.step===1 && !window.__pen.state.flying',timeout=20000)
    page.get_by_role('button',name='Pegar 15 moedas',exact=True).click()
    page.wait_for_function('!!window.__pen.state.win')
    assert page.evaluate('window.KingRicoCloud.player.balance')==1060
    page.get_by_text('OK',exact=True).click()
    page.wait_for_function('window.__pen.state.balance===1060 && !window.__pen.state.paying')
    outcome(page,4252017623);shoot(page)
    page.wait_for_function('window.KingRicoCloud.player.balance===1050 && !window.KingRicoCloud.player.penaltyRound')
    page.reload(wait_until='domcontentloaded');ready(page)
    assert page.evaluate('window.__pen.state.balance')==1050
    assert page.evaluate('window.__pen.state.step')==0
    # A new round continues beyond five, restores at six and settles x100 once.
    outcome(page,0)
    for n in range(1,11):
        shoot(page)
        if n<10:
            page.wait_for_function('(n)=>__pen.state.step===n&&!__pen.state.flying',arg=n,timeout=20000)
            assert page.evaluate('KingRicoCloud.player.balance')==1040
            assert page.evaluate('KingRicoCloud.player.penaltyRound.ladderVersion')==2
            amount=[1.5,3,5,7,10,15,20,25,50,100][n-1]*10
            assert page.get_by_role('button',name='Pegar '+str(int(amount))+' moedas',exact=True).is_visible()
            if n==5:
                collect_box=page.get_by_role('button',name='Pegar 100 moedas',exact=True).bounding_box()
                assert collect_box['y']>=max(c.bounding_box()['y']+c.bounding_box()['height'] for c in page.locator('[data-penalty-multiplier]').all())
                page.screenshot(path='/tmp/king-rico-penalty-five-of-ten.png')
            if n==6:
                page.reload(wait_until='domcontentloaded');ready(page);outcome(page,0)
                assert page.evaluate('__pen.state.step')==6
                assert page.locator('[data-penalty-multiplier]').count()==10
        else:
            page.wait_for_function('__pen.state.win?.w===1000',timeout=20000)
            assert page.evaluate('KingRicoCloud.player.balance')==2040
            page.reload(wait_until='domcontentloaded');ready(page)
            assert page.evaluate('KingRicoCloud.player.balance')==2040
            assert page.evaluate('KingRicoCloud.player.penaltyRound') is None
    for width,height in [(360,780),(390,844)]:
        page.set_viewport_size({'width':width,'height':height})
        page.wait_for_function('([w,h])=>__pen.state.vw===w&&__pen.state.vh===h-60',arg=[width,height])
        for chip in page.locator('[data-penalty-multiplier]').all():
            box=chip.bounding_box();assert box['x']>=-.5 and box['x']+box['width']<=width+.5
        page.screenshot(path='/tmp/king-rico-penalty-ten-'+str(width)+'.png')
    page.goto(BASE+'/Fortune%20Neck.dc.html',wait_until='domcontentloaded')
    page.wait_for_function('window.__fn && window.KingRicoCloud?.player');restored(page,uid)
    assert page.evaluate('window.__fn.state.balance')==2040
    assert not errors,errors
    assert not bad_http,bad_http
    assert not external,external
    context.close()
    return {'penalty_home_link':True,'ten_steps_and_x100_once':True,'reload_after_six_goals':True,'penalty_real_swipe':True,'penalty_local_three':True,
      'penalty_ignores_legacy_balance_and_round':True,'penalty_pending_shot_recovery':True,
      'penalty_cross_tab_collection_once':True,'penalty_reload_during_shot_and_payout':True,
      'penalty_shared_menu_wallet_and_identity':True,'penalty_prize_and_loss_persist':True}
