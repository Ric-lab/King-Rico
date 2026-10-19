import test from 'node:test';import assert from 'node:assert/strict';
import {TOTAL,marblePlan,begin,resolveBall,payout,settle} from './cascade-state.mjs';
const fresh=()=>({version:1,balance:1000,bet:25,settings:{sfx:1,vib:1},round:null});
test('uma rodada debita uma vez e não pode iniciar por cima de outra',()=>{const s=begin(fresh(),'r',123);assert.equal(s.balance,975);assert.deepEqual(begin(s,'r2',4),s);});
test('uma bolinha só pontua uma vez e três da mesma cor dão bônus',()=>{let s=begin(fresh(),'r',123);const ids=Array.from({length:TOTAL},(_,i)=>i).filter(i=>marblePlan(123,i).color===0).slice(0,3);for(const id of ids)s=resolveBall(s,id,true);assert.equal(s.round.caught,3);assert.equal(s.round.combos,1);assert.equal(s.round.points,6);assert.deepEqual(resolveBall(s,ids[0],true),s);});
test('receber e atualizar não duplica o prêmio; apostas escalam o valor',()=>{let s=begin(fresh(),'r',12);for(let id=0;id<TOTAL;id++)s=resolveBall(s,id,id<20);const prize=payout(s.round);s=settle(s);assert.equal(s.balance,975+prize);assert.deepEqual(settle(s),s);const bigger={...s.round,bet:50};assert.equal(payout(bigger),prize*2);});
test('ensaio não debita nem paga e perdas não pontuam',()=>{let s=begin(fresh(),'r',5,true);for(let i=0;i<TOTAL;i++)s=resolveBall(s,i,i<15);s=settle(s);assert.equal(s.balance,1000);assert.equal(payout(s.round),0);assert.equal(s.round.caught,15);});
test('bolinhas de uma mesma rodada têm cor e impulso reproduzíveis',()=>{assert.deepEqual(marblePlan(44,20),marblePlan(44,20));assert.notDeepEqual(marblePlan(44,20),marblePlan(45,20));});
