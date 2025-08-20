export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  dateIssued: string;
  isVerified: boolean;
  description?: string;
}

export interface WalletData {
  publicKey: string;
  certificates: Certificate[];
}