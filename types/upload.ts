export interface UploadDraft {
  media: File | null;
  mediaPreview: string;
  title: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  story: string;
  selectedCategories: string[];
  visibility: 'public' | 'unlisted';
}

export interface UploadValidationResult {
  valid: boolean;
  errors: string[];
}
