import json,subprocess,time,os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
(ROOT/'work/fortune-impulso').mkdir(parents=True,exist_ok=True)
URL=os.environ.get('IMPULSO_URL','http://127.0.0.1:5097')
NODE=os.environ.get('IMPULSO_NODE','node')
KEY='king-rico-impulso-demo-v2'
def find_shot(seed,stage,kind='hit',index=None):
    script='''import {makeLayout,simulateShot,velocityFromGesture} from './prototypes/fortune-impulso/physics.mjs';
const [seed,stage,kind,index]=JSON.parse(process.argv[1]);let best;
for(let dx=-80;dx<=80;dx+=2)for(let dy=-55;dy>=-165;dy-=2){const r=simulateShot(makeLayout(seed,stage),velocityFromGesture(dx,dy));if(r.kind===kind&&(index===null||r.index===index)&&(!best||r.distance<best.result.distance))best={dx,dy,result:r};}console.log(JSON.stringify(best));'''
    return json.loads(subprocess.check_output([NODE,'--input-type=module','-e',script,json.dumps([seed,stage,kind,index])],cwd=ROOT))

with sync_playwright() as w:
    browser=w.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage'])
    context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    page=context.new_page();errors=[];failed=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:failed.append([r.status,r.url]) if r.status>=400 else None)
    page.goto(URL,wait_until='networkidle');page.wait_for_function('window.impulso');page.evaluate('document.fonts.ready')
    page.screenshot(path=str(ROOT/'work/fortune-impulso/v2-mobile.png'))
    snapshot=lambda:page.evaluate('impulso.snapshot()')
    def swiping(shot,cancel=False):
        box=page.locator('canvas').bounding_box();scale=box['width']/390
        x=box['x']+box['width']/2;y=box['y']+box['height']-50
        cdp=context.new_cdp_session(page)
        point=lambda xx,yy:[{'x':xx,'y':yy,'id':1,'radiusX':4,'radiusY':4}]
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':point(x,y)})
        for i in range(1,6):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':point(x+shot['dx']*scale*i/5,y+shot['dy']*scale*i/5)})
        assert snapshot()['gesture']['velocity'] is not None,'Swipe não capturado'
        cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel' if cancel else 'touchEnd','touchPoints':[]})
        cdp.detach()
    page.locator('#play').click();assert snapshot()['state']['balance']==975
    swiping({'dx':40,'dy':-140},cancel=True)
    assert snapshot()['state']['round']['status']=='aim';assert snapshot()['gesture'] is None
    print('PASS toque cancelado não lança nem aposta novamente',flush=True)
    for stage in range(3):
        s=snapshot()['state'];shot=find_shot(s['round']['seed'],stage,index=stage)
        assert shot
        swiping(shot)
        if stage==0:
            page.reload(wait_until='domcontentloaded');page.wait_for_function('window.impulso')
        page.wait_for_function("['choice','paid'].includes(impulso.snapshot().state.round.status)",timeout=45000)
        s=snapshot()['state'];assert s['round']['stage']==stage+1
        print(f'PASS zona {stage}, lance {stage+1}, {s["round"]["amount"]} moedas',flush=True)
        if stage==2:page.screenshot(path=str(ROOT/'work/fortune-impulso/v2-three-hits.png'))
        if stage<2:
            before=s['round']['amount'];page.locator('#risk').click()
            assert snapshot()['state']['round']['amount']==before
    final=snapshot()['state'];expected=1000-25+final['round']['amount'];assert final['balance']==expected
    page.reload(wait_until='domcontentloaded');page.wait_for_function('window.impulso');assert snapshot()['state']['balance']==expected
    print('PASS terceiro acerto recebe uma vez e recarregar preserva saldo',flush=True)
    page.locator('#again').click();s=snapshot()['state'];shot=find_shot(s['round']['seed'],0,index=1);swiping(shot)
    page.wait_for_function("impulso.snapshot().state.round.status==='choice'",timeout=45000)
    s=snapshot()['state'];expected=s['balance']+s['round']['amount'];page.locator('#collect').click();assert snapshot()['state']['balance']==expected
    page.reload(wait_until='domcontentloaded');page.wait_for_function('window.impulso');assert snapshot()['state']['balance']==expected
    print('PASS receber e recarregar não duplica prêmio',flush=True)
    page.locator('#again').click();s=snapshot()['state'];expected=s['balance'];shot=find_shot(s['round']['seed'],0,kind='miss');swiping(shot)
    page.wait_for_function("impulso.snapshot().state.round.status==='lost'",timeout=45000)
    assert snapshot()['state']['balance']==expected
    page.locator('#change-bet').click();page.locator('#bet-more').click();assert snapshot()['state']['bet']==50
    print('PASS derrota, nova aposta e alteração de valor',flush=True)
    page.get_by_role('button',name='Abrir menu',exact=True).click();page.get_by_role('button',name='OFF',exact=True).first.click()
    assert snapshot()['state']['settings']['sfx']==0
    page.get_by_role('button',name='Fechar menu',exact=True).click();page.locator('#help').click();assert page.locator('#how-to').evaluate('(d)=>d.open');page.locator('#got-it').click()
    print('PASS menu padronizado, som e instruções',flush=True)
    for width,height,name in [(360,640,'small-mobile'),(1440,960,'desktop')]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(250)
        assert page.locator('#play').is_visible();assert page.locator('#play').bounding_box()['y']<height
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        if width==360:
            top=page.evaluate('impulso.project(0,-3.2)');bottom=page.evaluate('impulso.project(0,4.2)');box=page.locator('canvas').bounding_box()
            assert top['y']>box['y'] and bottom['y']<box['y']+box['height'],(top,bottom,box)
        page.screenshot(path=str(ROOT/f'work/fortune-impulso/v2-{name}.png'))
        print(f'PASS enquadramento {width}x{height}',flush=True)
    page.set_viewport_size({'width':390,'height':844});before=snapshot()['state']['balance'];page.locator('#practice').click()
    assert snapshot()['state']['balance']==before
    s=snapshot()['state'];swiping(find_shot(s['round']['seed'],0,index=2))
    page.wait_for_function("impulso.snapshot().state.round.status==='paid'",timeout=45000)
    assert snapshot()['state']['balance']==before
    assert snapshot()['state']['round']['training']
    print('PASS ensaio sem aposta, sem débito e sem prêmio em moedas',flush=True)
    assert errors==[],errors;assert failed==[],failed
    print('PASS sem erros JavaScript ou arquivos quebrados',flush=True)
    browser.close()
