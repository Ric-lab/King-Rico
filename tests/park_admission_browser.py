"""Admission must precede input; accepting it must never replay that input."""
import os,re,uuid,json
from playwright.sync_api import sync_playwright

BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:5000')
PREVIEW=os.environ.get('KING_RICO_PREVIEW')=='1'
GAMES=[('clown','Fortune Clown.dc.html','__clown'),('penalty','Fortune Penalty.dc.html','__pen'),
       ('flying','Fortune Flying Clown.dc.html','__flying'),('fingo','Fortune Fingo.dc.html','__fg')]

def ready(page,hook):
    page.wait_for_function('window.KingRicoCloud')
    if not PREVIEW:
        page.locator('[data-cloud-test-account]').fill('admission-'+uuid.uuid4().hex[:20])
        page.get_by_role('button',name='Entrar com conta de teste',exact=True).click()
    try:page.wait_for_function('hook=>window.KingRicoCloud.player&&window[hook]',arg=hook)
    except Exception:
        print('ADMISSION_STARTUP',page.evaluate('hook=>({player:!!window.KingRicoCloud?.player,hook:!!window[hook],login:document.querySelector("[data-cloud-login]")?.textContent,notice:document.querySelector("[data-cloud-notice]")?.textContent})',hook),flush=True)
        raise
    page.locator('#kr-boot-screen').wait_for(state='detached')

def run():
    reports=[];errors=[];missing=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
            args=['--no-sandbox','--use-angle=swiftshader','--enable-webgl'])
        for game,file,hook in GAMES:
            context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
            page=context.new_page()
            page.on('pageerror',lambda e:(errors.append(str(e)),print('BROWSER_ERROR',str(e),flush=True)))
            page.on('response',lambda r:missing.append(r.url) if r.status>=400 and '/assets/' in r.url else None)
            route=file.replace(' ','%20') if PREVIEW else {'flying':'flying-clown'}.get(game,game)
            page.goto(BASE+'/'+route);ready(page,hook)
            page.locator('.park-modal').wait_for()
            assert page.evaluate('document.documentElement.dataset.parkAdmission')=='pending'
            page.evaluate('''game=>{window.__admissionCalls=0;const original=KingRicoCloud[game];
              KingRicoCloud[game]=(...args)=>{__admissionCalls++;return original(...args)};}''',game)
            if game=='penalty':
                page.evaluate('''()=>{Math.random=()=>.01;const original=crypto.getRandomValues.bind(crypto);
                  crypto.getRandomValues=a=>a instanceof Uint32Array&&a.length===1?(a[0]=0,a):original(a);}''')
            # Events dispatched at the scene still pass through the same capture gate.
            page.evaluate('''hook=>{const stage=window[hook].stageRef.current;
              for(const [type,y]of [['pointerdown',670],['pointermove',460],['pointerup',350]])
                stage.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,isPrimary:true,pointerId:10,clientX:190,clientY:y}));
              stage.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));}''',hook)
            assert page.evaluate('__admissionCalls')==0
            before=page.evaluate('KingRicoCloud.player.balance')
            page.get_by_role('button',name='JOGAR POR 25 MOEDAS',exact=True).click()
            page.locator('.park-modal').wait_for(state='detached')
            page.wait_for_function('document.documentElement.dataset.parkAdmission==="ready"')
            assert page.evaluate('__admissionCalls')==0
            assert not page.evaluate('g=>!!KingRicoCloud.player[g+"Round"]',game)
            assert page.evaluate('KingRicoCloud.player.balance')==before
            assert page.locator('.park-attraction-tag').count()==0
            page.get_by_role('button',name='Abrir menu',exact=True).click()
            page.locator('.kr-menu-dialog').wait_for();page.keyboard.press('Escape')
            page.screenshot(path='/tmp/park-admission-'+game+'.png')
            if game=='penalty':
                page.wait_for_function('window.Pen3D?.state==="ready"&&!__pen.busy()')
                points=page.evaluate('''()=>{const c=Pen3D,r=c.getBoundingClientRect(),project=v=>{const p=v.clone().project(c.cam);return {x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2}};return {start:project(c.pos),end:project(new c.T.Vector3(3.2,2.7,0))}}''')
                page.mouse.move(**points['start']);page.mouse.down();page.mouse.move(**points['end']);page.mouse.up()
            elif game=='clown':
                r=page.evaluate('__clown.stageRef.current.getBoundingClientRect().toJSON()')
                scale=r['width']/453
                page.mouse.move(r['x']+226*scale,r['y']+670*scale);page.mouse.down()
                page.mouse.move(r['x']+226*scale,r['y']+360*scale,steps=3);page.mouse.up()
            elif game=='flying':
                page.get_by_role('button',name='JOGAR',exact=True).click()
            else:
                page.wait_for_function('window.__fg?.engine&&__fg.state.artReady')
                page.get_by_role('button',name=re.compile('^Girar,')).click()
            page.wait_for_function('__admissionCalls===1')
            if game=='penalty':
                page.wait_for_function('__pen.state.step===1&&!__pen.state.flying')
                page.get_by_role('button',name=re.compile('^Pegar .* moedas$')).click()
                page.wait_for_function('!!__pen.state.win')
                page.get_by_text('OK',exact=True).click()
                page.wait_for_function('!__pen.state.win&&!__pen.state.paying')
                assert page.locator('.park-modal').count()==0
                page.evaluate('''()=>{__admissionCalls=0;Pen3D.dispatchEvent(new PointerEvent('pointerdown',
                  {bubbles:true,cancelable:true,isPrimary:true,pointerId:12,clientX:190,clientY:650}));}''')
                page.locator('.park-modal').wait_for()
                assert page.evaluate('__admissionCalls')==0
                page.get_by_role('button',name='JOGAR POR 25 MOEDAS',exact=True).click()
                page.locator('.park-modal').wait_for(state='detached')
                assert page.evaluate('__admissionCalls')==0
            if game=='fingo':
                page.wait_for_function('!!KingRicoCloud.player.fingoRound')
                roundid=page.evaluate('KingRicoCloud.player.fingoRound.id')
                page.reload();page.wait_for_function('window.__fg&&window.KingRicoCloud?.player?.fingoRound')
                page.locator('#kr-boot-screen').wait_for(state='detached')
                assert page.locator('.park-modal').count()==0
                assert page.evaluate('KingRicoCloud.player.fingoRound.id')==roundid
            reports.append({'game':game,'entryBeforeInput':True,'noReplay':True,'freshPlay':True,'footerRemoved':True})
            context.close()
        assert not errors,errors
        assert not missing,missing
        browser.close()
    print(json.dumps({'games':reports,'pageErrors':errors,'missingAssets':missing}))

if __name__=='__main__':run()
