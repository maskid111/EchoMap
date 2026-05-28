export interface WalrusUploadResult {
  blobId: string;
  suiObjectId?: string;
  suiRef?: string;
  raw: unknown;
}

type WalrusUploadBody = File | Blob;

const defaultEpochs = 5;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function validateWalrusConfig() {
  const publisherUrl = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL?.trim();
  const aggregatorUrl = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL?.trim();
  const missing: string[] = [];

  if (!publisherUrl) {
    missing.push('NEXT_PUBLIC_WALRUS_PUBLISHER_URL');
  }

  if (!aggregatorUrl) {
    missing.push('NEXT_PUBLIC_WALRUS_AGGREGATOR_URL');
  }

  return {
    valid: missing.length === 0,
    missing,
    publisherUrl: publisherUrl ? trimTrailingSlash(publisherUrl) : '',
    aggregatorUrl: aggregatorUrl ? trimTrailingSlash(aggregatorUrl) : '',
  };
}

function findBlobId(value: unknown): string | null {
  if (typeof value === 'string') {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const blobId = findBlobId(item);
      if (blobId) {
        return blobId;
      }
    }

    return null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const directKeys = ['blobId', 'blob_id', 'blobID', 'id'];

  for (const key of directKeys) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const blobId = findBlobId(nestedValue);
    if (blobId) {
      return blobId;
    }
  }

  return null;
}

function findStringByKeys(value: unknown, keys: string[]): string | null {
  if (typeof value === 'string') {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStringByKeys(item, keys);
      if (found) {
        return found;
      }
    }

    return null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return JSON.stringify(candidate);
    }
  }

  for (const nestedValue of Object.values(record)) {
    const found = findStringByKeys(nestedValue, keys);
    if (found) {
      return found;
    }
  }

  return null;
}

export function normalizeWalrusResponse(response: unknown): WalrusUploadResult {
  const blobId = findBlobId(response);

  if (!blobId) {
    throw new Error('Walrus upload succeeded but no blob ID was found in the response.');
  }

  return {
    blobId,
    suiObjectId: findStringByKeys(response, [
      'objectId',
      'object_id',
      'suiObjectId',
      'sui_object_id',
      'blobObjectId',
      'blob_object_id',
      'id',
    ]) || undefined,
    suiRef: findStringByKeys(response, [
      'suiRef',
      'sui_ref',
      'objectRef',
      'object_ref',
      'reference',
      'suiReference',
      'sui_reference',
    ]) || undefined,
    raw: response,
  };
}

export function getWalrusBlobUrl(blobId: string) {
  const config = validateWalrusConfig();

  if (!config.aggregatorUrl) {
    throw new Error('NEXT_PUBLIC_WALRUS_AGGREGATOR_URL is not configured.');
  }

  return `${config.aggregatorUrl}/v1/blobs/${encodeURIComponent(blobId)}`;
}

async function uploadBodyToWalrus(body: WalrusUploadBody, requestContentType?: string) {
  const config = validateWalrusConfig();

  if (!config.valid) {
    throw new Error(`Missing Walrus configuration: ${config.missing.join(', ')}`);
  }

  const response = await fetch(`${config.publisherUrl}/v1/blobs?epochs=${defaultEpochs}`, {
    method: 'PUT',
    headers: requestContentType ? { 'Content-Type': requestContentType } : undefined,
    body,
  });

  const responseContentType = response.headers.get('content-type') || '';
  const payload = responseContentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const details = typeof payload === 'string' ? payload : JSON.stringify(payload);
    throw new Error(`Walrus upload failed (${response.status}): ${details}`);
  }

  return normalizeWalrusResponse(payload);
}

export async function uploadFileToWalrus(file: File) {
  return uploadBodyToWalrus(file, file.type || undefined);
}

export async function uploadJsonToWalrus(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  return uploadBodyToWalrus(blob, 'application/json');
}
