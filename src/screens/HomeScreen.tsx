import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { RootStackScreenProps } from '@/types/navigation';
import { useGameStore } from '@/store/gameStore';
import { theme } from '@/constants/theme';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen({ navigation }: RootStackScreenProps<'Home'>): JSX.Element {
  const startGame = useGameStore((state) => state.startGame);
  const startScale = useSharedValue(1);
  const leaderboardScale = useSharedValue(1);
  const leaderboardRotate = useSharedValue(0);

  const handleStartGame = useCallback((): void => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startScale.value = withSequence(
      withSpring(theme.animation.scale.press),
      withSpring(1, theme.animation.spring.bouncy)
    );
    startGame();
    navigation.navigate('Game');
  }, [startGame, navigation, startScale]);

  const handleLeaderboard = useCallback((): void => {
    void Haptics.selectionAsync();
    leaderboardScale.value = withSequence(
      withSpring(theme.animation.scale.press),
      withSpring(1, theme.animation.spring.bouncy)
    );
    leaderboardRotate.value = withSequence(
      withTiming(15, { duration: theme.animation.timing.fast }),
      withSpring(0, theme.animation.spring.gentle)
    );
    navigation.navigate('Leaderboard');
  }, [navigation, leaderboardScale, leaderboardRotate]);

  const startButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startScale.value }]
  }));

  const leaderboardButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leaderboardScale.value }]
  }));

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${leaderboardRotate.value}deg` }]
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(theme.animation.timing.normal)}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reaction</Text>
          <Text style={styles.titleAccent}>Master</Text>
          <View style={styles.subtitleContainer}>
            <Ionicons name="game-controller" size={20} color={theme.colors.primary.default} />
            <Text style={styles.subtitle}>Gaming & Sports Training</Text>
          </View>
        </View>

        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Ionicons name="game-controller" size={24} color={theme.colors.primary.default} />
            <Text style={styles.benefitText}>
              Enhance gaming reflexes for competitive play
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="basketball" size={24} color={theme.colors.primary.default} />
            <Text style={styles.benefitText}>
              Improve sports reaction time and agility
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <AnimatedPressable 
            style={[styles.button, startButtonStyle]} 
            onPress={handleStartGame}
          >
            <Ionicons name="play" size={24} color={theme.colors.text.primary.dark} />
            <Text style={styles.buttonText}>Start Challenge</Text>
          </AnimatedPressable>

          <AnimatedPressable 
            style={[styles.button, styles.secondaryButton, leaderboardButtonStyle]} 
            onPress={handleLeaderboard}
          >
            <Animated.View style={trophyStyle}>
              <Ionicons name="trophy" size={24} color={theme.colors.primary.default} />
            </Animated.View>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Leaderboard
            </Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.component.container.paddingX,
    paddingVertical: theme.spacing.component.container.paddingY,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.typography.fonts.primary,
    fontSize: theme.typography.sizes['3xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary.dark,
    textAlign: 'center',
    letterSpacing: theme.typography.letterSpacing.tight,
    lineHeight: theme.typography.sizes['3xl'] * theme.typography.lineHeights.tight,
  },
  titleAccent: {
    fontFamily: theme.typography.fonts.primary,
    fontSize: theme.typography.sizes['4xl'],
    fontWeight: theme.typography.weights.heavy,
    color: theme.colors.primary.default,
    marginTop: -theme.spacing.xs,
    textAlign: 'center',
    letterSpacing: theme.typography.letterSpacing.tight,
    lineHeight: theme.typography.sizes['4xl'] * theme.typography.lineHeights.tight,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface[2],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadow.sm,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary.dark,
    letterSpacing: theme.typography.letterSpacing.wide,
  },
  benefits: {
    width: '100%',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface[1],
    padding: theme.spacing.component.card.padding,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadow.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary.dark,
    lineHeight: theme.typography.sizes.md * theme.typography.lineHeights.normal,
  },
  actions: {
    width: '100%',
    gap: theme.spacing.md,
    marginTop: 'auto',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.default,
    height: theme.spacing.component.button.height,
    paddingHorizontal: theme.spacing.component.button.paddingX,
    gap: theme.spacing.component.button.gap,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadow.md,
  },
  buttonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary.dark,
    letterSpacing: theme.typography.letterSpacing.button,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface[2],
    borderWidth: 1,
    borderColor: theme.colors.primary.default,
  },
  secondaryButtonText: {
    color: theme.colors.primary.default,
  },
}); 