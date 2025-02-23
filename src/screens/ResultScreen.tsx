import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  BounceIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  Layout,
  FadeIn,
} from 'react-native-reanimated';
import type { RootStackScreenProps } from '@/types/navigation';
import { useGameStore } from '@/store/gameStore';
import { theme } from '@/constants/theme';
import { submitScore } from '@/services/leaderboard';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ResultScreen({ 
  navigation,
  route 
}: RootStackScreenProps<'Result'>): JSX.Element {
  const [nickname, setNickname] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const resetGame = useGameStore((state) => state.resetGame);
  const { averageTime, showLeaderboard } = route.params;

  const scoreScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const handlePlayAgain = useCallback((): void => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    buttonScale.value = withSpring(theme.animation.scale.press, {}, () => {
      buttonScale.value = withSpring(1, theme.animation.spring.bouncy);
    });
    resetGame();
    navigation.navigate('Home');
  }, [resetGame, navigation, buttonScale]);

  const handleShare = useCallback(async (): Promise<void> => {
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      buttonScale.value = withSpring(theme.animation.scale.press, {}, () => {
        buttonScale.value = withSpring(1, theme.animation.spring.bouncy);
      });
      await Share.share({
        message: `🎮 Just scored ${averageTime.toFixed(0)}ms average reaction time in ReactionMaster! Can you beat my score? 🏆`,
      });
    } catch (error) {
      console.error('Error sharing result:', error);
    }
  }, [averageTime, buttonScale]);

  const handleSubmitScore = useCallback(async (): Promise<void> => {
    if (!nickname.trim()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Enter Nickname', 'Please enter a nickname to submit your score');
      return;
    }

    try {
      setIsSubmitting(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const result = await submitScore({
        nickname: nickname.trim(),
        average_time: averageTime,
        game_count: 6,
        region: 'US',
      });

      if (result) {
        setHasSubmitted(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '🎉 Score Submitted!',
          'Your score has been added to the leaderboard.',
          [{ text: 'View Leaderboard', onPress: () => navigation.navigate('Leaderboard') }]
        );
      } else {
        throw new Error('Failed to submit score');
      }
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [nickname, averageTime, navigation]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }]
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={styles.content} 
        entering={FadeIn.duration(theme.animation.timing.normal)}
      >
        <Animated.View 
          entering={BounceIn.delay(300)}
          layout={Layout.springify()}
          style={[styles.scoreContainer, scoreStyle]}
        >
          <Text style={styles.scoreLabel}>Average Reaction Time</Text>
          <Text style={styles.score}>{averageTime.toFixed(0)}ms</Text>
          <View style={styles.medalContainer}>
            <Ionicons 
              name={averageTime < 250 ? "medal" : averageTime < 350 ? "trophy" : "star"} 
              size={32} 
              color={theme.colors.primary.default} 
            />
          </View>
        </Animated.View>

        {!hasSubmitted && (
          <Animated.View 
            entering={FadeInDown.delay(600)}
            layout={Layout.springify()}
            style={styles.submitSection}
          >
            <Text style={styles.submitTitle}>Submit to Leaderboard</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color={theme.colors.text.secondary.dark} />
              <TextInput
                style={styles.input}
                placeholder="Enter your nickname (2-20 characters)"
                placeholderTextColor={theme.colors.text.secondary.dark}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
            </View>
            <Text style={styles.inputHint}>Only letters, numbers, spaces and hyphens allowed</Text>
            <AnimatedTouchableOpacity
              style={[styles.button, styles.submitButton, buttonStyle]}
              onPress={handleSubmitScore}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.text.primary.dark} />
              ) : (
                <>
                  <Ionicons name="trophy" size={20} color={theme.colors.text.primary.dark} />
                  <Text style={styles.buttonText}>Submit Score</Text>
                </>
              )}
            </AnimatedTouchableOpacity>
          </Animated.View>
        )}
        
        <Animated.View 
          entering={FadeInUp.delay(900)}
          layout={Layout.springify()}
          style={styles.bottomActions}
        >
          <AnimatedTouchableOpacity 
            style={[styles.button, buttonStyle]}
            onPress={handlePlayAgain}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.text.primary.dark} />
            <Text style={styles.buttonText}>Play Again</Text>
          </AnimatedTouchableOpacity>

          <AnimatedTouchableOpacity 
            style={[styles.button, styles.secondaryButton, buttonStyle]}
            onPress={() => navigation.navigate('Leaderboard')}
            activeOpacity={0.8}
          >
            <Ionicons name="podium" size={20} color={theme.colors.primary.default} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              View Leaderboard
            </Text>
          </AnimatedTouchableOpacity>

          <AnimatedTouchableOpacity 
            style={[styles.button, styles.tertiaryButton, buttonStyle]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social" size={20} color={theme.colors.secondary.default} />
            <Text style={[styles.buttonText, styles.tertiaryButtonText]}>
              Share Result
            </Text>
          </AnimatedTouchableOpacity>
        </Animated.View>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.component.container.paddingX,
    paddingVertical: theme.spacing.component.container.paddingY,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface[2],
    padding: theme.spacing.component.card.padding,
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    ...theme.shadow.md,
  },
  scoreLabel: {
    fontFamily: theme.typography.fonts.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary.dark,
    marginBottom: theme.spacing.sm,
    letterSpacing: theme.typography.letterSpacing.wide,
  },
  score: {
    fontFamily: theme.typography.fonts.primary,
    fontSize: theme.typography.sizes['3xl'],
    fontWeight: theme.typography.weights.heavy,
    color: theme.colors.text.primary.dark,
    marginBottom: theme.spacing.md,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  medalContainer: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface[3],
    borderRadius: theme.borderRadius.full,
    ...theme.shadow.sm,
  },
  submitSection: {
    width: '100%',
    alignItems: 'center',
  },
  submitTitle: {
    fontFamily: theme.typography.fonts.primary,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary.dark,
    marginBottom: theme.spacing.lg,
    letterSpacing: theme.typography.letterSpacing.normal,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface[2],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    width: '100%',
    minHeight: theme.spacing.component.button.height,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  input: {
    flex: 1,
    color: theme.colors.text.primary.dark,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.primary,
  },
  bottomActions: {
    width: '100%',
    gap: theme.spacing.md,
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
    fontFamily: theme.typography.fonts.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary.dark,
    letterSpacing: theme.typography.letterSpacing.button,
  },
  submitButton: {
    backgroundColor: theme.colors.success.default,
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface[2],
    borderWidth: 1,
    borderColor: theme.colors.primary.default,
  },
  secondaryButtonText: {
    color: theme.colors.primary.default,
  },
  tertiaryButton: {
    backgroundColor: theme.colors.surface[2],
    borderWidth: 1,
    borderColor: theme.colors.secondary.default,
  },
  tertiaryButtonText: {
    color: theme.colors.secondary.default,
  },
  inputHint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary.dark,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
}); 