import { AxiosError } from "axios";

/**
 * Handle CAP service errors consistently
 */
export function handleCapError(error: unknown, endpoint: string, url?: string): Error {
  // Handle configuration errors (not Axios errors)
  if (error instanceof Error && error.message.includes("CAP service URL is not configured")) {
    return error;
  }
  
  const axiosError = error as AxiosError;
  
  if (axiosError.isAxiosError && axiosError.response) {
    const errorUrl = url || "unknown";
    console.error(
      `❌ CAP ${endpoint} failed:`,
      `\n   URL: ${errorUrl}`,
      `\n   Status: ${axiosError.response.status} ${axiosError.response.statusText}`,
      `\n   Response: ${JSON.stringify(axiosError.response.data, null, 2)}`
    );
    
    if (axiosError.response.status === 404) {
      return new Error(
        `CAP service endpoint not found (404). ` +
        `Tried: ${errorUrl}. ` +
        `\nCommon CAP endpoint patterns:\n` +
        `  - /odata/v4/<service-name>/Items\n` +
        `  - /service/<service-name>/Items\n` +
        `  - /<service-name>/Items\n\n` +
        `Set CAP_SERVICE_PATH env variable to configure the service path prefix. ` +
        `See CAP_ENDPOINTS.md for details.`
      );
    }
    
    return new Error(
      `CAP service error: ${axiosError.response.status} ${axiosError.response.statusText}`
    );
  }
  
  // Handle non-Axios errors (configuration, network, etc.)
  if (error instanceof Error) {
    return error;
  }
  
  return new Error(String(error));
}

