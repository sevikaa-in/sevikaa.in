import crypto from 'crypto';
import { queryDb } from '@/lib/db';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface UploadTokenResult {
  rawToken: string;
  expiresAt: string;
  userId: string;
}

export class TokenManager {
  static async createUploadToken(userId: string, createdBy?: string): Promise<UploadTokenResult> {
    const rawToken = crypto.randomBytes(32).toString('hex'); // 256 bits entropy
    const tokenHash = hashToken(rawToken);
    const expiresAtDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
    const expiresAt = expiresAtDate.toISOString();

    // Persist hashed token in PostgreSQL verification_upload_tokens
    // Table is created via migration 20260810000001_production_performance_and_security.sql
    await queryDb(
      `INSERT INTO public.verification_upload_tokens (token_hash, user_id, created_by, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [tokenHash, userId, createdBy || null, expiresAt]
    );

    return { rawToken, expiresAt, userId };
  }

  static async verifyAndConsumeToken(rawToken: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    if (!rawToken || rawToken.length < 32) {
      return { valid: false, error: 'Invalid token format' };
    }

    const tokenHash = hashToken(rawToken);

    // Atomic SQL UPDATE check-and-consume (Fix P1 #2)
    const res = await queryDb(
      `UPDATE public.verification_upload_tokens
       SET use_count = use_count + 1, used_at = NOW()
       WHERE token_hash = $1
         AND expires_at > NOW()
         AND use_count < max_uses
       RETURNING user_id`,
      [tokenHash]
    );

    const row = res?.rows?.[0];
    if (!row || !row.user_id) {
      return { valid: false, error: 'Upload token is invalid, expired, or already used' };
    }

    return { valid: true, userId: row.user_id };
  }
}
