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

  // Direct Cloudinary Upload for videos or files > 3.5MB to bypass Next.js Serverless 4.5MB Payload limit
  if (assetType === 'video_url' || file.size > 3.5 * 1024 * 1024) {
    try {
      const signRes = await fetch('/api/upload/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          folder: `sevikaa/${role || 'worker'}/${userId}/${assetType.replace('_url', '')}`,
          resourceType: assetType === 'video_url' ? 'video' : 'image'
        })
      });
      const signData = await signRes.json();
      if (signData?.success && signData?.uploadUrl) {
        const directFormData = new FormData();
        directFormData.append('file', file);
        directFormData.append('api_key', signData.apiKey);
        directFormData.append('timestamp', String(signData.timestamp));
        directFormData.append('signature', signData.signature);
        directFormData.append('folder', signData.folder);

        return await new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', signData.uploadUrl, true);

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
              if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
                resolve({
                  publicUrl: data.secure_url,
                  cloudinaryId: data.public_id,
                  format: data.format,
                });
              } else {
                reject(new Error(data.error?.message || `Direct upload failed with status ${xhr.status}`));
              }
            } catch {
              reject(new Error(`Invalid response from Cloudinary CDN: ${xhr.responseText}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during direct Cloudinary upload'));
          xhr.ontimeout = () => reject(new Error('Direct Cloudinary upload timed out'));
          xhr.timeout = 180000;

          xhr.send(directFormData);
        });
      }
    } catch (err: any) {
      console.warn('[Direct Cloudinary Upload Notice]: Falling back to server upload...', err?.message);
    }
  }

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
    xhr.withCredentials = true;
    xhr.open('POST', '/api/upload/cloudinary', true);

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sevikaa_worker_token') || 
                    localStorage.getItem('sevikaa_access_token') || 
                    localStorage.getItem('sevikaa_user_token') || 
                    localStorage.getItem('sevikaa_employer_token') ||
                    sessionStorage.getItem('sevikaa_access_token') ||
                    sessionStorage.getItem('sevikaa_worker_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    }

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
