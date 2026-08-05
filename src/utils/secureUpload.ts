/**
 * secureUpload — Direct file upload to Cloudinary via server relay.
 *
 * Flow:
 *  1. POST /api/upload/cloudinary  (file streamed server-side → Cloudinary)
 *  2. Returns a permanent CDN HTTPS URL
 *  3. URL is persisted to PostgreSQL worker_profiles column
 *
 * Why Cloudinary over Supabase Storage:
 *  - 25 GB free vs 1 GB
 *  - Built-in video compression (H.264, auto quality)
 *  - Global CDN — fast playback everywhere
 *  - No RLS / MIME type configuration needed
 */

export type AssetType =
  | 'video_url'
  | 'profile_picture_url'
  | 'aadhaar_front_url'
  | 'aadhaar_back_url'
  | 'residency_proof_url'
  | 'police_verification_url';

export interface UploadResult {
  publicUrl: string;
  cloudinaryId?: string;
  format?: string;
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  role?: 'worker' | 'employer' | string;
}

export async function secureUpload(
  file: File,
  userId: string,
  assetType: AssetType,
  options?: UploadOptions
): Promise<UploadResult> {
  const { onProgress, role } = options || {};

  onProgress?.(5);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('assetType', assetType);
  if (role) {
    formData.append('role', role);
  }

  // Use XHR to get real upload progress
  const result = await new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/cloudinary', true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = 5 + Math.round((e.loaded / e.total) * 90);
        onProgress?.(pct);
      }
    };

    xhr.onload = () => {
      onProgress?.(100);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          resolve({
            publicUrl: data.publicUrl,
            cloudinaryId: data.cloudinaryId,
            format: data.format,
          });
        } else {
          reject(new Error(data.error || `Upload failed with status ${xhr.status}`));
        }
      } catch {
        reject(new Error(`Invalid server response: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.timeout = 120000; // 2 minutes for large videos

    xhr.send(formData);
  });

  return result;
}
