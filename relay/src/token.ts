export interface TokenEnv {
  SHOPIFY_STORE_DOMAIN: string;
  SHOPIFY_CLIENT_ID: string;
  SHOPIFY_CLIENT_SECRET: string;
}

/**
 * A non-JSON response from Shopify's OAuth token endpoint. Surfaced verbatim
 * (status + body) rather than parsed, so a caller can forward it unchanged.
 */
export class NonJsonUpstreamResponseError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Shopify returned a non-JSON response (status ${status})`);
    this.status = status;
    this.body = body;
  }
}

interface AccessTokenResponse {
  access_token?: string;
  expires_in?: number;
}

export interface TokenManager {
  getToken(): Promise<string>;
  invalidate(): void;
}

// Proactively refresh this many milliseconds before the token's expires_in
// actually elapses, so callers never race a token that's about to die.
const REFRESH_BUFFER_MS = 60_000;

async function mintToken(
  env: TokenEnv,
): Promise<{ token: string; expiresAt: number }> {
  const response = await fetch(
    `https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: env.SHOPIFY_CLIENT_ID,
        client_secret: env.SHOPIFY_CLIENT_SECRET,
      }).toString(),
    },
  );

  const text = await response.text();
  let json: AccessTokenResponse;
  try {
    json = JSON.parse(text) as AccessTokenResponse;
  } catch {
    throw new NonJsonUpstreamResponseError(response.status, text);
  }

  if (!json.access_token || json.expires_in === undefined) {
    throw new Error("Shopify token response missing access_token/expires_in");
  }

  return {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export function createTokenManager(env: TokenEnv): TokenManager {
  let cached: { token: string; expiresAt: number } | null = null;
  let pending: Promise<{ token: string; expiresAt: number }> | null = null;

  async function getToken(): Promise<string> {
    if (cached && cached.expiresAt - Date.now() >= REFRESH_BUFFER_MS) {
      return cached.token;
    }

    if (!pending) {
      pending = mintToken(env)
        .then((result) => {
          cached = result;
          return result;
        })
        .finally(() => {
          pending = null;
        });
    }

    const result = await pending;
    return result.token;
  }

  function invalidate(): void {
    cached = null;
  }

  return { getToken, invalidate };
}
