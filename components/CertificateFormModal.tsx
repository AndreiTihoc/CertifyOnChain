import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore - types may not resolve fully in RN bundler, runtime import is fine
// Removed direct @solana/web3.js import to avoid heavy bundle / freeze issues on mobile.
// Lightweight Base58 + length heuristic validator:
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;
function isLikelySolanaAddress(addr: string): boolean {
  if (!addr) return false;
  if (!BASE58_RE.test(addr)) return false;
  // Typical length 32-44; enforce bounds.
  return addr.length >= 32 && addr.length <= 44;
}

interface CertificateFormValues {
  recipient: string;
  title: string;
  description: string;
  dateIssued: string; // ISO string (date only)
  expiry: string; // ISO string or ''
  fileUri: string; // temporary direct link (later IPFS)
}

interface CertificateFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: CertificateFormValues) => void;
}

const todayISO = () => new Date().toISOString().split('T')[0];

export const CertificateFormModal: React.FC<CertificateFormModalProps> = ({ visible, onClose, onSubmit }) => {
  const [values, setValues] = useState<CertificateFormValues>({
    recipient: '',
    title: '',
    description: '',
    dateIssued: todayISO(),
    expiry: '',
    fileUri: ''
  });
  const [errors, setErrors] = useState<Record<string,string>>({});

  const update = (field: keyof CertificateFormValues, val: string) => {
    setValues(v => ({ ...v, [field]: val }));
  };

  const validate = (): boolean => {
    const e: Record<string,string> = {};
    if (!values.recipient) e.recipient = 'Required';
    else if (!isLikelySolanaAddress(values.recipient)) e.recipient = 'Invalid Solana address';
    if (!values.title.trim()) e.title = 'Title required';
    if (values.description.length > 200) e.description = 'Max 200 chars';
    // basic date checks
    if (values.expiry && values.expiry < values.dateIssued) e.expiry = 'Expiry before issue date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSubmit(values);
    onClose();
    setValues({ recipient: '', title: '', description: '', dateIssued: todayISO(), expiry: '', fileUri: '' });
    setErrors({});
  };

  if (visible) {
    // Debug trace to ensure state toggles correctly
    // eslint-disable-next-line no-console
    console.log('CertificateFormModal visible');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent:'flex-end' }}>
        <MotiView
          from={{ translateY: 600, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          style={{ backgroundColor: '#101425', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}
        >
          <LinearGradient colors={[ '#101425', '#1a1f33' ]} style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24 }}>
            <View style={{ alignItems:'center', paddingVertical: 12 }}>
              <View style={{ width: 48, height: 5, borderRadius: 3, backgroundColor: '#334' }} />
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 16 }}>New Certificate</Text>

              {/** Recipient */}
              <Field label="Recipient Wallet" error={errors.recipient}>
                <TextInput
                  placeholder="Base58 wallet"
                  placeholderTextColor="#556"
                  value={values.recipient}
                  onChangeText={t => update('recipient', t.trim())}
                  style={inputStyle}
                  autoCapitalize="none"
                />
              </Field>

              <Field label="Title" error={errors.title}>
                <TextInput
                  placeholder="e.g. AI Fundamentals"
                  placeholderTextColor="#556"
                  value={values.title}
                  onChangeText={t => update('title', t)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Description (optional)" error={errors.description}>
                <TextInput
                  placeholder="Short description"
                  placeholderTextColor="#556"
                  value={values.description}
                  onChangeText={t => update('description', t)}
                  style={[inputStyle, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                  multiline
                  maxLength={200}
                />
                <Text style={{ color:'#667', fontSize:12, textAlign:'right', marginTop:4 }}>{values.description.length}/200</Text>
              </Field>

              <Field label="Issue Date">
                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#556"
                  value={values.dateIssued}
                  onChangeText={t => update('dateIssued', t)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Expiry Date (optional)" error={errors.expiry}>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#556"
                  value={values.expiry}
                  onChangeText={t => update('expiry', t)}
                  style={inputStyle}
                />
              </Field>

              <Field label="File URI (temp)" error={errors.fileUri}>
                <TextInput
                  placeholder="https://... (PDF / image)"
                  placeholderTextColor="#556"
                  value={values.fileUri}
                  onChangeText={t => update('fileUri', t)}
                  style={inputStyle}
                  autoCapitalize="none"
                />
              </Field>

              <View style={{ flexDirection:'row', marginTop: 12, gap: 12 }}>
                <TouchableOpacity onPress={onClose} style={[buttonBase,{ backgroundColor:'#223' }]}>
                  <Text style={buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submit} style={[buttonBase,{ backgroundColor:'#00f5d4' }]}>
                  <Text style={[buttonText,{ color:'#04141a' }]}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </MotiView>
      </View>
    </Modal>
  );
};

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
    {children}
    {!!error && <Text style={{ color:'#ff5f56', marginTop:4, fontSize:12 }}>{error}</Text>}
  </View>
);

const inputStyle = {
  backgroundColor: '#182033',
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  color: 'white',
  fontSize: 14,
};

const buttonBase = {
  flex: 1,
  borderRadius: 12,
  paddingVertical: 14,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const buttonText = {
  fontSize: 15,
  fontWeight: '700' as const,
  color: 'white',
};

export type { CertificateFormValues };
