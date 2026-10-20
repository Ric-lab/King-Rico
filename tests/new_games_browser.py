"""Real touch, Google test identity and Firestore for Fortune 21/Flying Clown."""
import uuid
BASE='http://127.0.0.1:5000'

def seed_cards(page,prefix):
    page.evaluate('''prefix=>{
      const target=[...prefix,...Array.from({length:52},(_,i)=>i).filter(i=>!prefix.includes(i))],current=Array.from({length:52},(_,i)=>i),draws=[];
      for(let i=51;i>0;i--){const j=current.indexOf(target[i]);draws.push(Math.floor((j+.5)/(i+1)*2**32));[current[i],current[j]]=[current[j],current[i]];}
      window.__testDraws=draws;
      if(!window.__nativeRandom){window.__nativeRandom=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{
        if(a instanceof Uint32Array&&a.length===1&&window.__testDraws?.length){a[0]=window.__testDraws.shift();return a;}return window.__nativeRandom(a);
      };}
    }''',prefix)

def tap_pop(page):
    page.bring_to_front()
    box=page.get_by_role('button',name='Estourar um balão').bounding_box()
    page.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2)

def forced_pop(page,success=True):
    seed_cards(page,[])
    page.evaluate('(n)=>window.__testDraws=[n]',0 if success else 4294967295)

def check_new_games(browser,login,restored,claim_gift,observer):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    context.add_init_script(observer)
    context.add_init_script("window.__inputEvents=[];['touchstart','pointerdown','click'].forEach(type=>document.addEventListener(type,e=>__inputEvents.push({type,id:e.target.id}),true));")
    context.add_init_script("localStorage.setItem('fortuneCircus.slot.v3',JSON.stringify({balance:9999999}));localStorage.setItem('king-rico-fortune-21-demo-v1',JSON.stringify({balance:8888888}));")
    page=context.new_page();errors=[];missing=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:missing.append(r.url) if r.status==404 else None)
    page.goto(BASE+'/Home.dc.html');login(page,'newgames-'+uuid.uuid4().hex[:12]);claim_gift(page)
    uid=page.evaluate('KingRicoCloud.uid');page.wait_for_function('KingRicoCloud.player.balance===1050')
    page.evaluate('KingRicoCloud.settings({sfxLvl:0,vibLvl:1})');page.wait_for_function('KingRicoCloud.player.settings.sfxLvl===0')
    page.get_by_role('link',name='Jogar Fortune 21',exact=True).click();restored(page,uid)
    page.wait_for_selector('#start:not([disabled])')
    page.get_by_role('button',name='Abrir menu').tap()
    menu=page.get_by_role('dialog',name='Menu — Fortune 21',exact=True);menu.wait_for()
    assert menu.get_by_role('button',name='Sair da conta').count()==1
    assert menu.get_by_role('group',name='Efeitos sonoros').get_by_role('button',name='OFF',exact=True).get_attribute('aria-pressed')=='true'
    menu.get_by_role('button',name='Tabela de pagamentos').tap();page.get_by_role('dialog',name='Como jogar').wait_for();page.locator('#help-done').tap()
    seed_cards(page,[9,5,7,6,22]);page.locator('#start').tap();page.wait_for_function('KingRicoCloud.player.twentyOneRound?.turn===1')
    assert page.evaluate('KingRicoCloud.player.balance')==1040
    assert page.locator('#dealer-hand .back').count()==1
    original=page.evaluate('KingRicoCloud.player.twentyOneRound')
    page.evaluate('''r=>localStorage.setItem(`kingRico.pending.${KingRicoCloud.uid}`,JSON.stringify({action:'twentyOne',game:'twentyOne',move:'start',bet:10,roundId:r.id,requestId:r.id,turn:0}))''',original)
    page.reload();restored(page,uid)
    assert page.evaluate('KingRicoCloud.player.twentyOneRound.id')==original['id']
    assert page.evaluate('KingRicoCloud.player.balance')==1040
    page.wait_for_selector('#stand:not([disabled])');page.locator('#stand').tap();page.wait_for_function('KingRicoCloud.player.twentyOneRound.phase==="dealer"')
    second=context.new_page();second.goto(BASE+'/Fortune%2021.dc.html');restored(second,uid)
    page.reload();restored(page,uid);page.wait_for_selector('#result-dialog[open]')
    assert page.evaluate('KingRicoCloud.player.balance')==1060
    assert page.locator('#result-title').inner_text()=='Você ganhou!'
    box=page.locator('#result-dialog').bounding_box();assert box['x']>=0 and box['x']+box['width']<=390 and box['y']>=0 and box['y']+box['height']<=844,box
    second.wait_for_function('KingRicoCloud.player.balance===1060');second.close();page.bring_to_front();page.screenshot(path='/tmp/king-rico-21-win.png')
    page.reload();restored(page,uid);page.wait_for_selector('#result-dialog[open]');page.bring_to_front();page.locator('#collect').tap();page.wait_for_selector('#result-dialog',state='hidden')
    assert page.evaluate('KingRicoCloud.player.balance')==1060
    page.locator('#bet-down').tap();page.locator('#bet-down').tap();page.wait_for_function('KingRicoCloud.player.settings.twentyOneBetIdx===1')
    seed_cards(page,[0,8,9,7]);page.locator('#start').tap();page.wait_for_selector('#result-dialog[open]')
    assert page.evaluate('KingRicoCloud.player.balance')==1063.75
    assert page.locator('#result-amount').inner_text()=='6,25'
    page.bring_to_front();page.locator('#collect').tap();page.wait_for_selector('#result-dialog',state='hidden');page.wait_for_selector('#start:not([disabled])')
    seed_cards(page,[9,8,7,6,22]);page.locator('#start').tap();page.wait_for_selector('#hit:not([disabled])');page.locator('#hit').tap();page.wait_for_selector('#result-dialog[open]')
    assert page.locator('#result-title').inner_text()=='Passou de 21.'
    assert page.evaluate('KingRicoCloud.player.balance')==1061.25
    page.bring_to_front();page.locator('#collect').tap();page.wait_for_selector('#result-dialog',state='hidden');page.get_by_role('link',name='Voltar para o início').tap();restored(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==1061.25
    page.get_by_role('link',name='Jogar Fortune Flying Clown',exact=True).click();restored(page,uid)
    def flying_ready(tab):
        tab.wait_for_function('window.__flying && __flying.imgs.every(i=>i.complete&&i.naturalWidth>0) && !__flying.state.busy && !__flying._request && __flying.mode==="idle"',timeout=20000)
    flying_ready(page)
    page.get_by_role('button',name='Abrir menu').tap();page.get_by_role('dialog',name='Menu — Fortune Flying Clown').wait_for()
    page.get_by_role('button',name='Tabela de pagamentos').tap();page.get_by_text('TABELA DE PAGAMENTOS',exact=True).wait_for()
    page.get_by_text('FECHAR',exact=True).tap();page.get_by_role('button',name='Fechar menu').tap()
    before=page.evaluate('KingRicoCloud.player.balance');forced_pop(page)
    point=page.evaluate('''()=>{const g=__flying,r=g.canvasRef.current.getBoundingClientRect(),b=g.balls[0],s=r.width/453;return {x:r.x+b.cx*s,y:r.y+b.cy*s,id:b.id}}''')
    page.touchscreen.tap(point['x'],point['y']);page.wait_for_function('KingRicoCloud.player.flyingRound?.step===1')
    assert page.evaluate('KingRicoCloud.player.balance')==before-10
    page.evaluate('''selected=>{const r=KingRicoCloud.player.flyingRound;localStorage.setItem(`kingRico.pending.${KingRicoCloud.uid}`,JSON.stringify({action:'flying',game:'flying',move:'pop',bet:10,roundId:r.id,requestId:r.id,step:0,selected}));}''',point['id'])
    page.reload();restored(page,uid);flying_ready(page)
    assert page.evaluate('__flying.balls.length')==9
    assert page.evaluate('KingRicoCloud.player.balance')==before-10
    page.get_by_role('link',name='Voltar para o início').tap();restored(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==before-10
    page.get_by_role('link',name='Jogar Fortune Flying Clown',exact=True).click();restored(page,uid);flying_ready(page)
    second=context.new_page();second.goto(BASE+'/Fortune%20Flying%20Clown.dc.html');restored(second,uid);flying_ready(second)
    page.evaluate('()=>{__flying.collectBtn();}');second.evaluate('()=>{__flying.collectBtn();}')
    page.wait_for_function('(b)=>KingRicoCloud.player.balance===b+2 && !KingRicoCloud.player.flyingRound',arg=before)
    second.wait_for_function('(b)=>KingRicoCloud.player.balance===b+2',arg=before)
    page.wait_for_function('!!__flying.state.win');page.get_by_text('VOCÊ GANHOU!',exact=True).wait_for();page.screenshot(path='/tmp/king-rico-flying-prize.png')
    second.close();page.bring_to_front();page.reload();restored(page,uid);flying_ready(page)
    assert page.evaluate('KingRicoCloud.player.balance')==before+2
    forced_pop(page,False);tap_pop(page)
    page.wait_for_function('(b)=>KingRicoCloud.player.balance===b-8 && !KingRicoCloud.player.flyingRound',arg=before)
    page.wait_for_function('__flying.mode==="fall" || __flying.mode==="land" || __flying.mode==="down"');page.screenshot(path='/tmp/king-rico-flying-fall.png')
    page.reload();restored(page,uid);flying_ready(page)
    for step in range(10):
        forced_pop(page);tap_pop(page)
        if step<9:
            page.wait_for_function('(n)=>KingRicoCloud.player.flyingRound?.step===n',arg=step+1);flying_ready(page)
        else:page.wait_for_function('!!__flying.state.win',timeout=20000)
    assert page.evaluate('KingRicoCloud.player.balance')==before+182
    assert page.evaluate('__flying.state.win.w')==200
    assert page.evaluate('__flying.state.win.title')=='SAIU VOANDO!'
    page.reload();restored(page,uid);flying_ready(page)
    assert page.evaluate('KingRicoCloud.player.balance')==before+182
    page.evaluate('''()=>localStorage.setItem(`kingRico.pending.${KingRicoCloud.uid}`,JSON.stringify({action:'flying',game:'flying',move:'collect',bet:10,roundId:crypto.randomUUID(),requestId:crypto.randomUUID(),step:1,selected:-1}))''')
    page.reload();restored(page,uid);flying_ready(page)
    assert page.evaluate('KingRicoCloud.player.balance')==before+182
    assert not errors,errors
    assert not missing,missing
    context.close()
    return {'new_games_home_links':True,'21_debit_once':True,'21_natural_cents':True,'21_bank_reload_two_tabs':True,'21_bust_persists':True,'flying_real_balloon_touch':True,'flying_restore_popped_order':True,'flying_collect_once_two_tabs':True,'flying_fall_saved':True,'flying_final_x20_saved':True,'same_google_session_wallet_and_menu':True,'legacy_balances_ignored':True,'stale_pending_does_not_block_login':True}
