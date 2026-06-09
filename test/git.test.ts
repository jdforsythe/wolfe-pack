import { describe, it, expect, vi, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';

// We mock spawnSync at the module level so git.ts uses our mock
vi.mock('node:child_process', () => {
  return {
    spawnSync: vi.fn(),
    execFileSync: vi.fn(),
    spawn: vi.fn(),
  };
});

const mockSpawnSync = vi.mocked(spawnSync);

// Import after mocking
import { isGitRepo, isDirty, currentBranch, defaultBranch, hasGithubRemote } from '../src/lib/git.js';

type MockReturn = { status: number; stdout: string; stderr: string };

function mockGit(out: string, status = 0): MockReturn {
  return { status, stdout: out, stderr: '' };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('isGitRepo', () => {
  it('returns true when git rev-parse succeeds', () => {
    mockSpawnSync.mockReturnValue(mockGit('.git') as ReturnType<typeof spawnSync>);
    expect(isGitRepo()).toBe(true);
  });

  it('returns false when git rev-parse fails', () => {
    mockSpawnSync.mockReturnValue(mockGit('', 128) as ReturnType<typeof spawnSync>);
    expect(isGitRepo()).toBe(false);
  });
});

describe('isDirty', () => {
  it('returns true when status output is non-empty', () => {
    mockSpawnSync.mockReturnValue(mockGit(' M src/index.ts\n') as ReturnType<typeof spawnSync>);
    expect(isDirty()).toBe(true);
  });

  it('returns false when status output is empty', () => {
    mockSpawnSync.mockReturnValue(mockGit('') as ReturnType<typeof spawnSync>);
    expect(isDirty()).toBe(false);
  });
});

describe('currentBranch', () => {
  it('returns branch name when git succeeds', () => {
    mockSpawnSync.mockReturnValue(mockGit('feature/my-branch') as ReturnType<typeof spawnSync>);
    expect(currentBranch()).toBe('feature/my-branch');
  });

  it('returns null when git fails', () => {
    mockSpawnSync.mockReturnValue(mockGit('', 128) as ReturnType<typeof spawnSync>);
    expect(currentBranch()).toBeNull();
  });
});

describe('defaultBranch', () => {
  it('strips "origin/" prefix from symbolic-ref output', () => {
    mockSpawnSync.mockReturnValue(mockGit('origin/main') as ReturnType<typeof spawnSync>);
    expect(defaultBranch()).toBe('main');
  });

  it('falls back to currentBranch when symbolic-ref fails', () => {
    mockSpawnSync
      .mockReturnValueOnce(mockGit('', 128) as ReturnType<typeof spawnSync>) // symbolic-ref fails
      .mockReturnValueOnce(mockGit('develop') as ReturnType<typeof spawnSync>); // currentBranch
    expect(defaultBranch()).toBe('develop');
  });
});

describe('hasGithubRemote', () => {
  it('returns true when a remote URL contains github.', () => {
    mockSpawnSync.mockReturnValue(
      mockGit('origin\thttps://github.com/user/repo.git (fetch)\n') as ReturnType<typeof spawnSync>,
    );
    expect(hasGithubRemote()).toBe(true);
  });

  it('returns false when no remote contains github.', () => {
    mockSpawnSync.mockReturnValue(
      mockGit('origin\thttps://gitlab.com/user/repo.git (fetch)\n') as ReturnType<typeof spawnSync>,
    );
    expect(hasGithubRemote()).toBe(false);
  });

  it('returns false when git remote -v fails', () => {
    mockSpawnSync.mockReturnValue(mockGit('', 128) as ReturnType<typeof spawnSync>);
    expect(hasGithubRemote()).toBe(false);
  });
});
