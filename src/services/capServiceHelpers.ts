/**
 * Helper functions for CAP service
 */

/**
 * Get CAP base URL from environment (read dynamically to support dotenv)
 */
function getCapBaseUrl(): string {
    const url = (process.env.CAP_BASE_URL || process.env.CAP_SERVICE_URL || "").trim();

    // Debug logging in development
    if (!url && process.env.NODE_ENV === "development") {
        console.warn("⚠️ CAP_BASE_URL not found in environment variables");
        console.warn("   Available env vars with CAP_:",
            Object.keys(process.env).filter(k => k.includes("CAP")).join(", ") || "none");
    }

    return url;
}

/**
 * Get CAP service path from environment (read dynamically to support dotenv)
 */
function getCapServicePath(): string {
    return process.env.CAP_SERVICE_PATH || "";
}

/**
 * Construct full URL for CAP service endpoint
 */
export function buildCapUrl(endpoint: string): string {
    const CAP_BASE_URL = getCapBaseUrl();

    if (!CAP_BASE_URL) {
        throw new Error(
            "CAP service URL is not configured. " +
            "Please set CAP_BASE_URL or CAP_SERVICE_URL environment variable. " +
            "Example: CAP_BASE_URL=https://your-cap-service.cfapps.us10.hana.ondemand.com"
        );
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const servicePath = getCapServicePath();
    const normalizedPath = servicePath.endsWith("/")
        ? servicePath.slice(0, -1)
        : servicePath;

    return `${CAP_BASE_URL}${normalizedPath}${cleanEndpoint}`;
}

/**
 * Get common HTTP headers for CAP service requests
 */
export function getCapHeaders(token: string): Record<string, string> {
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}

