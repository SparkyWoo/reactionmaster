import { GameConfig } from '../types/game';
import { MAX_TIME_LIMIT, PENALTY_MULTIPLIER } from './gameConstants';
import SimpleTap from '../components/games/SimpleTap';
import DirectionSwipe from '../components/games/DirectionSwipe';
import MovingTarget from '../components/games/MovingTarget';
import ChainReaction from '../components/games/ChainReaction';

export const GAMES: GameConfig[] = [
  {
    id: 1,
    name: 'Simple Tap',
    description: 'Tap the circle as soon as it appears',
    timeLimit: MAX_TIME_LIMIT,
    penaltyMultiplier: PENALTY_MULTIPLIER,
    component: SimpleTap,
  },
  {
    id: 2,
    name: 'Direction Swipe',
    description: 'Swipe in the direction shown',
    timeLimit: MAX_TIME_LIMIT,
    penaltyMultiplier: PENALTY_MULTIPLIER,
    component: DirectionSwipe,
  },
  {
    id: 3,
    name: 'Moving Target',
    description: 'Tap the moving circle',
    timeLimit: MAX_TIME_LIMIT,
    penaltyMultiplier: PENALTY_MULTIPLIER,
    component: MovingTarget,
  },
  {
    id: 4,
    name: 'Chain Reaction',
    description: 'Tap targets in sequence',
    timeLimit: MAX_TIME_LIMIT,
    penaltyMultiplier: PENALTY_MULTIPLIER,
    component: ChainReaction,
  },
];