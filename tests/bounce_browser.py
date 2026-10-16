"""Bounce: actual gestures, visible buttons and real emulated Google/Firestore."""
import json
import uuid
from pathlib import Path
BASE='http://127.0.0.1:5000'

def check_bounce(browser,login,restored,check_menu,claim_gift,login_observer):
    out=Path('work/bounce-feel');out.mkdir(parents=True,exist_ok=True)
    context=browser.new_context(viewport={'width':453,'height':802},timezone_id='America/Sao_Paulo')
    context.add_init_script(login_observer)
    context.add_init_script("localStorage.setItem('fortuneCircus.slot.v3',JSON.stringify({balance:9876543}));localStorage.setItem('fortuneCircus.bounce.v1',JSON.stringify({balance:9876543,n:99}));")
    page=context.new_page();errors=[];bad=[];external=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=400 and not r.url.endswith('/favicon.ico') else None)
    page.on('request',lambda r:external.append(r.url) if 'unpkg.com' in r.url else None)
    page.goto(BASE+'/Home.dc.html',wait_until='domcontentloaded');login(page,'bounce-browser-'+uuid.uuid4().hex[:12])
    uid=page.evaluate('KingRicoCloud.uid');assert page.evaluate('KingRicoCloud.player.balance')==1000
    claim_gift(page);page.wait_for_function('KingRicoCloud.player.balance===1050')
    page.get_by_role('button',name='Abrir menu',exact=True).click();menu=page.get_by_role('dialog',name='Menu — Home',exact=True)
    menu.get_by_role('group',name='Efeitos sonoros',exact=True).get_by_role('button',name='OFF',exact=True).click()
    menu.get_by_role('group',name='Vibração',exact=True).get_by_role('button',name='50%',exact=True).click()
    page.wait_for_function('KingRicoCloud.player.settings.sfxLvl===0 && KingRicoCloud.player.settings.vibLvl===1')
    menu.get_by_role('button',name='Fechar menu',exact=True).click()
    page.get_by_role('link',name='Jogar Fortune Bounce',exact=True).click()
    def ready(tab):
        tab.wait_for_function('window.Bounce3D?.renderer && window.__bn?.state.ready && window.KingRicoCloud?.player',timeout=30000);restored(tab,uid)
    ready(page);assert page.evaluate('__bn.state.balance')==1050
    check_menu(page,'Fortune Bounce',False)
    page.screenshot(path=str(out/'ready-cloud.png'))
    page.evaluate('''()=>{const original=KingRicoCloud.bounce;KingRicoCloud.bounce=async(...args)=>{const p=original(...args);await Promise.resolve();const saved=localStorage.getItem(`kingRico.pending.${KingRicoCloud.uid}`);const result=await p;if(args[0]==='land')window.__savedCheckpoint=saved;return result;};}''')
    # Observe the real spring and volume-conserving ball deformation, without changing physics.
    page.evaluate('''()=>{window.__contacts={sink:0,sy:1};const sample=()=>{const c=Bounce3D;for(const r of c.rows.values())__contacts.sink=Math.min(__contacts.sink,r.sink);__contacts.sy=Math.min(__contacts.sy,c.ball.scale.y);requestAnimationFrame(sample);};sample();}''')
    page.get_by_role('button',name='JOGAR · 10 MOEDAS',exact=True).click()
    page.wait_for_function('__bn.state.n>=1 && !__bn.state.saving')
    page.get_by_role('button',name='Abrir menu',exact=True).click();page.get_by_role('button',name='Fechar menu',exact=True).click()
    assert page.evaluate('Bounce3D.mode')=='paused'
    assert page.evaluate('__contacts.sink')<-.02;assert page.evaluate('__contacts.sy')<.95
    n=page.evaluate('__bn.state.n');assert n>=1
    track=page.evaluate('Bounce3D.track.slice(0,14)');balance=page.evaluate('KingRicoCloud.player.balance');assert balance==1040
    page.evaluate('localStorage.setItem(`kingRico.pending.${KingRicoCloud.uid}`,window.__savedCheckpoint)')
    page.reload(wait_until='domcontentloaded');ready(page)
    assert page.evaluate('__bn.state.n')==n;assert page.evaluate('__bn.state.paused')
    assert page.evaluate('Bounce3D.track.slice(0,14)')==track
    assert page.evaluate('__bn.state.balance')==1040
    other=context.new_page();other.goto(BASE+'/Fortune%20Bounce.dc.html',wait_until='domcontentloaded');ready(other)
    payout=round(10*(1+n*.1),2);label='Pegar '+str(payout).rstrip('0').rstrip('.').replace('.',',')+' moedas'
    other.get_by_role('button',name=label,exact=True).dblclick()
    other.wait_for_function('!!__bn.state.win');assert other.evaluate('KingRicoCloud.player.balance')==1040+payout
    other.screenshot(path=str(out/'prize-cloud.png'))
    other.reload(wait_until='domcontentloaded');ready(other)
    assert other.evaluate('__bn.state.balance')==1040+payout
    assert other.evaluate('__bn.state.round') is None
    page.wait_for_function('__bn.state.round===null')
    # A real drag off the first platform loses only the already debited stake.
    page.bring_to_front();page.get_by_role('button',name='JOGAR · 10 MOEDAS',exact=True).click()
    page.wait_for_function('Bounce3D.mode==="run"')
    page.mouse.move(226,480);page.mouse.down();page.mouse.move(440,480,steps=5);page.mouse.up()
    page.wait_for_function('Bounce3D.mode==="fall"',timeout=15000)
    page.reload(wait_until='domcontentloaded');ready(page)
    assert page.evaluate('KingRicoCloud.player.balance')==1030+payout
    assert page.evaluate('__bn.state.round') is None,'Reload during the fall escaped the loss'
    # Deterministic test UUID chooses a visible golden second tile, not a mocked outcome.
    page.evaluate('''()=>{const original=crypto.randomUUID.bind(crypto);let id;do{id=original();}while(!Bounce3D.model.track(id,2)[2].gold);crypto.randomUUID=()=>{crypto.randomUUID=original;return id;};}''')
    page.get_by_role('button',name='JOGAR · 10 MOEDAS',exact=True).click()
    try: page.wait_for_function('__bn.state.n>=2 && !__bn.state.saving',timeout=15000)
    except Exception:
        print(json.dumps({'failure_state':page.evaluate('__bn.state'),'renderer':page.evaluate('({mode:Bounce3D.mode,k:Bounce3D.k,bx:Bounce3D.bx,tx:Bounce3D.tx,previous:Bounce3D.previousMode})'),'errors':errors}),flush=True)
        page.screenshot(path=str(out/'failure.png'))
        raise
    assert page.evaluate('__bn.state.guard')==2
    direction=page.evaluate('Bounce3D.track[Bounce3D.k+1].x>0?-1:1')
    page.mouse.move(226,480);page.mouse.down();page.mouse.move(440 if direction>0 else 12,480,steps=5);page.mouse.up()
    page.wait_for_function('!!__bn.state.win',timeout=15000)
    assert page.evaluate('__bn.state.win.w')==12
    assert page.evaluate('KingRicoCloud.player.balance')==1032+payout
    page.get_by_role('button',name='CONTINUAR',exact=True).click()
    # Reduced motion keeps steering/physics, and suppresses camera sway and sparks.
    page.emulate_media(reduced_motion='reduce');assert page.evaluate('Bounce3D.motion.matches')
    for width,height in [(360,740),(1280,800)]:
        page.set_viewport_size({'width':width,'height':height});check_menu(page,'Fortune Bounce',False)
        box=page.get_by_role('button',name='JOGAR · 10 MOEDAS',exact=True).bounding_box();assert box['y']+box['height']<=height
    page.goto(BASE+'/Fortune%20Circus.dc.html?from=home',wait_until='domcontentloaded');restored(page,uid)
    assert page.evaluate('__fc.state.balance')==1032+payout
    # Preserve the exhausted-wallet modal added with Bounce, using refill rather than the daily gift.
    for game in ['Wheel','Neck','Fingo','Penalty']:
        page.evaluate("""async()=>{
          const original=crypto.getRandomValues.bind(crypto);
          crypto.getRandomValues=a=>a instanceof Uint32Array&&a.length===1?(a[0]=4252017623,a):original(a);
          for(const bet of [1000,500,250,100,50,25,10,5,2.5,1])while(KingRicoCloud.player.balance>=bet){await new Promise(r=>setTimeout(r,800));await KingRicoCloud.spin('wheel',bet,0);}
        }""")
        remainder=page.evaluate('KingRicoCloud.player.balance');assert remainder<1
        page.goto(BASE+'/Fortune%20'+game+'.dc.html',wait_until='domcontentloaded');restored(page,uid)
        page.get_by_role('button',name='Recarregar saldo',exact=True).dblclick()
        page.wait_for_function('KingRicoCloud.player.balance>=1000')
        assert page.evaluate('KingRicoCloud.player.balance')==1000+remainder
        assert page.evaluate('async()=>(await KingRicoCloud.bonus()).amount')==0
    assert not errors,errors;assert not bad,bad;assert not external,external
    context.close()
    return {'bounce':'passed','home_link':True,'google_session':True,'legacy_balance_ignored':True,'spring_and_squash':True,'cashout_exactly_once':True,'reload_same_track_and_checkpoint':True,'lost_checkpoint_response_replayed':True,'another_tab_collects':True,'prize_survives_reload_before_ack':True,'real_drag_loss':True,'fall_committed_before_animation':True,'gold_guarantee':True,'shared_wallet':True,'responsive_menu':True,'reduced_motion':True,'four_other_games_refill_after_claimed_gift':True}
