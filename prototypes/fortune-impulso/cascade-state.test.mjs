import test from 'node:test';
import assert from 'node:assert/strict';
import {TOTAL,MAX_BALLS,BONUS_PER_GATE,availableIds,marblePlan,begin,resolveBall,payout,settle} from './cascade-state.mjs';
const fresh=()=>({version:2,balance:1000,bet:25,settings:{sfx:1,vib:1},round:null});
const colorIds=(seed,color)=>Array.from({length:TOTAL},(_,i)=>i).filter(i=>marblePlan(seed,i).color===color);
function finish(s,catchBase=0){for(let i=0;i<TOTAL;i++)s=resolveBall(s,i,i<catchBase);for(const id of availableIds(s.round))s=resolveBall(s,id,false);return settle(s);}
test('uma rodada debita uma vez e não pode iniciar por cima de outra',()=>{
 const s=begin(fresh(),'r',123);assert.equal(s.balance,975);assert.deepEqual(begin(s,'r2',4),s);
 assert.deepEqual(begin({...fresh(),balance:0},'r',123),{...fresh(),balance:0});
});
test('trinca abre apenas a reserva da mesma cor e resolve cada bolinha uma vez',()=>{
 let s=begin(fresh(),'r',123);s.round.tick=500;
 const ids=colorIds(123,0);for(const id of ids.slice(0,3))s=resolveBall(s,id,true);
 assert.equal(s.round.points,6);assert.equal(s.round.caught,3);assert.equal(s.round.combos,1);
 assert.equal(s.round.gates[0].openedAt,500);assert.equal(s.round.total,72);assert.equal(s.round.deadline,860);
 assert.equal(s.round.gates[1].openedAt,null);assert.equal(availableIds(s.round).length,72);
 assert.deepEqual(resolveBall(s,ids[0],true),s);
 for(const id of ids.slice(3,6))s=resolveBall(s,id,true);
 assert.equal(s.round.combos,2);assert.equal(s.round.total,72);assert.equal(s.round.gates[0].openedAt,500);
});
test('reservas fechadas não dão pontos; bônus aberto não permite terminar antes da avalanche',()=>{
 let s=begin(fresh(),'r',123);assert.deepEqual(resolveBall(s,TOTAL,true),s);
 for(const id of colorIds(123,1).slice(0,3))s=resolveBall(s,id,true);
 for(let i=0;i<TOTAL;i++)s=resolveBall(s,i,false);
 assert.equal(s.round.resolved.length,60);assert.deepEqual(settle(s),s);
 for(let i=TOTAL+BONUS_PER_GATE;i<TOTAL+2*BONUS_PER_GATE;i++)s=resolveBall(s,i,true);
 assert.equal(s.round.caught,15);assert.equal(s.round.total,72);assert.equal(s.round.combos,5);
 s=settle(s);assert.equal(s.round.phase,'paid');assert.equal(s.balance,975+payout(s.round));
});
test('cada cor abre uma vez; o máximo é 96 bolinhas e 20 segundos',()=>{
 let s=begin(fresh(),'r',123);
 for(let color=0;color<3;color++){s.round.tick=1000+color*70;for(const id of colorIds(123,color).slice(0,3))s=resolveBall(s,id,true);}
 assert.equal(s.round.total,MAX_BALLS);assert.equal(s.round.deadline,1200);
 assert.equal(availableIds(s.round).length,96);
 for(let color=0;color<3;color++)for(const id of colorIds(123,color).slice(3,6))s=resolveBall(s,id,true);
 assert.equal(s.round.total,96);
});
test('checkpoint mantém comporta, fila, resultado e crédito único após atualizar',()=>{
 let s=begin(fresh(),'r',123);for(const id of colorIds(123,0).slice(0,3))s=resolveBall(s,id,true);
 s.round.gates[0].spawned=4;s.round.balls=[{id:60,x:76,y:175,vx:1,vy:3}];
 const restored=JSON.parse(JSON.stringify(s));assert.deepEqual(restored,s);
 s=finish(restored,20);const prize=payout(s.round);assert.equal(s.balance,975+prize);assert.equal(s.round.phase,'paid');
 assert.deepEqual(settle(JSON.parse(JSON.stringify(s))),s);
 assert.deepEqual(resolveBall(s,60,true),s);
 assert.equal(payout({...s.round,bet:50}),prize*2);
});
test('ensaio não debita nem paga e perdas não pontuam',()=>{
 const s=finish(begin(fresh(),'r',5,true),15);assert.equal(s.balance,1000);assert.equal(s.round.phase,'paid');assert.equal(payout(s.round),0);assert.equal(s.round.caught,15);
});
test('cor, origem e impulso são reproduzíveis; reserva tem a cor da comporta',()=>{
 assert.deepEqual(marblePlan(44,20),marblePlan(44,20));assert.notDeepEqual(marblePlan(44,20),marblePlan(45,20));
 for(let i=TOTAL;i<MAX_BALLS;i++)assert.equal(marblePlan(44,i).color,Math.floor((i-TOTAL)/BONUS_PER_GATE));
});
test('acertar o centro vale dois; repetição e bolinhas perdidas não criam bônus',()=>{
 let s=begin(fresh(),'center',123);
 s=resolveBall(s,0,true,true);assert.equal(s.round.points,2);assert.equal(s.round.perfect,1);
 assert.deepEqual(resolveBall(s,0,true,true),s);
 s=resolveBall(s,1,true,false);assert.equal(s.round.points,3);assert.equal(s.round.perfect,1);
 s=resolveBall(s,2,false,true);assert.equal(s.round.points,3);assert.equal(s.round.perfect,1);
 const restored=JSON.parse(JSON.stringify(s));assert.equal(restored.round.perfect,1);
});
test('sequências de três permitem perseguir uma cor sem alterar o resultado depois do gesto',()=>{
 for(const seed of [1,123,45678])for(let i=0;i<TOTAL;i+=3){
  const first=marblePlan(seed,i);
  assert.equal(marblePlan(seed,i+1).color,first.color);assert.equal(marblePlan(seed,i+2).color,first.color);
 }
});
