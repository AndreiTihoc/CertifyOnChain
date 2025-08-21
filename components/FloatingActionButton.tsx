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
          colors={['#34d399', '#22d3ee', '#a78bfa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width:56, height:56, borderRadius:32, alignItems:'center', justifyContent:'center', shadowColor:'#34d399', shadowOpacity:0.6, shadowRadius:16, shadowOffset:{ width:0, height:4 } }}
        >
          <Text style={{ color:'#fff', fontSize:30, fontWeight:'700', textShadowColor:'#34d399', textShadowRadius:12 }}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );
}