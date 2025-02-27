import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GameScore } from '../../types/game';
import { MIN_REACTION_TIME, PENALTY_MULTIPLIER } from '../../constants/gameConstants';
import { theme } from '../../constants/theme';
import Logger from '../../utils/logger';

// Get screen dimensions
const windowDimensions = Dimensions.get('window');
const screenDimensions = Dimensions.get('screen');

// Log dimensions for debugging
Logger.debug('SimpleTap: Dimensions', {
  window: windowDimensions,
  screen: screenDimensions
});

// Use the smaller of the two dimensions to be safe
const SCREEN_WIDTH = Math.min(windowDimensions.width, screenDimensions.width);
const SCREEN_HEIGHT = Math.min(windowDimensions.height, screenDimensions.height);

// Very large target size for guaranteed visibility
const TARGET_SIZE = 100;

// Timing constants
const MIN_DELAY = 500; // Minimum delay before showing target
const MAX_DELAY = 2000; // Maximum delay before showing target

interface SimpleTapProps {
  onGameComplete: (score: GameScore) => void;
  gameId: number;
}

export default function SimpleTap({ onGameComplete, gameId }: SimpleTapProps): JSX.Element {
  const [gameStartTime, setGameStartTime] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [targetVisible, setTargetVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Show target in center position
  const showTarget = useCallback(() => {
    if (isComplete) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Hide target
    setTargetVisible(false);

    // Show target after random delay (0.5-2 seconds)
    const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
    
    Logger.debug('SimpleTap: Scheduling target to appear', { delay });
    
    timeoutRef.current = setTimeout(() => {
      if (!isComplete) {
        Logger.debug('SimpleTap: Showing target');
        setGameStartTime(Date.now());
        setTargetVisible(true);
      }
    }, delay);
  }, [isComplete]);

  // Start game on mount
  useEffect(() => {
    Logger.debug('SimpleTap: Game initialized');
    setIsComplete(false);
    setPenalties(0);
    setGameStartTime(0);
    showTarget();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showTarget]);

  const handleScreenPress = useCallback(() => {
    if (!targetVisible && !isComplete) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPenalties(prev => prev + 1);
      Logger.debug('SimpleTap: Missed tap, penalty added', { penalties: penalties + 1 });
    }
  }, [targetVisible, isComplete, penalties]);

  const handleTargetPress = useCallback(() => {
    if (!targetVisible || isComplete) return;

    const endTime = Date.now();
    const reactionTime = endTime - gameStartTime;
    
    if (reactionTime < MIN_REACTION_TIME) return;

    Logger.debug('SimpleTap: Target pressed', { reactionTime });
    
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsComplete(true);
    setTargetVisible(false);
    
    onGameComplete({
      gameId,
      time: reactionTime,
      penalties,
      finalScore: reactionTime * (penalties > 0 ? PENALTY_MULTIPLIER : 1),
    });
  }, [targetVisible, isComplete, gameStartTime, penalties, onGameComplete, gameId]);

  return (
    <View style={styles.container} onTouchStart={handleScreenPress}>
      {/* Center target */}
      {targetVisible && (
        <TouchableOpacity 
          style={styles.target}
          onPress={handleTargetPress}
          activeOpacity={0.8}
        >
          <View style={styles.targetInner} />
        </TouchableOpacity>
      )}
      
      {/* Debug indicator */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            {targetVisible ? 'Target Visible' : 'Target Hidden'}
          </Text>
          <Text style={styles.debugText}>
            Center: {Math.round(SCREEN_WIDTH/2)}, {Math.round(SCREEN_HEIGHT/2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  target: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: TARGET_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    // Add shadow for better visibility
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  targetInner: {
    width: TARGET_SIZE * 0.8,
    height: TARGET_SIZE * 0.8,
    borderRadius: (TARGET_SIZE * 0.8) / 2,
    backgroundColor: theme.colors.primary.default,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  // Debug styles
  debugContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
}); 