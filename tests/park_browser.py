"""Approved park UI against the real Google Auth and Firestore emulators."""
import os,json,uuid,time,re
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:5000')

def ready(page):
    page.wait_for_function('window.KingRicoCloud?.player',timeout=30000)
    page.evaluate('async()=>{await KingRicoCloud.ready}')
    page.locator('[data-cloud-login]').wait_for(state='hidden')

def login(page):
    page.locator('[data-cloud-test-account]').fill('park-ui-'+uuid.uuid4().hex)
    page.get_by_role('button',name='Entrar com conta de teste',exact=True).click()
    ready(page)

def healthy(page):
    missing=page.locator('img').evaluate_all('nodes=>nodes.filter(n=>n.getBoundingClientRect().width>0&&(!n.complete||n.naturalWidth===0)).map(n=>n.src)')
    assert not missing,missing
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')

def run():
  with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage'])
    c=browser.new_context(viewport={'width':390,'height':844},timezone_id='America/Sao_Paulo');page=c.new_page();errors=[];bad=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=400 and 'favicon' not in r.url else None)
    page.add_init_script("localStorage.setItem('kingRico.parque.mobile-preview.v1',JSON.stringify({balance:999999,tickets:99}));")
    page.goto(BASE+'/');login(page)
    assert '/home' in page.url
    assert page.evaluate('KingRicoCloud.player.balance')==1000
    assert page.evaluate('KingRicoCloud.park.tickets')==0
    page.get_by_role('dialog',name='Presente do dia',exact=True).wait_for()
    page.get_by_role('button',name='PEGAR MOEDAS',exact=True).click()
    page.wait_for_function('KingRicoCloud.player.balance===1050');healthy(page)
    assert page.locator('[data-game]').count()==4
    page.wait_for_function('document.querySelector("[data-home-balance]").textContent==="1.050"',timeout=10000)
    page.screenshot(path='/tmp/park-home-production.png',full_page=True)
    if not os.environ.get('KING_RICO_QUICK_QA'):
      page.locator('[data-recharge]').click()
      page.get_by_role('dialog',name='Simulação de anúncio de 30 segundos',exact=True).wait_for()
      page.get_by_role('button',name='Fechar anúncio sem ganhar moedas',exact=True).click()
      assert page.evaluate('KingRicoCloud.player.balance')==1050
      page.locator('[data-recharge]').click()
      receipt=page.get_by_role('dialog',name='Você ganhou 1.000 moedas',exact=True)
      receipt.wait_for(timeout=40000)
      assert page.evaluate('KingRicoCloud.player.balance')==2050
      assert page.locator('[data-home-balance]').inner_text()=='1.050'
      page.get_by_role('button',name='OK',exact=True).click()
      page.wait_for_function('document.querySelector("[data-home-balance]").textContent==="2.050"',timeout=10000)
    uid=page.evaluate('KingRicoCloud.uid')
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.get_by_role('dialog',name='Menu — Fortune Circus',exact=True).wait_for()
    assert page.get_by_role('button',name='Sair da conta',exact=True).count()==1
    page.keyboard.press('Escape')
    page.get_by_role('link',name='Jogar Fortune Circus',exact=True).click();ready(page)
    page.wait_for_function('window.__fc?._parkHook');assert page.evaluate('KingRicoCloud.uid')==uid
    backdrop=page.locator('.park-circus-ambient').evaluate('n=>({image:getComputedStyle(n).backgroundImage,position:getComputedStyle(n).backgroundPosition,filter:getComputedStyle(n).filter})')
    assert 'circus-daylight-v1.webp' in backdrop['image'] and backdrop['position']=='50% 50%' and backdrop['filter']=='none',backdrop
    page.screenshot(path='/tmp/park-circus-production.png')
    # Real first button/spin, then accelerate setup through the same persisted API.
    page.evaluate('''()=>{const native=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>a instanceof Uint32Array&&a.length===1?(a[0]=Math.floor(.99*2**32),a):native(a);__fc.setState({betIdx:0});__fc.spin();}''')
    page.wait_for_function('KingRicoCloud.park.spins===1',timeout=30000)
    deadline=time.monotonic()+35
    while time.monotonic()<deadline:
      state=page.evaluate('({win:!!__fc.state.showWin,idle:!__fc.cloudBusy()&&!__fc.state.balPending&&!__fc._parkMeterBusy})')
      if state['win']:page.evaluate('__fc.dismissWin()')
      if state['idle'] and time.monotonic()>deadline-32:break
      page.wait_for_timeout(150)
    else:raise AssertionError(page.evaluate('({state:__fc.state,motion:__fc._parkMotionLog})'))
    for n in range(9):
      page.wait_for_timeout(750)
      page.evaluate("async()=>{await KingRicoCloud.spin('circus',1)}")
    page.get_by_role('dialog',name='Roleta multiplicadora',exact=True).wait_for(timeout=30000)
    assert page.evaluate('KingRicoCloud.park.wheel.baseUnits')>0
    # Reload before drawing and after drawing: same prize/result, one credit.
    wheelid=page.evaluate('KingRicoCloud.park.wheel.id');page.reload();ready(page)
    spin=page.get_by_role('button',name='GIRAR ROLETA',exact=True);spin.wait_for(timeout=30000);spin.click()
    page.get_by_role('button',name=re.compile('APLICAR ×')).wait_for(timeout=20000)
    balance=page.evaluate('KingRicoCloud.player.balance');result=page.evaluate('KingRicoCloud.park.wheel.result')
    page.reload();ready(page);apply=page.get_by_role('button',name=re.compile('APLICAR ×'));apply.wait_for(timeout=30000)
    assert page.evaluate('KingRicoCloud.park.wheel.id')==wheelid
    assert page.evaluate('KingRicoCloud.player.balance')==balance
    page.screenshot(path='/tmp/park-wheel-production.png');apply.click()
    page.wait_for_function('KingRicoCloud.park.wheel===null&&!__fc._parkCollecting&&!__fc._parkWheelVisible',timeout=25000)
    assert page.evaluate('KingRicoCloud.player.balance')==balance
    page.goto(BASE+'/home');ready(page);healthy(page)
    # Entry authorizes; the first real play charges once. Refresh retains round.
    page.locator('[data-game="fingo"]').click();ready(page)
    page.get_by_role('dialog',name='Fingo rápido',exact=True).wait_for()
    page.get_by_role('button',name='JOGAR POR 25 MOEDAS',exact=True).click()
    page.wait_for_function('window.__fg?.engine&&__fg.state.artReady')
    assert page.evaluate('KingRicoCloud.player.balance')==balance
    page.get_by_role('button',name=re.compile('^Girar,')).click()
    try:page.wait_for_function('window.__fg.state.phase==="drop"&&__fg.state.cardOpen',timeout=12000)
    except Exception:
      print('FINGO_DIAGNOSTIC',page.evaluate('({phase:__fg.state.phase,req:__fg._cloudRequest,preparing:__fg._preparingRoll,card:__fg.state.cardOpen,bet:__fg.state.betIdx,round:KingRicoCloud.player.fingoRound,park:KingRicoCloud.park,notice:document.querySelector("[data-cloud-notice]")?.textContent})'),errors,flush=True)
      page.screenshot(path='/tmp/park-fingo-error.png');raise
    assert page.evaluate('KingRicoCloud.player.balance')==round(balance-25,2)
    assert page.evaluate('KingRicoCloud.player.fingoRound.ballLimit')==10
    assert page.locator('[data-fingo-free-icon]').get_attribute('src').startswith('data:image/webp;base64,')
    page.screenshot(path='/tmp/park-fingo-production.png');healthy(page)
    roundid=page.evaluate('KingRicoCloud.player.fingoRound.id');page.reload();ready(page)
    page.wait_for_function('window.__fg?.state.phase==="drop"');assert page.evaluate('KingRicoCloud.player.fingoRound.id')==roundid
    assert page.evaluate('KingRicoCloud.player.balance')==round(balance-25,2)
    # Every published game still mounts with its own assets and standard menu.
    for route,hook in [('clown','__clown'),('penalty','__pen'),('flying-clown','__flying'),('wheel','__fw'),('neck','__fn'),('33','KingRico21')]:
      page.goto(BASE+'/'+route);ready(page)
      page.wait_for_function('hook=>!!window[hook]',arg=hook,timeout=30000)
      if route in ['clown','penalty','flying-clown']:
        page.get_by_role('button',name='JOGAR POR 25 MOEDAS',exact=True).click()
      page.wait_for_timeout(1200);healthy(page)
      page.get_by_role('button',name='Abrir menu',exact=True).click()
      page.locator('.kr-menu-dialog').wait_for();page.keyboard.press('Escape')
      page.screenshot(path='/tmp/park-compat-'+route+'.png')
    assert not errors,errors
    assert not bad,bad
    print(json.dumps({'home':'ok','googleSession':'ok','background':backdrop,'wheelRecovery':'ok','multiplier':result['multiplier'],'fingo10':'ok','assets':'ok'}));browser.close()
if __name__=='__main__':run()
