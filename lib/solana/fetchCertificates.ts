import { getMetaplex } from './connection';
import { PublicKey } from '@solana/web3.js';
import { Certificate } from '../../types/certificate';

export const fetchCertificatesForOwner = async (owner: string, issuerPubkey?: string): Promise<Certificate[]> => {
  const metaplex = getMetaplex();
  const ownerPk = new PublicKey(owner);
  // fetch NFTs owned by address
  const nfts = await metaplex.nfts().findAllByOwner({ owner: ownerPk });
  const certs: Certificate[] = [];
  for (const nft of nfts) {
    const anyNft: any = nft as any;
    const symbol = anyNft.symbol || anyNft.json?.symbol;
    if (symbol === 'CERT') {
      const updateAuth = anyNft.updateAuthorityAddress?.toBase58?.();
      certs.push({
        id: (anyNft.address ?? anyNft.mintAddress ?? anyNft.mint)?.toBase58?.() || 'unknown',
        title: anyNft.name || 'Certificate',
        issuer: updateAuth || 'Unknown',
        dateIssued: new Date().toISOString().split('T')[0],
        isVerified: issuerPubkey ? updateAuth === issuerPubkey : true,
      });
    }
  }
  return certs;
};
