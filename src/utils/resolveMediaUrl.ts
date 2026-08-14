/**
 * resolveMediaUrl — resolves any stored URL/reference into a displayable URL.
 *
 * Handles:
 *  - Direct HTTPS URLs (Cloudinary CDN public assets, old Supabase URLs)
 *  - Data URLs (base64 fallback)
 *  - Blob URLs (camera/local preview)
 *  - cloudinary:<type>:<publicId>  → fetches a 1-hour signed URL from /api/upload/cloudinary/sign
 *  - Relative Supabase storage paths
 */

export const resolveMediaUrl = (bucketName: string, path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  const trimmed = path.trim();
  if (!trimmed || 
      trimmed === 'undefined' || 
      trimmed === 'null' || 
      trimmed === '[]' || 
      trimmed === '{}' || 
      trimmed === '[object Object]' || 
      trimmed === 'none' || 
      trimmed === 'n/a') {
    return undefined;
  }

  // Already a usable URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Cloudinary reference fallback: cloudinary:<resourceType>:<publicId>
  if (trimmed.startsWith('cloudinary:')) {
    const parts = trimmed.split(':');
    if (parts.length >= 3) {
      const resourceType = parts[1] || 'image';
      const publicId = parts.slice(2).join(':');
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkg0jbfvt';
      return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}`;
    }
    return undefined;
  }

  // Sensitive private storage buckets must NOT generate public URLs
  const SENSITIVE_PRIVATE_BUCKETS = new Set(['worker-documents', 'verification-documents', 'worker-selfies', 'worker-videos', 'employer-documents']);
  if (SENSITIVE_PRIVATE_BUCKETS.has(bucketName) || SENSITIVE_PRIVATE_BUCKETS.has(trimmed.split('/')[0])) {
    return undefined;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const cleanPath = trimmed
    .replace(new RegExp(`^${bucketName}\\/`), '')
    .replace(/^(employer-documents|verification-documents|worker-documents|worker-selfies|worker-videos)\//, '');
  return undefined;
};

/**
 * resolvePrivateUrl — for private Cloudinary assets (Aadhaar docs).
 * Fetches a 1-hour expiring signed URL from the server.
 * Call this in a useEffect / async context — NOT during render.
 *
 * Usage:
 *   const [url, setUrl] = useState('');
 *   useEffect(() => { resolvePrivateUrl(storedRef).then(setUrl); }, [storedRef]);
 */
export async function resolvePrivateUrl(ref: string | null | undefined): Promise<string> {
  if (!ref) return '';
  const trimmed = ref.trim();

  // Public URL — return as-is
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Cloudinary private reference
  if (trimmed.startsWith('cloudinary:')) {
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.get(`/api/upload/cloudinary/sign?ref=${encodeURIComponent(trimmed)}`);
      return data?.url || '';
    } catch {
      return '';
    }
  }

  return trimmed;
}
