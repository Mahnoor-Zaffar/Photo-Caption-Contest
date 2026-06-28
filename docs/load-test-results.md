# Cache Load Test Results

**Date:** 2026-06-28T20:16:25.831Z
**Target:** http://localhost:8000
**Endpoint:** `GET /api/images` (cached)
**Requests:** 200 (after 1 warm-up miss)
**Duration:** 313 ms
**Throughput:** 639 req/s

## Cache metrics (from `/api/health`)

| Metric | Value |
|--------|-------|
| Hits | 200 |
| Misses | 1 |
| Hit ratio | **99.5%** |
| PRD target (>80%) | PASS |

## How to reproduce

```bash
npm run dev          # terminal 1
npm run load-test    # terminal 2
```

Open `docs/load-test-report.html` in a browser for a visual summary suitable for screenshots.
