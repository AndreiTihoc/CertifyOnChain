// Helper for Preserve NFT.Storage Collections API (experimental integration)
// Endpoint: POST https://preserve.nft.storage/api/v1/collection/create_collection
// Auth: Bearer <API_KEY>
// For Solana: contractAddress can be omitted; send a unique string instead.
// Env var expected: EXPO_PUBLIC_PRESERVE_API_KEY (do NOT commit real key)

export interface CreateCollectionParams {
  collectionName: string;
  chainID: string;      // e.g. 'solana' or a numeric ID per API docs
  network: string;      // e.g. 'solana-devnet' or 'solana'
  contractAddress?: string; // optional for Solana
  uniqueFallback?: string;  // if no contractAddress we derive or use this
}

export interface CreateCollectionResult {
  ok: boolean;
  status: number;
  message?: string;
  raw?: any;
}

function getPreserveKey(): string | undefined {
  // @ts-ignore
  let raw = process.env?.EXPO_PUBLIC_PRESERVE_API_KEY as string | undefined;
  if (!raw) return undefined;
  raw = raw.trim().replace(/^['"]|['"]$/g, '');
  return raw || undefined;
}

export async function createCollectionOnPreserve(params: CreateCollectionParams): Promise<CreateCollectionResult> {
  const apiKey = getPreserveKey();
  if (!apiKey) {
    return { ok: false, status: 0, message: 'Missing EXPO_PUBLIC_PRESERVE_API_KEY env var' };
  }
  const endpoint = 'https://preserve.nft.storage/api/v1/collection/create_collection';
  const body = {
    contractAddress: params.contractAddress || params.uniqueFallback || `sol-${Date.now()}`,
    collectionName: params.collectionName,
    chainID: params.chainID,
    network: params.network,
  };
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    let raw: any = undefined;
    try { raw = await resp.json(); } catch {}
    if (!resp.ok) {
      return { ok: false, status: resp.status, message: raw?.error || raw || resp.statusText, raw };
    }
    return { ok: true, status: resp.status, message: 'Collection Created', raw };
  } catch (e:any) {
    return { ok: false, status: 0, message: e?.message || 'Network error' };
  }
}

// Example usage (comment out in production):
// (async () => {
//   const res = await createCollectionOnPreserve({
//     collectionName: 'My Cert Collection',
//     chainID: 'solana',
//     network: 'solana-devnet',
//     uniqueFallback: 'my-cert-collection',
//   });
//   console.log('[createCollection]', res);
// })();
