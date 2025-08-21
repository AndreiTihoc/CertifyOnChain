import { getMetaplex, setMetaplexIdentity } from './connection';
import { getOrCreateIssuerKeypair } from './wallet';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Certificate } from '../../types/certificate';
import * as FileSystem from 'expo-file-system';
import { hasSupabase } from '../supabaseClient';
import { uploadFileToSupabase, uploadMetadataToSupabase } from './uploadSupabase';

export interface MintParams {
  title: string;
  description?: string;
  recipient: string; // recipient pubkey base58
  fileUri?: string; // local URI before upload
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
  console.log('[mintCertificate] start', { title: params.title, hasFile: !!params.fileUri });

  // Ensure fee payer (issuer) has some SOL on devnet
  const minLamports = 0.05 * LAMPORTS_PER_SOL; // ~0.05 SOL buffer
  let balance = await connection.getBalance(issuerKp.publicKey);
  if (balance < minLamports) {
    try {
      const airdropAmount = 1 * LAMPORTS_PER_SOL;
      const sig = await connection.requestAirdrop(issuerKp.publicKey, airdropAmount);
      await connection.confirmTransaction(sig, 'confirmed');
      balance = await connection.getBalance(issuerKp.publicKey);
      console.log('[mintCertificate] post-airdrop balance', balance / LAMPORTS_PER_SOL);
    } catch (e:any) {
      console.warn('[mint] airdrop attempt failed', e);
    }
  }
  if (balance < minLamports) {
    throw new Error('Issuer wallet has insufficient SOL and faucet airdrop is rate-limited. Visit https://faucet.solana.com (devnet) or fund manually, then retry.');
  }

  let recipientPk: PublicKey;
  try {
    recipientPk = new PublicKey(params.recipient.trim());
  } catch (e) {
    throw new Error('Invalid recipient wallet address');
  }

  try {
    const { title } = params;
    // Supabase-first pipeline. Fallback to inline data URIs only when Supabase unavailable or failing.
    let uploadedFileUri: string | undefined;
    let metadataUri: string;

    if (params.fileUri && hasSupabase) {
      try {
        const fileUp = await uploadFileToSupabase(params.fileUri, 'cert-files');
        uploadedFileUri = fileUp.publicUrl;
        console.log('[mintCertificate] file uploaded via Supabase', uploadedFileUri);
      } catch (e) {
        console.warn('[mintCertificate] Supabase file upload failed, attempting inline fallback', e);
        try { uploadedFileUri = await inlineDataUriFromLocal(params.fileUri); } catch {}
      }
    } else if (params.fileUri) {
      try { uploadedFileUri = await inlineDataUriFromLocal(params.fileUri); } catch {}
    }

    if (hasSupabase) {
      try {
        const metaUp = await uploadMetadataToSupabase({
          name: params.title,
          symbol: 'CERT',
          description: params.description,
          issuer: issuerKp.publicKey.toBase58(),
          recipient: params.recipient,
          dateIssued: new Date().toISOString().split('T')[0],
          file: uploadedFileUri,
          expiry: undefined,
        }, 'cert-meta');
        metadataUri = metaUp.publicUrl!;
        console.log('[mintCertificate] metadata uploaded via Supabase', metadataUri);
      } catch (e) {
        console.warn('[mintCertificate] Supabase metadata upload failed, using inline fallback', e);
        metadataUri = await inlineMetadataDataUri({
          title: params.title,
          description: params.description,
          issuer: issuerKp.publicKey.toBase58(),
          recipient: params.recipient,
          dateIssued: new Date().toISOString().split('T')[0],
          fileUri: uploadedFileUri,
          expiry: undefined,
        });
      }
    } else {
      metadataUri = await inlineMetadataDataUri({
        title: params.title,
        description: params.description,
        issuer: issuerKp.publicKey.toBase58(),
        recipient: params.recipient,
        dateIssued: new Date().toISOString().split('T')[0],
        fileUri: uploadedFileUri,
        expiry: undefined,
      });
      console.log('[mintCertificate] inline metadata URI length', metadataUri.length);
    }

  console.log('[mintCertificate] creating NFT with URI prefix', metadataUri.slice(0,30), 'len', metadataUri.length);
  const { nft } = await metaplex.nfts().create({
      name: title,
      symbol: 'CERT',
      sellerFeeBasisPoints: 0,
      uri: metadataUri,
      tokenOwner: recipientPk,
      isMutable: true,
    });
  console.log('[mintCertificate] mint success', { mint: nft.address.toBase58() });
    // Resolve file URI to gateway if it's an ipfs:// for immediate browser open
  const resolvedFileUri = uploadedFileUri || params.fileUri;
    const certificate: Certificate = {
      id: nft.address.toBase58(),
      title: title,
      issuer: issuerKp.publicKey.toBase58(),
      dateIssued: new Date().toISOString().split('T')[0],
      isVerified: true,
      description: params.description,
      recipient: params.recipient,
      expiry: undefined, // expiry not yet on-chain; will be added when metadata upload implemented
      fileUri: resolvedFileUri,
    };
    return { mintAddress: nft.address.toBase58(), metadataUri: nft.uri ?? metadataUri, issuer: issuerKp.publicKey.toBase58(), certificate };
  } catch (e: any) {
    // Common simulation error mapping
    const msg: string = e?.message || '';
    console.error('[mintCertificate] error', msg);
    if (msg.includes('Attempt to debit an account but found no record of a prior credit')) {
      throw new Error('Mint failed: Issuer wallet likely has 0 SOL on devnet. Please wait for airdrop or fund the wallet and retry.');
    }
    throw new Error('Mint failed: ' + msg);
  }
};

// ---- Fallback inline data URI helpers (used when Supabase not configured) ----
interface InlineMetadataPayload {
  title: string;
  description?: string;
  issuer: string;
  recipient: string;
  dateIssued: string;
  fileUri?: string;
  expiry?: string;
}

async function inlineDataUriFromLocal(localPath: string): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(localPath, { size: true });
    if (!info.exists) throw new Error('File not found at path');
    const b64 = await FileSystem.readAsStringAsync(localPath, { encoding: FileSystem.EncodingType.Base64 });
    const lower = localPath.toLowerCase();
    let mime = 'application/octet-stream';
    if (lower.endsWith('.pdf')) mime = 'application/pdf';
    else if (lower.endsWith('.png')) mime = 'image/png';
    else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mime = 'image/jpeg';
    return `data:${mime};base64,${b64}`;
  } catch (e) {
    throw e;
  }
}

async function inlineMetadataDataUri(meta: InlineMetadataPayload): Promise<string> {
  // If fileUri is an inline data URI it can explode metadata size beyond 200 char URI limit when base64 encoded.
  let safeFileUri = meta.fileUri;
  const INLINE_FILE_MAX_JSON_BYTES = 400; // heuristic; keep metadata small
  if (safeFileUri && safeFileUri.startsWith('data:') && safeFileUri.length > INLINE_FILE_MAX_JSON_BYTES) {
    console.warn('[inlineMetadataDataUri] Dropping large inline file URI from metadata to stay under size limits', { originalLength: safeFileUri.length });
    safeFileUri = undefined; // still stored locally in certificate object separately
  }
  const buildJson = (minimal: boolean) => JSON.stringify(minimal ? {
    name: meta.title,
    symbol: 'CERT',
    description: meta.description,
  } : {
    name: meta.title,
    description: meta.description,
    symbol: 'CERT',
    issuer: meta.issuer,
    recipient: meta.recipient,
    dateIssued: meta.dateIssued,
    expiry: meta.expiry,
    file: safeFileUri,
    attributes: [
      { trait_type: 'Issuer', value: meta.issuer },
      { trait_type: 'Recipient', value: meta.recipient },
      { trait_type: 'Date Issued', value: meta.dateIssued },
      meta.expiry ? { trait_type: 'Expiry', value: meta.expiry } : null,
      safeFileUri ? { trait_type: 'File', value: 'Attached (inline)' } : null,
    ].filter(Boolean),
    properties: { files: safeFileUri ? [{ uri: 'inline' }] : [] },
  });
  let json = buildJson(false);
  let b64 = Buffer.from(json).toString('base64');
  let uri = `data:application/json;base64,${b64}`;
  if (uri.length > 200) { // token metadata program URI max ~200 chars
    // Try minimal metadata
    json = buildJson(true);
    b64 = Buffer.from(json).toString('base64');
    uri = `data:application/json;base64,${b64}`;
  }
  if (uri.length > 200) {
    console.error('[inlineMetadataDataUri] still too long after minimization', { length: uri.length });
  throw new Error('Inline metadata URI exceeds 200 chars. Configure Supabase buckets to host JSON instead.');
  }
  return uri;
}

