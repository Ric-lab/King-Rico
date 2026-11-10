"""All eight paid lines remain visible and produce painted, finite coin flights."""
from helpers.daily_reward import collect_daily
from playwright.sync_api import sync_playwright
import os
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178');os.makedirs('work',exist_ok=True)
REEL_ONLY=os.environ.get('KING_RICO_REEL_ONLY')=='1'
LINES=[[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6],[0,3,6],[1,4,7],[2,5,8]]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/circus');page.wait_for_function('window.__fc?._parkHook');collect_daily(page)
 page.evaluate('''()=>{
  const fetch=window.fetch;window.fetch=async(u,o)=>{const d=o?.body&&JSON.parse(o.body);if(d?.action!=='spin'||!window.winDraws)return fetch(u,o);const draws=window.winDraws;window.winDraws=null;let i=0;const random=Math.random;Math.random=()=>draws[i++]??.99;try{return await fetch(u,o)}finally{Math.random=random}};
  window.coinQA={frames:0,painted:false,invalid:0};const create=__fc.coinCanvas.bind(__fc);__fc._cf=null;
  __fc.coinCanvas=layer=>{const renderer=create(layer),draw=renderer.draw.bind(renderer);renderer.draw=coins=>{for(const c of coins)if(![c.x,c.y,c.rad,c.ry,c.rz].every(Number.isFinite))coinQA.invalid++;draw(coins);if(coins.some(c=>c.rad>5)){coinQA.frames++;const cv=layer.querySelector('canvas[data-coin-flight]:last-child')||[...layer.querySelectorAll('canvas[data-coin-flight]')].at(-1);if(cv){const ctx=cv.getContext('2d'),d=cv.width/453;for(const c of coins){const x=Math.round(c.x*d),y=Math.round(c.y*d);if(x>=0&&y>=0&&x<cv.width&&y<cv.height&&ctx.getImageData(x,y,1,1).data[3])coinQA.painted=true;}}}};return renderer;};
  window.villainsSeen=[];new MutationObserver(records=>{for(const r of records)for(const e of r.addedNodes)if(e.nodeType===1)for(const n of [e,...e.querySelectorAll('.park-tape-symbol')]){const v=+n.dataset?.symbol;if(v>=12&&v<=14&&!villainsSeen.includes(v))villainsSeen.push(v)}}).observe(document.body,{childList:true,subtree:true});
  window.visibleVillains=[];
  const sample=()=>{for(const n of document.querySelectorAll('.park-tape-symbol')){const v=+n.dataset.symbol;if(v<12||v>14)continue;const r=n.getBoundingClientRect(),clip=n.closest('.park-physical-reel').getBoundingClientRect();if(r.bottom>clip.top+8&&r.top<clip.bottom-8&&!visibleVillains.includes(v))visibleVillains.push(v);}requestAnimationFrame(sample);};requestAnimationFrame(sample);
  __fc.setState({turbo:true});
 }''')
 weights=[3,30,20,8,12,5,4,3,2,2.4];total=sum(weights)
 for li,line in enumerate(LINES):
  page.wait_for_function('!__fc.cloudBusy()&&!__fc._parkMeterBusy&&!__fc.state.balPending')
  grid=list(range(9))
  for cell in line:grid[cell]=1
  draws=[.99]
  for symbol in grid:draws.extend([.99,(sum(weights[:symbol])+weights[symbol]/2)/total])
  draws.extend([.99,.99]);before=page.evaluate('KingRicoCloud.player.balance')
  page.evaluate('draws=>{window.winDraws=draws;coinQA={frames:0,painted:false,invalid:0};}',draws)
  page.get_by_role('button',name='Girar',exact=True).click()
  if REEL_ONLY:
   page.wait_for_function('visibleVillains.length===3',timeout=8000)
   page.screenshot(path='work/preview-villains-passing.png')
  page.wait_for_function('li=>!__fc.state.spinning&&__fc.state.winLines.includes(li)&&!__fc.state.lineGone',arg=li)
  marker=page.locator(f'[data-payline="{li}"]');marker.wait_for();page.wait_for_timeout(120)
  assert marker.evaluate('e=>{const r=e.getBoundingClientRect();e.style.pointerEvents="auto";const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);e.style.pointerEvents="none";return top===e}'),f'Line {li} is covered'
  if li in [0,5]:page.screenshot(path=f'work/preview-payout-line-{li}.png')
  page.wait_for_function('coinQA.frames>0&&coinQA.painted',timeout=8000)
  assert page.evaluate('coinQA.invalid')==0,li
  if li==5:page.screenshot(path='work/preview-payout-column-coins.png')
  page.wait_for_function('!__fc.cloudBusy()&&!__fc.state.balPending&&!__fc._cfRun',timeout=10000)
  assert abs(page.evaluate('KingRicoCloud.player.balance')-(before-10+4))<.001
  print(f'Line {li}: topmost highlight, painted finite flight and confirmed balance',flush=True)
  if REEL_ONLY:break
 assert sorted(page.evaluate('villainsSeen'))==[12,13,14]
 assert sorted(page.evaluate('visibleVillains'))==[12,13,14]
 assert not errors,errors
 b.close()
print('Eight lines, cold coin renderer and passing Tony/Tucker/Ray: PASS')
