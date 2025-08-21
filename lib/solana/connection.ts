import { clusterApiUrl, Connection, Keypair } from '@solana/web3.js';
import { Metaplex, Nft, keypairIdentity } from '@metaplex-foundation/js';

let connection: Connection | null = null;
let metaplex: Metaplex | null = null;

export const getConnection = () => {
  if (!connection) {
    connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  }
  return connection;
};

export const getMetaplex = () => {
  if (!metaplex) {
    metaplex = Metaplex.make(getConnection());
  }
  return metaplex;
};

export const setMetaplexIdentity = (kp: Keypair) => {
  const m = getMetaplex();
  m.use(keypairIdentity(kp));
  return m;
};

export type { Nft };
