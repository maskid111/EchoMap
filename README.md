# EchoMap

**Preserve the world's memories on Walrus, register them on Sui, and verify them with Tatum.**

EchoMap is a decentralized memory archive for preserving meaningful places, stories, media, and cultural moments. Users upload media to Walrus, register memory metadata through a Sui Move event registry, and explore public memories on an interactive world map.

## Problem

Important personal, cultural, and historical memories are scattered across centralized platforms where they can be deleted, buried, decontextualized, or disconnected from the places and people that give them meaning.

Most archive products also fail at provenance: even when media is stored, it is hard to tell who preserved it, where the metadata lives, and whether the record can be independently verified.

## Solution

EchoMap combines decentralized storage, wallet-linked identity, and map-based discovery:

- **Walrus** stores memory media and metadata blobs.
- **Sui** records memory, profile, and saved-memory events through a Move registry.
- **Tatum** provides server-side Sui transaction verification for proof panels.
- **MapLibre** powers an interactive world map for public discovery.

The result is a product where a memory is not just uploaded; it is stored, registered, discoverable, and verifiable.

## Key Features

- Upload image or video memories.
- Store media and metadata JSON on Walrus.
- Register memories on Sui through wallet-signed transactions.
- Public Explore map with real lat/lng pins.
- Public and unlisted visibility modes.
- Wallet-linked profile sync through Sui events.
- Wallet-linked saved memories through Sui events.
- SuiScan links for proof transactions and Walrus object references.
- Tatum verification button for Sui transaction checks.
- Profile page with real stats, achievements, uploaded memories, and saved memories.
- Shareable profile card generation.
- Responsive cinematic UI across desktop, tablet, and mobile.

## Architecture

```text
User Wallet
   |
   | signs transactions
   v
Next.js App ---------------------> Walrus Publisher
   |                                  |
   | uploads media + metadata          v
   |                              Walrus Blob IDs
   |
   | registers memory/profile/save events
   v
Sui Move Registry
   |
   | emits events
   v
Frontend Registry Readers
   |
   | public memories -> Explore map
   | wallet memories -> Profile
   | saved events -> Saved state
   v
EchoMap UI

Tatum server route verifies Sui transaction digests on demand.
```

## Walrus Usage

EchoMap uses Walrus for durable content storage:

- Media files are uploaded with `uploadFileToWalrus(file)`.
- Memory metadata JSON is uploaded after media upload.
- Profile avatars can be uploaded to Walrus.
- Profile metadata JSON is uploaded to Walrus.
- Blob URLs are read through:

```text
{NEXT_PUBLIC_WALRUS_AGGREGATOR_URL}/v1/blobs/{blobId}
```

Each memory stores:

- `mediaWalrusBlobId`
- `metadataWalrusBlobId`
- optional Walrus Sui object/reference fields
- media type, MIME type, file name, and file size

## Sui Registry Usage

EchoMap includes a Move package at:

```text
move/echomap_registry
```

The registry is event-based. It does not require a shared object for the current design. The frontend discovers state by querying emitted events.

Current event types:

- `MemoryCreated`
- `ProfileUpdated`
- `MemorySaved`
- `MemoryUnsaved`

Memory registration stores:

- creator wallet
- media Walrus blob ID
- metadata Walrus blob ID
- title
- category
- location name
- lat/lng as strings
- year
- timestamp
- proof transaction digest
- visibility: `public` or `unlisted`

Profile and saved-memory state are also wallet-linked through registry events.

## Tatum Verification Usage

Direct browser calls to Tatum RPC can run into CORS/header restrictions, so EchoMap uses a server-side route:

```text
GET /api/tatum/sui/transaction?digest={txDigest}
```

The API route calls Sui JSON-RPC method `sui_getTransactionBlock` using Tatum RPC, optionally with the server-side `TATUM_API_KEY`.

Memory proof panels expose:

- Sui transaction digest
- SuiScan link
- “Verify with Tatum” action
- verification status feedback

## Public vs Unlisted Memories

EchoMap supports two visibility modes:

- **Public:** appears on the world map, Landing featured sections, and public Explore.
- **Unlisted:** stored on Walrus and linked to the uploader wallet, but hidden from public Explore and Landing.

Unlisted memories are not encrypted or private. They are simply excluded from public discovery surfaces. The uploader can still access them through their wallet-linked Profile when the memory is resolved from registry events.

Older memories without a visibility field are treated as public.

## Wallet-Linked Profiles and Saves

Profiles and saved memories use Sui registry events as the source of truth.

Profile flow:

1. User edits display name, bio, and optional avatar.
2. Avatar is uploaded to Walrus if selected.
3. Profile metadata JSON is uploaded to Walrus.
4. Wallet signs `update_profile`.
5. UI/cache update only after the Sui transaction succeeds.

Saved-memory flow:

1. User clicks save or unsave.
2. Wallet signs `save_memory` or `unsave_memory`.
3. Latest save/unsave event wins.
4. UI state updates only after the Sui transaction succeeds.

Browser cache is used only after successful on-chain sync. It is not a source of truth.

## Tech Stack

- **Framework:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS, custom glassmorphism/cinematic UI
- **Wallet/Sui:** `@mysten/dapp-kit`, `@mysten/sui`
- **Storage:** Walrus publisher and aggregator endpoints
- **Verification:** Tatum Sui RPC through Next.js API route
- **Maps:** MapLibre GL with free map styles
- **State:** React context memory store
- **Move:** Sui Move event registry

## Environment Variables

Create `.env.local` from `.env.example`.

```env
# App
NEXT_PUBLIC_APP_NAME=EchoMap
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Sui browser wallet RPC
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_ECHOMAP_PACKAGE_ID=

# Walrus testnet
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# Tatum server-side verification
TATUM_SUI_RPC_URL=https://sui-testnet.gateway.tatum.io
TATUM_API_KEY=
```

Notes:

- `NEXT_PUBLIC_ECHOMAP_PACKAGE_ID` must be set after publishing the Move package.
- `TATUM_API_KEY` is server-side only. Do not expose it as a public env var.
- `NEXT_PUBLIC_TATUM_SUI_RPC_URL` may remain for compatibility, but server-side `TATUM_SUI_RPC_URL` is preferred for verification.

## Local Setup

Install dependencies:

```bash
corepack pnpm install
```

Run the app:

```bash
corepack pnpm dev
```

Open:

```text
http://localhost:3000
```

Validate:

```bash
corepack pnpm lint
corepack pnpm build
```

## Move Contract Deployment

Build the registry:

```bash
sui move build --path move/echomap_registry
```

Publish to Sui testnet:

```bash
sui client switch --env testnet
sui client publish move/echomap_registry --gas-budget 100000000
```

After publishing, copy the package ID and set:

```env
NEXT_PUBLIC_ECHOMAP_PACKAGE_ID=0x...
```

If the Move event shape changes, republish the package and update the package ID.

## Demo Flow

1. Open EchoMap and connect a Sui testnet wallet.
2. Set up a profile from `/profile`.
3. Upload an image or video memory from `/upload`.
4. Choose a location on the MapLibre picker.
5. Select Public or Unlisted visibility.
6. Publish the memory:
   - media uploads to Walrus
   - metadata uploads to Walrus
   - wallet signs the Sui registry transaction
7. View public memories on `/explore`.
8. Open a memory detail page and inspect:
   - media
   - metadata blob ID
   - Sui transaction digest
   - SuiScan link
   - Tatum verification
9. Save/unsave a memory with a wallet transaction.
10. Return to Profile to see wallet-linked memories, saves, stats, and profile card.

## Future Improvements

- Add a production indexer for faster event queries and pagination.
- Add private/encrypted memory mode separate from unlisted.
- Add richer metadata schemas and moderation/reporting tools.
- Add collection pages and collaborative archives.
- Add profile discovery and creator pages.
- Add comments/reactions backed by Sui events.
- Add mainnet deployment configuration.
- Add automated contract tests and frontend integration tests.
- Add optional AI-assisted tagging and location enrichment.

## Status

EchoMap is hackathon-ready with real Walrus uploads, real Sui wallet transactions, an event-based Sui registry, Tatum transaction verification, wallet-linked profiles, wallet-linked saves, and production-oriented source-of-truth behavior.

## Submission Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Mainnet Readiness](docs/MAINNET_READINESS.md)
- [Demo Script](docs/DEMO_SCRIPT.md)
