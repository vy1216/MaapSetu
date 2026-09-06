// api/index.js — Vercel Serverless Function entry point
//
// This file MUST exist in the Git repository BEFORE build (not generated at
// build-time), because Vercel scans the repo for api/ endpoints as the very
// first step, before running any build or install commands. If it's missing,
// the /api/* rewrites will 404 or Vercel treats them as static.
//
// Strategy:
//   - During build, we compile server.ts to dist-server/server.cjs.
//   - At runtime, this handler require()s that compiled bundle (which exports
//     the Express app, NOT a TCP listener thanks to the isMain guard
//     we added to server.ts), then forwards every (req, res) through it.
//   - If the bundle is missing (e.g. build script failed), the handler returns
//     a clear 500 error instead of crashing silently.

'use strict';

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

// Normalize cwd to project root so relative paths inside server.ts resolve.
try {
  if (process.cwd() !== ROOT && fs.existsSync(path.join(ROOT, 'package.json'))) {
    process.chdir(ROOT);
  }
} catch (_chdirErr) { /* noop */ }

// Ensure data directory (Vercel: /tmp; local: project-root/data).
const TMP = process.env.VERCEL ? '/tmp' : path.join(ROOT, 'data');
const DATA_DIR = process.env.DATA_DIR || TMP;
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
}
process.env.DATA_DIR = DATA_DIR;

// Resolve compiled server bundle from build:server step.
const BUNDLE_CANDIDATES = [
  path.join(ROOT, 'dist-server', 'server.cjs'),
  path.join(ROOT, 'dist', 'server.cjs'),
  path.join(ROOT, '..', 'dist-server', 'server.cjs'),
];
let BUNDLE_PATH = null;
for (const p of BUNDLE_CANDIDATES) {
  if (fs.existsSync(p)) { BUNDLE_PATH = p; break; }
}

let expressApp = null;
let bootError = null;

if (BUNDLE_PATH) {
  try {
    const loaded = require(BUNDLE_PATH);
    expressApp = (loaded && loaded.app) || (loaded && loaded.default) || loaded;
    if (typeof expressApp !== 'function') {
      expressApp = null;
      bootError = 'Bundle loaded but did not export an Express app function (got ' + typeof expressApp + ')';
    }
  } catch (e) {
    bootError = 'Failed to load bundled server: ' + (e && e.message ? e.message : String(e));
  }
} else {
  bootError = 'Server bundle not found. Expected dist-server/server.cjs (from npm run build:server) is missing.';
}

// Main Vercel (req, res) handler exported for @vercel/node default contract.
function handler(req, res) {
  if (!expressApp || bootError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({
      error: 'MaapSetu serverless: Server bundle did not boot',
      detail: bootError || 'Express app unavailable. Please redeploy the project.',
      bundle: BUNDLE_PATH,
      cwd: process.cwd(),
    }));
  }

  // Ensure req.url looks right to Express (Vercel rewrites provide path)
  if (!req.url) req.url = '/api';
  if (!req.method) req.method = 'GET';

  // Convenience: add res.status / res.set if missing (older @vercel/node)
  if (!res.status) {
    res.status = function (code) { this.statusCode = code; return this; };
  }
  if (!res.set) {
    res.set = function (k, v) { this.setHeader(k, v); return this; };
  }

  return expressApp(req, res);
}

module.exports = handler;
module.exports.default = handler;
