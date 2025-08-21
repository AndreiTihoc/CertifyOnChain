import * as FileSystem from 'expo-file-system';
import { supabase, hasSupabase } from '../supabaseClient';

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

export async function uploadFileToSupabase(localPath: string, bucket = 'cert-files'): Promise<SupabaseUploadResult> {
  console.log('[uploadSupabase] start uploadFileToSupabase', { localPath, bucket, hasSupabase });
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
  const mime = inferMime(filename);
  console.log('[uploadSupabase] derived name & mime', { filename, mime });
  console.log('[uploadSupabase] read file as base64');
  const base64 = await FileSystem.readAsStringAsync(localPath, { encoding: FileSystem.EncodingType.Base64 });
  console.log('[uploadSupabase] base64 length', base64.length);
  const binary = Buffer.from(base64, 'base64');
  console.log('[uploadSupabase] binary byteLength', binary.byteLength);
  const path = `${Date.now()}-${filename}`;
  console.log('[uploadSupabase] uploading to storage', { bucket, path, contentType: mime });
  const { error } = await supabase.storage.from(bucket).upload(path, binary, { contentType: mime, upsert: false });
  if (error) {
    console.warn('[uploadSupabase] upload error', { message: error.message, name: (error as any)?.name, details: (error as any)?.details });
    throw error;
  }
  console.log('[uploadSupabase] upload success, fetching public URL');
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  console.log('[uploadSupabase] public URL obtained', { publicUrl: pub.publicUrl });
  const result = { path, publicUrl: pub.publicUrl, size: binary.byteLength, mime };
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
  console.log('[uploadSupabase] start uploadMetadataToSupabase', { bucket, hasSupabase, name: meta.name, hasFile: !!meta.file });
  if (!hasSupabase || !supabase) {
    console.warn('[uploadSupabase] Supabase not configured (metadata)');
    throw new Error('Supabase not configured');
  }
  const json = JSON.stringify({
    name: meta.name,
    symbol: meta.symbol,
    description: meta.description,
    issuer: meta.issuer,
    recipient: meta.recipient,
    dateIssued: meta.dateIssued,
    expiry: meta.expiry,
  file: meta.file,
  image: meta.file, // conventional field for wallets/previews
    attributes: [
      { trait_type: 'Issuer', value: meta.issuer },
      { trait_type: 'Recipient', value: meta.recipient },
      { trait_type: 'Date Issued', value: meta.dateIssued },
      meta.expiry ? { trait_type: 'Expiry', value: meta.expiry } : null,
      meta.file ? { trait_type: 'File URL', value: meta.file } : null,
    ].filter(Boolean)
  });
  console.log('[uploadSupabase] metadata JSON length', json.length);
  const bytes = new TextEncoder().encode(json);
  const path = `${Date.now()}-${meta.name.replace(/[^a-z0-9]/gi,'_')}.json`;
  console.log('[uploadSupabase] uploading metadata to storage', { bucket, path });
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: 'application/json', upsert: false });
  if (error) {
    console.warn('[uploadSupabase] metadata upload error', { message: error.message, name: (error as any)?.name, details: (error as any)?.details });
    throw error;
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
  const path = `${Date.now()}-${safe.endsWith('.json') ? safe : safe + '.json'}`;
  console.log('[uploadSupabase] uploading generic JSON to storage', { bucket, path });
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: 'application/json', upsert: false });
  if (error) {
    console.warn('[uploadSupabase] generic JSON upload error', { message: error.message, name: (error as any)?.name, details: (error as any)?.details });
    throw error;
  }
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  console.log('[uploadSupabase] generic JSON public URL obtained', { publicUrl: pub.publicUrl });
  return { path, publicUrl: pub.publicUrl, size: bytes.length, mime: 'application/json' };
}
