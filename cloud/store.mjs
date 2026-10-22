import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import engine from './engine.cjs';

const fail = (code, message) => { throw Object.assign(new Error(message), {code}); };
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const publicPlayer = p => ({balance:p.balanceUnits/100, peaches:p.peaches, bonus:p.bonus,neckRound:p.neckRound || null,fingoRound:p.fingoRound || null,penaltyRound:p.penaltyRound || null,clownRound:p.clownRound || null,bounceRound:p.bounceRound || null,flyingRound:p.flyingRound || null,twentyOneRound:p.twentyOneRound || null,
  settings:p.settings, analyticsConsent:p.analyticsConsent, revision:p.revision,...(p.rechargeCount===undefined?{}:{rechargeCount:p.rechargeCount}),...(p.rechargeDaily===undefined?{}:{rechargeDaily:p.rechargeDaily})});
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
      bounce:['action','requestId','game','bet','roundId','n','move','gold'],
      clown:['action','requestId','game','bet','roundId','used','selected'],
      penalty:['action','requestId','game','bet','move','roundId','step','quality'],
      flying:['action','requestId','game','bet','move','roundId','step','selected'],
      race:['action','requestId','game','bet','roundId','selected','seed','version','selected2'],
      claw:['action','requestId','game','bet','roundId','selected','aimX','aimZ','seed'],
      twentyOne:['action','requestId','game','bet','move','roundId','turn','target'],
      bonus:['action','requestId'],recharge:['action','requestId','source'],settings:['action','requestId','settings','analyticsConsent']};
    if (!data || !allowed[data.action] || Object.keys(data).some(k=>!allowed[data.action].includes(k)) ||
      !requestIdPattern.test(data.requestId || '')) fail('king-rico/invalid-argument','Pedido inválido.');
    if(data.action==='recharge' && data.source!==undefined && data.source!=='home')fail('king-rico/invalid-argument','Origem de recarga inválida.');
    if (data.analyticsConsent !== undefined && typeof data.analyticsConsent !== 'boolean') fail('king-rico/invalid-argument','Preferência inválida.');
    if (data.action==='spin' && (!engine.BETS.includes(data.bet) || !['circus','wheel'].includes(data.game) ||
      (data.game==='wheel' ? !Number.isInteger(data.selected) || data.selected<0 || data.selected>12 : data.selected!==undefined)))
      fail('king-rico/invalid-argument','Aposta inválida.');
    if(data.action==='neck' && (data.game!=='neck' || !engine.BETS.includes(data.bet) || !['start','climb','collect'].includes(data.move)
      || !requestIdPattern.test(data.roundId || '') || !Number.isInteger(data.floor) || data.floor<0 || data.floor>32 || data.move==='start' && data.floor!==0))
      fail('king-rico/invalid-argument','Rodada inválida.');
    if(data.action==='fingo' && (data.game!=='fingo' || !engine.BETS.includes(data.bet) || !['roll','drop'].includes(data.move)
      || !requestIdPattern.test(data.roundId || '') || !Number.isInteger(data.used) || data.used<0 || data.used>=engine.FINGO_BALLS
      || (data.move==='drop' ? !Number.isInteger(data.selected) || data.selected<0 || data.selected>4 : data.selected!==undefined)))
      fail('king-rico/invalid-argument','Rodada inválida.');
    if(data.action==='penalty' && (data.game!=='penalty' || !engine.BETS.includes(data.bet) || !['shoot','collect'].includes(data.move)
      || !requestIdPattern.test(data.roundId || '') || !Number.isInteger(data.step) || data.step<0 || data.step>4
      || !Number.isInteger(data.quality) || data.quality<0 || data.quality>1000
      || data.move==='collect' && (data.step===0 || data.quality!==0)
      || data.step===0 && data.requestId!==data.roundId))
      fail('king-rico/invalid-argument','Rodada inválida.');
    if(data.action==='clown' && (data.game!=='clown' || !engine.BETS.includes(data.bet)
      || !requestIdPattern.test(data.roundId || '') || !Number.isInteger(data.used) || data.used<0 || data.used>=engine.CLOWN_BALLS
      || !Number.isInteger(data.selected) || data.selected< -1 || data.selected>5 || data.used===0 && data.requestId!==data.roundId))
      fail('king-rico/invalid-argument','Lançamento inválido.');
    if(data.action==='bounce' && (data.game!=='bounce' || !engine.BETS.includes(data.bet) || !requestIdPattern.test(data.roundId || '')
      || !['start','land','fall','collect'].includes(data.move) || !Number.isInteger(data.n) || data.n<0 || data.n>=10000 || typeof data.gold!=='boolean'
      || data.move!=='land' && data.gold || data.move==='start' && (data.n!==0 || data.requestId!==data.roundId))) fail('king-rico/invalid-argument','Salto inválido.');
    if(data.action==='flying' && (data.game!=='flying' || !engine.BETS.includes(data.bet) || !['pop','collect'].includes(data.move)
      || !requestIdPattern.test(data.roundId || '') || !Number.isInteger(data.step) || data.step<0 || data.step>9
      || !Number.isInteger(data.selected) || (data.move==='collect' ? data.selected!==-1 || data.step===0 : data.selected<0 || data.selected>9)
      || data.step===0 && data.requestId!==data.roundId)) fail('king-rico/invalid-argument','Balão inválido.');
    if(data.action==='twentyOne' && (data.target!==undefined && ![21,33].includes(data.target) || data.game!=='twentyOne' || !engine.BETS.includes(data.bet) || !['start','hit','stand','dealer'].includes(data.move)
      || !requestIdPattern.test(data.roundId || '') || !Number.isInteger(data.turn) || data.turn<0 || data.turn>52
      || data.move==='start' && (data.turn!==0 || data.requestId!==data.roundId))) fail('king-rico/invalid-argument','Mão inválida.');
    if(data.action==='claw' && (data.game!=='claw' || !engine.BETS.includes(data.bet) || !requestIdPattern.test(data.roundId || '') || data.requestId!==data.roundId
      || !Number.isInteger(data.selected) || data.selected<0 || data.selected>8 || !Number.isInteger(data.seed) || data.seed<0 || data.seed>8
      || !Number.isInteger(data.aimX) || data.aimX<0 || data.aimX>1000 || !Number.isInteger(data.aimZ) || data.aimZ<0 || data.aimZ>1000)) fail('king-rico/invalid-argument','Mira inválida.');
    if(data.action==='race' && (data.version!==undefined && ![1,2,3,4].includes(data.version) || data.game!=='race' || !engine.BETS.includes(data.bet) || !requestIdPattern.test(data.roundId || '') || data.requestId!==data.roundId
      || !Number.isInteger(data.selected) || data.selected<0 || data.selected>(data.version>=2?4:3) || !Number.isInteger(data.seed) || data.seed<0 || data.seed>(data.version===4?639:data.version===3?159:data.version===2?65534:65535)
      || (data.version===4 ? !Number.isInteger(data.selected2) || data.selected2< -1 || data.selected2>4 || data.selected2===data.selected : data.selected2!==undefined))) fail('king-rico/invalid-argument','Corrida inválida.');
    const settings=data.settings || {};
    if (data.action==='settings' && (typeof settings!=='object' || Array.isArray(settings) ||
      Object.entries(settings).some(([k,v])=>!Number.isInteger(v) || v<0 || v>(['sfxLvl','vibLvl'].includes(k)?2:['slotBetIdx','wheelBetIdx','neckBetIdx','fingoBetIdx','penaltyBetIdx','clownBetIdx','bounceBetIdx','flyingBetIdx','twentyOneBetIdx','clawBetIdx','raceBetIdx'].includes(k)?9:-1))))
      fail('king-rico/invalid-argument','Ajustes inválidos.');
    const financial = ['spin','bonus','neck','fingo','penalty','clown','bounce','flying','twentyOne','claw','race','recharge'].includes(data.action);
    const operationRef=financial ? reference(['players',uid,'operations',data.requestId]) : null;
    const fingerprint=JSON.stringify(Object.keys(data).sort().map(k=>[k,data[k]]));
    const execute = () => transact(async tx => {
      // Read before writing, including on SDK retries caused by another device.
      const player=await tx.get(playerRef);
      const operation=financial ? await tx.get(operationRef) : null;
      if (operation?.exists()) {
        const saved=operation.data();
        if (saved.fingerprint!==fingerprint) fail('king-rico/already-exists','Pedido já utilizado.');
        return {...saved.result,player:publicPlayer(player.data()),replayed:true};
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
      } else if(data.action==='penalty') {
        const round=p.penaltyRound || null;
        if(round ? round.id!==data.roundId || round.step!==data.step || round.betUnits!==engine.units(data.bet)
          : data.move!=='shoot' || data.step!==0)
          fail('king-rico/round-conflict','A rodada mudou em outro aparelho.');
        if(p.lastSpinAt && time-p.lastSpinAt.toMillis()<300) fail('king-rico/resource-exhausted','Aguarde antes de jogar.');
        betUnits=round ? 0 : engine.units(data.bet);
        if(p.balanceUnits<betUnits) fail('king-rico/failed-precondition','Saldo insuficiente.');
        const outcome=engine.penalty(data.bet,round,data.move,data.roundId,data.quality,rng),before=p.balanceUnits;
        winUnits=outcome.winUnits;p.balanceUnits=before-betUnits+winUnits;
        p.penaltyRound=outcome.ended ? null : {id:data.roundId,betUnits:outcome.betUnits,step:outcome.step};
        p.settings.penaltyBetIdx=engine.BETS.indexOf(data.bet);p.lastSpinAt=stamp();p.firstSpinAt ||= stamp();
        result={game:'penalty',bet:data.bet,balanceBefore:before/100,balanceDebited:(before-betUnits)/100,outcome,baseBalance:p.balanceUnits/100};
      } else if(data.action==='bounce') {
        const round=p.bounceRound || null;
        if(round ? data.move==='start' || round.id!==data.roundId || round.n!==data.n || round.betUnits!==engine.units(data.bet) : data.move!=='start')
          fail('king-rico/round-conflict','A rodada mudou em outro aparelho.');
        if(data.move==='collect' && data.n<1) fail('king-rico/invalid-argument','Prêmio indisponível.');
        if(p.lastSpinAt && time-p.lastSpinAt.toMillis()<300) fail('king-rico/resource-exhausted','Aguarde antes de saltar.');
        betUnits=round ? 0 : engine.units(data.bet);if(p.balanceUnits<betUnits) fail('king-rico/failed-precondition','Saldo insuficiente.');
        const outcome=engine.bounce(data.bet,round,data.move,data.roundId,data.gold),before=p.balanceUnits;
        winUnits=outcome.winUnits;p.balanceUnits=before-betUnits+winUnits;
        p.bounceRound=outcome.ended ? null : {id:data.roundId,betUnits:outcome.betUnits,n:outcome.n,guardUnits:outcome.guardUnits};
        p.settings.bounceBetIdx=engine.BETS.indexOf(data.bet);p.lastSpinAt=stamp();p.firstSpinAt ||= stamp();
        result={game:'bounce',bet:data.bet,balanceBefore:before/100,balanceDebited:(before-betUnits)/100,outcome,baseBalance:p.balanceUnits/100};
      } else if(data.action==='clown') {
        const round=p.clownRound || null;
        if(round ? round.id!==data.roundId || round.used!==data.used || round.betUnits!==engine.units(data.bet) : data.used!==0)
          fail('king-rico/round-conflict','A rodada mudou em outro aparelho.');
        if(p.lastSpinAt && time-p.lastSpinAt.toMillis()<300) fail('king-rico/resource-exhausted','Aguarde antes de lançar.');
        betUnits=round ? 0 : engine.units(data.bet);
        if(p.balanceUnits<betUnits) fail('king-rico/failed-precondition','Saldo insuficiente.');
        const stats=p.clownStats || {betUnits:0,winUnits:0},outcome=engine.clown(data.bet,round,data.roundId,data.selected,stats,rng),before=p.balanceUnits;
        winUnits=outcome.winUnits;p.balanceUnits=before-betUnits+winUnits;
        p.clownRound=outcome.ended ? null : {id:data.roundId,betUnits:outcome.betUnits,used:outcome.used,results:outcome.results,sumUnits:outcome.sumUnits};
        if(outcome.ended) p.clownStats={betUnits:stats.betUnits+outcome.betUnits,winUnits:stats.winUnits+winUnits};
        p.settings.clownBetIdx=engine.BETS.indexOf(data.bet);p.lastSpinAt=stamp();p.firstSpinAt ||= stamp();
        result={game:'clown',bet:data.bet,balanceBefore:before/100,balanceDebited:(before-betUnits)/100,outcome,baseBalance:p.balanceUnits/100};
      } else if(data.action==='flying') {
        const round=p.flyingRound || null;
        if(round ? round.id!==data.roundId || round.step!==data.step || round.betUnits!==engine.units(data.bet)
          || data.move==='pop' && round.popped.includes(data.selected) : data.move!=='pop' || data.step!==0)
          fail('king-rico/round-conflict','A rodada mudou em outro aparelho.');
        if(p.lastSpinAt && time-p.lastSpinAt.toMillis()<300) fail('king-rico/resource-exhausted','Aguarde antes de estourar.');
        betUnits=round?0:engine.units(data.bet);
        if(p.balanceUnits<betUnits)fail('king-rico/failed-precondition','Saldo insuficiente.');
        const outcome=engine.flying(data.bet,round,data.move,data.roundId,data.selected,rng),before=p.balanceUnits;
        winUnits=outcome.winUnits;p.balanceUnits=before-betUnits+winUnits;
        p.flyingRound=outcome.ended?null:{id:data.roundId,betUnits:outcome.betUnits,step:outcome.step,popped:outcome.popped};
        p.settings.flyingBetIdx=engine.BETS.indexOf(data.bet);p.lastSpinAt=stamp();p.firstSpinAt ||= stamp();
        result={game:'flying',bet:data.bet,balanceBefore:before/100,balanceDebited:(before-betUnits)/100,outcome,baseBalance:p.balanceUnits/100};
      } else if(data.action==='race') {
        if(p.lastSpinAt && time-p.lastSpinAt.toMillis()<700)fail('king-rico/resource-exhausted','Aguarde antes de largar.');
        betUnits=engine.units(data.bet);if(p.balanceUnits<betUnits)fail('king-rico/failed-precondition','Saldo insuficiente.');
        const outcome=engine.race(data.bet,data.selected,data.seed,data.roundId,data.version,data.selected2),before=p.balanceUnits;
        winUnits=outcome.winUnits;p.balanceUnits=before-betUnits+winUnits;p.settings.raceBetIdx=engine.BETS.indexOf(data.bet);p.lastSpinAt=stamp();p.firstSpinAt ||= stamp();
        result={game:'race',bet:data.bet,balanceBefore:before/100,balanceDebited:(before-betUnits)/100,outcome,baseBalance:p.balanceUnits/100};
      } else if(data.action==='claw') {
        if(p.lastSpinAt && time-p.lastSpinAt.toMillis()<700)fail('king-rico/resource-exhausted','Aguarde antes de pegar.');
        betUnits=engine.units(data.bet);if(p.balanceUnits<betUnits)fail('king-rico/failed-precondition','Saldo insuficiente.');
        const outcome=engine.claw(data.bet,data.selected,data.aimX,data.aimZ,data.seed,data.roundId),before=p.balanceUnits;
        winUnits=outcome.winUnits;p.balanceUnits=before-betUnits+winUnits;p.settings.clawBetIdx=engine.BETS.indexOf(data.bet);p.lastSpinAt=stamp();p.firstSpinAt ||= stamp();
        result={game:'claw',bet:data.bet,balanceBefore:before/100,balanceDebited:(before-betUnits)/100,outcome,baseBalance:p.balanceUnits/100};
      } else if(data.action==='twentyOne') {
        const previous=p.twentyOneRound || null,starting=data.move==='start',active=previous && previous.phase!=='settled';
        if(starting ? active : !active || previous.id!==data.roundId || previous.turn!==data.turn || previous.betUnits!==engine.units(data.bet)
          || (data.move==='dealer' ? previous.phase!=='dealer' : previous.phase!=='player'))
          fail('king-rico/round-conflict','A mão mudou em outro aparelho.');
        if(p.lastSpinAt && time-p.lastSpinAt.toMillis()<300) fail('king-rico/resource-exhausted','Aguarde antes de jogar.');
        betUnits=starting?engine.units(data.bet):0;
        if(p.balanceUnits<betUnits)fail('king-rico/failed-precondition','Saldo insuficiente.');
        const outcome=engine.twentyOne(data.bet,previous,data.move,data.roundId,rng,data.target),before=p.balanceUnits;
        winUnits=outcome.winUnits;p.balanceUnits=before-betUnits+winUnits;p.twentyOneRound=outcome.round;
        p.settings.twentyOneBetIdx=engine.BETS.indexOf(data.bet);p.lastSpinAt=stamp();p.firstSpinAt ||= stamp();
        result={game:'twentyOne',bet:data.bet,balanceBefore:before/100,balanceDebited:(before-betUnits)/100,outcome,baseBalance:p.balanceUnits/100};
      } else if (data.action==='bonus') {
        const today=dayIndex(time), gap=today-p.bonus.dayIndex;
        if (gap===0) return {amount:0,player:publicPlayer(p)};
        if (gap<0) fail('king-rico/invalid-argument','Confira a data do aparelho.');
        const index=gap===1 ? p.bonus.streak%7 : 0;
        winUnits=[5000,10000,15000,20000,25000,50000,100000][index];p.balanceUnits+=winUnits;
        p.bonus={day:engine.dayKey(time),dayIndex:today,streak:index+1};
        result={amount:winUnits/100};
      } else if (data.action==='recharge') {
        // A paused game must not lock the shared wallet. Preserve every round.
        const home=data.source==='home';
        if(!home && p.balanceUnits>=engine.units(engine.BETS[0])) return {amount:0,player:publicPlayer(p)};
        if(home){
          const today=dayIndex(time),daily=p.rechargeDaily,count=daily?.dayIndex===today?daily.count:0;
          if(daily?.dayIndex>today)fail('king-rico/invalid-argument','Confira a data do aparelho.');
          if(count>=5)fail('king-rico/daily-limit','Você já recebeu as cinco recompensas de hoje.');
          p.rechargeDaily={dayIndex:today,count:count+1};
        }
        winUnits=100000;p.balanceUnits+=winUnits;
        if(home)p.rechargeCount=(p.rechargeCount||0)+1;
        result={amount:winUnits/100,...(home?{source:'home',count:p.rechargeCount}:{})};
      } else if (data.action==='settings') {
        p.settings={...p.settings,...settings};
        if (data.analyticsConsent!==undefined) p.analyticsConsent=data.analyticsConsent;
      }
      if (!isNew) p.revision++;
      p.updatedAt=stamp();
      if (financial) p.lastOperationId=data.requestId;
      result={...result,player:publicPlayer(p)};
      tx.set(playerRef,p);
      if (financial) {
        // The immutable operation stores the outcome; the current player is
        // already read by the transaction. Avoid duplicating every active hand
        // and its deck into every operation and revalidating that snapshot.
        const {player:ignored,...savedResult}=result;
        tx.set(operationRef,{action:data.action,game:data.game || 'home',selected:data.selected ?? -1,
          fingerprint,betUnits,winUnits,result:savedResult,createdAt:stamp(),rulesVersion:engine.RULES_VERSION});
      }
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
          const current=await read(playerRef);
          return {...operation.result,player:publicPlayer(current.data()),replayed:true};
        }
        // Another tab may have recharged with a different ID. Re-read in a fresh
        // transaction once; the same operation ID never creates another credit.
        if(data.action==='recharge') return execute();
      }
      throw error;
    }
  };
}
