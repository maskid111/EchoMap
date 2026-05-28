# EchoMap Architecture

EchoMap is a wallet-linked memory archive built around three durable layers:

- **Walrus** stores media and JSON metadata.
- **Sui Move registry** emits public events for memories, profiles, saves, and unsaves.
- **Tatum** verifies Sui transaction digests from a server-side API route.

The frontend treats Sui registry events as the source of truth. Browser cache is only used after successful on-chain sync and never as a production fallback.

## High-Level Architecture

```mermaid
flowchart TD
  User["User + Sui Wallet"] --> App["Next.js EchoMap App"]
  App --> WalrusPublisher["Walrus Publisher"]
  WalrusPublisher --> WalrusBlobs["Walrus Media + Metadata Blobs"]
  App --> WalletTx["Wallet Signed Transaction"]
  WalletTx --> SuiRegistry["Sui Move Event Registry"]
  SuiRegistry --> Events["Memory/Profile/Save Events"]
  Events --> Readers["Frontend Registry Readers"]
  Readers --> Explore["Public Explore Map"]
  Readers --> Profile["Wallet Profile Page"]
  App --> TatumApi["/api/tatum/sui/transaction"]
  TatumApi --> TatumRpc["Tatum Sui RPC"]
  TatumRpc --> ProofPanel["Verification Status"]
```

## Public Memory Upload Flow

```mermaid
sequenceDiagram
  actor User
  participant App as EchoMap App
  participant Walrus as Walrus
  participant Wallet as Sui Wallet
  participant Registry as Sui Registry
  participant Explore as Public Explore

  User->>App: Upload media, story, location, visibility=public
  App->>Walrus: Upload media file
  Walrus-->>App: mediaWalrusBlobId
  App->>Walrus: Upload metadata JSON
  Walrus-->>App: metadataWalrusBlobId
  App->>Wallet: Request register_memory transaction
  Wallet->>Registry: Execute transaction
  Registry-->>App: tx digest + MemoryCreated event
  App->>Explore: Public memory appears on map
```

Public memories appear on:

- Landing featured sections
- `/explore`
- public map pins
- creator public memory counts

## Unlisted Memory Upload Flow

```mermaid
sequenceDiagram
  actor User
  participant App as EchoMap App
  participant Walrus as Walrus
  participant Wallet as Sui Wallet
  participant Registry as Sui Registry
  participant Profile as Wallet Profile

  User->>App: Upload media, story, location, visibility=unlisted
  App->>Walrus: Upload media file
  Walrus-->>App: mediaWalrusBlobId
  App->>Walrus: Upload metadata JSON
  Walrus-->>App: metadataWalrusBlobId
  App->>Wallet: Request register_memory transaction
  Wallet->>Registry: Execute transaction
  Registry-->>App: MemoryCreated visibility=unlisted
  App->>Profile: Memory appears for creator wallet
```

Unlisted memories are not encrypted or private. They are stored on Walrus and linked to the uploader wallet, but hidden from public Explore and Landing.

## Profile Sync Flow

```mermaid
sequenceDiagram
  actor User
  participant App as Profile UI
  participant Walrus as Walrus
  participant Wallet as Sui Wallet
  participant Registry as Sui Registry

  User->>App: Edit display name, bio, avatar
  App->>Walrus: Upload avatar if selected
  Walrus-->>App: avatarWalrusBlobId
  App->>Walrus: Upload profile metadata JSON
  Walrus-->>App: profileMetadataBlobId
  App->>Wallet: Request update_profile transaction
  Wallet->>Registry: Execute transaction
  Registry-->>App: ProfileUpdated event
  App->>App: Update UI/cache after tx succeeds
```

If the Sui transaction fails, the profile is not saved and browser cache is not updated.

## Saved Memory Flow

```mermaid
sequenceDiagram
  actor User
  participant App as EchoMap UI
  participant Wallet as Sui Wallet
  participant Registry as Sui Registry

  User->>App: Click Save
  App->>Wallet: Request save_memory transaction
  Wallet->>Registry: Execute transaction
  Registry-->>App: MemorySaved event
  App->>App: Update saved state after tx succeeds

  User->>App: Click Unsave
  App->>Wallet: Request unsave_memory transaction
  Wallet->>Registry: Execute transaction
  Registry-->>App: MemoryUnsaved event
  App->>App: Latest event wins
```

Saved state is reconstructed from `MemorySaved` and `MemoryUnsaved` events. The latest event per metadata blob determines whether the memory is saved.

## Tatum Verification Flow

```mermaid
sequenceDiagram
  actor User
  participant UI as Proof Panel
  participant API as Next.js API Route
  participant Tatum as Tatum Sui RPC
  participant Sui as Sui Network

  User->>UI: Click Verify with Tatum
  UI->>API: GET /api/tatum/sui/transaction?digest=...
  API->>Tatum: sui_getTransactionBlock
  Tatum->>Sui: Fetch transaction data
  Sui-->>Tatum: Transaction block
  Tatum-->>API: RPC result
  API-->>UI: Clean verification status
```

Tatum is called server-side to avoid browser CORS issues and to keep API keys out of public client code.

