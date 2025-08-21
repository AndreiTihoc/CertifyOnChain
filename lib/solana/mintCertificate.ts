import { getMetaplex, setMetaplexIdentity } from './connection';
import { getOrCreateIssuerKeypair } from './wallet';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Certificate } from '../../types/certificate';

export interface MintParams {
  title: string;
  description?: string;
  recipient: string; // recipient pubkey base58
  fileUri?: string; // currently local URI; future: upload to Arweave/IPFS
  issuer: string; // issuer display name (not necessarily wallet)
}

export interface MintResult {
  mintAddress: string;
  metadataUri: string;
  issuer: string;
  certificate: Certificate; // enriched local representation (not necessarily fully on-chain yet)
}

export const mintCertificate = async (params: MintParams): Promise<MintResult> => {
  const issuerKp = await getOrCreateIssuerKeypair();
  const metaplex = setMetaplexIdentity(issuerKp);
  const connection = metaplex.connection;

  // Ensure fee payer (issuer) has some SOL on devnet
  try {
    const balance = await connection.getBalance(issuerKp.publicKey);
    const minLamports = 0.05 * LAMPORTS_PER_SOL; // ~0.05 SOL buffer
    if (balance < minLamports) {
      const airdropAmount = 1 * LAMPORTS_PER_SOL;
      const sig = await connection.requestAirdrop(issuerKp.publicKey, airdropAmount);
      await connection.confirmTransaction(sig, 'confirmed');
    }
  } catch (e) {
    // Non-fatal: continue, but likely mint will fail if unfunded.
    console.warn('[mint] airdrop attempt failed', e);
  }

  let recipientPk: PublicKey;
  try {
    recipientPk = new PublicKey(params.recipient.trim());
  } catch (e) {
    throw new Error('Invalid recipient wallet address');
  }

  try {
    const { title } = params;
    // NOTE: Using placeholder URI; real implementation should upload metadata JSON & optional fileUri
    const { nft } = await metaplex.nfts().create({
      name: title,
      symbol: 'CERT',
      sellerFeeBasisPoints: 0,
      uri: 'https://example.com/placeholder.json',
      tokenOwner: recipientPk,
      isMutable: true,
    });
    const certificate: Certificate = {
      id: nft.address.toBase58(),
      title: title,
      issuer: issuerKp.publicKey.toBase58(),
      dateIssued: new Date().toISOString().split('T')[0],
      isVerified: true,
      description: params.description,
      recipient: params.recipient,
      expiry: undefined, // expiry not yet on-chain; will be added when metadata upload implemented
      fileUri: params.fileUri,
    };
    return { mintAddress: nft.address.toBase58(), metadataUri: nft.uri ?? '', issuer: issuerKp.publicKey.toBase58(), certificate };
  } catch (e: any) {
    // Common simulation error mapping
    const msg: string = e?.message || '';
    if (msg.includes('Attempt to debit an account but found no record of a prior credit')) {
      throw new Error('Mint failed: Issuer wallet likely has 0 SOL on devnet. Please wait for airdrop or fund the wallet and retry.');
    }
    throw new Error('Mint failed: ' + msg);
  }
};
