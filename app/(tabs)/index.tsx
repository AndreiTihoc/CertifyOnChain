import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { GradientBackground } from '../../components/GradientBackground';
import { CertificateCard } from '../../components/CertificateCard';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { Certificate } from '../../types/certificate';
// Solana helpers (statically imported to avoid TS dynamic import config issues)
import { fetchCertificatesForOwner } from '../../lib/solana/fetchCertificates';
import { getOrCreateIssuerKeypair, getStoredIssuerKeypair } from '../../lib/solana/wallet';
import { mintCertificate } from '../../lib/solana/mintCertificate';

export default function HomeScreen() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formRecipient, setFormRecipient] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formIssuer, setFormIssuer] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIssueDate, setFormIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formExpiry, setFormExpiry] = useState('');
  const [formFileUri, setFormFileUri] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string,string>>({});
  const today = new Date().toISOString().split('T')[0];
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const certCount = certificates.length;
  const [loadingChain, setLoadingChain] = useState(false);
  const [walletPubkey, setWalletPubkey] = useState<string | null>(null);
  const [chainEnabled, setChainEnabled] = useState(false);

  // Persistence removed: no auto-enable on mount

  useEffect(() => {
    if (chainEnabled && !walletPubkey) {
      (async () => {
        try {
          setLoadingChain(true);
          // Try stored first (no dummy wipe if already existed)
          const stored = await getStoredIssuerKeypair();
          let kp;
          if (stored) {
            kp = stored;
          } else {
            kp = await getOrCreateIssuerKeypair();
            // New wallet generated: clear existing dummy/local certificates
            setCertificates([]);
          }
          setWalletPubkey(kp.publicKey.toBase58());
          // Fetch chain certificates immediately
          const chainCerts = await fetchCertificatesForOwner(kp.publicKey.toBase58(), kp.publicKey.toBase58());
          setCertificates(chainCerts);
        } catch (e) {
          console.warn('Wallet init failed', e);
        } finally {
          setLoadingChain(false);
        }
      })();
    }
  }, [chainEnabled, walletPubkey]);

  const loadOnChain = async () => {
    if (!walletPubkey) return;
    try {
      setLoadingChain(true);
      const kp = await getStoredIssuerKeypair();
      const onChain = await fetchCertificatesForOwner(walletPubkey, kp?.publicKey.toBase58());
      setCertificates(onChain);
    } catch (e) {
      console.warn('On-chain fetch failed', e);
    } finally {
      setLoadingChain(false);
    }
  };

  const handleAddCertificate = () => setShowForm(true);

  const validateForm = async () => {
    const errs: Record<string,string> = {};
    if (!formRecipient.trim()) errs.recipient = 'Recipient required';
    if (!formTitle.trim()) errs.title = 'Title required';
    if (!formIssuer.trim()) errs.issuer = 'Issuer required';
    if (formDescription.length > 200) errs.description = 'Max 200 chars';
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRegex.test(formIssueDate)) errs.dateIssued = 'Invalid date (YYYY-MM-DD)';
    if (formExpiry) {
      if (!isoDateRegex.test(formExpiry)) errs.expiry = 'Invalid expiry date';
      else if (formIssueDate && formExpiry < formIssueDate) errs.expiry = 'Expiry before issue date';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const ok = await validateForm();
    if (!ok) { setSubmitting(false); return; }
    if (chainEnabled && walletPubkey) {
      try {
        const result = await mintCertificate({
          title: formTitle.trim(),
            description: formDescription.trim() || undefined,
            recipient: formRecipient.trim(),
            fileUri: formFileUri.trim() || undefined,
            issuer: formIssuer.trim(),
        });
        // Optimistically include local params (expiry not yet on-chain, but user entered it) by merging
        const enriched = { ...result.certificate, expiry: formExpiry.trim() || undefined };
        setCertificates(prev => [enriched, ...prev]);
        // Optionally still refresh chain in background (non-blocking)
        loadOnChain();
        Alert.alert('Minted', 'Certificate minted: ' + result.mintAddress.slice(0,8) + '...');
      } catch (e:any) {
        Alert.alert('Mint Error', e?.message || 'Failed to mint');
      }
    } else {
      const newCert: Certificate = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        issuer: formIssuer.trim(),
        dateIssued: formIssueDate,
        isVerified: true,
        description: formDescription.trim() || undefined,
        recipient: formRecipient.trim(),
        expiry: formExpiry.trim() || undefined,
        fileUri: formFileUri.trim() || undefined,
      };
      setCertificates(prev => [newCert, ...prev]);
  Alert.alert('Certificate Added', 'Certificate added locally.');
    }
    // reset form
    setFormRecipient('');
    setFormTitle('');
    setFormIssuer('');
    setFormDescription('');
    setFormIssueDate(today);
    setFormExpiry('');
  setFormFileUri('');
  setFormFileName('');
    setFormErrors({});
    setShowForm(false);
    setSubmitting(false);
  };

  const handleCancel = () => {
    if (submitting) return;
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
              {certCount} certificate{certCount !== 1 ? 's' : ''} in your collection {chainEnabled && walletPubkey ? '\nWallet: ' + walletPubkey.slice(0,4)+'...'+walletPubkey.slice(-4) : ''}
            </Text>
            <View className="flex-row justify-center mt-3 gap-3">
              <TouchableOpacity onPress={()=> setChainEnabled(e=>!e)} style={{ backgroundColor: chainEnabled ? '#0a3' : '#223', paddingVertical:8, paddingHorizontal:14, borderRadius:20 }}>
                <Text style={{ color:'white', fontSize:12, fontWeight:'600' }}>{chainEnabled ? 'Chain Enabled' : 'Enable Chain'}</Text>
              </TouchableOpacity>
              {chainEnabled && (
                <TouchableOpacity disabled={loadingChain || !walletPubkey} onPress={loadOnChain} style={{ backgroundColor:'#182033', paddingVertical:8, paddingHorizontal:14, borderRadius:20, opacity: loadingChain?0.6:1 }}>
                  <Text style={{ color:'#4dd9ff', fontSize:12, fontWeight:'600' }}>{loadingChain ? 'Loading...' : 'Sync On-Chain'}</Text>
                </TouchableOpacity>
              )}
            </View>
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
              <View style={{ backgroundColor:'#101826', borderRadius:16, padding:20, maxHeight:'90%' }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
                  <Text style={{ color:'white', fontSize:18, fontWeight:'700', marginBottom:12 }}>New Certificate</Text>
                  <FormField label="Recipient Wallet *" error={formErrors.recipient}>
                    <TextInput
                      value={formRecipient}
                      onChangeText={setFormRecipient}
                      placeholder="Base58 address"
                      placeholderTextColor="#556"
                      style={inputStyle}
                      autoCapitalize="none"
                    />
                  </FormField>
                  <FormField label="Title *" error={formErrors.title}>
                    <TextInput
                      value={formTitle}
                      onChangeText={setFormTitle}
                      placeholder="e.g. AI Fundamentals"
                      placeholderTextColor="#556"
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="Issuer *" error={formErrors.issuer}>
                    <TextInput
                      value={formIssuer}
                      onChangeText={setFormIssuer}
                      placeholder="Organization"
                      placeholderTextColor="#556"
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="Description" error={formErrors.description}>
                    <TextInput
                      value={formDescription}
                      onChangeText={setFormDescription}
                      placeholder="Short description (max 200 chars)"
                      placeholderTextColor="#556"
                      style={[inputStyle, { height:90, textAlignVertical:'top', paddingTop:10 }]}
                      multiline
                      maxLength={200}
                    />
                    <Text style={{ color:'#667', fontSize:12, textAlign:'right' }}>{formDescription.length}/200</Text>
                  </FormField>
                  <FormField label="Issue Date *" error={formErrors.dateIssued}>
                    <TextInput
                      value={formIssueDate}
                      onChangeText={setFormIssueDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#556"
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="Expiry Date" error={formErrors.expiry}>
                    <TextInput
                      value={formExpiry}
                      onChangeText={setFormExpiry}
                      placeholder="YYYY-MM-DD (optional)"
                      placeholderTextColor="#556"
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="Certificate File (PDF/Image)">
                    <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf','image/*'], copyToCacheDirectory: true });
                            if (res.canceled) return;
                            const file = res.assets?.[0];
                            if (file) {
                              setFormFileUri(file.uri);
                              setFormFileName(file.name || 'selected-file');
                            }
                          } catch (e) {
                            Alert.alert('File Error','Could not pick file');
                          }
                        }}
                        style={{ backgroundColor:'#182033', paddingVertical:12, paddingHorizontal:16, borderRadius:10 }}
                      >
                        <Text style={{ color:'#00f5d4', fontWeight:'600' }}>{formFileUri ? 'Change File' : 'Select File'}</Text>
                      </TouchableOpacity>
                      {formFileUri ? (
                        <View style={{ flex:1 }}>
                          <Text style={{ color:'white', fontSize:12 }} numberOfLines={1}>{formFileName}</Text>
                        </View>
                      ) : null}
                    </View>
                  </FormField>
                  <View style={{ flexDirection:'row', marginTop:10, gap:12 }}>
                    <TouchableOpacity disabled={submitting} onPress={handleCancel} style={[buttonBase,{ backgroundColor:'#223', opacity: submitting ? 0.5 : 1 }]}>
                      <Text style={buttonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity disabled={submitting} onPress={handleSubmit} style={[buttonBase,{ backgroundColor:'#00f5d4', opacity: submitting ? 0.7 : 1 }]}>
                      {submitting ? <ActivityIndicator color="#04141a" /> : <Text style={[buttonText,{ color:'#042' }]}>Add</Text>}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
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
                  {selectedCert.expiry && <DetailField label="Expiry Date" value={selectedCert.expiry} />}
                  {selectedCert.fileUri && (
                    <View style={{ marginBottom:12 }}>
                      <Text style={{ color:'#8aa', fontSize:12, fontWeight:'600', marginBottom:4 }}>FILE LINK</Text>
                      <TouchableOpacity
                        onPress={() => WebBrowser.openBrowserAsync(selectedCert.fileUri!)}
                        style={{ backgroundColor:'#182033', borderRadius:8, padding:10 }}
                      >
                        <Text style={{ color:'#4dd9ff', fontSize:14 }} numberOfLines={1}>{selectedCert.fileUri}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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

const FormField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <View style={{ marginBottom:16 }}>
    <Text style={{ color:'white', fontSize:13, fontWeight:'600', marginBottom:6 }}>{label}</Text>
    {children}
    {!!error && <Text style={{ color:'#ff5f56', fontSize:11, marginTop:4 }}>{error}</Text>}
  </View>
);