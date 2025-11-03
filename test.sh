#!/bin/bash

# BFF Testing Script
# Usage: ./test.sh [BASE_URL] [TOKEN]

BASE_URL="${1:-${BASE_URL:-http://localhost:4000}}"
TOKEN="${2:-${TOKEN:-}}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          BFF Testing Script                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Base URL: $BASE_URL"
echo "Token: ${TOKEN:+***provided***} ${TOKEN:-not provided}"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local requires_auth=${4:-false}
    local data=${5:-}
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "  $method $endpoint"
    
    local cmd="curl -s -w '\nHTTP_STATUS:%{http_code}'"
    
    if [ "$requires_auth" = "true" ]; then
        if [ -z "$TOKEN" ]; then
            echo -e "  ${RED}✗ SKIPPED (no token provided)${NC}"
            echo ""
            return
        fi
        cmd="$cmd -H 'Authorization: Bearer $TOKEN'"
    fi
    
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        cmd="$cmd -H 'Content-Type: application/json'"
        if [ -n "$data" ]; then
            cmd="$cmd -d '$data'"
        fi
    fi
    
    cmd="$cmd -X $method '$BASE_URL$endpoint'"
    
    response=$(eval $cmd)
    http_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ SUCCESS (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "  ${RED}✗ FAILED (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    echo ""
}

# Test 1: Health Check (no auth)
test_endpoint "GET" "/health" "Health Check Endpoint" false

# Test 2: Root Endpoint (no auth)
test_endpoint "GET" "/" "Root Endpoint" false

# Test 3: Items (requires auth)
test_endpoint "GET" "/api/items" "Get Items" true

# Test 4: Business Partners (requires auth)
test_endpoint "GET" "/api/business-partners" "Get Business Partners" true

# Test 5: Create Order (requires auth)
test_order_data='{"CustomerID":"C001","Items":[{"ItemID":"I001","Quantity":10}]}'
test_endpoint "POST" "/api/orders" "Create Order" true "$test_order_data"

# Test 6: Invalid endpoint (no auth)
test_endpoint "GET" "/api/invalid" "Invalid Endpoint (404)" false

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          Testing Complete                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Tips:"
echo "  - To test with authentication, provide token:"
echo "    TOKEN=<your-token> ./test.sh"
echo ""
echo "  - To test production:"
echo "    ./test.sh https://your-app.cfapps.us10.hana.ondemand.com"
echo ""

