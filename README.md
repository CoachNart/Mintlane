# Mintlane

Mintlane is a Solana launchpad frontend for token discovery, token creation, and creator-fee rewards.

## Run locally

- Node.js 20 or newer
- `npm install`
- Copy `.env.example` to `.env.local` if you want to configure a custom RPC endpoint
- `npm run dev`
- `npm run typecheck`
- `npm run build`

The wallet and launch flow default to Solana devnet. Connect Phantom or Solflare and fund that wallet with devnet SOL for test transactions.

## Current implementation

- Responsive Mintlane workspace: overview, discovery, launch flow, portfolio, creator earnings, activity, and settings.
- Phantom/Solflare wallet adapter integration.
- Metaplex Genesis bonding-curve launch integration using the official SDK API. Token creation is configured for **devnet only**.
- Creator fee wallet is set to the connected creator wallet.
- Creator reward claim flow asks the Genesis API for eligible claim transactions and requests wallet approval before sending them.
- Token launch drafts and locally created launch records are saved in browser local storage.
- Discovery cards are illustrative demo data until a live market-data/indexing provider is connected. They are clearly labelled and must not be treated as real prices or executable markets.

## Important launch requirements

- The Genesis bonding-curve flow uses a fixed protocol supply of 1,000,000,000 tokens with 6 decimals; the UI reflects this.
- Token metadata image must be a public Irys gateway URL (`https://gateway.irys.xyz/...`). This starter accepts an existing Irys URL; it does not yet upload image files to Irys for you.
- A real launch requires a connected wallet, devnet SOL, and the wallet approval of the requested transactions. Never share a seed phrase or private key.
- Creator rewards depend on eligible trades and protocol state; this UI does not invent or guarantee earnings. Claiming on devnet only affects devnet rewards.
- This is a devnet implementation and has not been independently security-audited. Do not switch to mainnet until launch and claim flows have been tested end-to-end and reviewed.

## Protocol references

- [Metaplex Genesis bonding-curve launch guide](https://www.metaplex.com/docs/smart-contracts/genesis/bonding-curve-launch)
- [Genesis API client and creator reward claims](https://www.metaplex.com/docs/smart-contracts/genesis/sdk/api-client)
- [Genesis creator-fee documentation](https://www.metaplex.com/docs/smart-contracts/genesis/creator-fees)

## Environment

- Solana RPC is intentionally locked to public devnet in this build. Mainnet is not configurable from the frontend yet.
- `VITE_MARKET_DATA_URL`: reserved for a future live market-data provider integration.

Never put seed phrases, private keys, or server secrets in frontend environment variables.
