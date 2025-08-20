import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

interface FloatingActionButtonProps {
  onPress: () => void;
}

export function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  return (
    <MotiView
      from={{ scale: 0, rotate: '0deg' }}
      animate={{ scale: 1, rotate: '360deg' }}
      transition={{ type: 'spring', delay: 800 }}
      className="absolute bottom-6 right-6"
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
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