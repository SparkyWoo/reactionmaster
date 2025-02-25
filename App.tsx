import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './src/types/navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { View, Platform, LogBox, AppState, AppStateStatus, UIManager } from 'react-native';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import Logger from './src/utils/logger';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

// Wrap each screen with gesture handler HOC
const WrappedHomeScreen = gestureHandlerRootHOC(HomeScreen);
const WrappedGameScreen = gestureHandlerRootHOC(GameScreen);
const WrappedResultScreen = gestureHandlerRootHOC(ResultScreen);
const WrappedLeaderboardScreen = gestureHandlerRootHOC(LeaderboardScreen);

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore error */
});

function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      Logger.info('App state changed', { nextAppState });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        Logger.info('Starting app initialization');
        const startTime = Date.now();

        // Load assets
        const assetPromises = Asset.loadAsync([
          require('./assets/icon.png'),
          require('./assets/splash.png'),
        ]);

        // Load fonts if needed
        const fontPromises = Font.loadAsync({});

        // Wait for all resources
        await Promise.all([assetPromises, fontPromises]);

        const loadTime = Date.now() - startTime;
        Logger.info(`App initialization completed in ${loadTime}ms`);
        
        setAssetsLoaded(true);
        setFontsLoaded(true);
        setAppIsReady(true);
      } catch (e) {
        Logger.error('Error during app preparation', { error: e });
        setAppIsReady(true); // Still set ready to prevent infinite loading
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        Logger.error('Error hiding splash screen', { error: e });
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View 
            style={{ 
              flex: 1, 
              backgroundColor: '#1a1a1a' 
            }} 
            onLayout={onLayoutRootView}
          >
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  animation: 'fade',
                  animationDuration: 200,
                  gestureEnabled: false,
                  contentStyle: {
                    backgroundColor: '#1a1a1a'
                  }
                }}
              >
                <Stack.Screen 
                  name="Home" 
                  component={WrappedHomeScreen}
                />
                <Stack.Screen 
                  name="Game" 
                  component={WrappedGameScreen}
                />
                <Stack.Screen 
                  name="Result" 
                  component={WrappedResultScreen}
                />
                <Stack.Screen 
                  name="Leaderboard" 
                  component={WrappedLeaderboardScreen}
                />
              </Stack.Navigator>
              <StatusBar style="light" />
            </NavigationContainer>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default App;
