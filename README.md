# Photo Caption Contest API

[![CI](https://github.com/Mahnoor-Zaffar/Photo-Caption-Contest/actions/workflows/ci.yml/badge.svg)](https://github.com/Mahnoor-Zaffar/Photo-Caption-Contest/actions/workflows/ci.yml)

REST API backend for a photo caption contest platform built with **Node.js**, **Express**, **PostgreSQL**, and **Sequelize ORM**. Includes a Framer-inspired frontend, JWT auth with refresh tokens, voting, caching, and Swagger docs.

> **Resume line:** Built a full-stack photo caption contest API with JWT auth, PostgreSQL transactions, vote leaderboards, node-cache, Docker, CI, and Render deployment.

## Live Demo

- **App:** [https://photo-caption-api.onrender.com](https://photo-caption-api.onrender.com)
- **Swagger:** [https://photo-caption-api.onrender.com/api-docs](https://photo-caption-api.onrender.com/api-docs)
- **Health:** [https://photo-caption-api.onrender.com/api/health](https://photo-caption-api.onrender.com/api/health)

> First request after idle on Render free tier may take ~50 seconds (cold start).

## Features

- User registration, login, logout, and **refresh tokens** (httpOnly cookies + Bearer header)
- Protected caption submission and voting via JWT middleware
- PostgreSQL schema: Users, Images, Captions, and Votes
- **Sequelize transactions** on caption submit and voting (atomic vote counts)
- Paginated captions on `GET /api/images/:id` with `?sort=recent|votes` leaderboard
- In-memory response caching with **node-cache**
- Rate limiting on auth and vote routes, **helmet** security headers
- Structured logging with **pino**
- Interactive **Swagger** docs at `/api-docs`
- **Postman collection + environments** in `postman/`
- **GitHub Actions CI** with PostgreSQL service
- **Docker** support via `Dockerfile` and `docker-compose.yml`
- Framer-inspired **frontend** at `/` with token refresh, toasts, and sort tabs

## Tech Stack

- Node.js + Express 5
- PostgreSQL + Sequelize ORM
- bcrypt, jsonwebtoken, express-validator
- node-cache, helmet, express-rate-limit, pino
- Jest + Supertest

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Local Setup

```bash
npm install
cp .env.example .env
createdb photo_caption_contest
npm run db:migrate
npm run db:seed
npm run dev
```

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/api-docs`
- Frontend: `http://localhost:8000/`

### Contest images (seed data)

On first startup (or after `npm run db:seed`), five demo contest images are inserted from `src/seeders/20250628000001-demo-images.js`. Images use stable Picsum URLs — no admin upload endpoint is required for the demo.

To reset everything locally:

```bash
npm run db:reset
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive tokens |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | No | Logout and clear cookies |
| GET | `/api/auth/me` | JWT | Get current user profile |
| GET | `/api/images` | No | List all contest images (cached) |
| GET | `/api/images/:id` | No | Get image with paginated captions (`?sort=votes`) |
| POST | `/api/images/:id/captions` | JWT | Submit a caption for an image |
| POST | `/api/captions/:id/votes` | JWT | Vote for a caption |
| DELETE | `/api/captions/:id/votes` | JWT | Remove your vote |

## Postman Demo

1. Import `postman/Photo-Caption-Contest.postman_collection.json`
2. Import an environment:
   - **Local:** `postman/Photo-Caption-Contest.postman_environment.json`
   - **Production:** `postman/Photo-Caption-Contest-Production.postman_environment.json`
3. Run **Auth → Register** or **Login** — the collection saves `token` automatically
4. Run **Images → List Images** — copy an `id` into the `imageId` variable
5. Run **Captions → Submit Caption**, then **Votes → Vote for Caption**

## Testing

```bash
npm test
```

Unit tests run without a database. Integration tests in `tests/integration.test.js` exercise the full auth → caption → vote flow when PostgreSQL is available (CI runs migrate + seed automatically).

## Docker

```bash
docker compose up --build
```

Runs PostgreSQL + API on port 8000 with migrations and seeds applied automatically. Requires Docker Desktop with network access to pull images.

## Caching

- `GET /api/images` and `GET /api/images/:id` use read-through cache
- Cache keys include pagination and `sort` query param
- Default TTL: 60 seconds (`CACHE_TTL_SECONDS`)
- Cache invalidates when captions or votes change

## Deploy to Render

1. Push to GitHub
2. **New → Blueprint** → connect repo (uses `render.yaml`)
3. Set production secrets in the Render dashboard:
   - `JWT_SECRET` — strong random string (not a placeholder)
   - `JWT_REFRESH_SECRET` — different from `JWT_SECRET`
   - `DATABASE_URL` — provided by Render PostgreSQL
   - `NODE_ENV=production`

Build command: `npm install && npm run db:migrate`  
Start command: `npm start`  
Health check path: `/api/health`

## What I Learned

- Designing REST APIs with validation, caching, and consistent error responses
- Sequelize transactions for race-safe voting and caption submission
- JWT access/refresh token rotation with httpOnly cookies
- Deploying Node.js + PostgreSQL on Render with migration-on-build
- Portfolio-grade DX: Swagger, Postman, CI, Docker, and a polished demo UI

## Project Structure

```
src/
├── config/          # Database, cache, logger, env, Swagger
├── controllers/     # Route handlers
├── middlewares/     # Auth, cache, rate limit, UUID validation
├── migrations/      # Sequelize migrations
├── models/          # Sequelize models and associations
├── routes/          # Express routes + Swagger annotations
├── seeders/         # Demo contest images
└── utils/           # ApiError, ApiResponse, asyncHandler
public/              # Frontend UI
postman/             # Postman collection + environments
tests/               # Jest + Supertest tests
.github/workflows/   # CI pipeline
```

## License

ISC
