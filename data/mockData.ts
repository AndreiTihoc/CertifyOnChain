import { Certificate, WalletData } from '../types/certificate';

export const mockCertificates: Certificate[] = [
  {
    id: '1',
    title: 'Machine Learning Specialization',
    issuer: 'Coursera',
    dateIssued: '2024-01-15',
    isVerified: true,
    description: 'Advanced Machine Learning techniques and algorithms'
  },
  {
    id: '2',
    title: 'Blockchain Development',
    issuer: 'Udemy',
    dateIssued: '2023-12-10',
    isVerified: true,
    description: 'Smart contract development on Solana'
  },
  {
    id: '3',
    title: 'React Native Mastery',
    issuer: 'Frontend Masters',
    dateIssued: '2023-11-20',
    isVerified: false,
    description: 'Building cross-platform mobile applications'
  }
];

export const mockWalletData: WalletData = {
  publicKey: 'WalletPublicKey123ABC456DEF789',
  certificates: mockCertificates
};

export const mockScanResults: WalletData = {
  publicKey: 'ScannedWallet789XYZ456ABC123',
  certificates: [
    {
      id: '4',
      title: 'Solana Development',
      issuer: 'Solana Foundation',
      dateIssued: '2024-02-01',
      isVerified: true,
      description: 'Building dApps on Solana blockchain'
    },
    {
      id: '5',
      title: 'Web3 Security',
      issuer: 'ConsenSys',
      dateIssued: '2023-10-15',
      isVerified: true,
      description: 'Security best practices for Web3'
    }
  ]
};