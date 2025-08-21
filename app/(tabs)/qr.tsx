import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { MotiView } from 'moti';
import { Copy } from 'lucide-react-native';
import { GradientBackground } from '../../components/GradientBackground';
import { getStoredIssuerKeypair } from '../../lib/solana/wallet';
import * as Clipboard from 'expo-clipboard';

export default function QRScreen() {
  const [walletKey, setWalletKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const kp = await getStoredIssuerKeypair();
        if (kp) setWalletKey(kp.publicKey.toBase58());
      } catch {}
    })();
  }, []);

  const copyToClipboard = async () => {
  if (!walletKey) return;
  await Clipboard.setStringAsync(walletKey);
  Alert.alert('Copied!', 'Wallet address copied to clipboard');
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4 justify-center items-center">
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800 }}
            className="mb-8"
          >
            <Text className="text-white text-3xl font-bold text-center mb-2">
              Your Wallet QR
            </Text>
            <Text className="text-gray-300 text-center px-4">
              Share this QR code so others can verify your certificates
            </Text>
          </MotiView>

          {/* QR Code */}
          <MotiView
            from={{ scale: 0, rotate: '180deg' }}
            animate={{ scale: 1, rotate: '0deg' }}
            transition={{ type: 'spring', duration: 1000, delay: 300 }}
            className="mb-8"
          >
            <View className="bg-white p-6 rounded-3xl shadow-lg">
              <QRCode
                value={walletKey || 'NoWallet'}
                size={250}
                color="#000"
                backgroundColor="#fff"
                logo={require('../../assets/images/icon.png')}
                logoSize={40}
                logoBackgroundColor="transparent"
              />
            </View>
          </MotiView>

          {/* Wallet Address */}
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 600 }}
            className="mb-6"
          >
            <Text className="text-gray-300 text-center mb-2 text-sm">
              Wallet Address:
            </Text>
            {walletKey ? (
              <Text className="text-white text-center font-mono text-xs bg-gray-800 px-4 py-2 rounded-lg">
                {walletKey.slice(0, 20)}...{walletKey.slice(-10)}
              </Text>
            ) : (
              <Text className="text-gray-500 text-center font-mono text-xs bg-gray-800 px-4 py-2 rounded-lg">
                No wallet yet
              </Text>
            )}
          </MotiView>

          {/* Copy Button */}
          <MotiView
            from={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 900 }}
          >
            <TouchableOpacity
              onPress={copyToClipboard}
              disabled={!walletKey}
              className="bg-neon-blue px-6 py-3 rounded-full flex-row items-center"
              activeOpacity={0.8}
            >
              <Copy size={20} color="#fff" />
              <Text className="text-white font-bold ml-2">{walletKey ? 'Copy Address' : 'No Wallet'}</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}