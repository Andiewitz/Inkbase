/**
 * apiFetch is the client-side seam for authenticated API calls.
 *
 * On a 401 it silently exchanges the refresh cookie for a fresh access token
 * (POST /api/auth/refresh) and retries the original request once. If the
 * refresh fails — expired, revoked, or logged out — the original 401 response
 * is returned so the caller can redirect to sign in.
 *
 * IMPORTANT: Multiple concurrent requests that encounter 401 share a single
 * in-flight refresh promise to prevent token-rotation race collisions.
 *
 * Cookies are same-origin (the /api rewrite proxies to the Go server), so
 * credentials are sent explicitly.
 */

let activeRefreshPromise: Promise<boolean> | null = null;

async function executeTokenRefresh(): Promise<boolean> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const refresh = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      });
      return refresh.ok;
    } catch {
      return false;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export async function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const doFetch = () => fetch(input, { ...init, credentials: "same-origin" });

  const res = await doFetch();
  if (res.status !== 401) return res;

  const refreshed = await executeTokenRefresh();
  if (!refreshed) return res;

  return doFetch();
}
