"""First blocked haptic, coalesced scratch samples and successive cosmetic pours."""
import json,os
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
os.makedirs('work',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];missing=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
 page.add_init_script('''window.hapticQA={unlocked:false,blocked:0,played:0};Object.defineProperty(navigator,'vibrate',{value:()=>{if(!hapticQA.unlocked){hapticQA.blocked++;return false;}hapticQA.played++;return true;}});document.addEventListener('pointerup',()=>hapticQA.unlocked=true,{capture:true});window.reads=0;const read=CanvasRenderingContext2D.prototype.getImageData;CanvasRenderingContext2D.prototype.getImageData=function(...args){if(this.canvas.closest('.park-daily-grid'))reads++;return read.apply(this,args);};''')
 page.goto(BASE+'/circus/')
 page.wait_for_function('window.__fc?._parkHook&&!document.querySelector("#kr-boot-screen")')
 page.evaluate('__fc.ac().resume()')
 cell=page.locator('.park-daily-cell').first;box=cell.bounding_box()
 page.mouse.move(box['x']+box['width']*.2,box['y']+box['height']*.5);page.mouse.down();page.mouse.move(box['x']+box['width']*.7,box['y']+box['height']*.5,steps=5);page.mouse.up()
 assert page.evaluate('hapticQA.blocked>0&&hapticQA.played>0'),page.evaluate('hapticQA')
 page.evaluate('''()=>{reads=0;const g=document.querySelector('.park-daily-grid'),r=document.querySelectorAll('.park-daily-cell')[1].getBoundingClientRect(),pt={clientX:r.x+10,clientY:r.y+10};g.dispatchEvent(new PointerEvent('pointerdown',{...pt,pointerId:2,bubbles:true}));const e=new PointerEvent('pointermove',{...pt,pointerId:2,bubbles:true});Object.defineProperty(e,'getCoalescedEvents',{value:()=>Array.from({length:30},(_,i)=>({clientX:r.x+10+i,clientY:r.y+20}))});g.dispatchEvent(e);}''')
 page.wait_for_timeout(70);assert page.evaluate('reads<=2'),page.evaluate('reads')
 print(json.dumps({'firstHapticRecovered':page.evaluate('hapticQA'),'canvasReadsFor30Samples':page.evaluate('reads')}),flush=True)
 page.get_by_role('button',name='REVELAR',exact=True).click();page.get_by_role('button',name='PEGAR MOEDAS',exact=True).click();page.locator('.park-daily').wait_for(state='detached')
 page.evaluate('''()=>{Math.random=()=>.5;KingRicoPreviewPicker();[...document.querySelectorAll('#kr-preview-picker button')].find(b=>b.textContent.includes('Sem trinca')).click();}''')
 levels=[]
 for i in range(6):
  page.locator('[data-spin-btn]').click();page.wait_for_function(f'(__fc._parkMotionLog||[]).filter(x=>x.type==="charge:done").length>={i+1}',timeout=15000)
  page.wait_for_function('!__fc.state.spinning&&!__fc.cloudBusy()&&!__fc.state.showWin',timeout=15000)
  levels.append(page.evaluate('__fc._parkShown'))
  if i in [0,2,5]:page.screenshot(path=f'work/refined-bar-{i+1}.png')
 assert all(a<b for a,b in zip(levels,levels[1:])),levels
 assert page.evaluate('KingRicoPark.state.spins')==0
 assert not errors and not missing,(errors,missing)
 print(json.dumps({'consecutiveDeposits':levels,'errors':errors,'missing':missing}),flush=True)
 b.close()
