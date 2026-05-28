import type { Achievement, MemoryDetail, MemoryPin, MemorySummary, UploadStep } from './types';

export const memoryYears = [2020, 2021, 2022, 2023, 2024, 2025] as const;

export const memoryCategories = [
  'Culture',
  'History',
  'Music',
  'Travel',
  'Crypto',
  'Campus',
  'Events',
] as const;

export const uploadCategories = [...memoryCategories, 'Personal'] as const;

export const uploadSteps: UploadStep[] = [
  { id: 1, title: 'Upload Media', description: 'Choose your moment' },
  { id: 2, title: 'Location', description: 'Where was this?' },
  { id: 3, title: 'Story', description: 'Tell your story' },
  { id: 4, title: 'Category', description: 'How to categorize?' },
  { id: 5, title: 'Preview', description: 'Review details' },
  { id: 6, title: 'Confirm', description: 'Preserve forever' },
];

export const featuredMemories: MemorySummary[] = [
  {
    id: '1',
    title: 'Nightlife in Yaba',
    location: 'Lagos, Nigeria',
    year: 2023,
    image: 'bg-gradient-to-br from-purple-900 to-pink-900',
  },
  {
    id: '2',
    title: 'EndSARS Memorial',
    location: 'Lagos, Nigeria',
    year: 2020,
    image: 'bg-gradient-to-br from-blue-900 to-cyan-900',
  },
  {
    id: '3',
    title: 'Web3 Lagos Meetup',
    location: 'Lagos, Nigeria',
    year: 2022,
    image: 'bg-gradient-to-br from-cyan-900 to-blue-900',
  },
  {
    id: '4',
    title: 'Tokyo Midnight Alley',
    location: 'Tokyo, Japan',
    year: 2024,
    image: 'bg-gradient-to-br from-pink-900 to-purple-900',
  },
];

export const memoryPins: MemoryPin[] = [
  {
    ...featuredMemories[0],
    lat: 6.5244,
    lng: 3.3792,
  },
  {
    ...featuredMemories[1],
    lat: 6.5244,
    lng: 3.3792,
  },
  {
    ...featuredMemories[2],
    lat: 6.5244,
    lng: 3.3792,
  },
  {
    ...featuredMemories[3],
    lat: 35.6762,
    lng: 139.6503,
  },
  {
    id: '5',
    lat: 35.6895,
    lng: 139.6917,
    title: 'Shibuya Crossing Dawn',
    location: 'Tokyo, Japan',
    year: 2023,
    image: 'bg-gradient-to-br from-orange-900 to-red-900',
  },
  {
    id: '6',
    lat: 48.8566,
    lng: 2.3522,
    title: 'Eiffel Tower Reflection',
    location: 'Paris, France',
    year: 2025,
    image: 'bg-gradient-to-br from-yellow-900 to-amber-900',
  },
];

export const memoryDetails: Record<string, MemoryDetail> = {
  '1': {
    ...memoryPins[0],
    creator: 'Chioma Adeyemi',
    creatorWallet: '0x742d35Cc6634C0532925a3b844Bc93e6eDeC5f7a',
    story:
      'A vibrant evening in Yaba, capturing the energy and life of Lagos nightlife. The streets were alive with music, laughter, and the unmistakable spirit of young Nigerians celebrating culture and connection. This memory represents the cultural richness of Lagos and the vibrant energy of its youth. The neon lights reflected off the wet pavement as crowds gathered in the streets. It was a moment where past and future collided, where tradition met modernity, and where the heart of Nigeria beat loudly.',
    verified: true,
    engagements: {
      views: 2450,
      saves: 342,
      shares: 187,
    },
    timestamp: '2023-08-15T22:30:00Z',
    categories: ['Culture', 'Travel', 'Music'],
  },
  '2': {
    ...memoryPins[1],
    creator: 'Adekunle Oluwaseyi',
    creatorWallet: '0x1234567890abcdef1234567890abcdef12345678',
    story:
      'A solemn gathering at Lekki Toll Gate to commemorate the EndSARS protests. This memory preserves an important moment in Nigerian history when citizens came together to demand accountability and justice.',
    verified: true,
    engagements: {
      views: 1810,
      saves: 278,
      shares: 143,
    },
    timestamp: '2020-10-20T18:00:00Z',
    categories: ['History', 'Culture'],
  },
  '3': {
    ...memoryPins[2],
    creator: 'Bukola Adekunle',
    creatorWallet: '0xabcdef1234567890abcdef1234567890abcdef12',
    story:
      "Developers, designers, and blockchain enthusiasts gathered to share knowledge about Web3 technology. This meetup marked an important milestone in the Nigerian tech community's adoption of decentralized technologies.",
    verified: true,
    engagements: {
      views: 1265,
      saves: 194,
      shares: 91,
    },
    timestamp: '2022-05-12T17:30:00Z',
    categories: ['Crypto', 'Events'],
  },
  '4': {
    ...memoryPins[3],
    creator: 'Aiko Tanaka',
    creatorWallet: '0x98fedcba7654321098fedcba7654321098fedcba',
    story:
      'A quiet neon-lit alley after midnight in Tokyo, where late trains, small restaurants, and passing conversations blended into a single city memory.',
    verified: false,
    engagements: {
      views: 980,
      saves: 141,
      shares: 58,
    },
    timestamp: '2024-02-03T00:15:00Z',
    categories: ['Travel', 'Culture'],
  },
  '5': {
    ...memoryPins[4],
    creator: 'Kenji Mori',
    creatorWallet: '0x567890abcdef1234567890abcdef1234567890ab',
    story:
      'Shibuya at dawn, just before the crossing filled again. The empty streets made one of the world’s busiest places feel briefly personal.',
    verified: false,
    engagements: {
      views: 740,
      saves: 88,
      shares: 37,
    },
    timestamp: '2023-11-18T05:40:00Z',
    categories: ['Travel', 'Personal'],
  },
  '6': {
    ...memoryPins[5],
    creator: 'Claire Laurent',
    creatorWallet: '0xfedcba9876543210fedcba9876543210fedcba98',
    story:
      'A golden reflection of the Eiffel Tower after rain, captured from a quiet corner along the Seine as the city lights came on.',
    verified: true,
    engagements: {
      views: 1560,
      saves: 216,
      shares: 104,
    },
    timestamp: '2025-04-09T20:10:00Z',
    categories: ['Travel', 'History'],
  },
};

export const profileAchievements: Achievement[] = [
  { id: 1, title: 'First Memory', icon: '🎬', description: 'Uploaded your first memory' },
  { id: 2, title: 'Storyteller', icon: '📖', description: 'Written 5+ detailed stories' },
  { id: 3, title: 'Global Explorer', icon: '🌍', description: 'Shared memories from 3+ countries' },
  { id: 4, title: 'Community Leader', icon: '👑', description: 'Received 1000+ engagements' },
];

export const activityMapOpacities = [
  0.08, 0.16, 0.22, 0.31, 0.12, 0.27,
  0.2, 0.34, 0.14, 0.25, 0.38, 0.18,
  0.29, 0.11, 0.24, 0.33, 0.17, 0.36,
  0.13, 0.28, 0.19, 0.35, 0.21, 0.1,
  0.32, 0.15, 0.26, 0.37, 0.23, 0.09,
  0.3, 0.18, 0.39, 0.12, 0.24, 0.34,
];
