import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import { MotiView } from 'moti';
import { ScanLine, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '../../components/GradientBackground';
import { CertificateCard } from '../../components/CertificateCard';
import { Certificate } from '../../types/certificate';
import { fetchCertificatesForOwner } from '../../lib/solana/fetchCertificates';
import { getStoredIssuerKeypair } from '../../lib/solana/wallet';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  // removed mock scannedData
  const [scannedWallet, setScannedWallet] = useState<string | null>(null);
  const [scannedCerts, setScannedCerts] = useState<Certificate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setIsScanning(false);
    setLoading(true);
    try {
      setScannedWallet(data.trim());
      const issuer = await getStoredIssuerKeypair();
      const certs = await fetchCertificatesForOwner(data.trim(), issuer?.publicKey.toBase58());
      setScannedCerts(certs);
      Alert.alert('Wallet Scanned!', `Found ${certs.length} certificates`);
    } catch (e:any) {
      Alert.alert('Scan Error', e?.message || 'Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setScanned(false);
    setScannedWallet(null);
    setScannedCerts(null);
    setIsScanning(true);
    setLoading(false);
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
            {scannedWallet && (
              <MotiView
                from={{ opacity: 0, translateY: 50 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 600 }}
              >
                <View className="mb-4 p-4 bg-gray-800 rounded-2xl">
                  <Text className="text-gray-300 text-sm mb-1">Scanned Wallet:</Text>
                  <Text className="text-white font-mono text-xs">
                    {scannedWallet.slice(0, 20)}...{scannedWallet.slice(-10)}
                  </Text>
                </View>
                {loading && <Text className="text-gray-400 mb-4">Loading certificates...</Text>}
                {!loading && scannedCerts && scannedCerts.length === 0 && (
                  <Text className="text-gray-400 mb-4">No certificates found.</Text>
                )}
                {scannedCerts && scannedCerts.map((certificate, index) => (
                  <CertificateCard
                    key={certificate.id}
                    certificate={certificate}
                    index={index}
                    onPress={() => setSelectedCert(certificate)}
                  />
                ))}
              </MotiView>
            )}
          </ScrollView>
        )}

        {/* Reset Button (positioned above floating tab bar) */}
        {!isScanning && (
          <MotiView
            from={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 300 }}
            style={{ position: 'absolute', left: 0, right: 0, bottom: (insets.bottom || 0) + 12 + 64 + 12, paddingHorizontal: 24 }}
          >
            <TouchableOpacity
              onPress={resetScan}
              activeOpacity={0.85}
              style={{ borderRadius: 22, overflow:'hidden' }}
            >
              <LinearGradient
                colors={['#063d6b','#08506f','#00b8d4']}
                start={{ x:0, y:0 }}
                end={{ x:1, y:1 }}
                style={{ paddingVertical:14, paddingHorizontal:26, flexDirection:'row', alignItems:'center', justifyContent:'center', borderRadius:22, borderWidth:1, borderColor:'rgba(255,255,255,0.06)' }}
              >
                <RotateCcw size={20} color="#e6fbff" />
                <Text style={{ color:'#ffffff', fontWeight:'600', fontSize:15, marginLeft:8, letterSpacing:0.5 }}>Scan Another</Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        )}
      </SafeAreaView>
      {selectedCert && (
        <View style={{ position:'absolute', left:0, right:0, top:0, bottom:0, backgroundColor:'rgba(0,0,0,0.78)', justifyContent:'center', paddingHorizontal:24 }}>
          <View style={{ backgroundColor:'#0b141f', borderRadius:22, padding:22, maxHeight:'90%' }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              <Text style={{ color:'white', fontSize:18, fontWeight:'700', marginBottom:14 }}>Certificate Details</Text>
              <DetailRow label="Title" value={selectedCert.title} />
              <DetailRow label="Issuer" value={selectedCert.issuer} />
              <DetailRow label="Issued" value={selectedCert.dateIssued} />
              {selectedCert.recipient && <DetailRow label="Recipient" value={selectedCert.recipient} truncate />}
              {selectedCert.expiry && <DetailRow label="Expiry Date" value={selectedCert.expiry} />}
              {selectedCert.description && <DetailRow label="Description" value={selectedCert.description} multiline />}
              {selectedCert.fileUri && (
                <View style={{ marginBottom:14 }}>
                  <Text style={{ color:'#7fa1b8', fontSize:12, fontWeight:'600', marginBottom:6 }}>FILE</Text>
                  <TouchableOpacity
                    onPress={() => WebBrowser.openBrowserAsync(selectedCert.fileUri!)}
                    style={{ backgroundColor:'#132130', borderRadius:10, padding:12 }}
                  >
                    <Text style={{ color:'#38d7ff', fontSize:13 }} numberOfLines={1}>{selectedCert.fileUri}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ flexDirection:'row', marginTop:4, gap:12 }}>
                <TouchableOpacity onPress={() => setSelectedCert(null)} style={{ flex:1, backgroundColor:'#1a2633', borderRadius:12, paddingVertical:14, alignItems:'center' }}>
                  <Text style={{ color:'white', fontWeight:'600' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </GradientBackground>
  );
}

const DetailRow = ({ label, value, multiline, truncate }: { label: string; value: string; multiline?: boolean; truncate?: boolean }) => (
  <View style={{ marginBottom:14 }}>
    <Text style={{ color:'#7fa1b8', fontSize:12, fontWeight:'600', marginBottom:6 }}>{label.toUpperCase()}</Text>
    <View style={{ backgroundColor:'#132130', borderRadius:10, padding:12 }}>
      <Text
        style={{ color:'white', fontSize:14, lineHeight:20 }}
        numberOfLines={truncate ? 1 : multiline ? 6 : undefined}
      >
        {value}
      </Text>
    </View>
  </View>
);