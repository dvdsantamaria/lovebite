#!/bin/bash

# Cloudflare Worker Deploy Script for Lovebite Events
set -e

echo "🚀 Deploying Lovebite Events Worker..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing wrangler..."
    npm install -g wrangler
fi

# Login if not already logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔑 Please login to Cloudflare:"
    wrangler login
fi

# Navigate to worker directory
cd "$(dirname "$0")/cloudflare-worker"

# Deploy
echo "🚀 Deploying Worker..."
wrangler deploy

echo "✅ Deploy complete!"
echo ""
echo "📝 Update your index.html with the Worker URL above"
