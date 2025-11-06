# Quick Start - Testing Guide

## 🚀 Quick Testing Steps

### 1. Start the Server

```bash
npm install
npm run dev
```

Server will start on `http://localhost:4000`

### 2. Test Without Authentication (Development Mode)

Since we're in development mode, authentication is optional:

```bash
# Using curl
curl http://localhost:4000/health
curl http://localhost:4000/api/items

# Or use the test script
./test.sh
```

### 3. Test with Authentication

Get a JWT token and test:

```bash
# Option 1: Using Node.js test script
TOKEN="<your-jwt-token>" npm run test:api

# Option 2: Using shell script
TOKEN="<your-jwt-token>" ./test.sh

# Option 3: Using curl directly
curl -H "Authorization: Bearer <your-jwt-token>" \
  http://localhost:4000/api/items
```

### 4. Using Postman

1. Import `postman-collection.json` into Postman
2. Set collection variables:
   - `baseUrl`: `http://localhost:4000`
   - `token`: `<your-jwt-token>`
3. Run the requests

### 5. Test Specific Endpoints

```bash
# Health check (no auth)
curl http://localhost:4000/health

# Items (requires auth in production)
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/items

# Business Partners
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/business-partners

# Create Order
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"CustomerID":"C001","Items":[{"ItemID":"I001","Quantity":10}]}' \
  http://localhost:4000/api/orders
```

## 📋 How to Get a Test Token

### Option 1: Using CF CLI
```bash
cf oauth-token
```

### Option 2: Using XSUAA REST API
```bash
curl -X POST "https://<subdomain>.authentication.us10.hana.ondemand.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=<client-id>" \
  -d "client_secret=<client-secret>"
```

Get credentials from `default-env.json` → `VCAP_SERVICES.xsuaa[0].credentials`

### Option 3: From SAP BTP Cockpit
- Go to your subaccount → Security → Trust Configuration
- Use Application Identity Provider
- Download/use token from there

## 🔍 Testing Checklist

- [ ] Server starts without errors
- [ ] Health check returns `200 OK`
- [ ] Root endpoint shows API info
- [ ] Endpoints require authentication (except `/health`)
- [ ] Invalid tokens are rejected with `401`
- [ ] Valid tokens work correctly
- [ ] CAP service integration works (check server logs)
- [ ] Error responses have consistent format

## 🐛 Common Issues

**Issue**: "XSUAA service not found"
- **Solution**: Ensure `default-env.json` has correct VCAP_SERVICES structure

**Issue**: "Destination not found"
- **Solution**: Set `DEST_NAME` or `CAP_DESTINATION_NAME` environment variable

**Issue**: "CAP service calls fail"
- **Solution**: Verify `CAP_BASE_URL` or `CAP_SERVICE_URL` is set correctly

**Issue**: "Token validation fails"
- **Solution**: Ensure token is from correct XSUAA instance and not expired

## 📚 More Information

See `TESTING.md` for detailed testing guide with all scenarios.

