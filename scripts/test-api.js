#!/usr/bin/env node

/**
 * Simple API Test Script
 * Tests BFF endpoints with optional authentication
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const TOKEN = process.env.TOKEN || '';

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.url.startsWith('https') ? https : http;
    
    const url = new URL(options.url);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        ...options.headers,
      },
    };

    if (data) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = protocol.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function testEndpoint(name, method, path, requiresAuth = false, body = null) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`Testing: ${name}`, 'yellow');
  log(`  ${method} ${path}`, 'yellow');

  const headers = {};
  if (requiresAuth) {
    if (!TOKEN) {
      log('  ✗ SKIPPED (no token provided)', 'red');
      log('    Set TOKEN environment variable to test authenticated endpoints', 'yellow');
      return;
    }
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  try {
    const url = `${BASE_URL}${path}`;
    const response = await makeRequest(
      {
        url,
        method,
        headers,
      },
      body ? JSON.stringify(body) : null
    );

    if (response.status >= 200 && response.status < 300) {
      log(`  ✓ SUCCESS (HTTP ${response.status})`, 'green');
    } else {
      log(`  ✗ FAILED (HTTP ${response.status})`, 'red');
    }

    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    log(`  ✗ ERROR: ${error.message}`, 'red');
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║          BFF API Testing Script                            ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  log(`\nBase URL: ${BASE_URL}`, 'yellow');
  log(`Token: ${TOKEN ? '***provided***' : 'not provided'}`, 'yellow');

  // Test 1: Health Check
  await testEndpoint('Health Check', 'GET', '/health', false);

  // Test 2: Root Endpoint
  await testEndpoint('Root Endpoint', 'GET', '/', false);

  // Test 3: Items (requires auth)
  await testEndpoint('Get Items', 'GET', '/api/items', true);

  // Test 4: Business Partners (requires auth)
  await testEndpoint('Get Business Partners', 'GET', '/api/business-partners', true);

  // Test 5: Create Order (requires auth)
  await testEndpoint(
    'Create Order',
    'POST',
    '/api/orders',
    true,
    {
      CustomerID: 'C001',
      Items: [
        {
          ItemID: 'I001',
          Quantity: 10,
        },
      ],
    }
  );

  // Test 6: Invalid endpoint
  await testEndpoint('Invalid Endpoint (404)', 'GET', '/api/invalid', false);

  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║          Testing Complete                                  ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  log('\nUsage Examples:', 'yellow');
  log('  npm run test:api', 'yellow');
  log('  TOKEN=<your-token> npm run test:api', 'yellow');
  log('  BASE_URL=https://your-app.cfapps.us10.hana.ondemand.com TOKEN=<token> npm run test:api', 'yellow');
  log('');
}

// Run tests
runTests().catch((error) => {
  log(`\nFatal Error: ${error.message}`, 'red');
  process.exit(1);
});

