import axios from "axios";

const TOKEN_BUFFER_TIME = 60000; // Refresh token 1 minute before expiry

interface TokenResponse {
  access_token: string;
  expires_in?: number;
}

/**
 * Request OAuth2 token using client credentials flow
 */
export async function requestOAuth2Token(
  tokenUrl: string,
  clientId: string,
  clientSecret: string
): Promise<{ token: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await axios.post<TokenResponse>(tokenUrl, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10000,
  });

  const accessToken = response.data.access_token;
  const expiresIn = response.data.expires_in || 3600;

  return { token: accessToken, expiresIn };
}

/**
 * Calculate token expiration timestamp with buffer time
 */
export function calculateTokenExpiry(expiresIn: number, bufferTime: number = TOKEN_BUFFER_TIME): number {
  return Date.now() + expiresIn * 1000 - bufferTime;
}

