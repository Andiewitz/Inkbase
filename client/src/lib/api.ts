/**
 * apiFetch is the client-side seam for authenticated API calls.
 *
 * On a 401 it silently exchanges the refresh cookie for a fresh access token
 * (POST /api/auth/refresh) and retries the original request once. If the
 * refresh fails — expired, revoked, or logged out — the original 401 response
 * is returned so the caller can redirect to sign in.
 *
 * Cookies are same-origin (the /api rewrite proxies to the Go server), so
 * credentials are sent explicitly.
 */
export async function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const doFetch = () => fetch(input, { ...init, credentials: "same-origin" });

  const res = await doFetch();
  if (res.status !== 401) return res;

  const refresh = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
  });
  if (!refresh.ok) return res;

  return doFetch();
}
