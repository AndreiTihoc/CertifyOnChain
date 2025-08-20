import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import { MotiView } from 'moti';
import { ScanLine, RotateCcw } from 'lucide-react-native';
import { GradientBackground } from '../../components/GradientBackground';
import { CertificateCard } from '../../components/CertificateCard';
import { mockScanResults } from '../../data/mockData';
import { WalletData } from '../../types/certificate';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<WalletData | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setIsScanning(false);
    
    // Simulate fetching certificates from scanned wallet
    setTimeout(() => {
      setScannedData(mockScanResults);
      Alert.alert(
        'Wallet Scanned!', 
        `Found ${mockScanResults.certificates.length} certificates`,
        [{ text: 'OK' }]
      );
    }, 1000);
  };

  const resetScan = () => {
    setScanned(false);
    setScannedData(null);
    setIsScanning(true);
  };

  if (hasPermission === null) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 justify-center items-center">
          <Text className="text-white text-lg">Requesting camera permission...</Text>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (hasPermission === false) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 justify-center items-center px-4">
          <Text className="text-white text-lg text-center mb-4">
            Camera permission is required to scan QR codes
          </Text>
          <TouchableOpacity
            onPress={() => Camera.requestCameraPermissionsAsync()}
            className="bg-neon-blue px-6 py-3 rounded-full"
          >
            <Text className="text-white font-bold">Grant Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800 }}
          className="p-4 pb-2"
        >
          <Text className="text-white text-3xl font-bold text-center mb-2">
            Scan QR Code
          </Text>
          <Text className="text-gray-300 text-center">
            {isScanning ? 'Point camera at a wallet QR code' : 'Scanned Results'}
          </Text>
        </MotiView>

        {isScanning ? (
          // Camera Scanner
          <View className="flex-1 m-4 rounded-3xl overflow-hidden">
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            >
              <View className="flex-1 justify-center items-center">
                {/* Scanning Overlay */}
                <MotiView
                  from={{ opacity: 0.3 }}
                  animate={{ opacity: 1 }}
                  transition={{ 
                    type: 'timing',
                    duration: 1000,
                    loop: true 
                  }}
                  className="w-64 h-64 border-2 border-neon-blue rounded-3xl"
                />
                
                {/* Scanning Line Animation */}
                <MotiView
                  from={{ translateY: -100 }}
                  animate={{ translateY: 100 }}
                  transition={{ 
                    type: 'timing',
                    duration: 2000,
                    loop: true 
                  }}
                  className="absolute"
                >
                  <ScanLine size={32} color="#00f5d4" />
                </MotiView>
              </View>
            </CameraView>
          </View>
        ) : (
          // Scanned Results
          <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
            {scannedData && (
              <MotiView
                from={{ opacity: 0, translateY: 50 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 600 }}
              >
                <View className="mb-4 p-4 bg-gray-800 rounded-2xl">
                  <Text className="text-gray-300 text-sm mb-1">Scanned Wallet:</Text>
                  <Text className="text-white font-mono text-xs">
                    {scannedData.publicKey.slice(0, 20)}...{scannedData.publicKey.slice(-10)}
                  </Text>
                </View>
                
                {scannedData.certificates.map((certificate, index) => (
                  <CertificateCard
                    key={certificate.id}
                    certificate={certificate}
                    index={index}
                    onPress={() => Alert.alert('Certificate Details', certificate.description || 'No description available')}
                  />
                ))}
              </MotiView>
            )}
          </ScrollView>
        )}

        {/* Reset Button */}
        {!isScanning && (
          <MotiView
            from={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 300 }}
            className="p-4"
          >
            <TouchableOpacity
              onPress={resetScan}
              className="bg-neon-magenta px-6 py-3 rounded-full flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <RotateCcw size={20} color="#fff" />
              <Text className="text-white font-bold ml-2">Scan Another</Text>
            </TouchableOpacity>
          </MotiView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}