# EchoMap Mainnet Readiness

EchoMap currently targets Sui testnet and Walrus testnet for hackathon validation. This document lists what must change before a mainnet demo or deployment.

## Current Testnet Setup

Current expected environment:

```env
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_ECHOMAP_PACKAGE_ID=0x...

NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

TATUM_SUI_RPC_URL=https://sui-testnet.gateway.tatum.io
TATUM_API_KEY=
```

## Environment Variables To Change For Mainnet

Update:

```env
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
NEXT_PUBLIC_ECHOMAP_PACKAGE_ID=0x_MAINNET_PACKAGE_ID

NEXT_PUBLIC_WALRUS_PUBLISHER_URL=<walrus-mainnet-publisher-url>
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=<walrus-mainnet-aggregator-url>

TATUM_SUI_RPC_URL=<tatum-sui-mainnet-rpc-url>
TATUM_API_KEY=<server-side-key>
```

Keep `TATUM_API_KEY` server-side only. Do not expose it as `NEXT_PUBLIC_*`.

## Sui Registry Mainnet Deployment

Build:

```bash
sui move build --path move/echomap_registry
```

Switch to mainnet:

```bash
sui client switch --env mainnet
```

Publish:

```bash
sui client publish move/echomap_registry --gas-budget 100000000
```

Then update:

```env
NEXT_PUBLIC_ECHOMAP_PACKAGE_ID=0x...
```

Important: if the event/function shape changes, the package must be republished and the app must use the new package ID.

## Walrus Mainnet Notes

Before mainnet:

- Confirm the current Walrus mainnet publisher and aggregator URLs.
- Confirm upload cost, epoch duration, and retention expectations.
- Confirm response shape for blob IDs and Sui object references.
- Test image and video uploads.
- Test metadata JSON reads from the aggregator.

EchoMap stores both media and metadata JSON on Walrus, so both publisher and aggregator endpoints must be available.

## Tatum Mainnet RPC Env

For mainnet transaction verification:

```env
TATUM_SUI_RPC_URL=<mainnet-sui-tatum-rpc>
TATUM_API_KEY=<server-side-key>
```

The verification route calls:

```text
sui_getTransactionBlock
```

with effects, events, inputs, and object changes enabled.

## Final Checklist Before Mainnet Demo

- [ ] Publish latest Move registry to mainnet.
- [ ] Update `NEXT_PUBLIC_ECHOMAP_PACKAGE_ID`.
- [ ] Set mainnet Sui RPC.
- [ ] Set mainnet Walrus publisher and aggregator.
- [ ] Set Tatum mainnet RPC and server-side API key.
- [ ] Upload a public image memory.
- [ ] Upload a public video memory.
- [ ] Upload an unlisted memory and confirm it does not appear in public Explore.
- [ ] Confirm profile save requires wallet gas and syncs through Sui.
- [ ] Confirm saved/unsaved memory events sync after refresh.
- [ ] Confirm Tatum verification works for a Sui transaction digest.
- [ ] Clear browser storage and verify profile/memories recover from chain events.
- [ ] Confirm SuiScan links point to mainnet.
- [ ] Run `corepack pnpm lint`.
- [ ] Run `corepack pnpm build`.

