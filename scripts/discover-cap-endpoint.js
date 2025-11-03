#!/usr/bin/env node

/**
 * CAP Endpoint Discovery Script
 * Helps find the correct endpoint path for your CAP service
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.CAP_BASE_URL || process.env.CAP_SERVICE_URL;
const TOKEN = process.env.CAP_SERVICE_TOKEN || process.env.TOKEN || 'mock-token';

if (!BASE_URL) {
  console.error('❌ Error: CAP_BASE_URL or CAP_SERVICE_URL not set');
  console.log('\nUsage:');
  console.log('  CAP_BASE_URL=https://your-service.cfapps... node scripts/discover-cap-endpoint.js');
  process.exit(1);
}

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

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
      timeout: 10000,
    };

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers, body });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers, body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testEndpoint(path, description) {
  const url = `${BASE_URL}${path}`;
  log(`\n${'='.repeat(70)}`, 'blue');
  log(`Testing: ${description}`, 'yellow');
  log(`URL: ${url}`, 'yellow');
  
  try {
    const headers = TOKEN && TOKEN !== 'mock-token' 
      ? { 'Authorization': `Bearer ${TOKEN}` }
      : {};
    
    const response = await makeRequest(url, headers);
    
    if (response.status === 200 || response.status === 201) {
      log(`✅ SUCCESS (HTTP ${response.status})`, 'green');
      if (response.data && typeof response.data === 'object') {
        console.log('\nResponse preview:');
        console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
        if (response.body.length > 500) {
          console.log('... (truncated)');
        }
      } else {
        console.log('\nResponse:', response.data.substring(0, 500));
      }
      return true;
    } else if (response.status === 404) {
      log(`❌ NOT FOUND (HTTP 404)`, 'red');
      return false;
    } else if (response.status === 401 || response.status === 403) {
      log(`⚠️  AUTHENTICATION REQUIRED (HTTP ${response.status})`, 'yellow');
      log(`   Token may be invalid or missing`, 'yellow');
      return false;
    } else {
      log(`⚠️  HTTP ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, 'red');
    return false;
  }
}

async function discoverEndpoint() {
  log('\n╔══════════════════════════════════════════════════════════════════════════╗', 'blue');
  log('║          CAP Service Endpoint Discovery                                  ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════════════════╝', 'blue');
  log(`\nBase URL: ${BASE_URL}`, 'yellow');
  log(`Token: ${TOKEN !== 'mock-token' ? '***provided***' : 'not provided (using mock)'}`, 'yellow');
  
  log('\n🔍 Discovering CAP service endpoints...\n', 'blue');

  // Test service root/metadata endpoints first
  const rootPaths = [
    { path: '/odata/v4/', desc: 'OData v4 service root' },
    { path: '/odata/v4/$metadata', desc: 'OData v4 metadata' },
    { path: '/service/', desc: 'Service root' },
    { path: '/', desc: 'Root path' },
  ];

  log('Step 1: Testing service root paths...', 'blue');
  let foundRoot = false;
  for (const { path, desc } of rootPaths) {
    const found = await testEndpoint(path, desc);
    if (found) {
      foundRoot = true;
      log(`\n✅ Found working root path: ${path}`, 'green');
      
      // Try to extract service name from response
      try {
        const response = await makeRequest(`${BASE_URL}${path}`, 
          TOKEN !== 'mock-token' ? { 'Authorization': `Bearer ${TOKEN}` } : {});
        if (response.data && typeof response.data === 'object') {
          if (response.data.value) {
            log('\n📋 Available services:', 'yellow');
            response.data.value.forEach((service: any) => {
              log(`   - ${service.name || service.Name || JSON.stringify(service)}`, 'yellow');
            });
          }
        }
      } catch (e) {
        // Ignore errors when trying to parse
      }
      break;
    }
  }

  if (!foundRoot) {
    log('\n⚠️  Could not find service root. Testing entity endpoints directly...', 'yellow');
  }

  // Test common entity endpoint patterns
  log('\n\nStep 2: Testing Items entity endpoints...', 'blue');
  const entityPaths = [
    { path: '/odata/v4/b1-service/Items', desc: 'OData v4 with b1-service' },
    { path: '/odata/v4/service/Items', desc: 'OData v4 with service' },
    { path: '/odata/v4/Items', desc: 'OData v4 direct' },
    { path: '/service/b1-service/Items', desc: 'Service prefix with b1-service' },
    { path: '/service/Items', desc: 'Service prefix direct' },
    { path: '/b1-service/Items', desc: 'Service name prefix' },
    { path: '/Items', desc: 'Direct path (current)' },
  ];

  let foundEntity = false;
  for (const { path, desc } of entityPaths) {
    const found = await testEndpoint(path, desc);
    if (found) {
      foundEntity = true;
      log(`\n✅✅✅ FOUND WORKING ENDPOINT: ${path} ✅✅✅`, 'green');
      log(`\n📝 Add this to your .env file:`, 'yellow');
      if (path === '/Items') {
        log(`   CAP_SERVICE_PATH=`, 'yellow');
      } else {
        const servicePath = path.replace('/Items', '').replace('/items', '');
        log(`   CAP_SERVICE_PATH=${servicePath}`, 'yellow');
      }
      break;
    }
  }

  if (!foundEntity) {
    log('\n❌ Could not find Items endpoint with common patterns.', 'red');
    log('\n💡 Next steps:', 'yellow');
    log('   1. Check your CAP service documentation', 'yellow');
    log('   2. Verify the service is deployed and running', 'yellow');
    log('   3. Check the CAP project for the service name and entity set names', 'yellow');
    log('   4. Try accessing the service in SAP BTP Cockpit', 'yellow');
  }

  log('\n' + '='.repeat(70), 'blue');
  log('Discovery complete!', 'blue');
  log('', 'reset');
}

discoverEndpoint().catch((error) => {
  log(`\nFatal Error: ${error.message}`, 'red');
  process.exit(1);
});

