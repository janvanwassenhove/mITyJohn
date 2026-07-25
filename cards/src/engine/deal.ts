// Delen en troefbepaling — REGELS.md §3: 13 kaarten p.p. in 4-4-5,
// laatste kaart (aan de deler) open = troef.

import { makeDeck, shuffle, type Card, type Suit } from './cards';

export const PLAYER_COUNT = 4;

export interface Deal {
  hands: Card[][]; // per speler, index 0..3
  turnedCard: Card; // laatste kaart van de deler
  trumpSuit: Suit; // kleur van de gedraaide kaart
  dealer: number;
}

export function nextPlayer(player: number): number {
  return (player + 1) % PLAYER_COUNT;
}

export function deal(dealer: number, rng: () => number, pattern: number[] = [4, 4, 5]): Deal {
  const cards = shuffle(makeDeck(), rng);
  const hands: Card[][] = [[], [], [], []];
  let index = 0;
  for (const batch of pattern) {
    // start telkens links van de deler, de deler krijgt als laatste
    for (let seat = 1; seat <= PLAYER_COUNT; seat++) {
      const player = (dealer + seat) % PLAYER_COUNT;
      for (let n = 0; n < batch; n++) {
        (hands[player] as Card[]).push(cards[index] as Card);
        index++;
      }
    }
  }
  const dealerHand = hands[dealer] as Card[];
  const turnedCard = dealerHand[dealerHand.length - 1] as Card;
  return { hands, turnedCard, trumpSuit: turnedCard.suit, dealer };
}
