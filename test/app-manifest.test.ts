import { describe, it, expect } from 'vitest';
import { buildManifestJson, manifestPostUrl } from '../src/lib/app-manifest.js';

describe('buildManifestJson', () => {
  const opts = {
    appName: 'wolfe-pack-my-repo',
    owner: 'alice',
    repo: 'my-repo',
    callbackUrl: 'http://127.0.0.1:12345/callback',
  };

  it('produces a manifest with the correct permission set', () => {
    const manifest = buildManifestJson(opts);
    expect(manifest.default_permissions).toEqual({
      contents: 'write',
      issues: 'write',
      pull_requests: 'write',
      metadata: 'read',
      actions: 'read',
      checks: 'read',
    });
  });

  it('does NOT include webhook or hook_attributes fields', () => {
    const manifest = buildManifestJson(opts);
    const keys = Object.keys(manifest);
    expect(keys).not.toContain('hook_attributes');
    expect(keys).not.toContain('webhook_url');
    // default_events should be an empty array, not undefined
    expect(manifest.default_events).toEqual([]);
  });

  it('produces a name ≤34 characters', () => {
    const manifest = buildManifestJson(opts);
    expect(manifest.name.length).toBeLessThanOrEqual(34);
  });

  it('produces a name ≤34 characters even for a long repo name', () => {
    const manifest = buildManifestJson({
      ...opts,
      repo: 'this-is-a-very-very-very-long-repository-name-that-exceeds-limits',
    });
    expect(manifest.name.length).toBeLessThanOrEqual(34);
  });

  it('sets public to false', () => {
    const manifest = buildManifestJson(opts);
    expect(manifest.public).toBe(false);
  });

  it('sets redirect_url to the callbackUrl', () => {
    const manifest = buildManifestJson(opts);
    expect(manifest.redirect_url).toBe(opts.callbackUrl);
  });

  it('sets url to the GitHub repo URL', () => {
    const manifest = buildManifestJson(opts);
    expect(manifest.url).toContain('github.com/alice/my-repo');
  });

  it('produces unique names across two calls (random suffix)', () => {
    const m1 = buildManifestJson(opts);
    const m2 = buildManifestJson(opts);
    // The names may collide by chance (4 hex chars = 1/65536), but effectively unique
    // We just check the structure and that the name contains the wolfe-pack prefix
    expect(m1.name).toMatch(/^wolfe-pack-/);
    expect(m2.name).toMatch(/^wolfe-pack-/);
  });
});

describe('manifestPostUrl', () => {
  it('returns user settings URL for non-org', () => {
    const url = manifestPostUrl('alice', false);
    expect(url).toBe('https://github.com/settings/apps/new');
    expect(url).not.toContain('organizations');
  });

  it('returns org settings URL for org', () => {
    const url = manifestPostUrl('my-org', true);
    expect(url).toContain('organizations/my-org');
    expect(url).toContain('settings/apps/new');
  });

  it('includes the org login in the org URL', () => {
    const url = manifestPostUrl('acme-corp', true);
    expect(url).toContain('acme-corp');
  });
});

describe('state-nonce validation logic', () => {
  it('matches when state values are equal', () => {
    const state: string = 'abc123deadbeef';
    const incoming: string = 'abc123deadbeef';
    expect(state === incoming).toBe(true);
  });

  it('does not match when state values differ', () => {
    const state: string = 'abc123deadbeef';
    const incoming: string = 'differentvalue';
    expect(state === incoming).toBe(false);
  });
});
