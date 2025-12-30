# Claude Code Sandbox SDK

Run Claude Code on Cloudflare Sandboxes for automated code modifications.

## Features

- Accept POST requests with repository URL and task description
- Clone repos into isolated sandbox environments
- Run Claude Code in headless mode to implement tasks
- Return execution logs and git diff of changes

## Endpoints

- `GET /` or `GET /health` - Health check
- `POST /` - Execute Claude Code on a repository

## Requirements

- **Workers Paid Plan** - Sandbox SDK requires Cloudflare Workers Paid
- **Docker** - Required locally to build container images for deployment
- **Anthropic API Key** - For Claude Code execution
- **Cloudflare API Token** - With Workers Scripts and Containers permissions

## Setup

1. Copy environment template:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Add your Anthropic API key to `.dev.vars`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Authenticate with Cloudflare:
   ```bash
   export CLOUDFLARE_API_TOKEN=your_token_here
   ```

4. Ensure Docker is running:
   ```bash
   docker info
   ```

5. Deploy:
   ```bash
   npx wrangler deploy
   npx wrangler secret put ANTHROPIC_API_KEY
   ```

Note: First deployment builds the container (~2-3 min). After deployment, wait 2-3 minutes for container provisioning before making requests.

## Usage

```bash
curl -X POST https://claude-code-sandbox.<account>.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "https://github.com/owner/repo",
    "task": "Add input validation to the login form",
    "branch": "main"
  }'
```

## Response

```json
{
  "success": true,
  "logs": "Claude Code execution output...",
  "diff": "git diff output showing changes...",
  "repo": "https://github.com/owner/repo",
  "task": "Add input validation to the login form"
}
```
