import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';

interface VerifiedBadgeProps {
  isVerified: boolean;
}

export function VerifiedBadge({ isVerified }: VerifiedBadgeProps) {
  return (
    <MotiView
      from={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 300 }}
    >
      <View className={`px-3 py-1 rounded-full ${isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}>
        <Text className="text-white text-xs font-bold">
          {isVerified ? '✅ Verified' : '⚠️ Unverified'}
        </Text>
      </View>
    </MotiView>
  );
}