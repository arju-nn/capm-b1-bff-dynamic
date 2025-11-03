import { getDestination } from "@sap-cloud-sdk/connectivity";
import axios, { AxiosError } from "axios";
import { requestOAuth2Token, calculateTokenExpiry } from "./oauthHelper";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;
const TOKEN_BUFFER_TIME = 60000; // Refresh token 1 minute before expiry

/**
 * Get access token for service-to-service communication with CAP service
 * Uses OAuth2ClientCredentials flow via destination service
 */
export async function getServiceToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid
  if (cachedToken && now < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  try {
    // In development, allow direct token configuration or use environment variables
    if (process.env.NODE_ENV === "development") {
      // Option 1: Direct token provided (for testing)
      if (process.env.CAP_SERVICE_TOKEN) {
        console.log("🧪 Development mode: Using direct service token from env");
        cachedToken = {
          token: process.env.CAP_SERVICE_TOKEN,
          expiresAt: now + 60 * 60 * 1000, // 1 hour
        };
        return cachedToken.token;
      }

      // Option 2: Direct OAuth2 credentials from env
      if (process.env.CAP_TOKEN_URL && process.env.CAP_CLIENT_ID && process.env.CAP_CLIENT_SECRET) {
        console.log("🧪 Development mode: Using direct OAuth2 credentials from env");
        const { token, expiresIn } = await requestOAuth2Token(
          process.env.CAP_TOKEN_URL,
          process.env.CAP_CLIENT_ID,
          process.env.CAP_CLIENT_SECRET
        );

        cachedToken = {
          token,
          expiresAt: calculateTokenExpiry(expiresIn),
        };

        console.log(`✅ Service token obtained (dev mode), expires in ${expiresIn}s`);
        return token;
      }

      // Option 3: Mock token for local testing
      console.log("🧪 Development mode: Using mock service token (CAP service calls may fail)");
      cachedToken = {
        token: "mock-service-token-" + Math.random().toString(36).slice(2),
        expiresAt: now + 60 * 60 * 1000,
      };
      return cachedToken.token;
    }

    // Production mode: Try to use destination service
    console.log("🔐 Fetching service token from destination...");

    // Get destination configuration
    const destinationName = process.env.DEST_NAME || process.env.CAP_DESTINATION_NAME;

    if (!destinationName) {
      throw new Error(
        "DEST_NAME or CAP_DESTINATION_NAME environment variable is not set. " +
        "Please configure the destination name."
      );
    }

    let destination;
    try {
      destination = await getDestination({
        destinationName: destinationName,
      });
    } catch (error: any) {
      // If destination service is not available, try direct config as fallback
      const errorMsg = error?.message || String(error) || '';
      if (errorMsg.includes("destination") ||
        errorMsg.includes("binding") ||
        errorMsg.includes("Could not find service") ||
        errorMsg.includes("service binding")) {
        console.warn("⚠️ Destination service not available, trying direct configuration...");

        if (process.env.CAP_TOKEN_URL && process.env.CAP_CLIENT_ID && process.env.CAP_CLIENT_SECRET) {
          console.log("🔄 Using direct OAuth2 configuration as fallback...");
          const { token, expiresIn } = await requestOAuth2Token(
            process.env.CAP_TOKEN_URL,
            process.env.CAP_CLIENT_ID,
            process.env.CAP_CLIENT_SECRET
          );

          cachedToken = {
            token,
            expiresAt: calculateTokenExpiry(expiresIn),
          };

          console.log(`✅ Service token obtained (fallback), expires in ${expiresIn}s`);
          return token;
        }

        // If no direct config available, throw a helpful error
        throw new Error(
          "Destination service not available and no direct OAuth2 configuration provided. " +
          "Please set CAP_TOKEN_URL, CAP_CLIENT_ID, and CAP_CLIENT_SECRET environment variables, " +
          "or ensure destination service is properly configured."
        );
      }
      throw error;
    }

    if (!destination) {
      throw new Error(`Destination '${destinationName}' not found`);
    }

    // Handle OAuth2ClientCredentials authentication
    if (destination.authentication === "OAuth2ClientCredentials") {
      const tokenUrl = destination.tokenServiceUrl;
      const clientId = destination.tokenServiceUser || (destination as any).clientId || (destination as any).clientid;
      const clientSecret = destination.tokenServicePassword || (destination as any).clientSecret || (destination as any).clientsecret;

      if (!tokenUrl || !clientId || !clientSecret) {
        throw new Error(
          "Missing OAuth2 credentials in destination. " +
          "Required: tokenServiceUrl, tokenServiceUser/clientid, tokenServicePassword/clientsecret"
        );
      }

      console.log("🔁 Requesting OAuth2 access token from XSUAA...");
      const { token, expiresIn } = await requestOAuth2Token(tokenUrl, clientId, clientSecret);

      // Cache token with buffer time
      cachedToken = {
        token,
        expiresAt: calculateTokenExpiry(expiresIn),
      };

      console.log(`✅ Service token obtained, expires in ${expiresIn}s`);
      return token;
    }

    // Handle Basic Authentication fallback
    if (destination.username && destination.password) {
      console.log("⚠️ Using Basic Authentication fallback");
      const authHeader = Buffer.from(
        `${destination.username}:${destination.password}`
      ).toString("base64");
      cachedToken = {
        token: `Basic ${authHeader}`,
        expiresAt: now + 60 * 60 * 1000, // 1 hour cache
      };
      return cachedToken.token;
    }

    throw new Error(
      `Unsupported authentication type: ${destination.authentication || "none"}. ` +
      "Expected OAuth2ClientCredentials or Basic Authentication."
    );
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.isAxiosError) {
      console.error(
        "❌ Failed to get service token:",
        axiosError.response?.status,
        axiosError.response?.statusText
      );
      throw new Error(
        `Token request failed: ${axiosError.response?.statusText || axiosError.message}`
      );
    }
    throw error;
  }
}
