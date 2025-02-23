import { create } from 'zustand';
import { GameScore, GameState, GameStatus } from '../types/game';
import { GAMES } from '../constants/games';

interface GameStore extends GameState {
  startGame: () => void;
  recordScore: (score: GameScore) => void;
  nextGame: () => void;
  resetGame: () => void;
  endGame: () => void;
  reactionTimes: number[];
  addReactionTime: (time: number) => void;
}

function shuffleArray(array: number[]): number[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Only include the 4 implemented games (1-4)
const IMPLEMENTED_GAME_IDS = [1, 2, 3, 4];

export const useGameStore = create<GameStore>((set, get) => ({
  currentGameIndex: 0,
  scores: [],
  isPlaying: false,
  gameSequence: [],
  gameStatus: 'waiting',
  reactionTimes: [],

  startGame: () => {
    set({
      currentGameIndex: 0,
      scores: [],
      isPlaying: true,
      gameSequence: shuffleArray(IMPLEMENTED_GAME_IDS),
      gameStatus: 'playing',
    });
  },

  recordScore: (score: GameScore) => {
    set(state => ({
      scores: [...state.scores, score],
      gameStatus: 'completed',
      isPlaying: true
    }));
  },

  nextGame: () => {
    set(state => {
      const nextIndex = state.currentGameIndex + 1;
      const isLastGame = nextIndex >= IMPLEMENTED_GAME_IDS.length;

      return {
        currentGameIndex: nextIndex,
        gameStatus: isLastGame ? 'completed' : 'playing',
        isPlaying: state.isPlaying,
      };
    });
  },

  endGame: () => {
    set({
      isPlaying: false,
      gameStatus: 'completed',
    });
  },

  resetGame: () => {
    set({
      currentGameIndex: 0,
      scores: [],
      isPlaying: false,
      gameSequence: [],
      gameStatus: 'waiting',
      reactionTimes: [],
    });
  },

  addReactionTime: (time: number) => 
    set((state) => ({ 
      reactionTimes: [...state.reactionTimes, time] 
    })),
})); 