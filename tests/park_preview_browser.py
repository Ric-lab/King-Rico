"""Park presentation and entry navigation, only with the isolated preview wallet."""
import os,json
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
ROUTES={r['path']:r['file'] for r in json.load(open('site/routes.json'))}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,height in [(360,800),(390,844),(430,932)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[];missing=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  def ready():
   page.wait_for_function('window.KingRicoCloud?.player&&!document.querySelector("#kr-boot-screen")&&typeof document.querySelector(".park-home-menu")?.onclick==="function"')
   assert page.evaluate('KingRicoCloud.uid')=='park-preview'
   daily=page.get_by_role('button',name='PEGAR MOEDAS',exact=True)
   if daily.count():daily.click()
   page.wait_for_function('document.querySelector("[data-home-balance]").textContent===KingRicoCloud.player.balance.toLocaleString("pt-BR",{maximumFractionDigits:2})')
  page.goto(BASE+'/park');ready()
  hud_boxes={s:page.locator(s).bounding_box() for s in ['.kr-hud-home','.kr-hud-park','.kr-menu-button']}
  assert page.locator('[data-recharge]').bounding_box()['y']<page.locator('[data-game]').first.bounding_box()['y']
  assert page.locator('.kr-hud-park').get_attribute('href')=='/park'
  assert page.locator('[data-game]').count()==3
  assert page.locator('[data-game="fingo"]').count()==0
  assert page.locator('[data-game="penalty"] .park-game-character').get_attribute('src').endswith('clown-keeper-v3.webp')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  for selector in ['.kr-hud-home','.kr-hud-park','.kr-menu-button']:
   r=page.locator(selector).bounding_box();assert r['width']>=43.5 and r['height']>=43.5,(width,selector,r)
  assert page.locator('.kr-menu-button').evaluate('e=>getComputedStyle(e,"::after").backgroundImage').find('stage-lit.webp')>=0
  assert page.locator('.kr-hud-park').evaluate('e=>getComputedStyle(e,"::after").backgroundImage').find('park-gamepad-v2.svg')>=0
  for prop in ['width','height','transform']:
   assert page.locator('.kr-hud-park').evaluate('(e,p)=>getComputedStyle(e,"::after")[p]',prop)==page.locator('.kr-hud-home').evaluate('(e,p)=>getComputedStyle(e,"::after")[p]',prop)
  page.wait_for_function('[...document.images].filter(n=>n.getBoundingClientRect().width).every(n=>n.complete&&n.naturalWidth>0)')
  page.wait_for_function('!document.querySelector(".kr-wallet-coin,.kr-reward-flying-coin")')
  page.screenshot(path=f'work/preview-park-{width}.png',full_page=True)
  y=page.locator('.kr-hud-row').bounding_box()['y'];page.evaluate('scrollTo(0,180)');page.wait_for_timeout(200)
  travel=page.evaluate('Math.min(180,document.documentElement.scrollHeight-innerHeight)')
  assert page.locator('.kr-hud-row').bounding_box()['y']<y-min(60,travel*.7),'Only banner should stay fixed'
  assert abs(page.locator('#kr-ad-banner').bounding_box()['y'])<1
  page.evaluate('scrollTo(0,0)')
  balance=page.evaluate('KingRicoCloud.player.balance')
  page.evaluate('KingRicoWallet.set(document.querySelector("[data-home-balance]"),100000000.65,{external:true})')
  page.wait_for_function('document.querySelector("[data-home-balance]").textContent==="100.000.000,65"')
  page.wait_for_function("""()=>{
   const w=document.querySelector('.kr-hud-balance').getBoundingClientRect();
   return [...document.querySelectorAll('.kr-hud-home,.kr-hud-park,.kr-menu-button')].every(e=>{const r=e.getBoundingClientRect();return w.right+2<r.left||w.bottom+2<r.top;});
  }""")
  assert page.locator('[data-home-balance]').evaluate('e=>getComputedStyle(e).fontSize')=='19px'
  assert page.evaluate('KingRicoCloud.player.balance')==balance
  page.screenshot(path=f'work/preview-hud-long-{width}.png')
  page.evaluate('KingRicoWallet.set(document.querySelector("[data-home-balance]"),KingRicoCloud.player.balance,{external:true})')
  page.wait_for_function('!document.querySelector(".kr-hud-row").classList.contains("has-wide-wallet")')
  if width==390:
   page.get_by_role('button',name='Abrir menu',exact=True).click()
   menu=page.get_by_role('dialog',name='Menu — Parque',exact=True);menu.wait_for()
   menu.get_by_role('group',name='Efeitos sonoros',exact=True).get_by_role('button',name='50%',exact=True).click()
   page.wait_for_function('KingRicoCloud.player.settings.sfxLvl===1');page.keyboard.press('Escape')
   page.locator('[data-recharge]').click()
   page.get_by_role('dialog',name='Simulação de anúncio de 30 segundos',exact=True).wait_for()
   page.get_by_role('button',name='Fechar anúncio sem ganhar moedas',exact=True).click()
   assert page.evaluate('KingRicoCloud.player.balance')==balance
   for game,path in [('clown','/clown'),('penalty','/penalty'),('flying','/flying-clown')]:
    page.locator('[data-game="'+game+'"]').click()
    page.wait_for_url(lambda url:unquote(urlparse(url).path).rstrip('/') in [path,'/'+ROUTES[path]])
    page.locator('.park-entry-dialog,.park-modal').first.wait_for(timeout=15000)
    page.goto(BASE+'/park');ready()
    assert page.evaluate('KingRicoCloud.player.balance')==balance,'Opening a card must not debit coins'
   assert page.evaluate('KingRicoCloud.player.settings.sfxLvl')==1
   page.get_by_role('link',name='Voltar ao Circus',exact=True).click();page.wait_for_function('window.__fc?._parkHook')
   for selector,expected in hud_boxes.items():
    actual=page.locator(selector).bounding_box()
    assert all(abs(actual[k]-expected[k])<1.2 for k in ['x','y','width','height']),(selector,actual,expected)
   page.get_by_role('link',name='Abrir parque',exact=True).click();ready()
  assert not errors and not missing,(errors,missing)
  print(json.dumps({'parkWidth':width,'assets':True,'hudTargets':True,'normalScroll':True,'errors':errors,'missing':missing}),flush=True)
  page.close()
 b.close()
