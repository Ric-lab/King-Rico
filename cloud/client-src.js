import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInWithCredential, getRedirectResult,
  onAuthStateChanged, signOut, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, getDoc, runTransaction, onSnapshot, connectFirestoreEmulator } from 'firebase/firestore';
import { createGameStore, publicPlayer } from './store.mjs';
import { createTelemetry } from './telemetry.mjs';

const config = window.KING_RICO_FIREBASE || { enabled: false };
const watchers = new Set(), SKEY = 'fortuneCircus.slot.v3';
let resolveReady, selectedConsent, lastInteraction = Date.now();
const Cloud = window.KingRicoCloud = {
  enabled: config.enabled === true, player: null, uid: null,
  ready: new Promise(resolve => { resolveReady = resolve; }),
  watch(handler) { watchers.add(handler); if (Cloud.player) handler(Cloud.player); return () => watchers.delete(handler); },
  dayKey() {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo', year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    return Number(['year','month','day'].map(key => parts.find(p => p.type === key).value).join(''));
  }
};
const id = () => crypto.randomUUID();
const storage = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};
function accept(player) {
  if (!player || !Cloud.uid) return;
  if (Cloud.player && player.revision < Cloud.player.revision) return;
  Cloud.player = player;
  Cloud.syncTelemetry?.(player);
  const old = localStorage.getItem(SKEY);
  if (old && !localStorage.getItem('kingRico.legacyBackup')) localStorage.setItem('kingRico.legacyBackup', old);
  storage.set(`kingRico.cloud.${Cloud.uid}`, player);
  storage.set(SKEY, { balance: player.balance, peaches: player.peaches, betIdx: player.settings.slotBetIdx,
    sfxLvl: player.settings.sfxLvl, vibLvl: player.settings.vibLvl,
    sound: player.settings.sfxLvl > 0, vibrate: player.settings.vibLvl > 0 });
  storage.set('fortuneCircus.wheel.v2', { betIdx: player.settings.wheelBetIdx });
  storage.set('fortuneCircus.neck.v1', { betIdx: player.settings.neckBetIdx ?? 3 });
  storage.set('fortuneCircus.home.bonus', { d: player.bonus.day ? Number(player.bonus.day.replaceAll('-','')) : 0, s: player.bonus.streak });
  watchers.forEach(handler => handler(player));
}
let noticeTimer;
function notify(message) {
  let el = document.querySelector('[data-cloud-notice]');
  if (!el) { el = document.createElement('div'); el.dataset.cloudNotice = ''; el.setAttribute('role','status');
    el.style.cssText='position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:2147483646;max-width:85vw;padding:14px 18px;border-radius:16px;background:#fff3c4;color:#4a1a00;font:700 18px system-ui;box-shadow:0 4px 20px #0008'; document.body.append(el); }
  el.textContent=message; el.hidden=false; clearTimeout(noticeTimer); noticeTimer=setTimeout(()=>el.hidden=true,6000);
}
Cloud.error = error => {
  const code = error?.code || '';
  Cloud.track?.('client_error', {errorCode: code.includes('auth') ? 'auth' : code.includes('network') ? 'network' : 'service'});
  notify(code.includes('failed-precondition') ? 'Saldo insuficiente ou conta desconectada.' :
    code.includes('resource-exhausted') ? 'Aguarde um instante e tente novamente.' :
    code.includes('recovered') ? 'Jogada anterior recuperada. Você já pode jogar novamente.' :
    code.includes('round-conflict') ? 'A rodada mudou em outro aparelho. Atualizando seu progresso.' :
    'Não foi possível confirmar. Verifique a conexão e tente novamente.');
};
if (!Cloud.enabled) resolveReady(null);
else {
  const app = initializeApp(config.firebase), auth = getAuth(app), db = getFirestore(app);
  // Emulators are an explicit build setting, never selected by a public URL parameter.
  if (config.emulators) {
    connectAuthEmulator(auth, `http://${config.emulators.host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, config.emulators.host, 8085);
  }
  const telemetry = createTelemetry(app,config);
  Cloud.syncTelemetry = player => telemetry.sync(player,Cloud.uid);
  Cloud.clearTelemetry = () => telemetry.clear();
  async function call(data) {
    const uid = auth.currentUser?.uid;
    if (!uid || uid !== Cloud.uid) throw Object.assign(new Error('Disconnected'),{code:'auth/disconnected'});
    const response = await createGameStore(db,uid)(data);
    if (auth.currentUser?.uid !== uid) throw Object.assign(new Error('Account changed'),{code:'auth/changed'});
    accept(response.player);
    if (!response.replayed) {
      if (response.isNew) Cloud.track?.('account_created');
      if (data.action==='spin') Cloud.track?.('spin_settled',{game:data.game,bet:data.bet,payout:response.outcome.winUnits/100,
        specialRound:!!response.outcome.feature,operationId:data.requestId});
      if(data.action==='neck') {
        Cloud.track?.('neck_step',{game:'neck',floor:response.outcome.floor,move:data.move,success:response.outcome.ok,operationId:data.requestId});
        if(response.outcome.ended) Cloud.track?.('spin_settled',{game:'neck',bet:data.bet,payout:response.outcome.winUnits/100,
          specialRound:response.outcome.savedUnits>0,operationId:data.roundId});
      }
      if(data.action==='fingo') {
        Cloud.track?.('fingo_step',{game:'fingo',move:data.move,ballsUsed:response.outcome.used,
          success:response.outcome.cardVersion>=1 ? response.outcome.mark>=0 : response.outcome.bin>=0 && response.outcome.slots[response.outcome.bin]===response.outcome.targets[response.outcome.bin],operationId:data.requestId});
        if(response.outcome.ended) Cloud.track?.('spin_settled',{game:'fingo',bet:data.bet,payout:response.outcome.winUnits/100,
          specialRound:false,operationId:data.roundId});
      }
      if(['bridge','penalty','clown','flying','twentyOne','claw','race'].includes(data.action) && response.outcome.ended)
        Cloud.track?.('spin_settled',{game:data.game,bet:data.bet,payout:response.outcome.winUnits/100,
          specialRound:false,operationId:data.roundId});
      if (data.action==='bonus' && response.amount) Cloud.track?.('daily_bonus_claimed',{amount:response.amount,operationId:data.requestId});
    }
    return response;
  }
  async function mutate(payload) {
    await Cloud.ready;
    const key = `kingRico.pending.${Cloud.uid}`, pending = storage.get(key);
    const same = pending && pending.action === payload.action && pending.game === payload.game && pending.bet === payload.bet && pending.selected === payload.selected
      && pending.move===payload.move && pending.roundId===payload.roundId && pending.floor===payload.floor && pending.used===payload.used
      && pending.n===payload.n && pending.gold===payload.gold && pending.step===payload.step && pending.quality===payload.quality && pending.turn===payload.turn && pending.target===payload.target && pending.aimX===payload.aimX && pending.aimZ===payload.aimZ && pending.seed===payload.seed && pending.version===payload.version && pending.selected2===payload.selected2 && pending.source===payload.source;
    if (pending && !same) {
      await call(pending); localStorage.removeItem(key);
      throw Object.assign(new Error('Recovered previous operation'), {code:'king-rico/recovered'});
    }
    const data = pending || { ...payload, requestId: (payload.action==='bridge' && payload.move==='start' || payload.action==='penalty' && payload.step===0 || payload.action==='clown' && payload.used===0 || payload.action==='bounce' && payload.move==='start' || payload.action==='flying' && payload.step===0 || payload.action==='twentyOne' && payload.move==='start' || payload.action==='claw' || payload.action==='race') ? payload.roundId : id() };
    // Save before sending. A lost response/reload must retry the same transaction.
    storage.set(key, data);
    try { const result = await call(data); localStorage.removeItem(key); return result; }
    catch (error) {
      if (['king-rico/invalid-argument','king-rico/failed-precondition','king-rico/resource-exhausted','king-rico/round-conflict','king-rico/daily-limit','permission-denied','king-rico/already-exists'].includes(error.code)) localStorage.removeItem(key);
      throw error;
    }
  }
  Cloud.spin = (game, bet, selected) => mutate({ action:'spin', game, bet, ...(game === 'wheel' ? {selected} : {}) });
  Cloud.bridge = (move,bet,roundId,step,selected=-1) => mutate({action:'bridge',game:'bridge',move,bet,roundId,step,selected});
  Cloud.neck = (move,bet,roundId,floor) => mutate({action:'neck',game:'neck',move,bet,roundId,floor});
  Cloud.fingo = (move,bet,roundId,used,selected) => mutate({action:'fingo',game:'fingo',move,bet,roundId,used,...(move==='drop'?{selected}:{})});
  Cloud.bounce = (move,bet,roundId,n,gold=false) => mutate({action:'bounce',game:'bounce',move,bet,roundId,n,gold});
  Cloud.clown = (bet,roundId,used,selected) => mutate({action:'clown',game:'clown',bet,roundId,used,selected});
  Cloud.penalty = (move,bet,roundId,step,quality=0) => mutate({action:'penalty',game:'penalty',move,bet,roundId,step,quality});
  Cloud.flying = (move,bet,roundId,step,selected=-1) => mutate({action:'flying',game:'flying',move,bet,roundId,step,selected});
  Cloud.race = (bet,selected,seed,roundId,version=1,selected2=-1) => mutate({action:'race',game:'race',bet,selected,seed,roundId,...(version>=2?{version}:{}),...(version===4?{selected2}:{})});
  Cloud.raceResult = async roundId => {await Cloud.ready;return runTransaction(db,async transaction=>{const saved=await transaction.get(doc(db,'players',Cloud.uid,'operations',roundId));return saved.exists()&&saved.data().action==='race'?saved.data().result:null;});};
  Cloud.claw = (bet,selected,aimX,aimZ,seed,roundId) => mutate({action:'claw',game:'claw',bet,selected,aimX,aimZ,seed,roundId});
  Cloud.clawResult = async roundId => {await Cloud.ready;const saved=await getDoc(doc(db,'players',Cloud.uid,'operations',roundId));return saved.exists()&&saved.data().action==='claw'?saved.data().result:null;};
  Cloud.twentyOne = (move,bet,roundId,turn,target) => mutate({action:'twentyOne',game:'twentyOne',move,bet,roundId,turn,...(target===undefined?{}:{target})});
  Cloud.bonus = () => mutate({ action:'bonus' });
  Cloud.recharge = source => mutate({ action:'recharge',...(source==='home'?{source:'home'}:{}) });
  let settingsTimer, changes = {};
  Cloud.settings = settings => {
    const owner = Cloud.uid;
    if (!owner) return;
    settings = Object.fromEntries(Object.entries(settings).filter(([key,value]) => value !== Cloud.player?.settings[key]));
    if (!Object.keys(settings).length) return;
    changes = { ...changes, ...settings }; clearTimeout(settingsTimer);
    settingsTimer = setTimeout(async () => {
      const next = changes; changes = {};
      if (Cloud.uid !== owner) return;
      try { await Cloud.ready; await call({action:'settings',requestId:id(),settings:next}); }
      catch (error) { Cloud.error(error); }
    }, 400);
  };
  const game = document.querySelector('meta[name="king-rico-game"]')?.content || (/Fortune(?:%20| )Race/.test(location.pathname) ? 'race' : /Fortune(?:%20| )Claw/.test(location.pathname) ? 'claw' : /Fortune(?:%20| )(?:21|33)/.test(location.pathname) ? 'twentyOne' : /Fortune(?:%20| )Flying/.test(location.pathname) ? 'flying' : /Fortune(?:%20| )Bounce/.test(location.pathname) ? 'bounce' : /Fortune(?:%20| )Clown/.test(location.pathname) ? 'clown' : /Fortune(?:%20| )Penalty/.test(location.pathname) ? 'penalty' : /Fortune(?:%20| )Fingo/.test(location.pathname) ? 'fingo' : /Fortune(?:%20| )Neck/.test(location.pathname) ? 'neck' : /Fortune(?:%20| )Wheel/.test(location.pathname) ? 'wheel' : /Home/.test(location.pathname) ? 'home' : 'circus');
  let sessionId = sessionStorage.getItem('kingRico.session');
  if (!sessionId) { sessionId=id(); sessionStorage.setItem('kingRico.session',sessionId); }
  Cloud.track = (name, extra={}) => {
    const screen = window.__fc?.state.homeOpen ? 'home' : game;
    telemetry.track(name,{sessionId,game:screen,...extra});
  };
  ['pointerdown','keydown'].forEach(name=>document.addEventListener(name,()=>lastInteraction=Date.now(),{passive:true}));
  setInterval(()=>{ if (!document.hidden && Date.now()-lastInteraction < 300000) Cloud.track('engagement',{seconds:30}); },30000);
  let dialog, loginBusy=false, persistentLogin=true;
  let loading, loadingTimer, gameplayObserver;
  const gatedElements=new Map();
  function gateGameplay(blocked) {
    if(!blocked) {
      gameplayObserver?.disconnect(); gameplayObserver=null;
      for(const [element,previous] of gatedElements) element.inert=previous;
      gatedElements.clear(); return;
    }
    const apply=()=>{
      for(const element of document.body.children) {
        if(element.matches('script,style,#kr-boot-screen,[data-cloud-login],[data-cloud-loading],[data-cloud-notice]')) continue;
        if(!gatedElements.has(element)) {gatedElements.set(element,element.inert);element.inert=true;}
      }
    };
    apply();
    if(!gameplayObserver) {gameplayObserver=new MutationObserver(apply);gameplayObserver.observe(document.body,{childList:true});}
  }
  function stopLoading() {
    clearTimeout(loadingTimer);
    if(loading) loading.hidden=true;
  }
  function startLoading(message) {
    gateGameplay(true); stopLoading();
    if(dialog) dialog.style.display='none';
    if(!loading) {
      loading=document.createElement('div'); loading.dataset.cloudLoading=''; loading.hidden=true;
      loading.style.cssText='position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483646;box-sizing:border-box;width:max-content;max-width:calc(100vw - 32px);padding:12px 16px;border-radius:16px;background:#3d0a63;color:#fff3c4;font:700 16px system-ui;text-align:center;box-shadow:0 4px 20px #0008';
      const messageElement=document.createElement('span');messageElement.dataset.cloudLoadingMessage='';messageElement.setAttribute('role','status');messageElement.style.display='block';
      const retry=document.createElement('button');retry.type='button';retry.dataset.cloudRetry='';retry.textContent='Tentar novamente';retry.hidden=true;
      retry.style.cssText='min-height:44px;margin:12px auto 0;padding:10px 16px;border:0;border-radius:12px;background:#fff3c4;color:#4a1a00;font:700 17px system-ui;cursor:pointer';
      retry.onclick=()=>auth.currentUser ? connect(auth.currentUser) : restoreLogin();
      loading.append(messageElement,retry);document.body.append(loading);
    }
    loading.querySelector('[data-cloud-loading-message]').textContent=message;
    loading.querySelector('[data-cloud-retry]').hidden=true;
    // Fast restores do not flash any loading UI. Never infer authentication
    // from a local flag or cached wallet; only Firebase decides the identity.
    loadingTimer=setTimeout(()=>loading.hidden=false,250);
  }
  function showWalletRetry() {
    startLoading('Não foi possível carregar seu saldo. Confira a conexão e tente novamente.');
    clearTimeout(loadingTimer);loading.hidden=false;
    loading.querySelector('[data-cloud-retry]').hidden=false;
  }
  const redirectKey='kingRico.googleRedirect';
  function refreshLogin() {
    if(!dialog) return;
    const button=dialog.querySelector('[data-cloud-google]');
    button.disabled=loginBusy;
    button.setAttribute('aria-busy',String(loginBusy));
    button.style.opacity=button.disabled ? '.75' : '1';
    button.textContent=loginBusy ? 'Entrando…' : auth.currentUser
      ? 'Tentar novamente' : config.emulators ? 'Entrar com conta de teste' : 'Jogar';
    dialog.querySelector('[data-cloud-preferences]').hidden=!!auth.currentUser;
    dialog.querySelector('[data-cloud-preferences]').inert=loginBusy;
    const testAccount=dialog.querySelector('[data-cloud-test-label]');
    if(testAccount) testAccount.hidden=!!auth.currentUser;
    dialog.querySelector('[data-cloud-login-note]').textContent=persistentLogin
      ? 'Depois, é só abrir o jogo neste navegador.' : 'Neste navegador, pode ser preciso entrar novamente ao reabrir.';
  }
  function showLogin(message='Vamos jogar?') {
    stopLoading();gateGameplay(true);
    if (!dialog) {
      dialog=document.createElement('div'); dialog.dataset.cloudLogin=''; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true');
      dialog.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;background:#12051fed;color:#fff3c4;font:700 20px system-ui';
      dialog.innerHTML='<div style="box-sizing:border-box;width:380px;max-width:100%;padding:28px 24px;border-radius:24px;background:#3d0a63;border:3px solid #f0b41f;text-align:center"><p style="margin:0 0 16px;color:#f0b41f;font-size:22px">KING RICO</p><h2 style="margin:0 0 14px;font-size:28px" data-cloud-heading></h2><p style="font-size:19px;line-height:1.5;margin:0 0 24px">Toque no botão para começar.<br>Suas moedas ficam guardadas.</p><button type="button" data-cloud-google style="width:100%;min-height:68px;padding:14px;border:0;border-radius:18px;background:#fff3c4;color:#4a1a00;font:700 24px system-ui;cursor:pointer">Jogar</button><p data-cloud-login-note style="font-size:16px;line-height:1.5;margin:18px 0"></p><details data-cloud-preferences style="text-align:left;font-size:16px;line-height:1.5"><summary style="min-height:44px;cursor:pointer;text-align:center">Dados de uso (opcional)</summary><label style="display:flex;gap:12px;margin-top:12px"><input type="checkbox" data-cloud-consent style="width:24px;height:24px;flex-shrink:0">Permitir dados de uso para melhorar o jogo</label></details></div>';
      document.body.append(dialog);
      if (config.emulators) {
        const label=document.createElement('label');
        label.dataset.cloudTestLabel='';
        label.style.cssText='display:block;font-size:16px;margin:12px 0';
        label.textContent='Emulador local · conta fictícia para teste';
        const input=document.createElement('input');input.dataset.cloudTestAccount='';input.value='piloto';
        input.setAttribute('aria-label','Conta fictícia de teste');input.style.cssText='display:block;width:100%;min-height:44px;margin:8px 0';
        label.append(input);dialog.querySelector('[data-cloud-google]').before(label);
        dialog.querySelector('[data-cloud-google]').textContent='Entrar com conta de teste';
      }
      dialog.querySelector('[data-cloud-google]').onclick=async()=>{
        if(loginBusy) return;
        loginBusy=true;refreshLogin();
        if(auth.currentUser) {
          try { await connect(auth.currentUser); }
          finally { loginBusy=false;refreshLogin(); }
          return;
        }
        selectedConsent=dialog.querySelector('[data-cloud-consent]').checked;
        const provider = new GoogleAuthProvider();
        try {
          if (config.emulators) {
            // Auth Emulator supports JSON Google ID tokens. This branch is only in an explicit demo build.
            const name=dialog.querySelector('[data-cloud-test-account]').value.trim();
            if(!/^[a-zA-Z0-9_-]{1,40}$/.test(name)) { showLogin('Escolha um nome simples para a conta de teste.'); return; }
            await signInWithCredential(auth,GoogleAuthProvider.credential(JSON.stringify({sub:name,email:`${name}@example.test`,email_verified:true})));
          } else await signInWithPopup(auth,provider);
        }
        catch(error) {
          Cloud.lastAuthError = error.code || 'auth/unknown';
          if (error.code==='auth/popup-blocked') {
            try {
              sessionStorage.setItem(redirectKey,'1');
              await signInWithRedirect(auth,provider);
            }
            catch { sessionStorage.removeItem(redirectKey);showLogin('Toque no botão para tentar entrar novamente.'); }
          }
          else showLogin(error.code==='auth/popup-closed-by-user'
            ? 'Toque no botão e escolha sua conta Google.' : 'Não foi possível entrar. Toque para tentar novamente.');
        }
        finally { loginBusy=false;refreshLogin(); }
      };
    }
    dialog.querySelector('[data-cloud-heading]').textContent=message;
    refreshLogin();
    dialog.style.display='flex';
  }
  let unsubscribe, generation=0;
  async function connect(user) {
    const current=++generation; unsubscribe?.(); clearTimeout(settingsTimer); changes={}; telemetry.clear();
    Cloud.uid=user?.uid || null; Cloud.player=null; telemetry.sync(null,null);
    if (!user) { showLogin(); return; }
    startLoading('Carregando seu saldo…');
    try {
      await call({action:'bootstrap',requestId:id(),...(typeof selectedConsent==='boolean'?{analyticsConsent:selectedConsent}:{})});
      const key=`kingRico.pending.${user.uid}`, pending=storage.get(key);
      if(pending) {
        try { await call(pending); notify('Sua última jogada e seu saldo foram recuperados.'); }
        catch(error) {
          if(!['king-rico/round-conflict','king-rico/already-exists','king-rico/invalid-argument','king-rico/failed-precondition','king-rico/daily-limit'].includes(error.code))throw error;
          notify('Sua rodada foi atualizada em outro aparelho. O saldo atual foi recuperado.');
        }
        localStorage.removeItem(key);
      }
      if(current!==generation) return;
      unsubscribe=onSnapshot(doc(db,'players',user.uid), snapshot=>{
        if(current!==generation || !snapshot.exists() || snapshot.metadata.hasPendingWrites) return;
        accept(publicPlayer(snapshot.data()));
      },()=>notify('Não foi possível atualizar o progresso. Verifique a conexão.'));
      selectedConsent=undefined;
      stopLoading();gateGameplay(false);
      dialog && (dialog.style.display='none'); resolveReady(Cloud.player);
      Cloud.track('screen_viewed');
      if(!sessionStorage.getItem(`kingRico.sessionLogged.${user.uid}`)) { Cloud.track('session_started'); sessionStorage.setItem(`kingRico.sessionLogged.${user.uid}`,'1'); }
    } catch { if(current===generation) showWalletRetry(); }
  }
  document.addEventListener('click', async event=>{
    if(event.target.closest('[data-cloud-signout]')) {
      const g=window.__fc, w=window.__fw, n=window.__fn, f=window.__fg, p=window.__pen;
      if(g && (g.state.spinning || g.state.queued || g.state.feature || g.isCeleb()) || w?.state.spinning || n?.state.busy || n?._cloudRequest || f?._cloudRequest || f?.state.phase==='falling' || f?.state.phase==='rolling' || p?.cloudLocked() || window.__flying?._request || window.__flying?.state.busy || window.KingRico21?.isBusy() || window.KingRicoClaw?.isBusy() || window.KingRicoRace?.isBusy() || window.__bridge?.state.busy) { notify('Espere a jogada terminar para sair.'); return; }
      unsubscribe?.(); selectedConsent=undefined; telemetry.sync(null,null); Cloud.uid=null; Cloud.player=null;
      if(dialog) {
        dialog.querySelector('[data-cloud-consent]').checked=false;
        dialog.querySelector('[data-cloud-preferences]').open=false;
      }
      localStorage.removeItem(SKEY); localStorage.removeItem('fortuneCircus.home.bonus');
      await signOut(auth); showLogin();
    }
    if(event.target.closest('[data-cloud-analytics]') && Cloud.player) {
      try { await call({action:'settings',requestId:id(),analyticsConsent:!Cloud.player.analyticsConsent});
        notify(Cloud.player.analyticsConsent?'Dados de uso ativados.':'Dados de uso desativados.'); }
      catch(error) { Cloud.error(error); }
    }
  });
  async function restoreLogin() {
    startLoading('Abrindo seu jogo…');
    try { await setPersistence(auth,browserLocalPersistence); }
    catch { persistentLogin=false; }
    // Only finish a redirect initiated by this tab. An unrelated redirect
    // check must not replace an already restored account with an error screen.
    if(!config.emulators && sessionStorage.getItem(redirectKey)==='1') {
      try { await getRedirectResult(auth); }
      catch(error) { Cloud.lastAuthError=error.code || 'auth/unknown'; }
      finally { sessionStorage.removeItem(redirectKey); }
    }
    onAuthStateChanged(auth,connect);
  }
  restoreLogin().catch(()=>showLogin('Não foi possível abrir sua conta. Toque para tentar novamente.'));
}
