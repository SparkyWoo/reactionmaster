import { ComponentType } from 'react';

export interface GameConfig {
  id: number;
  name: string;
  description: string;
  timeLimit: number;
  penaltyMultiplier: number;
  component: ComponentType<{ gameId: number; onGameComplete: (score: GameScore) => void }>;
}

export interface GameScore {
  gameId: number;
  time: number;
  penalties: number;
  finalScore: number;
}

export interface GameResult {
  scores: GameScore[];
  averageTime: number;
  region: string;
  date: string;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  averageTime: number;
  region: string | null;
  createdAt: Date;
}

export type GameStatus = 'waiting' | 'playing' | 'completed';

export interface GameState {
  currentGameIndex: number;
  scores: GameScore[];
  isPlaying: boolean;
  gameSequence: number[];
  gameStatus: GameStatus;
}

export interface BaseGameProps {
  onComplete: (reactionTime: number) => void;
}

export interface SimpleTapProps extends BaseGameProps {}
export interface DirectionSwipeProps extends BaseGameProps {}
export interface MovingTargetProps extends BaseGameProps {}
export interface ChainReactionProps extends BaseGameProps {} 