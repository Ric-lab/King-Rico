"""All12 active arts x9 cells, still/moving, shared effects and alpha envelope."""
import base64, json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from helpers.daily_reward import collect_daily

BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
BASELINE=os.environ.get('KING_RICO_SYMBOL_BASELINE')=='1'
PHASE='before' if BASELINE else 'after'
SPEC=json.loads(Path('ui/park/reel-symbols.json').read_text())
Path('work').mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/circus?demo=off');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
 page.wait_for_function('!__fc.cloudBusy()&&!__fc.state.balPending&&__fc.state.introLit===false&&!document.querySelector(".kr-wallet-coin")')
 if not BASELINE:
  loaded=page.evaluate('performance.getEntriesByType("resource").map(x=>x.name)')
  for source in {s['source'] for s in SPEC['symbols']}:
   assert any(url.endswith('/'+source) for url in loaded),('Art was not preloaded',source)
 page.evaluate('''async spec=>{for(const s of spec.symbols){const im=new Image;im.src='/'+s.source;await im.decode()}}''',SPEC)
 cases=[];pictures=[]
 isolated=b.new_page(viewport={"width":208,"height":248})
 isolated.set_content('<style>html,body{margin:0;background:transparent}#art{width:208px;height:248px;background-repeat:no-repeat}</style><div id="art"></div>')
 for symbol in SPEC['symbols']:
  sid=symbol['id']
  page.evaluate('''id=>new Promise(resolve=>__fc.setState({grid:Array(9).fill(id),winDim:false,winCells:[],winLines:[],winCalm:true,goldGrid:false,introLit:true,introFade:false,stopped:[],spinning:false,spinCells:[]},resolve))''',sid)
  page.wait_for_function('[...document.querySelectorAll("[data-sym]")].every(n=>getComputedStyle(n).filter==="none")')
  static=page.locator('[data-sym]').evaluate_all('''ns=>ns.map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,image:s.backgroundImage,size:s.backgroundSize,position:s.backgroundPosition,filter:s.filter,clip:s.clipPath}})''')
  assert len(static)==9 and len({(s['image'],s['size'],s['position'],s['filter']) for s in static})==1,(sid,static)
  for row in range(3):
   for s in static[row*3:row*3+3]:
    assert abs(s['width']-static[row*3]['width'])<.1 and abs(s['height']-static[row*3]['height'])<.1,(sid,row,static)
  if not BASELINE:
   isolated.locator('#art').evaluate('(n,s)=>{for(const k of ["backgroundImage","backgroundSize","backgroundPosition","clipPath"])n.style[k]=s[k]||s[{backgroundImage:"image",backgroundSize:"size",backgroundPosition:"position",clipPath:"clip"}[k]]}',static[0])
   isolated.evaluate("""async()=>{const im=new Image;im.src=getComputedStyle(document.querySelector('#art')).backgroundImage.slice(5,-2);await im.decode();return true}""")
   art_png=isolated.locator('#art').screenshot(omit_background=True)
   bounds=isolated.evaluate("""async data=>{const im=new Image;im.src='data:image/png;base64,'+data;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const a=x.getImageData(0,0,c.width,c.height).data;let l=c.width,t=c.height,r=0,b=0;for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++)if(a[(y*c.width+xx)*4+3]>100){l=Math.min(l,xx);r=Math.max(r,xx+1);t=Math.min(t,y);b=Math.max(b,y+1)}return [l,t,r,b]}""",base64.b64encode(art_png).decode())
   l,t,r,bot=bounds;vw=(r-l)/208;vh=(bot-t)/248
   assert vw<=.915 and vh<=.835,(sid,'Outside shared safe area',bounds)
   assert abs(vw-.90)<.015 or abs(vh-.82)<.015,(sid,'Unequal optical scale',bounds)
   assert abs((l+r)/2-104)<2 and abs((t+bot)/2-124)<2,(sid,'Not alpha-centered',bounds)
   x0,y0,x1,y1=symbol['bounds'];ratio=(x1-x0)/(y1-y0)
   assert abs((vw/vh)/ratio-1)<.035,(sid,'Distorted artwork',bounds,ratio)
  shot=page.locator('.park-reel-frame').screenshot()
  pictures.append((symbol['name'],shot));Path(f'work/preview-symbol-{PHASE}-{sid}.png').write_bytes(shot)
  page.evaluate('''id=>{const container=document.querySelector('.park-reels'),g=Array(9).fill(id);window.auditTapes=[0,1,2].map(c=>{const t=KingRicoReelTape.create(container,c,[c,c+3,c+6],{from:g,target:g,seed:0});t.configure(128*14);t.draw(128*14,0);return t})}''',sid)
  moving=page.locator('.park-tape-symbol[data-tape-index="-14"],.park-tape-symbol[data-tape-index="-13"],.park-tape-symbol[data-tape-index="-12"]').evaluate_all('''ns=>ns.map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,image:s.backgroundImage,size:s.backgroundSize,position:s.backgroundPosition,filter:s.filter,clip:s.clipPath}})''')
  assert len(moving)==9,(sid,moving)
  moving_shot=page.locator('.park-reel-frame').screenshot()
  Path(f'work/preview-symbol-moving-{PHASE}-{sid}.png').write_bytes(moving_shot)
  pixel_error=page.evaluate("""async frames=>{
   const read=async data=>{const im=new Image;im.src='data:image/png;base64,'+data;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return x.getImageData(0,0,c.width,c.height).data};
   const [a,b]=await Promise.all(frames.map(read));let sum=0;for(let i=0;i<a.length;i++)if(i%4!==3)sum+=Math.abs(a[i]-b[i]);return sum/(a.length/4*3);
  }""",[base64.b64encode(shot).decode(),base64.b64encode(moving_shot).decode()])
  if not BASELINE:
   assert pixel_error<1.5,(sid,'Still/moving appearance mismatch',pixel_error)
   for art in moving:
    assert all(art[k]==static[0][k] for k in ['image','size','position','filter','clip']),(sid,art,static[0])
   for col in range(3):
    for row in range(3):
     a=moving[col*3+row];s=static[row*3+col]
     assert all(abs(a[k]-s[k])<.15 for k in ['x','y','width','height']),(sid,col,row,a,s)
  page.evaluate('auditTapes.forEach(t=>t.dispose())')
  if not BASELINE:
   page.locator('.park-reel-cell').evaluate_all('ns=>ns.forEach(n=>n.setAttribute("data-held","true"))')
   held=page.locator('[data-sym]').evaluate_all('ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})')
   for a,s in zip(held,static):assert all(abs(a[k]-s[k])<.2 for k in ['x','y','width','height']),(sid,'Held symbol changed geometry',a,s)
   page.locator('.park-reel-cell').evaluate_all('ns=>ns.forEach(n=>n.setAttribute("data-held","false"))')

  page.evaluate('''()=>new Promise(resolve=>__fc.setState({winDim:true},resolve))''')
  page.wait_for_function('[...document.querySelectorAll("[data-sym]")].every(n=>getComputedStyle(n).filter.includes("brightness(0.58)"))')
  dimmed=page.locator('[data-sym]').evaluate_all('ns=>ns.map(n=>getComputedStyle(n).filter)')
  assert len(set(dimmed))==1 and 'brightness(0.58)' in dimmed[0],(sid,dimmed)
  page.evaluate('''()=>new Promise(resolve=>__fc.setState({winCells:[0,1,2,3,4,5,6,7,8],winLines:[0,1,2,3,4,5,6,7],winCalm:false},resolve))''')
  beats=page.locator('[data-sym]').evaluate_all('ns=>ns.map(n=>getComputedStyle(n).animationName)')
  expected='fcBeat' if sid in [0,2,6,7,8,10] else 'none'
  assert set(beats)=={expected},(sid,beats)  # Valid paid lines only; never invent wins for villains.
  cases.append(dict(id=sid,name=symbol['name'],positions=9,pixelError=pixel_error,static=static,moving=moving))
 assert not errors,errors
 # A review sheet of actual reel screenshots, not redrawn asset approximations.
 sheet=b.new_page(viewport={'width':1240,'height':1000},device_scale_factor=1)
 figures=''.join('<figure><figcaption>'+name+'</figcaption><img src="data:image/png;base64,'+base64.b64encode(shot).decode()+'"></figure>' for name,shot in pictures)
 sheet.set_content('<body style="margin:0;padding:16px;background:#251b31;color:#fff;font:18px sans-serif"><main style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">'+figures+'</main><style>figure{margin:0}figcaption{padding:7px}img{width:100%;display:block}</style>')
 sheet.screenshot(path=f'work/preview-symbol-sheet-{PHASE}.png',full_page=True)
 Path(f'work/preview-symbol-audit-{PHASE}.json').write_text(json.dumps(cases,ensure_ascii=False,indent=2))
 print(json.dumps({'symbols':len(cases),'positions':len(cases)*9,'stillMoving':True,'dimAndWinEffects':True,'baseline':BASELINE,'maxPixelError':max(c['pixelError'] for c in cases)}))
 b.close()
