import * as FileSystem from 'expo-file-system';
import { supabase, hasSupabase, supabaseUrl, supabaseAnonKey } from '../supabaseClient';

export interface SupabaseUploadResult {
  path: string;
  publicUrl?: string;
  size?: number;
  mime?: string;
}

function inferMime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

// Short random id for compact storage paths
function shortId(): string {
  return Math.random().toString(36).slice(2, 10); // 8 chars
}

// Expo-safe base64 -> Uint8Array (no Buffer usage)
function base64ToUint8Array(b64: string): Uint8Array {
  // atob is available in Expo/React Native; if not, an app-level polyfill may be needed.
  // Convert base64 to binary string, then to bytes
  // eslint-disable-next-line no-undef
  const bin = (globalThis as any).atob ? (globalThis as any).atob(b64) : atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function uploadFileToSupabase(localPath: string, bucket = 'cert-files'): Promise<SupabaseUploadResult> {
  console.log('[uploadSupabase] start uploadFileToSupabase', { localPath, bucket, hasSupabase, supabaseUrl: (supabase as any)?.url });
  if (!hasSupabase || !supabase) {
    console.warn('[uploadSupabase] Supabase not configured');
    throw new Error('Supabase not configured');
  }
  console.log('[uploadSupabase] getInfoAsync');
  const info = await FileSystem.getInfoAsync(localPath, { size: true });
  console.log('[uploadSupabase] file info', { exists: info.exists, uri: info.uri });
  if (!info.exists) {
    console.warn('[uploadSupabase] file missing at path');
    throw new Error('File missing');
  }
  const filename = localPath.split('/').pop() || 'file';
  const ext = filename.includes('.') ? (filename.split('.').pop() as string) : undefined;
  const mime = inferMime(filename);
  console.log('[uploadSupabase] derived name/mime', { filename, ext, mime });
  console.log('[uploadSupabase] read file as base64');
  const b64 = await FileSystem.readAsStringAsync(localPath, { encoding: FileSystem.EncodingType.Base64 });
  console.log('[uploadSupabase] base64 length', b64.length);
  const bytes = base64ToUint8Array(b64);
  console.log('[uploadSupabase] bytes length', bytes.byteLength);
  const id = shortId();
  const path = ext ? `${id}.${ext}` : id;
  console.log('[uploadSupabase] uploading to storage (REST-first)', { bucket, path, contentType: mime, supabaseUrl: (supabase as any)?.url });
  // Use ArrayBuffer for RN + REST/SDK compatibility
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteLength + bytes.byteOffset);
  let restOk = false;
  if (supabaseUrl && supabaseAnonKey) {
    const endpoint = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(path)}`;
    console.log('[uploadSupabase] REST upload', { endpoint });
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': mime,
        'x-upsert': 'false',
      },
      body: ab as any,
    }).catch((e:any)=>{
      console.warn('[uploadSupabase] REST upload threw', e?.message || e);
      return undefined as any;
    });
    if (resp && resp.ok) {
      restOk = true;
    } else if (resp) {
      const text = await resp.text().catch(()=> '');
      console.warn('[uploadSupabase] REST upload failed', { status: resp.status, text });
    }
  }
  if (!restOk) {
    console.log('[uploadSupabase] falling back to SDK upload');
    let error: any | null = null;
    try {
      const res = await supabase.storage.from(bucket).upload(path, ab as ArrayBuffer, { contentType: mime, upsert: false });
      error = (res as any)?.error || null;
    } catch (e:any) {
      error = e;
    }
    if (error) {
      console.warn('[uploadSupabase] upload error (sdk)', { message: error.message, name: (error as any)?.name, details: (error as any)?.details });
      throw error;
    }
  }
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  console.log('[uploadSupabase] public URL obtained', { publicUrl: pub.publicUrl });
  const result = { path, publicUrl: pub.publicUrl, size: bytes.byteLength, mime };
  console.log('[uploadSupabase] done', result);
  return result;
}

export interface SupabaseMetadataPayload {
  name: string;
  symbol: string;
  description?: string;
  issuer: string;
  recipient: string;
  dateIssued: string;
  expiry?: string;
  file?: string; // public file URL
}

export async function uploadMetadataToSupabase(meta: SupabaseMetadataPayload, bucket = 'cert-meta'): Promise<SupabaseUploadResult> {
  console.log('[uploadSupabase] start uploadMetadataToSupabase', { bucket, hasSupabase, name: meta.name, hasFile: !!meta.file, supabaseUrl: (supabase as any)?.url });
  if (!hasSupabase || !supabase) {
    console.warn('[uploadSupabase] Supabase not configured (metadata)');
    throw new Error('Supabase not configured');
  }
  const json = JSON.stringify({
    name: meta.name,
    symbol: meta.symbol,
    description: meta.description,
    image: meta.file ?? undefined,
    properties: {
      files: meta.file ? [{ uri: meta.file, type: inferMime(meta.file) }] : []
    },
    attributes: [
      { trait_type: 'Issuer', value: meta.issuer },
      { trait_type: 'Recipient', value: meta.recipient },
      { trait_type: 'Date Issued', value: meta.dateIssued },
      meta.expiry ? { trait_type: 'Expiry', value: meta.expiry } : null,
      meta.file ? { trait_type: 'File URL', value: meta.file } : null,
    ].filter(Boolean),
    // custom fields (still fine for most wallets)
    issuer: meta.issuer,
    recipient: meta.recipient,
    dateIssued: meta.dateIssued,
    expiry: meta.expiry,
    file: meta.file,
  });
  console.log('[uploadSupabase] metadata JSON length', json.length);
  const bytes = new TextEncoder().encode(json);
  const id = shortId();
  const path = `${id}.json`;
  console.log('[uploadSupabase] uploading metadata to storage (REST-first)', { bucket, path, supabaseUrl: (supabase as any)?.url });
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteLength + bytes.byteOffset);
  let restOk = false;
  if (supabaseUrl && supabaseAnonKey) {
    const endpoint = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(path)}`;
    console.log('[uploadSupabase] REST upload (metadata)', { endpoint });
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'x-upsert': 'false',
      },
      body: ab as any,
    }).catch((e:any)=>{
      console.warn('[uploadSupabase] REST upload (metadata) threw', e?.message || e);
      return undefined as any;
    });
    if (resp && resp.ok) {
      restOk = true;
    } else if (resp) {
      const text = await resp.text().catch(()=> '');
      console.warn('[uploadSupabase] REST upload (metadata) failed', { status: resp.status, text });
    }
  }
  if (!restOk) {
    console.log('[uploadSupabase] falling back to SDK upload (metadata)');
    let error: any | null = null;
    try {
      const res = await supabase.storage.from(bucket).upload(path, ab as ArrayBuffer, { contentType: 'application/json', upsert: false });
      error = (res as any)?.error || null;
    } catch (e:any) {
      error = e;
    }
    if (error) {
      console.warn('[uploadSupabase] metadata upload error (sdk)', { message: error.message, name: (error as any)?.name, details: (error as any)?.details });
      throw error;
    }
  }
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  console.log('[uploadSupabase] metadata public URL obtained', { publicUrl: pub.publicUrl });
  return { path, publicUrl: pub.publicUrl, size: bytes.length, mime: 'application/json' };
}

// Generic JSON uploader (handy if you want to build custom metadata shapes)
export async function uploadJsonToSupabase(payload: any, bucket = 'cert-meta', filename?: string): Promise<SupabaseUploadResult> {
  console.log('[uploadSupabase] start uploadJsonToSupabase', { bucket, hasSupabase, filename });
  if (!hasSupabase || !supabase) {
    console.warn('[uploadSupabase] Supabase not configured (json)');
    throw new Error('Supabase not configured');
  }
  const json = JSON.stringify(payload);
  console.log('[uploadSupabase] generic JSON length', json.length);
  const bytes = new TextEncoder().encode(json);
  const safe = (filename || 'metadata').replace(/[^a-z0-9_\-\.]/gi, '_');
  const id = shortId();
  const path = `${id}-${safe.endsWith('.json') ? safe : safe + '.json'}`;
  console.log('[uploadSupabase] uploading generic JSON to storage', { bucket, path });
  const ab2 = bytes.buffer.slice(bytes.byteOffset, bytes.byteLength + bytes.byteOffset);
  const { error } = await supabase.storage.from(bucket).upload(path, ab2 as ArrayBuffer, { contentType: 'application/json', upsert: false });
  if (error) {
    console.warn('[uploadSupabase] generic JSON upload error', { message: error.message, name: (error as any)?.name, details: (error as any)?.details });
    throw error;
  }
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  console.log('[uploadSupabase] generic JSON public URL obtained', { publicUrl: pub.publicUrl });
  return { path, publicUrl: pub.publicUrl, size: bytes.length, mime: 'application/json' };
}
