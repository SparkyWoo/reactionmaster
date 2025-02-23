export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      leaderboard: {
        Row: {
          id: string
          created_at: string
          nickname: string
          average_time: number
          region: string | null
          game_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          nickname: string
          average_time: number
          region?: string | null
          game_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          nickname?: string
          average_time?: number
          region?: string | null
          game_count?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 