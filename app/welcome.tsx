import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';

export default function WelcomeScreen() {
  const handleConnectWallet = () => {
    // Navigate to main app (tabs)
    router.replace('/(tabs)');
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1 justify-center items-center px-6">
        {/* Logo */}
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 1000 }}
          className="mb-12"
        >
          <View className="items-center">
            <Text className="text-6xl mb-4">🎓</Text>
            <Text className="text-white text-4xl font-bold text-center mb-2">
              CertifyOnChain
            </Text>
            <Text className="text-gray-300 text-lg text-center">
              Secure • Verifiable • Decentralized
            </Text>
          </View>
        </MotiView>

        {/* Description */}
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 500 }}
          className="mb-12"
        >
          <Text className="text-gray-300 text-center text-lg leading-6">
            Store and verify your certificates on the Solana blockchain.{'\n'}
            Your achievements, forever secured.
          </Text>
        </MotiView>

        {/* Connect Wallet Button */}
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 600, delay: 1000 }}
          className="w-full"
        >
          <TouchableOpacity onPress={handleConnectWallet} activeOpacity={0.8}>
            <LinearGradient
              colors={['#00f5d4', '#ff3cac', '#ff006e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-4 px-8 rounded-2xl"
            >
              <Text className="text-white text-xl font-bold text-center">
                Connect Wallet
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>

        {/* Features */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 1300 }}
          className="mt-12"
        >
          <View className="flex-row justify-around w-full">
            <View className="items-center">
              <Text className="text-2xl mb-2">🔐</Text>
              <Text className="text-gray-400 text-sm">Secure</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl mb-2">✅</Text>
              <Text className="text-gray-400 text-sm">Verified</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl mb-2">🌐</Text>
              <Text className="text-gray-400 text-sm">Global</Text>
            </View>
          </View>
        </MotiView>
      </SafeAreaView>
    </GradientBackground>
  );
}