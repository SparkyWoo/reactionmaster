import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { RootStackScreenProps } from '@/types/navigation';
import { useGameStore } from '@/store/gameStore';
import { GAMES } from '@/constants/games';
import { TRANSITION_DURATION } from '@/constants/gameConstants';
import { theme } from '@/constants/theme';
import SimpleTap from '../components/games/SimpleTap';
import { GameScore } from '@/types/game';
import DirectionSwipe from '../components/games/DirectionSwipe';
import MovingTarget from '../components/games/MovingTarget';
import ChainReaction from '../components/games/ChainReaction';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function GameScreen({ navigation }: RootStackScreenProps<'Game'>): JSX.Element {
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  const { gameSequence, currentGameIndex, recordScore } = useGameStore();
  const nextGame = useGameStore((state) => state.nextGame);
  const endGame = useGameStore((state) => state.endGame);
  const scores = useGameStore((state) => state.scores);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const gameStatus = useGameStore((state) => state.gameStatus);
  
  // Calculate current average time
  const currentAverageTime = useCallback((): number | null => {
    if (scores.length === 0) return null;
    const validScores = scores.filter(s => s.time > 0 && s.time < Infinity);
    const totalTime = validScores.reduce((sum, s) => sum + s.finalScore, 0);
    return Math.round(totalTime / validScores.length);
  }, [scores]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Safety check - if we're not playing, go back to home
  useEffect(() => {
    if (!isPlaying) {
      navigation.replace('Home');
    }
  }, [isPlaying, navigation]);

  // Error boundary effect
  useEffect(() => {
    if (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      navigation.replace('Home');
    }
  }, [error, navigation]);

  const handleGameComplete = useCallback((score: GameScore): void => {
    try {
      setIsTransitioning(true);
      recordScore(score);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Calculate if this was the last game
      const isLastGame = currentGameIndex === gameSequence.length - 1;
      
      // Short delay before transitioning
      transitionTimeoutRef.current = setTimeout(() => {
        if (isLastGame) {
          // Calculate average including the current score
          const allScores = [...scores, score];
          const validScores = allScores.filter(s => s.time > 0 && s.time < Infinity);
          const totalTime = validScores.reduce((sum, s) => sum + s.finalScore, 0);
          const averageTime = Math.round(totalTime / validScores.length);
          
          navigation.replace('Result', {
            averageTime,
            showLeaderboard: true,
          });
          // End the game after navigation
          endGame();
        } else {
          nextGame();
          setIsTransitioning(false);
        }
      }, TRANSITION_DURATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [recordScore, nextGame, endGame, scores, navigation, currentGameIndex, gameSequence.length]);

  const renderGame = useCallback((): JSX.Element => {
    if (isTransitioning) {
      const isLastGame = currentGameIndex === gameSequence.length - 1;
      return (
        <View style={styles.placeholder}>
          <ActivityIndicator size="large" color={theme.colors.primary.default} />
          <Text style={styles.transitionText}>
            {isLastGame ? 'Calculating final score...' : 'Get ready for the next game...'}
          </Text>
        </View>
      );
    }

    // Show loading state while game sequence is being initialized
    if (!gameSequence.length || gameStatus === 'waiting') {
      return (
        <View style={styles.placeholder}>
          <ActivityIndicator size="large" color={theme.colors.primary.default} />
          <Text style={styles.transitionText}>
            Preparing games...
          </Text>
        </View>
      );
    }

    try {
      // Get the game ID from sequence and find the corresponding game
      const gameId = gameSequence[currentGameIndex];
      const currentGameObj = GAMES.find(game => game.id === gameId);
      
      if (!currentGameObj) {
        throw new Error('Invalid game');
      }

      const GameComponent = currentGameObj.component;
      return (
        <ErrorBoundary>
          <GameComponent
            gameId={currentGameObj.id}
            onGameComplete={handleGameComplete}
          />
        </ErrorBoundary>
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error rendering game'));
      return (
        <View style={styles.placeholder}>
          <Text style={styles.errorText}>Loading failed</Text>
        </View>
      );
    }
  }, [isTransitioning, gameSequence, currentGameIndex, handleGameComplete, gameStatus]);

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.errorText}>
            Something went wrong. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get current game object - memoized to prevent recalculation
  const currentGameObj = useMemo(() => 
    gameSequence.length ? 
      GAMES.find(game => game.id === gameSequence[currentGameIndex]) : 
      null
  , [gameSequence, currentGameIndex]);

  const avgTime = currentAverageTime();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.gameCount}>
          Game {currentGameIndex + 1} of {gameSequence.length || '-'}
        </Text>
        {currentGameObj && (
          <>
            <Text style={styles.gameTitle}>{currentGameObj.name}</Text>
            <Text style={styles.gameDescription}>{currentGameObj.description}</Text>
          </>
        )}
        {avgTime !== null && (
          <Text style={styles.averageTime}>
            Current Average: {avgTime}ms
          </Text>
        )}
      </View>
      
      <View style={styles.gameContainer}>
        {renderGame()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.dark,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.dark,
  },
  gameCount: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary.dark,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  gameTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary.dark,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  gameDescription: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.secondary.dark,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  averageTime: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.primary.default,
    textAlign: 'center',
    fontWeight: theme.typography.weights.semibold,
  },
  gameContainer: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  placeholderText: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text.secondary.dark,
    textAlign: 'center',
  },
  transitionText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.secondary.dark,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.error.default,
    textAlign: 'center',
  },
}); 