import { supabase, UPLOAD_WORKER_URL } from './supabase';

/**
 * Delete an object from R2 via the Cloudflare upload worker.
 * No-ops when the worker URL is not configured.
 */
export async function deleteFromR2(storageKey: string): Promise<void> {
  if (!UPLOAD_WORKER_URL) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch(`${UPLOAD_WORKER_URL}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ storageKey }),
    });
  } catch (e) {
    console.error('R2 delete failed for', storageKey, e);
  }
}

export async function deleteMultipleFromR2(storageKeys: string[]): Promise<void> {
  await Promise.all(storageKeys.map(deleteFromR2));
}

/**
 * Upload a WEBP blob to R2 via the Cloudflare upload worker.
 */
export async function uploadToR2(
  blob: Blob,
  storageKey: string,
  filename: string
): Promise<string> {
  if (!UPLOAD_WORKER_URL) {
    throw new Error(
      'Upload worker is not configured. Set VITE_UPLOAD_WORKER_URL in your .env file.'
    );
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated. Please sign in again.');
  }

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('storageKey', storageKey);

  const res = await fetch(`${UPLOAD_WORKER_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to upload image: ${detail}`);
  }

  const data = await res.json();
  if (!data.publicUrl) {
    throw new Error('Upload worker did not return a publicUrl.');
  }

  return data.publicUrl;
}
