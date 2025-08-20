import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// @ts-ignore - types may not be bundled with the module depending on version
import * as NavigationBar from 'expo-navigation-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import '../global.css';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Align Android navigation bar styling with app theme & optionally auto-hide.
    (async () => {
      try {
        await NavigationBar.setBackgroundColorAsync('#0f0f1a');
        await NavigationBar.setButtonStyleAsync('light');
        // Uncomment the next line for an immersive experience where system nav auto-hides:
        // await NavigationBar.setVisibilityAsync('leanBack');
      } catch (e) {
        // Non-critical; ignore errors (e.g., on unsupported platforms)
      }
    })();
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
