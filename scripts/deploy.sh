#!/bin/bash
# Deploy script for claude-code-sandbox
# Loads CLOUDFLARE_API_TOKEN from .dev.vars if not set

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Load env vars from .dev.vars if file exists
if [ -f .dev.vars ]; then
    echo "Loading environment from .dev.vars..."
    set -a
    source .dev.vars
    set +a
fi

# Check for API token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Error: CLOUDFLARE_API_TOKEN not set"
    echo ""
    echo "Set it in one of these ways:"
    echo "  1. Add to .dev.vars: CLOUDFLARE_API_TOKEN=your_token"
    echo "  2. Export: export CLOUDFLARE_API_TOKEN=your_token"
    echo ""
    echo "Create a token at: https://dash.cloudflare.com/profile/api-tokens"
    echo "Required permissions: Account:Workers Scripts:Edit, Workers Containers:Edit"
    exit 1
fi

echo "Deploying to Cloudflare Workers..."
npx wrangler deploy

echo ""
echo "Setting ANTHROPIC_API_KEY secret..."
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "$ANTHROPIC_API_KEY" | npx wrangler secret put ANTHROPIC_API_KEY
else
    echo "Note: ANTHROPIC_API_KEY not set in environment"
    echo "Run: npx wrangler secret put ANTHROPIC_API_KEY"
fi

echo ""
echo "Deployment complete!"
echo "Wait 2-3 minutes for container provisioning before making requests."
