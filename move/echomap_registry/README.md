# EchoMap Memory Registry

This package provides an event-only registry for EchoMap memories, wallet profiles, and saved memories.

Each call to `register_memory` emits a `MemoryCreated` event containing:

- creator wallet
- media Walrus blob ID
- metadata Walrus blob ID
- title
- category
- location name
- latitude/longitude as strings
- year
- timestamp in milliseconds
- proof transaction digest, when available
- visibility (`public` or `unlisted`)

The first version is intentionally event-based. It does not create or maintain a shared object, table, or dynamic-field registry. Every registration emits a public `MemoryCreated` event, and the frontend discovers memories by querying those events by package/module/type.

No shared object is required for this design.

Profile updates and saved-memory actions follow the same event-only pattern:

- `update_profile` emits `ProfileUpdated`, linking a wallet to a Walrus profile metadata blob and optional avatar blob.
- `save_memory` emits `MemorySaved`, linking a wallet to a memory metadata Walrus blob ID.
- `unsave_memory` emits `MemoryUnsaved`, removing that saved state when it is the latest event for the blob ID.

The frontend reconstructs current profile and saved-memory state by querying these events. For saved memories, the latest `MemorySaved` or `MemoryUnsaved` event per metadata blob wins.

## Build

```bash
sui move build --path move/echomap_registry
```

## Publish To Testnet

```bash
sui client switch --env testnet
sui client publish move/echomap_registry --gas-budget 100000000
```

After publishing, set:

```env
NEXT_PUBLIC_ECHOMAP_PACKAGE_ID=0x...
```

Changing the `MemoryCreated` event shape requires republishing this package and updating `NEXT_PUBLIC_ECHOMAP_PACKAGE_ID` to the new package ID.

`NEXT_PUBLIC_ECHOMAP_REGISTRY_ID` is not required for the current event-only design.

## Publish To Mainnet

```bash
sui client switch --env mainnet
sui client publish move/echomap_registry --gas-budget 100000000
```

Then set the mainnet package ID in the frontend environment:

```env
NEXT_PUBLIC_ECHOMAP_PACKAGE_ID=0x...
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
```

## Frontend Read Path

The frontend queries `MemoryCreated` events from:

```text
{NEXT_PUBLIC_ECHOMAP_PACKAGE_ID}::registry::MemoryCreated
```

It also queries:

```text
{NEXT_PUBLIC_ECHOMAP_PACKAGE_ID}::registry::ProfileUpdated
{NEXT_PUBLIC_ECHOMAP_PACKAGE_ID}::registry::MemorySaved
{NEXT_PUBLIC_ECHOMAP_PACKAGE_ID}::registry::MemoryUnsaved
```

Local browser storage remains a fallback/cache when the registry package ID is not configured.

Because this registry is event-only, public discovery depends on Sui event availability or an indexer. A future version may add a shared object registry if direct object reads become necessary.
