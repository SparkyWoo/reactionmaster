import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { GameScore } from '../../types/game';
import { MIN_REACTION_TIME, PENALTY_MULTIPLIER } from '../../constants/gameConstants';
import { theme } from '../../constants/theme';

type Direction = 'up' | 'down' | 'left' | 'right';
const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const ARROW_SIZE = 60;
const SWIPE_THRESHOLD = 40;
const ANIMATION_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
  useNativeDriver: true,
};

const MIN_DELAY = 300;
const MAX_DELAY = 1200;

interface DirectionSwipeProps {
  onGameComplete: (score: GameScore) => void;
  gameId: number;
}

const Arrow = memo(({ direction }: { direction: Direction }) => {
  const getIconName = () => {
    switch (direction) {
      case 'up':
        return 'arrow-up-circle';
      case 'down':
        return 'arrow-down-circle';
      case 'left':
        return 'arrow-back-circle';
      case 'right':
        return 'arrow-forward-circle';
      default:
        return 'arrow-up-circle';
    }
  };

  return (
    <View style={styles.arrowContainer}>
      <Ionicons
        name={getIconName()}
        size={ARROW_SIZE}
        color={theme.colors.primary.default}
      />
    </View>
  );
});

export default function DirectionSwipe({ onGameComplete, gameId }: DirectionSwipeProps): JSX.Element {
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [isTargetVisible, setIsTargetVisible] = useState<boolean>(false);
  const [penalties, setPenalties] = useState<number>(0);
  const [isGameComplete, setIsGameComplete] = useState<boolean>(false);
  const [targetDirection, setTargetDirection] = useState<Direction>('up');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const opacity = useSharedValue<number>(0);
  const scale = useSharedValue<number>(0.3);
  const translateX = useSharedValue<number>(0);
  const translateY = useSharedValue<number>(0);
  const rotation = useSharedValue<number>(0);

  const getRandomDirection = useCallback((): Direction => {
    return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  }, []);

  useEffect(() => {
    return () => {
      opacity.value = 0;
      scale.value = 0.3;
      translateX.value = 0;
      translateY.value = 0;
      rotation.value = 0;
    };
  }, [opacity, scale, translateX, translateY, rotation]);

  const showTarget = useCallback((): void => {
    if (isGameComplete) return;

    const newDirection = getRandomDirection();
    setTargetDirection(newDirection);

    const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
    
    timeoutRef.current = setTimeout(() => {
      if (!isGameComplete) {
        setGameStartTime(Date.now());
        setIsTargetVisible(true);
        opacity.value = withSpring(1, ANIMATION_CONFIG);
        scale.value = withSpring(1, ANIMATION_CONFIG);
        rotation.value = withSpring(0, ANIMATION_CONFIG);
      }
    }, delay);
  }, [opacity, scale, rotation, isGameComplete, getRandomDirection]);

  useEffect(() => {
    showTarget();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsGameComplete(true);
    };
  }, [showTarget]);

  const handleSwipeComplete = useCallback((swipedDirection: Direction): void => {
    if (!isTargetVisible || isGameComplete) return;

    const endTime = Date.now();
    const reactionTime = endTime - gameStartTime;
    
    if (reactionTime < MIN_REACTION_TIME) return;

    if (swipedDirection !== targetDirection) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPenalties(prev => prev + 1);
      
      rotation.value = withSpring(swipedDirection === 'left' ? -30 : swipedDirection === 'right' ? 30 : 0);
      scale.value = withSpring(0.9, ANIMATION_CONFIG, () => {
        scale.value = withSpring(1, ANIMATION_CONFIG);
      });
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsGameComplete(true);
    setIsTargetVisible(false);

    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.3, { duration: 200 }, () => {
      runOnJS(onGameComplete)({
        gameId,
        time: reactionTime,
        penalties,
        finalScore: reactionTime * (penalties > 0 ? PENALTY_MULTIPLIER : 1),
      });
    });
  }, [isTargetVisible, isGameComplete, gameStartTime, penalties, opacity, scale, rotation, onGameComplete, gameId, targetDirection]);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      translateX.value = 0;
      translateY.value = 0;
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: (event) => {
      const dx = Math.abs(event.translationX);
      const dy = Math.abs(event.translationY);

      let direction: Direction | null = null;

      if (dx > dy && dx > SWIPE_THRESHOLD) {
        direction = event.translationX > 0 ? 'right' : 'left';
      } else if (dy > dx && dy > SWIPE_THRESHOLD) {
        direction = event.translationY > 0 ? 'down' : 'up';
      }

      if (direction) {
        runOnJS(handleSwipeComplete)(direction);
      }

      translateX.value = withSpring(0, ANIMATION_CONFIG);
      translateY.value = withSpring(0, ANIMATION_CONFIG);
    },
  });

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.arrowContainer, arrowStyle]}>
          <Arrow direction={targetDirection} />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.dark,
  },
  arrowContainer: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary.default,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
}); 