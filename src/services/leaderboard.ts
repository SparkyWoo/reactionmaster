import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { LeaderboardEntry } from '../types/game';

type LeaderboardRow = Database['public']['Tables']['leaderboard']['Row'];
type LeaderboardInsert = Database['public']['Tables']['leaderboard']['Insert'];

const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 20;

export async function submitScore(data: LeaderboardInsert): Promise<LeaderboardEntry | null> {
  try {
    const nickname = data.nickname.trim();
    
    // Validate nickname length
    if (nickname.length < NICKNAME_MIN_LENGTH || nickname.length > NICKNAME_MAX_LENGTH) {
      throw new Error(`Nickname must be between ${NICKNAME_MIN_LENGTH} and ${NICKNAME_MAX_LENGTH} characters`);
    }

    // Remove any extra whitespace and special characters
    const sanitizedNickname = nickname.replace(/[^\w\s-]/g, '');

    const { data: result, error } = await supabase
      .from('leaderboard')
      .insert({ ...data, nickname: sanitizedNickname })
      .select()
      .single();

    if (error) throw error;
    if (!result) return null;

    return {
      id: result.id,
      nickname: result.nickname,
      averageTime: result.average_time,
      region: result.region || 'unknown',
      createdAt: new Date(result.created_at),
    };
  } catch (error) {
    console.error('Error submitting score:', error);
    return null;
  }
}

export async function getLeaderboard(
  timeFilter: 'all' | 'monthly' | 'weekly' = 'all',
  region?: string | null,
  limit = 100
): Promise<LeaderboardEntry[]> {
  try {
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('average_time', { ascending: true })
      .limit(limit);

    if (region) {
      query = query.eq('region', region);
    }

    if (timeFilter === 'monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('created_at', thirtyDaysAgo.toISOString());
    } else if (timeFilter === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte('created_at', sevenDaysAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map((row: LeaderboardRow): LeaderboardEntry => ({
      id: row.id,
      nickname: row.nickname,
      averageTime: row.average_time,
      region: row.region || 'unknown',
      createdAt: new Date(row.created_at),
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export async function getTopScore(
  region?: string | null
): Promise<number | null> {
  try {
    const query = supabase
      .from('leaderboard')
      .select('average_time')
      .order('average_time', { ascending: true })
      .limit(1);

    if (region) {
      query.eq('region', region);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.[0]?.average_time || null;
  } catch (error) {
    console.error('Error fetching top score:', error);
    return null;
  }
} 