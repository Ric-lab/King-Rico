from helpers.daily_reward import collect_daily
from playwright.sync_api import sync_playwright
import os
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for mode in ['button','swipe','muted']:
  page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/circus');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  page.evaluate('''()=>{const key='kingRico.parque.mobile-preview.v1',s=JSON.parse(localStorage.getItem(key)),id=crypto.randomUUID();s.park.spins=10;s.park.wheel={id,roundId:id,prizeVersion:3,baseUnits:1000,pockets:[10,1,2,1,3,2,1,5,2,1,3,2,1],result:null};localStorage.setItem(key,JSON.stringify(s));}''')
  page.reload();page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
  btn=page.get_by_role('button',name='GIRAR ROLETA',exact=True);btn.wait_for();page.wait_for_function('!document.querySelector("[data-wheel-spin]").disabled')
  page.evaluate('''muted=>{window.wheelNotes=[];const tone=__fc.tone.bind(__fc);__fc.tone=(...a)=>{wheelNotes.push({type:a[2],at:performance.now()});return tone(...a);};__fc.setState({sound:!muted,sfxLvl:muted?0:2});}''',mode=='muted')
  if mode=='swipe':
   box=page.locator('.park-wheel-machine').bounding_box();x=box['x']+box['width']*.8;y=box['y']+box['height']*.5
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-80,y+90,steps=8);page.mouse.up()
  else:btn.click()
  page.locator('.park-wheel-machine.is-won').wait_for(timeout=15000)
  notes=page.evaluate('wheelNotes')
  if mode=='muted':assert not notes,notes
  else:
   assert len(notes)>8 and all(n['type'] in ['triangle','sine'] for n in notes),notes
   assert page.evaluate('__fc._ac.state')=='running'
   assert page.evaluate('__fc._master.gain.value')>0
  count=len(notes);page.wait_for_timeout(350);assert page.evaluate('wheelNotes.length')==count
  assert not errors,errors
  print(mode+': wheel audio, volume and stop verified',flush=True);page.close()
 b.close()
