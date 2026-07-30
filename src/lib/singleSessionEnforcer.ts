const ADMIN_SESSION_STORAGE_KEY = 'sevikaa_active_admin_session_token';

/**
 * Initializes single session tracking for Admin/SuperAdmin windows.
 */
export async function enforceSingleAdminSession(
  userId: string, 
  onSessionTerminated: (reason: string) => void
): Promise<() => void> {
  if (!userId) return () => {};

  let localToken = typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) : null;

  if (!localToken) {
    localToken = `session_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, localToken);
    }
  }

  return () => {};
}
