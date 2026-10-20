export const STORAGE_KEY = 'king-rico-fortune-21-demo-v1';
export const BETS = [10, 20, 50, 100, 200];
export const SUITS = ['crown', 'gem', 'clover', 'tent'];

export function newAccount() {
  return {version: 1, revision: 0, balance: 1000, bet: 20, round: null, rounds: 0};
}

// Figures are numbered 10, so every card shows exactly what it is worth.
export function makeDeck() {
  return SUITS.flatMap(suit => Array.from({length: 13}, (_, i) => ({
    id: `${suit}-${i + 1}`, value: Math.min(i + 1, 10), suit,
  })));
}

export function shuffle(deck, crypto = globalThis.crypto) {
  const cards = deck.map(card => ({...card}));
  const random = new Uint32Array(1);
  for (let i = cards.length - 1; i > 0; i--) {
    const limit = Math.floor(0x100000000 / (i + 1)) * (i + 1);
    do { crypto.getRandomValues(random); } while (random[0] >= limit);
    const j = random[0] % (i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function handValue(cards) {
  let total = cards.reduce((sum, card) => sum + card.value, 0);
  const soft = cards.some(card => card.value === 1) && total + 10 <= 21;
  if (soft) total += 10;
  return {total, soft, natural: total === 21 && cards.length === 2};
}

function draw(round, hand) {
  if (!round.deck.length) throw new Error('O baralho terminou.');
  round[hand].push(round.deck.shift());
}

function settle(state) {
  const r = state.round;
  if (r.phase === 'settled') return;
  const player = handValue(r.player), dealer = handValue(r.dealer);
  let outcome, reason, payout;
  if (player.total > 21) { outcome = 'loss'; reason = 'player-bust'; }
  else if (player.natural && dealer.natural) { outcome = 'push'; reason = 'both-21'; }
  else if (dealer.natural) { outcome = 'loss'; reason = 'dealer-21'; }
  else if (player.natural) { outcome = 'win'; reason = 'natural'; }
  else if (dealer.total > 21) { outcome = 'win'; reason = 'dealer-bust'; }
  else if (player.total > dealer.total) { outcome = 'win'; reason = 'higher'; }
  else if (player.total === dealer.total) { outcome = 'push'; reason = 'equal'; }
  else { outcome = 'loss'; reason = 'lower'; }
  payout = outcome === 'push' ? r.bet : outcome === 'win' ? r.bet * (reason === 'natural' ? 2.5 : 2) : 0;
  r.phase = 'settled';
  r.result = {outcome, reason, payout, net: payout - r.bet};
  state.balance += payout;
  state.rounds++;
}

export function transition(previous, action) {
  const state = structuredClone(previous);
  const r = state.round;
  // A stale click, repeat or another tab can never execute a different turn.
  if (action.revision !== previous.revision) return previous;
  if (action.type === 'bet') {
    if ((r && r.phase !== 'settled') || !BETS.includes(action.amount)) return previous;
    state.bet = action.amount;
  } else if (action.type === 'start') {
    if ((r && r.phase !== 'settled') || state.balance < state.bet) return previous;
    if (!validDeck(action.deck) || typeof action.id !== 'string' || !action.id) return previous;
    state.balance -= state.bet;
    state.round = {id: action.id, bet: state.bet, deck: structuredClone(action.deck), player: [], dealer: [], phase: 'player', result: null};
    for (const hand of ['player', 'dealer', 'player', 'dealer']) draw(state.round, hand);
    if (handValue(state.round.player).natural || handValue(state.round.dealer).natural) settle(state);
  } else if (action.type === 'refill') {
    if ((r && r.phase !== 'settled') || state.balance >= BETS[0]) return previous;
    state.balance = 1000;
  } else {
    if (!r || action.roundId !== r.id) return previous;
    if (action.type === 'hit' && r.phase === 'player') {
      draw(r, 'player');
      const {total} = handValue(r.player);
      if (total > 21) settle(state);
      else if (total === 21) r.phase = 'dealer';
    } else if (action.type === 'stand' && r.phase === 'player') {
      r.phase = 'dealer';
    } else if (action.type === 'dealer' && r.phase === 'dealer') {
      // The bank stands on every 17, including a soft 17.
      if (handValue(r.dealer).total < 17) draw(r, 'dealer');
      if (handValue(r.dealer).total >= 17) settle(state);
    } else return previous;
  }
  state.revision++;
  return state;
}

function validDeck(deck) {
  if (!Array.isArray(deck) || deck.length !== 52) return false;
  const canonical = new Map(makeDeck().map(card => [card.id, card]));
  for (const card of deck) {
    const original = canonical.get(card?.id);
    if (!original || original.value !== card.value || original.suit !== card.suit) return false;
    canonical.delete(card.id);
  }
  return canonical.size === 0;
}

export function readAccount(raw) {
  if (!raw) return newAccount();
  const account = JSON.parse(raw);
  if (account.version !== 1 || !Number.isSafeInteger(account.revision) || account.revision < 0 ||
      !Number.isSafeInteger(account.balance) || account.balance < 0 || !BETS.includes(account.bet) ||
      !Number.isSafeInteger(account.rounds) || account.rounds < 0) throw new Error('Saldo de teste inválido.');
  const r = account.round;
  if (r) {
    if (typeof r.id !== 'string' || !BETS.includes(r.bet) ||
        !['player', 'dealer', 'settled'].includes(r.phase) ||
        !Array.isArray(r.player) || !Array.isArray(r.dealer) || r.player.length < 2 || r.dealer.length < 2 ||
        !validDeck([...r.player, ...r.dealer, ...r.deck]) ||
        (r.phase === 'settled' && (!r.result || !['win', 'loss', 'push'].includes(r.result.outcome)))) {
      throw new Error('Rodada de teste inválida.');
    }
  }
  return account;
}
