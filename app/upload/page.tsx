'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, MapPin, FileText, Tag, CheckCircle, Cloud, Search } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { AppShell } from '@/components/layout/AppShell';
import { MapStyleToggle } from '@/components/MapStyleToggle';
import { MemoryMedia } from '@/components/MemoryMedia';
import { UploadStepper } from './components/UploadStepper';
import { LocationPickerMap } from './components/LocationPickerMap';
import { uploadCategories, uploadSteps } from '@/lib/mock-data';
import { defaultEchoMapStyle, type EchoMapStyleId } from '@/lib/map-style';
import type { MemoryDetail } from '@/lib/types';
import {
  getWalrusBlobUrl,
  uploadFileToWalrus,
  uploadJsonToWalrus,
  validateWalrusConfig,
} from '@/lib/walrus';
import { createRegisterMemoryTransaction, getRegistryConfig } from '@/lib/registry';
import { useMemoryStore } from '@/store/memory-store';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import {
  createInitialUploadDraft,
  createLocalMediaPreview,
  maxStoryLength,
  releaseLocalMediaPreview,
  validateUploadStep,
} from '@/lib/upload-utils';

export default function UploadPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(createInitialUploadDraft);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [publishedBlobId, setPublishedBlobId] = useState<string | null>(null);
  const [publishedMetadataBlobId, setPublishedMetadataBlobId] = useState<string | null>(null);
  const [publishedSuiDigest, setPublishedSuiDigest] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<EchoMapStyleId>(defaultEchoMapStyle);
  const account = useCurrentAccount();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const { addMemory, setSelectedYear } = useMemoryStore();

  const validation = useMemo(
    () => validateUploadStep(currentStep, formData),
    [currentStep, formData]
  );

  useEffect(() => {
    return () => releaseLocalMediaPreview(formData.mediaPreview);
  }, [formData.mediaPreview]);

  const handleMediaUpload = (file: File) => {
    releaseLocalMediaPreview(formData.mediaPreview);
    setFormData((current) => ({
      ...current,
      media: file,
      mediaPreview: createLocalMediaPreview(file),
    }));
    if (currentStep === 1) setCurrentStep(2);
  };

  const handleCategoryToggle = (category: string) => {
    setFormData({
      ...formData,
      selectedCategories: formData.selectedCategories.includes(category)
        ? formData.selectedCategories.filter((c) => c !== category)
        : [...formData.selectedCategories, category],
    });
  };

  const isValidCoordinate = (coordinates: { lat: number; lng: number }) =>
    Number.isFinite(coordinates.lat) &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    Number.isFinite(coordinates.lng) &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180;

  const createMemoryId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `local-${crypto.randomUUID()}`;
    }

    return `local-${Date.now()}`;
  };

  const getMediaType = (file: File): MemoryDetail['mediaType'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'unknown';
  };

  const resetUploadFlow = () => {
    releaseLocalMediaPreview(formData.mediaPreview);
    setFormData(createInitialUploadDraft());
    setCurrentStep(1);
    setIsSearchingLocation(false);
    setLocationSearchError(null);
    setIsPublishing(false);
    setPublishError(null);
    setProofError(null);
    setPublishedBlobId(null);
    setPublishedMetadataBlobId(null);
    setPublishedSuiDigest(null);
    setMapStyle(defaultEchoMapStyle);
  };

  const publishMemory = async () => {
    if (!formData.media || !formData.coordinates) {
      return;
    }

    const walrusConfig = validateWalrusConfig();
    if (!walrusConfig.valid) {
      setPublishError(`Missing Walrus configuration: ${walrusConfig.missing.join(', ')}`);
      return;
    }

    const registryConfig = getRegistryConfig();
    if (!account) {
      setPublishError('Connect wallet to register this memory on-chain.');
      return;
    }
    if (!registryConfig.configured) {
      setPublishError('EchoMap registry package is not configured. Memory registration is unavailable.');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setProofError(null);
    setPublishedBlobId(null);
    setPublishedMetadataBlobId(null);
    setPublishedSuiDigest(null);

    try {
      const mediaType = getMediaType(formData.media);
      const mediaUpload = await uploadFileToWalrus(formData.media);
      const mediaUrl = getWalrusBlobUrl(mediaUpload.blobId);
      const timestamp = new Date().toISOString();
      const year = new Date(timestamp).getFullYear();
      const metadataUpload = await uploadJsonToWalrus({
        schema: 'echomap.memory.metadata.v1',
        title: formData.title.trim(),
        story: formData.story.trim(),
        location: formData.location.trim(),
        coordinates: formData.coordinates,
        category: formData.selectedCategories[0] || 'Uncategorized',
        categories: formData.selectedCategories,
        year,
        creator: account?.label || 'EchoMap Contributor',
        creatorWallet: account?.address || 'Wallet not connected',
        mediaWalrusBlobId: mediaUpload.blobId,
        mediaUrl,
        mediaType,
        mimeType: formData.media.type || 'application/octet-stream',
        fileName: formData.media.name,
        fileSize: formData.media.size,
        visibility: formData.visibility,
        timestamp,
      });
      let suiTxDigest: string | undefined;
      try {
        const transaction = createRegisterMemoryTransaction({
          mediaWalrusBlobId: mediaUpload.blobId,
          metadataWalrusBlobId: metadataUpload.blobId,
          title: formData.title.trim(),
          category: formData.selectedCategories[0] || 'Uncategorized',
          locationName: formData.location.trim(),
          lat: formData.coordinates.lat,
          lng: formData.coordinates.lng,
          year,
          timestamp,
          visibility: formData.visibility,
        });
        const result = await signAndExecuteTransaction.mutateAsync({
          transaction,
          account,
        });

        if ('digest' in result && result.digest) {
          suiTxDigest = result.digest;
        } else {
          throw new Error('Sui transaction completed but no digest was returned.');
        }
      } catch {
        setProofError('Memory media was uploaded to Walrus, but registry sync failed. Add SUI for gas and try again.');
        return;
      }

      const memory: MemoryDetail = {
        id: createMemoryId(),
        title: formData.title.trim(),
        location: formData.location.trim(),
        year,
        image: mediaUrl,
        source: 'uploaded',
        mediaType,
        mimeType: formData.media.type || 'application/octet-stream',
        fileName: formData.media.name,
        fileSize: formData.media.size,
        mediaUrl,
        walrusBlobId: mediaUpload.blobId,
        mediaWalrusBlobId: mediaUpload.blobId,
        metadataWalrusBlobId: metadataUpload.blobId,
        walrusSuiObjectId: metadataUpload.suiObjectId || mediaUpload.suiObjectId,
        mediaWalrusSuiObjectId: mediaUpload.suiObjectId,
        metadataWalrusSuiObjectId: metadataUpload.suiObjectId,
        suiRef: metadataUpload.suiRef || mediaUpload.suiRef,
        suiTxDigest,
        proofStatus: 'verified',
        visibility: formData.visibility,
        lat: formData.coordinates.lat,
        lng: formData.coordinates.lng,
        creator: account?.label || 'EchoMap Contributor',
        creatorWallet: account?.address || 'Wallet not connected',
        story: formData.story.trim(),
        verified: false,
        engagements: {
          views: 0,
          saves: 0,
          shares: 0,
        },
        timestamp,
        categories: formData.selectedCategories,
      };

      addMemory(memory);
      setSelectedYear(year);
      setPublishedBlobId(mediaUpload.blobId);
      setPublishedMetadataBlobId(metadataUpload.blobId);
      setPublishedSuiDigest(suiTxDigest || null);
      setCurrentStep(6);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Walrus upload failed.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleNextStep = () => {
    if (!validation.valid) {
      return;
    }

    if (currentStep === uploadSteps.length - 1) {
      void publishMemory();
      return;
    }

    if (currentStep < uploadSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLocationSearch = async () => {
    const query = formData.location.trim();
    if (!query) {
      return;
    }

    setIsSearchingLocation(true);
    setLocationSearchError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );
      const [result] = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string }>;

      if (!result) {
        setLocationSearchError('Location not found. Try a more specific place name.');
        return;
      }

      const parsedLat = Number.parseFloat(result.lat);
      const parsedLng = Number.parseFloat(result.lon);
      const coordinates = {
        lat: Number(parsedLat.toFixed(6)),
        lng: Number(parsedLng.toFixed(6)),
      };

      if (!isValidCoordinate(coordinates)) {
        if (process.env.NODE_ENV === 'development') {
          console.info('Invalid geocode result received.', result);
        }
        setLocationSearchError('Location not found. Try a more specific place name.');
        return;
      }

      setFormData((current) => ({
        ...current,
        location: result.display_name || current.location,
        coordinates,
      }));
    } catch {
      setLocationSearchError('Location search failed. Please try again.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  return (
    <AppShell>
    <div className="pb-8 pt-6 sm:pt-8 lg:pb-16">
      {/* Header */}
      <div className="mx-auto mb-8 max-w-5xl px-4 sm:mb-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Preserve Your Memory</h1>
        <p className="text-gray-400">Upload and preserve your story forever on Walrus and Sui</p>
      </div>

      {/* Stepper */}
      <div className="mx-auto mb-10 max-w-4xl px-4 sm:mb-16 sm:px-6">
        <UploadStepper
          steps={uploadSteps}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
        />
      </div>

      {/* Content Area */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-4xl">
        {/* Step 1: Media Upload */}
        {currentStep === 1 && (
          <GlassCard strong className="p-5 text-center sm:p-12">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleMediaUpload(file);
              }}
              className="cursor-pointer rounded-lg border-2 border-dashed border-cyan-500/50 p-6 transition hover:border-cyan-400 hover:bg-cyan-500/5 sm:p-12"
            >
              <Cloud className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Upload Your Memory</h2>
              <p className="text-gray-400 mb-6">Drag and drop an image or video, or click to browse</p>
              <input
                type="file"
                id="media-upload"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])}
                accept="image/*,video/*"
              />
              <label
                htmlFor="media-upload"
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    document.getElementById('media-upload')?.click();
                  }
                }}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-cyan-500 px-8 py-4 text-lg font-semibold text-black transition-all duration-200 glow-cyan hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-black"
              >
                <Upload className="w-5 h-5" />
                <span>Choose File</span>
              </label>
            </div>
          </GlassCard>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <GlassCard strong className="p-5 sm:p-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <MapPin className="w-6 h-6 text-cyan-400" />
              Where was this moment?
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="City, Country (e.g., Lagos, Nigeria)"
                value={formData.location}
                onChange={(e) => {
                  setLocationSearchError(null);
                  setFormData({ ...formData, location: e.target.value });
                }}
                className="min-w-0 flex-1 px-4 py-3 bg-black/30 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={handleLocationSearch}
                disabled={isSearchingLocation || formData.location.trim().length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Find
              </button>
            </div>
            {locationSearchError && (
              <p className="mt-3 text-sm font-semibold text-pink-300">{locationSearchError}</p>
            )}
            <div className="mt-6">
              <div className="mb-3 flex justify-start sm:justify-end">
                <MapStyleToggle value={mapStyle} onChange={setMapStyle} />
              </div>
              <LocationPickerMap
                selectedLocation={formData.coordinates}
                mapStyle={mapStyle}
                onSelectLocation={(coordinates) =>
                  setFormData((current) => ({
                    ...current,
                    coordinates,
                    location:
                      current.location.trim().length > 0
                        ? current.location
                        : `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`,
                  }))
                }
              />
            </div>
            <p className="text-sm text-gray-400 mt-4">Add the place name above, then zoom, pan, and click the map to pin the exact location.</p>
          </GlassCard>
        )}

        {/* Step 3: Story */}
        {currentStep === 3 && (
          <GlassCard strong className="p-5 sm:p-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-cyan-400" />
              Tell Your Story
            </h2>
            <textarea
              placeholder="Share the story behind this moment. What happened? Why is it important? What emotions does it evoke?"
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              className="w-full px-4 py-3 bg-black/30 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition h-40 resize-none"
            />
            <p className="text-sm text-gray-400 mt-4">{formData.story.length}/{maxStoryLength} characters</p>
          </GlassCard>
        )}

        {/* Step 4: Category */}
        {currentStep === 4 && (
          <GlassCard strong className="p-5 sm:p-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Tag className="w-6 h-6 text-cyan-400" />
              Add a Title & Category
            </h2>
            <input
              type="text"
              placeholder="Give your memory a title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-black/30 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition mb-8"
            />
            <p className="text-white font-semibold mb-4">Select categories:</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {uploadCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.selectedCategories.includes(category)
                      ? 'bg-cyan-500 text-black glow-cyan'
                      : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Step 5: Preview */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <GlassCard strong className="overflow-hidden">
              {formData.mediaPreview && formData.media && (
                <MemoryMedia
                  image={formData.mediaPreview}
                  title="Preview"
                  mediaType={getMediaType(formData.media)}
                  mimeType={formData.media.type}
                  controls={formData.media.type.startsWith('video/') || formData.media.type.startsWith('audio/')}
                  className="h-64 w-full"
                />
              )}
            </GlassCard>
            <GlassCard strong className="p-5 sm:p-8">
              <h3 className="text-2xl font-bold text-white mb-4">{formData.title}</h3>
              <div className="flex items-center gap-2 text-gray-300 mb-4">
                <MapPin className="w-5 h-5 text-cyan-400" />
                {formData.location}
              </div>
              {formData.coordinates && (
                <p className="text-xs text-cyan-300 font-mono mb-4">
                  {formData.coordinates.lat.toFixed(5)}, {formData.coordinates.lng.toFixed(5)}
                </p>
              )}
              <p className="text-gray-300 mb-6">{formData.story}</p>
              <div className="flex flex-wrap gap-2">
                {formData.selectedCategories.map((cat) => (
                  <span key={cat} className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </GlassCard>
            <GlassCard strong className="p-5 sm:p-8">
              <h3 className="mb-4 text-lg font-bold text-white">Visibility</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: 'public' as const,
                    title: 'Public',
                    copy: 'Appears on the world map and public Explore.',
                  },
                  {
                    value: 'unlisted' as const,
                    title: 'Unlisted',
                    copy: 'Stored on Walrus and linked to your wallet, but hidden from public Explore.',
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((current) => ({ ...current, visibility: option.value }))}
                    className={`rounded-xl border p-4 text-left transition ${
                      formData.visibility === option.value
                        ? 'border-cyan-400 bg-cyan-500/15 glow-cyan'
                        : 'border-cyan-500/20 bg-black/25 hover:border-cyan-400/50'
                    }`}
                  >
                    <span className="block font-semibold text-white">{option.title}</span>
                    <span className="mt-2 block text-sm leading-relaxed text-gray-400">{option.copy}</span>
                  </button>
                ))}
              </div>
            </GlassCard>
            {publishError && (
              <GlassCard className="border-pink-500/30 bg-pink-500/10 p-4">
                <p className="text-sm font-semibold text-pink-300">{publishError}</p>
              </GlassCard>
            )}
            {(!account || !getRegistryConfig().configured) && (
              <GlassCard className="border-yellow-500/30 bg-yellow-500/10 p-4">
                <p className="text-sm font-semibold text-yellow-200">
                  {!account
                    ? 'Connect wallet to register this memory on-chain.'
                    : 'EchoMap registry package is not configured. Memory registration is unavailable.'}
                </p>
              </GlassCard>
            )}
            {proofError && (
              <GlassCard className="border-yellow-500/30 bg-yellow-500/10 p-4">
                <p className="text-sm font-semibold text-yellow-200">{proofError}</p>
              </GlassCard>
            )}
          </div>
        )}

        {/* Step 6: Confirmation */}
        {currentStep === 6 && (
          <div className="text-center">
            <div className="mb-8">
              <CheckCircle className="w-24 h-24 text-cyan-400 mx-auto mb-6 animate-pulse" />
              <h2 className="text-4xl font-bold text-white mb-4">Memory Preserved Forever!</h2>
              <p className="text-gray-300 text-lg max-w-xl mx-auto">
                Your memory has been preserved forever.
              </p>
              {publishedBlobId && (
                <p className="mt-4 text-xs text-cyan-300 font-mono break-all">
                  Media blob: {publishedBlobId}
                </p>
              )}
              {publishedMetadataBlobId && (
                <p className="mt-2 text-xs text-cyan-300 font-mono break-all">
                  Metadata blob: {publishedMetadataBlobId}
                </p>
              )}
              {publishedSuiDigest ? (
                <p className="mt-2 text-xs text-purple-300 font-mono break-all">
                  Sui tx: {publishedSuiDigest}
                </p>
              ) : proofError ? (
                <p className="mt-2 text-sm text-yellow-200">
                  Memory stored on Walrus successfully. Sui verification unavailable.
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-400">
                  Proof status: Walrus only
                </p>
              )}
              {proofError && (
                <p className="mx-auto mt-3 max-w-xl text-sm text-yellow-200">
                  {proofError}
                </p>
              )}
            </div>
            <GlassCard strong className="mx-auto mb-8 max-w-2xl p-5 text-left sm:p-8">
              <h3 className="text-white font-bold mb-4">What happens next?</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Your memory is permanently stored on Walrus</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Sui registration is ready for the next integration step</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Other users can discover and explore your memory</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Earn contributions and community appreciation</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 6 && (
          <div className="mt-10 flex flex-col-reverse gap-4 sm:mt-12 sm:flex-row sm:justify-between">
            <GlowButton
              variant="ghost"
              size="lg"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="px-8"
            >
              Previous
            </GlowButton>
            <GlowButton
              variant="primary"
              size="lg"
              onClick={handleNextStep}
              disabled={!validation.valid || isPublishing || (currentStep === uploadSteps.length - 1 && (!account || !getRegistryConfig().configured))}
              className="px-8"
            >
              {isPublishing
                ? 'Uploading to Walrus...'
                : currentStep === uploadSteps.length - 1
                  ? 'Preserve Memory'
                  : 'Next'}
            </GlowButton>
          </div>
        )}

        {currentStep === 6 && (
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/explore">
              <GlowButton variant="primary" size="lg">
                View in Explore
              </GlowButton>
            </Link>
            <GlowButton variant="secondary" size="lg" onClick={resetUploadFlow}>
              Upload Another
            </GlowButton>
          </div>
        )}
      </div>
    </div>
    </AppShell>
  );
}
