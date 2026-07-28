import { supabase } from '@/lib/supabaseClient';

const ADMIN_SESSION_STORAGE_KEY = 'sevikaa_active_admin_session_token';

/**
 * Initializes or verifies single active session for an Admin/SuperAdmin.
 * If another device logs in with the same account, this session will be invalidated.
 */
export async function enforceSingleAdminSession(
  userId: string, 
  onSessionTerminated: (reason: string) => void
): Promise<() => void> {
  const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                        !process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (isPlaceholder || !userId) return () => {};

  let localToken = typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) : null;

  if (!localToken) {
    // Generate new unique session token for this browser window
    localToken = `session_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, localToken);
    }

    // Register active session token in Supabase profile
    try {
      await supabase
        .from('profiles')
        .update({ active_session_token: localToken })
        .eq('id', userId);
    } catch (err) {
      console.error("Failed to register active admin session token:", err);
    }
  } else {
    // Register current local token in DB on page load / route change
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_session_token')
        .eq('id', userId)
        .maybeSingle();

      if (!profile?.active_session_token) {
        await supabase
          .from('profiles')
          .update({ active_session_token: localToken })
          .eq('id', userId);
      } else if (profile.active_session_token !== localToken) {
        // Immediately mismatch on page load if logged in elsewhere
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
        }
        onSessionTerminated("Your session was terminated because this account logged in from another device.");
        return () => {};
      }
    } catch (err) {
      console.error("Single session check error on load:", err);
    }
  }

  // Periodic background check loop (every 10s)
  const intervalId = setInterval(async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_session_token')
        .eq('id', userId)
        .maybeSingle();

      if (profile && profile.active_session_token && profile.active_session_token !== localToken) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
        }
        clearInterval(intervalId);
        onSessionTerminated("Your session was terminated because this account logged in from another device.");
      }
    } catch (err) {
      console.error("Session token validation error:", err);
    }
  }, 10000);

  return () => clearInterval(intervalId);
}
