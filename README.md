# Claude Code Sandbox SDK

Run Claude Code headless on Cloudflare Sandboxes! This worker:

- Accepts POST requests with a repository URL and task description
- Spawns an isolated sandbox container
- Clones the repository and runs Claude Code in headless mode
- Returns output logs and the git diff of changes made

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment

**For local development**, create `.dev.vars`:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**For deployment**, set the Cloudflare API token:
```bash
export CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
```

Create an API token at: https://dash.cloudflare.com/profile/api-tokens

Required permissions:
- Workers Scripts: Edit
- Account Settings: Read

### 3. Local Development
```bash
npm run dev
```

Note: First run takes 2-3 minutes to pull the Docker image.

### 4. Deploy
```bash
npm run deploy
# Then set the Anthropic secret:
npx wrangler secret put ANTHROPIC_API_KEY
```

Wait 2-3 minutes for container provisioning after deployment.

## Usage

```bash
curl -X POST https://claude-code-sandbox.<subdomain>.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "https://github.com/owner/repo",
    "task": "Add a README file with project description"
  }'
```

## Response

```json
{
  "logs": "Claude Code output...",
  "diff": "git diff output showing changes..."
}
```

## Configuration

- `wrangler.jsonc`: Worker and container configuration
- `Dockerfile`: Sandbox container with Claude Code pre-installed
- `src/index.ts`: Main worker logic

## Architecture

The worker uses Cloudflare's Sandbox SDK to run isolated containers at the edge:
- Each request gets its own sandbox instance
- Sandboxes have git, Node.js, Python, and Claude Code pre-installed
- 5-minute timeout for Claude Code operations
- Changes are returned as diffs (not committed)
