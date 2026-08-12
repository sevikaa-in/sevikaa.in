import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED ROUTE: POST /api/admin/worker/upload-asset
 *
 * Deprecated for security compliance (Task A1). This route uploaded files to public buckets
 * and generated unauthenticated public links.
 *
 * Callers MUST use the secure endpoint: POST /api/upload/cloudinary
 */
export async function POST(req: NextRequest) {
  return NextResponse.json({
    error: 'Gone',
    message: 'This upload endpoint has been deprecated for security compliance. Please use POST /api/upload/cloudinary for secure private asset uploads.'
  }, { status: 410 });
}
