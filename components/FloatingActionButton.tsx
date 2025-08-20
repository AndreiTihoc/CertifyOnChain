import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

interface FloatingActionButtonProps {
  onPress: () => void;
}

export function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const insets = useSafeAreaInsets();
  // Tab bar bottom offset = insets.bottom + 12 (current). Tab bar height ~64.
  // We want the FAB to hover just above the tab bar: place center ~ (tab top - 8px).
  const tabBarGap = 12; // matches layout config
  const tabBarHeight = 64;
  const desiredGapAboveTab = -60;
  const bottom = (insets.bottom || 0) + tabBarGap + tabBarHeight + desiredGapAboveTab;
  return (
    <MotiView
      from={{ scale: 0, rotate: '0deg' }}
      animate={{ scale: 1, rotate: '360deg' }}
      transition={{ type: 'spring', delay: 800 }}
      style={{ position: 'absolute', bottom, right: 24, zIndex: 100 }}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} accessibilityLabel="Add Certificate">
        <LinearGradient
          colors={['#00f5d4', '#ff3cac']}
          className="w-14 h-14 rounded-full items-center justify-center shadow-lg"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text className="text-white text-2xl font-bold">+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );
}