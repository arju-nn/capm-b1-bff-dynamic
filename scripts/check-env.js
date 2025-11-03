#!/usr/bin/env node

/**
 * Check environment variables
 * Helps verify CAP_BASE_URL is loaded correctly
 */

const dotenv = require("dotenv");

// Load .env file
dotenv.config();

console.log("🔍 Checking environment variables...\n");

const capBaseUrl = process.env.CAP_BASE_URL || process.env.CAP_SERVICE_URL;
const capServicePath = process.env.CAP_SERVICE_PATH;
const capTokenUrl = process.env.CAP_TOKEN_URL;
const capClientId = process.env.CAP_CLIENT_ID;

console.log("CAP Configuration:");
console.log(`  CAP_BASE_URL: ${capBaseUrl ? "✅ " + capBaseUrl.substring(0, 50) + "..." : "❌ NOT SET"}`);
console.log(`  CAP_SERVICE_URL: ${process.env.CAP_SERVICE_URL ? "✅ Set" : "❌ NOT SET"}`);
console.log(`  CAP_SERVICE_PATH: ${capServicePath || "(not set)"}`);
console.log(`  CAP_TOKEN_URL: ${capTokenUrl ? "✅ Set" : "❌ NOT SET"}`);
console.log(`  CAP_CLIENT_ID: ${capClientId ? "✅ Set" : "❌ NOT SET"}`);

console.log("\n" + "=".repeat(60));
if (capBaseUrl) {
  console.log("✅ CAP_BASE_URL is configured!");
  console.log("\nIf you're still getting errors:");
  console.log("1. Make sure you've restarted the server after adding .env");
  console.log("2. Check that .env file is in the project root");
  console.log("3. Verify there's no extra whitespace in .env values");
} else {
  console.log("❌ CAP_BASE_URL is NOT configured!");
  console.log("\nPlease add to your .env file:");
  console.log("CAP_BASE_URL=https://your-cap-service.cfapps.us10.hana.ondemand.com");
}

