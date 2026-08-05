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

  // Relative Supabase storage path fallback
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hcuvizvdsooeypetvmhm.supabase.co';
  
  // Check if path already starts with any known storage bucket
  const knownBuckets = ['worker-documents', 'verification-documents', 'employer-documents', 'worker-videos', 'employer-avatars', 'worker-selfies', 'documents'];
  for (const b of knownBuckets) {
    if (trimmed.startsWith(`${b}/`)) {
      const cleanPath = trimmed.slice(b.length + 1);
      return `${supabaseUrl}/storage/v1/object/public/${b}/${cleanPath}`;
    }
  }

  // Map verification-documents / employer-documents / employer-avatars buckets to actual Supabase worker-documents bucket
  let effectiveBucket = bucketName;
  if (effectiveBucket === 'verification-documents' || effectiveBucket === 'employer-documents' || effectiveBucket === 'employer-avatars') {
    effectiveBucket = 'worker-documents';
  }

  const cleanPath = trimmed
    .replace(new RegExp(`^${effectiveBucket}\\/`), '')
    .replace(/^(employer-documents|verification-documents|worker-documents)\//, '');
  return `${supabaseUrl}/storage/v1/object/public/${effectiveBucket}/${cleanPath}`;
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
      const res = await fetch(`/api/upload/cloudinary/sign?ref=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return '';
      const data = await res.json();
      return data.url || '';
    } catch {
      return '';
    }
  }

  return trimmed;
}
