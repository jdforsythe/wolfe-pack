import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import { randomBytes } from 'node:crypto';
import { hasGh, ghAuthOk, repoSlug } from '../lib/gh.js';
import {
  buildManifestJson,
  buildManifestPage,
  manifestPostUrl,
  startCallbackServer,
  exchangeManifestCode,
  plantSecret,
} from '../lib/app-manifest.js';
import { intro, outro, outroNeutral, error, warn, note, log, confirm, text, password, pc } from '../lib/ui.js';

export interface AppSetupOpts {
  noBrowser: boolean;
  cwd: string;
}

function openBrowser(url: string): void {
  const cmd = platform() === 'darwin' ? 'open' : 'xdg-open';
  spawnSync(cmd, [url], { stdio: 'ignore' });
}

export async function runAppSetup(opts: AppSetupOpts): Promise<void> {
  const { noBrowser, cwd } = opts;

  intro('app setup');

  // 1. Require gh + auth
  if (!hasGh()) {
    error(
      'The gh CLI is required for app setup.\n' +
      'Install: https://cli.github.com/',
    );
    process.exitCode = 1;
    return;
  }

  if (!ghAuthOk()) {
    error('gh is not authenticated. Run: gh auth login');
    process.exitCode = 1;
    return;
  }

  // 2. Get repo slug
  const slug = repoSlug(cwd);
  if (!slug) {
    error('Could not determine repo slug. Make sure you are inside a GitHub-backed git repo.');
    process.exitCode = 1;
    return;
  }

  const [owner, repo] = slug.split('/') as [string, string];

  // 3. Determine if org
  let isOrg = false;
  const ownerInfoResult = spawnSync('gh', ['repo', 'view', '--json', 'owner,isInOrganization', '--jq', '[.owner.login, .isInOrganization]'], {
    cwd, encoding: 'utf8', stdio: 'pipe',
  });

  if (ownerInfoResult.status === 0) {
    try {
      const parsed = JSON.parse(ownerInfoResult.stdout.trim()) as [string, boolean];
      isOrg = parsed[1] ?? false;
    } catch { /* fallback */ }
  }

  if (noBrowser) {
    await runNoBrowserFlow({ owner, repo, slug, isOrg });
    return;
  }

  // 4. Start callback server
  let port: number;
  let resultPromise: Promise<{ code: string; state: string }>;
  try {
    const server = await startCallbackServer();
    port = server.port;
    resultPromise = server.result;
  } catch (e) {
    error(`Could not start callback server: ${String(e instanceof Error ? e.message : e)}`);
    process.exitCode = 1;
    return;
  }

  const callbackUrl = `http://127.0.0.1:${port}/callback`;
  const state = randomBytes(16).toString('hex');
  const manifest = buildManifestJson({ appName: `wolfe-pack-${repo}`, owner, repo, callbackUrl });
  const targetUrl = manifestPostUrl(owner, isOrg);
  const page = buildManifestPage({ manifest, targetUrl, state });

  // 5. Serve the manifest page on the callback server's port (reuse port)
  const http = await import('node:http');
  const pageServer = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page);
  });

  await new Promise<void>(res => pageServer.listen(port + 1, '127.0.0.1', res));
  const pageUrl = `http://127.0.0.1:${port + 1}/`;

  log(`Opening browser to create your GitHub App…`);
  log(`URL: ${pc.cyan(pageUrl)}`);

  openBrowser(pageUrl);

  // 6. Wait for callback (10 min timeout)
  let callbackResult: { code: string; state: string };
  try {
    const timeout = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('Timed out waiting for GitHub callback (10 minutes).')), 10 * 60 * 1000),
    );
    callbackResult = await Promise.race([resultPromise, timeout]);
  } catch (e) {
    pageServer.close();
    error(String(e instanceof Error ? e.message : e));
    process.exitCode = 1;
    return;
  }

  pageServer.close();

  // 7. Validate state nonce
  if (callbackResult.state !== state) {
    error('State mismatch in GitHub callback — possible CSRF. Aborting.');
    process.exitCode = 1;
    return;
  }

  // 8. Exchange code for App credentials
  let appCredentials: { id: number; slug: string; pem: string };
  try {
    appCredentials = await exchangeManifestCode(callbackResult.code);
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    if (msg.includes('403')) {
      error(
        'GitHub returned 403 — you may not have permission to create Apps in this organization.\n\n' +
        'Ask an org owner to create the App, or use a personal repo for testing.',
      );
    } else {
      error(`Failed to exchange manifest code: ${msg}`);
    }
    process.exitCode = 1;
    return;
  }

  // 9. Print App info (NEVER the pem)
  log(pc.green(`App created: ${appCredentials.slug} (id: ${appCredentials.id})`));

  // 10. Plant secrets
  try {
    plantSecret('WOLFE_APP_ID', String(appCredentials.id), slug);
    log(pc.green('Secret WOLFE_APP_ID planted.'));

    plantSecret('WOLFE_APP_PRIVATE_KEY', appCredentials.pem, slug);
    log(pc.green('Secret WOLFE_APP_PRIVATE_KEY planted.'));
  } catch (e) {
    error(`Failed to plant secret: ${String(e instanceof Error ? e.message : e)}`);
    process.exitCode = 1;
    return;
  }

  // 11. Open install URL
  const installUrl = `https://github.com/apps/${appCredentials.slug}/installations/new`;
  note(
    `Install the App on ONLY this repo:\n  ${pc.cyan(installUrl)}\n\n` +
    'When prompted, select "Only select repositories" and choose ' + pc.bold(slug) + '.',
    'Install your App',
  );
  openBrowser(installUrl);

  // 12. Offer CLAUDE_CODE_OAUTH_TOKEN
  const wantToken = await confirm({
    message: 'Do you want to add your Claude authentication token as a repo secret now?',
    initialValue: true,
  });

  if (wantToken) {
    note(
      'Run `claude setup-token` in another terminal and paste the token below.\n' +
      'The token will be sent directly to gh — it will not be echoed or stored.',
      'Claude token setup',
    );
    const token = await password({ message: 'Paste your CLAUDE_CODE_OAUTH_TOKEN:' });
    if (token.trim()) {
      try {
        plantSecret('CLAUDE_CODE_OAUTH_TOKEN', token.trim(), slug);
        log(pc.green('Secret CLAUDE_CODE_OAUTH_TOKEN planted.'));
      } catch (e) {
        error(`Failed to plant token: ${String(e instanceof Error ? e.message : e)}`);
      }
    }
  }

  outro('GitHub App setup complete. Your Actions workflows can now open signed PRs.');
}

async function runNoBrowserFlow(opts: {
  owner: string;
  repo: string;
  slug: string;
  isOrg: boolean;
}): Promise<void> {
  const { owner, repo, slug, isOrg } = opts;

  const manifest = buildManifestJson({ appName: `wolfe-pack-${repo}`, owner, repo, callbackUrl: 'http://localhost/' });
  const targetUrl = manifestPostUrl(owner, isOrg);

  note(
    `Manifest JSON (copy this):\n${JSON.stringify(manifest, null, 2)}\n\n` +
    `Target URL: ${pc.cyan(targetUrl)}\n\n` +
    'Steps:\n' +
    '  1. Open the target URL in your browser.\n' +
    '  2. Paste the manifest JSON into the form and submit.\n' +
    '  3. Note the App ID and download the private key PEM file.',
    'Manual GitHub App creation',
  );

  const appIdStr = await text({ message: 'Enter the App ID from GitHub:' });
  const pemPath = await text({ message: 'Enter the path to the downloaded .pem file:' });

  if (!existsSync(pemPath)) {
    error(`PEM file not found: ${pemPath}`);
    process.exitCode = 1;
    return;
  }

  const pem = readFileSync(pemPath, 'utf8');

  try {
    plantSecret('WOLFE_APP_ID', appIdStr.trim(), slug);
    log(pc.green('Secret WOLFE_APP_ID planted.'));

    plantSecret('WOLFE_APP_PRIVATE_KEY', pem, slug);
    log(pc.green('Secret WOLFE_APP_PRIVATE_KEY planted.'));
  } catch (e) {
    error(`Failed to plant secret: ${String(e instanceof Error ? e.message : e)}`);
    process.exitCode = 1;
    return;
  }

  warn(
    `Remember to securely delete the PEM file:\n  rm ${pemPath}`,
  );

  const wantToken = await confirm({
    message: 'Add CLAUDE_CODE_OAUTH_TOKEN secret now?',
    initialValue: true,
  });

  if (wantToken) {
    const token = await password({ message: 'Paste your CLAUDE_CODE_OAUTH_TOKEN:' });
    if (token.trim()) {
      try {
        plantSecret('CLAUDE_CODE_OAUTH_TOKEN', token.trim(), slug);
        log(pc.green('Secret CLAUDE_CODE_OAUTH_TOKEN planted.'));
      } catch (e) {
        error(`Failed to plant token: ${String(e instanceof Error ? e.message : e)}`);
      }
    }
  }

  outro('GitHub App setup complete.');
}
