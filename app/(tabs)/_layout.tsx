import { Tabs } from 'expo-router';
import { Chrome as Home, QrCode, Scan } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: (insets.bottom || 0) + -12,
          backgroundColor: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(18px)', // ignored on native, harmless
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          height: 68,
          paddingBottom: 10,
            paddingTop: 6,
          borderRadius: 26,
          elevation: 16,
          shadowColor: '#34d399',
          shadowOpacity: 0.45,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
        },
        tabBarActiveTintColor: '#34d399',
        tabBarInactiveTintColor: '#4b5563',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: 'QR Code',
          tabBarIcon: ({ size, color }) => (
            <QrCode size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ size, color }) => (
            <Scan size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}