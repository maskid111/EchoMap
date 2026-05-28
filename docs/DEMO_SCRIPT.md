# EchoMap Demo Script

Target length: 2-3 minutes.

## 1. Landing Page

“EchoMap is a decentralized memory archive. It lets people preserve media, stories, and locations on Walrus, register them on Sui, and verify the proof through Tatum.”

Show:

- Hero section
- CTA buttons
- Featured memories area
- Empty state or real public memories if already uploaded

## 2. Wallet Connect

“The product is wallet-linked. Profiles, memory registration, and saved memories are connected to the user’s Sui wallet.”

Show:

- Connect wallet button
- Connected wallet state

## 3. Profile Setup

Navigate to `/profile`.

“Profiles are not just local settings. The avatar and profile metadata are uploaded to Walrus, and the wallet emits a `ProfileUpdated` event on Sui.”

Show:

- Edit Profile
- Add display name, bio, avatar
- Save profile
- “Synced to Sui” state

## 4. X Card

“Once the profile is ready, EchoMap can generate a shareable profile card for social sharing.”

Show:

- Generate X Card
- Preview/download option

## 5. Public Memory Upload

Navigate to `/upload`.

“Now we preserve a memory. I’ll upload media, choose an exact map location, add the story and category, then choose Public visibility.”

Show:

- Media upload
- Location picker
- Story
- Title/category
- Visibility selector: Public
- Publish

Explain:

“Publishing requires all three steps: Walrus media upload, Walrus metadata upload, and Sui registry transaction. If the wallet has no gas, EchoMap does not pretend the memory was saved.”

## 6. Walrus Blob Proof

After successful upload or on memory detail page:

“The proof panel shows both the media blob and metadata blob. These are content-addressed Walrus records.”

Show:

- Media Walrus Blob ID
- Metadata Walrus Blob ID
- Open media/metadata blob links

## 7. Sui Registry Proof

“The memory is also registered through the EchoMap Move registry. The transaction digest is shown here, with a SuiScan link.”

Show:

- Sui transaction digest
- SuiScan link
- Visibility badge

## 8. Tatum Verification

“For judging and verification, EchoMap includes a Tatum-backed server route that fetches Sui transaction data without exposing API keys in the browser.”

Show:

- Click “Verify with Tatum”
- Verification status

## 9. Public Explore

Navigate to `/explore`.

“Public memories appear on the interactive world map. Search, timeline, and category filters update the visible pins.”

Show:

- Map pin
- Hover label
- Click pin
- Memory panel opens

## 10. Unlisted Memory Behavior

Upload another memory or explain from Profile:

“Unlisted memories are stored on Walrus and registered to the wallet, but they do not appear in public Explore or Landing. They are not encrypted; they are hidden from public discovery.”

Show:

- Upload with Unlisted selected
- Profile shows the memory
- Explore does not show it
- Detail page shows Unlisted badge when opened from Profile

## 11. Profile Recovery

“Because the registry events are the source of truth, clearing browser storage does not erase successful on-chain profiles or memories.”

Show or explain:

- Clear local storage
- Reconnect same wallet
- Profile reloads from Sui event + Walrus metadata
- Uploaded wallet memories are recovered from registry events

## Closing

“EchoMap demonstrates a real product path for decentralized cultural memory: Walrus for storage, Sui for registry and wallet-linked state, Tatum for transaction verification, and a polished map-first user experience.”

