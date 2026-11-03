"""Nine-drum private preview: printing, movement and graphics recovery.
Run against a local visual preview; refuses a production Firebase account.
"""
from playwright.sync_api import sync_playwright
from PIL import Image,ImageStat
import json,os
os.makedirs("work",exist_ok=True)
BASE=os.environ.get("KING_RICO_TEST_URL","http://127.0.0.1:4178")
with sync_playwright() as p:
 browser_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium')
 b=p.chromium.launch(executable_path=None if browser_path=='bundled' else browser_path,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-webgl'])
 page=b.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 errors=[];bad=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 page.goto(BASE+'/Fortune%20Circus.dc.html?v=lateral-contact')
 page.wait_for_function('document.querySelector("[data-drum-depth=ready]")&&!document.querySelector("#kr-boot-screen")')
 calls=page.locator("[data-drum-depth]").get_attribute("data-drum-depth-calls")
 def matches():
  page.wait_for_function('''()=>{const node=document.querySelector('[data-drum-depth=ready]');if(!node)return false;const expected=[...document.querySelectorAll('.park-reels [data-sym]')].map(e=>e.dataset.parkTicket==='true'?10:Math.round(parseFloat(e.style.backgroundPositionX)*11/100));return expected.join(',')===node.dataset.drumDepthSymbols}''')
 assert page.evaluate("KingRicoCloud.uid")=="park-preview","Only the local preview wallet is allowed"
 matches();page.screenshot(path='work/reel-depth-3d-idle.png')
 # Sample unprinted paper: the housing must visibly shade the upper turn,
 # while the approved front lighting remains clear enough to read the symbol.
 rect=page.locator('.park-drum-depth').bounding_box()
 image=Image.open('work/reel-depth-3d-idle.png').convert('RGB')
 def paper_luma(top,bottom,left=10,right=16):
  box=(round(rect['x']+left/402*rect['width']),round(rect['y']+top/438*rect['height']),
       round(rect['x']+right/402*rect['width']),round(rect['y']+bottom/438*rect['height']))
  r,g,b=ImageStat.Stat(image.crop(box)).mean
  return .2126*r+.7152*g+.0722*b
 upper,front=paper_luma(13,24),paper_luma(70,80)
 assert upper<front*.9,{'upper':upper,'front':front}
 # Unprinted axial margins must darken toward both housing contacts. Sample
 # outside the symbol so changing the artwork cannot satisfy this assertion.
 sides=[]
 for column in range(3):
  offset=column*134
  left,inner_left=paper_luma(70,80,offset+7,offset+12),paper_luma(70,80,offset+16,offset+18)
  right,inner_right=paper_luma(70,80,offset+122,offset+127),paper_luma(70,80,offset+116,offset+118)
  assert left<inner_left*.985 and right<inner_right*.985,{'column':column,'left':[left,inner_left],'right':[right,inner_right]}
  sides.append({'left':round(left/inner_left,3),'right':round(right/inner_right,3)})
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
 print(json.dumps({'WebGL':calls+' draws','upperShadow':{'upper':round(upper,1),'front':round(front,1)},'lateralContactRatios':sides,'sameIdleAndResultSymbols':True,'spinConfirmed':True,'fallbackPlayable':True,'viewports':[390,360,430],'errors':errors,'missing':bad}))
 # A device without WebGL must start directly in the 2D renderer.
 second=b.new_page(viewport={'width':390,'height':844})
 second.add_init_script("""(()=>{const original=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)};})()""")
 second.goto(BASE+'/Fortune%20Circus.dc.html?v=lateral-contact')
 second.wait_for_function('document.querySelector("[data-drum-depth-init=fallback]")&&!document.querySelector("#kr-boot-screen")')
 assert second.evaluate('KingRicoCloud.uid')=='park-preview'
 assert second.locator('.park-drum-depth').count()==0
 second.get_by_role('button',name='Girar',exact=True).click()
 second.wait_for_function('KingRicoCloud.park.spins===1')
 print('No-WebGL startup: playable 2D fallback')
 b.close()
