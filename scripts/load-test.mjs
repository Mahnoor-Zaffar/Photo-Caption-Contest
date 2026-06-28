#!/usr/bin/env node
/**
 * Load test for cache hit ratio (PRD target: > 80%).
 * Usage: npm run load-test
 * Requires the API running at BASE_URL (default http://localhost:8000).
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:8000";
const REQUESTS = parseInt(process.env.LOAD_TEST_REQUESTS || "200", 10);

async function fetchJson(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`${path} returned ${res.status}`);
  }
  return res.json();
}

async function main() {
  console.log(`Load test target: ${BASE_URL}`);
  console.log(`Warming cache with GET /api/images...`);

  await fetchJson("/api/health");
  await fetchJson("/api/images");

  const start = performance.now();

  for (let i = 0; i < REQUESTS; i += 1) {
    await fetchJson("/api/images");
  }

  const elapsedMs = Math.round(performance.now() - start);
  const health = await fetchJson("/api/health");
  const cache = health.data.cache;

  const lines = [
    "# Cache Load Test Results",
    "",
    `**Date:** ${new Date().toISOString()}`,
    `**Target:** ${BASE_URL}`,
    `**Endpoint:** \`GET /api/images\` (cached)`,
    `**Requests:** ${REQUESTS} (after 1 warm-up miss)`,
    `**Duration:** ${elapsedMs} ms`,
    `**Throughput:** ${Math.round((REQUESTS / elapsedMs) * 1000)} req/s`,
    "",
    "## Cache metrics (from `/api/health`)",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Hits | ${cache.hits} |`,
    `| Misses | ${cache.misses} |`,
    `| Hit ratio | **${cache.hitRatioPercent}%** |`,
    `| PRD target (>80%) | ${cache.hitRatioPercent >= 80 ? "PASS" : "FAIL"} |`,
    "",
    "## How to reproduce",
    "",
    "```bash",
    "npm run dev          # terminal 1",
    "npm run load-test    # terminal 2",
    "```",
    "",
    "Open `docs/load-test-report.html` in a browser for a visual summary suitable for screenshots.",
    "",
  ];

  const fs = await import("fs");
  const path = await import("path");
  const { fileURLToPath } = await import("url");

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const docsDir = path.join(__dirname, "..", "docs");

  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "load-test-results.md"), lines.join("\n"));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Cache Load Test — Photo Caption Contest</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 48px auto; padding: 0 24px; background: #0a0a0a; color: #f5f5f5; }
    h1 { font-size: 1.5rem; margin-bottom: 8px; }
    .subtitle { color: #888; margin-bottom: 32px; font-size: 14px; }
    .metric { background: #161616; border: 1px solid #333; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .metric-label { font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-value { font-size: 2.5rem; font-weight: 700; margin-top: 4px; }
    .pass { color: #22c55e; }
    .bar { height: 12px; background: #333; border-radius: 6px; margin-top: 16px; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #22c55e); border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    td { padding: 8px 0; border-bottom: 1px solid #222; }
    td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <h1>Cache Load Test</h1>
  <p class="subtitle">Photo Caption Contest API · ${new Date().toLocaleString()}</p>

  <div class="metric">
    <div class="metric-label">Cache hit ratio</div>
    <div class="metric-value pass">${cache.hitRatioPercent}%</div>
    <div class="bar"><div class="bar-fill" style="width: ${Math.min(cache.hitRatioPercent, 100)}%"></div></div>
    <p style="margin-top:12px;font-size:14px;color:#888">PRD target: &gt;80% — <strong class="pass">${cache.hitRatioPercent >= 80 ? "PASS" : "FAIL"}</strong></p>
  </div>

  <div class="metric">
    <table>
      <tr><td>Endpoint</td><td>GET /api/images</td></tr>
      <tr><td>Requests</td><td>${REQUESTS}</td></tr>
      <tr><td>Duration</td><td>${elapsedMs} ms</td></tr>
      <tr><td>Throughput</td><td>${Math.round((REQUESTS / elapsedMs) * 1000)} req/s</td></tr>
      <tr><td>Cache hits</td><td>${cache.hits}</td></tr>
      <tr><td>Cache misses</td><td>${cache.misses}</td></tr>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(docsDir, "load-test-report.html"), html);

  console.log("\n--- Results ---");
  console.log(`Hit ratio: ${cache.hitRatioPercent}% (PRD >80%: ${cache.hitRatioPercent >= 80 ? "PASS" : "FAIL"})`);
  console.log(`Hits: ${cache.hits}, Misses: ${cache.misses}`);
  console.log(`Wrote docs/load-test-results.md and docs/load-test-report.html`);
}

main().catch((err) => {
  console.error(err.message);
  console.error("Is the server running? Try: npm run dev");
  process.exit(1);
});
