module echomap_registry::registry;

use std::string::String;
use sui::event;
use sui::tx_context::{sender, TxContext};

/// Event emitted for every EchoMap memory registration.
/// This first registry version is event-based: no shared registry object is
/// created or mutated. Public indexers and the frontend discover memories by
/// querying `MemoryCreated` events for this package.
public struct MemoryCreated has copy, drop {
    creator: address,
    media_walrus_blob_id: String,
    metadata_walrus_blob_id: String,
    title: String,
    category: String,
    location_name: String,
    lat: String,
    lng: String,
    year: u64,
    timestamp_ms: u64,
    proof_tx_digest: String,
    visibility: String,
}

/// Event emitted when a wallet updates its public EchoMap profile.
/// The profile document itself lives on Walrus; this event links the wallet to
/// the latest metadata blob for public recovery without a shared registry object.
public struct ProfileUpdated has copy, drop {
    owner: address,
    profile_metadata_blob_id: String,
    avatar_walrus_blob_id: String,
    display_name: String,
    timestamp_ms: u64,
}

/// Event emitted when a wallet saves a memory.
/// Saved state is reconstructed by indexing MemorySaved and MemoryUnsaved events;
/// the latest event for a metadata blob wins.
public struct MemorySaved has copy, drop {
    owner: address,
    metadata_walrus_blob_id: String,
    memory_creator: address,
    timestamp_ms: u64,
}

/// Event emitted when a wallet removes a saved memory.
public struct MemoryUnsaved has copy, drop {
    owner: address,
    metadata_walrus_blob_id: String,
    timestamp_ms: u64,
}

/// Register a memory by emitting a public event.
/// String fields are passed as Move `String` values by the frontend transaction.
public entry fun register_memory(
    media_walrus_blob_id: String,
    metadata_walrus_blob_id: String,
    title: String,
    category: String,
    location_name: String,
    lat: String,
    lng: String,
    year: u64,
    timestamp_ms: u64,
    proof_tx_digest: String,
    visibility: String,
    ctx: &mut TxContext,
) {
    event::emit(MemoryCreated {
        creator: sender(ctx),
        media_walrus_blob_id,
        metadata_walrus_blob_id,
        title,
        category,
        location_name,
        lat,
        lng,
        year,
        timestamp_ms,
        proof_tx_digest,
        visibility,
    });
}

/// Update the caller's public profile pointer.
public entry fun update_profile(
    profile_metadata_blob_id: String,
    avatar_walrus_blob_id: String,
    display_name: String,
    timestamp_ms: u64,
    ctx: &mut TxContext,
) {
    event::emit(ProfileUpdated {
        owner: sender(ctx),
        profile_metadata_blob_id,
        avatar_walrus_blob_id,
        display_name,
        timestamp_ms,
    });
}

/// Save a memory by its metadata Walrus blob ID.
public entry fun save_memory(
    metadata_walrus_blob_id: String,
    memory_creator: address,
    timestamp_ms: u64,
    ctx: &mut TxContext,
) {
    event::emit(MemorySaved {
        owner: sender(ctx),
        metadata_walrus_blob_id,
        memory_creator,
        timestamp_ms,
    });
}

/// Remove a saved memory by its metadata Walrus blob ID.
public entry fun unsave_memory(
    metadata_walrus_blob_id: String,
    timestamp_ms: u64,
    ctx: &mut TxContext,
) {
    event::emit(MemoryUnsaved {
        owner: sender(ctx),
        metadata_walrus_blob_id,
        timestamp_ms,
    });
}
