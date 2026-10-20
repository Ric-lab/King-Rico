"""Integration tests against a built Fortune 21, including real touch and two tabs."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('FORTUNE_21_TEST_URL','http://127.0.0.1:5099/')
KEY = 'king-rico-fortune-21-demo-v1'
OUT = Path('work/fortune-21'); OUT.mkdir(parents=True,exist_ok=True)

def deck(values):
    rest=[{'id':f'{s}-{i}', 'value':min(i,10), 'suit':s} for s in ['crown','gem','clover','tent'] for i in range(1,14)]
    first=[]
    for v in values:
        index=next(i for i,c in enumerate(rest) if c['value']==v)
        first.append(rest.pop(index))
    return first+rest

def fixture(values,phase='player',balance=980):
    cards=deck(values)
    return {'version':1,'revision':1,'balance':balance,'bet':20,'rounds':0,'round':{
        'id':'fixture-'+''.join(map(str,values)),'bet':20,'deck':cards[4:],
        'player':[cards[0],cards[2]],'dealer':[cards[1],cards[3]],'phase':phase,'result':None}}

def saved(page): return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',arg=KEY)
def seed(page,value):
    page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))',[KEY,value])
    page.reload()
    page.wait_for_function("getComputedStyle(document.querySelector('#game')).getPropertyValue('--scene-scale') !== ''")

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--disable-dev-shm-usage'])
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    page=context.new_page(); errors=[]; failed=[]
    context.on('page',lambda tab:tab.on('pageerror',lambda e:errors.append(str(e))))
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda response:failed.append((response.status,response.url)) if response.status>=400 else None)
    page.goto(URL)
    page.wait_for_function("document.querySelector('.kr-menu-button') !== null")
    assert page.locator('#balance').inner_text()=='1.000'
    # Existing prototype/account keys are never imported.
    page.evaluate("localStorage.setItem('king-rico-state',JSON.stringify({balance:999999}))")
    page.reload();assert page.locator('#balance').inner_text()=='1.000'
    page.screenshot(path=str(OUT/'idle-390.png'))
    page.get_by_role('button',name='DISTRIBUIR CARTAS').tap()
    page.wait_for_function('(key)=>JSON.parse(localStorage.getItem(key))?.round !== null',arg=KEY)
    first=saved(page); assert first['balance'] in [980,1000,1030]
    round_id=first['round']['id']; page.reload()
    assert saved(page)['balance']==first['balance'] and saved(page)['round']['id']==round_id

    # Winning hand: hide the second bank card, stand, pause while bank waits.
    seed(page,fixture([10,6,8,7,10]))
    assert page.locator('#dealer-hand .back').count()==1
    assert page.locator('#dealer-hand [aria-label="Carta 7, coroa"]').count()==0
    assert page.locator('#player-score').inner_text()=='18'
    page.get_by_role('button',name='PARAR',exact=False).tap()
    page.get_by_role('button',name='Abrir menu').tap()
    assert page.get_by_role('dialog',name='Menu — Fortune 21').is_visible()
    page.wait_for_timeout(1100)
    assert saved(page)['round']['phase']=='dealer'
    page.get_by_role('button',name='Fechar menu').tap()
    page.wait_for_function('(key)=>JSON.parse(localStorage.getItem(key)).round.phase === "settled"',arg=KEY)
    page.wait_for_selector('#result-dialog[open]')
    assert saved(page)['balance']==1020 and saved(page)['round']['result']['payout']==40
    assert page.locator('#result-title').inner_text()=='Você ganhou!'
    page.screenshot(path=str(OUT/'win-390.png'))
    page.reload();page.wait_for_selector('#result-dialog[open]')
    assert saved(page)['balance']==1020
    page.get_by_role('button',name='VOLTAR À MESA').tap()
    page.wait_for_timeout(900);assert saved(page)['balance']==1020

    # Bust: repeated physical taps cannot request two cards or debit again.
    seed(page,fixture([10,9,8,8,10]))
    hit=page.locator('#hit').bounding_box()
    for _ in range(3):page.touchscreen.tap(hit['x']+hit['width']/2,hit['y']+hit['height']/2)
    page.wait_for_selector('#result-dialog[open]')
    assert saved(page)['balance']==980 and len(saved(page)['round']['player'])==3
    assert page.locator('#result-title').inner_text()=='Passou de 21.'
    page.reload();page.wait_for_selector('#result-dialog[open]');assert saved(page)['balance']==980
    page.locator('#collect').tap()

    # Ace is adjusted without an extra decision; bank stands on soft 17.
    seed(page,fixture([1,1,6,6,10]))
    assert page.locator('#player-score').inner_text()=='17'
    assert 'valendo 11' in page.locator('#ace-note').inner_text()
    page.locator('#hit').tap()
    page.wait_for_function("document.querySelector('#ace-note').textContent === ''")
    assert page.locator('#player-score').inner_text()=='17'
    page.wait_for_function("!document.querySelector('#stand').disabled")
    page.locator('#stand').tap();page.wait_for_selector('#result-dialog[open]')
    assert len(saved(page)['round']['dealer'])==2
    assert saved(page)['round']['result']['outcome']=='push' and saved(page)['balance']==1000
    page.locator('#collect').tap()

    # Reload in the middle of the bank's turn resumes rather than re-dealing.
    seed(page,fixture([10,2,9,3,4,10],phase='dealer'))
    page.reload();page.wait_for_selector('#result-dialog[open]')
    resumed=saved(page);assert resumed['round']['result']['outcome']=='push'
    assert len(resumed['round']['dealer'])==4 and resumed['balance']==1000
    page.locator('#collect').tap()

    # Two simultaneous tabs coordinate bank steps under a shared Web Lock.
    seed(page,fixture([10,2,8,3,4,8],phase='dealer'))
    second=context.new_page();second.goto(URL)
    page.wait_for_function('(key)=>JSON.parse(localStorage.getItem(key)).round.phase === "settled"',arg=KEY)
    page.wait_for_selector('#result-dialog[open]')
    assert saved(page)['balance']==1020
    assert len(saved(page)['round']['dealer'])==4
    second.wait_for_selector('#result-dialog[open]')
    assert second.locator('#balance').inner_text()=='1.020'
    page.wait_for_timeout(1200);assert saved(page)['balance']==1020
    second.close();page.locator('#collect').tap()

    # A real player's turn remains legible, fitted and operable at small sizes.
    seed(page,fixture([10,9,6,8,2]))
    for width,height in [(390,844),(360,640),(320,568),(1440,960)]:
        page.set_viewport_size({'width':width,'height':height})
        expected=min(width/453,height/810)
        page.wait_for_function('(s)=>Math.abs(parseFloat(document.querySelector("#game").style.getPropertyValue("--scene-scale"))-s)<.001',arg=expected)
        page.wait_for_function('(v)=>{const r=document.querySelector("#game").getBoundingClientRect();return r.left>=-1&&r.right<=v[0]+1&&Math.abs(r.bottom-v[1])<2}',arg=[width,height])
        page.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        for selector in ['#hit','#stand','#player-hand','#dealer-hand']:
            box=page.locator(selector).bounding_box()
            assert box['x']>=-1 and box['x']+box['width']<=width+1,(width,selector,box)
            assert box['y']>=0 and box['y']+box['height']<=height+1,(height,selector,box)
            if selector in ['#hit','#stand']: assert box['width']>=44 and box['height']>=44
        # Text must sit between the two hands, not over the card corners.
        bank=page.locator('#dealer-hand').bounding_box();player=page.locator('#player-hand').bounding_box();status=page.locator('#status-wrap').bounding_box()
        assert bank['y']+bank['height']<=status['y']+5,(width,'bank/status collision')
        assert status['y']+status['height']<=player['y']+5,(width,'player/status collision')
        page.wait_for_function("document.getAnimations().every(a=>a.playState !== 'running')")
        assert page.locator('#dealer-hand .card').count()==2
        assert page.locator('#player-hand .card').count()==2
        page.screenshot(path=str(OUT/f'playing-{width}.png'))
    page.set_viewport_size({'width':390,'height':844})
    page.get_by_role('button',name='Como jogar').tap()
    assert page.get_by_role('dialog',name='Como jogar').is_visible()
    page.locator('#help-done').tap()
    page.get_by_role('button',name='Abrir menu').tap()
    page.get_by_role('group',name='Efeitos sonoros').get_by_role('button',name='OFF',exact=True).tap()
    page.get_by_role('button',name='Fechar menu').tap()
    page.reload();page.get_by_role('button',name='Abrir menu').tap()
    assert page.get_by_role('group',name='Efeitos sonoros').get_by_role('button',name='OFF',exact=True).get_attribute('aria-pressed')=='true'
    page.get_by_role('button',name='Fechar menu').tap()

    # Failed storage writes must not debit or draw, and surface a useful error.
    seed(page,fixture([10,9,6,8,2]))
    before=saved(page)
    page.evaluate("()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}}")
    page.locator('#hit').tap();page.wait_for_selector('#error:not([hidden])')
    assert saved(page)==before and page.locator('#hit').is_disabled()
    assert not errors,errors
    assert not failed,failed
    print(json.dumps({'ok':True,'checks':['touch','first-deal','reload-no-debit','hidden-bank-card','pause-menu','win','bust','push','ace','soft-17','resume-bank','no-double-credit','two-tabs','responsive-320-1440','help','preferences','storage-failure'],'javascript_errors':errors,'http_errors':failed}))
    browser.close()
