export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  dateIssued: string;
  isVerified: boolean;
  description?: string;
  recipient?: string; // wallet address (base58)
  expiry?: string; // optional ISO date
  fileUri?: string; // link to PDF/image
}

export interface WalletData {
  publicKey: string;
  certificates: Certificate[];
}