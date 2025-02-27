import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { RootStackScreenProps } from '@/types/navigation';
import { theme } from '@/constants/theme';
import { getLeaderboard } from '@/services/leaderboard';
import type { LeaderboardEntry } from '@/types/game';

type TimeFilter = 'all' | 'monthly' | 'weekly';

interface LeaderboardState {
  timeFilter: TimeFilter;
  isLoading: boolean;
  entries: LeaderboardEntry[];
  error: string | null;
}

export default function LeaderboardScreen({ 
  navigation 
}: RootStackScreenProps<'Leaderboard'>): JSX.Element {
  const [state, setState] = useState<LeaderboardState>({
    timeFilter: 'all',
    isLoading: true,
    entries: [],
    error: null,
  });

  const fetchLeaderboard = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const entries = await getLeaderboard(state.timeFilter);
      setState(prev => ({ ...prev, entries, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to load leaderboard'
      }));
    }
  }, [state.timeFilter]);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleBack = useCallback((): void => {
    void Haptics.selectionAsync();
    navigation.goBack();
  }, [navigation]);

  const handleTimeFilterChange = useCallback((timeFilter: TimeFilter): void => {
    void Haptics.selectionAsync();
    setState(prev => ({ ...prev, timeFilter }));
  }, []);

  const renderItem = useCallback(({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={styles.leaderboardItem}>
      <Text style={styles.rank}>#{index + 1}</Text>
      <Text style={styles.nickname}>{item.nickname}</Text>
      <Text style={styles.score}>{Math.round(item.averageTime)}ms</Text>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>Top 50 Players</Text>
        </View>
      </View>
      
      <View style={styles.filters}>
        <View style={styles.filterGroup}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              state.timeFilter === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => handleTimeFilterChange('all')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filterButtonText,
              state.timeFilter === 'all' && styles.filterButtonTextActive,
            ]}>All Time</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              state.timeFilter === 'monthly' && styles.filterButtonActive,
            ]}
            onPress={() => handleTimeFilterChange('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filterButtonText,
              state.timeFilter === 'monthly' && styles.filterButtonTextActive,
            ]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              state.timeFilter === 'weekly' && styles.filterButtonActive,
            ]}
            onPress={() => handleTimeFilterChange('weekly')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filterButtonText,
              state.timeFilter === 'weekly' && styles.filterButtonTextActive,
            ]}>Weekly</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {state.isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary.default} />
        ) : state.error ? (
          <Text style={styles.errorText}>{state.error}</Text>
        ) : state.entries.length === 0 ? (
          <Text style={styles.placeholder}>No scores yet. Be the first!</Text>
        ) : (
          <FlatList
            data={state.entries}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.dark,
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing.lg,
    zIndex: 1,
  },
  backButtonText: {
    color: theme.colors.primary.default,
    fontSize: theme.typography.sizes.lg,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary.dark,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.tertiary.dark,
    marginTop: 2,
  },
  filters: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.dark,
  },
  filterGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.dark,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary.default,
    borderColor: theme.colors.primary.default,
  },
  filterButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary.dark,
  },
  filterButtonTextActive: {
    color: theme.colors.text.primary.dark,
    fontWeight: theme.typography.weights.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  rank: {
    width: 40,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary.dark,
  },
  nickname: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.primary.dark,
  },
  score: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary.dark,
    minWidth: 80,
    textAlign: 'right',
  },
  placeholder: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.secondary.dark,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.error.default,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
}); 