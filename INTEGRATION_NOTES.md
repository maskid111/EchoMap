# EchoMap Integration Notes

This export now has the real client-side interaction layer for Sui wallet connection, map exploration, shared memory state, upload form state, Walrus media uploads, and a minimal Sui transaction proof layer. It still keeps mock memory data and does not perform smart contract writes yet.

## Current State

- UI routes are still mock-driven: home, explore, profile, upload, and memory detail.
- Shared app-facing types live in `lib/types.ts`.
- Mock fixtures live in `lib/mock-data.ts`.
- Shared explore/filter/save state lives in `store/memory-store.ts`.
- Upload draft validation and local preview helpers live in `lib/upload-utils.ts` and `types/upload.ts`.
- Walrus upload/read helpers live in `lib/walrus.ts`.
- Minimal Sui proof transaction helpers live in `lib/sui-proof.ts`.
- The event-based Sui Memory Registry Move package lives in `move/echomap_registry`.
- Registry frontend helpers live in `lib/registry.ts`.
- The Explore surface uses a real client-only MapLibre GL JS world map with mock memory coordinates, glowing HTML markers, hover labels, zoom/pan controls, and click-to-open memory details.
- The Upload flow includes a MapLibre location picker: users can search place names with OpenStreetMap Nominatim, zoom/pan, click the map to save exact latitude/longitude into the upload draft, or use browser geolocation to place the marker.
- Publishing from the Upload preview step uploads the selected media file to the configured Walrus publisher, uploads a second JSON metadata object to Walrus, builds a memory entry with both returned blob ids and aggregator URL, optionally asks a connected wallet to execute a minimal Sui proof transaction, stores the resulting transaction digest when available, and persists uploaded memories to `localStorage`.
- Sui wallet connection is wired with `@mysten/dapp-kit` and `@mysten/sui`.
- `next.config.mjs` no longer ignores TypeScript build errors.
- `.env.example` lists expected future environment variables with empty or public placeholder values.

## Wallet Integration Status

- `providers/sui-provider.tsx` wraps the app with `QueryClientProvider`, `SuiClientProvider`, and `WalletProvider`.
- `lib/sui-client.ts` defaults browser wallet execution to the standard Sui testnet RPC, with `NEXT_PUBLIC_SUI_RPC_URL` available as an override.
- `NEXT_PUBLIC_TATUM_SUI_RPC_URL` remains available as a non-secret fallback RPC URL for server-side verification, but it is not used by the browser dapp-kit wallet transaction path.
- `app/api/tatum/sui/transaction/route.ts` provides a server-side Tatum verification path for Sui transaction digests. It calls `sui_getTransactionBlock` with effects, events, input, and object changes enabled, and sends the server-only `TATUM_API_KEY` as `x-api-key` when configured.
- `components/WalletConnectButton.tsx` uses dapp-kit `ConnectModal`, `useCurrentAccount`, `useCurrentWallet`, and `useDisconnectWallet`.
- Connected accounts are displayed as shortened addresses and can be disconnected from the UI.
- Wallet signing/execution is implemented only for the minimal proof transaction. Object reads, package calls, and contract interactions are not implemented yet.
- When `NEXT_PUBLIC_ECHOMAP_PACKAGE_ID` is configured, upload uses the wallet to call `registry::register_memory` instead of the minimal self-transfer proof. The resulting transaction digest becomes the memory proof digest.

## Sui Proof Status

- `lib/sui-proof.ts` creates a minimal `Transaction` that splits 1 MIST from gas and transfers it back to the connected sender. This produces a real Sui transaction digest without requiring a Move package.
- `lib/registry.ts` creates the registry transaction when the EchoMap package ID is configured. The Move call emits `MemoryCreated`, making the memory publicly discoverable by event queries.
- Proof creation requires a connected wallet and a browser-safe Sui RPC. By default this is the standard Sui testnet fullnode.
- Uploads without a connected wallet still succeed as `walrus-only`.
- If the wallet rejects the transaction, browser Sui RPC is unavailable, or execution fails, the memory is still stored with the Walrus blob and a failed/pending proof message.
- Memory detail surfaces show media and metadata Walrus blob ids, Walrus Sui object/reference details when returned by the publisher, Sui transaction digest when available, and a SuiScan link.

## Walrus Integration Status

- `lib/walrus.ts` validates `NEXT_PUBLIC_WALRUS_PUBLISHER_URL` and `NEXT_PUBLIC_WALRUS_AGGREGATOR_URL`.
- Uploads use the Walrus publisher endpoint at `/v1/blobs?epochs=5` with the selected file as the request body.
- After the media upload succeeds, the app uploads a metadata JSON blob containing title, story, location, coordinates, category/categories, year, creator, creator wallet, media blob id, media URL, and timestamp.
- Reads use the aggregator URL shape `/v1/blobs/{blobId}`.
- `normalizeWalrusResponse` recursively checks common Walrus response shapes and extracts `blobId`, plus Sui object/reference fields such as `objectId`, `suiObjectId`, `blobObjectId`, `suiRef`, and `objectRef` when present.
- Missing Walrus env vars show a clear upload error and do not crash the app.
- Uploaded memory metadata is stored on Walrus and also mirrored into browser-local app state for immediate display. Refreshes keep uploaded memories through `localStorage`, but another browser/device will not see them until a shared backend, indexer, or Sui registry is added.

## Map Implementation

- `app/explore/components/InteractiveWorldMap.tsx` is client-only and lazy-loaded through `GlobeVisualization`.
- `app/upload/components/LocationPickerMap.tsx` provides the upload location picker.
- The map library is `maplibre-gl`.
- The selected free map source is OpenFreeMap MapLibre styles served from `https://tiles.openfreemap.org/styles/*`; the app defaults to the brighter `bright` style and exposes a small style toggle for `Bright`, `Clean Light`, `Liberty`, and `Cinematic Dark`.
- The OpenFreeMap styles are no-token and no-billing. A satellite-style source is not enabled yet because the current free providers reviewed for this pass were either not satellite imagery or would add reliability/licensing risk for a demo build.
- `lib/map-style.ts` fetches the OpenFreeMap style JSON and normalizes label configuration before MapLibre receives it: labels use an English/Latin-friendly field stack and `Noto Sans Regular` to avoid noisy missing-glyph warnings from unavailable bold/non-Latin glyph ranges.
- Upload place search uses the public OpenStreetMap Nominatim search endpoint and should be replaced with a production geocoding provider or server-side proxy before heavy usage.
- `NEXT_PUBLIC_MAPBOX_TOKEN` is reserved in `.env.example` for a future Mapbox-backed style if needed, but it is not required by the current MapLibre/OpenFreeMap setup.
- Memory pins come from the global memory store and update when timeline, category, or search filters change.
- Pin clicks set the active memory in global state and open the right-side memory panel.
- The active panel closes when filters remove that memory from the visible result set.

## Planned Boundaries

Use a small adapter layer when real services are added:

- `lib/services/sui.ts`: future package/object reads, memory registry writes, and richer transaction helpers.
- `lib/services/walrus.ts`: media upload, blob status, blob read URL construction.
- `lib/services/tatum.ts`: hosted RPC/client helpers where Tatum is the provider.
- `lib/repositories/memories.ts`: app-level memory reads/writes that combine Sui metadata and Walrus media.

Keep React pages consuming typed app models from `lib/types.ts`; avoid importing SDK-specific response shapes directly into components.

## Suggested Data Flow

1. Upload media to Walrus and capture the returned blob id plus Walrus Sui object/reference when present. This is now implemented client-side for testnet/demo use.
2. Upload memory metadata JSON to Walrus and capture its blob id plus Walrus Sui object/reference when present.
3. Execute a minimal Sui proof transaction and store its digest locally. This is implemented when a wallet is connected.
4. Write memory metadata to Sui, including media/metadata blob ids, location, year, category tags, creator address, and content hash where available.
5. Read memory lists from Sui or an indexed API, then derive Walrus display URLs at the repository layer.
6. Use Tatum only as the configured RPC/provider abstraction if it remains part of the deployment plan.

## Environment Notes

- Never commit populated private keys or API keys.
- Public `NEXT_PUBLIC_*` values are exposed to the browser.
- Keep server-only secrets unprefixed and access them only from server routes/actions when integration work begins.

## Not Implemented Yet

- Persistent backend/indexer.

## Remaining Walrus Tasks

- Add richer Walrus upload staging/progress beyond the current publish button state.
- Store returned content hashes when the response provides them.
- Add upload progress, retry, and failure states.
- Decide whether uploads should happen directly from the browser or through a server route before production.

## Remaining Tatum Tasks

- Confirm the final Tatum Sui RPC endpoint format and auth requirements for production.
- Expand the Tatum verification route into a richer proof audit view if Tatum remains part of the stack.
- Keep Tatum out of direct browser wallet execution unless its CORS policy allows the headers sent by the Mysten SDK.
- If server-side auth is required, keep `TATUM_API_KEY` out of client bundles and proxy calls through route handlers.
