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
      // Try to load JSON metadata (may require a fetch if not already loaded)
      let json: any = anyNft.json;
      try {
        if (!json && anyNft.uri) {
          const metaUri: string = anyNft.uri;
          const resp = await fetch(metaUri);
            if (resp.ok) json = await resp.json();
        }
      } catch {}

      // Extract optional fields from JSON attributes if present
      let description: string | undefined = json?.description;
      let expiry: string | undefined;
      let fileUri: string | undefined;
      let recipient: string | undefined;
      if (json?.attributes && Array.isArray(json.attributes)) {
        for (const attr of json.attributes) {
          const trait = (attr.trait_type || attr.trait || '').toLowerCase();
          const val = (attr.value || '').toString();
          if (trait.includes('expiry')) expiry = val; 
          if (trait.includes('file') || trait.includes('document')) fileUri = val; 
          if (trait.includes('recipient')) recipient = val;
        }
      }
      // Some metadata formats embed extra fields at top level
      if (!fileUri && json?.properties?.files && Array.isArray(json.properties.files) && json.properties.files[0]?.uri) {
        fileUri = json.properties.files[0].uri;
      }
      if (!fileUri && json?.image) {
        fileUri = json.image;
      }

      // Gateway resolve fileUri if ipfs
  const resolvedFileUri = fileUri;

      certs.push({
        id: (anyNft.address ?? anyNft.mintAddress ?? anyNft.mint)?.toBase58?.() || 'unknown',
        title: anyNft.name || json?.name || 'Certificate',
        issuer: updateAuth || 'Unknown',
        dateIssued: new Date().toISOString().split('T')[0],
        isVerified: issuerPubkey ? updateAuth === issuerPubkey : true,
        description,
        expiry,
  fileUri: resolvedFileUri,
        recipient,
      });
    }
  }
  return certs;
};
