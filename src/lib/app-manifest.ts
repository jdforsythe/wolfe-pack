import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

export interface ManifestOpts {
  appName: string;
  owner: string;
  repo: string;
  callbackUrl: string;
}

export interface AppManifest {
  name: string;
  url: string;
  public: boolean;
  redirect_url: string;
  default_permissions: {
    contents: string;
    issues: string;
    pull_requests: string;
    metadata: string;
    actions: string;
    checks: string;
  };
  default_events: string[];
}

/** Build the GitHub App manifest JSON object. */
export function buildManifestJson(opts: ManifestOpts): AppManifest {
  const rand4 = randomBytes(2).toString('hex'); // 4 hex chars
  // Max 34 chars for GitHub App name
  const repoShort = opts.repo.slice(0, 20);
  const rawName = `wolfe-pack-${repoShort}-${rand4}`;
  const name = rawName.slice(0, 34);

  return {
    name,
    url: `https://github.com/${opts.owner}/${opts.repo}`,
    public: false,
    redirect_url: opts.callbackUrl,
    default_permissions: {
      contents: 'write',
      issues: 'write',
      pull_requests: 'write',
      metadata: 'read',
      actions: 'read',
      checks: 'read',
    },
    default_events: [],
  };
}

/** Build the URL to create a GitHub App via manifest (user or org). */
export function manifestPostUrl(ownerLogin: string, isOrg: boolean): string {
  if (isOrg) {
    return `https://github.com/organizations/${ownerLogin}/settings/apps/new`;
  }
  return `https://github.com/settings/apps/new`;
}

export interface CallbackResult {
  code: string;
  state: string;
}

/**
 * Start a one-shot HTTP server on an ephemeral port.
 * Returns the port and a promise that resolves with the callback query params.
 */
export async function startCallbackServer(): Promise<{
  port: number;
  result: Promise<CallbackResult>;
}> {
  return new Promise((resolveServer, rejectServer) => {
    const server = createServer();

    let resolveResult: (r: CallbackResult) => void;
    let rejectResult: (e: Error) => void;
    const resultPromise = new Promise<CallbackResult>((res, rej) => {
      resolveResult = res;
      rejectResult = rej;
    });

    server.on('request', (req, res) => {
      const url = new URL(req.url ?? '/', `http://127.0.0.1`);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        `<!DOCTYPE html><html><head><title>wolfe-pack</title></head><body>` +
        `<h2>wolfe-pack App created!</h2>` +
        `<p>You can close this window and return to your terminal.</p>` +
        `</body></html>`,
      );

      server.close();

      if (code && state) {
        resolveResult({ code, state });
      } else {
        rejectResult(new Error('GitHub callback missing code or state parameter.'));
      }
    });

    server.on('error', (err) => {
      rejectServer(err);
      rejectResult(err);
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        rejectServer(new Error('Could not bind ephemeral port.'));
        return;
      }
      resolveServer({ port: addr.port, result: resultPromise });
    });
  });
}

/** Build the HTML page with a form that auto-submits the manifest POST to GitHub. */
export function buildManifestPage(opts: {
  manifest: AppManifest;
  targetUrl: string;
  state: string;
}): string {
  const manifestJson = JSON.stringify(opts.manifest);
  return `<!DOCTYPE html>
<html>
<head>
  <title>wolfe-pack — Create GitHub App</title>
  <meta charset="utf-8">
</head>
<body>
  <h2>Creating your wolfe-pack GitHub App…</h2>
  <p>A form is being submitted to GitHub. If nothing happens, click the button below.</p>
  <form id="f" action="${opts.targetUrl}" method="post">
    <input type="hidden" name="manifest" value="${manifestJson.replace(/"/g, '&quot;')}">
    <input type="hidden" name="state" value="${opts.state}">
    <button type="submit">Create App on GitHub</button>
  </form>
  <script>document.getElementById('f').submit();</script>
</body>
</html>`;
}

export interface AppConversion {
  id: number;
  slug: string;
  pem: string;
}

/** Exchange a manifest callback code for App credentials. */
export async function exchangeManifestCode(code: string): Promise<AppConversion> {
  const response = await fetch(`https://api.github.com/app-manifests/${code}/conversions`, {
    method: 'POST',
    headers: { Accept: 'application/vnd.github+json' },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)');
    throw new Error(`GitHub manifest exchange failed (${response.status}): ${body}`);
  }

  const data = await response.json() as { id: number; slug: string; pem: string };
  return { id: data.id, slug: data.slug, pem: data.pem };
}

/**
 * Plant a secret via `gh secret set` using stdin.
 * The value is never passed as argv and never written to disk.
 */
export function plantSecret(name: string, value: string, slug: string): void {
  const result = spawnSync('gh', ['secret', 'set', name, '--repo', slug], {
    input: value,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    const errMsg = (result.stderr ?? '').toString().trim();
    throw new Error(`Failed to set secret ${name}: ${errMsg}`);
  }
}
