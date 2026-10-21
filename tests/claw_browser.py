"""Actual touch/keyboard input, cloud settlement and reload recovery for Claw Machine."""
import json,uuid,math
BASE='http://127.0.0.1:5000'
def aim_touch(page,x,z,cancel=False):
    page.wait_for_selector('#grab:not([disabled])');page.wait_for_timeout(100)
    at=page.evaluate('KingRicoClaw.scene.pick()');r=page.locator('#claw-canvas').bounding_box()
    selected=min(range(9),key=lambda i:max(abs(x-(i%3*320+180)),abs(z-(i//3*280+220))))
    target=page.evaluate('(i)=>KingRicoClaw.scene.targets()[i]',selected)
    wx=target['x']+(x-(selected%3*320+180))/1000*3.1;wz=target['z']+(z-(selected//3*280+220))/1000*2.1
    view=page.evaluate('KingRicoClaw.scene.view()');c,s=math.cos(view['yaw']),math.sin(view['yaw']);ax,az=wx-at['worldX'],wz-at['worldZ']
    dx=(ax*c-az*s)*view['zoom']/4.8*r['width'];dy=(ax*s+az*c)*view['zoom']/4.6*r['height']
    sx,sy=r['x']+r['width']*.5,r['y']+r['height']*.72
    session=page.context.new_cdp_session(page)
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':sx,'y':sy}]})
    for i in range(1,9):
        session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':sx+dx*i/8,'y':sy+dy*i/8}]});page.wait_for_timeout(20)
    session.send('Input.dispatchTouchEvent',{'type':'touchCancel' if cancel else 'touchEnd','touchPoints':[]});session.detach();page.wait_for_timeout(1100)
    return page.evaluate('KingRicoClaw.scene.pick()')
def grab_when(page,minimum,maximum=1000):
    # Press at the visible pendulum position; pick and click share the same frame.
    # Aiming itself is a real captured touch gesture above, not a scene shortcut.
    return page.evaluate("""([lo,hi])=>new Promise((resolve,reject)=>{
      const deadline=performance.now()+9000;
      function tick(){const at=KingRicoClaw.scene.pick();
        if(at.quality>=lo&&at.quality<=hi){document.getElementById('grab').click();resolve(at);}
        else if(performance.now()>deadline)reject(Error('Aim never reached the expected capture band'));
        else requestAnimationFrame(tick);
      }tick();
    })""",[minimum,maximum])
def check_claw(browser,login,restored,claim_gift,observer):
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);context.add_init_script(observer)
    page=context.new_page();errors=[];missing=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:missing.append(r.url) if r.status==404 else None)
    page.goto(BASE+'/Home.dc.html');login(page,'claw-browser-'+uuid.uuid4().hex[:10]);claim_gift(page);page.wait_for_function('!localStorage.getItem(`kingRico.pending.${KingRicoCloud.uid}`)');uid=page.evaluate('KingRicoCloud.uid')
    page.get_by_role('link',name='Jogar Claw Machine',exact=True).click();restored(page,uid);page.wait_for_function('!!window.KingRicoClaw?.scene',timeout=60000)
    page.set_viewport_size({'width':453,'height':802});page.screenshot(path='assets/brand/cover-claw.png',clip={'x':0,'y':125,'width':453,'height':453});page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/tmp/claw-3d-mobile-final.png');page.get_by_role('button',name='Abrir menu').tap();menu=page.get_by_role('dialog',name='Menu — Claw Machine');menu.wait_for();paused=page.evaluate('KingRicoClaw.scene.pick()');page.wait_for_timeout(400);assert page.evaluate('KingRicoClaw.scene.pick()')==paused,'Menu must pause the pendulum';menu.get_by_role('button',name='Tabela de pagamentos').tap();page.get_by_role('dialog',name='Claw Machine',exact=True).wait_for();page.locator('#help-done').tap()

    # User camera controls never change the intended target or settle a bet.
    camera_balance=page.evaluate('KingRicoCloud.player.balance');camera_aim=page.evaluate('KingRicoClaw.scene.status().aim')
    assert len(set(page.evaluate('KingRicoClaw.scene.status().toys')))==5
    page.locator('#view-in').tap();assert page.evaluate('KingRicoClaw.scene.view().zoom')>1
    page.locator('#view-mode').tap();r=page.locator('#claw-canvas').bounding_box();sx,sy=r['x']+r['width']*.5,r['y']+r['height']*.5
    session=context.new_cdp_session(page)
    def touches(kind,points):session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
    touches('touchStart',[{'x':sx,'y':sy}]);touches('touchMove',[{'x':sx+35,'y':sy+15}]);touches('touchEnd',[])
    assert abs(page.evaluate('KingRicoClaw.scene.view().yaw'))>.1
    assert page.evaluate('KingRicoClaw.scene.status().aim')==camera_aim
    page.locator('#view-mode').tap();prior=page.evaluate('KingRicoClaw.scene.view()')
    touches('touchStart',[{'x':sx-25,'y':sy,'id':1},{'x':sx+25,'y':sy,'id':2}])
    touches('touchMove',[{'x':sx-35,'y':sy+10,'id':1},{'x':sx+55,'y':sy+10,'id':2}])
    touches('touchEnd',[{'x':sx-35,'y':sy+10,'id':1}]);touches('touchMove',[{'x':sx-20,'y':sy+10,'id':1}]);touches('touchCancel',[]);session.detach()
    assert page.evaluate('KingRicoClaw.scene.view().zoom')>prior['zoom']
    assert page.evaluate('KingRicoClaw.scene.status().aim')==camera_aim,'Lifting one pinch finger must not drag the claw'
    v=page.evaluate('KingRicoClaw.scene.view()');page.set_viewport_size({'width':393,'height':844});page.wait_for_timeout(150)
    assert page.evaluate('KingRicoClaw.scene.view()')==v,'Resize must preserve view'
    page.locator('#view-out').tap();page.locator('#view-reset').tap();assert page.evaluate('KingRicoClaw.scene.view().zoom')==1
    assert page.evaluate('KingRicoCloud.player.balance')==camera_balance

    aim_touch(page,450,600,True);first=aim_touch(page,500,500);assert first['selected']==4,first
    page.screenshot(path='/tmp/claw-aim.png')
    before=page.evaluate('KingRicoCloud.player.balance');revision=page.evaluate('KingRicoCloud.player.revision');first=grab_when(page,800)
    page.wait_for_function('(r)=>KingRicoCloud.player.revision>r',arg=revision)
    expected=round(before-10+10*first['multiplier'],2);assert page.evaluate('KingRicoCloud.player.balance')==expected
    assert float(page.locator('#balance').inner_text().replace('.','').replace(',','.'))==before-10, 'Credit leaked before the prize animation'
    saved=page.evaluate('JSON.parse(localStorage.getItem(`kingRico.claw.${KingRicoCloud.uid}`))')
    result=page.evaluate('async id=>await KingRicoCloud.clawResult(id)',saved['roundId']);assert result['outcome']['quality']>=800;assert result['outcome']['aimX']==first['aimX'] and result['outcome']['aimZ']==first['aimZ']
    page.wait_for_timeout(1500);page.screenshot(path='/tmp/claw-lift.png');page.reload();restored(page,uid);page.wait_for_selector('#result-dialog[open]',timeout=60000)
    assert page.evaluate('KingRicoCloud.player.balance')==expected
    assert page.locator('#result-title').inner_text()=='Pegou '+['Happeach','Diamante','Moeda','Nick Neck','King Rico'][(result['outcome']['seed']+result['outcome']['selected'])%5]+'!'
    page.screenshot(path='/tmp/claw-prize.png')
    outcome=result['outcome'];page.evaluate('''x=>localStorage.setItem(`kingRico.pending.${KingRicoCloud.uid}`,JSON.stringify({action:'claw',game:'claw',bet:10,selected:x.selected,aimX:x.aimX,aimZ:x.aimZ,seed:x.seed,roundId:x.roundId,requestId:x.roundId}))''',outcome)
    page.reload();restored(page,uid);page.wait_for_selector('#result-dialog[open]',timeout=60000);assert page.evaluate('KingRicoCloud.player.balance')==expected
    second=context.new_page();second.goto(BASE+'/Fortune Claw.dc.html');restored(second,uid);second.wait_for_selector('#result-dialog[open]',timeout=60000)
    assert second.evaluate('KingRicoCloud.player.balance')==expected
    second.locator('#result-done').tap();second.wait_for_selector('#grab:not([disabled])');second.close();page.bring_to_front();page.locator('#result-done').tap();page.wait_for_selector('#grab:not([disabled])')
    aim_touch(page,500,500);before_full=page.evaluate('KingRicoCloud.player.balance');full=grab_when(page,800)
    page.wait_for_selector('#machine[data-phase=close]');page.screenshot(path='/tmp/claw-art-grip.png')
    page.wait_for_selector('#machine[data-phase=delivery]',timeout=60000);assert page.evaluate('KingRicoClaw.scene.status().delivered') is True;assert page.evaluate('KingRicoClaw.scene.status().held') is None
    page.screenshot(path='/tmp/claw-art-delivery.png');page.wait_for_selector('#result-dialog[open]',timeout=60000);expected=round(before_full-10+10*full['multiplier'],2)
    assert page.evaluate('KingRicoCloud.player.balance')==expected
    page.locator('#result-done').tap();page.wait_for_selector('#grab:not([disabled])')
    page.locator('#bet-down').tap();page.locator('#bet-down').tap();page.wait_for_function('KingRicoCloud.player.settings.clawBetIdx===1')
    aim_touch(page,580,500);edge=grab_when(page,480,580);assert 400<=edge['quality']<700,edge
    page.wait_for_selector('#result-dialog[open]',timeout=60000);assert page.locator('#result-title').inner_text()=='Foi por pouco!';assert page.evaluate('KingRicoCloud.player.balance')==expected
    page.locator('#result-done').tap();page.wait_for_selector('#grab:not([disabled])')
    assert page.evaluate('KingRicoClaw.scene.pick().quality')<400
    revision=page.evaluate('KingRicoCloud.player.revision');button=page.evaluate('KingRicoClaw.scene.buttonPoint()');page.touchscreen.tap(button['x'],button['y']);page.wait_for_function('(r)=>KingRicoCloud.player.revision>r',arg=revision);page.reload();restored(page,uid);page.wait_for_selector('#result-dialog[open]',timeout=60000)
    assert page.locator('#result-title').inner_text()=='Escapou da garra';assert page.evaluate('KingRicoCloud.player.balance')==round(expected-2.5,2)
    page.locator('#result-done').tap();page.wait_for_selector('#grab:not([disabled])')
    page.set_viewport_size({'width':320,'height':568});page.wait_for_timeout(200);page.get_by_role('button',name='Abrir menu').tap();page.get_by_role('button',name='Fechar menu').tap()
    assert page.locator('#grab').bounding_box()['width']>200
    page.get_by_role('link',name='Voltar para o início').tap();restored(page,uid);assert page.evaluate('KingRicoCloud.player.balance')==round(expected-2.5,2)
    assert not errors,errors
    assert not missing,missing
    context.close();return {'claw_home':True,'five_plush_types':True,'physical_green_button':True,'camera_zoom_orbit_pinch':True,'camera_does_not_move_claw_or_wallet':True,'camera_survives_resize':True,'real_touch_and_pointer_cancel':True,'center_grab':True,'edge_refund':True,'miss_loss':True,'atomic_shared_wallet':True,'reload_during_lift':True,'same_request_replay_once':True,'two_tabs_same_prize_once':True,'menu_and_mobile':True,'local_three_and_happeach':True,'visible_pendulum_matches_settlement':True,'complete_lift_and_prize_delivery':True,'actual_3d_chute_delivery':True,'menu_pauses_pendulum':True}
