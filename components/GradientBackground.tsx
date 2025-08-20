import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientBackground({ children, className = '' }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={['#000000', '#1a1a2e', '#16213e', '#0f0f23']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View className={`flex-1 ${className}`}>
        {children}
      </View>
    </LinearGradient>
  );
}