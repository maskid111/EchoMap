export interface MemorySummary {
  id: string;
  title: string;
  location: string;
  year: number;
  image: string;
  source?: 'starter' | 'uploaded';
  mediaType?: 'image' | 'video' | 'audio' | 'unknown';
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  walrusBlobId?: string;
  mediaWalrusBlobId?: string;
  metadataWalrusBlobId?: string;
  walrusSuiObjectId?: string;
  mediaWalrusSuiObjectId?: string;
  metadataWalrusSuiObjectId?: string;
  suiRef?: string;
  mediaUrl?: string;
  suiTxDigest?: string;
  proofStatus?: 'starter' | 'walrus-only' | 'verified' | 'failed';
  visibility?: 'public' | 'unlisted';
}

export interface MemoryPin extends MemorySummary {
  lat: number;
  lng: number;
}

export interface MemoryDetail extends MemoryPin {
  creator: string;
  creatorWallet: string;
  story: string;
  verified: boolean;
  engagements: {
    views: number;
    saves: number;
    shares: number;
  };
  timestamp: string;
  categories: string[];
}

export interface Achievement {
  id: number;
  title: string;
  icon: string;
  description: string;
}

export interface UploadStep {
  id: number;
  title: string;
  description: string;
}
