import { getSandbox } from '@cloudflare/sandbox';

interface CmdOutput {
  success: boolean;
  stdout: string;
  stderr: string;
}

const getOutput = (res: CmdOutput) => (res.success ? res.stdout : res.stderr);

const EXTRA_SYSTEM =
  'You are an automatic feature-implementer/bug-fixer.' +
  'You apply all necessary changes to achieve the user request. You must ensure you DO NOT commit the changes, ' +
  'so the pipeline can read the local `git diff` and apply the change upstream.';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'POST') {
      try {
        const { repo, task } = await request.json<{
          repo?: string;
          task?: string;
        }>();
        if (!repo || !task) {
          return json({ error: 'Missing repo or task' }, 400);
        }

        const name = repo.split('/').pop() ?? 'tmp';

        const sandbox = getSandbox(
          env.Sandbox,
          crypto.randomUUID().slice(0, 8)
        );

        await sandbox.gitCheckout(repo, { targetDir: name });

        const { ANTHROPIC_API_KEY } = env;
        await sandbox.setEnvVars({ ANTHROPIC_API_KEY });

        const cmd = `cd ${name} && claude --append-system-prompt "${EXTRA_SYSTEM}" -p "${task.replaceAll(
          '"',
          '\\"'
        )}" --permission-mode acceptEdits`;

        const logs = getOutput(await sandbox.exec(cmd));
        const diff = getOutput(await sandbox.exec('git diff'));

        return json({ logs, diff });
      } catch {
        return json({ error: 'Invalid request body' }, 400);
      }
    }

    return json({
      status: 'ok',
      message: 'Claude Code Sandbox API. POST with { repo, task } to execute.',
    });
  },
};

export { Sandbox } from '@cloudflare/sandbox';
