"""5x5 card and Plinko against real Auth/Firestore emulators."""
import re,uuid
BASE='http://127.0.0.1:5000'

def observe_board(page):
    page.evaluate('''()=>{
      window.__boardProbe={node:document.querySelector('[data-fingo-board]'),frames:[],stop:false};
      const sample=()=>{const p=__boardProbe,n=document.querySelector('[data-fingo-board]');
        if(p.stop)return;
        if(['rolling','drop','launching','falling'].includes(__fg.state.phase)){
          const r=n.getBoundingClientRect(),s=getComputedStyle(n);
          p.frames.push({phase:__fg.state.phase,same:n===p.node,visible:s.visibility==='visible'&&r.width>0&&r.height>0,background:s.backgroundImage});
        }requestAnimationFrame(sample);
      };requestAnimationFrame(sample);
    }''')

def assert_board_continuity(page):
    frames=page.evaluate('()=>{__boardProbe.stop=true;return __boardProbe.frames;}')
    assert len(frames)>30
    assert all(f['same'] and f['visible'] for f in frames),frames
    assert len({f['background'] for f in frames})==1
    assert {'rolling','drop','launching','falling'}<={f['phase'] for f in frames}

def install_draws(page):
    page.evaluate('''()=>{
      if(window.__fingoNative)return;
      window.__fingoNative=crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues=a=>a instanceof Uint32Array&&a.length===1
        ? (a[0]=Math.floor((window.__fingoDraws?.shift()??0)*2**32),a) : __fingoNative(a);
    }''')

def spin(page,row=0):
    page.evaluate('''row=>{
      const s=__fg.state;
      window.__fingoDraws=[...(s.active?[]:Array(5).fill(0)),...Array.from({length:5},(_,c)=>c===(s.used+1)%5?[.99,0]:[0,c===0?row:0]).flat()];
    }''',row)
    if page.evaluate('__fg.state.betOpen'):
        page.get_by_role('button',name='JOGAR',exact=True).click()
    else:
        b=page.get_by_role('button',name=re.compile('^Girar,')).bounding_box();assert b
        page.mouse.click(b['x']+b['width']/2,b['y']+b['height']/2)
    page.wait_for_function('__fg.state.phase==="drop"&&__fg.state.cardOpen',timeout=20000)
    page.get_by_role('region',name='Sua cartela',exact=True).wait_for(state='visible',timeout=20000)
    assert page.locator('[data-fingo-cell]').count()==25
    assert page.locator('[data-fingo-top-ball]').count()==5
    page.locator('[data-fingo-free-icon]').wait_for(state='visible')
    page.wait_for_function('document.querySelector("[data-fingo-free-icon]")?.naturalWidth>0')
    assert page.locator('[data-fingo-free-icon]').get_attribute('src').startswith('data:image/webp;base64,')
    assert page.locator('[data-fingo-cell="12"]').get_attribute('aria-label')=='King Rico, coringa livre'
    assert page.locator('[data-fingo-bucket]:visible').count()==0
    assert page.get_by_role('button',name='DESISTIR',exact=True).is_visible()

def drop(page,column):
    page.bring_to_front()
    page.get_by_role('region',name='Sua cartela',exact=True).wait_for(state='visible')
    index=page.evaluate('c=>__fg.state.card.nums.indexOf(__fg.state.slots[c])',column)
    assert index>=0
    page.locator('[data-fingo-cell="'+str(index)+'"]').click()
    page.wait_for_function('__fg.state.phase==="falling"',timeout=20000)

def acknowledge_mark(page,winning=False):
    dialog=page.get_by_role('region',name='Sua cartela',exact=True)
    dialog.wait_for(state='visible',timeout=25000)
    if winning:
        assert dialog.get_by_text('QUINA!',exact=True).count()==1
        assert page.evaluate('__fg._cardDrop.winUnits')==500
        page.screenshot(path='/tmp/fingo-card-quina.png')
        dialog.get_by_role('button',name='RECEBER',exact=True).click()
    else:
        assert dialog.get_by_text('ACERTOU!',exact=True).count()==1,(dialog.inner_text(),page.evaluate('({phase:__fg.state.phase,mode:__fg.state.cardMode,used:__fg.state.used,drop:__fg._cardDrop,reviewed:__fg._reviewedRoll,roundId:__fg.state.roundId,request:__fg._cloudRequest,probe:window.__dropProbe,notice:document.querySelector("[data-cloud-notice]")?.textContent,round:KingRicoCloud.player.fingoRound})'))
        page.wait_for_function('__fg.state.phase==="spin"&&!__fg.state.cardOpen',timeout=12000)

def play_fingo_card(page,uid,restored):
    before=page.evaluate('KingRicoCloud.player.balance')
    page.goto(BASE+'/Home.dc.html');restored(page,uid)
    page.get_by_role('link',name='Jogar Fortune Fingo',exact=True).click();restored(page,uid)
    page.wait_for_function('__fg?.engine')
    page.get_by_role('dialog',name='Escolher aposta',exact=True).wait_for(state='visible')
    while page.evaluate('__fg.state.betIdx')>1:page.get_by_role('button',name='Diminuir aposta',exact=True).click()
    install_draws(page);spin(page)
    initial=page.evaluate('KingRicoCloud.player.fingoRound')
    assert initial['payoutVersion']==3 and initial['cardVersion']==2 and initial['marks']==[12]
    assert page.evaluate('KingRicoCloud.player.balance')==round(before-2.5,2)
    assert page.locator('[data-fingo-cell]').evaluate_all('els=>els.every(e=>parseFloat(getComputedStyle(e).fontSize)>=25)')
    page.wait_for_timeout(250)
    page.screenshot(path='/tmp/fingo-card-aim.png')
    # Refresh while consulting: same card, options, stake and account.
    page.reload();restored(page,uid);page.wait_for_function('__fg?.engine')
    assert page.evaluate('KingRicoCloud.player.fingoRound')==initial
    assert page.locator('[data-fingo-cell]').count()==25
    install_draws(page);drop(page,0)
    page.wait_for_function('KingRicoCloud.player.fingoRound?.used===1&&__fg.state.phase==="falling"')
    page.reload();restored(page,uid);page.wait_for_function('__fg?.state.used===1&&__fg.state.phase==="spin"')
    assert page.evaluate('__fg.state.card.marks[0]')
    assert page.locator('[data-fingo-plays]').inner_text()=='29'
    # Another tab continues the same saved card; both observe its marks.
    other=page.context.new_page();other.goto(BASE+'/fingo');restored(other,uid);other.wait_for_function('__fg?.engine')
    install_draws(other);observe_board(other);spin(other);drop(other,1);acknowledge_mark(other);assert_board_continuity(other)
    page.wait_for_function('__fg.state.card.marks[1]&&__fg.state.used===2');other.close();page.bring_to_front()
    if page.get_by_role('region',name='Sua cartela',exact=True).is_visible():page.get_by_role('region',name='Sua cartela',exact=True).get_by_role('button',name='VOLTAR AO PLINKO',exact=True).click()
    install_draws(page)
    for c in range(2,5):
        spin(page)
        if c==2:
            snapshot=page.evaluate('KingRicoCloud.player.fingoRound')
            page.evaluate('__fg.setState({cardOpen:false})')
            page.evaluate('__fg.openCard()')
            assert page.evaluate('KingRicoCloud.player.fingoRound')==snapshot
        drop(page,c);acknowledge_mark(page,c==4)
    page.wait_for_function('__fg.state.win?.title==="FINGO!"')
    assert page.get_by_text('+5',exact=True).is_visible()
    expected=round(before-2.5+5,2)
    assert round(page.evaluate('KingRicoCloud.player.balance'),2)==expected
    page.get_by_text('OK',exact=True).click();page.wait_for_function('!__fg.state.win&&!__fg.state.active')
    page.reload();restored(page,uid);page.wait_for_function('__fg?.engine')
    assert round(page.evaluate('KingRicoCloud.player.balance'),2)==expected
    assert page.evaluate('KingRicoCloud.player.fingoRound') is None
    return expected

def check_fingo_card(browser,login,restored,claim_gift,observer):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    context.add_init_script(observer);page=context.new_page();errors=[];missing=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:missing.append(r.url) if r.status==404 else None)
    page.goto(BASE+'/Home.dc.html');login(page,'fingo-card-'+uuid.uuid4().hex[:12]);claim_gift(page)
    uid=page.evaluate('KingRicoCloud.uid');check_fingo_assets(page,uid,restored);after_win=play_fingo_card(page,uid,restored)
    install_draws(page)
    page.evaluate("window.__fingoEvents=[];const track=KingRicoCloud.track;KingRicoCloud.track=(name,data)=>{if(name==='fingo_step')__fingoEvents.push(data);return track?.(name,data);}")
    spin(page,.25);drop(page,0);acknowledge_mark(page)
    assert page.evaluate('KingRicoCloud.player.fingoRound.marks')==[12,5]
    assert page.evaluate('__fingoEvents.filter(e=>e.move==="drop").at(-1).success') is True
    # Selecting one gold can settle in a different gold; the physical bucket,
    # persisted mark, painted number and telemetry must all agree.
    spin(page);page.evaluate('window.__fingoDraws=[0,.99,0]');drop(page,0)
    page.wait_for_function('__fg.ball?.done===true',timeout=20000)
    landing=page.evaluate('({selected:__fg.state.selectedColumn,bin:__fg._cardDrop.bin,physical:Math.floor(__fg.ball.position.x/(453/5)),mark:__fg._cardDrop.mark})')
    assert landing['selected']!=landing['bin'] and landing['physical']==landing['bin'],landing
    acknowledge_mark(page)
    assert page.evaluate('KingRicoCloud.player.fingoRound.marks')==[12,5,1]
    spin(page);page.evaluate('window.__fingoDraws=[.99,.99]');drop(page,0)
    page.wait_for_function('__fg.state.used===3&&__fg.state.phase==="spin"',timeout=25000)
    assert not page.get_by_role('region',name='Sua cartela',exact=True).is_visible()
    assert page.evaluate('KingRicoCloud.player.fingoRound.marks')==[12,5,1]
    assert page.evaluate('__fingoEvents.filter(e=>e.move==="drop").at(-1).success') is False
    assert page.evaluate('KingRicoCloud.player.balance')==round(after_win-2.5,2)
    page.evaluate('__fg.openCard()')
    assert page.locator('[data-fingo-cell]').count()==25
    page.get_by_role('region',name='Sua cartela',exact=True).get_by_role('button',name='VOLTAR AO PLINKO',exact=True).click()
    page.goto(BASE+'/neck');restored(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==round(after_win-2.5,2)
    assert page.evaluate('KingRicoCloud.player.fingoRound.used')==3
    check_fingo_cancel(page,uid,restored)
    assert not errors,errors
    assert not missing,missing
    context.close()
    return {'fingo_card_25_cells':True,'saved_draw_and_card':True,'single_stake':True,'aim_consult_launch':True,'mark_reopens_card':True,'miss_stays_on_plinko':True,'quina_and_single_prize':True,'refresh_and_two_tabs':True,'shared_wallet':True,'card_mark_telemetry':True,'different_gold_matches_physical_bucket':True,'free_center':True,'asset_failure_and_retry_without_bet':True,'give_up_without_refund_or_new_charge':True,'card_without_buckets':True,'console_errors':errors}

def check_fingo_assets(page,uid,restored):
    before=page.evaluate('KingRicoCloud.player.balance');pending=[];hold=[True]
    def art(route):
        if hold[0]:pending.append(route)
        else:route.continue_()
    page.route('**/assets/fingo/counter-plaque.webp*',art)
    page.goto(BASE+'/fingo');restored(page,uid);page.wait_for_function('__fg?.engine&&__fg.state.betOpen')
    assert not page.evaluate('__fg.state.artReady')
    assert page.get_by_role('button',name='JOGAR',exact=True).is_disabled()
    assert page.evaluate('KingRicoCloud.player.balance')==before
    assert page.evaluate('KingRicoCloud.player.fingoRound') is None
    hold[0]=False
    for route in pending:route.abort('failed')
    page.wait_for_function('__fg.state.artError')
    page.get_by_text('Não foi possível carregar as imagens. Tente novamente.',exact=True).wait_for(state='visible')
    page.get_by_role('button',name='TENTAR NOVAMENTE',exact=True).click()
    page.wait_for_function('__fg.state.artReady&&!__fg.state.artError')
    page.wait_for_selector('[data-fingo-art-loading]',state='detached')
    assert page.get_by_role('button',name='JOGAR',exact=True).is_enabled()
    assert page.evaluate('KingRicoCloud.player.balance')==before
    page.unroute('**/assets/fingo/counter-plaque.webp*',art)

def check_fingo_cancel(page,uid,restored):
    page.goto(BASE+'/fingo');restored(page,uid);page.wait_for_function('__fg?.engine')
    if not page.evaluate('KingRicoCloud.player.fingoRound'):
        install_draws(page);spin(page)
        page.evaluate('__fg.setState({cardOpen:false})')
    before=page.evaluate('KingRicoCloud.player.balance')
    saved=page.evaluate('KingRicoCloud.player.fingoRound')
    assert page.locator('[data-fingo-prize]').count()==0
    assert page.locator('[data-fingo-board]').count()==1
    assert page.locator('[data-screen-label="Fortune Fingo"]').evaluate('e=>getComputedStyle(e).backgroundImage')=='none'
    page.evaluate('__fg.openCard()')
    page.wait_for_function('__fg.state.cardOpen')
    for width,height in [(375,667),(390,844),(430,932)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(250)
        give_up=page.get_by_role('button',name='DESISTIR',exact=True);box=give_up.bounding_box()
        assert box['height']>=44 and box['y']+box['height']<height and box['x']>=0 and box['x']+box['width']<=width,box
        assert page.locator('[data-fingo-bucket]:visible').count()==0
        icon=page.locator('[data-fingo-free-icon]')
        assert icon.is_visible() and icon.evaluate('e=>e.complete&&e.naturalWidth>0')
        page.screenshot(path='/tmp/fingo-card-give-up-'+str(width)+'.png')
    page.get_by_role('button',name='DESISTIR',exact=True).click()
    modal=page.get_by_role('dialog',name='Encerrar cartela',exact=True)
    modal.get_by_role('button',name='CONTINUAR JOGANDO',exact=True).click()
    assert page.evaluate('KingRicoCloud.player.fingoRound')==saved
    page.get_by_role('button',name='DESISTIR',exact=True).click()
    modal.get_by_role('button',name='ENCERRAR',exact=True).click()
    page.wait_for_function('!KingRicoCloud.player.fingoRound&&!__fg.state.active&&!__fg.state.endConfirm')
    assert page.evaluate('KingRicoCloud.player.balance')==before
    install_draws(page);spin(page)
    after=page.evaluate('KingRicoCloud.player.balance')
    page.goto(BASE+'/fingo?nova-cartela=1');restored(page,uid)
    page.wait_for_function('window.__fg&&!__fg._freshLink&&!__fg.state.active&&!KingRicoCloud.player.fingoRound')
    assert page.evaluate('KingRicoCloud.player.balance')==after
    assert 'nova-cartela' not in page.url
    assert page.locator('[data-fingo-plays]').inner_text()=='30'
    # Ordinary reloads continue preserving the next round: the link is consumed once.
    install_draws(page);spin(page);new_round=page.evaluate('KingRicoCloud.player.fingoRound')
    page.reload();restored(page,uid);page.wait_for_function('__fg?.engine')
    assert page.evaluate('KingRicoCloud.player.fingoRound')==new_round
    page.get_by_role('button',name='Abrir menu',exact=True).click();page.get_by_role('button',name='Nova cartela',exact=True).click()
    page.get_by_role('dialog',name='Encerrar cartela',exact=True).get_by_role('button',name='ENCERRAR',exact=True).click()
    page.wait_for_function('!KingRicoCloud.player.fingoRound&&!__fg.state.active')
    for width,height in [(375,667),(390,844),(430,932)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(200)
        counter=page.locator('[data-fingo-plays]').bounding_box()
        assert counter['y']>=60 and counter['y']+counter['height']<height
        assert page.locator('[data-fingo-bucket]').count()==5
        page.screenshot(path='/tmp/fingo-clean-'+str(width)+'.png')
    return {'cancel_card_and_link':True,'cancel_without_refund_or_new_charge':True,'next_card_survives_normal_reload':True,'single_backdrop_and_board':True,'prize_badge_removed':True,'give_up_on_card_three_sizes':True,'card_has_visible_embedded_free_king':True,'buckets_hidden_on_card':True}
