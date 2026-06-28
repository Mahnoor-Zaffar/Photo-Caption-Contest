# Demo Video Script (~60 seconds)

Use this script to record a Loom, QuickTime, or OBS walkthrough. Upload to YouTube/Loom and link it in the README.

## Setup before recording

1. Run locally: `npm run dev`
2. Reset demo data (optional): `npm run db:reset`
3. Use two browser profiles or incognito + normal window for two users

## Scene 1 — Browse (10s)

- Open `http://localhost:8000/`
- Scroll the contest gallery
- Click **City Skyline** (or any image)

## Scene 2 — Submit a caption (15s)

- Click **Create one** → register as `alice` / `alice@demo.com`
- Submit a caption: *"When the city looks better than my sleep schedule"*
- Point out the caption appears in the list

## Scene 3 — Vote & leaderboard (20s)

- Open incognito → register as `bob` / `bob@demo.com`
- Vote on Alice's caption → **Your vote** badge appears
- Submit Bob's own caption on the same image
- Vote on Bob's caption → toast says **Vote moved!**
- Switch sort to **Top voted** → show leaderboard reorder

## Scene 4 — API & metrics (15s)

- Open `/api-docs` → show Swagger
- Open `/api/health` → highlight `cache.hitRatioPercent`
- Mention: one vote per image, transactions, cache invalidation on write

## Talking points (voiceover)

> "This is a full-stack caption contest API. Users get one caption per photo and one vote per photo — changing your vote moves it atomically in PostgreSQL. Image reads are cached with node-cache; we hit over 80% cache hit ratio under load. Auth uses JWT with refresh tokens, and the whole thing deploys to Render with CI."

## After recording

Add your link to README under **Demo Video**:

```markdown
## Demo Video

[Watch 60s walkthrough](YOUR_LOOM_OR_YOUTUBE_URL)
```
