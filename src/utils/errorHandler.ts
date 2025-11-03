import { Response } from "express";

/**
 * Extract HTTP status code from error message
 */
export function getStatusCodeFromError(error: Error | string): number {
  const message = typeof error === "string" ? error : error.message;
  
  if (message?.includes("401")) return 401;
  if (message?.includes("400")) return 400;
  if (message?.includes("404")) return 404;
  if (message?.includes("403")) return 403;
  if (message?.includes("422")) return 422;
  
  return 500;
}

/**
 * Send error response in consistent format
 */
export function sendErrorResponse(
  res: Response,
  error: Error | string,
  statusCode?: number
): void {
  const message = typeof error === "string" ? error : error.message;
  const code = statusCode || getStatusCodeFromError(error);
  
  res.status(code).json({
    success: false,
    error: message || "An error occurred",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send success response in consistent format
 */
export function sendSuccessResponse(
  res: Response,
  data: any,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

