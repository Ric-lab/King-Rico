from playwright.sync_api import sync_playwright
from pathlib import Path
import time,os
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'work/cascade';OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('CASCADE_URL','http://127.0.0.1:5097')
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
 c.add_init_script("const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>a instanceof Uint32Array&&a.length===1?(a[0]=123,a):original(a)")
 p=c.new_page();errors=[];failed=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' else None);p.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
 p.goto(URL,wait_until='networkidle');p.wait_for_function('window.cascade');p.evaluate('document.fonts.ready');p.screenshot(path=str(OUT/'final-idle.png'))
 snap=lambda:p.evaluate('cascade.snapshot()')
 p.locator('#play').click();assert snap()['state']['balance']==975
 cd=c.new_cdp_session(p)
 def touch(kind,x=None,y=None):cd.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if x is None else [{'x':x,'y':y,'id':1,'radiusX':4,'radiusY':4}]})
 origin=p.evaluate('cascade.project(180,450)');touch('touchStart',origin['x'],origin['y']);touch('touchMove',origin['x']+70,origin['y']);assert snap()['catcher']>210
 edge_x=p.viewport_size['width']-8;touch('touchMove',edge_x,origin['y']);p.wait_for_function('cascade.snapshot().catcher>=276');edge=snap()['catcher'];touch('touchMove',edge_x-10,origin['y']);p.wait_for_function('(edge)=>cascade.snapshot().catcher<edge',arg=edge)
 touch('touchCancel');assert snap()['pointer'] is None;assert snap()['state']['balance']==975
 print('PASS swipe por toque, reversão na borda e cancelamento',flush=True)
 p.wait_for_timeout(800);before=snap()['state'];p.reload(wait_until='domcontentloaded');p.wait_for_function('window.cascade');after=snap()['state']
 assert after['balance']==before['balance'];assert after['round']['id']==before['round']['id'];assert after['round']['spawned']>=before['round']['spawned']-6
 print('PASS atualização retoma a rodada sem repetir aposta',flush=True)
 cd=c.new_cdp_session(p);origin=p.evaluate('(x)=>cascade.project(x,450)',snap()['catcher']);touch('touchStart',origin['x'],origin['y']);deadline=time.monotonic()+120;shot=False;avalanche_shot=False
 while snap()['state']['round']['phase']=='playing' and time.monotonic()<deadline:
  s=snap();balls=[v for v in s['balls'] if 300<v['y']<445]
  if balls:
   v=max(balls,key=lambda o:o['y']);pos=p.evaluate('(x)=>cascade.project(x,450)',max(83,min(277,v['x'])));touch('touchMove',pos['x'],origin['y'])
  if not shot and s['state']['round']['spawned']>35:
   p.screenshot(path=str(OUT/'final-rain.png'));shot=True
  if not avalanche_shot and any(g['openedAt'] is not None for g in s['state']['round']['gates']):
   p.screenshot(path=str(OUT/'final-avalanche.png'));avalanche_shot=True
  p.wait_for_timeout(80)
 touch('touchEnd');s=snap()['state'];assert s['round']['phase']=='paid',s['round'];assert s['round']['caught']>=5,s['round'];assert s['round']['resolved'] and len(s['round']['resolved'])==s['round']['total'];assert any(g['openedAt'] is not None for g in s['round']['gates']),s['round'];assert all(g['spawned']==12 for g in s['round']['gates'] if g['openedAt'] is not None);prize=s['round']['bet']*s['round']['points']//25
 assert s['balance']==975+prize;p.screenshot(path=str(OUT/'final-result.png'));p.reload(wait_until='domcontentloaded');p.wait_for_function('window.cascade');assert snap()['state']['balance']==975+prize
 print(f'PASS {s["round"]["total"]} bolinhas resolvidas com avalanche: {s["round"]["caught"]} coletadas, {s["round"]["combos"]} trincas, prêmio {prize}; recarregar não duplica',flush=True)
 p.get_by_role('button',name='Abrir menu',exact=True).click();p.get_by_role('button',name='OFF',exact=True).first.click();assert snap()['state']['settings']['sfx']==0;p.get_by_role('button',name='Fechar menu',exact=True).click();p.locator('#help').click();assert p.locator('#how-to').evaluate('(d)=>d.open');p.locator('#got-it').click()
 print('PASS menu compartilhado, som e instruções',flush=True)
 p.locator('#back').click()
 for width,height in [(360,640),(1440,960)]:
  p.set_viewport_size({'width':width,'height':height});p.wait_for_timeout(100);box=p.locator('#play').bounding_box();assert box['y']+box['height']<height;assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
  p.screenshot(path=str(OUT/f'final-{width}.png'))
 print('PASS enquadramento em celular pequeno e desktop',flush=True)
 p.set_viewport_size({'width':390,'height':844});balance=snap()['state']['balance'];p.locator('#practice').click();assert snap()['state']['balance']==balance
 p.wait_for_function("cascade.snapshot().state.round.phase==='paid'",timeout=120000);assert snap()['state']['balance']==balance
 print('PASS ensaio completo sem débito ou prêmio em moedas',flush=True)
 assert not errors,errors;assert not failed,failed;print('PASS sem erros JavaScript ou recursos quebrados',flush=True);b.close()
