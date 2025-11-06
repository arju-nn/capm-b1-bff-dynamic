import { Request, Response, NextFunction } from "express";
import * as xssec from "@sap/xssec";
import * as xsenv from "@sap/xsenv";

/**
 * XSUAA Authentication Middleware
 * Validates JWT tokens from mobile frontend using XSUAA
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    [key: string]: any;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip authentication in development mode if no token provided
  if (process.env.NODE_ENV === "development" && !req.headers.authorization) {
    console.log("⚠️ Development mode: Skipping authentication");
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header. Expected: Bearer <token>",
    });
    return;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    // Load XSUAA service credentials from VCAP_SERVICES or default-env.json
    xsenv.loadEnv();
    
    // Get XSUAA service - readCFServices doesn't take arguments in newer versions
    let xsuaaService: any;
    try {
      const services = xsenv.readCFServices();
      if (services && services.xsuaa) {
        xsuaaService = Array.isArray(services.xsuaa) ? services.xsuaa[0] : services.xsuaa;
      }
    } catch (e) {
      // Fallback: try to read from VCAP_SERVICES directly
      const vcapServices = process.env.VCAP_SERVICES ? JSON.parse(process.env.VCAP_SERVICES) : {};
      if (vcapServices.xsuaa && vcapServices.xsuaa[0]) {
        xsuaaService = vcapServices.xsuaa[0].credentials || vcapServices.xsuaa[0];
      }
    }

    if (!xsuaaService || !xsuaaService.credentials) {
      // Try to get credentials directly
      if (xsuaaService && !xsuaaService.credentials) {
        xsuaaService = { credentials: xsuaaService };
      } else {
        throw new Error(
          "XSUAA service not found in VCAP_SERVICES. Ensure XSUAA service is bound to the application."
        );
      }
    }

    // Use credentials for token validation
    const xsuaaCredentials = xsuaaService.credentials || xsuaaService;

    // Create XSUAA security context - newer API uses async/await
    try {
      const securityContext = await (xssec.createSecurityContext as any)(token, xsuaaCredentials);
      
      if (!securityContext) {
        throw new Error("Security context is null");
      }

      // Extract user information from token
      const decodedToken = securityContext.getTokenInfo();
      req.user = {
        id: decodedToken.user_id || decodedToken.sub || "",
        email: decodedToken.email,
        given_name: decodedToken.given_name,
        family_name: decodedToken.family_name,
        ...decodedToken,
      };

      console.log(`✅ Authenticated user: ${req.user?.id || "unknown"}`);
      next();
    } catch (validationError: any) {
      console.error("❌ Token validation failed:", validationError?.message || "Unknown error");
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }
  } catch (error: any) {
    console.error("❌ Authentication error:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to validate token",
    });
  }
}

