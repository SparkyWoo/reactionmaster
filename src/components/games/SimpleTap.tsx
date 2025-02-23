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
import { TARGET_SIZE, MIN_REACTION_TIME, PENALTY_MULTIPLIER } from '../../constants/gameConstants';
import { theme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
const PADDING = 80;

interface SimpleTapProps {
  onGameComplete: (score: GameScore) => void;
  gameId: number;
}

export default function SimpleTap({ onGameComplete, gameId }: SimpleTapProps): JSX.Element {
  const [isTargetVisible, setIsTargetVisible] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isMounted = useRef(true);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  // Reset all state when component mounts
  useEffect(() => {
    isMounted.current = true;
    setIsGameComplete(false);
    setIsTargetVisible(false);
    setPenalties(0);
    setGameStartTime(0);
    opacity.value = 0;
    scale.value = 0.3;

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array ensures this only runs on mount/unmount

  const getRandomPosition = useCallback(() => {
    const maxX = width - PADDING - TARGET_SIZE;
    const maxY = height - PADDING - TARGET_SIZE;
    const minX = PADDING;
    const minY = PADDING + 50;

    return {
      x: Math.floor(Math.random() * (maxX - minX) + minX),
      y: Math.floor(Math.random() * (maxY - minY) + minY),
    };
  }, []);

  const showTarget = useCallback(() => {
    if (isGameComplete || !isMounted.current) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset animation values
    opacity.value = 0;
    scale.value = 0.3;
    setIsTargetVisible(false);

    // Set new random position
    const newPosition = getRandomPosition();
    setPosition(newPosition);

    // Show target after random delay (1-2 seconds)
    const delay = Math.random() * 1000 + 1000;
    timeoutRef.current = setTimeout(() => {
      if (!isGameComplete && isMounted.current) {
        setGameStartTime(Date.now());
        setIsTargetVisible(true);
        opacity.value = withSpring(1);
        scale.value = withSpring(1);
      }
    }, delay);
  }, [opacity, scale, isGameComplete, getRandomPosition]);

  // Start game when component mounts or resets
  useEffect(() => {
    if (!isGameComplete) {
      showTarget();
    }
  }, [showTarget, isGameComplete]);

  const handleScreenPress = useCallback(() => {
    if (!isTargetVisible && !isGameComplete) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPenalties(prev => prev + 1);
    }
  }, [isTargetVisible, isGameComplete]);

  const handleTargetPress = useCallback(() => {
    if (!isTargetVisible || isGameComplete || !isMounted.current) return;

    const endTime = Date.now();
    const reactionTime = endTime - gameStartTime;
    
    if (reactionTime < MIN_REACTION_TIME) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsGameComplete(true);
    setIsTargetVisible(false);
    
    opacity.value = withTiming(0);
    scale.value = withTiming(0.3, undefined, () => {
      if (isMounted.current) {
        runOnJS(onGameComplete)({
          gameId,
          time: reactionTime,
          penalties,
          finalScore: reactionTime * (penalties > 0 ? PENALTY_MULTIPLIER : 1),
        });
      }
    });
  }, [isTargetVisible, isGameComplete, gameStartTime, penalties, opacity, scale, onGameComplete, gameId]);

  const targetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.touchArea} onTouchStart={handleScreenPress}>
        <Animated.View 
          style={[
            styles.target,
            targetStyle,
            {
              left: position.x,
              top: position.y,
            }
          ]}
        >
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
    backgroundColor: theme.colors.background.dark,
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