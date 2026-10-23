import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { readState, resetState } from '../../packages/forge-core/src/store.mjs';
import { createAiRequest, createIssue, createPullRequest, draftRelease, queueBuild, requestApproval } from '../../packages/forge-core/src/records.mjs';
import { createArtifact, createPackage, createReleaseManifest } from '../../packages/forge-core/src/package-records.mjs';
import { exportReleaseManifest, recordArtifactHash } from '../../packages/forge-core/src/artifact-hash.mjs';
import { composeBuildFlow } from '../../packages/forge-core/src/build-flow.mjs';
import { initBareRepo, inspectBareRepo } from '../../packages/forge-core/src/git-disk.mjs';
import { listGitBranches, listGitTags } from '../../packages/forge-core/src/git-refs.mjs';
import { listGitCommits, listGitTree, readGitBlob, readGitDiff } from '../../packages/forge-core/src/git-objects.mjs';
import { createGitRepoRecord, createGitSnapshot, importGitRepoRecord } from '../../packages/forge-core/src/git-store.mjs';
import { canAccessRepo, currentIdentity, grantRepoPermission } from '../../packages/forge-core/src/identity.mjs';
import { cloneInfo, fetchCapability, pushCapability } from '../../packages/forge-core/src/git-transport.mjs';
import { receivePackRequest, serviceDiscovery, uploadPackRequest } from '../../packages/forge-core/src/git-smart-http.mjs';
import { handleGitSmartHttp } from '../../packages/forge-core/src/git-rpc-http.mjs';
import { authenticateToken, createLocalToken, revokeToken, seedAutomationToken } from '../../packages/forge-core/src/token-auth.mjs';
import { localSetup } from '../../packages/forge-core/src/local-setup.mjs';
import { createAndroidBuildRequest } from '../../packages/forge-core/src/android-build.mjs';
import { readJson } from './request-json.mjs';

const host = process.env.AIFT_FORGE_API_HOST || '127.0.0.1';
const port = Number(process.env.AIFT_FORGE_API_PORT || 4177);
const repoRoot = process.cwd();
const androidDist = path.join(repoRoot, 'dist', 'android');

function send(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  res.end(body);
}

function sendFile(res, file, contentType) {
  if (!fs.existsSync(file)) return send(res, 404, { ok: false, error: 'artifact-not-found', file: path.relative(repoRoot, file) });
  const stat = fs.statSync(file);
  res.writeHead(200, {
    'content-type': contentType,
    'content-length': stat.size,
    'content-disposition': `attachment; filename="${path.basename(file)}"`,
    'access-control-allow-origin': '*'
  });
  fs.createReadStream(file).pipe(res);
}

function androidArtifacts() {
  const manifestPath = path.join(androidDist, 'aift-forge-android-artifacts.json');
  const debugPath = path.join(androidDist, 'aift-forge-debug.apk');
  const releasePath = path.join(androidDist, 'aift-forge-release.apk');
  return {
    ok: true,
    manifest_path: fs.existsSync(manifestPath) ? 'dist/android/aift-forge-android-artifacts.json' : null,
    debug_apk: fs.existsSync(debugPath) ? '/downloads/android/aift-forge-debug.apk' : null,
    release_apk: fs.existsSync(releasePath) ? '/downloads/android/aift-forge-release.apk' : null,
    repo_paths: {
      debug_apk: 'dist/android/aift-forge-debug.apk',
      release_apk: 'dist/android/aift-forge-release.apk',
      manifest: 'dist/android/aift-forge-android-artifacts.json'
    }
  };
}

const routes = {
  'POST /api/setup/local': async (req, res) => send(res, 201, localSetup(await readJson(req))),
  'POST /api/android/builds': async (req, res) => send(res, 201, createAndroidBuildRequest(await readJson(req))),
  'POST /api/issues': async (req, res) => send(res, 201, createIssue(await readJson(req))),
  'POST /api/pull-requests': async (req, res) => send(res, 201, createPullRequest(await readJson(req))),
  'POST /api/builds': async (req, res) => send(res, 201, queueBuild(await readJson(req))),
  'POST /api/build-flows': async (req, res) => send(res, 201, composeBuildFlow(await readJson(req))),
  'POST /api/git/repos': async (req, res) => send(res, 201, createGitRepoRecord(await readJson(req))),
  'POST /api/git/init': async (req, res) => send(res, 201, initBareRepo(await readJson(req))),
  'POST /api/git/inspect': async (req, res) => send(res, 201, inspectBareRepo(await readJson(req))),
  'POST /api/git/branches': async (req, res) => send(res, 200, listGitBranches(await readJson(req))),
  'POST /api/git/tags': async (req, res) => send(res, 200, listGitTags(await readJson(req))),
  'POST /api/git/commits': async (req, res) => send(res, 200, listGitCommits(await readJson(req))),
  'POST /api/git/tree': async (req, res) => send(res, 200, listGitTree(await readJson(req))),
  'POST /api/git/blob': async (req, res) => send(res, 200, readGitBlob(await readJson(req))),
  'POST /api/git/diff': async (req, res) => send(res, 200, readGitDiff(await readJson(req))),
  'POST /api/git/imports': async (req, res) => send(res, 201, importGitRepoRecord(await readJson(req))),
  'POST /api/git/snapshots': async (req, res) => send(res, 201, createGitSnapshot(await readJson(req))),
  'POST /api/git/clone-info': async (req, res) => send(res, 201, cloneInfo(await readJson(req))),
  'POST /api/git/fetch-capability': async (req, res) => send(res, 201, fetchCapability(await readJson(req))),
  'POST /api/git/push-capability': async (req, res) => send(res, 201, pushCapability(await readJson(req))),
  'POST /api/git/service-discovery': async (req, res) => send(res, 200, serviceDiscovery(await readJson(req))),
  'POST /api/git/upload-pack': async (req, res) => send(res, 202, uploadPackRequest(await readJson(req))),
  'POST /api/git/receive-pack': async (req, res) => send(res, 202, receivePackRequest(await readJson(req))),
  'POST /api/identity/current': async (req, res) => send(res, 200, currentIdentity(await readJson(req))),
  'POST /api/permissions/grant': async (req, res) => send(res, 201, grantRepoPermission(await readJson(req))),
  'POST /api/permissions/check': async (req, res) => send(res, 200, canAccessRepo(await readJson(req))),
  'POST /api/tokens/create': async (req, res) => send(res, 201, createLocalToken(await readJson(req))),
  'POST /api/tokens/authenticate': async (req, res) => send(res, 200, authenticateToken(await readJson(req))),
  'POST /api/tokens/revoke': async (req, res) => send(res, 200, revokeToken(await readJson(req))),
  'POST /api/tokens/seed': async (_req, res) => send(res, 201, seedAutomationToken()),
  'POST /api/releases': async (req, res) => send(res, 201, draftRelease(await readJson(req))),
  'POST /api/packages': async (req, res) => send(res, 201, createPackage(await readJson(req))),
  'POST /api/artifacts': async (req, res) => send(res, 201, createArtifact(await readJson(req))),
  'POST /api/artifact-hashes': async (req, res) => send(res, 201, recordArtifactHash(await readJson(req))),
  'POST /api/release-manifests': async (req, res) => send(res, 201, createReleaseManifest(await readJson(req))),
  'POST /api/release-exports': async (req, res) => send(res, 201, exportReleaseManifest(await readJson(req))),
  'POST /api/approvals': async (req, res) => send(res, 201, requestApproval(await readJson(req))),
  'POST /api/ai/requests': async (req, res) => send(res, 201, createAiRequest(await readJson(req))),
  'POST /api/reset': async (_req, res) => send(res, 200, resetState())
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });
  const url = new URL(req.url || '/', `http://${host}:${port}`);
  if (await handleGitSmartHttp(req, res, url)) return;
  if (req.method === 'GET' && url.pathname === '/api/state') return send(res, 200, readState());
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true, service: 'aift-forge-api' });
  if (req.method === 'GET' && url.pathname === '/api/android/artifacts') return send(res, 200, androidArtifacts());
  if (req.method === 'GET' && url.pathname === '/downloads/android/aift-forge-debug.apk') return sendFile(res, path.join(androidDist, 'aift-forge-debug.apk'), 'application/vnd.android.package-archive');
  if (req.method === 'GET' && url.pathname === '/downloads/android/aift-forge-release.apk') return sendFile(res, path.join(androidDist, 'aift-forge-release.apk'), 'application/vnd.android.package-archive');
  const handler = routes[`${req.method} ${url.pathname}`];
  if (!handler) return send(res, 404, { ok: false, error: 'not-found' });
  try {
    await handler(req, res);
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`AIFT Forge API listening at http://${host}:${port}`);
});
