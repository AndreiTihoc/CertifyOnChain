import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Certificate } from '../types/certificate';
import { VerifiedBadge } from './VerifiedBadge';

interface CertificateCardProps {
  certificate: Certificate;
  onPress?: () => void;
  index?: number;
}

export function CertificateCard({ certificate, onPress, index = 0 }: CertificateCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        type: 'timing',
        duration: 600,
        delay: index * 100 
      }}
      className="mb-4"
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={['#00f5d4', '#ff3cac', '#ff006e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-0.5 rounded-2xl"
        >
          <View className="bg-gray-900 rounded-2xl p-4">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-white text-lg font-bold mb-1">
                  🎓 {certificate.title}
                </Text>
                <Text className="text-gray-300 text-sm mb-1">
                  🏫 {certificate.issuer}
                </Text>
                <Text className="text-gray-400 text-xs">
                  📅 {new Date(certificate.dateIssued).toLocaleDateString()}
                </Text>
              </View>
              <VerifiedBadge isVerified={certificate.isVerified} />
            </View>
            {certificate.description && (
              <Text className="text-gray-300 text-sm mt-2 opacity-80">
                {certificate.description}
              </Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );
}