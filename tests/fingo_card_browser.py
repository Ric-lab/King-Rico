"""5x5 card and Plinko against real Auth/Firestore emulators."""
import re,uuid
BASE='http://127.0.0.1:5000'

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
    b=page.get_by_role('button',name=re.compile('^Girar,')).bounding_box();assert b
    page.mouse.click(b['x']+b['width']/2,b['y']+b['height']/2)
    page.wait_for_function('__fg.state.phase==="drop"&&__fg.state.cardOpen',timeout=20000)
    page.get_by_role('dialog',name='Sua cartela',exact=True).wait_for(state='visible',timeout=20000)
    assert page.locator('[data-fingo-cell]').count()==25
    assert page.locator('[data-fingo-option]').count()==5

def drop(page,column):
    page.bring_to_front()
    modal=page.get_by_role('dialog',name='Sua cartela',exact=True)
    modal.get_by_role('button',name='LANÇAR',exact=True).click()
    modal.wait_for(state='hidden')
    page.wait_for_function('''c=>{
      const e=document.querySelector('canvas[width="906"]');const r=e.getBoundingClientRect();
      return e.parentElement.contains(document.elementFromPoint(r.x+r.width*(c+.5)/5,r.y+20));
    }''',arg=column)
    page.evaluate('''()=>{window.__dropProbe=[];document.addEventListener('pointerdown',e=>__dropProbe.push({tag:e.target.tagName,html:e.target.outerHTML.slice(0,150),phase:__fg.state.phase,open:__fg.state.cardOpen,busy:__fg._cloudRequest}),{capture:true,once:true});}''')
    box=page.locator('canvas[width="906"]').bounding_box()
    page.mouse.click(box['x']+box['width']*(column+.5)/5,box['y']+20)

def acknowledge_mark(page,winning=False):
    dialog=page.get_by_role('dialog',name='Sua cartela',exact=True)
    dialog.wait_for(state='visible',timeout=25000)
    if winning:
        assert dialog.get_by_text('QUINA!',exact=True).count()==1
        assert '125' in page.locator('[aria-label^="Prêmio atual:"]').get_attribute('aria-label')
        page.screenshot(path='/tmp/fingo-card-quina.png')
        dialog.get_by_role('button',name='RECEBER',exact=True).click()
    else:
        assert dialog.get_by_text('NÚMERO MARCADO',exact=True).count()==1,(dialog.inner_text(),page.evaluate('({phase:__fg.state.phase,mode:__fg.state.cardMode,used:__fg.state.used,drop:__fg._cardDrop,reviewed:__fg._reviewedRoll,roundId:__fg.state.roundId,request:__fg._cloudRequest,probe:window.__dropProbe,notice:document.querySelector("[data-cloud-notice]")?.textContent,round:KingRicoCloud.player.fingoRound})'))
        dialog.get_by_role('button',name='CONTINUAR',exact=True).click()
        page.wait_for_function('__fg.state.phase==="spin"')

def play_fingo_card(page,uid,restored):
    before=page.evaluate('KingRicoCloud.player.balance')
    page.goto(BASE+'/Home.dc.html');restored(page,uid)
    page.get_by_role('link',name='Jogar Fortune Fingo',exact=True).click();restored(page,uid)
    page.wait_for_function('__fg?.engine')
    page.get_by_role('button',name=re.compile('^Aposta ')).click()
    while page.evaluate('__fg.state.betIdx')>1:page.get_by_role('button',name='Diminuir aposta',exact=True).click()
    page.get_by_role('button',name='OK',exact=True).click()
    page.wait_for_function('KingRicoCloud.player.settings.fingoBetIdx===1')
    install_draws(page);spin(page)
    initial=page.evaluate('KingRicoCloud.player.fingoRound')
    assert initial['cardVersion']==1 and initial['marks']==[]
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
    install_draws(other);spin(other);drop(other,1);acknowledge_mark(other)
    page.wait_for_function('__fg.state.card.marks[1]&&__fg.state.used===2');other.close();page.bring_to_front()
    if page.get_by_role('dialog',name='Sua cartela',exact=True).is_visible():page.get_by_role('dialog',name='Sua cartela',exact=True).get_by_role('button',name='CONTINUAR',exact=True).click()
    install_draws(page)
    for c in range(2,5):
        spin(page)
        if c==2:
            snapshot=page.evaluate('KingRicoCloud.player.fingoRound')
            page.get_by_role('dialog',name='Sua cartela',exact=True).get_by_role('button',name='LANÇAR',exact=True).click()
            page.get_by_role('button',name='CARTELA',exact=True).click()
            assert page.evaluate('KingRicoCloud.player.fingoRound')==snapshot
        drop(page,c);acknowledge_mark(page,c==4)
    page.wait_for_function('__fg.state.win?.title==="FINGO!"')
    expected=round(before-2.5+125,2)
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
    uid=page.evaluate('KingRicoCloud.uid');after_win=play_fingo_card(page,uid,restored)
    install_draws(page)
    page.evaluate("window.__fingoEvents=[];const track=KingRicoCloud.track;KingRicoCloud.track=(name,data)=>{if(name==='fingo_step')__fingoEvents.push(data);return track?.(name,data);}")
    spin(page,.25);drop(page,0);acknowledge_mark(page)
    assert page.evaluate('KingRicoCloud.player.fingoRound.marks')==[5]
    assert page.evaluate('__fingoEvents.filter(e=>e.move==="drop").at(-1).success') is True
    spin(page);page.evaluate('window.__fingoDraws=[.99,.99]');drop(page,0)
    page.wait_for_function('__fg.state.used===2&&__fg.state.phase==="spin"',timeout=25000)
    assert not page.get_by_role('dialog',name='Sua cartela',exact=True).is_visible()
    assert page.evaluate('KingRicoCloud.player.fingoRound.marks')==[5]
    assert page.evaluate('__fingoEvents.filter(e=>e.move==="drop").at(-1).success') is False
    assert page.evaluate('KingRicoCloud.player.balance')==round(after_win-2.5,2)
    page.get_by_role('button',name='CARTELA',exact=True).click()
    assert page.locator('[data-fingo-cell]').count()==25
    page.get_by_role('dialog',name='Sua cartela',exact=True).get_by_role('button',name='CONTINUAR',exact=True).click()
    page.goto(BASE+'/neck');restored(page,uid)
    assert page.evaluate('KingRicoCloud.player.balance')==round(after_win-2.5,2)
    assert page.evaluate('KingRicoCloud.player.fingoRound.used')==2
    assert not errors,errors
    assert not missing,missing
    context.close()
    return {'fingo_card_25_cells':True,'saved_draw_and_card':True,'single_stake':True,'aim_consult_launch':True,'mark_reopens_card':True,'miss_stays_on_plinko':True,'quina_and_single_prize':True,'refresh_and_two_tabs':True,'shared_wallet':True,'card_mark_telemetry':True,'console_errors':errors}
