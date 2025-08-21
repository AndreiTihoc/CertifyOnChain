import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FileCheck2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { getOrCreateIssuerKeypair, resetIssuerKeypair, purgeLegacyStoredKeypair } from '../lib/solana/wallet';
import { GradientBackground } from '../components/GradientBackground';

export default function WelcomeScreen() {
  const [connecting, setConnecting] = useState(false);
  const [pubkey, setPubkey] = useState<string | null>(null);

  const handleConnectWallet = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      await purgeLegacyStoredKeypair();
      await resetIssuerKeypair();
      const kp = await getOrCreateIssuerKeypair();
      setPubkey(kp.publicKey.toBase58());
      // slight delay for UX feedback
      setTimeout(() => router.replace('/(tabs)'), 300);
    } catch (e:any) {
      Alert.alert('Wallet Error', 'Failed to initialize wallet:\n' + (e?.message || String(e)));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1 justify-center items-center px-6">
        {/* Brand Header */}
        <MotiView
          from={{ opacity: 0, translateY: -24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800 }}
          className="mb-14 w-full"
        >
          <View className="items-center w-full">
            <View className="mb-5">
              <LinearGradient
                colors={['#063d6b','#08506f','#00b8d4']}
                start={{ x:0, y:0 }}
                end={{ x:1, y:1 }}
                style={{ padding:18, borderRadius:72, alignItems:'center', justifyContent:'center', shadowColor:'#00b8d4', shadowOpacity:0.45, shadowRadius:20 }}
              >
                <FileCheck2 color="#e9faff" size={48} strokeWidth={1.6} />
              </LinearGradient>
            </View>
            <Text className="text-white text-4xl font-extrabold tracking-tight text-center mb-3">
              CertifyOnChain
            </Text>
            <Text className="text-sky-200/80 text-sm uppercase tracking-[5px] mb-2">Solana Certificates</Text>
            <View className="flex-row gap-2 items-center">
              <Badge label="Secure" />
              <Badge label="Verifiable" />
              <Badge label="On-Chain" />
            </View>
          </View>
        </MotiView>

        {/* Description */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 250 }}
          className="mb-14"
        >
          <Text className="text-slate-300 text-center text-base leading-6 font-light">
            Issue and verify tamper‑evident credentials backed by Solana. A single mint becomes a permanent, queryable proof of achievement.
          </Text>
        </MotiView>

        {/* Connect Wallet Button */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 650, delay: 450 }}
          className="w-full"
        >
          <TouchableOpacity onPress={handleConnectWallet} activeOpacity={0.85} className="rounded-xl overflow-hidden">
            <LinearGradient
              colors={['#063d6b','#08506f','#00b8d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical:16, paddingHorizontal:28, borderRadius:16, borderWidth:1, borderColor:'rgba(255,255,255,0.06)' }}
            >
              {connecting ? (
                <View className="flex-row justify-center items-center">
                  <ActivityIndicator color="#e6fbff" />
                  <Text className="text-white text-base font-medium ml-3 tracking-wide">Connecting...</Text>
                </View>
              ) : (
                <Text className="text-white text-lg font-semibold text-center tracking-wide">
                  {pubkey ? 'Continue' : 'Initialize Wallet'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
        {pubkey && !connecting && (
          <MotiView
            from={{ opacity:0, translateY:8 }}
            animate={{ opacity:1, translateY:0 }}
            transition={{ type:'timing', duration:500, delay:650 }}
            className="mt-5"
          >
            <View className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <Text className="text-sky-200 text-xs font-mono tracking-wide" selectable>
                {pubkey.slice(0,12)}…{pubkey.slice(-12)}
              </Text>
            </View>
          </MotiView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

// Small badge component (no emojis) aligned with theme
const Badge = ({ label }: { label: string }) => (
  <View style={{ backgroundColor:'rgba(255,255,255,0.05)', borderColor:'rgba(255,255,255,0.08)' }} className="px-3 py-1 rounded-full border">
    <Text className="text-[11px] tracking-wide text-sky-100/90 font-medium">{label}</Text>
  </View>
);