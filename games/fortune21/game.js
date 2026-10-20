const {BETS} = require('../../cloud/engine.cjs');
const CARD_ART = [
  {name:'Bumbo',sprite:1},{name:'Circo',sprite:2},{name:'Trevo',sprite:4},
  {name:'Nuvem',sprite:3},{name:'Capa',sprite:0},{name:'Cetro',sprite:5},
  {name:'Moeda',sprite:6},{name:'Coroa',sprite:7},{name:'Happeach',sprite:11},
  {name:'Diamante',sprite:8},{name:'Crazy Clown',src:'./assets/clown/clown.webp'},
  {name:'Nick Neck',src:'./assets/girafa/head.webp'},{name:'King Rico',sprite:9}
];
const Cloud=window.KingRicoCloud;
function handValue(cards,target=33){const hard=cards.reduce((n,c)=>n+c.value,0),soft=target===21&&cards.some(c=>c.value===1)&&hard+10<=21;return {total:hard+(soft?10:0),soft};}
import {mountMenu} from './menu.jsx';

const $ = id => document.getElementById(id);
const format = n => n.toLocaleString('pt-BR');
const game = $('game');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let account={balance:0,bet:BETS[3],revision:0,round:null},busy=false,paused=false,error=false;
let dealerTimer,resultTimer,animationTimer,shownResult,pendingUntil=0;
let preferences={sfx:2,vib:2},audio;
function applyPlayer(player){
  if(!player)return;
  const r=player.twentyOneRound;
  const card=id=>({id:String(id),rank:id%13+1,value:r.target===33?id%13+1:Math.min(id%13+1,10)});
  account={balance:player.balance,bet:busy?account.bet:BETS[player.settings.twentyOneBetIdx??3],revision:player.revision,
    round:r?{id:r.id,target:r.target??21,turn:r.turn,bet:r.betUnits/100,phase:r.phase,player:r.player.map(card),dealer:r.dealer.map(card),
      result:r.result?{...r.result,payout:r.result.payoutUnits/100,net:r.result.netUnits/100}:null}:null};
  preferences={sfx:player.settings.sfxLvl,vib:player.settings.vibLvl};
  render();schedule();
}

function resize() {
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;
  const scale = Math.min(width / 453, height / 810);
  game.style.setProperty('--scene-scale', scale);
  game.style.setProperty('--scene-height', `${height / scale}px`);
  const cardHeight = Math.min(156,114+Math.max(0,height/scale-810)*.25);
  game.style.setProperty('--card-height', `${cardHeight}px`);
  game.style.setProperty('--card-width', `${cardHeight*.7}px`);
  requestAnimationFrame(render);
}
new ResizeObserver(resize).observe(document.documentElement);
resize();

function showError(message) {
  error = true;
  $('error').hidden = false;
  $('error').textContent = message.includes('inválid') ? 'Não foi possível ler a rodada salva. Seu saldo de teste foi preservado; tente recarregar.' : message;
}

function tone(kind = 'tap') {
  if (!preferences.sfx) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const frequencies = kind === 'win' ? [523,659,784] : kind === 'card' ? [370,290] : [210];
    frequencies.forEach((frequency,i) => {
      const start = audio.currentTime + i * .075;
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = kind === 'card' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(frequency,start);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(preferences.sfx === 1 ? .022 : .05,start+.009);
      gain.gain.exponentialRampToValueAtTime(.0001,start+.09);
      osc.connect(gain); gain.connect(audio.destination); osc.start(start); osc.stop(start+.1);
    });
  } catch {}
}
function feedback(kind) {
  tone(kind);
  if (preferences.vib && navigator.vibrate) navigator.vibrate(kind === 'win' ? [15,35,20] : preferences.vib === 1 ? 8 : 16);
}

function cardNode(card, hidden, index, count, newRound) {
  const node = document.createElement('div');
  node.className = `card${hidden ? ' back' : ''}`;
  node.dataset.key = hidden ? 'hidden' : card.id;
  node.setAttribute('role','img');
  if (hidden) {
    node.setAttribute('aria-label','Carta fechada');
    const symbol = document.createElement('i'); symbol.className = 'symbol'; symbol.style.setProperty('--symbol-x','63.6364%'); node.append(symbol);
  } else {
    const rank=card.rank ?? card.value, art=CARD_ART[rank-1];
    node.dataset.rank=rank;
    node.setAttribute('aria-label',`Carta ${rank}, ${art.name}, ${`vale ${card.value} pontos`}`);
    const number = document.createElement('span'); number.className = 'card-number'; number.textContent = rank;
    const symbol = document.createElement('i'); symbol.className = 'symbol';
    if(art.src){symbol.classList.add('character');symbol.style.backgroundImage=`url("${art.src}")`;}
    else symbol.style.setProperty('--symbol-x',`${art.sprite/11*100}%`);
    node.append(number,symbol);
    for (const bottom of [false,true]) {
      const corner = document.createElement('span'); corner.className = `corner${bottom?' bottom':''}`; corner.textContent = rank;
      node.append(corner);
    }

  }
  if (newRound) {node.classList.add('dealt');node.style.setProperty('--deal-delay',`${index * 120}ms`);}
  return node;
}

let previousRoundId;
function renderHand(element, cards, hideSecond, newRound, winner) {
  const previous = new Map([...element.children].map(node => [node.dataset.key,node]));
  const wasHidden = previous.has('hidden');
  const width = 375, cardWidth = parseFloat(getComputedStyle(game).getPropertyValue('--card-width')) || 87;
  const spacing = Math.min(cardWidth*.82,(width-cardWidth-12)/Math.max(1,cards.length-1));
  const span = (cards.length-1)*spacing;
  cards.forEach((card,index) => {
    const hidden = hideSecond && index === 1;
    const key = hidden ? 'hidden' : card.id;
    let node = previous.get(key);
    if (!node) {
      node = cardNode(card,hidden,index,cards.length,newRound || (!wasHidden && !!previousRoundId));
      if (wasHidden && index === 1 && !hidden) node.classList.add('revealed');
    }
    previous.delete(key);
    node.style.left = `calc(50% + ${index*spacing-span/2}px)`;
    node.style.setProperty('--angle',`${cards.length === 2 ? (index===0?-4:4) : (index-(cards.length-1)/2)*Math.min(4,16/cards.length)}deg`);
    node.style.zIndex = index+1;
    node.classList.toggle('winner',!!winner);
    // Preserve live nodes in place: moving an existing card restarts its CSS
    // entrance animation in Chromium, making old cards blink on every action.
    if (element.children[index] !== node) element.insertBefore(node,element.children[index] || null);
  });
  for (const node of previous.values()) node.remove();
}

function render() {
  const r = account.round, playing = r && r.phase !== 'settled';
  game.classList.toggle('idle',!r);
  game.classList.toggle('has-round',!!r);
  game.classList.toggle('dealer-turn',r?.phase === 'dealer');
  $('balance').textContent = format(account.balance);
  $('bet').textContent = format(r && playing ? r.bet : account.bet);
  $('start-controls').hidden = !!playing;
  $('play-controls').hidden = !playing;
  const awaitingResult=r?.phase==='settled' && shownResult!==r.id;
  const locked = busy || Date.now() < pendingUntil || paused || error || awaitingResult;
  $('hit').disabled = locked || r?.phase !== 'player';
  $('stand').disabled = locked || r?.phase !== 'player';
  $('bet-down').disabled = locked || playing || account.bet === BETS[0];
  $('bet-up').disabled = locked || playing || account.bet === BETS.at(-1);
  const refill = account.balance < BETS[0];
  $('start').disabled = locked || playing || (!refill && account.balance < account.bet);
  $('start').querySelector('span').textContent = refill ? 'RECARREGAR MOEDAS' : r ? 'JOGAR OUTRA MÃO' : 'DISTRIBUIR CARTAS';
  $('start-hint').textContent = refill ? 'RECEBER 1.000 PARA TESTAR' : account.balance < account.bet ? 'DIMINUA A APOSTA' : `APOSTAR ${format(account.bet)} MOEDAS`;
  if (!r) {
    const stub = [{id:'stub-a',value:1,suit:'crown'},{id:'stub-b',value:13}];
    for (const hand of [$('dealer-hand'),$('player-hand')]) renderHand(hand,stub,true,false,false);
    return;
  }
  const newRound = r.id !== previousRoundId;
  const player = handValue(r.player,r.target), dealer = handValue(r.dealer,r.target);
  const hidden = r.phase === 'player';
  renderHand($('dealer-hand'),r.dealer,hidden,newRound,r.result?.outcome==='loss' && r.result?.reason!=='player-bust');
  renderHand($('player-hand'),r.player,false,newRound,r.result?.outcome==='win');
  previousRoundId = r.id;
  $('dealer-score').textContent = hidden ? `${handValue([r.dealer[0]],r.target).total} + ?` : dealer.total;
  $('dealer-score').style.fontSize = hidden ? '23px' : '';
  $('player-score').textContent = player.total;
  $('ace-note').textContent = r.target===21 ? 'Mão anterior · regras de 21 até terminar' : '';
  const labels = r.phase === 'player' ? ['Sua vez.', 'Pedir mais uma ou ficar com a mão?'] : r.phase === 'dealer' ? ['Vez da banca.', `A banca para em ${r.target===33?27:17} ou mais.`] : resultCopy(r);
  $('status').textContent = labels[0]; $('substatus').textContent = labels[1];
}

function resultCopy(r) {
  const target=r.target??21;
  switch (r.result.reason) {
    case 'natural': return ['21 de saída!', 'Duas cartas. Recebimento de 2,5×.'];
    case 'dealer-bust': return ['Você ganhou!', `A banca passou de ${target}.`];
    case 'higher': return ['Você ganhou!', `Sua mão ficou mais perto de ${target}.`];
    case 'player-bust': return [`Passou de ${target}.`, 'Esta mão ficou com a banca.'];
    case 'dealer-21': return ['21 da banca.', 'A banca fez 21 com duas cartas.'];
    case 'both-21': return ['Empate em 21.', 'A aposta voltou para o saldo.'];
    case 'equal': return ['Empatou!', 'A aposta voltou para o saldo.'];
    default: return ['A banca ganhou.', `A mão da banca ficou mais perto de ${target}.`];
  }
}

async function dispatch(type,extra={}){
  if(busy || paused || error || !Cloud?.player)return;
  if(type==='bet'){
    if(account.round && account.round.phase!=='settled' || !BETS.includes(extra.amount))return;
    account.bet=extra.amount;Cloud.settings({twentyOneBetIdx:BETS.indexOf(extra.amount)});tone('tap');render();return;
  }
  clearTimeout(resultTimer);clearTimeout(dealerTimer);busy=true;render();
  try{
    if(type==='refill')await Cloud.recharge();
    else {
      const r=account.round,starting=type==='start';
      await Cloud.twentyOne(type,starting?account.bet:r.bet,starting?crypto.randomUUID():r.id,starting?0:r.turn,starting?33:r.target);
    }
    applyPlayer(Cloud.player);
    if(type==='start'){shownResult=null;pendingUntil=Date.now()+(reducedMotion.matches?120:700);feedback('card');}
    else if(type==='hit'||type==='dealer'){pendingUntil=Date.now()+(reducedMotion.matches?100:360);feedback('card');}
    else tone('tap');
  }catch(e){Cloud.error(e);applyPlayer(Cloud.player);}
  finally{
    busy=false;render();schedule();clearTimeout(animationTimer);
    animationTimer=setTimeout(()=>{render();schedule();},Math.max(0,pendingUntil-Date.now())+20);
  }
}

function schedule() {
  clearTimeout(dealerTimer);clearTimeout(resultTimer);
  if (paused || busy || error || document.hidden) return;
  const r = account.round;
  if (r?.phase === 'dealer') {
    const id = r.id, revision = account.revision;
    dealerTimer = setTimeout(() => {
      if (!paused && account.round?.id === id && account.revision === revision) dispatch('dealer');
    },Math.max(600,pendingUntil-Date.now()+200));
  } else if (r?.phase === 'settled' && shownResult !== r.id && !$('result-dialog').open) {
    resultTimer = setTimeout(() => {
      if (!busy && !paused && account.round?.id === r.id && account.round.phase === 'settled') showResult();
    },Math.max(600,pendingUntil-Date.now()+300));
  }
}

function showResult() {
  const r = account.round;
  if (busy || paused || !r?.result || shownResult === r.id) return;
  shownResult = r.id;
  $('result-dialog').dataset.roundId=r.id;
  $('result-dialog').dataset.outcome=r.result.outcome;
  const [title,detail] = resultCopy(r);
  $('result-title').textContent = title;
  $('result-detail').textContent = detail;
  $('result-dialog').classList.toggle('loss',r.result.outcome==='loss');
  $('result-kicker').textContent = r.result.reason==='natural' ? 'FORTUNE 33' : 'FIM DA RODADA';
  $('result-amount').textContent = r.result.outcome==='loss' ? `−${format(r.bet)}` : format(r.result.payout);
  $('result-caption').textContent = r.result.outcome==='loss' ? 'MOEDAS DESTA APOSTA' : r.result.outcome==='push' ? 'MOEDAS DEVOLVIDAS' : 'MOEDAS RECEBIDAS';
  $('result-net').textContent = r.result.outcome === 'win' ? `Aposta de ${format(r.bet)} incluída · lucro +${format(r.result.net)}` : r.result.outcome === 'push' ? 'Seu saldo ficou igual ao início da mão.' : 'A próxima mão é uma nova rodada.';
  $('result-player').textContent = handValue(r.player,r.target).total;
  $('result-dealer').textContent = handValue(r.dealer,r.target).total;
  $('collect').querySelector('span').textContent = r.result.outcome === 'win' ? 'VOLTAR À MESA' : 'CONTINUAR';
  $('result-dialog').showModal();
  if (r.result.outcome==='win') feedback('win');
}

function coinFlight() {
  if (reducedMotion.matches) return;
  const from = $('player-score').getBoundingClientRect(), to = $('balance').getBoundingClientRect();
  for (let i=0;i<7;i++) {
    const coin = new Image();coin.src='./assets/symbols/sym-coin.webp';coin.className='payout-coin';
    coin.style.left=`${from.x+from.width/2-16}px`;coin.style.top=`${from.y}px`;document.body.append(coin);
    const dx=to.x+to.width/2-(from.x+from.width/2),dy=to.y-from.y;
    const animation = coin.animate([{transform:'translate(0,0) scale(.65)',opacity:0},{transform:`translate(${(i-3)*13}px,-35px) scale(1)`,opacity:1,offset:.22},{transform:`translate(${dx}px,${dy}px) scale(.5)`,opacity:1}],{duration:600,delay:i*45,easing:'cubic-bezier(.4,0,.65,1)',fill:'both'});
    animation.finished.then(()=>coin.remove()).catch(()=>coin.remove());
  }
  setTimeout(()=>{$('balance').parentElement.classList.remove('credit');void $('balance').offsetWidth;$('balance').parentElement.classList.add('credit');},650);
}

function help() {
  paused = true;clearTimeout(dealerTimer);clearTimeout(resultTimer);render();$('help-dialog').showModal();
}
function unpause() {paused=false;render();schedule();}
for (const id of ['close-help','help-done']) $(id).onclick=()=> $('help-dialog').close();
$('help-dialog').addEventListener('close',unpause);
$('collect').onclick=()=>{clearTimeout(resultTimer);shownResult=$('result-dialog').dataset.roundId;$('result-dialog').close();tone('tap');};
$('result-dialog').addEventListener('close',()=>{shownResult=$('result-dialog').dataset.roundId;if($('result-dialog').dataset.outcome==='win')coinFlight();render();schedule();});
$('bet-down').onclick=()=>dispatch('bet',{amount:BETS[Math.max(0,BETS.indexOf(account.bet)-1)]});
$('bet-up').onclick=()=>dispatch('bet',{amount:BETS[Math.min(BETS.length-1,BETS.indexOf(account.bet)+1)]});
$('start').onclick=()=>{
  if (account.balance < BETS[0]) dispatch('refill');
  else dispatch('start');
};
$('hit').onclick=()=>dispatch('hit');
$('stand').onclick=()=>dispatch('stand');
mountMenu(value=>{paused=value;render();schedule();},help,next=>{preferences=next;Cloud?.settings({sfxLvl:next.sfx,vibLvl:next.vib});},preferences);
window.KingRico21={isBusy:()=>busy || account.round?.phase==='dealer'};
if(Cloud?.enabled)Cloud.watch(applyPlayer);
else showError('Conecte sua conta do King Rico para jogar.');
document.addEventListener('visibilitychange',()=>{render();schedule();});
render();schedule();
