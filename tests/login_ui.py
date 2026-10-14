"""Isolated real-DOM client test with SDK stubs for a wallet outage."""
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

def check_wallet_retry(browser):
    source=(Path(__file__).parent.parent/'cloud/client-src.js').read_text()
    source=re.sub(r'^import[\s\S]*?;\s*','',source,flags=re.M)
    context=browser.new_context(viewport={'width':453,'height':802})
    page=context.new_page();errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    context.route('http://127.0.0.1:5000/login-fixture.html',lambda route:route.fulfill(
        content_type='text/html',body='<!doctype html><html><body><main id="fixture-game"><button style="min-height:44px" onclick="window.fixturePlays=(window.fixturePlays||0)+1">Jogar rodada</button></main></body></html>'))
    page.goto('http://127.0.0.1:5000/login-fixture.html')
    page.evaluate('''source=>{
      window.KING_RICO_FIREBASE={enabled:true,firebase:{projectId:'demo-king-rico'},emulators:{host:'127.0.0.1'}};
      window.fixtureAuthCalls=0;window.fixtureWalletCalls=0;window.fixturePlays=0;
      const user={uid:'fixture-remembered-account'},auth={currentUser:user};
      const initializeApp=()=>({}),getAuth=()=>auth,getFirestore=()=>({}),doc=()=>({});
      const setPersistence=async()=>{},browserLocalPersistence={};
      const connectAuthEmulator=()=>{},connectFirestoreEmulator=()=>{};
      const onAuthStateChanged=(_,callback)=>{queueMicrotask(()=>callback(user));return ()=>{};};
      const onSnapshot=()=>()=>{},publicPlayer=p=>p;
      const createTelemetry=()=>({sync(){},clear(){},track(){}});
      const forbiddenAuth=()=>{window.fixtureAuthCalls++;throw Error('Wallet retry must not request another Google login');};
      class GoogleAuthProvider {constructor(){forbiddenAuth();}static credential(){forbiddenAuth();}}
      const signInWithPopup=forbiddenAuth,signInWithRedirect=forbiddenAuth,signInWithCredential=forbiddenAuth,
            getRedirectResult=forbiddenAuth,signOut=forbiddenAuth;
      const createGameStore=()=>async data=>{
        if(data.action!=='bootstrap') throw Error('Unexpected financial mutation');
        if(++window.fixtureWalletCalls===1) throw Object.assign(new Error('Wallet unavailable'),{code:'unavailable'});
        return {isNew:false,player:{balance:1050,revision:1,peaches:0,neckRound:null,analyticsConsent:false,
          bonus:{day:null,streak:0},settings:{sfxLvl:2,vibLvl:2,slotBetIdx:3,wheelBetIdx:3,neckBetIdx:3}}};
      };
      eval(source);
    }''',source)
    page.locator('[data-cloud-retry]').wait_for(state='visible')
    assert page.locator('[data-cloud-login]').count()==0,'Wallet outage displayed a login prompt'
    assert page.locator('#fixture-game').evaluate('(el)=>el.inert'),'Unconfirmed wallet enabled the game'
    box=page.get_by_role('button',name='Jogar rodada',exact=True).bounding_box()
    page.mouse.click(box['x']+box['width']/2,box['y']+box['height']/2)
    assert page.evaluate('window.fixturePlays')==0
    page.get_by_role('button',name='Tentar novamente',exact=True).click()
    page.wait_for_function('window.KingRicoCloud.player?.balance===1050')
    page.evaluate('async()=>{await window.KingRicoCloud.ready}')
    assert page.evaluate('window.KingRicoCloud.uid')=='fixture-remembered-account'
    assert page.evaluate('window.fixtureWalletCalls')==2
    assert page.evaluate('window.fixtureAuthCalls')==0
    assert page.locator('[data-cloud-login]').count()==0
    assert page.locator('[data-cloud-loading]:visible').count()==0
    assert not page.locator('#fixture-game').evaluate('(el)=>el.inert')
    page.get_by_role('button',name='Jogar rodada',exact=True).click()
    assert page.evaluate('window.fixturePlays')==1
    assert not errors,errors
    context.close()
    return {'wallet_error_retry_ui':'passed','sdk':'stubbed','another_google_login':False}

if __name__=='__main__':
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
        print(json.dumps(check_wallet_retry(browser)))
        browser.close()
