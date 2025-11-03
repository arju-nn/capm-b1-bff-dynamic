# Testing Guide - B1 BFF Dynamic

This guide covers various ways to test the BFF application in different environments.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
   - Copy `default-env.json` if testing locally
   - Set up `.env` file with required variables

## 1. Local Development Testing

### Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:4000` (or the port specified in `PORT` env variable).

### Test Health Check (No Authentication)

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "b1-bff-dynamic"
}
```

### Test Root Endpoint

```bash
curl http://localhost:4000/
```

## 2. Testing with Mock Token (Development Mode)

In development mode, if you don't provide a token, authentication is skipped. However, you can test with a mock token.

### Option 1: Skip Authentication (Development Mode)

```bash
# Development mode automatically skips auth if no token provided
curl http://localhost:4000/api/items
```

### Option 2: Test with Mock Bearer Token

```bash
curl -H "Authorization: Bearer mock-token-123" http://localhost:4000/api/items
```

## 3. Testing with Real XSUAA Token (Local)

### Step 1: Get XSUAA Token

You need to obtain a valid JWT token from XSUAA. You can:

**Option A: Using CF CLI**
```bash
cf oauth-token
```

**Option B: Using REST API**
```bash
# Get token using XSUAA credentials
curl -X POST "https://<your-subdomain>.authentication.us10.hana.ondemand.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=<client-id>" \
  -d "client_secret=<client-secret>"
```

**Option C: Use SAP BTP Cockpit**
- Go to your subaccount → Security → Trust Configuration
- Download JWT token

### Step 2: Test with Real Token

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
  http://localhost:4000/api/items
```

## 4. Testing API Endpoints

### Test Items Endpoint

```bash
# GET /api/items
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/items
```

Expected response (success):
```json
{
  "success": true,
  "data": [...],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test Business Partners Endpoint

```bash
# GET /api/business-partners
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/business-partners
```

### Test Orders Endpoint

```bash
# POST /api/orders
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "CustomerID": "C001",
    "Items": [
      {
        "ItemID": "I001",
        "Quantity": 10
      }
    ]
  }' \
  http://localhost:4000/api/orders
```

## 5. Testing Error Scenarios

### Test Missing Token

```bash
curl http://localhost:4000/api/items
```

Expected response:
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid Authorization header. Expected: Bearer <token>"
}
```

### Test Invalid Token

```bash
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:4000/api/items
```

Expected response:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### Test Invalid Request Body

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:4000/api/orders
```

Expected response:
```json
{
  "success": false,
  "error": "Request body is required",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 6. Testing CAP Service Integration

### Verify CAP Service Configuration

1. Check environment variables:
   ```bash
   echo $CAP_BASE_URL
   # or
   echo $CAP_SERVICE_URL
   ```

2. Check destination configuration in BTP:
   - Destination name should match `DEST_NAME` or `CAP_DESTINATION_NAME`
   - Destination should have OAuth2ClientCredentials configured

### Test CAP Service Connection

The BFF will automatically:
1. Get destination from BTP
2. Obtain service token using OAuth2ClientCredentials
3. Call CAP service with Bearer token

Check server logs for:
- `🔐 Fetching service token from destination...`
- `🔁 Requesting OAuth2 access token from XSUAA...`
- `✅ Service token obtained`
- `📡 GET <cap-service-url>/Items`

## 7. Automated Testing with Postman

### Import Postman Collection

Create a Postman collection with:

**Collection Variables:**
- `baseUrl`: `http://localhost:4000`
- `token`: `<your-jwt-token>`

**Requests:**
1. **Health Check**
   - Method: GET
   - URL: `{{baseUrl}}/health`

2. **Get Items**
   - Method: GET
   - URL: `{{baseUrl}}/api/items`
   - Headers: `Authorization: Bearer {{token}}`

3. **Get Business Partners**
   - Method: GET
   - URL: `{{baseUrl}}/api/business-partners`
   - Headers: `Authorization: Bearer {{token}}`

4. **Create Order**
   - Method: POST
   - URL: `{{baseUrl}}/api/orders`
   - Headers: 
     - `Authorization: Bearer {{token}}`
     - `Content-Type: application/json`
   - Body: JSON with order data

## 8. Testing in Production (BTP)

### Deploy to BTP

```bash
# Build the application
npm run build

# Deploy to Cloud Foundry
cf push -f manifest.yml
```

### Test Production Endpoints

After deployment, get the app URL:
```bash
cf apps
cf app b1-bff-dynamic
```

Test endpoints:
```bash
# Health check
curl https://<your-app-url>.cfapps.us10.hana.ondemand.com/health

# API endpoints (requires valid token)
curl -H "Authorization: Bearer <token>" \
  https://<your-app-url>.cfapps.us10.hana.ondemand.com/api/items
```

## 9. Testing Scripts

### Create a Test Script

Save as `test.sh`:

```bash
#!/bin/bash

BASE_URL="${BASE_URL:-http://localhost:4000}"
TOKEN="${TOKEN:-}"

echo "Testing BFF at $BASE_URL"
echo "================================"

# Health check
echo -e "\n1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test with token if provided
if [ -n "$TOKEN" ]; then
  echo -e "\n2. Testing Items (with token)..."
  curl -s -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/items" | jq '.'
  
  echo -e "\n3. Testing Business Partners (with token)..."
  curl -s -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/business-partners" | jq '.'
else
  echo -e "\n2. Skipping authenticated endpoints (no token provided)"
  echo "   Set TOKEN environment variable to test authenticated endpoints"
fi

echo -e "\n================================"
echo "Testing complete!"
```

Usage:
```bash
chmod +x test.sh

# Without token (development mode)
./test.sh

# With token
TOKEN="<your-token>" ./test.sh

# Different base URL
BASE_URL="https://your-app.cfapps.us10.hana.ondemand.com" TOKEN="<token>" ./test.sh
```

## 10. Debugging Tips

### Check Server Logs

Watch server logs for:
- Authentication status
- Token validation errors
- CAP service call logs
- Error messages

### Common Issues

1. **XSUAA Service Not Found**
   - Ensure XSUAA service is bound in `manifest.yml`
   - Check `default-env.json` has correct VCAP_SERVICES

2. **Destination Not Found**
   - Verify destination name matches `DEST_NAME` env variable
   - Check destination exists in BTP Cockpit

3. **Token Validation Fails**
   - Ensure token is not expired
   - Verify token is from correct XSUAA instance
   - Check token format: `Bearer <token>`

4. **CAP Service Calls Fail**
   - Verify CAP service URL is correct
   - Check destination authentication is OAuth2ClientCredentials
   - Ensure service credentials are correct

### Enable Debug Logging

Set environment variable:
```bash
export DEBUG=*
npm run dev
```

## 11. Integration Testing

### Test Complete Flow

1. **Mobile App → BFF → CAP Service**

   ```
   Mobile App
   └─> POST /api/orders (with JWT token)
       └─> BFF validates token (XSUAA)
           └─> BFF gets service token (Destination)
               └─> BFF calls CAP service (with service token)
                   └─> Returns response to Mobile App
   ```

2. **Test Scenarios:**
   - Valid token → Success
   - Invalid token → 401 Unauthorized
   - Expired token → 401 Unauthorized
   - Missing token → 401 Unauthorized
   - CAP service down → 500/503 error
   - Network timeout → Error response

## Quick Test Checklist

- [ ] Health check endpoint works
- [ ] Root endpoint returns API info
- [ ] Authentication middleware validates tokens
- [ ] Invalid tokens are rejected
- [ ] All API endpoints require authentication
- [ ] CAP service integration works
- [ ] Error handling returns appropriate status codes
- [ ] Response format is consistent
- [ ] CORS is configured correctly
- [ ] Logs show proper information

