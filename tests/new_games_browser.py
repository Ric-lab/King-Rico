"""Real touch, Google test identity and Firestore for Fortune 21/Flying Clown."""
import uuid
BASE='http://127.0.0.1:5000'

def seed_cards(page,prefix):
    page.evaluate('''prefix=>{
      const target=[...prefix,...Array.from({length:52},(_,i)=>i).filter(i=>!prefix.includes(i))],current=Array.from({length:52},(_,i)=>i),draws=[];
      for(let i=51;i>0;i--){const j=current.indexOf(target[i]);draws.push(Math.floor((j+.5)/(i+1)*2**32));[current[i],current[j]]=[current[j],current[i]];}
      let p=target[0]%13+target[2]%13+2,d=target[1]%13+target[3]%13+2,i=4;
      while(p<28)p+=target[i++]%13+1;
      if(p<=33)while(d<p||d===p&&d<=26)d+=target[i++]%13+1;
      const outcome=p>33?'loss':d>33||p>d?'win':p===d?'push':'loss';
      draws.unshift(Math.floor((outcome==='win'?0:outcome==='push'?.45:.9)*2**32));
      window.__testDraws=draws;
      if(!window.__nativeRandom){window.__nativeRandom=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{
        if(a instanceof Uint32Array&&a.length===1&&window.__testDraws?.length){a[0]=window.__testDraws.shift();return a;}return window.__nativeRandom(a);
      };}
    }''',prefix)

def tap_pop(page):
    page.bring_to_front()
    page.locator('[data-cloud-notice]:visible').wait_for(state='hidden')
    label='JOGAR' if page.evaluate('__flying.state.step===0') else 'SUBIR'
    box=page.get_by_role('button',name=label,exact=True).bounding_box()
    page.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2)

def forced_pop(page,success=True):
    seed_cards(page,[])
    page.evaluate('''n=>{const fresh=!window.KingRicoCloud?.player?.flyingRound&&!window.__fn?.state?.floor;window.__testDraws=fresh?(n===0?[0,0,0]:[n,n]):[n];}''',0 if success else 4294967295)

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
    page.get_by_role('link',name='Jogar Fortune 33',exact=True).click();restored(page,uid)
    assert '/Fortune%2033.dc.html' in page.url
    assert page.locator('#help').count()==0
    assert '1 / 11' not in page.locator('body').inner_text()
    page.wait_for_selector('#start:not([disabled])')
    page.get_by_role('button',name='Abrir menu').tap()
    menu=page.get_by_role('dialog',name='Menu — Fortune 33',exact=True);menu.wait_for()
    assert menu.get_by_role('button',name='Sair da conta').count()==1
    assert menu.get_by_role('group',name='Efeitos sonoros').get_by_role('button',name='OFF',exact=True).get_attribute('aria-pressed')=='true'
    menu.get_by_role('button',name='Tabela de pagamentos').tap();page.get_by_role('dialog',name='Como jogar').wait_for()
    assert '1 vale apenas 1' in page.locator('#help-dialog').inner_text()
    assert 'A banca reage à sua mão' in page.locator('#help-dialog').inner_text();page.locator('#help-done').tap()
    seed_cards(page,[12,25,11,10,7,38]);page.locator('#start').tap();page.wait_for_function('KingRicoCloud.player.twentyOneRound?.turn===1')
    assert page.evaluate('KingRicoCloud.player.balance')==1040
    assert page.locator('#dealer-hand .back').count()==1
    assert page.locator('#player-score').inner_text()=='25'
    assert page.locator('#player-hand .card[data-rank="13"]').get_attribute('aria-label')=='Carta 13, King Rico, vale 13 pontos'
    original=page.evaluate('KingRicoCloud.player.twentyOneRound')
    page.evaluate('''r=>localStorage.setItem(`kingRico.pending.${KingRicoCloud.uid}`,JSON.stringify({action:'twentyOne',game:'twentyOne',move:'start',bet:10,roundId:r.id,requestId:r.id,turn:0,target:33}))''',original)
    page.reload();restored(page,uid)
    assert page.evaluate('KingRicoCloud.player.twentyOneRound.id')==original['id']
    assert page.evaluate('KingRicoCloud.player.balance')==1040
    page.wait_for_selector('#hit:not([disabled])');page.locator('#hit').tap();page.wait_for_function('KingRicoCloud.player.twentyOneRound.playerHard===33')
    second=context.new_page();second.goto(BASE+'/Fortune%2021.dc.html');restored(second,uid)
    assert '/Fortune%2033.dc.html' in second.url
    page.reload();restored(page,uid);page.wait_for_selector('#result-dialog[open]')
    assert page.evaluate('KingRicoCloud.player.balance')==1060.8
    assert page.locator('#result-title').inner_text()=='Você ganhou!'
    box=page.locator('#result-dialog').bounding_box();assert box['x']>=0 and box['x']+box['width']<=390 and box['y']>=0 and box['y']+box['height']<=844,box
    second.wait_for_function('KingRicoCloud.player.balance===1060.8');second.close();page.bring_to_front();page.screenshot(path='/tmp/king-rico-33-win.png')
    page.reload();restored(page,uid);page.wait_for_selector('#result-dialog[open]');page.bring_to_front();page.locator('#collect').tap();page.wait_for_selector('#result-dialog',state='hidden')
    assert page.evaluate('KingRicoCloud.player.balance')==1060.8
    page.locator('#bet-down').tap();page.locator('#bet-down').tap();page.wait_for_function('KingRicoCloud.player.settings.twentyOneBetIdx===1')
    seed_cards(page,[12,25,11,24,7,20]);page.locator('#start').tap();page.wait_for_selector('#hit:not([disabled])');page.locator('#hit').tap();page.wait_for_selector('#result-dialog[open]')
    assert page.evaluate('KingRicoCloud.player.balance')==1060.8
    assert page.locator('#result-amount').inner_text()=='2,5'
    page.bring_to_front();page.locator('#collect').tap();page.wait_for_selector('#result-dialog',state='hidden');page.wait_for_selector('#start:not([disabled])')
    seed_cards(page,[12,0,25,1,11]);page.locator('#start').tap();page.wait_for_selector('#hit:not([disabled])');page.locator('#hit').tap();page.wait_for_selector('#result-dialog[open]')
    assert page.locator('#result-title').inner_text()=='Passou de 33.'
    assert page.evaluate('KingRicoCloud.player.balance')==1058.3
    page.reload();restored(page,uid);page.wait_for_selector('#result-dialog[open]')
    assert page.evaluate('KingRicoCloud.player.balance')==1058.3
    page.bring_to_front();page.locator('#collect').tap();page.wait_for_selector('#result-dialog',state='hidden');page.get_by_role('link',name='Voltar para o início').tap();restored(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==1058.3
    page.get_by_role('link',name='Jogar Fortune Flying Clown',exact=True).click();restored(page,uid)
    def flying_ready(tab):
        tab.wait_for_function('window.__flying && __flying.imgs.every(i=>i.complete&&i.naturalWidth>0) && !__flying.state.busy && !__flying._request && __flying.mode==="idle"',timeout=20000)
    flying_ready(page)
    page.get_by_role('button',name='Abrir menu').tap();page.get_by_role('dialog',name='Menu — Fortune Flying Clown').wait_for()
    page.get_by_role('button',name='Tabela de pagamentos').tap();page.get_by_text('TABELA DE PAGAMENTOS',exact=True).wait_for()
    page.get_by_text('FECHAR',exact=True).tap();page.get_by_role('button',name='Fechar menu').tap()
    before=page.evaluate('KingRicoCloud.player.balance');forced_pop(page)
    point=page.evaluate('''()=>{const g=__flying,r=g.canvasRef.current.getBoundingClientRect(),b=g.balls[0],s=r.width/453;return {x:r.x+b.cx*s,y:r.y+b.cy*s,id:b.id}}''')
    tap_pop(page);page.wait_for_function('KingRicoCloud.player.flyingRound?.step===1')
    point['id']=page.evaluate('KingRicoCloud.player.flyingRound.popped[0]')
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
        forced_pop(page)
        if step==1:
            point=page.evaluate("""()=>{const g=__flying,r=g.canvasRef.current.getBoundingClientRect(),b=g.balls[0],s=r.width/453;return {x:r.x+b.cx*s,y:r.y+b.cy*s}}""")
            page.touchscreen.tap(point['x'],point['y'])
        else:tap_pop(page)
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
    # Reach the visible checkpoint, restore it, then fail and acknowledge the saved prize.
    protected_before=page.evaluate('KingRicoCloud.player.balance')
    forced_pop(page);tap_pop(page);page.wait_for_function('KingRicoCloud.player.flyingRound?.step===1');flying_ready(page)
    assert page.locator('[data-testid="flying-protection"]').inner_text().split()==['ALCANCE','HAPPEACH','x1,5']
    forced_pop(page);tap_pop(page);page.wait_for_function('KingRicoCloud.player.flyingRound?.savedUnits===1500');flying_ready(page)
    page.reload();restored(page,uid);flying_ready(page)
    assert page.evaluate('__flying.state.savedUnits')==1500
    assert 'PRÊMIO GARANTIDO' in page.locator('[data-testid="flying-protection"]').inner_text()
    page.screenshot(path='/tmp/king-rico-flying-protected.png')
    forced_pop(page,False);tap_pop(page);page.wait_for_function('!!__flying.state.win',timeout=15000)
    assert page.evaluate('__flying.state.win.title')=='PRÊMIO GARANTIDO!'
    assert page.evaluate('__flying.state.win.w')==15
    assert page.evaluate('KingRicoCloud.player.balance')==protected_before+5
    page.screenshot(path='/tmp/king-rico-flying-protected-prize.png')
    page.get_by_text('PRÊMIO GARANTIDO!',exact=True).tap();flying_ready(page)
    page.reload();restored(page,uid);flying_ready(page)
    assert page.evaluate('KingRicoCloud.player.balance')==protected_before+5
    page.get_by_role('link',name='Voltar para o início').tap();restored(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==protected_before+5
    assert not errors,errors
    assert not missing,missing
    context.close()
    return {'new_games_home_links':True,'33_debit_once':True,'33_literal_ranks_tie_cents_no_ace_hint_or_help_button':True,'33_bank_reload_two_tabs_old_link_redirect':True,'33_bust_persists':True,'flying_real_balloon_touch':True,'flying_restore_popped_order':True,'flying_collect_once_two_tabs':True,'flying_fall_saved':True,'flying_final_x20_saved':True,'flying_happeach_reload_protected_fall_paid_once':True,'same_google_session_wallet_and_menu':True,'legacy_balances_ignored':True,'stale_pending_does_not_block_login':True}
