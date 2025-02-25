import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import Constants from 'expo-constants';
import Logger from '../utils/logger';

// Get environment variables from Expo's Constants
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Log environment variables in development
if (__DEV__) {
  Logger.debug('Supabase Configuration:', {
    url: supabaseUrl ? 'Set' : 'Not Set',
    anonKey: supabaseAnonKey ? 'Set' : 'Not Set',
    source: Constants.expoConfig?.extra ? 'Constants' : 'process.env'
  });
}

// Initialize Supabase client with default values in development
export const supabase = createClient<Database>(
  supabaseUrl || 'https://ieirgyohsrfkktefuhon.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllaXJneW9oc3Jma2t0ZWZ1aG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyODU5MjksImV4cCI6MjA1NTg2MTkyOX0.xqefMIrykp9qW8qNnJXx6KUiGb-_iAbwogRDWQxBp0I',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
); 