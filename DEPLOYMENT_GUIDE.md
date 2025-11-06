# Deployment Guide for Mobile POC - Zero/Low Cost Options

This guide provides the best deployment options for your BFF service to be consumed by a mobile app, with minimal or zero cost for a POC.

## 🎯 Quick Recommendation Summary

**For SAP BTP Integration (Recommended if you have SAP BTP Trial):**
1. **SAP BTP Trial Account** (Free) - Deploy to Cloud Foundry with existing manifest.yml
2. **Railway.app** (Free tier) - Deploy Node.js app, connect to SAP BTP services

**For Standalone POC (No SAP BTP dependency):**
1. **Render.com** (Free tier) - Easiest setup, automatic deployments
2. **Fly.io** (Free tier) - Good performance, global edge locations
3. **Railway.app** (Free tier) - Simple, good for Node.js apps

---

## Option 1: SAP BTP Trial (FREE - Best for SAP Integration) ⭐

### Why This is Best
- ✅ **100% Free** for trial period (90 days, extendable)
- ✅ Already configured in your `manifest.yml`
- ✅ Native SAP services (XSUAA, Destination, Connectivity) work out of the box
- ✅ No code changes needed
- ✅ Handles authentication properly

### Setup Steps

1. **Sign up for SAP BTP Trial:**
   - Go to https://account.hanatrial.ondemand.com
   - Create free trial account
   - Select Cloud Foundry environment

2. **Install Cloud Foundry CLI:**
   ```bash
   # Windows (using Chocolatey)
   choco install cf-cli
   
   # Or download from: https://github.com/cloudfoundry/cli/releases
   ```

3. **Login and Deploy:**
   ```bash
   # Login to Cloud Foundry
   cf login -a https://api.cf.us10.hana.ondemand.com
   
   # Build the app
   npm run build
   
   # Deploy (uses your existing manifest.yml)
   cf push
   ```

4. **Get Your API URL:**
   - After deployment, you'll get a URL like: `https://b1-bff-dynamic-xxxxx.cfapps.us10.hana.ondemand.com`
   - Use this in your mobile app

### Cost: **FREE** (Trial account)

---

## Option 2: Render.com (FREE - Easiest for Standalone) ⭐

### Why This is Best
- ✅ **Free tier available** (with limitations)
- ✅ Automatic deployments from Git
- ✅ HTTPS included
- ✅ Simple setup, no complex configuration
- ⚠️ App sleeps after 15 min inactivity (free tier)
- ⚠️ May need to simplify SAP dependencies for POC

### Setup Steps

1. **Create Dockerfile** (if not exists):
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY dist ./dist
   EXPOSE 4000
   CMD ["node", "dist/server.js"]
   ```

2. **Create render.yaml** (optional, for easier setup):
   ```yaml
   services:
     - type: web
       name: b1-bff-dynamic
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 4000
         - key: CAP_BASE_URL
           value: your-cap-url
         - key: ALLOWED_ORIGINS
           value: *
   ```

3. **Deploy on Render:**
   - Go to https://render.com
   - Sign up (free)
   - Create new "Web Service"
   - Connect your GitHub repo
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Add environment variables
   - Deploy!

### Cost: **FREE** (with limitations) or **$7/month** (Starter plan)

---

## Option 3: Railway.app (FREE - Simple & Modern) ⭐

### Why This is Best
- ✅ **Free tier** with $5 credit monthly
- ✅ Very simple setup
- ✅ Automatic deployments
- ✅ HTTPS included
- ✅ Good for Node.js apps

### Setup Steps

1. **Sign up:**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js
   - Add environment variables:
     - `NODE_ENV=production`
     - `PORT=$PORT` (Railway sets this automatically)
     - `CAP_BASE_URL=your-cap-url`
     - `ALLOWED_ORIGINS=*`

3. **Build Settings:**
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

### Cost: **FREE** ($5 monthly credit, enough for POC)

---

## Option 4: Fly.io (FREE - Global Edge Network)

### Why This is Best
- ✅ **Free tier** with 3 shared VMs
- ✅ Global edge locations (low latency)
- ✅ Good performance
- ✅ HTTPS included

### Setup Steps

1. **Install Fly CLI:**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Create fly.toml:**
   ```toml
   app = "b1-bff-dynamic"
   primary_region = "iad"
   
   [build]
     builder = "paketobuildpacks/builder:base"
   
   [http_service]
     internal_port = 4000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
   
   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 256
   ```

3. **Deploy:**
   ```bash
   fly auth signup
   fly launch
   fly secrets set NODE_ENV=production CAP_BASE_URL=your-url
   fly deploy
   ```

### Cost: **FREE** (within limits)

---

## Option 5: Vercel (FREE - Serverless)

### Why This is Best
- ✅ **Free tier** with generous limits
- ✅ Serverless (scales automatically)
- ✅ Excellent performance
- ⚠️ Requires code changes for serverless functions

### Setup Steps

1. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/server.js"
       }
     ]
   }
   ```

2. **Modify server.ts** for serverless:
   ```typescript
   // Export app for Vercel
   export default app;
   ```

3. **Deploy:**
   - Go to https://vercel.com
   - Import GitHub repo
   - Deploy!

### Cost: **FREE** (Hobby plan)

---

## Option 6: Google Cloud Run (FREE - Pay per Use)

### Why This is Best
- ✅ **Free tier**: 2 million requests/month
- ✅ Only pay for what you use
- ✅ Auto-scales to zero
- ✅ HTTPS included

### Setup Steps

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY dist ./dist
   EXPOSE 8080
   ENV PORT=8080
   CMD ["node", "dist/server.js"]
   ```

2. **Deploy:**
   ```bash
   # Install gcloud CLI
   # Create project
   gcloud projects create b1-bff-poc
   
   # Build and deploy
   gcloud builds submit --tag gcr.io/YOUR_PROJECT/b1-bff
   gcloud run deploy b1-bff --image gcr.io/YOUR_PROJECT/b1-bff --platform managed --region us-central1 --allow-unauthenticated
   ```

### Cost: **FREE** (2M requests/month free)

---

## 📊 Comparison Table

| Platform | Cost | Setup Difficulty | SAP BTP Compatible | Best For |
|----------|------|------------------|-------------------|----------|
| **SAP BTP Trial** | FREE | Easy | ✅ Yes | SAP integration |
| **Render.com** | FREE/$7 | Very Easy | ⚠️ Partial | Quick POC |
| **Railway.app** | FREE | Very Easy | ⚠️ Partial | Simple setup |
| **Fly.io** | FREE | Medium | ⚠️ Partial | Performance |
| **Vercel** | FREE | Medium | ⚠️ Needs changes | Serverless |
| **Cloud Run** | FREE | Medium | ⚠️ Partial | Pay-per-use |

---

## 🎯 Final Recommendation for Your POC

### If you have SAP BTP Trial:
**→ Use SAP BTP Cloud Foundry (Option 1)**
- Zero cost, zero code changes, works perfectly

### If you don't have SAP BTP:
**→ Use Render.com (Option 2)**
- Easiest setup, free tier sufficient for POC
- May need to run in development mode (simplified auth)

---

## 🔧 Quick Setup for Non-SAP Deployment

If deploying to non-SAP platforms, you may want to simplify authentication for POC:

1. **Set environment variable:**
   ```env
   NODE_ENV=development
   ```
   This disables authentication (see your auth middleware)

2. **Or modify for POC:**
   - Skip XSUAA validation
   - Use simple API key or no auth for POC
   - Connect directly to CAP service if accessible

---

## 📱 Mobile App Configuration

Once deployed, configure your mobile app with:

```javascript
// Example API base URL
const API_BASE_URL = "https://your-app-url.com";

// For SAP BTP:
// https://b1-bff-dynamic-xxxxx.cfapps.us10.hana.ondemand.com

// For Render:
// https://b1-bff-dynamic.onrender.com

// For Railway:
// https://b1-bff-dynamic.up.railway.app
```

---

## 🚀 Next Steps

1. Choose a platform based on your needs
2. Follow the setup steps for that platform
3. Deploy your app
4. Test the `/health` endpoint
5. Configure your mobile app with the API URL
6. Test mobile app integration

---

## 💡 Tips for POC

- Start with `/health` endpoint to verify deployment
- Use `ALLOWED_ORIGINS=*` for CORS during POC (restrict later)
- Monitor logs for any issues
- Free tiers have limitations - upgrade if needed for production

---

## 📞 Need Help?

- Check platform-specific documentation
- Review your app logs in the platform dashboard
- Test locally first: `npm run build && npm start`

