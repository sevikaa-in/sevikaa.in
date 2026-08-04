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

export const resolveMediaUrl = (bucketName: string, path: string | null | undefined): string => {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  // Already a usable URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Cloudinary private reference — caller should use resolvePrivateUrl() instead
  // Return empty here so UI knows to fetch a signed URL
  if (trimmed.startsWith('cloudinary:')) {
    return '';
  }

  // Relative Supabase storage path fallback
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hcuvizvdsooeypetvmhm.supabase.co';
  const cleanPath = trimmed.replace(new RegExp(`^${bucketName}\\/`), '');
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cleanPath}`;
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
