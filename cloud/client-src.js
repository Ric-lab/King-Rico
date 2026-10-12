import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInWithCredential, getRedirectResult,
  onAuthStateChanged, signOut, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, connectFirestoreEmulator } from 'firebase/firestore';
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
      if (data.action==='bonus' && response.amount) Cloud.track?.('daily_bonus_claimed',{amount:response.amount,operationId:data.requestId});
    }
    return response;
  }
  async function mutate(payload) {
    await Cloud.ready;
    const key = `kingRico.pending.${Cloud.uid}`, pending = storage.get(key);
    const same = pending && pending.action === payload.action && pending.game === payload.game && pending.bet === payload.bet && pending.selected === payload.selected;
    if (pending && !same) {
      await call(pending); localStorage.removeItem(key);
      throw Object.assign(new Error('Recovered previous operation'), {code:'king-rico/recovered'});
    }
    const data = pending || { ...payload, requestId: id() };
    // Save before sending. A lost response/reload must retry the same transaction.
    storage.set(key, data);
    try { const result = await call(data); localStorage.removeItem(key); return result; }
    catch (error) {
      if (['king-rico/invalid-argument','king-rico/failed-precondition','king-rico/resource-exhausted','permission-denied','king-rico/already-exists'].includes(error.code)) localStorage.removeItem(key);
      throw error;
    }
  }
  Cloud.spin = (game, bet, selected) => mutate({ action:'spin', game, bet, ...(game === 'wheel' ? {selected} : {}) });
  Cloud.bonus = () => mutate({ action:'bonus' });
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
  const game = /Fortune(?:%20| )Wheel/.test(location.pathname) ? 'wheel' : /Home/.test(location.pathname) ? 'home' : 'circus';
  let sessionId = sessionStorage.getItem('kingRico.session');
  if (!sessionId) { sessionId=id(); sessionStorage.setItem('kingRico.session',sessionId); }
  Cloud.track = (name, extra={}) => {
    const screen = window.__fc?.state.homeOpen ? 'home' : game;
    telemetry.track(name,{sessionId,game:screen,...extra});
  };
  ['pointerdown','keydown'].forEach(name=>document.addEventListener(name,()=>lastInteraction=Date.now(),{passive:true}));
  setInterval(()=>{ if (!document.hidden && Date.now()-lastInteraction < 300000) Cloud.track('engagement',{seconds:30}); },30000);
  let dialog;
  function showLogin(message='Entre para salvar seu progresso') {
    if (!dialog) {
      dialog=document.createElement('div'); dialog.dataset.cloudLogin=''; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true');
      dialog.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;background:#12051fed;color:#fff3c4;font:700 20px system-ui';
      dialog.innerHTML='<div style="box-sizing:border-box;width:360px;max-width:100%;padding:26px;border-radius:24px;background:#3d0a63;border:3px solid #f0b41f"><h2 style="margin-top:0" data-cloud-heading></h2><p style="font-size:17px;line-height:1.5">Sua conta guarda saldo e progresso entre aparelhos. Contas novas recebem 1.000 moedas. O saldo anterior deste aparelho fica preservado como backup.</p><label style="display:flex;gap:12px;font-size:16px;line-height:1.5;margin:20px 0"><input type="checkbox" data-cloud-consent style="width:24px;height:24px;flex-shrink:0">Permitir dados de uso para melhorar o jogo</label><button data-cloud-google style="width:100%;min-height:54px;border:0;border-radius:16px;background:#fff3c4;color:#4a1a00;font:700 20px system-ui">Entrar com Google</button><button data-cloud-retry hidden style="width:100%;min-height:54px;margin-top:12px;font:700 18px system-ui">Tentar novamente</button></div>';
      document.body.append(dialog);
      if (config.emulators) {
        const label=document.createElement('label');
        label.style.cssText='display:block;font-size:16px;margin:12px 0';
        label.textContent='Emulador local · conta fictícia para teste';
        const input=document.createElement('input');input.dataset.cloudTestAccount='';input.value='piloto';
        input.setAttribute('aria-label','Conta fictícia de teste');input.style.cssText='display:block;width:100%;min-height:44px;margin:8px 0';
        label.append(input);dialog.querySelector('[data-cloud-google]').before(label);
        dialog.querySelector('[data-cloud-google]').textContent='Entrar com conta de teste';
      }
      dialog.querySelector('[data-cloud-google]').onclick=async()=>{
        selectedConsent=dialog.querySelector('[data-cloud-consent]').checked;
        const provider = new GoogleAuthProvider(); provider.setCustomParameters({prompt:'select_account'});
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
            try { await signInWithRedirect(auth,provider); }
            catch { showLogin('Não foi possível entrar. Tente novamente.'); }
          }
          else showLogin('Não foi possível entrar. Tente novamente.');
        }
      };
      dialog.querySelector('[data-cloud-retry]').onclick=()=>connect(auth.currentUser);
    }
    dialog.querySelector('[data-cloud-heading]').textContent=message;
    dialog.querySelector('[data-cloud-retry]').hidden=!auth.currentUser;
    dialog.querySelector('[data-cloud-google]').hidden=!!auth.currentUser;
    dialog.style.display='flex';
  }
  let unsubscribe, generation=0;
  async function connect(user) {
    const current=++generation; unsubscribe?.(); clearTimeout(settingsTimer); changes={}; telemetry.clear();
    Cloud.uid=user?.uid || null; Cloud.player=null; telemetry.sync(null,null);
    if (!user) { showLogin(); return; }
    try {
      await call({action:'bootstrap',requestId:id(),...(typeof selectedConsent==='boolean'?{analyticsConsent:selectedConsent}:{})});
      const key=`kingRico.pending.${user.uid}`, pending=storage.get(key);
      if(pending) { await call(pending); localStorage.removeItem(key); notify('Sua última jogada e seu saldo foram recuperados.'); }
      if(current!==generation) return;
      unsubscribe=onSnapshot(doc(db,'players',user.uid), snapshot=>{
        if(current!==generation || !snapshot.exists() || snapshot.metadata.hasPendingWrites) return;
        accept(publicPlayer(snapshot.data()));
      },()=>notify('Não foi possível atualizar o progresso. Verifique a conexão.'));
      dialog && (dialog.style.display='none'); resolveReady(Cloud.player);
      Cloud.track('screen_viewed');
      if(!sessionStorage.getItem(`kingRico.sessionLogged.${user.uid}`)) { Cloud.track('session_started'); sessionStorage.setItem(`kingRico.sessionLogged.${user.uid}`,'1'); }
    } catch { if(current===generation) showLogin('Não foi possível carregar seu progresso.'); }
  }
  document.addEventListener('click', async event=>{
    if(event.target.closest('[data-cloud-signout]')) {
      const g=window.__fc, w=window.__fw;
      if(g && (g.state.spinning || g.state.queued || g.state.feature || g.isCeleb()) || w?.state.spinning) { notify('Espere a jogada terminar para sair.'); return; }
      unsubscribe?.(); selectedConsent=undefined; telemetry.sync(null,null); Cloud.uid=null; Cloud.player=null;
      localStorage.removeItem(SKEY); localStorage.removeItem('fortuneCircus.home.bonus');
      await signOut(auth); showLogin();
    }
    if(event.target.closest('[data-cloud-analytics]') && Cloud.player) {
      try { await call({action:'settings',requestId:id(),analyticsConsent:!Cloud.player.analyticsConsent});
        notify(Cloud.player.analyticsConsent?'Dados de uso ativados.':'Dados de uso desativados.'); }
      catch(error) { Cloud.error(error); }
    }
  });
  setPersistence(auth,browserLocalPersistence).then(()=>config.emulators ? null : getRedirectResult(auth)).catch(()=>showLogin('Não foi possível manter sua conta conectada.'));
  onAuthStateChanged(auth,connect);
}
