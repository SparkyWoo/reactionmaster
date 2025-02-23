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

interface SimpleTapProps {
  onGameComplete: (score: GameScore) => void;
  gameId: number;
}

export default function SimpleTap({ onGameComplete, gameId }: SimpleTapProps): JSX.Element {
  const [gameStartTime, setGameStartTime] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Use shared values for animation and game state
  const isVisible = useSharedValue(false);
  const isComplete = useSharedValue(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const position = useSharedValue({ x: 0, y: 0 });

  const getRandomPosition = useCallback(() => {
    // Ensure the target stays within the playable area
    const x = Math.random() * (PLAY_AREA.maxX - PLAY_AREA.minX) + PLAY_AREA.minX;
    const y = Math.random() * (PLAY_AREA.maxY - PLAY_AREA.minY) + PLAY_AREA.minY;
    return { x, y };
  }, []);

  const showTarget = useCallback(() => {
    if (isComplete.value) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset animation values
    opacity.value = 0;
    scale.value = 0.3;
    isVisible.value = false;

    // Set new random position
    position.value = getRandomPosition();

    // Show target after random delay (1-2 seconds)
    const delay = Math.random() * 1000 + 1000;
    timeoutRef.current = setTimeout(() => {
      if (!isComplete.value) {
        setGameStartTime(Date.now());
        isVisible.value = true;
        opacity.value = withSpring(1);
        scale.value = withSpring(1);
      }
    }, delay);
  }, [opacity, scale, isVisible, isComplete, position]);

  // Reset and start game on mount
  useEffect(() => {
    isComplete.value = false;
    isVisible.value = false;
    opacity.value = 0;
    scale.value = 0.3;
    setPenalties(0);
    setGameStartTime(0);
    showTarget();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showTarget, isComplete, isVisible, opacity, scale]);

  const handleScreenPress = useCallback(() => {
    if (!isVisible.value && !isComplete.value) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPenalties(prev => prev + 1);
    }
  }, [isVisible, isComplete]);

  const handleTargetPress = useCallback(() => {
    if (!isVisible.value || isComplete.value) return;

    const endTime = Date.now();
    const reactionTime = endTime - gameStartTime;
    
    if (reactionTime < MIN_REACTION_TIME) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    isComplete.value = true;
    isVisible.value = false;
    
    opacity.value = withTiming(0);
    scale.value = withTiming(0.3, undefined, () => {
      runOnJS(onGameComplete)({
        gameId,
        time: reactionTime,
        penalties,
        finalScore: reactionTime * (penalties > 0 ? PENALTY_MULTIPLIER : 1),
      });
    });
  }, [isVisible, isComplete, gameStartTime, penalties, opacity, scale, onGameComplete, gameId]);

  // Separate layout and transform animations
  const layoutStyle = useAnimatedStyle(() => ({
    left: position.value.x,
    top: position.value.y,
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.touchArea} onTouchStart={handleScreenPress}>
        <Animated.View style={[styles.targetWrapper, layoutStyle]}>
          <Animated.View style={[styles.target, animatedStyle]}>
            <TouchableWithoutFeedback onPress={handleTargetPress}>
              <View style={styles.targetInner} />
            </TouchableWithoutFeedback>
          </Animated.View>
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
  targetWrapper: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  },
  target: {
    width: '100%',
    height: '100%',
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