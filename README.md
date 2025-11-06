# B1 BFF Dynamic - Backend for Frontend

A Node.js backend-for-frontend (BFF) service that consumes a CAPM service deployed in SAP BTP, performs XSUAA authentication, and provides APIs ready for mobile frontend consumption.

## Features

- ✅ **XSUAA Authentication** - Validates JWT tokens from mobile frontend using XSUAA
- ✅ **Service-to-Service Communication** - Uses OAuth2ClientCredentials flow to communicate with CAP service
- ✅ **SAP Cloud SDK Integration** - Leverages SAP Cloud SDK for destination service and connectivity
- ✅ **Token Caching** - Efficient token caching with automatic refresh
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **Security Headers** - Security best practices implemented
- ✅ **CORS Support** - Configurable CORS for mobile frontend
- ✅ **Health Check** - Health check endpoint for monitoring

## Prerequisites

- Node.js 18+ 
- SAP BTP Account with:
  - XSUAA service instance
  - Destination service instance
  - Connectivity service instance
  - CAP service deployed and accessible

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (create `.env` file based on `.env.example`):

**For Development (without Destination Service):**
```env
NODE_ENV=development
PORT=4000

# CAP Service URL
CAP_BASE_URL=https://your-cap-service.cfapps.us10.hana.ondemand.com

# Direct OAuth2 credentials (bypasses Destination Service)
CAP_TOKEN_URL=https://your-subdomain.authentication.us10.hana.ondemand.com/oauth/token
CAP_CLIENT_ID=your-client-id
CAP_CLIENT_SECRET=your-client-secret
```

**For Production (with Destination Service):**
```env
NODE_ENV=production
PORT=4000

# CAP Service URL
CAP_BASE_URL=https://your-cap-service.cfapps.us10.hana.ondemand.com

# Destination name in BTP
DEST_NAME=your-cap-destination-name
CAP_DESTINATION_NAME=your-cap-destination-name
```

**Note:** In development mode, if destination service is not available, you can:
1. Use direct OAuth2 credentials (CAP_TOKEN_URL, CAP_CLIENT_ID, CAP_CLIENT_SECRET)
2. Use a direct service token (CAP_SERVICE_TOKEN)
3. Use mock token (automatically used if none of the above are set)

### Development Setup Troubleshooting

**If you see "Destination Service Not Found" error:**

This is normal in local development. The app will automatically:
- Use mock tokens if no configuration is provided
- Fall back to direct OAuth2 credentials if `CAP_TOKEN_URL`, `CAP_CLIENT_ID`, and `CAP_CLIENT_SECRET` are set
- Use real tokens via Destination Service in production

To get OAuth2 credentials from `default-env.json`:
1. Open `default-env.json`
2. Find `VCAP_SERVICES.xsuaa[0].credentials`
3. Use:
   - `url` → `CAP_TOKEN_URL` (append `/oauth/token`)
   - `clientid` → `CAP_CLIENT_ID`
   - `clientsecret` → `CAP_CLIENT_SECRET`

3. For local development, configure `default-env.json` with service bindings:
```json
{
  "VCAP_SERVICES": {
    "xsuaa": [...],
    "destination": [...],
    "connectivity": [...]
  }
}
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```
No authentication required. Returns service health status.

### Items
```
GET /api/items
```
Requires authentication. Returns list of items from CAP service.

### Business Partners
```
GET /api/business-partners
```
Requires authentication. Returns list of business partners from CAP service.

### Orders
```
POST /api/orders
```
Requires authentication. Creates a new order.

**Request Body:**
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

## Authentication

### Mobile Frontend to BFF
The mobile frontend must send JWT tokens obtained from XSUAA in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

The BFF validates these tokens using XSUAA verification keys.

### BFF to CAP Service
The BFF automatically obtains service tokens using OAuth2ClientCredentials flow via the destination service. These tokens are cached and automatically refreshed.

## Deployment to SAP BTP

### 1. Configure Services in BTP

Create the following service instances:
- **XSUAA**: Application plan
- **Destination**: Lite plan
- **Connectivity**: Lite plan (if needed)

### 2. Create Destination

In SAP BTP Cockpit, create a destination with:
- **Name**: As configured in `DEST_NAME` environment variable
- **Type**: HTTP
- **URL**: Your CAP service URL
- **Authentication**: OAuth2ClientCredentials
- **Additional Properties**:
  - `tokenServiceURL`: XSUAA token endpoint
  - `tokenServiceUser`: Client ID from XSUAA service
  - `tokenServicePassword`: Client Secret from XSUAA service

### 3. Deploy to Cloud Foundry

```bash
# Login to Cloud Foundry
cf login

# Deploy using manifest
cf push -f manifest.yml

# Or deploy directly
cf push b1-bff-dynamic
```

### 4. Bind Services

Ensure your manifest.yml includes service bindings:
```yaml
services:
  - cap-b1-xsuaa
  - cap-b1-destination
  - cap-b1-connectivity
```

## Project Structure

```
src/
├── middleware/
│   └── auth.ts              # XSUAA authentication middleware
├── controllers/
│   ├── itemsController.ts   # Items controller
│   ├── businessPartnersController.ts
│   └── ordersController.ts
├── routes/
│   ├── items.ts
│   ├── businessPartners.ts
│   └── orders.ts
├── services/
│   └── capService.ts        # CAP service client
├── utils/
│   └── tokenManager.ts      # Service token management
└── server.ts                # Express server setup
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port | No (default: 4000) |
| `CAP_BASE_URL` | CAP service base URL | Yes |
| `DEST_NAME` | Destination name in BTP | Yes (production) |
| `ALLOWED_ORIGINS` | CORS allowed origins | No |

### Service Bindings

The application requires the following service bindings in BTP:
- `xsuaa` - For token validation
- `destination` - For service-to-service authentication
- `connectivity` - For connectivity service (if needed)

## Security Considerations

1. **Token Validation**: All API endpoints validate XSUAA JWT tokens
2. **Service Tokens**: Service-to-service tokens are cached securely
3. **CORS**: Configure allowed origins for production
4. **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
5. **Error Messages**: Production mode hides detailed error messages

## Troubleshooting

### Token Validation Fails
- Ensure XSUAA service is bound correctly
- Verify token format: `Bearer <token>`
- Check XSUAA service credentials in VCAP_SERVICES

### CAP Service Calls Fail
- Verify destination configuration in BTP
- Check destination authentication type is OAuth2ClientCredentials
- Ensure destination has correct CAP service URL
- Verify service credentials are correct
- **404 Error?** Check `CAP_ENDPOINTS.md` to find the correct endpoint path
- Use `npm run discover:cap` to automatically discover the correct endpoint

### Development Mode Issues
- Authentication is optional in development mode
- Ensure `default-env.json` is configured correctly
- Check environment variables are set
- "Destination Service Not Found" is normal - app will use mock tokens or direct OAuth2 config

## License

ISC

