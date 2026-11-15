"""Opening tap primes feedback before the first real scratch stroke on mobile.
No autoplay bypass, evaluate() gesture, or manual resume before the first touch.
"""
import json,os
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for unlock in ['touchend','click','after-touchend']:
  c=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
  c.add_init_script('''window.firstTouch={allowed:false,cues:[],haptics:[],events:[]};''')
  c.add_init_script('''(()=>{
   const qa=firstTouch,C=window.AudioContext,desc=Object.getOwnPropertyDescriptor(C.prototype,'state')||Object.getOwnPropertyDescriptor(BaseAudioContext.prototype,'state'),resume=C.prototype.resume;
   // Fault injection: the browser rejects the early resume attempts. A later
   // trusted end/click in the SAME first gesture opens the real audio context.
   Object.defineProperty(C.prototype,'state',{get(){return qa.allowed?desc.get.call(this):'suspended';},configurable:true});
   C.prototype.resume=function(){if(qa.allowed)return resume.call(this);const denied=Promise.reject(new DOMException('Gesture not unlocked yet','NotAllowedError'));denied.catch(()=>{});return denied;};
   Object.defineProperty(navigator,'vibrate',{configurable:true,value:pattern=>{if(qa.allowed)qa.haptics.push(pattern);return qa.allowed;}});
   const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){if(qa.allowed&&this.context.state==='running'&&this.buffer?.length>2)qa.cues.push(this.buffer.length);return start.apply(this,a);};
   const timer=setInterval(()=>{const fc=window.__fc;if(!fc)return;clearInterval(timer);qa.hooked=true;},10);
  })();''')
  c.add_init_script("""for(const type of ['pointerdown','pointerup','touchend','click'])document.addEventListener(type,e=>{firstTouch.events.push(type);if(!e.isTrusted)return;if('"""+unlock+"""'==='after-touchend'&&type==='touchend')setTimeout(()=>firstTouch.allowed=true,0);else if(type==='"""+unlock+"""')firstTouch.allowed=true;},true);""")
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/circus/')
  page.locator('.park-daily-cell').first.wait_for();page.wait_for_function('window.__fc?._parkHook&&firstTouch.hooked')
  gate=page.get_by_role('button',name='TOQUE PARA RASPAR',exact=True)
  gate.wait_for();r=gate.bounding_box();cdp=c.new_cdp_session(page)
  point={'x':r['x']+r['width']/2,'y':r['y']+r['height']/2}
  if unlock=='touchend':page.screenshot(path='work/scratch-unlock-gate.png')
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[point]})
  page.wait_for_timeout(40)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  gate.wait_for(state='detached')
  page.wait_for_function('firstTouch.allowed&&__fc._ac?.state==="running"')
  assert page.evaluate("""[...document.querySelectorAll('.park-daily-cell canvas')].every(c=>{const d=c.getContext('2d').getImageData(0,0,180,180).data;for(let i=3;i<d.length;i+=4)if(d[i]!==255)return false;return true;})""")
  page.evaluate('firstTouch.cues=[];firstTouch.haptics=[]')
  r=page.locator('.park-daily-cell').first.bounding_box()
  point={'x':r['x']+r['width']*.25,'y':r['y']+r['height']*.5}
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[point]})
  for dx in [10,20,30]:cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':point['x']+dx,'y':point['y']}]})
  # The first scratch must already have sound/haptics BEFORE lifting this finger.
  result=page.evaluate('JSON.parse(JSON.stringify(firstTouch))')
  assert result['cues'] and result['haptics'],result
  assert len(result['cues'])>=2 and len(result['cues'])%2==0,result
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  assert not errors,errors
  print(json.dumps({'unlockAt':unlock,'primingTapLeavesCoatingIntact':True,'firstScratchSoundBeforeLift':True,'firstScratchHapticBeforeLift':True}),flush=True)
  c.close()
 b.close()
