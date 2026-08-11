import { NextResponse } from 'next/server';

/**
 * DEPRECATED ROUTE (Audit 7 P1 #4)
 * Obsolete signed upload route replaced by /api/upload/cloudinary and /api/upload/cloudinary/sign
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Gone', message: 'This upload endpoint is deprecated. Use /api/upload/cloudinary.' },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: 'Gone', message: 'This upload endpoint is deprecated. Use /api/upload/cloudinary.' },
    { status: 410 }
  );
}
