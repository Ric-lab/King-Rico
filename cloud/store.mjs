import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import engine from './engine.cjs';

const fail = (code, message) => { throw Object.assign(new Error(message), {code}); };
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const publicPlayer = p => ({balance:p.balanceUnits/100, peaches:p.peaches, bonus:p.bonus,neckRound:p.neckRound || null,fingoRound:p.fingoRound || null,
  settings:p.settings, analyticsConsent:p.analyticsConsent, revision:p.revision});
export const dayIndex = ms => Math.floor((ms - 10800000)/86400000);

// Firebase Spark: the browser computes the lottery. Firestore transactions persist
// and deduplicate the result; Security Rules validate ownership and bounded changes.
// This is suitable for the virtual-coin prototype, not a trusted prize economy.
export function createGameStore(db, uid, dependencies={}) {
  const transact = dependencies.transact || (fn => runTransaction(db,fn));
  const reference = dependencies.reference || (path => doc(db,...path));
  const stamp = dependencies.stamp || serverTimestamp;
  const read = dependencies.read || getDoc;
  const now = dependencies.now || Date.now;
  const rng = dependencies.rng;
  const playerRef = reference(['players',uid]);
  return async data => {
    const allowed={bootstrap:['action','requestId','analyticsConsent'],spin:['action','requestId','game','bet','selected'],
      neck:['action','requestId','game','bet','move','roundId','floor'],
      fingo:['action','requestId','game','bet','move','roundId','used','selected'],
      bonus:['action','requestId'],recharge:['action','requestId'],settings:['action','requestId','settings','analyticsConsent']};
    if (!data || !allowed[data.action] || Object.keys(data).some(k=>!allowed[data.action].includes(k)) ||
      !requestIdPattern.test(data.requestId || '')) fail('king-rico/invalid-argument','Pedido inválido.');
    if (data.analyticsConsent !== undefined && typeof data.analyticsConsent !== 'boolean') fail('king-rico/invalid-argument','Preferência inválida.');
    if (data.action==='spin' && (!engine.BETS.includes(data.bet) || !['circus','wheel'].includes(data.game) ||
      (data.game==='wheel' ? !Number.isInteger(data.selected) || data.selected<0 || data.selected>11 : data.selected!==undefined)))
      fail('king-rico/invalid-argument','Aposta inválida.');
    if(data.action==='neck' && (data.game!=='neck' || !engine.BETS.includes(data.bet) || !['start','climb','collect'].includes(data.move)
      || !requestIdPattern.test(data.roundId || '') || !Number.isInteger(data.floor) || data.floor<0 || data.floor>32 || data.move==='start' && data.floor!==0))
      fail('king-rico/invalid-argument','Rodada inválida.');
    if(data.action==='fingo' && (data.game!=='fingo' || !engine.BETS.includes(data.bet) || !['roll','drop'].includes(data.move)
      || !requestIdPattern.test(data.roundId || '') || !Number.isInteger(data.used) || data.used<0 || data.used>=engine.FINGO_BALLS
      || (data.move==='drop' ? !Number.isInteger(data.selected) || data.selected<0 || data.selected>4 : data.selected!==undefined)))
      fail('king-rico/invalid-argument','Rodada inválida.');
    const settings=data.settings || {};
    if (data.action==='settings' && (typeof settings!=='object' || Array.isArray(settings) ||
      Object.entries(settings).some(([k,v])=>!Number.isInteger(v) || v<0 || v>(['sfxLvl','vibLvl'].includes(k)?2:['slotBetIdx','wheelBetIdx','neckBetIdx','fingoBetIdx'].includes(k)?9:-1))))
      fail('king-rico/invalid-argument','Ajustes inválidos.');
    const financial = ['spin','bonus','neck','fingo','recharge'].includes(data.action);
    const operationRef=financial ? reference(['players',uid,'operations',data.requestId]) : null;
    const fingerprint=JSON.stringify(Object.keys(data).sort().map(k=>[k,data[k]]));
    const execute = () => transact(async tx => {
      // Read before writing, including on SDK retries caused by another device.
      const player=await tx.get(playerRef);
      const operation=financial ? await tx.get(operationRef) : null;
      if (operation?.exists()) {
        const saved=operation.data();
        if (saved.fingerprint!==fingerprint) fail('king-rico/already-exists','Pedido já utilizado.');
        return {...saved.result,replayed:true};
      }
      const time=now(), isNew=!player.exists();
      if (isNew && data.action!=='bootstrap') fail('king-rico/failed-precondition','Conecte sua conta novamente.');
      const p=isNew ? {balanceUnits:100000,peaches:0,settings:{sfxLvl:2,vibLvl:2,slotBetIdx:3,wheelBetIdx:3,neckBetIdx:3},
        bonus:{day:null,dayIndex:-1,streak:0},analyticsConsent:data.analyticsConsent===true,
        analyticsFromCreation:data.analyticsConsent===true,createdAt:stamp(),updatedAt:stamp(),
        firstSpinAt:null,lastSpinAt:null,revision:0,lastOperationId:null} : player.data();
      let result={}, betUnits=0, winUnits=0;
      if (data.action==='bootstrap' && !isNew) return {player:publicPlayer(p),isNew:false};
      if (data.action==='spin') {
        if (p.lastSpinAt && time-p.lastSpinAt.toMillis()<700) fail('king-rico/resource-exhausted','Aguarde antes de girar.');
        betUnits=engine.units(data.bet);
        if (p.balanceUnits<betUnits) fail('king-rico/failed-precondition','Saldo insuficiente.');
        const outcome=data.game==='circus' ? engine.slot(data.bet,p.peaches,rng) : engine.wheel(data.bet,data.selected,rng);
        const before=p.balanceUnits;
        winUnits=outcome.winUnits;p.balanceUnits=before-betUnits+winUnits;
        if (data.game==='circus') p.peaches=outcome.peaches;
        p.lastSpinAt=stamp();p.firstSpinAt ||= stamp();
        p.settings[data.game==='circus'?'slotBetIdx':'wheelBetIdx']=engine.BETS.indexOf(data.bet);
        result={game:data.game,bet:data.bet,balanceBefore:before/100,balanceDebited:(before-betUnits)/100,outcome,
          baseBalance:(before-betUnits+(data.game==='circus'?engine.units(outcome.res.win):winUnits))/100};
      } else if(data.action==='neck') {
        const round=p.neckRound || null;
        if(round && (data.move==='start' || round.id!==data.roundId || round.floor!==data.floor || round.betUnits!==engine.units(data.bet)) || !round && data.move!=='start')
          fail('king-rico/round-conflict','A rodada mudou em outro aparelho.');
        if(round && data.move==='collect' && round.floor<1) fail('king-rico/invalid-argument','Prêmio indisponível.');
        if(p.lastSpinAt && time-p.lastSpinAt.toMillis()<300) fail('king-rico/resource-exhausted','Aguarde antes de jogar.');
        betUnits=round ? 0 : engine.units(data.bet);
        if(p.balanceUnits<betUnits) fail('king-rico/failed-precondition','Saldo insuficiente.');
        const outcome=engine.neck(data.bet,round,data.move,data.roundId,rng),before=p.balanceUnits;
        winUnits=outcome.winUnits;p.balanceUnits=before-betUnits+winUnits;
        p.neckRound=outcome.ended ? null : {id:data.roundId,betUnits:outcome.betUnits,floor:outcome.floor,
          peachAt:outcome.peachAt,savedUnits:outcome.savedUnits};
        p.settings.neckBetIdx=engine.BETS.indexOf(data.bet);p.lastSpinAt=stamp();p.firstSpinAt ||= stamp();
        result={game:'neck',bet:data.bet,balanceBefore:before/100,balanceDebited:(before-betUnits)/100,outcome,baseBalance:p.balanceUnits/100};
      } else if(data.action==='fingo') {
        const round=p.fingoRound || null;
        if(round ? round.id!==data.roundId || round.used!==data.used || round.betUnits!==engine.units(data.bet)
          || (data.move==='roll' ? round.slots!==null : !round.slots) : data.move!=='roll' || data.used!==0)
          fail('king-rico/round-conflict','A rodada mudou em outro aparelho.');
        if(p.lastSpinAt && time-p.lastSpinAt.toMillis()<300) fail('king-rico/resource-exhausted','Aguarde antes de jogar.');
        betUnits=round ? 0 : engine.units(data.bet);
        if(p.balanceUnits<betUnits) fail('king-rico/failed-precondition','Saldo insuficiente.');
        const outcome=engine.fingo(data.bet,round,data.move,data.roundId,data.selected,rng),before=p.balanceUnits;
        winUnits=outcome.winUnits;p.balanceUnits=before-betUnits+winUnits;
        p.fingoRound=outcome.ended ? null : {id:data.roundId,betUnits:outcome.betUnits,targets:outcome.targets,
          marks:outcome.marks,used:outcome.used,slots:data.move==='roll'?outcome.slots:null};
        p.settings.fingoBetIdx=engine.BETS.indexOf(data.bet);p.lastSpinAt=stamp();p.firstSpinAt ||= stamp();
        result={game:'fingo',bet:data.bet,balanceBefore:before/100,balanceDebited:(before-betUnits)/100,outcome,baseBalance:p.balanceUnits/100};
      } else if (data.action==='bonus') {
        const today=dayIndex(time), gap=today-p.bonus.dayIndex;
        if (gap===0) return {amount:0,player:publicPlayer(p)};
        if (gap<0) fail('king-rico/invalid-argument','Confira a data do aparelho.');
        const index=gap===1 ? p.bonus.streak%7 : 0;
        winUnits=[5000,10000,15000,20000,25000,50000,100000][index];p.balanceUnits+=winUnits;
        p.bonus={day:engine.dayKey(time),dayIndex:today,streak:index+1};
        result={amount:winUnits/100};
      } else if (data.action==='recharge') {
        if(p.neckRound) return {amount:0,reason:'neck-round',player:publicPlayer(p)};
        if(p.fingoRound) return {amount:0,reason:'fingo-round',player:publicPlayer(p)};
        if(p.balanceUnits>=engine.units(engine.BETS[0])) return {amount:0,player:publicPlayer(p)};
        winUnits=100000;p.balanceUnits+=winUnits;
        result={amount:winUnits/100};
      } else if (data.action==='settings') {
        p.settings={...p.settings,...settings};
        if (data.analyticsConsent!==undefined) p.analyticsConsent=data.analyticsConsent;
      }
      if (!isNew) p.revision++;
      p.updatedAt=stamp();
      if (financial) p.lastOperationId=data.requestId;
      result={...result,player:publicPlayer(p)};
      tx.set(playerRef,p);
      if (financial) tx.set(operationRef,{action:data.action,game:data.game || 'home',selected:data.selected ?? -1,
        fingerprint,betUnits,winUnits,result,createdAt:stamp(),rulesVersion:engine.RULES_VERSION});
      return {...result,isNew};
    });
    try { return await execute(); }
    catch(error) {
      // A simultaneous commit can make immutable-operation Rules deny a stale
      // write before the SDK retries. Recover an already committed matching ID.
      if (financial && error.code==='permission-denied') {
        let saved;
        try {saved=await read(operationRef);} catch {throw error;}
        if (saved.exists()) {
          const operation=saved.data();
          if (operation.fingerprint!==fingerprint) fail('king-rico/already-exists','Pedido já utilizado.');
          return {...operation.result,replayed:true};
        }
        // Another tab may have recharged with a different ID. Re-read in a fresh
        // transaction once; its balance guard returns a no-op after that credit.
        if(data.action==='recharge') return execute();
      }
      throw error;
    }
  };
}
