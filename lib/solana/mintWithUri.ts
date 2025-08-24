import { getOrCreateIssuerKeypair } from './wallet';
import { setMetaplexIdentity } from './connection';
import { PublicKey } from '@solana/web3.js';

export async function mintWithUri(params: { title: string; recipient: string; metadataUri: string }) {
  const issuerKp = await getOrCreateIssuerKeypair();
  const metaplex = setMetaplexIdentity(issuerKp);
  const recipientPk = new PublicKey(params.recipient.trim());
  if (!params.metadataUri.startsWith('http')) throw new Error('metadataUri must be http(s)');
  const { nft } = await metaplex.nfts().create({
    name: params.title,
    symbol: 'CERT',
    sellerFeeBasisPoints: 0,
    uri: params.metadataUri,
    tokenOwner: recipientPk,
    isMutable: true,
  });
  return { mintAddress: nft.address.toBase58(), metadataUri: params.metadataUri };
}
