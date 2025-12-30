import { getSandbox } from '@cloudflare/sandbox';

interface CmdOutput {
  success: boolean;
  stdout: string;
  stderr: string;
}

// Helper to read the outputs from `.exec` results
const getOutput = (res: CmdOutput) => (res.success ? res.stdout : res.stderr);

const EXTRA_SYSTEM =
  'You are an automatic feature-implementer/bug-fixer. ' +
  'You apply all necessary changes to achieve the user request. You must ensure you DO NOT commit the changes, ' +
  'so the pipeline can read the local `git diff` and apply the change upstream.';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/') {
      if (request.method === 'GET') {
        return Response.json({
          status: 'ok',
          service: 'claude-code-sandbox',
          version: '1.0.0',
        });
      }
    }

    // Main execution endpoint
    if (request.method === 'POST') {
      try {
        const body = await request.json<{
          repo?: string;
          task?: string;
          branch?: string;
        }>();

        const { repo, task, branch } = body;

        if (!repo || !task) {
          return Response.json(
            { error: 'Missing required fields: repo and task' },
            { status: 400 }
          );
        }

        // Get the repo name
        const name = repo.split('/').pop()?.replace('.git', '') ?? 'tmp';

        // Open sandbox with unique ID
        const sandbox = getSandbox(
          env.Sandbox,
          crypto.randomUUID().slice(0, 8)
        );

        // Git clone repo with optional branch
        await sandbox.gitCheckout(repo, {
          targetDir: name,
          ...(branch && { ref: branch }),
        });

        const { ANTHROPIC_API_KEY } = env;

        // Set env vars for the session
        await sandbox.setEnvVars({ ANTHROPIC_API_KEY });

        // Build Claude command with proper escaping
        const escapedTask = task.replace(/"/g, '\\"').replace(/\$/g, '\\$');
        const cmd = `cd ${name} && claude --append-system-prompt "${EXTRA_SYSTEM}" -p "${escapedTask}" --permission-mode acceptEdits`;

        const result = await sandbox.exec(cmd);
        const logs = getOutput(result);
        const diffResult = await sandbox.exec(`cd ${name} && git diff`);
        const diff = getOutput(diffResult);

        return Response.json({
          success: result.success,
          logs,
          diff,
          repo,
          task,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return Response.json(
          { error: 'Execution failed', message },
          { status: 500 }
        );
      }
    }

    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  },
};

export { Sandbox } from '@cloudflare/sandbox';
