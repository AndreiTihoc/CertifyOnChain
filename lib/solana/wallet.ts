// @ts-ignore - react-native environment provides types
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keypair } from '@solana/web3.js';
import 'react-native-get-random-values';

const STORAGE_KEY = 'issuer_keypair_v1';

export interface StoredKeypair {
  publicKey: string;
  secretKey: number[]; // raw secret key bytes
}

const encodeKeypair = (kp: Keypair): StoredKeypair => ({
  publicKey: kp.publicKey.toBase58(),
  secretKey: Array.from(kp.secretKey),
});

const decodeKeypair = (data: StoredKeypair): Keypair => {
  return Keypair.fromSecretKey(Uint8Array.from(data.secretKey));
};

function insecureRandomBytes(len: number): Uint8Array {
  const arr = new Uint8Array(len);
  for (let i=0;i<len;i++) arr[i] = Math.floor(Math.random()*256);
  return arr;
}

function ensureCrypto() {
  try {
    if (typeof global === 'object') {
      const g: any = global as any;
      if (!g.crypto || typeof g.crypto.getRandomValues !== 'function') {
        // attempt dynamic polyfill
        try { require('react-native-get-random-values'); } catch {}
        if (!g.crypto) g.crypto = {};
        if (typeof g.crypto.getRandomValues !== 'function') {
          g.crypto.getRandomValues = (buffer: Uint8Array) => {
            const rand = insecureRandomBytes(buffer.length);
            buffer.set(rand);
            return buffer;
          };
          console.warn('[wallet] Using insecure random fallback. Do not use in production.');
        }
      }
    }
  } catch (e) {
    console.warn('ensureCrypto failed', e);
  }
}

export const getOrCreateIssuerKeypair = async (): Promise<Keypair> => {
  ensureCrypto();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: StoredKeypair = JSON.parse(raw);
      return decodeKeypair(parsed);
    }
  } catch (e) {
    console.warn('Keypair load failed, generating new', e);
  }
  let kp: Keypair;
  try {
    kp = Keypair.generate();
  } catch (e) {
    console.warn('Secure Keypair.generate failed, using insecure fallback', e);
    // Fallback: construct a Keypair manually from random bytes (ED25519 needs 64 bytes seed-secret derivation handled by Keypair.fromSeed if supported)
    // Use generate again after seeding crypto; if still fails rethrow
    ensureCrypto();
    kp = Keypair.generate();
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(encodeKeypair(kp)));
  } catch (e) {
    console.warn('Keypair save failed', e);
  }
  return kp;
};

export const getStoredIssuerKeypair = async (): Promise<Keypair | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredKeypair = JSON.parse(raw);
    return decodeKeypair(parsed);
  } catch (e) {
    console.warn('Failed to load stored keypair', e);
    return null;
  }
};
