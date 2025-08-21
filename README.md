# CertifyOnChain

Issue and verify on-chain certificates (Solana devnet) with Supabase-hosted file & metadata storage.

## Features
- Ephemeral issuer keypair per session (dev convenience)
- Mint NFT (symbol CERT) to recipient wallet
- Upload file + metadata JSON to Supabase Storage (`cert-files`, `cert-meta` buckets)
- Fallback inline `data:` URIs only if Supabase not configured (dev only)
- QR code wallet display & scanning to fetch owned certificates
- Animated neon/glass UI (Expo / React Native)

## Quick Start
```bash
npm install
cp .env.example .env   # add Supabase values
npm run dev
```
Open Expo Dev Tools, run on device / emulator.

## Environment Variables
| Name | Description | Required |
|------|-------------|----------|
| EXPO_PUBLIC_SUPABASE_URL | Supabase project URL | Yes |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Supabase anon public key | Yes |

The `.env` file is gitignored. Provide `.env.example` without secrets.

## PDF / File Support
Selected file (PDF/image) uploads to `cert-files`. Metadata JSON (including file public URL) uploads to `cert-meta`; the metadata public URL is stored as the on-chain URI. The file link is displayed directly.

## Fallback Mode
If Supabase isn’t configured, file + metadata become inline `data:` URIs (non-permanent, size constrained ~200 char URI limit). Configure Supabase for any real use.

## Adding an Expiry
Add an expiry field to input form and pass it to `mintCertificate` so it reaches `uploadMetadataToSupabase`.

## Production Hardening Roadmap
- Persist issuer keypair securely (encrypted storage / seed input)
- Progress indicators (Uploading File → Metadata → Minting)
- File size validation & MIME whitelist
- Better error UI (retry upload separately from mint)
- Signed URLs or RLS policies (currently public bucket URLs)
- Optional metadata versioning

## License
Proprietary (adjust as needed).
