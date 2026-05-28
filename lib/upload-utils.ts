import type { UploadDraft, UploadValidationResult } from '@/types/upload';

export const maxStoryLength = 500;

export function createInitialUploadDraft(): UploadDraft {
  return {
    media: null,
    mediaPreview: '',
    title: '',
    location: '',
    coordinates: null,
    story: '',
    selectedCategories: [],
    visibility: 'public',
  };
}

export function createLocalMediaPreview(file: File) {
  return URL.createObjectURL(file);
}

export function releaseLocalMediaPreview(previewUrl: string) {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
}

export function validateUploadStep(step: number, draft: UploadDraft): UploadValidationResult {
  const errors: string[] = [];

  if (step === 1 && !draft.media) {
    errors.push('Choose an image or video to continue.');
  }

  if (step === 2) {
    if (draft.location.trim().length < 2) {
      errors.push('Add the memory location.');
    }

    if (!draft.coordinates) {
      errors.push('Choose the exact location on the map.');
    }
  }

  if (step === 3) {
    if (draft.story.trim().length < 10) {
      errors.push('Tell a little more of the story.');
    }

    if (draft.story.length > maxStoryLength) {
      errors.push(`Keep the story under ${maxStoryLength} characters.`);
    }
  }

  if (step === 4) {
    if (draft.title.trim().length < 2) {
      errors.push('Add a memory title.');
    }

    if (draft.selectedCategories.length === 0) {
      errors.push('Select at least one category.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
