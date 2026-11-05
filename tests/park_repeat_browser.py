"""Exercise real preview rounds: first confirmation, replay and automatic entry."""
import os,json
from playwright.sync_api import sync_playwright
BASE=os.environ.get('KING_RICO_TEST_URL','http://127.0.0.1:4178')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('KING_RICO_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for game,path,hook in [('clown','/clown','__clown'),('penalty','/penalty','__pen'),('flying','/flying-clown','__flying')]:
  page=b.new_page(viewport={'width':390,'height':844});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+path);page.wait_for_function('hook=>window.KingRicoCloud?.player&&window[hook]&&!document.querySelector("#kr-boot-screen")',arg=hook)
  assert page.evaluate('KingRicoCloud.uid')=='park-preview'
  page.locator('.park-panel [data-ticket]').click();page.locator('.park-modal').wait_for(state='detached')
  assert page.evaluate('KingRicoCloud.park.tickets')==3
  page.locator('[data-hud-tickets]').wait_for()
  page.wait_for_function('document.querySelector("[data-hud-tickets]").textContent==="3"')
  assert page.locator('.kr-hud-park').get_attribute('href')=='/park'
  counter=page.locator('.kr-hud-tickets')
  assert counter.bounding_box()['height']>37
  assert counter.evaluate('e=>parseFloat(getComputedStyle(e).paddingLeft)')>=16
  assert counter.evaluate('e=>parseFloat(getComputedStyle(e).gap)')>=12
  if game=='penalty':assert not page.locator('img[src="/assets/brand/covers/penalty.webp"]').count()
  results=page.evaluate('''async game=>{
   const sleep=()=>new Promise(r=>setTimeout(r,350)),out=[];
   for(let visit=0;visit<4;visit++){
    const before=KingRicoCloud.player.balance,tickets=KingRicoCloud.park.tickets,roundId=crypto.randomUUID();
    const first=()=>game==='clown'?KingRicoCloud.clown(25,roundId,0,0):game==='penalty'?KingRicoCloud.penalty('shoot',25,roundId,0,0):KingRicoCloud.flying('pop',25,roundId,0,0);
    let r=await first();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    if(document.querySelector('[data-hud-tickets]').textContent!==String(Math.max(0,tickets-1)))throw Error('Ticket HUD did not follow confirmed debit');
    const paid=KingRicoCloud.player.balance;
    const replay=await first();if(!replay.replayed)throw Error('First move must replay');
    if(KingRicoCloud.player.balance!==paid)throw Error('Replay charged twice');
    while(KingRicoCloud.player[game+'Round']){
     await sleep();const active=KingRicoCloud.player[game+'Round'];
     r=game==='clown'?await KingRicoCloud.clown(25,roundId,active.used,0):game==='penalty'?await KingRicoCloud.penalty('collect',25,roundId,active.step,0):await KingRicoCloud.flying('collect',25,roundId,active.step,-1);
    }
    if(!r.outcome.ended)throw Error('Round did not end');
    const fee=tickets>0?0:25,expected=before-fee+r.outcome.winUnits/100;
    if(Math.abs(KingRicoCloud.player.balance-expected)>.001)throw Error('Incorrect balance');
    if(KingRicoCloud.park.tickets!==Math.max(0,tickets-1))throw Error('Incorrect ticket debit');
    if(document.querySelector('.park-modal'))throw Error('Repeated entry modal');
    out.push({round:visit+1,method:tickets>0?'ticket':'coins',balance:KingRicoCloud.player.balance});await sleep();
   }
   return out;
  }''',game)
  page.screenshot(path=f'work/preview-hud-{game}.png')
  assert not errors,errors
  print(json.dumps({'game':game,'firstConfirmationOnly':True,'replaySafe':True,'rounds':results,'errors':errors}),flush=True)
  # A replay after an immediate loss may have authorized the next unused pass.
  # Refresh must preserve that authorization without consuming anything.
  has_pass=page.evaluate('game=>!!KingRicoCloud.park.passes[game]',game)
  balance=page.evaluate('KingRicoCloud.player.balance')
  page.reload();page.wait_for_function('window.KingRicoCloud?.player&&!document.querySelector("#kr-boot-screen")')
  if not has_pass:page.locator('.park-panel [data-coins]').wait_for()
  assert page.evaluate('KingRicoCloud.player.balance')==balance
  page.close()
 b.close()
