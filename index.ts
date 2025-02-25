import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

// Ensure the app is registered with both Expo and React Native
AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
