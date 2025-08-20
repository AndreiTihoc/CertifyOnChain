import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { GradientBackground } from '../../components/GradientBackground';
import { CertificateCard } from '../../components/CertificateCard';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { mockCertificates } from '../../data/mockData';
import { Certificate } from '../../types/certificate';

export default function HomeScreen() {
  const [certificates, setCertificates] = useState<Certificate[]>(mockCertificates);

  const handleAddCertificate = () => {
    const newCert: Certificate = {
      id: Date.now().toString(),
      title: 'New Certificate',
      issuer: 'Mock Issuer',
      dateIssued: new Date().toISOString().split('T')[0],
      isVerified: Math.random() > 0.5,
      description: 'This is a mock certificate for demonstration'
    };
    
    setCertificates(prev => [newCert, ...prev]);
    Alert.alert('Certificate Added', 'New certificate has been added to your collection!');
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4">
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800 }}
            className="pt-4 pb-6"
          >
            <Text className="text-white text-3xl font-bold text-center mb-2">
              My Certificates
            </Text>
            <Text className="text-gray-300 text-center">
              {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} in your collection
            </Text>
          </MotiView>

          {/* Certificates List */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {certificates.map((certificate, index) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
                index={index}
                onPress={() => Alert.alert('Certificate Details', certificate.description || 'No description available')}
              />
            ))}
            
            {certificates.length === 0 && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 500 }}
                className="flex-1 justify-center items-center"
              >
                <Text className="text-gray-400 text-lg text-center">
                  No certificates yet{'\n'}Tap + to add your first certificate
                </Text>
              </MotiView>
            )}
          </ScrollView>

          <FloatingActionButton onPress={handleAddCertificate} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}