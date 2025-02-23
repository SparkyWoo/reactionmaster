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
import { MIN_REACTION_TIME, PENALTY_MULTIPLIER, TARGET_SIZE } from '../../constants/gameConstants';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Safe area margins to keep targets away from edges
const MARGIN = {
  TOP: 150,
  BOTTOM: 100,
  HORIZONTAL: 50,
};

// Calculate actual playable area
const PLAY_AREA = {
  minX: MARGIN.HORIZONTAL,
  maxX: SCREEN_WIDTH - MARGIN.HORIZONTAL - TARGET_SIZE,
  minY: MARGIN.TOP,
  maxY: SCREEN_HEIGHT - MARGIN.BOTTOM - TARGET_SIZE,
};

const MOVE_DURATION = 1000;
const INITIAL_DELAY = 1000;

interface MovingTargetProps {
  onGameComplete: (score: GameScore) => void;
  gameId: number;
}

export default function MovingTarget({ onGameComplete, gameId }: MovingTargetProps): JSX.Element {
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [isTargetVisible, setIsTargetVisible] = useState<boolean>(false);
  const [penalties, setPenalties] = useState<number>(0);
  const [isGameComplete, setIsGameComplete] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const moveTimeoutRef = useRef<NodeJS.Timeout>();
  const isMounted = useRef(true);

  const opacity = useSharedValue<number>(0);
  const scale = useSharedValue<number>(0.3);
  const translateX = useSharedValue<number>(0);
  const translateY = useSharedValue<number>(0);

  // Reset all state when component mounts
  useEffect(() => {
    isMounted.current = true;
    setIsGameComplete(false);
    setIsTargetVisible(false);
    setPenalties(0);
    setGameStartTime(0);
    opacity.value = 0;
    scale.value = 0.3;
    translateX.value = 0;
    translateY.value = 0;

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
    };
  }, []);

  const getRandomPosition = useCallback(() => {
    // Ensure the target stays within the playable area
    const x = Math.random() * (PLAY_AREA.maxX - PLAY_AREA.minX) + PLAY_AREA.minX;
    const y = Math.random() * (PLAY_AREA.maxY - PLAY_AREA.minY) + PLAY_AREA.minY;
    
    return { x, y };
  }, []);

  const moveTarget = useCallback(() => {
    if (isGameComplete || !isMounted.current) return;

    const newPosition = getRandomPosition();
    translateX.value = withTiming(newPosition.x, { duration: MOVE_DURATION });
    translateY.value = withTiming(newPosition.y, { duration: MOVE_DURATION });

    moveTimeoutRef.current = setTimeout(moveTarget, MOVE_DURATION);
  }, [translateX, translateY, isGameComplete, getRandomPosition]);

  const startGame = useCallback(() => {
    if (isGameComplete || !isMounted.current) return;

    const initialPosition = getRandomPosition();
    translateX.value = initialPosition.x;
    translateY.value = initialPosition.y;

    timeoutRef.current = setTimeout(() => {
      if (!isGameComplete && isMounted.current) {
        setGameStartTime(Date.now());
        setIsTargetVisible(true);
        opacity.value = withSpring(1, theme.animation.spring.default);
        scale.value = withSpring(1, theme.animation.spring.default);
        moveTarget();
      }
    }, INITIAL_DELAY);
  }, [opacity, scale, translateX, translateY, isGameComplete, getRandomPosition, moveTarget]);

  useEffect(() => {
    if (!isGameComplete) {
      startGame();
    }
  }, [startGame, isGameComplete]);

  const handleTargetPress = useCallback((): void => {
    if (!isTargetVisible || isGameComplete || !isMounted.current) return;

    const endTime = Date.now();
    const reactionTime = endTime - gameStartTime;
    
    if (reactionTime < MIN_REACTION_TIME) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsGameComplete(true);
    setIsTargetVisible(false);

    opacity.value = withTiming(0);
    scale.value = withTiming(0.3);
    if (isMounted.current) {
      onGameComplete({
        gameId,
        time: reactionTime,
        penalties,
        finalScore: reactionTime * (penalties > 0 ? PENALTY_MULTIPLIER : 1),
      });
    }
  }, [isTargetVisible, isGameComplete, gameStartTime, penalties, opacity, scale, onGameComplete, gameId]);

  const handleScreenPress = useCallback((): void => {
    if (!isTargetVisible || isGameComplete) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setPenalties(prev => prev + 1);
  }, [isTargetVisible, isGameComplete]);

  const targetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.container} onTouchStart={handleScreenPress}>
      <View style={styles.touchArea}>
        <Animated.View style={[styles.target, targetStyle]}>
          <TouchableWithoutFeedback onPress={handleTargetPress}>
            <View style={styles.targetInner} />
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  touchArea: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  target: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: TARGET_SIZE / 2,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetInner: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: TARGET_SIZE / 2,
    backgroundColor: theme.colors.primary.default,
  },
}); 