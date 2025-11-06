# CAP Service Endpoints Guide

## Finding the Correct CAP Endpoint

Your CAP service returned a 404, which means the endpoint path `/Items` is incorrect. CAP services typically use OData v4 endpoints.

## Common CAP Endpoint Patterns

1. **OData v4 with service name:**
   ```
   /odata/v4/<service-name>/Items
   ```
   Example: `/odata/v4/b1-service/Items`

2. **Service prefix:**
   ```
   /service/<service-name>/Items
   ```
   Example: `/service/b1-service/Items`

3. **Direct entity:**
   ```
   /<service-name>/Items
   ```
   Example: `/b1-service/Items`

## How to Find Your CAP Endpoint

### Method 1: Check CAP Service Metadata

Try accessing the service root:
```bash
curl https://your-cap-service.cfapps.us10.hana.ondemand.com/odata/v4/
```

Or with token:
```bash
curl -H "Authorization: Bearer <token>" \
  https://your-cap-service.cfapps.us10.hana.ondemand.com/odata/v4/
```

This will show you all available services and entities.

### Method 2: Check CAP Service Documentation

Look at your CAP project's `package.json` or service definition to find:
- Service name
- OData version
- Entity set names

### Method 3: Test Common Patterns

Try these common paths:

```bash
# Pattern 1: OData v4
curl -H "Authorization: Bearer <token>" \
  https://your-cap-service.cfapps.us10.hana.ondemand.com/odata/v4/b1-service/Items

# Pattern 2: Service prefix
curl -H "Authorization: Bearer <token>" \
  https://your-cap-service.cfapps.us10.hana.ondemand.com/service/b1-service/Items

# Pattern 3: Direct
curl -H "Authorization: Bearer <token>" \
  https://your-cap-service.cfapps.us10.hana.ondemand.com/b1-service/Items
```

## Configuration

You can configure the endpoint base path in your `.env`:

```env
# CAP Service Base URL
CAP_BASE_URL=https://your-cap-service.cfapps.us10.hana.ondemand.com

# Optional: OData service path prefix (if not included in CAP_BASE_URL)
CAP_SERVICE_PATH=/odata/v4/b1-service
```

Then update your controllers to use:
```typescript
capGet(`${process.env.CAP_SERVICE_PATH || ''}/Items`)
```

## Quick Test Script

Use this to test different endpoint patterns:

```bash
CAP_BASE="https://your-cap-service.cfapps.us10.hana.ondemand.com"
TOKEN="<your-token>"

# Test common patterns
for path in "/odata/v4/b1-service/Items" "/service/b1-service/Items" "/b1-service/Items" "/Items"; do
  echo "Testing: $CAP_BASE$path"
  curl -s -H "Authorization: Bearer $TOKEN" "$CAP_BASE$path" | head -20
  echo ""
done
```

