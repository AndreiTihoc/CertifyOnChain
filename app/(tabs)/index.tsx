import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { GradientBackground } from '../../components/GradientBackground';
import { CertificateCard } from '../../components/CertificateCard';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { mockCertificates } from '../../data/mockData';
import { Certificate } from '../../types/certificate';

export default function HomeScreen() {
  const [certificates, setCertificates] = useState<Certificate[]>(mockCertificates);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formIssuer, setFormIssuer] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const certCount = certificates.length;

  const handleAddCertificate = () => setShowForm(true);

  const handleSubmit = () => {
    if (!formTitle.trim() || !formIssuer.trim()) {
      Alert.alert('Missing Data', 'Title and Issuer are required.');
      return;
    }
    const newCert: Certificate = {
      id: Date.now().toString(),
      title: formTitle.trim(),
      issuer: formIssuer.trim(),
      dateIssued: today,
      isVerified: true,
      description: formDescription.trim() || undefined,
    };
    setCertificates(prev => [newCert, ...prev]);
    setFormTitle('');
    setFormIssuer('');
    setFormDescription('');
    setShowForm(false);
    Alert.alert('Certificate Added', 'Certificate added locally.');
  };

  const handleCancel = () => {
    setShowForm(false);
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
              {certCount} certificate{certCount !== 1 ? 's' : ''} in your collection
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
                onPress={() => setSelectedCert(certificate)}
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
          {showForm && (
            <View style={{ position:'absolute', left:0, right:0, top:0, bottom:0, backgroundColor:'rgba(0,0,0,0.65)', justifyContent:'center', paddingHorizontal:24 }}>
              <View style={{ backgroundColor:'#101826', borderRadius:16, padding:20 }}>
                <Text style={{ color:'white', fontSize:18, fontWeight:'700', marginBottom:12 }}>New Certificate</Text>
                <Text style={labelStyle}>Title *</Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. AI Fundamentals"
                  placeholderTextColor="#556"
                  style={inputStyle}
                />
                <Text style={labelStyle}>Issuer *</Text>
                <TextInput
                  value={formIssuer}
                  onChangeText={setFormIssuer}
                  placeholder="e.g. Demo University"
                  placeholderTextColor="#556"
                  style={inputStyle}
                />
                <Text style={labelStyle}>Description</Text>
                <TextInput
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Short description"
                  placeholderTextColor="#556"
                  style={[inputStyle, { height:80, textAlignVertical:'top', paddingTop:10 }]}
                  multiline
                  maxLength={200}
                />
                <Text style={{ color:'#667', fontSize:12, textAlign:'right' }}>{formDescription.length}/200</Text>
                <View style={{ flexDirection:'row', marginTop:16, gap:12 }}>
                  <TouchableOpacity onPress={handleCancel} style={[buttonBase,{ backgroundColor:'#223' }]}>
                    <Text style={buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSubmit} style={[buttonBase,{ backgroundColor:'#00f5d4' }]}>
                    <Text style={[buttonText,{ color:'#042', }]}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          {selectedCert && (
            <View style={{ position:'absolute', left:0, right:0, top:0, bottom:0, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'center', paddingHorizontal:24 }}>
              <View style={{ backgroundColor:'#101826', borderRadius:16, padding:20, maxHeight:'90%', width:'100%' }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                  <Text style={{ color:'white', fontSize:18, fontWeight:'700', marginBottom:12 }}>Certificate Details</Text>
                  <DetailField label="Title" value={selectedCert.title} />
                  <DetailField label="Issuer" value={selectedCert.issuer} />
                  <DetailField label="Issued" value={selectedCert.dateIssued} />
                  {selectedCert.description && <DetailField label="Description" value={selectedCert.description} multiline />}
                  {selectedCert.recipient && <DetailField label="Recipient" value={selectedCert.recipient} />}
                  {selectedCert.expiry && <DetailField label="Expiry" value={selectedCert.expiry} />}
                  {selectedCert.fileUri && <DetailField label="File URI" value={selectedCert.fileUri} truncate />}
                  <View style={{ flexDirection:'row', marginTop:12, gap:12 }}>
                    <TouchableOpacity onPress={() => setSelectedCert(null)} style={[buttonBase,{ backgroundColor:'#223' }]}>
                      <Text style={buttonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const inputStyle = {
  backgroundColor: '#182033',
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 10,
  color: 'white',
  fontSize: 14,
};

const labelStyle = { color: 'white', fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 6 } as const;
const buttonBase = { flex:1, borderRadius:10, paddingVertical:14, alignItems:'center', justifyContent:'center' } as const;
const buttonText = { fontSize:15, fontWeight:'700', color:'white' } as const;

const DetailField = ({ label, value, multiline, truncate }: { label: string; value: string; multiline?: boolean; truncate?: boolean }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ color:'#8aa', fontSize:12, fontWeight:'600', marginBottom:4 }}>{label.toUpperCase()}</Text>
    <View style={{ backgroundColor:'#182033', borderRadius:8, padding:10 }}>
      <Text
        style={{ color:'white', fontSize:14, lineHeight:20 }}
        numberOfLines={truncate ? 1 : undefined}
      >
        {value}
      </Text>
    </View>
  </View>
);