// Ephemeral in‑memory keypair handling (no long-term persistence)
// Legacy storage key kept for purge of previously stored keypairs
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keypair } from '@solana/web3.js';
import 'react-native-get-random-values';

const LEGACY_STORAGE_KEY = 'issuer_keypair_v1';

let cachedKp: Keypair | null = null; // session-only

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
  if (cachedKp) return cachedKp;
  try {
    cachedKp = Keypair.generate();
  } catch (e) {
    console.warn('Secure Keypair.generate failed, retrying with crypto ensure', e);
    ensureCrypto();
    cachedKp = Keypair.generate();
  }
  return cachedKp;
};

export const getStoredIssuerKeypair = async (): Promise<Keypair | null> => {
  // No persistence anymore; return in-memory if exists
  return cachedKp;
};

export const resetIssuerKeypair = async (): Promise<void> => {
  cachedKp = null;
};

export const purgeLegacyStoredKeypair = async (): Promise<void> => {
  try { await AsyncStorage.removeItem(LEGACY_STORAGE_KEY); } catch {}
};
