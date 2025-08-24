import * as FileSystem from 'expo-file-system';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase env missing: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
}

function inferMime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

function shortId() {
  return Math.random().toString(36).slice(2, 10);
}

export interface DirectUploadResult {
  path: string;
  publicUrl: string;
  size?: number;
  mime?: string;
}

/** Upload JSON metadata (string body). */
export async function uploadMetadataDirect(meta: object, bucket = 'cert-meta'): Promise<DirectUploadResult> {
  assertEnv();
  const id = shortId();
  const path = `${id}.json`;
  const endpoint = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(path)}`;
  const json = JSON.stringify(meta);
  console.log('[uploadDirect] metadata REST upload', { endpoint, bytes: json.length });
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY!,
      'Content-Type': 'application/json',
      'x-upsert': 'false',
    },
    body: json,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.warn('[uploadDirect] metadata REST failed', { status: resp.status, text });
    throw new Error(`Metadata upload failed ${resp.status}: ${text}`);
  }
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  return { path, publicUrl, size: json.length, mime: 'application/json' };
}

/** Upload a local file (PDF/PNG/JPG) via multipart FormData (RN-safe). */
export async function uploadFileDirect(localPath: string, bucket = 'cert-files'): Promise<DirectUploadResult> {
  assertEnv();
  const info = await FileSystem.getInfoAsync(localPath);
  if (!info.exists) throw new Error(`File not found: ${localPath}`);

  const filename = localPath.split('/').pop() || 'file';
  const ext = filename.includes('.') ? filename.split('.').pop()! : '';
  const id = shortId();
  const outName = ext ? `${id}.${ext}` : id;
  const mime = inferMime(filename);

  const endpoint = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(outName)}`;
  console.log('[uploadDirect] file REST upload', { endpoint, localPath, outName, mime });

  const fd = new FormData();
  // @ts-ignore React Native file payload
  fd.append('file', { uri: localPath, name: outName, type: mime });

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY!,
      // NOTE: don't set Content-Type for FormData; RN sets the boundary
      'x-upsert': 'false',
    },
    body: fd,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.warn('[uploadDirect] file REST failed', { status: resp.status, text });
    throw new Error(`File upload failed ${resp.status}: ${text}`);
  }
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${outName}`;
  return { path: outName, publicUrl, mime };
}
