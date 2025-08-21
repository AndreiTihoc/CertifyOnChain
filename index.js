// Custom entry to ensure polyfills load before expo-router
import './polyfills';
import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
export * from 'expo-router/entry';
