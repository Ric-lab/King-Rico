"""Wheel polish against real Auth/Firestore emulators, with touch input."""
import math
import asyncio
import uuid
BASE='http://127.0.0.1:5000'

def seed_wheel(page,roll):
    page.evaluate('''roll=>{
      window.__wheelDraws=[Math.floor(roll*2**32),2147483648];
      if(!window.__wheelRandom){window.__wheelRandom=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{
        if(a instanceof Uint32Array&&a.length===1&&window.__wheelDraws.length){a[0]=window.__wheelDraws.shift();return a;}return window.__wheelRandom(a);
      };}
    }''',roll)

def touch_wheel(page,session,cancel=False):
    page.locator('[data-cloud-notice]:visible').wait_for(state='hidden')
    frame=page.locator('.fw-machine').bounding_box()
    cx,cy=frame['x']+frame['width']/2,frame['y']+frame['height']/2
    size=frame['width']*320/340
    box={'width':size,'height':size}
    points=[{'x':cx+box['width']*.36*math.cos(math.radians(a)),
             'y':cy+box['height']*.36*math.sin(math.radians(a))} for a in [-100,-65,-30,5,40,75]]
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[points[0]]})
    async def finish_gesture():
        # Queue native touch events in order without waiting for each protocol
        # reply; round-trip latency must not weaken the emulated finger swipe.
        events=[{'type':'touchMove','touchPoints':[point]} for point in points[1:]]
        events.append({'type':'touchCancel' if cancel else 'touchEnd','touchPoints':[]})
        await asyncio.gather(*(session._impl_obj.send('Input.dispatchTouchEvent',event) for event in events))
    session._sync(finish_gesture())

def check_wheel(browser,login,restored,claim_gift,observer):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    context.add_init_script(observer);page=context.new_page();errors=[];missing=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:missing.append(r.url) if r.status==404 else None)
    page.goto(BASE+'/Home.dc.html');login(page,'wheel-polish-'+uuid.uuid4().hex[:10]);claim_gift(page);uid=page.evaluate('KingRicoCloud.uid')
    page.get_by_role('link',name='Jogar Fortune Wheel',exact=True).tap();restored(page,uid);page.wait_for_function('!!window.__fw')
    page.evaluate('''async()=>{const art=new Image();art.src='assets/wheel/gold-atlas.webp';await art.decode();}''')
    session=context.new_cdp_session(page)
    page.get_by_role('button',name='Apostar em Moeda',exact=True).tap()
    page.screenshot(path='/tmp/king-rico-wheel-after-ready.png')
    initial=page.evaluate('KingRicoCloud.player.balance')
    touch_wheel(page,session,cancel=True)
    assert page.evaluate('!__fw.drag && !__fw.state.spinning && KingRicoCloud.player.balance')==initial
    # Every coin is committed once; the presentation reveals the same pocket.
    for name,roll,mult,title in [('color',.10,2,'MESMA COR!'),('exact',0,10,'DESENHO CERTO!'),('loss',.9,0,None),('fortune',0,25,'FORTUNE!')]:
        if name=='fortune':page.get_by_role('button',name='Apostar no FORTUNE, paga 25 vezes').tap()
        else:page.get_by_role('button',name='Apostar em Moeda',exact=True).tap()
        before=page.evaluate('KingRicoCloud.player.balance');seed_wheel(page,roll)
        if name=='color':
            page.evaluate('''()=>{
              const send=KingRicoCloud.spin;window.__wheelFirstMotion=null;window.__wheelReleaseResponse=null;
              KingRicoCloud.spin=async(...args)=>{const result=await send(...args);await new Promise(r=>window.__wheelReleaseResponse=r);return result;};
              document.addEventListener('pointerup',()=>{
                const at=performance.now(),rot=__fw.rot;
                const probe=()=>{if(Math.abs(__fw.rot-rot)>.5)window.__wheelFirstMotion=performance.now()-at;else requestAnimationFrame(probe);};
                requestAnimationFrame(probe);
              },{once:true});
            }''')
        for attempt in range(3):
            touch_wheel(page,session)
            page.wait_for_timeout(120)
            if page.evaluate('__fw.state.spinning || !!__fw._cloudSpin'):break
        if name=='color':
            # The response is held until motion is observed; this proves network
            # independence without using VM frame timing as a device benchmark.
            page.wait_for_function('__wheelFirstMotion!==null',timeout=5000)
            first_motion=page.evaluate('__wheelFirstMotion')
            page.wait_for_function('!!window.__wheelReleaseResponse')
            pending_rot=page.evaluate('__fw.rot');page.wait_for_timeout(1500)
            assert abs(page.evaluate('__fw.rot')-pending_rot)>100
            assert page.evaluate('__fw.state.phase')=='confirming'
            page.evaluate('__wheelReleaseResponse()')
        try:page.wait_for_function('!!__fw._presentation && !!__fw._cloudSpin',timeout=10000)
        except Exception:
            raise AssertionError((name,page.evaluate('({state:__fw.state,rot:__fw.rot,result:__fw._cloudSpin,draws:__wheelDraws})'),errors))
        # Releasing twice during the animation must not create another request.
        page.evaluate('()=>{__fw.release(.7);}')
        committed=page.evaluate('__fw._cloudSpin');assert committed['outcome']['winUnits']==10*100*mult
        assert page.evaluate('__fw.state.balance')==(before-10 if page.evaluate('__fw.state.spinning') else before-10+10*mult)
        if name=='color':
            page.wait_for_timeout(600);page.screenshot(path='/tmp/king-rico-wheel-after-spinning.png')
        page.wait_for_function('!__fw.state.spinning',timeout=15000)
        actual=page.evaluate('Math.floor((((-__fw.rot%360)+360)%360)/(360/13))')
        assert actual==committed['outcome']['target']==page.evaluate('__fw.state.landed')
        assert page.locator('.fw-machine').get_attribute('data-phase')=='landed'
        assert page.locator('.fw-hub').get_attribute('aria-label')==('Sua aposta: Fortune' if name=='fortune' else 'Sua aposta: Moeda')
        assert page.evaluate('KingRicoCloud.player.balance')==before-10+10*mult
        if mult:
            page.get_by_text(title,exact=True).wait_for();page.wait_for_timeout(500)
            assert page.locator('.fw-prize').get_attribute('data-prize-kind')==name
            page.screenshot(path='/tmp/king-rico-wheel-after-'+name+'.png')
            held=page.locator('[data-kr-wallet-value]').inner_text()
            assert held.replace('.','').replace(',','.')==str(before-10).removesuffix('.0')
            page.get_by_text('OK',exact=True).tap()
            page.wait_for_timeout(1850)
        else:assert page.locator('.fw-prize').count()==0
        page.reload();restored(page,uid);page.wait_for_function('!!window.__fw')
        assert page.evaluate('KingRicoCloud.player.balance')==before-10+10*mult
    # Reduced motion and OFF preferences keep settlement and controls working.
    page.emulate_media(reduced_motion='reduce')
    page.evaluate('''()=>{__fw.setLvl('sfxLvl',0);__fw.setLvl('vibLvl',0);__fw._ac?.close();__fw._ac=null;}''')
    page.get_by_role('button',name='Apostar em Moeda',exact=True).tap();seed_wheel(page,.9)
    page.wait_for_function('KingRicoCloud.player.settings.sfxLvl===0 && KingRicoCloud.player.settings.vibLvl===0')
    for attempt in range(3):
        touch_wheel(page,session);page.wait_for_timeout(100)
        if page.evaluate('__fw.state.spinning || !!__fw._cloudSpin'):break
    page.wait_for_function('!!__fw._presentation && !__fw.state.spinning',timeout=5000)
    assert page.evaluate('__fw._ac===null'),'OFF must not start audio during the gesture or spin'
    assert page.locator('.fw-launch').evaluate("e=>getComputedStyle(e).animationName")=='none'
    page.get_by_role('link',name='Voltar para o início').tap();restored(page,uid)
    assert not errors,errors
    assert not missing,missing
    context.close()
    return {'wheel_first_motion_ms':round(first_motion,1),'wheel_moves_during_1500ms_response_delay':True,'wheel_center_keeps_the_bet':True,'wheel_touch_cancel_and_regrab':True,'wheel_color_exact_fortune_loss':True,
            'wheel_committed_sector_and_single_debit':True,'wheel_modal_holds_wallet_until_ok':True,
            'wheel_reload_and_shared_wallet':True,'wheel_reduced_motion_and_sound_off':True}
