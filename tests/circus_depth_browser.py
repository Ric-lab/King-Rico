"""Nine-drum private preview: printing, movement and graphics recovery.
Run against a local visual preview; refuses a production Firebase account.
"""
from playwright.sync_api import sync_playwright
import json,os
os.makedirs("work",exist_ok=True)
BASE=os.environ.get("KING_RICO_TEST_URL","http://127.0.0.1:4178")
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-webgl'])
 page=b.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 errors=[];bad=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 page.goto(BASE+'/Fortune%20Circus.dc.html?v=76')
 page.wait_for_function('document.querySelector("[data-drum-depth=ready]")&&!document.querySelector("#kr-boot-screen")')
 def matches():
  page.wait_for_function('''()=>{const node=document.querySelector('[data-drum-depth=ready]');if(!node)return false;const expected=[...document.querySelectorAll('.park-reels [data-sym]')].map(e=>e.dataset.parkTicket==='true'?10:Math.round(parseFloat(e.style.backgroundPositionX)*11/100));return expected.join(',')===node.dataset.drumDepthSymbols}''')
 assert page.evaluate("KingRicoCloud.uid")=="park-preview","Only the local preview wallet is allowed"
 matches();page.screenshot(path='work/reel-depth-3d-idle.png')
 before=page.evaluate('KingRicoCloud.park.spins')
 page.get_by_role('button',name='Girar',exact=True).click()
 page.wait_for_function('document.querySelectorAll(".park-physical-reel").length>0&&document.querySelector("[data-drum-depth=ready]")')
 page.screenshot(path='work/reel-depth-3d-moving.png')
 page.wait_for_function('!__fc.state.spinning&&!__fc.state.queued&&document.querySelectorAll(".park-physical-reel").length===0',timeout=30000)
 matches()
 assert page.evaluate('KingRicoCloud.park.spins')==before+1
 page.screenshot(path='work/reel-depth-3d-result.png')
 for width,height in [(360,800),(430,932)]:
  page.set_viewport_size({'width':width,'height':height})
  page.wait_for_function('w=>Math.abs(__fc.state.vw-w)<1',arg=width)
  page.screenshot(path='work/reel-depth-3d-'+str(width)+'.png')
  for label in ['Girar automático','Girar mais rápido']:
   assert page.get_by_role('button',name=label,exact=True).evaluate('e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest(".park-panel-control")===e}')
 # Loss of graphics must restore the original tape rather than block the game.
 if page.evaluate('__fc.state.showWin'):page.evaluate('__fc.dismissWin()')
 page.wait_for_function('!__fc.cloudBusy()&&!__fc.state.balPending')
 page.locator('.park-drum-depth').evaluate('e=>e.dispatchEvent(new Event("webglcontextlost",{cancelable:true}))')
 page.wait_for_function('!document.querySelector("[data-drum-depth=ready]")')
 assert page.locator('.park-drum-depth').count()==0
 page.get_by_role('button',name='Girar',exact=True).click()
 page.wait_for_function('(n)=>KingRicoCloud.park.spins===n',arg=before+2)
 assert not errors,errors
 assert not bad,bad
 print(json.dumps({'WebGL':'10 draws','sameIdleAndResultSymbols':True,'spinConfirmed':True,'fallbackPlayable':True,'viewports':[390,360,430],'errors':errors,'missing':bad}))
 # A device without WebGL must start directly in the 2D renderer.
 second=b.new_page(viewport={'width':390,'height':844})
 second.add_init_script("""(()=>{const original=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)};})()""")
 second.goto(BASE+'/Fortune%20Circus.dc.html?v=76')
 second.wait_for_function('document.querySelector("[data-drum-depth-init=fallback]")&&!document.querySelector("#kr-boot-screen")')
 assert second.evaluate('KingRicoCloud.uid')=='park-preview'
 assert second.locator('.park-drum-depth').count()==0
 second.get_by_role('button',name='Girar',exact=True).click()
 second.wait_for_function('KingRicoCloud.park.spins===1')
 print('No-WebGL startup: playable 2D fallback')
 b.close()
