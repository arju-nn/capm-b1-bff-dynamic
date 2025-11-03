// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import itemsRouter from "./routes/items";
import bpRouter from "./routes/businessPartners";
import ordersRouter from "./routes/orders";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration for mobile frontend
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : "*", // In production, specify actual mobile app origins
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Body parsing middleware
app.use(bodyParser.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint (no authentication required)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "b1-bff-dynamic",
  });
});

// API routes
app.use("/api/items", itemsRouter);
app.use("/api/business-partners", bpRouter);
app.use("/api/orders", ordersRouter);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    service: "B1 BFF Dynamic",
    version: "1.0.0",
    description: "Backend for Frontend consuming CAPM service",
    endpoints: {
      health: "/health",
      items: "/api/items",
      businessPartners: "/api/business-partners",
      orders: "/api/orders",
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ BFF Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔐 Authentication: ${process.env.NODE_ENV === "development" ? "Disabled (dev mode)" : "Enabled (XSUAA)"}`);
});
