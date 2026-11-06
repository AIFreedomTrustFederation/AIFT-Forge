import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const workflow = JSON.parse(readFileSync(path.join(root, '.github/workflows/qa.yml'), 'utf8'));
const steps = workflow.jobs.qa.steps;
const gate = steps.find((step) => step.name === 'Verify checkout commit binding');

function run(command, args, cwd, env = process.env) {
  return spawnSync(command, args, { cwd, env, encoding: 'utf8' });
}

function git(cwd, ...args) {
  const result = run('git', args, cwd);
  assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout.trim();
}

function withRepo(check) {
  const cwd = mkdtempSync(path.join(os.tmpdir(), 'aift-forge-ci-binding-'));
  try {
    git(cwd, 'init', '-q', '-b', 'main');
    git(cwd, 'config', 'user.email', 'ci@example.invalid');
    git(cwd, 'config', 'user.name', 'CI Fixture');
    writeFileSync(path.join(cwd, 'fixture.txt'), 'baseline\n');
    git(cwd, 'add', 'fixture.txt');
    git(cwd, 'commit', '-qm', 'baseline');
    check(cwd, git(cwd, 'rev-parse', 'HEAD'));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

function checkGate(cwd, expectedSha) {
  return run('bash', ['-e', '-c', gate.run], cwd, { ...process.env, GITHUB_SHA: expectedSha });
}

test('commit gate follows local QA and checks both worktree and dispatched SHA', () => {
  assert.ok(gate, 'the workflow must contain a checkout commit binding gate');
  assert.ok(steps.findIndex((step) => step.name === 'Run local QA gate') < steps.indexOf(gate));
  assert.match(gate.run, /git status --porcelain/);
  assert.match(gate.run, /git rev-parse HEAD/);
  assert.match(gate.run, /GITHUB_SHA/);
});

test('clean checkout at dispatched SHA passes', () => {
  withRepo((cwd, sha) => assert.equal(checkGate(cwd, sha).status, 0));
});

test('uncommitted changes fail', () => {
  withRepo((cwd, sha) => {
    writeFileSync(path.join(cwd, 'fixture.txt'), 'modified\n');
    assert.notEqual(checkGate(cwd, sha).status, 0);
  });
});

test('clean worktree with advanced HEAD fails even though legacy clean-only gate passes', () => {
  withRepo((cwd, sha) => {
    git(cwd, 'commit', '--allow-empty', '-qm', 'advance HEAD');
    assert.equal(run('bash', ['-e', '-c', 'test -z "$(git status --porcelain)"'], cwd).status, 0);
    assert.notEqual(checkGate(cwd, sha).status, 0);
  });
});

test('missing or incorrect expected SHA fails closed', () => {
  withRepo((cwd) => {
    assert.notEqual(checkGate(cwd, '').status, 0);
    assert.notEqual(checkGate(cwd, '0'.repeat(40)).status, 0);
  });
});
