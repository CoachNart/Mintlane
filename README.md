# Mintlane

Mintlane is a Solana launchpad interface for token discovery, token launch setup, wallet-connected portfolio views, and creator-fee tracking.

## Run locally

- Node.js 20 or newer
- `npm install`
- Copy `.env.example` to `.env.local` if you want to configure a custom RPC endpoint
- `npm run dev`
- `npm run typecheck`
- `npm run build`

The starter uses Solana devnet by default. Connect Phantom or Solflare to test wallet connectivity.

## Product status — read before mainnet

The UI is scaffolded and responsive. Market cards are explicitly marked as sample/demo data until a verified live market-data provider is configured. Draft launch details and local preferences are saved in the browser only.

**Token deployment and creator-fee claiming are not yet connected to a launch protocol.** A regular SPL token mint does not by itself implement a bonding curve, liquidity migration, or trade-based creator-fee rewards. Those actions must be wired to a selected, audited protocol SDK/program and verified on devnet before mainnet. No private key is stored by this app and no transaction is silently submitted.

## Suggested integration sequence

1. Confirm launch mechanism and creator-fee terms with the chosen protocol.
2. Add the protocol SDK behind a typed launch adapter; simulate and verify every instruction on devnet.
3. Add a real market-data provider and token metadata/indexing source.
4. Read creator reward balances from the protocol and implement signed claim transactions.
5. Add transaction-status tracking, error telemetry, rate limits, and security review.
6. Only then configure mainnet RPC and production deployment.

## Environment

- `VITE_SOLANA_RPC_URL`: optional RPC URL. Development defaults to Solana devnet.
- `VITE_MARKET_DATA_URL`: optional compatible market-data endpoint; sample data remains labelled demo until integration is implemented.

Never put seed phrases, private keys, or server secrets in frontend environment variables.