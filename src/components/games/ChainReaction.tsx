import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GameScore } from '../../types/game';
import { MIN_REACTION_TIME, PENALTY_MULTIPLIER } from '../../constants/gameConstants';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TARGET_SIZE = 80;
const CHAIN_LENGTH = 5;
const MIN_DELAY = 50;
const MAX_DELAY = 150;

// Safe area margins to keep targets away from edges
const MARGIN = {
  TOP: 150,
  BOTTOM: 100,
  HORIZONTAL: 50,
};

// Calculate actual playable area
const PLAY_AREA = {
  minX: MARGIN.HORIZONTAL + TARGET_SIZE,
  maxX: SCREEN_WIDTH - MARGIN.HORIZONTAL - TARGET_SIZE,
  minY: MARGIN.TOP + TARGET_SIZE,
  maxY: SCREEN_HEIGHT - MARGIN.BOTTOM - TARGET_SIZE,
};

interface TargetPosition {
  x: number;
  y: number;
}

interface ChainReactionProps {
  onGameComplete: (score: GameScore) => void;
  gameId: number;
}

export default function ChainReaction({ onGameComplete, gameId }: ChainReactionProps): JSX.Element {
  const [currentTarget, setCurrentTarget] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [penalties, setPenalties] = useState<number>(0);
  const [isGameComplete, setIsGameComplete] = useState<boolean>(false);
  const [positions, setPositions] = useState<TargetPosition[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const chainTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const targetOpacity = useSharedValue(0);
  const targetScale = useSharedValue(0.3);

  const targetStyle = useAnimatedStyle(() => ({
    opacity: targetOpacity.value,
    transform: [{ scale: targetScale.value }],
  }));

  const generateTargetPositions = useCallback((): void => {
    const newPositions: TargetPosition[] = [];
    const playWidth = PLAY_AREA.maxX - PLAY_AREA.minX;
    const playHeight = PLAY_AREA.maxY - PLAY_AREA.minY;
    
    // Create a grid for more even distribution
    const gridSize = Math.ceil(Math.sqrt(CHAIN_LENGTH));
    const cellWidth = playWidth / gridSize;
    const cellHeight = playHeight / gridSize;

    for (let i = 0; i < CHAIN_LENGTH; i++) {
      // Get grid position
      const gridX = i % gridSize;
      const gridY = Math.floor(i / gridSize);

      // Add random offset within grid cell
      const x = PLAY_AREA.minX + (gridX * cellWidth) + (Math.random() * (cellWidth - TARGET_SIZE));
      const y = PLAY_AREA.minY + (gridY * cellHeight) + (Math.random() * (cellHeight - TARGET_SIZE));

      newPositions.push({ x, y });
    }

    // Shuffle positions
    for (let i = newPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newPositions[i], newPositions[j]] = [newPositions[j], newPositions[i]];
    }

    setPositions(newPositions);
  }, []);

  useEffect(() => {
    return () => {
      targetOpacity.value = 0;
      targetScale.value = 0.3;
    };
  }, [targetOpacity, targetScale]);

  const showNextTarget = useCallback((index: number): void => {
    if (isGameComplete) return;

    if (index === 0) {
      setGameStartTime(Date.now());
    }

    setCurrentTarget(index);
    targetOpacity.value = withSpring(1, theme.animation.spring.default);
    targetScale.value = withSpring(1, theme.animation.spring.default);
  }, [targetOpacity, targetScale, isGameComplete]);

  const startChain = useCallback((): void => {
    generateTargetPositions();
    const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
    const timeout = setTimeout(() => {
      showNextTarget(0);
    }, delay);
    chainTimeoutsRef.current.push(timeout);
  }, [generateTargetPositions, showNextTarget]);

  useEffect(() => {
    startChain();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      chainTimeoutsRef.current.forEach(timeout => {
        clearTimeout(timeout);
      });
      chainTimeoutsRef.current = [];
      setIsGameComplete(true);
    };
  }, [startChain]);

  const handleTargetPress = useCallback((index: number): void => {
    if (isGameComplete || index !== currentTarget) {
      if (!isGameComplete) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPenalties(prev => prev + 1);
      }
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    targetOpacity.value = withTiming(0);
    targetScale.value = withTiming(0.3);

    if (index === CHAIN_LENGTH - 1) {
      const endTime = Date.now();
      const reactionTime = endTime - gameStartTime;
      
      if (reactionTime < MIN_REACTION_TIME) return;

      setIsGameComplete(true);
      onGameComplete({
        gameId,
        time: reactionTime,
        penalties,
        finalScore: reactionTime * (penalties > 0 ? PENALTY_MULTIPLIER : 1),
      });
    } else {
      const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
      timeoutRef.current = setTimeout(() => {
        showNextTarget(index + 1);
      }, delay);
    }
  }, [currentTarget, isGameComplete, gameStartTime, penalties, targetOpacity, targetScale, showNextTarget, onGameComplete, gameId]);

  return (
    <View style={styles.container}>
      {positions.map((position, index) => (
        <TouchableWithoutFeedback
          key={index}
          onPress={() => handleTargetPress(index)}
          style={[
            styles.targetHitArea,
            {
              left: position.x - TARGET_SIZE / 2,
              top: position.y - TARGET_SIZE / 2,
              opacity: index === currentTarget ? 1 : 0,
            },
          ]}
        >
          <Animated.View 
            style={[
              styles.target,
              targetStyle,
            ]} 
          />
        </TouchableWithoutFeedback>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.dark,
  },
  targetHitArea: {
    position: 'absolute',
    width: TARGET_SIZE * 2,
    height: TARGET_SIZE * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  target: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: TARGET_SIZE / 2,
    backgroundColor: theme.colors.primary.default,
  },
}); 