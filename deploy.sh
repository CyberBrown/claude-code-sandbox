#!/bin/bash
# Deploy script for claude-code-sandbox
# Requires CLOUDFLARE_API_TOKEN to be set

set -e

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Error: CLOUDFLARE_API_TOKEN is not set"
    echo "Please export CLOUDFLARE_API_TOKEN=<your-token> before running this script"
    echo "Get a token at: https://dash.cloudflare.com/profile/api-tokens"
    exit 1
fi

echo "Deploying claude-code-sandbox..."
npx wrangler deploy

echo ""
echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Add your Anthropic API key as a secret:"
echo "   npx wrangler secret put ANTHROPIC_API_KEY"
echo ""
echo "2. Wait 2-3 minutes for container provisioning"
echo ""
echo "3. Test the API with:"
echo '   curl -X POST https://claude-code-sandbox.<your-subdomain>.workers.dev \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"repo": "https://github.com/owner/repo", "task": "Add a README file"}'"'"
